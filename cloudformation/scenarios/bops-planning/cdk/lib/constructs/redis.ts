import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';

export interface RedisConstructProps {
  readonly vpc: ec2.IVpc;
  readonly securityGroup: ec2.ISecurityGroup;
}

export class RedisConstruct extends Construct {
  public readonly endpointAddress: string;
  public readonly endpointPort: string;
  public readonly redisUrl: string;

  constructor(scope: Construct, id: string, props: RedisConstructProps) {
    super(scope, id);

    // ElastiCache has NO L2 CDK construct — must use L1 CfnCacheCluster
    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'BOPS Redis subnet group',
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
    this.redisUrl = `redis://${this.endpointAddress}:${this.endpointPort}/1`;
  }
}
