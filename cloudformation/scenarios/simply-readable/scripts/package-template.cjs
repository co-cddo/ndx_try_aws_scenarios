#!/usr/bin/env node

/**
 * Package the CDK-synthesized template for deployment without CDK bootstrap.
 *
 * The upstream CDK constructs use NodejsFunction which produces Lambda assets
 * that reference the CDK bootstrap bucket (cdk-hnb659fds-assets-*).
 * ISB sandbox accounts don't have CDK bootstrap.
 *
 * This script:
 * 1. Zips each Lambda asset directory
 * 2. Uploads zips to the blueprints S3 bucket
 * 3. Rewrites the template to reference the blueprints bucket
 * 4. Writes the final template to dist/
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const CDK_OUT = path.resolve(__dirname, "../cdk/cdk.out");
const TEMPLATE_FILE = path.join(CDK_OUT, "SimplyReadableStack.template.json");
const ASSETS_FILE = path.join(CDK_OUT, "SimplyReadableStack.assets.json");
const DIST_DIR = path.resolve(__dirname, "../dist");
const OUTPUT_TEMPLATE = path.join(DIST_DIR, "simply-readable.template.json");

const BLUEPRINTS_BUCKET = process.env.BLUEPRINTS_BUCKET || "ndx-try-isb-blueprints-568672915267";
const ASSETS_PREFIX = "scenarios/simply-readable/assets";
const AWS_PROFILE = process.env.AWS_PROFILE || "NDX/InnovationSandboxHub";

console.log("Packaging CDK template for ISB deployment...\n");

// Read assets manifest
const assets = JSON.parse(fs.readFileSync(ASSETS_FILE, "utf8"));
const template = JSON.parse(fs.readFileSync(TEMPLATE_FILE, "utf8"));

// Collect unique asset hashes that need S3 upload (not inline ZipFile)
const assetEntries = Object.entries(assets.files).filter(
  ([, meta]) => meta.source.packaging === "zip"
);

console.log(`Found ${assetEntries.length} Lambda assets to package.\n`);

// Zip and upload each asset
fs.mkdirSync(DIST_DIR, { recursive: true });
const zipsDir = path.join(DIST_DIR, "asset-zips");
fs.mkdirSync(zipsDir, { recursive: true });

for (const [hash, meta] of assetEntries) {
  const assetDir = path.join(CDK_OUT, meta.source.path);
  const zipFile = path.join(zipsDir, `${hash}.zip`);

  if (!fs.existsSync(assetDir)) {
    console.warn(`  WARN: Asset dir not found: ${meta.source.path}`);
    continue;
  }

  // Create zip
  console.log(`  Zipping ${meta.displayName || hash}...`);
  execSync(`cd "${assetDir}" && zip -qr "${zipFile}" .`);

  // Upload to S3
  const s3Key = `${ASSETS_PREFIX}/${hash}.zip`;
  console.log(`  Uploading to s3://${BLUEPRINTS_BUCKET}/${s3Key}`);
  execSync(
    `aws s3 cp "${zipFile}" "s3://${BLUEPRINTS_BUCKET}/${s3Key}" --profile "${AWS_PROFILE}"`,
    { stdio: "pipe" }
  );
}

// Rewrite template: replace CDK bootstrap bucket references with blueprints bucket
console.log("\nRewriting template S3 references...");

let rewriteCount = 0;
for (const [logicalId, resource] of Object.entries(template.Resources)) {
  if (resource.Type !== "AWS::Lambda::Function") continue;
  const code = resource.Properties?.Code;
  if (!code?.S3Bucket) continue;

  // Check if it's the CDK bootstrap bucket reference
  const sub = code.S3Bucket?.["Fn::Sub"];
  if (sub && sub.includes("cdk-hnb659fds-assets")) {
    // Replace bucket with BlueprintsBucketName parameter ref
    code.S3Bucket = { Ref: "BlueprintsBucketName" };

    // Rewrite the S3Key to include the assets prefix
    const originalKey = code.S3Key;
    code.S3Key = `${ASSETS_PREFIX}/${originalKey}`;
    rewriteCount++;
  }
}

console.log(`  Rewrote ${rewriteCount} Lambda S3 references.`);

// Write output template
fs.writeFileSync(OUTPUT_TEMPLATE, JSON.stringify(template, null, 2));
console.log(`\nTemplate written to: ${OUTPUT_TEMPLATE}`);

// Also upload the template itself
const templateS3Key = "scenarios/simply-readable/simply-readable.template.json";
console.log(`Uploading template to s3://${BLUEPRINTS_BUCKET}/${templateS3Key}`);
execSync(
  `aws s3 cp "${OUTPUT_TEMPLATE}" "s3://${BLUEPRINTS_BUCKET}/${templateS3Key}" --profile "${AWS_PROFILE}"`,
  { stdio: "pipe" }
);

// Upload website build
console.log("\nUploading website build...");
const websiteBuildDir = path.resolve(__dirname, "../website-build");
if (fs.existsSync(websiteBuildDir)) {
  execSync(
    `aws s3 sync "${websiteBuildDir}" "s3://${BLUEPRINTS_BUCKET}/scenarios/simply-readable/website-build/" --profile "${AWS_PROFILE}" --delete`,
    { stdio: "pipe" }
  );
  console.log("  Website build uploaded.");
} else {
  console.warn("  WARN: website-build/ not found, skipping.");
}

// Cleanup zips
fs.rmSync(zipsDir, { recursive: true });

const templateSize = (fs.statSync(OUTPUT_TEMPLATE).size / 1024).toFixed(1);
console.log(`\nDone! Template size: ${templateSize} KB`);
console.log(`Deploy with: aws cloudformation deploy --template-file ${OUTPUT_TEMPLATE} --stack-name SimplyReadableStack --capabilities CAPABILITY_NAMED_IAM --s3-bucket <bucket> --profile NDX/SandboxUser`);
