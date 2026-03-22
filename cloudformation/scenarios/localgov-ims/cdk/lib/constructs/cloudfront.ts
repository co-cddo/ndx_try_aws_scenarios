import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface CloudFrontConstructProps {
  readonly loadBalancer: elbv2.IApplicationLoadBalancer;
}

export class CloudFrontConstruct extends Construct {
  public readonly portalDomainName: string;
  public readonly adminDomainName: string;
  public readonly govukpayDomainName: string;

  constructor(scope: Construct, id: string, props: CloudFrontConstructProps) {
    super(scope, id);

    // Portal Distribution (ALB port 80)
    const portalDistribution = new cloudfront.Distribution(this, 'PortalDistribution', {
      comment: 'LocalGov IMS Portal - HTTPS',
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
    this.portalDomainName = portalDistribution.distributionDomainName;

    // Admin Distribution (ALB port 81)
    const adminDistribution = new cloudfront.Distribution(this, 'AdminDistribution', {
      comment: 'LocalGov IMS Admin - HTTPS',
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(props.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          httpPort: 8081,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      },
    });
    this.adminDomainName = adminDistribution.distributionDomainName;

    // Api/GOV.UK Pay Distribution (ALB port 82)
    const govukpayDistribution = new cloudfront.Distribution(this, 'GovUkPayDistribution', {
      comment: 'LocalGov IMS Api/GOV.UK Pay - HTTPS',
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(props.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          httpPort: 8082,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      },
    });
    this.govukpayDomainName = govukpayDistribution.distributionDomainName;
  }
}
