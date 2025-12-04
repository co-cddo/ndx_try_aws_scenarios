import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ScreenshotManifest } from '../../src/lib/screenshot-manifest.js';
import { compareImages, classifyDiff } from '../../src/lib/visual-regression.js';
import { generateDiffImage, generateHtmlReport, formatPrBody, generateTextSummary } from '../../src/lib/diff-report.js';
import type { RegressionReport } from '../../src/lib/visual-regression.js';
import { PNG } from 'pngjs';

// Create test PNG images programmatically
function createTestPng(width: number, height: number, color: { r: number; g: number; b: number }): Buffer {
  const png = new PNG({ width, height });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = color.r;     // R
      png.data[idx + 1] = color.g; // G
      png.data[idx + 2] = color.b; // B
      png.data[idx + 3] = 255;     // A
    }
  }

  return PNG.sync.write(png);
}

describe('Visual Regression Integration', () => {
  // Create test images
  const redImage = createTestPng(100, 100, { r: 255, g: 0, b: 0 });
  const greenImage = createTestPng(100, 100, { r: 0, g: 255, b: 0 });
  const sameRedImage = createTestPng(100, 100, { r: 255, g: 0, b: 0 });

  describe('End-to-End Comparison Workflow', () => {
    it('should complete full comparison workflow with identical images', () => {
      // Compare identical images
      const result = compareImages(redImage, sameRedImage);

      expect(result.diffPercentage).toBe(0);
      expect(classifyDiff(result.diffPercentage)).toBe('pass');
      expect(result.diffImage).toBeDefined();
      expect(result.diffImage.length).toBeGreaterThan(0);
    });

    it('should detect differences between different images', () => {
      // Compare different images
      const result = compareImages(redImage, greenImage);

      // All pixels should be different (100% diff)
      expect(result.diffPercentage).toBe(1);
      expect(classifyDiff(result.diffPercentage)).toBe('fail');
    });

    it('should generate valid diff image buffer', () => {
      const result = compareImages(redImage, greenImage);

      // Verify diff image is valid PNG
      const diffPng = PNG.sync.read(result.diffImage);
      expect(diffPng.width).toBe(100);
      expect(diffPng.height).toBe(100);
    });

    it('should classify thresholds correctly', () => {
      expect(classifyDiff(0.05)).toBe('pass');     // 5% < 10%
      expect(classifyDiff(0.09)).toBe('pass');     // 9% < 10%
      expect(classifyDiff(0.10)).toBe('review');   // 10% exactly
      expect(classifyDiff(0.12)).toBe('review');   // 12% in review range
      expect(classifyDiff(0.14)).toBe('review');   // 14% < 15%
      expect(classifyDiff(0.15)).toBe('fail');     // 15% exactly
      expect(classifyDiff(0.20)).toBe('fail');     // 20% > 15%
    });
  });

  describe('Diff Image Generation', () => {
    it('should generate diff image highlighting differences', () => {
      const diffBuffer = generateDiffImage(redImage, greenImage);

      // Verify it's a valid PNG
      const diffPng = PNG.sync.read(diffBuffer);
      expect(diffPng.width).toBe(100);
      expect(diffPng.height).toBe(100);

      // Check that diff image has pixels set (not all zeros)
      const hasNonZeroPixels = diffPng.data.some((val: number) => val > 0);
      expect(hasNonZeroPixels).toBe(true);
    });

    it('should throw error for mismatched dimensions', () => {
      const smallImage = createTestPng(50, 50, { r: 255, g: 0, b: 0 });

      expect(() => generateDiffImage(redImage, smallImage)).toThrow('Image dimensions mismatch');
    });
  });

  describe('Report Generation Integration', () => {
    const mockReport: RegressionReport = {
      batch_id: 'integration-test-batch',
      timestamp: new Date().toISOString(),
      results: [
        {
          screenshot_path: 'current/scenario1/page1.png',
          baseline_path: 'baselines/scenario1/page1.png',
          diff_percentage: 0.02,
          status: 'pass',
        },
        {
          screenshot_path: 'current/scenario1/page2.png',
          baseline_path: 'baselines/scenario1/page2.png',
          diff_percentage: 0.11,
          status: 'review',
          diff_image_path: 'diffs/integration-test-batch/scenario1/page2.png',
        },
        {
          screenshot_path: 'current/scenario2/page1.png',
          baseline_path: 'baselines/scenario2/page1.png',
          diff_percentage: 0.18,
          status: 'fail',
          diff_image_path: 'diffs/integration-test-batch/scenario2/page1.png',
        },
      ],
      summary: {
        total: 3,
        passed: 1,
        review: 1,
        failed: 1,
      },
    };

    it('should generate complete HTML report with all results', () => {
      const html = generateHtmlReport(mockReport);

      // Verify HTML structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('integration-test-batch');
      expect(html).toContain('Passed');
      expect(html).toContain('Needs Review');
      expect(html).toContain('Failed');
      expect(html).toContain('scenario1/page1.png');
      expect(html).toContain('scenario1/page2.png');
      expect(html).toContain('scenario2/page1.png');
    });

    it('should generate PR body with correct markdown formatting', () => {
      const prBody = formatPrBody(mockReport);

      expect(prBody).toContain('## 📸 Screenshot Baseline Update Required');
      expect(prBody).toContain('integration-test-batch');
      expect(prBody).toContain('| Status | Count |');
      expect(prBody).toContain('Needs Review');
      expect(prBody).toContain('scenario1/page2.png');
      expect(prBody).toContain('11.00%');
    });

    it('should generate text summary', () => {
      const summary = generateTextSummary(mockReport);

      expect(summary).toContain('integration-test-batch');
      expect(summary).toContain('1');  // passed count
      expect(summary).toContain('3');  // total count
    });
  });

  describe('Manifest Processing', () => {
    it('should process multi-scenario manifest correctly', () => {
      const manifest: ScreenshotManifest = {
        batch_id: 'multi-scenario-test',
        timestamp: new Date().toISOString(),
        duration_seconds: 120,
        scenarios: [
          {
            scenario_name: 'council-chatbot',
            status: 'success',
            screenshots: [
              {
                page: 'lambda-overview',
                filename: 'lambda-overview.png',
                dimensions: { width: 1920, height: 1080 },
                size_bytes: 50000,
                timestamp: new Date().toISOString(),
                cfn_template_version: 'v1.0.0',
              },
            ],
          },
          {
            scenario_name: 'planning-ai',
            status: 'partial',
            screenshots: [
              {
                page: 's3-bucket',
                filename: 's3-bucket.png',
                dimensions: { width: 1920, height: 1080 },
                size_bytes: 45000,
                timestamp: new Date().toISOString(),
              },
            ],
            errors: ['Failed to capture textract-detail'],
          },
        ],
      };

      // Verify manifest structure
      expect(manifest.scenarios).toHaveLength(2);
      expect(manifest.scenarios[0].scenario_name).toBe('council-chatbot');
      expect(manifest.scenarios[0].screenshots[0].cfn_template_version).toBe('v1.0.0');
      expect(manifest.scenarios[1].status).toBe('partial');
      expect(manifest.scenarios[1].errors).toContain('Failed to capture textract-detail');
    });
  });

  describe('Full Pipeline Integration', () => {
    it('should correctly chain comparison and report generation', () => {
      // Step 1: Compare images
      const comparisonResult = compareImages(redImage, greenImage);
      expect(comparisonResult.diffPercentage).toBe(1);

      // Step 2: Generate diff image
      const diffBuffer = generateDiffImage(redImage, greenImage);
      expect(diffBuffer.length).toBeGreaterThan(0);

      // Step 3: Create report
      const report: RegressionReport = {
        batch_id: 'pipeline-test',
        timestamp: new Date().toISOString(),
        results: [{
          screenshot_path: 'current/test/test.png',
          baseline_path: 'baselines/test/test.png',
          diff_percentage: comparisonResult.diffPercentage,
          status: classifyDiff(comparisonResult.diffPercentage),
          diff_image_path: 'diffs/pipeline-test/test.png',
        }],
        summary: {
          total: 1,
          passed: 0,
          review: 0,
          failed: 1,
        },
      };

      // Step 4: Generate outputs
      const html = generateHtmlReport(report);
      const prBody = formatPrBody(report);
      const textSummary = generateTextSummary(report);

      expect(html).toContain('pipeline-test');
      expect(html).toContain('Failed');
      expect(prBody).toContain('100.00%');
      expect(textSummary).toContain('pipeline-test');
    });
  });
});
