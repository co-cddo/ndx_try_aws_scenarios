---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments:
  - "_bmad-output/prd.md"
  - "_bmad-output/brainstorming-session-results-2025-12-23.md"
  - "_bmad-output/project-planning-artifacts/research/technical-ndx-try-aws-scenarios-research-2025-12-23.md"
workflowType: 'ux-design'
lastStep: 14
completedAt: '2025-12-29'
status: 'complete'
project_name: 'ndx_try_aws_scenarios'
user_name: 'cns'
date: '2025-12-23'
---

# ndx_try_aws_scenarios UX Design Specification

_Created on 2025-12-23 by cns_
_Generated using BMad Method - Create UX Design Workflow v1.0_

---

## Executive Summary

### Project Vision

A new flagship scenario ("AI-Enhanced LocalGov Drupal on AWS") for the NDX Try AWS Scenarios portal, enabling UK councils to deploy a fully functional LocalGov Drupal CMS with 7 integrated AWS AI services via one-click CloudFormation deployment. The experience demonstrates how AWS can enhance the LocalGov Drupal ecosystem already trusted by 50+ UK councils.

**The UX challenge spans three layers:**
1. **Portal UX** - The documentation portal (Eleventy/GOV.UK) presenting the scenario and guiding deployment
2. **Drupal CMS UX** - The deployed LocalGov Drupal experience with AI features integrated into editing workflows
3. **Walkthrough UX** - The guided tour helping users explore and understand the demo

### Target Users

| User Type | Context | Tech Proficiency |
|-----------|---------|------------------|
| **Council Officers** | Evaluating AWS/cloud for their authority | Non-technical decision-makers |
| **IT Managers** | Assessing technical viability | Moderate technical |
| **Cabinet Members** | Need evidence for committee papers | Very low technical |

Users need hands-on experience to "walk away understanding" what LocalGov Drupal + AWS can do - not just viewing, but actually editing content and using AI features.

### Key Design Challenges

| Challenge | Why It Matters |
|-----------|----------------|
| **Non-technical users deploying AWS** | One-click must truly be one-click; any friction loses the audience |
| **Finding credentials post-deploy** | CloudFormation Outputs are not intuitive; users need clear guidance to find login details |
| **DEMO banner visibility vs. annoyance** | Must be unmissable but not interfere with exploration |
| **AI feature discoverability** | 7 features is substantial; users need clear guidance on what to try and in what order |
| **Time-bounded experience** | 90-minute trial window requires pacing guidance |
| **Accessibility inception** | Demo showcasing accessibility tools must itself be fully WCAG 2.2 AA compliant |

### Design Opportunities

| Opportunity | Potential Impact |
|-------------|------------------|
| **"Unique council" novelty** | Dynamic generation creates shareable, memorable, and personalized experience |
| **Guided walkthrough in-CMS** | Embed tour directly in Drupal admin rather than relying on separate documentation |
| **AI feature "wow moments"** | Design micro-interactions that make AI features feel magical and immediately useful |
| **Evidence pack integration** | Seamless flow from "I tried it" to "here's my committee paper" |
| **Progressive disclosure** | Start simple, reveal complexity as users gain confidence |

---

## 1. Design System Foundation

### 1.1 Design System Choice

**Multi-layer approach for brownfield project:**

| Layer | System | Status |
|-------|--------|--------|
| Portal | GOV.UK Frontend 5.13 | Existing - extend |
| Drupal Admin | Drupal Claro + LocalGov | Accept defaults |
| Drupal Frontend | LocalGov Drupal Base Theme | Accept + DEMO banner |
| Walkthrough | Custom lightweight overlay | New development |

### 1.2 Rationale

- **GOV.UK Frontend**: Already in use, UK government users expect these patterns, WCAG 2.2 compliant
- **LocalGov Drupal themes**: Maintained by the community, shows authentic council experience
- **Accept rather than fight**: Customising Drupal admin would waste effort and break familiarity

### 1.3 Customisation Strategy

**Portal additions:**
- Deployment progress component
- Credential display with copy buttons

**Drupal additions:**
- DEMO banner (high-visibility, persistent)
- AI feature highlighting (tooltips, badges)
- Walkthrough overlay (guide button + step navigation)
- AI widgets (TTS button, translation selector)

---

## 2. Core User Experience

### 2.1 Defining Experience

