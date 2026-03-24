#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PlanxStack } from '../lib/planx-stack';

const app = new cdk.App();

new PlanxStack(app, 'PlanxStack', {
  // No env — produces environment-agnostic template using CloudFormation intrinsics
  // so the same template works in any account/region via StackSets
  description: 'PlanX Digital Planning Platform - NDX:Try Demonstration Environment',
});
