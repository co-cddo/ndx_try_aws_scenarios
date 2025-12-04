# Epic Technical Specification: Portal Foundation & Discovery

Date: 2025-11-28
Author: cns
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the foundational portal infrastructure and discovery mechanisms for NDX:Try AWS Scenarios. This epic delivers the core static site using Eleventy 11ty with GOV.UK Frontend, enabling UK local government councils to discover, understand, and navigate to relevant AWS evaluation scenarios. The epic focuses on the user value: "I can find the right scenario for my problem in 2 minutes."

The portal foundation includes the complete build pipeline (GitHub Actions), accessibility testing framework (WCAG 2.2 AA), and the primary discovery flow via a 3-question Scenario Selector quiz. This epic transforms the PRD's vision of "informed confidence, not forced adoption" into a functional discovery interface that respects council users' time constraints while building trust through GOV.UK design patterns.

## Objectives and Scope

### In Scope

- **Portal Infrastructure**: Eleventy 11ty static site with X-GOV plugin and GOV.UK Frontend 5.13.0
- **Build Pipeline**: GitHub Actions workflow for automated build and deployment to GitHub Pages
- **Homepage**: Welcoming entry point with value proposition, trust indicators (including LGA acknowledgment placeholder), and scenario preview grid
- **Scenario Selector Quiz**: 3-question discovery flow with recommendation logic AND equal-prominence "Browse All" alternative
- **Scenario Gallery**: Responsive card grid with filtering - positioned as primary discovery path alongside quiz
- **Quick-Start Guide**: "Your 15-Minute Journey" visual step-by-step guide
- **Navigation Structure**: Top navigation bar (Home, Scenarios, Get Started, Cost Information, Accessibility, Contact, GitHub) with breadcrumbs and back links
- **Accessibility Framework**: WAVE/axe automated testing, keyboard navigation, screen reader support, progressive enhancement (no-JS fallbacks)
- **Scenario Metadata Schema**: Validated YAML schema with documented extension pattern for future scenarios
- **Trust Architecture**: Placeholder components for LGA branding, council testimonials, peer validation metrics
- **Discovery Hierarchy**: Homepage presents Quiz as recommended path (primary CTA), Gallery as alternative (secondary link) - avoiding decision paralysis while maintaining fallback
- **Extension Documentation**: "Adding a New Scenario" contributor guide included in repository
- **Accessibility Gate**: Pre-launch independent accessibility audit requirement documented
- **Cost Visibility**: Estimated and maximum cost displayed on all scenario cards (not just in metadata)
- **Outcome-Led Naming**: Scenario cards use problem/outcome headlines with technical names as subtitles (e.g., "Reduce Call Centre Queries" not "Council Chatbot")
- **Security Badge**: "Innovation Sandbox Isolated" indicator on scenario cards for CTO confidence
- **GitHub Prominence**: "View on GitHub" link in footer and navigation; "Open Source (MIT)" trust indicator on homepage
- **CloudFormation Badge**: "Template Included" indicator on scenario cards for developer confidence
- **Quiz User Testing**: Mandatory user testing with 5+ councils before launch (quiz wording validation)
- **Early Accessibility Audit**: External audit scheduled at 75% completion milestone, not pre-launch
- **Build Pipeline SLA**: Target <3 min builds; Slack alerting on failures; documented retry logic; 95%+ reliability
- **Card A/B Testing**: Title/CTA wording tested with council users before finalizing
- **Launch Readiness Checklist**: Load testing (500 concurrent users), CDN configuration review, incident response plan required before go-live
- **SEO/Social Meta Tags**: Open Graph tags with clear value proposition for link previews across all pages
- **Council-Specific Headline**: Homepage headline explicitly includes "UK Councils" for immediate relevance recognition
- **What is NDX:Try Link**: Explanatory link/section near headline for new visitors unfamiliar with the platform
- **Quiz Back Navigation**: "← Back" link on each quiz question enabling answer correction
- **Quiz "Not Sure" Option**: Each question includes escape hatch option leading to full gallery
- **Gallery "Best For" Labels**: Each scenario card shows 1-line use case summary (e.g., "Best for: reducing call volume")
- **Most Popular Badge**: Visual indicator on highest-traction scenario for social proof
- **Scenario Page Boundary Messaging**: Clear "Deployment coming soon" messaging if Epic 2 not yet deployed
- **Peer Council References**: Named councils (not just "50+ councils") with brief testimonials on homepage and scenario pages
- **"You'll Learn" Skills List**: Each scenario shows skills gained (e.g., "You'll learn: Lambda, Bedrock, CloudFormation basics")
- **Finance Quick Facts Box**: Maximum cost, G-Cloud route, cost tracking method - displayed on every scenario page
- **Safety Messaging**: "Innovation Sandbox isolated - safe to experiment" prominent on homepage and scenario pages
- **Support Channels Visibility**: GitHub Issues + community links visible from scenario pages and footer
- **Job Enhancement Framing**: "Helps your team, not replaces them" messaging for Service Manager-relevant scenarios

### Content Tone Principles

All Epic 1 copy must adhere to these empathy-driven principles:

1. **Grant permission to try** - "You're not the first, you won't be the last"
2. **Reduce imposter syndrome** - "No AWS expertise required"
3. **Promise safety** - "Isolated sandbox, automatic cleanup, capped cost"
4. **Respect time** - "15 minutes to decide, not 15 hours"
5. **Enable sharing** - "Easy to forward to your team/leadership"

### Out of Scope

- CloudFormation template deployment (Epic 2)
- Demo videos and screenshot galleries (Epic 2)
- Guided walkthroughs and sample data (Epic 3)
- Evidence Pack generation (Epic 4)
- Analytics dashboard and partner integration (Epic 5)
- Form submission handling (delegated to GOV.UK Forms Service)
- Custom domain configuration (documented but not implemented in Epic 1)

### Phase 2 Commitments (Documented)

These items are explicitly planned for future phases, not forgotten:

- Free-text search across scenarios (Algolia or Lunr.js integration)
- Returning user recognition (localStorage-based preferences, no accounts)
- Analytics-informed quiz optimization (A/B testing recommendation algorithm)
- Custom domain configuration (ndx-try.service.gov.uk or similar)
- Scenario comparison view (side-by-side comparison of 2-3 scenarios)
- "Save for later" / email reminder functionality for uncommitted visitors
- Exit feedback survey ("Did you find what you needed?") for journey optimization
- Role-based gallery personalization (show "Recommended for CTOs" if role known)
- Creative enhancements: "Instant Preview" on hover, "Council like mine" filter, 30-second video hooks, scenario "ingredients" view

