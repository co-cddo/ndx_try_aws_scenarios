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
  public readonly basicAuthPassword: string;

  constructor(scope: Construct, id: string, props: CdnConstructProps) {
    super(scope, id);

    // Lambda custom resource to generate a random password and base64 credentials at deploy time
    const passwordGenRole = new iam.Role(this, 'PasswordGenRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    const passwordGenFn = new lambda.Function(this, 'PasswordGenFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: passwordGenRole,
      timeout: cdk.Duration.seconds(30),
      code: lambda.Code.fromInline(`
const crypto = require('crypto');
const https = require('https');
exports.handler = async (e) => {
  const rp = { Status: 'SUCCESS', PhysicalResourceId: e.LogicalResourceId, StackId: e.StackId, RequestId: e.RequestId, LogicalResourceId: e.LogicalResourceId, Data: {} };
  if (e.RequestType === 'Delete') { await send(e.ResponseURL, rp); return; }
  try {
    const password = crypto.randomBytes(16).toString('hex');
    const b64 = Buffer.from('admin:' + password).toString('base64');
    rp.Data = { Password: password, Base64Credentials: b64 };
    await send(e.ResponseURL, rp);
  } catch (err) { rp.Status = 'FAILED'; rp.Reason = err.message; await send(e.ResponseURL, rp); }
};
function send(u, d) { return new Promise((ok, fail) => { const b = JSON.stringify(d); const o = new URL(u); const opts = { hostname: o.hostname, port: 443, path: o.pathname + o.search, method: 'PUT', headers: { 'Content-Type': '', 'Content-Length': b.length } }; const req = https.request(opts, ok); req.on('error', fail); req.write(b); req.end(); }); }
      `),
    });

    const passwordCR = new cdk.CustomResource(this, 'PasswordCR', {
      serviceToken: passwordGenFn.functionArn,
    });
    passwordCR.node.addDependency(passwordGenRole);

    const base64Creds = passwordCR.getAttString('Base64Credentials');
    this.basicAuthPassword = passwordCR.getAttString('Password');

    // CloudFront Function for basic HTTP auth with deploy-time generated credentials.
    // Uses L1 CfnFunction to inject the base64 credentials via Fn::Sub.
    const cfnFunction = new cloudfront.CfnFunction(this, 'BasicAuthFunction', {
      name: `NdxMinute-BasicAuth-${cdk.Aws.ACCOUNT_ID}`,
      autoPublish: true,
      functionConfig: {
        comment: 'Basic HTTP auth for Minute AI',
        runtime: 'cloudfront-js-2.0',
      },
      functionCode: cdk.Fn.sub(`function handler(event) {
  var request = event.request;
  var headers = request.headers;
  var expected = 'Basic \${Creds}';
  if (!headers.authorization || headers.authorization.value !== expected) {
    return {
      statusCode: 401,
      statusDescription: 'Unauthorized',
      headers: { 'www-authenticate': { value: 'Basic realm="Minute AI"' } },
    };
  }
  return request;
}`, { Creds: base64Creds }),
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

    // Associate the function via L1 override (since we used CfnFunction, not the L2 construct)
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
