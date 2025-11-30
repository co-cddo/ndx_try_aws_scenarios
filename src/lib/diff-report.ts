import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import type { RegressionReport, RegressionResult } from './visual-regression.js';

/**
 * Generates a diff image highlighting changes between current and baseline
 * Returns a PNG buffer with changed regions highlighted in red
 */
export function generateDiffImage(
  currentBuffer: Buffer,
  baselineBuffer: Buffer
): Buffer {
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

  // Generate diff with red highlights
  pixelmatch(img1.data, img2.data, diff.data, width, height, {
    threshold: 0.1,
    alpha: 0.5,
    diffColor: [255, 0, 0] // Red for differences
  });

  return PNG.sync.write(diff);
}

/**
 * Generates an HTML report with side-by-side screenshot comparisons
 */
export function generateHtmlReport(report: RegressionReport): string {
  const { summary, results, batch_id, timestamp } = report;

  // Group results by status
  const passedResults = results.filter(r => r.status === 'pass');
  const reviewResults = results.filter(r => r.status === 'review');
  const failedResults = results.filter(r => r.status === 'fail');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visual Regression Report - ${batch_id}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    h1 { color: #0b0c0c; }
    h2 {
      color: #1d70b8;
      margin-top: 40px;
      border-bottom: 2px solid #1d70b8;
      padding-bottom: 10px;
    }
    .summary {
      background: white;
      padding: 20px;
      border-radius: 4px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .summary-item {
      text-align: center;
      padding: 15px;
      border-radius: 4px;
    }
    .summary-item.passed { background-color: #d4edda; color: #155724; }
    .summary-item.review { background-color: #fff3cd; color: #856404; }
    .summary-item.failed { background-color: #f8d7da; color: #721c24; }
    .summary-item .count {
      font-size: 48px;
      font-weight: bold;
      display: block;
    }
    .summary-item .label {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .result-card {
      background: white;
      margin-bottom: 20px;
      padding: 20px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .result-card.passed { border-left: 4px solid #28a745; }
    .result-card.review { border-left: 4px solid #ffc107; }
    .result-card.failed { border-left: 4px solid #dc3545; }
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .result-path {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #666;
    }
    .result-status {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .result-status.passed { background-color: #28a745; color: white; }
    .result-status.review { background-color: #ffc107; color: #000; }
    .result-status.failed { background-color: #dc3545; color: white; }
    .diff-percentage {
      font-size: 18px;
      font-weight: bold;
      margin: 10px 0;
    }
    .image-comparison {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-top: 15px;
    }
    .image-box {
      text-align: center;
    }
    .image-box img {
      max-width: 100%;
      height: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .image-label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
      font-weight: bold;
    }
    .metadata {
      font-size: 12px;
      color: #666;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <h1>Visual Regression Report</h1>

  <div class="summary">
    <div><strong>Batch ID:</strong> ${batch_id}</div>
    <div><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</div>

    <div class="summary-grid">
      <div class="summary-item passed">
        <span class="count">${summary.passed}</span>
        <span class="label">Passed</span>
      </div>
      <div class="summary-item review">
        <span class="count">${summary.review}</span>
        <span class="label">Needs Review</span>
      </div>
      <div class="summary-item failed">
        <span class="count">${summary.failed}</span>
        <span class="label">Failed</span>
      </div>
      <div class="summary-item">
        <span class="count">${summary.total}</span>
        <span class="label">Total</span>
      </div>
    </div>
  </div>

  ${failedResults.length > 0 ? `
  <h2>❌ Failed (${failedResults.length})</h2>
  ${failedResults.map(result => renderResultCard(result)).join('\n')}
  ` : ''}

  ${reviewResults.length > 0 ? `
  <h2>⚠️ Needs Review (${reviewResults.length})</h2>
  ${reviewResults.map(result => renderResultCard(result)).join('\n')}
  ` : ''}

  ${passedResults.length > 0 ? `
  <h2>✅ Passed (${passedResults.length})</h2>
  ${passedResults.map(result => renderResultCard(result)).join('\n')}
  ` : ''}
</body>
</html>`;

  return html;
}

function renderResultCard(result: RegressionResult): string {
  const diffPercentageDisplay = (result.diff_percentage * 100).toFixed(2);

  return `
  <div class="result-card ${result.status}">
    <div class="result-header">
      <div class="result-path">${result.screenshot_path}</div>
      <div class="result-status ${result.status}">${result.status}</div>
    </div>
    <div class="diff-percentage">
      Difference: ${diffPercentageDisplay}%
    </div>
    ${result.diff_image_path ? `
    <div class="image-comparison">
      <div class="image-box">
        <img src="${result.screenshot_path}" alt="Current">
        <div class="image-label">Current</div>
      </div>
      <div class="image-box">
        <img src="${result.baseline_path}" alt="Baseline">
        <div class="image-label">Baseline</div>
      </div>
      <div class="image-box">
        <img src="${result.diff_image_path}" alt="Diff">
        <div class="image-label">Diff (highlighted)</div>
      </div>
    </div>
    ` : ''}
    ${result.cfn_template_version ? `
    <div class="metadata">
      <strong>CloudFormation Template Version:</strong> ${result.cfn_template_version}
    </div>
    ` : ''}
  </div>`;
}

/**
 * Formats a regression report as GitHub PR body markdown
 */
export function formatPrBody(report: RegressionReport): string {
  const { summary, results, batch_id, timestamp } = report;

  // Group results by status
  const reviewResults = results.filter(r => r.status === 'review');
  const failedResults = results.filter(r => r.status === 'fail');

  let body = `## 📸 Screenshot Baseline Update Required

**Batch ID:** \`${batch_id}\`
**Timestamp:** ${new Date(timestamp).toLocaleString()}

### Summary

| Status | Count |
|--------|-------|
| ✅ Passed | ${summary.passed} |
| ⚠️ Needs Review | ${summary.review} |
| ❌ Failed | ${summary.failed} |
| **Total** | **${summary.total}** |

---

`;

  if (failedResults.length > 0) {
    body += `### ❌ Auto-Failed Screenshots (>15% difference)

These screenshots have significant changes and require investigation before baseline update:

`;
    for (const result of failedResults) {
      const diffPercentage = (result.diff_percentage * 100).toFixed(2);
      body += `- \`${result.screenshot_path}\` - **${diffPercentage}%** difference\n`;
      if (result.diff_image_path) {
        body += `  - [View Diff](${result.diff_image_path})\n`;
      }
    }
    body += '\n';
  }

  if (reviewResults.length > 0) {
    body += `### ⚠️ Screenshots Needing Review (10-15% difference)

These screenshots have moderate changes and need manual approval:

`;
    for (const result of reviewResults) {
      const diffPercentage = (result.diff_percentage * 100).toFixed(2);
      body += `- \`${result.screenshot_path}\` - **${diffPercentage}%** difference\n`;
      if (result.diff_image_path) {
        body += `  - [View Diff](${result.diff_image_path})\n`;
      }
    }
    body += '\n';
  }

  body += `---

### Actions Required

1. **Review the diff images** in the links above
2. **Verify the changes** are intentional (e.g., from CloudFormation template updates)
3. **Approve this PR** if changes look correct
4. **Close this PR** if changes indicate a problem

Once approved and merged, the baseline update workflow will automatically update the baselines in S3.

---

<details>
<summary>📋 Full Report Details</summary>

\`\`\`json
${JSON.stringify(report, null, 2)}
\`\`\`

</details>
`;

  return body;
}

/**
 * Generates a plain text summary suitable for notifications
 */
export function generateTextSummary(report: RegressionReport): string {
  const { summary, batch_id } = report;

  let status = '✅ All screenshots match baselines';
  if (summary.failed > 0) {
    status = `❌ ${summary.failed} screenshot(s) failed (>15% diff)`;
  } else if (summary.review > 0) {
    status = `⚠️ ${summary.review} screenshot(s) need review (10-15% diff)`;
  }

  return `Visual Regression Report - ${batch_id}

${status}

Summary:
- Passed: ${summary.passed}
- Review: ${summary.review}
- Failed: ${summary.failed}
- Total: ${summary.total}`;
}
