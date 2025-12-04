# NDX:Try AWS Scenarios - Scenario Application Uplift PRD

**Author:** cns
**Date:** 2025-11-30
**Version:** 1.0
**Parent PRD:** docs/prd.md (v1.5)

---

## Executive Summary

This PRD addresses a critical gap in the NDX:Try AWS Scenarios platform: **the walkthrough documentation describes rich web application interfaces, but the deployed Lambda functions provide only JSON API endpoints with no user interface**.

Users following the walkthroughs expect to see:
- Chat interfaces with message input fields and conversation history
- File upload areas with drag-and-drop functionality
- Real-time dashboards with visualizations
- Audio playback controls with voice selection

Instead, they encounter raw Lambda Function URLs that return JSON responses in the browser.

This document specifies requirements for developing **6 web application frontends** (one per scenario) that fulfill the walkthrough acceptance criteria. Each application will be deployed alongside its Lambda backend via CloudFormation, providing the complete "wow moment" experience the walkthroughs promise.

---

## Problem Statement

### Current State Analysis

**What Walkthroughs Promise:**

| Scenario | Walkthrough Describes | "What You Should See" |
|----------|----------------------|----------------------|
| Council Chatbot | "Chat interface with welcome message and text input" | Message input, send button, conversation history, AI responses |
| Planning AI | "Upload area with drag and drop" | File upload, progress indicator, extracted fields display |
| FOI Redaction | "Document upload and redacted output" | Text input/file upload, highlighted redactions, confidence scores |
| Smart Car Park | "Real-time dashboard showing parking availability" | Live status cards, color-coded indicators, capacity meters |
| Text to Speech | "Text input and audio playback controls" | Text area, voice selector, play/pause controls, audio player |
| QuickSight Dashboard | "Analytics dashboard with charts" | Service breakdown, trend charts, KPI summary cards |

**What Lambda Functions Actually Provide:**

| Scenario | Lambda Output | User Experience |
|----------|--------------|-----------------|
| Council Chatbot | `{"success": true, "response": "...", "topic": "..."}` | Raw JSON in browser |
| Planning AI | `{"success": true, "extractedData": {...}}` | Raw JSON in browser |
| FOI Redaction | `{"success": true, "redactedText": "...", "redactions": [...]}` | Raw JSON in browser |
| Smart Car Park | `{"success": true, "carParks": [...]}` | Raw JSON in browser |
| Text to Speech | `{"success": true, "audioUrl": "..."}` | Raw JSON with S3 presigned URL |
| QuickSight Dashboard | `{"success": true, "summary": {...}}` | Raw JSON in browser |

### Impact

1. **Broken User Experience**: Walkthroughs guide users through UI interactions that don't exist
2. **Lost "Wow Moment"**: The PRD's core value proposition ("I just saw it work") is undeliverable
3. **Screenshot Mismatch**: Captured screenshots show JSON responses or placeholder UIs, not the interfaces described
4. **Evaluation Failure**: Councils cannot evaluate AWS capabilities when the demo doesn't demonstrate them visually
5. **Credibility Risk**: Documentation describing non-existent features damages trust

### Root Cause

The CloudFormation templates deploy **backend APIs only**. No frontend web applications were developed to consume these APIs and present user interfaces.

---

## Solution Overview

Develop **6 scenario-specific web applications** that:
1. Provide the UI described in each walkthrough
2. Consume the existing Lambda Function URL APIs
3. Deploy via CloudFormation as static sites (S3 + CloudFront) or Lambda URL HTML responses
4. Match GOV.UK Design System patterns (GDS Frontend)
5. Enable screenshot capture that matches walkthrough descriptions

### Architecture Decision

**Option A: Static S3/CloudFront Sites** (Recommended)
- React/vanilla JS static builds
- Served from S3 via CloudFront
- Lambda APIs called via fetch()
- Clear separation of concerns

**Option B: Lambda HTML Responses**
- Lambda returns HTML for GET requests
- Simpler deployment (single resource)
- Harder to maintain, limited interactivity

