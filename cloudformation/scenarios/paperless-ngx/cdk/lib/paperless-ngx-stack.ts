import * as crypto from 'crypto';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as appregistry from 'aws-cdk-lib/aws-servicecatalogappregistry';
import { Construct, IConstruct } from 'constructs';
import { BedrockConstruct } from './constructs/bedrock';
import { ChatConstruct } from './constructs/chat';
import { CloudFrontConstruct } from './constructs/cloudfront';
import { ComputeConstruct } from './constructs/compute';
import { DatabaseConstruct } from './constructs/database';
import { NetworkingConstruct } from './constructs/networking';
import { RedisConstruct } from './constructs/redis';
import { StorageConstruct } from './constructs/storage';

const BEDROCK_MODEL_ID = 'amazon.nova-pro-v1:0';

/** Forces every IAM role to start with InnovationSandbox-ndx- (ISB SCP `p-tyb1wjxv`). */
class IsbRoleNamingAspect implements cdk.IAspect {
  visit(node: IConstruct): void {
    if (node instanceof iam.CfnRole) {
      const currentName = node.roleName;
      if (!currentName || !currentName.toString().startsWith('InnovationSandbox-ndx-')) {
        const fullPath = node.node.path;
        const hash = crypto.createHash('md5').update(fullPath).digest('hex').substring(0, 8);
        const meaningful = fullPath
          .replace(/[A-F0-9]{8}$/, '')
          .replace(/[^a-zA-Z0-9-]/g, '')
          .slice(-33);
        node.roleName = `InnovationSandbox-ndx-${meaningful}-${hash}`;
      }
    }
  }
}

export class PaperlessNgxStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    cdk.Aspects.of(this).add(new IsbRoleNamingAspect());

    cdk.Tags.of(this).add('Project', 'ndx-try');
    cdk.Tags.of(this).add('Scenario', 'paperless-ngx');
    cdk.Tags.of(this).add('Environment', 'evaluation');
    cdk.Tags.of(this).add('ManagedBy', 'cloudformation');

    const appRegistryApp = new appregistry.CfnApplication(this, 'AppRegistryApplication', {
      name: `NDXTry_PaperlessNgx_${this.account}`,
      description: 'NDX:Try - Paperless-ngx document archive with OCR and Bedrock AI',
      tags: { Project: 'ndx-try', Scenario: 'paperless-ngx' },
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
      ],
    });

    // Admin password + Django SECRET_KEY in their own Secrets Manager secrets so we can
    // resolve at synth time via dynamic references and surface the password as an output.
    const adminPasswordSecret = new secretsmanager.Secret(this, 'AdminPasswordSecret', {
      description: 'Paperless-ngx admin password',
      generateSecretString: {
        secretStringTemplate: '{}',
        generateStringKey: 'ADMIN_PASSWORD',
        excludePunctuation: true,
        passwordLength: 16,
      },
    });

    const secretKeySecret = new secretsmanager.Secret(this, 'SecretKeySecret', {
      description: 'Paperless-ngx Django SECRET_KEY',
      generateSecretString: {
        secretStringTemplate: '{}',
        generateStringKey: 'SECRET_KEY',
        excludePunctuation: true,
        passwordLength: 64,
      },
    });

    const adminPassword = adminPasswordSecret.secretValueFromJson('ADMIN_PASSWORD').unsafeUnwrap();
    const secretKey = secretKeySecret.secretValueFromJson('SECRET_KEY').unsafeUnwrap();

    const networking = new NetworkingConstruct(this, 'Networking');

    const database = new DatabaseConstruct(this, 'Database', {
      vpc: networking.vpc,
      securityGroup: networking.auroraSecurityGroup,
    });

    const redis = new RedisConstruct(this, 'Redis', {
      vpc: networking.vpc,
      securityGroup: networking.redisSecurityGroup,
    });

    const storage = new StorageConstruct(this, 'Storage', {
      vpc: networking.vpc,
      securityGroup: networking.fileSystemSecurityGroup,
    });

    const bedrockBits = new BedrockConstruct(this, 'Bedrock', {
      modelId: BEDROCK_MODEL_ID,
      archiveBucket: storage.archiveBucket,
      kbPrefix: storage.kbPrefix,
    });

    // Chat construct first — its Function URL is needed by CloudFront so we can
    // route /chat/* through the same cloudfront.net hostname (Zscaler blocks the
    // raw *.lambda-url.on.aws domain).
    const chat = new ChatConstruct(this, 'Chat', {
      knowledgeBase: bedrockBits.knowledgeBase,
      guardrail: bedrockBits.guardrail,
      guardrailVersion: bedrockBits.guardrailVersion,
      modelId: BEDROCK_MODEL_ID,
      paperlessUrl: '/',
    });

    const compute = new ComputeConstruct(this, 'Compute', {
      vpc: networking.vpc,
      albSecurityGroup: networking.albSecurityGroup,
      fargateSecurityGroup: networking.fargateSecurityGroup,
      databaseInstance: database.instance,
      databaseSecret: database.secret,
      redisUrl: redis.redisUrl,
      fileSystemArn: storage.fileSystemArn,
      dataAccessPoint: storage.dataAccessPoint,
      mediaAccessPoint: storage.mediaAccessPoint,
      consumeAccessPoint: storage.consumeAccessPoint,
      exportAccessPoint: storage.exportAccessPoint,
      scriptsAccessPoint: storage.scriptsAccessPoint,
      kbAccessPoint: storage.kbAccessPoint,
      adminPassword,
      secretKey,
      archiveBucket: storage.archiveBucket,
      kbPrefix: storage.kbPrefix,
      knowledgeBaseId: bedrockBits.knowledgeBase.attrKnowledgeBaseId,
      bedrockModelId: BEDROCK_MODEL_ID,
    });

    const cdn = new CloudFrontConstruct(this, 'CDN', {
      loadBalancer: compute.loadBalancer,
      chatLambdaUrl: chat.urlString,
    });

    // Now that we have the distribution ARN, grant CloudFront permission to
    // invoke the chat Lambda via SigV4 (OAC).
    chat.grantCloudFrontInvoke(cdn.distributionArn);

    new cdk.CfnOutput(this, 'PaperlessUrl', {
      description: 'Paperless-ngx URL (HTTPS via CloudFront)',
      value: `https://${cdn.domainName}`,
    });

    new cdk.CfnOutput(this, 'ChatUrl', {
      description: 'Chat-with-archive URL (Bedrock Knowledge Base + Guardrails)',
      value: `https://${cdn.domainName}/chat/`,
    });

    new cdk.CfnOutput(this, 'ChatLambdaUrl', {
      description: 'Direct Lambda Function URL (may be blocked by some corporate proxies; prefer ChatUrl)',
      value: chat.urlString,
    });

    new cdk.CfnOutput(this, 'AdminUsername', {
      description: 'Paperless admin username',
      value: 'admin',
    });

    new cdk.CfnOutput(this, 'AdminPassword', {
      description: 'Paperless admin password',
      value: adminPassword,
    });

    new cdk.CfnOutput(this, 'CloudWatchLogsUrl', {
      description: 'CloudWatch Logs for Paperless containers',
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#logsV2:log-groups/log-group/${encodeURIComponent(`/ndx-paperless-ngx-${this.stackName}/production`)}`,
    });

    new cdk.CfnOutput(this, 'ArchiveBucket', {
      description: 'Single S3 bucket holding the Paperless archive — file system view via S3 Files, plus the Bedrock KB data source under the kb/ prefix',
      value: storage.archiveBucket.bucketName,
    });
  }
}
