#!/usr/bin/env node
/**
 * Image Optimization Script (Story 16.4)
 *
 * Converts and optimizes screenshot images for the NDX:Try AWS Scenarios portal.
 *
 * Features:
 * - Resizes images to 3 widths: 640w, 1024w, 1920w
 * - Converts to WebP format (quality: 85)
 * - Generates PNG fallbacks
 * - Strips metadata to reduce file size
 * - Targets <200KB per image
 *
 * Usage:
 *   npm run optimize-images                    # Process all images
 *   npm run optimize-images -- --source ./src  # Process from local directory
 *   npm run optimize-images -- --dry-run       # Show what would be processed
 *
 * Requirements:
 *   - Node.js 18+
 *   - Sharp (npm install --save-dev sharp)
 *
 * FR Coverage: FR145, NFR60
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // Output widths for responsive images
  widths: [640, 1024, 1920],

  // WebP quality (0-100, higher = better quality/larger file)
  webpQuality: 85,

  // PNG compression level (0-9, higher = smaller file/slower)
  pngCompressionLevel: 9,

  // Target max file size in bytes (200KB)
  targetMaxSize: 200 * 1024,

  // Source directories to process
  sourceDir: path.resolve(__dirname, '../src/assets/images/screenshots'),

  // Output directory for optimized images
  outputDir: path.resolve(__dirname, '../src/assets/images/screenshots/optimized'),

  // S3 bucket for screenshots
  s3Bucket: 'ndx-try-screenshots',
  s3Region: 'us-west-2',

  // Scenarios to process
  scenarios: [
    'council-chatbot',
    'planning-ai',
    'foi-redaction',
    'smart-car-park',
    'text-to-speech',
    'quicksight-dashboard'
  ]
};

/**
 * Process a single image and generate optimized versions
 * @param {string} inputPath - Path to source image
 * @param {string} outputDir - Directory for output files
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing results
 */
async function processImage(inputPath, outputDir, options = {}) {
  const { dryRun = false } = options;
  const filename = path.basename(inputPath, path.extname(inputPath));
  const results = {
    input: inputPath,
    outputs: [],
    errors: []
  };

  try {
    // Load the source image
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    console.log(`  Processing: ${path.basename(inputPath)} (${metadata.width}x${metadata.height})`);

    // Process each target width
    for (const width of CONFIG.widths) {
      // Skip if source is smaller than target
      if (metadata.width < width) {
        console.log(`    Skipping ${width}w (source is smaller)`);
        continue;
      }

      // Calculate proportional height
      const height = Math.round((width / metadata.width) * metadata.height);

      // Generate WebP version
      const webpFilename = `${filename}-${width}w.webp`;
      const webpPath = path.join(outputDir, webpFilename);

      if (!dryRun) {
        await sharp(inputPath)
          .resize(width, height, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: CONFIG.webpQuality })
          .toFile(webpPath);

        const webpStats = await fs.stat(webpPath);
        results.outputs.push({
          filename: webpFilename,
          format: 'webp',
          width,
          size: webpStats.size,
          underTarget: webpStats.size <= CONFIG.targetMaxSize
        });
        console.log(`    Created: ${webpFilename} (${formatBytes(webpStats.size)})`);
      } else {
        console.log(`    Would create: ${webpFilename}`);
      }

      // Generate PNG version (only for largest size as fallback)
      if (width === CONFIG.widths[CONFIG.widths.length - 1]) {
        const pngFilename = `${filename}.png`;
        const pngPath = path.join(outputDir, pngFilename);

        if (!dryRun) {
          await sharp(inputPath)
            .resize(width, height, { fit: 'inside', withoutEnlargement: true })
            .png({ compressionLevel: CONFIG.pngCompressionLevel })
            .toFile(pngPath);

          const pngStats = await fs.stat(pngPath);
          results.outputs.push({
            filename: pngFilename,
            format: 'png',
            width,
            size: pngStats.size,
            underTarget: pngStats.size <= CONFIG.targetMaxSize
          });
          console.log(`    Created: ${pngFilename} (${formatBytes(pngStats.size)})`);
        } else {
          console.log(`    Would create: ${pngFilename}`);
        }
      }
    }
  } catch (error) {
    results.errors.push(error.message);
    console.error(`    Error: ${error.message}`);
  }

  return results;
}

/**
 * Process all images in a directory
 * @param {string} sourceDir - Directory containing source images
 * @param {string} outputDir - Directory for output files
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing summary
 */
