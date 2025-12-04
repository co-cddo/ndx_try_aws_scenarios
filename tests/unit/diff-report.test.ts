import { describe, it, expect } from 'vitest';
import { PNG } from 'pngjs';
import {
  generateDiffImage,
  generateHtmlReport,
  formatPrBody,
  generateTextSummary
} from '../../src/lib/diff-report.js';
import type { RegressionReport } from '../../src/lib/visual-regression.js';

describe('Diff Report Generator', () => {
  describe('generateDiffImage', () => {
    it('should generate diff image for different images', () => {
      // Create two different 10x10 images
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

          // Fill second image with blue
          img2.data[idx] = 0;       // R
          img2.data[idx + 1] = 0;   // G
          img2.data[idx + 2] = 255; // B
          img2.data[idx + 3] = 255; // A
        }
      }

      const buffer1 = PNG.sync.write(img1);
      const buffer2 = PNG.sync.write(img2);

      const diffImage = generateDiffImage(buffer1, buffer2);

      expect(diffImage).toBeInstanceOf(Buffer);
      expect(diffImage.length).toBeGreaterThan(0);

      // Verify it's a valid PNG
      const parsed = PNG.sync.read(diffImage);
      expect(parsed.width).toBe(10);
      expect(parsed.height).toBe(10);
    });

    it('should generate diff image for identical images', () => {
      // Create two identical images
      const img1 = new PNG({ width: 10, height: 10 });
      const img2 = new PNG({ width: 10, height: 10 });

      // Fill both with red
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          const idx = (10 * y + x) << 2;
          img1.data[idx] = 255;
          img1.data[idx + 1] = 0;
          img1.data[idx + 2] = 0;
          img1.data[idx + 3] = 255;

          img2.data[idx] = 255;
          img2.data[idx + 1] = 0;
          img2.data[idx + 2] = 0;
          img2.data[idx + 3] = 255;
        }
      }

      const buffer1 = PNG.sync.write(img1);
      const buffer2 = PNG.sync.write(img2);

      const diffImage = generateDiffImage(buffer1, buffer2);

      expect(diffImage).toBeInstanceOf(Buffer);
      expect(diffImage.length).toBeGreaterThan(0);
    });

    it('should throw error for mismatched dimensions', () => {
      const img1 = new PNG({ width: 10, height: 10 });
      const img2 = new PNG({ width: 20, height: 20 });

      const buffer1 = PNG.sync.write(img1);
      const buffer2 = PNG.sync.write(img2);

      expect(() => generateDiffImage(buffer1, buffer2)).toThrow('dimensions mismatch');
    });
  });

  describe('generateHtmlReport', () => {
    it('should generate valid HTML report', () => {
      const report: RegressionReport = {
        batch_id: 'test-batch-123',
        timestamp: new Date('2025-11-29T12:00:00Z').toISOString(),
        results: [
          {
            screenshot_path: 'current/test-scenario/test-1.png',
            baseline_path: 'baselines/test-scenario/test-1.png',
            diff_percentage: 0.05,
            status: 'pass'
          },
          {
            screenshot_path: 'current/test-scenario/test-2.png',
            baseline_path: 'baselines/test-scenario/test-2.png',
            diff_percentage: 0.12,
            status: 'review',
            diff_image_path: 's3://bucket/diffs/test-batch-123/test-scenario/test-2.png'
          },
          {
            screenshot_path: 'current/test-scenario/test-3.png',
            baseline_path: 'baselines/test-scenario/test-3.png',
            diff_percentage: 0.20,
            status: 'fail',
            diff_image_path: 's3://bucket/diffs/test-batch-123/test-scenario/test-3.png',
            cfn_template_version: 'v1.2.3'
          }
        ],
        summary: {
          total: 3,
          passed: 1,
          review: 1,
          failed: 1
        }
      };

      const html = generateHtmlReport(report);

      // Verify HTML structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('Visual Regression Report');
      expect(html).toContain('test-batch-123');

      // Verify summary counts
      expect(html).toContain('>1<'); // passed count
      expect(html).toContain('>1<'); // review count
      expect(html).toContain('>1<'); // failed count
      expect(html).toContain('>3<'); // total count

      // Verify sections
      expect(html).toContain('Failed');
      expect(html).toContain('Needs Review');
      expect(html).toContain('Passed');

      // Verify diff percentages
      expect(html).toContain('5.00%');
      expect(html).toContain('12.00%');
      expect(html).toContain('20.00%');

      // Verify CFN version
      expect(html).toContain('v1.2.3');
    });

    it('should handle empty results', () => {
      const report: RegressionReport = {
        batch_id: 'empty-batch',
        timestamp: new Date().toISOString(),
        results: [],
        summary: {
          total: 0,
          passed: 0,
          review: 0,
          failed: 0
        }
      };

      const html = generateHtmlReport(report);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('empty-batch');
      expect(html).toContain('>0<');
    });

    it('should group results by status', () => {
      const report: RegressionReport = {
        batch_id: 'grouped-batch',
        timestamp: new Date().toISOString(),
        results: [
          {
            screenshot_path: 'current/scenario/pass-1.png',
            baseline_path: 'baselines/scenario/pass-1.png',
            diff_percentage: 0.01,
            status: 'pass'
          },
          {
            screenshot_path: 'current/scenario/pass-2.png',
            baseline_path: 'baselines/scenario/pass-2.png',
            diff_percentage: 0.02,
            status: 'pass'
          },
          {
            screenshot_path: 'current/scenario/review-1.png',
            baseline_path: 'baselines/scenario/review-1.png',
            diff_percentage: 0.11,
            status: 'review'
          }
        ],
        summary: {
          total: 3,
          passed: 2,
          review: 1,
          failed: 0
        }
      };

      const html = generateHtmlReport(report);

      // Should show passed section with 2 items
      expect(html).toContain('Passed (2)');

      // Should show review section with 1 item
      expect(html).toContain('Needs Review (1)');

      // Should not show failed section
      expect(html).not.toContain('Failed (0)');
    });
  });

  describe('formatPrBody', () => {
    it('should format PR body with markdown', () => {
      const report: RegressionReport = {
        batch_id: 'test-batch-456',
        timestamp: new Date('2025-11-29T15:00:00Z').toISOString(),
        results: [
          {
            screenshot_path: 'current/scenario/review-1.png',
            baseline_path: 'baselines/scenario/review-1.png',
            diff_percentage: 0.12,
            status: 'review',
            diff_image_path: 's3://bucket/diffs/batch/review-1.png'
          },
          {
            screenshot_path: 'current/scenario/fail-1.png',
            baseline_path: 'baselines/scenario/fail-1.png',
            diff_percentage: 0.20,
            status: 'fail',
            diff_image_path: 's3://bucket/diffs/batch/fail-1.png'
          }
        ],
        summary: {
          total: 2,
          passed: 0,
          review: 1,
          failed: 1
        }
      };

      const prBody = formatPrBody(report);

      // Verify markdown structure
      expect(prBody).toContain('## 📸 Screenshot Baseline Update Required');
      expect(prBody).toContain('**Batch ID:**');
      expect(prBody).toContain('test-batch-456');

      // Verify summary table
      expect(prBody).toContain('| Status | Count |');
      expect(prBody).toContain('| ✅ Passed | 0 |');
      expect(prBody).toContain('| ⚠️ Needs Review | 1 |');
      expect(prBody).toContain('| ❌ Failed | 1 |');

      // Verify failed section
      expect(prBody).toContain('### ❌ Auto-Failed Screenshots');
      expect(prBody).toContain('20.00%');
      expect(prBody).toContain('fail-1.png');

      // Verify review section
      expect(prBody).toContain('### ⚠️ Screenshots Needing Review');
      expect(prBody).toContain('12.00%');
      expect(prBody).toContain('review-1.png');

      // Verify actions section
      expect(prBody).toContain('### Actions Required');
      expect(prBody).toContain('Review the diff images');
    });

    it('should handle only passed screenshots', () => {
      const report: RegressionReport = {
        batch_id: 'all-pass',
        timestamp: new Date().toISOString(),
        results: [
          {
            screenshot_path: 'current/scenario/pass-1.png',
            baseline_path: 'baselines/scenario/pass-1.png',
            diff_percentage: 0.05,
            status: 'pass'
          }
        ],
        summary: {
          total: 1,
          passed: 1,
          review: 0,
          failed: 0
        }
      };

      const prBody = formatPrBody(report);

      expect(prBody).toContain('## 📸 Screenshot Baseline Update Required');
      expect(prBody).not.toContain('### ❌ Auto-Failed Screenshots');
      expect(prBody).not.toContain('### ⚠️ Screenshots Needing Review');
    });
  });

  describe('generateTextSummary', () => {
    it('should generate text summary for all passed', () => {
      const report: RegressionReport = {
        batch_id: 'summary-batch',
        timestamp: new Date().toISOString(),
        results: [],
        summary: {
          total: 10,
          passed: 10,
          review: 0,
          failed: 0
        }
      };

      const summary = generateTextSummary(report);

      expect(summary).toContain('Visual Regression Report - summary-batch');
      expect(summary).toContain('✅ All screenshots match baselines');
      expect(summary).toContain('Passed: 10');
      expect(summary).toContain('Review: 0');
      expect(summary).toContain('Failed: 0');
      expect(summary).toContain('Total: 10');
    });

    it('should generate text summary for failures', () => {
      const report: RegressionReport = {
        batch_id: 'fail-batch',
        timestamp: new Date().toISOString(),
        results: [],
        summary: {
          total: 10,
          passed: 7,
          review: 1,
          failed: 2
        }
      };

      const summary = generateTextSummary(report);

      expect(summary).toContain('❌ 2 screenshot(s) failed');
      expect(summary).toContain('Passed: 7');
      expect(summary).toContain('Review: 1');
      expect(summary).toContain('Failed: 2');
    });

    it('should generate text summary for reviews', () => {
      const report: RegressionReport = {
        batch_id: 'review-batch',
        timestamp: new Date().toISOString(),
        results: [],
        summary: {
          total: 10,
          passed: 8,
          review: 2,
          failed: 0
        }
      };

      const summary = generateTextSummary(report);

      expect(summary).toContain('⚠️ 2 screenshot(s) need review');
      expect(summary).toContain('Passed: 8');
      expect(summary).toContain('Review: 2');
      expect(summary).toContain('Failed: 0');
    });
  });
});
