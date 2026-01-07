# NDX:Try AWS Scenarios - UX Design Specification

**Author:** cns
**Date:** 2025-11-27
**Version:** 1.0
**Design System:** GOV.UK Frontend 5.13.0
**Technology Stack:** Eleventy 11ty + GOV.UK Frontend + GitHub Pages

---

## Executive Summary

NDX:Try AWS Scenarios is a UK local government-focused "try before you buy" platform. The UX design prioritizes **clarity, confidence-building, and quick time-to-value** using GOV.UK Frontend design system to maintain consistency with UK government digital services.

**Design Philosophy:** Government-style simplicity - every interaction removes uncertainty and builds confidence in evaluation decisions.

---

## 1. Design System Foundation

### 1.1 GOV.UK Frontend 5.13.0

**Choice:** GOV.UK Frontend design system (official UK government digital design language)

**Rationale:**
- Mandated for UK government digital services (WCAG 2.2 AA accessibility built-in)
- Familiar to all UK public sector users
- Battle-tested accessibility standards
- Proven in production across 300+ government services
- Aligns NDX:Try credibility with government digital standards

**Key Components for NDX:Try:**
- Buttons (primary, secondary, warning)
- Form elements (text input, select, checkbox, radio)
- Card component (scenario gallery)
- Accordion (deployment guides, FAQ)
- Breadcrumb (navigation context)
- Back link (navigation)
- Notification banners (deployment status)
- Tables (scenario comparison, metrics)
- Details (summary/details disclosure)
- Tabs (evidence pack sections)

**Customization:** Minimal. Only override Sass variables for NDX-specific branding where needed (e.g., accent colors for AWS service highlights).

### 1.2 Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Static Generator** | Eleventy (11ty) | Official X-GOV plugin, Markdown-first, proven in government services |
| **Design System** | GOV.UK Frontend 5.13.0 | Government digital standard |
| **Hosting** | GitHub Pages | Open source, free, built into NDX repository |
| **Content Format** | Markdown + YAML frontmatter | Version control-friendly, easy to maintain |
| **Interactivity** | Vanilla JavaScript + GOV.UK components | No framework overhead, accessibility-first |
| **Build Process** | GitHub Actions | Automatic deployment on push |

---

## 2. Core User Experience

### 2.1 Defining Experience

**"Quick wow in 15 minutes"** - Councils deploy a scenario and experience AWS capabilities working with realistic UK council data.

**Core User Journey:**
1. **Discover** → Scenario Selector quiz guides to relevant scenario (3 questions, <1 min)
2. **Explore** → Scenario page shows what they'll experience, cost, time required
3. **Deploy** → One-click CloudFormation deployment (<15 min to live system)
4. **Interact** → Guided walkthrough with "wow moments" (chatbot responds, AI extracts data, dashboard updates)
5. **Reflect** → "What You Experienced" form captures insights
6. **Evidence** → Committee Evidence Pack auto-generates with ROI projections
7. **Decide** → "What's Next" guidance for procurement pathway

### 2.2 User Personas & Their Needs

| Persona | Goal | Pain Point | UX Need |
|---------|------|-----------|---------|
| **CTO/Technical Lead** | "Cover my decision" | Needs technical depth + business justification | Technical architecture diagram, cost breakdown, sample code |
| **Service Manager** | "Help my service, don't add work" | Unclear how scenario applies to their problem | Clear use case summary, realistic council context |
| **Finance/Procurement** | "What will this actually cost?" | Budget approval friction | Maximum cost upfront, no surprises |
| **Developer** | "Will I embarrass myself technically?" | Imposter syndrome, unclear instructions | Clean CloudFormation, detailed guides, working examples |

### 2.3 Key Interactions

#### Interaction 1: Scenario Selector Quiz
- **Goal:** Match council problem to most relevant scenario in <1 min
- **UX Pattern:** Simple 3-question flow using GOV.UK radio buttons + buttons
- **Questions:**
  1. "What's your main challenge?" (service problem area)
  2. "How much time do you have?" (complexity tolerance)
  3. "Who's evaluating?" (persona - CTO, manager, team)
