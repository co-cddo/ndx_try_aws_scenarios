# Epic 2 Retrospective: Deployment Accessibility & Cost Transparency

**Date:** 2025-11-28
**Facilitator:** Bob (Scrum Master - AI)
**Participants:** cns

---

## Epic Summary

| Metric | Value |
|--------|-------|
| Epic | 2 - Deployment Accessibility & Cost Transparency |
| Stories Completed | 6/6 (100%) |
| Duration | Sprint 2 |
| Status | COMPLETE |

### Stories Delivered

| Story | Title | Status | Code Review |
|-------|-------|--------|-------------|
| 2.1 | One-Click CloudFormation Deployment - Pre-configured Parameters | Done | Approved |
| 2.2 | Real-Time Deployment Progress Tracking - CloudFormation Events | Done | Approved |
| 2.3 | Deployment Cost Estimation & Validation | Done | Approved |
| 2.4 | Demo Videos - 5-10 Minute Walkthroughs (Zero-Deployment Path) | Done | Approved |
| 2.5 | Screenshot Gallery - Annotated Visual Guide (Zero-Deployment Path) | Done | Approved |
| 2.6 | Partner-Led Guided Tour - Contact Form | Done | Approved |

---

## What Went Well

### 1. Scenario Detail Page Architecture
Successfully created `src/_includes/layouts/scenario.njk` as a comprehensive scenario detail template. All 6 scenarios now have dedicated pages with consistent structure, deployment buttons, and zero-deployment alternatives.

### 2. Zero-Deployment Path Implementation
Delivered three alternative evaluation paths for users who can't or won't deploy:
- Demo video embeds with YouTube integration
- Screenshot walkthrough galleries with annotation support
- Partner-led guided tour contact form

### 3. CloudFormation Integration
Clean URL generation via `deployUrl` filter. Pre-configured parameters encoded correctly. Direct link to AWS Console with region-specific templates. Cost transparency with clear maximum cost warnings.

### 4. GOV.UK Component Mastery
Consistent use of GOV.UK Frontend components across all new features:
- `govuk-details` for expandable content
- `govuk-warning-text` for cost warnings
- `govuk-panel--confirmation` for submission feedback
- `govuk-error-summary` for form validation
- `govuk-checkboxes` for consent and acknowledgment

### 5. Progressive Enhancement Pattern Established
All interactive features (video sections, screenshot galleries, partner tour form) work without JavaScript. Consistent IIFE pattern with `hidden` attribute enhancement.

### 6. Accessibility Excellence
pa11y-ci tests pass for all 15 URLs with 0 errors. Proper ARIA labels, keyboard navigation, and screen reader support implemented throughout Epic 2.

### 7. Schema Extension Pattern
Successfully extended `scenarios.yaml` schema for:
- Deployment configuration (templates, parameters, regions)
- Video metadata (YouTube embed, chapters, duration)
- Screenshot walkthrough data (steps, images, annotations)

---

## What Could Improve

### 1. Missing Privacy Policy (Caught in Review)
Code review for Story 2.6 identified missing `/privacy/` page that was referenced in GDPR notice. Created during review, but should have been identified earlier in requirements.

### 2. Placeholder Content for Zero-Deployment Path
Video embeds and screenshot galleries currently show "Coming Soon" placeholders. Actual content capture requires deployed scenarios. This is expected but creates incomplete user experience.

### 3. Form Backend Integration Deferred
Partner tour form uses `mailto:` link for MVP. GOV.UK Forms Service integration requires external account setup. This technical debt should be tracked.

### 4. Manual Testing Still Incomplete
Keyboard navigation and screen reader testing marked complete via code review, but dedicated manual testing with real assistive technologies not performed.

### 5. CSS File Size Growing
`custom.css` now at ~1,468 lines. Consider splitting into component-specific files or using SCSS partials for better maintainability.

---

## Key Learnings

| Learning | Context | Apply To |
|----------|---------|----------|
| Use YouTube nocookie domain | `youtube-nocookie.com` prevents tracking cookies | All video embeds |
| Mailto: link for MVP forms | Works without backend, progressive enhancement | Any contact forms |
| Query string for context passing | `?scenario=council-chatbot` pre-populates forms | Cross-page state |
| `aria-hidden="true"` for decorative text | Asterisks for required fields hidden from screen readers | All required indicators |
| GOV.UK error summary pattern | Links in summary jump to fields, `focus()` after validation | All forms |
| Component section pattern | Nunjucks components with conditional includes in layouts | Scenario page sections |
| Schema extension for new data | Add to schema first, then populate data | All data structure changes |

