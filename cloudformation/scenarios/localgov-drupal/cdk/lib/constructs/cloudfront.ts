import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

/**
 * Properties for CloudFront construct
 */
export interface CloudFrontConstructProps {
  /**
   * The Application Load Balancer to use as origin
   */
  readonly loadBalancer: elbv2.IApplicationLoadBalancer;
}

/**
 * CloudFront distribution for HTTPS termination.
 *
 * Provides HTTPS access to LocalGov Drupal using CloudFront's default
 * domain certificate (*.cloudfront.net). This is the simplest way to
 * add HTTPS without requiring a custom domain or ACM certificate.
 *
 * Architecture:
 * Users -> CloudFront (HTTPS) -> ALB (HTTP) -> ECS Fargate
 *
 * Cost: CloudFront free tier includes 1TB/month and 10M requests/month.
 * Demo usage stays well within free tier.
 */
export class CloudFrontConstruct extends Construct {
  /**
   * The CloudFront distribution
   */
  public readonly distribution: cloudfront.Distribution;

  /**
   * The CloudFront domain name (e.g., d123abc.cloudfront.net)
   */
  public readonly domainName: string;

  constructor(scope: Construct, id: string, props: CloudFrontConstructProps) {
    super(scope, id);

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: 'LocalGov Drupal - HTTPS Termination',
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(props.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        // Disable caching - Drupal handles its own caching
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        // Forward all headers, cookies, and query strings to origin
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      },
    });

    this.domainName = this.distribution.distributionDomainName;
  }
}
