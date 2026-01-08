# Story 1.11: First Login Welcome Experience

Status: done

## Story

As a **council officer logging in for the first time**,
I want **a welcoming orientation experience**,
So that **I feel confident navigating the CMS**.

## Acceptance Criteria

1. **Given** I have logged into the Drupal admin for the first time
   **When** the dashboard loads
   **Then** I see the council name prominently displayed
   **And** a "Start Here" prompt or quick orientation is visible
   **And** the admin dashboard shows clear navigation to key areas
   **And** the experience is consistent with GOV.UK design patterns

## Tasks / Subtasks

- [x] **Task 1: Create ndx_welcome Drupal module** (AC: 1)
  - [x] 1.1 Create ndx_welcome module directory structure
  - [x] 1.2 Create ndx_welcome.info.yml
  - [x] 1.3 Create ndx_welcome.module (with hook_theme)
  - [x] 1.4 Create ndx_welcome.libraries.yml

- [x] **Task 2: Implement welcome block** (AC: 1)
  - [x] 2.1 Create custom block plugin (WelcomeBlock.php)
  - [x] 2.2 Display council name from COUNCIL_NAME env var
  - [x] 2.3 Include "Start Here" badge call-to-action
  - [x] 2.4 Add quick links: Manage Content, Media Library, View Site, Docs

- [x] **Task 3: Create welcome CSS** (AC: 1)
  - [x] 3.1 Create CSS file with GOV.UK-inspired styling
  - [x] 3.2 Council name as prominent 32px heading with blue underline
  - [x] 3.3 Quick links as card grid with hover/focus states
  - [x] 3.4 Add responsive styles for mobile

- [x] **Task 4: Configure block placement** (AC: 1)
  - [x] 4.1 Install hook places block on /admin/content page
  - [x] 4.2 Block visible for authenticated users
  - [x] 4.3 Weight -100 ensures top placement

- [x] **Task 5: Integration** (AC: 1)
  - [x] 5.1 Enable module in init-drupal.sh enable_custom_modules()
  - [x] 5.2 All 21 CDK tests pass
  - [x] 5.3 Quick links use Drupal Url::fromRoute() for admin paths

## Dev Notes

### Architecture Compliance

This story implements the First Login Welcome Experience from the Epic:

**From Epic 1:**
- First login welcome experience - council name prominently displayed, quick orientation

**From UX Design:**
- Experience consistent with GOV.UK design patterns
- Clear navigation to key areas

### Technical Requirements

**Module Structure:**
```
drupal/web/modules/custom/ndx_welcome/
├── ndx_welcome.info.yml
├── ndx_welcome.module
├── ndx_welcome.libraries.yml
├── src/
│   └── Plugin/
│       └── Block/
│           └── WelcomeBlock.php
├── css/
│   └── welcome.css
└── templates/
    └── welcome-block.html.twig
```

**Welcome Block Content:**
- Council name as heading (from COUNCIL_NAME env var)
- "Welcome to LocalGov Drupal" subheading
- Brief orientation text
- Quick links section:
  - Edit content (Content admin)
  - Manage media (Media library)
  - View site (Frontend)
  - Help & documentation (external link or internal guide)

**CSS Pattern:**
- GOV.UK typography (GDS Transport font if available, fallback to sans-serif)
- GOV.UK colors (#0b0c0c for text, #1d70b8 for links)
- Prominent heading for council name
- Card-style layout for quick links
- Responsive design for admin theme

### Dependencies

- Story 1.2 (Container Image) - Drupal base with custom modules directory
- Story 1.8 (Drupal Init) - Module enabled during init
- Story 1.10 (DEMO Banner) - Council name env var pattern

### References

- [Drupal Block Plugin API](https://www.drupal.org/docs/drupal-apis/block-api)
- [GOV.UK Design System Typography](https://design-system.service.gov.uk/styles/typography/)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A - Implementation straightforward with no debugging required.

### Completion Notes List

1. **Module Structure**: Created complete Drupal module with:
   - `ndx_welcome.info.yml` - Module definition with block dependency
   - `ndx_welcome.module` - PHP hooks (help, theme)
   - `ndx_welcome.libraries.yml` - CSS library definition
   - `ndx_welcome.install` - Install/uninstall hooks for block placement
   - `src/Plugin/Block/WelcomeBlock.php` - Block plugin class
   - `css/welcome.css` - GOV.UK-inspired styling
   - `templates/welcome-block.html.twig` - Accessible markup

2. **Welcome Block Features**:
   - Council name prominently displayed as 32px heading
   - Blue 4px underline accent (GOV.UK style)
   - "Welcome to LocalGov Drupal" subtitle
   - Introduction paragraph explaining the demo
   - Green "Start Here" badge with call-to-action

3. **Quick Links**:
   - Manage Content (/admin/content)
   - Media Library (/admin/content/media)
   - View Site (frontend)
   - LocalGov Drupal Docs (external, opens in new tab)
   - Card-style grid layout with icons
   - Hover and focus states for accessibility

4. **Accessibility Features**:
   - `role="region"` with `aria-labelledby`
   - Yellow focus rings (#ffdd00) on links
   - External link has "(opens in new tab)" for screen readers
   - Print-friendly styles

5. **Block Placement**:
   - Install hook creates block instance
   - Placed on /admin/content page via request_path visibility
   - Weight -100 for top placement
   - Uninstall hook removes block

6. **Init Integration**:
   - Module enabled via drush pm:enable in init-drupal.sh
   - Added after ndx_demo_banner in enable_custom_modules()

7. **Tests**: All 21 CDK tests pass

### File List

**Files to Create:**
- `cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_welcome/ndx_welcome.info.yml`
- `cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_welcome/ndx_welcome.module`
- `cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_welcome/ndx_welcome.libraries.yml`
- `cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_welcome/src/Plugin/Block/WelcomeBlock.php`
- `cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_welcome/css/welcome.css`
- `cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_welcome/templates/welcome-block.html.twig`

**Files to Modify:**
- `cloudformation/scenarios/localgov-drupal/docker/scripts/init-drupal.sh` (enable module)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-29 | Story created from epics | SM Agent |
