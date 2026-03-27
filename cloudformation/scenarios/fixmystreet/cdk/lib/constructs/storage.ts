import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as efs from 'aws-cdk-lib/aws-efs';
import { Construct } from 'constructs';

export interface StorageConstructProps {
  readonly vpc: ec2.IVpc;
  readonly securityGroup: ec2.ISecurityGroup;
}

export class StorageConstruct extends Construct {
  public readonly fileSystem: efs.FileSystem;
  public readonly accessPoint: efs.AccessPoint;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    this.fileSystem = new efs.FileSystem(this, 'FmsFiles', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: props.securityGroup,
      encrypted: true,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_30_DAYS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      fileSystemName: 'NdxFms-Files',
    });

    // FixMyStreet upload directory — www-data user (UID/GID 33)
    this.accessPoint = this.fileSystem.addAccessPoint('FmsUploadsAP', {
      path: '/fixmystreet-uploads',
      posixUser: {
        uid: '33',
        gid: '33',
      },
      createAcl: {
        ownerUid: '1000',
        ownerGid: '1000',
        permissions: '0775',
      },
    });
  }
}