**Recommendation:** Option A for full-featured scenarios (Chatbot, Planning AI, FOI), Option B acceptable for simple scenarios (Text-to-Speech) if needed for speed.

---

## Success Criteria

### Primary Success Metric

**Screenshots Match Walkthroughs**: All 101 screenshots show interfaces that match the "What you should see" descriptions in walkthrough steps.

### Acceptance Criteria Per Scenario

Each scenario application must:
1. Pass all acceptance criteria from its walkthrough story
2. Render in GOV.UK Design System styling
3. Be responsive (mobile-friendly)
4. Be accessible (WCAG 2.2 AA)
5. Work offline-first where possible (graceful degradation)
6. Deploy via CloudFormation (infrastructure as code)
7. Auto-cleanup with sandbox lifecycle (1-day S3 expiry)

---

## Functional Requirements

### Epic 18: Council Chatbot Web Application

**User Story**: As a council evaluator, I want to interact with the chatbot through a professional chat interface so that I can experience AI-powered resident support firsthand.

**Acceptance Criteria (from Walkthrough Steps 1-4):**

| AC ID | Requirement | Walkthrough Reference |
|-------|-------------|----------------------|
| AC-18.1 | Chat interface displays welcome message on load | Step 1: "chatbot interface ready to receive questions" |
| AC-18.2 | Text input field with placeholder text | Step 2: "Type your question in the input field" |
| AC-18.3 | Send button triggers API call | Step 2: "click Send" |
| AC-18.4 | User messages appear in conversation history | Step 2: "question appears in chat" |
| AC-18.5 | AI responses display with typing indicator | Step 2: "chatbot provides a relevant response" |
| AC-18.6 | Conversation history persists during session | Step 3: "maintains context across multiple questions" |
| AC-18.7 | Response topic/category visible | Step 3: "council tax, planning queries" |
| AC-18.8 | Mobile-responsive layout | All steps: accessible on any device |
| AC-18.9 | Sandbox disclaimer visible | "Sandbox demo - production uses Bedrock" |
| AC-18.10 | Copy message functionality | Step 3: copy sample questions |

**Technical Requirements:**
- React or vanilla JS with GDS Frontend
- WebSocket-like UX (streaming not required, but typing indicators)
- Session storage for conversation history
- Error handling for API failures
- Maximum 10 messages displayed (pagination for history)

**UI Components:**
1. Header with scenario title and NDX:Try branding
2. Chat message list (user/bot differentiation)
3. Text input with character counter (500 char limit)
4. Send button with loading state
5. Sample question quick-select buttons
6. "Sandbox mode" banner

---

### Epic 19: Planning Application AI Web Application

**User Story**: As a planning officer, I want to upload a planning document and see AI-extracted information so that I can evaluate document automation capabilities.

**Acceptance Criteria (from Walkthrough Steps 1-4):**

| AC ID | Requirement | Walkthrough Reference |
|-------|-------------|----------------------|
| AC-19.1 | Upload area with drag-and-drop zone | Step 3: "Drag and drop your planning application here" |
| AC-19.2 | File type validation (PDF, JPEG, PNG) | Step 3: "PDF, JPEG, PNG only" |
| AC-19.3 | File size validation (max 10MB) | Step 3: "max 10MB" |
| AC-19.4 | Upload progress indicator | Step 3: "progress bar as the file uploads" |
| AC-19.5 | Processing status display | Step 3: "Processing with Amazon Textract" |
| AC-19.6 | Extracted fields display in structured format | Step 3: "extracted fields appear automatically" |
| AC-19.7 | Confidence scores per field | Step 4: "confidence scores for each field" |
| AC-19.8 | Analysis summary with recommendations | Step 4: "overall recommendation" |
| AC-19.9 | Sample document download links | Step 2: "download sample planning documents" |
| AC-19.10 | Error handling with troubleshooting | Step 3: "File too large error" |

