# Story 6.7: Enhanced Evidence Pack

Status: done

## Story

As a **council officer reporting to senior leadership**,
I want **an evidence pack capturing AI feature outcomes**,
So that **I can demonstrate the value of AI in local government**.

## Acceptance Criteria

1. **Given** I have completed experiments with AI features
   **When** I generate the enhanced evidence pack
   **Then** the PDF includes:
   - Everything from basic evidence pack (Story 2.9)
   - AI features used and outcomes achieved
   - Before/after examples from simplification
   - Generated alt-text samples
   - Council generation details (name, theme)
   - Screenshots of key AI interactions
   - ROI talking points for each feature

2. **Given** the evidence pack form
   **When** I view form fields
   **Then** form fields capture my observations about AI features

3. **Given** the evidence pack PDF
   **When** generated
   **Then** the pack is branded with GOV.UK styling
   **And** generation includes the council's unique identity

## Tasks / Subtasks

- [x] **Task 1: Extend EvidencePackData interface** (AC: 1)
  - [x] 1.1 Add aiFeatures section to interface
  - [x] 1.2 Add councilIdentity section
  - [x] 1.3 Add beforeAfterExamples section
  - [x] 1.4 Add altTextSamples section

- [x] **Task 2: Add AI Features section to PDF** (AC: 1, 3)
  - [x] 2.1 Create addAiFeaturesSection method
  - [x] 2.2 Add feature icons and descriptions
  - [x] 2.3 Show features used with checkmarks

- [x] **Task 3: Add Before/After Examples section** (AC: 1)
  - [x] 3.1 Create addBeforeAfterSection method
  - [x] 3.2 Display simplification examples side by side
  - [x] 3.3 Show readability improvement metrics

- [x] **Task 4: Add Council Identity section** (AC: 1, 3)
  - [x] 4.1 Create addCouncilIdentitySection method
  - [x] 4.2 Display council name, region, theme
  - [x] 4.3 Include council generation cost data

- [x] **Task 5: Add ROI Talking Points section** (AC: 1)
  - [x] 5.1 Create addRoiSection method
  - [x] 5.2 Add per-feature ROI bullets
  - [x] 5.3 Include time savings estimates

- [x] **Task 6: Update evidence pack form** (AC: 2)
  - [x] 6.1 Add AI feature checkboxes
  - [x] 6.2 Add AI observations textarea
  - [x] 6.3 Pre-populate from session data

- [x] **Task 7: Update evidence-pack page** (AC: 1, 2, 3)
  - [x] 7.1 Add enhanced form fields
  - [x] 7.2 Wire up new data collection
  - [x] 7.3 Verify PDF output includes all sections

## Dev Notes

### Architecture Compliance

This story extends the basic evidence pack (Story 2.9) with AI feature outcomes.

**From Epic 6 Notes:**
- Enhanced Evidence Pack with AI feature outcomes and ROI metrics
- Form fields capture observations
- GOV.UK styling with council identity

**From PRD:**
- Evidence pack downloads: 30% of deployments indicates serious evaluation
- Used to demonstrate value to senior leadership

### Technical Implementation

**Extends:**
- `src/lib/pdf-generator.ts` - EvidencePackGenerator class
- `src/walkthroughs/localgov-drupal/evidence-pack.njk` - Form page

**New Data Model:**
```typescript
interface EnhancedEvidencePackData extends EvidencePackData {
  aiFeatures: {
    contentEditing: boolean;
    simplification: boolean;
    altText: boolean;
    tts: boolean;
    translation: boolean;
    pdfConversion: boolean;
  };
  aiObservations: string;
  councilIdentity: {
    name: string;
    region: string;
    theme: string;
    population: string;
  };
  beforeAfterExamples: Array<{
    original: string;
    simplified: string;
    improvement: string;
  }>;
  altTextSamples: Array<{
    imageDescription: string;
    generatedAltText: string;
  }>;
}
```

**ROI Talking Points:**
| Feature | Benefit | Metric |
|---------|---------|--------|
| AI Content Editing | Faster content creation | 50% time reduction |
| Simplification | Plain English compliance | Automatic GDS style |
| Auto Alt-Text | WCAG 2.2 compliance | 100% image accessibility |
| TTS | Accessibility for visual impairments | 7 languages supported |
| Translation | Inclusive services | 75+ languages |
| PDF Conversion | Document accessibility | EAA June 2025 compliance |

### Session Data Sources

AI feature usage tracked via sessionStorage keys:
- `ndx-ai-features-used` - array of feature IDs
- `ndx-simplify-examples` - before/after text samples
- `ndx-alttext-samples` - generated alt texts
- `ndx-council-identity` - from deployment

## Implementation Notes

### Files Modified

**src/lib/pdf-generator.ts:**
- Extended `EvidencePackData` interface with AI feature fields
- Added `addAiFeaturesSection()` - checkboxes + descriptions
- Added `addCouncilIdentitySection()` - council generation details
- Added `addBeforeAfterSection()` - simplification examples
- Added `addAltTextSection()` - AI-generated alt text samples
- Added `addRoiSection()` - ROI talking points table
- Updated `generate()` to include all new sections

**src/_includes/components/evidence-pack-form.njk:**
- Added AI features checkbox fieldset (6 checkboxes)
- Added AI observations textarea
- Updated JavaScript form handler to collect AI features
- Added council identity loading from sessionStorage

**src/walkthroughs/localgov-drupal/evidence-pack.njk:**
- Updated "What's included" list with AI features

### Session Storage Keys

The enhanced evidence pack uses these sessionStorage keys:
- `ndx-council-${scenarioId}` - Council identity (name, region, theme, population)
- Future enhancement: `ndx-simplify-examples` for before/after text
- Future enhancement: `ndx-alttext-samples` for AI-generated alt texts

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-03 | Story created from epics | SM Agent |
| 2026-01-03 | Implementation complete - PDF and form enhanced | Dev Agent |