The experience centres on the **"Deploy → Discover → Delight"** loop:

1. **Deploy**: One-click CloudFormation with pre-filled parameters
2. **Discover**: Guided credential retrieval and first login
3. **Delight**: AI feature "wow moment" within 5 minutes of access

### 2.2 Platform Strategy

- **Primary**: Desktop web browser (AWS Console + Drupal admin require larger screens)
- **Secondary**: Tablet for exploration/demonstration in meetings
- **Input**: Mouse/keyboard for content editing precision
- **Offline**: Not applicable (AWS deployment requires connectivity)

### 2.3 Effortless Interactions

| Interaction | Design Goal |
|-------------|------------|
| Deploy | Pre-filled parameters, single confirmation click |
| Credentials | Visual guide with screenshots, copy buttons |
| Navigation | Persistent "Guide" button visible throughout CMS |
| AI Features | Numbered walkthrough with suggested first feature |

### 2.4 Critical Success Moments

1. Stack creation starts successfully (no parameter errors)
2. Admin dashboard loads with council name visible
3. First content edit saved without errors
4. AI feature produces visible, useful output
5. Evidence pack PDF generates with session data

### 2.5 Experience Principles

1. **"Invisible Infrastructure"** - AWS complexity hidden; users see outcomes
2. **"Always Know What's Next"** - Every screen provides clear next action
3. **"Fail Gracefully"** - Clear recovery paths with human-readable errors
4. **"Delight Within 5 Minutes"** - First AI wow moment within 5 minutes of login
5. **"Evidence as First-Class"** - Path to committee papers as polished as demo

### 2.6 Desired Emotional Response

#### Primary Emotional Goals

| Emotion | Design Response |
|---------|-----------------|
| **Empowered** | Visible progress, clear next steps, no jargon |
| **Confident** | GOV.UK patterns, DEMO banner, clear data handling |
| **Surprised** | One-click deploy, instant results, no setup |
| **Proud** | Evidence pack, shareable output, professional quality |

#### Emotional Journey

| Stage | Desired Emotion | Design Response |
|-------|-----------------|-----------------|
| Discovery | Intrigued, reassured | "15 minutes", zero-cost, clear preview |
| Deploying | Patient, informed | Progress bar, time estimate, explanations |
| First Login | Oriented, welcomed | "Start Here" prompt, friendly dashboard |
| Exploring | Delighted, surprised | AI wow moments, quick wins |
| Completing | Accomplished, equipped | Evidence pack, next steps, summary |
| Error State | Supported, guided | Human errors, recovery paths |

#### Emotions to Avoid

- **Overwhelm** → Progressive disclosure, numbered steps
- **Abandonment** → Persistent help, contextual guidance
- **Distrust** → Upfront costs, data transparency

#### Emotional Design Principles

1. **"Celebrate Small Wins"** - Visible acknowledgment of every success
2. **"No Dead Ends"** - Every error provides a path forward
3. **"Speak Human"** - Plain English, no AWS jargon
4. **"Trust Through Transparency"** - Show costs, data use, progress
5. **"Make Magic Visible"** - Highlight AI capabilities explicitly

### 2.7 UX Pattern Analysis & Inspiration

#### Inspiring Products

| Product | Key UX Strength | Transferable Pattern |
|---------|-----------------|---------------------|
| **GOV.UK** | Clarity, accessibility, trust | Typography, spacing, step-by-step guides |
| **Stripe Dashboard** | Complex made simple, copy buttons | Credential display, setup checklists |
| **Notion** | Template-first, inline help | Pre-populated content, contextual tooltips |
| **LocalGov Drupal** | Council-specific patterns | Familiar CMS foundation for AI features |

#### Transferable Patterns

- Setup checklists with progress tracking (Stripe)
- One-click copy buttons for credentials (Stripe)
- Summary → detail progressive disclosure (GOV.UK)
- Template-first pre-populated content (Notion)
- Test/demo mode visual distinction (Stripe)

#### Anti-Patterns to Avoid

- AWS Console complexity and jargon
- Blank-page starts without guidance
- Generic error messages
- Hidden credentials in obscure locations
- Showing all features simultaneously

#### Design Strategy

**Adopt:** GOV.UK Frontend patterns, Stripe copy buttons, step-by-step guides
**Adapt:** Notion onboarding → deployment journey tracker
**Avoid:** AWS Console density, Drupal admin overwhelm for new users

