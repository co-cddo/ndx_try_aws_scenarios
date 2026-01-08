# Story 2.1: Portal Scenario Landing Page

Status: done

## Story

As a **council officer visiting the portal**,
I want **a clear scenario landing page with overview and deploy button**,
So that **I understand what I'm about to experience and can start with confidence**.

## Acceptance Criteria

1. **Given** I navigate to the LocalGov Drupal scenario page
   **When** the page loads
   **Then** I see:
   - Scenario title and brief description
   - Key features summary (7 AI capabilities)
   - Estimated deployment time (<15 minutes)
   - Estimated cost (<$2)
   - Prominent "Deploy Now" button linking to CloudFormation Quick Create
   **And** the page follows GOV.UK Design System patterns
   **And** the page is responsive (desktop-first, tablet and mobile supported)
   **And** navigation to other scenarios is available

## Tasks / Subtasks

- [x] **Task 1: Create scenario page structure** (AC: 1)
  - [x] 1.1 Create `src/scenarios/localgov-drupal.njk` file
  - [x] 1.2 Add front matter with layout, title, description, scenario ID
  - [x] 1.3 Add scenario metadata to `src/_data/scenarios.yaml`
  - [x] 1.4 Reuse GOV.UK Design System layout from scenario.njk template

- [x] **Task 2: Implement hero section** (AC: 1)
  - [x] 2.1 Scenario title and headline from data
  - [x] 2.2 Description paragraph from data
  - [x] 2.3 Deployment time estimate badge (15 minutes)
  - [x] 2.4 Cost estimate badge (FREE via NDX:Try)

- [x] **Task 3: Implement features section** (AC: 1)
  - [x] 3.1 AWS services tags from data (8 services)
  - [x] 3.2 Skills learned list (6 skills)
  - [x] 3.3 Business outcomes list (4 outcomes)

- [x] **Task 4: Implement deploy button** (AC: 1)
  - [x] 4.1 "Deploy to Innovation Sandbox" CTA button
  - [x] 4.2 Link to CloudFormation Quick Create URL
  - [x] 4.3 Pre-deployment checklist from template

- [x] **Task 5: Add navigation** (AC: 1)
  - [x] 5.1 Breadcrumb navigation from template
  - [x] 5.2 Related scenarios section
  - [x] 5.3 Back to scenarios gallery link

- [x] **Task 6: Responsive design** (AC: 1)
  - [x] 6.1 Uses existing responsive template
  - [x] 6.2 Verified build succeeds
  - [x] 6.3 97 pages built including new scenario

## Dev Notes

### Architecture Compliance

This story implements the Portal Scenario Landing Page from Epic 2:

**From Epic 2:**
- Portal scenario pages with screenshots
- Covers: credentials, login, exploring, editing, cleanup
- Portal pages follow GOV.UK Design System patterns

**From UX Design:**
- Desktop-first (1024px+): Full feature set
- Tablet (768-1023px): Meeting presentation mode
- Mobile (<768px): Documentation viewing only

### Technical Requirements

**Project Structure:**
- Portal pages live in `src/scenarios/localgov-drupal/`
- Uses existing Next.js app router structure
- GOV.UK Design System components from existing design system

**Quick Create URL Format:**
```
https://console.aws.amazon.com/cloudformation/home#/stacks/quickcreate?
  templateUrl=https://s3.amazonaws.com/ndx-templates/localgov-drupal.yaml
  &stackName=LocalGovDrupal-Demo
  &param_DeploymentMode=development
```

**7 AI Capabilities to Feature:**
1. AI Content Editor (Bedrock Nova 2 Pro)
2. Readability Simplification (Plain English)
3. Auto Alt-Text (Nova 2 Omni Vision)
4. Listen to Page (Polly TTS - 7 languages)
5. Content Translation (Amazon Translate - 75+ languages)
6. PDF-to-Web Conversion (Textract + Bedrock)
7. Dynamic Council Generation (AI-generated unique council)

### Dependencies

- Story 1.12 (CloudFormation Outputs) - Quick Create URL format
- Existing portal Next.js infrastructure

### References

- [GOV.UK Design System](https://design-system.service.gov.uk/)
- [LocalGov Drupal](https://localgovdrupal.org/)
- [CloudFormation Quick Create Links](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-console-create-stacks-quick-create-links.html)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A - Implementation followed existing 11ty/Nunjucks patterns.

### Completion Notes List

1. **Discovery**: Found existing 11ty site with 6 scenarios and comprehensive data-driven template system.

2. **Implementation Approach**: Leveraged existing infrastructure:
   - Used `layouts/scenario.njk` template (already has hero, features, deploy button, navigation)
   - Added scenario data to `src/_data/scenarios.yaml`
   - Created minimal `src/scenarios/localgov-drupal.njk` page file

3. **Scenario Data Added**:
   - Full metadata (id, name, headline, description)
   - 8 AWS services listed
   - 6 skills learned
   - 4 business outcomes
   - Deployment configuration with templateUrl and outputs
   - Success metrics, security posture, TCO projection
   - Related scenarios (council-chatbot, text-to-speech, foi-redaction)

4. **Order Fix**: Set order: 1 for LocalGov Drupal, shifted others to 2-7

5. **Build Verification**: 97 pages built successfully including new scenario

### File List

**Files Created:**
- `src/scenarios/localgov-drupal.njk` - Scenario page using data-driven template

**Files Modified:**
- `src/_data/scenarios.yaml` - Added LocalGov Drupal scenario configuration

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-29 | Story created from epics | SM Agent |
