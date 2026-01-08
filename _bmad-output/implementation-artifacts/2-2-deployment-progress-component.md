# Story 2.2: Deployment Progress Component

Status: done

## Story

As a **council officer deploying the stack**,
I want **real-time feedback on deployment progress**,
So that **I know the deployment is working and how long to wait**.

## Acceptance Criteria

1. **Given** I have clicked "Create stack" in CloudFormation console
   **When** I return to the portal deployment page
   **Then** I see a progress component showing:
   - Current stack status (CREATE_IN_PROGRESS, CREATE_COMPLETE, etc.)
   - Task list with checkmarks for completed resources
   - Progress bar indicating overall completion
   - Estimated time remaining
   **And** the display updates automatically (polling or websocket)
   **And** error states are clearly indicated with guidance
   **And** aria-live regions announce status changes for screen readers

## Tasks / Subtasks

- [x] **Task 1: Create deployment progress component** (AC: 1)
  - [x] 1.1 Create `deployment-progress.njk` component
  - [x] 1.2 Include in scenario.njk layout
  - [x] 1.3 Add deployment status section layout
  - [x] 1.4 Add manual monitoring instructions with CloudFormation links

- [x] **Task 2: Implement stack status display** (AC: 1)
  - [x] 2.1 Create status badge component for CloudFormation states
  - [x] 2.2 Add colour coding (green=complete, yellow=in-progress, red=failed)
  - [x] 2.3 Display current status with descriptions
  - [x] 2.4 Add status descriptions explaining what each state means

- [x] **Task 3: Implement resource task list** (AC: 1)
  - [x] 3.1 Use deploymentPhases from scenarios.yaml
  - [x] 3.2 Create task list component with checkmarks
  - [x] 3.3 Show phase description and status
  - [x] 3.4 Visual indication of completed vs pending resources

- [x] **Task 4: Implement progress bar** (AC: 1)
  - [x] 4.1 Create progress bar component following GOV.UK patterns
  - [x] 4.2 Calculate percentage from completed resources
  - [x] 4.3 Add estimated time remaining display
  - [x] 4.4 Animate progress bar transitions smoothly

- [x] **Task 5: Add demo mode** (AC: 1)
  - [x] 5.1 Create JavaScript for demo mode simulation
  - [x] 5.2 Demo shows realistic deployment flow
  - [x] 5.3 Update UI components on status change
  - [x] 5.4 Reset button to restart demo

- [x] **Task 6: Implement error handling** (AC: 1)
  - [x] 6.1 Display error state with red styling
  - [x] 6.2 Show failure guidance
  - [x] 6.3 Add troubleshooting links
  - [x] 6.4 Link to CloudFormation console for details

- [x] **Task 7: Accessibility requirements** (AC: 1)
  - [x] 7.1 Add aria-live regions for status updates
  - [x] 7.2 Ensure proper heading hierarchy
  - [x] 7.3 Add screen reader text for progress percentage
  - [x] 7.4 Test with keyboard navigation
  - [x] 7.5 Add prefers-reduced-motion support

## Dev Notes

### Architecture Compliance

This story implements the Deployment Progress component from Epic 2:

**From Epic 2:**
- Deployment Progress component
- Real-time stack status (CREATE_IN_PROGRESS, CREATE_COMPLETE, etc.)
- Task list with checkmarks for completed resources
- Progress bar indicating overall completion

**From UX Design:**
- Deployment Progress: Real-time task list + progress bar with checkmarks
- aria-live regions for dynamic updates
- GOV.UK Design System colour contrast compliance

### Technical Requirements

**Stack Status Values:**
- CREATE_IN_PROGRESS
- CREATE_COMPLETE
- CREATE_FAILED
- ROLLBACK_IN_PROGRESS
- ROLLBACK_COMPLETE
- DELETE_IN_PROGRESS
- DELETE_COMPLETE

**Key Resources to Track (from CDK stack):**
1. VPC Security Groups (Networking)
2. Aurora Serverless Cluster (Database)
3. EFS File System (Storage)
4. ECS Cluster (Compute)
5. Fargate Task Definition
6. Application Load Balancer
7. ECS Service
8. CloudFormation WaitCondition (Init complete)

**Polling Implementation:**
Since this is a static 11ty site, polling requires:
- JavaScript-based fetch to CloudFormation API
- AWS SDK for JavaScript in browser (or proxy API)
- For MVP: Could show manual refresh button with instructions
- For full implementation: Lambda proxy or AWS Amplify integration

**Estimated Deployment Times:**
- Networking: ~1-2 minutes
- Database: ~5-7 minutes
- Storage: ~1 minute
- Compute: ~3-5 minutes
- Total: ~10-15 minutes

### Dependencies

- Story 2.1 (Portal Scenario Landing Page) - Deploy button links here
- Story 1.12 (CloudFormation Outputs) - Stack outputs for credentials

### References

- [GOV.UK Progress Bar Pattern](https://design-system.service.gov.uk/components/task-list/)
- [CloudFormation DescribeStackEvents](https://docs.aws.amazon.com/AWSCloudFormation/latest/APIReference/API_DescribeStackEvents.html)
- [aria-live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A - Implementation followed existing 11ty/Nunjucks patterns.

### Completion Notes List

1. **Component Architecture**: Created `deployment-progress.njk` as a reusable component included in `scenario.njk` layout. This allows all scenario pages to show deployment progress.

2. **Static Site Approach**: Since this is a static 11ty site without AWS SDK access:
   - Implemented demo mode to show realistic deployment flow
   - Provided clear instructions for monitoring in CloudFormation Console
   - Added deep links to AWS Console with stack filtering

3. **Demo Mode**: JavaScript-based simulation that:
   - Shows 6 deployment phases from scenarios.yaml
   - Updates status badges, progress bar, and resource checklist
   - Uses 1.5 second intervals for demo visibility
   - Includes reset functionality

4. **Accessibility Features**:
   - `aria-live="polite"` for status updates
   - `role="progressbar"` with proper ARIA attributes
   - `prefers-reduced-motion` support for animations
   - Screen reader announcements via dynamic elements
   - Proper heading hierarchy

5. **GOV.UK Design System Compliance**:
   - Uses standard colour tokens (#1d70b8, #00703c, #d4351c, etc.)
   - Button styles follow govuk-button patterns
   - Details/summary components for progressive disclosure
   - Error summary follows govuk-error-summary pattern

6. **Build Verification**: 97 pages built successfully including new component.

### File List

**Files Created:**
- `src/_includes/components/deployment-progress.njk` - Main deployment progress component
- `src/assets/js/deployment-progress.js` - JavaScript for demo mode and status updates

**Files Modified:**
- `src/_includes/layouts/scenario.njk` - Added include for deployment-progress component
- `src/assets/css/custom.css` - Added styles for deployment progress, status badges, progress bar, resource list

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-29 | Story created from epics | SM Agent |