### 2.8 Defining Experience

**Core Pitch:** "Deploy a council website with AI features in 15 minutes, zero technical knowledge needed."

**The "Deploy → Edit → AI Magic" Loop:**
1. One-click deployment (pre-filled CloudFormation)
2. Guided credential retrieval
3. First content edit in Drupal
4. AI feature produces immediate result
5. Evidence pack captures the session

### 2.9 User Mental Model

| Expectation | Design Response |
|-------------|-----------------|
| "AWS is complicated" | Pre-fill everything, hide complexity |
| "I'll need IT help" | Zero-dependency self-service |
| "AI is experimental" | Visible, immediate, useful results |

### 2.10 Novel UX Patterns

**Novel combination of established patterns:**
- AWS Quick Create + Non-technical users
- AI writing tools + Government CMS
- Guided walkthrough + Self-service sandbox
- Evidence pack generation (custom to platform)

---

## 3. Visual Foundation

### 3.1 Color System

**Inherited from GOV.UK Design System:**
- Primary: `#0b0c0c` (text), `#1d70b8` (links), `#00703c` (buttons)
- Focus: `#ffdd00` (yellow focus ring)
- Error: `#d4351c`

**Custom additions:**
- DEMO Banner: Yellow/black stripes (`#ffdd00` / `#0b0c0c`)
- AI Feature highlighting: Blue accent (`#1d70b8`)
- Walkthrough overlay: Semi-transparent yellow

### 3.2 Typography System

**GOV.UK Typography (via GDS Transport):**
- H1: 48px/700, H2: 36px/700, H3: 24px/700
- Body: 19px/400 with 1.5 line-height
- All WCAG 2.2 AA compliant

### 3.3 Spacing & Layout

**GOV.UK Spacing Scale:** 5px increments (1-6 tokens)
**Layout:** Two-thirds main content, max-width 960px
**Principle:** Generous white space, clear section breaks

### 3.4 Accessibility

- Colour contrast: 4.5:1 minimum (AA)
- Focus indicators: 3px yellow ring
- Touch targets: 44x44px minimum
- Motion: Respects `prefers-reduced-motion`

---

## 4. Design Direction

### 4.1 Chosen Design Approach

**"Government Service Clarity"** - Extend GOV.UK patterns with minimal additions; every new element should feel native to the Design System.

**Core Principles:**
- Invisible until needed (AI features as subtle buttons)
- Consistent with GOV.UK (colours, typography, spacing)
- Accessible by default (WCAG 2.2 AA baseline)
- Content-first (interface serves content)

### 4.2 New Component Designs

| Component | Design Pattern | Key Features |
|-----------|---------------|--------------|
| DEMO Banner | Warning stripe | Yellow/black, fixed top, 44px |
| Deployment Progress | Task list + progress bar | Real-time updates, checkmarks |
| Credentials Display | Card with copy buttons | Show/hide password, primary CTA |
| Walkthrough Overlay | Modal with highlight | Step counter, skip option |
| AI Feature Buttons | Secondary button + icon | Toolbar integration, tooltips |

### 4.3 Implementation Approach

- Portal components: Build with GOV.UK Frontend Nunjucks/HTML
- Drupal components: Custom Drupal module with Twig templates
- Walkthrough: Lightweight JavaScript overlay library
- AI buttons: CKEditor plugin integration

---

## 5. User Journey Flows

### 5.1 Critical User Paths

**Four critical journeys define the user experience:**

1. **Deploy Journey** - Scenario page → Stack creation (2 clicks)
2. **First Login Journey** - Credentials → Drupal dashboard (copy-paste)
3. **AI Feature Journey** - Edit page → AI simplification (3 clicks)
4. **Evidence Pack Journey** - Complete tour → PDF download

### 5.2 Deploy Journey Flow

**Entry:** Scenario page | **Exit:** Stack creating | **Clicks:** 2

Key optimizations:
- Pre-filled parameters (user changes nothing)
- Portal polls CloudFormation (no AWS Console navigation needed)
- Error recovery with clear next steps

### 5.3 First Login Journey Flow

**Entry:** Credentials screen | **Exit:** Drupal dashboard | **Clicks:** 4

Key optimizations:
- "Copy all" button for credentials
- Direct admin login link (not just site URL)
- Walkthrough auto-starts on first login

