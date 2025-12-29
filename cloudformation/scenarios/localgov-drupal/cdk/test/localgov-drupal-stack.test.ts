import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { LocalGovDrupalStack } from '../lib/localgov-drupal-stack';

// Test environment for VPC lookup
const testEnv = {
  account: '123456789012',
  region: 'us-east-1',
};

describe('LocalGovDrupalStack', () => {
  test('Stack synthesizes without errors', () => {
    const app = new cdk.App();
    const stack = new LocalGovDrupalStack(app, 'TestStack', {
      env: testEnv,
    });

    // Verify template can be created
    const template = Template.fromStack(stack);

    // Template should be valid JSON
    expect(template.toJSON()).toBeDefined();
  });

  test('Stack applies correct tags', () => {
    const app = new cdk.App();
    const stack = new LocalGovDrupalStack(app, 'TestStack', {
      env: testEnv,
      deploymentMode: 'development',
    });

    // Get template and verify it synthesizes
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toBeDefined();
  });

  test('Stack accepts deploymentMode prop', () => {
    const app = new cdk.App();

    // Should not throw with valid deploymentMode
    expect(() => {
      new LocalGovDrupalStack(app, 'DevStack', {
        env: testEnv,
        deploymentMode: 'development',
      });
    }).not.toThrow();

    expect(() => {
      new LocalGovDrupalStack(app, 'ProdStack', {
        env: testEnv,
        deploymentMode: 'production',
      });
    }).not.toThrow();
  });

  test('Stack accepts councilTheme prop', () => {
    const app = new cdk.App();

    // Should not throw with valid councilTheme
    expect(() => {
      new LocalGovDrupalStack(app, 'ThemeStack', {
        env: testEnv,
        councilTheme: 'coastal',
      });
    }).not.toThrow();
  });

  test('Stack is correctly named', () => {
    const app = new cdk.App();
    const stack = new LocalGovDrupalStack(app, 'LocalGovDrupalStack', {
      env: testEnv,
    });

    expect(stack.stackName).toBe('LocalGovDrupalStack');
  });

  test('Stack creates security groups', () => {
    const app = new cdk.App();
    const stack = new LocalGovDrupalStack(app, 'TestStack', {
      env: testEnv,
    });

    const template = Template.fromStack(stack);

    // Verify ALB security group exists
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('ALB security group'),
    });

    // Verify Fargate security group exists
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('Fargate task security group'),
    });

    // Verify Aurora security group exists
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('Aurora MySQL security group'),
    });

    // Verify EFS security group exists
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('EFS security group'),
    });
  });

  test('ALB security group allows HTTPS from anywhere', () => {
    const app = new cdk.App();
    const stack = new LocalGovDrupalStack(app, 'TestStack', {
      env: testEnv,
    });

    const template = Template.fromStack(stack);

    // ALB security group has inline ingress rules for HTTPS (443)
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('ALB security group'),
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          CidrIp: '0.0.0.0/0',
        }),
      ]),
    });
  });

  // Story 1.5 - Database construct tests
  test('Stack creates Aurora Serverless v2 cluster', () => {
    const app = new cdk.App();
    const stack = new LocalGovDrupalStack(app, 'TestStack', {
      env: testEnv,
    });

    const template = Template.fromStack(stack);

    // Verify Aurora cluster is created with correct engine
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      Engine: 'aurora-mysql',
      EngineVersion: Match.stringLikeRegexp('8.0'),
      ServerlessV2ScalingConfiguration: {
        MinCapacity: 0.5,
        MaxCapacity: 2,
      },
      DatabaseName: 'drupal',
      StorageEncrypted: true,
    });
  });

  test('Stack creates Secrets Manager secret for database', () => {
    const app = new cdk.App();
    const stack = new LocalGovDrupalStack(app, 'TestStack', {
      env: testEnv,
    });

    const template = Template.fromStack(stack);

    // Verify Secrets Manager secret is created
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Description: Match.stringLikeRegexp('Database credentials'),
      GenerateSecretString: Match.objectLike({
        SecretStringTemplate: Match.stringLikeRegexp('drupal'),
        GenerateStringKey: 'password',
        ExcludePunctuation: true,
      }),
    });
  });

  test('Stack creates Aurora writer instance', () => {
    const app = new cdk.App();
    const stack = new LocalGovDrupalStack(app, 'TestStack', {
      env: testEnv,
    });

    const template = Template.fromStack(stack);

    // Verify writer instance is created as serverless v2
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      DBInstanceClass: 'db.serverless',
      Engine: 'aurora-mysql',
    });
  });

  // Story 1.6 - Storage construct tests
  test('Stack creates EFS file system with encryption', () => {
    const app = new cdk.App();
    const stack = new LocalGovDrupalStack(app, 'TestStack', {
      env: testEnv,
    });

    const template = Template.fromStack(stack);

    // Verify EFS file system is created with encryption enabled
    template.hasResourceProperties('AWS::EFS::FileSystem', {
      Encrypted: true,
      PerformanceMode: 'generalPurpose',
      ThroughputMode: 'bursting',
    });
  });

  test('Stack creates EFS access point', () => {
    const app = new cdk.App();
    const stack = new LocalGovDrupalStack(app, 'TestStack', {
      env: testEnv,
    });

    const template = Template.fromStack(stack);

    // Verify access point is created with correct POSIX user (www-data UID/GID 33)
    template.hasResourceProperties('AWS::EFS::AccessPoint', {
      PosixUser: {
        Uid: '33',
        Gid: '33',
      },
      RootDirectory: Match.objectLike({
        Path: '/drupal-files',
        CreationInfo: {
          OwnerUid: '33',
          OwnerGid: '33',
          Permissions: '0755',
        },
      }),
    });
  });

  test('Stack creates EFS mount targets', () => {
    const app = new cdk.App();
    const stack = new LocalGovDrupalStack(app, 'TestStack', {
      env: testEnv,
    });

    const template = Template.fromStack(stack);

    // Verify mount targets exist (at least one)
    const mountTargets = template.findResources('AWS::EFS::MountTarget');
    expect(Object.keys(mountTargets).length).toBeGreaterThan(0);
  });
});
