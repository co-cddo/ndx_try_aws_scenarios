import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';

export interface RedisConstructProps {
  readonly vpc: ec2.IVpc;
  readonly securityGroup: ec2.ISecurityGroup;
}

/**
 * Single-node ElastiCache Redis (cache.t3.micro). We tried Serverless Valkey
 * but ElastiCache Serverless is always cluster-mode, and Celery's Redis broker
 * can't speak Redis Cluster — connects fine then fails declaring exchanges.
 * Single-node Redis is fast enough for a Celery broker on a demo workload and
 * the 5-7 min provision time isn't on the critical path (Aurora is slower
 * anyway and runs in parallel).
 */
export class RedisConstruct extends Construct {
  public readonly endpointAddress: string;
  public readonly endpointPort: string;
  public readonly redisUrl: string;

  constructor(scope: Construct, id: string, props: RedisConstructProps) {
    super(scope, id);

    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Paperless-ngx Redis subnet group',
      subnetIds: props.vpc.publicSubnets.map(s => s.subnetId),
    });

    const redis = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      engine: 'redis',
      engineVersion: '7.0',
      cacheNodeType: 'cache.t3.micro',
      numCacheNodes: 1,
      cacheSubnetGroupName: subnetGroup.ref,
      vpcSecurityGroupIds: [props.securityGroup.securityGroupId],
    });

    this.endpointAddress = redis.attrRedisEndpointAddress;
    this.endpointPort = redis.attrRedisEndpointPort;
    this.redisUrl = `redis://${this.endpointAddress}:${this.endpointPort}`;
  }
}
