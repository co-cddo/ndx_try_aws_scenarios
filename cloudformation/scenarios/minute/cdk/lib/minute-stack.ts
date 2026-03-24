import * as cdk from 'aws-cdk-lib';
import * as appregistry from 'aws-cdk-lib/aws-servicecatalogappregistry';
import * as crypto from 'crypto';
import { Construct } from 'constructs';
import { CdnConstruct } from './constructs/cdn';
import { ComputeConstruct } from './constructs/compute';
import { DatabaseConstruct } from './constructs/database';
import { NetworkingConstruct } from './constructs/networking';
import { QueuesConstruct } from './constructs/queues';
import { StorageConstruct } from './constructs/storage';

export class MinuteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tags
    cdk.Tags.of(this).add('Project', 'ndx-try-aws-scenarios');
    cdk.Tags.of(this).add('Scenario', 'minute');

    // AppRegistry
    const appRegistryApp = new appregistry.CfnApplication(this, 'AppRegistryApplication', {
      name: `NDXTry_Minute_${this.account}`,
      description: 'NDX:Try - Minute AI Meeting Transcription & Minuting',
      tags: { Project: 'ndx-try', Scenario: 'minute' },
    });

    new appregistry.CfnResourceAssociation(this, 'AppRegistryAssociation', {
      application: appRegistryApp.attrId,
      resource: this.stackId,
      resourceType: 'CFN_STACK',
    });

    cdk.Tags.of(this).add('awsApplication', appRegistryApp.attrArn, {
      excludeResourceTypes: [
        'AWS::ServiceCatalogAppRegistry::Application',
        'AWS::ServiceCatalogAppRegistry::ResourceAssociation',
        'aws:cdk:stack',
      ],
    });

    // Networking
    const networking = new NetworkingConstruct(this, 'Networking');

    // Database
    const database = new DatabaseConstruct(this, 'Database', {
      vpc: networking.vpc,
      securityGroup: networking.auroraSecurityGroup,
    });

    // SQS Queues
    const queues = new QueuesConstruct(this, 'Queues');

    // S3 Storage
    const storage = new StorageConstruct(this, 'Storage');

    // Compute (ECS, ALB, Cloud Map)
    const compute = new ComputeConstruct(this, 'Compute', {
      vpc: networking.vpc,
      albSecurityGroup: networking.albSecurityGroup,
      fargateSecurityGroup: networking.fargateSecurityGroup,
      databaseCluster: database.cluster,
      databaseSecret: database.secret,
      dataBucket: storage.dataBucket,
      transcriptionQueue: queues.transcriptionQueue,
      transcriptionDlq: queues.transcriptionDlq,
      llmQueue: queues.llmQueue,
      llmDlq: queues.llmDlq,
    });

    // CloudFront CDN with basic HTTP auth
    const cdn = new CdnConstruct(this, 'CDN', {
      loadBalancer: compute.loadBalancer,
    });

    // ==========================================================================
    // Outputs
    // ==========================================================================
    new cdk.CfnOutput(this, 'MinuteUrl', {
      description: 'URL to access Minute AI (HTTPS)',
      value: `https://${cdn.domainName}`,
      exportName: `${this.stackName}-MinuteUrl`,
    });

new cdk.CfnOutput(this, 'CloudWatchLogsUrl', {
      description: 'CloudWatch Logs URL',
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#logsV2:log-groups/log-group/${encodeURIComponent('/ndx-minute')}`,
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      description: 'S3 bucket for audio data',
      value: storage.dataBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'BasicAuthUsername', {
      description: 'Basic auth username for Minute AI',
      value: 'admin',
    });

    new cdk.CfnOutput(this, 'BasicAuthPassword', {
      description: 'Basic auth password for Minute AI (generated at deploy time)',
      value: cdn.basicAuthPassword,
    });
  }

  /**
   * ISB role naming override — prefixes all IAM roles with InnovationSandbox-ndx-
   * to comply with the ISB SCP that blocks API calls from non-prefixed roles.
   */
  protected override _toCloudFormation(): object {
    const template = super._toCloudFormation() as any;

    if (template.Resources) {
      for (const [logicalId, resource] of Object.entries(template.Resources) as any[]) {
        if (resource.Type === 'AWS::IAM::Role') {
          const props = resource.Properties;
          // Skip roles that already have ISB-compliant names
          if (props.RoleName && typeof props.RoleName === 'string' &&
              props.RoleName.startsWith('InnovationSandbox-ndx-')) {
            continue;
          }

          // Generate a deterministic role name from the logical ID
          const hash = crypto.createHash('md5').update(logicalId).digest('hex').substring(0, 8);
          const meaningful = logicalId
            .replace(/[A-F0-9]{8}$/, '')
            .replace(/[^a-zA-Z0-9-]/g, '')
            .slice(-33);
          props.RoleName = `InnovationSandbox-ndx-${meaningful}-${hash}`;
        }
      }
    }

    return template;
  }
}
