import * as crypto from 'crypto';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct, IConstruct } from 'constructs';
import { CloudFrontConstruct } from './constructs/cloudfront';
import { ComputeConstruct } from './constructs/compute';
import { DatabaseConstruct } from './constructs/database';
import { NetworkingConstruct } from './constructs/networking';
import { RedisConstruct } from './constructs/redis';
import { StorageConstruct } from './constructs/storage';

/**
 * CDK Aspect that ensures all IAM roles have ISB SCP-compliant names.
 * Uses full construct path + MD5 hash to guarantee uniqueness even for
 * CDK Provider framework roles that share similar short path segments.
 */
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
        // Total <= 64 chars: 'InnovationSandbox-ndx-' (22) + name (<=33) + '-' (1) + hash (8) = 64
        node.roleName = `InnovationSandbox-ndx-${meaningful}-${hash}`;
      }
    }
  }
}

export class BopsPlanningStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Apply ISB role naming aspect — catches all hidden auto-generated roles
    cdk.Aspects.of(this).add(new IsbRoleNamingAspect());

    // Tags
    cdk.Tags.of(this).add('Project', 'ndx-try-aws-scenarios');
    cdk.Tags.of(this).add('Scenario', 'bops-planning');

    // CloudFormation parameter for OS Maps API key (NoEcho)
    const osMapApiKeyParam = new cdk.CfnParameter(this, 'OSVectorTilesApiKey', {
      type: 'String',
      noEcho: true,
      description: 'Ordnance Survey Vector Tiles API key',
    });

    // BOPS application secrets — 7 separate secrets to avoid custom resource
    // Each uses generateSecretString. No hardcoded secretName to avoid recovery window collisions.
    const bopsSecrets = new secretsmanager.Secret(this, 'BopsSecrets', {
      description: 'BOPS application secrets (SECRET_KEY_BASE, encryption keys, admin password, API bearer)',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          // These will be overridden by the generateStringKey mechanism
          // but we need the template for other keys
        }),
        generateStringKey: 'SECRET_KEY_BASE',
        excludePunctuation: true,
        passwordLength: 128,
      },
    });

    // Additional secrets — each as its own Secret resource since generateSecretString
    // can only auto-generate one password per secret
    const otpSecret = new secretsmanager.Secret(this, 'OtpSecret', {
      description: 'BOPS OTP encryption key',
      generateSecretString: {
        secretStringTemplate: '{}',
        generateStringKey: 'OTP_SECRET_ENCRYPTION_KEY',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    const arePrimaryKeySecret = new secretsmanager.Secret(this, 'ArePrimaryKeySecret', {
      description: 'BOPS Active Record Encryption primary key',
      generateSecretString: {
        secretStringTemplate: '{}',
        generateStringKey: 'ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    const areDeterministicKeySecret = new secretsmanager.Secret(this, 'AreDeterministicKeySecret', {
      description: 'BOPS Active Record Encryption deterministic key',
      generateSecretString: {
        secretStringTemplate: '{}',
        generateStringKey: 'ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    const areKeySaltSecret = new secretsmanager.Secret(this, 'AreKeySaltSecret', {
      description: 'BOPS Active Record Encryption key derivation salt',
      generateSecretString: {
        secretStringTemplate: '{}',
        generateStringKey: 'ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    const adminPasswordSecret = new secretsmanager.Secret(this, 'AdminPasswordSecret', {
      description: 'BOPS demo admin password',
      generateSecretString: {
        secretStringTemplate: '{}',
        generateStringKey: 'ADMIN_PASSWORD',
        excludePunctuation: true,
        passwordLength: 16,
      },
    });

    const apiBearerSecret = new secretsmanager.Secret(this, 'ApiBearerSecret', {
      description: 'BOPS API Bearer token for Applicants portal',
      generateSecretString: {
        secretStringTemplate: '{}',
        generateStringKey: 'API_BEARER',
        excludePunctuation: true,
        passwordLength: 64,
      },
    });

    // Resolve all secrets at CloudFormation deploy time via unsafeUnwrap()
    // ISB SCP blocks runtime secretsmanager:GetSecretValue — these resolve as
    // CloudFormation dynamic references ({{resolve:secretsmanager:...}})
    const resolvedSecrets = {
      secretKeyBase: bopsSecrets.secretValueFromJson('SECRET_KEY_BASE').unsafeUnwrap(),
      otpSecretEncryptionKey: otpSecret.secretValueFromJson('OTP_SECRET_ENCRYPTION_KEY').unsafeUnwrap(),
      arePrimaryKey: arePrimaryKeySecret.secretValueFromJson('ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY').unsafeUnwrap(),
      areDeterministicKey: areDeterministicKeySecret.secretValueFromJson('ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY').unsafeUnwrap(),
      areKeySalt: areKeySaltSecret.secretValueFromJson('ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT').unsafeUnwrap(),
      adminPassword: adminPasswordSecret.secretValueFromJson('ADMIN_PASSWORD').unsafeUnwrap(),
      apiBearer: apiBearerSecret.secretValueFromJson('API_BEARER').unsafeUnwrap(),
    };

    // Networking
    const networking = new NetworkingConstruct(this, 'Networking');

    // Database
    const database = new DatabaseConstruct(this, 'Database', {
      vpc: networking.vpc,
      securityGroup: networking.auroraSecurityGroup,
    });

    // Redis
    const redis = new RedisConstruct(this, 'Redis', {
      vpc: networking.vpc,
      securityGroup: networking.redisSecurityGroup,
    });

    // Storage (S3)
    const storage = new StorageConstruct(this, 'Storage');

    // Compute (ECS, ALB) — seed runs inside web entrypoint, no separate task
    const compute = new ComputeConstruct(this, 'Compute', {
      vpc: networking.vpc,
      albSecurityGroup: networking.albSecurityGroup,
      fargateSecurityGroup: networking.fargateSecurityGroup,
      databaseCluster: database.cluster,
      databaseSecret: database.secret,
      redisUrl: redis.redisUrl,
      uploadsBucket: storage.bucket,
      secrets: resolvedSecrets,
      osMapApiKeyParam: osMapApiKeyParam,
    });

    // CloudFront
    const cdn = new CloudFrontConstruct(this, 'CDN', {
      loadBalancer: compute.loadBalancer,
    });

    // ==========================================================================
    // CloudFormation Outputs
    // ==========================================================================
    new cdk.CfnOutput(this, 'BOPSUrl', {
      description: 'BOPS back-office URL (HTTPS via CloudFront)',
      value: `https://${cdn.domainName}`,
    });

    new cdk.CfnOutput(this, 'BOPSLoginUrl', {
      description: 'BOPS login page URL',
      value: `https://${cdn.domainName}/users/sign_in`,
    });

    new cdk.CfnOutput(this, 'BOPSUsername', {
      description: 'BOPS admin username',
      value: 'ndx-demo_administrator@example.com',
    });

    new cdk.CfnOutput(this, 'BOPSPassword', {
      description: 'BOPS admin password (retrieve from Secrets Manager)',
      value: `https://console.aws.amazon.com/secretsmanager/secret?name=${adminPasswordSecret.secretName}&region=${cdk.Aws.REGION}`,
    });

    new cdk.CfnOutput(this, 'ApplicantsPortalUrl', {
      description: 'BOPS-Applicants public portal URL',
      value: `http://${compute.loadBalancerDnsName}:8080`,
    });

    new cdk.CfnOutput(this, 'CloudWatchLogsUrl', {
      description: 'CloudWatch Logs for BOPS containers',
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#logsV2:log-groups/log-group/${encodeURIComponent('/ndx-bops/production')}`,
    });

    new cdk.CfnOutput(this, 'StackDescription', {
      description: 'Stack description',
      value: 'BOPS Planning System - NDX:Try',
    });
  }
}