- **Output:** "We recommend Council Chatbot because..." with 1-3 ranked scenarios
- **Emotional Response:** "This understands what I need"

#### Interaction 2: Scenario Gallery
- **Goal:** Browse and understand all 6 scenarios at a glance
- **UX Pattern:** GOV.UK card grid with consistent metadata
- **Card Contents:** Scenario icon, title, use case (1 sentence), time estimate, difficulty (icon), "Learn more" link
- **Layout:** Responsive grid (1 column mobile, 2 columns tablet, 3 columns desktop)
- **Sorting/Filtering:** By persona, by use case category, by time required

#### Interaction 3: Scenario Page
- **Goal:** Get all information needed to decide "Should I deploy this?"
- **UX Pattern:** Linear narrative (top-to-bottom) with accordion for advanced details
- **Sections:**
  1. **Quick Summary** (1 paragraph) - Why councils should care
  2. **Use Case** - Specific council problem this solves
  3. **Time & Cost** - "15 min deployment, max £2 estimated cost"
  4. **Architecture Diagram** - Visual of AWS services (Mermaid SVG)
  5. **"Deploy This" Button** - Primary action, prominent
  6. **Why This Scenario** - Council examples, ROI potential
  7. **"Not ready? Watch Instead"** - Link to demo video
  8. **Before You Deploy** - Prerequisites, what you'll need
  9. **After Deployment** - Walkthrough guide (accordion)
  10. **Sample Queries** - Ready-to-run examples (accordion)
  11. **Troubleshooting** - Common issues (accordion)
  12. **What's Next** - Procurement guidance, partner info (accordion)

#### Interaction 4: Evidence Pack Form
- **Goal:** Capture evaluation insights, generate committee-ready PDF
- **UX Pattern:** Simple form with clear progression
- **Form Fields:**
  - "What surprised you about this service?" (textarea)
  - "Would this help your council?" (yes/no/maybe)
  - "What would you want in production?" (textarea)
  - "Any concerns?" (textarea)
  - "How likely to proceed?" (rating scale)
  - Email for PDF delivery
- **Validation:** Client-side, clear error messages (GOV.UK error styles)
- **Success:** Green notification "Evidence Pack emailed! Check your inbox."

#### Interaction 5: Navigation & Wayfinding
- **Goal:** Help users understand "Where am I?" and "Where can I go?"
- **UX Pattern:** GOV.UK breadcrumbs + back links
- **Breadcrumb Example:** Home > Scenarios > Council Chatbot
- **Back Link:** Always available to return to previous page
- **Top Navigation:** Home, Scenarios, Get Started, Evidence Packs, Accessibility, Case Studies, Contact

### 2.4 Emotional Design

All interactions should evoke:
- **Confidence:** "I can understand this"
- **Progress:** "I'm moving toward a decision"
- **Respect:** "This understands council context"
- **Possibility:** "This could actually work for us"

Language should be:
- ✓ "Deploy Council Chatbot in 15 minutes" (not "Advanced AI deployment system")
- ✓ "See real costs upfront" (not "Cost estimates may vary")
- ✓ "50+ councils evaluating" (peer validation)
- ✓ "No credit card required" (zero risk)

---

## 3. Visual Foundation

### 3.1 Color System

**Inherit from GOV.UK Frontend:**
- **Primary (Blue):** `#0B7D8F` - Trust, government authority
- **Secondary (Green):** `#00703C` - Success, positive actions
- **Warning (Orange):** `#F47930` - Caution, cost implications
- **Error (Red):** `#D4351C` - Errors, destructive actions
- **Neutral (Gray):** `#505A5F` - Text, borders, disabled states

**AWS Service Highlights** (optional, accent colors):
- AI/ML (Orange): `#FF9900`
- IoT (Purple): `#7B68EE`
- Analytics (Teal): `#00A8E1`

