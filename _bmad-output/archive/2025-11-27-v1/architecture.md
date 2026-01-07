# Architecture: NDX:Try AWS Scenarios

**Author:** Architecture Team (Facilitated Collaborative Decision)
**Date:** 2025-11-27
**Status:** Final
**Methodology:** BMM Method (Architecture Workflow)

---

## Executive Summary

NDX:Try AWS Scenarios is a **lightweight, static-first architecture** designed to deliver guided CloudFormation scenario evaluation to UK local government councils. The system consists of two complementary artifacts:

1. **Portal (Static Site)**: Eleventy-generated website hosted on GitHub Pages
2. **CloudFormation Templates**: Pre-built, reference implementation scenarios

The architecture prioritizes **simplicity**, **accessibility**, and **zero runtime complexity** to enable rapid deployment and minimal maintenance burden.

**Core Principle**: All complex logic (forms, accessibility, security) outsourced to specialized services (GOV.UK Forms, GOV.UK Frontend). Portal focuses on content discovery and scenario linking.

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User (Council)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┬───────────────────┐
        │                         │                   │
┌───────▼────────────┐  ┌────────▼──────────┐  ┌─────▼──────────┐
│  Portal            │  │ GOV.UK Forms      │  │ CloudFormation │
│  (Static Site)     │  │ (External Service)│  │ Templates      │
│  - GitHub Pages    │  │ - Quiz            │  │ (S3 Ref)       │
│  - Eleventy        │  │ - Evidence Pack   │  │ - Pre-built    │
│  - GOV.UK Frontend │  │ - Data Storage    │  │ - Deployable   │
└───────┬────────────┘  └────────────────────┘  └────────────────┘
        │                                        │
        │ Links to forms                         │ Deploy to
        │ (via forms.yaml)                       │ Innovation
        │                                        │ Sandbox
        │                                        │
        └────────────────────┬───────────────────┘
                             │
                    ┌────────▼──────────┐
                    │ User's AWS Account │
                    │ (Innovation        │
                    │  Sandbox)          │
                    │ Tagged Resources   │
                    └────────────────────┘
```

---

## 2. Architectural Decisions

### Decision 1: Portal Delivery Model

**Selected**: Static Site Generation (Eleventy 11ty)

**Rationale**:
- Zero runtime infrastructure (no server, database, or backend API)
- GitHub Pages hosting eliminates DevOps complexity
- Markdown-first content enables version control
- Build-time processing (Eleventy) pre-generates all assets
- GOV.UK Frontend provides accessibility and design system compliance

**Alternatives Considered**:
- Next.js: Added complexity for no benefit (portal is read-only)
- Docusaurus: Generic docs tool, not designed for government services
- Custom Node backend: Unmaintainable overhead for static content

**Integration Impact**: All content pages, navigation, and scenarios built at deployment time (GitHub Actions) and deployed as static HTML/CSS/JS.

---

### Decision 2: Evidence Pack PDF Generation

**Selected**: Build-Time PDF Generation via Puppeteer (GitHub Actions)

**Rationale**:
- PDFs generated once during build, not on-demand
- No runtime Lambda or serverless infrastructure needed
- Deterministic output (same inputs always produce same PDF)
- GitHub Actions provides free CI/CD pipeline
- Eliminates client-side complexity

**Implementation**:
- GitHub Actions workflow executes Puppeteer at build time
- HTML template → PDF via Puppeteer
- PDFs hosted as static assets on GitHub Pages
- Portal links to pre-generated PDFs (no runtime generation)

**Alternative Considered**:
- Client-side generation (jsPDF): Browser dependency, unpredictable rendering
- Lambda runtime (serverless): Additional AWS infrastructure, operational overhead
- Server-side generation: Contradicts static site philosophy

---

### Decision 3: Form Handling & Data Storage

**Selected**: GOV.UK Forms Service (External Managed Service)

**Rationale**:
- GOV.UK Forms service provides production-proven accessibility (WCAG 2.2 AA)
- Outsources form submission, validation, and data storage to gov.uk
- Portal only manages form URLs (no submission logic)
- Response data stored securely in GOV.UK Forms (GDPR compliant)
- No custom form code required
- Eliminates security and accessibility work

**Implementation**:
- Two forms created in GOV.UK Forms service:
  - **Scenario Selector Quiz**: 3-question discovery (routes to scenarios)
  - **Evidence Pack Generator**: 8-field evaluation capture (generates PDF)
- Portal configuration file (`forms.yaml`) manages form URLs
- Template syntax: `<a href="{{ forms.scenario_selector_quiz.live_url }}">`
- Development uses placeholder URLs, production uses live gov.uk URLs
- Zero code changes needed for dev→prod transition

**Form URLs Management**:
```yaml
# src/_data/forms.yaml
forms:
  scenario_selector_quiz:
    dev_url: "https://placeholder.example.com/forms/scenario-selector"
    live_url: "https://forms.service.gov.uk/ndx-try/scenario-selector"

  evidence_pack_generator:
    dev_url: "https://placeholder.example.com/forms/evidence-pack"
    live_url: "https://forms.service.gov.uk/ndx-try/evidence-pack"