**Technical Requirements:**
- Drag-and-drop file upload (HTML5 File API)
- S3 presigned URL upload flow
- Polling for extraction results (or WebSocket)
- Structured data display with field mapping
- PDF preview (optional, pdf.js)

**UI Components:**
1. Sample document download cards
2. Drag-and-drop upload zone with visual feedback
3. Upload progress bar with percentage
4. Processing spinner with status text
5. Extracted data table (key-value pairs)
6. Confidence score indicators (green/amber/red)
7. Analysis panel with recommendation badge
8. Try another document button

---

### Epic 20: FOI Redaction Web Application

**User Story**: As an FOI officer, I want to paste or upload sensitive text and see automatic PII redaction so that I can evaluate compliance automation.

**Acceptance Criteria (from Walkthrough Steps 1-5):**

| AC ID | Requirement | Walkthrough Reference |
|-------|-------------|----------------------|
| AC-20.1 | Text input area (large textarea) | Step 2: "paste your FOI document text" |
| AC-20.2 | Sample text quick-load buttons | Step 2: "try our sample documents" |
| AC-20.3 | Redact button triggers processing | Step 3: "click Redact Document" |
| AC-20.4 | Processing indicator during API call | Step 3: "Processing with Amazon Comprehend" |
| AC-20.5 | Redacted text with visual markers | Step 4: "[REDACTED:NAME]", "[REDACTED:ADDRESS]" |
| AC-20.6 | Highlighted redaction visualization | Step 4: "highlighted in the output" |
| AC-20.7 | Redaction summary (count by type) | Step 4: "Names: 3, Addresses: 2, Phone: 1" |
| AC-20.8 | Confidence threshold control | Step 5: "adjust confidence threshold" |
| AC-20.9 | Side-by-side original/redacted view | Step 4: "compare original and redacted" |
| AC-20.10 | Download redacted document option | Step 5: "download redacted version" |

**Technical Requirements:**
- Dual-pane text display (original/redacted)
- Inline redaction highlighting with CSS
- Character count and limit (5000)
- Confidence slider (0.5-0.99)
- Export to .txt functionality

**UI Components:**
1. Sample document selector (dropdown or cards)
2. Original text textarea with paste button
3. Redact Now button with loading state
4. Split-view output panel
5. Redaction type legend with counts
6. Confidence threshold slider
7. Download button (txt export)

---

### Epic 21: Smart Car Park IoT Web Application

**User Story**: As a parking manager, I want to see real-time parking availability on a dashboard so that I can evaluate IoT monitoring capabilities.

**Acceptance Criteria (from Walkthrough Steps 1-4):**

| AC ID | Requirement | Walkthrough Reference |
|-------|-------------|----------------------|
| AC-21.1 | Dashboard header with total availability | Step 2: "overall parking availability" |
| AC-21.2 | Car park cards with live status | Step 2: "status for each car park" |
| AC-21.3 | Color-coded availability (green/amber/red) | Step 2: "green means available" |
| AC-21.4 | Occupancy percentage display | Step 3: "67% full" |
| AC-21.5 | Available spaces count | Step 3: "148 spaces available" |
| AC-21.6 | Auto-refresh every 30 seconds | Step 3: "data updates in real-time" |
| AC-21.7 | Last updated timestamp | Step 3: "Last updated: 14:32:15" |
| AC-21.8 | Price per hour display | Step 2: "hourly rate" |
| AC-21.9 | Simulate sensor data button | Step 4: "trigger sensor update" |
| AC-21.10 | Historical trend mini-chart (optional) | Step 4: "see patterns over time" |

**Technical Requirements:**
- Auto-polling API every 30 seconds
- CSS animations for status changes
- Progress bars for occupancy
- Responsive grid layout
- Manual refresh button

**UI Components:**
1. Header with total capacity/available summary
2. Grid of car park cards (4 car parks)
3. Each card: name, capacity bar, status badge, price
4. Last updated timestamp with refresh button
5. Simulate Data button for demo
6. IoT sensor status indicator

---

### Epic 22: Text-to-Speech Web Application

