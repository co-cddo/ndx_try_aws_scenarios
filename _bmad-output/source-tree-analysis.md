# NDX:Try AWS Scenarios - Source Tree Analysis

**Date:** 2025-12-23
**Scan Type:** Exhaustive
**Total Source Files:** ~200+ (excluding node_modules, _site)

## Directory Structure Overview

```
ndx_try_aws_scenarios/
│
├── 📁 src/                           # Portal source files (web)
│   ├── 📁 _data/                    # Eleventy data files
│   ├── 📁 _includes/                # Nunjucks templates
│   ├── 📁 scenarios/                # Scenario detail pages
│   ├── 📁 walkthroughs/             # Step-by-step guides
│   ├── 📁 next-steps/               # Post-scenario guidance
│   ├── 📁 lib/                      # TypeScript utilities
│   └── 📁 assets/                   # Static assets
│
├── 📁 cloudformation/               # AWS IaC templates (infra)
│   ├── 📁 scenarios/                # Per-scenario templates
│   ├── 📁 functions/                # Lambda functions
│   ├── 📁 layers/                   # Lambda layers
│   └── 📁 screenshot-automation/    # Automation infra
│
├── 📁 schemas/                      # JSON schemas
├── 📁 scripts/                      # Build utilities
├── 📁 tests/                        # Test files
├── 📁 docs/                         # Project documentation
│
├── 📄 eleventy.config.js            # Eleventy configuration
├── 📄 package.json                  # Node.js dependencies
├── 📄 playwright.config.ts          # Playwright config
├── 📄 vitest.config.ts              # Vitest config
└── 📄 README.md                     # Project readme
```

## Portal Source (`src/`)

### Data Files (`src/_data/`)

Central configuration driving the entire portal:

| File | Purpose | Key Contents |
|------|---------|--------------|
| `scenarios.yaml` | **Master scenario data** | 6 scenarios with metadata, deployment config, metrics |
| `navigation.yaml` | Navigation structure | Menu items, dropdowns |
| `site.yaml` | Site-wide config | URLs, branding |
| `quizConfig.yaml` | Quiz configuration | Questions, scoring |
| `walkthroughs.yaml` | Walkthrough steps | Per-scenario step configs |
| `phase-config.yaml` | Phase definitions | Explore/Deploy/Reflect phases |

**Scenario-Specific Data:**
- `exploration/*.yaml` - Exploration activity configs per scenario
- `screenshots/*.yaml` - Screenshot manifest per scenario
- `chatbot-sample-questions.yaml` - Sample chatbot questions
- `foi-sample-documents.yaml` - FOI sample document data
- `planning-sample-documents.yaml` - Planning document samples
- `smart-car-park-sample-data.yaml` - IoT sample data
- `text-to-speech-sample-data.yaml` - TTS content samples
- `quicksight-sample-data.yaml` - Dashboard sample data

### Templates (`src/_includes/`)

#### Layouts (`src/_includes/layouts/`)

| Layout | Purpose |
|--------|---------|
| `base.njk` | Base HTML layout |
| `scenario.njk` | Scenario detail pages |
| `walkthrough.njk` | Walkthrough pages |
| `exploration.njk` | Exploration activity pages |
| `next-steps.njk` | Post-scenario guidance |

#### Components (`src/_includes/components/`)

**Core Components:**
| Component | Purpose |
|-----------|---------|
| `scenario-card.njk` | Scenario gallery cards |
| `phase-navigator.njk` | Phase navigation (Explore/Deploy/Reflect) |
| `walkthrough-step.njk` | Walkthrough step display |
| `screenshot.njk` | Screenshot with lightbox |
| `screenshot-gallery.njk` | Multiple screenshots |
| `deployment-guide.njk` | CloudFormation deployment |
| `deployment-success.njk` | Post-deploy guidance |
| `sample-data-panel.njk` | Sample data explanation |
| `cost-transparency.njk` | Cost information |
| `free-trial-banner.njk` | FREE trial messaging |

**Exploration Components (`src/_includes/components/exploration/`):**
| Component | Purpose |
|-----------|---------|
| `activity-card.njk` | Exploration activity cards |
| `experiment-card.njk` | Experiment configuration |
| `safe-badge.njk` | "Safe to try" indicators |
| `simplify-toggle.njk` | Complexity toggle |
| `time-estimate.njk` | Time estimate display |

**Evidence Pack Components (`src/_includes/evidence-pack/`):**
- `base.njk` - Evidence pack base layout
- `sections/*.njk` - 12 evidence pack sections (executive-summary, roi-projection, security-compliance, etc.)
- `partials/*.njk` - Reusable partials

### Pages (`src/`)

**Top-Level Pages:**
| Page | Route | Purpose |
|------|-------|---------|
| `index.md` | `/` | Homepage |
| `quiz.md` | `/quiz/` | Scenario selector quiz |
| `get-started.njk` | `/get-started/` | Getting started guide |
| `partner-tour.njk` | `/partner-tour/` | Partner-led tour |
| `success-stories.njk` | `/success-stories/` | Council case studies |
| `analytics.md` | `/analytics/` | Analytics dashboard |
| `cost-analysis.md` | `/cost-analysis/` | Cost analysis tool |
| `contact.md` | `/contact/` | Contact page |
| `privacy.md` | `/privacy/` | Privacy policy |
| `accessibility.md` | `/accessibility/` | Accessibility statement |

**Scenario Pages (`src/scenarios/`):**
- `index.njk` - Scenario gallery
- `council-chatbot.njk`
- `planning-ai.njk`
- `foi-redaction.njk`
- `smart-car-park.njk`
- `text-to-speech.njk`
- `quicksight-dashboard.njk`

