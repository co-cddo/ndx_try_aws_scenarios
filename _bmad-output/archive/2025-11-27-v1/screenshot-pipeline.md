# Screenshot Automation Pipeline

Story 6.6: Documentation for the exploration screenshot capture and visual regression testing pipeline.

## Overview

The screenshot automation pipeline captures screenshots of all exploration pages at multiple viewports, enabling:

- Consistent documentation across all scenarios
- Visual regression detection when UI changes
- Automated screenshot updates when exploration pages change

## Triggers

The pipeline runs automatically on:

1. **Deployment completion** - When the Build and Deploy workflow completes
2. **Weekly schedule** - Every Sunday at 2am UTC
3. **Manual trigger** - On-demand via GitHub Actions UI

## Usage

### Local Development

```bash
# Install dependencies (includes Playwright)
npm install

# Install Playwright browsers
npx playwright install chromium

# Build the site first
npm run build

# Run screenshot capture
npm run test:screenshots

# Run visual regression tests
npm run test:visual

# Run all Playwright tests
npm run test:playwright
```

### Manual Trigger via GitHub Actions

1. Go to Actions > Screenshot Capture
2. Click "Run workflow"
3. Select scenario to capture (all, council-chatbot, etc.)
4. Click "Run workflow"

## Output

Screenshots are saved to:
```
src/assets/images/walkthroughs/{scenario}/explore/
```

### Naming Convention
```
{page-name}-{viewport}.png
```

Examples:
- `landing-desktop.png`
- `experiments-mobile.png`
- `architecture-visual-desktop.png`
- `limits-challenge-mobile.png`

### Viewports

| Name | Dimensions | Device |
|------|------------|--------|
| desktop | 1280x800 | Desktop Chrome |
| mobile | 375x667 | iPhone SE |

## Visual Regression Testing

The pipeline includes visual regression tests with a 10% diff threshold:

- Screenshots are compared against baseline images
- Changes exceeding 10% are flagged as potential regressions
- Failed tests generate a report in `playwright-report/`

### Updating Baselines

When intentional UI changes are made:

```bash
# Update visual regression baselines
npx playwright test --update-snapshots
```

## File Size Limits

All screenshots must be under 500KB. The pipeline validates this and fails if any screenshot exceeds the limit.

## Configuration

### Playwright Config

See `playwright.config.ts` for:

- Viewport settings
- Visual regression thresholds
- Web server configuration

### GitHub Actions Workflow

See `.github/workflows/screenshot-capture.yml` for:

- Trigger conditions
- Screenshot capture steps
- Validation rules

## Troubleshooting

### Tests Fail Locally

Ensure the static site is built:
```bash
npm run build
```

### Browsers Not Installed

Install Playwright browsers:
```bash
npx playwright install --with-deps chromium
```

### Visual Regression Failures

Check the HTML report:
```bash
npx playwright show-report
```

## Extending for New Scenarios

When adding exploration pages for Epic 7-11 scenarios:

1. Add page configurations to `tests/screenshot-capture.spec.ts`
2. Create output directory: `src/assets/images/walkthroughs/{scenario}/explore/`
3. Update baseline screenshots: `npx playwright test --update-snapshots`