**User Story**: As an accessibility officer, I want to convert council documents to audio so that I can evaluate accessibility improvements for visually impaired residents.

**Acceptance Criteria (from Walkthrough Steps 1-4):**

| AC ID | Requirement | Walkthrough Reference |
|-------|-------------|----------------------|
| AC-22.1 | Text input area for content | Step 2: "enter or paste text" |
| AC-22.2 | Sample text quick-load buttons | Step 2: "try sample council announcements" |
| AC-22.3 | Voice selector dropdown | Step 3: "choose a voice" |
| AC-22.4 | Convert button triggers API | Step 3: "click Convert to Speech" |
| AC-22.5 | Processing indicator | Step 3: "Generating audio with Amazon Polly" |
| AC-22.6 | Audio player with controls | Step 4: "play button appears" |
| AC-22.7 | Play/pause/seek functionality | Step 4: "control playback" |
| AC-22.8 | Download audio button | Step 4: "download MP3" |
| AC-22.9 | Character count display | Step 2: "characters remaining" |
| AC-22.10 | Voice preview samples | Step 3: "hear voice samples" |

**Technical Requirements:**
- HTML5 audio element with custom controls
- Voice option mapping (Amy, Emma, Brian, Arthur)
- S3 presigned URL audio playback
- Character limit (3000)
- Mobile-friendly audio controls

**UI Components:**
1. Text input area with character counter
2. Sample text selector cards
3. Voice dropdown with British English options
4. Convert button with loading spinner
5. Custom audio player with play/pause/progress
6. Download MP3 button
7. Voice sample buttons

---

### Epic 23: QuickSight Dashboard Web Application

**User Story**: As a performance manager, I want to see council service metrics visualized so that I can evaluate business intelligence capabilities.

**Acceptance Criteria (from Walkthrough Steps 1-4):**

| AC ID | Requirement | Walkthrough Reference |
|-------|-------------|----------------------|
| AC-23.1 | Summary KPI cards at top | Step 2: "key performance indicators" |
| AC-23.2 | Service breakdown table | Step 3: "breakdown by service area" |
| AC-23.3 | Resolution rate visualization | Step 3: "resolution rates" |
| AC-23.4 | Satisfaction score display | Step 3: "satisfaction scores" |
| AC-23.5 | Cases received/resolved counts | Step 3: "total cases handled" |
| AC-23.6 | Service area filter | Step 4: "filter by service" |
| AC-23.7 | Date range selector | Step 4: "change time period" |
| AC-23.8 | Export to CSV button | Step 4: "download data" |
| AC-23.9 | Refresh data button | Step 4: "refresh dashboard" |
| AC-23.10 | Chart visualization (bar/line) | Step 3: "visualize trends" |

**Technical Requirements:**
- Chart.js or similar for visualizations
- Sortable data tables
- Date picker component
- CSV export functionality
- Responsive chart sizing

**UI Components:**
1. KPI summary cards (4 key metrics)
2. Service breakdown data table (sortable)
3. Bar chart (cases by service)
4. Line chart (trends over time)
5. Filter controls (service, date range)
6. Export CSV button
7. Generate Data button (refresh sample data)

---

## Non-Functional Requirements

### NFR-1: GOV.UK Design System Compliance
- All UI components use GDS Frontend classes
- Color palette matches GOV.UK standards
- Typography uses GDS Transport font
- Focus states meet accessibility requirements

### NFR-2: Accessibility (WCAG 2.2 AA)
- Keyboard navigation for all interactions
- Screen reader compatible (ARIA labels)
- Color contrast ratios meet standards
- Focus indicators visible
- No reliance on color alone for information

### NFR-3: Performance
- Initial load under 3 seconds (3G connection)
- API responses handled within 30 seconds
- Graceful timeout handling
- Loading states for all async operations

### NFR-4: Browser Support
- Chrome 90+ (primary)
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Android)

