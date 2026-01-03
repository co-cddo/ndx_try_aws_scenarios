# Story 6.2: Portal Explore Page

Status: done

## Story

As a **council officer discovering the scenario**,
I want **a feature discovery page with live links**,
So that **I can see what's available and jump directly to features**.

## Acceptance Criteria

1. **Given** I navigate to the Explore page on the portal
   **When** the page loads
   **Then** I see:
   - Grid of all 7 AI features with icons and descriptions
   - "Try it now" buttons linking to Drupal feature locations
   - Feature status indicators (requires login, available, etc.)
   - Estimated time per feature

2. **Given** the features are displayed
   **When** I view the feature grid
   **Then** features are grouped by category:
   - **Content**: AI Content Editing, Readability Simplification
   - **Accessibility**: Auto Alt-Text, Text-to-Speech, Content Translation
   - **Generation**: Dynamic Council Identity, PDF-to-Web Conversion

3. **Given** I have a deployed stack
   **When** I view the explore page
   **Then** the page shows my deployment's Drupal URL (from credentials card/localStorage)

4. **Given** I click a "Try it now" button
   **When** I have valid credentials stored
   **Then** deep links open correct Drupal admin pages in new tab

## Tasks / Subtasks

- [x] **Task 1: Create AI Features Data** (AC: 1, 2)
  - [x] 1.1 Add `aiFeatures` array to `src/_data/scenarios.yaml` under localgov-drupal
  - [x] 1.2 Define 7 features with: id, name, description, icon, category, timeEstimate, drupalPath, status
  - [x] 1.3 Group features by category (Content, Accessibility, Generation)

- [x] **Task 2: Create Explore Page Template** (AC: 1, 2, 3, 4)
  - [x] 2.1 Create `src/walkthroughs/localgov-drupal/explore/index.njk`
  - [x] 2.2 Use `page` layout with appropriate front matter
  - [x] 2.3 Include phase-navigator component for context

- [x] **Task 3: Create Feature Card Component** (AC: 1)
  - [x] 3.1 Create `src/_includes/components/ai-feature-card.njk`
  - [x] 3.2 Include: icon, name, description, time estimate, status badge
  - [x] 3.3 Include "Try it now" button with dynamic deep link
  - [x] 3.4 Use GOV.UK Design System card pattern

- [x] **Task 4: Implement Feature Grid Layout** (AC: 1, 2)
  - [x] 4.1 Create responsive grid (2-column content, 3-column accessibility, 2-column generation)
  - [x] 4.2 Add category section headers with appropriate styling
  - [x] 4.3 Add category icons/colors using GOV.UK tag colors

- [x] **Task 5: Implement Dynamic Drupal URL** (AC: 3)
  - [x] 5.1 Read deployment URL from localStorage (set by credentials-card.js)
  - [x] 5.2 Display current Drupal URL at top of page with "Your deployment" label
  - [x] 5.3 Show fallback message if no deployment detected
  - [x] 5.4 Create `src/assets/js/explore-page.js` for URL handling

- [x] **Task 6: Implement Deep Links** (AC: 4)
  - [x] 6.1 Configure drupalPath for each feature
  - [x] 6.2 Construct full deep link URLs: `${drupalUrl}${feature.drupalPath}`
  - [x] 6.3 Add `target="_blank"` and `rel="noopener noreferrer"` for security
  - [x] 6.4 Show "Deploy first" fallback if credentials not available

- [x] **Task 7: Add Status Indicators** (AC: 1)
  - [x] 7.1 Create status badge styles: available (green), requires-login (yellow), coming-soon (grey)
  - [x] 7.2 Use GOV.UK tag component for status badges
  - [x] 7.3 Status shown with statusLabel text

- [x] **Task 8: Verify Build and Accessibility** (AC: 1, 2, 3, 4)
  - [x] 8.1 Run `npm run build` - builds successfully (108 files)
  - [x] 8.2 Verified responsive layout using CSS media queries
  - [x] 8.3 Keyboard navigation supported via semantic HTML and proper ARIA
  - [x] 8.4 All 7 features render with correct deep links

## Dev Notes

### 7 AI Features Reference

Based on Epic 3 & 4 implementation:

| Feature | Category | Drupal Path | AWS Service |
|---------|----------|-------------|-------------|
| AI Content Editing | Content | /node/add or /node/*/edit | Bedrock Nova Pro |
| Readability Simplification | Content | /node/add or /node/*/edit | Bedrock Nova Lite |
| Auto Alt-Text | Accessibility | /admin/content/media | Bedrock Nova Lite (Vision) |
| Text-to-Speech | Accessibility | /admin/ndx/tts or any page | Polly |
| Content Translation | Accessibility | /admin/ndx/translate | Translate |
| PDF-to-Web Conversion | Generation | /admin/ndx/pdf-converter | Textract + Bedrock |
| Dynamic Council Identity | Generation | / (front page) | Bedrock Nova Pro |

### Architecture Compliance

**Portal Structure (11ty):**
- Portal pages use Nunjucks (.njk) templates
- Data stored in `src/_data/` directory (YAML/JSON)
- Components in `src/_includes/components/`
- Layouts in `src/_includes/layouts/`
- JavaScript in `src/assets/js/`

**Existing Patterns to Follow:**
- `walkthrough-card.njk` - Card component pattern
- `phase-navigator.njk` - Phase/progress tracking
- `credentials-card.njk` - localStorage credential handling
- `scenario.njk` layout - Page structure with GOV.UK patterns

**GOV.UK Design System Components to Use:**
- `govuk-grid-row` / `govuk-grid-column-*` for responsive grid
- `govuk-tag` for status badges
- `govuk-button` for CTAs
- `govuk-heading-*` for section headers
- `govuk-inset-text` for deployment URL display

### localStorage Keys (from credentials-card.js)

```javascript
// Deployment info stored by credentials-card.js
const deploymentKey = `ndx-deployment-${scenarioId}`;
const data = {
  drupalUrl: 'https://xxx.execute-api.us-east-1.amazonaws.com',
  username: 'admin',
  password: '...',
  stackId: 'arn:aws:cloudformation:...',
  timestamp: Date.now()
};
```

### File Structure

```
src/
├── _data/
│   └── scenarios.yaml          # Add aiFeatures array
├── _includes/
│   └── components/
│       └── ai-feature-card.njk # New component
├── walkthroughs/
│   └── localgov-drupal/
│       └── explore/
│           └── index.njk       # New page
└── assets/
    └── js/
        └── explore-page.js     # New JS for dynamic URL
```

### Category Styling

```scss
// Category colors (align with GOV.UK tag colors)
Content: govuk-tag--blue
Accessibility: govuk-tag--green
Generation: govuk-tag--purple
```

### References

- [Story 6-1: Walkthrough Overlay](6-1-integrated-walkthrough-overlay.md) - AI feature definitions
- [Epic 3: AI Content Editing](../project-planning-artifacts/epics.md#epic-3) - Content features
- [Epic 4: AI Accessibility](../project-planning-artifacts/epics.md#epic-4) - Accessibility features
- [Epic 5: Dynamic Council](../project-planning-artifacts/epics.md#epic-5) - Generation features
- [GOV.UK Design System](https://design-system.service.gov.uk/) - Component patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A

### Completion Notes List

### File List

**Files to Create:**
- `src/walkthroughs/localgov-drupal/explore/index.njk`
- `src/_includes/components/ai-feature-card.njk`
- `src/assets/js/explore-page.js`

**Files to Modify:**
- `src/_data/scenarios.yaml` - Add aiFeatures array

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-03 | Story created from epics | SM Agent |
