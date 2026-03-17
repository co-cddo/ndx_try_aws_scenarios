import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface CloudFrontConstructProps {
  readonly loadBalancer: elbv2.IApplicationLoadBalancer;
}

export class CloudFrontConstruct extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly domainName: string;
  public readonly applicantsDistribution: cloudfront.Distribution;
  public readonly applicantsDomainName: string;

  constructor(scope: Construct, id: string, props: CloudFrontConstructProps) {
    super(scope, id);

    // BOPS back-office (ALB port 80)
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: 'BOPS Planning System - Back Office HTTPS',
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
    this.domainName = this.distribution.distributionDomainName;

    // BOPS Applicants portal (ALB port 8080)
    this.applicantsDistribution = new cloudfront.Distribution(this, 'ApplicantsDistribution', {
      comment: 'BOPS Applicants Portal - HTTPS',
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(props.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          httpPort: 8080,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      },
    });
    this.applicantsDomainName = this.applicantsDistribution.distributionDomainName;
  }
}