```

---

### Decision 4: Form Handling (Client-Side Interaction)

**Selected**: Pure HTML + Vanilla JavaScript (Progressive Enhancement)

**Rationale**:
- GOV.UK Forms service handles all form logic (no portal logic needed)
- Portal only provides links to forms via navigation/CTAs
- No form state management required
- Aligns with static site philosophy (no framework overhead)
- GOV.UK Frontend components are plain HTML/CSS

**Client-Side JavaScript Usage** (Minimal):
- Interaction analytics: Click tracking on form links
- Progressive disclosure: Show/hide scenario details
- Accessibility: Focus management, keyboard navigation
- NO form validation, submission, or state management (GOV.UK Forms handles)

**Alternative Considered**:
- Lightweight framework (Alpine.js, HTMX): Unnecessary complexity
- Full form validation framework: Contradicts "outsource to GOV.UK Forms"

---

### Decision 5: Analytics & Deployment Tracking

**Selected**: CloudFormation Resource Tagging (Post-Deployment Tracking)

**Rationale**:
- Users deploy templates to their Innovation Sandbox AWS accounts
- Resource tags track: scenario name, git-hash, git-tag
- No real-time analytics backend needed
- Councils can query their own AWS costs by scenario tag
- Decentralized tracking (no central data collection)

**Implementation**:
- CloudFormation templates include parameter tags:
  ```yaml
  Parameters:
    ScenarioTag:
      Type: String
      Default: "council-chatbot"

    GitHash:
      Type: String
      Default: "abc123def456"

    GitTag:
      Type: String
      Default: "v1.0.0"

  Resources:
    SampleResource:
      Type: AWS::S3::Bucket
      Properties:
        Tags:
          - Key: "scenario"
            Value: !Ref ScenarioTag
          - Key: "git-hash"
            Value: !Ref GitHash
          - Key: "git-tag"
            Value: !Ref GitTag
  ```
- Users view their deployed resources via AWS Console (Cost Explorer, Resource Groups)

**Alternative Considered**:
- Dedicated analytics backend: Added infrastructure, privacy concerns
- Database tracking: Requires user submissions, no automatic tracking

---

### Decision 6: Design System & Styling

**Selected**: GOV.UK Frontend 5.13.0 (Design System)

**Rationale**:
- Production-proven design system for UK government digital services
- WCAG 2.2 AA compliance built-in
- Eleventy X-GOV plugin provides official integration
- No custom design work needed (use GOV.UK patterns directly)
- Accessibility, color contrast, typography already validated

**Technology Stack**:
- **Design System**: GOV.UK Frontend 5.13.0
- **Generator**: Eleventy 11ty (with X-GOV plugin)
- **Styling**: GOV.UK Frontend CSS + minimal custom CSS (BEM naming)
- **Icons/Images**: GOV.UK icon set + scenario screenshots
- **Hosting**: GitHub Pages (static deployment)

**Component Patterns**:
- Use GOV.UK Frontend components as-is for standard elements
- Custom components wrap GOV.UK components (e.g., scenario card = GOV.UK card + custom data)
- No component library abstraction needed (GOV.UK provides this)

---

## 3. Project Structure

```
ndx-try-aws-scenarios/
├── src/
│   ├── _data/                    # Configuration & Data
│   │   ├── forms.yaml            # Form URLs (dev/live)
│   │   ├── scenarios.yaml        # Scenario metadata
│   │   ├── site.yaml             # Global configuration
│   │   └── navigation.yaml       # Navigation structure
│   │
│   ├── _includes/                # Reusable Templates (Nunjucks)
│   │   ├── layouts/
│   │   │   ├── base.njk          # Base page layout
│   │   │   ├── scenario.njk      # Scenario detail template
│   │   │   └── case-study.njk    # Case study template
│   │   │
│   │   ├── components/           # Reusable page sections
│   │   │   ├── header.njk        # Site header with nav
│   │   │   ├── footer.njk        # Site footer
│   │   │   ├── scenario-card.njk # Scenario card component
│   │   │   ├── quiz-cta.njk      # Quiz call-to-action
│   │   │   └── evidence-cta.njk  # Evidence pack CTA
│   │   │
│   │   └── macros/               # Template macros
│   │       ├── gov-button.njk    # GOV.UK button wrapper
│   │       └── scenario-list.njk # List of scenarios
│   │
│   ├── assets/                   # Static Assets
│   │   ├── css/
│   │   │   ├── main.css          # Custom CSS (minimal, BEM)
│   │   │   └── print.css         # Print styles
│   │   │
│   │   ├── js/                   # JavaScript (Vanilla, Minimal)
│   │   │   ├── analytics.js      # Form link tracking
│   │   │   └── enhancement.js    # Progressive enhancements
│   │   │
│   │   └── images/
│   │       ├── scenarios/        # Scenario screenshots
│   │       ├── logos/            # AWS, GOV.UK logos
│   │       └── icons/            # Custom icons
│   │
│   ├── scenarios/                # Scenario Content (Markdown)
│   │   ├── council-chatbot.md
│   │   ├── planning-application-ai.md
│   │   ├── quicksight-dashboard.md
│   │   └── ...
│   │
│   ├── guides/                   # Guidance Content (Markdown)
│   │   ├── get-started.md
│   │   ├── deployment-guide.md
│   │   ├── faq.md
│   │   └── case-studies/
│   │       ├── council-1-success.md
│   │       └── council-2-insights.md
│   │
│   ├── index.md                  # Homepage
│   └── 404.md                    # Error page
│
├── .eleventy.js                  # Eleventy Configuration
│   └── Includes: X-GOV plugin, GOV.UK Frontend setup
│
├── .github/workflows/
│   ├── build-deploy.yml          # Build & Deploy to GitHub Pages
│   │   ├── Eleventy build
│   │   ├── Puppeteer PDF generation
│   │   ├── GitHub Pages deploy
│   │   └── Validation
│   │
│   └── validate-cf.yml           # CloudFormation Validation
│       └── cfn-lint templates
│
├── cloudformation/               # CloudFormation Templates (Referenced)
│   ├── templates/
│   │   ├── council-chatbot.yaml
│   │   ├── planning-ai.yaml
│   │   └── ...
│   └── README.md                 # Template descriptions
│
├── package.json                  # Dependencies
│   └── Key deps: eleventy, @x-gov/eleventy-plugin-govuk-frontend, govuk-frontend
│
├── README.md                     # Project README
└── docs/                         # Project Documentation (Separate from Portal)
    ├── prd.md
    ├── ux-design-specification.md
    ├── forms-specification.md
    └── architecture.md           # (This file)
