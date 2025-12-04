# Epic 18: Council Chatbot Web Application - Technical Specification

**Version:** 1.0
**Created:** 2025-11-30
**Epic Status:** Contexted
**PRD Reference:** docs/prd-scenario-applications.md

---

## Executive Summary

Transform the Council Chatbot Lambda from a JSON API into a full web application with a professional chat interface. Users visiting the Lambda Function URL will see a GOV.UK-styled chat interface instead of raw JSON.

**Current State:** `{"error": "Message is required"}` on GET request
**Target State:** Full chat interface with welcome message, input field, conversation history

---

## Architecture Decision

### Approach: Lambda HTML Response (Option B)

The Lambda function will serve HTML for GET requests and continue serving JSON for POST requests. This eliminates the need for separate S3/CloudFront hosting while providing a complete user experience.

**Rationale:**
1. Single deployment artifact (one CloudFormation stack)
2. No additional infrastructure (S3, CloudFront)
3. Faster iteration during development
4. Simpler CORS configuration (same-origin)

**Trade-offs:**
- Larger Lambda payload (HTML + CSS + JS inline)
- No CDN caching (acceptable for demo)
- Limited to Lambda timeout for page loads (acceptable)

---

## Technical Requirements

### TR-18.1: HTML Response for GET Requests

```python
def lambda_handler(event, context):
    # Detect GET request
    if event.get('requestContext', {}).get('http', {}).get('method') == 'GET':
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'text/html'},
            'body': render_chat_html()
        }
    # Existing POST handling for chat API
    ...
```

### TR-18.2: GOV.UK Frontend Styling

- Use GDS Frontend CSS (inline or CDN with fallback)
- GDS color palette: `#0b0c0c` (text), `#1d70b8` (links), `#00703c` (success)
- GDS typography: system fonts with GDS Transport fallback
- Focus states: `3px solid #ffdd00` outline

### TR-18.3: Chat Interface Components

1. **Header**: NDX:Try branding + "Council Chatbot Demo"
2. **Sandbox Banner**: Yellow warning bar with demo disclaimer
3. **Chat Container**: Scrollable message area
4. **Message Bubbles**: User (right, blue) / Bot (left, grey)
5. **Input Area**: Text input + Send button
6. **Sample Questions**: Quick-select buttons

### TR-18.4: JavaScript Functionality

```javascript
// Core functions required
async function sendMessage(message) { ... }
function displayUserMessage(text) { ... }
function displayBotMessage(response) { ... }
function showLoadingIndicator() { ... }
function hideLoadingIndicator() { ... }
function saveToSessionStorage() { ... }
function loadFromSessionStorage() { ... }
```

### TR-18.5: Accessibility Requirements

- WCAG 2.2 AA compliance
- Keyboard navigation: Tab through all interactive elements
- Screen reader: ARIA labels on input, button, messages
- Focus management: Auto-focus input after bot response
- Color contrast: 4.5:1 minimum ratio

### TR-18.6: Error Handling

- Network error: "Unable to connect. Please try again."
- API error: Display error message from response
- Timeout: "Request timed out. Please try again."
- Empty input: Prevent submission, visual feedback

---

## Story Breakdown

### Story 18.1: Chat Interface Foundation
- HTML structure with GOV.UK styling
- Welcome message display
- Text input and send button
- Basic message bubble rendering

### Story 18.2: API Integration & Response Display
- POST to same Lambda URL
- Loading indicator
- Response rendering with topic badge
- Error handling

### Story 18.3: Conversation History & Sample Questions
- Session storage persistence
- Sample question quick-select
- Clear conversation button
- Message limit (20)

### Story 18.4: CloudFormation Deployment Integration
- Update Lambda code in template
- Verify GET returns HTML
- Stack output URL works
- cfn-lint validation passes

### Story 18.5: Screenshot Capture & Validation
- Playwright scripts for 16 screenshots
- Screenshots match YAML specifications
- Zero 404 errors in walkthroughs

### Story 18.6: Comprehensive Test Suite
- Unit tests for Lambda handler
- E2E tests for chat interactions
- Accessibility tests (axe-core)
- Performance benchmarks

---

## Implementation Constraints

### IC-1: Inline Assets Only
All CSS and JavaScript must be inline in the HTML response. No external file dependencies except optional CDN with local fallback.

### IC-2: No Build Step
The HTML/CSS/JS is embedded directly in the Lambda Python code. No webpack, no compilation, no separate frontend build.

### IC-3: Lambda Size Limit
Total Lambda code (including HTML) must stay under 250KB (compressed). Current: ~15KB. HTML/CSS/JS budget: ~100KB.

### IC-4: CORS Compatibility
POST requests from the embedded page to the same URL are same-origin. No CORS issues expected.

---

## Testing Strategy

### Unit Tests (Python)
- Test GET returns HTML with correct content-type
- Test POST returns JSON
- Test keyword matching
- Test error responses

### E2E Tests (Playwright)
- Page loads with welcome message
- Send button triggers API call
- Response displays in conversation
- Sample questions work
- Session persistence works

### Accessibility Tests (axe-core)
- No WCAG 2.2 AA violations
- Keyboard navigation functional
- Screen reader compatible

### Performance Tests
- Page load < 3 seconds
- API response < 2 seconds
- No memory leaks on repeated use

---

## Dependencies

### Required
- GDS Frontend CSS (v5.x) - inline or CDN
- Lambda Python 3.12 runtime

### Optional
- GDS Transport font (system fonts as fallback)

---

## Security Considerations

### SC-1: XSS Prevention
User input displayed in conversation must be escaped:
```javascript
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

### SC-2: No Sensitive Data Storage
- Session storage for conversation only
- No PII collected or stored
- No authentication required

### SC-3: Input Validation
- Character limit: 500
- Strip HTML tags from input
- Sanitize before display

---

## Rollout Plan

1. **Story 18.1-18.3**: Implement UI locally, test with dev endpoint
2. **Story 18.4**: Deploy to AWS, verify stack works
3. **Story 18.5**: Capture screenshots with new UI
4. **Story 18.6**: Comprehensive test coverage

---

## Success Criteria

- [ ] GET request to Lambda URL shows chat interface (not JSON)
- [ ] Users can type questions and receive responses
- [ ] Conversation persists during session
- [ ] Screenshots match walkthrough descriptions
- [ ] All tests pass (unit, E2E, accessibility)
- [ ] cfn-lint validation passes
- [ ] No WCAG 2.2 AA violations

---

## Reference Implementation Pattern

This epic establishes the pattern for Epics 19-23. Successful patterns will be documented and reused:

- Lambda HTML response structure
- GDS styling approach
- JavaScript interaction pattern
- Test suite organization
- Screenshot capture workflow

---

_Tech spec created: 2025-11-30_
_Epic owner: DEV Agent (Amelia)_
