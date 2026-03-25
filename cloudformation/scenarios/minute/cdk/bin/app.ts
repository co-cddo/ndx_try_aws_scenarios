#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MinuteStack } from '../lib/minute-stack';

const app = new cdk.App();

new MinuteStack(app, 'MinuteStack', {
  // No env — environment-agnostic template for StackSet deployment
  description: 'Minute AI - Meeting Transcription & Minuting on AWS',
});
