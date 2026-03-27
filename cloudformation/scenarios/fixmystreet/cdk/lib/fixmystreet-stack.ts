import * as crypto from 'crypto';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as appregistry from 'aws-cdk-lib/aws-servicecatalogappregistry';
import { Construct, IConstruct } from 'constructs';
import { CloudFrontConstruct } from './constructs/cloudfront';
import { ComputeConstruct } from './constructs/compute';
import { DatabaseConstruct } from './constructs/database';
import { NetworkingConstruct } from './constructs/networking';
import { StorageConstruct } from './constructs/storage';

/**
 * CDK Aspect that ensures all IAM roles have ISB SCP-compliant names.
 * Uses full construct path + MD5 hash to guarantee uniqueness.
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

export class FixMyStreetStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Apply ISB role naming aspect — catches all hidden auto-generated roles
    cdk.Aspects.of(this).add(new IsbRoleNamingAspect());

    // Tags
    cdk.Tags.of(this).add('Project', 'ndx-try-aws-scenarios');
    cdk.Tags.of(this).add('Scenario', 'fixmystreet');

    // AppRegistry Application - visible in myApplications on the AWS Console
    const appRegistryApp = new appregistry.CfnApplication(this, 'AppRegistryApplication', {
      name: `NDXTry_FixMyStreet_${this.account}`,
      description: 'NDX:Try - FixMyStreet Citizen Problem Reporting Platform',
      tags: { Project: 'ndx-try', Scenario: 'fixmystreet' },
    });

    new appregistry.CfnResourceAssociation(this, 'AppRegistryAssociation', {
      application: appRegistryApp.attrId,
      resource: this.stackId,
      resourceType: 'CFN_STACK',
    });

    cdk.Tags.of(this).add('awsApplication', appRegistryApp.attrArn, {
      excludeResourceTypes: ['AWS::ServiceCatalogAppRegistry::Application', 'AWS::ServiceCatalogAppRegistry::ResourceAssociation'],
    });

    // Admin credentials via Secrets Manager
    // No secretName so CloudFormation generates a unique physical name
    const adminSecret = new secretsmanager.Secret(this, 'AdminSecret', {
      description: 'Admin credentials for FixMyStreet',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin@example.org' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    // Networking
    const networking = new NetworkingConstruct(this, 'Networking');

    // Database (Aurora PostgreSQL with PostGIS)
    const database = new DatabaseConstruct(this, 'Database', {
      vpc: networking.vpc,
      securityGroup: networking.auroraSecurityGroup,
    });

    // Storage (EFS for photo uploads)
    const storage = new StorageConstruct(this, 'Storage', {
      vpc: networking.vpc,
      securityGroup: networking.efsSecurityGroup,
    });

    // Compute (Fargate + ALB)
    const compute = new ComputeConstruct(this, 'Compute', {
      vpc: networking.vpc,
      albSecurityGroup: networking.albSecurityGroup,
      fargateSecurityGroup: networking.fargateSecurityGroup,
      databaseCluster: database.cluster,
      databaseSecret: database.secret,
      fileSystem: storage.fileSystem,
      accessPoint: storage.accessPoint,
      adminSecret,
    });

    // CloudFront (HTTPS termination)
    const cdn = new CloudFrontConstruct(this, 'CDN', {
      loadBalancer: compute.loadBalancer,
    });

    // Inject CloudFront URL as BASE_URL into the FMS container environment.
    // No circular dependency: ALB (standalone) → CloudFront → TaskDef → Service
    compute.taskDefinition.findContainer('fixmystreet')!.addEnvironment(
      'BASE_URL', `https://${cdn.domainName}`,
    );

    // ==========================================================================
    // CloudFormation Outputs
    // ==========================================================================
    new cdk.CfnOutput(this, 'FixMyStreetUrl', {
      description: 'URL to access FixMyStreet (HTTPS)',
      value: `https://${cdn.domainName}`,
    });

    new cdk.CfnOutput(this, 'AdminUsername', {
      description: 'FixMyStreet council admin username (no 2FA required)',
      value: 'council-admin@example.org',
    });

    // Custom Resource to resolve admin password for display in Outputs
    const readSecretRole = new iam.Role(this, 'ReadSecretRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });
    readSecretRole.addToPolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [adminSecret.secretArn],
    }));

    const readSecretFn = new cdk.aws_lambda.Function(this, 'ReadSecretFn', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: readSecretRole,
      timeout: cdk.Duration.seconds(30),
      code: cdk.aws_lambda.Code.fromInline(`
const{SecretsManagerClient,GetSecretValueCommand}=require("@aws-sdk/client-secrets-manager");
const r=require("https");
exports.handler=async(e)=>{
  const rp={Status:"SUCCESS",PhysicalResourceId:e.LogicalResourceId,StackId:e.StackId,RequestId:e.RequestId,LogicalResourceId:e.LogicalResourceId,Data:{}};
  if(e.RequestType==="Delete"){await send(e.ResponseURL,rp);return}
  try{
    const sm=new SecretsManagerClient();
    const sv=await sm.send(new GetSecretValueCommand({SecretId:e.ResourceProperties.SecretArn}));
    rp.Data={Password:JSON.parse(sv.SecretString).password};
    await send(e.ResponseURL,rp);
  }catch(err){rp.Status="FAILED";rp.Reason=err.message;await send(e.ResponseURL,rp)}
};
function send(u,d){return new Promise((ok,fail)=>{const b=JSON.stringify(d);const o=new URL(u);const opts={hostname:o.hostname,port:443,path:o.pathname+o.search,method:"PUT",headers:{"Content-Type":"","Content-Length":b.length}};const req=r.request(opts,ok);req.on("error",fail);req.write(b);req.end()})}
      `),
    });

    const readSecretCR = new cdk.CustomResource(this, 'ReadSecretCR', {
      serviceToken: readSecretFn.functionArn,
      properties: {
        SecretArn: adminSecret.secretArn,
        Version: '2', // Bump to force re-execution when Lambda code changes
      },
    });
    readSecretCR.node.addDependency(readSecretRole);

    new cdk.CfnOutput(this, 'AdminPassword', {
      description: 'Admin password for login',
      value: readSecretCR.getAttString('Password'),
    });

    // CloudWatch Logs URL
    new cdk.CfnOutput(this, 'CloudWatchLogsUrl', {
      description: 'CloudWatch Logs for FixMyStreet',
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#logsV2:log-groups/log-group/${encodeURIComponent('/ndx-fixmystreet/production')}`,
    });

    new cdk.CfnOutput(this, 'StackDescription', {
      description: 'Stack description',
      value: 'FixMyStreet - Citizen Problem Reporting Platform - NDX:Try',
    });
  }
}
