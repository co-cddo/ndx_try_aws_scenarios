#!/usr/bin/env node
import "source-map-support/register";
import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { SimplyReadableStack } from "../lib/simply-readable-stack";

// The app runs from .upstream/infrastructure/ (cd in cdk.json app command)
// but the CDK CLI expects cdk.out in the cdk/ directory.
// Resolve cdk.out relative to the cdk/ dir (two levels up from .upstream/infrastructure/).
const outdir = path.resolve(process.cwd(), "..", "..", "cdk", "cdk.out");
const app = new cdk.App({ outdir });

new SimplyReadableStack(app, "SimplyReadableStack", {
  // No env — produces environment-agnostic template using CloudFormation intrinsics
  // so the same template works in any account/region via StackSets
  description:
    "NDX:Try Simply Readable — Document Translation & Easy Read powered by Amazon Translate and Amazon Bedrock. Originally built by Swindon Borough Council.",
  synthesizer: new cdk.DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
  }),
});

app.synth();
