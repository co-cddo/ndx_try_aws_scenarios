import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import type { ScreenshotManifest } from './screenshot-manifest.js';

export interface RegressionResult {
  screenshot_path: string;
  baseline_path: string;
  diff_percentage: number;
  status: 'pass' | 'review' | 'fail';
  diff_image_path?: string;
  cfn_template_version?: string;
}

export interface RegressionReport {
  batch_id: string;
  timestamp: string;
  results: RegressionResult[];
  summary: {
    total: number;
    passed: number;
    review: number;
    failed: number;
  };
}

/**
 * Classifies diff percentage into pass/review/fail status
 * - <10% = pass (minor rendering differences)
 * - 10-15% = review (requires manual approval)
 * - >15% = fail (auto-fail, investigation required)
 */
export function classifyDiff(percentage: number): 'pass' | 'review' | 'fail' {
  if (percentage < 0.10) return 'pass';
  if (percentage < 0.15) return 'review';
  return 'fail';
}

/**
 * Compares two PNG images and returns diff percentage and diff image
 */
export function compareImages(
  currentBuffer: Buffer,
  baselineBuffer: Buffer
): { diffPercentage: number; diffImage: Buffer } {
  const img1 = PNG.sync.read(currentBuffer);
  const img2 = PNG.sync.read(baselineBuffer);

  // Ensure dimensions match
  if (img1.width !== img2.width || img1.height !== img2.height) {
    throw new Error(
      `Image dimensions mismatch: ${img1.width}x${img1.height} vs ${img2.width}x${img2.height}`
    );
  }

  const { width, height } = img1;
  const diff = new PNG({ width, height });

  // pixelmatch returns number of different pixels
  const numDiffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 } // 10% threshold for considering pixels different
  );

  const totalPixels = width * height;
  const diffPercentage = numDiffPixels / totalPixels;

  return {
    diffPercentage,
    diffImage: PNG.sync.write(diff)
  };
}

/**
 * Downloads baseline screenshot from S3
 * Returns null if baseline doesn't exist
 */
export async function downloadBaseline(
  scenario: string,
  filename: string,
  bucketName: string,
  region: string = 'us-west-2'
): Promise<Buffer | null> {
  const client = new S3Client({ region });
  const key = `baselines/${scenario}/${filename}`;

  try {
    const response = await client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    }));

    if (!response.Body) {
      return null;
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return null;
    }
    throw error;
  }
}

/**
 * Downloads current screenshot from S3
 */
export async function downloadCurrentScreenshot(
  scenario: string,
  filename: string,
  bucketName: string,
  region: string = 'us-west-2'
): Promise<Buffer> {
  const client = new S3Client({ region });
  const key = `current/${scenario}/${filename}`;

  const response = await client.send(new GetObjectCommand({
    Bucket: bucketName,
    Key: key
  }));

  if (!response.Body) {
    throw new Error(`Screenshot not found: ${key}`);
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Uploads diff image to S3
 */
export async function uploadDiffImage(
  diffBuffer: Buffer,
  path: string,
  bucketName: string,
  region: string = 'us-west-2'
): Promise<string> {
  const client = new S3Client({ region });
  const key = `diffs/${path}`;

  await client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: diffBuffer,
    ContentType: 'image/png'
  }));

  return `s3://${bucketName}/${key}`;
}

/**
 * Compares a single screenshot against its baseline
 */
