#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DigitalPlanningRegisterStack } from '../lib/digital-planning-register-stack';

const app = new cdk.App();

new DigitalPlanningRegisterStack(app, 'DigitalPlanningRegisterStack', {
  // No env — produces environment-agnostic template using CloudFormation intrinsics
  // so the same template works in any account/region via StackSets
  description: 'Digital Planning Register - NDX:Try Demonstration Environment',
});
