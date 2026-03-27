#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FixMyStreetStack } from '../lib/fixmystreet-stack';

const app = new cdk.App();

new FixMyStreetStack(app, 'FixMyStreetStack', {
  // No env — produces environment-agnostic template using CloudFormation intrinsics
  // (Fn::GetAZs, Ref: AWS::Region) so the same template works in any account/region via StackSets
  description: 'FixMyStreet - Citizen Problem Reporting Platform for UK Councils',
});
