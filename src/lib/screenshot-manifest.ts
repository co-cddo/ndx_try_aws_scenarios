import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export interface ScreenshotManifest {
  batch_id: string;
  timestamp: string;
  duration_seconds: number;
  scenarios: ScenarioCapture[];
}

export interface ScenarioCapture {
  scenario_name: string;
  status: 'success' | 'partial' | 'failed';
  screenshots: ScreenshotMetadata[];
  errors?: string[];
}

export interface ScreenshotMetadata {
  page: string;
  filename: string;
  dimensions: { width: number; height: number };
  size_bytes: number;
  timestamp: string;
  cfn_template_version?: string;
}

export function generateBatchId(): string {
  const now = new Date().toISOString();
  const random = Math.random().toString(36).substring(2, 8);
  return `${now}-${random}`;
}

export function createManifest(
  batchId: string,
  scenarios: ScenarioCapture[],
  durationSeconds: number
): ScreenshotManifest {
  return {
    batch_id: batchId,
    timestamp: new Date().toISOString(),
    duration_seconds: durationSeconds,
    scenarios
  };
}

export async function uploadManifestToS3(
  manifest: ScreenshotManifest,
  bucketName: string,
  region: string = 'us-west-2'
): Promise<void> {
  const client = new S3Client({ region });
  const key = `manifests/${manifest.batch_id}.json`;

  await client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: JSON.stringify(manifest, null, 2),
    ContentType: 'application/json'
  }));
}

export async function uploadScreenshotToS3(
  screenshot: Buffer,
  filename: string,
  scenario: string,
  bucketName: string,
  region: string = 'us-west-2'
): Promise<void> {
  const client = new S3Client({ region });
  const key = `current/${scenario}/${filename}`;

  await client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: screenshot,
    ContentType: 'image/png'
  }));
}

export async function sendNotification(
  manifest: ScreenshotManifest,
  topicArn: string,
  region: string = 'us-west-2'
): Promise<void> {
  const client = new SNSClient({ region });

  const totalScreenshots = manifest.scenarios.reduce(
    (sum, s) => sum + s.screenshots.length, 0
  );
  const failedScenarios = manifest.scenarios.filter(s => s.status === 'failed');

  const subject = failedScenarios.length > 0
    ? `Screenshot Capture FAILED: ${failedScenarios.length} scenario(s)`
    : `Screenshot Capture SUCCESS: ${totalScreenshots} screenshots`;

  const message = JSON.stringify({
    batch_id: manifest.batch_id,
    timestamp: manifest.timestamp,
    duration_seconds: manifest.duration_seconds,
    total_screenshots: totalScreenshots,
    scenarios: manifest.scenarios.map(s => ({
      name: s.scenario_name,
      status: s.status,
      count: s.screenshots.length,
      errors: s.errors
    }))
  }, null, 2);

  await client.send(new PublishCommand({
    TopicArn: topicArn,
    Subject: subject,
    Message: message
  }));
}