```

---

## 4. Integration Points

### Portal ↔ GOV.UK Forms Service

**Flow**:
1. User visits portal
2. Clicks "Find Your Scenario" or "Generate Evidence Pack"
3. Portal redirects to GOV.UK Forms (external link)
4. User completes form in GOV.UK Forms service
5. Form submission handled by GOV.UK Forms (data stored there)
6. Portal never receives or processes form data

**Configuration**:
- Form URLs managed in `forms.yaml`
- Eleventy templates reference via: `{{ forms.scenario_selector_quiz.live_url }}`
- No API integration needed
- No authentication needed

**GDPR/Privacy Compliance**:
- Form data remains in GOV.UK Forms (gov.uk domain)
- Portal doesn't store evaluation responses
- Users can optionally consent to follow-up (managed by GOV.UK Forms)

---

### Portal ↔ CloudFormation Templates

**Flow**:
1. User reads scenario description on portal
2. Scrolls to "Deploy This Scenario" section
3. Clicks "Deploy to Innovation Sandbox"
4. User taken to AWS Console with CloudFormation Designer
5. User deploys template in their AWS account (Innovation Sandbox)
6. Resources deployed with tags: scenario, git-hash, git-tag
7. Portal provides no further integration

**Configuration**:
- CloudFormation templates stored in `cloudformation/` directory
- Portal links to templates (S3 URLs or GitHub raw URLs)
- No template modification or automation in portal
- Users responsible for deployment

**Resource Tagging Strategy**:
- All resources tagged automatically by CloudFormation template parameters
- Tags enable: cost allocation, resource filtering, scenario tracking
- Users query via AWS Cost Explorer, Resource Groups, CloudTrail
- No data flows back to portal

---

### Portal ↔ GitHub Pages

**Automated Deployment Flow**:
1. Developer commits to `main` branch
2. GitHub Actions triggered (`build-deploy.yml`)
3. Eleventy builds portal (Markdown → HTML)
4. Puppeteer generates PDFs
5. CloudFormation templates validated
6. All assets committed to `gh-pages` branch
7. GitHub Pages serves static site
8. Portal live at: `https://username.github.io/ndx-try-aws-scenarios/`

**No Runtime Integration**:
- No server-side code execution
- No API calls from portal
- No database queries
- All complexity at build-time

---

### Portal ↔ Innovation Sandbox

