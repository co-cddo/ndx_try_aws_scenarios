# Epic Technical Specification: FOI Redaction Exploration

Date: 2025-11-28
Author: cns
Epic ID: 8
Status: Draft

---

## Overview

Epic 8 extends the hands-on exploration framework to the FOI Redaction scenario. Users will explore PII detection capabilities, confidence threshold tuning, false positive management, and the redaction review workflow.

This epic follows the patterns established in Epic 6 (Reference Implementation), reusing exploration components and reducing implementation effort by ~40%.

**User Value Statement:** "I understand how AI identifies sensitive data, when it's accurate, and when human review is needed."

## Objectives and Scope

### In Scope

- **Story 8.1:** Exploration Landing Page with PII-focused persona paths
- **Story 8.2:** 5 guided experiments (obvious PII, subtle PII, false positives, threshold adjustment, pre/post comparison)
- **Story 8.3:** Architecture tour covering Comprehend PII detection, confidence scoring, redaction workflow
- **Story 8.4:** 3 boundary challenges (zero PII document, high PII document, unusual encodings)
- **Story 8.5:** Production guidance for FOI compliance integration
- **Story 8.6:** Screenshot automation for FOI Redaction exploration pages
- Reuse of Epic 6 components
- FOI-specific data file: `src/_data/exploration/foi-redaction.yaml`

### Out of Scope

- Modifications to the core FOI Redaction CloudFormation template
- Changes to the basic walkthrough (Story 3.4)
- New reusable components

### Dependencies

- **Epic 6 (Contexted):** Reusable components established
- **Story 3.4 (Done):** FOI Redaction Walkthrough must exist
- **Deployed FOI Redaction scenario:** Live endpoints for experiments

## System Architecture Alignment

This epic reuses architectural decisions from Epic 6, with FOI-specific adaptations:

### FOI Redaction Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Document Upload                          │
└────────────────────┬────────────────────────────────────────┘
                     │ Document (PDF/TXT)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Comprehend PII Detection                 │
│                     ├── Entity Types: NAME, ADDRESS, PHONE   │
│                     ├── Confidence Scores per Entity         │
│                     └── Location Offsets for Redaction       │
└────────────────────┬────────────────────────────────────────┘
                     │ PII Entities + Confidence
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Redaction Lambda                         │
│                     ├── Apply Redactions based on Threshold  │
│                     ├── Generate Audit Log                   │
│                     └── Create Redacted Document             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Output                                   │
│                     ├── Redacted Document                    │
│                     └── Review Report (entities, confidence) │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Design

### Services and Modules

#### New Files to Create

| File | Purpose | Story |
|------|---------|-------|
| `src/walkthroughs/foi-redaction/explore/index.njk` | Exploration landing page | 8.1 |
| `src/walkthroughs/foi-redaction/explore/experiments.njk` | 5 guided experiments | 8.2 |
| `src/walkthroughs/foi-redaction/explore/architecture.njk` | Visual + Console tours | 8.3 |
| `src/walkthroughs/foi-redaction/explore/limits.njk` | 3 boundary challenges | 8.4 |
| `src/walkthroughs/foi-redaction/explore/production.njk` | Production guidance | 8.5 |
| `src/_data/exploration/foi-redaction.yaml` | Exploration activity metadata | 8.1-8.5 |
| `src/assets/images/exploration/foi-redaction/` | Screenshot directory | 8.6 |

### Data Models and Contracts

#### Exploration Activity Data Model

