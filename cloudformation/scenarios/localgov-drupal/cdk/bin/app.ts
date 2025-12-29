#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LocalGovDrupalStack } from '../lib/localgov-drupal-stack';

const app = new cdk.App();

// Get deployment mode from context or environment
const deploymentMode = app.node.tryGetContext('deploymentMode') ??
  (process.env.DEPLOYMENT_MODE as 'development' | 'production') ??
  'production';

// Get council theme from context
const councilTheme = app.node.tryGetContext('councilTheme') ?? 'random';

new LocalGovDrupalStack(app, 'LocalGovDrupalStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'AI-Enhanced LocalGov Drupal on AWS - Demonstration Environment',
  deploymentMode: deploymentMode as 'development' | 'production',
  councilTheme: councilTheme as 'random' | 'urban' | 'rural' | 'coastal' | 'historic',
});
