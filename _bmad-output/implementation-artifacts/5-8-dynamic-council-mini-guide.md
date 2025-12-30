# Story 5.8: Dynamic Council Mini-Guide

Status: done

## Story

As a **council officer curious about the generated council**,
I want **a guide explaining the generation process**,
So that **I understand what makes each deployment unique**.

## Acceptance Criteria

1. **Given** I navigate to the Dynamic Council mini-guide
   **When** I read through it
   **Then** I find:
   - Explanation of council identity components
   - How content is tailored to the council theme
   - How images are generated to match local character
   - Examples of generated content variations
   - "Try this" prompts (e.g., "Notice how [theme] appears in service pages")
   **And** the guide follows documentation template standards
   **And** screenshots show real generated content examples
   **And** the guide is linked from the main walkthrough

## Tasks / Subtasks

- [x] **Task 1: Create Mini-Guide Page Structure** (AC: 1)
  - [x] 1.1 Create guide page at `src/walkthroughs/localgov-drupal/dynamic-council.njk`
  - [x] 1.2 Add navigation link from walkthrough landing page (index.njk)
  - [x] 1.3 Follow GOV.UK Design System layout patterns (created layouts/guide-dynamic.njk)
  - [x] 1.4 Ensure responsive design for desktop/tablet

- [x] **Task 2: Write Guide Content - Overview Section** (AC: 1)
  - [x] 2.1 Write introduction explaining what dynamic council generation is
  - [x] 2.2 Explain the purpose - each deployment creates a unique fictional council
  - [x] 2.3 List the components: identity, content, images
  - [x] 2.4 Add "What you'll learn" summary panel

- [x] **Task 3: Write Council Identity Section** (AC: 1)
  - [x] 3.1 Explain the council identity components (name, region, theme, population, keywords)
  - [x] 3.2 List available regions (9 English + Wales/Scotland/NI)
  - [x] 3.3 Describe theme/character types (coastal tourism, industrial heritage, market town, etc.)
  - [x] 3.4 Show how population range affects content scale
  - [x] 3.5 Include screenshot placeholder for council identity display

- [x] **Task 4: Write Content Generation Section** (AC: 1)
  - [x] 4.1 Explain how content templates incorporate council identity
  - [x] 4.2 Describe content types generated (services, guides, directories, news, homepage)
  - [x] 4.3 Show examples of how local flavour appears in content
  - [x] 4.4 Include before/after examples showing variable substitution (coastal vs industrial)
  - [x] 4.5 Add screenshot placeholders for generated content pages

- [x] **Task 5: Write Image Generation Section** (AC: 1)
  - [x] 5.1 Explain image specification collection during content generation
  - [x] 5.2 Describe image types (hero images, headshots, location photos)
  - [x] 5.3 Explain how images match the council's theme and region
  - [x] 5.4 Describe the batch generation process
  - [x] 5.5 Add screenshot placeholders for generated images

- [x] **Task 6: Create "Try This" Prompts Section** (AC: 1)
  - [x] 6.1 Create prompt: "Spot the theme in service pages"
  - [x] 6.2 Create prompt: "Find regional references in content"
  - [x] 6.3 Create prompt: "Compare hero images across sections"
  - [x] 6.4 Create prompt: "Notice councillor headshots diversity"
  - [x] 6.5 Include what to look for details in each prompt

- [x] **Task 7: Add Technical Context Section** (AC: 1)
  - [x] 7.1 Add section for technical decision-makers
  - [x] 7.2 Explain Drush command for regeneration
  - [x] 7.3 List AWS services used (Bedrock, Nova 2 models)
  - [x] 7.4 Include cost estimate (~$1.50 per generation)
  - [x] 7.5 Link to architecture/understand page for deeper dive

- [x] **Task 8: Update Walkthrough Navigation** (AC: 1)
  - [x] 8.1 Add "Dynamic Council Guide" link to index.njk navigation
  - [x] 8.2 Ensure consistent positioning with other mini-guides
  - [x] 8.3 Add appropriate description (8 minutes)

- [x] **Task 9: Screenshot Pipeline Preparation** (AC: 1)
  - [x] 9.1 Document screenshot requirements in story dev notes
  - [x] 9.2 List specific screens to capture (deferred - requires deployed environment)
  - [x] 9.3 Add screenshot placeholder divs with descriptive text

## Dev Notes

### Guide Structure