**Post-Deployment Integration** (User's Responsibility):
- User deploys CloudFormation template to their AWS account
- Resources tagged with scenario metadata
- User can query their own AWS account:
  - Cost Explorer: Filter by "scenario" tag
  - Resource Groups: View resources by scenario
  - CloudTrail: View deployment activity
- Portal has no visibility into deployments
- No data collected or stored by portal

---

## 5. Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Generator** | Eleventy 11ty | Lightweight, flexible, GOV.UK integration |
| **GOV.UK Plugin** | @x-gov/eleventy-plugin-govuk-frontend | Official GOV.UK support |
| **Design System** | GOV.UK Frontend 5.13.0 | WCAG 2.2 AA built-in, UK gov standard |
| **Templating** | Nunjucks | GOV.UK Frontend standard |
| **Styling** | CSS (BEM) | Minimal custom CSS, leverage GOV.UK |
| **JavaScript** | Vanilla JS | Progressive enhancement only |
| **PDF Generation** | Puppeteer | Build-time, deterministic output |
| **CI/CD** | GitHub Actions | Free, built-in, no infrastructure |
| **Hosting** | GitHub Pages | Free, static, no server overhead |
| **Content Format** | Markdown | Version control, easy to update |
| **Package Manager** | npm | Standard Node.js ecosystem |
| **Forms** | GOV.UK Forms Service | External managed service |
| **CloudFormation** | AWS CloudFormation | Pre-built templates, not built here |

---

## 6. Implementation Patterns

To prevent inconsistency and enable parallel development:

### File Naming Conventions

| File Type | Convention | Example |
|-----------|-----------|---------|
| Markdown content | `kebab-case.md` | `council-chatbot.md`, `get-started.md` |
| Nunjucks templates | `kebab-case.njk` | `scenario-card.njk`, `header.njk` |
| JavaScript | `kebab-case.js` | `form-analytics.js`, `enhancement.js` |
| CSS classes | `govuk-kebab-case` (GOV.UK) or `ndx-kebab-case` (custom) | `govuk-button`, `ndx-scenario-card` |
| YAML config | `lowercase.yaml` | `scenarios.yaml`, `forms.yaml` |

### Data Management

- **Single Source of Truth**: All configuration in `src/_data/` YAML files
- **No Hardcoding**: No URLs, titles, or metadata in templates
- **Data Cascade**: Eleventy's data cascade loads all YAML files automatically
- **Template Access**: `{{ forms.scenario_selector_quiz.live_url }}` syntax

### Component Development

```nunjucks
{# Example: Scenario Card Component #}
{# Location: src/_includes/components/scenario-card.njk #}

{% macro scenarioCard(scenario) %}
  <div class="ndx-scenario-card">
    {# Use GOV.UK card base #}
    <h2 class="govuk-heading-l">{{ scenario.name }}</h2>
    <p class="govuk-body">{{ scenario.description }}</p>

    {# Link to scenario detail page #}
    <a href="{{ scenario.url }}" class="govuk-button">
      Explore This Scenario
    </a>

    {# Link to Evidence Pack form #}
    <a href="{{ forms.evidence_pack_generator.live_url }}" class="govuk-button govuk-button--secondary">
      Generate Evidence Pack
    </a>
  </div>
{% endmacro %}
```

### Content Structure (Markdown)

Every scenario page follows this structure:

```markdown
---
title: "Council Chatbot AI"
layout: "scenario.njk"
scenario_id: "council-chatbot"
tags: ["citizen-communication", "ai"]
---

## Overview
[2-3 sentence summary]

## Key Capabilities
- [Capability 1]
- [Capability 2]
- [Capability 3]

## Demo & Walkthrough
[Step-by-step instructions]

## Technical Architecture
[AWS services diagram]

## Implementation Considerations
[What councils should know]

## Deploy This Scenario
[CloudFormation deployment button]

## Next Steps
[Evidence Pack link and additional resources]
```

### Build Patterns

**Eleventy Build**:
- Markdown → HTML at build time
- YAML data loaded automatically
- All pages generated as static files
- No dynamic routes or server-side rendering

**GitHub Actions Build Process**:
1. Eleventy builds portal (generates HTML/CSS/JS)
2. Puppeteer generates Evidence Pack PDFs
3. CloudFormation templates validated with cfn-lint
4. All artifacts copied to `gh-pages` branch
5. GitHub Pages deploys automatically

---

## 7. Cross-Cutting Concerns

### Error Handling

**Build-Time Errors** (GitHub Actions):
- Eleventy template errors: Fail fast, halt build
- Missing data files: Fail fast, clear error message
- Puppeteer PDF generation failure: Log error, continue (non-critical)
- CloudFormation template validation failure: Log warning, continue

**Runtime Errors** (Client-Side):
- 404 pages: Static 404.html page served by GitHub Pages
- Broken form links: Visible as HTTP 404, user redirected to homepage
- Missing images: Graceful fallback (image alt text displays)
- No error tracking backend needed (portal is read-only)

**Accessibility Error Prevention**:
- All content reviewed against WCAG 2.2 AA checklist
- GOV.UK Frontend components used as-is (pre-validated)
- Markdown content checked for heading hierarchy, alt text
- Built-in GitHub Actions linting for HTML/CSS

### Logging

**Build Logs** (GitHub Actions):
- All build output visible in GitHub Actions workflow
- Publicly accessible workflow history
- Eleventy verbose mode logs page generation
- Puppeteer logs PDF generation progress

**Analytics Logging**:
- No real-time backend logging needed
- CloudFormation resource tags provide post-deployment tracking
- Users query their own AWS accounts for cost/usage by scenario
- Portal focuses on content, not metrics

**Error Logging**:
- Client-side errors captured in browser console (users can report)
- No error tracking service needed (read-only static site)
- Broken links detected in GitHub Actions validation

### Performance Optimization

**Build-Time**:
- Eleventy incremental builds (only changed files)
- Image optimization: Responsive images with srcset
- CSS minification: Automatic via build process
- JavaScript minification: Vanilla JS + minimal bundle size

**Runtime** (Client-Side):
- Static assets served via GitHub Pages CDN
- No JavaScript framework overhead (vanilla JS only)
- CSS served inline in <head> for critical styles (GOV.UK best practice)
- Images lazy-loaded below-the-fold

**Deployment Time**:
- GitHub Pages uses global CDN (instant worldwide caching)
- No build time ~5 minutes (Eleventy + Puppeteer + validation)

---

## 8. Security Considerations

### Input Validation

**No User Input in Portal**:
- Portal is read-only content delivery
- Forms hosted externally (GOV.UK Forms service)
- No API endpoints accepting user data
- No file uploads, no user-generated content

**Configuration Validation**:
- YAML files validated at build time
- CloudFormation templates validated with cfn-lint
- Form URLs validated in GitHub Actions (HTTP GET test)

### Data Protection

**No Sensitive Data in Portal**:
- No user authentication needed
- No passwords, API keys, or credentials stored
- Form responses stored in GOV.UK Forms (gov.uk domain)
- CloudFormation templates reference only public AWS services

**GDPR Compliance**:
- Portal doesn't collect personal data
- Form data stored in GOV.UK Forms (compliant service)
- No third-party analytics or trackers
- No cookies (unless GOV.UK Forms uses them)

### Infrastructure Security

**GitHub Pages Security**:
- HTTPS enforced automatically
- DDoS protection via GitHub
- No server-side code execution (static only)
- GitHub Actions secrets used for sensitive build configuration

**CloudFormation Template Security**:
- Templates don't contain secrets (users provide at deploy time)
- All resources deployed to user's AWS account (not shared)
- Resource tags enable cost allocation and compliance tracking

---

## 9. Deployment & Operations

### Deployment Pipeline

```
Developer Commit
    ↓
GitHub Actions Triggered
    ├── Eleventy Build (→ HTML/CSS/JS)
    ├── Puppeteer PDF Generation
    ├── CloudFormation Validation
    └── Artifacts Committed to gh-pages
        ↓
    GitHub Pages Deploy
        ↓
    Portal Live at https://[user].github.io/[repo]/
```

### Operations (Low Burden)

**Ongoing Maintenance**:
- Update scenario content (edit Markdown, commit)
- Add new scenarios (create Markdown file, add to `scenarios.yaml`)
- Update form URLs when GOV.UK Forms ready (edit `forms.yaml`)
- Dependency updates (npm upgrade, test in CI)

**No Infrastructure Management**:
- No server provisioning or scaling
- No database backup or recovery
- No API monitoring or health checks
- No load balancing or failover configuration

**Disaster Recovery**:
- Git history provides version control
- GitHub Pages caching provides uptime
- No data loss risk (all content in GitHub)

---

## 10. Scalability & Performance

### Portal Scalability

**Current Scope**:
- 6 scenarios (Markdown files)
- ~20 pages (guides, case studies, FAQs)
- Zero database queries (all static)

**Scaling Characteristics**:
- Linear growth with page count (Eleventy handles hundreds of pages efficiently)
- Build time: ~30 seconds (Eleventy) + ~5 minutes (Puppeteer) per deployment
- GitHub Pages CDN handles unlimited concurrent users (no server bottleneck)

**Future Scaling** (if needed):
- Incremental builds (only changed pages rebuild)
- Static site generation proven to scale to 10,000+ pages
- No architectural changes needed until extreme scale

### CloudFormation Scalability

**Not Managed by Portal**:
- CloudFormation template execution handled by AWS
- Resource limits: AWS CloudFormation quotas (templates, parameters)
- User's AWS account scaling: AWS handles automatically
- Portal provides links, not execution (zero impact on performance)

---

## 11. Testing Strategy

### Build-Time Testing

**Eleventy**:
- Template syntax validation (automatic)
- Data file validation (YAML schema)
- Link validation (all internal links tested)
- Image alt text validation (WCAG compliance)

**CloudFormation**:
- cfn-lint validation (GitHub Actions workflow)
- Parameter validation (YAML schema)
- Resource property validation (cfn-lint rules)

**PDF Generation**:
- Puppeteer PDF generation tested (smoke test)
- PDF output validated (non-empty, correct content)

**Accessibility**:
- WCAG 2.2 AA compliance checklist (manual review)
- GOV.UK Frontend components (pre-tested, no additional validation needed)

### Runtime Testing

**Manual Testing**:
- Portal accessed in major browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsiveness tested (responsive design auto-tested)
- Form links tested (HTTP 404 check in GitHub Actions)
- CloudFormation deployment tested manually before release

**No Automated Runtime Testing**:
- Static site doesn't require integration tests
- No APIs to test
- No dynamic logic to verify
- User acceptance testing: councils test during scenario evaluation

---

## 12. Architecture Decision Record (ADR)

| Decision | Selected | Rationale | Trade-offs |
|----------|----------|-----------|-----------|
| **Portal Model** | Static Site (Eleventy 11ty) | Zero runtime complexity | Limited to static content only |
| **Evidence PDF** | Build-time Puppeteer | Deterministic, no infrastructure | PDFs pre-generated, not dynamic |
| **Forms** | GOV.UK Forms Service | Outsourced accessibility/security | No custom form logic |
| **Analytics** | CloudFormation Tags | Decentralized, no backend | Limited real-time tracking |
| **Design System** | GOV.UK Frontend | WCAG 2.2 AA + official support | Limited to GOV.UK design patterns |
| **Hosting** | GitHub Pages | Free, built-in, no DevOps | Limited to static + GitHub Actions |
| **Client-Side JS** | Vanilla JS | Minimal dependencies | Limited interactivity |
| **Content Format** | Markdown | Version control friendly | Less flexibility than HTML |

---

## 13. Constraints & Assumptions

### Constraints

- **Portal Content**: Static only (no dynamic routes, no server-side rendering)
- **User Interaction**: External forms (GOV.UK Forms service, not portal logic)
- **Analytics**: Post-deployment only (CloudFormation tags, AWS console access)
- **Hosting**: GitHub Pages (public repository, no private hosting)
- **CloudFormation**: Pre-built templates (portal doesn't generate or modify)

### Assumptions

- CloudFormation templates are maintained separately (not in portal repo)
- Councils have AWS Innovation Sandbox accounts (pre-provisioned)
- GOV.UK Forms service is available and compliant
- Static site content is sufficient (no real-time updates needed)
- GitHub Pages CDN provides adequate performance globally
- Users can access their own AWS accounts to query resource tags

---

## 14. Future Enhancements

### Phase 2 (Optional)

- **Evidence Pack PDF Generation**: Automate PDF generation from form responses (currently pre-generated)
- **Advanced Analytics**: Optional dashboard showing aggregate deployment trends
- **Scenario Branching**: Conditional logic in Scenario Selector Quiz
- **User Authentication**: Optional (for councils to track their own evaluations)

### Phase 3+ (Vision)

- **Integration with G-Cloud Catalog**: Link to actual procurement routes
- **Deployment Automation**: Optional 1-click deployment (CloudFormation custom resource)
- **Cost Estimation**: Real-time AWS cost calculation per scenario
- **Feedback Loop**: Council outcome tracking (optional)

---

## 15. Architecture Validation Checklist

- ✓ **Simplicity**: Zero runtime infrastructure, static-only portal
- ✓ **Scalability**: GitHub Pages CDN, linear build time, no database
- ✓ **Security**: No sensitive data, static content only, HTTPS enforced
- ✓ **Accessibility**: WCAG 2.2 AA via GOV.UK Frontend
- ✓ **Maintainability**: Markdown content, centralized config, no custom code
- ✓ **Cost**: Free (GitHub Pages, GitHub Actions, no AWS infrastructure for portal)
- ✓ **DevOps Burden**: Minimal (no servers, no databases, automated deployments)
- ✓ **User Experience**: Quick load times, mobile-responsive, intuitive navigation
- ✓ **Testability**: Build-time validation, no runtime tests needed
- ✓ **Compliance**: GDPR compliant (no data collection), gov.uk standards

---

## 16. References

- **Eleventy 11ty**: https://www.11ty.dev/
- **X-GOV Eleventy Plugin**: https://github.com/x-gov/eleventy-plugin-govuk-frontend
- **GOV.UK Frontend**: https://design-system.service.gov.uk/
- **GOV.UK Forms**: https://www.forms.service.gov.uk/
- **GitHub Pages**: https://pages.github.com/
- **CloudFormation**: https://docs.aws.amazon.com/cloudformation/

---

## 17. Architecture Extension: Hands-On Exploration (Epic 6-11)

**Extension Date:** 2025-11-28
**Extension Author:** Architecture Team
**Extension Rationale:** PRD Extension added 43 new FRs (FR57-FR99) and 8 NFRs (NFR37-NFR44) for hands-on exploration capabilities across all 6 scenarios.

### Extension Overview

The original architecture (Sections 1-16) remains valid for Epic 1-5. This extension adds architectural decisions specifically for Epic 6-11 hands-on exploration features while maintaining the static-first philosophy.

**Core Principle Preserved:** All complex processing happens at build-time. Exploration features use client-side JavaScript for progressive enhancement only.

---

### Decision 7: Screenshot Automation Pipeline

**Selected:** Playwright-based screenshot capture in GitHub Actions (build-time)

**Rationale:**
- Screenshots captured from live deployed scenarios during build
- Deterministic output (same deployment always produces same screenshots)
- Shared infrastructure (one pipeline serves all 6 scenarios)
- No runtime dependencies (screenshots are static assets)
- Visual regression detection via image comparison

**Implementation:**
```yaml
# .github/workflows/screenshot-capture.yml
name: Screenshot Automation Pipeline

on:
  schedule:
    - cron: '0 6 * * 1'  # Weekly Monday 6AM
  workflow_dispatch:      # Manual trigger for urgent updates
  push:
    paths:
      - 'cloudformation/**'  # Trigger on template changes

jobs:
  capture-screenshots:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Playwright
        run: npx playwright install chromium

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.SCREENSHOT_AWS_ACCESS_KEY }}
          aws-secret-access-key: ${{ secrets.SCREENSHOT_AWS_SECRET_KEY }}
          aws-region: us-west-2

      - name: Deploy Reference Stack
        run: |
          aws cloudformation create-stack \
            --stack-name screenshot-reference-${{ github.run_id }} \
            --template-body file://cloudformation/templates/council-chatbot.yaml \
            --parameters ParameterKey=ScenarioTag,ParameterValue=screenshot-automation
          aws cloudformation wait stack-create-complete \
            --stack-name screenshot-reference-${{ github.run_id }}

      - name: Capture Screenshots
        run: npx playwright test tests/screenshot-capture.spec.ts

      - name: Visual Regression Check
        run: npx playwright test tests/visual-regression.spec.ts

      - name: Cleanup Stack
        if: always()
        run: |
          aws cloudformation delete-stack \
            --stack-name screenshot-reference-${{ github.run_id }}

      - name: Commit Screenshots
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: update exploration screenshots [automated]"
          file_pattern: "src/assets/images/exploration/**"
```

**Screenshot Storage Structure:**
```
src/assets/images/exploration/
├── council-chatbot/
│   ├── experiments/
│   │   ├── exp1-out-of-scope-response.png
│   │   ├── exp2-context-retention.png
│   │   └── ...
│   ├── architecture/
│   │   ├── lex-console.png
│   │   ├── bedrock-logs.png
│   │   └── ...
│   └── limits/
│       ├── long-input-response.png
│       └── ...
├── planning-ai/
│   └── ...
└── ...
```

**NFR Coverage:**
- NFR38: 48-hour update SLA → Weekly automated + manual trigger for urgent updates
- NFR44: Named owner → `CODEOWNERS` file assigns screenshot pipeline maintainer

**Fallback Strategy (FR83):**
When deployed stack has expired (90-minute auto-cleanup):
- Exploration pages check for `?stack=expired` query parameter
- If expired, show static "fallback" screenshots with banner: "Your demo environment has expired. Here's what you would see:"
- Fallback screenshots captured from reference deployment and stored permanently

---

### Decision 8: Client-Side State Management

**Selected:** LocalStorage with Progressive Enhancement

**Rationale:**
- Toggle states ("Simplify for me", completion progress) persist across page navigation
- No backend required (maintains static-first philosophy)
- Graceful degradation (site works without JavaScript)
- Privacy-friendly (data stays on user's device)

**Implementation:**
```javascript
// src/assets/js/exploration-state.js

const STORAGE_KEY = 'ndx-exploration-state';

// State shape
const defaultState = {
  simplifyMode: false,
  completedActivities: {},  // { 'council-chatbot': ['exp1', 'exp2'] }
  advancedMode: false,
  timestamp: null
};

// Load state from LocalStorage
function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultState, ...JSON.parse(stored) } : defaultState;
  } catch {
    return defaultState;
  }
}

// Save state to LocalStorage
function saveState(state) {
  try {
    state.timestamp = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // LocalStorage unavailable - continue without persistence
  }
}

// Mark activity as completed
function markActivityComplete(scenarioId, activityId) {
  const state = loadState();
  if (!state.completedActivities[scenarioId]) {
    state.completedActivities[scenarioId] = [];
  }
  if (!state.completedActivities[scenarioId].includes(activityId)) {
    state.completedActivities[scenarioId].push(activityId);
  }
  saveState(state);
  updateCompletionUI(scenarioId);
}

// Check if 3+ activities completed (triggers completion indicator - FR82)
function isExplorationComplete(scenarioId) {
  const state = loadState();
  const completed = state.completedActivities[scenarioId] || [];
  return completed.length >= 3;
}

// Toggle simplify mode (FR90)
function toggleSimplifyMode() {
  const state = loadState();
  state.simplifyMode = !state.simplifyMode;
  saveState(state);
  applySimplifyMode(state.simplifyMode);
}

// Apply simplify mode to page
function applySimplifyMode(enabled) {
  document.querySelectorAll('[data-persona="technical"]').forEach(el => {
    el.style.display = enabled ? 'none' : '';
  });
  document.querySelectorAll('[data-view="simple"]').forEach(el => {
    el.style.display = enabled ? '' : 'none';
  });
  document.querySelectorAll('[data-view="detailed"]').forEach(el => {
    el.style.display = enabled ? 'none' : '';
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const state = loadState();
  applySimplifyMode(state.simplifyMode);
  updateCompletionUI(getCurrentScenarioId());
});
```

**HTML Data Attributes:**
```html
<!-- Activity marked as technical-only -->
<div class="ndx-activity" data-persona="technical" data-activity-id="exp4">
  <h3>Examine Lambda function code</h3>
  ...
</div>

<!-- Simple view content (shown when simplify mode on) -->
<div data-view="simple">
  <ul>
    <li>You type a question</li>
    <li>The chatbot understands it</li>
    <li>It searches the knowledge base</li>
    <li>You get an answer</li>
  </ul>
</div>

<!-- Detailed view content (hidden when simplify mode on) -->
<div data-view="detailed">
  <img src="/assets/images/exploration/council-chatbot/architecture/flow-diagram.svg"
       alt="Architecture diagram showing Lex, Bedrock, DynamoDB interaction">
</div>
```

---

### Decision 9: Exploration Page Structure

**Selected:** Extended Nunjucks Templates with Persona-Based Content Blocks

**Rationale:**
- Consistent structure across all 6 scenarios
- Content blocks enable Visual-First vs Technical paths
- Template inheritance reduces duplication
- Static generation maintains performance

**Template Hierarchy:**
```
src/_includes/layouts/
├── base.njk                    # Base layout (existing)
├── scenario.njk                # Scenario detail layout (existing)
└── exploration.njk             # NEW: Exploration section layout

src/_includes/components/
├── exploration/
│   ├── activity-card.njk       # Individual activity card
│   ├── completion-indicator.njk # "3/5 completed" progress
│   ├── simplify-toggle.njk     # "Simplify for me" sticky toggle
│   ├── time-estimate.njk       # "~15 minutes" display
│   ├── safe-badge.njk          # "Safe to Explore" badge
│   ├── learning-summary.njk    # Exit screen learning bullets
│   └── fallback-banner.njk     # "Stack expired" warning
└── ...
```

**Exploration Layout Template:**
```nunjucks
{# src/_includes/layouts/exploration.njk #}
{% extends "layouts/scenario.njk" %}

{% block content %}
  {{ super() }}  {# Render existing scenario content #}

  {# Transition message (FR91) #}
  <section class="ndx-exploration-intro">
    <h2 class="govuk-heading-l">Great! You've seen it work. Now let's explore what you can do.</h2>

    {# Time estimate (FR92) #}
    {% include "components/exploration/time-estimate.njk" %}

    {# Simplify toggle - sticky header (FR90, FR93) #}
    {% include "components/exploration/simplify-toggle.njk" %}
  </section>

  {# Activities list #}
  <section class="ndx-exploration-activities">
    {% for activity in exploration.activities %}
      {% include "components/exploration/activity-card.njk" %}
    {% endfor %}
  </section>

  {# Completion indicator (FR82) #}
  {% include "components/exploration/completion-indicator.njk" %}

  {# Learning summary - shown on exit (FR96) #}
  {% include "components/exploration/learning-summary.njk" %}
{% endblock %}
```

**Activity Card Component:**
```nunjucks
{# src/_includes/components/exploration/activity-card.njk #}
<article class="ndx-activity-card govuk-!-margin-bottom-6"
         data-activity-id="{{ activity.id }}"
         data-persona="{{ activity.persona }}"
         data-category="{{ activity.category }}">

  {# Start here badge (FR94) #}
  {% if activity.isFirst %}
    <span class="govuk-tag govuk-tag--blue">Recommended first activity</span>
  {% endif %}

  {# Safe to explore badge (FR84 - Phase 2) #}
  {% if activity.showSafeBadge %}
    <span class="govuk-tag govuk-tag--green">✓ Safe to Explore</span>
  {% endif %}

  <h3 class="govuk-heading-m">{{ activity.title }}</h3>
  <p class="govuk-body">{{ activity.description }}</p>

  <dl class="govuk-summary-list govuk-summary-list--no-border">
    <div class="govuk-summary-list__row">
      <dt class="govuk-summary-list__key">Time</dt>
      <dd class="govuk-summary-list__value">{{ activity.timeEstimate }}</dd>
    </div>
    <div class="govuk-summary-list__row">
      <dt class="govuk-summary-list__key">You'll learn</dt>
      <dd class="govuk-summary-list__value">{{ activity.learning }}</dd>
    </div>
  </dl>

  <a href="{{ activity.url }}" class="govuk-button">Start</a>

  {# View the Code link (FR86 - Phase 2) #}
  {% if activity.codeUrl %}
    <a href="{{ activity.codeUrl }}" class="govuk-link" target="_blank" rel="noopener">
      View the Code (for technical users)
    </a>
  {% endif %}
</article>
```

---

### Decision 10: Analytics Events for Exploration

**Selected:** Extend Existing Analytics with exploration_completed Event

**Rationale:**
- NFR43 requires capturing exploration_completed event
- Maintain consistency with existing analytics approach (FR33)
- No new analytics infrastructure needed
- Client-side event capture, post-processing via existing pipeline

**Implementation:**
```javascript
// src/assets/js/analytics.js (extended)

// Existing event types...

// NEW: Exploration events (NFR41-43)
const EXPLORATION_EVENTS = {
  ACTIVITY_STARTED: 'exploration_activity_started',
  ACTIVITY_COMPLETED: 'exploration_activity_completed',
  EXPLORATION_COMPLETED: 'exploration_completed',  // NFR43
  SIMPLIFY_TOGGLED: 'simplify_mode_toggled',
  ADVANCED_MODE_ENABLED: 'advanced_mode_enabled'
};

function trackExplorationEvent(eventType, data) {
  const eventData = {
    event: eventType,
    timestamp: new Date().toISOString(),
    scenario_id: data.scenarioId,
    ...data
  };

  // Send to analytics (same mechanism as existing FR33 events)
  sendAnalyticsEvent(eventData);
}

// Track exploration_completed (NFR43)
function trackExplorationCompleted(scenarioId) {
  const state = loadState();
  const completed = state.completedActivities[scenarioId] || [];

  trackExplorationEvent(EXPLORATION_EVENTS.EXPLORATION_COMPLETED, {
    scenarioId: scenarioId,
    activities_attempted: completed,
    activities_completed: completed,
    time_spent_exploring: calculateTimeSpent(scenarioId),
    path_taken: state.simplifyMode ? 'visual' : 'mixed'
  });
}

// Trigger when user completes 3+ activities OR clicks "I'm done exploring"
function checkExplorationCompletion(scenarioId) {
  if (isExplorationComplete(scenarioId)) {
    trackExplorationCompleted(scenarioId);
    showLearingSummary(scenarioId);
  }
}
```

---

## 18. Updated Project Structure (Epic 6-11)

```
ndx-try-aws-scenarios/
├── src/
│   ├── _data/
│   │   ├── exploration/                 # NEW: Exploration content data
│   │   │   ├── council-chatbot.yaml     # Chatbot exploration activities
│   │   │   ├── planning-ai.yaml
│   │   │   ├── foi-redaction.yaml
│   │   │   ├── smart-car-park.yaml
│   │   │   ├── text-to-speech.yaml
│   │   │   └── quicksight.yaml
│   │   ├── forms.yaml
│   │   ├── scenarios.yaml
│   │   └── ...
│   │
│   ├── _includes/
│   │   ├── layouts/
│   │   │   ├── base.njk
│   │   │   ├── scenario.njk
│   │   │   └── exploration.njk          # NEW: Exploration layout
│   │   │
│   │   ├── components/
│   │   │   ├── exploration/             # NEW: Exploration components
│   │   │   │   ├── activity-card.njk
│   │   │   │   ├── completion-indicator.njk
│   │   │   │   ├── simplify-toggle.njk
│   │   │   │   ├── time-estimate.njk
│   │   │   │   ├── safe-badge.njk
│   │   │   │   ├── learning-summary.njk
│   │   │   │   └── fallback-banner.njk
│   │   │   └── ...
│   │   └── ...
│   │
│   ├── assets/
│   │   ├── images/
│   │   │   ├── exploration/             # NEW: Exploration screenshots
│   │   │   │   ├── council-chatbot/
│   │   │   │   │   ├── experiments/
│   │   │   │   │   ├── architecture/
│   │   │   │   │   ├── limits/
│   │   │   │   │   └── fallback/        # Static fallback images
│   │   │   │   ├── planning-ai/
│   │   │   │   └── ...
│   │   │   └── ...
│   │   │
│   │   ├── js/
│   │   │   ├── analytics.js             # Extended with exploration events
│   │   │   ├── exploration-state.js     # NEW: LocalStorage state management
│   │   │   └── ...
│   │   └── ...
│   │
│   ├── walkthroughs/                    # Existing walkthrough pages
│   │   ├── council-chatbot/
│   │   │   ├── index.md                 # Basic walkthrough (Story 3.2)
│   │   │   └── explore/                 # NEW: Exploration section
│   │   │       ├── index.md             # Exploration landing (Story 6.1)
│   │   │       ├── experiments.md       # What Can I Change? (Story 6.2)
│   │   │       ├── architecture.md      # How Does It Work? (Story 6.3)
│   │   │       ├── limits.md            # Test the Limits (Story 6.4)
│   │   │       └── production.md        # Take It Further (Story 6.5)
│   │   └── ...
│   └── ...
│
├── tests/                               # NEW: Playwright tests for screenshots
│   ├── screenshot-capture.spec.ts       # Screenshot automation tests
│   └── visual-regression.spec.ts        # Visual regression tests
│
├── .github/workflows/
│   ├── build-deploy.yml                 # Existing build workflow
│   ├── validate-cf.yml                  # Existing CF validation
│   └── screenshot-capture.yml           # NEW: Screenshot automation
│
└── ...
```

---

## 19. Extended NFR Coverage

### Performance (Extension)

**NFR40:** Exploration sections load in <3 seconds, including all screenshots
- Implementation: Lazy loading for below-fold images
- Image optimization: WebP format with PNG fallback
- Maximum image size: 200KB per screenshot

### Exploration Quality

**NFR37:** Exploration activities complete without errors 95%+ of the time
- Implementation: Comprehensive testing, fallback content, graceful degradation

**NFR38:** Screenshots updated within 48 hours of UI changes
- Implementation: Weekly automated pipeline + manual trigger for urgent updates

**NFR39:** Non-technical exploration paths require zero command-line interaction
- Implementation: All Visual-First activities use web UI only

### Learning Outcome Tracking

**NFR41-43:** Analytics capture exploration depth and completion
- Implementation: Client-side event tracking via analytics.js extension

**NFR44:** Screenshot maintenance has named role ownership
- Implementation: CODEOWNERS file assigns maintainer, SLA documented in CONTRIBUTING.md

---

## 20. Architecture Validation Checklist (Extended)

**Original Checklist (Sections 1-16):**
- ✓ Simplicity: Zero runtime infrastructure, static-only portal
- ✓ Scalability: GitHub Pages CDN, linear build time, no database
- ✓ Security: No sensitive data, static content only, HTTPS enforced
- ✓ Accessibility: WCAG 2.2 AA via GOV.UK Frontend
- ✓ Maintainability: Markdown content, centralized config, no custom code
- ✓ Cost: Free (GitHub Pages, GitHub Actions, no AWS infrastructure for portal)
- ✓ DevOps Burden: Minimal (no servers, no databases, automated deployments)
- ✓ User Experience: Quick load times, mobile-responsive, intuitive navigation
- ✓ Testability: Build-time validation, no runtime tests needed
- ✓ Compliance: GDPR compliant (no data collection), gov.uk standards

**Extension Checklist (Epic 6-11):**
- ✓ Static-First Preserved: All exploration content generated at build-time
- ✓ Screenshot Automation: Playwright pipeline as shared infrastructure
- ✓ State Management: LocalStorage for client-side persistence (no backend)
- ✓ Fallback Strategy: Static screenshots for expired stacks
- ✓ Analytics Extension: New events added to existing analytics pattern
- ✓ Template Reuse: Exploration components enable Epic 7-11 efficiency
- ✓ Accessibility Maintained: All new components use GOV.UK Frontend patterns
- ✓ Maintenance SLA: Screenshot updates within 48 hours, named owner

---

## 21. ADR Extension (Epic 6-11)

| Decision | Selected | Rationale | Trade-offs |
|----------|----------|-----------|-----------|
| **Screenshot Automation** | Playwright in GitHub Actions | Build-time, deterministic, shared infrastructure | Requires AWS credentials for reference deployment |
| **State Management** | LocalStorage | No backend, privacy-friendly, progressive enhancement | Limited to single device |
| **Exploration Templates** | Extended Nunjucks with data attributes | Consistent structure, persona-based content blocks | Template complexity increases |
| **Fallback Content** | Static screenshots with banner | Maintains user experience when stack expired | Content may diverge from live UI over time |
| **Analytics Extension** | Add events to existing system | No new infrastructure | Requires event schema coordination |

---

_Architecture Extension complete. This document now covers both MVP delivery (Epic 1-5) and Hands-On Exploration phase (Epic 6-11) while maintaining the static-first philosophy._

---

_Final architecture for NDX:Try AWS Scenarios - Collaborative decision-driven design emphasizing simplicity, static-first approach, and zero runtime complexity._
