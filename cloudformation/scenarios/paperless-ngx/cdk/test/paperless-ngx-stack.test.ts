import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { PaperlessNgxStack } from '../lib/paperless-ngx-stack';

describe('PaperlessNgxStack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new PaperlessNgxStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  test('creates RDS Postgres instance', () => {
    template.resourceCountIs('AWS::RDS::DBInstance', 1);
  });

  test('creates ElastiCache Redis', () => {
    template.resourceCountIs('AWS::ElastiCache::CacheCluster', 1);
  });

  test('creates S3 Files file system', () => {
    template.resourceCountIs('AWS::S3Files::FileSystem', 1);
  });

  test('creates Bedrock Knowledge Base', () => {
    template.resourceCountIs('AWS::Bedrock::KnowledgeBase', 1);
  });

  test('creates Bedrock Guardrail', () => {
    template.resourceCountIs('AWS::Bedrock::Guardrail', 1);
  });

  test('creates S3 Vectors bucket and index', () => {
    template.resourceCountIs('AWS::S3Vectors::VectorBucket', 1);
    template.resourceCountIs('AWS::S3Vectors::Index', 1);
  });

  test('creates chat Lambda with Function URL', () => {
    template.hasResourceProperties('AWS::Lambda::Url', {
      AuthType: 'NONE',
    });
  });

  test('outputs include PaperlessUrl, ChatUrl, AdminPassword, CloudWatchLogsUrl', () => {
    template.hasOutput('PaperlessUrl', {});
    template.hasOutput('ChatUrl', {});
    template.hasOutput('AdminPassword', {});
    template.hasOutput('CloudWatchLogsUrl', {});
  });

  test('grants comprehend:DetectPiiEntities on the task role, region-pinned', () => {
    const actionMatches = (a: unknown) =>
      a === 'comprehend:DetectPiiEntities' ||
      (Array.isArray(a) && a.includes('comprehend:DetectPiiEntities'));
    const policies = template.findResources('AWS::IAM::Policy');
    const matched = Object.values(policies).flatMap((r: any) =>
      (r.Properties?.PolicyDocument?.Statement ?? []).filter(
        (s: any) =>
          actionMatches(s.Action) &&
          s.Condition?.StringEquals?.['aws:RequestedRegion'] !== undefined,
      ),
    );
    expect(matched).toHaveLength(1);
  });
});
