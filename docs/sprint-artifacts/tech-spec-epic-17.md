# Epic 17: Screenshot Content Migration (Git-Based Storage with Real AWS Screenshots)

## Epic Overview

**Problem Statement:** All 101 walkthrough screenshots currently reference an S3 bucket (`https://ndx-try-screenshots.s3.us-west-2.amazonaws.com/current`) that was never populated, resulting in 404 errors on every walkthrough step page. Users see fallback SVGs instead of actual screenshots.

**Solution:** Deploy Sprint 0 screenshot automation infrastructure, capture REAL screenshots from live AWS deployments using Playwright federation, migrate to git-based storage, and ensure zero 404s when the portal is served locally (representative of GitHub Pages deployment).

**Business Value:** Users following walkthroughs cannot currently see the AWS console screenshots they need to follow along. Real screenshots from actual AWS deployments provide authentic, accurate visual guidance - far superior to mockups.

## Current State Analysis

### Screenshot Infrastructure
- **Component:** `src/_includes/components/screenshot.njk`
- **Base URL:** `https://ndx-try-screenshots.s3.us-west-2.amazonaws.com/current`
- **Fallback:** `/assets/images/fallbacks/{scenario}.svg` (6 SVGs exist and work)
- **Data Files:** 6 YAML files in `src/_data/screenshots/`

### Screenshot Inventory (101 Total)
| Scenario | Step Screenshots | Explore Screenshots | Total |
|----------|-----------------|---------------------|-------|
| Council Chatbot | 9 | 7 | 16 |
| Planning AI | 9 | 6 | 15 |
| FOI Redaction | 12 | 6 | 18 |
| Smart Car Park | 11 | 7 | 18 |
| Text to Speech | 11 | 6 | 17 |
| QuickSight | 11 | 6 | 17 |

### Current Issues
1. S3 bucket never populated with images
2. Sprint 0 screenshot automation infrastructure exists but was never deployed
3. All 101 image requests return 404
4. Fallback SVGs work but provide no instructional value
5. Responsive variants (640w, 1024w, WebP) also 404

### Existing Infrastructure (Sprint 0 - Never Deployed)
| Component | Status | File |
|-----------|--------|------|
| AWS Federation Library | Complete (520 LOC) | `src/lib/aws-federation.ts` |
| Playwright Console Tests | Complete (6 files) | `tests/e2e/console-screenshots/*.spec.ts` |
| IAM CloudFormation | Ready | `cloudformation/screenshot-automation/iam.yaml` |
| S3 Bucket CloudFormation | Ready | `cloudformation/screenshot-automation/s3-bucket.yaml` |
| GitHub Actions Workflow | Ready | `.github/workflows/screenshot-capture.yml` |

### Live AWS Deployments (us-west-2, Account 449788867583)
All 6 scenarios deployed and verified:
- `ndx-try-text-to-speech` (CREATE_COMPLETE)
- `ndx-try-council-chatbot` (UPDATE_COMPLETE)
- `ndx-try-foi-redaction` (CREATE_COMPLETE)
- `ndx-try-planning-ai` (UPDATE_COMPLETE)
- `ndx-try-smart-car-park` (CREATE_COMPLETE)
- `ndx-try-quicksight-dashboard` (CREATE_COMPLETE)

## Target State

### Git-Based Storage with Real Screenshots
- **REAL screenshots** captured from live AWS console via Playwright
- Screenshots stored in `src/assets/images/screenshots/{scenario}/`
- Published via Eleventy passthrough copy
- No external dependencies (S3, CDN)
- Version controlled with the codebase

### Directory Structure
```
src/assets/images/screenshots/
├── council-chatbot/
│   ├── step-1-cloudformation-outputs.png
│   ├── step-1-chatbot-interface.png
│   ├── step-2-question-input.png
│   └── ... (16 files)
├── planning-ai/
│   └── ... (15 files)
├── foi-redaction/
│   └── ... (18 files)
├── smart-car-park/
│   └── ... (18 files)
├── text-to-speech/
│   └── ... (17 files)
└── quicksight-dashboard/
    └── ... (17 files)
```

### Acceptance Criteria (Epic-Level)
- **AC-17.E.1:** Zero 404 errors when loading any walkthrough step page
- **AC-17.E.2:** All 101 screenshots are REAL captures from AWS console (not mockups)
- **AC-17.E.3:** Screenshots match YAML metadata filenames exactly
- **AC-17.E.4:** Alt text and captions render correctly for all screenshots
- **AC-17.E.5:** Page load time remains under 3 seconds with lazy loading
- **AC-17.E.6:** Local development server (`npm start`) serves all screenshot assets correctly (representative of GitHub Pages deployment)
- **AC-17.E.7:** `npm run check:screenshots` passes with 0 missing files

