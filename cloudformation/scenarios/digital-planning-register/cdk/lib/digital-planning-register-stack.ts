import * as crypto from 'crypto';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as appregistry from 'aws-cdk-lib/aws-servicecatalogappregistry';
import { Construct, IConstruct } from 'constructs';
import { CloudFrontConstruct } from './constructs/cloudfront';
import { ComputeConstruct } from './constructs/compute';
import { NetworkingConstruct } from './constructs/networking';

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

export class DigitalPlanningRegisterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Apply ISB role naming aspect — catches all hidden auto-generated roles
    cdk.Aspects.of(this).add(new IsbRoleNamingAspect());

    // Tags
    cdk.Tags.of(this).add('Project', 'ndx-try-aws-scenarios');
    cdk.Tags.of(this).add('Scenario', 'digital-planning-register');

    // AppRegistry Application - visible in myApplications on the AWS Console
    const appRegistryApp = new appregistry.CfnApplication(this, 'AppRegistryApplication', {
      name: `NDXTry_Digital_Planning_Register_${this.account}`,
      description: 'NDX:Try - Digital Planning Register',
      tags: { Project: 'ndx-try', Scenario: 'digital-planning-register' },
    });

    new appregistry.CfnResourceAssociation(this, 'AppRegistryAssociation', {
      application: appRegistryApp.attrId,
      resource: this.stackId,
      resourceType: 'CFN_STACK',
    });

    cdk.Tags.of(this).add('awsApplication', appRegistryApp.attrArn, {
      excludeResourceTypes: ['AWS::ServiceCatalogAppRegistry::Application', 'AWS::ServiceCatalogAppRegistry::ResourceAssociation'],
    });

    // CloudFormation parameter for Docker image URI
    const imageUriParam = new cdk.CfnParameter(this, 'ImageUri', {
      type: 'String',
      default: 'ghcr.io/co-cddo/ndx_try_aws_scenarios-dpr:latest',
      description: 'Docker image URI for the Digital Planning Register container',
    });

    // CloudFormation parameter for council configuration (JSON)
    const councilConfigParam = new cdk.CfnParameter(this, 'CouncilConfig', {
      type: 'String',
      default: '{}',
      description: 'JSON council configuration (council API URLs and keys). Leave empty to use built-in defaults.',
    });

    // Networking
    const networking = new NetworkingConstruct(this, 'Networking');

    // Compute (ECS, ALB)
    const compute = new ComputeConstruct(this, 'Compute', {
      vpc: networking.vpc,
      albSecurityGroup: networking.albSecurityGroup,
      fargateSecurityGroup: networking.fargateSecurityGroup,
      councilConfig: councilConfigParam.valueAsString,
      imageUri: imageUriParam.valueAsString,
    });

    // CloudFront
    const cdn = new CloudFrontConstruct(this, 'CDN', {
      loadBalancer: compute.loadBalancer,
    });

    // ==========================================================================
    // CloudFormation Outputs
    // ==========================================================================
    new cdk.CfnOutput(this, 'RegisterUrl', {
      description: 'Digital Planning Register URL (HTTPS via CloudFront)',
      value: `https://${cdn.domainName}`,
    });

    new cdk.CfnOutput(this, 'CloudWatchLogsUrl', {
      description: 'CloudWatch Logs for the application',
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#logsV2:log-groups/log-group/${encodeURIComponent('/ndx-dpr/production')}`,
    });

    new cdk.CfnOutput(this, 'ECSClusterUrl', {
      description: 'ECS Cluster in the AWS Console',
      value: `https://${this.region}.console.aws.amazon.com/ecs/v2/clusters/NdxDpr-Cluster/services?region=${this.region}`,
    });

    new cdk.CfnOutput(this, 'StackDescription', {
      description: 'Stack description',
      value: 'Digital Planning Register - NDX:Try',
    });
  }
}
