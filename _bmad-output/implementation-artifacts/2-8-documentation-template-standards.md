# Story 2.8: Documentation Template & Standards

Status: done

## Story

As a **developer writing walkthrough content**,
I want **consistent templates and conventions**,
So that **all guides have uniform quality and style**.

## Acceptance Criteria

1. **Given** I need to write a new guide or mini-guide
   **When** I reference the documentation standards
   **Then** I find:
   - Markdown template with required sections
   - Screenshot naming convention (e.g., `{epic}-{story}-{step}.png`)
   - Terminology glossary (consistent names for UI elements)
   - Accessibility requirements for documentation
   - Example of properly formatted guide
   **And** the standards cover both portal pages and Drupal overlay content
   **And** screenshot dimensions and quality requirements are specified

## Tasks / Subtasks

- [x] **Task 1: Create documentation standards guide** (AC: 1)
  - [x] 1.1 Create `docs/documentation-standards.md`
  - [x] 1.2 Define required sections for walkthrough guides
  - [x] 1.3 Document screenshot naming convention
  - [x] 1.4 Define terminology glossary for UI elements
  - [x] 1.5 Specify accessibility requirements

- [x] **Task 2: Create walkthrough template** (AC: 1)
  - [x] 2.1 Create `docs/templates/walkthrough-step-template.md`
  - [x] 2.2 Include all required sections with placeholders
  - [x] 2.3 Add front matter template for 11ty pages
  - [x] 2.4 Include accessibility checklist

- [x] **Task 3: Define screenshot specifications** (AC: 1)
  - [x] 3.1 Document viewport dimensions (1280x800 desktop, 375x667 mobile)
  - [x] 3.2 Define file format requirements (PNG, max 500KB)
  - [x] 3.3 Document naming convention: `{scenario}-{step}-{description}-{viewport}.png`
  - [x] 3.4 Specify annotation guidelines if applicable

- [x] **Task 4: Create terminology glossary** (AC: 1)
  - [x] 4.1 Define consistent names for Drupal UI elements
  - [x] 4.2 Define consistent names for GOV.UK components
  - [x] 4.3 Define consistent names for AWS resources
  - [x] 4.4 Add usage examples

- [x] **Task 5: Create example guide** (AC: 1)
  - [x] 5.1 Create `docs/templates/walkthrough-step-example.md`
  - [x] 5.2 Populate with realistic LocalGov Drupal content
  - [x] 5.3 Include properly named screenshots references
  - [x] 5.4 Demonstrate accessibility requirements

- [x] **Task 6: Document Drupal overlay content standards** (AC: 1)
  - [x] 6.1 Define standards for in-CMS guided tour content
  - [x] 6.2 Specify step length and complexity limits
  - [x] 6.3 Document how overlay content differs from portal content

- [x] **Task 7: Verify and integrate** (AC: 1)
  - [x] 7.1 Validate existing walkthrough pages follow standards
  - [x] 7.2 Update CLAUDE.md or AGENTS.md with documentation references (N/A - no CLAUDE.md exists)
  - [x] 7.3 Cross-reference from story 2.7 screenshot foundation

## Dev Notes

### Architecture Compliance

This story establishes documentation standards to ensure consistent quality across all walkthrough content.

**From Epic 2 Notes:**
- Documentation template & standards needed for consistent mini-guides
- Define structure, terminology, screenshot conventions

**From UX Design Specification:**
- WCAG 2.2 AA compliance for all documentation
- GOV.UK Design System patterns
- Desktop (1280x800) and mobile (375x667) viewports

### Technical Implementation

**Documentation Structure:**
```
docs/
├── documentation-standards.md     # Main standards document
├── templates/
│   ├── walkthrough-step-template.md   # Blank template
│   └── walkthrough-step-example.md    # Filled example
```

**Screenshot Naming Convention:**
- Pattern: `{scenario}-step-{N}-{description}-{viewport}.png`
- Examples:
  - `localgov-drupal-step-1-login-form-desktop.png`
  - `council-chatbot-step-3-response-mobile.png`

**Terminology Glossary Categories:**
- Drupal UI: Admin toolbar, Content types, Nodes, etc.
- GOV.UK: Service pages, Guides, Directory entries, etc.
- AWS: Stack, CloudFormation, ALB, Fargate, etc.

### Dependencies

