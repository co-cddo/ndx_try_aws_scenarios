#!/usr/bin/env node
/**
 * Upload screenshot manifest to S3
 *
 * Usage: node scripts/upload-manifest.mjs <manifest-path>
 *
 * Environment variables required:
 * - SCREENSHOT_BUCKET_NAME: S3 bucket name
 * - AWS_REGION: AWS region (default: us-east-1)
 */

import { readFileSync } from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const manifestPath = process.argv[2];

if (!manifestPath) {
  console.error('Error: Manifest path required');
  console.error('Usage: node scripts/upload-manifest.mjs <manifest-path>');
  process.exit(1);
}

const bucketName = process.env.SCREENSHOT_BUCKET_NAME;
if (!bucketName) {
  console.error('Error: SCREENSHOT_BUCKET_NAME environment variable required');
  process.exit(1);
}

const region = process.env.AWS_REGION || 'us-east-1';

try {
  // Read manifest file
  const manifestContent = readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(manifestContent);

  // Upload to S3
  const client = new S3Client({ region });
  const key = `manifests/${manifest.batch_id}.json`;

  await client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: manifestContent,
    ContentType: 'application/json',
    Metadata: {
      'batch-id': manifest.batch_id,
      'timestamp': manifest.timestamp,
      'total-scenarios': manifest.scenarios.length.toString()
    }
  }));

  console.log(`Manifest uploaded successfully: s3://${bucketName}/${key}`);
  console.log(`Batch ID: ${manifest.batch_id}`);
  console.log(`Scenarios: ${manifest.scenarios.length}`);
  console.log(`Duration: ${manifest.duration_seconds}s`);
} catch (error) {
  console.error('Error uploading manifest:', error.message);
  process.exit(1);
}