---

## Stories

### Story 17.0: Deploy Sprint 0 Screenshot Infrastructure
**Points:** 3
**Priority:** Critical
**Dependencies:** None

**Description:**
Deploy the Sprint 0 screenshot automation infrastructure that was designed but never executed. This provides the foundation for capturing real AWS console screenshots via Playwright federation.

**Acceptance Criteria:**
- **AC-17.0.1:** All 6 scenario CloudFormation stacks verified as CREATE_COMPLETE or UPDATE_COMPLETE in us-west-2
- **AC-17.0.2:** AWS credentials configured and verified working for Playwright tests
- **AC-17.0.3:** Playwright browsers installed and configured
- **AC-17.0.4:** Federation flow test passes (`tests/e2e/federation-flow.spec.ts` or equivalent)
- **AC-17.0.5:** Screenshot capture test captures at least one real AWS console screenshot
- **AC-17.0.6:** Environment setup documented for future screenshot captures

**Technical Notes:**
```bash
# Verify stacks
aws cloudformation describe-stacks --stack-name ndx-try-council-chatbot --region us-west-2

# Install Playwright
npx playwright install chromium

# Test federation and capture
npx playwright test tests/e2e/console-screenshots/council-chatbot.spec.ts --headed
```

---

### Story 17.1: Screenshot Component Migration to Local Storage
**Points:** 3
**Priority:** Critical
**Dependencies:** None

**Description:**
Modify the `screenshot.njk` component to reference local git-based storage instead of S3. Simplify responsive image handling to reduce complexity.

**Acceptance Criteria:**
- **AC-17.1.1:** `baseUrl` changed from S3 to `/assets/images/screenshots`
- **AC-17.1.2:** Remove WebP source variants (simplify to PNG only initially)
- **AC-17.1.3:** Remove responsive srcset (use single image size)
- **AC-17.1.4:** Fallback mechanism still works for missing images
- **AC-17.1.5:** Component passes existing accessibility requirements
- **AC-17.1.6:** No changes required to screenshot YAML data files

**Technical Notes:**
```njk
{# Change from: #}
{% set baseUrl = "https://ndx-try-screenshots.s3.us-west-2.amazonaws.com/current" %}

{# To: #}
{% set baseUrl = "/assets/images/screenshots" %}
```

---

### Story 17.2: Screenshot Directory Structure Setup
**Points:** 2
**Priority:** Critical
**Dependencies:** None

**Description:**
Create the directory structure for git-based screenshots and configure Eleventy passthrough copy.

**Acceptance Criteria:**
- **AC-17.2.1:** Create `src/assets/images/screenshots/` directory
- **AC-17.2.2:** Create subdirectory for each of 6 scenarios
- **AC-17.2.3:** Verify Eleventy passthrough copy includes screenshots directory
- **AC-17.2.4:** Add `.gitkeep` files to maintain empty directories in git
- **AC-17.2.5:** Verify directory structure matches YAML data file references

---

### Story 17.3: Council Chatbot Real Screenshots
**Points:** 5
**Priority:** High
**Dependencies:** 17.0, 17.1, 17.2

**Description:**
Capture 16 REAL screenshots from the Council Chatbot AWS deployment using Playwright. Screenshots should show actual AWS console pages including CloudFormation outputs, Lambda function, S3 bucket, and the chatbot interface.

**Acceptance Criteria:**
- **AC-17.3.1:** Capture all 16 PNG files matching `council-chatbot.yaml` filenames
- **AC-17.3.2:** Each image is actual AWS console screenshot (not mockup)
- **AC-17.3.3:** Screenshots capture relevant UI state (stack outputs visible, Lambda code visible, etc.)
- **AC-17.3.4:** File sizes optimized (under 500KB each)
- **AC-17.3.5:** Images pass automated 404 check
- **AC-17.3.6:** Screenshots saved to `src/assets/images/screenshots/council-chatbot/`

**Files Required:**
1. step-1-cloudformation-outputs.png - CloudFormation stack outputs tab
2. step-1-chatbot-interface.png - Chatbot web interface
3. step-2-question-input.png - User typing question
4. step-2-response-display.png - Chatbot response displayed
5. step-3-council-tax.png - Council tax conversation
6. step-3-planning.png - Planning query conversation
7. step-3-multi-turn.png - Multi-turn conversation history
8. step-4-conversation-summary.png - Full conversation view
9. step-4-bedrock-console.png - AWS Bedrock console (if accessible) or Lambda console
10. explore-architecture-overview.png - Architecture diagram/Lambda overview
11. explore-bedrock-agent.png - Bedrock agent config or Lambda config
12. explore-knowledge-base.png - S3 knowledge bucket contents
13. explore-prompt-modification.png - Lambda environment variables
14. explore-knowledge-update.png - S3 upload interface
15. explore-boundary-testing.png - Chatbot handling edge cases
16. explore-production-checklist.png - CloudWatch logs or metrics

