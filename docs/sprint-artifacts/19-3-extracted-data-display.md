# Story 19.3: Extracted Data Display

Status: done

## Story

As a **council planning officer**,
I want **to see all extracted application details clearly displayed**,
so that **I can verify the AI correctly identified key information**.

## Acceptance Criteria

### AC-19.3.1: Extracted Data Section

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19.3.1a | Application reference displayed | Visual inspection |
| AC-19.3.1b | Applicant name displayed | Visual inspection |
| AC-19.3.1c | Site address displayed | Visual inspection |
| AC-19.3.1d | Proposal type and description displayed | Visual inspection |
| AC-19.3.1e | Floor area and height displayed | Visual inspection |

### AC-19.3.2: Analysis Section

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19.3.2a | Overall recommendation with color badge | Visual inspection |
| AC-19.3.2b | Rationale text displayed | Visual inspection |
| AC-19.3.2c | Potential issues listed | Visual inspection |
| AC-19.3.2d | Recommendations listed | Visual inspection |

### AC-19.3.3: Visual Design

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19.3.3a | Grid layout for data (label + value) | CSS inspection |
| AC-19.3.3b | Colored badges for recommendations | Visual inspection |
| AC-19.3.3c | Blue left border on analysis section | CSS inspection |
| AC-19.3.3d | Responsive layout for mobile | Visual inspection |

## Tasks / Subtasks

- [x] Task 1: Create results container
  - [x] 1.1 Add results div with heading
  - [x] 1.2 Add extracted data section
  - [x] 1.3 Add analysis section
  - [x] 1.4 Add sandbox note

- [x] Task 2: Style results display
  - [x] 2.1 Create data grid CSS
  - [x] 2.2 Create recommendation badge styles
  - [x] 2.3 Create issues/recommendations lists
  - [x] 2.4 Add responsive breakpoints

- [x] Task 3: Add display logic
  - [x] 3.1 Create displayResults() function
  - [x] 3.2 Populate extracted data grid
  - [x] 3.3 Set recommendation badge color
  - [x] 3.4 Populate issues and recommendations

## Technical Notes

Already implemented in Story 19.1 as part of the complete web interface.

**Recommendation Badge Colors:**
- APPROVE: Green (#00703c)
- APPROVE WITH CONDITIONS: Orange (#f47738)
- REFER TO COMMITTEE / REFUSE: Red (#d4351c)

## Dependencies

- Story 19.1 (Upload Interface Foundation) - DONE
- Story 19.2 (Processing Status) - DONE

## Definition of Done

- [x] Extracted data displays in grid format
- [x] Analysis section with recommendation badge
- [x] Issues and recommendations listed
- [x] Responsive design works on mobile
- [x] Code review approved

## Dev Record

### Session Log

**2025-11-30 - Implemented as part of Story 19.1**

**Developer:** Claude Code

This functionality was implemented as part of Story 19.1's complete web interface.

**Implementation Location:**
- `cloudformation/scenarios/planning-ai/template.yaml` lines 351-422 (CSS), 499-525 (HTML), 625-667 (JS)

**Features Delivered:**
- Results container with "Analysis Results" heading
- Extracted data grid with label/value pairs:
  - Application Reference, Applicant Name, Site Address
  - Proposal Type, Description, Floor Area, Maximum Height
- Analysis section with blue left border
- Recommendation badges (approve/conditions/refer)
- Rationale text display
- Potential issues list with warning icons
- Recommendations list with checkmarks
- Sandbox note explaining production differences
- Responsive grid (single column on mobile)

**Data Fields Displayed:**
```javascript
['Application Reference', data.extractedData.applicationRef],
['Applicant Name', data.extractedData.applicantName],
['Site Address', data.extractedData.siteAddress],
['Proposal Type', data.extractedData.proposalType],
['Description', data.extractedData.proposalDescription],
['Floor Area', data.extractedData.floorArea],
['Maximum Height', data.extractedData.maxHeight]
```

**Verification:**
- All extracted fields display correctly ✓
- Recommendation badge shows with correct color ✓
- Issues and recommendations populated ✓
- Mobile responsive layout works ✓

---

_Story created: 2025-11-30_
_Epic: 19 - Planning Application AI Web Application_
