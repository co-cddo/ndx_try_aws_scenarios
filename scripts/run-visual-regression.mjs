#!/usr/bin/env node

/**
 * Visual Regression CLI Script
 *
 * Downloads latest screenshots from S3, compares against baselines,
 * generates diff images and reports, publishes CloudWatch metrics.
 *
 * Usage:
 *   node scripts/run-visual-regression.mjs --bucket ndx-screenshots-123456 --batch-id 2025-11-29T03:00:00Z-abc123
 *
 * Environment Variables:
 *   AWS_REGION - AWS region (default: us-west-2)
 *   AWS_ACCESS_KEY_ID - AWS access key
 *   AWS_SECRET_ACCESS_KEY - AWS secret key
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { compareAllScreenshots, publishMetrics } from '../src/lib/visual-regression.js';
import { generateHtmlReport, formatPrBody, generateTextSummary } from '../src/lib/diff-report.js';
import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
const outputDir = argsMap.output || join(__dirname, '..', 'regression-reports');

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

async function main() {
  console.log('🔍 Visual Regression Detection Starting...');
  console.log(`Bucket: ${bucketName}`);
  console.log(`Batch ID: ${batchId}`);
  console.log(`Region: ${region}`);
  console.log('');

  try {
    // Download manifest
    const manifest = await downloadManifest(bucketName, batchId, region);
    console.log(`✅ Manifest loaded: ${manifest.scenarios.length} scenarios`);

    // Compare all screenshots
    console.log('🔄 Comparing screenshots against baselines...');
    const report = await compareAllScreenshots(manifest, bucketName, region);

    console.log('');
    console.log('📊 Comparison Results:');
    console.log(`  - Passed: ${report.summary.passed}`);
    console.log(`  - Review: ${report.summary.review}`);
    console.log(`  - Failed: ${report.summary.failed}`);
    console.log(`  - Total: ${report.summary.total}`);
    console.log('');

    // Create output directory
    mkdirSync(outputDir, { recursive: true });

    // Save JSON report
    const jsonPath = join(outputDir, `${batchId}.json`);
    writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`✅ JSON report saved: ${jsonPath}`);

    // Generate HTML report
    const htmlReport = generateHtmlReport(report);
    const htmlPath = join(outputDir, `${batchId}.html`);
    writeFileSync(htmlPath, htmlReport);
    console.log(`✅ HTML report saved: ${htmlPath}`);

    // Generate PR body (if needed)
    const needsReview = report.summary.review > 0 || report.summary.failed > 0;
    if (needsReview) {
      const prBody = formatPrBody(report);
      const prBodyPath = join(outputDir, `${batchId}-pr-body.md`);
      writeFileSync(prBodyPath, prBody);
      console.log(`✅ PR body saved: ${prBodyPath}`);
    }

    // Generate text summary
    const textSummary = generateTextSummary(report);
    const summaryPath = join(outputDir, `${batchId}-summary.txt`);
    writeFileSync(summaryPath, textSummary);
    console.log(`✅ Text summary saved: ${summaryPath}`);

    // Publish CloudWatch metrics
    console.log('');
    console.log('📤 Publishing CloudWatch metrics...');
    await publishMetrics(report, region);
    console.log('✅ Metrics published to CloudWatch');

    // Output for GitHub Actions (using new GITHUB_OUTPUT file approach)
    console.log('');
    console.log('::group::GitHub Actions Outputs');
    const githubOutput = process.env.GITHUB_OUTPUT;
    if (githubOutput) {
      appendFileSync(githubOutput, `needs_review=${needsReview}\n`);
      appendFileSync(githubOutput, `passed=${report.summary.passed}\n`);
      appendFileSync(githubOutput, `review=${report.summary.review}\n`);
      appendFileSync(githubOutput, `failed=${report.summary.failed}\n`);
      appendFileSync(githubOutput, `total=${report.summary.total}\n`);
      appendFileSync(githubOutput, `report_path=${jsonPath}\n`);
      appendFileSync(githubOutput, `html_path=${htmlPath}\n`);
      if (needsReview) {
        appendFileSync(githubOutput, `pr_body_path=${prBodyPath}\n`);
      }
      console.log('Outputs written to GITHUB_OUTPUT');
    } else {
      // Fallback for local development
      console.log(`needs_review=${needsReview}`);
      console.log(`passed=${report.summary.passed}`);
      console.log(`review=${report.summary.review}`);
      console.log(`failed=${report.summary.failed}`);
      console.log(`total=${report.summary.total}`);
      console.log(`report_path=${jsonPath}`);
      console.log(`html_path=${htmlPath}`);
      if (needsReview) {
        console.log(`pr_body_path=${prBodyPath}`);
      }
    }
    console.log('::endgroup::');

    console.log('');
    if (report.summary.failed > 0) {
      console.log('❌ Visual regression FAILED - some screenshots exceeded 15% threshold');
      process.exit(1);
    } else if (report.summary.review > 0) {
      console.log('⚠️ Visual regression REVIEW REQUIRED - some screenshots need manual approval');
      process.exit(0); // Don't fail, but create PR for review
    } else {
      console.log('✅ Visual regression PASSED - all screenshots match baselines');
      process.exit(0);
    }
  } catch (error) {
    console.error('');
    console.error('❌ Visual regression FAILED with error:');
    console.error(error);
    process.exit(1);
  }
}

main();