---

### Story 17.4: Planning AI Real Screenshots
**Points:** 5
**Priority:** High
**Dependencies:** 17.0, 17.1, 17.2

**Description:**
Capture 15 REAL screenshots from the Planning AI AWS deployment using Playwright.

**Acceptance Criteria:**
- **AC-17.4.1:** Capture all 15 PNG files matching `planning-ai.yaml` filenames
- **AC-17.4.2:** Each image is actual AWS console screenshot (not mockup)
- **AC-17.4.3:** Screenshots capture relevant UI state
- **AC-17.4.4:** File sizes optimized (under 500KB each)
- **AC-17.4.5:** Images pass automated 404 check
- **AC-17.4.6:** Screenshots saved to `src/assets/images/screenshots/planning-ai/`

---

### Story 17.5: FOI Redaction Real Screenshots
**Points:** 5
**Priority:** High
**Dependencies:** 17.0, 17.1, 17.2

**Description:**
Capture 18 REAL screenshots from the FOI Redaction AWS deployment using Playwright. This scenario uses Amazon Comprehend for PII detection.

**Acceptance Criteria:**
- **AC-17.5.1:** Capture all 18 PNG files matching `foi-redaction.yaml` filenames
- **AC-17.5.2:** Each image is actual AWS console screenshot (not mockup)
- **AC-17.5.3:** Screenshots capture relevant UI state including Comprehend results
- **AC-17.5.4:** File sizes optimized (under 500KB each)
- **AC-17.5.5:** Images pass automated 404 check
- **AC-17.5.6:** Screenshots saved to `src/assets/images/screenshots/foi-redaction/`

---

### Story 17.6: Smart Car Park Real Screenshots
**Points:** 5
**Priority:** High
**Dependencies:** 17.0, 17.1, 17.2

**Description:**
Capture 18 REAL screenshots from the Smart Car Park IoT AWS deployment using Playwright.

**Acceptance Criteria:**
- **AC-17.6.1:** Capture all 18 PNG files matching `smart-car-park.yaml` filenames
- **AC-17.6.2:** Each image is actual AWS console screenshot (not mockup)
- **AC-17.6.3:** Screenshots capture relevant UI state
- **AC-17.6.4:** File sizes optimized (under 500KB each)
- **AC-17.6.5:** Images pass automated 404 check
- **AC-17.6.6:** Screenshots saved to `src/assets/images/screenshots/smart-car-park/`

---

### Story 17.7: Text to Speech Real Screenshots
**Points:** 5
**Priority:** High
**Dependencies:** 17.0, 17.1, 17.2

**Description:**
Capture 17 REAL screenshots from the Text to Speech AWS deployment using Playwright. This scenario uses Amazon Polly.

**Acceptance Criteria:**
- **AC-17.7.1:** Capture all 17 PNG files matching `text-to-speech.yaml` filenames
- **AC-17.7.2:** Each image is actual AWS console screenshot (not mockup)
- **AC-17.7.3:** Screenshots capture relevant UI state including Polly console
- **AC-17.7.4:** File sizes optimized (under 500KB each)
- **AC-17.7.5:** Images pass automated 404 check
- **AC-17.7.6:** Screenshots saved to `src/assets/images/screenshots/text-to-speech/`

---

### Story 17.8: QuickSight Dashboard Real Screenshots
**Points:** 5
**Priority:** High
**Dependencies:** 17.0, 17.1, 17.2

**Description:**
Capture 17 REAL screenshots from the QuickSight Dashboard AWS deployment using Playwright.

**Acceptance Criteria:**
- **AC-17.8.1:** Capture all 17 PNG files matching `quicksight-dashboard.yaml` filenames
- **AC-17.8.2:** Each image is actual AWS console screenshot (not mockup)
- **AC-17.8.3:** Screenshots capture relevant UI state
- **AC-17.8.4:** File sizes optimized (under 500KB each)
- **AC-17.8.5:** Images pass automated 404 check
- **AC-17.8.6:** Screenshots saved to `src/assets/images/screenshots/quicksight-dashboard/`

---

### Story 17.9: Automated 404 Detection Script
**Points:** 3
**Priority:** High
**Dependencies:** 17.1, 17.2

