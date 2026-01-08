# Epic Technical Specification: Council Chatbot Exploration (REFERENCE IMPLEMENTATION)

Date: 2025-11-28
Author: cns
Epic ID: 6
Status: Draft

---

## Overview

Epic 6 transforms the passive Council Chatbot demo experience into an active learning journey through hands-on exploration. As the **REFERENCE IMPLEMENTATION** (per CBA5), this epic receives extra investment (~21 story points) to establish reusable patterns, components, and templates that will reduce Epic 7-11 implementation effort by ~40%.

The epic delivers 6 stories covering: exploration landing page with persona-based paths, guided "What Can I Change?" experiments, "How Does It Work?" architecture tours (visual + console), "Test the Limits" boundary exercises, "Take It Further" production guidance, and a shared screenshot automation pipeline.

**User Value Statement:** "I don't just know the chatbot works - I understand how it works, what I can change, and what happens when I push the limits."

## Objectives and Scope

### In Scope

- **Story 6.1:** Exploration Landing Page with persona selection (Visual-First vs Console+Code paths)
- **Story 6.2:** 5 guided experiments testing chatbot capabilities (out-of-scope questions, context retention, semantic understanding, multi-part questions, Welsh language)
- **Story 6.3:** Architecture tour with dual paths (Visual Tour for non-technical, Console Tour for developers)
- **Story 6.4:** 3 boundary challenges (token overload, sensitive topics, rate limiting)
- **Story 6.5:** Production guidance with cost projections, security hardening checklist, customization options
- **Story 6.6:** Playwright-based screenshot automation pipeline as shared infrastructure for Epic 7-11
- Reusable Nunjucks components: `activity-card.njk`, `completion-indicator.njk`, `simplify-toggle.njk`, `time-estimate.njk`, `safe-badge.njk`, `learning-summary.njk`, `fallback-banner.njk`
- LocalStorage state management for exploration progress and preferences
- Analytics events: `exploration_activity_started`, `exploration_activity_completed`, `exploration_completed` (NFR43)

### Out of Scope

- Modifications to the core Council Chatbot CloudFormation template (Epic 2)
- Changes to the basic walkthrough (Story 3.2) - exploration is additive
- Backend infrastructure (static-first philosophy maintained)
- Real-time chatbot monitoring dashboard

### Dependencies

- **Story 3.2 (Done):** Council Chatbot "Ask the Chatbot" Walkthrough must exist
- **Deployed Council Chatbot scenario:** Live Lambda endpoints required for experiments
- **GOV.UK Frontend 5.13.0:** Component patterns and accessibility compliance
- **GitHub Actions:** Screenshot automation pipeline execution environment

## System Architecture Alignment

This epic extends the static-first architecture defined in Sections 17-21 of the architecture document:

### Decision 7 Alignment: Screenshot Automation Pipeline
- Playwright-based screenshot capture in GitHub Actions (build-time)
- Screenshots stored in `src/assets/images/exploration/council-chatbot/`
- Weekly scheduled runs + manual trigger for urgent updates
- Visual regression detection via image comparison

### Decision 8 Alignment: Client-Side State Management
- LocalStorage for toggle states ("Simplify for me", completion progress)
- `src/assets/js/exploration-state.js` manages state persistence
- Graceful degradation when JavaScript disabled

### Decision 9 Alignment: Exploration Page Structure
- Extended Nunjucks templates with persona-based content blocks
- `src/_includes/layouts/exploration.njk` layout template
- Data attributes (`data-persona`, `data-view`) for progressive enhancement

### Decision 10 Alignment: Analytics Events for Exploration
- Extended `src/assets/js/analytics.js` with exploration event types
- `exploration_completed` event captures: scenario_id, activities_attempted, activities_completed, time_spent_exploring, path_taken

## Detailed Design

### Services and Modules

#### New Files to Create

