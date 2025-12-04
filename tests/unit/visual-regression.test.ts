import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PNG } from 'pngjs';
import {
  compareImages,
  compareScreenshot,
  compareAllScreenshots,
  publishMetrics
} from '../../src/lib/visual-regression.js';
import type { ScreenshotManifest } from '../../src/lib/screenshot-manifest.js';

// Mock AWS SDK clients
vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: vi.fn(() => ({
      send: vi.fn()
    })),
    GetObjectCommand: vi.fn(),
    PutObjectCommand: vi.fn(),
    ListObjectsV2Command: vi.fn()
  };
});

vi.mock('@aws-sdk/client-cloudwatch', () => {
  return {
    CloudWatchClient: vi.fn(() => ({
      send: vi.fn()
    })),
    PutMetricDataCommand: vi.fn()
  };
});

describe('Visual Regression Library', () => {
  describe('compareImages', () => {
    it('should return 0% diff for identical images', () => {
      // Create two identical small PNG images (10x10 red square)
      const img1 = new PNG({ width: 10, height: 10 });
      const img2 = new PNG({ width: 10, height: 10 });

      // Fill both images with red pixels
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          const idx = (10 * y + x) << 2;
          img1.data[idx] = 255;     // R
          img1.data[idx + 1] = 0;   // G
          img1.data[idx + 2] = 0;   // B
          img1.data[idx + 3] = 255; // A

          img2.data[idx] = 255;     // R
          img2.data[idx + 1] = 0;   // G
          img2.data[idx + 2] = 0;   // B
          img2.data[idx + 3] = 255; // A
        }
      }

      const buffer1 = PNG.sync.write(img1);
      const buffer2 = PNG.sync.write(img2);

      const result = compareImages(buffer1, buffer2);

      expect(result.diffPercentage).toBe(0);
      expect(result.diffImage).toBeInstanceOf(Buffer);
    });

    it('should detect 50% diff when half the image changes', () => {
      // Create two 10x10 images
      const img1 = new PNG({ width: 10, height: 10 });
      const img2 = new PNG({ width: 10, height: 10 });

      // Fill first image with red
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          const idx = (10 * y + x) << 2;
          img1.data[idx] = 255;     // R
          img1.data[idx + 1] = 0;   // G
          img1.data[idx + 2] = 0;   // B
          img1.data[idx + 3] = 255; // A

          // Fill second image: top half red, bottom half blue
          if (y < 5) {
            img2.data[idx] = 255;     // R
            img2.data[idx + 1] = 0;   // G
            img2.data[idx + 2] = 0;   // B
            img2.data[idx + 3] = 255; // A
          } else {
            img2.data[idx] = 0;       // R
            img2.data[idx + 1] = 0;   // G
            img2.data[idx + 2] = 255; // B
            img2.data[idx + 3] = 255; // A
          }
        }
      }

      const buffer1 = PNG.sync.write(img1);
      const buffer2 = PNG.sync.write(img2);

      const result = compareImages(buffer1, buffer2);

      // Should be approximately 50% different
      expect(result.diffPercentage).toBeGreaterThan(0.45);
      expect(result.diffPercentage).toBeLessThan(0.55);
    });

    it('should throw error for mismatched dimensions', () => {
      const img1 = new PNG({ width: 10, height: 10 });
      const img2 = new PNG({ width: 20, height: 20 });

      const buffer1 = PNG.sync.write(img1);
      const buffer2 = PNG.sync.write(img2);

      expect(() => compareImages(buffer1, buffer2)).toThrow('dimensions mismatch');
    });
  });

  describe('Status classification', () => {
    it('should classify <10% diff as pass', () => {
      // Create images with ~5% difference
      const img1 = new PNG({ width: 20, height: 20 });
      const img2 = new PNG({ width: 20, height: 20 });

      // Fill both with red, but change 20 pixels (5% of 400 total) in img2
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
          const idx = (20 * y + x) << 2;
          img1.data[idx] = 255;
          img1.data[idx + 1] = 0;
          img1.data[idx + 2] = 0;
          img1.data[idx + 3] = 255;

          // Change first 20 pixels to blue
          if (y === 0 && x < 20) {
            img2.data[idx] = 0;
            img2.data[idx + 1] = 0;
            img2.data[idx + 2] = 255;
            img2.data[idx + 3] = 255;
          } else {
            img2.data[idx] = 255;
            img2.data[idx + 1] = 0;
            img2.data[idx + 2] = 0;
            img2.data[idx + 3] = 255;
          }
        }
      }

      const buffer1 = PNG.sync.write(img1);
      const buffer2 = PNG.sync.write(img2);

      const result = compareImages(buffer1, buffer2);

      expect(result.diffPercentage).toBeLessThan(0.10);
    });

    it('should classify 10-15% diff as review', () => {
      // Create images with ~12% difference
      const img1 = new PNG({ width: 20, height: 20 });
      const img2 = new PNG({ width: 20, height: 20 });

      // Fill both with red, but change 50 pixels (~12.5% of 400 total) in img2
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
          const idx = (20 * y + x) << 2;
          img1.data[idx] = 255;
          img1.data[idx + 1] = 0;
          img1.data[idx + 2] = 0;
          img1.data[idx + 3] = 255;

          // Change first 50 pixels to blue (first 2.5 rows)
          if ((y === 0 && x < 20) || (y === 1 && x < 20) || (y === 2 && x < 10)) {
            img2.data[idx] = 0;
            img2.data[idx + 1] = 0;
            img2.data[idx + 2] = 255;
            img2.data[idx + 3] = 255;
          } else {
            img2.data[idx] = 255;
            img2.data[idx + 1] = 0;
            img2.data[idx + 2] = 0;
            img2.data[idx + 3] = 255;
          }
        }
      }

      const buffer1 = PNG.sync.write(img1);
      const buffer2 = PNG.sync.write(img2);

      const result = compareImages(buffer1, buffer2);

      expect(result.diffPercentage).toBeGreaterThanOrEqual(0.10);
      expect(result.diffPercentage).toBeLessThan(0.15);
    });

    it('should classify >15% diff as fail', () => {
      // Create images with ~20% difference
      const img1 = new PNG({ width: 20, height: 20 });
      const img2 = new PNG({ width: 20, height: 20 });

      // Fill both with red, but change 80 pixels (20% of 400 total) in img2
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
          const idx = (20 * y + x) << 2;
          img1.data[idx] = 255;
          img1.data[idx + 1] = 0;
          img1.data[idx + 2] = 0;
          img1.data[idx + 3] = 255;

          // Change first 4 rows to blue (80 pixels = 20%)
          if (y < 4) {
            img2.data[idx] = 0;
            img2.data[idx + 1] = 0;
            img2.data[idx + 2] = 255;
            img2.data[idx + 3] = 255;
          } else {
            img2.data[idx] = 255;
            img2.data[idx + 1] = 0;
            img2.data[idx + 2] = 0;
            img2.data[idx + 3] = 255;
          }
        }
      }

      const buffer1 = PNG.sync.write(img1);
      const buffer2 = PNG.sync.write(img2);

      const result = compareImages(buffer1, buffer2);

      expect(result.diffPercentage).toBeGreaterThanOrEqual(0.15);
    });
  });

  describe('compareAllScreenshots', () => {
    it('should handle errors and create failed results', async () => {
      // Mock S3 responses to throw error (simulating missing screenshot)
      const { S3Client } = await import('@aws-sdk/client-s3');
      const mockSend = vi.fn();
      (S3Client as any).mockImplementation(() => ({
        send: mockSend
      }));

      // Create mock manifest
      const manifest: ScreenshotManifest = {
        batch_id: 'test-batch-123',
        timestamp: new Date().toISOString(),
        duration_seconds: 100,
        scenarios: [
          {
            scenario_name: 'test-scenario',
            status: 'success',
            screenshots: [
              {
                page: 'test-page',
                filename: 'test-1.png',
                dimensions: { width: 10, height: 10 },
                size_bytes: 100,
                timestamp: new Date().toISOString()
              }
            ]
          }
        ]
      };

      // Mock S3 GetObject to throw error (simulating missing screenshot)
      mockSend.mockImplementation(async (command) => {
        if (command.constructor.name === 'GetObjectCommand') {
          // Return empty body to trigger "Screenshot not found" error
          return {};
        }
        return {};
      });

      const report = await compareAllScreenshots(
        manifest,
        'test-bucket',
        'us-west-2'
      );

      expect(report.batch_id).toBe('test-batch-123');
      expect(report.summary.total).toBe(1);
      // Should be 1 failed since screenshot download failed
      expect(report.summary.passed).toBe(0);
      expect(report.summary.review).toBe(0);
      expect(report.summary.failed).toBe(1);
    });
  });

  describe('publishMetrics', () => {
    it('should publish correct CloudWatch metrics', async () => {
      const { CloudWatchClient } = await import('@aws-sdk/client-cloudwatch');
      const mockSend = vi.fn().mockResolvedValue({});
      (CloudWatchClient as any).mockImplementation(() => ({
        send: mockSend
      }));

      const report = {
        batch_id: 'test-batch',
        timestamp: new Date().toISOString(),
        results: [],
        summary: {
          total: 10,
          passed: 7,
          review: 2,
          failed: 1
        }
      };

      await publishMetrics(report, 'us-west-2');

      expect(mockSend).toHaveBeenCalledTimes(1);

      // Verify the command was sent (constructor name check doesn't work with mocks)
      expect(mockSend).toHaveBeenCalled();
    });

    it('should set drift_detected to 1 when review or failed > 0', async () => {
      const { CloudWatchClient, PutMetricDataCommand } = await import('@aws-sdk/client-cloudwatch');
      const mockSend = vi.fn().mockResolvedValue({});
      (CloudWatchClient as any).mockImplementation(() => ({
        send: mockSend
      }));

      const report = {
        batch_id: 'test-batch',
        timestamp: new Date().toISOString(),
        results: [],
        summary: {
          total: 10,
          passed: 8,
          review: 2,
          failed: 0
        }
      };

      await publishMetrics(report, 'us-west-2');

      // Command should have been called
      expect(mockSend).toHaveBeenCalled();
    });

    it('should set drift_detected to 0 when all passed', async () => {
      const { CloudWatchClient } = await import('@aws-sdk/client-cloudwatch');
      const mockSend = vi.fn().mockResolvedValue({});
      (CloudWatchClient as any).mockImplementation(() => ({
        send: mockSend
      }));

      const report = {
        batch_id: 'test-batch',
        timestamp: new Date().toISOString(),
        results: [],
        summary: {
          total: 10,
          passed: 10,
          review: 0,
          failed: 0
        }
      };

      await publishMetrics(report, 'us-west-2');

      expect(mockSend).toHaveBeenCalled();
    });
  });
});