```
Dynamic Council Generation Guide
├── Introduction
│   ├── What is dynamic council generation?
│   ├── Purpose: unique fictional council per deployment
│   └── What you'll learn
├── Council Identity
│   ├── Identity components explained
│   ├── Available regions
│   ├── Theme/character types
│   ├── Population ranges
│   └── Screenshot: Council identity display
├── Content Generation
│   ├── How templates incorporate identity
│   ├── Content types generated
│   ├── Local flavour examples
│   ├── Variable substitution examples
│   └── Screenshots: Generated content pages
├── Image Generation
│   ├── Image specification collection
│   ├── Image types (hero, headshot, location)
│   ├── Theme matching
│   ├── Batch processing
│   └── Screenshots: Generated images
├── Try This: Discovery Prompts
│   ├── Spot the theme in services
│   ├── Find regional references
│   ├── Compare hero images
│   └── Notice councillor diversity
├── For Technical Readers
│   ├── Drush command usage
│   ├── AWS services used
│   ├── Cost estimate
│   └── Links to architecture
└── Back to walkthrough
```

### Council Identity Components

| Component | Description | Example |
|-----------|-------------|---------|
| Name | Fictional council name | Thornbridge District Council |
| Region | One of 12 UK regions | South West |
| Theme | Local character/focus | Coastal tourism and maritime heritage |
| Population | Size range | Medium (50,000-150,000) |
| Keywords | Flavour injectors | coastal, fishing, tourism, harbour |

### Regions Available

- North East, North West, Yorkshire and the Humber
- East Midlands, West Midlands, East of England
- London, South East, South West
- Wales, Scotland, Northern Ireland

### Theme Types

- Coastal tourism (harbour towns, seaside resorts)
- Industrial heritage (former mining, manufacturing)
- Market town (rural hub, agricultural)
- University town (student population, academic)
- Historic city (cathedral, castle, tourism)
- Commuter belt (dormitory town, transport links)
- Rural district (farming, conservation, tourism)

### Screenshot Requirements

| Screenshot ID | Description | Page/State |
|---------------|-------------|------------|
| 5-8-identity-01 | DEMO banner showing council name | Homepage |
| 5-8-identity-02 | Council identity in admin dashboard | Admin overview |
| 5-8-content-01 | Service page with local flavour | Waste & Recycling |
| 5-8-content-02 | Guide page with regional references | Planning guide |
| 5-8-content-03 | News article with council theme | Recent news |
| 5-8-images-01 | Hero image on homepage | Homepage |
| 5-8-images-02 | Councillor headshot grid | Meet the council |
| 5-8-images-03 | Location photo in directory | Directory entry |

### Try This Prompts

```yaml
spot_theme:
  title: "Spot the theme in service pages"
  prompt: "Navigate to Waste & Recycling and look for references to your council's theme. Coastal councils mention beach clean-ups. Industrial heritage councils mention former industrial sites. What theme appears in your council's content?"
  difficulty: beginner

regional_references:
  title: "Find regional references"
  prompt: "Browse to the Planning Applications guide. Look for mentions of your region's building styles, local materials, or conservation areas. Northern councils might mention stone buildings, southern councils might reference chalk or flint."
  difficulty: beginner

compare_images:
  title: "Compare hero images across sections"
  prompt: "Visit three different service pages and compare the hero images. Notice how they reflect your council's theme - coastal councils show sea views, rural councils show countryside, urban councils show town centres."
  difficulty: intermediate

councillor_headshots:
  title: "Notice councillor diversity"
  prompt: "Go to the 'Meet the Council' directory. The AI generates diverse headshots representing different ages, genders, and backgrounds typical of a local council cabinet."
  difficulty: beginner
```

### Documentation Standards

Follow GOV.UK content design patterns:
- Use simple language (reading age 9)
- Short paragraphs (max 3-4 sentences)
- Clear headings using sentence case
- Step-by-step format with numbered lists
- Include alt text for all screenshots
- Provide skip links and navigation

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 5.8]
- [Story 2-8: Documentation Template Standards] - template patterns
- [Story 3-8: AI Content Editing Mini-Guide] - similar guide structure
- [Story 4-9: AI Accessibility Mini-Guide] - similar guide structure
- [GOV.UK Content Design] - writing guidelines

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

N/A - Implementation completed without debug issues

### Completion Notes List

1. Created guide page at `src/walkthroughs/localgov-drupal/dynamic-council.njk`
2. Created new layout template `src/_includes/layouts/guide-dynamic.njk` for configurable sidebar navigation
3. Updated walkthrough index.njk with Dynamic Council Guide link and description
4. Guide includes 5 council identity component cards
5. Content generation section with coastal vs industrial comparison examples
6. Image generation section with 3 image type cards
7. 4 discovery prompts with difficulty levels and "what to look for" guidance
8. Technical context section with Drush command, AWS services, and cost estimate
9. Screenshot placeholders in place for future capture (deferred - requires deployed environment)

### File List