export async function compareScreenshot(
  currentPath: string,
  baselinePath: string,
  scenario: string,
  filename: string,
  bucketName: string,
  batchId: string,
  region: string = 'us-west-2',
  cfnTemplateVersion?: string
): Promise<RegressionResult> {
  // Download current and baseline
  const currentBuffer = await downloadCurrentScreenshot(scenario, filename, bucketName, region);
  const baselineBuffer = await downloadBaseline(scenario, filename, bucketName, region);

  // If no baseline exists, mark as review (needs new baseline)
  if (!baselineBuffer) {
    return {
      screenshot_path: currentPath,
      baseline_path: `baselines/${scenario}/${filename} (not found)`,
      diff_percentage: 1.0,
      status: 'review',
      cfn_template_version: cfnTemplateVersion
    };
  }

  // Compare images
  const { diffPercentage, diffImage } = compareImages(currentBuffer, baselineBuffer);
  const status = classifyDiff(diffPercentage);

  // Upload diff image if not a pass
  let diffImagePath: string | undefined;
  if (status !== 'pass') {
    const diffFilename = `${batchId}/${scenario}/${filename}`;
    diffImagePath = await uploadDiffImage(diffImage, diffFilename, bucketName, region);
  }

  return {
    screenshot_path: currentPath,
    baseline_path: `baselines/${scenario}/${filename}`,
    diff_percentage: diffPercentage,
    status,
    diff_image_path: diffImagePath,
    cfn_template_version: cfnTemplateVersion
  };
}

/**
 * Compares all screenshots from a manifest against baselines
 */
export async function compareAllScreenshots(
  manifest: ScreenshotManifest,
  bucketName: string,
  region: string = 'us-west-2'
): Promise<RegressionReport> {
  const results: RegressionResult[] = [];

  for (const scenario of manifest.scenarios) {
    for (const screenshot of scenario.screenshots) {
      try {
        const result = await compareScreenshot(
          `current/${scenario.scenario_name}/${screenshot.filename}`,
          `baselines/${scenario.scenario_name}/${screenshot.filename}`,
          scenario.scenario_name,
          screenshot.filename,
          bucketName,
          manifest.batch_id,
          region,
          screenshot.cfn_template_version
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to compare ${screenshot.filename}:`, error);
        // Create a failed result
        results.push({
          screenshot_path: `current/${scenario.scenario_name}/${screenshot.filename}`,
          baseline_path: `baselines/${scenario.scenario_name}/${screenshot.filename}`,
          diff_percentage: 1.0,
          status: 'fail',
          cfn_template_version: screenshot.cfn_template_version
        });
      }
    }
  }

  // Calculate summary
  const summary = {
    total: results.length,
    passed: results.filter(r => r.status === 'pass').length,
    review: results.filter(r => r.status === 'review').length,
    failed: results.filter(r => r.status === 'fail').length
  };

  return {
    batch_id: manifest.batch_id,
    timestamp: new Date().toISOString(),
    results,
    summary
  };
}

/**
 * Publishes CloudWatch metrics for regression results
 */
export async function publishMetrics(
  report: RegressionReport,
  region: string = 'us-west-2'
): Promise<void> {
  const client = new CloudWatchClient({ region });

  const hasDrift = report.summary.review > 0 || report.summary.failed > 0;

  await client.send(new PutMetricDataCommand({
    Namespace: 'AWS/NDXScreenshot',
    MetricData: [
      {
        MetricName: 'screenshot_success_count',
        Value: report.summary.passed,
        Unit: 'Count',
        Timestamp: new Date(),
        Dimensions: [
          { Name: 'scenario', Value: 'all' }
        ]
      },
      {
        MetricName: 'screenshot_failure_count',
        Value: report.summary.failed,
        Unit: 'Count',
        Timestamp: new Date(),
        Dimensions: [
          { Name: 'scenario', Value: 'all' }
        ]
      },
      {
        MetricName: 'screenshot_drift_detected',
        Value: hasDrift ? 1 : 0,
        Unit: 'None',
        Timestamp: new Date(),
        Dimensions: [
          { Name: 'scenario', Value: 'all' }
        ]
      }
    ]
  }));
}

/**
 * Lists all baseline screenshots in S3
 */
export async function listBaselines(
  bucketName: string,
  region: string = 'us-west-2'
): Promise<string[]> {
  const client = new S3Client({ region });
  const baselines: string[] = [];

  let continuationToken: string | undefined;

  do {
    const response = await client.send(new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'baselines/',
      ContinuationToken: continuationToken
    }));

    if (response.Contents) {
      baselines.push(...response.Contents.map(obj => obj.Key!));
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return baselines;
}
