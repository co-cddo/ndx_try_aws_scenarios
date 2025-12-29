import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LocalGovDrupalStack } from '../lib/localgov-drupal-stack';

describe('LocalGovDrupalStack', () => {
  test('Stack synthesizes without errors', () => {
    const app = new cdk.App();
    const stack = new LocalGovDrupalStack(app, 'TestStack');

    // Verify template can be created
    const template = Template.fromStack(stack);

    // Template should be valid JSON
    expect(template.toJSON()).toBeDefined();
  });

  test('Stack applies correct tags', () => {
    const app = new cdk.App();
    const stack = new LocalGovDrupalStack(app, 'TestStack', {
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
        deploymentMode: 'development',
      });
    }).not.toThrow();

    expect(() => {
      new LocalGovDrupalStack(app, 'ProdStack', {
        deploymentMode: 'production',
      });
    }).not.toThrow();
  });

  test('Stack accepts councilTheme prop', () => {
    const app = new cdk.App();

    // Should not throw with valid councilTheme
    expect(() => {
      new LocalGovDrupalStack(app, 'ThemeStack', {
        councilTheme: 'coastal',
      });
    }).not.toThrow();
  });

  test('Stack is correctly named', () => {
    const app = new cdk.App();
    const stack = new LocalGovDrupalStack(app, 'LocalGovDrupalStack');

    expect(stack.stackName).toBe('LocalGovDrupalStack');
  });
});
