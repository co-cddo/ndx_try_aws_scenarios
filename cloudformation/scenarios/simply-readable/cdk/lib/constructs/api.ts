import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import {
  aws_appsync as appsync,
  aws_cognito as cognito,
  aws_wafv2 as wafv2,
  aws_iam as iam,
  aws_logs as logs,
} from 'aws-cdk-lib';

export interface ApiConstructProps {
  userPool: cognito.UserPool;
  removalPolicy: cdk.RemovalPolicy;
}

export class ApiConstruct extends Construct {
  public readonly api: appsync.CfnGraphQLApi;
  public readonly apiEndpoint: string;
  public readonly apiId: string;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    // CloudWatch Logs role for AppSync
    const logsRole = new iam.Role(this, 'AppSyncLogsRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
    });
    logsRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: ['*'],
    }));

    // GraphQL API (using CfnGraphQLApi for full control)
    this.api = new appsync.CfnGraphQLApi(this, 'GraphQLApi', {
      name: `${cdk.Aws.STACK_NAME}-SimplyReadable`,
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      userPoolConfig: {
        userPoolId: props.userPool.userPoolId,
        awsRegion: cdk.Aws.REGION,
        defaultAction: 'ALLOW',
      },
      additionalAuthenticationProviders: [{
        authenticationType: 'AWS_IAM',
      }],
      logConfig: {
        cloudWatchLogsRoleArn: logsRole.roleArn,
        fieldLogLevel: 'ERROR',
      },
      xrayEnabled: true,
    });

    this.apiEndpoint = this.api.attrGraphQlUrl;
    this.apiId = this.api.attrApiId;

    // GraphQL Schema
    const schema = new appsync.CfnGraphQLSchema(this, 'Schema', {
      apiId: this.api.attrApiId,
      definition: GRAPHQL_SCHEMA,
    });

    // WAF Web ACL
    const webAcl = new wafv2.CfnWebACL(this, 'WebACL', {
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'SimplyReadableWAF',
        sampledRequestsEnabled: true,
      },
      rules: [{
        name: 'AWSManagedRulesCommonRuleSet',
        priority: 1,
        overrideAction: { none: {} },
        statement: {
          managedRuleGroupStatement: {
            vendorName: 'AWS',
            name: 'AWSManagedRulesCommonRuleSet',
          },
        },
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: 'CommonRuleSet',
          sampledRequestsEnabled: true,
        },
      }],
    });

    // Associate WAF with AppSync
    new wafv2.CfnWebACLAssociation(this, 'WebACLAssociation', {
      resourceArn: this.api.attrArn,
      webAclArn: webAcl.attrArn,
    });
  }
}

