# Epic Technical Specification: Planning Application AI Exploration

Date: 2025-11-28
Author: cns
Epic ID: 7
Status: Draft

---

## Overview

Epic 7 extends the hands-on exploration framework established in Epic 6 to the Planning Application AI scenario. Users will explore document processing capabilities through experiments with document quality, handwriting recognition, multi-page processing, and file format handling.

This epic follows the patterns and reuses components created in Epic 6 (Council Chatbot Exploration - Reference Implementation), reducing implementation effort by ~40% as projected in CBA5.

**User Value Statement:** "I understand how AI extracts information from documents, when it works well, and when it fails."

## Objectives and Scope

### In Scope

- **Story 7.1:** Exploration Landing Page with document-focused persona paths
- **Story 7.2:** 5 guided experiments (document quality, handwriting, multi-page, file formats, partial forms)
- **Story 7.3:** Architecture tour covering Textract, Comprehend, Bedrock, and S3 data flow
- **Story 7.4:** 3 boundary challenges (empty document, very large document, corrupted file)
- **Story 7.5:** Production guidance for planning system integration
- **Story 7.6:** Screenshot automation for Planning AI exploration pages
- Reuse of Epic 6 components: `exploration.njk`, `activity-card.njk`, `exploration-state.js`
- Planning AI-specific data file: `src/_data/exploration/planning-ai.yaml`

### Out of Scope

- Modifications to the core Planning AI CloudFormation template
- Changes to the basic walkthrough (Story 3.3)
- New reusable components (use Epic 6 components)
- Backend infrastructure changes

### Dependencies

- **Epic 6 (Contexted):** Reusable components and patterns established
- **Story 3.3 (Done):** Planning Application AI Walkthrough must exist
- **Deployed Planning AI scenario:** Live endpoints for experiments

## System Architecture Alignment

This epic reuses all architectural decisions from Epic 6:

- **Decision 7:** Screenshot automation via shared Playwright pipeline
- **Decision 8:** LocalStorage state management via `exploration-state.js`
- **Decision 9:** Exploration page structure via `exploration.njk` layout
- **Decision 10:** Analytics events extended for planning-ai scenario

### Planning AI-Specific Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Upload                              │
└────────────────────┬────────────────────────────────────────┘
                     │ Document (PDF/PNG/TIFF)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     S3 Input Bucket                          │
│                     (planning-ai-input-{stack-id})           │
└────────────────────┬────────────────────────────────────────┘
                     │ S3 Event Trigger
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Processing Lambda                        │
│                     ├── Textract: OCR + Document Analysis    │
│                     ├── Comprehend: Entity Extraction        │
│                     └── Bedrock: Intelligence Layer          │
└────────────────────┬────────────────────────────────────────┘
                     │ Extraction Results
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     S3 Output Bucket                         │
│                     (planning-ai-output-{stack-id})          │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Design

### Services and Modules

#### New Files to Create

| File | Purpose | Story |
|------|---------|-------|
| `src/walkthroughs/planning-ai/explore/index.njk` | Exploration landing page | 7.1 |
| `src/walkthroughs/planning-ai/explore/experiments.njk` | 5 guided experiments | 7.2 |
| `src/walkthroughs/planning-ai/explore/architecture.njk` | Visual + Console tours | 7.3 |
| `src/walkthroughs/planning-ai/explore/limits.njk` | 3 boundary challenges | 7.4 |
| `src/walkthroughs/planning-ai/explore/production.njk` | Production guidance | 7.5 |
| `src/_data/exploration/planning-ai.yaml` | Exploration activity metadata | 7.1-7.5 |
| `src/assets/images/exploration/planning-ai/` | Screenshot directory | 7.6 |

#### Files to Modify

| File | Modification | Story |
|------|--------------|-------|
| `.github/workflows/screenshot-capture.yml` | Add planning-ai scenario to pipeline | 7.6 |
| `src/_data/navigation.yaml` | Add planning-ai exploration links | 7.1 |

### Data Models and Contracts

#### Exploration Activity Data Model

