# Story 20.3: Redaction Display & Visualization

Status: done

## Story

As a **council FOI officer**,
I want **clear visualization of detected PII and redactions**,
so that **I can review what was found and verify the redactions**.

## Acceptance Criteria

### AC-20.3.1: Summary Cards

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.3.1a | Total redactions count displayed | Visual inspection |
| AC-20.3.1b | Unique PII types count displayed | Visual inspection |
| AC-20.3.1c | Average confidence percentage displayed | Visual inspection |

### AC-20.3.2: Redacted Output

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.3.2a | Redacted text displayed with markers | Visual inspection |
| AC-20.3.2b | Redaction markers styled distinctly | Visual inspection |
| AC-20.3.2c | Scrollable container for long documents | Interaction test |

### AC-20.3.3: Redaction Details Table

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.3.3a | Table lists each PII type found | Visual inspection |
| AC-20.3.3b | Count per PII type displayed | Visual inspection |
| AC-20.3.3c | Confidence bar per PII type | Visual inspection |

### AC-20.3.4: Reset Workflow

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.3.4a | "Redact Another Document" button visible | Visual inspection |
| AC-20.3.4b | Button resets UI to initial state | Interaction test |

## Dependencies

- Story 20.1 (Text Input Interface) - DONE
- Story 20.2 (Processing Feedback) - DONE

## Definition of Done

- [x] Summary cards implemented
- [x] Redacted output with styled markers
- [x] Redaction details table with confidence bars
- [x] Reset button working
- [x] Deployed and tested on AWS

## Dev Record

### Session Log

**2025-11-30 - Implementation Complete**

**Developer:** Claude Code

**Implementation Notes:**
- Implemented as part of Story 20.1
- Summary cards: 3-column grid with totals, PII types, avg confidence
- Redacted output: monospace font, scrollable, red markers [REDACTED:TYPE]
- Details table: type, count, confidence bar (CSS width percentage)
- "Redact Another Document" button resets entire UI

**Verification:**
- Function URL: `https://w6fqqfs2g4snys5reifxovnvae0nmkrq.lambda-url.us-west-2.on.aws/`
- All visualization elements display correctly

---

_Story created: 2025-11-30_
_Epic: 20 - FOI Redaction Web Application_
