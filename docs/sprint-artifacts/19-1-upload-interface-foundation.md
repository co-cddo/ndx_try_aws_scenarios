# Story 19.1: Upload Interface Foundation

Status: done

## Story

As a **council planning officer**,
I want **a professional web interface to upload planning documents**,
so that **I can easily submit applications for AI analysis**.

## Acceptance Criteria

### AC-19.1.1: HTML Structure

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19.1.1a | GET request returns valid HTML5 document | curl test |
| AC-19.1.1b | Page has DOCTYPE and proper head structure | HTML inspection |
| AC-19.1.1c | Title is "Planning Application AI \| NDX:Try" | HTML inspection |
| AC-19.1.1d | Viewport meta tag for responsive design | HTML inspection |

### AC-19.1.2: GOV.UK Styling

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19.1.2a | Uses GOV.UK color palette (#0b0c0c, #1d70b8, etc.) | CSS inspection |
| AC-19.1.2b | Uses GOV.UK typography (GDS Transport/Arial) | CSS inspection |
| AC-19.1.2c | Buttons follow GOV.UK button patterns | Visual inspection |
| AC-19.1.2d | Focus states use yellow (#ffdd00) outline | CSS inspection |

### AC-19.1.3: Upload Interface Components

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19.1.3a | Header with NDX:Try branding visible | Visual inspection |
| AC-19.1.3b | Drag-and-drop upload zone visible | Visual inspection |
| AC-19.1.3c | Upload zone has clear instructions | Visual inspection |
| AC-19.1.3d | File input fallback for non-drag browsers | HTML inspection |
| AC-19.1.3e | Sample document button available | Visual inspection |
| AC-19.1.3f | Results display area (initially hidden) | HTML inspection |

### AC-19.1.4: Accessibility

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19.1.4a | Lang attribute set to "en-GB" | HTML inspection |
| AC-19.1.4b | Form controls have proper labels | ARIA inspection |
| AC-19.1.4c | Skip link provided | Keyboard test |
| AC-19.1.4d | Color contrast meets WCAG AA | Contrast checker |
| AC-19.1.4e | Keyboard navigable throughout | Keyboard test |

## Tasks / Subtasks

- [ ] Task 1: Create HTML structure
  - [ ] 1.1 Add render_html() function to Lambda
  - [ ] 1.2 Create HTML5 boilerplate
  - [ ] 1.3 Add viewport and meta tags
  - [ ] 1.4 Add GOV.UK inline styles

- [ ] Task 2: Build upload interface
  - [ ] 2.1 Create header with NDX:Try branding
  - [ ] 2.2 Create drag-and-drop upload zone
  - [ ] 2.3 Add file input fallback
  - [ ] 2.4 Add "Use Sample Document" button
  - [ ] 2.5 Create results display area

- [ ] Task 3: Add accessibility features
  - [ ] 3.1 Add lang="en-GB" attribute
  - [ ] 3.2 Add skip links
  - [ ] 3.3 Add proper ARIA attributes
  - [ ] 3.4 Add focus indicators

- [ ] Task 4: Update Lambda handler
  - [ ] 4.1 Check HTTP method (GET vs POST)
  - [ ] 4.2 Return HTML for GET requests
  - [ ] 4.3 Return JSON for POST requests

## Technical Notes

### Lambda Handler Structure

```python
def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')

    if method == 'GET':
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'text/html'},
            'body': render_upload_html()
        }

    # POST handling for document analysis...
```

### Upload Zone HTML

```html
<div class="upload-zone" id="uploadZone">
  <svg><!-- Upload icon --></svg>
  <p>Drag and drop a planning document here</p>
  <p class="small">or</p>
  <label class="govuk-button govuk-button--secondary">
    Choose file
    <input type="file" accept=".pdf,.doc,.docx" hidden>
  </label>
</div>
```

## Dependencies

- CloudFormation template exists
- Lambda Function URL configured

## Definition of Done

- [ ] GET request returns HTML interface
- [ ] Upload zone with drag-and-drop visible
- [ ] Sample document button available
- [ ] Accessibility requirements met
- [ ] Code review approved
- [ ] Deployed and tested on AWS

## Dev Record

### Session Log

**2025-11-30 - Implementation Complete**

**Developer:** Claude Code

**Files Modified:**
- `cloudformation/scenarios/planning-ai/template.yaml` - Added web interface

**Implementation Details:**

1. **HTML Structure**
   - Added `render_upload_html()` function (~540 lines HTML/CSS/JS)
   - DOCTYPE, proper head structure with viewport meta tag
   - Title: "Planning Application AI | NDX:Try"
   - Lang attribute set to "en-GB"

2. **GOV.UK Styling**
   - Color palette: #0b0c0c (text), #1d70b8 (links), #00703c (success), #ffdd00 (focus)
   - Typography: GDS Transport / Arial fallback
   - Button patterns with proper focus states
   - Phase banner with "Sandbox" tag

3. **Upload Interface Components**
   - Header with NDX:Try branding
   - Drag-and-drop upload zone with visual feedback
   - File input fallback for non-drag browsers
   - "Use Sample Document" button
   - "Analyze Document" button (hidden until file selected)
   - Loading spinner with status message
   - Results display area with extracted data grid

4. **Accessibility Features**
   - Skip link for keyboard users
   - ARIA attributes on upload zone, loading, and results areas
   - aria-live="polite" for dynamic content
   - Proper focus states with yellow (#ffdd00) outline
   - Keyboard navigable throughout

5. **Lambda Handler Update**
   - GET requests return HTML interface
   - POST requests return JSON analysis
   - Method detection via event.requestContext.http.method

**Deployed Stack:**
- Stack name: `ndx-try-planning-ai`
- Function URL: `https://zh7vdzicwrc2aiqx4s6cypcwfu0qcmus.lambda-url.us-west-2.on.aws/`

**Verification:**
- GET returns valid HTML5 document ✓
- POST returns JSON with extractedData and analysis ✓
- Upload zone visible with drag-and-drop ✓
- Sample document button functional ✓
- GOV.UK styling applied ✓

---

_Story created: 2025-11-30_
_Epic: 19 - Planning Application AI Web Application_
