import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import {
  aws_cognito as cognito,
  aws_iam as iam,
} from 'aws-cdk-lib';

export interface AuthConstructProps {
  removalPolicy: cdk.RemovalPolicy;
}

export class AuthConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly identityPoolId: string;
  public readonly authenticatedRole: iam.Role;
  public readonly adminPassword: string;
  public readonly cognitoDomain: string;

  constructor(scope: Construct, id: string, props: AuthConstructProps) {
    super(scope, id);

    // Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: false,
      signInAliases: { username: true, email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: props.removalPolicy,
      advancedSecurityMode: cognito.AdvancedSecurityMode.ENFORCED,
    });

    // Cognito domain for hosted UI (OAuth flows)
    const domain = this.userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: `ndx-sr-${cdk.Aws.ACCOUNT_ID}`,
      },
    });
    this.cognitoDomain = `ndx-sr-${cdk.Aws.ACCOUNT_ID}`;

    // User Pool Client
    this.userPoolClient = this.userPool.addClient('WebClient', {
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      preventUserExistenceErrors: true,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        // Callback URLs set dynamically — CloudFront domain not known until deploy
        // The upstream app accepts these from config.js at runtime
      },
    });

    // Admin user - created via CfnUserPoolUser
    const adminUser = new cognito.CfnUserPoolUser(this, 'AdminUser', {
      userPoolId: this.userPool.userPoolId,
      username: 'admin',
      userAttributes: [
        { name: 'email', value: 'admin@ndx-try.local' },
        { name: 'email_verified', value: 'true' },
      ],
    });

    // Set admin password via Custom Resource (inline Lambda)
    // Generates password in-Lambda to avoid Secrets Manager (blocked by ISB SCP)
    const setPasswordRole = new iam.Role(this, 'SetPasswordRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });
    setPasswordRole.addToPolicy(new iam.PolicyStatement({
      actions: ['cognito-idp:AdminSetUserPassword'],
      resources: [this.userPool.userPoolArn],
    }));

    const setPasswordFn = new cdk.aws_lambda.CfnFunction(this, 'SetPasswordFn', {
      runtime: 'nodejs20.x',
      handler: 'index.handler',
      role: setPasswordRole.roleArn,
      timeout: 30,
      code: {
        zipFile: `const{CognitoIdentityProviderClient,AdminSetUserPasswordCommand}=require("@aws-sdk/client-cognito-identity-provider");const c=require("crypto");const r=require("https");exports.handler=async(e)=>{const rp={Status:"SUCCESS",PhysicalResourceId:e.LogicalResourceId,StackId:e.StackId,RequestId:e.RequestId,LogicalResourceId:e.LogicalResourceId,Data:{}};if(e.RequestType==="Delete"){await send(e.ResponseURL,rp);return}try{const pw=c.randomBytes(12).toString("base64").slice(0,16).replace(/\\+/g,"!")+"A1a!";const cog=new CognitoIdentityProviderClient();await cog.send(new AdminSetUserPasswordCommand({UserPoolId:e.ResourceProperties.UserPoolId,Username:"admin",Password:pw,Permanent:true}));rp.Data={Password:pw};await send(e.ResponseURL,rp)}catch(err){rp.Status="FAILED";rp.Reason=err.message;await send(e.ResponseURL,rp)}};function send(u,d){return new Promise((ok,fail)=>{const b=JSON.stringify(d);const o=new URL(u);const opts={hostname:o.hostname,port:443,path:o.pathname+o.search,method:"PUT",headers:{"Content-Type":"","Content-Length":b.length}};const req=r.request(opts,ok);req.on("error",fail);req.write(b);req.end()})}`,
      },
    });
    setPasswordFn.addDependency(adminUser);

    const setPasswordCR = new cdk.CustomResource(this, 'SetPasswordCR', {
      serviceToken: cdk.Fn.getAtt(setPasswordFn.logicalId, 'Arn').toString(),
      properties: {
        UserPoolId: this.userPool.userPoolId,
      },
    });
    setPasswordCR.node.addDependency(setPasswordRole);
    this.adminPassword = setPasswordCR.getAttString('Password');

    // Cognito Identity Pool (using CfnIdentityPool from aws-cdk-lib)
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: this.userPoolClient.userPoolClientId,
        providerName: this.userPool.userPoolProviderName,
      }],
    });
    this.identityPoolId = identityPool.ref;

    // Authenticated role
    this.authenticatedRole = new iam.Role(this, 'AuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });

    this.authenticatedRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'translate:TranslateText',
        'translate:TranslateDocument',
        'translate:ListTerminologies',
        'comprehend:DetectDominantLanguage',
      ],
      resources: ['*'],
    }));

    // Unauthenticated role (deny all)
    const unauthenticatedRole = new iam.Role(this, 'UnauthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });
    unauthenticatedRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      actions: ['*'],
      resources: ['*'],
    }));

    // Attach roles to Identity Pool
    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoles', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: this.authenticatedRole.roleArn,
        unauthenticated: unauthenticatedRole.roleArn,
      },
    });
  }
}