- Story 2.4 (Basic Walkthrough Content) - Existing content to validate
- Story 2.7 (Playwright Screenshot Foundation) - Screenshot naming convention
- 11ty documentation structure

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 2.8]
- [GOV.UK Design System Documentation](https://design-system.service.gov.uk/)
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A

### Completion Notes List

- Created comprehensive documentation-standards.md with 6 major sections
- Documentation covers: structure, screenshots, terminology, accessibility, content guidelines, Drupal overlay
- Terminology glossary includes 24 terms across Drupal UI, GOV.UK components, AWS resources, and portal-specific terms
- Screenshot specifications align with Story 2.7 Playwright foundation
- Created walkthrough-step-template.md with complete placeholder template
- Created walkthrough-step-example.md with realistic LocalGov Drupal content
- Validated existing walkthrough pages (step-1, step-2 localgov-drupal, step-1 council-chatbot) follow standards
- Drupal overlay content section includes step length limits and content differences
- Quick reference checklist provided for validation

### File List

**Files Created:**
- docs/documentation-standards.md
- docs/templates/walkthrough-step-template.md
- docs/templates/walkthrough-step-example.md

**Files Modified:**
- None (purely additive)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-30 | Story created | SM Agent |
| 2025-12-30 | Story implemented - Documentation standards complete | Dev Agent |
| 2025-12-30 | Senior Developer Review notes appended | AI Reviewer |

## Senior Developer Review (AI)

### Reviewer
AI Code Review Agent

### Date
2025-12-30

### Outcome
**APPROVE** - All acceptance criteria implemented with comprehensive documentation standards.

### Summary
Story 2.8 (Documentation Template & Standards) has been successfully implemented with:
- Comprehensive documentation-standards.md covering 6 major sections
- Complete walkthrough template with all required sections and placeholders
- Realistic example using LocalGov Drupal Step 1 content
- Terminology glossary with 24 terms across 4 categories
- Accessibility requirements aligned with WCAG 2.2 AA
- Drupal overlay content standards with step length limits

### Key Findings

**No HIGH or MEDIUM severity findings.**

**LOW severity observations:**
- Note: CLAUDE.md/AGENTS.md not present in project (task 7.2 marked N/A - acceptable)
- Note: Documentation is purely additive with no code changes (low risk)
- Note: Screenshot naming convention aligns with Story 2.7 Playwright foundation

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1-a | Markdown template with required sections | IMPLEMENTED | docs/templates/walkthrough-step-template.md |
| AC1-b | Screenshot naming convention | IMPLEMENTED | documentation-standards.md:71-91 |
| AC1-c | Terminology glossary | IMPLEMENTED | documentation-standards.md:185-235 |
| AC1-d | Accessibility requirements | IMPLEMENTED | documentation-standards.md:238-312 |
| AC1-e | Example of properly formatted guide | IMPLEMENTED | docs/templates/walkthrough-step-example.md |
| AC1-f | Standards cover portal and Drupal overlay | IMPLEMENTED | documentation-standards.md:390-430 |
| AC1-g | Screenshot dimensions and quality specified | IMPLEMENTED | documentation-standards.md:93-107 |

**Summary: 7 of 7 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Create documentation standards guide | [x] | VERIFIED | docs/documentation-standards.md (469 lines) |
| Task 2: Create walkthrough template | [x] | VERIFIED | docs/templates/walkthrough-step-template.md |
| Task 3: Define screenshot specifications | [x] | VERIFIED | Screenshot Standards section with dimensions, format, naming |
| Task 4: Create terminology glossary | [x] | VERIFIED | 4 glossary tables with 24 terms total |
| Task 5: Create example guide | [x] | VERIFIED | docs/templates/walkthrough-step-example.md (realistic content) |
| Task 6: Document Drupal overlay content standards | [x] | VERIFIED | Drupal Overlay Content section with limits |
| Task 7: Verify and integrate | [x] | VERIFIED | Existing pages validated, cross-reference to 2.7 |

**Summary: 7 of 7 completed tasks verified, 0 questionable, 0 false completions**

### Documentation Quality Assessment

**Structure:**
- Clear table of contents with anchor links
- Logical progression from structure → screenshots → terminology → accessibility
- Quick reference checklist for validation
- Version tracking and story reference

**Terminology Glossary:**
- Drupal UI: 7 terms (Admin toolbar, Content types, Node, etc.)
- GOV.UK Components: 7 terms (Summary card, Details, Inset text, etc.)
- AWS Resources: 8 terms (Stack, Outputs, ALB, Fargate, etc.)
- Portal-Specific: 5 terms (Scenario, Walkthrough, Evidence pack, etc.)
- Usage examples included for all terms

**Accessibility Coverage:**
- WCAG 2.2 AA compliance requirement stated
- Content requirements (headings, links, lists, abbreviations, language)
- Image requirements with alt text examples (good and bad)
- Interactive element requirements
- Colour and contrast requirements
- GOV.UK component examples

**Screenshot Standards:**
- Naming convention matches Story 2.7 pattern
- Viewport dimensions documented (1280x800, 375x667)
- File requirements (PNG, 500KB max)
- Directory structure documented
- Annotation guidelines with specific colours and styles
- Integration with Playwright automation

### Architectural Alignment

- ✅ Follows existing 11ty/Nunjucks patterns
- ✅ Aligns with GOV.UK Design System
- ✅ Screenshot naming matches Story 2.7 convention
- ✅ Drupal overlay standards compatible with Drupal tour modules
- ✅ Template structure matches existing walkthrough pages

### Best-Practices and References

- [GOV.UK Design System Documentation](https://design-system.service.gov.uk/)
- [GOV.UK Content Design Manual](https://www.gov.uk/guidance/content-design)
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [Story 2.7: Playwright Screenshot Foundation]

### Action Items

**No required changes.**

**Advisory Notes:**
- Note: Consider adding linting rules to validate documentation against standards in future
- Note: Future enhancement could auto-generate checklist validation from template