### Scope Prioritization

**P1 - Launch Blockers** (Must have for launch):
- Portal infrastructure (Eleventy + GOV.UK Frontend + X-GOV plugin)
- Build pipeline with GitHub Actions deployment to GitHub Pages
- Homepage with value proposition, trust indicators, scenario preview grid
- Scenario Gallery with 6 cards (responsive grid, filtering)
- 6 Scenario detail pages with static content
- Navigation structure (header, footer, breadcrumbs)
- WCAG 2.2 AA compliance (automated testing framework)
- Scenario metadata schema with JSON validation
- Progressive enhancement (no-JS fallbacks)
- Official status clarification in footer

**P2 - Launch Enhancers** (Should have, launch can proceed without):
- Scenario Selector Quiz (3-question flow)
- Quick-Start Guide ("Your 15-Minute Journey")
- Quiz user testing with 5+ councils
- External accessibility audit at 75% milestone
- Cost visibility on scenario cards
- Outcome-led naming on cards
- Security/CloudFormation badges on cards
- Most Popular badge
- GitHub prominence in navigation
- Discovery hierarchy (quiz recommended, gallery alternative)

**P3 - Fast Follow** (Deliver within 2 weeks of launch):
- SEO/Social meta tags (Open Graph)
- "What is NDX:Try" explainer section
- Gallery "Best For" labels
- Card A/B testing with council users
- Build pipeline SLA monitoring and alerting
- Quiz back navigation and "Not Sure" options
- Council-specific headline refinement
- Launch readiness checklist execution
- CDN configuration (if traffic warrants)

### Pre-Launch Discovery Tasks

Before finalizing P2 items, gather missing information:
- Survey LGA on expected council reach and traffic volume
- Obtain GDS analytics on council site mobile vs desktop ratio
- Recruit 5+ councils for user testing pipeline
- Confirm budget allocation for external accessibility audit (£2-5K typical)
- Seed "Most Popular" badge data from LGA interest survey

### Value Chain Insights

**Core Value Proposition for Epic 1**:
> "Zero-friction discovery of council-relevant AWS scenarios with enough information to decide"

**Critical Success Factors**:
1. **Homepage creates trust in <5 seconds** - GOV.UK patterns + council-specific headline + trust indicators
2. **Discovery creates relevance match in <2 minutes** - Quiz recommendation accuracy OR Gallery filtering success
3. **Scenario pages create decision confidence** - Cost + time + use case clarity without overwhelm
4. **Handoff to Epic 2 preserves momentum** - Clear next step messaging + prerequisites stated upfront

**Value Chain Validation**: P1 scope (Launch Blockers) delivers complete Minimum Viable Discovery. A user can arrive → find relevant scenario → understand enough to decide. P2 and P3 items enhance but don't enable core value.

**Competitive Advantage**: Zero-friction, council-specific, hands-on AWS evaluation with evidence generation. Epic 1 delivers "zero-friction, council-specific"; Epic 2+ delivers "hands-on" and "evidence."

**Performance Target**: Homepage load time <2 seconds on 10Mbps connection (council network baseline assumption).

## System Architecture Alignment

### Architecture Components Referenced

This epic aligns with the Architecture Decision Records:

| Decision | Component | Epic 1 Implementation |
|----------|-----------|----------------------|
| ADR-1: Portal Model | Static Site (Eleventy 11ty) | Full implementation of Eleventy build with X-GOV plugin |
| ADR-4: Client-Side JS | Pure HTML + Vanilla JavaScript | Quiz logic, filtering, progressive enhancement |
| ADR-6: Design System | GOV.UK Frontend 5.13.0 | All components use GOV.UK patterns |

### Architectural Constraints

- **No runtime infrastructure**: All pages generated at build time
- **No database**: All data stored in YAML files within repository (documented scale limit: <50 scenarios)
- **No server-side logic**: Form handling delegated to external GOV.UK Forms service
- **Static hosting**: GitHub Pages with CDN caching (custom domain configuration documented but deferred)
- **Content-driven**: Markdown files with YAML frontmatter for all content
- **Progressive enhancement**: Core functionality works without JavaScript; JS enhances but doesn't gate access
- **Hosting rationale documented**: Explicit documentation of why GitHub Pages chosen over AWS hosting, addressing credibility optics ("Portal is not the product; AWS scenarios are")
- **Official status clarified**: Footer/about page clarifies NDX:Try's partnership status - developed with GDS Local/AWS, not an official government service
- **Traffic contingency**: CloudFront + S3 migration path documented if GitHub Pages bandwidth limits approached (100GB/month soft limit)
- **Security headers**: Meta tag implementation for CSP where possible; full header control requires CloudFront migration (documented limitation)

## Detailed Design

### Services and Modules

Epic 1 is a static site with no runtime services. All "services" are build-time processes or client-side JavaScript modules.

#### Build-Time Modules

| Module | Technology | Purpose |
|--------|------------|---------|
| **Site Generator** | Eleventy 11ty 2.x | Static HTML generation from Markdown + Nunjucks templates |
| **Design System** | GOV.UK Frontend 5.13.0 | Component library, Sass styles, accessibility patterns |
| **GOV.UK Integration** | X-GOV Eleventy Plugin | Simplified GOV.UK component usage in Nunjucks |
| **Sass Compiler** | Dart Sass | GOV.UK Frontend Sass → CSS compilation |
| **Asset Pipeline** | Eleventy Passthrough | Static assets (images, fonts, JS) copied to output |
| **Schema Validator** | AJV (JSON Schema) | Validates scenarios.yaml against defined schema |
| **Accessibility Checker** | axe-core + pa11y | Automated WCAG 2.2 AA validation in CI |

#### Client-Side Modules

| Module | Technology | Purpose |
|--------|------------|---------|
| **Quiz Logic** | Vanilla JavaScript | 3-question flow, recommendation algorithm, results display |
| **Gallery Filter** | Vanilla JavaScript | Client-side filtering by persona, difficulty, time |
| **Progressive Enhancement** | Vanilla JavaScript | Enhances but doesn't gate functionality |

