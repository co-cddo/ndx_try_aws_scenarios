#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { IsbHubStack } from '../lib/isb-hub-stack';

const app = new cdk.App();
new IsbHubStack(app, 'IsbHubStack', {
  env: { account: '568672915267', region: 'us-west-2' },
  description: 'NDX:Try ISB Hub - OIDC provider, IAM role, S3 template uploads, StackSets',
});
