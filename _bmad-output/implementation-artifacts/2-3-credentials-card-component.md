# Story 2.3: Credentials Card Component

Status: done

## Story

As a **council officer after successful deployment**,
I want **easy access to my Drupal credentials**,
So that **I can log in immediately without searching CloudFormation outputs**.

## Acceptance Criteria

1. **Given** the CloudFormation stack has completed successfully
   **When** the credentials card displays
   **Then** I see:
   - Drupal site URL (clickable link)
   - Admin username with copy button
   - Admin password (hidden by default) with show/hide toggle and copy button
   - Direct "Log in to Admin" button
   **And** copy buttons provide visual feedback on success
   **And** the card uses GOV.UK component patterns
   **And** sensitive data is not logged or exposed in browser history

## Tasks / Subtasks

- [x] **Task 1: Create credentials card component** (AC: 1)
  - [x] 1.1 Create `credentials-card.njk` component
  - [x] 1.2 Include in scenario.njk layout (after deployment success)
  - [x] 1.3 Design card layout following GOV.UK patterns
  - [x] 1.4 Add placeholder content with instructions

- [x] **Task 2: Implement Drupal URL display** (AC: 1)
  - [x] 2.1 Display site URL as editable input (user pastes their URL)
  - [x] 2.2 Add copy button for URL
  - [x] 2.3 Add "Open" button (opens in new tab with noopener)

- [x] **Task 3: Implement username field** (AC: 1)
  - [x] 3.1 Display admin username
  - [x] 3.2 Add copy button with feedback
  - [x] 3.3 Style consistently with GOV.UK patterns

- [x] **Task 4: Implement password field** (AC: 1)
  - [x] 4.1 Password hidden by default (type="password")
  - [x] 4.2 Add show/hide toggle button with emoji icons
  - [x] 4.3 Add copy button with feedback
  - [x] 4.4 No password logging, autocomplete="off"

- [x] **Task 5: Add login button** (AC: 1)
  - [x] 5.1 Create "Log in to Drupal Admin" button
  - [x] 5.2 Link dynamically updates based on URL input
  - [x] 5.3 Style as primary action with arrow icon

- [x] **Task 6: Implement copy functionality** (AC: 1)
  - [x] 6.1 Create JavaScript for Clipboard API with fallback
  - [x] 6.2 Show visual feedback on copy success ("Copied!" + green styling)
  - [x] 6.3 Handle copy failure gracefully (select text for manual copy)
  - [x] 6.4 Add aria-live announcement for screen readers

- [x] **Task 7: Security and accessibility** (AC: 1)
  - [x] 7.1 No sensitive data in console logs
  - [x] 7.2 Password field uses appropriate aria labels
  - [x] 7.3 Copy buttons accessible via keyboard
  - [x] 7.4 Visual feedback meets colour contrast (#00703c on white)

## Dev Notes

### Architecture Compliance

This story implements the Credentials Card component from Epic 2:

**From Epic 2:**
- Credentials Card with copy buttons
- Drupal site URL, admin username, admin password
- Show/hide toggle for password
- Direct "Log in to Admin" button

**From UX Design:**
- Credentials Card: Copy buttons, show/hide password, direct admin login link
- GOV.UK component patterns

### Technical Requirements

**Credentials to Display (from CloudFormation Outputs):**
- DrupalUrl - URL to access LocalGov Drupal
- AdminUsername - Drupal admin username (typically "admin")
- AdminPassword - Drupal admin password (from Secrets Manager)

**Copy Button Implementation:**
```javascript
navigator.clipboard.writeText(text)
  .then(() => showCopySuccess())
  .catch(() => showCopyFallback());
```

**Password Toggle:**
- Hidden: `type="password"` or text with dots
- Shown: `type="text"` or actual password
- Toggle button with icon change

**Security Considerations:**
- Do not log password to console
- Clear password from clipboard after 30 seconds (optional)
- Use `autocomplete="off"` on password fields
- Ensure password not cached in browser history

### Dependencies

- Story 2.2 (Deployment Progress) - Shows after deployment completes
- Story 1.12 (CloudFormation Outputs) - Provides credentials format

### References

- [GOV.UK Input Component](https://design-system.service.gov.uk/components/input/)
- [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A - Implementation followed existing 11ty/Nunjucks patterns.

### Completion Notes List

1. **Component Architecture**: Created `credentials-card.njk` as a reusable component included after `deployment-success.njk` in the scenario layout.

2. **Copy Functionality**: JavaScript uses Clipboard API with fallback to `document.execCommand('copy')` for older browsers. Visual feedback shows "Copied!" with green styling for 2 seconds.

3. **Password Toggle**: Show/hide toggle with emoji icons (👁/🙈) and aria-pressed state. Password field uses `type="password"` by default, `type="text"` when shown.

4. **URL Editing**: URL input is editable so users can paste their actual DrupalUrl from CloudFormation Outputs. Login button URL updates dynamically when URL changes.

5. **Accessibility Features**:
   - aria-live region for copy/toggle announcements
   - Proper aria-label on all buttons
   - Keyboard accessible (all buttons)
   - Focus states with 3px yellow outline
   - Screen reader text for status changes

6. **Security Considerations**:
   - No password logging to console
   - autocomplete="off" on password field
   - No sensitive data in URL parameters

7. **Build Verification**: 97 pages built successfully with 186 assets copied.

### File List

**Files Created:**
- `src/_includes/components/credentials-card.njk` - Credentials display component
- `src/assets/js/credentials-card.js` - Copy and toggle functionality

**Files Modified:**
- `src/_includes/layouts/scenario.njk` - Added credentials-card include and script
- `src/assets/css/custom.css` - Added credentials card styles

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-29 | Story created from epics | SM Agent |