### 5.4 AI Feature Journey Flow

**Entry:** CKEditor | **Exit:** Simplified content | **Clicks:** 3

Key optimizations:
- Preview before applying (non-destructive)
- Auto-select paragraph if cursor is within it
- Undo available after applying

### 5.5 Evidence Pack Journey Flow

**Entry:** Complete walkthrough | **Exit:** PDF downloaded

Key optimizations:
- Pre-populate with session data
- Quick generate with defaults option
- Include screenshots from session

### 5.6 Journey Patterns

| Pattern Type | Implementation |
|--------------|----------------|
| **Navigation** | Breadcrumbs, floating guide button, step indicator |
| **Decisions** | Binary with defaults, preview before commit, skip option |
| **Feedback** | Inline success messages, progress indicators, recovery actions |

---

## 6. Component Library

### 6.1 Component Strategy

**Design System Foundation:** GOV.UK Frontend + LocalGov Drupal
**Custom Components Required:** 7

### 6.2 Custom Component Specifications

| Component | Purpose | Priority |
|-----------|---------|----------|
| DEMO Banner | Indicate demonstration site | P1 |
| Deployment Progress | Real-time stack status | P1 |
| Credentials Card | Copy-able login details | P1 |
| Walkthrough Overlay | Guided feature tour | P1 |
| AI Action Button | CKEditor AI integration | P1 |
| AI Preview Modal | Before/after comparison | P2 |
| Evidence Pack Form | PDF generation | P2 |

### 6.3 Implementation Approach

- Portal: GOV.UK Nunjucks macros
- Drupal: Twig templates + custom module
- Editor: CKEditor plugin
- Interactivity: Vanilla JavaScript

### 6.4 Implementation Phases

- **Phase 1:** Core journey components (Banner, Progress, Credentials)
- **Phase 2:** Guided experience (Walkthrough, AI Buttons)
- **Phase 3:** Full feature set (Preview, Evidence Pack)

---

## 7. UX Pattern Decisions

### 7.1 Consistency Rules

**Button Hierarchy:**
- Primary (green): One per screen, main action
- Secondary (grey): Alternative actions, copy buttons
- Warning (red): Destructive actions only
- Icon-only: With tooltip for accessibility

**Feedback Patterns:**
- Success: Green banner, auto-dismiss 5s
- Error: Red banner, persistent, includes recovery action
- Loading <2s: Spinner only
- Loading >10s: Progress bar with steps

**Form Patterns:**
- Labels above fields (GOV.UK standard)
- Error summary at top + inline
- Optional fields marked "(optional)"
- Help text below label, above input

**Loading States:**
- Skeleton screens for content areas
- Spinners for discrete actions
- Progress bars for multi-step processes

**Navigation Patterns:**
- Breadcrumbs on all pages except home
- Floating "Guide" button bottom-right
- Step indicators for multi-page flows

---

## 8. Responsive Design & Accessibility

### 8.1 Responsive Strategy

**Desktop-First Approach (Primary Platform)**

This project is desktop-first because:
- AWS Console requires larger screens for CloudFormation interaction
- Drupal admin content editing benefits from full-width CKEditor
- Target users (council officers, IT managers) primarily work on desktops

| Viewport | Strategy |
|----------|----------|
| **Desktop (1024px+)** | Full feature set, two-column layouts, expanded navigation |
| **Tablet (768-1023px)** | Meeting presentation mode, touch-optimized, simplified navigation |
| **Mobile (<768px)** | Documentation viewing only, no deployment flow |

**Responsive Adaptations:**

| Component | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| Deploy button | Full CTA with description | CTA only | Link to desktop |
| Credentials card | Inline copy buttons | Stacked layout | Read-only view |
| Walkthrough | Side panel overlay | Modal overlay | Disabled |
| DEMO banner | Fixed 44px height | Fixed 44px height | Fixed 44px height |

### 8.2 Breakpoint Strategy

**GOV.UK Design System Breakpoints (Inherited):**

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Mobile | < 641px | Documentation only |
| Tablet | 641-1023px | Exploration mode |
| Desktop | ≥ 1024px | Full deployment workflow |

**Custom Breakpoint Additions:**

| Breakpoint | Width | Component Affected |
|------------|-------|-------------------|
| Wide | ≥ 1200px | Drupal admin two-column editing |
| Meeting mode | 768-1023px | Tablet presentation optimizations |