```yaml
# src/_data/exploration/planning-ai.yaml
scenario_id: planning-ai
scenario_title: Planning Application AI
total_time_estimate: "45 minutes"
activities:
  - id: exp1
    title: "Document Quality Test"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "Input quality directly affects AI accuracy"
    is_first: true
    safe_badge: true
    sample_documents:
      - name: "High-quality PDF"
        path: "/assets/samples/planning-ai/high-quality-application.pdf"
      - name: "Low-quality scan"
        path: "/assets/samples/planning-ai/low-quality-scan.pdf"
    expected_output: "Clear difference in extraction accuracy"
    screenshot: "experiments/exp1-quality-comparison.png"

  - id: exp2
    title: "Handwritten Notes"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "Handwriting recognition is improving but not perfect"
    safe_badge: true
    sample_documents:
      - name: "Document with handwritten margins"
        path: "/assets/samples/planning-ai/handwritten-notes.pdf"
    expected_output: "Some handwriting recognized, some missed"
    screenshot: "experiments/exp2-handwriting.png"

  - id: exp3
    title: "Multi-Page Processing"
    category: experiments
    persona: both
    time_estimate: "10 min"
    learning: "Longer documents take proportionally longer"
    safe_badge: true
    sample_documents:
      - name: "1-page application"
        path: "/assets/samples/planning-ai/single-page.pdf"
      - name: "15-page application"
        path: "/assets/samples/planning-ai/multi-page.pdf"
    expected_output: "Processing time comparison"
    screenshot: "experiments/exp3-multipage.png"

  - id: exp4
    title: "Different File Formats"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "Native PDF extracts better than image formats"
    safe_badge: true
    sample_documents:
      - name: "PDF version"
        path: "/assets/samples/planning-ai/sample.pdf"
      - name: "PNG version"
        path: "/assets/samples/planning-ai/sample.png"
      - name: "TIFF version"
        path: "/assets/samples/planning-ai/sample.tiff"
    expected_output: "Format comparison results"
    screenshot: "experiments/exp4-formats.png"

  - id: exp5
    title: "Partially Filled Form"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "AI can validate completeness, not just extract"
    safe_badge: true
    sample_documents:
      - name: "Form with blank required fields"
        path: "/assets/samples/planning-ai/incomplete-form.pdf"
    expected_output: "AI identifies missing fields"
    screenshot: "experiments/exp5-incomplete.png"

  # Architecture Tour Activities
  - id: arch-visual
    title: "Visual Architecture Tour"
    category: architecture
    persona: visual
    time_estimate: "10 min"
    learning: "How documents flow through AWS services"
    steps:
      - title: "Document Upload to S3"
        description: "Your document goes to secure cloud storage"
        screenshot: "architecture/step1-s3-upload.png"
      - title: "Textract Analysis"
        description: "Amazon Textract reads the document like a human would"
        screenshot: "architecture/step2-textract.png"
      - title: "Comprehend Extraction"
        description: "Amazon Comprehend finds the key information"
        screenshot: "architecture/step3-comprehend.png"
      - title: "Bedrock Intelligence"
        description: "AI interprets and validates the extracted data"
        screenshot: "architecture/step4-bedrock.png"
      - title: "Results Storage"
        description: "Extracted data saved for your review"
        screenshot: "architecture/step5-results.png"

  - id: arch-console
    title: "Console Architecture Tour"
    category: architecture
    persona: technical
    time_estimate: "10 min"
    learning: "Navigate AWS Console to see document processing"
    steps:
      - title: "S3 Bucket Structure"
        console_url: "https://s3.console.aws.amazon.com/s3/buckets/"
        what_to_look_for: "Input/output folders, document versions"
        screenshot: "architecture/console-s3.png"
      - title: "Textract Job Results"
        console_url: "https://console.aws.amazon.com/textract/"
        what_to_look_for: "Document analysis JSON, block types"
        screenshot: "architecture/console-textract.png"
      - title: "Comprehend Entity Output"
        console_url: "https://console.aws.amazon.com/comprehend/"
        what_to_look_for: "Entity detection, confidence scores"
        screenshot: "architecture/console-comprehend.png"
      - title: "Lambda Processing"
        console_url: "https://console.aws.amazon.com/lambda/"
        what_to_look_for: "Handler function, orchestration logic"
        screenshot: "architecture/console-lambda.png"

  # Boundary Challenges
  - id: limit1
    title: "Empty Document Challenge"
    category: limits
    persona: both
    time_estimate: "5 min"
    learning: "Validation before processing saves costs"
    challenge_description: "Upload a blank PDF and see what happens"
    sample_documents:
      - name: "Blank PDF"
        path: "/assets/samples/planning-ai/blank.pdf"
    expected_behavior: "Graceful error message, no processing costs"
    business_implication: "Input validation prevents wasted compute"
    recovery: "Upload a real document to continue"
    screenshot: "limits/limit1-empty.png"

  - id: limit2
    title: "Very Large Document Challenge"
    category: limits
    persona: both
    time_estimate: "5 min"
    learning: "Production needs chunking for large files"
    challenge_description: "Upload a 50+ page document"
    sample_documents:
      - name: "Large document (50 pages)"
        path: "/assets/samples/planning-ai/large-document.pdf"
    expected_behavior: "Processing timeout or size limit message"
    business_implication: "Large planning applications need chunking strategy"
    recovery: "Processing will timeout; refresh page"
    screenshot: "limits/limit2-large.png"

  - id: limit3
    title: "Corrupted File Challenge"
    category: limits
    persona: both
    time_estimate: "5 min"
    learning: "Input validation is essential"
    challenge_description: "Upload an intentionally corrupted PDF"
    sample_documents:
      - name: "Corrupted PDF"
        path: "/assets/samples/planning-ai/corrupted.pdf"
    expected_behavior: "Clear error handling, no system crash"
    business_implication: "Production systems need robust file validation"
    recovery: "Upload a valid document to continue"
    screenshot: "limits/limit3-corrupted.png"
```