**Semantic Usage:**
- Primary buttons: Blue (#0B7D8F)
- Deployment success: Green (#00703C)
- Cost warnings: Orange (#F47930)
- Errors: Red (#D4351C)
- Text: Dark gray (#505A5F)
- Backgrounds: Off-white (#F3F2F1)

### 3.2 Typography

**Use GOV.UK Frontend defaults:**
- **Headings:** Bold GDS Transport Web (Government Digital Service font)
- **Body:** GDS Transport Web, 16px base size, 1.5 line-height
- **Code blocks:** Monospace (Courier New fallback), 14px

**Hierarchy:**
- Page title (h1): 32px bold
- Section heading (h2): 24px bold
- Subsection (h3): 19px bold
- Body text: 16px regular
- Small text: 14px regular

### 3.3 Spacing & Layout

**Use GOV.UK Frontend spacing scale:**
- Base unit: 5px
- Spacing scale: 5px, 10px, 15px, 20px, 30px, 45px, 60px
- Gutter width (responsive): 15px (mobile), 20px (tablet/desktop)
- Container max-width: 960px

**Grid System:**
- Mobile: Single column, full width minus gutters
- Tablet: 2 columns
- Desktop: 3 columns (for gallery) or 2-column main + sidebar

### 3.4 Responsive Breakpoints

| Device | Width | Layout | Navigation |
|--------|-------|--------|-----------|
| **Mobile** | <641px | 1 column, stacked | Top nav hamburger menu |
| **Tablet** | 641px-1024px | 2 columns where applicable | Top nav hamburger menu |
| **Desktop** | >1024px | 3 columns (gallery), 2 columns + sidebar (scenarios) | Top nav horizontal |

---

## 4. User Interface Components

### 4.1 Page Templates

#### Template: Homepage
**Purpose:** Welcome councils, answer "What is this?", guide to first scenario

**Content Structure:**
- Hero section: "Try AWS Before You Buy" + brief value prop
- Trust indicators: "50+ councils", "Zero cost", "15 minutes"
- Scenario grid preview: 6 cards showing all scenarios
- "Get Started" CTA (primary button)
- "Watch Instead" CTA (secondary link)

#### Template: Scenario Selector Quiz
**Purpose:** Match council to relevant scenario

**Content Structure:**
- Title: "Find Your Scenario"
- Question 1: Radio buttons with scenario preview icons
- Question 2: Radio buttons with time/complexity icons
- Question 3: Radio buttons with persona descriptions
- "See Results" primary button
- Results section: 1-3 recommended scenarios with brief why

#### Template: Scenario Gallery
**Purpose:** Browse all 6 scenarios

**Content Structure:**
- Title: "All Scenarios"
- Filter buttons (by persona, by category, by time)
- Card grid showing all scenarios
- Each card: icon, title, 1-line description, "Explore" link

#### Template: Scenario Detail
**Purpose:** Decide whether to deploy

**Content Structure:**
- Breadcrumb navigation
- Title + use case summary
- "Deploy Now" primary button (top-right sticky on desktop)
- Timeline: "~15 minutes from click to first insight"
- Cost: "Estimated cost: £X-Y, maximum guaranteed: £Z"
- "Why This Scenario" section (2-3 council examples)
- Architecture diagram (Mermaid SVG)
- "Before You Deploy" checklist
- Accordion: "After Deployment" walkthrough
- Accordion: "Sample Queries" with copy-paste ready code
- Accordion: "Troubleshooting"
- Accordion: "What's Next?" - Procurement guidance

#### Template: Evidence Pack Generator
**Purpose:** Create committee presentation material

**Content Structure:**
- Title: "Generate Your Evidence Pack"
- Intro: "Transform your demo experience into a committee-ready PDF"
- Form with fields (see Interaction 4 above)
- Progressive disclosure: Show form fields one section at a time
- Success screen: "✓ Evidence Pack sent to your email"

#### Template: Case Studies
**Purpose:** Show peer validation

**Content Structure:**
- Title: "How Councils Are Using NDX:Try"
- Case study cards:
  - Council name + region
  - What they evaluated
  - Key insight/result
  - "Read full story" link

#### Template: Get Started Guide
**Purpose:** Quick orientation for first-time users

**Content Structure:**
- "Your 15-Minute Journey"
- Step-by-step visual guide
- Sample screenshots
- "Ready? Start Here" CTA

### 4.2 Component Library (GOV.UK Frontend)

**Buttons**
- Primary: Blue background, white text (main actions like "Deploy")
- Secondary: Gray background, dark text (supporting actions)
- Warning: Orange background (cost implications, delete)
- Disabled: Gray, no interaction

**Forms**
- Text input: GOV.UK standard, clear labels, focus indicators
- Select dropdowns: GOV.UK standard with chevron icon
- Radio buttons: Side labels, clear spacing
- Checkboxes: Side labels, check marks
- Textarea: Clear labels, character count if applicable
- Error states: Red text + red left border, helpful error message

**Cards**
- Scenario cards: Icon, title, description, footer link
- Case study cards: Image, title, excerpt, link
- Info cards: Icon + content + action link

**Navigation**
- Top navigation bar: Logo, horizontal menu, possibly user profile
- Breadcrumbs: Hierarchical path (Home > Scenarios > Council Chatbot)
- Back link: Simple "← Back" link before main content
- Pagination: If scenario list grows beyond 12

**Feedback**
- Success notification: Green banner "✓ Action successful"
- Error notification: Red banner "✗ Something went wrong"
- Warning notification: Orange banner "⚠ Please note"
- Loading state: Spinner + "Deploying your scenario..."
- Inline validation: Red error text below field

**Accordions**
- Used for: Advanced details, walkthrough steps, troubleshooting
- Behavior: Click to expand, one or multiple can be open
- Keyboard: Full keyboard navigation support

---

## 5. Information Architecture

### 5.1 Navigation Structure

```
Home
├── Get Started (Quick orientation guide)
├── Scenarios
│   ├── Quiz (Scenario Selector)
│   ├── Gallery (Browse all 6)
│   ├── Council Chatbot
│   ├── Planning Application AI
│   ├── FOI Redaction
│   ├── Smart Car Park IoT
│   ├── Text-to-Speech
│   └── QuickSight Dashboard
├── Deployment Guides (Hub for all technical docs)
├── Evidence Packs (Generate & download)
├── Case Studies (Peer validation)
├── Partners & Implementation (Next steps)
├── Accessibility (WCAG 2.2 AA compliance statement)
├── FAQ
└── Contact
```

### 5.2 Content Hierarchy

**Primary content:** Scenario pages (6 total)
- User spends most time here
- Highest quality, most polish needed

**Secondary content:** Guides, case studies, partner info
- Supporting user decisions
- Referenceable

**Tertiary content:** FAQ, accessibility, meta pages
- Non-critical, but searchable

---

## 6. Accessibility (WCAG 2.2 AA)

### 6.1 Compliance Target

**WCAG 2.2 Level AA** (UK government standard)

### 6.2 Key Requirements

**Color & Contrast**
- Minimum 4.5:1 contrast ratio for text vs. background
- Color not sole indicator of status (use text + icon + color)
- Links underlined or otherwise distinguished

**Keyboard Navigation**
- All interactive elements (buttons, links, form fields) keyboard accessible
- Tab order logical (left-to-right, top-to-bottom)
- Focus indicators clearly visible (blue outline on all interactive elements)
- No keyboard traps (user can Tab out of any element)

**Screen Reader Support**
- Semantic HTML (`<button>`, `<a>`, `<h1>-<h6>`, `<form>`, `<label>`, `<table>`)
- ARIA labels where needed (especially buttons with icon-only content)
- Form labels properly associated with inputs (`<label for="input-id">`)
- Table headers marked with `<th scope="col">` or `<th scope="row">`
- Skip link to main content (invisible until focused)

**Motion & Animation**
- Respect `prefers-reduced-motion` media query
- No auto-playing videos with sound
- No flashing content (>3 times per second)

**Mobile & Touch**
- Touch targets minimum 24px × 24px (GOV.UK uses 44px)
- Responsive text (no zoom required for readability)
- Readable on all screen sizes down to 320px width

**Forms**
- Clear, descriptive error messages
- Errors associated with form fields (not just at top)
- Required fields clearly indicated
- Help text associated with form fields
- Input type matches data (email input for emails, tel for phones)

### 6.3 Testing Strategy

**Automated:**
- axe DevTools browser extension (quick accessibility audit)
- Lighthouse (Chrome DevTools)
- HTML validator (W3C)

**Manual:**
- Keyboard-only navigation (tab through entire page)
- Screen reader testing (NVDA, JAWS, or VoiceOver)
- Color contrast verification (WebAIM contrast checker)

**Continuous:**
- Include accessibility checks in GitHub Actions CI/CD
- Test with actual assistive technology users (user testing)

---

## 7. Deployment & Implementation

### 7.1 Technology Stack Details

**Eleventy (11ty)**
- Configuration: `.eleventy.js` in repo root
- Input folder: `/src/` (Markdown files, templates)
- Output folder: `/_site/` (generated static HTML)
- Build command: `npm run build`
- Dev server: `npm run serve` (with live reload)

**GOV.UK Frontend Integration**
- Install: `npm install govuk-frontend`
- Imports in Eleventy templates: Use X-GOV Eleventy plugin for easier integration
- Sass: Compile GOV.UK Sass + custom overrides → CSS

**GitHub Pages Deployment**
- GitHub Actions workflow: `.github/workflows/build-and-deploy.yml`
- On push to `main` branch:
  1. Run `npm install`
  2. Run `npm run build`
  3. Deploy `_site/` folder to `gh-pages` branch
- Site accessible at: `https://ndx-org.github.io/ndx-try-aws-scenarios/`

### 7.2 Content Structure

```
repository/
├── .github/
│   └── workflows/
│       └── build-and-deploy.yml (GitHub Actions config)
├── src/
│   ├── _includes/
│   │   ├── layouts/
│   │   │   ├── base.njk (main layout)
│   │   │   ├── scenario.njk (scenario detail page)
│   │   │   └── home.njk (homepage)
│   │   └── components/
│   │       ├── scenario-card.njk (reusable card component)
│   │       ├── quiz-form.njk (scenario selector)
│   │       └── evidence-pack-form.njk (form template)
│   ├── scenarios/
│   │   ├── 01-council-chatbot.md (scenario content)
│   │   ├── 02-planning-ai.md
│   │   ├── 03-foi-redaction.md
│   │   ├── 04-car-park-iot.md
│   │   ├── 05-text-to-speech.md
│   │   └── 06-quicksight.md
│   ├── guides/
│   │   ├── get-started.md
│   │   ├── deployment-guide.md
│   │   └── accessibility.md
│   ├── case-studies/
│   │   ├── doncaster-chatbot.md
│   │   └── hull-iot.md
│   ├── css/
│   │   ├── govuk-overrides.scss
│   │   └── custom-components.scss
│   ├── js/
│   │   ├── quiz.js (scenario selector logic)
│   │   ├── evidence-pack.js (form handler)
│   │   └── analytics.js (session tracking)
│   └── index.md (homepage)
├── .eleventy.js (11ty config)
├── package.json
├── README.md
└── _site/ (generated output - do not edit)
```

### 7.3 Markdown Front Matter Example

```yaml
---
title: "Council Chatbot"
description: "Deploy a customer service chatbot using AWS Bedrock and Lex"
layout: "layouts/scenario.njk"
tags:
  - ai
  - bedrock
  - customer-service
difficulty: "Beginner"
timeEstimate: "15 minutes"
estimatedCost: "£0.50-2.00"
maximumCost: "£5.00"
persona:
  - "Service Manager"
  - "CTO"
aws_services:
  - "Bedrock"
  - "Lex"
  - "Lambda"
  - "DynamoDB"
council_examples:
  - "Hammersmith & Fulham - Council information service"
  - "Southwark - Planning queries automation"
---

# Deploy Council Chatbot

[Content follows...]
```

---

## 8. Interaction Patterns & Patterns Library

### 8.1 Button Hierarchy

**Primary Button** (Main action)
- Blue background (#0B7D8F), white text
- Usage: "Deploy This Scenario", "Generate Evidence Pack", "Get Started"
- Prominence: Largest, most visible

**Secondary Button** (Supporting action)
- Gray background (#F3F2F1), dark text
- Border: 1px solid #505A5F
- Usage: "Watch Demo Instead", "View Code", "Learn More"

**Link Button** (Subtle navigation)
- Blue text (#0B7D8F), underlined
- No background
- Usage: "Back to Scenarios", "View Case Studies"

**Destructive Button** (Only if applicable)
- Red background (#D4351C), white text
- Usage: None in MVP (all actions are non-destructive)

### 8.2 Form Patterns

**Required Field Indicators**
- Asterisk (*) after label
- Or: "Required" text in smaller font
- Not: Just red border (color not sole indicator)

**Error Display**
- Red error message (4.5:1 contrast required)
- Displayed above or below the field
- Associated via ARIA attributes
- Actionable: "Email address must be valid" (not just "Invalid")

**Validation Timing**
- On blur: Check each field as user moves away
- On submit: Prevent submission if errors exist
- Progressive: Show inline feedback without blocking

**Help Text**
- Small gray text below label
- Example: "We'll send your Evidence Pack here"

### 8.3 Empty States

**No Results**
- Friendly message: "No scenarios matched your filters"
- Suggestion: "Try different selections"
- Helper action: "Show all scenarios" button

**First Visit**
- Guidance: "Let's find the right scenario for you"
- Primary action: "Start the Quiz" button
- Alternative: "Browse All Scenarios"

### 8.4 Success/Error Feedback

**Success Notification**
- Green banner at top: "✓ Evidence Pack sent to your email"
- Persists: At least 5 seconds
- Dismissible: User can close

**Error Notification**
- Red banner at top: "✗ Deployment failed: [specific reason]"
- Actionable: "Retry" button or troubleshooting link
- Dismissible: After user acknowledges

**Loading State**
- Spinner icon (animated)
- Text: "Deploying your scenario... (This takes ~15 minutes)"
- Prevent premature dismissal: Warn if user tries to leave

---

## 9. Implementation Roadmap

### Phase 1: Foundation (MVP)
- [ ] Eleventy project setup with GOV.UK Frontend
- [ ] Homepage with scenario preview
- [ ] Scenario Selector Quiz
- [ ] 6 scenario detail pages (with CloudFormation templates)
- [ ] Evidence Pack form (client-side generation to PDF)
- [ ] Basic navigation & accessibility
- [ ] GitHub Pages deployment via Actions

### Phase 2: Enhancement
- [ ] Scenario gallery with filtering
- [ ] Case studies section
- [ ] Partner/implementation guides
- [ ] Analytics tracking (session events)
- [ ] Demo video embedding
- [ ] FAQ page

### Phase 3: Polish
- [ ] Advanced responsive design
- [ ] Performance optimization
- [ ] User feedback integration
- [ ] SEO optimization
- [ ] Automated accessibility testing in CI/CD

---

## 10. Accessibility Checklist

- [ ] All text has 4.5:1 contrast ratio minimum
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible on all buttons/links
- [ ] Form labels properly associated (`<label for="id">`)
- [ ] Error messages descriptive and actionable
- [ ] Skip link implemented (main content jump)
- [ ] Images have alt text (or marked decorative)
- [ ] No content flashes >3x per second
- [ ] Mobile text readable without zoom
- [ ] Tested with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Tested keyboard-only navigation
- [ ] Color not sole indicator of information
- [ ] Tables have proper header markup
- [ ] Video has captions
- [ ] Touch targets ≥44px (GOV.UK standard)

---

## 11. References

- [GOV.UK Design System](https://design-system.service.gov.uk)
- [GOV.UK Frontend GitHub](https://github.com/alphagov/govuk-frontend)
- [X-GOV Eleventy Plugin](https://github.com/x-govuk/eleventy-plugin-govuk)
- [WCAG 2.2 Specification](https://www.w3.org/WAI/WCAG22/quickref/)
- [Eleventy Documentation](https://www.11ty.dev/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

---

_This UX Design Specification uses GOV.UK Frontend design system for consistency with UK government digital services standards. All interaction patterns, accessibility requirements, and visual styles inherit from the official UK government design language._

_Implementation guidance prioritizes Markdown-first content authoring with Eleventy (11ty) static generation and GitHub Pages hosting for maximum simplicity, maintainability, and alignment with government digital practices._