#### Module Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    BUILD PIPELINE                            │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │ Markdown    │──▶│ Eleventy    │──▶│ Static HTML │       │
│  │ + YAML      │   │ + Nunjucks  │   │ + CSS + JS  │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
│        │                 │                  │               │
│        ▼                 ▼                  ▼               │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │ Schema      │   │ GOV.UK      │   │ GitHub      │       │
│  │ Validation  │   │ Frontend    │   │ Pages       │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Data Models and Contracts

#### Scenario Metadata Schema (scenarios.yaml)

```yaml
# JSON Schema: /schemas/scenario.schema.json
scenarios:
  - id: string                    # Required: URL-safe identifier (e.g., "council-chatbot")
    name: string                  # Required: Display name (e.g., "Council Chatbot")
    headline: string              # Required: Outcome-led title (e.g., "Reduce Call Centre Queries")
    description: string           # Required: 1-2 sentence summary
    best_for: string              # Required: Use case label (e.g., "Best for: reducing call volume")
    difficulty: enum              # Required: beginner | intermediate | advanced
    time_estimate: string         # Required: Human-readable (e.g., "15 minutes")
    estimated_cost: string        # Required: Range (e.g., "£0.50 - £2.00")
    maximum_cost: string          # Required: Cap (e.g., "£5.00")
    personas:                     # Required: Array of target personas
      - enum: cto | service-manager | finance | developer
    aws_services:                 # Required: Array of AWS service names
      - string
    skills_learned:               # Required: Array of skills user will gain
      - string
    tags:                         # Optional: Search/filter tags
      - string
    security_summary: string      # Required: 1-line security posture
    peer_councils:                # Optional: Named council references
      - name: string
        quote: string
    cloudformation_template: path # Required: Path to CloudFormation template
    architecture_diagram: path    # Required: Path to Mermaid diagram
    deployment_guide: path        # Required: Path to deployment guide
    demo_video: path              # Optional: Path to demo video (Epic 2)
    is_most_popular: boolean      # Optional: Flag for "Most Popular" badge
```

#### Quiz Response Schema (quiz-config.yaml)

```yaml
questions:
  - id: challenge
    text: "What's your main challenge?"
    options:
      - id: ai-automation
        label: "AI & Automation"
        description: "Chatbots, document processing, intelligent workflows"
        weight:
          council-chatbot: 5
          planning-ai: 4
          foi-redaction: 3
      - id: not-sure
        label: "Not sure - show me everything"
        action: gallery  # Escape hatch to gallery

  - id: time
    text: "How much time do you have today?"
    options:
      - id: quick
        label: "Under 15 minutes"
        weight:
          council-chatbot: 5  # Quick scenarios weighted higher

  - id: role
    text: "What's your role?"
    options:
      - id: cto
        label: "CTO / Technical Lead"
        persona: cto

recommendation_algorithm:
  method: weighted_sum
  threshold: 3  # Minimum score to recommend
  max_results: 3
```

#### Navigation Schema (navigation.yaml)

```yaml
primary_nav:
  - label: Home
    url: /
  - label: Scenarios
    url: /scenarios/
  - label: Get Started
    url: /get-started/
  - label: Cost Information
    url: /cost-information/
  - label: Accessibility
    url: /accessibility/
  - label: Contact
    url: /contact/

utility_nav:
  - label: GitHub
    url: https://github.com/ndx-org/ndx-try-aws-scenarios
    external: true
    icon: github
```

### APIs and Interfaces

Epic 1 has no runtime APIs. All interfaces are static file-based or client-side.

#### Build-Time Interfaces

| Interface | Type | Description |
|-----------|------|-------------|
| **Eleventy Data Cascade** | File-based | `_data/*.yaml` files available to all templates |
| **Template Includes** | File-based | `_includes/` components available to all pages |
| **Passthrough Copy** | File-based | Static assets from `src/assets/` to `_site/assets/` |

#### Client-Side Interfaces

| Interface | Type | Description |
|-----------|------|-------------|
| **Quiz State** | sessionStorage | Quiz answers stored for session duration |
| **Filter State** | URL params | Gallery filters reflected in URL (`?persona=cto&difficulty=beginner`) |
| **Analytics Events** | dataLayer | GTM-compatible event objects (implementation Epic 5) |

#### External Interfaces

| Interface | Direction | Description |
|-----------|-----------|-------------|
| **GitHub Pages** | Outbound | Deploy target for built site |
| **GOV.UK Forms** | Outbound | External form submission (contact, feedback) |
| **Google Analytics** | Outbound | Event tracking (implementation Epic 5) |

### Workflows and Sequencing

#### Build Workflow (GitHub Actions)

```yaml
# .github/workflows/build-deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate Schema
        run: npx ajv validate -s schemas/scenario.schema.json -d _data/scenarios.yaml

  build:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - name: Accessibility Check
        run: npm run test:a11y
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

#### Quiz Recommendation Workflow

```
User starts quiz
       │
       ▼
┌─────────────────┐
│ Q1: Challenge   │──▶ "Not sure" ──▶ Gallery
└────────┬────────┘
         │ Answer selected
         ▼
┌─────────────────┐
│ Q2: Time        │──▶ Back ──▶ Q1
└────────┬────────┘
         │ Answer selected
         ▼
┌─────────────────┐
│ Q3: Role        │──▶ Back ──▶ Q2
└────────┬────────┘
         │ Answer selected
         ▼
┌─────────────────┐
│ Calculate       │
│ Weighted Scores │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Display Top 1-3 │
│ Recommendations │
│ with Reasoning  │
└────────┬────────┘
         │
         ▼
   [Scenario Page] or [Gallery]
