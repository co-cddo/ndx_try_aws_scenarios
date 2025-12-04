# Story 3.2: Council Chatbot - "Ask the Chatbot" Walkthrough

Status: ready-for-dev

## Story

As a council user who's deployed the Council Chatbot scenario,
I want a step-by-step guide showing what to do with the chatbot,
So that I experience the "wow moment" of AI actually working with realistic council questions.

## Acceptance Criteria

### AC-3.2.1: Walkthrough Landing Page
- Walkthrough landing page displays with title, description, time estimate
- Verification: Visual inspection

### AC-3.2.2: Step 1 - Access Chatbot
- Step 1 (Access Chatbot) displays with screenshot and expected outcome
- Verification: Visual inspection

### AC-3.2.3: Step 2 - Bin Collection Query
- Step 2 (Bin Collection Query) has copyable input and wow moment callout
- Verification: Functional test

### AC-3.2.4: Copy-to-Clipboard Function
- Copy-to-clipboard function works with visual confirmation
- Verification: Functional test

### AC-3.2.5: Chatbot Responses
- Chatbot responds to sample queries with relevant answers
- Verification: Manual test

### AC-3.2.6: Sample Questions Documentation
- All 10 sample questions have expected responses documented
- Verification: Content review

### AC-3.2.7: Walkthrough Completion Page
- Walkthrough completion page displays with key takeaways
- Verification: Visual inspection

### AC-3.2.8: Evidence Pack Link
- "Generate Evidence Pack" link visible (placeholder for Epic 4)
- Verification: Visual inspection

### AC-3.2.9: Progress Persistence
- Progress persists across browser refresh (localStorage)
- Verification: Functional test

### AC-3.2.10: Time Limit
- Walkthrough completable in <15 minutes
- Verification: Timed user test

### AC-3.2.11: Technical Reassurance
- Walkthrough landing shows "No technical knowledge required" reassurance
- Verification: Visual inspection

### AC-3.2.12: Placeholder Hint Text
- Chatbot interface includes placeholder hint text (e.g., "Try: When is bin collection in B15?")
- Verification: Visual inspection

### AC-3.2.13: Wow Moment Callouts
- Wow moment callouts explain technical achievement in plain English
- Verification: Content review

### AC-3.2.14: Sample Data Status
- Walkthrough landing displays "Sample data status: ✓ Ready" with live verification
- Verification: Functional test

### AC-3.2.15: Manual Seeding Fallback
- Manual data seeding fallback instructions displayed if automated seeding detected as failed
- Verification: Functional test

### AC-3.2.16: Value Proposition
- Value proposition emphasizes "10 minutes to understand if this solves your problem"
- Verification: Content review

## Tasks / Subtasks

### Task 1: Create Walkthrough Landing Page (AC: 1, 11, 14, 15, 16)
- [ ] **1.1** Create `src/walkthroughs/council-chatbot/index.njk` landing page
- [ ] **1.2** Add title, description, and 5-minute time estimate
- [ ] **1.3** Add "No technical knowledge required" reassurance message
- [ ] **1.4** Add "10 minutes to understand if this solves your problem" value proposition
- [ ] **1.5** Integrate sample-data-status component with live verification
- [ ] **1.6** Add manual seeding fallback instructions for failed seeding

### Task 2: Create Walkthrough Step Component (AC: 2, 3, 4, 12)
- [ ] **2.1** Create `src/_includes/components/walkthrough-step.njk` reusable component
- [ ] **2.2** Add step title, description, and screenshot placeholder
- [ ] **2.3** Add expected outcome section with checkmarks
- [ ] **2.4** Implement copy-to-clipboard button with visual confirmation
- [ ] **2.5** Add placeholder hint text for chatbot interface

### Task 3: Create Wow Moment Component (AC: 13)
- [ ] **3.1** Create `src/_includes/components/wow-moment.njk` callout component
- [ ] **3.2** Add distinctive visual styling (GOV.UK notification pattern)
- [ ] **3.3** Ensure plain English explanations of technical achievements
- [ ] **3.4** Add ARIA labels for accessibility

### Task 4: Implement Walkthrough Steps (AC: 2, 3, 5)
- [ ] **4.1** Create Step 1: Access the Chatbot with CloudFormation output link
- [ ] **4.2** Create Step 2: Try This First Question (bin collection query)
- [ ] **4.3** Create Step 3: Try Your Own Question (free-form input)
- [ ] **4.4** Create Step 4: Notice the Details (technical explanation)
- [ ] **4.5** Add screenshots for each step (placeholder paths)
- [ ] **4.6** Add wow moment callouts at key steps

### Task 5: Document Sample Questions (AC: 6)
- [ ] **5.1** Create `src/_data/chatbot-sample-questions.yaml` with 10 questions
- [ ] **5.2** Add Waste & Recycling questions (3 questions)
- [ ] **5.3** Add Council Tax questions (2 questions)
- [ ] **5.4** Add Planning questions (2 questions)
- [ ] **5.5** Add General Services questions (3 questions)
- [ ] **5.6** Document expected responses for each question

### Task 6: Create Completion Page (AC: 7, 8)
- [ ] **6.1** Create `src/walkthroughs/council-chatbot/complete.njk` completion page
- [ ] **6.2** Add key takeaways summary
- [ ] **6.3** Add "Generate Evidence Pack" link (placeholder for Epic 4)
- [ ] **6.4** Add "Try Another Scenario" link to gallery
- [ ] **6.5** Add cleanup reminder with remaining time

