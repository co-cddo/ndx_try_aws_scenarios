import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { BopsPlanningStack } from '../lib/bops-planning-stack';

describe('BopsPlanningStack', () => {
  test('Stack synthesizes without errors', () => {
    const app = new cdk.App();
    const stack = new BopsPlanningStack(app, 'TestStack');
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toBeDefined();
  });

  test('Stack creates VPC with public subnets', () => {
    const app = new cdk.App();
    const stack = new BopsPlanningStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'Name', Value: Match.stringLikeRegexp('NdxBops-VPC') }),
      ]),
    });
  });

  test('Stack creates Aurora PostgreSQL cluster', () => {
    const app = new cdk.App();
    const stack = new BopsPlanningStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::RDS::DBCluster', {
      Engine: 'aurora-postgresql',
      ServerlessV2ScalingConfiguration: {
        MinCapacity: 0.5,
        MaxCapacity: 2,
      },
      DatabaseName: 'bops_production',
      StorageEncrypted: true,
    });
  });

  test('Stack creates ElastiCache Redis cluster', () => {
    const app = new cdk.App();
    const stack = new BopsPlanningStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::ElastiCache::CacheCluster', {
      Engine: 'redis',
      CacheNodeType: 'cache.t3.micro',
      NumCacheNodes: 1,
    });
  });

  test('Stack creates 4 security groups', () => {
    const app = new cdk.App();
    const stack = new BopsPlanningStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    // ALB, Fargate, Aurora, Redis
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('ALB security group'),
    });
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('Fargate task security group'),
    });
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('Aurora PostgreSQL security group'),
    });
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('ElastiCache Redis security group'),
    });
  });

  test('Stack creates ECS cluster', () => {
    const app = new cdk.App();
    const stack = new BopsPlanningStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterName: 'NdxBops-Cluster',
    });
  });

  test('Stack creates 3 ECS services', () => {
    const app = new cdk.App();
    const stack = new BopsPlanningStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    const services = template.findResources('AWS::ECS::Service');
    expect(Object.keys(services).length).toBe(3);
  });

  test('Stack creates internet-facing ALB', () => {
    const app = new cdk.App();
    const stack = new BopsPlanningStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Scheme: 'internet-facing',
      Type: 'application',
    });
  });

  test('Stack creates 2 ALB listeners (port 80 and 8080)', () => {
    const app = new cdk.App();
    const stack = new BopsPlanningStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    const listeners = template.findResources('AWS::ElasticLoadBalancingV2::Listener');
    expect(Object.keys(listeners).length).toBe(2);
  });

  test('Stack creates CloudFront distribution', () => {
    const app = new cdk.App();
    const stack = new BopsPlanningStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        Comment: 'BOPS Planning System - HTTPS Termination',
      }),
    });
  });

  test('Stack creates S3 bucket', () => {
    const app = new cdk.App();
    const stack = new BopsPlanningStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: Match.objectLike({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
      }),
    });
  });

  test('All IAM roles have ISB-compliant names', () => {
    const app = new cdk.App();
    const stack = new BopsPlanningStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    const roles = template.findResources('AWS::IAM::Role');
    for (const [logicalId, role] of Object.entries(roles)) {
      const props = (role as Record<string, any>).Properties;
      const roleName = props?.RoleName;
      if (roleName && typeof roleName === 'string') {
        expect(roleName).toMatch(/^InnovationSandbox-ndx-/);
      }
    }
  });

  test('Stack has OSVectorTilesApiKey parameter', () => {
    const app = new cdk.App();
    const stack = new BopsPlanningStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasParameter('OSVectorTilesApiKey', {
      Type: 'String',
      NoEcho: true,
    });
  });

  test('Stack outputs BOPS URLs', () => {
    const app = new cdk.App();
    const stack = new BopsPlanningStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasOutput('BOPSUrl', {});
    template.hasOutput('BOPSLoginUrl', {});
    template.hasOutput('BOPSUsername', { Value: 'ndx-demo_administrator@example.com' });
    template.hasOutput('BOPSPassword', {});
    template.hasOutput('ApplicantsPortalUrl', {});
    template.hasOutput('StackDescription', { Value: 'BOPS Planning System - NDX:Try' });
  });
});
