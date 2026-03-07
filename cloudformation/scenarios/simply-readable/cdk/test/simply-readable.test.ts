import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SimplyReadableStack } from '../lib/simply-readable-stack';

describe('SimplyReadableStack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new SimplyReadableStack(app, 'TestStack', {
      description: 'Test stack for Simply Readable',
    });
    template = Template.fromStack(stack);
  });

  test('Cognito User Pool exists', () => {
    template.resourceCountIs('AWS::Cognito::UserPool', 1);
  });

  test('Cognito User Pool has self-signup disabled', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      AdminCreateUserConfig: {
        AllowAdminCreateUserOnly: true,
      },
    });
  });

  test('AppSync GraphQL API exists', () => {
    template.resourceCountIs('AWS::AppSync::GraphQLApi', 1);
  });

  test('AppSync API uses Cognito auth', () => {
    template.hasResourceProperties('AWS::AppSync::GraphQLApi', {
      AuthenticationType: 'AMAZON_COGNITO_USER_POOLS',
    });
  });

  test('CloudFront distribution exists', () => {
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
  });

  test('At least one Step Functions state machine exists', () => {
    const resources = template.findResources('AWS::StepFunctions::StateMachine');
    expect(Object.keys(resources).length).toBeGreaterThanOrEqual(1);
  });

  test('All S3 buckets block public access', () => {
    const buckets = template.findResources('AWS::S3::Bucket');
    for (const [logicalId, bucket] of Object.entries(buckets)) {
      const props = (bucket as any).Properties;
      if (props.PublicAccessBlockConfiguration) {
        expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(props.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      }
    }
  });

  test('WAF WebACL exists', () => {
    template.resourceCountIs('AWS::WAFv2::WebACL', 1);
  });

  test('DynamoDB tables use PAY_PER_REQUEST', () => {
    const tables = template.findResources('AWS::DynamoDB::Table');
    for (const [logicalId, table] of Object.entries(tables)) {
      expect((table as any).Properties.BillingMode).toBe('PAY_PER_REQUEST');
    }
  });

  test('Stack has required outputs', () => {
    template.hasOutput('AppUrl', {});
    template.hasOutput('AdminUsername', {});
    template.hasOutput('AdminPasswordSecret', {});
    template.hasOutput('CognitoUserPoolId', {});
    template.hasOutput('AppSyncEndpoint', {});
  });

  test('Resources are tagged correctly', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UserPoolTags: Match.objectLike({
        Project: 'ndx-try-aws-scenarios',
        Scenario: 'simply-readable',
      }),
    });
  });
});