**Description:**
Create an automated script that validates all screenshot references in YAML data files against actual files in the screenshots directory. This enables CI/CD checks to prevent future 404s.

**Acceptance Criteria:**
- **AC-17.9.1:** Script reads all 6 screenshot YAML files
- **AC-17.9.2:** Script extracts all filename references
- **AC-17.9.3:** Script checks each file exists in the corresponding directory
- **AC-17.9.4:** Script outputs clear pass/fail with list of missing files
- **AC-17.9.5:** Script exits with non-zero code if any files missing
- **AC-17.9.6:** Script can be run as npm script (`npm run check:screenshots`)

**Technical Notes:**
```javascript
// scripts/check-screenshots.js
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Read each YAML file, extract filenames, check existence
```

---

### Story 17.10: Zero 404 Validation and Epic Closure
**Points:** 2
**Priority:** Critical
**Dependencies:** 17.3-17.9

**Description:**
Final validation that all screenshots load correctly. Run automated checks, manual verification, and document completion.

**Acceptance Criteria:**
- **AC-17.10.1:** `npm run check:screenshots` passes with 0 missing files
- **AC-17.10.2:** Manual browser test of all 25 walkthrough step pages shows images
- **AC-17.10.3:** Lighthouse audit shows no 404 errors
- **AC-17.10.4:** All 6 scenario walkthrough index pages display correctly
- **AC-17.10.5:** Local dev server (`npm start`) loads all screenshots without 404s (representative of GitHub Pages)
- **AC-17.10.6:** Performance: largest contentful paint under 2.5s

---

## Epic Summary

**Total Stories:** 11 (17.0 through 17.10)
**Total Points:** 43
**Estimated Duration:** 3 sprints

### Sprint Breakdown

**Sprint 1 (Infrastructure):** Stories 17.0, 17.1, 17.2, 17.9 = 11 points
- Deploy Sprint 0 infrastructure, set up local storage, modify component, create validation script

**Sprint 2 (Screenshots - Part 1):** Stories 17.3, 17.4, 17.5 = 15 points
- Council Chatbot, Planning AI, FOI Redaction real screenshots

**Sprint 3 (Screenshots - Part 2 + Validation):** Stories 17.6, 17.7, 17.8, 17.10 = 17 points
- Smart Car Park, Text to Speech, QuickSight real screenshots + final validation

---

## Screenshot Capture Strategy

For each scenario (Stories 17.3-17.8):

1. **Verify Scenario Stack**
   ```bash
   aws cloudformation describe-stacks --stack-name ndx-try-{scenario} --region us-west-2
   ```

2. **Navigate to AWS Console Pages**
   - CloudFormation > Stacks > {stack-name} > Outputs
   - Lambda > Functions > {function-name}
   - S3 > Buckets > {bucket-name}
   - Service-specific consoles (Comprehend, Polly, etc.)

3. **Capture Screenshots via Playwright**
   ```bash
   npx playwright test tests/e2e/console-screenshots/{scenario}.spec.ts
   ```

4. **Move to Git Storage**
   ```bash
   mv playwright-screenshots/{scenario}/*.png src/assets/images/screenshots/{scenario}/
   ```

5. **Validate**
   ```bash
   npm run check:screenshots
   ```

---

## Risk Mitigation

**Risk 1:** AWS Console UI changes may break screenshot automation
- **Mitigation:** Use stable selectors, capture full-page screenshots where possible
- **Mitigation:** Manual capture fallback if automation fails

**Risk 2:** Git repository size increases significantly
- **Mitigation:** Optimize images to under 500KB each (101 x 500KB = ~50MB max)
- **Mitigation:** Consider Git LFS if repository exceeds 100MB

**Risk 3:** Federation credentials expire during capture
- **Mitigation:** Refresh credentials before each capture session
- **Mitigation:** Use session tokens with sufficient TTL

**Risk 4:** Some AWS services may not be accessible in Innovation Sandbox
- **Mitigation:** Identify alternative screenshots (Lambda console instead of Bedrock)
- **Mitigation:** Use existing service dashboards as fallback

---

## Definition of Done

- [ ] Sprint 0 infrastructure verified and working
- [ ] All 101 screenshots are REAL AWS console captures (not mockups)
- [ ] All screenshots exist in `src/assets/images/screenshots/`
- [ ] `npm run check:screenshots` passes with 0 errors
- [ ] All 25 walkthrough step pages load images without 404s
- [ ] Local dev server (`npm start`) serves all assets correctly
- [ ] Page load performance remains under 3 seconds
- [ ] Epic retrospective completed
