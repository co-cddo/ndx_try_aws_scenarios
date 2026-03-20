import * as crypto from 'crypto';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct, IConstruct } from 'constructs';
import { CloudFrontConstruct } from './constructs/cloudfront';
import { ComputeConstruct } from './constructs/compute';
import { DatabaseConstruct } from './constructs/database';
import { NetworkingConstruct } from './constructs/networking';

/**
 * CDK Aspect that ensures all IAM roles have ISB SCP-compliant names.
 * Uses full construct path + MD5 hash to guarantee uniqueness even for
 * CDK Provider framework roles that share similar short path segments.
 */
export class IsbRoleNamingAspect implements cdk.IAspect {
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

export class LocalGovImsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Apply ISB role naming aspect — catches all hidden auto-generated roles
    cdk.Aspects.of(this).add(new IsbRoleNamingAspect());

    // Tags
    cdk.Tags.of(this).add('Project', 'ndx-try-aws-scenarios');
    cdk.Tags.of(this).add('Scenario', 'localgov-ims');

    // CloudFormation parameter for GOV.UK Pay API key (NoEcho)
    const govukPayApiKeyParam = new cdk.CfnParameter(this, 'GovUkPayApiKey', {
      type: 'String',
      noEcho: true,
      minLength: 1,
      description: 'GOV.UK Pay sandbox API key (required for payment processing)',
    });

    // Generate secrets — no hardcoded secretName to avoid recovery window collisions
    const referenceSaltSecret = new secretsmanager.Secret(this, 'ReferenceSaltSecret', {
      description: 'IMS payment reference salt',
      generateSecretString: {
        secretStringTemplate: '{}',
        generateStringKey: 'REFERENCE_SALT',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    const adminPasswordSecret = new secretsmanager.Secret(this, 'AdminPasswordSecret', {
      description: 'IMS admin password',
      generateSecretString: {
        secretStringTemplate: '{}',
        generateStringKey: 'ADMIN_PASSWORD',
        excludePunctuation: true,
        passwordLength: 16,
      },
    });

    // Networking
    const networking = new NetworkingConstruct(this, 'Networking');

    // Database
    const database = new DatabaseConstruct(this, 'Database', {
      vpc: networking.vpc,
      securityGroup: networking.rdsSecurityGroup,
    });

    // Compute (ECS, ALB)
    const compute = new ComputeConstruct(this, 'Compute', {
      vpc: networking.vpc,
      albSecurityGroup: networking.albSecurityGroup,
      fargateSecurityGroup: networking.fargateSecurityGroup,
      databaseInstance: database.instance,
      databaseSecret: database.secret,
      referenceSaltSecret,
      adminPasswordSecret,
      govukPayApiKeyParam,
    });

    // CloudFront
    const cdn = new CloudFrontConstruct(this, 'CDN', {
      loadBalancer: compute.loadBalancer,
    });

    // Set URL environment variables now that CloudFront domains are known
    compute.container.addEnvironment('PORTAL_URL', `https://${cdn.portalDomainName}`);
    compute.container.addEnvironment('ADMIN_URL', `https://${cdn.adminDomainName}`);
    compute.container.addEnvironment('GOVUKPAY_URL', `https://${cdn.govukpayDomainName}`);

    // ==========================================================================
    // CloudFormation Outputs
    // ==========================================================================
    new cdk.CfnOutput(this, 'AdminPortalUrl', {
      description: 'IMS Admin Portal login URL',
      value: `https://${cdn.adminDomainName}/Account/Login`,
    });

    new cdk.CfnOutput(this, 'PaymentPortalUrl', {
      description: 'IMS Payment Portal URL',
      value: `https://${cdn.portalDomainName}`,
    });

    new cdk.CfnOutput(this, 'AdminUsername', {
      description: 'IMS admin username',
      value: 'admin',
    });

    new cdk.CfnOutput(this, 'AdminPassword', {
      description: 'IMS admin password',
      value: adminPasswordSecret.secretValueFromJson('ADMIN_PASSWORD').unsafeUnwrap(),
    });

    new cdk.CfnOutput(this, 'CloudWatchLogsUrl', {
      description: 'CloudWatch Logs for IMS containers',
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#logsV2:log-groups/log-group/${encodeURIComponent('/ndx-ims/production')}`,
    });

    new cdk.CfnOutput(this, 'StackDescription', {
      description: 'Stack description',
      value: 'LocalGov IMS Income Management System - Windows containers with GOV.UK Pay integration',
    });
  }
}
