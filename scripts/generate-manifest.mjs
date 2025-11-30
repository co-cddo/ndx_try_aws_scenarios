#!/usr/bin/env node
/**
 * Generate screenshot manifest from Playwright JSON test results
 *
 * Usage: node scripts/generate-manifest.mjs <test-results.json> <output.json> <batch-id> <duration> <status>
 *
 * Parses Playwright JSON reporter output and generates a ScreenshotManifest
 * with scenario data populated from test results.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

const testResultsPath = process.argv[2];
const outputPath = process.argv[3];
const batchId = process.argv[4];
const duration = parseInt(process.argv[5] || '0', 10);
const testStatus = process.argv[6] || 'unknown';

if (!testResultsPath || !outputPath || !batchId) {
  console.error('Usage: node scripts/generate-manifest.mjs <test-results.json> <output.json> <batch-id> <duration> <status>');
  process.exit(1);
}

/**
 * Parse scenario name from suite title
 * @param {string} title - Suite title like "Council Chatbot Screenshots"
 * @returns {string} - Scenario name like "council-chatbot"
 */
function parseScenarioName(title) {
  return title
    .toLowerCase()
    .replace(/ screenshots?$/i, '')
    .replace(/\s+/g, '-')
    .trim();
}

/**
 * Determine scenario status from test results
 * @param {Array} tests - Array of test results
 * @returns {'success' | 'partial' | 'failed'}
 */
function determineScenarioStatus(tests) {
  const passed = tests.filter(t => t.status === 'passed' || t.status === 'expected').length;
  const total = tests.length;

  if (passed === total) return 'success';
  if (passed > 0) return 'partial';
  return 'failed';
}

/**
 * Extract screenshot metadata from test result
 * @param {object} test - Test result object
 * @param {string} scenario - Scenario name
 * @returns {object} - Screenshot metadata
 */
function extractScreenshotMetadata(test, scenario) {
  // Extract page name from test title like "capture lambda-function-overview"
  const pageName = test.title.replace(/^capture\s+/i, '').trim();
  const timestamp = new Date().toISOString();
  const filename = `${scenario}-${pageName}-${timestamp.replace(/[:.]/g, '-')}.png`;

  return {
    page: pageName,
    filename,
    dimensions: { width: 1280, height: 800 }, // Default viewport
    size_bytes: 0, // Will be populated by actual capture
    timestamp,
    captured: test.status === 'passed' || test.status === 'expected'
  };
}

/**
 * Process Playwright JSON results into scenarios array
 * @param {object} results - Playwright JSON reporter output
 * @returns {Array} - Scenarios array for manifest
 */
function processTestResults(results) {
  const scenarios = [];

  // Handle different Playwright JSON output structures
  const suites = results.suites || [];

  for (const suite of suites) {
    // Skip if no specs (nested suite)
    if (!suite.specs && !suite.suites) continue;

    const scenarioName = parseScenarioName(suite.title || 'unknown');

    // Collect all tests from this suite (including nested)
    const tests = [];

    function collectTests(s) {
      if (s.specs) {
        for (const spec of s.specs) {
          tests.push({
            title: spec.title,
            status: spec.ok ? 'passed' : 'failed',
            error: spec.tests?.[0]?.results?.[0]?.error?.message
          });
        }
      }
      if (s.suites) {
        for (const nested of s.suites) {
          collectTests(nested);
        }
      }
    }

    collectTests(suite);

    if (tests.length === 0) continue;

    const status = determineScenarioStatus(tests);
    const screenshots = tests
      .filter(t => t.status === 'passed')
      .map(t => extractScreenshotMetadata(t, scenarioName));

    const errors = tests
      .filter(t => t.status !== 'passed' && t.error)
      .map(t => `${t.title}: ${t.error}`);

    scenarios.push({
      scenario_name: scenarioName,
      status,
      screenshots,
      ...(errors.length > 0 && { errors })
    });
  }

  return scenarios;
}

// Main execution
try {
  let scenarios = [];

  // Try to parse test results if file exists
  if (existsSync(testResultsPath)) {
    try {
      const testResultsContent = readFileSync(testResultsPath, 'utf-8');
      // Handle case where JSON reporter output might have console logs before it
      const jsonStart = testResultsContent.indexOf('{');
      if (jsonStart >= 0) {
        const testResults = JSON.parse(testResultsContent.substring(jsonStart));
        scenarios = processTestResults(testResults);
        console.log(`Parsed ${scenarios.length} scenarios from test results`);
      }
    } catch (parseError) {
      console.warn(`Warning: Could not parse test results: ${parseError.message}`);
      console.warn('Generating manifest with empty scenarios array');
    }
  } else {
    console.warn(`Warning: Test results file not found: ${testResultsPath}`);
    console.warn('Generating manifest with empty scenarios array');
  }

  // Calculate totals
  const totalScreenshots = scenarios.reduce((sum, s) => sum + s.screenshots.length, 0);
  const failedScenarios = scenarios.filter(s => s.status === 'failed').length;
  const partialScenarios = scenarios.filter(s => s.status === 'partial').length;

  // Generate manifest
  const manifest = {
    batch_id: batchId,
    timestamp: new Date().toISOString(),
    duration_seconds: duration,
    test_status: testStatus,
    summary: {
      total_scenarios: scenarios.length,
      successful_scenarios: scenarios.filter(s => s.status === 'success').length,
      partial_scenarios: partialScenarios,
      failed_scenarios: failedScenarios,
      total_screenshots: totalScreenshots
    },
    scenarios
  };

  // Write manifest to file
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

  console.log(`Manifest generated successfully: ${outputPath}`);
  console.log(`Batch ID: ${batchId}`);
  console.log(`Duration: ${duration}s`);
  console.log(`Scenarios: ${scenarios.length}`);
  console.log(`Screenshots: ${totalScreenshots}`);

  if (failedScenarios > 0) {
    console.warn(`Warning: ${failedScenarios} scenario(s) failed`);
  }
} catch (error) {
  console.error('Error generating manifest:', error.message);

  // Generate fallback manifest on error
  const fallbackManifest = {
    batch_id: batchId,
    timestamp: new Date().toISOString(),
    duration_seconds: duration,
    test_status: testStatus,
    summary: {
      total_scenarios: 0,
      successful_scenarios: 0,
      partial_scenarios: 0,
      failed_scenarios: 0,
      total_screenshots: 0
    },
    scenarios: [],
    error: error.message
  };

  writeFileSync(outputPath, JSON.stringify(fallbackManifest, null, 2));
  console.log(`Fallback manifest generated: ${outputPath}`);
  process.exit(0); // Don't fail the workflow
}
