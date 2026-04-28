#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PaperlessNgxStack } from '../lib/paperless-ngx-stack';

const app = new cdk.App();

new PaperlessNgxStack(app, 'PaperlessNgxStack', {
  description: 'Paperless-ngx document archive with OCR + Bedrock AI - NDX:Try',
});
