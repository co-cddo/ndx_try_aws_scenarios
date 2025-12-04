#!/usr/bin/env node

/**
 * Baseline Update Script
 *
 * Copies screenshots from S3 current/ to baselines/, tagging with
 * CloudFormation template version metadata.
 *
 * This script is triggered after a baseline-update PR is approved and merged.
 *
 * Usage:
 *   node scripts/update-baselines.mjs --bucket ndx-screenshots-123456 --batch-id 2025-11-29T03:00:00Z-abc123
 *
 * Environment Variables:
 *   AWS_REGION - AWS region (default: us-west-2)
 *   AWS_ACCESS_KEY_ID - AWS access key
 *   AWS_SECRET_ACCESS_KEY - AWS secret key
 */

import { S3Client, GetObjectCommand, PutObjectCommand, CopyObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// Parse command line arguments
const args = process.argv.slice(2);
const argsMap = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace(/^--/, '');
  argsMap[key] = args[i + 1];
}

const bucketName = argsMap.bucket || process.env.SCREENSHOT_BUCKET_NAME;
const batchId = argsMap['batch-id'];
const region = process.env.AWS_REGION || 'us-west-2';
const topicArn = argsMap['topic-arn'] || process.env.SNS_TOPIC_ARN;
const cfnVersion = argsMap['cfn-version'] || 'unknown';

if (!bucketName) {
  console.error('Error: --bucket or SCREENSHOT_BUCKET_NAME environment variable required');
  process.exit(1);
}

if (!batchId) {
  console.error('Error: --batch-id required');
  process.exit(1);
}

async function downloadManifest(bucketName, batchId, region) {
  const client = new S3Client({ region });
  const key = `manifests/${batchId}.json`;

  console.log(`Downloading manifest: s3://${bucketName}/${key}`);

  try {
    const response = await client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    }));

    if (!response.Body) {
      throw new Error('Manifest not found');
    }

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    return JSON.parse(buffer.toString('utf-8'));
  } catch (error) {
    console.error(`Failed to download manifest: ${error.message}`);
    throw error;
  }
}

async function copyToBaseline(bucketName, sourceKey, destKey, cfnVersion, region) {
  const client = new S3Client({ region });

  console.log(`  Copying: ${sourceKey} → ${destKey}`);

  await client.send(new CopyObjectCommand({
    Bucket: bucketName,
    CopySource: `${bucketName}/${sourceKey}`,
    Key: destKey,
    Metadata: {
      'cfn-template-version': cfnVersion,
      'baseline-updated': new Date().toISOString()
    },
    MetadataDirective: 'REPLACE'
  }));
}

async function updateBaselineManifest(bucketName, manifest, cfnVersion, region) {
  const client = new S3Client({ region });

  // Create baseline manifest
  const baselineManifest = {
    ...manifest,
    baseline_updated: new Date().toISOString(),
    cfn_template_version: cfnVersion,
    source_batch_id: manifest.batch_id
  };

  const key = `baselines/manifest-${manifest.batch_id}.json`;
  console.log(`Uploading baseline manifest: ${key}`);

  await client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: JSON.stringify(baselineManifest, null, 2),
    ContentType: 'application/json'
  }));
}

async function sendNotification(bucketName, batchId, totalCopied, topicArn, region) {
  if (!topicArn) {
    console.log('No SNS topic ARN provided, skipping notification');
    return;
  }

  const client = new SNSClient({ region });

  const subject = `Screenshot Baselines Updated - ${batchId}`;
  const message = `Screenshot baseline update completed successfully.

Batch ID: ${batchId}
Screenshots Updated: ${totalCopied}
Bucket: s3://${bucketName}/baselines/
Timestamp: ${new Date().toISOString()}

All new screenshots have been promoted to baselines and will be used for future visual regression tests.`;

  console.log(`Sending SNS notification to ${topicArn}`);

  await client.send(new PublishCommand({
    TopicArn: topicArn,
    Subject: subject,
    Message: message
  }));
}

async function main() {
  console.log('🔄 Baseline Update Starting...');
  console.log(`Bucket: ${bucketName}`);
  console.log(`Batch ID: ${batchId}`);
  console.log(`CloudFormation Version: ${cfnVersion}`);
  console.log(`Region: ${region}`);
  console.log('');

  try {
    // Download manifest
    const manifest = await downloadManifest(bucketName, batchId, region);
    console.log(`✅ Manifest loaded: ${manifest.scenarios.length} scenarios`);
    console.log('');

    let totalCopied = 0;

    // Copy each screenshot from current/ to baselines/
    for (const scenario of manifest.scenarios) {
      console.log(`📸 Processing scenario: ${scenario.scenario_name}`);

      for (const screenshot of scenario.screenshots) {
        const sourceKey = `current/${scenario.scenario_name}/${screenshot.filename}`;
        const destKey = `baselines/${scenario.scenario_name}/${screenshot.filename}`;

        await copyToBaseline(bucketName, sourceKey, destKey, cfnVersion, region);
        totalCopied++;
      }

      console.log(`  ✅ Copied ${scenario.screenshots.length} screenshots`);
    }

    console.log('');
    console.log(`✅ Total screenshots copied to baselines: ${totalCopied}`);

    // Update baseline manifest
    console.log('');
    await updateBaselineManifest(bucketName, manifest, cfnVersion, region);
    console.log('✅ Baseline manifest updated');

    // Send notification
    console.log('');
    await sendNotification(bucketName, batchId, totalCopied, topicArn, region);
    console.log('✅ Notification sent');

    console.log('');
    console.log('🎉 Baseline update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Baseline update FAILED with error:');
    console.error(error);
    process.exit(1);
  }
}

main();