```yaml
# src/_data/exploration/foi-redaction.yaml
scenario_id: foi-redaction
scenario_title: FOI Redaction
total_time_estimate: "40 minutes"
activities:
  - id: exp1
    title: "Obvious PII Detection"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "AI reliably detects standard PII: names, addresses, phone numbers"
    is_first: true
    safe_badge: true
    sample_documents:
      - name: "Document with clear PII"
        path: "/assets/samples/foi-redaction/obvious-pii.pdf"
    expected_output: "All names, addresses, phone numbers redacted"
    screenshot: "experiments/exp1-obvious-pii.png"

  - id: exp2
    title: "Subtle PII Detection"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "AI can detect less obvious PII: staff IDs, case references"
    safe_badge: true
    sample_documents:
      - name: "Document with subtle PII"
        path: "/assets/samples/foi-redaction/subtle-pii.pdf"
    expected_output: "Staff IDs and case references identified"
    screenshot: "experiments/exp2-subtle-pii.png"

  - id: exp3
    title: "False Positive Management"
    category: experiments
    persona: both
    time_estimate: "10 min"
    learning: "Some place names may match person names - review is essential"
    safe_badge: true
    sample_documents:
      - name: "Document with potential false positives"
        path: "/assets/samples/foi-redaction/false-positives.pdf"
    expected_output: "Some false positives flagged (e.g., 'Reading' as a name)"
    screenshot: "experiments/exp3-false-positives.png"

  - id: exp4
    title: "Confidence Threshold Adjustment"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "Lower threshold catches more PII but more false positives"
    safe_badge: true
    threshold_options:
      - value: 0.9
        description: "High confidence - fewer redactions, less false positives"
      - value: 0.7
        description: "Medium confidence - balanced approach"
      - value: 0.5
        description: "Low confidence - more redactions, more false positives"
    expected_output: "Different redaction counts at each threshold"
    screenshot: "experiments/exp4-threshold.png"

  - id: exp5
    title: "Pre/Post Redaction Comparison"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "Visual comparison helps verify redaction completeness"
    safe_badge: true
    sample_documents:
      - name: "Sample FOI document"
        path: "/assets/samples/foi-redaction/sample-foi.pdf"
    expected_output: "Side-by-side view of original and redacted"
    screenshot: "experiments/exp5-comparison.png"

  # Boundary Challenges
  - id: limit1
    title: "Zero PII Document"
    category: limits
    persona: both
    time_estimate: "5 min"
    learning: "Documents with no PII pass through unchanged"
    challenge_description: "Upload a document with no personal information"
    sample_documents:
      - name: "Public policy document"
        path: "/assets/samples/foi-redaction/no-pii.pdf"
    expected_behavior: "Document returned unchanged with zero redactions"
    business_implication: "No cost for processing clean documents"
    recovery: "No recovery needed - this is expected behavior"
    screenshot: "limits/limit1-zero-pii.png"

  - id: limit2
    title: "High PII Document"
    category: limits
    persona: both
    time_estimate: "5 min"
    learning: "High redaction load requires human review"
    challenge_description: "Upload a document that's mostly personal data"
    sample_documents:
      - name: "Contact list document"
        path: "/assets/samples/foi-redaction/high-pii.pdf"
    expected_behavior: "Document heavily redacted, review flag raised"
    business_implication: "Some documents may need alternative handling"
    recovery: "System handles automatically"
    screenshot: "limits/limit2-high-pii.png"

  - id: limit3
    title: "Unusual Character Encodings"
    category: limits
    persona: both
    time_estimate: "5 min"
    learning: "Encoding issues can affect detection accuracy"
    challenge_description: "Upload a document with special characters"
    sample_documents:
      - name: "Document with special encodings"
        path: "/assets/samples/foi-redaction/encoding-test.pdf"
    expected_behavior: "May have parsing issues with some characters"
    business_implication: "Input validation prevents processing errors"
    recovery: "Reupload with standard encoding"
    screenshot: "limits/limit3-encoding.png"
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| NFR40: Page load | <3 seconds | Lazy loading images |
| PII detection | <10 seconds typical | Lambda concurrency |
| Threshold comparison | <5 seconds | Cached processing |

### Security

| Requirement | Implementation |
|-------------|----------------|
| Sample document security | Synthetic PII only, no real data |
| Redaction verification | Audit trail for all redactions |
| Console access | Read-only demo permissions |

### Reliability/Availability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| NFR37: Activity completion | 95%+ | Fallback screenshots |
| PII detection accuracy | 90%+ for standard entities | Comprehend service SLA |

## Acceptance Criteria (Authoritative)

### Story 8.1: Exploration Landing Page

- [ ] Persona selection for PII detection focus
- [ ] 5 Visual-First activities covering PII categories
- [ ] 5 Console activities for Comprehend exploration
- [ ] Unique focus areas: PII detection, confidence thresholds, false positives
- [ ] Reuses Epic 6 layout and components

### Story 8.2: "What Can I Change?" Experiments

- [ ] Experiment 1: Obvious PII detection (names, addresses, phones)
- [ ] Experiment 2: Subtle PII detection (IDs, references)
- [ ] Experiment 3: False positive identification
- [ ] Experiment 4: Confidence threshold adjustment
- [ ] Experiment 5: Pre/post redaction comparison
- [ ] Sample documents with synthetic PII

### Story 8.3: "How Does It Work?" Architecture Tour

- [ ] Visual Tour: PII detection flow with Comprehend
- [ ] Console Tour: Comprehend console, Lambda, audit logs
- [ ] Confidence score visualization
- [ ] Redaction decision audit trail

### Story 8.4: "Test the Limits" Boundary Exercise

- [ ] Challenge 1: Zero PII document (unchanged output)
- [ ] Challenge 2: High PII document (heavy redaction)
- [ ] Challenge 3: Unusual encodings (parsing test)
- [ ] Each shows expected behavior and business implication

### Story 8.5: "Take It Further" Production Guidance

- [ ] FOI compliance integration guidance
- [ ] Human-in-the-loop review workflow
- [ ] Audit trail requirements
- [ ] Data retention policies
- [ ] Cost projections

### Story 8.6: Screenshot Automation Pipeline

- [ ] FOI Redaction pages added to shared pipeline
- [ ] Redacted document screenshots captured
- [ ] Comparison views automated

## Traceability Mapping

| Story | Functional Requirements | Non-Functional Requirements |
|-------|------------------------|----------------------------|
| 8.1 | FR57, FR58, FR59, FR60, FR90 | NFR37, NFR39, NFR40 |
| 8.2 | FR65, FR66, FR67, FR68 | NFR37, NFR39, NFR40 |
| 8.3 | FR69, FR70, FR71, FR83 | NFR37, NFR38, NFR39 |
| 8.4 | FR72, FR73, FR74 | NFR37, NFR39 |
| 8.5 | FR75, FR76, FR77 | NFR39 |
| 8.6 | FR61, FR62, FR63, FR81 | NFR38, NFR44 |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| PII detection varies by document type | Medium | Medium | Test with diverse sample set |
| False positive rate higher than expected | Medium | Low | Clear guidance on human review |

### Assumptions

- Comprehend PII detection available in demo region
- Sample documents representative of real FOI requests
- Synthetic PII indistinguishable from real for testing purposes

## Test Strategy Summary

### Unit Testing

| Component | Test Type | Coverage Target |
|-----------|-----------|-----------------|
| FOI YAML data | Schema validation | 100% |
| Threshold selector | Component test | 100% |

### Integration Testing

| Test | Method | Automation |
|------|--------|------------|
| PII detection flow | Playwright E2E | GitHub Actions |
| Threshold comparison | Integration test | GitHub Actions |
| Before/after display | Visual regression | GitHub Actions |

### Manual Testing Checklist

- [ ] All 5 experiments work with sample documents
- [ ] Threshold adjustment shows different results
- [ ] Redaction comparison view renders correctly
- [ ] Boundary challenges demonstrate expected behavior
