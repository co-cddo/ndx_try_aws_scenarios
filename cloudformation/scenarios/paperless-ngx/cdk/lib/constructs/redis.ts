import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';

export interface RedisConstructProps {
  readonly vpc: ec2.IVpc;
  readonly securityGroup: ec2.ISecurityGroup;
}

/**
 * ElastiCache Serverless for Valkey/Redis OSS — provisions in seconds, scales
 * automatically. Replaces the older cache.t3.micro single-node cluster which
 * took 5-7 minutes to come up on every deploy.
 *
 * Note: Serverless's wall-clock saving on stack creation is bounded by Aurora
 * (which runs in parallel and is comparable in time). The bigger reason to use
 * it is operational simplicity (no instance type to size, no parameter group)
 * and that the endpoint is reachable as soon as the resource reaches CREATE_COMPLETE.
 */
export class RedisConstruct extends Construct {
  public readonly endpointAddress: string;
  public readonly endpointPort: string;
  public readonly redisUrl: string;

  constructor(scope: Construct, id: string, props: RedisConstructProps) {
    super(scope, id);

    const cache = new elasticache.CfnServerlessCache(this, 'ServerlessCache', {
      engine: 'valkey',
      serverlessCacheName: cdk.Names.uniqueId(this).slice(-30).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      majorEngineVersion: '8',
      description: 'Paperless-ngx Celery broker (serverless Valkey)',
      subnetIds: props.vpc.publicSubnets.map(s => s.subnetId),
      securityGroupIds: [props.securityGroup.securityGroupId],
      // Cap usage to keep demo cost bounded — minimum tier is plenty for Celery on a tiny demo.
      cacheUsageLimits: {
        dataStorage: { unit: 'GB', maximum: 1 },
        ecpuPerSecond: { maximum: 1000 },
      },
    });
    cache.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    this.endpointAddress = cache.attrEndpointAddress;
    this.endpointPort = cache.attrEndpointPort;
    // ElastiCache Serverless uses TLS by default; rediss:// scheme.
    this.redisUrl = `rediss://${this.endpointAddress}:${this.endpointPort}`;
  }
}