---

## Technical Debt Identified

| Item | Priority | Owner | Target |
|------|----------|-------|--------|
| GOV.UK Forms Service integration | Medium | Dev | When account available |
| Capture actual demo videos | High | Content | Sprint 3 |
| Capture actual screenshots | High | Content | Sprint 3 |
| Split CSS into partials | Low | Dev | Sprint 4 |
| Form action attribute fallback | Low | Dev | Sprint 3 |
| Dynamic scenario dropdown | Low | Dev | Sprint 3 |

---

## Impact on Epic 3

### What's Ready
- Scenario detail pages with full structure
- Zero-deployment path sections (video, screenshots, partner tour)
- Cost transparency components
- CloudFormation deployment integration
- Schema extended for all Epic 3 data needs
- Privacy policy page for data handling

### What Needs Attention for Epic 3
- Sample data framework for realistic UK council data
- Guided walkthrough content for each scenario
- Actual video recordings and screenshots to replace placeholders
- End-to-end testing with deployed scenarios

---

## Retrospective Grade

**Overall: A**

| Category | Score | Notes |
|----------|-------|-------|
| Completion | 5/5 | 6/6 stories delivered |
| Quality | 5/5 | All code reviews approved, issues resolved during review |
| Accessibility | 5/5 | 15/15 URLs pass pa11y-ci with 0 errors |
| Architecture | 5/5 | Clean component structure, schema-driven data |
| Documentation | 4/5 | Comprehensive dev notes, privacy policy created |

---

## Action Items for Next Epic

1. **[High]** Create sample data framework before scenario walkthroughs (Story 3.1)
2. **[High]** Capture actual demo videos and screenshots when scenarios deployed
3. **[Medium]** Configure GOV.UK Forms Service when account available
4. **[Low]** Refactor CSS into SCSS partials for maintainability
5. **[Low]** Add server-side validation preparation for forms

---

## Appendix: Files Created in Epic 2

### Pages
- `src/scenarios/council-chatbot.njk` - Council Chatbot scenario detail
- `src/scenarios/planning-ai.njk` - Planning AI scenario detail
- `src/scenarios/foi-redaction.njk` - FOI Redaction scenario detail
- `src/scenarios/smart-car-park.njk` - Smart Car Park scenario detail
- `src/scenarios/text-to-speech.njk` - Text to Speech scenario detail
- `src/scenarios/quicksight-dashboard.njk` - QuickSight Dashboard scenario detail
- `src/partner-tour.njk` - Partner tour request form
- `src/privacy.md` - Privacy policy page

### Layouts
- `src/_includes/layouts/scenario.njk` - Scenario detail page layout

### Components
- `src/_includes/components/cost-transparency.njk` - Cost estimation display
- `src/_includes/components/deployment-guide.njk` - Post-deployment guidance
- `src/_includes/components/deployment-success.njk` - Deployment completion state
- `src/_includes/components/error-messages.njk` - Troubleshooting reference
- `src/_includes/components/demo-video-section.njk` - Video embed section
- `src/_includes/components/screenshot-walkthrough.njk` - Screenshot section wrapper
- `src/_includes/components/screenshot-gallery.njk` - Interactive gallery component
- `src/_includes/components/partner-tour-section.njk` - Partner tour CTA section

### JavaScript
- `src/assets/js/deploy-url.js` - Deployment URL handling and modal logic

### Data Extensions
- `src/_data/scenarios.yaml` - Extended with deployment, video, screenshots metadata

### Schema Extensions
- `schemas/scenario.schema.json` - Extended with deployment, video, screenshots schemas

### Infrastructure
- `.pa11yci.json` - Updated with 15 URLs (added scenario pages, partner-tour, privacy)

### Styles
- `src/assets/css/custom.css` - Extended with ~968 additional lines (500 → 1,468 total)

---

## Metrics Summary

| Metric | Epic 1 | Epic 2 | Change |
|--------|--------|--------|--------|
| Stories Completed | 4 | 6 | +50% |
| Pages Created | 7 | 8 | +1 |
| Components Created | 0 | 8 | +8 |
| CSS Lines | ~500 | ~1,468 | +968 |
| pa11y URLs | 8 | 15 | +7 |
| Accessibility Errors | 0 | 0 | Maintained |
| Build Time | 0.48s | 0.93s | +0.45s |

---

*Retrospective completed: 2025-11-28*
*Next epic: Epic 3 - Guided Scenario Experiences*
