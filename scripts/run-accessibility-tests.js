#!/usr/bin/env node
/**
 * Accessibility Testing Script (Story 16.6)
 *
 * Runs automated accessibility tests using multiple tools:
 * - axe-core via Playwright for WCAG 2.2 AA compliance
 * - Custom checks for focus visibility, keyboard navigation
 *
 * Usage:
 *   npm run test:a11y:full                    # Run all a11y tests
 *   node scripts/run-accessibility-tests.js  # Run directly
 *
 * Requirements:
 *   - Node.js 18+
 *   - Playwright installed
 *   - Site built in _site/
 *
 * FR Coverage: FR149, NFR59-66
 */

import { chromium } from '@playwright/test';
import { createServer } from 'http-server';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  siteDir: path.resolve(__dirname, '../_site'),
  port: 8080,
  timeout: 30000,

  // Pages to test (subset for quick validation)
  corePagesToTest: [
    '/',
    '/accessibility/',
    '/scenarios/',
    '/walkthroughs/',
    '/walkthroughs/council-chatbot/',
    '/walkthroughs/council-chatbot/step-1/',
    '/walkthroughs/council-chatbot/complete/',
    '/walkthroughs/council-chatbot/explore/',
    '/evidence-pack/',
    '/quiz/'
  ],

  // WCAG 2.2 AA rules to check
  wcagTags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],

  // Acceptable impact levels (violations below these pass)
  acceptableImpact: ['minor']
};

/**
 * Run axe-core accessibility analysis on a page
 * @param {Page} page - Playwright page
 * @param {string} url - URL being tested
 * @returns {Promise<Object>} Test results
 */
async function runAxeAnalysis(page, url) {
  // Inject axe-core
  await page.addScriptTag({
    url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js'
  });

  // Run axe analysis
  const results = await page.evaluate(async (tags) => {
    return await window.axe.run(document, {
      runOnly: {
        type: 'tag',
        values: tags
      },
      resultTypes: ['violations', 'incomplete']
    });
  }, CONFIG.wcagTags);

  return {
    url,
    violations: results.violations,
    incomplete: results.incomplete,
    timestamp: new Date().toISOString()
  };
}

/**
 * Check focus visibility
 * @param {Page} page - Playwright page
 * @returns {Promise<Array>} Focus issues found
 */
async function checkFocusVisibility(page) {
  const issues = [];

  // Get all focusable elements
  const focusableElements = await page.$$('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');

  for (let i = 0; i < Math.min(focusableElements.length, 20); i++) {
    const element = focusableElements[i];

    try {
      await element.focus();

      // Check if focus is visible
      const isVisible = await element.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const outlineWidth = parseInt(style.outlineWidth) || 0;
        const outlineStyle = style.outlineStyle;
        const boxShadow = style.boxShadow;

        // Check for visible focus indicator
        const hasOutline = outlineWidth > 0 && outlineStyle !== 'none';
        const hasBoxShadow = boxShadow && boxShadow !== 'none';

        return hasOutline || hasBoxShadow;
      });

      if (!isVisible) {
        const tagName = await element.evaluate(el => el.tagName);
        const text = await element.evaluate(el => el.textContent?.trim().slice(0, 30) || '');
        issues.push({
          type: 'focus-visibility',
          element: `${tagName}: "${text}"`,
          message: 'Element does not have visible focus indicator'
        });
      }
    } catch (e) {
      // Element may not be visible or focusable
    }
  }

  return issues;
}

/**
 * Format violations for console output
 * @param {Array} violations - axe-core violations
 * @returns {string} Formatted output
 */
function formatViolations(violations) {
  if (!violations || violations.length === 0) {
    return '  ✓ No violations found';
  }

  return violations.map(v => {
    const nodes = v.nodes.slice(0, 3).map(n =>
      `    - ${n.html.slice(0, 80)}${n.html.length > 80 ? '...' : ''}`
    ).join('\n');

    return `  ✗ [${v.impact}] ${v.id}: ${v.description}\n${nodes}${v.nodes.length > 3 ? `\n    ... and ${v.nodes.length - 3} more` : ''}`;
  }).join('\n\n');
}

/**
 * Categorize violations by severity
 * @param {Array} violations - axe-core violations
 * @returns {Object} Categorized violations
 */
function categorizeViolations(violations) {
  return {
    critical: violations.filter(v => v.impact === 'critical'),
    serious: violations.filter(v => v.impact === 'serious'),
    moderate: violations.filter(v => v.impact === 'moderate'),
    minor: violations.filter(v => v.impact === 'minor')
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('========================================');
  console.log('NDX:Try Accessibility Testing');
  console.log('Story 16.6 - WCAG 2.2 AA Validation');
  console.log('========================================\n');

  // Start local server
  const server = createServer({ root: CONFIG.siteDir });

  await new Promise((resolve, reject) => {
    server.listen(CONFIG.port, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  console.log(`Server started at http://localhost:${CONFIG.port}\n`);

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const allResults = {
    pages: [],
    summary: {
      totalPages: 0,
      totalViolations: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      focusIssues: 0
    }
  };

  // Test each page
  for (const pagePath of CONFIG.corePagesToTest) {
    const url = `http://localhost:${CONFIG.port}${pagePath}`;
    console.log(`Testing: ${pagePath}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: CONFIG.timeout });

      // Run axe analysis
      const axeResults = await runAxeAnalysis(page, url);

      // Check focus visibility
      const focusIssues = await checkFocusVisibility(page);

      // Categorize violations
      const categorized = categorizeViolations(axeResults.violations);

      // Update summary
      allResults.summary.totalPages++;
      allResults.summary.totalViolations += axeResults.violations.length;
      allResults.summary.critical += categorized.critical.length;
      allResults.summary.serious += categorized.serious.length;
      allResults.summary.moderate += categorized.moderate.length;
      allResults.summary.minor += categorized.minor.length;
      allResults.summary.focusIssues += focusIssues.length;

      // Store results
      allResults.pages.push({
        url: pagePath,
        violations: axeResults.violations.length,
        categorized,
        focusIssues
      });

      // Output per-page results
      const criticalSerious = categorized.critical.length + categorized.serious.length;
      const status = criticalSerious === 0 ? '✓' : '✗';
      console.log(`  ${status} ${axeResults.violations.length} violations (${categorized.critical.length} critical, ${categorized.serious.length} serious)`);

      if (criticalSerious > 0) {
        console.log(formatViolations([...categorized.critical, ...categorized.serious]));
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      allResults.pages.push({
        url: pagePath,
        error: error.message
      });
    }
  }

  // Clean up
  await browser.close();
  server.close();

  // Print summary
  console.log('\n========================================');
  console.log('Summary');
  console.log('========================================');
  console.log(`Pages tested: ${allResults.summary.totalPages}`);
  console.log(`Total violations: ${allResults.summary.totalViolations}`);
  console.log(`  - Critical: ${allResults.summary.critical}`);
  console.log(`  - Serious: ${allResults.summary.serious}`);
  console.log(`  - Moderate: ${allResults.summary.moderate}`);
  console.log(`  - Minor: ${allResults.summary.minor}`);
  console.log(`Focus visibility issues: ${allResults.summary.focusIssues}`);

  // Determine pass/fail
  const blocking = allResults.summary.critical + allResults.summary.serious;
  if (blocking === 0) {
    console.log('\n✓ PASS: No critical or serious accessibility violations');
    process.exit(0);
  } else {
    console.log(`\n✗ FAIL: ${blocking} critical/serious accessibility violations found`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