| File | Purpose | Story |
|------|---------|-------|
| `src/walkthroughs/council-chatbot/explore/index.njk` | Exploration landing page | 6.1 |
| `src/walkthroughs/council-chatbot/explore/experiments.njk` | 5 guided experiments | 6.2 |
| `src/walkthroughs/council-chatbot/explore/architecture.njk` | Visual + Console tours | 6.3 |
| `src/walkthroughs/council-chatbot/explore/limits.njk` | 3 boundary challenges | 6.4 |
| `src/walkthroughs/council-chatbot/explore/production.njk` | Production guidance | 6.5 |
| `src/_data/exploration/council-chatbot.yaml` | Exploration activity metadata | 6.1-6.5 |
| `src/_includes/layouts/exploration.njk` | Exploration section layout | 6.1 |
| `src/_includes/components/exploration/activity-card.njk` | Activity card component | 6.1 |
| `src/_includes/components/exploration/completion-indicator.njk` | Progress indicator | 6.1 |
| `src/_includes/components/exploration/simplify-toggle.njk` | Persona toggle | 6.1 |
| `src/_includes/components/exploration/time-estimate.njk` | Time display | 6.1 |
| `src/_includes/components/exploration/safe-badge.njk` | Safety reassurance | 6.2 |
| `src/_includes/components/exploration/learning-summary.njk` | Exit summary | 6.1 |
| `src/_includes/components/exploration/fallback-banner.njk` | Stack expired warning | 6.3 |
| `src/assets/js/exploration-state.js` | LocalStorage state management | 6.1 |
| `.github/workflows/screenshot-capture.yml` | Screenshot automation pipeline | 6.6 |
| `tests/screenshot-capture.spec.ts` | Playwright screenshot tests | 6.6 |
| `tests/visual-regression.spec.ts` | Visual regression tests | 6.6 |

#### Files to Modify

| File | Modification | Story |
|------|--------------|-------|
| `src/assets/js/analytics.js` | Add exploration event types | 6.1 |
| `src/_data/navigation.yaml` | Add exploration navigation links | 6.1 |
| `CONTRIBUTING.md` | Document screenshot pipeline SLA | 6.6 |

### Data Models and Contracts

#### Exploration Activity Data Model

```yaml
# src/_data/exploration/council-chatbot.yaml
scenario_id: council-chatbot
scenario_title: Council Chatbot
total_time_estimate: "45 minutes"
activities:
  - id: exp1
    title: "Ask Outside the Knowledge Base"
    category: experiments
    persona: both  # visual, technical, both
    time_estimate: "5 min"
    learning: "The chatbot has boundaries - it only answers from its training data"
    is_first: true
    safe_badge: true
    input_text: "What's the weather going to be tomorrow?"
    expected_output: "Chatbot says it can only answer council-related questions"
    screenshot: "experiments/exp1-out-of-scope-response.png"

  - id: exp2
    title: "Multi-Turn Conversation"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "Context retention reduces repetitive questions from residents"
    safe_badge: true
    input_text: |
      First: "When are bins collected?"
      Then: "What about recycling?"
    expected_output: "Chatbot remembers context from first question"
    screenshot: "experiments/exp2-context-retention.png"

  # ... additional activities following same structure
```

#### LocalStorage State Schema

```typescript
interface ExplorationState {
  simplifyMode: boolean;
  advancedMode: boolean;
  completedActivities: {
    [scenarioId: string]: string[];  // Array of activity IDs
  };
  timestamp: string;  // ISO 8601
}
```

#### Analytics Event Schema

```typescript
interface ExplorationCompletedEvent {
  event: 'exploration_completed';
  timestamp: string;
  scenario_id: string;
  activities_attempted: string[];
  activities_completed: string[];
  time_spent_exploring: number;  // seconds
  path_taken: 'visual' | 'console' | 'mixed';
}
```

### APIs and Interfaces

#### Deployed Chatbot Endpoint (Existing)

The experiments in Story 6.2 interact with the live deployed chatbot endpoint:

