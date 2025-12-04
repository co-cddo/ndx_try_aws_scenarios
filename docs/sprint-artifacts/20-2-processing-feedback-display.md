# Story 20.2: Processing Feedback Display

Status: done

## Story

As a **council FOI officer**,
I want **visual feedback during document processing**,
so that **I know the system is working and can estimate wait time**.

## Acceptance Criteria

### AC-20.2.1: Loading State

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.2.1a | Loading spinner visible during processing | Visual inspection |
| AC-20.2.1b | Status message explains what's happening | Visual inspection |
| AC-20.2.1c | Input area hidden during processing | Visual inspection |
| AC-20.2.1d | aria-live region for screen readers | ARIA inspection |

### AC-20.2.2: Processing Feedback

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.2.2a | Message mentions Amazon Comprehend | Visual inspection |
| AC-20.2.2b | User cannot submit another request while processing | Interaction test |

## Dependencies

- Story 20.1 (Text Input Interface) - DONE

## Definition of Done

- [x] Loading spinner implemented
- [x] Status message displayed
- [x] Input hidden during processing
- [x] Accessibility requirements met
- [x] Deployed and tested on AWS

## Dev Record

### Session Log

**2025-11-30 - Implementation Complete**

**Developer:** Claude Code

**Implementation Notes:**
- Implemented as part of Story 20.1
- Loading spinner with CSS animation
- Status message: "Analyzing document... Detecting personal information using Amazon Comprehend"
- Input area hidden during processing with display:none
- aria-live="polite" on loading container

**Verification:**
- Function URL: `https://w6fqqfs2g4snys5reifxovnvae0nmkrq.lambda-url.us-west-2.on.aws/`
- Loading state displays correctly during API call

---

_Story created: 2025-11-30_
_Epic: 20 - FOI Redaction Web Application_
