#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BopsPlanningStack } from '../lib/bops-planning-stack';

const app = new cdk.App();

new BopsPlanningStack(app, 'BopsPlanningStack', {
  // No env — produces environment-agnostic template using CloudFormation intrinsics
  // so the same template works in any account/region via StackSets
  description: 'BOPS Planning System - NDX:Try Demonstration Environment',
});
