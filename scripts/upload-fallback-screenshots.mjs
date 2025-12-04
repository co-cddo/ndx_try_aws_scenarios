#!/usr/bin/env node

/**
 * Fallback Screenshot Upload Script
 * Story: S0.5 - Reference Deployment Environment
 *
 * Uploads screenshots to S3 fallback/ prefix with disclaimer metadata.
 * These screenshots are used when the reference stack is unavailable.
 *
 * AC5.6: Fallback screenshots stored in S3 fallback/ prefix with disclaimer
 *
 * Usage:
 *   node scripts/upload-fallback-screenshots.mjs <scenario> <screenshot-path> [<template-version>]
 *
 * Example:
 *   node scripts/upload-fallback-screenshots.mjs council-chatbot ./screenshots/lambda.png v1.0.0
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { readFile } from 'fs/promises';
import { basename } from 'path';

// ============================================================================
// Configuration
// ============================================================================

const BUCKET_NAME = process.env.SCREENSHOT_BUCKET_NAME || `ndx-screenshots-${process.env.AWS_ACCOUNT_ID}`;
const REGION = process.env.AWS_REGION || 'us-west-2';

const DISCLAIMER_TEXT =
  'This screenshot was captured from a previous deployment and may not reflect current state';

const VALID_SCENARIOS = [
  'council-chatbot',
  'planning-ai',
  'foi-redaction',
  'smart-car-park',
  'text-to-speech',
  'quicksight',
];

// ============================================================================
// AWS Client
// ============================================================================

const s3Client = new S3Client({ region: REGION });

// ============================================================================
// Upload Functions (Exported for Testing)
// ============================================================================

/**
 * Upload fallback screenshot with metadata
 * @param {string} scenario - Scenario name
 * @param {string} screenshotPath - Local path to screenshot file
 * @param {string} templateVersion - Template version (git tag)
 * @param {string} bucketName - S3 bucket name
 * @returns {Promise<{key: string, url: string}>}
 */
export async function uploadFallbackScreenshot(
  scenario,
  screenshotPath,
  templateVersion,
  bucketName
) {
  // Validate scenario
  if (!VALID_SCENARIOS.includes(scenario)) {
    throw new Error(
      `Invalid scenario: ${scenario}. Must be one of: ${VALID_SCENARIOS.join(', ')}`
    );
  }

  // Read screenshot file
  const fileBuffer = await readFile(screenshotPath);
  const fileName = basename(screenshotPath);

  // Build S3 key
  const key = `fallback/${scenario}/${fileName}`;

  // Upload with metadata
  const captureDate = new Date().toISOString();

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: 'image/png',
      Metadata: {
        'original-capture-date': captureDate,
        'template-version': templateVersion,
        disclaimer: DISCLAIMER_TEXT,
        scenario: scenario,
      },
    })
  );

  const url = `https://${bucketName}.s3.${REGION}.amazonaws.com/${key}`;

  return { key, url };
}

/**
 * Check if fallback screenshot exists
 * @param {string} scenario - Scenario name
 * @param {string} fileName - Screenshot file name
 * @param {string} bucketName - S3 bucket name
 * @returns {Promise<{exists: boolean, metadata?: object}>}
 */
export async function checkFallbackExists(scenario, fileName, bucketName) {
  const key = `fallback/${scenario}/${fileName}`;

  try {
    const response = await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );

    return {
      exists: true,
      metadata: response.Metadata,
    };
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return { exists: false };
    }
    throw error;
  }
}

/**
 * List all fallback screenshots for a scenario
 * @param {string} scenario - Scenario name
 * @param {string} bucketName - S3 bucket name
 * @returns {Promise<string[]>} - Array of screenshot keys
 */
export async function listFallbackScreenshots(scenario, bucketName) {
  const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');

  const prefix = `fallback/${scenario}/`;

  try {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
      })
    );

    return (response.Contents || []).map((obj) => obj.Key).filter(Boolean);
  } catch (error) {
    if (error.name === 'NoSuchBucket') {
      throw new Error(`Bucket '${bucketName}' not found`);
    }
    throw error;
  }
}

// ============================================================================
// CLI Functions
// ============================================================================

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: upload-fallback-screenshots.mjs <scenario> <screenshot-path> [<template-version>]');
    console.error('\nScenarios:');
    for (const scenario of VALID_SCENARIOS) {
      console.error(`  - ${scenario}`);
    }
    process.exit(1);
  }

  const [scenario, screenshotPath, templateVersion = 'unknown'] = args;

  return { scenario, screenshotPath, templateVersion };
}

/**
 * Main function for CLI execution
 */
async function main() {
  const { scenario, screenshotPath, templateVersion } = parseArgs();

  console.log('Fallback Screenshot Upload');
  console.log('─────────────────────────');
  console.log(`Scenario: ${scenario}`);
  console.log(`Screenshot: ${screenshotPath}`);
  console.log(`Template Version: ${templateVersion}`);
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log('');

  // Check if screenshot already exists
  const fileName = basename(screenshotPath);
  const existingCheck = await checkFallbackExists(scenario, fileName, BUCKET_NAME);

  if (existingCheck.exists) {
    console.log('⚠️  Warning: Fallback screenshot already exists');
    console.log('Existing metadata:', existingCheck.metadata);
    console.log('Overwriting...\n');
  }

  // Upload screenshot
  const result = await uploadFallbackScreenshot(
    scenario,
    screenshotPath,
    templateVersion,
    BUCKET_NAME
  );

  console.log('✓ Upload successful!');
  console.log(`  Key: ${result.key}`);
  console.log(`  URL: ${result.url}`);
  console.log(`  Disclaimer: "${DISCLAIMER_TEXT}"`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
