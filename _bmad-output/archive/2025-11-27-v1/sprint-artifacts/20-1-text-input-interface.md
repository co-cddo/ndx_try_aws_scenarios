# Story 20.1: Text Input Interface

Status: done

## Story

As a **council FOI officer**,
I want **a professional web interface to input text for PII redaction**,
so that **I can easily submit FOI documents for automatic redaction**.

## Acceptance Criteria

### AC-20.1.1: HTML Structure

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.1.1a | GET request returns valid HTML5 document | curl test |
| AC-20.1.1b | Page has DOCTYPE and proper head structure | HTML inspection |
| AC-20.1.1c | Title is "FOI Redaction | NDX:Try" | HTML inspection |
| AC-20.1.1d | Viewport meta tag for responsive design | HTML inspection |

### AC-20.1.2: GOV.UK Styling

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.1.2a | Uses GOV.UK color palette (#0b0c0c, #1d70b8, etc.) | CSS inspection |
| AC-20.1.2b | Uses GOV.UK typography (GDS Transport/Arial) | CSS inspection |
| AC-20.1.2c | Buttons follow GOV.UK button patterns | Visual inspection |
| AC-20.1.2d | Focus states use yellow (#ffdd00) outline | CSS inspection |

### AC-20.1.3: Input Interface Components

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.1.3a | Header with NDX:Try branding visible | Visual inspection |
| AC-20.1.3b | Large textarea for text input visible | Visual inspection |
| AC-20.1.3c | Character count indicator displayed | Visual inspection |
| AC-20.1.3d | "Use Sample Document" button available | Visual inspection |
| AC-20.1.3e | "Redact Document" button available | Visual inspection |
| AC-20.1.3f | Results display area (initially hidden) | HTML inspection |

### AC-20.1.4: Accessibility

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.1.4a | Lang attribute set to "en-GB" | HTML inspection |
| AC-20.1.4b | Form controls have proper labels | ARIA inspection |
| AC-20.1.4c | Skip link provided | Keyboard test |
| AC-20.1.4d | Color contrast meets WCAG AA | Contrast checker |

## Tasks / Subtasks

- [ ] Task 1: Add render_redaction_html() function
  - [ ] 1.1 Create HTML5 boilerplate
  - [ ] 1.2 Add viewport and meta tags
  - [ ] 1.3 Add GOV.UK inline styles

- [ ] Task 2: Build input interface
  - [ ] 2.1 Create header with NDX:Try branding
  - [ ] 2.2 Create large textarea
  - [ ] 2.3 Add character count indicator
  - [ ] 2.4 Add "Use Sample Document" button
  - [ ] 2.5 Create results display area

- [ ] Task 3: Add accessibility features
  - [ ] 3.1 Add lang="en-GB" attribute
  - [ ] 3.2 Add skip links
  - [ ] 3.3 Add proper ARIA attributes

- [ ] Task 4: Update Lambda handler
  - [ ] 4.1 Check HTTP method (GET vs POST)
  - [ ] 4.2 Return HTML for GET requests
  - [ ] 4.3 Update Function URL CORS for GET

## Technical Notes

**Sample FOI Document:**
```
Dear Council,

This is a Freedom of Information request.

I am requesting the following information:
1. Council expenditure records for John Smith (john.smith@email.com)
2. Communications sent to 45 Oak Street, London, SW1A 1AA
3. Phone records for contact number 07700 900123

My name is Sarah Jones and I can be contacted at:
Email: sarah.jones@requestor.com
Address: 12 High Street, Manchester, M1 1AA
```

## Dependencies

- CloudFormation template exists
- Lambda Function URL configured

## Definition of Done

- [ ] GET request returns HTML interface
- [ ] Textarea visible with character count
- [ ] Sample document button available
- [ ] Accessibility requirements met
- [ ] Code review approved
- [ ] Deployed and tested on AWS

## Dev Record

### Session Log

**2025-11-30 - Implementation Complete (Pending Deployment)**

**Developer:** Claude Code

**Files Modified:**
- `cloudformation/scenarios/foi-redaction/template.yaml` - Added web interface

**Implementation Details:**

1. **HTML Structure**
   - Added `render_redaction_html()` function (~500 lines HTML/CSS/JS)
   - DOCTYPE, proper head structure with viewport meta tag
   - Title: "FOI Redaction | NDX:Try"
   - Lang attribute set to "en-GB"

2. **GOV.UK Styling**
   - Color palette: #0b0c0c (text), #1d70b8 (links), #00703c (success), #ffdd00 (focus)
   - Typography: GDS Transport / Arial fallback
   - Button patterns with proper focus states
   - Phase banner with "Sandbox" tag

3. **Input Interface Components**
   - Header with NDX:Try branding
   - Large textarea with 5,000 character limit
   - Character count indicator (live update)
   - "Use Sample Document" button with realistic FOI text
   - "Redact Document" button (disabled until text entered)
   - Loading spinner with status message
   - Results display with:
     - Summary cards (redaction count, PII types, avg confidence)
     - Redacted document output with styled markers
     - Redaction details table with confidence bars
     - "Redact Another Document" button

4. **Accessibility Features**
   - Skip link for keyboard users
   - ARIA attributes on textarea, loading, and results areas
   - aria-live="polite" for dynamic content
   - Proper label and hint text
   - Focus states with yellow (#ffdd00) outline

5. **Lambda Handler Update**
   - GET requests return HTML interface
   - POST requests return JSON redaction
   - Updated Function URL CORS to include GET method

**Deployment Status:**
- ✅ DEPLOYED to ndx-try-foi-redaction stack
- Function URL: `https://w6fqqfs2g4snys5reifxovnvae0nmkrq.lambda-url.us-west-2.on.aws/`

**Verification:**
- GET request returns HTML interface ✓
- POST request returns JSON redaction ✓
- PII detection working (NAME, EMAIL, PHONE) ✓

---

_Story created: 2025-11-30_
_Epic: 20 - FOI Redaction Web Application_