### Task 7: Implement Progress Tracking (AC: 9)
- [ ] **7.1** Create `src/assets/js/walkthrough.js` progress tracking script
- [ ] **7.2** Implement localStorage save after each step completion
- [ ] **7.3** Implement resume from last completed step on page load
- [ ] **7.4** Add step indicator showing current step and total steps
- [ ] **7.5** Add Next/Previous navigation buttons

### Task 8: Create Walkthrough Layout (AC: 2)
- [ ] **8.1** Create `src/_includes/layouts/walkthrough.njk` base layout
- [ ] **8.2** Add step navigation (sidebar or header)
- [ ] **8.3** Add progress indicator
- [ ] **8.4** Add time estimate per step
- [ ] **8.5** Ensure mobile responsive at 320px viewport

### Task 9: Add Walkthrough Navigation
- [ ] **9.1** Update scenario detail page to link to walkthrough
- [ ] **9.2** Add "Start Walkthrough" button on council-chatbot scenario page
- [ ] **9.3** Add breadcrumb navigation within walkthrough

### Task 10: Testing (All ACs)
- [ ] **10.1** Test walkthrough landing page displays correctly
- [ ] **10.2** Test copy-to-clipboard function with visual confirmation
- [ ] **10.3** Test progress persistence across browser refresh
- [ ] **10.4** Test walkthrough completable in <15 minutes
- [ ] **10.5** Run pa11y accessibility validation on all walkthrough pages
- [ ] **10.6** Test keyboard navigation through walkthrough steps
- [ ] **10.7** Test mobile layout at 320px viewport

## Dev Notes

### Learnings from Previous Story

**From Story 3-1-sample-data-framework (Status: done)**

- **Lambda Layer Pattern**: UK data generator Lambda layer available for sample data
- **Sample Data Status Component**: `sample-data-status.njk` component available for health checks
- **CloudFormation Custom Resource**: Data seeding via custom resource pattern established
- **Testing Pattern**: Unit tests + integration tests pattern established

[Source: docs/sprint-artifacts/3-1-sample-data-framework-realistic-uk-council-data-generation.md#Dev-Agent-Record]

### Architecture Alignment

From tech-spec-epic-3.md:

- **ADR-1 (Static Site)**: Walkthrough content is static; interactions happen in deployed AWS resources
- **ADR-4 (Vanilla JavaScript)**: Progress tracking, copy-to-clipboard in plain JS
- **ADR-6 (GOV.UK Frontend)**: Step indicator using GOV.UK Step-by-step navigation pattern

### Walkthrough Structure

```
src/walkthroughs/council-chatbot/
├── index.njk          # Landing page
├── step-1.njk         # Access the Chatbot
├── step-2.njk         # Try This First Question
├── step-3.njk         # Try Your Own Question
├── step-4.njk         # Notice the Details
└── complete.njk       # Completion page
```

### Sample Questions Configuration

```yaml
chatbotSampleQuestions:
  categories:
    - name: "Waste & Recycling"
      questions:
        - question: "When is my bin collection day?"
          expected: "Your bin collection days depend on your postcode area..."
        - question: "How do I report a missed bin collection?"
          expected: "To report a missed bin collection..."
        - question: "What can I put in my recycling bin?"
          expected: "You can recycle paper, cardboard, plastic bottles..."
    - name: "Council Tax"
      questions:
        - question: "How do I pay my council tax?"
          expected: "You can pay your council tax online..."
        - question: "Am I eligible for council tax reduction?"
          expected: "Council tax reduction is available for..."
    - name: "Planning"
      questions:
        - question: "Do I need planning permission for a shed?"
          expected: "Garden sheds typically don't require planning permission..."
        - question: "How do I object to a planning application?"
          expected: "To comment on a planning application..."
    - name: "General Services"
      questions:
        - question: "What are the town hall opening hours?"
          expected: "The Town Hall is open Monday-Friday 9am-5pm..."
        - question: "How do I report a pothole?"
          expected: "Report potholes online through our highways portal..."
        - question: "How do I register to vote?"
          expected: "You can register to vote online at gov.uk/register-to-vote..."
```

### Key Technical Constraints

1. **No backend API**: Progress saved to localStorage only
2. **Static walkthrough**: Content pre-rendered, interactions in AWS console
3. **Copy-to-clipboard**: Vanilla JS with Clipboard API and fallback
4. **15-minute target**: Walkthrough must be completable in under 15 minutes
5. **WCAG 2.2 AA**: All components must be keyboard accessible

### Project Structure Notes

New files to create:
- `src/walkthroughs/council-chatbot/` - Walkthrough pages
- `src/_includes/layouts/walkthrough.njk` - Base layout
- `src/_includes/components/walkthrough-step.njk` - Step component
- `src/_includes/components/wow-moment.njk` - Wow moment callout
- `src/assets/js/walkthrough.js` - Progress tracking JavaScript
- `src/_data/chatbot-sample-questions.yaml` - Sample questions data

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-3.md#AC-3.2]
- [Source: docs/epics.md#Story-3.2]
- [Source: docs/prd.md#FR13-15]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

### Completion Notes List

### File List

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-28 | 0.1 | Story drafted from epics.md and tech-spec-epic-3.md |