- **Endpoint:** Lambda Function URL from CloudFormation stack outputs
- **Method:** POST
- **Request:** `{ "message": "user input text" }`
- **Response:** `{ "response": "chatbot answer", "confidence": 0.95 }`

No new APIs are created - all exploration uses existing deployed infrastructure.

#### AWS Console Deep Links (Story 6.3)

Console Tour activities link directly to AWS resources:

| Resource | Console URL Pattern |
|----------|---------------------|
| Lex Bot | `https://{region}.console.aws.amazon.com/lexv2/home#bot/{botId}` |
| Bedrock Logs | `https://{region}.console.aws.amazon.com/cloudwatch/home#logsV2:log-groups/log-group/$252Faws$252Fbedrock` |
| DynamoDB Table | `https://{region}.console.aws.amazon.com/dynamodbv2/home#table?name={tableName}` |
| Lambda Function | `https://{region}.console.aws.amazon.com/lambda/home#/functions/{functionName}` |

Region and resource identifiers injected from CloudFormation stack outputs or configuration.

### Workflows and Sequencing

#### User Journey Flow

```
[Complete Story 3.2 Walkthrough]
           ↓
[Scroll to "Explore Further" section]
           ↓
[Choose Persona: Visual-First OR Console+Code]
           ↓
     ┌─────┴─────┐
     ↓           ↓
[Visual Path]  [Technical Path]
     ↓           ↓
[5 Activities each, different content]
     ↓           ↓
[Complete 3+ activities]
           ↓
[Show "✓ Essential exploration complete"]
           ↓
[Optional: Continue or Exit]
           ↓
[Learning Summary displayed]
           ↓
[Link to Evidence Pack]
```

#### Screenshot Automation Pipeline Flow

