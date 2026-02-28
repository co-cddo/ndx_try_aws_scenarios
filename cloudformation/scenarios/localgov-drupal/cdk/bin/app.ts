#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LocalGovDrupalStack } from '../lib/localgov-drupal-stack';

const app = new cdk.App();

new LocalGovDrupalStack(app, 'LocalGovDrupalStack', {
  // No env — produces environment-agnostic template using CloudFormation intrinsics
  // (Fn::GetAZs, Ref: AWS::Region) so the same template works in any account/region via StackSets
  description: 'AI-Enhanced LocalGov Drupal on AWS - Demonstration Environment',
  deploymentMode: 'production',
  councilTheme: 'random',
});