### NFR-5: Deployment
- CloudFormation-managed infrastructure
- S3 static hosting with CloudFront CDN
- Auto-cleanup lifecycle (1-day for sandbox)
- No manual deployment steps

### NFR-6: Security
- No sensitive data stored client-side
- HTTPS only (CloudFront)
- CORS properly configured
- No authentication required (sandbox)

---

## Technical Architecture

### Per-Scenario Application Structure

```
scenario-app/
├── index.html           # Single-page application
├── assets/
│   ├── css/
│   │   └── govuk.min.css    # GDS Frontend
│   │   └── app.css          # Custom styles
│   └── js/
│       └── app.js           # Application logic
├── components/          # Reusable UI components
└── README.md
```

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CloudFormation Stack                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   S3 Bucket  │───▶│ CloudFront  │───▶│   Users     │ │
│  │ (Static App) │    │   (CDN)     │    │             │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│         │                                               │
│         ▼                                               │
│  ┌─────────────┐    ┌─────────────┐                    │
│  │   Lambda    │◀───│   API Call  │                    │
│  │  (Backend)  │    │  (fetch())  │                    │
│  └─────────────┘    └─────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### Shared Components Library

To avoid duplication, create a shared component library:
- `ndx-header` - Common header with branding
- `ndx-footer` - Footer with links
- `ndx-loading` - Loading spinners
- `ndx-error` - Error message display
- `ndx-sandbox-banner` - Sandbox mode indicator

---

## Implementation Epics Summary

| Epic | Scenario | Priority | Complexity | Est. Stories |
|------|----------|----------|------------|--------------|
| 18 | Council Chatbot | P0 | High | 8-10 |
| 19 | Planning AI | P0 | High | 8-10 |
| 20 | FOI Redaction | P1 | Medium | 6-8 |
| 21 | Smart Car Park | P1 | Medium | 6-8 |
| 22 | Text-to-Speech | P2 | Low | 4-6 |
| 23 | QuickSight Dashboard | P2 | Medium | 6-8 |

**Total estimated stories:** 38-50

---

## Dependencies

### Prerequisites
1. Lambda Function URLs deployed and functional (DONE)
2. S3 buckets for data storage (DONE)
3. CORS configured on Lambda URLs (DONE)
4. GDS Frontend assets available

### External Dependencies
1. GOV.UK Frontend NPM package
2. Chart.js for visualizations
3. PDF.js for document preview (Planning AI)

---

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| GDS Frontend complexity | Medium | Medium | Use pre-built components, reference existing GOV.UK services |
| API response format changes | High | Low | Version API contracts, backwards compatibility |
| Browser compatibility issues | Medium | Medium | Progressive enhancement, polyfills |
| Performance on mobile | Medium | Medium | Lazy loading, minimal dependencies |
| Accessibility audit failures | High | Medium | Automated testing, manual review |

---

## Out of Scope

- User authentication/authorization
- Data persistence between sessions
- Multi-language support (i18n)
- Offline mode (beyond graceful degradation)
- Real-time collaboration features
- Admin dashboards
- Production AWS service integration (e.g., real Bedrock, real Textract)

---

## Appendix A: Walkthrough-to-Screenshot Mapping

Each walkthrough step has associated screenshots. Applications must render UIs that match these screenshots after recapture.

### Council Chatbot Screenshots
| Screenshot | Expected UI Element |
|------------|---------------------|
| step-1-chatbot-interface.png | Chat window with welcome message |
| step-2-question-input.png | Text input with typed question |
| step-2-response-display.png | Bot response bubble |
| step-3-council-tax.png | Multi-turn conversation |
| step-4-conversation-summary.png | Full conversation history |

### Planning AI Screenshots
| Screenshot | Expected UI Element |
|------------|---------------------|
| step-3-upload-interface.png | Drag-and-drop zone |
| step-3-processing.png | Progress indicator |
| step-4-extracted-fields.png | Structured data display |
| step-4-analysis-results.png | Recommendation panel |

*(Continue for all 6 scenarios...)*

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-30 | cns | Initial PRD for scenario application uplift |
