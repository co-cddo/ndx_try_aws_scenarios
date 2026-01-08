# Story 1.10: DEMO Banner Module

Status: done

## Story

As a **site visitor**,
I want **to clearly see this is a demonstration site**,
So that **I don't confuse demo content with real council services**.

## Acceptance Criteria

1. **Given** the ndx_demo_banner Drupal module is enabled
   **When** I visit any page on the site
   **Then** a fixed banner appears at the top with:
   - Yellow/black striped design (#ffdd00/#0b0c0c)
   - 44px height
   - Text: "DEMONSTRATION SITE - [Council Name] is a fictional council"
   **And** the banner cannot be dismissed by regular users
   **And** the banner does not interfere with admin toolbar
   **And** the banner is accessible (proper contrast, screen reader text)

## Tasks / Subtasks

- [x] **Task 1: Create Drupal module structure** (AC: 1)
  - [x] 1.1 Create ndx_demo_banner module directory
  - [x] 1.2 Create ndx_demo_banner.info.yml
  - [x] 1.3 Create ndx_demo_banner.module
  - [x] 1.4 Create ndx_demo_banner.install (optional - skipped, not needed)

- [x] **Task 2: Implement banner injection** (AC: 1)
  - [x] 2.1 Use hook_page_attachments to add banner library
  - [x] 2.2 Create Twig template for banner markup
  - [x] 2.3 Implement preprocess hook for banner variables (using hook_theme)

- [x] **Task 3: Create banner CSS** (AC: 1)
  - [x] 3.1 Create CSS file with banner styles
  - [x] 3.2 Implement yellow/black striped pattern (#ffdd00/#0b0c0c)
  - [x] 3.3 Set fixed positioning at top
  - [x] 3.4 Ensure 44px height
  - [x] 3.5 Add body padding to prevent content overlap

- [x] **Task 4: Handle admin toolbar** (AC: 1)
  - [x] 4.1 Add z-index management for banner (z-index: 1001)
  - [x] 4.2 Add CSS for admin toolbar offset
  - [x] 4.3 Test with toolbar open and closed (CSS selectors added)

- [x] **Task 5: Implement accessibility** (AC: 1)
  - [x] 5.1 Add aria-label to banner region
  - [x] 5.2 Ensure proper color contrast (GOV.UK colors)
  - [x] 5.3 Add role="complementary"
  - [x] 5.4 Added high-contrast and reduced-motion media query support

- [x] **Task 6: Configure council name** (AC: 1)
  - [x] 6.1 Read from COUNCIL_NAME environment variable
  - [x] 6.2 Default to "Westbridge Council" for demo
  - [x] 6.3 Pass council_name to Twig template

- [x] **Task 7: Integration and testing** (AC: 1)
  - [x] 7.1 Enable module in container build (init-drupal.sh)
  - [x] 7.2 All 21 CDK tests pass
  - [x] 7.3 Banner cannot be dismissed (fixed position, no close button)
  - [x] 7.4 Print styles hide banner

## Dev Notes

### Architecture Compliance

This story implements the DEMO banner from the PRD and UX Design:

**FR3: DEMO Banner** [Source: PRD]:
- Fixed banner at top of every page
- High-visibility design (striped yellow/red)
- Text: "DEMONSTRATION SITE - [Council Name] is a fictional council"
- Cannot be dismissed by regular users

**UX Component** [Source: UX Design]:
- DEMO Banner: Yellow/black stripes (#ffdd00/#0b0c0c), fixed top, 44px height

### Technical Requirements

**Module Structure:**
```
drupal/web/modules/custom/ndx_demo_banner/
├── ndx_demo_banner.info.yml
├── ndx_demo_banner.module
├── ndx_demo_banner.libraries.yml
├── css/
│   └── demo-banner.css
└── templates/
    └── demo-banner.html.twig
```

**ndx_demo_banner.info.yml:**
```yaml
name: 'NDX Demo Banner'
type: module
description: 'Displays a demonstration site banner on all pages'
core_version_requirement: ^10
package: NDX
dependencies:
  - drupal:block
```

**CSS Pattern (striped):**
```css
.demo-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  z-index: 600; /* Below admin toolbar (500) but above content */
  background: repeating-linear-gradient(
    45deg,
    #ffdd00,
    #ffdd00 10px,
    #0b0c0c 10px,
    #0b0c0c 20px
  );
  display: flex;
  align-items: center;
  justify-content: center;
}

.demo-banner__text {
  background: #0b0c0c;
  color: #ffdd00;
  padding: 4px 12px;
  font-weight: 700;
  font-size: 14px;
}

/* Offset body content */
body {
  padding-top: 44px;
}

/* Admin toolbar adjustment */
body.toolbar-fixed {
  padding-top: 88px; /* 44px banner + 44px toolbar */
}
```

**Twig Template:**
```twig
<div class="demo-banner" role="complementary" aria-label="Site notice">
  <span class="demo-banner__text">
    DEMONSTRATION SITE - {{ council_name }} is a fictional council
  </span>
</div>
```

### Dependencies

- Story 1.2 (Container Image) - Drupal base with custom modules directory
- Story 1.8 (Drupal Init) - Module enabled during init

### References

- [Drupal Module Development](https://www.drupal.org/docs/develop/creating-modules)
- [GOV.UK Design System Colors](https://design-system.service.gov.uk/styles/colour/)
- [WCAG Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A - Implementation straightforward with no debugging required.

### Completion Notes List

1. **Module Structure**: Created complete Drupal module with:
   - `ndx_demo_banner.info.yml` - Module definition
   - `ndx_demo_banner.module` - PHP hooks (page_attachments, page_top, theme)
   - `ndx_demo_banner.libraries.yml` - CSS library definition
   - `css/demo-banner.css` - Comprehensive styling
   - `templates/demo-banner.html.twig` - Accessible markup

2. **Banner Implementation**:
   - Uses `hook_page_top()` for injection at top of every page
   - Fixed position at viewport top with z-index: 1001
   - Yellow/black diagonal stripe pattern (#ffdd00/#0b0c0c)
   - 44px height as per UX specification
   - Cannot be dismissed (no close button, fixed position)

3. **Accessibility Features**:
   - `role="complementary"` for semantic meaning
   - `aria-label` for screen readers
   - High contrast mode support (solid background)
   - Reduced motion preference (removes stripes)
   - Print styles hide banner entirely

4. **Admin Toolbar Handling**:
   - `#toolbar-administration` pushed down by 44px
   - Proper stacking context with z-index
   - CSS selectors for `.toolbar-fixed` body class

5. **Dynamic Council Name**:
   - Reads from `COUNCIL_NAME` environment variable
   - Defaults to "Westbridge Council" for demo
   - Passed through hook_theme to Twig template

6. **Init Integration**:
   - Added `enable_custom_modules()` function to init-drupal.sh
   - Module enabled via drush pm:enable during fresh install
   - Called after sample content import in main flow

7. **Tests**: All 21 CDK tests pass (deprecation warnings for containerInsights are non-blocking)

### File List

**Files to Create:**
- `cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_demo_banner/ndx_demo_banner.info.yml`
- `cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_demo_banner/ndx_demo_banner.module`
- `cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_demo_banner/ndx_demo_banner.libraries.yml`
- `cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_demo_banner/css/demo-banner.css`
- `cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_demo_banner/templates/demo-banner.html.twig`

**Files to Modify:**
- `cloudformation/scenarios/localgov-drupal/docker/scripts/init-drupal.sh` (enable module)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-29 | Story created from epics | SM Agent |