```

#### Page Generation Workflow

```
Markdown content (src/scenarios/*.md)
         │
         ▼
┌─────────────────┐
│ YAML Frontmatter│◀── scenarios.yaml data merge
│ Extraction      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Nunjucks        │◀── _includes/layouts/scenario.njk
│ Template        │◀── _includes/components/*.njk
│ Processing      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GOV.UK Frontend │◀── Sass compilation
│ Styling         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Static HTML     │──▶ _site/scenarios/council-chatbot/index.html
│ Output          │
└─────────────────┘
```

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Homepage Load Time** | <2 seconds | 10 Mbps connection (council network baseline) |
| **Time to First Contentful Paint** | <1.2 seconds | Lighthouse measurement |
| **Largest Contentful Paint** | <2.5 seconds | Lighthouse measurement |
| **Cumulative Layout Shift** | <0.1 | Lighthouse measurement |
| **Time to Interactive** | <3.5 seconds | Lighthouse measurement |
| **Gallery Page Load** | <2 seconds | 6 scenario cards with images |
| **Quiz Completion** | <30 seconds | User completes 3 questions |
| **Build Time** | <3 minutes | GitHub Actions build + test |
| **Build Reliability** | 95%+ | Successful builds / total builds |

**Optimization Strategies:**
- Pre-generated static HTML (no server rendering)
- GOV.UK Frontend CSS minified and tree-shaken
- Images optimized (WebP with PNG fallback, responsive srcset)
- JavaScript deferred loading (non-blocking)
- GitHub Pages CDN caching (default TTL)
- Critical CSS inlined in `<head>`

**Load Constraints:**
- Expected traffic: <100 concurrent users (council business hours)
- GitHub Pages soft limit: 100GB bandwidth/month
- No database queries (all data in static YAML files)
- Scale limit: <50 scenarios (documented, no pagination needed)

### Security

| Control | Implementation | Rationale |
|---------|----------------|-----------|
| **Transport Security** | HTTPS enforced | GitHub Pages default |
| **Content Security Policy** | Meta tag CSP | Limited control without CloudFront |
| **No User Data Collection** | No forms on portal | All forms via GOV.UK Forms (external) |
| **No Authentication** | Public content only | No user accounts, sessions, or PII |
| **Dependency Scanning** | GitHub Dependabot | Automated vulnerability alerts |
| **No Runtime Secrets** | All config in YAML | No API keys, tokens, or credentials |
| **XSS Prevention** | Nunjucks auto-escaping | Template engine default behavior |
| **Link Integrity** | Subresource Integrity | External scripts (if any) use SRI hashes |

**Security Headers (Meta Tag Implementation):**
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;
               frame-ancestors 'none';">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta name="referrer" content="strict-origin-when-cross-origin">
```

**Limitation:** Full HTTP security headers (HSTS, X-Frame-Options) require CloudFront migration. Documented in traffic contingency plan.

**External Dependencies Security:**
- GOV.UK Frontend: Maintained by GDS, trusted source
- No third-party analytics (Epic 5 adds Google Analytics)
- No external JavaScript libraries beyond GOV.UK Frontend

### Reliability/Availability

| Metric | Target | Implementation |
|--------|--------|----------------|
| **Uptime** | 99.9% | GitHub Pages SLA |
| **Recovery Time** | <5 minutes | Static site redeploy |
| **Deployment Success** | 95%+ | Build validation gates |
| **Zero Data Loss** | N/A | No data stored on portal |

**GitHub Pages Reliability:**
- Hosted on GitHub's global CDN infrastructure
- Automatic failover and redundancy
- No single point of failure for static content
- Version control enables instant rollback

**Build Pipeline Reliability:**
- GitHub Actions: 99.9% uptime
- Build SLA: <3 minutes (target)
- Slack notification on build failure (P2 scope)
- Manual redeploy capability via GitHub Actions UI

**Failure Modes and Mitigations:**
| Failure | Impact | Mitigation |
|---------|--------|------------|
| GitHub Pages outage | Portal unavailable | Monitor GitHub status; document CloudFront migration path |
| Build failure | Updates blocked | Validation gates catch errors; manual override available |
| DNS propagation | Custom domain delay | Use GitHub Pages default URL as backup |

**Traffic Contingency:**
- GitHub Pages bandwidth: 100GB/month soft limit
- Migration path documented: CloudFront + S3 if limits approached
- Monitoring: GitHub traffic insights for early warning

### Observability

**Epic 1 Scope** (Minimal Observability - Foundation Only):

| Component | Implementation | Purpose |
|-----------|----------------|---------|
| **Build Logs** | GitHub Actions | Debug build failures |
| **Traffic Insights** | GitHub repo traffic | Basic visitor counts |
| **Error Pages** | Custom 404.html | User-friendly error handling |
| **Lighthouse CI** | GitHub Action | Performance regression detection |

**Monitoring Dashboard** (P3 - Fast Follow):
- Build pipeline status badge in README
- Build time trend (GitHub Actions insights)
- Accessibility test pass rate

**No Real-Time Monitoring in Epic 1:**
- No application performance monitoring (APM)
- No error tracking service (Sentry, etc.)
- No server-side logging (static site)
- Rationale: Minimal runtime complexity; add in Epic 5 with analytics

## Dependencies and Integrations

### External Dependencies

| Dependency | Version | Purpose | Risk Level |
|------------|---------|---------|------------|
| **Eleventy** | 2.x (latest) | Static site generator | Low - mature, stable API |
| **GOV.UK Frontend** | 5.13.0 | Design system, components | Low - GDS maintained |
| **X-GOV Eleventy Plugin** | Latest | GOV.UK Frontend integration | Low - official plugin |
| **Dart Sass** | Latest | Sass compilation | Low - widely used |
| **AJV** | 8.x | JSON Schema validation | Low - industry standard |
| **axe-core** | Latest | Accessibility testing | Low - Deque maintained |
| **pa11y** | Latest | Accessibility CI testing | Low - widely adopted |
| **Node.js** | 20.x LTS | Build runtime | Low - LTS release |

### Platform Dependencies

| Platform | Purpose | SLA | Fallback |
|----------|---------|-----|----------|
| **GitHub Pages** | Static hosting | 99.9% | CloudFront + S3 migration documented |
| **GitHub Actions** | CI/CD pipeline | 99.9% | Manual local build + deploy |
| **GitHub Repository** | Source control | 99.9% | Local Git mirrors |
| **GOV.UK Forms** | Form handling (future) | GDS SLA | Static contact info |

### Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                     Epic 1 Integration Map                       │
└─────────────────────────────────────────────────────────────────┘

 Build Time                          Runtime (Client)
 ──────────                          ────────────────
 ┌───────────┐                       ┌───────────────┐
 │ GitHub    │──push──▶ Actions ──▶ │ GitHub Pages  │
 │ Repo      │         (build)       │ (static host) │
 └───────────┘                       └───────┬───────┘
       │                                     │
       ▼                                     ▼
 ┌───────────┐                       ┌───────────────┐
 │ scenarios │                       │ User Browser  │
 │ .yaml     │                       │ (Vanilla JS)  │
 └───────────┘                       └───────┬───────┘
                                             │
                                             ▼
                                     ┌───────────────┐
                                     │ External:     │
                                     │ - GOV.UK Forms│ (Epic 5)
                                     │ - GA4         │ (Epic 5)
                                     └───────────────┘
```

### Dependency Versioning Strategy

**Lock File:** `package-lock.json` committed to repository
**Node Version:** `.nvmrc` specifies Node 20.x LTS
**Update Cadence:** Monthly dependency review
**Security:** Dependabot alerts enabled, automatic PRs for patches

### Epic 1 → Future Epic Handoffs

| Handoff | From Epic 1 | To Epic | Integration Point |
|---------|-------------|---------|-------------------|
| Scenario Metadata | `scenarios.yaml` schema | Epic 2 | CloudFormation template links |
| Quiz Config | `quiz-config.yaml` structure | Epic 5 | Analytics event tracking |
| Navigation | `navigation.yaml` | Epic 2-5 | New pages added to nav |
| Component Library | `_includes/components/` | All | Reusable Nunjucks macros |
| Build Pipeline | `build-deploy.yml` | Epic 2 | Add CloudFormation validation |
| Accessibility Framework | axe-core + pa11y setup | All | All pages validated |

### No External API Dependencies

Epic 1 has **zero runtime API dependencies**:
- No third-party JavaScript libraries
- No external data fetching
- No authentication services
- No backend APIs

All data is embedded at build time via Eleventy data cascade.

## Acceptance Criteria (Authoritative)

This section consolidates all acceptance criteria for Epic 1 as the single source of truth for implementation validation.

### AC-1.1: Portal Foundation & Infrastructure

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1.1.1 | Homepage loads in <2 seconds on 10 Mbps connection | Lighthouse CI |
| AC-1.1.2 | All pages pass WCAG 2.2 AA automated validation | axe-core + pa11y |
| AC-1.1.3 | All pages navigable via keyboard only | Manual testing |
| AC-1.1.4 | Screen reader announces all content correctly | VoiceOver/NVDA test |
| AC-1.1.5 | Build completes in <3 minutes | GitHub Actions timer |
| AC-1.1.6 | Build fails on accessibility errors | CI gate validation |
| AC-1.1.7 | Navigation bar renders on all pages | Visual inspection |
| AC-1.1.8 | Footer includes GitHub link and official status | Visual inspection |
| AC-1.1.9 | 404 page displays user-friendly error | Navigate to /nonexistent |

### AC-1.2: Homepage Content & Trust Architecture

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1.2.1 | Headline explicitly includes "UK Councils" | Visual inspection |
| AC-1.2.2 | Value proposition visible above fold | 768px viewport test |
| AC-1.2.3 | Trust indicators display (council count, time, commitment) | Visual inspection |
| AC-1.2.4 | "What is NDX:Try" link/section present | Visual inspection |
| AC-1.2.5 | Scenario preview grid shows 6 cards | Card count |
| AC-1.2.6 | Primary CTA "Find Your Scenario" visible | Visual inspection |
| AC-1.2.7 | Secondary "Browse All" link visible | Visual inspection |
| AC-1.2.8 | LGA acknowledgment placeholder present | Visual inspection |
| AC-1.2.9 | GitHub "Open Source (MIT)" indicator present | Visual inspection |
| AC-1.2.10 | Safety messaging visible ("Innovation Sandbox isolated") | Visual inspection |

### AC-1.3: Scenario Gallery

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1.3.1 | Gallery displays 6 scenario cards | Card count |
| AC-1.3.2 | Cards show: name, headline, description, difficulty, time, cost | Visual inspection |
| AC-1.3.3 | Cards show "Best For" use case label | Visual inspection |
| AC-1.3.4 | Estimated and maximum cost visible on each card | Visual inspection |
| AC-1.3.5 | "Security Badge" indicator visible | Visual inspection |
| AC-1.3.6 | "CloudFormation Badge" indicator visible | Visual inspection |
| AC-1.3.7 | Filter by persona works correctly | Functional test |
| AC-1.3.8 | Filter by difficulty works correctly | Functional test |
| AC-1.3.9 | Filter by time estimate works correctly | Functional test |
| AC-1.3.10 | Gallery responsive at 320px, 768px, 1024px, 1440px | Viewport test |
| AC-1.3.11 | "Most Popular" badge visible on designated scenario | Visual inspection |
| AC-1.3.12 | Cards function without JavaScript | Disable JS test |

### AC-1.4: Scenario Detail Pages

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1.4.1 | 6 scenario pages generated from scenarios.yaml | Page count |
| AC-1.4.2 | Each page displays: headline, description, AWS services | Visual inspection |
| AC-1.4.3 | Each page displays: difficulty, time, estimated cost, max cost | Visual inspection |
| AC-1.4.4 | Finance Quick Facts Box visible | Visual inspection |
| AC-1.4.5 | "You'll Learn" skills list visible | Visual inspection |
| AC-1.4.6 | Peer council references visible (if available) | Visual inspection |
| AC-1.4.7 | Security summary visible | Visual inspection |
| AC-1.4.8 | Support channels visible (GitHub Issues link) | Visual inspection |
| AC-1.4.9 | "Deployment coming soon" boundary messaging visible | Visual inspection |
| AC-1.4.10 | Breadcrumb navigation works | Click test |
| AC-1.4.11 | Back link returns to gallery | Click test |
| AC-1.4.12 | Page passes WCAG 2.2 AA validation | axe-core |

### AC-1.5: Scenario Selector Quiz (P2)

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1.5.1 | Quiz presents 3 questions sequentially | Functional test |
| AC-1.5.2 | Each question has "Not Sure" escape option | Visual inspection |
| AC-1.5.3 | "Not Sure" navigates to full gallery | Click test |
| AC-1.5.4 | Back navigation available on questions 2 and 3 | Click test |
| AC-1.5.5 | Quiz completes in <30 seconds (measured) | Stopwatch test |
| AC-1.5.6 | Results page shows 1-3 recommendations | Functional test |
| AC-1.5.7 | Results include reasoning explanation | Visual inspection |
| AC-1.5.8 | "Browse All" alternative available from results | Visual inspection |
| AC-1.5.9 | Quiz accessible via keyboard navigation | Manual test |
| AC-1.5.10 | Quiz works on mobile (touch targets ≥44px) | Device test |
| AC-1.5.11 | Quiz functions without JavaScript (graceful degradation) | Disable JS test |

### AC-1.6: Quick-Start Guide (P2)

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1.6.1 | Guide displays 6 visual steps | Visual inspection |
| AC-1.6.2 | Each step includes screenshot and time estimate | Visual inspection |
| AC-1.6.3 | "Ready? Start Here" CTA links to quiz/homepage | Click test |
| AC-1.6.4 | Guide responsive on mobile | 320px viewport test |
| AC-1.6.5 | All images have alt text | Accessibility audit |

### AC-1.7: Schema Validation & Build Pipeline

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1.7.1 | scenarios.yaml validated against JSON schema | CI log inspection |
| AC-1.7.2 | Build fails on invalid scenario metadata | Invalid YAML test |
| AC-1.7.3 | Error messages are actionable (show missing field) | Error output test |
| AC-1.7.4 | Build logs available in GitHub Actions | CI inspection |
| AC-1.7.5 | Lighthouse CI runs on every PR | CI log inspection |
| AC-1.7.6 | Deploy triggers only on main branch | PR test (no deploy) |

### AC-1.8: SEO & Social (P3)

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1.8.1 | Open Graph meta tags present on all pages | HTML inspection |
| AC-1.8.2 | og:title, og:description, og:image populated | Meta tag validation |
| AC-1.8.3 | Link previews display correctly in Slack/Teams | Manual share test |

### Acceptance Criteria Verification Matrix

| Story | Total ACs | Automated | Manual |
|-------|-----------|-----------|--------|
| 1.1 Portal Foundation | 9 | 6 | 3 |
| 1.2 Homepage Content | 10 | 2 | 8 |
| 1.3 Scenario Gallery | 12 | 6 | 6 |
| 1.4 Scenario Pages | 12 | 3 | 9 |
| 1.5 Quiz (P2) | 11 | 4 | 7 |
| 1.6 Quick-Start (P2) | 5 | 1 | 4 |
| 1.7 Build Pipeline | 6 | 6 | 0 |
| 1.8 SEO (P3) | 3 | 2 | 1 |
| **Total** | **68** | **30** | **38** |

## Traceability Mapping

This section maps PRD requirements (FRs) to Epic 1 implementation artifacts and acceptance criteria.

### FR → Epic 1 Story Mapping

| FR ID | Requirement | Epic 1 Story | Status |
|-------|-------------|--------------|--------|
| FR4 | Portal provides searchable scenario gallery with cards | Story 1.3 | P1 |
| FR5 | Scenario Selector quiz (3-question flow) recommends scenarios | Story 1.5 | P2 |
| FR6 | Scenario Selector provides reasoning for recommendations | Story 1.5 (AC-1.5.7) | P2 |
| FR7 | Portal provides quick-start guide to 15-minute success | Story 1.6 | P2 |
| FR26 | Scenario pages include use case, AWS services, time, cost | Story 1.4 | P1 |
| FR41 | Portal achieves WCAG 2.2 AA compliance | Story 1.1 (AC-1.1.2) | P1 |
| FR43 | All images include alt text | Story 1.6 (AC-1.6.5) | P2 |

### FR → Acceptance Criteria Mapping

| FR ID | Primary AC | Secondary ACs |
|-------|------------|---------------|
| FR4 | AC-1.3.1 (Gallery displays 6 cards) | AC-1.3.2, AC-1.3.7-9 |
| FR5 | AC-1.5.1 (Quiz presents 3 questions) | AC-1.5.5, AC-1.5.6 |
| FR6 | AC-1.5.7 (Results include reasoning) | - |
| FR7 | AC-1.6.1 (Guide displays 6 steps) | AC-1.6.2, AC-1.6.3 |
| FR26 | AC-1.4.2, AC-1.4.3 | AC-1.4.4-8 |
| FR41 | AC-1.1.2 (WCAG 2.2 AA) | AC-1.1.3, AC-1.1.4 |
| FR43 | AC-1.6.5 (Alt text) | AC-1.4.12 |

### UX Design → Implementation Mapping

| UX Component | Tech Spec Section | Implementation |
|--------------|-------------------|----------------|
| Homepage Layout | AC-1.2 | `src/index.md` + `_includes/layouts/base.njk` |
| Scenario Card | AC-1.3.2-6 | `_includes/components/scenario-card.njk` |
| Gallery Grid | AC-1.3.1, AC-1.3.10 | `src/scenarios/index.md` + gallery CSS |
| Quiz Flow | AC-1.5.1-11 | `src/quiz.md` + `assets/js/quiz.js` |
| Navigation | AC-1.1.7 | `_includes/components/header.njk` + `navigation.yaml` |
| Scenario Page | AC-1.4.1-12 | `src/scenarios/*.md` + `_includes/layouts/scenario.njk` |
| Quick-Start Guide | AC-1.6.1-5 | `src/get-started.md` |

### Architecture Decision → Implementation Mapping

| ADR | Implementation Impact | Verification |
|-----|----------------------|--------------|
| ADR-1: Static Site (Eleventy) | All content in Markdown/YAML, build-time generation | AC-1.7.1-6 |
| ADR-4: Vanilla JavaScript | Quiz logic, gallery filtering - no frameworks | AC-1.3.12, AC-1.5.11 |
| ADR-6: GOV.UK Frontend 5.13.0 | All components use GOV.UK patterns | Visual inspection |

### Scope Item → AC Mapping (Elicitation-Derived)

| Scope Item | Source | Primary AC |
|------------|--------|------------|
| Discovery Hierarchy | SWOT + Devil's Advocate | AC-1.2.6, AC-1.2.7 |
| Cost Visibility | Stakeholder Mapping | AC-1.3.4, AC-1.4.3 |
| Outcome-Led Naming | Stakeholder Mapping | AC-1.3.2 (headline field) |
| Security Badge | Stakeholder Mapping | AC-1.3.5 |
| CloudFormation Badge | Stakeholder Mapping | AC-1.3.6 |
| Quiz Back Navigation | Journey Mapping | AC-1.5.4 |
| Quiz "Not Sure" Option | Journey Mapping | AC-1.5.2, AC-1.5.3 |
| Most Popular Badge | Journey Mapping | AC-1.3.11 |
| Peer Council References | Empathy Map | AC-1.4.6 |
| "You'll Learn" Skills | Empathy Map | AC-1.4.5 |
| Finance Quick Facts | Empathy Map | AC-1.4.4 |
| Safety Messaging | Empathy Map | AC-1.2.10 |

### File → FR/AC Traceability

| File Path | FRs Addressed | Key ACs |
|-----------|---------------|---------|
| `src/index.md` | - | AC-1.2.1-10 |
| `src/scenarios/index.md` | FR4 | AC-1.3.1-12 |
| `src/scenarios/*.md` | FR26 | AC-1.4.1-12 |
| `src/quiz.md` | FR5, FR6 | AC-1.5.1-11 |
| `src/get-started.md` | FR7 | AC-1.6.1-5 |
| `_data/scenarios.yaml` | FR4, FR26 | AC-1.7.1-3 |
| `_data/quiz-config.yaml` | FR5, FR6 | AC-1.5.6 |
| `schemas/scenario.schema.json` | - | AC-1.7.1-3 |
| `.github/workflows/build-deploy.yml` | FR41 | AC-1.7.4-6, AC-1.1.5-6 |

### Coverage Gaps (Intentional)

These FRs are explicitly **out of scope** for Epic 1:

| FR ID | Requirement | Target Epic |
|-------|-------------|-------------|
| FR8 | One-click CloudFormation deployment | Epic 2 |
| FR9 | Real-time stack events | Epic 2 |
| FR13 | Demo Walkthrough guide | Epic 3 |
| FR16 | "What You Experienced" reflection | Epic 4 |
| FR18 | Evidence Pack generator | Epic 4 |
| FR33 | Session event capture | Epic 5 |
| FR34 | Analytics dashboard | Epic 5 |

## Risks, Assumptions, Open Questions

### Risks

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|------------|--------|------------|-------|
| R1 | Quiz recommendation accuracy below 80% | Medium | High | Pre-launch user testing with 5+ councils; fallback to gallery-first discovery | PM |
| R2 | GOV.UK Frontend update breaks compatibility | Low | Medium | Pin version 5.13.0; monthly review for security patches only | Dev Lead |
| R3 | GitHub Pages bandwidth exceeded | Low | High | CloudFront + S3 migration path documented; monitor traffic insights | DevOps |
| R4 | Accessibility audit reveals critical issues | Medium | High | Schedule audit at 75% milestone (not pre-launch); budget £2-5K | PM |
| R5 | Build pipeline exceeds 3-minute target | Medium | Low | Performance profiling; parallel job optimization; caching | Dev Lead |
| R6 | Scenario metadata schema becomes unwieldy | Low | Medium | Document extension pattern; review before >10 scenarios | Architect |
| R7 | Council network blocks GitHub Pages | Low | Medium | Custom domain configuration (Phase 2); document workaround | DevOps |
| R8 | LGA branding/acknowledgment delayed | High | Low | Placeholder components allow launch without final branding | PM |
| R9 | Quiz adoption <50% after launch | Medium | Medium | Feature flag canary launch; A/B test quiz vs gallery entry points | PM |
| R10 | Content tone fails to build trust | Medium | High | Apply Empathy Map principles; user test messaging with councils | UX |

### Assumptions

| ID | Assumption | Rationale | Validation Method |
|----|------------|-----------|-------------------|
| A1 | Target users have 10 Mbps+ internet | Council office baseline; GDS research | Survey LGA contacts |
| A2 | Mobile traffic <30% of total | Council employees use desktops during work hours | Analytics (Epic 5) |
| A3 | 6 scenarios sufficient for launch | MVP scope; expansion planned in Phase 2 | User feedback post-launch |
| A4 | GOV.UK Frontend provides sufficient components | Review of UX spec vs component library | Spike during Story 1.1 |
| A5 | Councils accept GitHub Pages hosting | Static site is "not the product"; AWS scenarios are | Stakeholder review |
| A6 | <50 scenarios long-term | No pagination needed; YAML data manageable | Annual capacity review |
| A7 | Quiz can run entirely client-side | 3 questions × 6 scenarios = simple scoring | Prototype validation |
| A8 | No user accounts needed for Epic 1 | All content public; personalization in Phase 2 | PRD scope confirmation |
| A9 | English-only content acceptable | UK councils; Welsh translation in Phase 2 if needed | LGA guidance |
| A10 | 15-minute success path is compelling | PRD value proposition; validates with user research | Quiz completion rate |

### Open Questions (Resolved)

| ID | Question | Resolution | Impact |
|----|----------|------------|--------|
| Q1 | What is the expected traffic volume at launch? | **~1,000/week** | GitHub Pages adequate; no CDN needed initially |
| Q2 | Which scenario should be "Most Popular"? | **Call Centre scenario** | Badge applied to council-chatbot |
| Q3 | Can we obtain named council testimonials? | **Placeholders for now** | Launch with placeholder text; update post-launch |
| Q4 | What is the budget for external accessibility audit? | **£0 - internal only** | Team conducts thorough internal audit; no external |
| Q5 | Should quiz be feature-flagged for canary rollout? | **No** | Ship quiz directly; simpler implementation |
| Q6 | What analytics events should the stub prepare for? | **None** | Remove analytics stub from Epic 1; defer entirely to Epic 5 |
| Q7 | Is custom domain (ndx-try.gov.uk) available? | **aws.try.ndx.digital.cabinet-office.gov.uk** | Domain confirmed; configure in deployment |
| Q8 | What is the G-Cloud procurement guidance content? | **Placeholder** | Stub page with "Coming soon" messaging |
| Q9 | Should "Deployment coming soon" link to Epic 2 roadmap? | **Yes** | Include link to roadmap/timeline for Epic 2 |
| Q10 | How will LGA co-promotion work operationally? | **TBD** | Remains open; not a launch blocker |

### Implementation Notes from Q&A

**Traffic (Q1):** 1,000 visits/week ≈ 150/day ≈ 6/hour average. Well within GitHub Pages limits (100GB/month). No performance concerns.

**Accessibility (Q4):** Internal-only audit means:
- Increased responsibility on dev team for WCAG 2.2 AA compliance
- axe-core + pa11y automation becomes critical quality gate
- Manual screen reader testing required per story
- Consider recruiting council users for accessibility feedback

**Analytics (Q6):** Remove analytics stub code from Epic 1 scope. Simplifies implementation.

**Domain (Q7):** Update deployment configuration for `aws.try.ndx.digital.cabinet-office.gov.uk`

### Pre-Mortem Insights (From Elicitation)

**Potential Failure Modes Identified:**
1. Quiz questions too abstract → councils can't relate → add concrete examples
2. Scenario cards visually identical → no differentiation → add persona badges, Most Popular indicator
3. Trust indicators feel hollow → no named councils → secure testimonials early
4. Build failures block iteration → CI/CD fragile → SLA + alerting + documented retries
5. Accessibility audit too late → critical issues at launch → schedule at 75% milestone

**Mitigation Actions Already Incorporated:**
- Quiz user testing requirement (P2 scope)
- Card A/B testing (P3 scope)
- Build pipeline SLA (P2 scope)
- Early accessibility audit (scope adjustment)
- Peer council references (Empathy Map addition)

## Test Strategy Summary

### Testing Pyramid for Epic 1

```
                    ┌─────────────────┐
                    │   E2E Tests     │  (Manual)
                    │   - User flows  │  5-10 tests
                    │   - Quiz path   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │      Integration Tests       │  (Automated)
              │  - Build pipeline            │  10-15 tests
              │  - Accessibility (axe-core)  │
              │  - Schema validation         │
              └──────────────┬───────────────┘
                             │
       ┌─────────────────────┴─────────────────────┐
       │              Unit Tests                    │  (Automated)
       │  - Quiz recommendation algorithm          │  20-30 tests
       │  - Gallery filter logic                   │
       │  - Nunjucks template rendering            │
       └───────────────────────────────────────────┘
```

### Automated Testing Framework

| Test Type | Tool | Trigger | Failure Action |
|-----------|------|---------|----------------|
| **Accessibility** | axe-core + pa11y | Every PR | Block merge |
| **Schema Validation** | AJV | Every PR | Block merge |
| **Performance** | Lighthouse CI | Every PR | Warn (block if <50) |
| **Build Verification** | GitHub Actions | Every commit | Block deploy |
| **Link Checking** | html-proofer | Weekly | Issue created |

### Test Coverage Targets

| Area | Target | Measurement |
|------|--------|-------------|
| Quiz Logic | 90%+ | Jest coverage |
| Filter Logic | 90%+ | Jest coverage |
| Schema Validation | 100% | All fields tested |
| Accessibility | 100% pages | axe-core + pa11y |
| Browser Support | Chrome, Firefox, Safari, Edge | BrowserStack (manual) |

### Manual Testing Requirements

#### Pre-Launch Checklist

| Test | Scope | Owner | Frequency |
|------|-------|-------|-----------|
| Keyboard Navigation | All interactive elements | QA | Per story |
| Screen Reader | VoiceOver + NVDA | QA | Per story |
| Mobile Responsiveness | 320px, 768px, 1024px | QA | Per story |
| Cross-Browser | Chrome, Firefox, Safari, Edge | QA | Per sprint |
| Quiz User Testing | 5+ councils | PM | Pre-launch (P2) |
| Content Review | Tone, accuracy | PM | Pre-launch |
| Print Stylesheet | Scenario pages | QA | Pre-launch |

#### User Acceptance Testing

| Persona | Test Scenarios | Success Criteria |
|---------|----------------|------------------|
| **CTO** | Find security-focused scenario in <2 min | Locates scenario via quiz or gallery |
| **Service Manager** | Complete quiz and understand recommendation | Quiz completion + scenario page visit |
| **Finance** | Find cost information quickly | Cost visible on card and page |
| **Developer** | Find CloudFormation template link | GitHub badge visible, link works |

### Test Data Requirements

**Scenario Test Data:**
- 6 complete scenario entries in scenarios.yaml
- At least one scenario per difficulty level
- At least one scenario per persona
- At least one with peer_councils data
- At least one marked is_most_popular: true

**Quiz Test Data:**
- Quiz config with all 3 questions
- Weight matrix covering all 6 scenarios
- "Not Sure" escape routes configured

### Accessibility Testing Protocol

**Automated (Every PR):**
```bash
# axe-core via pa11y
npm run test:a11y
# Runs pa11y against all generated pages
# Fails on: critical, serious accessibility violations
# Warns on: moderate, minor violations
```

**Manual (Per Story):**
1. Tab through all interactive elements (correct focus order)
2. Activate all buttons/links via Enter/Space
3. Check color contrast (not sole indicator)
4. Test with VoiceOver (macOS) or NVDA (Windows)
5. Verify skip links work
6. Check reduced motion preference respected

### Performance Testing

**Lighthouse CI Thresholds:**
```json
{
  "performance": 80,
  "accessibility": 95,
  "best-practices": 90,
  "seo": 90
}
```

**Load Testing (Launch Readiness - P3):**
- Tool: k6 or Artillery
- Target: 500 concurrent users
- Pages: Homepage, Gallery, 3 scenario pages
- Success: <2s response time at p95

### Regression Testing Strategy

**Trigger:** Any change to:
- `_includes/` templates
- `_data/scenarios.yaml`
- `assets/js/*.js`
- `.eleventy.js` configuration
- `package.json` dependencies

**Scope:** Full accessibility + Lighthouse CI + visual inspection

### Bug Triage Criteria

| Severity | Definition | Response |
|----------|------------|----------|
| **Critical** | Accessibility blocker, data loss, security | Fix before merge |
| **High** | Feature broken for >50% users | Fix in same sprint |
| **Medium** | Feature degraded, workaround exists | Fix in next sprint |
| **Low** | Cosmetic, edge case | Backlog |

---

*Document generated: 2025-11-28*
*Status: Ready for Implementation*
*Open Questions: 9/10 resolved (Q10 LGA co-promotion remains TBD)*
*Domain: aws.try.ndx.digital.cabinet-office.gov.uk*
*Next: Story creation and sprint planning*