```
[Trigger: Push to cloudformation/** OR Weekly Schedule OR Manual]
           ↓
[GitHub Actions: checkout, setup Node.js 20, install Playwright]
           ↓
[Configure AWS credentials]
           ↓
[Deploy reference CloudFormation stack]
           ↓
[Wait for stack creation complete]
           ↓
[Run Playwright screenshot tests]
           ↓
[Run visual regression tests]
           ↓
[Always: Delete reference stack]
           ↓
[Commit screenshots to src/assets/images/exploration/]
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| NFR40: Page load | <3 seconds | Lazy loading for below-fold images, WebP format with PNG fallback |
| Image size | <200KB per screenshot | Playwright screenshot compression, 80% quality JPEG |
| Build time | <10 minutes | Incremental Eleventy builds, cached Playwright browser |

### Security

| Requirement | Implementation |
|-------------|----------------|
| No sensitive data exposure | Console links use CloudFormation outputs, not hardcoded ARNs |
| AWS credential protection | GitHub Actions secrets for screenshot pipeline credentials |
| LocalStorage security | No PII stored, only activity completion state |
| XSS prevention | Nunjucks auto-escaping, CSP headers via GitHub Pages |

### Reliability/Availability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| NFR37: Activity completion rate | 95%+ | Comprehensive error handling, fallback content |
| Screenshot pipeline success | 99%+ | Retry logic, stack cleanup in `always` block |
| Fallback content | 100% availability | Static fallback screenshots captured from reference deployment |

### Observability

| Metric | Capture Method |
|--------|---------------|
| Activity started | `exploration_activity_started` analytics event |
| Activity completed | `exploration_activity_completed` analytics event |
| Exploration completed | `exploration_completed` analytics event (NFR43) |
| Screenshot pipeline status | GitHub Actions workflow status, Slack notification |

## Dependencies and Integrations

### Internal Dependencies

| Dependency | Status | Impact if Missing |
|------------|--------|-------------------|
| Story 3.2 Council Chatbot Walkthrough | Done | Cannot link exploration from walkthrough |
| GOV.UK Frontend 5.13.0 | Available | Cannot use design system components |
| Eleventy 11ty | Available | Cannot build static pages |
| GitHub Pages | Available | Cannot host exploration content |

### External Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| Deployed Council Chatbot Lambda | Live experiments | Show "Stack expired" fallback screenshots |
| AWS Console | Console Tour links | Annotated static screenshots |
| GitHub Actions | Screenshot automation | Manual screenshot capture |
| Playwright | Browser automation | Manual screenshot capture |

### Integration Points

| Integration | Direction | Data Exchanged |
|-------------|-----------|----------------|
| Chatbot Lambda | Portal → AWS | POST messages, receive responses |
| CloudFormation Outputs | AWS → Portal | Resource ARNs for console links |
| LocalStorage | Browser ↔ Portal | Exploration state persistence |
| Analytics | Portal → Analytics | Event tracking data |

## Acceptance Criteria (Authoritative)

### Story 6.1: Exploration Landing Page

**Given** I've completed the basic walkthrough (Story 3.2)
**When** I scroll to "Explore Further" section
**Then** I see:

- [ ] Persona selection: "Service Manager / Non-Technical" vs "Developer / Technical"
- [ ] Visual-First Path: 5 activities with 5-min estimates
- [ ] Console+Code Path: 5 activities with 10-min estimates
- [ ] Each activity shows: time estimate, what you'll learn, Start button
- [ ] Activities sequenced with recommended order
- [ ] Page accessible (WCAG 2.2 AA)
- [ ] "Simplify for me" toggle in sticky header
- [ ] Completion indicator after 3 activities

### Story 6.2: "What Can I Change?" Experiments

**Given** I'm on the chatbot exploration page
**When** I select experiments
**Then** I see 5 guided experiments:

- [ ] Experiment 1: Out-of-scope question with copy-to-clipboard
- [ ] Experiment 2: Multi-turn conversation test
- [ ] Experiment 3: Semantic understanding (3 phrasings, same answer)
- [ ] Experiment 4: Complex multi-part question
- [ ] Experiment 5: Welsh language input
- [ ] Each includes: copy button, reset conversation button, expected vs actual, "What You Learned"
- [ ] Experiments work on deployed chatbot (not simulation)
- [ ] Page accessible (WCAG 2.2 AA)

### Story 6.3: "How Does It Work?" Architecture Tour

**Given** I'm on the chatbot exploration page
**When** I select architecture tour
**Then** I see two paths:

- [ ] Visual Tour (non-technical): 5 steps with annotated diagrams
- [ ] Console Tour (technical): 5 steps with AWS Console links
- [ ] Each step includes: annotated screenshot, "What is this?" explainer
- [ ] Direct console links with region parameter
- [ ] "Back to diagram" navigation
- [ ] Fallback banner when stack expired (FR83)

### Story 6.4: "Test the Limits" Boundary Exercise

**Given** I'm on the chatbot exploration page
**When** I select "Test the Limits"
**Then** I see 3 challenges:

- [ ] Challenge 1: Token overload (5000+ character text)
- [ ] Challenge 2: Sensitive topic handling
- [ ] Challenge 3: Rapid-fire rate testing (10 questions)
- [ ] Each includes: "Safe to try" reassurance, expected behavior, business implication, recovery instructions
- [ ] Advanced Mode checkbox for additional challenges (FR88)
- [ ] Challenges don't permanently break the demo

### Story 6.5: "Take It Further" Production Guidance

**Given** I'm on the chatbot exploration page
**When** I select production guidance
**Then** I see:

- [ ] Section 1: What would change at scale (users, data, availability, security)
- [ ] Section 2: Customization options with effort estimates
- [ ] Section 3: Cost projection table (demo vs production)
- [ ] Section 4: Security hardening checklist
- [ ] Section 5: Next steps decision tree
- [ ] Realistic guidance (not sales pitch)
- [ ] Partner contact form link

### Story 6.6: Screenshot Automation Pipeline

**Given** the Council Chatbot scenario is deployed
**When** the screenshot automation pipeline runs
**Then:**

- [ ] Playwright navigates to each exploration step
- [ ] Screenshots captured at 1280x800 desktop, 375x667 mobile
- [ ] Saved to `src/assets/images/walkthroughs/council-chatbot/explore/`
- [ ] Naming: `{step}-{description}-{viewport}.png`
- [ ] Annotations defined in YAML (SVG overlay, not image editing)
- [ ] Pipeline triggers: deployment, weekly schedule, manual
- [ ] File sizes <500KB each
- [ ] Alt text present for all screenshots
- [ ] Visual regression test (>10% diff flagged)
- [ ] Pipeline documented in CONTRIBUTING.md

## Traceability Mapping

| Story | Functional Requirements | Non-Functional Requirements |
|-------|------------------------|----------------------------|
| 6.1 | FR57, FR58, FR59, FR60, FR82, FR90, FR91, FR92, FR93, FR94, FR96 | NFR37, NFR39, NFR40 |
| 6.2 | FR65, FR66, FR67, FR68, FR78, FR84 | NFR37, NFR39, NFR40 |
| 6.3 | FR69, FR70, FR71, FR83, FR85, FR86 | NFR37, NFR38, NFR39, NFR40 |
| 6.4 | FR72, FR73, FR74, FR88, FR98 | NFR37, NFR39 |
| 6.5 | FR75, FR76, FR77 | NFR39 |
| 6.6 | FR61, FR62, FR63, FR81 | NFR38, NFR44 |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Screenshot pipeline fails on AWS Console UI changes | Medium | High | Weekly automated runs catch drift, manual trigger for urgent fixes |
| Console Tour links break when stack expires | High | Medium | FR83 fallback banners with static screenshots |
| Experiments fail if chatbot Lambda is cold | Low | Low | Add retry logic with exponential backoff |
| LocalStorage unavailable (private browsing) | Low | Low | Graceful degradation, site works without state persistence |

### Assumptions

- Council Chatbot CloudFormation template remains stable (no breaking API changes)
- GitHub Actions has sufficient resources for Playwright execution
- AWS credentials for screenshot pipeline have minimal permissions (deploy/delete reference stack only)
- Councils access exploration within 90-minute stack lifetime

### Open Questions

1. **Resolved:** Screenshot capture AWS account - Use dedicated sandbox account with screenshot-specific IAM role
2. **Resolved:** Console link region - Use `us-west-2` (where scenarios are deployed per plan)
3. **Open:** Should exploration activities be available without completing the basic walkthrough? (Decision: Recommend walkthrough first but don't block access)

## Test Strategy Summary

### Unit Testing

| Component | Test Type | Coverage Target |
|-----------|-----------|-----------------|
| `exploration-state.js` | Jest unit tests | 90%+ |
| Nunjucks components | Template rendering tests | 100% of components |

### Integration Testing

| Test | Method | Automation |
|------|--------|------------|
| Exploration page loads | Playwright E2E | GitHub Actions |
| Chatbot endpoint responds | HTTP integration test | GitHub Actions |
| LocalStorage persistence | Playwright E2E | GitHub Actions |
| Analytics events fire | Playwright E2E | GitHub Actions |

### Accessibility Testing

| Test | Tool | Pass Criteria |
|------|------|---------------|
| WCAG 2.2 AA | Pa11y CI | Zero errors |
| Keyboard navigation | Manual + Playwright | All interactive elements reachable |
| Screen reader | Manual with VoiceOver/NVDA | All content accessible |

### Visual Regression Testing

| Test | Tool | Threshold |
|------|------|-----------|
| Screenshot comparison | Playwright | >10% diff triggers alert |
| Component visual tests | Playwright | Per-component baseline |

### Manual Testing Checklist

- [ ] Persona toggle switches content correctly
- [ ] All 5 Visual-First activities completable
- [ ] All 5 Console+Code activities completable
- [ ] Completion indicator shows after 3 activities
- [ ] Learning summary displays on exit
- [ ] Fallback banner shows when stack expired
- [ ] Mobile responsive layout works
- [ ] All experiments work with live chatbot
