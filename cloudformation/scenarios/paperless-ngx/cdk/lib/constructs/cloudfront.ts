import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface CloudFrontConstructProps {
  readonly loadBalancer: elbv2.IApplicationLoadBalancer;
  /** Lambda Function URL string to expose under /chat/* — added so the chat
   *  endpoint lives on the same cloudfront.net hostname as Paperless,
   *  bypassing corporate proxies (Zscaler etc.) that block lambda-url.on.aws */
  readonly chatLambdaUrl: string;
}

export class CloudFrontConstruct extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly domainName: string;
  public readonly distributionArn: string;

  constructor(scope: Construct, id: string, props: CloudFrontConstructProps) {
    super(scope, id);

    // Extract host from a Lambda Function URL string like
    //   https://abc123.lambda-url.us-east-1.on.aws/
    const chatHost = cdk.Fn.select(2, cdk.Fn.split('/', props.chatLambdaUrl));

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: 'Paperless-ngx - HTTPS via CloudFront',
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(props.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      },
      additionalBehaviors: {
        '/chat*': {
          origin: new origins.HttpOrigin(chatHost, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            originId: 'ChatLambdaUrl',
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          // No originRequestPolicy — with OAC the signature must match exactly the
          // request CloudFront sends to the origin, so we don't strip or add headers.
        },
      },
    });

    this.domainName = this.distribution.distributionDomainName;
    this.distributionArn = `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${this.distribution.distributionId}`;
  }
}