async function processDirectory(sourceDir, outputDir, options = {}) {
  const { dryRun = false } = options;
  const summary = {
    processed: 0,
    skipped: 0,
    errors: 0,
    totalOriginalSize: 0,
    totalOptimizedSize: 0,
    files: []
  };

  // Ensure output directory exists
  if (!dryRun) {
    await fs.mkdir(outputDir, { recursive: true });
  }

  // Find all PNG images
  let files;
  try {
    files = await fs.readdir(sourceDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`  Directory not found: ${sourceDir}`);
      return summary;
    }
    throw error;
  }

  const pngFiles = files.filter(f => f.toLowerCase().endsWith('.png'));

  if (pngFiles.length === 0) {
    console.log(`  No PNG files found in ${sourceDir}`);
    return summary;
  }

  console.log(`  Found ${pngFiles.length} PNG file(s) to process`);

  for (const file of pngFiles) {
    const inputPath = path.join(sourceDir, file);

    try {
      const inputStats = await fs.stat(inputPath);
      summary.totalOriginalSize += inputStats.size;

      const result = await processImage(inputPath, outputDir, options);
      summary.files.push(result);

      if (result.errors.length > 0) {
        summary.errors++;
      } else {
        summary.processed++;
        for (const output of result.outputs) {
          summary.totalOptimizedSize += output.size;
        }
      }
    } catch (error) {
      summary.errors++;
      console.error(`  Error processing ${file}: ${error.message}`);
    }
  }

  return summary;
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Main execution
 */
async function main() {
  console.log('========================================');
  console.log('NDX:Try Screenshot Image Optimizer');
  console.log('Story 16.4 - WebP Conversion');
  console.log('========================================\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const sourceArg = args.find(a => a.startsWith('--source='));
  const sourceDir = sourceArg ? sourceArg.split('=')[1] : CONFIG.sourceDir;

  if (dryRun) {
    console.log('DRY RUN MODE - No files will be created\n');
  }

  console.log(`Configuration:`);
  console.log(`  - Widths: ${CONFIG.widths.join(', ')}`);
  console.log(`  - WebP Quality: ${CONFIG.webpQuality}`);
  console.log(`  - Target Max Size: ${formatBytes(CONFIG.targetMaxSize)}`);
  console.log(`  - Source: ${sourceDir}`);
  console.log(`  - Output: ${CONFIG.outputDir}\n`);

  const overallSummary = {
    processed: 0,
    errors: 0,
    totalOriginalSize: 0,
    totalOptimizedSize: 0
  };

  // Check if source directory exists
  try {
    await fs.access(sourceDir);
  } catch (error) {
    console.log(`Source directory does not exist: ${sourceDir}`);
    console.log('This is expected for the initial setup - images will be processed when available.');
    console.log('\nTo process images:');
    console.log('  1. Create directory: mkdir -p src/assets/images/screenshots');
    console.log('  2. Add PNG screenshots to the directory');
    console.log('  3. Run: npm run optimize-images');
    process.exit(0);
  }

  // Process each scenario subdirectory
  for (const scenario of CONFIG.scenarios) {
    const scenarioSource = path.join(sourceDir, scenario);
    const scenarioOutput = path.join(CONFIG.outputDir, scenario);

    console.log(`\n[${scenario}]`);

    const summary = await processDirectory(scenarioSource, scenarioOutput, { dryRun });

    overallSummary.processed += summary.processed;
    overallSummary.errors += summary.errors;
    overallSummary.totalOriginalSize += summary.totalOriginalSize;
    overallSummary.totalOptimizedSize += summary.totalOptimizedSize;
  }

  // Print summary
  console.log('\n========================================');
  console.log('Summary');
  console.log('========================================');
  console.log(`Images processed: ${overallSummary.processed}`);
  console.log(`Errors: ${overallSummary.errors}`);

  if (overallSummary.totalOriginalSize > 0 && !dryRun) {
    const savings = overallSummary.totalOriginalSize - overallSummary.totalOptimizedSize;
    const savingsPercent = ((savings / overallSummary.totalOriginalSize) * 100).toFixed(1);
    console.log(`Original size: ${formatBytes(overallSummary.totalOriginalSize)}`);
    console.log(`Optimized size: ${formatBytes(overallSummary.totalOptimizedSize)}`);
    console.log(`Space saved: ${formatBytes(savings)} (${savingsPercent}%)`);
  }

  console.log('\nDone!');
  process.exit(overallSummary.errors > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
