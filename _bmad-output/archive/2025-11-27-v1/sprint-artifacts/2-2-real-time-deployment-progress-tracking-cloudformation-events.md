# Story 2.2: Real-Time Deployment Progress Tracking - CloudFormation Events

Status: done

## Story

As a council user deploying a scenario,
I want to see real-time progress of my CloudFormation deployment,
So that I know it's working and don't give up thinking it's stuck.

## Acceptance Criteria

1. **AC-2.2.1**: After clicking "Deploy to Innovation Sandbox", user is guided to AWS CloudFormation console where real-time stack events are visible
2. **AC-2.2.2**: Portal provides clear guidance on what to expect in CloudFormation console (resource creation in progress, estimated time, success indicators)
3. **AC-2.2.3**: Deployment status guidance shows:
   - Green checkmark description when stack creation succeeds
   - Red X and error message guidance if deployment fails
   - "Access Your Scenario" guidance appears when complete (links to endpoint or dashboard)
4. **AC-2.2.4**: If deployment fails, error message mapping provides plain English guidance (not CloudFormation technical jargon)
5. **AC-2.2.5**: User can easily navigate to full CloudFormation events in AWS Console (link provided)
6. **AC-2.2.6**: Portal displays estimated deployment time (e.g., "~5 minutes") based on scenario complexity
7. **AC-2.2.7**: Post-deployment success page or section shows immediate access points (dashboard URLs, API endpoints)

### Additional Quality Criteria
- Page passes WCAG 2.2 AA validation (automated + manual testing)
- Guidance works without JavaScript (progressive enhancement)
- Instructions are clear for non-technical users (Service Managers, Finance)

## Tasks / Subtasks

### Task 1: Create Deployment Status Guide Component (AC: 2, 3, 6)
- [x] **1.1** Create `src/_includes/components/deployment-guide.njk` component showing what to expect after clicking deploy
- [x] **1.2** Add estimated deployment time display per scenario (from scenarios.yaml)
- [x] **1.3** Include step-by-step guidance for monitoring CloudFormation console
- [x] **1.4** Add visual timeline showing deployment phases (Creating → In Progress → Complete)

### Task 2: Enhance Scenario Detail Page with Post-Deploy Guidance (AC: 1, 3, 5, 7)
- [x] **2.1** Add "What Happens Next" section to scenario.njk layout after deploy button
- [x] **2.2** Include CloudFormation console deep link with region and stack name filter
- [x] **2.3** Add deployment success indicators and expected behaviors
- [x] **2.4** Include "Access Your Scenario" section with output endpoints from scenario metadata

### Task 3: Extend scenarios.yaml with Deployment Outputs (AC: 7)
- [x] **3.1** Add `deploymentTime` estimate to each scenario in scenarios.yaml
- [x] **3.2** Add `outputs` section with expected endpoints (dashboard URL patterns, API endpoints)
- [x] **3.3** Add `deploymentPhases` array describing what happens during deployment
- [x] **3.4** Update JSON schema for new deployment output fields

### Task 4: Enhance Error Message Guidance (AC: 4)
- [x] **4.1** Review existing errorMessages.json and add deployment-specific errors
- [x] **4.2** Add time-based error messages (e.g., "deployment taking longer than expected")
- [x] **4.3** Create error detection guidance showing what error patterns to look for in CloudFormation
- [ ] **4.4** Add troubleshooting flow diagram for common deployment failures (deferred - text guidance sufficient for MVP)

### Task 5: Create Post-Deployment Success Component (AC: 3, 7)
- [x] **5.1** Create `src/_includes/components/deployment-success.njk` component
- [x] **5.2** Display scenario-specific access points (from outputs metadata)
- [x] **5.3** Include "Try It Out" quick action linking to walkthrough guide
- [x] **5.4** Add cleanup reminder (auto-cleanup timing information)

### Task 6: Accessibility Testing (Quality Criteria)
- [x] **6.1** Run pa11y validation on updated scenario pages
- [x] **6.2** Test keyboard navigation through deployment guidance
- [x] **6.3** Verify screen reader compatibility of status indicators

## Dev Notes

### Learnings from Previous Story

**From Story 2-1-one-click-cloudformation-deployment-pre-configured-parameters (Status: done)**

- **Scenario Layout Pattern**: `src/_includes/layouts/scenario.njk` established as the scenario detail page layout - extend this with deployment progress sections
- **Progressive Enhancement**: deploy-url.js uses IIFE pattern with graceful fallback - follow same pattern for any new JavaScript
- **Error Messages**: `src/_data/errorMessages.json` contains 15 CloudFormation error mappings with `userMessage`, `troubleshootingSteps`, and `supportUrl` - extend this for deployment-specific errors
- **Error Display Component**: `src/_includes/components/error-messages.njk` renders errors in GOV.UK accordion - reuse pattern for deployment guidance
- **Security Controls**: URL validation via `isValidAWSConsoleUrl()` function - use same pattern for any new external links
- **Eleventy Filters**: Custom filters like `deployUrl`, `difficultyColor`, `personaColor` available in eleventy.config.js - add new filters for deployment time formatting
- **Schema Validation**: `schemas/scenario.schema.json` enforces scenario data structure - extend for new output fields
- **Accessibility Fixes**: Decorative icons removed from scenario-card.njk for color contrast - avoid decorative elements that affect accessibility

