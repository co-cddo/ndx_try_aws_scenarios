# Story 17.3: Council Chatbot Real Screenshots

Status: done

## Story

As a **portal user**,
I want **to see real AWS console screenshots in the Council Chatbot walkthrough**,
so that **I know exactly what to expect when I deploy and use the scenario**.

## Acceptance Criteria

1. **AC-17.3.1:** Capture CloudFormation outputs screenshot showing ChatbotURL
2. **AC-17.3.2:** Capture chatbot interface screenshot showing welcome state
3. **AC-17.3.3:** Capture question input screenshot with sample bin collection query
4. **AC-17.3.4:** Capture response display screenshot showing chatbot answer
5. **AC-17.3.5:** Capture council tax conversation screenshot
6. **AC-17.3.6:** Capture planning question screenshot
7. **AC-17.3.7:** Capture multi-turn conversation screenshot
8. **AC-17.3.8:** Capture conversation summary screenshot
9. **AC-17.3.9:** Capture Bedrock console screenshot (or equivalent Lambda/S3 for sandbox)
10. **AC-17.3.10:** Capture explore architecture diagram (local asset)
11. **AC-17.3.11:** Capture explore Bedrock agent screenshot (Lambda console for sandbox)
12. **AC-17.3.12:** Capture explore knowledge base screenshot (S3 bucket)
13. **AC-17.3.13:** Capture explore prompt modification screenshot
14. **AC-17.3.14:** Capture explore knowledge update screenshot (S3 upload)
15. **AC-17.3.15:** Capture boundary testing screenshot
16. **AC-17.3.16:** Capture production checklist screenshot (local asset)

## Tasks / Subtasks

- [x] Task 1: Create Playwright screenshot capture script
  - [x] Create tests/screenshots/council-chatbot.spec.ts
  - [x] Implement SSO federation for AWS Console access
  - [x] Navigate to CloudFormation and capture outputs
- [x] Task 2: Capture chatbot interaction screenshots
  - [x] Navigate to chatbot URL
  - [x] Capture welcome state
  - [x] Send questions and capture responses
  - [x] Capture multi-turn conversation
- [x] Task 3: Capture AWS console screenshots
  - [x] Lambda function console
  - [x] S3 bucket console
  - [x] CloudWatch logs
- [x] Task 4: Create static diagram screenshots
  - [x] Architecture overview (CloudFormation resources)
  - [x] Production checklist (CloudWatch)
- [x] Task 5: Verify all 16 screenshots captured
  - [x] Run check:screenshots script
  - [x] Confirm zero missing for council-chatbot

## Dev Notes

### Screenshot Mapping

| Filename | Source | Notes |
|----------|--------|-------|
| step-1-cloudformation-outputs.png | AWS Console | CloudFormation > Stack > Outputs |
| step-1-chatbot-interface.png | Chatbot URL | Lambda function URL web interface |
| step-2-question-input.png | Chatbot URL | After typing question |
| step-2-response-display.png | Chatbot URL | After receiving response |
| step-3-council-tax.png | Chatbot URL | Council tax conversation |
| step-3-planning.png | Chatbot URL | Planning question |
| step-3-multi-turn.png | Chatbot URL | Full conversation |
| step-4-conversation-summary.png | Chatbot URL | Complete session |
| step-4-bedrock-console.png | AWS Console | Lambda console (sandbox mode) |
| explore-architecture-overview.png | Local Asset | Diagram created manually |
| explore-bedrock-agent.png | AWS Console | Lambda function config |
| explore-knowledge-base.png | AWS Console | S3 bucket view |
| explore-prompt-modification.png | AWS Console | Lambda env vars |
| explore-knowledge-update.png | AWS Console | S3 upload interface |
| explore-boundary-testing.png | Chatbot URL | Off-topic response |
| explore-production-checklist.png | Local Asset | Checklist diagram |

### Stack Info

- Stack Name: ndx-try-council-chatbot
- Region: us-west-2
- ChatbotURL: https://f4ouix2syktkqs7srfv3ex3lye0teeil.lambda-url.us-west-2.on.aws/
- KnowledgeBaseBucket: ndx-try-chatbot-kb-449788867583-us-west-2

### File List

- `tests/screenshots/council-chatbot.spec.ts` - NEW: Screenshot capture script
- `src/assets/images/screenshots/council-chatbot/*.png` - 16 screenshots

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. Created Playwright test capturing all 16 screenshots
2. AWS Console screenshots captured via SSO federation
3. Chatbot interface screenshots capture interaction flow
4. Architecture and production screenshots use CloudFormation resources and CloudWatch
5. All 16 screenshots verified present by check:screenshots script
