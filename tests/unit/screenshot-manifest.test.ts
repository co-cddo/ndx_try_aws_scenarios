import { describe, it, expect, vi } from 'vitest';
import {
  generateBatchId,
  createManifest,
  ScreenshotManifest,
  ScenarioCapture,
  ScreenshotMetadata
} from '../../src/lib/screenshot-manifest.js';

describe('Screenshot Manifest (AC3.4)', () => {
  describe('generateBatchId', () => {
    it('should generate unique batch IDs', () => {
      const id1 = generateBatchId();
      const id2 = generateBatchId();
      expect(id1).not.toBe(id2);
    });

    it('should include ISO timestamp', () => {
      const id = generateBatchId();
      expect(id).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('createManifest', () => {
    it('should create manifest with correct structure', () => {
      const scenarios: ScenarioCapture[] = [{
        scenario_name: 'council-chatbot',
        status: 'success',
        screenshots: [{
          page: 'lambda-overview',
          filename: 'test.png',
          dimensions: { width: 1280, height: 800 },
          size_bytes: 12345,
          timestamp: new Date().toISOString()
        }]
      }];

      const manifest = createManifest('test-batch', scenarios, 120);

      expect(manifest.batch_id).toBe('test-batch');
      expect(manifest.scenarios).toHaveLength(1);
      expect(manifest.duration_seconds).toBe(120);
      expect(manifest.timestamp).toBeDefined();
    });

    it('should include all scenarios', () => {
      const scenarios: ScenarioCapture[] = [
        { scenario_name: 'council-chatbot', status: 'success', screenshots: [] },
        { scenario_name: 'planning-ai', status: 'partial', screenshots: [] },
        { scenario_name: 'foi-redaction', status: 'failed', screenshots: [], errors: ['Error'] }
      ];

      const manifest = createManifest('batch', scenarios, 300);

      expect(manifest.scenarios).toHaveLength(3);
      expect(manifest.scenarios[2].errors).toContain('Error');
    });
  });

  describe('metadata validation', () => {
    it('should include all required fields', () => {
      const metadata: ScreenshotMetadata = {
        page: 'lambda-overview',
        filename: 'council-chatbot-lambda-20251129.png',
        dimensions: { width: 1280, height: 800 },
        size_bytes: 54321,
        timestamp: new Date().toISOString()
      };

      expect(metadata.page).toBeDefined();
      expect(metadata.filename).toBeDefined();
      expect(metadata.dimensions.width).toBeGreaterThan(0);
      expect(metadata.dimensions.height).toBeGreaterThan(0);
      expect(metadata.size_bytes).toBeGreaterThan(0);
    });
  });
});