**Next Steps Pages (`src/next-steps/`):**
- Per-scenario guidance pages

### TypeScript Utilities (`src/lib/`)

| File | Purpose |
|------|---------|
| `aws-federation.ts` | AWS federation helper |
| `console-url-builder.ts` | AWS Console URL generation |
| `screenshot-manifest.ts` | Screenshot manifest types |
| `visual-regression.ts` | Visual regression utilities |
| `circuit-breaker.ts` | Circuit breaker pattern |
| `diff-report.ts` | Diff report generation |

---

## AWS CloudFormation (`cloudformation/`)

### Scenario Templates (`cloudformation/scenarios/`)

Each scenario has a `template.yaml` file:

| Scenario | AWS Services | Lines |
|----------|--------------|-------|
| `council-chatbot/` | Bedrock (Nova Pro), Lambda, S3 | ~437 |
| `planning-ai/` | Textract, Comprehend, Bedrock, Lambda, S3 | ~300+ |
| `foi-redaction/` | Comprehend PII, Textract, Lambda, S3 | ~300+ |
| `smart-car-park/` | IoT Core, Timestream, QuickSight, Lambda | ~400+ |
| `text-to-speech/` | Polly, Lambda, S3, API Gateway | ~200+ |
| `quicksight-dashboard/` | QuickSight, Glue, S3 | ~300+ |

### Lambda Functions (`cloudformation/functions/`)

| Function | Purpose |
|----------|---------|
| `sample-data-seeder/` | Seeds sample data for scenarios |

### Lambda Layers (`cloudformation/layers/`)

| Layer | Purpose | Location |
|-------|---------|----------|
| `uk-data-generator/` | UK council sample data generator | Python package |

### Screenshot Automation (`cloudformation/screenshot-automation/`)

Infrastructure for automated screenshot capture:

| Template | Purpose |
|----------|---------|
| `reference-stack.yaml` | Reference deployment stack |
| `iam.yaml` | IAM roles for automation |
| `s3-bucket.yaml` | Screenshot storage |
| `health-check.yaml` | Health monitoring |
| `monitoring.yaml` | CloudWatch alarms |
| `sample-data.yaml` | Sample data setup |

---

## Schemas (`schemas/`)

JSON schemas for data validation:

| Schema | Validates |
|--------|-----------|
| `scenario.schema.json` | `src/_data/scenarios.yaml` |
| `quiz-config.schema.json` | `src/_data/quizConfig.yaml` |
| `sample-data.schema.json` | Sample data files |

---

## Scripts (`scripts/`)

Build and utility scripts:

| Script | Purpose |
|--------|---------|
| `validate-schema.js` | Validate YAML against schemas |
| `check-screenshots.js` | Check screenshot availability |
| `optimize-images.js` | Image optimization |
| `run-accessibility-tests.js` | Full accessibility suite |
| `generate-manifest.mjs` | Generate screenshot manifest |
| `update-baselines.mjs` | Update visual baselines |
| `run-visual-regression.mjs` | Run visual regression tests |
| `upload-fallback-screenshots.mjs` | Upload fallback screenshots |
| `verify-reference-stack.mjs` | Verify AWS stack health |

---

## Tests (`tests/`)

| Test File | Framework | Purpose |
|-----------|-----------|---------|
| `visual-regression.spec.ts` | Playwright | Visual regression testing |
| `keyboard-navigation.spec.ts` | Playwright | Keyboard accessibility |
| `screenshot-capture.spec.ts` | Playwright | Screenshot automation |
| `unit/*.test.ts` | Vitest | Unit tests |

---

## Configuration Files

| File | Purpose |
|------|---------|
| `eleventy.config.js` | Eleventy static site config |
| `package.json` | Node.js dependencies and scripts |
| `playwright.config.ts` | Playwright E2E config |
| `vitest.config.ts` | Vitest unit test config |
| `.pa11yci.json` | Pa11y accessibility config |
| `lighthouserc.js` | Lighthouse CI config |
| `.mcp.json` | MCP server config |
| `.nvmrc` | Node version (20) |
| `.gitignore` | Git ignore patterns |

---

## Key Entry Points

### For Portal Development

1. **Add new page**: Create in `src/`, Eleventy auto-discovers
2. **Add component**: Create in `src/_includes/components/`
3. **Modify scenario data**: Edit `src/_data/scenarios.yaml`
4. **Add walkthrough step**: Edit `src/_data/walkthroughs.yaml`
5. **Configure build**: Edit `eleventy.config.js`

### For AWS Scenario Development

1. **Modify scenario**: Edit `cloudformation/scenarios/{name}/template.yaml`
2. **Add Lambda function**: Create in `cloudformation/functions/{name}/`
3. **Add Lambda layer**: Create in `cloudformation/layers/{name}/`
4. **Update sample data**: Edit `cloudformation/layers/uk-data-generator/`

### For Testing

1. **Add unit test**: Create in `tests/unit/*.test.ts`
2. **Add E2E test**: Create in `tests/*.spec.ts`
3. **Add accessibility test**: Edit `.pa11yci.json`

---

## File Count Summary

| Directory | File Count | Primary Types |
|-----------|-----------|---------------|
| `src/_data/` | ~30 | YAML, JSON |
| `src/_includes/` | ~50+ | Nunjucks |
| `src/scenarios/` | 7 | Nunjucks |
| `cloudformation/scenarios/` | 6 | YAML |
| `scripts/` | 10 | JavaScript/MJS |
| `tests/` | 5+ | TypeScript |
| `schemas/` | 3 | JSON |

---

_Generated using BMAD Method `document-project` workflow on 2025-12-23_
