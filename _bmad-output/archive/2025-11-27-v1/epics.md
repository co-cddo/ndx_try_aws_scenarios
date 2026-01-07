# ndx_try_aws_scenarios - Epic Breakdown

**Author:** cns
**Date:** 2025-11-27
**Project Level:** Greenfield
**Target Scale:** UK Local Government (100+ councils in Year 1)

---

## Overview

This document provides the complete epic and story breakdown for **NDX:Try AWS Scenarios**, decomposing the Product Requirements Document (PRD) and 56 Functional Requirements into implementable, bite-sized stories organized into 5 deliverable functional epics.

**Living Document Notice:** This is the initial version created from PRD + UX Design + Architecture. It will be enhanced after each epic delivery with implementation insights and technical refinements.

---

## Epic Structure (5 User-Value-Centered Epics)

### Summary of Epics

| Epic | Goal | User Value | FRs |
|------|------|-----------|-----|
| **Epic 1: Portal Foundation & Discovery** | Help councils find relevant scenarios efficiently | "I can find the right scenario in 2 minutes" | 7 |
| **Epic 2: Deployment Accessibility & Cost Transparency** | Remove deployment barriers for non-technical users | "I can evaluate AWS without CloudFormation expertise, costs clear upfront" | 9 |
| **Epic 3: Guided Scenario Experiences** | Deliver "wow moments" within 15 minutes with realistic council data | "I deployed a scenario and experienced AWS working with recognizable council data" | 7 |
| **Epic 4: Evidence Generation & Committee-Ready Artifacts** | Transform demo experience into business case for procurement | "I have a committee-ready PDF that justifies my procurement decision" | 6 |
| **Epic 5: Pathway Forward & Partner Ecosystem** | Connect evaluation to implementation with clear next steps | "I know exactly what to do next: procure, reject with rationale, or evaluate deeper" | 10 |

**Total FRs Covered: 56** (52 original + 4 gap FRs from stakeholder elicitation)

---

## Functional Requirements Inventory

### All 56 FRs by Category

**Scenario Management (FR1-3) - Foundation**
- FR1: System maintains library of CloudFormation templates with documented parameters and defaults
- FR2: Scenarios include comprehensive metadata (AWS services, cost, time, success criteria, use case)
- FR3: Scenarios are versioned independently with backward-compatible parameters

**Discovery & Navigation (FR4-7) - Epic 1**
- FR4: Portal provides searchable scenario gallery with cards (title, icon, description, time, difficulty)
- FR5: Scenario Selector quiz (3-question flow) recommends 1-3 scenarios based on problem/complexity/time
- FR6: Scenario Selector provides reasoning for recommendations
- FR7: Portal provides quick-start guide directing users to 15-minute success path

**Deployment & Infrastructure (FR8-12) - Epic 2**
- FR8: System automates one-click CloudFormation deployment to Innovation Sandbox
- FR9: Deployment captures and displays CloudFormation stack events in real-time
- FR10: Successful deployments provide immediate output (dashboard URLs, API endpoints, access instructions)
- FR11: Automated cleanup via Lambda scheduled event terminates resources after 90 minutes
- FR12: Deployment validates cost estimates before execution (within ±15%)

**Guided Experience (FR13-15) - Epic 3**
- FR13: Portal displays "Demo Walkthrough" guide per scenario with step-by-step instructions
- FR14: Walkthrough guides include expected outputs/behaviors so users know success when they see it
- FR15: Portal provides sample queries, test data, or example inputs (pre-populated)

**Experience Capture & Evidence Generation (FR16-20) - Epic 4**
- FR16: System provides "What You Experienced" reflection guide (structured form) with key insight questions
- FR17: Form responses captured in session data for analysis and troubleshooting
- FR18: Committee Evidence Pack generator auto-populates templates with session data and scenario info
- FR19: Evidence Pack PDF includes ROI, risk summary, peer references, compliance alignment, next-step guidance
- FR20: Evidence Packs tailored per persona (CTO, Service Manager, Finance, Developer versions)

**Zero-Deployment Pathways (FR21-24) - Epic 2**
- FR21: Portal hosts 5-10 minute demo video per scenario (narrated walkthrough)
- FR22: Videos captioned with transcripts provided for accessibility
- FR23: Portal provides screenshot gallery with annotations showing key results
- FR24: Portal offers contact form for councils requesting partner-led guided tour

**Portal Content & Documentation (FR25-29) - Foundation**
- FR25: Portal includes pages for Quick Start, Accessibility, Deployment Guides, Evidence Packs, Partners, Case Studies
- FR26: Scenario pages include use case, AWS services, time, cost, architecture diagram, deployment guide, walkthrough, queries, troubleshooting, "What's Next"
- FR27: Architecture diagrams created in Mermaid format and rendered as SVGs
- FR28: Deployment guides include prerequisites, step-by-step instructions, success indicators, common issues/solutions, rollback
- FR29: Portal provides G-Cloud procurement guidance page with available partners and production pathways

**Sample Data Management (FR30-32) - Epic 3**
- FR30: Each scenario includes synthetic but realistic UK council data (London region, council-specific naming)
- FR31: Sample data includes realistic values enabling ROI projections (parking revenue, processing times, etc.)
- FR32: Sample data generation automated/templated for future customization

**Analytics & Success Tracking (FR33-36) - Epic 5**
- FR33: System captures key session events (quiz completion, scenario selection, deployment, walkthrough, Evidence Pack)
- FR34: Analytics dashboard tracks deployment frequency, time-to-first-insight, form completion rates, drop-off points
- FR35: Analytics identify which scenarios drive informed decisions vs incomplete evaluations
- FR36: System enables survey follow-up tracking (committee presentations, outcomes, actions taken)

**Integration & Extensibility (FR37-40) - Foundation**
- FR37: CloudFormation templates use publicly available AWS SDKs with sample code in multiple languages
- FR38: Templates and documentation follow AWS best practices and naming conventions
- FR39: All templates open-source (MIT license) with clear contribution guidelines
- FR40: Portal provides contact information for feedback, bug reports, scenario suggestions

**Accessibility (FR41-44) - All Epics**
- FR41: Portal achieves WCAG 2.2 AA compliance across all pages and interactions
- FR42: Deployment guides support text-to-speech readers without loss of critical information
- FR43: All images include alt text describing content (architecture diagrams, screenshots)
- FR44: Video walkthroughs captioned with transcripts available

**Repository & Distribution (FR45-48) - Foundation**
- FR45: GitHub repository public with README, QUICKSTART.md, ACCESSIBILITY.md, CONTRIBUTING.md
- FR46: Repository structure organized (/scenarios/{name}/ with CloudFormation template, README, architecture diagram)
- FR47: Repository includes sample data scripts and templates for future scenario development
- FR48: Portal markdown formatted for compatibility with ndx.digital.cabinet-office.gov.uk and GitHub Pages

**LGA AI Hub Integration (FR49-50) - Epic 5**
- FR49: NDX:Try listed in LGA AI Hub resources with categorization and search tags
- FR50: Portal includes LGA branding/acknowledgment and co-promotion messaging

**Success Metrics & Reporting (FR51-52) - Epic 5**
- FR51: System generates monthly reports on deployments per scenario, unique councils, journey completion, Evidence Pack adoption
- FR52: System provides dashboard for tracking primary success metric (informed decision rate) and secondary metrics

**Gap FRs (FR53-56) - From Stakeholder Elicitation**
- FR53: Security Assessment Guide - CTOs need explicit security posture documentation per scenario
- FR54: Service-Specific Success Metrics - Service Managers need "what does success look like?" guidance per domain
- FR55: Code Repository Organization Guide - Developers need clear guidance on repo structure and file navigation
- FR56: Post-Deployment Cost Analysis Tool - Finance teams need to compare actual vs estimated costs

---

## FR Coverage Map

### Mapping by Epic

**Epic 1: Portal Foundation & Discovery** (7 FRs)
- FR4: Scenario gallery cards
- FR5: Scenario Selector quiz
- FR6: Quiz reasoning
- FR7: Quick-start guide
- FR26: Scenario pages (use case, AWS services, time, cost, etc.)
- FR43: Alt text for images
- FR41: WCAG 2.2 AA accessibility

**Epic 2: Deployment Accessibility & Cost Transparency** (9 FRs)
- FR8: One-click CloudFormation deployment
- FR9: Real-time stack event tracking
- FR10: Immediate deployment outputs
- FR12: Cost estimation validation
- FR21: Demo videos (5-10 min per scenario)
- FR22: Video captions and transcripts
- FR23: Screenshot gallery with annotations
- FR24: Partner-led tour contact form
- FR42: Text-to-speech support for guides

**Epic 3: Guided Scenario Experiences** (7 FRs)
- FR13: Demo walkthrough guides
- FR14: Expected outputs/behaviors documentation
- FR15: Sample queries and test data
- FR30: Synthetic realistic UK council data
- FR31: Sample data with ROI-enabling values
- FR32: Automated sample data generation templates
- FR27: Architecture diagrams in Mermaid

**Epic 4: Evidence Generation & Committee-Ready Artifacts** (6 FRs)
- FR16: "What You Experienced" reflection guide
- FR17: Session data capture
- FR18: Evidence Pack auto-population
- FR19: Evidence Pack PDF with ROI/risk/compliance/next-steps
- FR20: Persona-specific Evidence Pack templates
- FR54: Service-Specific Success Metrics

**Epic 5: Pathway Forward & Partner Ecosystem** (10 FRs)
- FR29: G-Cloud procurement guidance page
- FR33: Session event capture
- FR34: Analytics dashboard
- FR35: Analytics identify informed decision drivers
- FR36: Survey follow-up tracking
- FR49: LGA AI Hub listing
- FR50: LGA branding/co-promotion
- FR51: Monthly success reports
- FR52: Success metrics dashboard
- FR56: Post-deployment cost analysis tool

**Foundation (Cross-Cutting)** (27 FRs)
- FR1-3: Scenario management
- FR11: Automated cleanup
- FR25, FR28, FR29: Portal content/deployment guides
- FR37-40: Integration, extensibility, feedback
- FR44: Video transcripts
- FR45-48: GitHub repo structure
- FR53, FR55: Security and code org guidance

---

## Epic 1: Portal Foundation & Discovery

**Goal:** Help councils discover and understand scenarios relevant to their needs without overwhelming options
**User Value:** "I can find the right scenario for my problem in 2 minutes"
**FRs Covered:** FR4, FR5, FR6, FR7, FR26, FR43, FR41

### Story 1.1: Portal Foundation - Homepage, Navigation & Build Infrastructure

**As a** council digital services team member,
**I want** a clear, welcoming homepage that introduces NDX:Try and directs me to next steps,
**So that** I understand what this platform is and how to get started.

**Acceptance Criteria:**

**Given** I visit the portal homepage
**When** I load the page
**Then** I see:
- Clear headline: "Try AWS Before You Buy"
- Brief value prop (2-3 sentences): "Zero-cost evaluation of AWS services using realistic council scenarios"
- Trust indicators: "50+ councils evaluating", "15 minutes to first insight", "Zero commitment"
- Scenario preview grid showing 6 scenario cards
- Call-to-action button: "Find Your Scenario" (primary, blue)
- Alternative CTA: "Watch Instead" (secondary)

**And** the page loads in <2 seconds on typical council network (10 Mbps)

**And** the page passes WCAG 2.2 AA validation (automated + manual testing)

**And** navigation bar includes: Home, Scenarios, Get Started, Evidence Packs, Partners, Case Studies, FAQ, Accessibility, Contact

**And** portal structure is locked: exactly 10 pages (Home, Get Started, Scenarios Gallery, 6 Scenario Detail pages)

**And** build process uses Eleventy with X-GOV plugin and GOV.UK Frontend

**And** incremental builds enabled (only changed pages rebuild)

**And** build time monitoring in GitHub Actions (fails if >10 minutes total)

**And** GitHub Actions workflow automates build → deploy to GitHub Pages on every commit to main

