# Story 5-1: "What's Next" Guidance Pages - Per-Scenario Pathways

**Epic:** 5 - Pathway Forward & Partner Ecosystem
**Status:** Drafted
**Priority:** High (core pathway functionality)

## User Story

As a **council evaluator** who has completed a scenario evaluation,
I want **contextual "What's Next" guidance based on my evaluation outcome**
So that **I have a clear pathway to proceed with implementation, exploration, or feedback**.

## Background

This story implements the Next Steps guidance component that provides contextual pathways based on the user's evaluation outcome (would_implement: yes/maybe/no). The component displays on a dedicated Next Steps page per scenario with GOV.UK Frontend patterns.

## Acceptance Criteria (MVP)

### AC 5.1.1: Next Steps Page Structure
- [ ] Next Steps page exists for each of the 6 scenarios at `/next-steps/{scenario-id}/`
- [ ] Page uses standard GOV.UK Frontend layout
- [ ] Page title includes scenario name

### AC 5.1.2: Proceed Pathway (would_implement = 'yes')
- [ ] Displays "You're Ready to Proceed" heading
- [ ] Shows numbered steps: stakeholder review → G-Cloud suppliers → procurement
- [ ] Includes G-Cloud search link with pre-filtered URL
- [ ] Shows partner recommendations preview

### AC 5.1.3: Maybe Pathway (would_implement = 'maybe')
- [ ] Displays "Need More Time to Decide?" heading
- [ ] Shows options: explore more scenarios, request expert conversation
- [ ] Links to scenarios gallery and contact form

### AC 5.1.4: Not Now Pathway (would_implement = 'no')
- [ ] Displays "Not the Right Fit?" heading
- [ ] Shows feedback form link
- [ ] Displays related scenarios for exploration

### AC 5.1.5: Session State Integration
- [ ] Reads would_implement value from localStorage (ndx_reflection_form)
- [ ] Defaults to "Maybe" pathway when no session data exists
- [ ] Shows incomplete evaluation banner when visiting without evaluation data

### AC 5.1.6: G-Cloud Integration
- [ ] G-Cloud link opens Digital Marketplace with pre-filtered search
- [ ] Link includes external link indicator and opens in new tab
- [ ] Search term specific to scenario

### AC 5.1.7: GOV.UK Frontend Patterns
- [ ] Uses GOV.UK buttons, cards, inset text components
- [ ] Styling matches GOV.UK Design System
- [ ] Responsive layout for mobile/tablet

### AC 5.1.8: Accessibility (WCAG 2.2 AA)
- [ ] All pages pass pa11y-ci tests with 0 errors
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators visible

### AC 5.1.9: Performance
- [ ] Page loads in <2 seconds
- [ ] No blocking JavaScript

## Technical Implementation

### File Structure
```
src/
├── _includes/
│   ├── components/
│   │   └── next-steps-guidance.njk  # Main guidance component
│   └── layouts/
│       └── next-steps.njk           # Next steps page layout
├── _data/
│   └── pathways.yaml                # Pathway definitions
└── next-steps/
    ├── index.njk                    # Next steps landing (optional)
    ├── council-chatbot.njk
    ├── planning-ai.njk
    ├── foi-redaction.njk
    ├── smart-car-park.njk
    ├── text-to-speech.njk
    └── quicksight-dashboard.njk
```

### Pathways Data
```yaml
# src/_data/pathways.yaml
proceed:
  heading: "You're Ready to Proceed"
  description: "Based on your evaluation, here's your pathway to implementation:"
  steps:
    - title: "Review with stakeholders"
      description: "Share your Evidence Pack with your committee"
    - title: "Find approved suppliers"
      description: "Browse G-Cloud for implementation partners"
    - title: "Start procurement"
      description: "Use your Evidence Pack as the business case foundation"

maybe:
  heading: "Need More Time to Decide?"
  description: "That's perfectly fine. Here are some options:"
  options:
    - title: "Explore More Scenarios"
      description: "Try another scenario to compare approaches"
      link: "/scenarios/"
    - title: "Speak to an Expert"
      description: "Get answers to your specific questions"
      link: "/contact/"

not_now:
  heading: "Not the Right Fit?"
  description: "Thank you for exploring this scenario. Your feedback helps us improve."
  feedback_link: "/contact/"
```

## Dependencies

- Epic 4 (Evidence Pack) - provides session data
- GOV.UK Frontend 5.13.0
- scenarios.yaml with gcloud search terms

## Definition of Done

- [ ] All 9 MVP acceptance criteria pass
- [ ] 6 Next Steps pages created
- [ ] Pathway displays correctly based on session state
- [ ] pa11y accessibility tests pass
- [ ] Build succeeds

## Notes

- Extended acceptance criteria (5.1.10-5.1.34) deferred to Phase 2
- Partner listing detail in Story 5.3
- Analytics tracking in Story 5.2