### 8.3 Accessibility Strategy

**WCAG 2.2 AA Compliance Required**

Rationale: UK public sector digital services must meet WCAG 2.2 AA. Additionally, this demo showcases accessibility tools (TTS, translations) - it must lead by example.

**Inherited from GOV.UK Design System:**
- ✅ 4.5:1 colour contrast ratios
- ✅ 3px yellow focus rings (#ffdd00)
- ✅ 44x44px minimum touch targets
- ✅ Skip links and landmark regions
- ✅ GDS Transport font (readable at 19px)

**Project-Specific Requirements:**

| Feature | Accessibility Requirement |
|---------|--------------------------|
| DEMO banner | `aria-live="polite"` for timer updates |
| AI buttons | `aria-describedby` linking to feature explanation |
| Deployment progress | `aria-live="assertive"` for status changes |
| Copy buttons | Announce "Copied to clipboard" to screen readers |
| Walkthrough | Focus trap within modal, Escape to close |

**Motion & Animation:**
- Respect `prefers-reduced-motion` media query
- No auto-playing animations in progress indicators
- Static alternatives for all animated content

### 8.4 Testing Strategy

**Responsive Testing:**

| Tool/Method | Coverage |
|-------------|----------|
| Chrome DevTools | Breakpoint verification |
| BrowserStack | Real device testing (iPad, Android tablets) |
| GOV.UK supported browsers | Chrome, Firefox, Edge, Safari |

**Accessibility Testing:**

| Phase | Tool | Coverage |
|-------|------|----------|
| Automated | axe-core, Pa11y | WCAG 2.2 A/AA rule violations |
| Manual | VoiceOver (macOS/iOS) | Screen reader compatibility |
| Manual | Keyboard-only | Full navigation without mouse |
| Manual | High contrast mode | Windows high contrast themes |

**Accessibility Checklist:**
- [ ] All images have meaningful alt text
- [ ] Form labels correctly associated
- [ ] Error messages announced to screen readers
- [ ] Focus order matches visual order
- [ ] Colour not sole means of conveying information
- [ ] 200% zoom without horizontal scrolling

### 8.5 Implementation Guidelines

**Portal (Eleventy/GOV.UK):**
- Use GOV.UK Frontend responsive grid classes
- Apply `govuk-width-container` for consistent max-width
- Use `govuk-visually-hidden` for screen reader-only text

**Drupal Components:**
- Extend Claro theme, don't replace
- Use `@media` queries matching GOV.UK breakpoints
- Apply `role` and `aria-*` attributes to custom elements

**JavaScript Accessibility:**
- Trap focus in modals
- Manage `aria-expanded` on collapsible sections
- Announce dynamic content changes with live regions

**CSS Requirements:**
```css
/* Always include reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}

/* Ensure focus visibility */
:focus { outline: 3px solid #ffdd00; outline-offset: 0; }
```

### 8.6 Accessibility Personas & Scenarios

**Validated Accessibility Scenarios:**

| Persona | Critical Path | Success Criteria |
|---------|--------------|------------------|
| Screen reader user | Deploy → Credentials → First login | All steps completable with JAWS/NVDA, no sighted assistance |
| Keyboard-only user | Full Drupal edit workflow | Tab order logical, no mouse required, shortcuts documented |
| Low vision user | 200% zoom exploration | No horizontal scroll, no content clipping, focus visible |
| Cognitive accessibility | Walkthrough completion | Clear language, consistent patterns, recovery from errors |

**Accessibility Pain Points to Eliminate:**

- Silent copy-to-clipboard actions → Add `aria-live` announcement
- Walkthrough modal focus escape → Implement focus trap + Escape key
- Deployment progress updates → Use `aria-live="assertive"` for status
- CKEditor AI buttons → Ensure keyboard activation + screen reader labels

**Accessibility Delight Moments:**

- Screen reader user successfully deploys stack independently
- Keyboard user completes full content edit workflow
- Evidence pack includes accessibility evaluation notes for committee

### 8.7 Accessibility Journey Checkpoints

**Stage-by-Stage Accessibility Requirements:**

| Stage | Must Have | Screen Reader Test | Keyboard Test |
|-------|-----------|-------------------|---------------|
| Portal discovery | Skip links, heading hierarchy | Navigate by headings (H key) | Tab to Deploy in <10 keystrokes |
| Deployment | Live region updates | Status announced automatically | No interaction required |
| Credentials | Copy announcements | "Copied to clipboard" spoken | Copy button keyboard accessible |
| First login | Labelled form fields | Form mode works correctly | Tab order: username → password → submit |
| Walkthrough | Focus management | Step announced on open | Escape closes, Tab cycles within |
| AI features | Labelled toolbar buttons | Button purpose clear | Enter/Space activates |
| Evidence pack | Error announcements | Validation spoken inline | Form completable via keyboard |

**Accessibility Milestones:**

1. ✅ Portal loads → Skip link visible on first Tab
2. ✅ Deploy clicked → Progress component has `aria-live`
3. ✅ Credentials shown → Copy buttons announce success
4. ✅ Walkthrough opens → Focus moves to modal, trapped
5. ✅ AI button used → Preview announced, Undo available
6. ✅ Evidence pack complete → Success message announced

### 8.8 Accessibility Risk Prevention

**Pre-identified Failure Points:**

| Component | Failure Risk | Prevention | Owner |
|-----------|--------------|------------|-------|
| CKEditor AI plugins | Keyboard/SR inaccessible | Test before each PR merge | Dev |
| Deployment progress | Silent updates | Use `<LiveRegion>` wrapper component | Dev |
| Walkthrough modal | Focus escape | Use focus-trap library, no exceptions | Dev |
| DEMO banner | Contrast failure | Verify hex values against WCAG | Design |
| Drupal AI buttons | Touch target <44px | Override Claro CSS, enforce size | Dev |
| Evidence pack form | Unassociated errors | Use `<FormField>` component | Dev |
| Portal headings | Structure violations | Drupal field validation | Content |

**Non-Negotiable CI Gates:**

1. ❌ Pa11y cannot be disabled or bypassed
2. ❌ PR cannot merge with axe-core critical violations
3. ❌ Touch targets under 44px fail Stylelint
4. ❌ Colour contrast violations fail build
5. ❌ Missing form labels block deployment

**Accountability Checkpoints:**

| Milestone | Accessibility Gate | Sign-off Required |
|-----------|-------------------|-------------------|
| Component complete | axe-core clean | Developer |
| Feature complete | Screen reader walkthrough | QA |
| Sprint complete | Keyboard-only full journey | Product Owner |
| Release candidate | Full WCAG 2.2 AA audit | Accessibility Lead |

### 8.9 Accessibility Blind Spot Mitigations

**Expanded Accessibility Scope:**

| Often Overlooked | Our Commitment |
|------------------|----------------|
| Cognitive accessibility | Plain language audit, reading level < Grade 8, memory load minimisation |
| Temporary disabilities | Large touch targets, voice control compatibility, high contrast support |
| Assistive tech diversity | Test with Dragon, ZoomText, switch access - not just screen readers |
| Welsh language + accessibility | Validate TTS Welsh pronunciation, translated UI maintains a11y |
| Real device behaviour | Physical iPad + VoiceOver testing for all demo journeys |
| Accessibility feature accessibility | Meta-test: TTS controls, translation UI must themselves be accessible |

**Testing Matrix (Mandatory):**

| Assistive Tech | Platform | Test Frequency |
|----------------|----------|----------------|
| JAWS | Windows | Each sprint |
| NVDA | Windows | Each sprint |
| VoiceOver | macOS | Each sprint |
| VoiceOver | iOS/iPad | Each sprint + demo rehearsal |
| TalkBack | Android | Pre-release |
| Dragon NaturallySpeaking | Windows | Pre-release |
| ZoomText | Windows | Pre-release |
| Keyboard-only | All | Every PR |

**AAA Targets for Demo Features:**

| Feature | AA Requirement | Our AAA Target |
|---------|---------------|----------------|
| TTS button | Keyboard accessible | + Voice control compatible |
| Translation selector | Screen reader announced | + Cognitive simple (max 3 clicks) |
| AI preview | Focus managed | + Reading level indicator shown |

### 8.10 Accessibility Risk Register

**Priority 1 Risks (Sprint Blockers):**

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| CKEditor AI buttons inaccessible | High | Critical | Pre-merge SR testing | Dev Lead |
| Modal focus escape | High | High | focus-trap library | Dev Lead |
| Silent progress updates | High | High | LiveRegion component | Dev |

**Priority 2 Risks (Beta Blockers):**

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| Copy confirmation silent | Medium | High | aria-live announcement | Dev |
| Banner contrast failure | High | Medium | Validate hex values | Design |
| Form errors unassociated | Medium | High | FormField component | Dev |

**Risk Monitoring:**

- Weekly accessibility risk review in sprint planning
- P1 risks block sprint completion
- P2 risks block beta release
- Risk register updated after each accessibility audit

---

## 9. Implementation Guidance

### 9.1 Completion Summary

**Workflow Status:** ✅ Complete (2025-12-29)

**All 14 Steps Completed:**
1. ✅ Document Initialization
2. ✅ Project Discovery & Understanding
3. ✅ Core Experience Definition
4. ✅ Emotional Response Design
5. ✅ UX Pattern Analysis & Inspiration
6. ✅ Design System Choice
7. ✅ Defining Experience Mechanics
8. ✅ Visual Design Foundation
9. ✅ Design Direction
10. ✅ User Journey Flows
11. ✅ Component Strategy
12. ✅ UX Consistency Patterns
13. ✅ Responsive Design & Accessibility (Enhanced with Advanced Elicitation)
14. ✅ Workflow Completion

### 9.2 Implementation Priority

**Phase 1 - Foundation (Sprint 1-2):**
- DEMO Banner component
- Deployment Progress component
- Credentials Card component
- Portal GOV.UK integration

**Phase 2 - Guided Experience (Sprint 3-4):**
- Walkthrough Overlay system
- AI Action Buttons (CKEditor)
- Focus trap implementation
- LiveRegion components

**Phase 3 - Polish (Sprint 5-6):**
- AI Preview Modal
- Evidence Pack Form
- Accessibility testing & remediation
- Performance optimization

### 9.3 Critical Dependencies

| Dependency | Required For | Owner |
|------------|--------------|-------|
| GOV.UK Frontend 5.13 | All portal components | Frontend |
| LocalGov Drupal | CMS foundation | Backend |
| CKEditor 5 | AI feature buttons | Backend |
| focus-trap library | Walkthrough modal | Frontend |
| axe-core | CI accessibility testing | DevOps |

### 9.4 Definition of Done (UX)

Each component is complete when:
- [ ] Matches GOV.UK Design System patterns
- [ ] Passes axe-core automated testing
- [ ] Passes keyboard-only navigation test
- [ ] Passes screen reader walkthrough (NVDA/VoiceOver)
- [ ] Documented in component library
- [ ] Responsive across all breakpoints

---

## Appendix

### Related Documents

- Product Requirements: `_bmad-output/prd.md`
- Product Brief: `N/A`
- Brainstorming: `_bmad-output/brainstorming-session-results-2025-12-23.md`

### Core Interactive Deliverables

This UX Design Specification was created through visual collaboration:

- **Color Theme Visualizer**: {{color_themes_html}}
  - Interactive HTML showing all color theme options explored
  - Live UI component examples in each theme
  - Side-by-side comparison and semantic color usage

- **Design Direction Mockups**: {{design_directions_html}}
  - Interactive HTML with 6-8 complete design approaches
  - Full-screen mockups of key screens
  - Design philosophy and rationale for each direction

### Optional Enhancement Deliverables

_This section will be populated if additional UX artifacts are generated through follow-up workflows._

<!-- Additional deliverables added here by other workflows -->

### Next Steps & Follow-Up Workflows

This UX Design Specification can serve as input to:

- **Wireframe Generation Workflow** - Create detailed wireframes from user flows
- **Figma Design Workflow** - Generate Figma files via MCP integration
- **Interactive Prototype Workflow** - Build clickable HTML prototypes
- **Component Showcase Workflow** - Create interactive component library
- **AI Frontend Prompt Workflow** - Generate prompts for v0, Lovable, Bolt, etc.
- **Solution Architecture Workflow** - Define technical architecture with UX context

### Version History

| Date       | Version | Changes                         | Author |
| ---------- | ------- | ------------------------------- | ------ |
| 2025-12-23 | 1.0     | Initial UX Design Specification | cns    |

---

_This UX Design Specification was created through collaborative design facilitation, not template generation. All decisions were made with user input and are documented with rationale._