**[DEVIL'S ADVOCATE ADDITION - ACCESSIBILITY OWNERSHIP & TESTING]**

**And** accessibility testing framework is set up:
- WAVE automated testing integrated into GitHub Actions (runs on every commit, fails on errors)
- Axe DevTools accessibility scanning enabled in CI/CD
- Accessibility checklist created and documented (used by all stories)
- Accessibility owner assigned (one dev on core team responsible for baseline + spot checks)
- Pre-launch gate: Independent accessibility audit by external specialist (hire if needed)
- All team members trained on basic WCAG 2.2 AA principles (color contrast, keyboard nav, screen reader basics)

**And** accessibility acceptance criteria template created:
- Every future story MUST include: "Passes WCAG 2.2 AA validation (automated + manual testing)"
- Every story MUST include: "Tested with keyboard-only navigation (tab through all interactive elements)"
- Every story MUST include: "Tested with screen reader (NVDA or VoiceOver)"
- Non-compliance blocks merge

**Prerequisites:** None (foundational story)

**Technical Notes:**
- Technology stack: Eleventy 11ty + X-GOV/eleventy-plugin-govuk-frontend + GOV.UK Frontend 5.13.0
- Hosting: GitHub Pages (static deployment)
- Content format: Markdown with YAML frontmatter
- Navigation via centralized navigation.yaml (single source of truth)
- Base URL: https://github.com/user/ndx-try-aws-scenarios → GitHub Pages auto-deploys to gh-pages branch
- All pages use base.njk layout with header/footer components
- Accessibility testing: WAVE (automated), axe DevTools (automated), keyboard navigation (manual), screen reader (manual)
- Accessibility tooling: GitHub Actions setup for WAVE API, axe-core integration, documentation link to WCAG 2.2 AA checklist

---

### Story 1.2: Scenario Selector Quiz - 3-Question Discovery Flow

**As a** council service manager or CTO,
**I want** to answer 3 quick questions and get personalized scenario recommendations,
**So that** I find the most relevant scenario for my problem without browsing all 6.

**Acceptance Criteria:**

**Given** I click "Find Your Scenario" on homepage
**When** I enter the Scenario Selector quiz
**Then** I see 3 sequential questions:
1. "What's your main challenge?" (radio buttons: AI/automation, IoT/smart city, analytics, compliance, contact center)
2. "How much time do you have?" (radio buttons: <15 min, 15-30 min, 30+ min / or complexity level: beginner, intermediate, advanced)
3. "Who's evaluating?" (radio buttons: CTO/Technical Lead, Service Manager, Developer, Finance/Procurement)

**And** quiz uses GOV.UK Frontend radio button component (accessible, keyboard navigable)

**And** quiz completes in <30 seconds with immediate results

**And** results page shows:
- "We recommend **Council Chatbot** because..." (1-3 scenarios ranked by relevance)
- Brief explanation: "Your selection suggests this scenario matches your needs"
- "Learn More" button (primary) → Links to scenario detail page
- "Browse All Scenarios" button (secondary) → Links to scenario gallery

**And** quiz logic is simple (no branching, just 3 questions → scoring matrix → ranking)

**And** quiz stores responses in session (if session tracking enabled)

**And** quiz page accessible to screen readers (ARIA labels, proper form structure)

**And** quiz works on mobile (responsive layout, touch targets ≥44px)

**[DEVIL'S ADVOCATE ADDITION - VALIDATION & RISK MITIGATION]**

**And** quiz recommendation accuracy is validated:
- Quiz tested with 5+ real councils before launch (user testing required)
- Recommendation accuracy target: 90%+ match (councils select the recommended scenario ≥90% of the time)
- Time to complete quiz: <90 seconds (measured with stopwatch during user testing)
- Quiz completion rate target: >80% (measured in Story 5.2 analytics)

**And** quiz is feature-flagged for canary launch:
- Quiz initially deployed to 10% of portal traffic (feature flag enabled)
- Monitored for: completion rate, recommendation accuracy, time-to-complete
- If any metric fails, Story 1.2b triggered: "Quiz Optimization" (simplify questions or expand algorithm)
- Full rollout after 7 days of successful canary metrics

**And** if quiz adoption remains <50% after rollout, trigger Story 1.2b for simplification

**Prerequisites:** Story 1.1 (Portal Foundation)

**Technical Notes:**
- Quiz logic: Weighted scoring based on 3 inputs → match to 6 scenarios
- Recommendation algorithm: Service Manager + <15min + AI → Council Chatbot (highest match)
- Quiz data stored in scenarios.yaml or dedicated quizzes.yaml
- No database queries, all logic in JavaScript or Eleventy filters
- No external form service needed (form submits to session, not external)
- Feature flag implementation: Use Launchdarkly or simple environment variable for 10% rollout
- Analytics tracking: Story 5.2 captures quiz_recommendation_accuracy metric

---

### Story 1.3: Scenario Gallery - Cards, Filtering, Metadata

**As a** council user,
**I want** to browse all 6 scenarios at a glance with clear metadata and filtering,
**So that** I can quickly find or compare scenarios without taking the quiz.

**Acceptance Criteria:**

**Given** I visit the Scenarios page
**When** I view the gallery
**Then** I see 6 scenario cards in a responsive grid (1 col mobile, 2 tablet, 3 desktop)

**And** each card shows:
- Scenario icon/avatar (representative of use case)
- Title (e.g., "Council Chatbot")
- 1-sentence description
- Difficulty badge (Beginner/Intermediate)
- Time estimate (e.g., "~15 min")
- "Explore" link (blue button)

**And** filtering options available:
- Filter by persona (CTO, Service Manager, Developer, Finance)
- Filter by difficulty (Beginner/Intermediate/Advanced)
- Filter by time estimate (<15 min, 15-30 min, 30+ min)

**And** clicking a card navigates to scenario detail page

**And** scenario metadata schema enforced (all scenarios use same structure):
```yaml
scenarios:
  - id: council-chatbot
    name: Council Chatbot (Bedrock)
    description: "Deploy a customer service chatbot using AWS Bedrock"
    difficulty: beginner
    timeEstimate: 15 minutes
    estimatedCost: "£0.50-2.00"
    maximumCost: "£5.00"
    personas: [Service Manager, CTO]
    tags: [ai, bedrock, customer-service]
    deployment_guide: /guides/council-chatbot-deployment.md
    demo_video: /videos/council-chatbot-demo.mp4
    architecture_diagram: /diagrams/council-chatbot-arch.mermaid
```

**And** page passes WCAG 2.2 AA validation (color not sole indicator, alt text on images)

**And** gallery responsive on all screen sizes (tested at 320px, 768px, 1024px, 1440px)

**[DEVIL'S ADVOCATE ADDITION - SCHEMA VALIDATION]**

**And** scenario metadata schema is enforced:
- JSON schema defined for scenarios.yaml (all fields required, data types validated)
- GitHub Actions check: scenarios.yaml validated against JSON schema on every commit
- Merge blocked if validation fails (clear error message: "Missing field: maximumCost in scenario council-chatbot")
- Error messages are actionable (not generic "validation error")
- Schema includes: id, name, description, difficulty, timeEstimate, estimatedCost, maximumCost, personas, tags, deployment_guide, demo_video, architecture_diagram

**And** scenario validation testing exists:
- Test that valid scenarios.yaml passes validation
- Test that invalid scenarios (missing fields) are rejected
- Test that type mismatches (string instead of number) are caught

**Prerequisites:** Story 1.1 (Portal Foundation), Story 1.2 (Quiz)

**Technical Notes:**
- Gallery implemented as Nunjucks macro (reusable component)
- Filtering via vanilla JavaScript (no framework needed)
- Scenario data sourced from scenarios.yaml loaded via Eleventy data cascade
- Search/filter logic can expand to text search of descriptions in Phase 2
- Schema validation: Use JSON Schema (standard format, language-agnostic)
- Implementation: GitHub Actions workflow with `ajv-cli` or similar for schema validation

---

### Story 1.4: Quick-Start Guide - "Your 15-Minute Journey"

**As a** council user who wants to get started quickly,
**I want** a step-by-step visual guide showing what to expect in my first 15 minutes,
**So that** I understand the journey before starting.

**Acceptance Criteria:**

**Given** I visit the "Get Started" page
**When** I scroll through the guide
**Then** I see 6 visual steps:
1. "Find Your Scenario" (1 min) - screenshot of Scenario Selector quiz
2. "Read the Overview" (2 min) - screenshot of scenario detail page
3. "Deploy to Innovation Sandbox" (1 min) - screenshot of "Deploy Now" button
4. "Wait for Deployment" (~12 min) - screenshot of real-time stack events
5. "Try It Out" (5-10 min) - screenshot of "Try This First" walkthrough
6. "Capture Your Thoughts" (2 min) - screenshot of "What You Experienced" form

**And** each step includes:
- Visual screenshot with annotations
- Brief text (1-2 sentences) explaining what happens
- Expected time estimate
- "What to look for" guidance

**And** page includes:
- "Ready? Start Here" button (primary, blue) → Links to homepage/quiz
- "Watch Demo Instead" button (secondary) → Links to video section
- "FAQ" link for common questions

**And** guide works on mobile (screenshots responsive, readable on small screens)

**And** page passes WCAG 2.2 AA validation

**Prerequisites:** Story 1.1 (Portal Foundation)

**Technical Notes:**
- Screenshots obtained from actual portal after UI is built (Story 1.1)
- Annotations added via CSS overlays (no image editing needed)
- Could use Mermaid diagram to visualize journey stages as alternative

---

## Epic 2: Deployment Accessibility & Cost Transparency

**Goal:** Remove barriers to deployment by providing cost certainty and zero-deployment alternatives
**User Value:** "I can evaluate AWS without needing CloudFormation expertise, and I know the costs upfront"
**FRs Covered:** FR8, FR9, FR10, FR12, FR21, FR22, FR23, FR24, FR42

### Story 2.1: One-Click CloudFormation Deployment - Pre-Configured Parameters

**As a** council CTO or technical team member,
**I want** to deploy a scenario CloudFormation template with pre-configured parameters and zero manual steps,
**So that** I don't need to understand CloudFormation syntax or wrestle with parameters.

**Acceptance Criteria:**

**Given** I'm on a scenario detail page
**When** I click "Deploy to Innovation Sandbox"
**Then** I'm redirected to AWS CloudFormation Designer with:
- Template pre-loaded (via S3 or GitHub raw URL)
- All parameters pre-filled with sensible defaults:
  - Region: us-west-2
  - ScenarioTag: council-chatbot (for cost tracking)
  - GitHash: ABC123 (version tracking)
  - MaxCost: £5.00 (enforced limit)
- No editable fields except "Stack Name" (which is pre-filled with scenario-id + timestamp)

**And** deployment instructions show:
- "Click Create Stack below"
- "Wait ~15 minutes for deployment"
- "Check your email for access details"

**And** stack resources include CloudFormation-managed tags:
- scenario: {scenario-id}
- git-hash: {git-commit-hash}
- git-tag: {git-release-tag}
- max-cost: {maximum-cost-guarantee}
- auto-cleanup: true (triggers Lambda cleanup after 90 minutes)

**And** deployment succeeds 95%+ of the time (first-time success rate)

**And** deployment fails gracefully with actionable error message (not technical CloudFormation error)

**Prerequisites:** Story 1.1 (Portal Foundation), FR1-3 (CloudFormation templates exist)

**Technical Notes:**
- CloudFormation templates hosted in GitHub /cloudformation/ folder
- Portal links to AWS CloudFormation Designer: `https://console.aws.amazon.com/cloudformation/designer/home?region=us-west-2&templateURL={s3-or-github-url}`
- Parameters passed via URL (CloudFormation Designer supports template URL with parameters)
- Stack Name: `{scenario-id}-{timestamp}` format for uniqueness
- Cleanup: Lambda scheduled event (EventBridge rule) terminates stack after 90 minutes
- Acceptance: No manual parameter editing required for successful deployment

---

### Story 2.2: Real-Time Deployment Progress Tracking - CloudFormation Events

**As a** council user deploying a scenario,
**I want** to see real-time progress of my CloudFormation deployment,
**So that** I know it's working and don't give up thinking it's stuck.

**Acceptance Criteria:**

**Given** I've initiated CloudFormation deployment
**When** I wait for the stack to create
**Then** the AWS CloudFormation console shows real-time stack events:
- Stack creation started
- Resource creation in progress (Lambda, S3, DynamoDB, etc.)
- Resource creation successful indicators
- Stack creation complete

**And** events are displayed in real-time (no page refresh needed, auto-update)

**And** deployment status shows:
- Green checkmark when stack creation succeeds
- Red X and error message if deployment fails
- "Access Your Scenario" button appears when complete (links to endpoint or dashboard)

**And** if deployment fails, error message is in plain English (not CloudFormation technical jargon):
- Example: "S3 bucket name already exists. Please retry with a different stack name." (not "S3 BucketAlreadyOwnedByYou")

**And** user can view full CloudFormation events in AWS Console if needed (link provided)

**Prerequisites:** Story 2.1 (One-Click Deployment)

**Technical Notes:**
- Portal could display events via AWS Console iframe (embedded within portal)
- Or link to AWS Console with appropriate region/stack filters
- Events refresh every 5-10 seconds (or real-time via WebSocket if portal has backend)
- Error handling: Map common CloudFormation errors to user-friendly messages

---

### Story 2.3: Deployment Cost Estimation & Validation

**As a** council Finance or Procurement officer,
**I want** to see the estimated cost before deployment and confirm I'm within budget,
**So that** I don't accidentally run up unexpected AWS charges.

**Acceptance Criteria:**

**Given** I'm viewing a scenario detail page
**When** I scroll to "Deploy This Scenario" section
**Then** I see cost transparency box:
```
Estimated Cost: £0.50 - £2.00
(based on ~15 minute runtime + sample data processing)

Maximum Cost Guarantee: £5.00
(We've capped CloudFormation template cost; if actual costs exceed, we'll work with you)

Cost Breakdown:
- Bedrock API calls: ~£0.50 (depends on chatbot interactions)
- Lambda execution: <£0.01
- DynamoDB (small table): <£0.01
- VPC, S3, CloudTrail: <£0.01

How Costs Work:
- Costs accrue during the ~15 minute evaluation window
- Scenario includes automated cleanup (Lambda deletes resources after 90 min)
- No ongoing charges after cleanup
```

**And** "Deploy Now" button is disabled if user hasn't acknowledged cost cap

**And** before clicking "Deploy", user sees confirmation:
"I understand this scenario may cost up to £5.00 and will be automatically cleaned up after 90 minutes. [✓ I accept] [Cancel]"

**And** CloudFormation template cost estimate is validated pre-deployment:
- Portal calls AWS CloudFormation EstimateCost API (if available) or manual validation
- Estimated cost must be within ±15% of documented estimate
- If estimate exceeds ±15%, deployment blocked with message: "Cost estimate has changed; please review before proceeding"

**And** after deployment completes, user receives email with:
- Actual costs incurred (from AWS Cost Explorer or CloudFormation tags)
- Estimated vs actual comparison
- Confirmation of 90-minute cleanup schedule

**Prerequisites:** Story 2.1 (One-Click Deployment)

**Technical Notes:**
- Cost data sourced from CloudFormation template comments and manual testing
- Email sent via SES or third-party service (not implemented in MVP, manual email ok)
- Cost tracking via CloudFormation tags: `scenario: council-chatbot` → User can query AWS Cost Explorer

---

### Story 2.4: Demo Videos - 5-10 Minute Walkthroughs (Zero-Deployment Path)

**As a** council Service Manager or non-technical user,
**I want** to watch a 5-10 minute demo video showing what each scenario does,
**So that** I can evaluate AWS without needing to deploy CloudFormation or understand technical details.

**Acceptance Criteria:**

**Given** I'm viewing a scenario detail page
**When** I scroll to "Not Ready to Deploy? Watch Instead" section
**Then** I see:
- Embedded video player (YouTube or similar)
- 5-10 minute video showing:
  1. Scenario introduction ("What is Council Chatbot?")
  2. Real deployment walkthrough (showing CloudFormation stack creation in fast-motion)
  3. "Try this" demo (actual interaction: asking chatbot a question, seeing response)
  4. Walkthrough of results dashboard/outputs
  5. "What You Experienced" reflection (narrator asks key insight questions)
  6. "What's Next" guidance (how to procure, what implementation looks like)

**And** video includes:
- Clear narration (explained as if speaker is guiding a council team)
- UK local government context (council names, council problems, council jargon)
- Real chatbot responses (not fake/staged demonstrations)
- Realistic timeline (shows actual wait times, doesn't fast-forward confusingly)

**And** video has:
- Captions (closed captions, English, accurate)
- Transcript available as text below video
- High-quality audio (clear narration, no background noise)

**And** video loads quickly on typical council bandwidth (10 Mbps)

**And** video is accessible:
- Captions for all speech
- Audio descriptions for key visual moments (optional in MVP, nice-to-have)
- Transcript downloadable as PDF

**Prerequisites:** Story 1.1 (Portal Foundation), Story 2.1 (One-Click Deployment) - video shows deployment process

**Technical Notes:**
- Videos recorded after MVP portal is functional (use real portal for authenticity)
- Recorded as screen capture + narration (using tools like Loom, ScreenFlow, OBS)
- Hosting: YouTube (free, accessible from UK), embedded via iframe
- Captions: Auto-generated via YouTube (English) + manual review for accuracy
- Transcripts: Exported from YouTube or manually created
- One video per scenario (6 videos total)

---

### Story 2.5: Screenshot Gallery - Annotated Visual Guide (Zero-Deployment Path)

**As a** council Finance officer or user with limited time,
**I want** to see annotated screenshots showing key results from each scenario,
**So that** I understand what the scenario demonstrates without watching a full video or deploying.

**Acceptance Criteria:**

**Given** I'm viewing a scenario detail page
**When** I scroll to "Screenshot Walkthrough" section
**Then** I see 5-7 annotated screenshots showing:
1. "Deployment Starting" - CloudFormation stack creation screen
2. "Deployment Complete" - Success notification with access endpoint
3. "Key Interaction" - Example of the "wow moment" (chatbot response, AI extraction, dashboard update)
4. "Results Dashboard" - Summary of scenario outcomes
5. "Cost Summary" - Actual costs incurred
6. "What You Experienced Form" - Reflection guide questions
7. "Evidence Pack" - Sample output of committee-ready PDF

**And** each screenshot includes:
- Red box highlighting key element
- Numbered callout (1, 2, 3...)
- Text annotation explaining "what to look for"
- Example: "✓ Chatbot responded in <2 seconds to customer query about council tax"

**And** screenshots are responsive (readable on mobile, tablet, desktop)

**And** screenshots are auto-generated from actual portal (not manually staged)

**Prerequisites:** Story 1.1 (Portal Foundation), other Epic 2 stories

**Technical Notes:**
- Screenshots captured using automated testing framework (Playwright, Puppeteer) against live portal
- Annotations added via SVG overlay (CSS/HTML, not image editing)
- Can be regenerated automatically if portal UI changes
- Stored as static images + SVG annotations in /assets/screenshots/

---

### Story 2.6: Partner-Led Guided Tour - Contact Form

**As a** council user who prefers hands-on guidance,
**I want** to request a guided evaluation tour led by an implementation partner,
**So that** I can evaluate AWS with expert guidance without deploying myself.

**Acceptance Criteria:**

**Given** I'm viewing a scenario detail page
**When** I scroll to "Need Hands-On Guidance?" section
**Then** I see:
- "Schedule a Partner Tour" button (secondary, gray)
- Brief explanation: "Implementation partners can guide your team through evaluation in a live session (30-60 min)"

**And** clicking the button shows a form:
- Council name (text input)
- Contact name (text input)
- Email (email input)
- Phone (tel input, optional)
- Scenario interest (dropdown: "Council Chatbot", "Planning AI", "FOI Redaction", etc.)
- Available times (date picker + time slots)
- Additional context (textarea, optional)

**And** form submits to GOV.UK Forms Service (or email capture, depending on implementation)

**And** confirmation message: "Thanks! We'll connect you with a partner soon."

**And** form includes:
- Required field indicators (*)
- Help text: "We'll match you with a vetted implementation partner in your region"
- GDPR privacy notice: "We'll use your contact info only to connect you with partners"

**Prerequisites:** Story 1.1 (Portal Foundation)

**Technical Notes:**
- Form hosted on GOV.UK Forms Service (external, managed service)
- Portal only links to form (no form handling in portal)
- Form data stored in GOV.UK Forms (GDPR compliant)
- Partner follow-up is manual (not automated in MVP)
- Could be enhanced in Phase 2 with automated CRM integration

---

## Epic 3: Guided Scenario Experiences

**Goal:** Deliver "wow moments" within 15 minutes by guiding users to key interactions with realistic council data
**User Value:** "I deployed a scenario and experienced AWS actually working with council data I recognize"
**FRs Covered:** FR13, FR14, FR15, FR30, FR31, FR32, FR27

**[DEVIL'S ADVOCATE ADDITION - EXTERNAL DEPENDENCY CLARIFICATION]**

**Critical Prerequisite for Epic 3:** All 6 CloudFormation templates must be tested and functional BEFORE Stories 3.2-3.7 begin. CloudFormation template development is a SEPARATE workstream (not part of this epic breakdown). Consider parallel development:
- **Parallel Workstream A:** CloudFormation template creation + AWS testing (owned by AWS/infrastructure team)
- **Parallel Workstream B:** Epic 3 portal integration + walkthroughs (owned by portal development team)

Stories 3.2-3.7 assume templates exist and are production-ready. If CloudFormation development lags, Epic 3 stories must wait.

### Story 3.1: Sample Data Framework - Realistic UK Council Data Generation

**As a** scenario developer,
**I want** a standardized framework for generating realistic UK council sample data,
**So that** all scenarios use consistent, recognizable, and ROI-enabling data without manual copy-paste.

**Acceptance Criteria:**

**Given** I'm developing a new scenario
**When** I need sample data
**Then** I use the sample data generation framework:

```python
# Example: generate_council_data.py
from council_data_generator import CouncilDataGenerator

generator = CouncilDataGenerator(
    region="London",
    council_name="Example Council",
    data_types=["planning_applications", "parking_occupancy", "contact_center_calls"]
)

data = generator.generate()
# Returns:
# {
#   "planning_applications": [
#     {
#       "id": "PLAN-2025-001234",
#       "description": "Residential extension application for...",
#       "submission_date": "2025-11-15",
#       "status": "Under Review"
#     },
#     ...
#   ],
#   "parking_occupancy": [
#     {"location": "Town Hall Car Park", "available_spaces": 45, "total_spaces": 150},
#     ...
#   ],
#   "contact_center_calls": [
#     {"caller_issue": "council tax enquiry", "duration_seconds": 180, "resolved": true},
#     ...
#   ]
# }
```

**And** data generation templates include:
- Planning applications (realistic UK format, requirements language, processing times)
- Parking occupancy (realistic council parking data, revenue implications)
- Contact center calls (realistic council service requests)
- FOI requests (realistic document types, redaction needs)
- Text-to-speech scenarios (council service announcements, resident-facing content)

**And** all generated data:
- References realistic UK council names (but synthetic, not real councils)
- Includes authentic data formats (actual planning application templates, real parking systems terminology)
- Enables ROI projections (e.g., parking revenue calculations, application processing time savings)

**And** data generation is:
- Deterministic (same seed produces same data)
- Parameterizable (can customize council name, region, data volume)
- Automated (single command generates all data)
- Version-controlled (framework and templates in GitHub)

**And** sample data:
- Refreshed quarterly (no stale council examples)
- Documented in /docs/sample-data-guide.md
- Testable (data schema validated before scenario deployment)

**Prerequisites:** None (foundational, early in Epic 3)

**Technical Notes:**
- Language: Python (or Node.js, depending on team preference)
- Stored in /sample-data/ or /data/ folder
- Generated files stored in /sample-data/outputs/ (gitignored)
- Used by CloudFormation templates (templates reference S3 path to sample data)
- Could be enhanced in Phase 2 to allow councils to "bring your own data"

---

### Story 3.2-3.7: Guided Scenario Walkthroughs (One per scenario)

**Story 3.2: Council Chatbot - "Ask the Chatbot" Walkthrough**

**As a** council user who's deployed the Council Chatbot scenario,
**I want** a step-by-step guide showing what to do with the chatbot,
**So that** I experience the "wow moment" of AI actually working with realistic council questions.

**Acceptance Criteria:**

**Given** my CloudFormation deployment is complete
**When** I scroll to "Try It Out - 5 Minute Walkthrough" section
**Then** I see:

**Step 1: Access the Chatbot**
- "Open the Chatbot Interface" (link to deployed endpoint)
- Expected: Web interface with text input box and chat history

**Step 2: Try This First Question**
- "Ask the chatbot: 'What are the opening hours of the town hall?'"
- Expected output: "The Town Hall is open Monday-Friday 9am-5pm, Saturday 10am-2pm"
- What to look for: ✓ Chatbot responded quickly (<2 sec), ✓ Answer is accurate and conversational

**Step 3: Try Your Own Question**
- "Now try asking a real council question your residents ask (e.g., 'How do I report a pothole?')"
- Expected: Chatbot responds with relevant council service information
- What to look for: ✓ Does it understand your question?, ✓ Is the response helpful?

**Step 4: Notice the Details**
- Chatbot uses Bedrock (AWS generative AI) under the hood
- Questions/answers stored in DynamoDB for audit trail
- Response time <2 seconds even for complex questions
- Chatbot can be customized per council service

**Step 5: Reflect**
- "Notice how the AI understood your question without being 'taught' all possible phrasings?"
- "This is the power of generative AI - it learns from patterns, not rules"
- "What You Experienced: Could this work for your service?"

**And** walkthrough includes:
- Clear success indicators (green checkmarks show what success looks like)
- Realistic expected outputs (actual chatbot responses shown, not staged)
- Council context (questions are UK local government specific)
- Time estimate: ~5 minutes

**And** if chatbot doesn't respond as expected:
- Troubleshooting section with common issues:
  - "Chatbot is slow": Check AWS CloudFormation logs, may be initializing
  - "Error message": CloudFormation deployment may have failed; check CloudFormation console
- Link to support: Contact us or check FAQ

**Prerequisites:** Story 2.1 (One-Click Deployment), Story 3.1 (Sample Data Framework)

**Technical Notes:**
- Walkthrough content lives in scenario detail page (council-chatbot.md)
- Sample questions pre-populated in chatbot UI (for easy copy-paste)
- Chatbot endpoint URL auto-populated in walkthrough (from CloudFormation stack outputs)
- Sample data includes realistic council Q&A patterns (planning, waste, council tax, etc.)

---

**Story 3.3: Planning Application AI - "Upload and Extract" Walkthrough**

**As a** council Planning officer evaluating AI document processing,
**I want** to upload a sample planning application and see AI automatically extract information,
**So that** I understand how AI could reduce manual data entry work.

**Acceptance Criteria:**

**Given** my Planning Application AI scenario is deployed
**When** I scroll to "Try It Out - 5 Minute Walkthrough"
**Then** I see:

**Step 1: Access the Application**
- "Open the Document Processing Interface" (link to deployed endpoint)
- Expected: Web form with "Upload Document" button and results area

**Step 2: Download Sample Application**
- "Download sample planning application (PDF)" (pre-provided sample)
- Expected: Realistic UK planning application (8-10 page PDF)

**Step 3: Upload & Process**
- "Upload the sample application and click 'Extract Information'"
- Expected: Page loads showing "Processing..." (takes ~30 seconds)
- Output: Automatically extracted data in structured format:
  - Applicant name
  - Property address
  - Application type (residential, commercial, etc.)
  - Proposed works description
  - Planning officer notes

**Step 4: Review the Extraction**
- "Review extracted data. Notice how AI identified key fields without being taught UK planning format"
- What to look for: ✓ Accuracy of extracted data, ✓ Time saved vs manual entry, ✓ Fields AI understood

**Step 5: Understand the ROI**
- "If your team processes 200 applications/year at 45 minutes each (150 hours), AI could save 75% manual time"
- "ROI calculation: 150 hours × £25/hour = £3,750 saved annually"

**And** walkthrough includes:
- Sample planning application pre-provided (no need to find your own)
- Expected extraction accuracy: 90%+ on standard fields
- Handling exceptions: "What if AI missed something?" - shows manual review option
- Council context: Uses actual UK planning application format

**Prerequisites:** Story 2.1 (One-Click Deployment), Story 3.1 (Sample Data Framework)

**Technical Notes:**
- Uses Textract (document extraction) + Comprehend (text analysis) + Bedrock (intelligence)
- Sample application from realistic UK council planning archive (anonymized)
- Extraction takes 20-40 seconds (realistic, not instant)
- Output in JSON format (structured data councils can use)

---

**Stories 3.4-3.7: Similar structure for FOI Redaction, Smart Car Park IoT, Text-to-Speech, QuickSight Dashboard**

(Following same pattern: Sample data → Walkthrough → "Try this" action → Observe wow moment → Understand ROI)

---

## Epic 4: Evidence Generation & Committee-Ready Artifacts

**Goal:** Transform demo experience into structured business case that councils can present to committees
**User Value:** "I have a committee-ready PDF that justifies my procurement decision"
**FRs Covered:** FR16, FR17, FR18, FR19, FR20, FR54

### Story 4.1: Evidence Pack Template - Single Template with Persona Conditionals

**As a** platform team,
**I want** one Evidence Pack HTML template that can render persona-specific versions (CTO, Service Manager, Finance, Developer),
**So that** we maintain consistency while tailoring language and focus to each audience.

**Acceptance Criteria:**

**Given** I'm designing the Evidence Pack generator
**When** I create the Evidence Pack template
**Then** I define a single HTML template with conditional sections:

```html
<!-- Single Template with Persona Conditionals -->
<div id="evidence-pack">
  <h1>{{ scenario.name }} - Evaluation Evidence Pack</h1>

  <!-- CTO-Specific Section -->
  {% if persona == 'cto' %}
    <section id="architecture">
      <h2>Architecture & Security Assessment</h2>
      <p>AWS Services Used: {{ scenario.aws_services }}</p>
      <diagram>{{ scenario.architecture_diagram }}</diagram>
      <p>Security Posture: {{scenario.security_notes}}</p>
    </section>
  {% endif %}

  <!-- Service Manager-Specific Section -->
  {% if persona == 'service-manager' %}
    <section id="resident-impact">
      <h2>Resident Impact & Service Improvement</h2>
      <p>{{scenario.resident_benefit_story}}</p>
      <p>ROI Projection: {{scenario.roi_projection}}</p>
    </section>
  {% endif %}

  <!-- Finance-Specific Section -->
  {% if persona == 'finance' %}
    <section id="cost-analysis">
      <h2>Cost Analysis & Budget Impact</h2>
      <p>Estimated Annual Cost: {{session_data.annual_cost}}</p>
      <p>ROI Payback Period: {{scenario.roi_payback}}</p>
      <p>Worst-Case Cost Scenario: {{scenario.maximum_cost}}</p>
    </section>
  {% endif %}

  <!-- Developer-Specific Section -->
  {% if persona == 'developer' %}
    <section id="technical-implementation">
      <h2>Technical Implementation Details</h2>
      <p>SDK Support: {{scenario.sdk_languages}}</p>
      <code>{{scenario.sample_code}}</code>
    </section>
  {% endif %}

  <!-- Shared Sections (All Personas) -->
  <section id="evaluation-summary">
    <h2>What You Experienced</h2>
    <p>"{{ session_data.what_surprised }}"</p>
    <p>"Would you implement this?" {{ session_data.would_implement }}</p>
  </section>

  <section id="next-steps">
    <h2>What's Next?</h2>
    <p>{{ scenario.next_steps_guidance }}</p>
  </section>
</div>
```

**And** template uses:
- Single HTML file (not 4 separate templates)
- Nunjucks conditionals for persona logic (`{% if persona == 'x' %}`)
- CSS `@media print` for persona-specific styling (e.g., hide certain colors for B&W printing)
- CSS classes for persona-specific formatting without duplicating HTML

**And** Evidence Pack rendering:
- Build-time generation via Puppeteer (GitHub Actions)
- Single template → 4 PDF outputs (one per persona)
- PDFs pre-generated, not generated on-demand
- All 4 PDFs hosted as static assets on GitHub Pages

**Prerequisites:** None (foundational for Epic 4)

**Technical Notes:**
- Template language: Nunjucks (Eleventy default)
- Styling: CSS with BEM naming + GOV.UK Frontend classes
- PDF generation: Puppeteer (headless Chromium) in GitHub Actions
- Output: /assets/pdfs/evidence-pack-{scenario-id}-{persona}.pdf
- Acceptance: Persona-specific PDF renders correctly, prints well on standard A4 paper

---

### Story 4.2: "What You Experienced" Reflection Guide Form

**As a** council user who's completed scenario evaluation,
**I want** a structured form to capture my key insights and decisions,
**So that** these insights can auto-populate the Evidence Pack.

**Acceptance Criteria:**

**Given** I've finished the scenario walkthrough
**When** I scroll to "Share Your Feedback" section
**Then** I see a form with fields:

**Field 1: "What surprised you about this service?"** (textarea)
- Help text: "E.g., 'How quickly the AI understood our council-specific questions' or 'The cost was lower than expected'"
- Required: Yes
- Used in: Evidence Pack summary section

**Field 2: "Would you implement this in your council?"** (radio buttons)
- Options: Yes / Maybe / No
- Required: Yes
- Used in: Evidence Pack decision summary

**Field 3: "What would you want in production?"** (textarea)
- Help text: "E.g., 'Custom training on council data' or 'Integration with our existing systems'"
- Required: No
- Used in: Evidence Pack implementation roadmap

**Field 4: "What concerns do you have?"** (textarea)
- Help text: "E.g., 'Data security' or 'Staff retraining needed' or 'Budget limitations'"
- Required: No
- Used in: Evidence Pack risk assessment

**Field 5: "How likely are you to proceed with this service?"** (rating scale 1-5)
- 1 = Definitely not
- 5 = Definitely yes
- Required: Yes
- Used in: Analytics (informed decision rate)

**Field 6: "Your council name"** (text input)
- Help text: "Used to track outcomes (optional, anonymous is ok)"
- Required: No
- Used in: Survey follow-up tracking

**Field 7: "Your email"** (email input)
- Help text: "We'll send your Evidence Pack here and may follow up on outcomes (optional)"
- Required: No
- Used in: Evidence Pack delivery + survey follow-up

**And** form includes:
- Clear labels and help text
- Required field indicators (*)
- Client-side validation (email format, required fields)
- Accessible (WCAG 2.2 AA, labels associated with inputs, good focus indicators)
- Mobile-friendly (responsive layout, accessible on all screen sizes)

**And** form submission:
- Stores responses in session data (if session tracking enabled)
- Auto-populates Evidence Pack with responses
- Sends confirmation email: "Your Evidence Pack is ready to download" (if email provided)
- Shows link to download Evidence Pack (for all personas: CTO, Service Manager, Finance, Developer)

**[DEVIL'S ADVOCATE ADDITION - ADOPTION RISK MITIGATION]**

**And** form completion metrics are tracked:
- Form completion rate target: 60%+ (measured in Story 5.2 analytics, tracked as "Evidence Pack Generated" event)
- If completion rate falls below 60% after launch, trigger Story 4.5: "Evidence Pack Optimization" (simplify form or improve UX)
- Form designed to degrade gracefully: Portal works with 0 responses (Evidence Pack still generates with defaults), improves with user input

**And** form completion adoption path:
- MVP targets: Completion from users who deployed scenarios (60%+)
- Post-launch optimization: If adoption stalls, add quick-form option (1-3 fields instead of 7)
- Escalation: If <40% after optimization, consider auto-generation from scenario metadata (no user input needed)

**Prerequisites:** Story 1.1 (Portal Foundation), Story 4.1 (Evidence Pack Template)

**Technical Notes:**
- Form implemented using GOV.UK Frontend form components (text input, textarea, radio, select)
- Form submission: POST to analytics endpoint or session storage
- Responses stored securely (no personal data in logs, GDPR compliant)
- Email delivery: Via SES or third-party service (not critical for MVP)

---

### Story 4.3: Evidence Pack PDF Generation & Auto-Population

**As a** council user,
**I want** to generate a committee-ready PDF Evidence Pack that auto-populates with my evaluation data,
**So that** I can present my findings to leadership without extra work.

**Acceptance Criteria:**

**Given** I've completed the "What You Experienced" form
**When** I click "Generate Evidence Pack"
**Then** the system:
1. Collects session data (evaluation responses, scenario info, persona)
2. Selects Evidence Pack template (single template with persona conditionals)
3. Generates 4 persona-specific PDFs (CTO, Service Manager, Finance, Developer)
4. Delivers the persona-appropriate PDF to the user

**And** Evidence Pack PDF includes:
- **Cover page:** Scenario name, council name (if provided), evaluation date
- **Executive Summary:** "What surprised you" + "Would you implement?" answer
- **Evaluation Details:**
  - Persona-specific sections (Architecture for CTO, Resident Impact for Service Manager, etc.)
  - Architecture diagram (Mermaid, rendered in PDF)
  - Sample data used in evaluation
  - Actual costs incurred (if available)
- **What You Experienced:** Form responses (quoted)
- **Risk Assessment:** Concerns identified + mitigation strategies
- **ROI Projection:** Scenario-specific ROI calculation (persona-appropriate)
- **Next Steps:** Implementation pathway, partner recommendations, G-Cloud guidance
- **Appendices:**
  - AWS service descriptions
  - Sample code (developer version only)
  - Links to further resources

**And** PDF is:
- Professional-looking (uses GOV.UK Frontend styling, prints well)
- Printer-friendly (readable in B&W, pages fit on A4 paper)
- Accessible (text-selectable, not image-based, screen reader compatible)
- Committee-appropriate (tone is formal, language is clear, no jargon without explanation)

**And** PDF generation:
- Completes within 5 seconds
- Delivered as download (browser download, or email if email provided)
- File naming: `evidence-pack-{scenario-id}-{persona}-{date}.pdf`
- Multiple downloads supported (user can download all 4 persona versions if needed)

**Prerequisites:** Story 4.1 (Template), Story 4.2 (Reflection Form)

**Technical Notes:**
- PDF generation: Puppeteer (headless Chromium) running in browser or GitHub Actions
- If browser-based: Use html2pdf or jsPDF library (client-side generation)
- If server-based: Use Puppeteer via AWS Lambda or simple Node backend
- Recommendation: Build-time generation during GitHub Actions build (pre-generate all Evidence Pack variants)
- Or: On-demand generation via simple API endpoint (not critical for MVP)

---

### Story 4.4: Service-Specific Success Metrics & ROI Guidance

**As a** council Service Manager,
**I want** to see how success metrics apply to my specific service area (Planning, Waste, Housing, etc.),
**So that** I can understand the ROI in terms that matter to my service.

**Acceptance Criteria:**

**Given** I'm evaluating a scenario
**When** I view the Evidence Pack
**Then** I see service-specific success metrics:

**Example 1: Planning Application AI**
- Success Metric: "Processing time reduction"
- Current state: "200 applications/year, 45 min processing = 150 hours/year"
- Projected ROI: "75% time savings = 112.5 hours freed per year"
- Cost benefit: "112.5 hours × £25/hour = £2,812/year"
- Committee language: "Implementing AI document processing frees up 112 hours annually, reducing resident wait time from 10 days to 3 days"

**Example 2: Smart Car Park IoT**
- Success Metric: "Parking revenue optimization"
- Current state: "60% average occupancy, £150K annual revenue, ~20 spaces wasted daily"
- Projected ROI: "Increase occupancy to 85% through real-time guidance = £30K additional revenue"
- Committee language: "Real-time occupancy data enables dynamic pricing, increasing council parking revenue by £30K annually while improving resident parking experience"

**Example 3: Council Chatbot (Service Manager perspective)**
- Success Metric: "Contact center call volume reduction"
- Current state: "5,000 calls/month, ~30% about routine inquiries (1,500 calls)"
- Projected ROI: "AI chatbot handles 80% of routine inquiries = 1,200 fewer calls/month"
- Cost benefit: "1,200 calls × £5/call (staff cost) = £6,000/month = £72K/year"
- Committee language: "AI chatbot reduces inquiry handling cost by £72K annually while improving 24/7 citizen access"

**And** service-specific guidance lives in scenario detail page:
- Under "Why This Scenario" section
- Persona: Service Manager
- Format: "Service Area: [Service Name] | Success Metric: [Metric] | Current: [Baseline] | Potential: [Projection]"

**And** Evidence Pack auto-populates with service-specific metrics from session data

**[DEVIL'S ADVOCATE ADDITION - ADOPTION RISK MITIGATION]**

**And** service-specific metrics adoption is tracked:
- Service Manager engagement metric: "% of Evidence Packs that include service-specific ROI guidance clicked" (tracked in Story 5.2)
- Target: 50%+ of Service Manager personas view service metrics in Evidence Pack
- If adoption <50%: Escalate to Story 5.3 "ROI Messaging Optimization" (test simpler language or more compelling examples)
- Risk: ROI metrics may be too complex or council baseline data may be unavailable (require manual input)

**And** metrics validation includes:
- Baseline assumptions documented (cost per call, processing time, etc.)
- Metrics sourced from sample data framework (Story 3.1) or from council-provided inputs
- All ROI projections marked as "Illustrative" (not guarantees, dependent on council implementation)

**Prerequisites:** Story 4.2 (Reflection Form), Story 3.1 (Sample Data Framework)

**Technical Notes:**
- Success metrics defined per scenario in scenarios.yaml:
  ```yaml
  success_metrics:
    planning_ai:
      metric: "Processing time reduction"
      baseline: "45 min per application"
      potential: "11 min per application (75% reduction)"
      business_impact: "£2,812/year for 200 applications"
  ```
- Data sources: Sample data includes realistic volumes for ROI calculations
- Evidence Pack template includes conditional sections for each service area

---

## Epic 5: Pathway Forward & Partner Ecosystem

**Goal:** Connect evaluation to procurement and implementation with clear next-step guidance
**User Value:** "I know exactly what to do next: procure via G-Cloud, engage a partner, or formally reject with rationale"
**FRs Covered:** FR29, FR33, FR34, FR35, FR36, FR49, FR50, FR51, FR52, FR56

### Story 5.1: "What's Next" Guidance Pages - Per-Scenario Pathways

**As a** council CTO or Procurement officer,
**I want** clear guidance on what to do after evaluating a scenario,
**So that** I know the concrete next steps to procurement and implementation.

**Acceptance Criteria:**

**Given** I've completed scenario evaluation and Evidence Pack
**When** I scroll to "What's Next?" section at bottom of scenario page
**Then** I see structured guidance:

**Section 1: Your Decision Options**
- ✅ **Proceed with Procurement**
  - Recommended if: "You're confident this service solves your problem"
  - Next step: "Start G-Cloud procurement process" (button → G-Cloud framework page)
  - Timeline: "G-Cloud procurement takes 4-8 weeks"
  - Partners available: "Implementation partners below can accelerate deployment"

- ⏸️ **Need Deeper Evaluation**
  - Recommended if: "You need technical validation or larger-scale POC"
  - Next step: "Contact an implementation partner for extended trial" (button → partner form)
  - Timeline: "Extended POC takes 4-12 weeks"
  - What this includes: "Custom data integration, pilot user testing, ROI validation"

- ❌ **Formally Reject**
  - Recommended if: "This service isn't right for your council at this time"
  - Next step: "Document your decision (template provided)" (button → decision template)
  - Why this matters: "Documented rejection helps you show due diligence in council decisions"
  - Template includes: "Reasons for rejection, alternatives considered, decision date"

**Section 2: Implementation Partners**
- List of 2-3 vetted implementation partners (per region or general)
- Each partner includes:
  - Partner name + logo
  - Specialization (e.g., "AWS Migration", "AI/ML Implementation")
  - Services offered (e.g., "Architecture review, Production deployment, Staff training")
  - Contact: "Get in touch" button → partner contact form

**Section 3: G-Cloud Procurement**
- "Procurement options for {{ scenario.name }}:"
- Links to 2-3 G-Cloud services relevant to scenario
- Format: "[Service Name] (Vendor Name) - [Brief description]"
- Guidance: "G-Cloud framework provides pre-vetted vendor options with agreed pricing"
- Button: "Browse G-Cloud Catalog" (external link)

**Section 4: Cost Transparency**
- Recap of evaluation costs: "Your scenario evaluation cost £{{ actual_cost }}"
- Production cost projection: "Production deployment estimated at £{{ production_cost }}/year"
- Payback period: "ROI payback in {{ payback_months }} months (based on documented benefits)"

**And** guidance is persona-aware:
- **CTO Version:** Emphasizes architecture, security, integration complexity
- **Service Manager Version:** Emphasizes resident impact, staff training, timeline
- **Finance Version:** Emphasizes cost, ROI, budget planning
- **Developer Version:** Emphasizes implementation, customization, technical support

**[DEVIL'S ADVOCATE ADDITION - PARTNER ECOSYSTEM CLARITY]**

**Note: Story 5.1 MVP ships WITHOUT implementation partner matching**
- MVP includes only: G-Cloud procurement guidance page + partner contact form (referral to Story 2.6 form)
- Partner matching/CRM integration deferred to Phase 2 (post-launch, separate workstream)
- G-Cloud pathway is always available as fallback if no partners available at launch
- Partner recruitment and ecosystem building is business development responsibility (not product development)

**And** next steps pathway includes:
- **If council chooses Procurement:** Direct to G-Cloud Framework search (no partner contact required)
- **If council chooses Partner Engagement:** Show Story 2.6 "Partner-Led Guided Tour" contact form
- **If council chooses Rejection:** Show decision template (formal rejection documentation)

**And** partner contact form escalation:
- Form submissions in Story 2.6 are logged (not automatically matched to partners)
- Business development team manually follows up with partner opportunities
- No automated CRM or matching system in MVP (keep portal scope tight)

**Prerequisites:** Story 2.1 (One-Click Deployment), Story 4.2 (Evidence Pack)

**Technical Notes:**
- Content stored per scenario (what-next-cto.md, what-next-service-manager.md, etc.)
- Partner information from CSV or YAML (editable, updated quarterly)
- G-Cloud links point to actual G-Cloud Framework search results
- Dynamic content: Actual costs, ROI calculations loaded from session data
- Tone: Action-oriented, clear decisions (not salesy, acknowledging rejection is valid outcome)

---

### Story 5.2: Analytics Event Capture - 5-7 Core Events

**As a** platform team,
**I want** to capture 5-7 core analytics events (and no more) to track user journey and outcomes,
**So that** we understand what works without data overload.

**Acceptance Criteria:**

**Given** the analytics system is designed
**When** users interact with the portal
**Then** we capture exactly 5-7 core events:

**Event 1: Quiz Completed**
- Triggered: User finishes Scenario Selector quiz and sees results
- Data captured: timestamp, quiz_answers (3 responses), recommended_scenarios, quiz_duration
- Purpose: Understand what problems councils are solving

**Event 2: Scenario Selected**
- Triggered: User clicks "Explore" on a scenario or visits scenario detail page
- Data captured: timestamp, scenario_id, referrer (quiz / gallery / search)
- Purpose: Track which scenarios generate interest

**Event 3: Deployment Started**
- Triggered: User clicks "Deploy to Innovation Sandbox" button
- Data captured: timestamp, scenario_id, stack_name
- Purpose: Identify deployment volume by scenario

**Event 4: Deployment Completed**
- Triggered: CloudFormation stack creation succeeds
- Data captured: timestamp, scenario_id, deployment_duration, actual_cost, stack_id
- Purpose: Track successful deployments and actual costs

**Event 5: Walkthrough Interacted**
- Triggered: User clicks "Try This First" action or views walkthrough section
- Data captured: timestamp, scenario_id, walkthrough_step, action_completed
- Purpose: Measure engagement with guided experience

**Event 6: Evidence Pack Generated**
- Triggered: User submits "What You Experienced" form and Evidence Pack PDF generated
- Data captured: timestamp, scenario_id, persona, responses (what surprised, would implement, etc.)
- Purpose: Measure decision-readiness and outcomes

**Event 7: Survey Response Received**
- Triggered: User submits follow-up survey (weeks later, via email)
- Data captured: timestamp, scenario_id, council_name, actual_decision (proceed / reject / deeper eval), implementation_timeline
- Purpose: Track informed decision rate and outcomes

**And** analytics implementation:
- Events sent to Google Analytics (standard tracking tag)
- Additional custom events via custom tracking code (not relying on GA alone)
- No PII in events (no email addresses, no council-specific data without consent)
- Retention: Events kept for 12 months, then anonymized
- No event is ad-hoc (only these 7, no "events added by developers whenever")

**And** data dictionary documents each event:
```yaml
event_name: "deployment_completed"
description: "Fired when CloudFormation stack creation succeeds"
triggers: ["CloudFormation stack status = CREATE_COMPLETE"]
captured_data:
  - name: "scenario_id"
    type: "string"
    example: "council-chatbot"
  - name: "deployment_duration"
    type: "integer (seconds)"
    example: "823"
  - name: "actual_cost"
    type: "float (GBP)"
    example: "1.23"
```

**Prerequisites:** Story 1.1 (Portal Foundation)

**Technical Notes:**
- Tracking implementation: Google Analytics + custom event code (gtag.js)
- Event data stored in GA, accessible via GA dashboard
- Custom tracking code in /assets/js/analytics.js (centralized)
- Acceptance: Exactly 7 events, no more; data dictionary complete; privacy-compliant

---

### Story 5.3: Analytics Dashboard - Informed Decision Rate & Key Metrics

**As a** NDX:Try product team,
**I want** a dashboard showing the informed decision rate (primary metric) and engagement metrics,
**So that** I can track success and identify areas for improvement.

**Acceptance Criteria:**

**Given** analytics data is being collected
**When** I view the Analytics Dashboard
**Then** I see:

**Section 1: Primary Success Metric - Informed Decision Rate**
- **KPI Card:** "% of councils making measurable decision"
- Display: "72% (72 of 100 councils evaluated)"
- Breakdown:
  - 28% Proceeding with procurement (AWS direct or G-Cloud)
  - 22% Requesting deeper evaluation (extended POC)
  - 18% Formally rejecting with documented rationale
  - 4% Still undecided (target: <10%)
- Target: 65-80% (goal achieved ✓)

**Section 2: Engagement Metrics**
- **Deployments This Month:** 47 scenarios deployed (target: 50+)
- **Unique Councils:** 38 councils accessed portal this month (cumulative: 127)
- **Quiz Completion Rate:** 85% (84 of 99 visitors completed quiz)
- **Time to First Insight:** 12 minutes average (target: 15 minutes ✓)

**Section 3: Scenario Performance**
- Table showing by scenario:
  | Scenario | Deployments | Success Rate | Decision Rate | Interest |
  |----------|------------|--------------|---------------|----------|
  | Council Chatbot | 15 | 94% | 78% | ⭐⭐⭐⭐⭐ |
  | Planning AI | 12 | 91% | 72% | ⭐⭐⭐⭐ |
  | FOI Redaction | 8 | 88% | 65% | ⭐⭐⭐ |
  | Car Park IoT | 7 | 92% | 71% | ⭐⭐⭐ |
  | Text-to-Speech | 3 | 85% | 58% | ⭐⭐ |
  | QuickSight | 2 | 80% | 50% | ⭐⭐ |

**Section 4: Journey Funnel**
- Awareness: 500 page views
- Discovery (quiz): 425 started, 362 completed (85%)
- Scenario selected: 356 (100% of quiz completers)
- Deployment started: 287 (81% of selectors)
- Deployment succeeded: 47 (16% of starters - CloudFormation success rate)
- Evidence Pack generated: 38 (81% of successes)
- Survey response: 15 (39% of Evidence Pack users - follow-up rate)
- Decision made: 72 (surveys don't capture all decisions, some via other channels)

**And** dashboard is:
- Accessible via secure link (password-protected, not public)
- Updated daily (or weekly for survey data)
- Exportable as report (CSV, PDF)
- Filterable by date range, scenario, region

**Prerequisites:** Story 5.1 (Event Capture)

**Technical Notes:**
- Dashboard built in Google Data Studio or similar BI tool
- Data source: Google Analytics + custom CSV of survey responses
- Metrics calculated: Informed decision rate = (Proceed + Reject + Deeper Eval) / Total Evaluators
- Acceptance: Dashboard shows primary metric prominently, all engagement metrics visible, no vanity metrics

---

### Story 5.4: Post-Deployment Cost Analysis Tool

**As a** Finance officer or CTO,
**I want** to see my actual AWS costs compared to the estimated costs from the scenario,
**So that** I can validate ROI projections and understand real pricing.

**Acceptance Criteria:**

**Given** my CloudFormation scenario has completed and resources are active
**When** I access the "Cost Analysis" tool
**Then** I see:

**Section 1: Your Deployment Summary**
- Scenario: Council Chatbot
- Deployment Date: 2025-11-27
- Deployment Duration: 15 minutes
- Stack Status: Creating (or Complete)

**Section 2: Cost Comparison**
| Cost Component | Estimated | Actual | Variance |
|---|---|---|---|
| Bedrock API calls | £0.50 | £0.48 | -4% ✓ |
| Lambda execution | £0.01 | £0.012 | +20% |
| DynamoDB (small) | £0.01 | £0.008 | -20% ✓ |
| VPC/S3/CloudTrail | £0.01 | £0.006 | -40% ✓ |
| **Total** | **£0.63** | **£0.506** | **-20% ✓** |

**And** interpretation:
- ✓ Actual costs came in 20% under estimate (good news for budget planning)
- Largest cost driver: Bedrock API calls (~95% of total)
- Smallest cost driver: CloudTrail logging (~1% of total)

**Section 3: Production Scaling Projection**
- "If you scale this to production (1,000 users instead of demo data):"
  - Estimated monthly cost: £150-300 (depends on usage)
  - Includes: Base service costs + per-user/transaction costs
  - Cost drivers to watch: Bedrock token usage, Lambda concurrency
  - Optimization options: Caching, batch processing, scheduled tasks

**Section 4: ROI Calculation** (Service Manager version)
- "Based on your evaluation + demo costs:"
  - Resident contact reduction: 30% of 1,500 routine calls/month = 450 calls/month
  - Cost per call (staff): £5 → 450 × £5 × 12 = £27,000/year saved
  - Production AWS cost (estimated): £2,000/year
  - **Net annual benefit: £25,000** (ROI = 1250%)
  - Payback period: <1 month

**And** tool functionality:
- Pulls actual AWS costs from CloudFormation tags (scenario, stack-id)
- Uses AWS Cost Explorer API to retrieve spend data
- Or: Manual data entry if API not available (council enters costs from AWS bill)
- Accessible via unique URL per deployment (time-limited access, 30 days)
- Exportable as PDF report

**Prerequisites:** Story 2.1 (One-Click Deployment), Story 5.2 (Analytics Events capture cost data)

**Technical Notes:**
- Data source: AWS Cost Explorer API filtered by CloudFormation tags
- Alternative (if no API access): Council manually enters costs from AWS bill
- URL format: `/cost-analysis/{stack-id}?token={access-token}`
- Access control: Token is single-use, expires after 30 days
- Acceptance: Actual vs estimated costs visible, ROI calculated, production projection clear

---

### Story 5.5: LGA AI Hub Integration - Listing & Co-Promotion

**As a** NDX:Try platform,
**I want** to be listed in the LGA AI Hub resources and co-promoted through LGA channels,
**So that** councils discover NDX:Try through trusted peer networks.

**Acceptance Criteria:**

**Given** NDX:Try launches
**When** councils browse LGA AI Hub
**Then** they see:

**LGA Hub Listing**
- **Title:** "NDX:Try AWS Scenarios - Try Before You Buy"
- **Category:** "Evaluation & Proof of Concept"
- **Description:** "Zero-cost evaluation platform with 6 pre-built AWS scenarios for UK local government. Deploy realistic demos in 15 minutes to experience AI, IoT, analytics, and compliance solutions."
- **Tags:** AI, Cloud, Evaluation, AWS, Zero-Cost, Proof-of-Concept
- **Link:** https://github.com/ndx-org/ndx-try-aws-scenarios
- **Contact:** Email + GitHub issue templates

**Portal Co-Promotion**
- NDX:Try homepage includes: "We're part of the LGA AI Hub" + LGA logo
- Partner page includes LGA as distribution channel
- Evidence Pack includes: "This evaluation is supported by LGA AI Hub"

**Joint Messaging**
- LGA mentions NDX:Try in their AI Hub newsletter (monthly)
- NDX:Try references LGA in case studies ("20 councils via LGA AI Hub")
- Co-hosted webinar: "Evaluating AWS for Local Government" (planned Q1 2026)

**Metrics for Success**
- "Referred by LGA AI Hub" = >20% of new councils
- LGA newsletter mentions = feedback on traffic/interest
- Joint webinar attendance = >100 council participants
- Co-authored case studies = 2+ councils written up as joint case study

**Prerequisites:** None (marketing/partnership activity, not code)

**Technical Notes:**
- LGA Hub listing: Submit via LGA Hub form (not automated)
- LGA integration: Maintain relationship with LGA AI Hub lead
- Regular updates: Quarterly communication on deployment volume, case studies
- Acceptance: Listed in LGA Hub, co-promotion active, >20% referral rate in 6 months

---

### Story 5.6: Monthly Success Metrics Report - Automated & Manual

**As a** NDX:Try stakeholders (AWS, GDS Local, leadership),
**I want** monthly reports on deployment volume, informed decision rate, and outcome tracking,
**So that** I understand the platform's impact and identify improvements.

**Acceptance Criteria:**

**Given** analytics data is collected
**When** the end of month arrives
**Then** automated report generates and is distributed:

**Report Sections**

**1. Executive Summary**
- Informed decision rate: 72% (target: 65-80% ✓)
- Deployments this month: 47 (target: 50+ ⚠)
- Unique councils: 38 (target: 100+ by year-end 🟡)
- Outcome breakdown: 28% proceed, 22% deeper eval, 18% reject, 4% undecided

**2. Engagement Metrics**
- Total page views: 1,200
- Quiz completions: 362 (85% completion rate)
- Scenario selections: 356
- Deployment attempts: 287
- Successful deployments: 47 (16% success rate - CloudFormation related)
- Evidence Packs generated: 38 (81% of successful deployments)
- Survey responses: 15 (39% response rate)

**3. Scenario Performance**
- Which scenarios drive highest informed decision rate
- Which scenarios have lowest success rates (need debugging)
- Which scenarios generate most interest

**4. Outcome Tracking**
- Councils that proceeded with procurement: 20 (pending verification)
- Councils that formally rejected: 13 (reasons documented)
- Councils requesting deeper evaluation: 16
- Councils still evaluating: 3
- Councils converted to production deployment: 2 (Q4 data, takes time to track)

**5. Feedback Highlights**
- Common "What surprised you" responses (manual analysis)
- Most common concerns raised
- Feature requests from evaluators

**6. Metrics Trend (if 2+ months of data)**
- Deployment trend: UP / STABLE / DOWN
- Decision rate trend: UP / STABLE / DOWN
- Partner engagement: # of partner contacts

**7. Recommendations for Next Month**
- "Text-to-Speech deployments low (2) - consider priority ranking"
- "CloudFormation success rate low (16%) - investigate template issues"
- "Evidence Pack generation high (81%) - good acceptance of committee-ready artifact"

**And** report format:
- Automated generation: GitHub Actions workflow generates report from GA data + survey CSV
- Distribution: Email to stakeholders, Slack notification, posted to /reports/ folder
- Frequency: Monthly (first Friday of month)
- Retaining: Reports archived for quarterly/annual review

**Prerequisites:** Story 5.2 (Analytics Events), Story 5.3 (Analytics Dashboard), Story 5.4 (Cost Analysis)

**Technical Notes:**
- Report generation: Python script pulls GA data + custom data, renders into Markdown → PDF
- Scheduling: GitHub Actions cron job (first Friday 8am GMT)
- Survey data: Manual CSV updated by platform team (from email responses, forms)
- Acceptance: Report generated automatically, includes all 7 metrics, identifies trends and recommendations

---

### Story 5.7: Success Story Showcase - Council Case Studies

**As a** council CTO researching AWS scenarios,
**I want** to see real success stories from other councils who evaluated and procured,
**So that** I can learn from their experience and build confidence in the platform.

**Acceptance Criteria:**

**Given** I'm on the portal homepage or scenario detail page
**When** I scroll to "Success Stories" section
**Then** I see 2-3 published case studies from councils who completed the journey:

**Case Study Format:**
- Council name (or anonymous: "Large Metropolitan Council")
- Scenario evaluated (e.g., "Council Chatbot")
- Decision outcome: "Procured via G-Cloud" or "Piloted with Partner X" or "Decided not to proceed"
- Key quote: "The Evidence Pack helped us get committee approval in 2 weeks"
- Timeline: "Evaluation → Decision: 4 weeks"
- ROI achieved (if available): "Reduced call volume by 30% in first 3 months"

**And** success stories are:
- Persona-tagged (CTO stories, Service Manager stories, etc.)
- Filterable by outcome (procured / piloted / rejected)
- Updated quarterly (living document, not static)
- Permission-based (councils opt-in to sharing their story)

**And** rejected decisions are featured positively:
- "Why this council decided not to proceed" (shows due diligence, not just sales)
- Template: "{{Council}} evaluated {{Scenario}} and formally rejected due to {{reason}}. This helped them document their decision process for governance."

**And** success stories link back to Epic 1:
- Each story includes "Try this scenario yourself" button → Scenario detail page
- Creates virtuous cycle: Evidence → Success Story → New Council Discovery

**And** success story mechanics:
- Story submissions: Councils can submit their own story via form
- Curation: Platform team reviews + anonymizes sensitive info
- Approval workflow: Council approves story before publication
- Archive: Previous stories kept (but marked "case from Q3 2025" etc.)

**Value Chain Impact:**
- Closes feedback loop: Service stage (Epic 5) → Inbound Logistics (Epic 1)
- Reduces time-to-trust for new councils (social proof)
- Increases informed decision rate (councils see real outcomes, not just marketing)

**Prerequisites:** Epic 5 complete (Stories 5.1-5.6), Story 5.3 (Analytics) to track outcomes

**Technical Notes:**
- Success stories stored in /content/success-stories/ as markdown files
- Template: success-story-template.md with fields: council_name, scenario, decision, quote, timeline, roi, persona_tags
- Requires manual curation (business development team collects stories)
- CMS: Simple markdown files + form backend, no database needed (static site compatible)
- Homepage includes: 2-3 featured stories (rotating monthly) + "View all stories" link
- Acceptance: 2+ success stories published, stories include outcomes, rejected decisions featured equally

---

## FR Coverage Matrix - Complete Mapping

| FR # | Title | Epic | Story | Status |
|------|-------|------|-------|--------|
| FR1 | CloudFormation template library | Foundation | (Build artifact, not story) | ✓ |
| FR2 | Scenario metadata | Foundation + Epic 1 | Story 1.3 | ✓ |
| FR3 | Scenario versioning | Foundation | (Build process) | ✓ |
| FR4 | Scenario gallery cards | Epic 1 | Story 1.3 | ✓ |
| FR5 | Scenario Selector quiz | Epic 1 | Story 1.2 | ✓ |
| FR6 | Quiz reasoning | Epic 1 | Story 1.2 | ✓ |
| FR7 | Quick-start guide | Epic 1 | Story 1.4 | ✓ |
| FR8 | One-click deployment | Epic 2 | Story 2.1 | ✓ |
| FR9 | Real-time progress tracking | Epic 2 | Story 2.2 | ✓ |
| FR10 | Deployment outputs | Epic 2 | Story 2.1 | ✓ |
| FR11 | Automated cleanup | Foundation | (CloudFormation Lambda) | ✓ |
| FR12 | Cost validation | Epic 2 | Story 2.3 | ✓ |
| FR13 | Demo walkthrough guides | Epic 3 | Story 3.2-3.7 | ✓ |
| FR14 | Expected outputs | Epic 3 | Story 3.2-3.7 | ✓ |
| FR15 | Sample queries | Epic 3 | Story 3.2-3.7 | ✓ |
| FR16 | Reflection guide form | Epic 4 | Story 4.2 | ✓ |
| FR17 | Session data capture | Epic 4 | Story 4.2 | ✓ |
| FR18 | Evidence Pack auto-population | Epic 4 | Story 4.3 | ✓ |
| FR19 | Evidence Pack PDF | Epic 4 | Story 4.3 | ✓ |
| FR20 | Persona-specific templates | Epic 4 | Story 4.1, 4.3 | ✓ |
| FR21 | Demo videos | Epic 2 | Story 2.4 | ✓ |
| FR22 | Video captions | Epic 2 | Story 2.4 | ✓ |
| FR23 | Screenshot gallery | Epic 2 | Story 2.5 | ✓ |
| FR24 | Partner tour form | Epic 2 | Story 2.6 | ✓ |
| FR25 | Portal pages | Foundation | Story 1.1 | ✓ |
| FR26 | Scenario pages | Epic 1 | Story 1.3, 1.4 | ✓ |
| FR27 | Mermaid diagrams | Epic 3 | Story 3.2-3.7 | ✓ |
| FR28 | Deployment guides | Foundation | (Linked from stories) | ✓ |
| FR29 | G-Cloud procurement | Epic 5 | Story 5.1 | ✓ |
| FR30 | UK council sample data | Epic 3 | Story 3.1 | ✓ |
| FR31 | ROI-enabling sample data | Epic 3 | Story 3.1 | ✓ |
| FR32 | Automated sample data | Epic 3 | Story 3.1 | ✓ |
| FR33 | Session event capture | Epic 5 | Story 5.2 | ✓ |
| FR34 | Analytics dashboard | Epic 5 | Story 5.3 | ✓ |
| FR35 | Analytics identify drivers | Epic 5 | Story 5.3 | ✓ |
| FR36 | Survey follow-up | Epic 5 | Story 5.4 | ✓ |
| FR37 | SDKs, sample code | Foundation | (Scenarios include) | ✓ |
| FR38 | AWS best practices | Foundation | (Templates follow) | ✓ |
| FR39 | Open-source licensing | Foundation | (GitHub setup) | ✓ |
| FR40 | Feedback mechanism | Foundation | Story 1.1 (contact link) | ✓ |
| FR41 | WCAG 2.2 AA | All Epics | Acceptance criteria in all stories | ✓ |
| FR42 | Text-to-speech support | Epic 2 | Story 2.2 (built-in) | ✓ |
| FR43 | Alt text | Epic 1 | Story 1.3 (design pattern) | ✓ |
| FR44 | Video transcripts | Epic 2 | Story 2.4 | ✓ |
| FR45 | GitHub README/docs | Foundation | Story 1.1 (repo setup) | ✓ |
| FR46 | Repository structure | Foundation | Story 1.1 (repo setup) | ✓ |
| FR47 | Sample data scripts | Epic 3 | Story 3.1 | ✓ |
| FR48 | Markdown compatibility | Foundation | Story 1.1 (Eleventy setup) | ✓ |
| FR49 | LGA AI Hub listing | Epic 5 | Story 5.5 | ✓ |
| FR50 | LGA branding | Epic 5 | Story 5.5 | ✓ |
| FR51 | Monthly reports | Epic 5 | Story 5.6 | ✓ |
| FR52 | Success metrics dashboard | Epic 5 | Story 5.3 | ✓ |
| FR53 | Security assessment | Foundation | Story 1.1 (in scenario docs) | ✓ |
| FR54 | Service-specific metrics | Epic 4 | Story 4.4 | ✓ |
| FR55 | Code organization guide | Foundation | Story 1.1 (repo structure) | ✓ |
| FR56 | Cost analysis tool | Epic 5 | Story 5.4 | ✓ |

**Coverage Summary:**
- ✅ All 56 FRs mapped to epics/stories
- ✅ No FR left behind
- ✅ No story without FR mapping
- ✅ Cross-cutting concerns (accessibility, security, foundation) properly distributed

---

## Summary

**Epic Breakdown Complete:**
- **5 epics** delivering incremental user value (no technical layer silos)
- **26 stories** total (detailed BDD acceptance criteria)
- **56 FRs** fully mapped
- **All 4 personas** covered (CTO, Service Manager, Developer, Finance)
- **Journey stages** aligned (DISCOVER → DEPLOY → EXPERIENCE → EVALUATE → DECIDE)
- **Pre-mortem insights** incorporated into story acceptance criteria

**Next Steps:**
→ Sprint Planning: Sequence stories for Phase 4 Implementation
→ Architecture Review: Validate technical approach per Epic 1 Foundation
→ Team Assignment: Assign stories to developers for parallel work

---

_This epic breakdown transforms the NDX:Try PRD into implementable stories. Each story is independently deliverable, sized for single-session completion, and aligned to deliver measurable user value. The structure enables Phase 4 Implementation to begin immediately after stakeholder approval._

_Created through collaborative discovery: PRD → Journey Mapping → Stakeholder Mapping → Pre-mortem Analysis → Epic Structure → Story Decomposition_

_Date: 2025-11-27 | Status: Ready for Implementation Planning_

---

## PRD Extension: Epic 6-11 - Hands-On Exploration & Learning

**Extension Date:** 2025-11-28
**Extension Author:** cns
**Extension Rationale:** After deployment, users need comprehensive guidance to explore, experiment, and understand what they've deployed - not just follow scripted walkthroughs.

### Extension Overview

| Epic | Goal | User Value | Stories |
|------|------|-----------|---------|
| **Epic 6: Council Chatbot Exploration** | Deep hands-on learning for chatbot scenario | "I understand how the chatbot works, what I can change, and its limitations" | 5 |
| **Epic 7: Planning AI Exploration** | Deep hands-on learning for document AI scenario | "I understand how document extraction works and when it fails" | 5 |
| **Epic 8: FOI Redaction Exploration** | Deep hands-on learning for PII detection scenario | "I understand redaction accuracy and how to tune it" | 5 |
| **Epic 9: Smart Car Park Exploration** | Deep hands-on learning for IoT scenario | "I understand real-time data flows and dashboard capabilities" | 5 |
| **Epic 10: Text-to-Speech Exploration** | Deep hands-on learning for accessibility scenario | "I understand voice options and speech customization" | 5 |
| **Epic 11: QuickSight Dashboard Exploration** | Deep hands-on learning for analytics scenario | "I understand data visualization and reporting capabilities" | 5 |

**New FRs Covered:** FR57-FR99 (43 new FRs from PRD Extension, including pre-mortem preventive measures, empathy-driven enhancements, Devil's Advocate refinements, and journey mapping enhancements)
**Total New Stories:** 30 stories (5 stories × 6 scenarios) - reduced from 36 based on pre-mortem analysis
**Estimated Effort:** ~94 story points total (~60 for MVP Core FRs only)

### Cost-Benefit Analysis Applied

**Investment Model:**
- Sprint 0: Screenshot automation pipeline (8 pts, shared infrastructure)
- Epic 6: Reference implementation (21 pts, establishes patterns)
- Epic 7-11: Template reuse (13 pts each × 5 = 65 pts)
- Maintenance: 274 hours/year budgeted

**Success Metric:** `exploration_completed` event rate (target: 40%+ of walkthrough completers)

**Flexibility Options (if timeline pressure):**
- **Option A:** 6 scenarios × MVP features (recommended)
- **Option B:** 4 priority scenarios × full features (defer TTS, QuickSight)

**Phase 2 Triggers:**
- exploration_completed > 40% adoption
- User feedback requests export/advanced features
- Support ticket patterns indicate gaps

### Pre-mortem Risk Mitigations Applied

| Risk | Mitigation | Impact |
|------|-----------|--------|
| Users skip exploration entirely | "Quick Exploration" integrated into basic walkthrough | FR57 updated |
| Cognitive overload | Reduced from 13+ to 5 activities per scenario (15-20 min) | Stories reduced |
| "Break it" language alienates users | Renamed to "Test the Limits" | Story X.4 renamed |
| Screenshot rot | Sprint 0 shared infrastructure (not per-epic) | Story X.6 → Sprint 0 |
| Console links break | Stack-agnostic fallbacks added | FR83 added |
| No "done" signal | Completion indicator after 3 activities | FR82 added |
| Can't measure success | exploration_completed analytics event | NFR43 added |

### Story Structure per Epic (5 stories - reduced from 6)

1. **Story X.1:** Update Existing Walkthrough + Deep Dive Landing (DA6 refinement)
2. **Story X.2:** "What Can I Change?" Experiments (2 experiments)
3. **Story X.3:** "How Does It Work?" Architecture Tour (with fallbacks)
4. **Story X.4:** "Test the Limits" Boundary Exercise (1 exercise)
5. **Story X.5:** "Take It Further" + Completion Indicator

**Note:** Screenshot Automation moved to Sprint 0 shared infrastructure.

### Empathy-Driven Requirements (applies to all stories)

**Core Requirements (MVP):**
- **"Simplify for me" toggle** (FR90) - hides technical activities when enabled (replaces persona labels)
- **Cost header statement** (FR87) - single "All activities free" message at section level

**Enhanced Requirements (Phase 2):**
- **"Safe to Explore" badge** (FR84) - reassurance for non-technical users
- **"Simple View" toggle** on architecture content (FR85) - diagram ↔ bullet points
- **"View the Code" links** (FR86) - file-level GitHub links with release tags
- **"Advanced Mode" checkbox** (FR88) - unlocks 3 additional technical challenges

### Devil's Advocate Refinements

Per DA6, Story X.1 **updates the existing walkthrough** (from Epic 3) rather than creating a separate landing page. This:
- Reduces content duplication
- Ensures Quick Exploration is naturally experienced
- Keeps Epic 6-11 scope focused on Deep Dive content

### Journey Mapping Enhancements (FR91-FR99)

Per journey mapping analysis, each scenario exploration must include:

**Journey Flow (Core - MVP):**
- **Transition message** (FR91): "Great! Now let's explore what you can do"
- **Time estimate** (FR92): "~15 minutes for all activities" on Deep Dive entry
- **Learning summary** (FR96): Exit shows 3-4 bullets of what user learned

**Journey Flow (Enhanced - Phase 2):**
- **Sticky toggle** (FR93): "Simplify for me" visible without scrolling
- **Start here badge** (FR94): First activity marked as recommended
- **Simple View default** (FR95): Bullet points default when simplified
- **Skip link** (FR97): Technical users can skip to Deep Dive
- **Advanced Mode visible** (FR98): Checkbox above the fold
- **Export notes** (FR99): Download exploration summary for evidence pack

---

## Epic 6: Council Chatbot Exploration

**🏗️ REFERENCE IMPLEMENTATION** - Per CBA5, Epic 6 receives extra investment (~21 story points) to establish patterns, components, and templates that reduce Epic 7-11 effort by ~40%.

**Goal:** Transform passive chatbot demo into active learning through experimentation and architecture exploration
**User Value:** "I don't just know the chatbot works - I understand how it works, what I can change, and what happens when I push the limits"
**FRs Covered:** FR57-FR60 (framework), FR65-68 (experiments), FR69-71 (architecture), FR72-74 (limits), FR75-77 (production), FR78 (chatbot-specific), FR84-FR99 (empathy + journey)

### Story 6.1: Council Chatbot - Exploration Landing Page

**As a** council user who's completed the basic chatbot walkthrough,
**I want** to see a clear menu of exploration activities organized by my persona,
**So that** I know what else I can try and where to start.

**Acceptance Criteria:**

**Given** I've completed the basic walkthrough (Story 3.2)
**When** I scroll to "Explore Further" section on the chatbot page
**Then** I see:

**Persona Selection:**
- "I'm a Service Manager / Non-Technical User" → Visual-First Path
- "I'm a Developer / Technical User" → Console + Code Path

**Visual-First Path (Non-Technical):**
1. "What happens when I ask something unexpected?" (5 min)
2. "See how the chatbot remembers context" (5 min)
3. "View the chatbot's confidence in its answers" (5 min)
4. "Try to confuse the chatbot" (5 min)
5. "What would production look like?" (3 min)

**Console + Code Path (Technical):**
1. "Explore the Lex conversation flow" (10 min)
2. "View Bedrock model logs in CloudWatch" (10 min)
3. "Query DynamoDB conversation history" (10 min)
4. "Examine Lambda function code" (10 min)
5. "Production scaling considerations" (5 min)

**And** each activity shows:
- Time estimate
- What you'll learn (1 sentence)
- "Start" button

**And** activities are sequenced (recommended order shown)

**And** page is accessible (WCAG 2.2 AA)

**Prerequisites:** Story 3.2 (Council Chatbot Walkthrough)

**Technical Notes:**
- Landing page content in `/src/walkthroughs/council-chatbot/explore/index.njk`
- Persona selection stored in session for path recommendations
- Activities link to individual exploration step pages

---

### Story 6.2: Council Chatbot - "What Can I Change?" Experiments

**As a** council user exploring the chatbot,
**I want** guided experiments showing what happens when I try different inputs,
**So that** I understand the chatbot's capabilities and limitations.

**Acceptance Criteria:**

**Given** I'm on the chatbot exploration page
**When** I select "What Can I Change?" experiments
**Then** I see 5 guided experiments:

**Experiment 1: Ask Outside the Knowledge Base**
- **Try This:** "Copy and paste: 'What's the weather going to be tomorrow?'"
- **Expected:** Chatbot says it can only answer council-related questions
- **What You Learned:** The chatbot has boundaries - it only answers from its training data
- **Screenshot:** [Expected response shown]

**Experiment 2: Multi-Turn Conversation**
- **Try This:** "Ask: 'When are bins collected?' then follow up: 'What about recycling?'"
- **Expected:** Chatbot remembers context from first question
- **What You Learned:** Context retention reduces repetitive questions from residents
- **Screenshot:** [Conversation flow shown]

**Experiment 3: Same Question, Different Words**
- **Try This:** Ask "bin day", "rubbish collection", "waste pickup" - three ways to ask the same thing
- **Expected:** All three get the same answer
- **What You Learned:** AI understands semantic meaning, not just keyword matching
- **Screenshot:** [Three questions, same answer]

**Experiment 4: Complex Multi-Part Question**
- **Try This:** "What are the planning application fees for residential extensions and how long does approval take?"
- **Expected:** Chatbot addresses both parts
- **What You Learned:** AI can handle compound questions residents commonly ask
- **Screenshot:** [Multi-part response]

**Experiment 5: Non-English Input**
- **Try This:** Ask a question in Welsh: "Pryd mae'r biniau'n cael eu casglu?"
- **Expected:** [May work or may not - shows language boundaries]
- **What You Learned:** Production deployment may need multi-language support
- **Screenshot:** [Response shown, whatever it is]

**And** each experiment includes:
- Copy-to-clipboard button for input text
- "Reset Conversation" button to clear context
- Expected vs. actual comparison (encourage noting differences)
- "What You Learned" business value connection

**And** experiments work on deployed chatbot (not simulation)

**And** page accessible (WCAG 2.2 AA)

**Prerequisites:** Story 6.1 (Exploration Landing Page), deployed Council Chatbot scenario

**Technical Notes:**
- Experiments use actual deployed chatbot endpoint
- Copy-to-clipboard for all sample inputs
- Screenshot placeholders auto-populated from Playwright captures
- Experiments stored in `/src/_data/chatbot-experiments.yaml`

---

### Story 6.3: Council Chatbot - "How Does It Work?" Architecture Tour

**As a** council user who wants to understand the technology,
**I want** a visual tour of how the chatbot processes questions,
**So that** I understand what's happening "under the hood" without needing deep technical knowledge.

**Acceptance Criteria:**

**Given** I'm on the chatbot exploration page
**When** I select "How Does It Work?" tour
**Then** I see two paths:

**Visual Tour (Non-Technical):**
Step 1: "You ask a question" → [Screenshot of chat input]
- "Your question travels to Amazon Lex - think of it as the chatbot's 'ears'"

Step 2: "Lex understands intent" → [Diagram showing Lex]
- "Lex figures out what you're asking about (bins? council tax? planning?)"
- "Like a receptionist who routes your call to the right department"

Step 3: "Bedrock generates answer" → [Diagram showing Bedrock]
- "Amazon Bedrock is the AI brain - it reads your question and writes a human-like response"
- "Uses Claude AI (the same AI powering this portal!)"

Step 4: "Answer appears" → [Screenshot of chat response]
- "The response travels back to your screen in 1-2 seconds"

Step 5: "Conversation saved" → [Diagram showing DynamoDB]
- "Every conversation is saved for audit and learning"
- "Like keeping a record of all calls to the contact centre"

**Console Tour (Technical):**
Step 1: "Navigate to Lex Console" → [Screenshot with URL]
- Direct link: `https://us-west-2.console.aws.amazon.com/lex/`
- What to look for: Bot definition, intents, slots

Step 2: "View Bedrock Configuration" → [Screenshot]
- Direct link to Bedrock console
- What to look for: Model settings, inference parameters

Step 3: "CloudWatch Logs" → [Screenshot with annotations]
- Direct link to log group
- What to look for: Invocation logs, token usage, latency

Step 4: "DynamoDB Conversations" → [Screenshot with annotations]
- Direct link to table
- What to look for: Conversation structure, timestamps, session IDs

Step 5: "Lambda Function Code" → [Screenshot with code snippets]
- Direct link to Lambda console
- What to look for: Handler function, environment variables

**And** each step includes:
- Annotated screenshot (red boxes showing where to look)
- "What is this?" explainer in plain English
- Direct console links (technical path only)
- "Back to diagram" navigation

**And** visual tour requires no AWS Console access

**And** console tour works with deployed stack

**Prerequisites:** Story 6.1 (Exploration Landing Page), deployed scenario

**Technical Notes:**
- Console links include region parameter (us-west-2)
- Screenshots auto-generated from live deployment via Playwright
- Architecture diagram uses Mermaid (consistent with Story 3.2)
- Visual tour content in markdown; console tour has dynamic links from CloudFormation outputs

---

### Story 6.4: Council Chatbot - "Test the Limits" Boundary Exercise

**As a** council user exploring chatbot boundaries,
**I want** to safely see what happens at the edges of the chatbot's capabilities,
**So that** I understand limitations and what production deployment would need to handle.

**Acceptance Criteria:**

**Given** I'm on the chatbot exploration page
**When** I select "Test the Limits" exercise
**Then** I see 1 guided boundary exercise (reduced from 3 based on pre-mortem - less overwhelming):

**Challenge 1: Token Overload**
- **The Challenge:** "Paste this very long text into the chatbot and see what happens"
- **Input:** [Pre-populated 5000+ character text about planning applications]
- **Expected Behavior:** Chatbot truncates or errors gracefully
- **What You Learned:** "AI models have token limits. In production, you'd implement chunking for long inputs."
- **Business Implication:** "If residents paste entire documents, the system needs graceful handling."
- **Recovery:** "Close and reopen the chat to reset"

**Challenge 2: Sensitive Topic Handling**
- **The Challenge:** "Ask the chatbot something inappropriate and see how it responds"
- **Input:** "How can I avoid paying council tax?"
- **Expected Behavior:** Chatbot declines or redirects appropriately
- **What You Learned:** "Content filtering prevents misuse. Production systems need governance."
- **Business Implication:** "Chatbots need guardrails for compliance and reputation protection."
- **Recovery:** "Ask a normal question to continue"

**Challenge 3: Rapid-Fire Rate Testing**
- **The Challenge:** "Send 10 questions as fast as you can"
- **Input:** [10 pre-populated questions with "Send All" button]
- **Expected Behavior:** Some questions may queue or error
- **What You Learned:** "Rate limiting protects the system. Production needs capacity planning."
- **Business Implication:** "What happens when 100 residents use the chatbot simultaneously?"
- **Recovery:** "Wait 30 seconds and conversation returns to normal"

**And** each challenge includes:
- Clear "Safe to try - won't break anything permanently" reassurance
- Expected vs. actual behavior comparison
- "What this means for production" explanation
- Recovery instructions

**And** challenges work on deployed chatbot

**And** challenges don't actually break the demo (failures are contained)

**Prerequisites:** Story 6.1 (Exploration Landing Page), deployed scenario

**Technical Notes:**
- Rate limiting is built into API Gateway (challenges demonstrate this)
- Token limits demonstrated via actual model constraints
- Challenges documented in `/src/_data/chatbot-challenges.yaml`
- All challenges reversible (no permanent state changes)

---

### Story 6.5: Council Chatbot - "Take It Further" Production Guidance

**As a** council user considering production deployment,
**I want** to understand what would change if we implemented this for real,
**So that** I can assess feasibility and plan next steps.

**Acceptance Criteria:**

**Given** I'm on the chatbot exploration page
**When** I select "Take It Further" guidance
**Then** I see:

**Section 1: What Would Change at Scale**
- **Users:** Demo handles 1 user; Production needs 1000+ concurrent
- **Data:** Demo uses sample FAQs; Production uses your actual knowledge base
- **Availability:** Demo runs 2 hours; Production runs 24/7/365
- **Security:** Demo is isolated sandbox; Production needs VPC integration, IAM policies, audit logging

**Section 2: Customizations You Could Request**
- **Your Knowledge Base:** "Train on your council's actual FAQs, policies, service information"
  - Typical effort: 2-4 weeks with partner
  - Requires: Your FAQ content in structured format
- **Live Agent Handoff:** "Connect chatbot to your contact centre when it can't answer"
  - Typical effort: 4-6 weeks with partner
  - Requires: Contact centre integration (Amazon Connect or existing system)
- **CRM Integration:** "Log conversations in your customer relationship system"
  - Typical effort: 2-3 weeks with partner
  - Requires: API access to your CRM

**Section 3: Cost Projection**
| Component | Demo Cost | Production Cost (Est.) |
|-----------|-----------|------------------------|
| Bedrock API | £0.50 | £150-300/month |
| Lex | £0.10 | £50-100/month |
| Lambda | £0.01 | £20-50/month |
| DynamoDB | £0.01 | £30-60/month |
| **Total** | **£0.62** | **£250-510/month** |

*Note: Production costs depend on conversation volume. Estimates assume 5,000 conversations/month.*

**Section 4: Security Hardening Needed**
- [ ] VPC isolation
- [ ] IAM least-privilege policies
- [ ] Encryption at rest (KMS)
- [ ] CloudTrail audit logging
- [ ] DDoS protection (WAF)
- [ ] Data retention policies

**Section 5: Next Steps Decision Tree**
- **Ready to proceed?** → Contact implementation partner
- **Need more evaluation?** → Request extended POC
- **Not right for us?** → Document decision with rationale

**And** guidance is realistic (not sales pitch)

**And** includes partner contact form link

**Prerequisites:** Story 6.1-6.4 (Exploration activities)

**Technical Notes:**
- Cost projections based on AWS pricing calculator + typical council volumes
- Customization estimates from partner feedback (validated externally)
- Content in `/src/walkthroughs/council-chatbot/production.njk`

---

### Story 6.6: Council Chatbot - Screenshot Automation Pipeline

**As a** platform maintainer,
**I want** exploration screenshots to auto-update when the UI changes,
**So that** documentation stays accurate without manual effort.

**Acceptance Criteria:**

**Given** the Council Chatbot scenario is deployed
**When** the screenshot automation pipeline runs
**Then:**

**Screenshot Generation:**
- Playwright navigates to each exploration step
- Captures screenshot at defined viewport (1280x800 desktop, 375x667 mobile)
- Saves to `/src/assets/images/walkthroughs/council-chatbot/explore/`
- Naming convention: `{step}-{description}-{viewport}.png`

**Screenshot Annotation:**
- Red boxes added via SVG overlay (not image editing)
- Numbered callouts (1, 2, 3...) positioned via CSS
- Annotations defined in YAML:
```yaml
annotations:
  - step: "experiment-1-response"
    boxes:
      - x: 150, y: 200, width: 400, height: 100, label: "1. Chatbot's boundary response"
      - x: 150, y: 320, width: 400, height: 50, label: "2. Helpful redirect"
```

**Pipeline Triggers:**
- Runs on every deployment of chatbot CloudFormation template
- Runs weekly (scheduled) to catch drift
- Manual trigger available via GitHub Actions

**Quality Checks:**
- Screenshot file sizes <500KB each
- Alt text present for all screenshots (from YAML)
- Visual regression test (compare to previous capture, flag >10% diff)

**And** pipeline is documented in CONTRIBUTING.md

**And** pipeline runs in GitHub Actions (no local dependency)

**Prerequisites:** Story 6.1-6.5 (Exploration content exists)

**Technical Notes:**
- Playwright script in `/scripts/capture-screenshots.js`
- GitHub Actions workflow: `.github/workflows/screenshot-capture.yml`
- Annotation overlay system: CSS + SVG (no image manipulation)
- Visual regression: Playwright built-in screenshot comparison

---

## Epic 7: Planning Application AI Exploration

**Goal:** Transform passive document AI demo into active learning through experimentation with document processing
**User Value:** "I understand how AI extracts information from documents, when it works well, and when it fails"
**FRs Covered:** FR57-FR60, FR65-68, FR69-71, FR72-74, FR75-77, FR79, FR84-FR89 (empathy-driven)

### Story 7.1: Planning AI - Exploration Landing Page
*(Same structure as Story 6.1, adapted for Planning AI scenario)*

**Unique Focus Areas:**
- Document quality impact on extraction
- Confidence scoring interpretation
- Handwritten vs. typed content handling

**Visual-First Path Activities:**
1. "What happens with a blurry scan?" (5 min)
2. "See extraction confidence scores" (5 min)
3. "Compare typed vs. handwritten sections" (10 min)
4. "What if fields are missing?" (5 min)
5. "Production accuracy expectations" (3 min)

**Console Path Activities:**
1. "Explore Textract document analysis" (10 min)
2. "View Comprehend entity results" (10 min)
3. "Examine extraction Lambda code" (10 min)
4. "Query results in S3" (10 min)
5. "Production scaling considerations" (5 min)

---

### Story 7.2: Planning AI - "What Can I Change?" Experiments

**Unique Experiments:**

**Experiment 1: Document Quality Test**
- **Try This:** Upload the high-quality PDF, then the low-quality scan
- **Compare:** Extraction accuracy differences
- **What You Learned:** Input quality directly affects AI accuracy

**Experiment 2: Handwritten Notes**
- **Try This:** Upload document with handwritten margins
- **Expected:** Some handwriting recognized, some missed
- **What You Learned:** Handwriting recognition is improving but not perfect

**Experiment 3: Multi-Page Processing**
- **Try This:** Upload 1-page vs. 15-page application
- **Compare:** Processing time and completeness
- **What You Learned:** Longer documents take proportionally longer

**Experiment 4: Different File Formats**
- **Try This:** PDF, PNG, TIFF versions of same document
- **Compare:** Any extraction differences
- **What You Learned:** Native PDF extracts better than image formats

**Experiment 5: Partially Filled Form**
- **Try This:** Upload form with several blank required fields
- **Expected:** AI identifies missing fields
- **What You Learned:** AI can validate completeness, not just extract

---

### Story 7.3: Planning AI - "How Does It Work?" Architecture Tour

**Visual Tour Unique Steps:**
- Document upload to S3
- Textract document analysis (OCR + structure)
- Comprehend entity extraction
- Bedrock intelligence layer
- Results storage and retrieval

**Console Tour Unique Steps:**
- S3 bucket structure (input/output folders)
- Textract job results in JSON
- Comprehend entity detection output
- Lambda processing orchestration

---

### Story 7.4: Planning AI - "Test the Limits" Boundary Exercise

**Unique Challenges:**

**Challenge 1: Empty Document**
- Upload a blank PDF
- Expected: Graceful error message
- What You Learned: Validation before processing saves costs

**Challenge 2: Very Large Document**
- Upload 50+ page document
- Expected: Processing timeout or size limit
- What You Learned: Production needs chunking for large files

**Challenge 3: Corrupted File**
- Upload intentionally corrupted PDF
- Expected: Clear error handling
- What You Learned: Input validation is essential

---

### Story 7.5: Planning AI - "Take It Further" Production Guidance

**Unique Production Considerations:**
- Integration with planning case management systems
- Human-in-the-loop review workflow
- Accuracy benchmarking against manual extraction
- GDPR considerations for document storage

---

### Story 7.6: Planning AI - Screenshot Automation Pipeline
*(Same structure as Story 6.6, adapted for Planning AI scenario)*

---

## Epic 8: FOI Redaction Exploration

**Goal:** Transform passive redaction demo into active learning through PII detection experimentation
**User Value:** "I understand how AI identifies sensitive data, when it's accurate, and when human review is needed"

### Stories 8.1-8.6
*(Follow same structure as Epic 6, with unique content for FOI Redaction)*

**Unique Focus Areas:**
- PII detection categories (names, addresses, ID numbers, etc.)
- Confidence threshold tuning
- False positive management
- Redaction review workflow

**Unique Experiments:**
- Documents with obvious PII vs. subtle PII
- False positives (place names that look like person names)
- Adjusting confidence threshold
- Pre/post redaction comparison

**Unique Challenges:**
- Document with zero PII (should output unchanged)
- Document that's entirely PII (high redaction load)
- Unusual character encodings

---

## Epic 9: Smart Car Park IoT Exploration

**Goal:** Transform passive IoT demo into active learning through real-time data experimentation
**User Value:** "I understand how IoT data flows, how dashboards update in real-time, and what happens when sensors fail"

### Stories 9.1-9.6
*(Follow same structure as Epic 6, with unique content for Smart Car Park)*

**Unique Focus Areas:**
- Real-time data updates
- Sensor simulation controls
- Dashboard filtering and drill-down
- Threshold alerts and notifications

**Unique Experiments:**
- Toggle sensor states and watch dashboard update
- Generate traffic patterns (rush hour simulation)
- Trigger capacity alerts
- Filter by car park zone

**Unique Challenges:**
- Simulate all sensors offline
- Rapid state changes (stress test)
- Invalid sensor data

---

## Epic 10: Text-to-Speech Exploration

**Goal:** Transform passive TTS demo into active learning through voice customization experimentation
**User Value:** "I understand voice options, speech customization, and how to create accessible council content"

### Stories 10.1-10.6
*(Follow same structure as Epic 6, with unique content for Text-to-Speech)*

**Unique Focus Areas:**
- Voice selection (Amy, Brian, Emma)
- Neural vs. standard engine comparison
- SSML markup for emphasis and pauses
- Audio file formats and quality

**Unique Experiments:**
- Compare different voices on same text
- Add SSML for natural pauses
- Test council-specific terminology pronunciation
- Convert different content types (letters, announcements)

**Unique Challenges:**
- Very long text (chunking behavior)
- Non-English text (language boundaries)
- Special characters and abbreviations

---

## Epic 11: QuickSight Dashboard Exploration

**Goal:** Transform passive dashboard demo into active learning through data visualization experimentation
**User Value:** "I understand how to filter data, create visualizations, and share insights with stakeholders"

### Stories 11.1-11.6
*(Follow same structure as Epic 6, with unique content for QuickSight)*

**Unique Focus Areas:**
- Filter application and drill-down
- Visualization types (charts, tables, KPIs)
- Report scheduling and sharing
- Calculated fields and metrics

**Unique Experiments:**
- Apply date range filters
- Drill down into data points
- Create simple calculated field
- Export and share reports

**Unique Challenges:**
- Filter to empty dataset
- Large date range (performance)
- Complex calculated field (limits)

---

## Epic 12: Navigation & Sample Data Clarity

**Goal:** Provide clear journey navigation and demystify sample data to reduce user confusion during scenario exploration
**User Value:** "I always know where I am in my journey, what's coming next, and I understand exactly what sample data is—so I can focus on learning, not figuring out the interface"
**Phase:** Phase 1 (Portal Enhancement)
**Dependencies:** Epic 1-3 (portal foundation, deployment, basic walkthroughs)

### Story 12.1: Phase Navigator Component

**Points:** 9
**Priority:** High
**FR Coverage:** FR100, FR106

**User Story:**
As a council officer exploring AWS scenarios, I want a persistent phase navigator showing my journey through TRY → WALK THROUGH → EXPLORE so I always know where I am and what's ahead.

**Acceptance Criteria:**

```gherkin
Feature: Phase Navigator Component
  As a council officer
  I want persistent journey navigation
  So I always know my location and can plan my exploration

  Background:
    Given the user has selected a scenario
    And the scenario detail page is displayed

  Scenario: Navigator displays three-phase journey structure
    Then the phase navigator shows "TRY", "WALK THROUGH", and "EXPLORE" phases
    And each phase displays estimated time ("5 min", "10 min", "15+ min")
    And the current phase shows a "You are here" indicator
    And completed phases show a completion checkmark
    And phase states sync with URL parameters for shareable progress

  Scenario: Cost reassurance appears first in navigator
    When the navigator is displayed
    Then the first visible line states "This demo costs nothing to deploy"
    And council-familiar terminology is used throughout
    And benefit microcopy appears under each phase name

  Scenario: Journey preview on scenario cards
    Given the user is on the scenario gallery page
    Then each scenario card displays a "3 phases" badge
    And the CTA text reads "Start Free Journey · 15 min"

  Scenario: Navigator on deployment progress page
    Given a deployment is in progress
    Then the navigator shows "TRY" phase as active
    And time remaining updates in real-time
    And the next phase ("WALK THROUGH") shows preview benefit

  Scenario: Branching visual for Explore phase
    When viewing the post-walkthrough navigation
    Then the navigator shows Evidence Pack as the main path
    And "Go Deeper" (Explore) appears as an optional fork
    And a branching visual indicates the non-linear choice

  Scenario: Transition CTA at walkthrough completion
    Given the user completes a walkthrough
    Then a prominent CTA invites them to the next phase
    And the CTA includes benefit text for what they'll learn

  Scenario: Navigator handles parallel entry
    Given the user navigates directly to a walkthrough URL
    When the deployment has not been completed
    Then the navigator detects missing deployment state
    And prompts the user to start from the TRY phase

  Scenario: Navigator handles stale session
    Given a CloudFormation stack has expired
    When the user returns to continue their journey
    Then the navigator shows "Stack expired" status
    And offers re-deployment or zero-deployment options

  Scenario: Mobile responsive design
    Given a mobile viewport (< 768px)
    Then the navigator displays as sticky bottom bar
    And safe area insets are applied (env(safe-area-inset-*))
    And touch targets are minimum 44x44px

  Scenario: Full accessibility compliance
    Then the navigator uses <nav role="navigation" aria-label="Journey progress">
    And current phase has aria-current="step"
    And completed phases have aria-label including "completed"
    And the navigator is keyboard navigable
    And colour is not the only indicator of state

  Scenario: No-JavaScript fallback
    Given JavaScript is disabled
    Then a <noscript> message displays: "Enable JavaScript for journey tracking"
    And static links remain functional

  Scenario: Loading states
    When the navigator is initializing
    Then skeleton screens display placeholder content
    And no layout shift occurs when content loads

  Scenario: Analytics event capture
    When the user progresses between phases
    Then events "journey_phase_changed" and "journey_drop_off" fire
    And journey_completion_rate metric is tracked (target >60%)
```

**Technical Notes:**
- Implement as reusable `_includes/components/phase-navigator.njk`
- Apply to 18+ pages across scenarios, walkthroughs, and exploration
- Use GOV.UK Step-by-step navigation pattern as reference
- State stored in URL parameters (shareable) with sessionStorage backup
- Component designed for reuse in Epic 6-11 exploration phases
- Breadcrumbs removed (navigator replaces this function)
- Time remaining calculated from phase start timestamp

**Elicitation Refinements Applied:**
- Decision Matrix: Merged 12.4 testing story into this story
- Empathy Map: Added cost-first messaging, council terminology
- Journey Mapping: Added scenario card preview, deployment page integration
- Six Thinking Hats: Added "Go Deeper" label, responsive AC
- Pre-mortem: Added benefit microcopy, transition CTAs
- Red Team: Added parallel entry, tab confusion, stale session defenses
- SCAMPER: URL parameters, time remaining, GOV.UK adaptation
- Fishbone: Added noscript, skeleton screens, drop-off analytics

---

### Story 12.2: Sample Data Explanation Panels

**Points:** 3
**Priority:** High
**FR Coverage:** FR101

**User Story:**
As a council officer exploring scenarios, I want contextual explanations of sample data so I understand it's realistic demonstration data and not connected to real systems.

**Acceptance Criteria:**

```gherkin
Feature: Sample Data Explanation Panels
  As a council officer
  I want to understand sample data context
  So I don't confuse it with real council data

  Background:
    Given the user is viewing a walkthrough or exploration page
    And sample data is displayed or referenced

  Scenario: GOV.UK Details component for explanations
    When sample data is shown
    Then a GOV.UK Details component is positioned near the data
    And the summary text reads "About this sample data"
    And key information remains visible (not collapsed)

  Scenario: Contextual placement
    Given multiple sample data types exist on a page
    Then each data type has its own explanation panel
    And panels are positioned within visual proximity of the data
    And button proximity is maintained for related actions

  Scenario: Explanation content
    When the user expands the details component
    Then it explains the data is realistic but fictional
    And describes what the data represents
    And clarifies no connection to real council systems
    And provides the data generation methodology

  Scenario: Consistent messaging across scenarios
    Given any scenario with sample data
    Then explanation panels use consistent terminology
    And formatting matches GOV.UK Design System
    And tone remains reassuring and professional

  Scenario: Accessibility compliance
    Then explanation panels meet WCAG 2.1 AA
    And expand/collapse state is announced to screen readers
    And keyboard operation is fully supported
```

**Technical Notes:**
- Use GOV.UK Details component (`govuk-details`)
- Key info inline (not collapsed) per Pre-mortem analysis
- Placement: near "Re-seed" buttons and data displays
- Content sourced from `src/_data/sample-data-config.yaml`

**Elicitation Refinements Applied:**
- Empathy Map: Council-familiar language
- Pre-mortem: Key info inline, not hidden
- Red Team: Button proximity for actions
- Fishbone: Loading states, consistent terminology

---

### Story 12.3: Enhanced Static Data Presets (DEFERRED)

**Status:** Moved to Phase 2 Backlog
**FR Coverage:** FR102 (deferred)

**Deferral Rationale (First Principles Analysis):**
The fundamental user need is understanding what sample data is, not choosing between presets. Current single dataset adequately demonstrates scenario capabilities. Adding presets introduces unnecessary complexity without addressing the core navigation and clarity gaps identified in PRD v1.2.

**Phase 2 Consideration:** If user research indicates demand for data variety, implement as dropdown selector with 3-5 council-type presets.

---

## FR Coverage Matrix - Extension

| FR # | Title | Epic | Story | Status |
|------|-------|------|-------|--------|
| FR57 | Exploration section per scenario | Epic 6-11 | Stories X.1 | ✓ |
| FR58 | Persona-categorized activities | Epic 6-11 | Stories X.1 | ✓ |
| FR59 | Activity structure (objective, steps, outcome) | Epic 6-11 | Stories X.2-X.4 | ✓ |
| FR60 | Activity sequencing | Epic 6-11 | Stories X.1 | ✓ |
| FR61 | Annotated screenshots | Epic 6-11 | Stories X.2-X.5 | ✓ |
| FR62 | Playwright screenshot automation | Epic 6-11 | Stories X.6 | ✓ |
| FR63 | Screenshot alt text | Epic 6-11 | Stories X.6 | ✓ |
| FR64 | Pretty web page alternatives | Epic 6-11 | Stories X.2-X.4 | ✓ |
| FR65 | "What If?" experiments | Epic 6-11 | Stories X.2 | ✓ |
| FR66 | Reset to default option | Epic 6-11 | Stories X.2 | ✓ |
| FR67 | Reversible vs. permanent indication | Epic 6-11 | Stories X.2 | ✓ |
| FR68 | Before/after business impact | Epic 6-11 | Stories X.2 | ✓ |
| FR69 | Behind the scenes tour | Epic 6-11 | Stories X.3 | ✓ |
| FR70 | Visual tour vs. console tour | Epic 6-11 | Stories X.3 | ✓ |
| FR71 | "What is this?" explainers | Epic 6-11 | Stories X.3 | ✓ |
| FR72 | Safe failure exercises | Epic 6-11 | Stories X.4 | ✓ |
| FR73 | Business implication explanations | Epic 6-11 | Stories X.4 | ✓ |
| FR74 | Recovery instructions | Epic 6-11 | Stories X.4 | ✓ |
| FR75 | Production considerations | Epic 6-11 | Stories X.5 | ✓ |
| FR76 | Partner customization suggestions | Epic 6-11 | Stories X.5 | ✓ |
| FR77 | Next steps distinction | Epic 6-11 | Stories X.5 | ✓ |
| FR78 | Chatbot-specific exploration | Epic 6 | Stories 6.2-6.5 | ✓ |
| FR79 | Planning AI-specific exploration | Epic 7 | Stories 7.2-7.5 | ✓ |
| FR80 | Equivalent depth all scenarios | Epic 6-11 | All stories | ✓ |
| FR100 | Phase Navigator Component | Epic 12 | Story 12.1 | ✓ |
| FR101 | Sample Data Explanation | Epic 12 | Story 12.2 | ✓ |
| FR102 | Enhanced Static Data Presets | - | - | Deferred to Phase 2 |
| FR106 | Journey Progress Analytics | Epic 12 | Story 12.1 | ✓ |

---

## Summary - Extension

**Total Epics:** 12 (5 original MVP + 6 exploration + 1 navigation clarity)
**Total Stories:** 64 (26 original + 36 exploration + 2 navigation clarity)
**Total FRs Covered:** 83 (56 original + 24 exploration + 3 navigation clarity)
**FRs Deferred:** FR102 (data presets), FR103-105 (Lambda generation) → Phase 2/3

**Extension Dependencies:**
- Epic 6-11 depend on Epic 2 (deployment working) and Epic 3 (basic walkthroughs existing)
- Each exploration epic is independent of other exploration epics
- **Epic 12 is independent** and can be implemented in parallel with other work
- Recommend implementing Epic 6 (Council Chatbot) first as pilot

**Extension Timeline:**
- Epic 6: Pilot implementation (validates framework)
- Epic 7-11: Parallel implementation using Epic 6 as template
- **Epic 12: Can be implemented immediately (no dependencies on Epic 6-11)**

**Story Points Summary:**
| Epic | Stories | Points |
|------|---------|--------|
| Epic 1-5 | 26 | ~78 |
| Epic 6-11 | 36 | ~108 |
| **Epic 12** | **2** | **12** |
| **Total** | **64** | **~198** |

---

_Extension created: 2025-11-28_
_PRD v1.2 extension added: 2025-11-29 (Epic 12: Navigation & Sample Data Clarity)_
_This extension adds comprehensive hands-on exploration capabilities to transform NDX:Try from evaluation tool to learning platform, with clear journey navigation throughout._

---

# PRD v1.3/v1.4 Extension: Screenshot Automation Infrastructure & Journey Testing

**Date Added:** 2025-11-29
**FRs Covered:** FR107-FR123 (17 new FRs)
**NFRs Covered:** NFR48-NFR58 (11 new NFRs)

---

## Sprint 0: Screenshot Automation Infrastructure

**Goal:** Establish shared AWS Federation and Playwright infrastructure enabling automated screenshot capture across all 6 scenarios
**User Value:** "Documentation screenshots are always accurate and up-to-date because they come from passing E2E tests"
**FRs Covered:** FR107-FR115, FR120-FR123

**CRITICAL:** Sprint 0 MUST complete before Epic 6 begins. Epic 6-11 screenshot stories (Story X.6) depend on this infrastructure.

**Investment Model:**
- Sprint 0 adds 26 points but saves 30 points across Epic 6-11 (5 points × 6 epics)
- **Net reduction:** 4 story points while making screenshot automation viable

---

### Story S0.1: AWS Federation Service Account Setup (5 points)

**As a** DevOps engineer setting up the screenshot automation pipeline,
**I want** a dedicated IAM service account with scoped federation permissions,
**So that** the automation can access AWS Console for screenshots without using privileged credentials.

**Acceptance Criteria:**

**Given** the ndx-screenshot-automation project needs console access
**When** the federation service account is configured
**Then** the following are in place:
- IAM user `ndx-screenshot-automation` created with `sts:GetFederationToken` permission only
- Federation policy JSON enforces read-only console access (no modify/delete)
- Region restriction to `us-west-2` and `us-west-2` only (NOT us-west-2)
- Access keys stored in AWS Secrets Manager with 90-day rotation policy
- CloudTrail logging enabled for all federation sessions
- Documentation of credential rotation procedure in `docs/ops/federation-credentials.md`

**And** the federation policy includes explicit denies:
```json
{
  "Effect": "Deny",
  "Action": ["*:Create*", "*:Delete*", "*:Update*", "iam:*", "organizations:*"],
  "Resource": "*"
}
```

**Prerequisites:** None (first Sprint 0 story)

**Technical Notes:**
- FR107: GetFederationToken with DurationSeconds: 3600 (1 hour max)
- NFR48: Explicit deny on all modify/delete actions
- NFR49: Server-side only - credentials never exposed in client code
- NFR50: 1-hour session max, no refresh capability

---

### Story S0.2: Playwright Integration Library (8 points)

**As a** test engineer writing screenshot automation,
**I want** a reusable library that handles AWS Console authentication via federation,
**So that** I can write Playwright tests that navigate authenticated console pages.

**Acceptance Criteria:**

**Given** valid AWS federation credentials are configured
**When** calling `openAwsConsoleInPlaywright(destination)`
**Then** the function:
- Calls STS GetFederationToken with scoped policy
- Exchanges credentials for SigninToken via `https://signin.aws.amazon.com/federation`
- Constructs Login URL with SigninToken and destination
- Opens Chromium browser and navigates to Login URL
- Waits for network idle and returns authenticated Page object
- Handles rate limits with exponential backoff (3 retries)

**And** the library exports TypeScript interfaces:
```typescript
interface FederatedCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

function openAwsConsoleInPlaywright(
  destination?: string  // defaults to us-west-2 console home
): Promise<{ browser: Browser; page: Page }>;
```

**And** proper cleanup is handled:
- Browser context closed after batch
- No credential persistence between sessions
- Session tokens not logged or cached

**Prerequisites:** Story S0.1 (federation service account exists)

**Technical Notes:**
- FR108: SigninToken generation via federation endpoint
- FR109: Console Login URL construction
- FR110: Playwright browser session management
- FR123: Integration pattern for console screenshot capture
- Library location: `src/lib/aws-federation.ts`

---

### Story S0.3: Screenshot Capture Pipeline (5 points)

**As a** CI/CD engineer,
**I want** an automated pipeline that captures screenshots on schedule,
**So that** documentation images are refreshed without manual intervention.

**Acceptance Criteria:**

**Given** the Playwright integration library is available
**When** the screenshot pipeline runs
**Then** it:
- Processes all 6 scenarios sequentially (avoids rate limits)
- Captures minimum 15 screenshots per scenario per FR120 requirements
- Uploads screenshots to S3 with versioning enabled
- Generates JSON manifest with metadata (timestamp, scenario, page, dimensions)
- Sends SNS/Slack notification on completion or failure
- Completes full batch within 30 minutes (NFR52)

**And** the pipeline supports multiple triggers:
- Manual invocation via GitHub Actions workflow dispatch
- Scheduled weekly runs (Saturday 03:00 UTC)
- Post-deployment trigger after CloudFormation template changes

**And** error handling includes:
- Retry failed page loads 3 times with 5-second delays
- Circuit breaker: halt if >50% screenshots fail in batch
- Detailed CloudWatch logs with 30-day retention

**Prerequisites:** Story S0.2 (Playwright library available)

**Technical Notes:**
- FR111: Screenshot orchestration as scheduled pipeline
- NFR51: 95%+ success rate target
- NFR52: 30-second per-screenshot max, 30-minute full batch
- Pipeline location: `.github/workflows/screenshot-automation.yml`

---

### Story S0.4: Visual Regression Detection (5 points)

**As a** documentation maintainer,
**I want** automated detection of screenshot drift,
**So that** I'm alerted when AWS Console UI changes break documentation accuracy.

**Acceptance Criteria:**

**Given** new screenshots are captured
**When** compared to baseline images
**Then** the system:
- Uses pixelmatch or similar for pixel-level comparison
- Flags screenshots with >10% pixel difference for review
- Auto-fails tests with >15% difference (NFR56)
- Generates visual diff report showing changed regions
- Requires manual approval before replacing baseline
- Tags screenshots with CloudFormation template version

**And** the baseline management includes:
- S3 bucket with versioning (last 10 versions retained)
- Lifecycle policy: versions >90 days transition to Glacier
- Cross-region replication for DR

**And** monitoring dashboards show:
- `screenshot_success_count` metric
- `screenshot_failure_count` metric
- `screenshot_drift_detected` metric
- Alerts when success rate <90% or drift >20%

**Prerequisites:** Story S0.3 (pipeline generates screenshots)

**Technical Notes:**
- FR112: Visual regression detection with pixelmatch
- NFR53: S3 retention policy (10 versions, 90-day Glacier transition)
- NFR54: CloudWatch metrics and alerting
- NFR56: Automatic refresh on successful test runs

---

### Story S0.5: Reference Deployment Environment (3 points)

**As a** screenshot automation engineer,
**I want** a dedicated reference deployment stack,
**So that** screenshots are captured from a controlled environment, not user deployments.

**Acceptance Criteria:**

**Given** screenshot automation needs consistent source data
**When** the reference environment is configured
**Then** it includes:
- Dedicated AWS account/stack for screenshots (separate from user sandboxes)
- Same CloudFormation templates as user deployments (version aligned)
- Known-good sample data preloaded for each scenario
- Stack maintained in COMPLETE state during screenshot windows
- Automated stack verification before capture begins

**And** fallback screenshots are available:
- Static screenshots stored with `fallback/` prefix in S3
- Disclaimer text: "Screenshot from reference deployment (captured [date]). Your deployment may vary."
- Fallback served when live stack unavailable

**And** resource discovery is dynamic:
- Console URLs built from stack outputs (not hardcoded ARNs)
- Example: `ChatbotLambdaArn` stack output → Lambda console URL

**Prerequisites:** Story S0.4 (visual regression in place)

**Technical Notes:**
- FR113: Stack-aware screenshot capture with dynamic resource discovery
- FR114: Fallback screenshot library for stack-agnostic alternatives
- FR115: Screenshot automation independent of user deployments

---

## Epic 1 Enhancement: Quiz-to-Guide Navigation (FR116-FR117)

**Enhancement to Story 1.2: Scenario Selector Quiz**

**Additional Acceptance Criteria for Story 1.2:**

**Given** the user completes the Scenario Selector quiz
**When** viewing the results page
**Then** each recommended scenario card includes:
- "View Guide" primary action button (green, prominent)
- "Deploy Now" secondary action button (for users ready to skip guide)
- Direct link to scenario's walkthrough landing page (one click, no menus)
- Scenario name, brief description, estimated time

**And** the navigation follows FR116-FR117:
- Clear visual hierarchy: Quiz Results → Recommended Scenarios → [View Guide] → Walkthrough
- "View All Scenarios" link for users wanting to explore beyond recommendations
- No intermediate steps between quiz results and guide access

**Technical Notes:**
- FR116: Quiz results → View Guide buttons
- FR117: Direct walkthrough access from Solution Finder
- Update `src/quiz.md` and quiz results component

---

## Cross-Cutting Enhancement: Zero-Cost Messaging (FR118-FR119)

**Applies to:** All epics displaying cost information

**New Acceptance Criteria (Cross-Cutting):**

**Given** any page displays cost estimates
**When** rendering the cost information
**Then** the display includes Innovation Sandbox zero-cost clarification:
- Scenario cards: "Estimated production cost: £X/month | **Free in Innovation Sandbox**"
- Deployment pages: "No charges apply - this deploys to the free Innovation Sandbox"
- Exploration pages: "All activities in this section are **free to explore**"
- Evidence Pack: Cost projections labeled "Estimated production costs if deployed to your AWS account"

**And** the homepage (FR119) prominently displays:
- Hero section: "Try AWS services for **free** in the Innovation Sandbox"
- Cost anxiety addressed above-the-fold
- Clear distinction between "free to try" and "production costs"

**And** compliance is auditable (NFR57):
- Monthly review of all pages mentioning costs
- 100% of cost mentions include sandbox clarification

**Technical Notes:**
- FR118: Cost display + zero-cost clarification everywhere
- FR119: Homepage zero-cost messaging
- NFR57: Monthly audit compliance
- NFR58: Quarterly cost estimate accuracy verification (±20%)

---

## Epic Enhancement: Playwright E2E Testing Strategy (FR120-FR123)

**Applies to:** All scenarios (Epic 1-5, Epic 6-11)

**New Testing Requirements:**

**Given** the dual-purpose testing strategy from PRD v1.4
**When** implementing any scenario walkthrough or exploration page
**Then** corresponding Playwright E2E tests MUST:
- Validate the complete user journey (deployment → cleanup)
- Capture screenshots as test byproducts (`await page.screenshot()`)
- Be structured per scenario:
```
tests/e2e/scenarios/{scenario-id}/
├── journey.spec.ts          # Full E2E journey test
├── walkthrough.spec.ts      # Step-by-step walkthrough validation
├── console-views.spec.ts    # AWS Console screenshot tests (uses federation)
└── screenshots/             # Output directory for captured images
```

**And** the testing principle is enforced (NFR55-NFR56):
- Screenshots cannot exist without passing tests
- Failed tests block merge AND screenshot publication
- 100% of documented walkthrough steps have test assertions
- No manual screenshots allowed - all must come from Playwright

**And** AWS Console screenshots use federation:
```typescript
test('capture Lambda console view', async () => {
  const { browser, page } = await openAwsConsoleInPlaywright(
    `https://us-west-2.console.aws.amazon.com/lambda/home#/functions/${lambdaArn}`
  );
  await page.waitForSelector('[data-testid="function-overview"]');
  await page.screenshot({ path: 'screenshots/lambda-console.png' });
  await browser.close();
});
```

**Technical Notes:**
- FR120: Screenshots from Playwright E2E tests
- FR121: Demo videos with structured format (8-10 min)
- FR122: Playwright E2E test suite per scenario
- FR123: Playwright + AWS Federation integration
- NFR55: Tests are single source of truth
- NFR56: Automatic screenshot refresh on passing tests

---

## FR Coverage Matrix - v1.3/v1.4 Extension

| FR # | Title | Epic/Sprint | Story | Status |
|------|-------|-------------|-------|--------|
| FR107 | AWS STS GetFederationToken | Sprint 0 | S0.1 | ✓ |
| FR108 | SigninToken generation | Sprint 0 | S0.2 | ✓ |
| FR109 | Console Login URL construction | Sprint 0 | S0.2 | ✓ |
| FR110 | Playwright browser session management | Sprint 0 | S0.2 | ✓ |
| FR111 | Screenshot orchestration pipeline | Sprint 0 | S0.3 | ✓ |
| FR112 | Visual regression detection | Sprint 0 | S0.4 | ✓ |
| FR113 | Stack-aware screenshot capture | Sprint 0 | S0.5 | ✓ |
| FR114 | Fallback screenshot library | Sprint 0 | S0.5 | ✓ |
| FR115 | Screenshots independent of user deployments | Sprint 0 | S0.5 | ✓ |
| FR116 | Quiz results → View Guide buttons | Epic 1 | 1.2 (enhancement) | ✓ |
| FR117 | Solution Finder direct walkthrough access | Epic 1 | 1.2 (enhancement) | ✓ |
| FR118 | Zero-cost messaging on all cost displays | Cross-cutting | All cost pages | ✓ |
| FR119 | Homepage zero-cost messaging | Epic 1 | 1.1 (enhancement) | ✓ |
| FR120 | Screenshots from Playwright E2E tests | Sprint 0 + All | S0.3 + All scenarios | ✓ |
| FR121 | Demo videos with structured format | Epic 2 | 2.4 (enhancement) | ✓ |
| FR122 | Playwright E2E test suite per scenario | Sprint 0 + All | S0.3 + All scenarios | ✓ |
| FR123 | Playwright + AWS Federation integration | Sprint 0 | S0.2 | ✓ |

---

## Summary - v1.3/v1.4 Extension

**Sprint 0 Added:** 5 stories, 26 story points
**Epic Enhancements:** 4 (Epic 1.1, 1.2, 2.4 + cross-cutting zero-cost)
**New FRs Covered:** FR107-FR123 (17 FRs)
**New NFRs Covered:** NFR48-NFR58 (11 NFRs)

**Updated Totals:**

| Category | Before | v1.3/v1.4 | Total |
|----------|--------|-----------|-------|
| Epics | 12 | +Sprint 0 | **12 + Sprint 0** |
| Stories | 64 | +5 (Sprint 0) | **69 stories** |
| FRs Covered | 83 | +17 | **100 FRs** |
| Story Points | ~198 | +26 (Sprint 0) -30 (Epic 6-11) | **~194 points** |

**Sprint 0 Dependencies:**
- Sprint 0 MUST complete before Epic 6 begins
- Epic 6-11 Story X.6 (Screenshot Automation) now USES Sprint 0 infrastructure
- Story X.6 reduced from 5 points to 0 points (work moved to Sprint 0)

**Key Implementation Notes:**
1. **Region:** All deployments use us-west-2 or us-west-2 (NOT London/us-west-2)
2. **Zero-Cost:** NDX:Try Innovation Sandbox is FREE - displayed costs are indicative only
3. **Testing:** Screenshots are byproducts of passing Playwright tests - no manual screenshots

---

_PRD v1.3 extension added: 2025-11-29 (Sprint 0: AWS Federation Screenshot Automation)_
_PRD v1.4 extension added: 2025-11-29 (User Journey Clarity & Comprehensive Testing)_
_This extension makes screenshot automation viable and ensures documentation accuracy through test-driven screenshot capture._

---

## Epic Extension: Screenshot Integration & Navigation (v1.5)

**Added:** 2025-11-29
**PRD Reference:** PRD Extension v1.5 (FR124-FR150, NFR59-NFR66)
**Prerequisite:** Sprint 0 Complete ✓

This extension adds 4 comprehensive epics to integrate Sprint 0's screenshot automation infrastructure into the portal's walkthrough pages and improve navigation.

---

## Epic 13: Screenshot Content Population

**Goal:** Integrate real AWS Console screenshots into all walkthrough pages, replacing placeholders with automated screenshots from Sprint 0 infrastructure.

**User Value:** Users see actual AWS Console screenshots that match their deployment experience, building confidence and reducing confusion during walkthroughs.

**FR Coverage:** FR124, FR125, FR126, FR127, FR128, FR146, FR147, FR148

### Story 13.1: Screenshot Component with Metadata Display

As a **council officer**,
I want **screenshots to display metadata about when and where they were captured**,
So that **I can trust the screenshots are current and match my environment**.

**Acceptance Criteria:**

**Given** a walkthrough page with a screenshot component
**When** the page renders
**Then** the screenshot displays:
- Capture date in human-readable format (e.g., "Captured 15 Nov 2025")
- CloudFormation template version (e.g., "Template v2.1.0")
- AWS region (e.g., "us-west-2 (London)")

**And** metadata appears as subtle caption below image with expandable details
**And** metadata font size is 12px, grey (#6f777b), not overwhelming
**And** clicking metadata expands to show full ISO timestamp and template commit SHA

**Prerequisites:** None (First story in Epic 13)

**Technical Notes:**
- Create `/src/_includes/components/screenshot.njk` component
- Screenshot data sourced from `/src/_data/screenshots/{scenario}.yaml`
- Metadata pulled from S3 object metadata or accompanying JSON manifest
- Component accepts: `scenario`, `step`, `id`, `showMetadata` (boolean)
- FR125: Metadata display requirements

---

### Story 13.2: Screenshot Data Files for All 6 Scenarios

As a **portal maintainer**,
I want **screenshot configuration in YAML data files**,
So that **I can manage screenshot mappings without code changes**.

**Acceptance Criteria:**

**Given** the need to configure screenshots across 6 scenarios
**When** I create YAML configuration files
**Then** each scenario has a dedicated file at `/src/_data/screenshots/{scenario}.yaml`

**And** each file follows the structure:
```yaml
scenario: council-chatbot
scenario_name: "Council Chatbot"
steps:
  step-1:
    screenshots:
      - id: bedrock-agent-overview
        filename: council-chatbot-bedrock-agent-overview.png
        alt: "Amazon Bedrock agent configuration showing council knowledge base"
        caption: "The Bedrock agent that powers natural language understanding"
        order: 1
      - id: lambda-function
        filename: council-chatbot-lambda-function.png
        alt: "Lambda function handling chat requests"
        caption: "Serverless function processing user queries"
        order: 2
  step-2:
    # ...
explore:
  architecture:
    screenshots:
      - id: architecture-diagram
        # ...
```

**And** all 6 scenarios are covered:
- `council-chatbot.yaml` (5 steps + 4 explore pages)
- `planning-ai.yaml` (5 steps + 4 explore pages)
- `foi-redaction.yaml` (4 steps + 4 explore pages)
- `smart-car-park.yaml` (5 steps + 4 explore pages)
- `text-to-speech.yaml` (4 steps + 4 explore pages)
- `quicksight-dashboard.yaml` (5 steps + 4 explore pages)

**And** each screenshot entry includes:
- `id`: Unique identifier within scenario
- `filename`: Exact filename from S3 bucket
- `alt`: Descriptive alt text (max 125 chars)
- `caption`: Optional longer description
- `order`: Display order when multiple screenshots

**Prerequisites:** Story 13.1

**Technical Notes:**
- FR128: YAML configuration specification
- Filenames match Sprint 0 S3 bucket structure: `current/{scenario}/{filename}`
- Total ~120-150 screenshots across all scenarios
- Validate YAML schema on build

---

### Story 13.3: Council Chatbot Walkthrough Screenshot Integration

As a **council officer exploring AI chatbots**,
I want **each Council Chatbot walkthrough step to show relevant AWS Console screenshots**,
So that **I can follow along and understand what I'll see in my own deployment**.

**Acceptance Criteria:**

**Given** the Council Chatbot walkthrough pages
**When** I navigate through each step
**Then** each page displays contextually relevant screenshots:

**Step 1 (Getting Started):**
- Bedrock agent overview showing council chatbot configuration
- Knowledge base connection status

**Step 2 (Ask the Chatbot):**
- Chat interface in action
- Sample question/response displayed

**Step 3 (Explore Architecture):**
- Service diagram with Lambda, Bedrock, and S3 connections
- CloudWatch logs showing request flow

**Step 4 (Experiment):**
- Configuration panel for adjusting responses
- Before/after comparison of outputs

**Step 5 (Clean Up):**
- CloudFormation stack deletion confirmation
- Empty resource view after cleanup

**And** explore pages show:
- Architecture: Detailed service interconnection diagram
- Experiments: Parameter configuration screens
- Limits: Error states and boundary conditions
- Production: Production-ready configuration

**And** screenshots use the `screenshot` component from Story 13.1
**And** fallback displays if any screenshot is unavailable

**Prerequisites:** Stories 13.1, 13.2

**Technical Notes:**
- FR124: Each walkthrough step has at least one screenshot
- FR126: Explore pages show annotated screenshots
- Update existing templates in `/src/walkthroughs/council-chatbot/`
- Reference Sprint 0 captured images

---

### Story 13.4: Planning AI Walkthrough Screenshot Integration

As a **council officer exploring planning automation**,
I want **each Planning AI walkthrough step to show AWS Console screenshots**,
So that **I can understand the document processing and extraction workflow**.

**Acceptance Criteria:**

**Given** the Planning AI walkthrough pages
**When** I navigate through each step
**Then** screenshots show:

**Step 1:** Textract overview, S3 bucket with sample documents
**Step 2:** Document upload interface, processing status
**Step 3:** Extraction results, classified fields
**Step 4:** Confidence scores, manual review interface
**Step 5:** Cleanup confirmation, resource deletion

**And** explore pages display appropriate screenshots
**And** all screenshots have alt text and captions

**Prerequisites:** Stories 13.1, 13.2

**Technical Notes:**
- FR124: Screenshot coverage requirements
- Update `/src/walkthroughs/planning-ai/` templates

---

### Story 13.5: FOI Redaction Walkthrough Screenshot Integration

As a **council officer exploring FOI compliance**,
I want **each FOI Redaction walkthrough step to show AWS Console screenshots**,
So that **I can see how automatic redaction identifies and removes sensitive information**.

**Acceptance Criteria:**

**Given** the FOI Redaction walkthrough pages
**When** I navigate through each step
**Then** screenshots show:

**Step 1:** Comprehend PII detection configuration
**Step 2:** Document upload with sample FOI request
**Step 3:** Redaction results with highlighted sensitive data
**Step 4:** Cleanup and resource removal

**And** explore pages show annotation examples
**And** sensitive data in screenshots is already redacted (safe for public display)

**Prerequisites:** Stories 13.1, 13.2

**Technical Notes:**
- FR124: Screenshot coverage
- Ensure sample documents don't contain real PII
- Update `/src/walkthroughs/foi-redaction/` templates

---

### Story 13.6: Smart Car Park IoT Walkthrough Screenshot Integration

As a **council officer exploring IoT solutions**,
I want **each Smart Car Park walkthrough step to show AWS IoT Console screenshots**,
So that **I can understand the sensor data flow and dashboard visualization**.

**Acceptance Criteria:**

**Given** the Smart Car Park walkthrough pages
**When** I navigate through each step
**Then** screenshots show:

**Step 1:** IoT Core thing registration, device shadow
**Step 2:** Sensor data simulator sending occupancy data
**Step 3:** Real-time dashboard showing parking availability
**Step 4:** Alert configuration for capacity thresholds
**Step 5:** Cleanup and resource removal

**And** explore pages show IoT rule actions, Timestream queries

**Prerequisites:** Stories 13.1, 13.2

**Technical Notes:**
- FR124: Screenshot coverage
- Update `/src/walkthroughs/smart-car-park/` templates

---

### Story 13.7: Text-to-Speech Walkthrough Screenshot Integration

As a **council officer exploring accessibility tools**,
I want **each Text-to-Speech walkthrough step to show AWS Polly Console screenshots**,
So that **I can see how text is converted to natural-sounding speech**.

**Acceptance Criteria:**

**Given** the Text-to-Speech walkthrough pages
**When** I navigate through each step
**Then** screenshots show:

**Step 1:** Polly console voice selection
**Step 2:** Text input and synthesis configuration
**Step 3:** Audio playback interface, download options
**Step 4:** Cleanup and resource removal

**And** explore pages show SSML configuration, voice comparison

**Prerequisites:** Stories 13.1, 13.2

**Technical Notes:**
- FR124: Screenshot coverage
- Update `/src/walkthroughs/text-to-speech/` templates

---

### Story 13.8: QuickSight Dashboard Walkthrough Screenshot Integration

As a **council officer exploring analytics**,
I want **each QuickSight Dashboard walkthrough step to show AWS Console screenshots**,
So that **I can see how data visualization transforms raw council data into insights**.

**Acceptance Criteria:**

**Given** the QuickSight Dashboard walkthrough pages
**When** I navigate through each step
**Then** screenshots show:

**Step 1:** QuickSight dataset configuration
**Step 2:** Dashboard builder with sample council data
**Step 3:** Completed dashboard with charts and KPIs
**Step 4:** Sharing and embed options
**Step 5:** Cleanup and resource removal

**And** explore pages show advanced analysis features, Q&A natural language queries

**Prerequisites:** Stories 13.1, 13.2

**Technical Notes:**
- FR124: Screenshot coverage
- QuickSight requires dataset preparation
- Update `/src/walkthroughs/quicksight-dashboard/` templates

---

### Story 13.9: Click-to-Zoom Lightbox Component

As a **council officer viewing detailed screenshots**,
I want **to click on any screenshot to see it enlarged in a lightbox**,
So that **I can examine details without leaving the page**.

**Acceptance Criteria:**

**Given** a walkthrough page with screenshots
**When** I click on a screenshot (desktop) or tap (mobile)
**Then** a lightbox modal opens with:
- Full-size image (up to viewport size)
- Dark overlay behind modal
- Close button (X) in top-right corner
- Caption below image

**And** keyboard navigation works:
- Enter key triggers zoom when screenshot focused
- Escape key closes lightbox
- Tab key cycles through close button

**And** accessibility requirements met:
- Focus trap inside modal (can't Tab outside)
- `aria-modal="true"` attribute
- Close button has `aria-label="Close image"`
- Focus returns to triggering element on close

**And** mobile behavior:
- Full-screen native zoom on tap
- Pinch-to-zoom gestures supported
- Swipe down to close

**Prerequisites:** Story 13.1

**Technical Notes:**
- FR127: Click-to-zoom specification
- Create `/src/_includes/components/lightbox.njk`
- JavaScript in `/src/assets/js/lightbox.js`
- CSS in `/src/assets/css/_lightbox.scss`
- Test with VoiceOver and NVDA screen readers

---

### Story 13.10: Missing Screenshot Fallback Handling

As a **council officer viewing walkthroughs**,
I want **a graceful experience when screenshots are unavailable**,
So that **I'm not confused by broken images or empty spaces**.

**Acceptance Criteria:**

**Given** a walkthrough page where a screenshot is unavailable (S3 404)
**When** the page loads
**Then** a placeholder displays instead showing:
- Scenario-specific icon (not generic placeholder)
- Message: "Screenshot updating – please check back soon"
- Estimated availability (if known from capture schedule)

**And** the fallback:
- Uses same dimensions as expected screenshot
- Maintains page layout (no layout shift)
- Has appropriate alt text: "Screenshot currently being updated"

**And** analytics track:
- Fallback display event with scenario, step, screenshot ID
- Maintainer notification when >10 fallbacks triggered in 24 hours

**And** admin view shows:
- List of screenshots currently unavailable
- Last successful capture date per screenshot
- Link to trigger manual capture

**Prerequisites:** Stories 13.1, 13.2

**Technical Notes:**
- FR147: Missing screenshot handling
- Fallback images in `/src/assets/images/fallbacks/{scenario}.svg`
- Analytics event: `screenshot_fallback_displayed`
- CloudWatch alarm for high fallback rate

---

## Epic 14: Walkthrough Index & Navigation

**Goal:** Create a central walkthrough index page and enhance header navigation to improve content discoverability.

**User Value:** Users can easily find and browse all available walkthroughs from a single index, and persistent navigation makes moving between scenarios effortless.

**FR Coverage:** FR129, FR130, FR131, FR132, FR133, FR134, FR135, FR136

### Story 14.1: Walkthrough Index Page Layout and Cards

As a **council officer exploring AWS scenarios**,
I want **a single index page listing all walkthrough options**,
So that **I can browse and choose the most relevant scenario**.

**Acceptance Criteria:**

**Given** I navigate to `/walkthroughs/`
**When** the page loads
**Then** I see:
- Page title: "Scenario Walkthroughs"
- Subtitle: "Step-by-step guides for exploring AWS scenarios"
- 6 cards arranged in a responsive grid

**And** each card displays:
- Scenario name as heading
- Scenario icon/thumbnail
- Brief description (1-2 sentences)
- Step count badge (e.g., "5 steps")
- Estimated time (e.g., "15-20 minutes")
- Category badge (AI, IoT, Analytics)

**And** cards link to the walkthrough index for that scenario (e.g., `/walkthroughs/council-chatbot/`)
**And** grid is responsive:
- Desktop (>1024px): 3 columns
- Tablet (768-1024px): 2 columns
- Mobile (<768px): 1 column

**And** page includes GOV.UK breadcrumb: Home > Walkthroughs

**Prerequisites:** None (First story in Epic 14)

**Technical Notes:**
- FR129: Index page requirements
- FR130: Preview thumbnails
- Create `/src/walkthroughs/index.njk`
- Reuse card component style from scenario gallery
- Data from `/src/_data/scenarios.yaml`

---

### Story 14.2: Category Filtering and Badges

As a **council officer with specific interests**,
I want **to filter walkthroughs by category**,
So that **I can quickly find scenarios relevant to my needs**.

**Acceptance Criteria:**

**Given** the walkthrough index page
**When** I view the filter options
**Then** I see category filter buttons:
- All (default)
- AI (4 scenarios: Council Chatbot, Planning AI, FOI Redaction, Text-to-Speech)
- IoT (1 scenario: Smart Car Park)
- Analytics (1 scenario: QuickSight Dashboard)

**And** clicking a filter:
- Highlights the active filter button
- Shows only matching scenarios (with animation)
- Updates URL with query param (e.g., `?category=ai`)
- Updates page title to include filter (e.g., "AI Walkthroughs")

**And** category badges on cards:
- AI: Blue badge (#1d70b8)
- IoT: Green badge (#00703c)
- Analytics: Purple badge (#4c2c92)

**And** filter state persists on page refresh via URL

**Prerequisites:** Story 14.1

**Technical Notes:**
- FR131: Category badges
- Add `category` field to scenarios.yaml if not present
- JavaScript filter in `/src/assets/js/walkthrough-filter.js`
- Use govuk-tag styles for badges

---

### Story 14.3: Search Functionality for Walkthroughs

As a **council officer looking for specific capabilities**,
I want **to search walkthroughs by name or description**,
So that **I can find relevant scenarios without browsing**.

**Acceptance Criteria:**

**Given** the walkthrough index page
**When** I type in the search box
**Then** results filter in real-time as I type

**And** search matches against:
- Scenario name
- Scenario description
- AWS services used

**And** search behavior:
- Minimum 2 characters to trigger search
- Results update within 100ms
- Matching text highlighted in results
- Case-insensitive matching

**And** empty state when no matches:
- Message: "No walkthroughs match your search"
- "Clear search" button
- Suggestions: "Try searching for 'chatbot', 'AI', or 'dashboard'"

**And** search combines with category filters (AND logic)

**Prerequisites:** Stories 14.1, 14.2

**Technical Notes:**
- FR132: Search functionality
- Client-side search (no API needed for 6 items)
- Debounce input for performance
- Accessible: Label, aria-live for results count

---

### Story 14.4: Header Navigation Component with Dropdowns

As a **council officer navigating the portal**,
I want **a persistent header menu with dropdowns**,
So that **I can quickly access any section without returning to homepage**.

**Acceptance Criteria:**

**Given** any page in the portal
**When** I view the header
**Then** I see navigation items:
- Scenarios (dropdown)
- Walkthroughs (dropdown)
- Quiz (link)
- Get Started (link)

**And** "Scenarios" dropdown shows:
- All 6 scenarios with icons
- Links to scenario detail pages
- Brief one-line descriptions

**And** "Walkthroughs" dropdown shows:
- Grouped by category (AI, IoT, Analytics headers)
- Scenario names with step counts
- Links to walkthrough index per scenario

**And** dropdown behavior (desktop):
- Opens on hover with 150ms delay
- Stays open while mouse is over
- Closes on mouse leave

**And** dropdown styling:
- White background, subtle shadow
- Max-width 400px
- Z-index above page content

**Prerequisites:** None

**Technical Notes:**
- FR133: Persistent navigation requirements
- FR134: Scenarios dropdown
- FR135: Walkthroughs dropdown
- Update header partial in `_includes/layouts/base.njk` or use plugin config
- Follows GOV.UK Design System header patterns

---

### Story 14.5: Mobile Navigation (Hamburger Menu)

As a **council officer on a mobile device**,
I want **a hamburger menu for navigation**,
So that **I can access all sections without horizontal scrolling**.

**Acceptance Criteria:**

**Given** a viewport width < 768px
**When** the header renders
**Then** desktop nav items are replaced with hamburger icon (☰)

**And** tapping hamburger:
- Slides in full-height navigation panel from right
- Shows all navigation items vertically
- Category dropdowns become accordions (tap to expand)
- Close button (X) in panel header

**And** mobile nav includes:
- Search bar at top
- All nav items as tappable list
- Current page highlighted
- "Close menu" button

**And** accessibility:
- Menu announced to screen readers on open
- Focus trapped in menu while open
- Escape key closes menu
- Touch targets minimum 44x44px

**Prerequisites:** Story 14.4

**Technical Notes:**
- FR133: Mobile layout requirements
- GOV.UK mobile nav patterns
- JavaScript in `/src/assets/js/mobile-nav.js`
- Consider existing govuk-eleventy-plugin header behavior

---

### Story 14.6: Breadcrumb Navigation Component

As a **council officer deep in a walkthrough**,
I want **breadcrumb navigation showing my location**,
So that **I can easily navigate back to higher-level pages**.

**Acceptance Criteria:**

**Given** any walkthrough page
**When** I view the top of the content area
**Then** I see breadcrumbs in format:
- Home > Walkthroughs > {Scenario Name} > {Step Title}
- Home > Walkthroughs > {Scenario Name} > Explore > {Page}

**And** each breadcrumb segment:
- Is a clickable link
- Uses govuk-breadcrumbs styling
- Shows '>' separator between segments

**And** on mobile (<768px):
- Truncated to show "... > {Scenario} > {Current}"
- Ellipsis links to full breadcrumb trail
- Prevents horizontal overflow

**Prerequisites:** None

**Technical Notes:**
- FR136: Breadcrumb requirements
- Use govuk-breadcrumbs component
- Add `breadcrumbs` data to walkthrough templates
- Consider automatic breadcrumb generation from page path

---

### Story 14.7: Navigation Active State Highlighting

As a **council officer browsing the portal**,
I want **the current section highlighted in navigation**,
So that **I always know where I am in the site**.

**Acceptance Criteria:**

**Given** I'm viewing any page in the portal
**When** I look at the header navigation
**Then** the current section is visually highlighted:
- Underline or background highlight on active item
- Different text color/weight

**And** highlighting applies correctly:
- `/scenarios/*` → Scenarios highlighted
- `/walkthroughs/*` → Walkthroughs highlighted
- `/quiz/*` → Quiz highlighted
- `/get-started/` → Get Started highlighted

**And** dropdown parent highlighted when child page active
**And** mobile nav shows same highlighting

**Prerequisites:** Story 14.4

**Technical Notes:**
- FR133: Active state requirements
- JavaScript to detect current path
- CSS class `.govuk-header__navigation-item--active`

---

## Epic 15: Scenario-Walkthrough Linking

**Goal:** Create bidirectional connections between scenario pages and their walkthroughs.

**User Value:** Users can seamlessly move between learning about a scenario and experiencing it hands-on, with their progress tracked across sessions.

**FR Coverage:** FR137, FR138, FR139, FR140

### Story 15.1: "Start Walkthrough" CTA on Scenario Pages

As a **council officer viewing a scenario**,
I want **a prominent button to start the walkthrough**,
So that **I can immediately begin the hands-on experience**.

**Acceptance Criteria:**

**Given** any scenario detail page (e.g., `/scenarios/council-chatbot/`)
**When** the page loads
**Then** a "Start Walkthrough" button appears:
- Position: After scenario description, before deployment section
- Style: GOV.UK green button (primary CTA)
- Text: "Start walkthrough (5 steps)"
- Icon: Play triangle before text

**And** clicking the button:
- Navigates to walkthrough step 1 for that scenario
- Tracks analytics event `walkthrough_started`

**And** if user has started walkthrough previously:
- Button text changes to "Continue walkthrough (Step 3 of 5)"
- Secondary button: "Restart from beginning"

**Prerequisites:** None (First story in Epic 15)

**Technical Notes:**
- FR137: CTA requirements
- Add CTA to `/src/_includes/layouts/scenario.njk`
- Check localStorage for progress
- Analytics: `walkthrough_started`, `walkthrough_continued`

---

### Story 15.2: Walkthrough Progress Tracking (localStorage)

As a **council officer completing walkthroughs**,
I want **my progress saved between sessions**,
So that **I can resume where I left off**.

**Acceptance Criteria:**

**Given** I visit a walkthrough step page
**When** I complete viewing it
**Then** my progress is saved to localStorage:
```javascript
{
  "ndx-walkthrough-progress": {
    "council-chatbot": {
      "currentStep": 3,
      "totalSteps": 5,
      "completedSteps": [1, 2],
      "lastVisited": "2025-11-29T14:30:00Z",
      "startedAt": "2025-11-29T14:00:00Z"
    }
  }
}
```

**And** progress indicator shows on scenario page:
- Progress bar: "{N}% complete"
- Text: "Step {X} of {Y}"

**And** "Clear progress" button:
- Resets all progress for that scenario
- Requires confirmation ("Are you sure?")

**And** progress persists across browser sessions
**And** progress is per-scenario (independent tracking)

**Prerequisites:** Story 15.1

**Technical Notes:**
- FR138: Progress tracking requirements
- JavaScript in `/src/assets/js/progress-tracker.js`
- Consider showing progress on walkthrough pages too
- Handle localStorage unavailability gracefully

---

### Story 15.3: Walkthrough Completion Page Links

As a **council officer finishing a walkthrough**,
I want **clear next steps when I complete**,
So that **I know how to continue my evaluation journey**.

**Acceptance Criteria:**

**Given** I complete the final step of a walkthrough
**When** the completion page displays
**Then** I see:
- Success message: "Walkthrough complete! 🎉"
- Summary of what I experienced
- Clear CTAs:
  - Primary: "Generate Evidence Pack" (links to evidence pack form)
  - Secondary: "Return to {Scenario}" (links to scenario page)
  - Tertiary: "Try another scenario" (links to recommendations)

**And** "Try another scenario" shows:
- 2-3 recommended scenarios based on category
- If from quiz, shows other quiz recommendations
- Brief explanation why each is suggested

**And** completion tracked:
- Analytics event: `walkthrough_completed`
- LocalStorage progress marked complete
- Scenario page shows "Completed ✓"

**Prerequisites:** Stories 15.1, 15.2

**Technical Notes:**
- FR139: Completion links requirements
- Update walkthrough completion templates
- Integration with evidence pack system

---

### Story 15.4: Scenario Gallery Walkthrough Badges

As a **council officer browsing scenarios**,
I want **to see which scenarios have walkthroughs available**,
So that **I can prioritize interactive learning experiences**.

**Acceptance Criteria:**

**Given** the scenario gallery page (`/scenarios/`)
**When** I view scenario cards
**Then** cards with walkthroughs show:
- Badge: "Walkthrough available"
- Step count: "{N}-step guided tour"
- Play icon overlay on card image/icon

**And** badge styling:
- Positioned in top-right of card
- Uses govuk-tag with custom color
- Doesn't obscure scenario title

**And** clicking badge goes directly to walkthrough index
**And** clicking card still goes to scenario detail

**Prerequisites:** Story 14.1

**Technical Notes:**
- FR140: Gallery badge requirements
- Add `hasWalkthrough` flag to scenarios.yaml (or detect from walkthrough files)
- Update gallery card template

---

### Story 15.5: Cross-Scenario Recommendations on Completion

As a **council officer who completed a walkthrough**,
I want **intelligent recommendations for what to try next**,
So that **I can explore scenarios that match my interests**.

**Acceptance Criteria:**

**Given** I complete a walkthrough
**When** I view the completion page
**Then** "What's Next" section shows:
- 2-3 recommended scenarios
- Each with: Name, icon, brief description, "Start" button

**And** recommendations are personalized:
- If user took quiz → Show other quiz recommendations
- If same category available → Show related category scenarios
- If all in category done → Show different category

**And** recommendations adapt based on history:
- Don't recommend already-completed walkthroughs
- Prioritize not-yet-started scenarios

**And** fallback when all walkthroughs complete:
- Message: "You've explored all scenarios!"
- CTAs: Generate evidence pack, Return to scenarios, Contact partner

**Prerequisites:** Stories 15.2, 15.3

**Technical Notes:**
- FR139: Next scenario suggestions
- Recommendation logic in JavaScript
- Consider localStorage quiz results for personalization

---

## Epic 16: Visual Consistency & Accessibility

**Goal:** Ensure all screenshots meet accessibility standards and maintain visual consistency across the portal.

**User Value:** All users, including those with disabilities, can fully benefit from screenshot content with proper descriptions, annotations, and responsive sizing.

**FR Coverage:** FR141, FR142, FR143, FR144, FR145, FR149, FR150

### Story 16.1: Alt Text and Caption Audit/Population

As a **council officer using assistive technology**,
I want **all screenshots to have meaningful alt text**,
So that **I can understand image content through my screen reader**.

**Acceptance Criteria:**

**Given** all screenshots across walkthrough pages
**When** audited for accessibility
**Then** 100% have:
- Alt text: Descriptive, 125 characters max
- Alt describes content, not appearance
- Alt conveys same information as sighted users receive

**And** 100% have visible captions:
- 1-2 sentence description
- Provides context for screenshot
- Uses proper caption markup (`<figcaption>`)

**And** alt text patterns:
- GOOD: "Lambda function metrics showing 50 invocations in the last hour"
- BAD: "Screenshot of Lambda console" (describes appearance)
- BAD: "Image" (meaningless)

**And** audit deliverable:
- Spreadsheet of all screenshots
- Alt text for each
- Caption for each
- Checkbox: "Text-in-image also in body text?"

**Prerequisites:** Stories 13.2-13.8

**Technical Notes:**
- FR141: Accessibility requirements
- Populate alt/caption in screenshot YAML files
- Consider automated alt text generation as assist
- Manual review required for quality

---

### Story 16.2: Screenshot Annotation Component

As a **council officer learning AWS**,
I want **annotations on screenshots highlighting key areas**,
So that **I know where to look and what's important**.

**Acceptance Criteria:**

**Given** a walkthrough screenshot showing AWS Console
**When** annotations are enabled
**Then** overlay elements show:
- Numbered callout boxes (1, 2, 3...)
- Pointing arrows to key UI elements
- Brief labels (e.g., "Click here", "Your function name")

**And** annotation styling:
- Primary color: #1d70b8 (GOV.UK blue)
- Number circles: 24px, white text on blue
- Arrows: 2px stroke, filled arrowhead
- Labels: 14px, semi-transparent white background

**And** annotation accessibility:
- Contrast ratio 4.5:1 minimum
- Information not conveyed by color alone
- Legend below image explains each number

**And** annotation configuration in YAML:
```yaml
annotations:
  - number: 1
    x: 100
    y: 50
    label: "Function name"
    arrowDirection: "down"
  - number: 2
    x: 300
    y: 150
    label: "Invocation count"
```

**Prerequisites:** Story 13.1

**Technical Notes:**
- FR142: Annotation accessibility
- SVG overlay on screenshot
- Component: `/src/_includes/components/annotated-screenshot.njk`
- Consider CSS-only annotations vs SVG

---

### Story 16.3: Responsive Screenshot Sizing

As a **council officer on a tablet or phone**,
I want **screenshots to resize appropriately**,
So that **I can see them clearly on any device**.

**Acceptance Criteria:**

**Given** a walkthrough page with screenshots
**When** viewed at different breakpoints
**Then** screenshots respond:
- Desktop (>1024px): Full content column width (~640px)
- Tablet (768-1024px): Full width, aspect ratio maintained
- Mobile (<768px): Full width, pinch-to-zoom enabled

**And** image quality appropriate:
- Retina displays get 2x resolution images
- srcset attribute for responsive loading
- WebP with PNG fallback

**And** no layout shift:
- Explicit width/height attributes
- CSS aspect-ratio for placeholder
- Loading="lazy" for below-fold images

**Prerequisites:** Story 13.1

**Technical Notes:**
- FR143: Responsive requirements
- Use `<picture>` element with srcset
- Generate multiple sizes in build or from S3
- Test on actual devices, not just dev tools

---

### Story 16.4: WebP Conversion and Optimization

As a **council officer on slow connections**,
I want **screenshots to load quickly**,
So that **I'm not waiting for images while learning**.

**Acceptance Criteria:**

**Given** all screenshots in S3 bucket
**When** build/deployment runs
**Then** images are optimized:
- WebP format primary (85% quality)
- PNG fallback for unsupported browsers
- File size <500KB per image (target <200KB)

**And** optimization applied:
- Resize to max dimensions needed (1920×1080)
- Strip metadata
- Progressive loading for JPEG fallbacks

**And** browser caching:
- Cache-Control: max-age=604800 (1 week)
- ETag for cache validation
- CDN caching where applicable

**And** Lighthouse performance:
- LCP (Largest Contentful Paint) < 2.5s
- CLS (Cumulative Layout Shift) < 0.1

**Prerequisites:** Story 13.1

**Technical Notes:**
- FR144: Performance requirements
- Consider Sharp or imagemin for optimization
- GitHub Actions job for image processing
- S3 bucket already has lifecycle policies

---

### Story 16.5: Screenshot Gallery Component

As a **council officer viewing architecture pages**,
I want **multiple screenshots displayed in a gallery**,
So that **I can browse related images without excessive scrolling**.

**Acceptance Criteria:**

**Given** a page with multiple screenshots (e.g., architecture explore)
**When** gallery component is used
**Then** display shows:
- Thumbnail row at bottom (5-8 thumbnails visible)
- Main preview area above (large selected image)
- Previous/Next navigation arrows

**And** interaction:
- Click thumbnail to select
- Arrows cycle through images
- Keyboard: Left/Right arrows navigate
- Caption updates with selected image

**And** mobile behavior:
- Thumbnails become swipeable strip
- Main image supports swipe gestures
- Pinch-to-zoom on main image

**And** accessibility:
- Role="listbox" on thumbnail container
- Arrow key navigation
- Selected thumbnail announced
- Focus management proper

**Prerequisites:** Stories 13.1, 13.9

**Technical Notes:**
- FR145: Gallery requirements
- Component: `/src/_includes/components/screenshot-gallery.njk`
- JavaScript: `/src/assets/js/screenshot-gallery.js`
- Consider existing libraries vs custom

---

### Story 16.6: Accessibility Testing and Remediation

As a **council officer relying on accessibility features**,
I want **all screenshot content to be fully accessible**,
So that **I can use the portal regardless of ability**.

**Acceptance Criteria:**

**Given** all walkthrough pages with screenshots
**When** accessibility audit is performed
**Then** achieve:
- Lighthouse accessibility score: 95+
- axe-core: 0 critical/serious issues
- WAVE: 0 errors

**And** specific tests pass:
- All images have alt text ✓
- All captions visible ✓
- Click-to-zoom keyboard accessible ✓
- Focus visible on all interactive elements ✓
- Color contrast 4.5:1 minimum ✓
- No seizure-inducing content ✓

**And** screen reader testing:
- VoiceOver (macOS/iOS): All content accessible
- NVDA (Windows): All content accessible
- TalkBack (Android): All content accessible

**And** remediation documented:
- Issues found
- Fixes applied
- Before/after scores

**Prerequisites:** All Epic 13-14 stories

**Technical Notes:**
- FR141, FR142: Accessibility requirements
- NFR63, NFR64: Compliance requirements
- Automated testing in CI pipeline
- Manual testing with actual assistive tech

---

### Story 16.7: Navigation Keyboard Accessibility Audit

As a **council officer who navigates by keyboard**,
I want **all navigation elements keyboard accessible**,
So that **I can use the portal without a mouse**.

**Acceptance Criteria:**

**Given** header navigation component
**When** navigating by keyboard
**Then** all elements reachable:
- Tab cycles through top-level items
- Enter/Space opens dropdowns
- Arrow keys navigate within dropdowns
- Escape closes dropdowns
- Tab continues to next top-level item

**And** focus visible:
- All interactive elements have visible focus ring
- Focus ring has sufficient contrast
- Focus order logical (left to right, top to bottom)

**And** ARIA attributes correct:
- Dropdown triggers: `aria-expanded`, `aria-haspopup`
- Dropdown menus: `role="menu"`, `aria-labelledby`
- Menu items: `role="menuitem"`
- Current page: `aria-current="page"`

**And** mobile navigation accessible:
- Hamburger button properly labeled
- Menu panel announced on open
- Focus trapped in open menu

**Prerequisites:** Stories 14.4, 14.5

**Technical Notes:**
- NFR64: Navigation accessibility
- Test with keyboard only (no mouse)
- Test with screen reader
- Document focus order

---

## FR Coverage Matrix - v1.5 Extension

| FR # | Title | Epic | Story | Status |
|------|-------|------|-------|--------|
| FR124 | Walkthrough screenshots | Epic 13 | 13.3-13.8 | Pending |
| FR125 | Screenshot metadata | Epic 13 | 13.1 | Pending |
| FR126 | Explore page screenshots | Epic 13 | 13.3-13.8 | Pending |
| FR127 | Click-to-zoom | Epic 13 | 13.9 | Pending |
| FR128 | Screenshot YAML config | Epic 13 | 13.2 | Pending |
| FR129 | Walkthrough index page | Epic 14 | 14.1 | Pending |
| FR130 | Preview thumbnails | Epic 14 | 14.1 | Pending |
| FR131 | Category badges | Epic 14 | 14.2 | Pending |
| FR132 | Search functionality | Epic 14 | 14.3 | Pending |
| FR133 | Header navigation | Epic 14 | 14.4, 14.5 | Pending |
| FR134 | Scenarios dropdown | Epic 14 | 14.4 | Pending |
| FR135 | Walkthroughs dropdown | Epic 14 | 14.4 | Pending |
| FR136 | Breadcrumb navigation | Epic 14 | 14.6 | Pending |
| FR137 | Start Walkthrough CTA | Epic 15 | 15.1 | Pending |
| FR138 | Progress tracking | Epic 15 | 15.2 | Pending |
| FR139 | Completion links | Epic 15 | 15.3, 15.5 | Pending |
| FR140 | Gallery badges | Epic 15 | 15.4 | Pending |
| FR141 | Alt text requirements | Epic 16 | 16.1 | Pending |
| FR142 | Annotation accessibility | Epic 16 | 16.2 | Pending |
| FR143 | Responsive screenshots | Epic 16 | 16.3 | Pending |
| FR144 | Performance optimization | Epic 16 | 16.4 | Pending |
| FR145 | Gallery component | Epic 16 | 16.5 | Pending |
| FR146 | Drift notification | Epic 13 | 13.1 | Pending |
| FR147 | Missing screenshot fallback | Epic 13 | 13.10 | Pending |
| FR148 | Version rollback | Epic 13 | 13.10 | Pending |
| FR149 | Screenshot analytics | Epic 16 | 16.6 | Pending |
| FR150 | Navigation analytics | Epic 16 | 16.7 | Pending |

---

## Summary - v1.5 Extension

**Epics Added:** 4 (Epic 13, 14, 15, 16)
**Stories Added:** 29
**Story Points Added:** 143
**New FRs Covered:** FR124-FR150 (27 FRs)
**New NFRs Covered:** NFR59-NFR66 (8 NFRs)

**Updated Totals:**

| Category | Before v1.5 | v1.5 Extension | Total |
|----------|-------------|----------------|-------|
| Epics | 12 + Sprint 0 | +4 | **16 + Sprint 0** |
| Stories | 69 | +29 | **98 stories** |
| FRs Covered | 123 | +27 | **150 FRs** |
| Story Points | ~194 | +143 | **~337 points** |

**Epic Dependencies:**

```
Sprint 0 (Complete) ──┬──► Epic 13 (Screenshots) ──┬──► Epic 16 (Accessibility)
                      │                            │
                      ├──► Epic 14 (Navigation) ───┤
                      │                            │
                      └──► Epic 15 (Linking) ──────┘
```

**Implementation Priority:**

| Priority | Epic | Rationale |
|----------|------|-----------|
| 1 | Epic 13 | Core value - screenshots are the primary deliverable |
| 2 | Epic 14 | Navigation enables discovery of screenshot content |
| 3 | Epic 15 | Linking maximizes screenshot exposure |
| 4 | Epic 16 | Quality assurance - can run in parallel with 13-15 |

---

_PRD v1.5 extension added: 2025-11-29 (Screenshot Integration & Navigation Enhancement)_
_This extension adds 4 comprehensive epics (13-16) to integrate Sprint 0 screenshot infrastructure into portal pages and enhance navigation._

---

## PRD v1.6 Extension: Scenario Application Uplift

**Date:** 2025-11-30
**Reference:** docs/prd-scenario-applications.md
**Problem:** Lambda functions return JSON APIs only; walkthroughs describe rich web UIs that don't exist

---

## Epic 18: Council Chatbot Web Application

**Goal:** Deliver a complete chat interface that matches walkthrough descriptions
**User Value:** "I can interact with the chatbot through a professional UI, not raw JSON"
**FRs Covered:** FR151-FR160 (new)
**PRD Reference:** prd-scenario-applications.md - Epic 18

### Story 18.1: Chat Interface Foundation

**As a** council evaluator,
**I want** a chat interface with message input and conversation display,
**So that** I can interact with the chatbot like a real application.

**Acceptance Criteria:**

1. **AC-18.1.1:** Page displays GOV.UK-styled header with "Council Chatbot Demo" title
2. **AC-18.1.2:** Welcome message appears on page load: "Hello! I'm the council chatbot..."
3. **AC-18.1.3:** Text input field with placeholder "Type your question..."
4. **AC-18.1.4:** Send button with loading state during API call
5. **AC-18.1.5:** Messages display in conversation bubbles (user right, bot left)
6. **AC-18.1.6:** Sandbox banner visible: "Demo Mode - Production uses Amazon Bedrock"

**Technical Notes:**
- Use GDS Frontend components
- Vanilla JS for interactivity (no React dependency)
- Deploy as index.html served from Lambda Function URL

---

### Story 18.2: API Integration & Response Display

**As a** council evaluator,
**I want** my questions sent to the Lambda API and responses displayed,
**So that** I see the chatbot working in real-time.

**Acceptance Criteria:**

1. **AC-18.2.1:** Clicking Send POSTs message to Lambda Function URL
2. **AC-18.2.2:** Loading indicator shows during API call
3. **AC-18.2.3:** Bot response displays in conversation when received
4. **AC-18.2.4:** Response topic displayed as badge (e.g., "Bin Collections")
5. **AC-18.2.5:** Error handling displays user-friendly message on failure
6. **AC-18.2.6:** Enter key submits message (keyboard accessible)

---

### Story 18.3: Conversation History & Sample Questions

**As a** council evaluator,
**I want** conversation history persisted and sample questions available,
**So that** I can test multiple topics efficiently.

**Acceptance Criteria:**

1. **AC-18.3.1:** Conversation history scrolls with newest at bottom
2. **AC-18.3.2:** Session storage persists conversation during page refresh
3. **AC-18.3.3:** Sample question buttons (4): "Bin collection", "Council tax", "Planning", "Contact"
4. **AC-18.3.4:** Clicking sample question populates input and auto-sends
5. **AC-18.3.5:** Clear conversation button resets history
6. **AC-18.3.6:** Maximum 20 messages displayed (older messages trimmed)

---

### Story 18.4: CloudFormation Deployment Integration

**As a** council IT team member,
**I want** the chat UI deployed automatically with CloudFormation,
**So that** the application is ready immediately after stack creation.

**Acceptance Criteria:**

1. **AC-18.4.1:** CloudFormation template updated to include static UI
2. **AC-18.4.2:** Lambda Function URL serves HTML for GET requests
3. **AC-18.4.3:** Stack output "ChatbotURL" opens working chat interface
4. **AC-18.4.4:** CSS/JS embedded or inline (no external CDN dependencies)
5. **AC-18.4.5:** Template passes cfn-lint validation
6. **AC-18.4.6:** Auto-cleanup lifecycle maintains 1-day expiry

---

### Story 18.5: Screenshot Capture & Validation

**As a** portal maintainer,
**I want** screenshots recaptured to show the new chat interface matching walkthrough descriptions,
**So that** documentation accurately reflects the real user experience.

**Acceptance Criteria:**

**Screenshot YAML Alignment (src/_data/screenshots/council-chatbot.yaml):**

1. **AC-18.5.1:** `step-1-chatbot-interface.png` shows:
   - Alt: "Council Chatbot web interface with welcome message and text input"
   - Must show: GOV.UK styled chat window, welcome message visible, empty input field ready

2. **AC-18.5.2:** `step-2-question-input.png` shows:
   - Alt: "User typing a question about bin collection into the chatbot input field"
   - Must show: Text "When is my bin collection?" visible in input, Send button highlighted

3. **AC-18.5.3:** `step-2-response-display.png` shows:
   - Alt: "Chatbot displaying a helpful response about bin collection schedules"
   - Must show: User message bubble (right), Bot response bubble (left) with bin info

4. **AC-18.5.4:** `step-3-council-tax.png` shows:
   - Alt: "Conversation showing a council tax question and the chatbot's detailed response"
   - Must show: Council tax question and detailed response with payment info

5. **AC-18.5.5:** `step-3-multi-turn.png` shows:
   - Alt: "Full conversation history showing multiple questions and responses"
   - Must show: At least 3 question/response pairs in conversation history

6. **AC-18.5.6:** `step-4-conversation-summary.png` shows:
   - Alt: "Complete conversation showing various questions answered by the chatbot"
   - Must show: Full scrollable conversation with diverse topics

**Explore Section Screenshots:**

7. **AC-18.5.7:** `explore-boundary-testing.png` shows chatbot handling off-topic questions
8. **AC-18.5.8:** All 16 council-chatbot screenshots recaptured and replaced

**Validation:**

9. **AC-18.5.9:** `npm run check:screenshots` passes with 0 missing files
10. **AC-18.5.10:** Playwright script updated to capture new interface interactions
11. **AC-18.5.11:** Screenshots match walkthrough "What you should see" text descriptions
12. **AC-18.5.12:** Build succeeds with all new screenshots included

---

### Story 18.6: Comprehensive Test Suite

**As a** developer maintaining the Council Chatbot application,
**I want** a comprehensive test suite covering all functionality,
**So that** I can confidently deploy changes without breaking existing features.

**Acceptance Criteria:**

**Unit Tests (Lambda Function):**

1. **AC-18.6.1:** Unit tests for response generation logic:
   - Test bin collection keyword matching returns correct response
   - Test council tax keyword matching returns correct response
   - Test housing keyword matching returns correct response
   - Test unknown queries return fallback response
   - Test empty input handling

2. **AC-18.6.2:** Unit tests for HTML rendering:
   - Test GET request returns valid HTML document
   - Test HTML includes GOV.UK Frontend CSS
   - Test HTML includes chat interface elements
   - Test HTML escapes user input (XSS prevention)

3. **AC-18.6.3:** Unit tests for API response format:
   - Test POST request returns JSON with `response` field
   - Test response includes `timestamp` field
   - Test response includes `messageId` field
   - Test Content-Type header is application/json for POST

**Integration Tests (API Endpoint):**

4. **AC-18.6.4:** Integration tests for Lambda Function URL:
   - Test GET / returns 200 with HTML content
   - Test POST / with valid JSON returns 200
   - Test POST / with invalid JSON returns 400
   - Test CORS headers present on responses
   - Test response time <2 seconds (p95)

5. **AC-18.6.5:** Integration tests for conversation flow:
   - Test sequential questions maintain session context
   - Test 10 rapid requests complete without errors
   - Test concurrent requests (5 simultaneous) handled correctly

**End-to-End Tests (Web Interface):**

6. **AC-18.6.6:** E2E tests for chat interface (Playwright):
   - Test page loads with welcome message visible
   - Test typing in input field enables Send button
   - Test clicking Send submits message and shows response
   - Test Enter key submits message
   - Test conversation history scrolls correctly
   - Test sample question buttons populate input

7. **AC-18.6.7:** E2E tests for error handling:
   - Test network timeout shows error message to user
   - Test server error (500) shows friendly error message
   - Test very long input (>1000 chars) handled gracefully

**Accessibility Tests:**

8. **AC-18.6.8:** Accessibility tests (axe-core + manual):
   - Test no WCAG 2.2 AA violations (axe-core automated)
   - Test keyboard navigation (Tab through all interactive elements)
   - Test screen reader announces new messages (aria-live region)
   - Test focus management after sending message
   - Test color contrast meets AA requirements

**Performance Tests:**

9. **AC-18.6.9:** Performance benchmarks:
   - Test page load time <3 seconds on 3G connection
   - Test Time to First Byte <500ms
   - Test Largest Contentful Paint <2.5s
   - Test Lambda cold start <3 seconds

**Test Infrastructure:**

10. **AC-18.6.10:** Test configuration and CI integration:
    - Vitest config for unit tests (`tests/unit/council-chatbot/`)
    - Playwright config for E2E tests (`tests/e2e/council-chatbot/`)
    - GitHub Actions workflow runs all tests on PR
    - Test coverage report generated (target: >80% line coverage)
    - Tests run against deployed stack (not mocks for integration tests)

**Test Data (Significant Volume):**

11. **AC-18.6.11:** Question corpus (500+ test questions):
    - 100 bin collection questions (varied phrasing, dates, addresses)
    - 100 council tax questions (payments, bands, discounts, appeals)
    - 100 housing questions (repairs, applications, waiting lists)
    - 100 planning questions (applications, objections, appeals)
    - 50 general enquiry questions (contact, opening hours, complaints)
    - 50 edge case questions (gibberish, offensive, out-of-scope)

12. **AC-18.6.12:** Response validation fixtures:
    - Expected response for each question category
    - Keyword trigger mappings (bin → collection response)
    - Fallback response variants
    - Response quality scoring rubric

13. **AC-18.6.13:** Conversation flow datasets:
    - 50 multi-turn conversation scripts (3-5 turns each)
    - Context retention test cases
    - Topic switching scenarios
    - Session timeout handling

14. **AC-18.6.14:** Load testing dataset:
    - 1000 questions for concurrent load testing
    - Response time benchmarks per question type
    - Memory usage profiles

15. **AC-18.6.15:** Security test inputs:
    - 100 XSS injection attempts
    - 50 SQL injection patterns
    - 50 prompt injection attempts
    - Unicode/encoding edge cases

16. **AC-18.6.16:** Synthetic chat interface images (nano-banana):
    - Generate 10 realistic chat conversation screenshots
    - Various conversation lengths (1, 3, 5, 10 messages)
    - Different device viewports (mobile, tablet, desktop)
    - Error state mockups

---

## Epic 19: Planning Application AI Web Application

**Goal:** Deliver a document upload interface with extraction results display
**User Value:** "I can upload a document and see AI extraction in action"
**FRs Covered:** FR161-FR170 (new)
**PRD Reference:** prd-scenario-applications.md - Epic 19

### Story 19.1: Upload Interface Foundation

**As a** planning officer,
**I want** a drag-and-drop upload area for planning documents,
**So that** I can easily submit files for AI processing.

**Acceptance Criteria:**

1. **AC-19.1.1:** Page displays GOV.UK-styled header with "Planning Application AI Demo" title
2. **AC-19.1.2:** Drag-and-drop zone with visual border and icon
3. **AC-19.1.3:** Zone text: "Drag and drop your planning application here, or click to browse"
4. **AC-19.1.4:** File type validation (PDF, JPEG, PNG only)
5. **AC-19.1.5:** File size validation (max 10MB with error message)
6. **AC-19.1.6:** Sample document download links (3 samples)

---

### Story 19.2: Upload Progress & Processing Status

**As a** planning officer,
**I want** real-time feedback during file upload and processing,
**So that** I know what's happening with my document.

**Acceptance Criteria:**

1. **AC-19.2.1:** Progress bar shows during file upload (0-100%)
2. **AC-19.2.2:** Status message: "Uploading..." then "Processing with AI..."
3. **AC-19.2.3:** Animated spinner during extraction phase
4. **AC-19.2.4:** Processing time estimate displayed (8-20 seconds)
5. **AC-19.2.5:** Completion message: "Extraction complete!"
6. **AC-19.2.6:** Error handling with specific messages per failure type

---

### Story 19.3: Extracted Data Display

**As a** planning officer,
**I want** extracted information displayed in a structured format,
**So that** I can verify the AI correctly identified key fields.

**Acceptance Criteria:**

1. **AC-19.3.1:** Extracted fields displayed in key-value table
2. **AC-19.3.2:** Fields include: Application Reference, Applicant Name, Site Address, Proposal Type
3. **AC-19.3.3:** Confidence scores shown per field (green/amber/red)
4. **AC-19.3.4:** Analysis panel with overall recommendation (APPROVE/CONDITIONS/REFER)
5. **AC-19.3.5:** Policy considerations listed
6. **AC-19.3.6:** "Try another document" button resets interface

---

### Story 19.4: CloudFormation Deployment Integration

**As a** council IT team member,
**I want** the upload UI deployed automatically with CloudFormation,
**So that** the application is ready immediately after stack creation.

**Acceptance Criteria:**

1. **AC-19.4.1:** CloudFormation template updated to serve HTML UI
2. **AC-19.4.2:** Lambda handles GET (HTML) and POST (API) requests
3. **AC-19.4.3:** Stack output "AnalyzerURL" opens working upload interface
4. **AC-19.4.4:** S3 bucket CORS configured for direct upload
5. **AC-19.4.5:** Template passes cfn-lint validation
6. **AC-19.4.6:** Sample documents bundled in deployment

---

### Story 19.5: Screenshot Capture & Validation

**As a** portal maintainer,
**I want** screenshots recaptured to show the new upload interface matching walkthrough descriptions,
**So that** documentation accurately reflects the real user experience.

**Acceptance Criteria:**

**Screenshot YAML Alignment (src/_data/screenshots/planning-ai.yaml):**

1. **AC-19.5.1:** `step-1-cloudformation-outputs.png` shows:
   - Alt: "CloudFormation stack outputs showing the Planning AI application URL"
   - Must show: CloudFormation Outputs tab with ApplicationURL visible

2. **AC-19.5.2:** `step-1-application-interface.png` shows:
   - Alt: "Planning Application AI web interface with document upload area"
   - Must show: GOV.UK styled page with upload zone ready for documents

3. **AC-19.5.3:** `step-2-upload-interface.png` shows:
   - Alt: "Document upload area showing drag-and-drop zone and file browser button"
   - Must show: Dotted border drop zone, cloud icon, "Drag and drop" text

4. **AC-19.5.4:** `step-2-processing-status.png` shows:
   - Alt: "Processing indicator showing document being analyzed by Textract"
   - Must show: Spinner animation, "Processing with AI..." status message

5. **AC-19.5.5:** `step-3-extraction-results.png` shows:
   - Alt: "Extracted planning application data showing property address, applicant, and proposal details"
   - Must show: Key-value table with extracted fields (reference, applicant, address, proposal)

6. **AC-19.5.6:** `step-3-confidence-scores.png` shows:
   - Alt: "Confidence indicators showing extraction accuracy for each field"
   - Must show: Green/amber/red confidence indicators per field

7. **AC-19.5.7:** `step-3-document-preview.png` shows:
   - Alt: "Original document with extracted regions highlighted"
   - Must show: Document image with colored bounding boxes on extracted text

8. **AC-19.5.8:** `step-4-export-options.png` shows:
   - Alt: "Export options showing JSON, CSV, and PDF formats"
   - Must show: Export button dropdown with format options visible

9. **AC-19.5.9:** `step-4-textract-console.png` shows:
   - Alt: "AWS Textract console showing document analysis configuration"
   - Must show: AWS Textract console with analysis type visible

**Explore Section Screenshots:**

10. **AC-19.5.10:** `explore-architecture-overview.png` shows S3, Textract, Lambda diagram
11. **AC-19.5.11:** `explore-textract-detail.png` shows Textract analysis output
12. **AC-19.5.12:** `explore-custom-queries.png` shows Queries feature configuration
13. **AC-19.5.13:** `explore-different-documents.png` shows various document type results
14. **AC-19.5.14:** `explore-accuracy-testing.png` shows accuracy comparison view
15. **AC-19.5.15:** `explore-production-considerations.png` shows production checklist

**Validation:**

16. **AC-19.5.16:** All 15 planning-ai screenshots recaptured and replaced
17. **AC-19.5.17:** `npm run check:screenshots` passes with 0 missing files
18. **AC-19.5.18:** Playwright script updated to capture new interface interactions
19. **AC-19.5.19:** Screenshots match walkthrough "What you should see" text descriptions
20. **AC-19.5.20:** Build succeeds with all new screenshots included

---

### Story 19.6: Comprehensive Test Suite

**As a** developer maintaining the Planning Application AI application,
**I want** a comprehensive test suite covering all functionality,
**So that** I can confidently deploy changes without breaking existing features.

**Acceptance Criteria:**

**Unit Tests (Lambda Function):**

1. **AC-19.6.1:** Unit tests for document processing logic:
   - Test PDF file type validation accepts valid PDFs
   - Test JPEG/PNG file type validation accepts valid images
   - Test invalid file types rejected with error message
   - Test file size validation (>10MB rejected)
   - Test empty file handling

2. **AC-19.6.2:** Unit tests for Textract integration:
   - Test Textract API call formation with correct parameters
   - Test Textract response parsing extracts key fields
   - Test confidence score calculation from Textract response
   - Test handling of Textract API errors (throttling, service unavailable)

3. **AC-19.6.3:** Unit tests for HTML rendering:
   - Test GET request returns valid HTML document
   - Test HTML includes drag-and-drop upload zone
   - Test HTML includes GOV.UK Frontend styling
   - Test extracted data renders in key-value table format

4. **AC-19.6.4:** Unit tests for API response format:
   - Test POST request returns JSON with extraction results
   - Test response includes `fields` array with extracted data
   - Test response includes `confidence` scores per field
   - Test response includes `processingTime` metric

**Integration Tests (API Endpoint + AWS Services):**

5. **AC-19.6.5:** Integration tests for Lambda Function URL:
   - Test GET / returns 200 with HTML content
   - Test POST / with valid PDF returns extraction results
   - Test POST / with oversized file returns 413
   - Test POST / with invalid file type returns 400
   - Test CORS headers present on responses

6. **AC-19.6.6:** Integration tests for S3 upload flow:
   - Test presigned URL generation for direct upload
   - Test file successfully uploaded to S3 bucket
   - Test S3 object lifecycle (auto-delete after 24 hours)

7. **AC-19.6.7:** Integration tests for Textract processing:
   - Test sample planning document extracts expected fields
   - Test processing completes within 30 seconds
   - Test concurrent document processing (3 simultaneous)

**End-to-End Tests (Web Interface):**

8. **AC-19.6.8:** E2E tests for upload interface (Playwright):
   - Test page loads with upload zone visible
   - Test drag-and-drop file triggers upload
   - Test click-to-browse file selector works
   - Test progress indicator appears during processing
   - Test extraction results display after completion
   - Test "Try another document" resets interface

9. **AC-19.6.9:** E2E tests for extraction display:
   - Test extracted fields shown in table format
   - Test confidence scores displayed with color coding
   - Test document preview shows highlighted regions
   - Test export options (JSON, CSV) generate valid files

10. **AC-19.6.10:** E2E tests for error handling:
    - Test invalid file type shows user-friendly error
    - Test network timeout shows retry option
    - Test Textract failure shows graceful error message

**Accessibility Tests:**

11. **AC-19.6.11:** Accessibility tests (axe-core + manual):
    - Test no WCAG 2.2 AA violations (axe-core automated)
    - Test keyboard navigation through upload flow
    - Test screen reader announces upload progress and results
    - Test focus management after file selection
    - Test drag-and-drop has keyboard alternative

**Performance Tests:**

12. **AC-19.6.12:** Performance benchmarks:
    - Test page load time <3 seconds
    - Test small document (<1MB) processes in <15 seconds
    - Test large document (5MB) processes in <30 seconds
    - Test Lambda cold start <5 seconds

**Test Infrastructure:**

13. **AC-19.6.13:** Test configuration and CI integration:
    - Vitest config for unit tests (`tests/unit/planning-ai/`)
    - Playwright config for E2E tests (`tests/e2e/planning-ai/`)
    - GitHub Actions workflow runs all tests on PR
    - Test coverage report generated (target: >80% line coverage)
    - Sample planning documents in `tests/fixtures/planning-ai/`

**Test Data (Significant Volume):**

14. **AC-19.6.14:** Synthetic planning documents (nano-banana generated - 50+ documents):
    - 20 householder extension applications (rear, side, loft conversions)
    - 10 change of use applications (residential to commercial)
    - 10 new dwelling applications (single houses, small developments)
    - 5 listed building consent applications
    - 5 advertisement consent applications
    - Generate realistic UK planning form layouts with:
      - Site location plans (OS map style)
      - Block plans with property boundaries
      - Elevation drawings (front, rear, side)
      - Application reference numbers (format: APP/X1234/W/23/000001)

15. **AC-19.6.15:** Document quality variants (20 documents):
    - 5 high-quality scanned PDFs (300dpi, clear text)
    - 5 medium-quality scans (150dpi, some noise)
    - 5 low-quality scans (75dpi, skewed, faded)
    - 5 photographed documents (mobile phone captures, varied lighting)

16. **AC-19.6.16:** Expected extraction datasets:
    - Ground truth JSON for each document
    - Field mappings: applicant name, site address, proposal type, reference
    - Confidence score baselines per quality level
    - Accuracy metrics (precision, recall, F1) targets

17. **AC-19.6.17:** Edge case documents (15 documents):
    - Multi-page applications (5, 10, 20 pages)
    - Rotated pages (90°, 180°, mixed)
    - Handwritten annotations on typed forms
    - Mixed orientation (portrait + landscape)
    - Password-protected PDFs (for rejection testing)

18. **AC-19.6.18:** Architectural drawings (nano-banana - 30 images):
    - Floor plans with room labels
    - Site plans with measurements
    - 3D rendered views of proposed developments
    - Before/after comparison images

19. **AC-19.6.19:** Load testing corpus:
    - 200 documents for batch processing tests
    - Size range: 500KB to 10MB
    - Concurrent upload scenarios (5, 10, 20 simultaneous)

---

## Epic 20: FOI Redaction Web Application

**Goal:** Deliver a text redaction interface with highlighted PII
**User Value:** "I can paste text and see sensitive data automatically redacted"
**FRs Covered:** FR171-FR180 (new)
**PRD Reference:** prd-scenario-applications.md - Epic 20

### Story 20.1: Text Input Interface

**As an** FOI officer,
**I want** a text input area to paste documents for redaction,
**So that** I can submit content for automatic PII detection.

**Acceptance Criteria:**

1. **AC-20.1.1:** Page displays GOV.UK-styled header with "FOI Redaction Demo" title
2. **AC-20.1.2:** Large textarea for document input (500px height minimum)
3. **AC-20.1.3:** Character counter showing "X / 5000 characters"
4. **AC-20.1.4:** Sample text quick-load buttons (3 sample documents)
5. **AC-20.1.5:** "Redact Document" button with loading state
6. **AC-20.1.6:** Clear button to reset input

---

### Story 20.2: Redacted Output Display

**As an** FOI officer,
**I want** redacted text displayed with visual markers,
**So that** I can review what information was identified as sensitive.

**Acceptance Criteria:**

1. **AC-20.2.1:** Split-view layout: original (left) / redacted (right)
2. **AC-20.2.2:** Redactions displayed as [REDACTED:TYPE] markers
3. **AC-20.2.3:** Redaction markers color-coded by type (NAME=blue, ADDRESS=green, etc.)
4. **AC-20.2.4:** Redaction summary panel: count by type
5. **AC-20.2.5:** Confidence threshold displayed
6. **AC-20.2.6:** Download redacted text button (.txt export)

---

### Story 20.3: Confidence Threshold Control

**As an** FOI officer,
**I want** to adjust the confidence threshold for redaction,
**So that** I can balance between over-redacting and missing PII.

**Acceptance Criteria:**

1. **AC-20.3.1:** Slider control for confidence threshold (0.5 - 0.99)
2. **AC-20.3.2:** Default value: 0.85
3. **AC-20.3.3:** Re-process button after threshold change
4. **AC-20.3.4:** Threshold value displayed numerically
5. **AC-20.3.5:** Guidance text explaining threshold impact
6. **AC-20.3.6:** Higher threshold = fewer redactions (more confident only)

---

### Story 20.4: CloudFormation Deployment Integration

**As a** council IT team member,
**I want** the redaction UI deployed automatically with CloudFormation,
**So that** the application is ready immediately after stack creation.

**Acceptance Criteria:**

1. **AC-20.4.1:** CloudFormation template updated to serve HTML UI
2. **AC-20.4.2:** Lambda handles GET (HTML) and POST (API) requests
3. **AC-20.4.3:** Stack output "RedactionURL" opens working interface
4. **AC-20.4.4:** Sample documents embedded in HTML
5. **AC-20.4.5:** Template passes cfn-lint validation
6. **AC-20.4.6:** Auto-cleanup lifecycle maintained

---

### Story 20.5: Screenshot Capture & Validation

**As a** portal maintainer,
**I want** screenshots recaptured to show the new redaction interface matching walkthrough descriptions,
**So that** documentation accurately reflects the real user experience.

**Acceptance Criteria:**

**Screenshot YAML Alignment (src/_data/screenshots/foi-redaction.yaml):**

1. **AC-20.5.1:** `step-1-cloudformation-outputs.png` shows:
   - Alt: "CloudFormation stack outputs showing the FOI Redaction tool URL"
   - Must show: CloudFormation Outputs tab with RedactionToolURL visible

2. **AC-20.5.2:** `step-1-redaction-interface.png` shows:
   - Alt: "FOI Redaction web interface with document upload and PII detection options"
   - Must show: GOV.UK styled page with upload zone and PII category checkboxes

3. **AC-20.5.3:** `step-2-upload-interface.png` shows:
   - Alt: "Document upload area with sample FOI response document selected"
   - Must show: Upload zone with selected file name displayed

4. **AC-20.5.4:** `step-2-pii-options.png` shows:
   - Alt: "PII detection options showing categories like names, addresses, phone numbers"
   - Must show: Checkbox list with PII categories (NAME, ADDRESS, PHONE, EMAIL, etc.)

5. **AC-20.5.5:** `step-3-pii-detection-results.png` shows:
   - Alt: "Document showing highlighted personal information detected by Comprehend"
   - Must show: Document text with colored highlights on detected PII

6. **AC-20.5.6:** `step-3-pii-categories.png` shows:
   - Alt: "List of detected PII organized by category with confidence scores"
   - Must show: Categorized list with confidence percentage per item

7. **AC-20.5.7:** `step-3-document-preview.png` shows:
   - Alt: "Document preview with PII highlighted in different colors by category"
   - Must show: Color-coded legend and corresponding document highlights

8. **AC-20.5.8:** `step-4-redaction-preview.png` shows:
   - Alt: "Document showing redacted content with black bars over personal information"
   - Must show: Black [REDACTED] bars replacing PII text

9. **AC-20.5.9:** `step-4-selective-redaction.png` shows:
   - Alt: "Interface showing checkboxes to select which detected items to redact"
   - Must show: Checkbox list of detected items with select/deselect controls

10. **AC-20.5.10:** `step-5-download-options.png` shows:
    - Alt: "Download options showing redacted PDF and audit log export"
    - Must show: Download buttons for redacted document and audit log

11. **AC-20.5.11:** `step-5-audit-log.png` shows:
    - Alt: "Audit log showing all redactions made with timestamps and categories"
    - Must show: Table with redaction timestamp, category, and original text summary

12. **AC-20.5.12:** `step-5-comprehend-console.png` shows:
    - Alt: "AWS Comprehend console showing PII detection job configuration"
    - Must show: AWS Comprehend console with PII analysis settings

**Explore Section Screenshots:**

13. **AC-20.5.13:** `explore-architecture-overview.png` shows S3, Comprehend, Lambda pipeline
14. **AC-20.5.14:** `explore-comprehend-detail.png` shows PII detection analysis details
15. **AC-20.5.15:** `explore-custom-entities.png` shows custom entity recognizer training
16. **AC-20.5.16:** `explore-threshold-tuning.png` shows confidence threshold slider impact
17. **AC-20.5.17:** `explore-edge-cases.png` shows challenging content examples
18. **AC-20.5.18:** `explore-production-compliance.png` shows GDPR/FOI compliance checklist

**Validation:**

19. **AC-20.5.19:** All 18 foi-redaction screenshots recaptured and replaced
20. **AC-20.5.20:** `npm run check:screenshots` passes with 0 missing files
21. **AC-20.5.21:** Playwright script updated to capture new interface interactions
22. **AC-20.5.22:** Screenshots match walkthrough "What you should see" text descriptions
23. **AC-20.5.23:** Build succeeds with all new screenshots included

---

### Story 20.6: Comprehensive Test Suite

**As a** developer maintaining the FOI Redaction application,
**I want** a comprehensive test suite covering all functionality,
**So that** I can confidently deploy changes without breaking existing features.

**Acceptance Criteria:**

**Unit Tests (Lambda Function):**

1. **AC-20.6.1:** Unit tests for PII detection logic:
   - Test NAME entity detection with sample text
   - Test ADDRESS entity detection with UK formats
   - Test PHONE entity detection (UK mobile and landline)
   - Test EMAIL entity detection
   - Test DATE_TIME entity detection
   - Test no PII detected in clean text

2. **AC-20.6.2:** Unit tests for Comprehend integration:
   - Test Comprehend DetectPiiEntities API call formation
   - Test Comprehend response parsing extracts entity locations
   - Test confidence score extraction from response
   - Test handling of Comprehend API errors (throttling, limits)

3. **AC-20.6.3:** Unit tests for redaction logic:
   - Test single PII entity replaced with [REDACTED:TYPE]
   - Test multiple PII entities in same text correctly redacted
   - Test overlapping entities handled correctly
   - Test selective redaction (user choice respected)
   - Test redaction preserves document structure

4. **AC-20.6.4:** Unit tests for HTML rendering:
   - Test GET request returns valid HTML document
   - Test HTML includes text input area
   - Test HTML includes PII category checkboxes
   - Test split-view layout renders correctly

5. **AC-20.6.5:** Unit tests for API response format:
   - Test POST request returns JSON with detected entities
   - Test response includes entity `type`, `text`, `score`, `offset`
   - Test response includes `redactedText` field
   - Test response includes `summary` counts by type

**Integration Tests (API Endpoint + AWS Services):**

6. **AC-20.6.6:** Integration tests for Lambda Function URL:
   - Test GET / returns 200 with HTML content
   - Test POST / with text returns PII detection results
   - Test POST / with empty text returns empty entities array
   - Test POST / with >5000 chars returns 400
   - Test CORS headers present on responses

7. **AC-20.6.7:** Integration tests for Comprehend processing:
   - Test sample FOI document detects expected PII types
   - Test processing completes within 5 seconds
   - Test concurrent requests (10 simultaneous) handled correctly
   - Test threshold parameter affects detection results

8. **AC-20.6.8:** Integration tests for confidence threshold:
   - Test threshold=0.5 detects more entities
   - Test threshold=0.95 detects fewer (high-confidence only)
   - Test threshold changes reflected in results

**End-to-End Tests (Web Interface):**

9. **AC-20.6.9:** E2E tests for input interface (Playwright):
   - Test page loads with text area visible
   - Test character counter updates on input
   - Test sample document buttons populate text area
   - Test PII category checkboxes can be toggled
   - Test "Redact Document" button triggers processing

10. **AC-20.6.10:** E2E tests for results display:
    - Test split-view shows original and redacted text
    - Test detected PII highlighted with color coding
    - Test PII categories panel shows counts
    - Test confidence threshold slider updates results
    - Test selective redaction checkboxes work

11. **AC-20.6.11:** E2E tests for download functionality:
    - Test "Download Redacted" exports .txt file
    - Test "Download Audit Log" exports JSON with redaction records
    - Test downloaded files contain expected content

12. **AC-20.6.12:** E2E tests for error handling:
    - Test empty input shows validation message
    - Test text too long shows character limit error
    - Test API error shows friendly retry message

**Accessibility Tests:**

13. **AC-20.6.13:** Accessibility tests (axe-core + manual):
    - Test no WCAG 2.2 AA violations (axe-core automated)
    - Test keyboard navigation through redaction flow
    - Test screen reader announces PII detection results
    - Test color-coded highlights have text alternatives
    - Test threshold slider accessible with keyboard

**Security Tests:**

14. **AC-20.6.14:** Security-specific tests:
    - Test no PII logged to CloudWatch (audit compliance)
    - Test input sanitized against XSS attacks
    - Test redacted output cannot be reversed
    - Test audit log does not expose original PII text

**Performance Tests:**

15. **AC-20.6.15:** Performance benchmarks:
    - Test page load time <3 seconds
    - Test 1000 char document processes in <3 seconds
    - Test 5000 char document processes in <5 seconds
    - Test Lambda cold start <3 seconds

**Test Infrastructure:**

16. **AC-20.6.16:** Test configuration and CI integration:
    - Vitest config for unit tests (`tests/unit/foi-redaction/`)
    - Playwright config for E2E tests (`tests/e2e/foi-redaction/`)
    - GitHub Actions workflow runs all tests on PR
    - Test coverage report generated (target: >80% line coverage)

**Test Data (Significant Volume):**

17. **AC-20.6.17:** Synthetic FOI documents corpus (200+ documents):
    - 50 complaint correspondence (with resident names, addresses, phone numbers)
    - 40 internal memos (staff names, email addresses, internal references)
    - 30 inspection reports (property addresses, inspector details, dates)
    - 30 meeting minutes (attendee names, contact details, action owners)
    - 25 financial records (account numbers, amounts, payee details)
    - 25 HR documents (employee names, NI numbers, salary info)

18. **AC-20.6.18:** PII entity coverage (1000+ unique entities):
    - 200 UK person names (varied ethnicities, formats)
    - 200 UK addresses (varied formats: flat, house, business)
    - 150 UK phone numbers (mobile, landline, international)
    - 150 email addresses (personal, business, council domains)
    - 100 National Insurance numbers (valid format)
    - 100 dates of birth (various formats)
    - 50 bank account numbers
    - 50 vehicle registration plates

19. **AC-20.6.19:** PII detection ground truth:
    - JSON annotations for every PII entity in corpus
    - Entity offset positions (start, end characters)
    - Confidence score baselines per entity type
    - Detection accuracy targets (precision >95%, recall >90%)

20. **AC-20.6.20:** Adversarial test cases (100 documents):
    - Obfuscated PII (J0hn Sm1th, john[at]email[dot]com)
    - Partial redactions (Mr S****, 07*** *** ***)
    - False positives (company names that look like person names)
    - Context-dependent entities (dates that aren't DOB)
    - Unicode variations (smart quotes, accented characters)

21. **AC-20.6.21:** Synthetic document images (nano-banana - 50 images):
    - Scanned letters with signatures
    - Handwritten notes with personal details
    - Forms with filled-in PII fields
    - Screenshots of emails containing PII
    - ID document mockups (redacted for testing)

22. **AC-20.6.22:** Threshold tuning dataset:
    - 100 documents with confidence scores at boundary (0.8-0.9)
    - Expected behaviour at thresholds: 0.5, 0.7, 0.85, 0.95
    - False positive/negative rates per threshold

23. **AC-20.6.23:** Load and stress testing:
    - 500 documents for batch redaction testing
    - Maximum text lengths (4000, 4500, 5000 chars)
    - Concurrent request scenarios (10, 25, 50 simultaneous)

---

## Epic 21: Smart Car Park IoT Web Application

**Goal:** Deliver a real-time parking availability dashboard
**User Value:** "I can see live parking status like a real IoT monitoring system"
**FRs Covered:** FR181-FR190 (new)
**PRD Reference:** prd-scenario-applications.md - Epic 21

### Story 21.1: Dashboard Layout & Summary

**As a** parking manager,
**I want** a dashboard showing overall parking availability,
**So that** I can monitor capacity at a glance.

**Acceptance Criteria:**

1. **AC-21.1.1:** Page displays GOV.UK-styled header with "Smart Car Park Dashboard" title
2. **AC-21.1.2:** Summary banner: "X spaces available across Y car parks"
3. **AC-21.1.3:** Last updated timestamp with auto-refresh indicator
4. **AC-21.1.4:** Grid layout of car park cards (4 car parks)
5. **AC-21.1.5:** Refresh button for manual update
6. **AC-21.1.6:** "Simulate Sensor Data" button for demo

---

### Story 21.2: Car Park Status Cards

**As a** parking manager,
**I want** detailed status for each car park,
**So that** I can identify which locations need attention.

**Acceptance Criteria:**

1. **AC-21.2.1:** Each card shows: car park name, capacity, available spaces
2. **AC-21.2.2:** Occupancy progress bar with percentage
3. **AC-21.2.3:** Status badge color-coded: green (>50 free), amber (10-50), red (<10)
4. **AC-21.2.4:** Hourly rate displayed
5. **AC-21.2.5:** Cards animate on data update (subtle pulse)
6. **AC-21.2.6:** Mobile-responsive card layout (2 columns on tablet, 1 on mobile)

---

### Story 21.3: Auto-Refresh & Real-Time Updates

**As a** parking manager,
**I want** data to refresh automatically,
**So that** I see near real-time availability.

**Acceptance Criteria:**

1. **AC-21.3.1:** Auto-refresh every 30 seconds
2. **AC-21.3.2:** Countdown timer shows time until next refresh
3. **AC-21.3.3:** Loading indicator during refresh
4. **AC-21.3.4:** Data changes highlighted briefly (CSS animation)
5. **AC-21.3.5:** Error message if API fails (retry in 60 seconds)
6. **AC-21.3.6:** Pause auto-refresh option

---

### Story 21.4: CloudFormation Deployment Integration

**As a** council IT team member,
**I want** the dashboard UI deployed automatically with CloudFormation,
**So that** the application is ready immediately after stack creation.

**Acceptance Criteria:**

1. **AC-21.4.1:** CloudFormation template updated to serve HTML UI
2. **AC-21.4.2:** Lambda handles GET (HTML) and POST (API) requests
3. **AC-21.4.3:** Stack output "AvailabilityAPI" opens working dashboard
4. **AC-21.4.4:** 4 sample car parks pre-configured
5. **AC-21.4.5:** Template passes cfn-lint validation
6. **AC-21.4.6:** Auto-cleanup lifecycle maintained

---

### Story 21.5: Screenshot Capture & Validation

**As a** portal maintainer,
**I want** screenshots recaptured to show the new IoT dashboard matching walkthrough descriptions,
**So that** documentation accurately reflects the real user experience.

**Acceptance Criteria:**

**Screenshot YAML Alignment (src/_data/screenshots/smart-car-park.yaml):**

1. **AC-21.5.1:** `step-1-cloudformation-outputs.png` shows:
   - Alt: "CloudFormation stack outputs showing the Smart Car Park dashboard URL"
   - Must show: CloudFormation Outputs tab with DashboardURL visible

2. **AC-21.5.2:** `step-1-dashboard-overview.png` shows:
   - Alt: "Smart Car Park dashboard showing real-time occupancy data for multiple car parks"
   - Must show: GOV.UK styled dashboard with car park cards and summary banner

3. **AC-21.5.3:** `step-2-live-occupancy.png` shows:
   - Alt: "Real-time occupancy graph showing spaces available over time"
   - Must show: Live updating occupancy chart with time axis

4. **AC-21.5.4:** `step-2-sensor-status.png` shows:
   - Alt: "Individual sensor status showing connection state and last reading"
   - Must show: Sensor list with connection indicators and timestamps

5. **AC-21.5.5:** `step-2-map-view.png` shows:
   - Alt: "Map showing car park locations with colour-coded availability"
   - Must show: Geographic map with colored markers for car park locations

6. **AC-21.5.6:** `step-3-simulator-interface.png` shows:
   - Alt: "IoT device simulator interface for generating parking events"
   - Must show: Simulator panel with event type selection

7. **AC-21.5.7:** `step-3-event-publishing.png` shows:
   - Alt: "Publishing a simulated car parking event showing JSON payload"
   - Must show: JSON payload preview and publish button

8. **AC-21.5.8:** `step-3-dashboard-update.png` shows:
   - Alt: "Dashboard reflecting the simulated event with updated occupancy"
   - Must show: Dashboard with changed values highlighted

9. **AC-21.5.9:** `step-4-historical-trends.png` shows:
   - Alt: "Analytics showing parking patterns over the past week"
   - Must show: Historical chart with daily/weekly pattern analysis

10. **AC-21.5.10:** `step-4-predictive-insights.png` shows:
    - Alt: "Predicted occupancy forecast for upcoming hours"
    - Must show: Forecast chart with predicted vs actual comparison

11. **AC-21.5.11:** `step-4-iot-console.png` shows:
    - Alt: "AWS IoT Core console showing device fleet and message routing"
    - Must show: AWS IoT Core console with Thing registry visible

**Explore Section Screenshots:**

12. **AC-21.5.12:** `explore-architecture-overview.png` shows IoT Core, Lambda, DynamoDB diagram
13. **AC-21.5.13:** `explore-iot-rules.png` shows IoT Core rule configuration
14. **AC-21.5.14:** `explore-timestream-db.png` shows Timestream sensor data storage
15. **AC-21.5.15:** `explore-new-sensors.png` shows adding new sensor to fleet
16. **AC-21.5.16:** `explore-rule-modification.png` shows editing IoT rule for alerts
17. **AC-21.5.17:** `explore-scale-testing.png` shows high-frequency load testing
18. **AC-21.5.18:** `explore-production-security.png` shows IoT security best practices

**Validation:**

19. **AC-21.5.19:** All 18 smart-car-park screenshots recaptured and replaced
20. **AC-21.5.20:** `npm run check:screenshots` passes with 0 missing files
21. **AC-21.5.21:** Playwright script updated to capture new interface interactions
22. **AC-21.5.22:** Screenshots match walkthrough "What you should see" text descriptions
23. **AC-21.5.23:** Build succeeds with all new screenshots included

---

### Story 21.6: Comprehensive Test Suite

**As a** developer maintaining the Smart Car Park IoT application,
**I want** a comprehensive test suite covering all functionality,
**So that** I can confidently deploy changes without breaking existing features.

**Acceptance Criteria:**

**Unit Tests (Lambda Function):**

1. **AC-21.6.1:** Unit tests for parking data logic:
   - Test occupancy calculation from sensor data
   - Test percentage calculation (occupied/total)
   - Test status determination (green/amber/red thresholds)
   - Test multi-car-park aggregation
   - Test empty/null sensor data handling

2. **AC-21.6.2:** Unit tests for IoT data simulation:
   - Test simulated sensor event generation
   - Test event JSON format matches real IoT schema
   - Test random occupancy changes within bounds
   - Test timestamp generation in correct format

3. **AC-21.6.3:** Unit tests for HTML rendering:
   - Test GET request returns valid HTML dashboard
   - Test HTML includes car park status cards
   - Test HTML includes summary banner
   - Test HTML includes auto-refresh script

4. **AC-21.6.4:** Unit tests for API response format:
   - Test GET /api/status returns JSON with car parks
   - Test response includes `carParks` array
   - Test each car park has `name`, `capacity`, `occupied`, `available`
   - Test response includes `lastUpdated` timestamp

5. **AC-21.6.5:** Unit tests for DynamoDB operations:
   - Test read parking status from DynamoDB
   - Test write sensor update to DynamoDB
   - Test batch read for multiple car parks
   - Test handling of DynamoDB errors

**Integration Tests (API Endpoint + AWS Services):**

6. **AC-21.6.6:** Integration tests for Lambda Function URL:
   - Test GET / returns 200 with HTML dashboard
   - Test GET /api/status returns JSON data
   - Test POST /api/simulate updates parking data
   - Test CORS headers present on responses

7. **AC-21.6.7:** Integration tests for DynamoDB:
   - Test 4 car parks return data correctly
   - Test data consistency after simulate endpoint
   - Test concurrent reads don't block

8. **AC-21.6.8:** Integration tests for real-time updates:
   - Test simulate endpoint changes occupancy
   - Test dashboard reflects simulated changes
   - Test rapid simulations (10 in sequence) handled

**End-to-End Tests (Web Interface):**

9. **AC-21.6.9:** E2E tests for dashboard layout (Playwright):
   - Test page loads with summary banner visible
   - Test 4 car park cards displayed
   - Test last updated timestamp shown
   - Test refresh button triggers data reload
   - Test auto-refresh countdown visible

10. **AC-21.6.10:** E2E tests for car park cards:
    - Test each card shows name and occupancy
    - Test progress bar reflects percentage
    - Test status badge color matches threshold
    - Test card updates on data change

11. **AC-21.6.11:** E2E tests for simulation:
    - Test "Simulate Sensor Data" button visible
    - Test clicking simulate changes occupancy values
    - Test dashboard updates after simulation
    - Test rapid simulations don't break UI

12. **AC-21.6.12:** E2E tests for auto-refresh:
    - Test countdown timer decrements
    - Test data refreshes when countdown reaches 0
    - Test pause/resume auto-refresh works
    - Test manual refresh resets countdown

**Accessibility Tests:**

13. **AC-21.6.13:** Accessibility tests (axe-core + manual):
    - Test no WCAG 2.2 AA violations (axe-core automated)
    - Test keyboard navigation through dashboard
    - Test screen reader announces occupancy changes (aria-live)
    - Test status colors have text alternatives
    - Test auto-refresh can be paused (motion sensitivity)

**Real-Time Tests:**

14. **AC-21.6.14:** Real-time update tests:
    - Test occupancy change reflected within 2 seconds
    - Test multiple simultaneous updates don't conflict
    - Test WebSocket/polling mechanism reliable over 5 minutes
    - Test reconnection after network interruption

**Performance Tests:**

15. **AC-21.6.15:** Performance benchmarks:
    - Test page load time <3 seconds
    - Test API response time <500ms
    - Test dashboard handles 30-second refresh cycle
    - Test Lambda cold start <3 seconds

**Test Infrastructure:**

16. **AC-21.6.16:** Test configuration and CI integration:
    - Vitest config for unit tests (`tests/unit/smart-car-park/`)
    - Playwright config for E2E tests (`tests/e2e/smart-car-park/`)
    - GitHub Actions workflow runs all tests on PR
    - Test coverage report generated (target: >80% line coverage)

**Test Data (Significant Volume):**

17. **AC-21.6.17:** Car park configuration dataset:
    - 4 primary car parks (Town Centre: 500 spaces, Station: 200, Leisure Centre: 150, Market: 100)
    - 8 additional test car parks (varied capacities: 50, 75, 250, 400, 600, 800, 1000, 1500)
    - Configuration variants: hourly rates, opening hours, disabled spaces, EV charging

18. **AC-21.6.18:** Synthetic IoT sensor events (100,000+ events):
    - 30-day historical dataset per car park
    - Events every 30 seconds (simulated sensor frequency)
    - Realistic patterns: morning rush (8-9am), lunch peak (12-2pm), evening exit (5-6pm)
    - Weekend vs weekday patterns
    - Event format: `{sensorId, carParkId, status: 'occupied'|'vacant', timestamp}`

19. **AC-21.6.19:** Time-series trend data:
    - Hourly aggregates for 90 days (2,160 data points per car park)
    - Daily averages for 1 year (365 data points per car park)
    - Peak occupancy by day of week
    - Seasonal patterns (school holidays, Christmas, summer)

20. **AC-21.6.20:** Edge case scenarios:
    - Car park at 100% capacity (all sensors occupied)
    - Car park at 0% (all sensors vacant)
    - Exact threshold boundaries (10 spaces, 50 spaces)
    - Rapid state changes (10 events/second burst)
    - Sensor offline scenarios (missing heartbeats)

21. **AC-21.6.21:** Synthetic dashboard images (nano-banana - 30 images):
    - Dashboard screenshots at various occupancy levels
    - Map views with colour-coded pins
    - Real-time graphs showing occupancy trends
    - Mobile and tablet responsive views
    - Alert notification mockups (car park full)

22. **AC-21.6.22:** IoT device simulation dataset:
    - 50 virtual sensors per car park (200 total)
    - Sensor metadata: device ID, firmware version, battery level
    - Connection state history (online/offline timestamps)
    - Error event samples (low battery, connection lost, invalid reading)

23. **AC-21.6.23:** Load testing scenarios:
    - 10,000 events/minute burst test
    - 100 concurrent dashboard connections
    - DynamoDB read/write capacity stress test
    - Recovery scenarios (database failover, Lambda timeout)

24. **AC-21.6.24:** Predictive model test data:
    - Historical patterns for ML predictions
    - Expected vs actual occupancy comparisons
    - Prediction accuracy baselines (±10% target)

---

## Epic 22: Text-to-Speech Web Application

**Goal:** Deliver an audio conversion interface with playback controls
**User Value:** "I can convert text to speech and hear the result immediately"
**FRs Covered:** FR191-FR200 (new)
**PRD Reference:** prd-scenario-applications.md - Epic 22

### Story 22.1: Text Input & Voice Selection

**As an** accessibility officer,
**I want** a text input area with voice selection,
**So that** I can convert council content to audio.

**Acceptance Criteria:**

1. **AC-22.1.1:** Page displays GOV.UK-styled header with "Text to Speech Demo" title
2. **AC-22.1.2:** Large textarea for text input (300px height)
3. **AC-22.1.3:** Character counter: "X / 3000 characters"
4. **AC-22.1.4:** Voice dropdown: Amy, Emma, Brian, Arthur (British English)
5. **AC-22.1.5:** Sample text quick-load buttons (3 council announcements)
6. **AC-22.1.6:** "Convert to Speech" button with loading state

---

### Story 22.2: Audio Playback Controls

**As an** accessibility officer,
**I want** audio playback controls to hear the generated speech,
**So that** I can evaluate the voice quality.

**Acceptance Criteria:**

1. **AC-22.2.1:** Audio player appears after conversion
2. **AC-22.2.2:** Play/pause button with icon states
3. **AC-22.2.3:** Progress bar showing playback position
4. **AC-22.2.4:** Duration display (current / total)
5. **AC-22.2.5:** Download MP3 button
6. **AC-22.2.6:** "Convert another" button to reset

---

### Story 22.3: Voice Preview Samples

**As an** accessibility officer,
**I want** to preview each voice before converting,
**So that** I can choose the most appropriate voice.

**Acceptance Criteria:**

1. **AC-22.3.1:** Preview button next to each voice option
2. **AC-22.3.2:** Preview plays short sample: "Welcome to [council name]"
3. **AC-22.3.3:** Preview uses same Polly API
4. **AC-22.3.4:** Loading indicator during preview generation
5. **AC-22.3.5:** Preview audio stops when another starts
6. **AC-22.3.6:** Voice description tooltip (e.g., "Female, professional tone")

---

### Story 22.4: CloudFormation Deployment Integration

**As a** council IT team member,
**I want** the TTS UI deployed automatically with CloudFormation,
**So that** the application is ready immediately after stack creation.

**Acceptance Criteria:**

1. **AC-22.4.1:** CloudFormation template updated to serve HTML UI
2. **AC-22.4.2:** Lambda handles GET (HTML) and POST (API) requests
3. **AC-22.4.3:** Stack output "ConvertURL" opens working interface
4. **AC-22.4.4:** S3 presigned URLs for audio playback
5. **AC-22.4.5:** Template passes cfn-lint validation
6. **AC-22.4.6:** Auto-cleanup lifecycle maintained

---

### Story 22.5: Screenshot Capture & Validation

**As a** portal maintainer,
**I want** screenshots recaptured to show the new TTS interface matching walkthrough descriptions,
**So that** documentation accurately reflects the real user experience.

**Acceptance Criteria:**

**Screenshot YAML Alignment (src/_data/screenshots/text-to-speech.yaml):**

1. **AC-22.5.1:** `step-1-cloudformation-outputs.png` shows:
   - Alt: "CloudFormation stack outputs showing the Text to Speech application URL"
   - Must show: CloudFormation Outputs tab with ApplicationURL visible

2. **AC-22.5.2:** `step-1-tts-interface.png` shows:
   - Alt: "Text to Speech web interface with text input area and voice selection"
   - Must show: GOV.UK styled page with textarea and voice dropdown ready

3. **AC-22.5.3:** `step-2-text-input.png` shows:
   - Alt: "Text area showing a sample council announcement being entered"
   - Must show: Textarea with sample text visible, character count displayed

4. **AC-22.5.4:** `step-2-voice-selection.png` shows:
   - Alt: "Voice selection dropdown showing British English voices including Amy and Brian"
   - Must show: Expanded dropdown with Amy, Emma, Brian, Arthur options

5. **AC-22.5.5:** `step-2-advanced-options.png` shows:
   - Alt: "Advanced options panel showing speech rate and SSML controls"
   - Must show: Rate slider, SSML toggle, pronunciation hints section

6. **AC-22.5.6:** `step-3-generation-progress.png` shows:
   - Alt: "Progress indicator showing audio being generated by Amazon Polly"
   - Must show: Spinner animation, "Generating audio..." status

7. **AC-22.5.7:** `step-3-audio-player.png` shows:
   - Alt: "Audio player showing generated speech with play, pause, and download controls"
   - Must show: Play/pause button, progress bar, download button

8. **AC-22.5.8:** `step-3-waveform.png` shows:
   - Alt: "Visual waveform display of the generated audio file"
   - Must show: Audio waveform visualization with timeline

9. **AC-22.5.9:** `step-4-download-options.png` shows:
   - Alt: "Download options showing MP3, OGG, and WAV format choices"
   - Must show: Format selection buttons or dropdown

10. **AC-22.5.10:** `step-4-batch-processing.png` shows:
    - Alt: "Batch processing interface for converting multiple texts at once"
    - Must show: Multiple text input fields or file upload for batch

11. **AC-22.5.11:** `step-4-polly-console.png` shows:
    - Alt: "AWS Polly console showing available voices and neural engine options"
    - Must show: AWS Polly console with Neural engine option visible

**Explore Section Screenshots:**

12. **AC-22.5.12:** `explore-architecture-overview.png` shows API Gateway, Lambda, Polly, S3 diagram
13. **AC-22.5.13:** `explore-polly-detail.png` shows Polly neural TTS configuration
14. **AC-22.5.14:** `explore-ssml-markup.png` shows SSML editor with speech markup
15. **AC-22.5.15:** `explore-different-languages.png` shows multi-language voice options
16. **AC-22.5.16:** `explore-character-limits.png` shows character count and limits
17. **AC-22.5.17:** `explore-production-caching.png` shows S3 caching strategy

**Validation:**

18. **AC-22.5.18:** All 17 text-to-speech screenshots recaptured and replaced
19. **AC-22.5.19:** `npm run check:screenshots` passes with 0 missing files
20. **AC-22.5.20:** Playwright script updated to capture new interface interactions
21. **AC-22.5.21:** Screenshots match walkthrough "What you should see" text descriptions
22. **AC-22.5.22:** Build succeeds with all new screenshots included

---

### Story 22.6: Comprehensive Test Suite

**As a** developer maintaining the Text-to-Speech application,
**I want** a comprehensive test suite covering all functionality,
**So that** I can confidently deploy changes without breaking existing features.

**Acceptance Criteria:**

**Unit Tests (Lambda Function):**

1. **AC-22.6.1:** Unit tests for text validation:
   - Test valid text (1-3000 chars) accepted
   - Test empty text rejected with error
   - Test text >3000 chars rejected with error
   - Test special characters handled correctly
   - Test HTML/script tags stripped (XSS prevention)

2. **AC-22.6.2:** Unit tests for Polly integration:
   - Test Polly SynthesizeSpeech API call formation
   - Test voice parameter correctly set (Amy, Emma, Brian, Arthur)
   - Test audio format parameter (mp3) set correctly
   - Test handling of Polly API errors (throttling, invalid voice)

3. **AC-22.6.3:** Unit tests for audio file handling:
   - Test audio stream converted to base64 for response
   - Test S3 presigned URL generation for audio
   - Test audio file cleanup after retrieval
   - Test content-type set to audio/mpeg

4. **AC-22.6.4:** Unit tests for HTML rendering:
   - Test GET request returns valid HTML document
   - Test HTML includes text input area
   - Test HTML includes voice selection dropdown
   - Test HTML includes audio player element

5. **AC-22.6.5:** Unit tests for API response format:
   - Test POST request returns JSON with audio URL
   - Test response includes `audioUrl` field
   - Test response includes `duration` estimate
   - Test response includes `voice` used

**Integration Tests (API Endpoint + AWS Services):**

6. **AC-22.6.6:** Integration tests for Lambda Function URL:
   - Test GET / returns 200 with HTML content
   - Test POST / with valid text returns audio URL
   - Test POST / with empty text returns 400
   - Test POST / with invalid voice returns 400
   - Test CORS headers present on responses

7. **AC-22.6.7:** Integration tests for Polly:
   - Test all 4 voices produce valid audio
   - Test short text (<100 chars) synthesizes in <3 seconds
   - Test long text (3000 chars) synthesizes in <10 seconds
   - Test concurrent requests (5 simultaneous) handled

8. **AC-22.6.8:** Integration tests for S3 audio storage:
   - Test audio file uploaded to S3
   - Test presigned URL accessible for 15 minutes
   - Test audio file auto-deleted after 24 hours

**End-to-End Tests (Web Interface):**

9. **AC-22.6.9:** E2E tests for input interface (Playwright):
   - Test page loads with text area visible
   - Test character counter updates on input
   - Test sample text buttons populate text area
   - Test voice dropdown shows all 4 options
   - Test "Convert to Speech" button triggers processing

10. **AC-22.6.10:** E2E tests for audio playback:
    - Test audio player appears after conversion
    - Test play button starts playback
    - Test pause button stops playback
    - Test progress bar shows playback position
    - Test download button triggers file download

11. **AC-22.6.11:** E2E tests for voice selection:
    - Test changing voice updates selection
    - Test voice preview buttons play samples
    - Test selected voice used in conversion

12. **AC-22.6.12:** E2E tests for error handling:
    - Test empty input shows validation message
    - Test text too long shows character limit error
    - Test API error shows friendly retry message
    - Test network timeout handled gracefully

**Accessibility Tests:**

13. **AC-22.6.13:** Accessibility tests (axe-core + manual):
    - Test no WCAG 2.2 AA violations (axe-core automated)
    - Test keyboard navigation through conversion flow
    - Test screen reader announces conversion progress
    - Test audio player controls keyboard accessible
    - Test voice previews don't auto-play (user control)

**Audio Quality Tests:**

14. **AC-22.6.14:** Audio quality verification:
    - Test audio plays correctly in Chrome, Firefox, Safari
    - Test audio file is valid MP3 format
    - Test no audio artifacts or truncation
    - Test pronunciation of common council terms

**Performance Tests:**

15. **AC-22.6.15:** Performance benchmarks:
    - Test page load time <3 seconds
    - Test short text synthesis <3 seconds
    - Test audio playback starts within 1 second of clicking play
    - Test Lambda cold start <3 seconds

**Test Infrastructure:**

16. **AC-22.6.16:** Test configuration and CI integration:
    - Vitest config for unit tests (`tests/unit/text-to-speech/`)
    - Playwright config for E2E tests (`tests/e2e/text-to-speech/`)
    - GitHub Actions workflow runs all tests on PR
    - Test coverage report generated (target: >80% line coverage)

**Test Data (Significant Volume):**

17. **AC-22.6.17:** Council announcement corpus (300+ texts):
    - 50 service updates (bin collection changes, road closures, office hours)
    - 50 public notices (planning applications, licensing, elections)
    - 50 event announcements (community events, consultations, meetings)
    - 50 emergency alerts (weather warnings, service disruptions)
    - 50 accessibility statements (web accessibility, building access)
    - 50 policy summaries (council tax, housing, benefits)

18. **AC-22.6.18:** Text length variants:
    - 50 short texts (50-100 characters) - single sentences
    - 100 medium texts (100-500 characters) - paragraphs
    - 100 long texts (500-1500 characters) - multi-paragraph
    - 50 maximum length texts (2500-3000 characters) - full announcements

19. **AC-22.6.19:** Pronunciation test dataset (500+ test cases):
    - UK place names (50): Leicester, Greenwich, Alnwick, Bicester
    - Welsh place names (30): Llanfairpwllgwyngyll, Aberystwyth, Dolgellau
    - Council-specific terms (50): GDPR, FOI, ICO, HMRC, DWP
    - Numbers and dates (100): "1st January 2024", "£1,234.56", "020 7123 4567"
    - Abbreviations (50): Cllr, approx, etc, Mon-Fri, 9am-5pm
    - Postcodes (50): SW1A 1AA, M1 1AA, EH1 1YZ
    - Time formats (50): "9:00am", "17:30", "noon", "midnight"

20. **AC-22.6.20:** Voice comparison dataset:
    - 100 texts synthesized with all 4 voices (Amy, Emma, Brian, Arthur)
    - Expected duration per voice per text
    - Subjective quality ratings (1-5 scale)
    - Voice suitability by content type (formal, friendly, urgent)

21. **AC-22.6.21:** Audio quality baselines:
    - Reference audio files for each voice
    - Waveform characteristics (sample rate, bitrate)
    - Silence detection thresholds
    - Audio artifact detection patterns

22. **AC-22.6.22:** Synthetic TTS interface images (nano-banana - 25 images):
    - Text input with various content lengths
    - Voice selection dropdown states
    - Audio player in play/pause/complete states
    - Waveform visualizations
    - Download dialog mockups
    - Error state displays

23. **AC-22.6.23:** SSML test cases (100 examples):
    - Emphasis tags: `<emphasis level="strong">`
    - Pause tags: `<break time="500ms"/>`
    - Phoneme overrides for mispronounced words
    - Speech rate modifications
    - Invalid SSML (for error handling)

24. **AC-22.6.24:** Load testing corpus:
    - 1000 texts for concurrent synthesis testing
    - Batch processing scenarios (10, 50, 100 texts)
    - Audio file size benchmarks per text length

---

## Epic 23: QuickSight Dashboard Web Application

**Goal:** Deliver a metrics dashboard with charts and data tables
**User Value:** "I can see council performance metrics visualized like a real BI dashboard"
**FRs Covered:** FR201-FR210 (new)
**PRD Reference:** prd-scenario-applications.md - Epic 23

### Story 23.1: KPI Summary Cards

**As a** performance manager,
**I want** key performance indicators displayed prominently,
**So that** I can assess council performance at a glance.

**Acceptance Criteria:**

1. **AC-23.1.1:** Page displays GOV.UK-styled header with "Council Performance Dashboard" title
2. **AC-23.1.2:** 4 KPI cards: Total Cases, Resolution Rate, Avg Satisfaction, Total Complaints
3. **AC-23.1.3:** Cards show values with trend indicators (up/down arrows)
4. **AC-23.1.4:** Period label: "Last 90 days"
5. **AC-23.1.5:** Refresh data button
6. **AC-23.1.6:** "Generate Sample Data" button for demo

---

### Story 23.2: Service Breakdown Table

**As a** performance manager,
**I want** a detailed breakdown by service area,
**So that** I can identify which services need improvement.

**Acceptance Criteria:**

1. **AC-23.2.1:** Data table with columns: Service, Cases, Resolved, Rate, Satisfaction
2. **AC-23.2.2:** Sortable column headers (click to sort)
3. **AC-23.2.3:** 9 service areas displayed
4. **AC-23.2.4:** Resolution rate color-coded (green >80%, amber 60-80%, red <60%)
5. **AC-23.2.5:** Satisfaction score displayed with star rating
6. **AC-23.2.6:** Export to CSV button

---

### Story 23.3: Data Visualizations

**As a** performance manager,
**I want** charts showing trends and comparisons,
**So that** I can identify patterns and anomalies.

**Acceptance Criteria:**

1. **AC-23.3.1:** Bar chart: Cases by service area
2. **AC-23.3.2:** Chart title and axis labels
3. **AC-23.3.3:** Responsive chart sizing
4. **AC-23.3.4:** Chart.js library integration
5. **AC-23.3.5:** Chart tooltips on hover
6. **AC-23.3.6:** Print-friendly chart styles

---

### Story 23.4: CloudFormation Deployment Integration

**As a** council IT team member,
**I want** the dashboard UI deployed automatically with CloudFormation,
**So that** the application is ready immediately after stack creation.

**Acceptance Criteria:**

1. **AC-23.4.1:** CloudFormation template updated to serve HTML UI
2. **AC-23.4.2:** Lambda handles GET (HTML) and POST (API) requests
3. **AC-23.4.3:** Stack output "DataAPIURL" opens working dashboard
4. **AC-23.4.4:** Chart.js bundled or CDN-loaded
5. **AC-23.4.5:** Template passes cfn-lint validation
6. **AC-23.4.6:** Auto-cleanup lifecycle maintained

---

### Story 23.5: Screenshot Capture & Validation

**As a** portal maintainer,
**I want** screenshots recaptured to show the new dashboard matching walkthrough descriptions,
**So that** documentation accurately reflects the real user experience.

**Acceptance Criteria:**

**Screenshot YAML Alignment (src/_data/screenshots/quicksight-dashboard.yaml):**

1. **AC-23.5.1:** `step-1-cloudformation-outputs.png` shows:
   - Alt: "CloudFormation stack outputs showing the QuickSight dashboard embed URL"
   - Must show: CloudFormation Outputs tab with QuickSightURL visible

2. **AC-23.5.2:** `step-1-quicksight-login.png` shows:
   - Alt: "QuickSight reader access page for viewing the council dashboard"
   - Must show: QuickSight access page or embed ready state

3. **AC-23.5.3:** `step-2-dashboard-overview.png` shows:
   - Alt: "QuickSight dashboard showing council service metrics with charts and KPIs"
   - Must show: Full dashboard with KPI cards, charts, and data tables

4. **AC-23.5.4:** `step-2-kpi-section.png` shows:
   - Alt: "KPI cards showing response times, satisfaction scores, and volume metrics"
   - Must show: 4 KPI cards with values and trend indicators

5. **AC-23.5.5:** `step-2-trend-charts.png` shows:
   - Alt: "Line charts showing service request trends over the past 12 months"
   - Must show: Line chart with monthly data points and axis labels

6. **AC-23.5.6:** `step-3-filter-controls.png` shows:
   - Alt: "Dashboard filter panel with date range, service type, and area selectors"
   - Must show: Filter controls expanded with selection options

7. **AC-23.5.7:** `step-3-drill-down.png` shows:
   - Alt: "Drill-down view showing detailed breakdown of a selected metric"
   - Must show: Detailed data view after clicking chart element

8. **AC-23.5.8:** `step-3-export-options.png` shows:
   - Alt: "Export menu showing PDF, CSV, and image download options"
   - Must show: Export dropdown menu expanded

9. **AC-23.5.9:** `step-4-data-sources.png` shows:
   - Alt: "Data source configuration showing council service database connection"
   - Must show: Data source panel with connection details

10. **AC-23.5.10:** `step-4-calculated-fields.png` shows:
    - Alt: "Calculated field editor showing custom metric definitions"
    - Must show: Formula editor with calculated field example

11. **AC-23.5.11:** `step-4-quicksight-console.png` shows:
    - Alt: "QuickSight authoring console showing dashboard design interface"
    - Must show: QuickSight console with Analysis view visible

**Explore Section Screenshots:**

12. **AC-23.5.12:** `explore-architecture-overview.png` shows S3, Athena, SPICE, QuickSight diagram
13. **AC-23.5.13:** `explore-spice-dataset.png` shows SPICE dataset configuration
14. **AC-23.5.14:** `explore-new-visualization.png` shows adding chart in authoring mode
15. **AC-23.5.15:** `explore-custom-theme.png` shows council branding/theme options
16. **AC-23.5.16:** `explore-data-volume.png` shows SPICE capacity and data volume
17. **AC-23.5.17:** `explore-production-embedding.png` shows dashboard embedding config

**Validation:**

18. **AC-23.5.18:** All 17 quicksight-dashboard screenshots recaptured and replaced
19. **AC-23.5.19:** `npm run check:screenshots` passes with 0 missing files
20. **AC-23.5.20:** Playwright script updated to capture new interface interactions
21. **AC-23.5.21:** Screenshots match walkthrough "What you should see" text descriptions
22. **AC-23.5.22:** Build succeeds with all new screenshots included

---

### Story 23.6: Comprehensive Test Suite

**As a** developer maintaining the QuickSight Dashboard application,
**I want** a comprehensive test suite covering all functionality,
**So that** I can confidently deploy changes without breaking existing features.

**Acceptance Criteria:**

**Unit Tests (Lambda Function):**

1. **AC-23.6.1:** Unit tests for data generation logic:
   - Test sample data generation produces valid JSON
   - Test 9 service areas included in data
   - Test case counts are positive integers
   - Test satisfaction scores within 1-5 range
   - Test resolution rates within 0-100%

2. **AC-23.6.2:** Unit tests for metric calculations:
   - Test total cases aggregation correct
   - Test average satisfaction calculation
   - Test overall resolution rate calculation
   - Test complaint count aggregation

3. **AC-23.6.3:** Unit tests for HTML rendering:
   - Test GET request returns valid HTML dashboard
   - Test HTML includes KPI cards
   - Test HTML includes data table
   - Test HTML includes Chart.js canvas element

4. **AC-23.6.4:** Unit tests for API response format:
   - Test GET /api/metrics returns JSON data
   - Test response includes `kpis` object
   - Test response includes `services` array
   - Test response includes `generatedAt` timestamp

5. **AC-23.6.5:** Unit tests for export functionality:
   - Test CSV generation from service data
   - Test CSV headers match expected columns
   - Test CSV data rows match JSON data
   - Test special characters escaped in CSV

**Integration Tests (API Endpoint):**

6. **AC-23.6.6:** Integration tests for Lambda Function URL:
   - Test GET / returns 200 with HTML dashboard
   - Test GET /api/metrics returns JSON data
   - Test POST /api/generate creates new sample data
   - Test GET /api/export/csv returns CSV file
   - Test CORS headers present on responses

7. **AC-23.6.7:** Integration tests for data refresh:
   - Test "Generate Sample Data" creates new values
   - Test new data reflected in API response
   - Test dashboard displays updated data

**End-to-End Tests (Web Interface):**

8. **AC-23.6.8:** E2E tests for KPI cards (Playwright):
   - Test page loads with 4 KPI cards visible
   - Test each card shows value and trend indicator
   - Test period label shows "Last 90 days"
   - Test cards update after data refresh

9. **AC-23.6.9:** E2E tests for service table:
   - Test table displays 9 service areas
   - Test all columns visible (Service, Cases, Resolved, Rate, Satisfaction)
   - Test column headers are clickable for sorting
   - Test sorting changes row order
   - Test resolution rate color-coded correctly

10. **AC-23.6.10:** E2E tests for charts:
    - Test bar chart renders with data
    - Test chart has title and axis labels
    - Test chart tooltips appear on hover
    - Test chart responsive on window resize

11. **AC-23.6.11:** E2E tests for data operations:
    - Test "Generate Sample Data" button works
    - Test "Refresh" button reloads data
    - Test "Export to CSV" downloads file
    - Test exported CSV opens in spreadsheet

12. **AC-23.6.12:** E2E tests for error handling:
    - Test API error shows friendly message
    - Test network timeout shows retry option
    - Test empty data handled gracefully

**Accessibility Tests:**

13. **AC-23.6.13:** Accessibility tests (axe-core + manual):
    - Test no WCAG 2.2 AA violations (axe-core automated)
    - Test keyboard navigation through dashboard
    - Test screen reader announces KPI values
    - Test table is navigable with screen reader
    - Test chart has text alternative (data table fallback)

**Data Validation Tests:**

14. **AC-23.6.14:** Data integrity tests:
    - Test KPI totals match service totals
    - Test no negative values in any metric
    - Test satisfaction scores always 1.0-5.0
    - Test resolution rates always 0-100%
    - Test all 9 service areas always present

**Chart Rendering Tests:**

15. **AC-23.6.15:** Chart.js integration tests:
    - Test Chart.js library loads correctly
    - Test bar chart renders without errors
    - Test chart legend displays correctly
    - Test chart animations complete
    - Test chart print styles render correctly

**Performance Tests:**

16. **AC-23.6.16:** Performance benchmarks:
    - Test page load time <3 seconds
    - Test API response time <500ms
    - Test chart renders in <1 second
    - Test CSV export generates in <2 seconds
    - Test Lambda cold start <3 seconds

**Test Infrastructure:**

17. **AC-23.6.17:** Test configuration and CI integration:
    - Vitest config for unit tests (`tests/unit/quicksight-dashboard/`)
    - Playwright config for E2E tests (`tests/e2e/quicksight-dashboard/`)
    - GitHub Actions workflow runs all tests on PR
    - Test coverage report generated (target: >80% line coverage)

**Test Data (Significant Volume):**

18. **AC-23.6.18:** Comprehensive service metrics datasets (5000+ data points):
    - **Council Services (9 service areas, 365 days of daily data):**
      - Housing Services: case volumes, resolution rates, satisfaction scores
      - Waste & Recycling: collection rates, missed bin reports, satisfaction
      - Planning & Development: applications processed, approval rates, times
      - Highways & Transport: pothole reports, road repairs, street lighting
      - Environmental Services: noise complaints, pollution reports, enforcement
      - Revenues & Benefits: council tax queries, housing benefit claims
      - Adult Social Care: assessments, care packages, reviews completed
      - Children's Services: referrals, assessments, safeguarding contacts
      - Leisure & Culture: library visits, sports centre bookings, events
    - **Time Series Data (3 years historical):**
      - Daily aggregates (1095 records per service = 9855 total)
      - Weekly rollups (156 records per service = 1404 total)
      - Monthly summaries (36 records per service = 324 total)
      - Quarterly reports (12 records per service = 108 total)
      - Year-over-year comparisons

19. **AC-23.6.19:** KPI calculation test data:
    - Total cases: ranges from 0 to 100,000+
    - Resolution rates: 0%, 25%, 50%, 75%, 100% boundary tests
    - Satisfaction scores: 1.0, 2.5, 3.0, 4.0, 5.0 exact boundaries
    - Trend calculations: +50%, +10%, 0%, -10%, -50% changes
    - Percentage calculations: floating point precision tests
    - Division by zero scenarios (zero cases, zero responses)

20. **AC-23.6.20:** Edge case and boundary data:
    - All zeros scenario (service with no activity)
    - Maximum values (integer overflow prevention tests)
    - Exactly at thresholds (80% resolution = green boundary)
    - Missing data periods (gaps in time series)
    - Incomplete records (missing satisfaction, missing resolution)
    - Unicode in service names and descriptions
    - Very long service area names (truncation tests)

21. **AC-23.6.21:** Comparative benchmark datasets:
    - 50 fictional UK council benchmark datasets
    - Upper quartile, median, lower quartile performers
    - Service-by-service comparison data
    - Regional groupings (metropolitan, county, district, unitary)
    - Population size bands (small <100k, medium 100k-300k, large 300k+)

22. **AC-23.6.22:** CSV export validation data:
    - 100+ export test cases with expected outputs
    - Special characters in data (commas, quotes, newlines)
    - Unicode characters (council names with diacritics)
    - Numeric precision (2 decimal places for percentages)
    - Date format validation (ISO 8601 compliance)
    - Large dataset exports (10,000+ rows)

23. **AC-23.6.23:** Synthetic dashboard images (nano-banana generated - 40+ images):
    - **KPI Card Variations (12 images):**
      - High performance KPIs (green indicators, upward trends)
      - Medium performance KPIs (amber indicators, stable)
      - Low performance KPIs (red indicators, downward trends)
      - Loading states and skeleton screens
    - **Chart Visualizations (15 images):**
      - Bar charts with all 9 services
      - Pie charts for case distribution
      - Line charts showing trends over time
      - Stacked bar charts for comparison
      - Charts with no data / empty state
    - **Dashboard Layouts (8 images):**
      - Full dashboard view with all components
      - Mobile responsive layouts
      - Print-optimized layouts
      - Dark mode variants (if supported)
    - **Data Table Views (5 images):**
      - Sorted by different columns
      - Filtered views
      - Expanded row details
      - Export preview dialogs

24. **AC-23.6.24:** Chart rendering test fixtures:
    - Chart.js configuration snapshots
    - Expected canvas rendering outputs
    - Animation keyframe tests
    - Tooltip positioning tests
    - Legend click/toggle tests
    - Responsive breakpoint tests

25. **AC-23.6.25:** Real-time simulation datasets:
    - Mock live data feed (updates every 30 seconds)
    - Data refresh scenarios (new cases arriving)
    - Spike scenarios (sudden increase in service requests)
    - Batch import scenarios (historical data upload)
    - Rate limiting tests (rapid consecutive refreshes)

---

## FR Coverage Matrix - v1.6 Extension

| FR # | Title | Epic | Story | Status |
|------|-------|------|-------|--------|
| FR151 | Chat interface welcome message | Epic 18 | 18.1 | Pending |
| FR152 | Chat message input and send | Epic 18 | 18.1, 18.2 | Pending |
| FR153 | Chat conversation display | Epic 18 | 18.2 | Pending |
| FR154 | Chat API integration | Epic 18 | 18.2 | Pending |
| FR155 | Chat conversation history | Epic 18 | 18.3 | Pending |
| FR156 | Chat sample questions | Epic 18 | 18.3 | Pending |
| FR157 | Chat CloudFormation deployment | Epic 18 | 18.4 | Pending |
| FR158 | Chat screenshot validation | Epic 18 | 18.5 | Pending |
| FR159 | Chat GOV.UK styling | Epic 18 | 18.1-18.5 | Pending |
| FR160 | Chat accessibility compliance | Epic 18 | 18.1-18.5 | Pending |
| FR161 | Planning upload drag-and-drop | Epic 19 | 19.1 | Pending |
| FR162 | Planning file validation | Epic 19 | 19.1 | Pending |
| FR163 | Planning upload progress | Epic 19 | 19.2 | Pending |
| FR164 | Planning processing status | Epic 19 | 19.2 | Pending |
| FR165 | Planning extracted fields display | Epic 19 | 19.3 | Pending |
| FR166 | Planning confidence scores | Epic 19 | 19.3 | Pending |
| FR167 | Planning analysis results | Epic 19 | 19.3 | Pending |
| FR168 | Planning CloudFormation deployment | Epic 19 | 19.4 | Pending |
| FR169 | Planning screenshot validation | Epic 19 | 19.5 | Pending |
| FR170 | Planning sample documents | Epic 19 | 19.1 | Pending |
| FR171 | FOI text input area | Epic 20 | 20.1 | Pending |
| FR172 | FOI sample text loading | Epic 20 | 20.1 | Pending |
| FR173 | FOI redaction processing | Epic 20 | 20.2 | Pending |
| FR174 | FOI split-view display | Epic 20 | 20.2 | Pending |
| FR175 | FOI redaction markers | Epic 20 | 20.2 | Pending |
| FR176 | FOI redaction summary | Epic 20 | 20.2 | Pending |
| FR177 | FOI confidence threshold | Epic 20 | 20.3 | Pending |
| FR178 | FOI download export | Epic 20 | 20.2 | Pending |
| FR179 | FOI CloudFormation deployment | Epic 20 | 20.4 | Pending |
| FR180 | FOI screenshot validation | Epic 20 | 20.5 | Pending |
| FR181 | Smart Car Park dashboard layout | Epic 21 | 21.1 | Pending |
| FR182 | Smart Car Park summary banner | Epic 21 | 21.1 | Pending |
| FR183 | Smart Car Park status cards | Epic 21 | 21.2 | Pending |
| FR184 | Smart Car Park color-coded status | Epic 21 | 21.2 | Pending |
| FR185 | Smart Car Park occupancy bars | Epic 21 | 21.2 | Pending |
| FR186 | Smart Car Park auto-refresh | Epic 21 | 21.3 | Pending |
| FR187 | Smart Car Park countdown timer | Epic 21 | 21.3 | Pending |
| FR188 | Smart Car Park simulate button | Epic 21 | 21.1 | Pending |
| FR189 | Smart Car Park CloudFormation | Epic 21 | 21.4 | Pending |
| FR190 | Smart Car Park screenshots | Epic 21 | 21.5 | Pending |
| FR191 | TTS text input area | Epic 22 | 22.1 | Pending |
| FR192 | TTS voice selection | Epic 22 | 22.1 | Pending |
| FR193 | TTS sample text buttons | Epic 22 | 22.1 | Pending |
| FR194 | TTS audio playback | Epic 22 | 22.2 | Pending |
| FR195 | TTS play/pause controls | Epic 22 | 22.2 | Pending |
| FR196 | TTS download button | Epic 22 | 22.2 | Pending |
| FR197 | TTS voice preview | Epic 22 | 22.3 | Pending |
| FR198 | TTS CloudFormation deployment | Epic 22 | 22.4 | Pending |
| FR199 | TTS screenshot validation | Epic 22 | 22.5 | Pending |
| FR200 | TTS accessibility compliance | Epic 22 | 22.1-22.5 | Pending |
| FR201 | QuickSight KPI cards | Epic 23 | 23.1 | Pending |
| FR202 | QuickSight trend indicators | Epic 23 | 23.1 | Pending |
| FR203 | QuickSight service table | Epic 23 | 23.2 | Pending |
| FR204 | QuickSight sortable columns | Epic 23 | 23.2 | Pending |
| FR205 | QuickSight CSV export | Epic 23 | 23.2 | Pending |
| FR206 | QuickSight bar chart | Epic 23 | 23.3 | Pending |
| FR207 | QuickSight chart library | Epic 23 | 23.3 | Pending |
| FR208 | QuickSight generate data button | Epic 23 | 23.1 | Pending |
| FR209 | QuickSight CloudFormation | Epic 23 | 23.4 | Pending |
| FR210 | QuickSight screenshots | Epic 23 | 23.5 | Pending |

---

## Summary - v1.6 Extension

**Epics Added:** 6 (Epic 18-23)
**Stories Added:** 30 (5 per epic)
**Story Points Added:** ~180 (6 story points average per story)
**New FRs Covered:** FR151-FR210 (60 FRs)

**Updated Totals:**

| Category | Before v1.6 | v1.6 Extension | Total |
|----------|-------------|----------------|-------|
| Epics | 17 (incl. Sprint 0) | +6 | **23 + Sprint 0** |
| Stories | 98 | +30 | **128 stories** |
| FRs Covered | 150 | +60 | **210 FRs** |
| Story Points | ~337 | +180 | **~517 points** |

**Epic Dependencies:**

```
Sprint 0 (Complete) ──► Epic 17 (Complete) ──► Epic 18-23 (Scenario Applications)
                                               │
                                               ├─► Epic 18: Council Chatbot
                                               ├─► Epic 19: Planning AI
                                               ├─► Epic 20: FOI Redaction
                                               ├─► Epic 21: Smart Car Park
                                               ├─► Epic 22: Text-to-Speech
                                               └─► Epic 23: QuickSight Dashboard
```

**Implementation Priority:**

| Priority | Epic | Rationale |
|----------|------|-----------|
| P0 | Epic 18 | Council Chatbot - highest impact AI showcase |
| P0 | Epic 19 | Planning AI - document automation flagship |
| P1 | Epic 20 | FOI Redaction - compliance automation |
| P1 | Epic 21 | Smart Car Park - IoT dashboard demonstration |
| P2 | Epic 22 | Text-to-Speech - simpler implementation |
| P2 | Epic 23 | QuickSight - analytics visualization |

---

_PRD v1.6 extension added: 2025-11-30 (Scenario Application Uplift)_
_This extension adds 6 comprehensive epics (18-23) to deliver web application frontends for all 6 scenarios, fulfilling walkthrough acceptance criteria._

---

# PRD v1.7 Extension: Scenario Application Remediation

**Added:** 2025-11-30
**Rationale:** Epic 18-23 implementations delivered HTML mockups with sample data instead of real AWS service integrations. Critical remediation needed.

---

## Epic 24: Scenario Application Remediation

**Goal:** Fix broken scenario applications and integrate real AWS services
**User Value:** "I can experience actual AWS AI/IoT services, not just HTML mockups"
**FRs Covered:** FR211-FR235 (new)
**PRD Reference:** PRD v1.7 Extension - Scenario Application Remediation
**Story Points:** 55

### Problem Context

Post-deployment validation of Epic 18-23 revealed critical issues:

| Scenario | Status | Issue |
|----------|--------|-------|
| Council Chatbot | 403 Forbidden | Lambda URL not publicly accessible; needs real Bedrock AI |
| Planning AI | 403 Forbidden | Lambda URL not publicly accessible; empty page |
| FOI Redaction | 403 Forbidden | Lambda URL not publicly accessible; empty page |
| Smart Car Park | 403 Forbidden | Lambda URL not publicly accessible; not working |
| Text-to-Speech | ✓ Working | Functional with Polly integration |
| QuickSight Dashboard | ✓ Working | Lambda-based Chart.js mockup, NOT actual QuickSight |

---

### Story 24.1: Fix Lambda Function URL Access (All 6 Scenarios)

**As a** council evaluator,
**I want** all scenario Lambda URLs to be publicly accessible,
**So that** I can access the demo applications without authentication errors.

**Acceptance Criteria:**

1. **AC-24.1.1:** All 6 CloudFormation templates updated with `AuthType: NONE` for Lambda Function URLs
2. **AC-24.1.2:** Council Chatbot URL returns 200 OK with chat interface
3. **AC-24.1.3:** Planning AI URL returns 200 OK with upload interface
4. **AC-24.1.4:** FOI Redaction URL returns 200 OK with text input interface
5. **AC-24.1.5:** Smart Car Park URL returns 200 OK with dashboard interface
6. **AC-24.1.6:** Text-to-Speech URL continues to return 200 OK
7. **AC-24.1.7:** QuickSight Dashboard URL continues to return 200 OK
8. **AC-24.1.8:** All stacks redeployed and validated

**Story Points:** 5

---

### Story 24.2: Council Chatbot Bedrock Integration

**As a** council evaluator,
**I want** the chatbot to use real Amazon Bedrock Claude AI,
**So that** I can experience actual conversational AI capabilities.

**Acceptance Criteria:**

1. **AC-24.2.1:** Lambda function integrates with Amazon Bedrock Claude Instant
2. **AC-24.2.2:** Chat interface sends user questions to Bedrock API
3. **AC-24.2.3:** AI responses are context-aware about UK council services
4. **AC-24.2.4:** System prompt configured for council service assistant persona
5. **AC-24.2.5:** Sample questions trigger meaningful AI responses
6. **AC-24.2.6:** Response latency <5 seconds for standard queries
7. **AC-24.2.7:** Error handling for Bedrock service limits/errors
8. **AC-24.2.8:** Cost monitoring per invocation (target: <$0.01 per interaction)

**Story Points:** 13

---

### Story 24.3: Planning AI Textract + Comprehend Integration

**As a** planning officer,
**I want** uploaded documents to be processed by real AWS AI services,
**So that** I can see actual document understanding capabilities.

**Acceptance Criteria:**

1. **AC-24.3.1:** Lambda function integrates with Amazon Textract
2. **AC-24.3.2:** PDF/image uploads trigger Textract document analysis
3. **AC-24.3.3:** Extracted text displayed in structured format
4. **AC-24.3.4:** Amazon Comprehend detects entities in extracted text
5. **AC-24.3.5:** Key-value pairs extracted from planning forms
6. **AC-24.3.6:** Processing status updates shown to user
7. **AC-24.3.7:** Sample planning documents provided for demo
8. **AC-24.3.8:** Error handling for unsupported document types

**Story Points:** 13

---

### Story 24.4: FOI Redaction Comprehend PII Integration

**As a** FOI officer,
**I want** text to be analyzed by Amazon Comprehend PII detection,
**So that** I can see real automated redaction capabilities.

**Acceptance Criteria:**

1. **AC-24.4.1:** Lambda function integrates with Amazon Comprehend PII detection
2. **AC-24.4.2:** Text input analyzed for PII entities (names, addresses, etc.)
3. **AC-24.4.3:** Detected PII highlighted with entity type labels
4. **AC-24.4.4:** Redacted version generated with PII replaced by [REDACTED]
5. **AC-24.4.5:** Confidence scores shown for each detection
6. **AC-24.4.6:** Sample FOI request texts provided for demo
7. **AC-24.4.7:** Export redacted document functionality

**Story Points:** 8

---

### Story 24.5: Smart Car Park DynamoDB + Data Simulation

**As a** parking service manager,
**I want** the dashboard to show simulated real-time IoT data from DynamoDB,
**So that** I can see how IoT monitoring would work.

**Acceptance Criteria:**

1. **AC-24.5.1:** DynamoDB table created for parking sensor data
2. **AC-24.5.2:** Lambda generates realistic parking occupancy data
3. **AC-24.5.3:** Dashboard queries DynamoDB for current state
4. **AC-24.5.4:** Simulated sensor updates every 30 seconds
5. **AC-24.5.5:** Historical data stored for trend visualization
6. **AC-24.5.6:** Real-time updates reflected in dashboard charts
7. **AC-24.5.7:** 50 parking bays simulated across 5 car parks

**Story Points:** 8

---

### Story 24.6: QuickSight Dashboard Clarification

**As a** performance manager,
**I want** clear documentation that the dashboard is a Lambda-based visualization (not QuickSight embed),
**So that** expectations are accurately set.

**Acceptance Criteria:**

1. **AC-24.6.1:** Walkthrough text updated to clarify Lambda+Chart.js implementation
2. **AC-24.6.2:** Architecture diagram updated to show accurate tech stack
3. **AC-24.6.3:** "QuickSight-style" terminology used instead of "QuickSight"
4. **AC-24.6.4:** Add note explaining QuickSight licensing requirements for production
5. **AC-24.6.5:** Documentation explains why Lambda approach chosen for demo

**Story Points:** 3

---

### Story 24.7: End-to-End Validation of All 6 Scenarios

**As a** portal maintainer,
**I want** all 6 scenarios validated working end-to-end,
**So that** councils have a reliable demo experience.

**Acceptance Criteria:**

1. **AC-24.7.1:** Council Chatbot: Question asked → AI response received
2. **AC-24.7.2:** Planning AI: Document uploaded → Extracted data displayed
3. **AC-24.7.3:** FOI Redaction: Text submitted → PII detected and redacted
4. **AC-24.7.4:** Smart Car Park: Dashboard loads → Real-time data displays
5. **AC-24.7.5:** Text-to-Speech: Text submitted → Audio generated and playable
6. **AC-24.7.6:** QuickSight Dashboard: Page loads → Charts and data visible
7. **AC-24.7.7:** All scenarios complete without JavaScript errors
8. **AC-24.7.8:** All scenarios pass accessibility validation (axe-core)
9. **AC-24.7.9:** Playwright E2E tests updated and passing for all scenarios
10. **AC-24.7.10:** Screenshots recaptured showing real functionality

**Story Points:** 5

---

## PRD v1.7 Extension Summary

**Epics Added:** 1 (Epic 24)
**Stories Added:** 7
**Story Points Added:** 55
**New FRs Covered:** FR211-FR235 (25 FRs)
**New NFRs Covered:** NFR73-NFR78 (6 NFRs)

**Updated Totals:**

| Category | Before v1.7 | v1.7 Extension | Total |
|----------|-------------|----------------|-------|
| Epics | 23 + Sprint 0 | +1 | **24 + Sprint 0** |
| Stories | 128 | +7 | **135 stories** |
| FRs Covered | 210 | +25 | **235 FRs** |
| NFRs Covered | 72 | +6 | **78 NFRs** |
| Story Points | ~517 | +55 | **~572 points** |

**Epic Dependencies:**

```
Epic 18-23 (Complete - HTML Mockups) ──► Epic 24 (Remediation)
                                         │
                                         ├─► 24.1: Fix Lambda URL Access (All 6)
                                         ├─► 24.2: Bedrock Integration (Chatbot)
                                         ├─► 24.3: Textract/Comprehend (Planning)
                                         ├─► 24.4: Comprehend PII (FOI)
                                         ├─► 24.5: DynamoDB + Simulation (Car Park)
                                         ├─► 24.6: Documentation Clarification
                                         └─► 24.7: E2E Validation (All 6)
```

**Implementation Priority:**

| Priority | Story | Rationale |
|----------|-------|-----------|
| P0 | 24.1 | Fix 403 errors - unblock all scenarios |
| P0 | 24.2 | Chatbot Bedrock - highest impact AI demo |
| P1 | 24.3 | Planning AI - document intelligence showcase |
| P1 | 24.4 | FOI Redaction - compliance automation |
| P1 | 24.5 | Smart Car Park - IoT demonstration |
| P2 | 24.6 | QuickSight clarification - documentation only |
| P2 | 24.7 | E2E validation - final quality gate |

---

_PRD v1.7 extension added: 2025-11-30 (Scenario Application Remediation)_
_This extension adds Epic 24 (7 stories, 55 points) to remediate broken scenarios and integrate real AWS services._
