#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LocalGovImsStack, IsbRoleNamingAspect } from '../lib/localgov-ims-stack';

const app = new cdk.App();

const stack = new LocalGovImsStack(app, 'LocalGovImsStack', {
  // No env — produces environment-agnostic template using CloudFormation intrinsics
  // so the same template works in any account/region via StackSets
  description: 'LocalGov IMS Income Management System - Windows containers on ECS Fargate with GOV.UK Pay integration',
});

cdk.Aspects.of(stack).add(new IsbRoleNamingAspect());
