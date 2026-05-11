import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface CdnConstructProps {
  readonly loadBalancer: elbv2.IApplicationLoadBalancer;
}

export class CdnConstruct extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly domainName: string;
  public readonly authToken: string;

  constructor(scope: Construct, id: string, props: CdnConstructProps) {
    super(scope, id);

    // Custom resource that mints a single random token at deploy time. The token
    // is delivered to the user via the MinuteLoginUrl stack output and validated
    // by the CloudFront Function below; on first hit it becomes a HttpOnly cookie.
    const authTokenRole = new iam.Role(this, 'AuthTokenRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    const authTokenFn = new lambda.Function(this, 'AuthTokenFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: authTokenRole,
      timeout: cdk.Duration.seconds(30),
      code: lambda.Code.fromInline(`
const crypto = require('crypto');
const https = require('https');
exports.handler = async (e) => {
  const rp = { Status: 'SUCCESS', PhysicalResourceId: e.LogicalResourceId, StackId: e.StackId, RequestId: e.RequestId, LogicalResourceId: e.LogicalResourceId, Data: {} };
  if (e.RequestType === 'Delete') { await send(e.ResponseURL, rp); return; }
  try {
    const token = crypto.randomBytes(16).toString('hex');
    rp.Data = { Token: token };
    await send(e.ResponseURL, rp);
  } catch (err) { rp.Status = 'FAILED'; rp.Reason = err.message; await send(e.ResponseURL, rp); }
};
function send(u, d) { return new Promise((ok, fail) => { const b = JSON.stringify(d); const o = new URL(u); const opts = { hostname: o.hostname, port: 443, path: o.pathname + o.search, method: 'PUT', headers: { 'Content-Type': '', 'Content-Length': b.length } }; const req = https.request(opts, ok); req.on('error', fail); req.write(b); req.end(); }); }
      `),
    });

    const authTokenCR = new cdk.CustomResource(this, 'AuthTokenCR', {
      serviceToken: authTokenFn.functionArn,
    });
    authTokenCR.node.addDependency(authTokenRole);

    this.authToken = authTokenCR.getAttString('Token');

    // Deep-link to the stack's Outputs tab in the CloudFormation console.
    // Rendered into the 401 page so a user who lands at the bare domain has a
    // one-click path back to the MinuteLoginUrl value.
    const stackOutputsUrl =
      `https://${cdk.Aws.REGION}.console.aws.amazon.com/cloudformation/home` +
      `?region=${cdk.Aws.REGION}#/stacks/outputs` +
      `?filteringText=&filteringStatus=active&viewNested=true&stackId=${cdk.Aws.STACK_NAME}`;

    // CloudFront Function (viewer-request) implementing magic-link + cookie auth.
    // - First hit with ?key=<TOKEN>: 302 to clean URL with Set-Cookie.
    // - Subsequent requests: cookie validated, pass-through.
    // - Anything else: 401 with a helpful HTML page pointing at the Outputs tab.
    //
    // Note: if CloudFront access logging is enabled later, the ?key=<TOKEN>
    // value will be captured in logs. Redeploying rotates the token.
    const functionSrc = `function handler(event) {
  var request = event.request;
  var TOKEN = '\${Token}';
  var COOKIE_NAME = 'ndx-minute-auth';

  if (request.querystring.key && request.querystring.key.value === TOKEN) {
    var qs = '';
    for (var k in request.querystring) {
      if (k === 'key') continue;
      var v = request.querystring[k];
      qs += (qs ? '&' : '') + k + (v.value ? '=' + v.value : '');
    }
    var location = request.uri + (qs ? '?' + qs : '');
    return {
      statusCode: 302,
      statusDescription: 'Found',
      headers: { location: { value: location } },
      cookies: {
        'ndx-minute-auth': {
          value: TOKEN,
          attributes: 'Max-Age=604800; Secure; HttpOnly; SameSite=Lax; Path=/'
        }
      }
    };
  }

  if (request.cookies[COOKIE_NAME] && request.cookies[COOKIE_NAME].value === TOKEN) {
    return request;
  }

  return {
    statusCode: 401,
    statusDescription: 'Unauthorized',
    headers: { 'content-type': { value: 'text/html; charset=utf-8' } },
    body: '<!doctype html><meta charset=utf-8><title>Access required</title>'
        + '<style>body{font-family:system-ui,Arial,sans-serif;max-width:640px;margin:4rem auto;padding:0 1rem;color:#0b0c0c}h1{font-size:1.5rem}code{background:#f3f2f1;padding:2px 6px;border-radius:3px}a{color:#1d70b8}</style>'
        + '<h1>NDX:Try Minute &mdash; session link required</h1>'
        + '<p>To open this app, use the <code>MinuteLoginUrl</code> value from the <strong>Outputs</strong> tab of your CloudFormation stack.</p>'
        + '<p><a href="\${StackOutputsUrl}">Open the CloudFormation Outputs tab &rarr;</a></p>'
        + '<p>In the AWS Console: <em>CloudFormation &rsaquo; Stacks &rsaquo; <code>\${StackName}</code> &rsaquo; Outputs &rsaquo; <code>MinuteLoginUrl</code></em>. Open that URL in your browser to start a session.</p>'
  };
}`;

    const cfnFunction = new cloudfront.CfnFunction(this, 'AuthFunction', {
      name: `NdxMinute-Auth-${cdk.Aws.ACCOUNT_ID}`,
      autoPublish: true,
      functionConfig: {
        comment: 'Magic-link + cookie auth for Minute AI',
        runtime: 'cloudfront-js-2.0',
      },
      functionCode: cdk.Fn.sub(functionSrc, {
        Token: this.authToken,
        StackName: cdk.Aws.STACK_NAME,
        StackOutputsUrl: stackOutputsUrl,
      }),
    });

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: 'Minute AI - HTTPS Termination',
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(props.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      },
    });

    const cfnDistribution = this.distribution.node.defaultChild as cloudfront.CfnDistribution;
    cfnDistribution.addPropertyOverride(
      'DistributionConfig.DefaultCacheBehavior.FunctionAssociations',
      [{
        EventType: 'viewer-request',
        FunctionARN: cfnFunction.attrFunctionArn,
      }],
    );

    this.domainName = this.distribution.distributionDomainName;
  }
}
