#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SimplyReadableStack } from '../lib/simply-readable-stack';

const app = new cdk.App();

new SimplyReadableStack(app, 'SimplyReadableStack', {
  // No env — produces environment-agnostic template using CloudFormation intrinsics
  // so the same template works in any account/region via StackSets
  description: 'NDX:Try Simply Readable — Document Translation & Easy Read powered by Amazon Translate and Amazon Bedrock. Originally built by Swindon Borough Council.',
  synthesizer: new cdk.DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
  }),
});