**Files Created:**
- src/walkthroughs/localgov-drupal/dynamic-council.njk
- src/_includes/layouts/guide-dynamic.njk

**Files Modified:**
- src/walkthroughs/localgov-drupal/index.njk

## Dependencies

- Story 5.1-5.7: Council generation module (provides functionality to document)
- Story 2.8: Documentation Template Standards
- Story 3.8: AI Content Editing Mini-Guide (pattern reference)
- Story 4.9: AI Accessibility Mini-Guide (pattern reference)
- layouts/guide.njk template exists

## Out of Scope

- Actual screenshot capture (requires deployed environment)
- Video walkthrough
- Deep technical architecture documentation (covered in Epic 6)
- Drush command tutorial (command help is sufficient)

## Definition of Done

- [x] Mini-guide page created at `src/walkthroughs/localgov-drupal/dynamic-council.njk`
- [x] Guide explains council identity components clearly
- [x] Content generation process is documented with examples
- [x] Image generation process is documented
- [x] At least 4 "Try this" discovery prompts included
- [x] Technical context section for decision-makers
- [x] Navigation link added to walkthrough index
- [x] Screenshot placeholders in place for future capture
- [x] Guide follows GOV.UK Design System patterns
- [x] Code follows project conventions

## Senior Developer Review (AI)

### Review Date
2025-12-30

### Reviewer
claude-opus-4-5-20251101

### Acceptance Criteria Verification

| AC# | Criteria | Status | Evidence |
|-----|----------|--------|----------|
| 1 | Explanation of council identity components | ✅ PASS | `dynamic-council.njk:71-128` - 5 identity cards |
| 1 | How content is tailored to the council theme | ✅ PASS | `dynamic-council.njk:135-208` - content section with comparison |
| 1 | How images are generated to match local character | ✅ PASS | `dynamic-council.njk:210-271` - image types and theme matching |
| 1 | Examples of generated content variations | ✅ PASS | `dynamic-council.njk:185-203` - coastal vs industrial comparison |
| 1 | "Try this" prompts | ✅ PASS | `dynamic-council.njk:273-342` - 4 discovery prompts |
| 1 | Guide follows documentation template standards | ✅ PASS | GOV.UK Design System patterns used throughout |
| 1 | Screenshots show real examples | ⏸️ DEFERRED | Placeholders added; requires deployed environment |
| 1 | Guide linked from main walkthrough | ✅ PASS | `index.njk:161-169` navigation link added |

### Task Completion Verification

| Task | Status | Evidence |
|------|--------|----------|
| 1.1 Create guide page | ✅ Complete | `src/walkthroughs/localgov-drupal/dynamic-council.njk` |
| 1.2 Add navigation link | ✅ Complete | `src/walkthroughs/localgov-drupal/index.njk:161-169` |
| 1.3 GOV.UK Design System | ✅ Complete | Uses govuk classes and design patterns |
| 1.4 Responsive design | ✅ Complete | CSS media queries at lines 542-560 |
| 2.1-2.4 Overview section | ✅ Complete | Introduction with "What you'll learn" panel |
| 3.1-3.5 Council Identity | ✅ Complete | 5 identity component cards with examples |
| 4.1-4.5 Content Generation | ✅ Complete | Table + coastal vs industrial comparison |
| 5.1-5.5 Image Generation | ✅ Complete | 3 image type cards + theme matching list |
| 6.1-6.5 Try This prompts | ✅ Complete | 4 discovery prompts with difficulty levels |
| 7.1-7.5 Technical Context | ✅ Complete | Drush command, AWS services, cost estimate |
| 8.1-8.3 Navigation Update | ✅ Complete | index.njk updated with new link |
| 9.1-9.3 Screenshots | ✅ Complete | Placeholders documented in dev notes |

### Issues Found

**No blocking issues found.**

Minor observations (not blocking):
1. Screenshot placeholders in place - actual screenshots require deployed environment
2. Created new `guide-dynamic.njk` layout to support configurable navigation

### Code Quality Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| Architecture | ✅ Good | New layout extends existing patterns, supports dynamic nav |
| Content | ✅ Good | Comprehensive, follows GOV.UK style, clear structure |
| Accessibility | ✅ Good | Proper headings, semantic HTML, aria labels |
| Maintainability | ✅ Good | Clear separation, reusable layout template |
| Responsiveness | ✅ Good | Mobile-friendly CSS media queries |

### Recommendation

**APPROVE** - Story 5-8 meets all acceptance criteria that can be verified without a deployed environment. Screenshot capture is appropriately deferred.

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-30 | Story created with mini-guide specifications | SM Agent |
| 2025-12-30 | Implementation complete, moved to review | Dev Agent |
| 2025-12-30 | Code review passed, approved | Review Agent |