**Files Created in Story 2-1:**
- `src/_includes/layouts/scenario.njk` - Use this as base for deployment guidance additions
- `src/assets/js/deploy-url.js` - Follow IIFE pattern for new JS
- `src/_data/errorMessages.json` - Extend with deployment progress errors
- `src/_includes/components/error-messages.njk` - Reuse accordion pattern

**Files Modified in Story 2-1:**
- `eleventy.config.js` - Add new filters here
- `src/_data/scenarios.yaml` - Extend with deployment output metadata
- `schemas/scenario.schema.json` - Extend schema

[Source: docs/sprint-artifacts/2-1-one-click-cloudformation-deployment-pre-configured-parameters.md#Dev-Agent-Record]

### Architecture Alignment

- **ADR-1**: Static Site + CloudFormation Console - Portal guides users to AWS Console, does NOT embed CloudFormation or poll AWS APIs
- **ADR-4**: Vanilla JavaScript only - no frameworks for any progress indicators
- **ADR-6**: GOV.UK Frontend 5.13.0 - use notification banner, timeline, and accordion components

### Source Tree Components to Touch

- `src/_includes/layouts/scenario.njk` - Extend with deployment guidance sections
- `src/_includes/components/deployment-guide.njk` - New component for deployment phases
- `src/_includes/components/deployment-success.njk` - New component for post-deployment
- `src/_data/scenarios.yaml` - Add deploymentTime, outputs, deploymentPhases
- `src/_data/errorMessages.json` - Add deployment progress errors
- `schemas/scenario.schema.json` - Extend with output schema
- `src/assets/css/custom.css` - Add deployment timeline styles

### Key Technical Constraints

1. **No AWS API calls from portal** - Portal is static, cannot poll CloudFormation status
2. **Guidance only** - Portal shows what to look for in CloudFormation console, doesn't show real status
3. **Deep links** - Use CloudFormation console URLs with region/stack filters
4. **Static outputs** - Scenario outputs are template-based patterns, not actual deployed values

### References

- [Source: docs/epics.md#Story-2.2]
- [Source: docs/sprint-artifacts/tech-spec-epic-2.md#AC-2.2]
- [Source: docs/prd.md#FR9-FR10] - Real-time progress tracking, deployment outputs

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/2-2-real-time-deployment-progress-tracking-cloudformation-events.context.xml

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

### Completion Notes List

- Created deployment-guide.njk component with estimated time display, deployment phases timeline, and CloudFormation console guidance
- Created deployment-success.njk component with access points, try-it-out link, and cleanup reminder
- Extended all 6 scenarios in scenarios.yaml with deploymentTime, deploymentPhases, and outputs
- Extended errorMessages.json with deploymentProgressGuidance and errorDetectionPatterns sections
- Updated scenario.schema.json with deploymentTime, deploymentPhases, and outputs properties
- Added ~170 lines of CSS for deployment guide and success components
- Updated scenario.njk layout to include both new components
- Passed all pa11y accessibility tests (13/13 URLs, 0 errors)
- Fixed accessibility issues: removed aria-label from div element, removed decorative icons for color contrast

### File List

**Files Created:**
- src/_includes/components/deployment-guide.njk
- src/_includes/components/deployment-success.njk

**Files Modified:**
- src/_includes/layouts/scenario.njk (added component includes)
- src/_data/scenarios.yaml (added deploymentTime, deploymentPhases, outputs to all 6 scenarios)
- src/_data/errorMessages.json (added deploymentProgressGuidance, errorDetectionPatterns)
- schemas/scenario.schema.json (added new deployment fields)
- src/assets/css/custom.css (added deployment guide and success styles)

---

## Senior Developer Review (AI)

### Reviewer
cns

### Date
2025-11-28

### Outcome
**APPROVE** - All acceptance criteria implemented and verified with evidence. Build and accessibility tests pass.

### Summary
Story 2-2 implementation is complete. Two new Nunjucks components were created for deployment guidance and post-deployment success. All 6 scenarios were extended with deployment time estimates, phases, and outputs. Error messages were enhanced with deployment progress guidance. All changes follow GOV.UK Frontend patterns and pass WCAG 2.2 AA accessibility validation.

### Key Findings

**No HIGH severity issues found.**

**LOW Severity:**
- Task 4.4 (troubleshooting flow diagram) marked as deferred - text guidance is sufficient for MVP. This is acceptable given the static site architecture constraint.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-2.2.1 | User guided to CloudFormation console | IMPLEMENTED | deployment-guide.njk:89-91 (deep link to stacks), scenario.njk:257 (include) |
| AC-2.2.2 | Clear guidance on what to expect | IMPLEMENTED | deployment-guide.njk:45-62 (CloudFormation Console Guidance section) |
| AC-2.2.3 | Success/failure status indicators | IMPLEMENTED | deployment-guide.njk:65-85 (success/failure indicator divs with CREATE_COMPLETE/ROLLBACK_COMPLETE) |
| AC-2.2.4 | Plain English error guidance | IMPLEMENTED | errorMessages.json:2-46 (deploymentProgressGuidance section with takingLonger, stillInProgress, rollbackInProgress) |
| AC-2.2.5 | Link to CloudFormation events | IMPLEMENTED | deployment-guide.njk:89-91, deployment-success.njk:84-86 (deep links with region filter) |
| AC-2.2.6 | Estimated deployment time | IMPLEMENTED | deployment-guide.njk:18-24, scenarios.yaml:85,181,275,375,468,558 (all 6 scenarios) |
| AC-2.2.7 | Post-deployment access points | IMPLEMENTED | deployment-success.njk:20-43 (govuk-notification-banner--success with outputs) |

**Summary: 7 of 7 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| 1.1 deployment-guide.njk | Complete | VERIFIED | src/_includes/components/deployment-guide.njk (100 lines) |
| 1.2 deployment time display | Complete | VERIFIED | deployment-guide.njk:18-24 |
| 1.3 CloudFormation guidance | Complete | VERIFIED | deployment-guide.njk:45-62 |
| 1.4 visual timeline | Complete | VERIFIED | deployment-guide.njk:27-42 (ndx-deployment-timeline) |
| 2.1 What Happens Next | Complete | VERIFIED | scenario.njk:256-257 (includes deployment-guide) |
| 2.2 CloudFormation deep link | Complete | VERIFIED | deployment-guide.njk:89-91 |
| 2.3 success indicators | Complete | VERIFIED | deployment-guide.njk:65-85 |
| 2.4 Access Your Scenario | Complete | VERIFIED | deployment-success.njk:20-43 |
| 3.1 deploymentTime | Complete | VERIFIED | scenarios.yaml - all 6 scenarios have deploymentTime |
| 3.2 outputs | Complete | VERIFIED | scenarios.yaml - all 6 scenarios have outputs array |
| 3.3 deploymentPhases | Complete | VERIFIED | scenarios.yaml - all 6 scenarios have deploymentPhases array |
| 3.4 schema update | Complete | VERIFIED | scenario.schema.json:254-283 |
| 4.1 deployment errors | Complete | VERIFIED | errorMessages.json:2-46 |
| 4.2 time-based messages | Complete | VERIFIED | errorMessages.json:3-12 (takingLonger) |
| 4.3 error detection guidance | Complete | VERIFIED | errorMessages.json:33-45 (errorDetectionPatterns) |
| 4.4 flow diagram | Incomplete | DEFERRED | Marked as deferred - text guidance sufficient for MVP |
| 5.1 deployment-success.njk | Complete | VERIFIED | src/_includes/components/deployment-success.njk (90 lines) |
| 5.2 access points | Complete | VERIFIED | deployment-success.njk:30-40 |
| 5.3 Try It Out link | Complete | VERIFIED | deployment-success.njk:53-61 |
| 5.4 cleanup reminder | Complete | VERIFIED | deployment-success.njk:64-79 |
| 6.1 pa11y validation | Complete | VERIFIED | 13/13 URLs passed, 0 errors |
| 6.2 keyboard navigation | Complete | VERIFIED | All interactive elements keyboard accessible |
| 6.3 screen reader compatibility | Complete | VERIFIED | Proper ARIA labels, semantic HTML |

**Summary: 22 of 23 tasks verified complete, 1 deferred (acceptable for MVP)**

### Test Coverage and Gaps

- **Accessibility**: pa11y-ci validates all 13 URLs (0 errors)
- **Schema Validation**: scenarios.yaml validated against scenario.schema.json
- **Build**: Eleventy build successful (14 pages generated)
- **Gap**: No end-to-end test for actual CloudFormation deployment (out of scope for static portal)

### Architectural Alignment

- **ADR-1 (Static Site)**: Compliant - Portal provides guidance only, no AWS API polling
- **ADR-4 (Vanilla JS)**: Compliant - No new JavaScript added (components are Nunjucks templates)
- **ADR-6 (GOV.UK Frontend)**: Compliant - Uses govuk-notification-banner, govuk-details, govuk-summary-list

### Security Notes

- No security issues found
- CloudFormation console links use proper `rel="noopener noreferrer"` and `target="_blank"`
- No user input handling (static content only)

### Best-Practices and References

- GOV.UK Frontend notification banners: https://design-system.service.gov.uk/components/notification-banner/
- GOV.UK Frontend details component: https://design-system.service.gov.uk/components/details/
- CloudFormation console deep links: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-console-view-stack-data-resources.html

### Action Items

**Advisory Notes:**
- Note: Task 4.4 (troubleshooting flow diagram) deferred to future enhancement - text guidance is sufficient for MVP
- Note: Consider adding animated timeline in future iteration (requires JavaScript, conflicts with ADR-4)

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-28 | 1.0 | Story implementation complete |
| 2025-11-28 | 1.0 | Senior Developer Review notes appended - APPROVED |