### APIs and Interfaces

#### Deployed Planning AI Endpoints (Existing)

- **Upload Endpoint:** S3 presigned URL from CloudFormation outputs
- **Status Endpoint:** Lambda Function URL for processing status
- **Results Endpoint:** S3 presigned URL for extraction results

#### AWS Console Deep Links (Story 7.3)

| Resource | Console URL Pattern |
|----------|---------------------|
| S3 Buckets | `https://s3.console.aws.amazon.com/s3/buckets/{bucketName}` |
| Textract Console | `https://{region}.console.aws.amazon.com/textract/` |
| Comprehend Console | `https://{region}.console.aws.amazon.com/comprehend/` |
| Lambda Function | `https://{region}.console.aws.amazon.com/lambda/home#/functions/{functionName}` |

### Workflows and Sequencing

#### Experiment Workflow

```
[User selects experiment]
        ↓
[Download sample document(s)]
        ↓
[Upload to Planning AI interface]
        ↓
[Wait for processing (progress indicator)]
        ↓
[View extraction results]
        ↓
[Compare with expected output]
        ↓
[Read "What You Learned" summary]
        ↓
[Mark activity complete → LocalStorage update]
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| NFR40: Page load | <3 seconds | Lazy loading, WebP images |
| Sample document download | <5 seconds | S3 CloudFront distribution |
| Processing status polling | 2 second intervals | Exponential backoff |

### Security

| Requirement | Implementation |
|-------------|----------------|
| Document upload security | S3 presigned URLs with 15-minute expiry |
| No PII in samples | Synthetic data only |
| Console links | Read-only permissions in demo account |

### Reliability/Availability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| NFR37: Activity completion | 95%+ | Fallback screenshots when stack expired |
| Sample document availability | 100% | Static hosting in portal |
| Processing timeout handling | Graceful | 60-second timeout with clear message |

### Observability

| Metric | Capture Method |
|--------|---------------|
| Document upload attempts | Analytics event |
| Processing success/failure | Analytics event with status |
| Exploration completed | `exploration_completed` event |

## Dependencies and Integrations

### Internal Dependencies

| Dependency | Status | Impact if Missing |
|------------|--------|-------------------|
| Epic 6 components | Contexted | Cannot reuse exploration framework |
| Story 3.3 Planning AI Walkthrough | Done | Cannot link from walkthrough |
| `exploration-state.js` | Created in Epic 6 | Cannot persist state |

### External Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| Deployed Planning AI Lambda | Live experiments | Static screenshots |
| S3 buckets for upload/download | Document storage | Pre-recorded demo videos |
| Textract/Comprehend services | Document processing | Cached sample results |

## Acceptance Criteria (Authoritative)

### Story 7.1: Exploration Landing Page

- [ ] Persona selection: "Service Manager / Non-Technical" vs "Developer / Technical"
- [ ] Visual-First Path: 5 document-focused activities
- [ ] Console+Code Path: 5 AWS Console activities
- [ ] Unique focus areas displayed: document quality, confidence scoring, handwriting
- [ ] Page accessible (WCAG 2.2 AA)
- [ ] Reuses Epic 6 layout and components

### Story 7.2: "What Can I Change?" Experiments

- [ ] Experiment 1: Document quality comparison (high vs low quality)
- [ ] Experiment 2: Handwritten notes recognition test
- [ ] Experiment 3: Multi-page processing time comparison
- [ ] Experiment 4: File format comparison (PDF/PNG/TIFF)
- [ ] Experiment 5: Partially filled form validation
- [ ] Sample documents downloadable for each experiment
- [ ] Expected vs actual comparison shown
- [ ] Experiments work with deployed Planning AI

### Story 7.3: "How Does It Work?" Architecture Tour

- [ ] Visual Tour: 5 steps (S3 → Textract → Comprehend → Bedrock → Results)
- [ ] Console Tour: 4 steps with AWS Console links
- [ ] Annotated screenshots for each step
- [ ] "What is this?" explainers in plain English
- [ ] Fallback banner when stack expired

### Story 7.4: "Test the Limits" Boundary Exercise

- [ ] Challenge 1: Empty document upload
- [ ] Challenge 2: Very large document (50+ pages)
- [ ] Challenge 3: Corrupted file handling
- [ ] Each includes: "Safe to try" reassurance, expected behavior, business implication, recovery
- [ ] Challenges demonstrate graceful error handling

### Story 7.5: "Take It Further" Production Guidance

- [ ] Integration guidance for planning case management systems
- [ ] Human-in-the-loop review workflow description
- [ ] Accuracy benchmarking considerations
- [ ] GDPR considerations for document storage
- [ ] Cost projections: demo vs production
- [ ] Partner contact information

### Story 7.6: Screenshot Automation Pipeline

- [ ] Planning AI exploration pages added to screenshot pipeline
- [ ] Screenshots captured at desktop and mobile viewports
- [ ] Saved to `src/assets/images/exploration/planning-ai/`
- [ ] Annotations defined in YAML
- [ ] Visual regression tests for Planning AI pages

## Traceability Mapping

| Story | Functional Requirements | Non-Functional Requirements |
|-------|------------------------|----------------------------|
| 7.1 | FR57, FR58, FR59, FR60, FR90 | NFR37, NFR39, NFR40 |
| 7.2 | FR65, FR66, FR67, FR68, FR79 | NFR37, NFR39, NFR40 |
| 7.3 | FR69, FR70, FR71, FR83 | NFR37, NFR38, NFR39, NFR40 |
| 7.4 | FR72, FR73, FR74 | NFR37, NFR39 |
| 7.5 | FR75, FR76, FR77 | NFR39 |
| 7.6 | FR61, FR62, FR63, FR81 | NFR38, NFR44 |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Textract processing delays | Medium | Medium | Polling with timeout, fallback to cached results |
| Large document uploads slow | Medium | Low | Progress indicator, size limits documented |
| S3 presigned URLs expire | Low | Medium | Generate fresh URLs on page load |

### Assumptions

- Planning AI CloudFormation template deployed and stable
- Sample documents are representative of real planning applications
- Textract/Comprehend service availability in demo region

### Open Questions

1. **Resolved:** Sample document sizes - Use realistic planning application sizes (1-20 pages typical)
2. **Resolved:** Processing timeout - 60 seconds with clear messaging

## Test Strategy Summary

### Unit Testing

| Component | Test Type | Coverage Target |
|-----------|-----------|-----------------|
| Planning AI YAML data | Schema validation | 100% |
| Experiment rendering | Template tests | 100% |

### Integration Testing

| Test | Method | Automation |
|------|--------|------------|
| Document upload flow | Playwright E2E | GitHub Actions |
| Processing status polling | Integration test | GitHub Actions |
| Results display | Playwright E2E | GitHub Actions |

### Accessibility Testing

| Test | Tool | Pass Criteria |
|------|------|---------------|
| WCAG 2.2 AA | Pa11y CI | Zero errors |
| File upload accessibility | Manual | Screen reader compatible |

### Manual Testing Checklist

- [ ] All 5 experiments completable with sample documents
- [ ] Architecture tour Visual path works without console access
- [ ] Architecture tour Console path links are valid
- [ ] Boundary challenges show expected error handling
- [ ] Fallback content displays when stack expired
- [ ] Mobile responsive layout works
