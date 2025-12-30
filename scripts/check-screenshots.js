#!/usr/bin/env node

/**
 * Screenshot 404 Detection Script (Story 17.9)
 *
 * Validates all screenshot references in YAML data files against actual files.
 * Enables CI/CD checks to prevent future 404s.
 *
 * Usage:
 *   npm run check:screenshots
 *   node scripts/check-screenshots.js
 *
 * Exit codes:
 *   0 - All screenshots present
 *   1 - One or more screenshots missing
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PROJECT_ROOT = join(__dirname, '..');
const YAML_DIR = join(PROJECT_ROOT, 'src/_data/screenshots');
const SCREENSHOTS_DIR = join(PROJECT_ROOT, 'src/assets/images/screenshots');

// Scenarios to check
const SCENARIOS = [
  'localgov-drupal',
  'council-chatbot',
  'planning-ai',
  'foi-redaction',
  'smart-car-park',
  'text-to-speech',
  'quicksight-dashboard'
];

/**
 * Extract all screenshot filenames from a YAML file
 * @param {string} yamlPath - Path to YAML file
 * @returns {string[]} Array of filenames
 */
function extractFilenames(yamlPath) {
  const content = readFileSync(yamlPath, 'utf8');
  const data = yaml.load(content);
  const filenames = [];

  // Extract from steps section
  if (data.steps) {
    for (const step of data.steps) {
      if (step.screenshots) {
        for (const screenshot of step.screenshots) {
          if (screenshot.filename) {
            filenames.push(screenshot.filename);
          }
        }
      }
    }
  }

  // Extract from explore sections
  const exploreSections = ['architecture', 'experiments', 'limits', 'production'];
  if (data.explore) {
    for (const section of exploreSections) {
      if (data.explore[section]) {
        for (const screenshot of data.explore[section]) {
          if (screenshot.filename) {
            filenames.push(screenshot.filename);
          }
        }
      }
    }
  }

  return filenames;
}

/**
 * Check if all referenced screenshots exist
 * @returns {{ scenario: string, missing: string[], present: string[] }[]}
 */
function checkAllScreenshots() {
  const results = [];

  for (const scenario of SCENARIOS) {
    const yamlPath = join(YAML_DIR, `${scenario}.yaml`);
    const screenshotDir = join(SCREENSHOTS_DIR, scenario);

    // Check if YAML file exists
    if (!existsSync(yamlPath)) {
      console.warn(`Warning: YAML file not found: ${yamlPath}`);
      results.push({
        scenario,
        missing: ['YAML_FILE_NOT_FOUND'],
        present: []
      });
      continue;
    }

    // Extract filenames from YAML
    const expectedFiles = extractFilenames(yamlPath);
    const missing = [];
    const present = [];

    for (const filename of expectedFiles) {
      const filePath = join(screenshotDir, filename);
      if (existsSync(filePath)) {
        present.push(filename);
      } else {
        missing.push(filename);
      }
    }

    results.push({
      scenario,
      missing,
      present
    });
  }

  return results;
}

/**
 * Print results and exit with appropriate code
 */
function main() {
  console.log('='.repeat(60));
  console.log('Screenshot 404 Detection Check');
  console.log('='.repeat(60));
  console.log('');

  const results = checkAllScreenshots();

  let totalMissing = 0;
  let totalPresent = 0;

  for (const result of results) {
    const status = result.missing.length === 0 ? 'PASS' : 'FAIL';
    const statusColor = status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
    const resetColor = '\x1b[0m';

    console.log(`${statusColor}[${status}]${resetColor} ${result.scenario}`);
    console.log(`      Present: ${result.present.length}/${result.present.length + result.missing.length}`);

    if (result.missing.length > 0) {
      console.log('      Missing files:');
      for (const file of result.missing) {
        console.log(`        - ${file}`);
      }
    }
    console.log('');

    totalMissing += result.missing.length;
    totalPresent += result.present.length;
  }

  console.log('='.repeat(60));
  console.log(`Total: ${totalPresent} present, ${totalMissing} missing`);
  console.log('='.repeat(60));

  if (totalMissing > 0) {
    console.log('');
    console.log('\x1b[31mFAILED:\x1b[0m Some screenshots are missing!');
    console.log('Run screenshot capture to populate missing files.');
    process.exit(1);
  } else {
    console.log('');
    console.log('\x1b[32mPASSED:\x1b[0m All screenshots present.');
    process.exit(0);
  }
}

main();