// GraphQL Schema — must match the pre-built React app's compiled queries exactly.
// The upstream app (v3.4.0) uses an input wrapper type for translationCreateJob
// and queries field names: jobOwner, jobName, languageSource, languageTargets.
const GRAPHQL_SCHEMA = `
type shared_preferences_output @aws_cognito_user_pools @aws_iam {
  id: ID
  visualMode: String
  visualDensity: String
}

type helpNode @aws_cognito_user_pools @aws_iam {
  description: String
  id: ID!
  link: String
  order: Int
  title: String
}

type helpNodeConnection @aws_cognito_user_pools @aws_iam {
  items: [helpNode!]!
  nextToken: String
}

type translation_listJobs_output_item @aws_cognito_user_pools @aws_iam {
  id: ID
  jobOwner: String
  jobName: String
  createdAt: AWSTimestamp
  jobStatus: String
  languageSource: String
  languageTargets: AWSJSON
  translateKey: AWSJSON
  contentType: String
}

type translation_listJobs_output @aws_cognito_user_pools @aws_iam {
  items: [translation_listJobs_output_item]
  nextToken: String
}

input translation_createJob_input @aws_cognito_user_pools @aws_iam {
  id: ID!
  jobIdentity: String!
  jobName: String!
  languageSource: String!
  languageTargets: AWSJSON
  contentType: String
  translateStatus: AWSJSON
  translateKey: AWSJSON
  translateCallback: AWSJSON
  jobStatus: String
}

type translation_createJob_output @aws_cognito_user_pools @aws_iam {
  id: ID!
  jobIdentity: String
  contentType: String
  createdAt: AWSTimestamp
  jobName: String
  jobOwner: String
  jobStatus: String
  languageSource: String
  languageTargets: AWSJSON
  translateCallback: AWSJSON
  translateKey: AWSJSON
  translateStatus: AWSJSON
}

type readable_listJobs_output_item @aws_cognito_user_pools @aws_iam {
  id: String!
  identity: String
  name: String
  createdAt: Int
  updatedAt: Int
}

type readable_listJobs_output @aws_cognito_user_pools @aws_iam {
  items: [readable_listJobs_output_item]
  nextToken: String
}

type readable_getJob_output_item @aws_cognito_user_pools @aws_iam {
  id: String!
  itemId: String!
  identity: String
  name: String
  createdAt: Int
  updatedAt: Int
  input: String
  modelId: String
  order: Int
  output: String
  parent: String
  status: String
  type: String
}

type readable_getJob_output @aws_cognito_user_pools @aws_iam {
  items: [readable_getJob_output_item]
}

type readable_createJob_output @aws_cognito_user_pools @aws_iam {
  id: ID!
  identity: String!
}

type readable_updateJobMetadata_output @aws_cognito_user_pools @aws_iam {
  id: String!
  name: String
  createdAt: Int
  owner: String
  updatedAt: Int
}

type readable_createJobItem_output @aws_cognito_user_pools @aws_iam {
  order: Int!
  identity: String!
  type: String!
  id: ID!
  itemId: ID!
  parent: String
  input: String
  modelId: String
  output: String
  owner: String
  status: String
}

type readable_updateJobItem_output @aws_cognito_user_pools @aws_iam {
  type: String
  order: Int
  identity: String
  id: ID!
  itemId: ID!
  parent: String
  input: String
  modelId: String
  output: String
  owner: String
  status: String
}

type readable_createJobImport_output @aws_cognito_user_pools @aws_iam {
  id: ID!
  modelId: String
  status: String
}

type readable_getPrintStyle_output_item @aws_cognito_user_pools @aws_iam {
  id: String!
  name: String!
  type: String!
  css: [String]
  default: Boolean
}

type readable_getPrintStyle_output @aws_cognito_user_pools @aws_iam {
  items: [readable_getPrintStyle_output_item]
  nextToken: String
}

type readable_getModel_output_item @aws_cognito_user_pools @aws_iam {
  id: String!
  name: String!
  modelId: String
  type: String!
  default: Boolean
}

type readable_getModel_output @aws_cognito_user_pools @aws_iam {
  items: [readable_getModel_output_item]
  nextToken: String
}

type Query {
  sharedGetPreferences: shared_preferences_output! @aws_cognito_user_pools @aws_iam
  helpListHelps(limit: Int, nextToken: String): helpNodeConnection! @aws_cognito_user_pools @aws_iam
  translationListJobs(limit: Int, nextToken: String): translation_listJobs_output! @aws_cognito_user_pools @aws_iam
  readableListJobs(limit: Int, nextToken: String): readable_listJobs_output! @aws_cognito_user_pools @aws_iam
  readableGetJob(id: ID!): readable_getJob_output! @aws_cognito_user_pools @aws_iam
  readableListPrintStyles(limit: Int, nextToken: String): readable_getPrintStyle_output! @aws_cognito_user_pools @aws_iam
  readableListModels(limit: Int, nextToken: String): readable_getModel_output! @aws_cognito_user_pools @aws_iam
}

type Mutation {
  sharedUpdatePreferences(visualMode: String, visualDensity: String): shared_preferences_output! @aws_cognito_user_pools @aws_iam
  translationCreateJob(input: translation_createJob_input!): translation_createJob_output! @aws_cognito_user_pools @aws_iam
  readableCreateJob(identity: String!): readable_createJob_output! @aws_cognito_user_pools @aws_iam
  readableUpdateJobMetadata(id: String!, name: String): readable_updateJobMetadata_output! @aws_cognito_user_pools @aws_iam
  readableCreateJobItem(order: Int!, identity: String!, type: String!, id: ID!, parent: String, input: String, modelId: String, output: String, owner: String, status: String): readable_createJobItem_output! @aws_cognito_user_pools @aws_iam
  readableUpdateJobItem(order: Int, itemId: ID!, type: String, identity: String, id: ID!, parent: String, input: String, modelId: String, output: String, owner: String, status: String): readable_updateJobItem_output! @aws_cognito_user_pools @aws_iam
  readableCreateJobImport(id: ID!, identity: String, order: Int, type: String, modelId: String, status: String, key: String): readable_createJobImport_output! @aws_cognito_user_pools @aws_iam
}

type Subscription {
  readableUpdateJobMetadata(id: ID!): readable_updateJobMetadata_output @aws_cognito_user_pools
  readableUpdateJobItem(id: ID!, itemId: ID): readable_updateJobItem_output @aws_cognito_user_pools
}

schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}
`;
