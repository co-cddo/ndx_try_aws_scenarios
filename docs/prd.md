# ndx_try_aws_scenarios - Product Requirements Document

**Author:** cns
**Date:** 2025-11-27 (v1.0), 2025-11-29 (v1.3, v1.4, v1.5), 2025-11-30 (v1.7)
**Version:** 1.7

---

## Executive Summary

NDX:Try AWS Scenarios bridges the evaluation gap blocking UK local government cloud adoption. While 95% of councils are exploring AI and 53% use hybrid cloud, **90% have never used G-Cloud** despite 12 years of availability. This reveals the core problem: councils can't evaluate AWS services without deploying them, but won't deploy without first evaluating them.

This platform provides curated, deployable CloudFormation scenarios designed specifically for UK local government use cases. Councils can deploy realistic demos (Council Chatbot, Planning Application AI, FOI Redaction, Smart Car Park IoT, etc.) into AWS Innovation Sandbox accounts with one-click deployment, experience the services hands-on with synthetic council data, and generate committee-ready evidence to support informed procurement decisions.

The goal is **informed confidence, not forced adoption**. Success includes councils making evidence-based decisions to proceed, formally reject (with rationale), or request deeper evaluation - all outcomes that end paralysis and enable action.

### What Makes This Special

**"Beyond what the sales literature says"** - that moment when a council user deploys a scenario and experiences firsthand how AWS AI/ML/IoT actually works with realistic council data.

Unlike vendor presentations or documentation, NDX:Try provides:
- **Experiential proof** - Deploy and interact, don't just read about capabilities
- **Realistic context** - Synthetic UK council data (GDS Design System patterns, council-specific use cases)
- **Zero cost to try** - NDX:Try Innovation Sandbox is completely free; displayed costs are indicative of real-world production use only
- **Quick wow** - 15 minutes from deployment to "I can see this working for my service"
- **Risk-free** - Zero cost, automated cleanup, no commitment required
- **Committee-ready evidence** - Auto-generated materials that translate demo experience into procurement justification

This transforms abstract AWS service promises into tangible "I just saw it work" confidence that councils can act on.

---

## Project Classification

**Technical Type:** Developer Tool (Infrastructure as Code)
**Domain:** Government Technology (GovTech)
**Complexity:** High

This project is a **dual-artifact system**:

1. **CloudFormation Template Library** (primary deliverable)
   - Deployable infrastructure scenarios for AWS services
   - Packaged as reusable templates with embedded documentation
   - Distributed via public GitHub repository

2. **Discovery/Documentation Portal** (supporting infrastructure)
   - Markdown-based website (compatible with ndx.digital.cabinet-office.gov.uk via PR)
   - Scenario Selector quiz for matching problems to solutions
   - Deployment guides, architecture diagrams, "What's Next" pathways
   - Can be hosted via GitHub Pages or integrated into existing GOV.UK infrastructure

**GovTech Domain Acknowledgments:**
While this is a high-complexity domain requiring attention to procurement compliance (G-Cloud), accessibility (WCAG), security, and transparency, these requirements are addressed throughout the Product Brief and will be woven into functional/non-functional requirements. This PRD does not require separate deep domain exploration.

### Domain Context

**GovTech Environment:**
- **G-Cloud Framework:** Primary procurement route; compliance required but not barrier (templates are free, councils procure AWS services separately)
- **Accessibility Requirements:** WCAG 2.2 AA compliance for all web interfaces; scenarios must support assistive technologies where applicable
- **Security Posture:** Scenarios deployed into isolated Innovation Sandbox accounts with built-in governance and cost controls
- **Transparency:** Open-source templates (public GitHub); decision-making transparency through Evidence Pack generation

**Key Domain Drivers:**
- **Procurement friction:** 90% never used G-Cloud despite availability - NDX reduces evaluation barrier
- **Risk aversion:** £3.57B budget shortfall makes every decision high-stakes - zero-cost trials mitigate risk
- **Skills gap:** 49% lack adequate staff - pre-built scenarios reduce technical expertise requirements
- **Peer validation:** Strong council peer networks (LGA AI Hub) - case studies drive adoption

### Supporting Documents

**Product Brief:** `docs/product-brief-ndx-try-aws-scenarios-2025-11-27.md` (comprehensive discovery and stakeholder analysis)

**Research Documents:** `docs/research-market-2025-11-27.md` (UK local government cloud/AI/IoT adoption research, market validation, competitive analysis)

**Domain Brief:** Not applicable (GovTech requirements integrated throughout PRD)

---

## Success Criteria

### Primary Success Metric: Informed Decision Rate

Success means councils completing an evaluation make a **measurable decision** - not remaining stuck in analysis paralysis.

**Outcomes Counted as Success:**
- **Proceed:** Council procures AWS service directly or via G-Cloud (20-30% target)
- **Procure via Partner:** Councils engage implementation partner for production deployment (10-15% target)
- **Formally Reject:** Council documents decision not to proceed with rationale (20-25% target)
- **Request Deeper Evaluation:** Council escalates to extended pilot or specialist review (15-20% target)

**Outcome Counted as Failure:**
- **No Decision / Stuck:** Council remains in evaluation loop without action (<15% acceptable)

**Success Target:** 65-80% of councils completing full scenario evaluation take measurable action.

### Secondary Success Metrics

**Engagement & Reach**
| Metric | Target | Cadence |
|--------|--------|---------|
| Scenarios deployed per month | 50+ | Monthly |
| Unique councils accessing platform | 100+ in Year 1 | Quarterly |
| LGA AI Hub referrals | 30+ councils | Quarterly |
| Case studies published | 3+ by end Year 1 | Quarterly |
| Implementation partner leads | 20+ qualified | Monthly |

**Quality & Experience**
| Metric | Target |
|--------|--------|
| Deployment success rate (first-time) | 95%+ |
| Time to first insight | 15 mins average |
| User satisfaction | 4.0+/5.0 |
| "Would recommend" (NPS) | 70%+ |
| Completion rate (reach EVALUATE stage) | 60%+ |

**Evidence of Informed Confidence**
| Metric | Target | Method |
|--------|--------|--------|
| Evidence Pack downloads | 50%+ of evaluators | Analytics |
| Committee presentations | 20+ councils | Survey follow-up |
| Committee approval rates (of presented cases) | 65%+ | Survey follow-up |
| Peer recommendations | 30%+ new councils from referrals | Referral tracking |

**Business Impact (Post-Decision Tracking)**
| Metric | Target | Timeline |
|--------|--------|----------|
| AWS procurement | 5-10 councils within 6 months | Sales partnership |
| G-Cloud procurement | 3-5 councils via framework | Framework tracking |
| Partner implementations | 3-5 production deployments | Partner reporting |

### Business Metrics

**Organizational Goals**
- Position UK local government as confident cloud/AI adopters (addressing 90% G-Cloud non-adoption)
- Generate demand signals for AWS services through peer validation
- Establish NDX as trusted evaluation platform (supporting GDS Local mission)
- Build partner ecosystem converting evaluations to implementations
- Contribute to bridging skills gap through real-world scenario experience

**Decision Quality**
- 80%+ of councils generating committee-ready evidence (Evidence Pack usage)
- 65%+ of presented evidence packs approved by committees
- Councils explicitly credit NDX:Try in procurement RFPs

**Market Traction**
- Establish presence in LGA AI Hub as go-to resource for evaluation
- Achieve 100+ unique councils in Year 1
- Generate 3+ published case studies demonstrating ROI

---

## Product Scope

### MVP - Minimum Viable Product (Starter Pack)

**What's In:**

✓ **6 Validated Scenarios** (deployable CloudFormation templates)
  1. Council Chatbot (Bedrock) - AI flagship, 83% council interest
  2. Planning Application AI (Textract + Comprehend + Bedrock) - Research-validated demand
  3. FOI Redaction (Textract + Comprehend) - Legal mandate driver
  4. Smart Car Park IoT (IoT Core + DynamoDB + QuickSight) - Visual impact, proven ROI
  5. Text-to-Speech (Polly) - Accessibility mandate, simplest deployment
  6. QuickSight Dashboard - Universal analytics need, decision support

✓ **Scenario Selector Quiz** - Guided discovery matching council problems to scenarios

✓ **One-Click Deployment** - Automated CloudFormation deployment to Innovation Sandbox with pre-configured parameters

✓ **Realistic Sample Data** - Synthetic UK council data (council-specific contexts, GDS Design System patterns)
✓ **Zero Cost to Try** - NDX:Try Innovation Sandbox is completely FREE; cost estimates shown are indicative of real-world production use only

✓ **"What You Experienced" Summaries** - Structured debrief per scenario to capture insights

✓ **Committee Evidence Pack Templates** - Auto-populated materials for committee presentations (tailored per persona: CTO, Service Manager, Finance, Developer)

✓ **Cost Transparency** - Upfront cost estimates, maximum cost guarantees, automated cleanup

✓ **"What's Next" Guidance** - Partner recommendations, G-Cloud procurement pathways, production deployment guidance

✓ **Zero-Deployment Paths** - Demo videos (5-10 min per scenario) and documentation for councils without CloudFormation capacity

✓ **Deployment Guides & Architecture Diagrams** - Per-scenario documentation with Mermaid diagrams, setup instructions, troubleshooting

✓ **LGA AI Hub Integration** - Listing in LGA resource library, co-promotion through LGA channels

✓ **Analytics & Tracking** - Session tracking, journey funnel analysis, success metric capture

✓ **GitHub Repository** - Open-source templates, MIT license, README with quick start

✓ **Markdown Documentation** - Compatible with ndx.digital.cabinet-office.gov.uk (via PR) and GitHub Pages hosting

### Growth Features (Post-MVP, Phase 2)

○ **Fast-Follow Scenarios** (research-validated, lower priority)
  - Planning Application AI (enhanced with document parsing)
  - Smart Street Lighting IoT (Sandwell 7-year ROI case)
  - Amazon Connect Contact Centre (customer service)
  - Sentiment Analysis (social listening, reputation management)
  - Address Validation (core council function)

○ **Hosted Demo Environments** - Pre-deployed running scenarios (no deployment needed)

○ **Advanced Scenario Selector** - AI-powered matcher using council maturity assessment

○ **Persona Playlists** - Curated 3-scenario journeys optimized for each persona (CTO deep dive, Service Manager quick tour, etc.)

○ **Partner Ecosystem Integration** - CRM for partner matching, warm handoff workflows

○ **Analytics Dashboard** - Deep funnel analysis, drop-off heat maps, outcome tracking

○ **Cross-Scenario Journey Stories** - Combined narratives (e.g., "Citizen Communication Suite" combining chatbot + TTS)

○ **Customization & Bring-Your-Own-Data** - Allow councils to substitute sample data with their own (anonymized)

○ **Multi-Cloud Support** - Azure/GCP equivalent scenarios (Phase 2+)

### Vision (Future)

◇ **Readiness Assessment Scenario** - Maturity-based recommendations for readiness (skills, governance, budget)

◇ **Outcome Dashboard** - Track council success post-procurement (production deployment tracking, peer learning)

◇ **Consortium Trial Model** - Multi-council shared cost trials (3-5 councils jointly)

◇ **AI Governance Playbook** - Templates and guidance for responsible AI implementation post-demo

◇ **Skills Academy** - Training modules for council technical teams (going beyond demo to production)

◇ **Annual UK Local Government Cloud/AI Summit** - Community building and case study amplification

### Out of Scope (Explicitly Not MVP)

✗ Hosting or managing council AWS accounts (councils use their own Innovation Sandbox accounts)
✗ Production support or consulting services (scenarios are evaluation tools, not production solutions)
✗ Custom CloudFormation development for individual councils
✗ Data migration services
✗ Ongoing managed services (scenarios are time-limited, automated cleanup)

---

{{#if domain_considerations}}

## Domain-Specific Requirements

{{domain_considerations}}

This section shapes all functional and non-functional requirements below.
{{/if}}

---

## Innovation & Novel Patterns

### Core Innovation: "Evaluation Without Commitment"

The fundamental innovation is the **evaluation model itself**, not the technology. NDX:Try inverts the traditional cloud adoption barrier:

**Traditional Model (Stuck):** Councils can't evaluate AWS without deploying → won't deploy without evaluating → paralysis

**NDX:Try Model (Enables):** Zero-cost, time-limited, fully-automated scenarios let councils experience AWS without commitment → confidence-building → informed procurement decisions

**Why This Matters for UK Local Government:**
- Budget crisis (£3.57B shortfall) makes "evaluate first" non-negotiable
- Risk aversion means "prove it works here" before procurement
- Peer networks (LGA) drive adoption once case studies exist

### Adjacent Innovations

**1. Evidence Pack Auto-Generation**
Translating demo experience into committee language automatically. Councils complete evaluation, Evidence Pack generator creates committee-ready materials with:
- ROI projections from demo data
- Risk assessment summary
- Procurement next steps
- Peer council comparisons

This closes the "demo → committee approval" gap that exists in traditional POCs.

**2. Guided Experience with "Wow Moments"**
Rather than "deploy and figure it out," scenarios are choreographed to hit "quick wow" moments within 15 minutes:
- Council Chatbot: Ask it a real question, see it work
- Planning AI: Upload a sample application, watch AI extraction happen
- Car Park IoT: See real-time occupancy dashboard update
- FOI Redaction: Upload a document, watch automatic redaction

This addresses council anxiety: "Will this actually work?"

**3. Zero-Deployment Pathways**
Most council evaluators aren't technical. Innovation: provide multiple evaluation entry points:
- **Deploy yourself** (technical teams) - full experience
- **Watch demo video** (service managers) - 10-minute narrative
- **Partner-led tour** (finance/procurement) - guided presentation
- **Screenshot walkthrough** (accessibility) - annotated visual guide

Not everyone deploys. Everyone can evaluate.

**4. Sample Data as Strategic Asset**
Sample data is hyper-realistic UK council context:
- Service manager evaluating "Planning AI" sees actual planning application format + requirements language
- Finance evaluating "Car Park IoT" sees real council parking revenue numbers
- Not generic; not US federal; recognizable and credible

### Validation Approach

**How We Know This Works:**

1. **Market Validation (Already Complete)**
   - 90% of councils haven't used G-Cloud = confirmed evaluation gap
   - 856% growth in AI contracts (32 → 306 in 6 years) = confirmed appetite
   - Research shows "peer validation" as top adoption driver = LGA channel will amplify

2. **Concept Validation (Early Councils)**
   - 3-5 pilot councils in Q1 2026 will deploy scenarios and provide feedback
   - Track whether Evidence Pack → committee approval ratio meets 65% target
   - Capture case studies as proof of concept for next 50+ councils

3. **Success Metric Tracking**
   - Primary metric: Informed decision rate (65-80% take action)
   - If <60%: Evidence Pack template needs redesign or "What's Next" guidance is vague
   - If >80%: Scaling opportunity, move fast

4. **Peer Amplification Signal**
   - First 2-3 case studies published in LGA AI Hub
   - If "referred by peer council" reaches 30% of new councils = innovation is working
   - If peer referrals remain <20% = awareness/distribution problem, not concept problem

---

## Developer Tool & Discovery Portal Specific Requirements

### CloudFormation Template Architecture

**Template Structure Requirements:**
- Each scenario packaged as single CloudFormation template (no nested stacks for simplicity)
- Parameters clearly documented (region, cost limits, data volume, etc.)
- Outputs provide immediate value (API endpoints, dashboard URLs, sample queries)
- Deletion protection and automated cleanup via Lambda scheduled event (90-minute default)
- All costs capped and transparent (CloudFormation tags for cost tracking)

**Requirements for All Templates:**
- Deploy successfully to AWS Innovation Sandbox environment
- Complete deployment within 15 minutes
- No manual post-deployment steps required
- Clear success indicators (green check, endpoint URL, or dashboard access)
- Rollback-friendly architecture (no manual cleanup needed)
- Cost estimates accurate to ±15%

**SDK/Integration Compatibility:**
- Scenarios use publicly available AWS SDKs (Boto3, AWS CLI, Node.js SDK)
- Sample code provided in multiple languages (Python, Node.js, bash)
- API documentation compatible with OpenAPI/Swagger standards
- Clear integration paths for implementation partners

**Quality Gates for CloudFormation:**
- Tested with real AWS Innovation Sandbox account
- Resource naming follows AWS conventions
- IAM policies follow least-privilege principle
- Logging and monitoring enabled by default
- Security group configurations restricted to necessary access only

### Discovery Portal Architecture

**Content Organization:**
- Markdown-based for simplicity and portability
- Directory structure: `/scenarios/{scenario-name}/` with README.md + architecture diagram + CloudFormation template
- Central `/docs/` folder with guides: quick-start, accessibility, procurement, etc.

**Scenario Pages Must Include:**
- **Quick Summary** (1 paragraph) - "Why this scenario matters to councils"
- **Use Case** - Specific council problem this solves
- **AWS Services Used** - List with brief explanation
- **Time to Value** - "First insight in X minutes"
- **Cost Estimate** - Upfront, maximum, and automated cleanup timing
- **Architecture Diagram** - Mermaid or visual showing data flow
- **Deployment Guide** - Step-by-step CloudFormation instructions
- **Demo Walkthrough** - What to do after deployment, what to look for
- **Sample Queries** - Ready-to-run examples
- **Troubleshooting** - Common issues and solutions
- **"What's Next"** - Procurement guidance, partner recommendations

**Scenario Selector Quiz:**
- Must match 95%+ accuracy to persona intent
- Categories: Problem area (service management, finance, etc.), complexity level, time available
- Output: Recommended 1-3 scenarios with reasoning
- Alternative: "Start with our recommended trio" for councils with no preference

**Portal Navigation:**
- `/` - Home with quick tour
- `/scenarios/` - Scenario gallery with cards (preview, difficulty, time estimate)
- `/get-started/` - Quick start guide (15-minute path)
- `/evidence-packs/` - Template generator instructions
- `/accessibility/` - WCAG 2.2 AA compliance notes
- `/deployment-guides/` - Step-by-step technical guides
- `/partner-network/` - Implementation partner information
- `/case-studies/` - Council success stories

**Website Deliverables:**
- `README.md` - Repo overview and quick navigation
- `QUICKSTART.md` - 15-minute deployment guide
- `ACCESSIBILITY.md` - WCAG 2.2 AA compliance statement + guidance
- `CONTRIBUTING.md` - Contribution guidelines for community
- Mermaid diagrams for all architecture visualizations
- Screenshot gallery for zero-deployment learning path

{{#if endpoint_specification}}

### API Specification

{{endpoint_specification}}
{{/if}}

{{#if authentication_model}}

### Authentication & Authorization

{{authentication_model}}
{{/if}}

{{#if platform_requirements}}

### Platform Support

{{platform_requirements}}
{{/if}}

{{#if device_features}}

### Device Capabilities

{{device_features}}
{{/if}}

{{#if tenant_model}}

### Multi-Tenancy Architecture

{{tenant_model}}
{{/if}}

{{#if permission_matrix}}

### Permissions & Roles

{{permission_matrix}}
{{/if}}
{{/if}}

---

## User Experience Principles

### Design Philosophy

NDX:Try is not a technology product—it's a **confidence-building tool**. Every interaction should reduce anxiety and increase actionability.

**Core Principle:** "From curiosity to evidence in 15 minutes"

**Emotional Drivers (per Product Brief):**
- CTOs: "Cover my decision" → provide committee-ready evidence
- Service Managers: "Help my residents, don't add work" → clear benefits, realistic scenarios
- Developers: "Don't embarrass me technically" → clean code, honest limitations, extensibility
- Finance: "Defend to auditors" → worst-case costs, compliance documentation

### Key Interactions

**Interaction 1: Scenario Discovery (Scenario Selector Quiz)**
- **Goal:** Help council identify relevant scenario without overwhelming options
- **Design:** 3-question quiz (problem area, complexity tolerance, time available)
- **Outcome:** "We recommend starting with Council Chatbot because..." (1-3 scenarios with rationale)
- **Navigation:** Quiz results page provides direct "View Guide" buttons linking to each recommended scenario's walkthrough guide
- **Clear Path:** From Solution Finder results → Scenario Guide in one click (no hunting through menus)
- **Emotional Response:** "These scenarios are built for someone like me"

**Interaction 2: Deployment Journey (One-Click Deploy)**
- **Goal:** From decision to running system in <15 minutes
- **Design:** Single button → CloudFormation parameters auto-filled → deployment logs show progress
- **Success Indicator:** Green checkmark + "Your scenario is live. Click here to access:"
- **Emotional Response:** "That actually worked"

**Interaction 3: Guided Walkthrough (Demo Walkthrough)**
- **Goal:** Get to "wow moment" quickly (chatbot responding, AI extraction working, dashboard updating)
- **Design:** "Try this first" actions with expected results shown
- **Emotional Response:** "I just saw this work"

**Interaction 4: Sense-Making (What You Experienced Summary)**
- **Goal:** Capture insights while demo is fresh
- **Design:** Structured reflection guide (What surprised you? What would you want in production? What questions do you have?)
- **Emotional Response:** "This actually applies to my service"

**Interaction 5: Evidence Generation (Committee Evidence Pack)**
- **Goal:** Transform demo experience into procurement justification
- **Design:** Auto-generated PDF with ROI, risk, peer comparisons, next steps
- **Emotional Response:** "I can present this to my committee"

**Interaction 6: Pathway Forward (What's Next Guidance)**
- **Goal:** Smooth handoff from evaluation to procurement/implementation
- **Design:** Partner recommendations + G-Cloud procurement guidance + production deployment checklist
- **Emotional Response:** "I know what to do next"

### Visual & Interaction Design Principles

**Simplicity Over Comprehensiveness**
- Scenario selector: 3 questions max (not 20-question assessment)
- Scenario page: Key info above fold, deep details linked
- Architecture diagrams: Show data flow, not every AWS component

**Confidence-Building Language**
- ✓ "Deploy Council Chatbot in 15 minutes" (not "Advanced AI chatbot deployment system")
- ✓ "See real cost estimates upfront" (not "Cost estimates may vary")
- ✓ "Join 50+ councils evaluating AWS" (peer validation)

**Accessibility First**
- WCAG 2.2 AA compliance for all portal pages
- Scenario descriptions readable by screen readers
- Deployment guides support non-visual navigation
- Video walkthroughs captioned and transcript-provided

**Mobile-Friendly Portal**
- Scenario cards responsive (stack on mobile)
- Scenario Selector quiz works on any device
- Deployment instructions readable on tablet (councils deploy from various locations)

---

## Functional Requirements

### Scenario Management

**FR1:** System maintains library of CloudFormation templates for each scenario, with all required parameters documented and pre-configured defaults

**FR2:** Scenarios include comprehensive metadata: AWS services used, estimated cost, deployment time, success criteria, and use case summary

**FR3:** Scenarios are versioned independently, allowing updates without affecting active deployments (backward-compatible parameters)

### Discovery & Navigation

**FR4:** Portal provides searchable scenario gallery with cards showing scenario title, icon, description, time estimate, and difficulty level

**FR5:** Scenario Selector quiz (3-question flow) recommends 1-3 scenarios based on: service problem area, council complexity tolerance, available evaluation time

**FR6:** Scenario Selector provides reasoning for recommendations ("We recommend Council Chatbot because councils consistently report high interest in AI")

**FR7:** Portal provides quick-start guide directing users to recommended first scenario with 15-minute success path

### Deployment & Infrastructure

**FR8:** System automates one-click CloudFormation deployment to AWS Innovation Sandbox with pre-populated parameters

**FR9:** Deployment process captures and displays CloudFormation stack events in real-time, showing progress and any errors

**FR10:** Successful deployments provide immediate output: dashboard URLs, API endpoints, or access instructions for hands-on interaction

**FR11:** Automated cleanup via Lambda scheduled event terminates all scenario resources after 90 minutes (configurable per scenario), ensuring cost containment

**FR12:** Deployment process validates cost estimates before execution, confirming actual estimated costs match documentation (within ±15%)

### Guided Experience

**FR13:** Portal displays "Demo Walkthrough" guide per scenario with step-by-step instructions for achieving key interactions ("Ask the chatbot this question," "Upload a planning application")

**FR14:** Walkthrough guides include expected outputs/behaviors so users know "success" when they see it

**FR15:** Portal provides sample queries, test data, or example inputs (pre-populated where possible) to accelerate time to "wow moment"

### Experience Capture & Evidence Generation

**FR16:** System provides "What You Experienced" reflection guide (structured form) with questions capturing key insights from evaluation

**FR17:** Form responses are captured in session data for later analysis and troubleshooting

**FR18:** Committee Evidence Pack generator auto-populates templates with session data, scenario info, and success metrics

**FR19:** Evidence Pack PDF includes: scenario ROI (estimated), risk summary, peer council references, compliance alignment, and next-step guidance

**FR20:** Evidence Packs are tailored per persona (CTO vs. Service Manager vs. Finance vs. Developer version with different emphasis)

### Zero-Deployment Pathways

**FR21:** Portal hosts 5-10 minute demo video per scenario (narrated walkthrough of deployment and key interactions)

**FR22:** Videos are captioned and transcripts provided for accessibility

**FR23:** Portal provides screenshot gallery with annotations showing key results from each scenario (for non-deployment evaluation)

**FR24:** Portal offers contact form for councils requesting partner-led guided tour (pre-deployment evaluation option)

### Portal Content & Documentation

**FR25:** Portal includes dedicated pages for: Quick Start, Accessibility, Deployment Guides, Evidence Pack Templates, Partner Network, and Case Studies

**FR26:** Scenario pages include: use case, AWS services, deployment time, cost estimate, architecture diagram (Mermaid), step-by-step deployment guide, demo walkthrough, sample queries, troubleshooting, and "What's Next" guidance

**FR27:** Architecture diagrams are created in Mermaid format and rendered as visual SVGs on portal pages (and in Markdown-compatible format for repository)

**FR28:** Deployment guides include pre-requisites, step-by-step instructions, success indicators, common issues and solutions, and rollback procedures

**FR29:** Portal provides procurement guidance page explaining G-Cloud framework, available implementation partners, and production deployment pathways

### Sample Data Management

**FR30:** Each scenario includes synthetic but realistic UK council data (council-specific naming conventions, authentic data formats)

**FR31:** Sample data includes realistic values enabling ROI projections (e.g., council parking revenue, planning application processing times, contact center call volumes)

**FR32:** Sample data generation is automated/templated, enabling future customization (Phase 2)

### Analytics & Success Tracking

**FR33:** System captures key session events: quiz completion, scenario selection, deployment start/end, walkthrough interactions, Evidence Pack generation, form submissions

**FR34:** Analytics dashboard (internal) tracks: scenario deployment frequency, time-to-first-insight, form completion rates, journey drop-off points

**FR35:** Analytics identify which scenarios drive informed decisions (proceed, reject, evaluate deeper) vs. incomplete evaluations

**FR36:** System enables survey follow-up tracking: which councils presented evidence packs to committees, outcome (approved/rejected), action taken

### Integration & Extensibility

**FR37:** CloudFormation templates use publicly available AWS SDKs (Boto3, Node.js, AWS CLI) with sample code provided in multiple languages

**FR38:** Templates and documentation follow AWS best practices and naming conventions, enabling easy extension by implementation partners

**FR39:** All templates are open-source (MIT license) with clear contribution guidelines, enabling community improvements

**FR40:** Portal provides contact information and process for feedback, bug reports, and scenario suggestions

### Accessibility

**FR41:** Portal achieves WCAG 2.2 AA compliance across all pages and interactions

**FR42:** Deployment guides support text-to-speech readers without loss of critical information

**FR43:** All images include alt text describing content (architecture diagrams, screenshots)

**FR44:** Video walkthroughs are captioned with transcripts available

### Repository & Distribution

**FR45:** GitHub repository is public with clear README, QUICKSTART.md, ACCESSIBILITY.md, and CONTRIBUTING.md files

**FR46:** Repository structure is well-organized: `/scenarios/{name}/` with CloudFormation template, README, and architecture diagram per scenario

**FR47:** Repository includes sample data scripts and templates for future scenario development consistency

**FR48:** Portal markdown is formatted for compatibility with ndx.digital.cabinet-office.gov.uk PRs and standalone GitHub Pages hosting

### Integration with LGA AI Hub

**FR49:** NDX:Try is listed in LGA AI Hub resources with categorization and search tags

**FR50:** Portal includes LGA branding/acknowledgment and co-promotion messaging

### Success Metrics & Reporting

**FR51:** System generates monthly reports on: deployments per scenario, unique councils, journey completion rates, Evidence Pack adoption

**FR52:** System provides dashboard for tracking primary success metric (informed decision rate) and secondary metrics (engagement, quality, business impact)

---

## Non-Functional Requirements

### Performance

**NFR1:** Portal pages (scenario gallery, quick-start guide) load in <2 seconds on typical council network (assume 10 Mbps broadband)

**NFR2:** Scenario Selector quiz completes in <30 seconds with immediate results

**NFR3:** Evidence Pack PDF generation completes in <5 seconds (auto-population from session data)

**NFR4:** CloudFormation deployments complete in 15 minutes or less (measured from button click to first interactive component ready)

**NFR5:** Demo videos buffer quickly on typical council bandwidth; streaming quality degrades gracefully but remains watchable on slower connections

### Security

**NFR6:** CloudFormation templates enforce least-privilege IAM policies; no wildcard permissions (`*`)

**NFR7:** All templates deploy to isolated AWS Innovation Sandbox accounts with built-in cost controls; templates cannot access external AWS accounts

**NFR8:** Sensitive data (API keys, credentials) are never embedded in templates; all external integrations use IAM roles and temporary credentials

**NFR9:** Portal uses HTTPS throughout; no insecure HTTP traffic

**NFR10:** Session data (form responses, deployment logs) are encrypted at rest

**NFR11:** Portal does not store council-specific data longer than necessary for evidence pack generation (retention policy: 90 days post-deployment cleanup)

**NFR12:** Templates include security best practices: VPC restrictions, security group whitelisting, CloudTrail logging enabled by default

### Scalability

**NFR13:** Portal architecture supports 100+ councils deploying scenarios concurrently (no single point of bottleneck)

**NFR14:** Analytics system can ingest 1000+ session events per hour without data loss or delays

**NFR15:** Evidence Pack generator can auto-generate PDFs at 50+ packs/hour without degradation

**NFR16:** Portal remains responsive during traffic spikes (GitHub-hosted site serves static content; no database bottlenecks)

### Accessibility (WCAG 2.2 AA)

**NFR17:** All portal pages pass automated WCAG 2.2 AA validation (measured via WAVE, Axe, or similar)

**NFR18:** Keyboard navigation works for all interactive elements (quiz, forms, scenario selection)

**NFR19:** Color is not the only indicator of status; success/error messages use text and icons

**NFR20:** Forms support screen reader navigation; labels are associated with inputs

**NFR21:** Videos are captioned; transcripts are provided in text format

**NFR22:** Deployment guides work equally well with text-to-speech; critical commands are copyable

### Reliability & Availability

**NFR23:** Portal maintains 99.5%+ availability (GitHub Pages SLA)

**NFR24:** CloudFormation templates are tested before release; deployment success rate target is 95%+ first-time

**NFR25:** Automated cleanup Lambda functions have 99%+ success rate (verifiable via CloudWatch logs)

**NFR26:** Evidence Pack generator has error handling and graceful degradation (missing data is noted, not fatal)

**NFR27:** Analytics system has backup/redundancy; no loss of session data due to infrastructure failure

### Compliance & Privacy

**NFR28:** Portal complies with UK GDPR; no unnecessary personal data collection

**NFR29:** Sample data used in scenarios is synthetic and anonymized; no real council data is exposed

**NFR30:** Templates are compatible with G-Cloud compliance requirements (no prohibited integrations)

**NFR32:** Analytics dashboard provides transparency: councils can see what data is captured during their session

### Maintainability & Extensibility

**NFR33:** CloudFormation templates follow consistent naming conventions and structure enabling easy extension

**NFR34:** Documentation is clear enough that external developers can contribute new scenarios (measured by community PRs)

**NFR35:** Scenario metadata format is standardized, enabling automated testing and validation of new templates

**NFR36:** Portal uses simple Markdown format, enabling non-technical content updates (e.g., case study additions)

---

---

## PRD Summary

### What We've Defined

**Product:** NDX:Try AWS Scenarios - a "try before you buy" platform enabling UK local government to evaluate AWS cloud services through curated, one-click-deployable CloudFormation scenarios.

**Problem Solved:** Councils can't evaluate AWS without deploying (risky), won't deploy without evaluating (risky paradox). NDX:Try breaks this paralysis with zero-cost, time-limited evaluation environments + committee-ready evidence generation.

**Unique Value:** "Beyond what the sales literature says" - experiential proof using realistic UK council data, quick "wow moments," and evidence packs that translate demo experience into procurement justification.

**MVP Scope:** 6 validated scenarios (Council Chatbot, Planning AI, FOI Redaction, Smart Car Park IoT, Text-to-Speech, QuickSight) + scenario selector + one-click deployment + Evidence Pack generator + zero-deployment pathways.

**Success Definition:** 65-80% of evaluating councils take measurable action (proceed, reject, evaluate deeper) - ending paralysis is the goal, not forced adoption.

### Key Design Principles

1. **Confidence-building, not technology-showing** - Every interaction reduces anxiety and increases actionability
2. **15 minutes to "wow"** - Time to first insight is critical; optimize for quick success moments
3. **Multiple evaluation pathways** - Not all councils deploy; provide video/partner/screenshot alternatives
4. **Committee-ready evidence** - Translate demo experience into procurement justification automatically
5. **GovTech-first approach** - UK local government context, WCAG 2.2 AA accessibility, GDPR compliance, G-Cloud alignment

### Requirements Completeness Validation

**Scenario Management:** ✓ 3 FRs covering template library, metadata, versioning
**Discovery & Navigation:** ✓ 4 FRs covering scenario gallery, selector quiz, quick-start
**Deployment & Infrastructure:** ✓ 5 FRs covering one-click deploy, real-time progress, automated cleanup, cost validation
**Guided Experience:** ✓ 3 FRs covering walkthrough guides, expected outputs, sample queries
**Experience Capture:** ✓ 5 FRs covering reflection guide, Evidence Pack generation, persona-specific templates
**Zero-Deployment Pathways:** ✓ 4 FRs covering demo videos, screenshots, partner tours
**Documentation:** ✓ 5 FRs covering portal pages, scenario pages, architecture diagrams, procurement guidance
**Sample Data:** ✓ 3 FRs covering realistic UK data, ROI-enabling values, automation
**Analytics:** ✓ 4 FRs covering event capture, dashboards, outcome tracking, survey integration
**Integration & Community:** ✓ 4 FRs covering SDKs, open-source licensing, contribution guidelines, feedback mechanisms
**Accessibility:** ✓ 4 FRs covering WCAG 2.2 AA, deployment guide accessibility, video captions, alt text
**Repository & Distribution:** ✓ 4 FRs covering GitHub structure, README files, markdown compatibility, LGA integration

**Total: 52 Functional Requirements** covering all capability areas required for MVP success

**Non-Functional Requirements:** ✓ 36 NFRs covering performance, security, scalability, accessibility, reliability, compliance, maintainability

### Alignment with Product Brief & Research

- **Market Validation:** Research confirmed 90% G-Cloud non-adoption, 856% AI contract growth, peer validation as key driver
- **Use Cases:** All 6 Starter Pack scenarios validated by research (Council Chatbot, Planning AI, FOI Redaction, Car Park IoT, Text-to-Speech all research-backed)
- **Personas:** Requirements tailored for 4 key personas (CTO, Service Manager, Developer, Finance)
- **Journey Mapping:** FRs address all journey stages (discovery, deployment, experience, evaluation, decision, pathway)
- **Innovation Patterns:** Core innovation (evaluation without commitment) embedded in deployment + Evidence Pack FRs
- **GovTech Compliance:** WCAG 2.2 AA, G-Cloud compatibility, GDPR, data residency all specified in NFRs

### Ready for Next Phases

✓ **UX Design Phase:** FRs provide clear specification of discovery flow, Evidence Pack UI, accessibility requirements

---

## PRD Extension: Hands-On Exploration & Learning (Phase 2)

**Extension Date:** 2025-11-28
**Extension Author:** cns
**Extension Version:** 1.1

### Extension Rationale

The initial MVP (Epics 1-5) successfully delivers the "Deploy → Try → Evaluate → Decide" journey. However, user feedback and observation reveals a critical gap:

**Gap Identified:** After deployment, end users (particularly non-technical personas like Service Managers and Finance officers) don't know how to:
- **Explore** what's actually been deployed beyond the scripted walkthrough
- **Experiment** with changes to understand how the system responds
- **Learn** the underlying AWS concepts through hands-on interaction
- **Break things safely** to understand limitations and edge cases

**User Quote (synthesized from feedback):** "I deployed the chatbot and asked the sample questions, but then what? I want to understand how it works, try my own ideas, and see what happens when I change things - but I don't know where to start."

### Extension Scope

This extension adds **6 new epics** (Epic 6-11), one per scenario, each focused on:

1. **Visual Exploration Guides** - Web UI-based exploration (no command line for non-technical users)
2. **"What Can I Change?" Experiments** - Safe modifications users can make to see what happens
3. **"How Does It Work?" Architecture Walkthroughs** - Behind-the-scenes exploration via AWS Console
4. **"Break It to Learn" Challenges** - Intentional edge cases and failure modes to understand limitations
5. **"Take It Further" Extensions** - Ideas for customization and production considerations
6. **Comprehensive Screenshots** - Visual-first documentation for every exploration step

### Extension Vision Alignment

This extension transforms NDX:Try from **"evaluation tool"** to **"learning platform"** - councils don't just decide whether to buy, they gain foundational understanding of AWS capabilities that de-risks their production implementation.

**Extended Value Proposition:**
- **Before:** "I saw the demo work" (passive evaluation)
- **After:** "I understand how it works, what I can change, and what happens when I push the limits" (active learning)

---

## Extended Functional Requirements (FR57-FR80)

### Hands-On Exploration Framework

**FR57:** Each scenario provides exploration in two tiers (revised per Devil's Advocate):
- **Quick Exploration** (1-2 activities): **Merged INTO existing walkthrough** (Epic 3 stories) rather than added separately - reduces duplication and ensures all users experience exploration naturally as part of the flow
- **Deep Dive Exploration** (3-5 additional activities): Available as optional continuation section for users who want comprehensive understanding
- Implementation Note: Story X.1 updates the EXISTING walkthrough rather than creating new landing page

**FR58:** Exploration activities are categorized by persona:
- **Non-Technical Path** (Service Manager, Finance): Web UI only, screenshot-heavy, no console commands
- **Technical Path** (Developer, CTO): Includes AWS Console navigation, CloudWatch logs, code inspection
- **Note:** Persona paths include fallback content for when deployed stacks have expired (static screenshots showing what you WOULD see)

**FR59:** Each exploration activity includes:
- Clear objective ("See how the chatbot handles an unexpected question")
- Step-by-step instructions with screenshots
- Expected outcome with visual confirmation
- "What you learned" summary connecting activity to business value

**FR60:** Exploration activities are sequenced from simple to complex, with clear "Start Here" recommendation for each persona. Each scenario provides exactly **5 exploration activities total** (not 13+):
- 2 "What Can I Change?" experiments
- 1 "How Does It Work?" architecture view
- 1 "Test the Limits" boundary exercise
- 1 "Take It Further" production consideration

Total exploration time: **15-20 minutes maximum** (not 30-60 minutes)

### Visual-First Documentation

**FR61:** Every exploration step includes annotated screenshots showing:
- Where to click (red circles/arrows)
- What to look for (highlighted areas)
- Expected results (comparison images)

**FR62:** Screenshots are auto-generated from live deployed scenarios using Playwright, ensuring accuracy and consistency. **Screenshot automation is shared infrastructure** (not per-epic implementation):
- Built once in Sprint 0, before Epic 6 begins
- Dedicated maintenance owner with 48-hour SLA for updates after UI changes
- Pipeline includes visual regression testing to detect drift

**FR63:** Alternative text for all screenshots describes the action and expected result, supporting screen reader users

**FR64:** "Pretty web page" alternatives exist for every console-based exploration, showing the same information through the deployed web interface where possible

### "What Can I Change?" Experiments

**FR65:** Each scenario includes 3-5 "What If?" experiments users can safely try:
- Example (Chatbot): "What if I ask a question not in the knowledge base?"
- Example (Planning AI): "What if I upload a document in a different format?"
- Example (Car Park): "What if all sensors report 'full' at once?"

**FR66:** Experiments include "Reset to Default" option to restore original state after experimentation

**FR67:** Experiments clearly indicate which changes are reversible vs. permanent

**FR68:** Each experiment shows the "Before and After" impact in business terms, not just technical terms

### "How Does It Work?" Architecture Exploration

**FR69:** Each scenario includes a "Behind the Scenes" tour showing:
- Data flow through AWS services (with screenshots of each component)
- Where data is stored (DynamoDB tables, S3 buckets)
- How processing happens (Lambda functions, AI service calls)
- Cost accumulation (which services cost money, which are free)

**FR70:** Architecture exploration provides two paths:
- **Visual Tour** (non-technical): Annotated architecture diagram with "click here to see" callouts
- **Console Tour** (technical): Step-by-step AWS Console navigation to view actual resources

**FR71:** Each AWS service component has a "What is this?" explainer with council-specific context:
- Example: "Amazon Bedrock is like hiring an expert who never sleeps - it can answer questions 24/7 using AI trained on millions of examples"

### "Test the Limits" Boundary Exercises

**FR72:** Each scenario includes 1 "Test the Limits" boundary exercise (not 2-3 "failure" exercises - reduced scope, friendlier language):
- Example (Chatbot): "See what happens when you ask something outside the knowledge base"
- Example (FOI Redaction): "Try a document with no sensitive data and see the result"
- Example (Car Park): "Watch how the dashboard handles a sensor going offline"

**Note:** Language changed from "Break It to Learn" to "Test the Limits" based on pre-mortem analysis - "break" language alienated non-technical personas who feared they'd cause actual damage.

**FR73:** Boundary exercises explain the business implications in reassuring terms:
- "In production, this edge case would be handled by [Y mechanism]. The system is designed to cope gracefully."

**FR74:** Each boundary exercise includes:
- Clear "This is safe to try" reassurance upfront
- Recovery instructions if needed: "The system returns to normal automatically" or "Refresh the page to continue"
- Connection to production considerations: "In your real deployment, you'd configure [X] to handle this"

### "Take It Further" Extensions

**FR75:** Each scenario includes a "Production Considerations" section covering:
- What would change at scale (more data, more users, higher availability)
- Security hardening needed for production
- Integration points with existing council systems
- Estimated production costs vs. demo costs

**FR76:** Each scenario suggests 2-3 customizations users could request from implementation partners:
- Example (Chatbot): "Train on your council's actual FAQ", "Add live agent handoff", "Integrate with CRM"

**FR77:** "Next Steps" clearly distinguishes:
- What users can try themselves (DIY exploration)
- What requires technical expertise (partner engagement)
- What requires procurement (production deployment)

### Scenario-Specific Exploration Depth

**FR78:** Council Chatbot exploration includes:
- Testing with various question types (factual, conversational, out-of-scope)
- Viewing conversation history in DynamoDB
- Observing Bedrock model invocation logs
- Experimenting with different response styles

**FR79:** Planning Application AI exploration includes:
- Processing different document types (PDF, image, handwritten)
- Viewing Textract extraction confidence scores
- Observing Comprehend entity recognition results
- Comparing AI extraction vs. manual extraction accuracy

**FR80:** All 6 scenarios have equivalent exploration depth (5 activities each, 15-20 minutes total exploration time per scenario)

### Pre-mortem Preventive Measures (FR81-FR83)

**FR81:** Screenshot automation pipeline is implemented as **shared infrastructure in Sprint 0** before Epic 6 begins:
- Single Playwright-based pipeline serving all 6 scenarios
- Dedicated maintenance owner assigned with clear SLA (48-hour update after UI changes)
- Weekly scheduled runs to detect screenshot drift
- Visual regression alerts when screenshots change >10%

**FR82:** Exploration section includes clear **completion indicator** to prevent abandonment:
- After completing 3 of 5 activities: "✓ You've completed the essential exploration"
- Optional continuation prompt: "Want to go deeper? 2 more activities available"
- Clear exit point that doesn't make users feel incomplete

**FR83:** Console tour paths (technical persona) include **stack-agnostic fallbacks**:
- When deployed stack has expired (after 90-minute auto-cleanup), show static screenshots of what the user WOULD see
- Fallback message: "Your demo environment has expired. Here's what you would see in the AWS Console:"
- Fallback screenshots captured from reference deployment and stored as static assets

### Empathy-Driven Enhancements (FR84-FR89)

**FR84:** Each exploration activity displays a **"Safe to Explore" badge** with reassurance text:
- Badge text: "✓ Safe to Explore"
- Tooltip/hover: "This activity won't affect your bill or break anything permanently"
- Applies to all 5 activity types across all 6 scenarios
- Addresses non-technical persona anxiety about experimentation

**FR85:** Architecture explanations include a **"Simple View" toggle**:
- Default view: Visual architecture diagram with service icons and arrows
- Simple View: Bullet-point explanation in plain English (no jargon)
- Example Simple View: "1. You type a question → 2. The chatbot understands it → 3. It searches the knowledge base → 4. You get an answer"
- Toggle persists per session (user preference remembered)

**FR86:** Each exploration activity includes optional **"View the Code" links** for technical personas:
- Link to **file-level** (not line numbers) in GitHub to avoid broken links
- Use **release tags** (e.g., `v1.2.0`) not commit SHAs for stability
- Fallback text when code moves: "Code has moved? Search for [function_name]"
- Clearly marked as "For Technical Users" to avoid overwhelming Service Managers
- Opens in new tab to preserve exploration context

**FR87:** Cost transparency via **single header statement** (revised per Devil's Advocate):
- Exploration section header displays: "💰 All activities in this section are free to try"
- Per-activity cost shown ONLY when non-zero (rare exception cases)
- Avoids reinforcing cost anxiety by repeatedly showing "£0.00"
- Addresses cost anxiety while reducing visual noise

**FR88:** "Test the Limits" activities include an **"Advanced Mode" checkbox** for technical personas:
- Default (unchecked): 1 guided boundary exercise with expected outcomes
- Advanced Mode (checked): 3 additional technical challenges (edge cases, error handling, scale limits)
- Advanced challenges include hints but not full solutions
- Satisfies technical persona desire for deeper exploration

**FR89:** *(Superseded by FR90)* ~~Each exploration activity is labeled with its target persona tier~~

**FR90:** Exploration sections include a **"Simplify for me" toggle** (inverted persona model per Devil's Advocate analysis):
- Default: Show ALL activities without persona labels (no stigma)
- Toggle ON: Hides technical-only activities, shows only Visual-First and Both
- Removes cognitive load of self-identifying persona
- Addresses concern that explicit "Technical" labels may intimidate non-technical users

### Journey Flow Enhancements (FR91-FR97)

**FR91:** Walkthrough-to-exploration **transition message** provides context:
- After walkthrough success: "Great! You've seen it work. Now let's explore what you can do with it."
- Bridges the mental model shift from "watching demo" to "hands-on learning"
- Appears inline, not as modal or interstitial

**FR92:** Deep Dive entry shows **time estimate**:
- Display: "Deep Dive Exploration (~15 minutes for all activities)"
- Reduces uncertainty about commitment required
- Updates dynamically if user has already completed some activities

**FR93:** "Simplify for me" toggle appears in **sticky header**:
- Visible without scrolling on exploration landing page
- Persists in header as user scrolls through activities
- State persists across page navigation within same session

**FR94:** First activity displays **"Start here" badge** for guided entry:
- Non-technical users see badge on most accessible activity
- Badge text: "Recommended first activity"
- Reduces choice paralysis when viewing 5 activities

**FR95:** Modify FR85 - Simple View is **default when "Simplify for me" enabled**:
- If toggle ON: Architecture content shows bullet-point view by default
- User can still switch to diagram view manually
- Ensures consistent simplified experience throughout

**FR96:** Exit screen shows **"What you learned" summary**:
- 3-4 bullet points generated from completed activities
- Example: "✓ You can change the chatbot greeting without code"
- Example: "✓ The system uses Bedrock for AI responses"
- Reinforces learning outcomes and aids evidence pack creation

**FR97:** Quick exploration includes **"Skip to Deep Dive" link** for technical users:
- Displayed below inline experiment: "Already familiar? Skip to Deep Dive →"
- Allows returning users or technical users to bypass basic content
- Respects user time and expertise level

**FR98:** Modify FR88 - Advanced Mode checkbox **visible above the fold**:
- Checkbox appears at TOP of "Test the Limits" section, not bottom
- Label: "I want more technical challenges"
- Technical users see option immediately without scrolling

**FR99:** Deep Dive completion offers **"Export exploration notes"**:
- Downloads markdown/PDF summary of activities completed
- Includes: activities done, key learnings, screenshots viewed
- Feeds directly into evidence pack workflow (Epic 4 integration)
- Available even for partial completion (exports what was done)

### FR Prioritization (Updated with Journey Mapping)

**Core FRs (MVP - Must Have):**
- FR57-FR60: Exploration framework and structure
- FR72-FR74: "Test the Limits" boundary exercises
- FR81-FR83: Pre-mortem preventive measures (screenshots, fallbacks, completion)
- FR90: Simplified persona toggle
- FR91-FR92: Transition message, time estimate (critical journey flow)
- FR96: Learning summary on exit (reinforces value)

**Enhanced FRs (Phase 2 - Can Defer):**
- FR84-FR85: Safe to Explore badge, Simple View toggle
- FR86-FR87: View the Code links, per-activity cost display
- FR88, FR98: Advanced Mode enhancements
- FR93-FR95: Sticky header, Start here badge, Simple View default
- FR97: Skip to Deep Dive link
- FR99: Export exploration notes

This prioritization allows MVP delivery with 19 Core FRs, deferring 11 Enhanced FRs to Phase 2.

### Cost-Benefit Analysis Summary

**Investment:**
- 30 new stories across Epic 6-11 (5 per scenario)
- ~94 story points total (~60 for MVP Core FRs)
- Sprint 0 infrastructure: Screenshot automation pipeline (8 pts)
- Ongoing maintenance: ~274 hours/year for screenshot updates and content maintenance

**Return:**
- +15% improvement in councils making informed AI decisions (from 30% to 45%)
- -30% reduction in post-trial support queries (self-service exploration)
- Stronger evidence packs enabling faster council approval cycles
- LGA AI Hub differentiation through unique hands-on learning offering

**Break-Even:** Investment justified if 15+ additional councils make informed AI adoption decisions.

**CBA Recommendations Applied:**

**CBA1 - MVP-First Approach:** Release with Core FRs only, validate with real usage before Phase 2.

**CBA2 - Phase 2 Triggers:** Proceed with Enhanced FRs when:
- exploration_completed rate exceeds 40% of walkthrough completers
- User feedback requests specific enhanced features (FR99 export most likely)
- Support ticket analysis shows gaps addressable by enhanced features

**CBA3 - Maintenance Budget:** 274 hours/year allocated:
- Screenshot updates: 150 hrs/year (weekly checks, 48hr SLA)
- Content updates: 72 hrs/year (monthly AWS changes)
- Analytics monitoring: 52 hrs/year (weekly review)

**CBA4 - Primary Success Metric:** `exploration_completed` event (NFR43) is the key indicator of investment success.

**CBA5 - Epic 6 Reference Implementation:** Council Chatbot (Epic 6) receives extra investment as reference implementation. Patterns, components, and templates established here reduce Epic 7-11 effort by ~40%.

**CBA6 - Scenario Flexibility:** If timeline pressure occurs:
- **Option A (Recommended):** 6 scenarios with MVP features
- **Option B:** 4 scenarios (Chatbot, Planning AI, FOI, IoT) with full features, defer 2 scenarios (TTS, QuickSight) to Phase 2

---

## Extended Non-Functional Requirements (NFR37-NFR44)

### Exploration Experience Quality

**NFR37:** Exploration activities complete without errors 95%+ of the time (measured via analytics events)

**NFR38:** Screenshots are updated within 48 hours of any UI changes to deployed scenarios

**NFR39:** Non-technical exploration paths require zero command-line interaction

**NFR40:** Exploration sections load in <3 seconds, including all screenshots (lazy loading where appropriate)

### Learning Outcome Tracking

**NFR41:** Analytics capture exploration depth: which activities attempted, completed, and abandoned

**NFR42:** Post-exploration survey captures learning outcomes: "I understand better how [X] works" (self-reported confidence)

**NFR43:** Analytics system captures **exploration_completed** event (Event 8 in Story 5.2):
- Triggered when user completes 3+ exploration activities OR clicks "I'm done exploring"
- Data captured: scenario_id, activities_attempted (list), activities_completed (list), time_spent_exploring, path_taken (visual/console/mixed)
- Purpose: Measure exploration adoption rate and identify which activities resonate

### Screenshot Maintenance (Devil's Advocate Response)

**NFR44:** Screenshot maintenance has **named role ownership** with explicit SLA:
- Assigned Role: "Exploration Content Owner" (must be named individual, not team)
- SLA: 48-hour update window after any AWS Console UI change detected
- Escalation: If role vacant for >2 weeks, exploration sections display "Screenshots may be outdated" warning
- Handover requirement: Role transition requires documented handover including Playwright script access
- Addresses concern that screenshot maintenance will be deprioritized post-launch

---

## Epic 6-11: Scenario-Specific Exploration Epics

### Epic Structure (Applies to All 6 Scenarios)

Each scenario exploration epic (Epic 6-11) follows the same structure:

**Goal:** Transform passive demo experience into active understanding through hands-on exploration

**User Value:** "I don't just know it works - I understand how it works and what I can change"

**Stories per Epic (6 stories each):**
1. **Story X.1:** Visual Exploration Landing Page - Overview of exploration activities with persona-based paths
2. **Story X.2:** "What Can I Change?" Experiments (3-5 experiments with screenshots)
3. **Story X.3:** "How Does It Work?" Architecture Tour (visual + console paths)
4. **Story X.4:** "Break It to Learn" Challenges (2-3 failure exercises)
5. **Story X.5:** "Take It Further" Production Guidance
6. **Story X.6:** Screenshot Automation & Maintenance Pipeline

### Epic 6: Council Chatbot Exploration

**Unique Exploration Focus:** Natural language understanding, conversation context, knowledge base management

**Key Experiments:**
- Ask questions not in the knowledge base (observe graceful fallback)
- Have a multi-turn conversation (observe context retention)
- Ask the same question differently (observe semantic understanding)
- Request information requiring reasoning (observe AI inference)
- Ask in Welsh or another language (observe language handling)

**Architecture Tour Highlights:**
- Lex conversation flow
- Bedrock model invocation logs (CloudWatch)
- DynamoDB conversation history
- S3 knowledge base documents

**Break It Challenges:**
- Overload with very long input (observe token limits)
- Ask about sensitive topics (observe content filtering)
- Rapid-fire questions (observe rate limiting)

### Epic 7: Planning Application AI Exploration

**Unique Exploration Focus:** Document processing, entity extraction, confidence scoring

**Key Experiments:**
- Upload documents with varying quality (scanned, photographed, typed)
- Process documents with handwritten notes
- Submit partially filled applications
- Upload multi-page vs. single-page documents
- Test with different file formats (PDF, PNG, TIFF)

**Architecture Tour Highlights:**
- S3 document upload process
- Textract document analysis
- Comprehend entity extraction
- Bedrock AI summarization
- Results storage and retrieval

**Break It Challenges:**
- Upload empty document (observe error handling)
- Submit very large document (observe processing limits)
- Upload corrupted file (observe validation)

### Epic 8: FOI Redaction Exploration

**Unique Exploration Focus:** PII detection, redaction accuracy, review workflow

**Key Experiments:**
- Documents with obvious PII (names, addresses, phone numbers)
- Documents with subtle PII (staff IDs, case references)
- Documents with false positives (place names matching person names)
- Adjust confidence threshold and observe impact
- Compare auto-redaction vs. manual review

**Architecture Tour Highlights:**
- Comprehend PII entity detection
- Confidence scoring visualization
- Redaction decision audit trail
- Before/after document comparison

**Break It Challenges:**
- Document with no PII (observe zero-redaction output)
- Document entirely PII (observe high-redaction handling)
- Unusual character encodings (observe parsing)

### Epic 9: Smart Car Park IoT Exploration

**Unique Exploration Focus:** Real-time data, IoT simulation, dashboard interaction

**Key Experiments:**
- Simulate sensor state changes (occupied/vacant toggle)
- Observe dashboard real-time updates
- Generate historical data patterns (busy hour simulation)
- Trigger threshold alerts (capacity warnings)
- Filter dashboard by zone/time period

**Architecture Tour Highlights:**
- IoT Core message routing
- Timestream data storage
- QuickSight dashboard queries
- Lambda data processing
- API Gateway public endpoints

**Break It Challenges:**
- Simulate all sensors offline (observe degraded state)
- Rapid sensor state changes (observe rate handling)
- Invalid sensor data (observe validation)

### Epic 10: Text-to-Speech Exploration

**Unique Exploration Focus:** Voice selection, speech customization, audio quality

**Key Experiments:**
- Try different voices (Amy, Brian, Emma)
- Compare neural vs. standard engines
- Use SSML for emphasis and pauses
- Convert different content types (announcements, letters, FAQs)
- Test pronunciation of council-specific terms

**Architecture Tour Highlights:**
- Polly voice synthesis
- S3 audio file storage
- Audio streaming vs. download
- Caching for repeated content

**Break It Challenges:**
- Very long text (observe chunking behavior)
- Non-English text (observe language handling)
- Special characters (observe pronunciation)

### Epic 11: QuickSight Dashboard Exploration

**Unique Exploration Focus:** Data visualization, filtering, sharing, customization

**Key Experiments:**
- Apply different filters (date range, department, metric)
- Drill down into data points
- Export charts and reports
- Create calculated fields (simple aggregations)
- Schedule report delivery

**Architecture Tour Highlights:**
- Glue data catalogue
- S3 data source
- QuickSight datasets and analysis
- Embedding options (for website integration)

**Break It Challenges:**
- Filter to no data (observe empty state handling)
- Large date range (observe performance)
- Complex calculated field (observe limits)

---

## Summary of PRD Extension

### What This Extension Adds

**New Functional Requirements:** FR57-FR80 (24 new FRs) covering exploration framework, visual documentation, experiments, architecture tours, failure exercises, and production guidance

**New Non-Functional Requirements:** NFR37-NFR42 (6 new NFRs) covering exploration quality and learning tracking

**New Epics:** Epic 6-11 (6 new epics, one per scenario) with 6 stories each = 36 new stories

### Updated Totals

| Category | Original MVP | Extension | Total |
|----------|--------------|-----------|-------|
| Functional Requirements | FR1-FR56 | FR57-FR83 | **83 FRs** |
| Non-Functional Requirements | NFR1-NFR36 | NFR37-NFR43 | **43 NFRs** |
| Epics | Epic 1-5 | Epic 6-11 | **11 Epics** |
| Stories | 26 | 36 | **62 Stories** |

### Pre-mortem Risk Mitigations Applied

Based on pre-mortem analysis, the following changes were made to reduce failure risk:

| Risk | Mitigation | FR/NFR |
|------|-----------|--------|
| Users skip exploration entirely | Integrated "Quick Exploration" into basic walkthrough | FR57 |
| Cognitive overload (too many activities) | Reduced from 13+ to exactly 5 activities per scenario | FR60, FR80 |
| "Break it" language alienates non-technical users | Renamed to "Test the Limits" with reassuring language | FR72-74 |
| Screenshot rot (outdated images) | Sprint 0 shared infrastructure with dedicated owner | FR62, FR81 |
| Console links break when stack expires | Stack-agnostic fallbacks with static screenshots | FR83 |
| No clear "done" signal causes abandonment | Completion indicator after 3 activities | FR82 |
| Can't measure exploration success | Added exploration_completed analytics event | NFR43 |

### Extension Dependencies

Epic 6-11 depend on:
- Epic 2 (Deployment) - Scenarios must be deployable
- Epic 3 (Guided Experiences) - Basic walkthroughs must exist
- Deployed CloudFormation templates functioning correctly

### Extension Success Criteria

**Primary Metric:** Exploration completion rate - 40%+ of users who complete basic walkthrough continue to exploration activities

**Secondary Metrics:**
- Self-reported understanding increase: "I understand how this works" rating improvement
- Time spent in exploration: 15-30 minutes per scenario (engaged learning)
- Evidence Pack quality: Users who explore produce higher-quality committee materials

### Extension Timeline Considerations

Recommend implementing Epic 6 (Council Chatbot Exploration) first as pilot:
- Council Chatbot has highest deployment volume
- Validates exploration framework before applying to other scenarios
- Lessons learned inform Epic 7-11 implementation

---

_Extension v1.1 complete. This PRD now covers both MVP delivery (Epic 1-5) and Hands-On Exploration phase (Epic 6-11)._

---

## PRD Extension: Navigation & Sample Data Clarity (v1.2)

**Extension Date:** 2025-11-29
**Extension Author:** cns
**Extension Version:** 1.2
**Elicitation Methods Applied:** Devil's Advocate, Cost-Benefit Analysis, Journey Mapping

### Extension Rationale

Post-Epic 6-11 implementation revealed two critical UX gaps:

**Gap 1: Navigation Disconnection**
"The walkthroughs created are not obviously connected to the scenarios" - Users completing scenario deployment don't discover the walkthrough or exploration pages because navigation between phases is not prominent.

**Gap 2: Sample Data Confusion**
"The re-seed sample data is not clear what it does" - Users see "Re-seed Data" buttons but don't understand the purpose, whether it costs money, or what will change.

**Original Proposal (Modified by Elicitation):**
User requested Lambda-based dynamic data generation for all scenarios. After Devil's Advocate challenge and Cost-Benefit Analysis, this was refined to a phased approach with scenario differentiation.

### Extension Scope (Phased Implementation)

#### Phase 1: MVP - Static Data + Clarity (£1,200 | 16 story points)
- **FR100**: Clear navigation between scenario phases
- **FR101**: Sample data explanation panels
- **FR102**: Enhanced static sample data with variation

**Phase 1 Trigger:** Immediate implementation (addresses user feedback)

#### Phase 2: Conditional - Smart Car Park Lambda (£1,500 | 10 story points)
- **FR103**: Lambda-based data generation for IoT scenario only
- **FR105**: Data generation control interface
- **FR106**: Cost controls and circuit breaker

**Phase 2 Trigger:** Analytics show >40% of Smart Car Park users attempting data refresh AND support queries about "stale data" exceed 5/month

#### Phase 3: Conditional - QuickSight Lambda (£1,100 | 7 story points)
- **FR104**: Lambda-based data generation for QuickSight scenario
- Extends FR105/FR106 to QuickSight

**Phase 3 Trigger:** Phase 2 cost remains under £0.50/session average AND QuickSight users report data freshness as blocker in feedback

---

## Extended Functional Requirements (FR100-FR106)

### Navigation Clarity (Phase 1)

**FR100:** Each scenario provides clear visual navigation showing all three experience phases:
- **Phase Navigator Component**: Horizontal progress indicator showing "1. TRY → 2. WALK THROUGH → 3. EXPLORE"
- Appears on: Scenario pages, Walkthrough pages, Exploration pages
- Shows current phase highlighted, other phases clickable
- Breadcrumb trail maintains context: "Scenarios > Council Chatbot > Walk Through"
- Implementation: Single Nunjucks component, consistent across all 6 scenarios

**FR101:** Sample Data Explanation Component displays context before any data interaction:
- **Location**: Above "Re-seed Data" or equivalent buttons
- **Content Structure**:
  - What the data represents ("Simulated council parking data for demonstration")
  - Why it exists ("Pre-loaded so you can explore immediately without setup")
  - What re-seeding does ("Resets to fresh starting state - useful if you've made changes")
  - Cost indicator ("✓ Free - no AWS charges for this action")
- **Format**: GOV.UK Details component (expandable) with "What is this data?" summary
- Implementation: Reusable partial, data-driven from scenario YAML

**FR102:** Enhanced Static Sample Data provides realistic variation without Lambda:
- Each scenario includes 3-5 data "presets" users can select (e.g., "Busy Monday", "Quiet Weekend", "Peak Hour")
- Presets are pre-generated static files loaded on selection
- Creates perception of "different data" without runtime generation costs
- Addresses need for variation in evaluation without Lambda complexity

### Lambda Data Generation - Smart Car Park Only (Phase 2)

**FR103:** Smart Car Park IoT scenario includes Lambda-based dynamic data generation:
- **Rationale**: IoT scenarios uniquely benefit from live-updating metrics (occupancy changes in real-time)
- **Implementation**: EventBridge scheduled Lambda (every 5 minutes) generates sensor readings
- **Data Pattern**: Realistic parking patterns (morning arrivals, evening departures, weekend lulls)
- **Fallback**: If Lambda fails, dashboard shows last-known-good data with "Data as of [timestamp]" indicator
- **Scope**: Smart Car Park scenario ONLY (not Chatbot, Planning AI, FOI, TTS, QuickSight)

**FR104:** QuickSight Dashboard scenario includes Lambda-based data generation (Phase 3):
- **Rationale**: Analytics dashboards benefit from growing historical data
- **Implementation**: Daily Lambda appends new rows to S3/Glue data
- **Data Pattern**: Simulated KPI trends showing realistic variations
- **Fallback**: Static dataset with note "Demo uses sample data from [date range]"
- **Dependency**: FR103 must be stable for 30 days before FR104 implementation

### Data Generation Control (Phase 2/3 Only)

**FR105:** Data Generation Control Interface provides visibility into dynamic data:
- **Location**: Exploration pages for Smart Car Park (Phase 2) and QuickSight (Phase 3)
- **Features**:
  - "Pause Generation" toggle (stops scheduled Lambda)
  - "Generate Now" button (manual trigger)
  - "Reset to Default" button (restore static baseline)
  - Last generation timestamp display
- **Not Applicable To**: Chatbot, Planning AI, FOI, Text-to-Speech (static data only)

**FR106:** Data Generation Cost Controls enforce budget limits:
- **Session Cap**: £0.50 maximum per user session for Lambda invocations
- **Circuit Breaker**: If session cost exceeds cap, Lambda generation pauses with message:
  "You've reached the exploration limit for this session. Data generation paused to manage costs."
- **Static Fallback**: When circuit breaker triggers, system serves static data seamlessly
- **Monitoring**: CloudWatch alarm triggers at 80% of daily budget

---

## Extended Non-Functional Requirements (NFR45-NFR47)

### Navigation & Clarity

**NFR45:** Phase navigator component renders in <100ms and does not block page load
- Lazy-loads exploration phase availability check
- Shows placeholder state if deployment status unknown

### Data Generation Reliability (Phase 2/3)

**NFR46:** Lambda data generators maintain 99% success rate:
- Dead letter queue captures failed invocations
- Automatic retry (max 2) before falling back to static
- CloudWatch metrics: `data_generation_success_rate`, `data_generation_fallback_triggered`

### Cost Enforcement

**NFR47:** Per-session cost cap (£0.50) enforced at infrastructure level:
- AWS Budget alarm triggers Lambda throttling
- No user action can exceed defined cap
- Weekly cost report generated for monitoring

---

## Journey Mapping Validation

### User Journey: Scenario Phase Navigation

**Before (Pain Points):**
```
Scenario Page → "Try" deploys → AWS Console → [Lost - no path to walkthrough]
                                             → [Hidden - exploration pages undiscoverable]
```

**After (FR100 Implemented):**
```
Scenario Page → Phase Navigator visible
             → "1. TRY" | "2. WALK THROUGH" | "3. EXPLORE"
             → User sees full journey before committing
             → Any phase: same navigator shows current position
             → Seamless navigation between phases
```

### Touchpoint Improvements

| Touchpoint | Before | After |
|------------|--------|-------|
| Scenario Card | "Try It" button only | Phase indicator (1/3 available) |
| Scenario Page | Single CTA | Phase navigator with 3 options |
| Walkthrough | Orphaned page | Connected via breadcrumb + navigator |
| Explore | Hidden | Visible as Phase 3 |
| Sample Data | "Re-seed" mystery button | Explanation panel with context |

---

## Implementation Summary

### Phase 1 (Immediate - £1,200)

| Story | Description | Points |
|-------|-------------|--------|
| 12.1 | Phase Navigator Component | 5 |
| 12.2 | Sample Data Explanation Panels | 3 |
| 12.3 | Enhanced Static Data Presets | 5 |
| 12.4 | Navigation Integration Testing | 3 |
| **Total** | | **16** |

### Phase 2 (Conditional - £1,500)

| Story | Description | Points |
|-------|-------------|--------|
| 13.1 | Smart Car Park Data Generator Lambda | 5 |
| 13.2 | Data Generation Control UI | 3 |
| 13.3 | Cost Controls & Circuit Breaker | 2 |
| **Total** | | **10** |

### Phase 3 (Conditional - £1,100)

| Story | Description | Points |
|-------|-------------|--------|
| 14.1 | QuickSight Data Generator Lambda | 5 |
| 14.2 | Extend Control UI to QuickSight | 2 |
| **Total** | | **7** |

### Cost Comparison

| Approach | Dev Cost | Annual Ops | Break-Even |
|----------|----------|------------|------------|
| Phase 1 Only (Static) | £1,200 | £0 | Immediate value |
| Phase 1+2 (+ Car Park Lambda) | £2,700 | ~£600 | 1 additional council conversion |
| Full (All Phases) | £3,800 | ~£1,200 | 2 additional council conversions |

### Decision: Phase 1 MVP Recommended

Per Cost-Benefit Analysis:
- Phase 1 delivers 70% of user value at 31% of full cost
- Phase 2/3 proceed only when analytics validate demand
- Avoids premature infrastructure complexity for scenarios where static data suffices

---

## Updated PRD Totals

| Category | Before v1.2 | v1.2 Extension | Total |
|----------|-------------|----------------|-------|
| Functional Requirements | FR1-FR99 | FR100-FR106 | **106 FRs** |
| Non-Functional Requirements | NFR1-NFR44 | NFR45-NFR47 | **47 NFRs** |
| Epics | Epic 1-11 | Epic 12 (Phase 1) | **12 Epics** |
| Stories | 62 | +4 (Phase 1) | **66 Stories** |

*Note: Epic 13-14 (Phase 2-3) defined but not committed until triggers met.*

---

_Extension v1.2 complete. Navigation clarity and sample data explanation address immediate user feedback. Lambda data generation deferred to conditional phases pending validation._
✓ **Architecture Phase:** NFRs specify performance, security, scalability targets; project-type requirements clarify CloudFormation + portal architecture
✓ **Epic Breakdown:** 52 FRs can be systematically decomposed into epics and stories per scenario

---

## PRD Extension: AWS Federation Screenshot Automation (v1.3)

**Extension Date:** 2025-11-29
**Extension Author:** cns
**Extension Version:** 1.3
**Elicitation Methods Applied:** Technical Feasibility Analysis, Security Review, Implementation Viability Assessment

### Extension Rationale

**Critical Gap Identified:** FR62 and FR81 specify screenshot automation but provide no mechanism for authenticating to AWS Console. Without authenticated console access, Playwright cannot capture console screenshots - rendering the entire exploration screenshot strategy non-viable.

**The Problem:**
```
Current State:
FR62: "Screenshots are auto-generated from live deployed scenarios using Playwright"
FR81: "Screenshot automation pipeline is implemented as shared infrastructure"

Reality Check:
- AWS Console requires authentication
- Playwright cannot pass MFA or IAM Identity Center login
- Manual screenshot capture doesn't scale (6 scenarios × 20+ screenshots each)
- Expired stack fallbacks require real screenshots to exist first
```

**The Solution: AWS Federation for Browser Sessions**

AWS Security Token Service (STS) provides `GetFederationToken` which creates temporary credentials that can be converted to a console signin URL. This enables:

1. **Programmatic console access** - No manual login required
2. **Scoped permissions** - IAM policy limits what federation session can access
3. **Time-limited sessions** - Tokens expire automatically (15 min - 12 hour)
4. **Automation-friendly** - Works with Playwright/Puppeteer headless browsers

**Technical Flow:**
```
IAM User (service account)
    ↓ GetFederationToken (scoped IAM policy)
    ↓
Federated Credentials (AccessKeyId, SecretAccessKey, SessionToken)
    ↓ POST to signin.aws.amazon.com/federation
    ↓
SigninToken (temporary bearer token)
    ↓ Construct login URL with SigninToken
    ↓
Authenticated Console Session (in Playwright browser)
    ↓ Navigate to console pages
    ↓
Screenshots captured
```

---

## Extended Functional Requirements (FR107-FR115)

### AWS Federation Infrastructure

**FR107:** Screenshot automation uses AWS STS GetFederationToken for authenticated console access:
- **Service Account**: Dedicated IAM user with minimal permissions (`sts:GetFederationToken`)
- **Federation Policy**: Inline IAM policy restricts console access to:
  - Read-only access to deployed scenario resources
  - CloudWatch Logs viewing
  - DynamoDB table viewing
  - S3 bucket listing (not object content)
  - Lambda function configuration viewing
  - IoT Core thing/shadow viewing
  - QuickSight dashboard viewing (read-only embed)
- **Session Duration**: 1 hour maximum (sufficient for screenshot batch)
- **No Production Access**: Federation policy explicitly denies access to:
  - Account settings
  - IAM modifications
  - Billing/Cost Explorer
  - Any non-sandbox resources

**FR108:** SigninToken generation follows AWS federation endpoint pattern:
- **Endpoint**: `https://signin.aws.amazon.com/federation`
- **Action**: `getSigninToken`
- **Session Duration**: 900 seconds (15 minutes) - minimum for URL stability
- **Session JSON**: Includes AccessKeyId, SecretAccessKey, SessionToken
- **Error Handling**: Retry with exponential backoff on rate limits

**FR109:** Console Login URL construction enables Playwright navigation:
- **Endpoint**: `https://signin.aws.amazon.com/federation`
- **Action**: `login`
- **Destination**: Target console page (e.g., `https://us-west-2.console.aws.amazon.com/cloudwatch/home`)
- **SigninToken**: Embedded from FR108
- **Region Handling**: URLs target us-west-2 or us-west-2 (NDX:Try Innovation Sandbox regions)
- **Issuer**: Set to NDX:Try Screenshot Automation for CloudTrail attribution

**FR110:** Playwright browser session management ensures reliable screenshot capture:
- **Browser**: Chromium headless (or headed for debugging)
- **Viewport**: 1920x1080 for console screenshots, 375x812 for mobile portal screenshots
- **Wait Strategy**: Network idle + explicit element visibility checks
- **Error Recovery**: Retry failed page loads 3 times before marking screenshot as failed
- **Session Cleanup**: Browser context closed after batch, no credential persistence

**FR111:** Screenshot orchestration runs as scheduled pipeline:
- **Trigger**: Manual (ad-hoc) or scheduled (weekly via EventBridge/GitHub Actions)
- **Batch Processing**: All 6 scenarios processed sequentially to avoid rate limits
- **Output**: PNG files uploaded to S3 with versioning enabled
- **Manifest**: JSON manifest tracks screenshot metadata (timestamp, scenario, page, dimensions)
- **Notifications**: SNS/Slack notification on completion or failure

### Screenshot Accuracy and Maintenance

**FR112:** Visual regression detection identifies screenshot drift:
- **Baseline Comparison**: New screenshots compared to baseline using pixelmatch or similar
- **Threshold**: >10% pixel difference triggers review flag
- **Report**: Visual diff report generated for flagged screenshots
- **Action**: Flagged screenshots require manual approval before replacing baseline
- **Purpose**: Catches AWS Console UI changes that break documentation

**FR113:** Stack-Aware Screenshot Capture handles deployment timing:
- **Pre-Capture Check**: Verify target CloudFormation stack exists and is in COMPLETE state
- **Dynamic Resource Discovery**: Extract resource IDs from stack outputs (not hardcoded)
- **Resource URL Generation**: Build console URLs from discovered resource ARNs
- **Example**: Stack output `ChatbotLambdaArn` → Lambda console URL for that function

**FR114:** Fallback Screenshot Library provides stack-agnostic alternatives:
- **Reference Deployment**: Maintained environment for capturing evergreen screenshots
- **Static Screenshots**: Stored in S3 with `fallback/` prefix
- **Fallback Selection**: When live stack unavailable, serve static screenshots with timestamp disclaimer
- **Disclaimer Text**: "Screenshot from reference deployment (captured [date]). Your deployment may vary."

**FR115:** Screenshot Automation Runs Independently of User Deployments:
- **Dedicated Sandbox**: Separate AWS account/stack for screenshot automation
- **Not User Stacks**: Screenshots are NOT captured from user-deployed scenarios
- **Controlled Environment**: Reference deployment with known-good sample data
- **Version Alignment**: Screenshot automation deploys same CloudFormation version as users

---

## Extended Non-Functional Requirements (NFR48-NFR54)

### Federation Security

**NFR48:** Federation IAM policy enforces strict read-only access:
- **Explicit Deny**: Modify/delete actions denied on all resources
- **Resource Scoping**: Access limited to resources tagged `ndx:scenario-type`
- **Condition Keys**: Session policy includes `aws:RequestedRegion` in [`us-west-2`, `us-west-2`]
- **No Cross-Account**: Federation cannot assume roles in other accounts
- **Audit Trail**: All federation sessions logged to CloudTrail

**NFR49:** Federation credentials never exposed in client-side code:
- **Server-Side Only**: GetFederationToken called from secure backend/CI only
- **No Browser Exposure**: SigninToken never sent to user browsers
- **Credential Rotation**: Service account access keys rotated every 90 days
- **Secrets Management**: Access keys stored in AWS Secrets Manager or GitHub Secrets

**NFR50:** Federation session timeout prevents stale access:
- **Session Duration**: 1 hour maximum
- **Idle Timeout**: Console sessions expire after 15 minutes of inactivity
- **No Refresh**: Session tokens cannot be refreshed (new federation required)
- **Purpose**: Limits window of exposure if session URL logged

### Screenshot Pipeline Reliability

**NFR51:** Screenshot pipeline achieves 95%+ success rate:
- **Retry Logic**: Failed page loads retried 3 times with 5-second delays
- **Timeout Handling**: Pages timeout after 30 seconds with error capture
- **Circuit Breaker**: If >50% of screenshots fail in batch, pipeline halts and alerts
- **Success Metric**: Measured weekly, target 95%+ screenshots captured successfully

**NFR52:** Screenshot capture completes within SLA:
- **Per-Screenshot**: Maximum 30 seconds per page (including wait)
- **Full Batch**: All 6 scenarios completed within 30 minutes
- **Parallelization**: One scenario at a time (avoid rate limits), sequential within scenario
- **Scheduling**: Weekly runs during low-traffic hours (UTC 03:00 Saturday)

**NFR53:** Screenshot storage follows retention policy:
- **Versioning**: S3 bucket versioning enabled, last 10 versions retained
- **Lifecycle**: Versions older than 90 days transitioned to Glacier
- **Deletion**: Manual deletion only (no automatic purge)
- **Backup**: Cross-region replication to secondary region for DR

**NFR54:** Screenshot pipeline monitoring enables proactive maintenance:
- **CloudWatch Metrics**: `screenshot_success_count`, `screenshot_failure_count`, `screenshot_drift_detected`
- **Alerts**: SNS notification when success rate <90% or drift >20%
- **Dashboard**: Grafana/CloudWatch dashboard showing pipeline health
- **Logs**: Detailed execution logs in CloudWatch Logs with 30-day retention

---

## Sprint 0: Infrastructure Requirements

### Screenshot Automation Infrastructure (Must Complete Before Epic 6)

**Story S0.1: Federation Service Account Setup** (3 points)
- Create IAM user `ndx-screenshot-automation` with `sts:GetFederationToken` permission
- Create federation policy JSON with read-only console access
- Store access keys in AWS Secrets Manager
- Document credential rotation procedure

**Story S0.2: Playwright Federation Integration** (5 points)
- Implement TypeScript module for GetFederationToken
- Implement SigninToken retrieval from federation endpoint
- Implement login URL construction with destination parameter
- Unit tests with mocked STS responses

**Story S0.3: Screenshot Capture Pipeline** (8 points)
- Implement Playwright browser session management
- Create screenshot capture function with retry logic
- Implement S3 upload with manifest generation
- Create GitHub Actions workflow for scheduled runs

**Story S0.4: Visual Regression Detection** (5 points)
- Integrate pixelmatch for baseline comparison
- Implement diff report generation with highlighted changes
- Create approval workflow for screenshot updates
- Store baselines in S3 with versioning

**Story S0.5: Reference Deployment Environment** (5 points)
- Deploy dedicated screenshot automation account
- Deploy all 6 scenario stacks to reference environment
- Configure sample data for consistent screenshots
- Document environment maintenance procedures

**Sprint 0 Total: 26 story points**

---

## Updated Epic Dependencies

### Epic 6-11 Now Depend on Sprint 0

```
Sprint 0 (Infrastructure)
    ├── S0.1: Federation Service Account ───┐
    ├── S0.2: Playwright Federation ────────┤
    ├── S0.3: Screenshot Pipeline ──────────┼──→ Story X.6 (Screenshot Automation) in Epic 6-11
    ├── S0.4: Visual Regression ────────────┤
    └── S0.5: Reference Environment ────────┘
```

**Implication:** Story X.6 (Screenshot Automation & Maintenance Pipeline) in each of Epic 6-11 now USES infrastructure from Sprint 0 rather than building it fresh.

**Revised Story X.6 Scope (All Epics):**
- Configure scenario-specific screenshot targets (which pages to capture)
- Define visual regression baselines for this scenario
- Run initial screenshot capture batch
- Verify screenshots match exploration page content

**Story X.6 Point Reduction:** From 8 points to 3 points (infrastructure already exists)

### Updated Epic 6-11 Point Totals

| Epic | Original Points | Revised Points | Savings |
|------|-----------------|----------------|---------|
| Epic 6 | 31 | 26 | -5 |
| Epic 7 | 27 | 22 | -5 |
| Epic 8 | 27 | 22 | -5 |
| Epic 9 | 27 | 22 | -5 |
| Epic 10 | 27 | 22 | -5 |
| Epic 11 | 27 | 22 | -5 |
| **Sprint 0** | 0 | 26 | +26 |
| **Total** | 166 | 162 | -4 |

**Net Effect:** Centralizing screenshot automation adds 26 Sprint 0 points but saves 30 points across Epic 6-11 (5 points × 6 epics). Net reduction of 4 story points while dramatically improving maintainability and viability.

---

## TypeScript Reference Implementation

```typescript
// src/lib/aws-federation.ts
import { STSClient, GetFederationTokenCommand } from "@aws-sdk/client-sts";
import { chromium, Browser, Page } from "playwright";

interface FederatedCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

interface ScreenshotResult {
  success: boolean;
  path?: string;
  error?: string;
  duration: number;
}

// Scoped federation policy - read-only console access for scenario resources
const FEDERATION_POLICY = JSON.stringify({
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: [
        "cloudwatch:GetMetricData",
        "cloudwatch:DescribeAlarms",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:GetLogEvents",
        "dynamodb:DescribeTable",
        "dynamodb:Scan",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration",
        "s3:ListBucket",
        "iot:DescribeThing",
        "iot:GetThingShadow",
        "quicksight:DescribeDashboard"
      ],
      Resource: "*",
      Condition: {
        StringEquals: {
          "aws:RequestedRegion": ["us-west-2", "us-west-2"]
        }
      }
    },
    {
      Effect: "Deny",
      Action: [
        "*:Create*",
        "*:Delete*",
        "*:Update*",
        "*:Put*",
        "iam:*",
        "organizations:*",
        "account:*"
      ],
      Resource: "*"
    }
  ]
});

export async function getFederatedCredentials(): Promise<FederatedCredentials> {
  const sts = new STSClient({ region: "us-west-2" });

  const command = new GetFederationTokenCommand({
    Name: "ndx-screenshot-session",
    DurationSeconds: 3600, // 1 hour
    Policy: FEDERATION_POLICY,
  });

  const response = await sts.send(command);

  if (!response.Credentials) {
    throw new Error("Failed to obtain federation credentials");
  }

  return {
    accessKeyId: response.Credentials.AccessKeyId!,
    secretAccessKey: response.Credentials.SecretAccessKey!,
    sessionToken: response.Credentials.SessionToken!,
    expiration: response.Credentials.Expiration!,
  };
}

async function getSigninToken(creds: FederatedCredentials): Promise<string> {
  const sessionJson = JSON.stringify({
    sessionId: creds.accessKeyId,
    sessionKey: creds.secretAccessKey,
    sessionToken: creds.sessionToken,
  });

  const federationUrl = new URL("https://signin.aws.amazon.com/federation");
  federationUrl.searchParams.set("Action", "getSigninToken");
  federationUrl.searchParams.set("SessionDuration", "900"); // 15 min
  federationUrl.searchParams.set("Session", sessionJson);

  const response = await fetch(federationUrl.toString());
  const data = await response.json();

  if (!data.SigninToken) {
    throw new Error("Failed to obtain SigninToken from federation endpoint");
  }

  return data.SigninToken;
}

function buildLoginUrl(signinToken: string, destination: string): string {
  const loginUrl = new URL("https://signin.aws.amazon.com/federation");
  loginUrl.searchParams.set("Action", "login");
  loginUrl.searchParams.set("Issuer", "NDX-Try-Screenshot-Automation");
  loginUrl.searchParams.set("Destination", destination);
  loginUrl.searchParams.set("SigninToken", signinToken);
  return loginUrl.toString();
}

export async function openAwsConsoleInPlaywright(
  destination: string = "https://us-west-2.console.aws.amazon.com/console/home"
): Promise<{ browser: Browser; page: Page }> {
  const creds = await getFederatedCredentials();
  const signinToken = await getSigninToken(creds);
  const loginUrl = buildLoginUrl(signinToken, destination);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'NDX-Screenshot-Automation/1.0'
  });

  const page = await context.newPage();

  // Navigate to login URL - AWS will redirect to authenticated console
  await page.goto(loginUrl, {
    waitUntil: "networkidle",
    timeout: 30000
  });

  // Verify we're authenticated (not on signin page)
  const currentUrl = page.url();
  if (currentUrl.includes("signin.aws.amazon.com")) {
    throw new Error("Federation login failed - still on signin page");
  }

  return { browser, page };
}

export async function captureConsoleScreenshot(
  page: Page,
  consoleUrl: string,
  outputPath: string
): Promise<ScreenshotResult> {
  const startTime = Date.now();

  try {
    await page.goto(consoleUrl, {
      waitUntil: "networkidle",
      timeout: 30000
    });

    // Wait for main content to render
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: outputPath,
      fullPage: false // Console pages often have issues with full page
    });

    return {
      success: true,
      path: outputPath,
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

// Example usage for a scenario
export async function captureScenarioScreenshots(
  scenarioId: string,
  consoleUrls: { name: string; url: string }[]
): Promise<Map<string, ScreenshotResult>> {
  const results = new Map<string, ScreenshotResult>();

  const { browser, page } = await openAwsConsoleInPlaywright();

  try {
    for (const { name, url } of consoleUrls) {
      const outputPath = `screenshots/${scenarioId}/${name}.png`;
      const result = await captureConsoleScreenshot(page, url, outputPath);
      results.set(name, result);

      // Respect rate limits
      await page.waitForTimeout(1000);
    }
  } finally {
    await browser.close();
  }

  return results;
}
```

---

## Security Review Checklist

| Security Control | Implementation | Status |
|------------------|----------------|--------|
| **Least Privilege** | Federation policy denies all modify/delete actions | ✓ Defined |
| **Credential Isolation** | Service account separate from user-facing systems | ✓ Defined |
| **Credential Rotation** | 90-day rotation policy documented | ✓ Defined |
| **Secrets Management** | AWS Secrets Manager for access keys | ✓ Defined |
| **Session Timeout** | 1-hour federation, 15-minute signin token | ✓ Defined |
| **Audit Logging** | CloudTrail captures all federation sessions | ✓ Defined |
| **No Browser Exposure** | SigninToken never sent to user browsers | ✓ Defined |
| **Region Restriction** | Federation limited to us-west-2/us-west-2 | ✓ Defined |
| **Cross-Account Denied** | Cannot assume roles elsewhere | ✓ Defined |
| **Resource Tagging** | Access limited to tagged resources | ✓ Defined |

---

## Cost Analysis

### Sprint 0 Infrastructure Costs

| Component | One-Time | Monthly |
|-----------|----------|---------|
| Development (26 points × £100/point) | £2,600 | - |
| Reference deployment (6 stacks × 90 mins/week) | - | £50 |
| S3 screenshot storage (~1GB) | - | £2 |
| Lambda/STS invocations | - | £5 |
| **Total** | £2,600 | £57/month |

### Comparison to Manual Screenshot Approach

| Approach | Initial Dev | Monthly Maintenance | 12-Month Total |
|----------|-------------|---------------------|----------------|
| **Manual screenshots** | £500 | £400 (10 hrs @ £40/hr) | £5,300 |
| **Federation automation** | £2,600 | £57 + £160 (4 hrs @ £40/hr) | £5,204 |

**Break-even:** Month 11. After break-even, automated approach saves £183/month.

**Additional Benefits:**
- Consistent quality (no human variation)
- Faster update turnaround (48-hour SLA achievable)
- Visual regression detection (impossible manually)
- Scale to additional scenarios without proportional cost increase

---

## Implementation Priority

**This extension is BLOCKING for Epic 6-11 viability.** Without federation-based screenshot automation:
- Story X.6 cannot be completed
- NFR44 (screenshot maintenance SLA) cannot be met
- FR62 (auto-generated screenshots) is unachievable
- FR83 (stack-agnostic fallbacks) requires screenshots to exist first

**Recommended Sequence:**
1. ✓ Complete Epic 12 (Navigation & Sample Data Clarity) - DONE
2. → Complete Sprint 0 (Screenshot Infrastructure) - NEXT
3. → Begin Epic 6 (Council Chatbot Exploration)
4. → Continue Epic 7-11 (remaining scenarios)

---

## Updated PRD Totals

| Category | Before v1.3 | v1.3 Extension | Total |
|----------|-------------|----------------|-------|
| Functional Requirements | FR1-FR106 | FR107-FR115 | **115 FRs** |
| Non-Functional Requirements | NFR1-NFR47 | NFR48-NFR54 | **54 NFRs** |
| Epics | Epic 1-12 | Sprint 0 | **12 Epics + Sprint 0** |
| Stories | 66 | +5 (Sprint 0) | **71 Stories** |
| Total Story Points | ~190 | +26 (Sprint 0), -30 (Epic 6-11) | **~186 points** |

---

_Extension v1.3 complete. AWS Federation screenshot automation is now fully specified with security controls, implementation reference, and cost analysis. This extension makes the exploration screenshot strategy viable._

---

# PRD Extension v1.4: User Journey Clarity & Comprehensive Testing

**Date:** 2025-11-29
**Trigger:** User feedback identified critical gaps in user navigation, cost messaging, and visual content requirements

---

## Critical Clarifications

### Deployment Region

**IMPORTANT:** All NDX:Try Innovation Sandbox deployments use **us-west-2** or **us-west-2** regions (NOT London/us-west-2).

This applies to:
- CloudFormation template deployments
- AWS Console screenshot automation
- All federation session policies
- Reference deployment environments

**Rationale:** The Innovation Sandbox infrastructure is hosted in US regions for cost optimization and service availability. Sample data represents UK council scenarios but infrastructure runs in US regions.

### Zero-Cost Innovation Sandbox

**CRITICAL USER MESSAGING:** The NDX:Try Innovation Sandbox is **completely FREE** to use. Users incur **no AWS charges** for:
- Deploying scenarios
- Exploring AWS Console features
- Generating sample data
- Interacting with walkthroughs
- All activities within the Innovation Sandbox

**Cost estimates displayed throughout the portal are INDICATIVE ONLY** - they show what the user would pay if they deployed similar infrastructure in their own AWS account for production use. This helps councils understand real-world costs without incurring any actual charges during evaluation.

**Portal Messaging Standard:**
- Every page mentioning costs MUST include: "Costs shown are indicative of production use. The Innovation Sandbox is free."
- Cost estimate sections MUST be clearly labeled: "Estimated production costs" (not "costs")
- Sample data panel cost indicators MUST reinforce: "✓ Free - no AWS charges for this activity"

---

## Extended Functional Requirements (FR116-FR122)

### Quiz-to-Guide Navigation

**FR116:** Scenario Selector Quiz results page provides explicit navigation to scenario guides:
- Each recommended scenario card includes "View Guide" primary action button
- "View Guide" links directly to the scenario's walkthrough landing page
- No intermediate steps or menus between quiz results and guide access
- Clear visual hierarchy: Quiz Results → Recommended Scenarios → [View Guide] → Walkthrough

**FR117:** Solution Finder/Quiz results display all recommended scenarios with direct walkthrough access:
- Recommendation cards include: scenario name, brief description, estimated time, "View Guide" button
- Secondary "Deploy Now" button for users ready to skip the guide
- "View All Scenarios" link for users who want to explore beyond recommendations

### Cost Messaging Consistency

**FR118:** All cost displays across the portal include Innovation Sandbox zero-cost clarification:
- Scenario cards: "Estimated production cost: £X/month | Free in Innovation Sandbox"
- Deployment pages: "No charges apply - this deploys to the free Innovation Sandbox"
- Exploration pages: "All activities in this section are free to explore"
- Evidence Pack: Cost projections clearly labeled as "Estimated production costs if deployed to your AWS account"

**FR119:** Portal homepage prominently displays zero-cost messaging:
- Hero section includes: "Try AWS services for free in the Innovation Sandbox"
- Cost anxiety addressed above-the-fold before users need to scroll
- Clear distinction between "free to try" and "costs if you go to production"

### Comprehensive Visual Content Requirements

**FR120:** Screenshots are captured by Playwright E2E tests that validate the complete user journey:
- **Dual-purpose testing strategy:** Playwright tests both validate functionality AND capture screenshots
- **Test-driven screenshots:** Every screenshot is a byproduct of a passing E2E test
- **Minimum screenshot set per scenario (captured during test run):**
  - Scenario landing page
  - Pre-deployment state
  - Deployment in progress (CloudFormation events)
  - Deployment complete confirmation
  - Each walkthrough step (minimum 5 per scenario)
  - Key "wow moment" interactions
  - AWS Console views of deployed resources (via federation)
  - Evidence Pack generation
  - Cleanup confirmation
- **Total:** Minimum 15 screenshots per scenario, each tied to a test assertion
- **Benefit:** Screenshots can never be out of sync with functionality - if the journey breaks, tests fail, no screenshots generated

**FR121:** Demo videos must demonstrate the complete user journey:
- **Video structure per scenario:**
  - Introduction (0:00-0:30): What you'll experience
  - Deployment (0:30-2:00): One-click deploy, progress tracking
  - Walkthrough (2:00-6:00): Step-by-step guided experience
  - Wow Moments (6:00-8:00): Key interactions demonstrating value
  - Wrap-up (8:00-10:00): Evidence generation, next steps
- **Duration:** 8-10 minutes each (not 5-10 as previously stated)
- **Quality:** Professional narration, captions, HD resolution
- **Coverage:** All 6 scenarios require complete journey videos

**FR122:** Playwright E2E test suite validates complete user journey per scenario:
- **Test structure per scenario:**
  ```
  tests/e2e/scenarios/{scenario-id}/
  ├── journey.spec.ts          # Full E2E journey test
  ├── walkthrough.spec.ts      # Step-by-step walkthrough validation
  ├── console-views.spec.ts    # AWS Console screenshot tests (uses federation)
  └── screenshots/             # Output directory for captured images
  ```
- **Test assertions include:**
  - [ ] Full journey completes end-to-end (deployment → cleanup)
  - [ ] All walkthrough steps render correctly
  - [ ] Sample data displays as expected
  - [ ] AWS Console views accessible via federation
  - [ ] No broken links or missing resources
  - [ ] Evidence Pack generates correctly
- **Screenshot capture:** `await page.screenshot({ path: 'screenshots/step-name.png' })` at each key point
- **CI integration:** Tests run on every PR; screenshots uploaded as artifacts
- **Failure = No screenshots:** If journey tests fail, screenshot pipeline halts

**FR123:** Playwright test configuration enables AWS Console screenshot capture:
- **Federation integration:** Tests import `openAwsConsoleInPlaywright()` from Sprint 0 infrastructure
- **Console navigation:** After federation login, tests navigate to specific console pages
- **Resource discovery:** Console URLs built dynamically from CloudFormation stack outputs
- **Example test pattern:**
  ```typescript
  test('capture Lambda console view', async () => {
    const { browser, page } = await openAwsConsoleInPlaywright(
      `https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/${lambdaArn}`
    );
    await page.waitForSelector('[data-testid="function-overview"]');
    await page.screenshot({ path: 'screenshots/lambda-console.png' });
    await browser.close();
  });
  ```

---

## Extended Non-Functional Requirements (NFR55-NFR58)

### Journey Testing Standards

**NFR55:** Playwright E2E tests are the single source of truth for journey validation and screenshots:
- **Test coverage:** 100% of documented walkthrough steps have corresponding test assertions
- **Test frequency:** On every PR, nightly scheduled runs, after CloudFormation template changes
- **Screenshot artifacts:** All screenshots stored in CI artifacts with commit SHA tagging
- **Failure handling:** Failed tests block merge AND screenshot publication

**NFR56:** Screenshot freshness guaranteed through test-driven capture:
- **Automatic refresh:** Screenshots regenerated on every successful test run
- **Drift detection:** Visual regression via pixelmatch comparing to baseline
- **Drift threshold:** >5% pixel difference flags for review, >15% auto-fails test
- **Version alignment:** Screenshot filenames include CloudFormation template version
- **No manual screenshots:** All documentation screenshots MUST come from Playwright tests

### Cost Messaging Compliance

**NFR57:** Zero-cost messaging auditable across all portal pages:
- **Audit frequency:** Monthly review of all pages mentioning costs
- **Compliance standard:** 100% of cost mentions include sandbox clarification
- **Violation handling:** Non-compliant pages flagged for immediate correction

**NFR58:** Cost estimates accuracy verified quarterly:
- **Methodology:** Deploy each scenario, measure actual AWS costs, compare to documented estimates
- **Accuracy target:** Documented costs within ±20% of actual (was ±15%, adjusted for volatility)
- **Update process:** Cost discrepancies trigger documentation update within 2 weeks

---

## Updated PRD Totals (v1.4)

| Category | v1.3 Total | v1.4 Extension | New Total |
|----------|------------|----------------|-----------|
| Functional Requirements | 115 | +8 (FR116-FR123) | **123 FRs** |
| Non-Functional Requirements | 54 | +4 (NFR55-NFR58) | **58 NFRs** |
| Epics | 12 + Sprint 0 | No change | **12 Epics + Sprint 0** |
| Stories | 71 | No change (covered by existing) | **71 Stories** |

### Testing Strategy Summary

**Playwright E2E tests serve three purposes:**
1. **Functional validation** - Verify user journeys work correctly
2. **Screenshot capture** - Generate documentation images as test byproducts
3. **Visual regression** - Detect UI/console changes that break documentation

**Key principle:** Screenshots cannot exist without passing tests. This guarantees documentation accuracy.

---

_Extension v1.4 complete. User journey clarity, zero-cost messaging, and comprehensive visual content testing requirements now fully specified._

---

## PRD Extension: Screenshot Integration & Navigation Enhancement (v1.5)

**Added:** 2025-11-29
**Rationale:** Sprint 0 screenshot automation infrastructure is complete. This extension specifies how to integrate auto-generated AWS Console screenshots into walkthrough pages and improve portal navigation.

### Extension Context

**Sprint 0 Complete:**
- S0.1: AWS Federation Service Account Setup ✓
- S0.2: Playwright Integration Library ✓
- S0.3: Screenshot Capture Pipeline ✓
- S0.4: Visual Regression Detection ✓
- S0.5: Reference Deployment Environment ✓

**Infrastructure Available:**
- `aws-federation.ts` - Console authentication via federation
- `console-url-builder.ts` - Dynamic URL generation for 6 AWS services
- GitHub Actions workflows for capture, regression, baseline management
- S3 bucket with versioning and lifecycle policies
- CloudWatch metrics and alerting

**Current Gap:**
- Walkthrough pages exist but use placeholder images or no images
- No index page listing all walkthroughs
- Scenario pages don't link to their walkthroughs
- No persistent navigation for scenarios/walkthroughs

### Extension Scope

**4 Comprehensive Epics:**

| Epic | Name | Focus | Estimated Stories |
|------|------|-------|-------------------|
| Epic 13 | Screenshot Content Population | Integrate real screenshots into all walkthrough pages | 8-10 |
| Epic 14 | Walkthrough Index & Navigation | Create index page, add header navigation | 6-8 |
| Epic 15 | Scenario-Walkthrough Linking | Connect scenario pages to walkthroughs | 4-6 |
| Epic 16 | Visual Consistency & Accessibility | Screenshot annotations, alt text, responsive | 5-7 |

---

## Extended Functional Requirements (FR124-FR150)

### Screenshot Content Integration

**FR124:** Each walkthrough step page displays at least one relevant AWS Console screenshot:
- **Coverage:** All 6 scenarios × 4-5 steps each = ~25-30 step pages
- **Source:** Screenshots from Sprint 0 S3 bucket (`current/{scenario}/` prefix)
- **Freshness:** Screenshots pulled from latest successful capture batch
- **Fallback:** If screenshot unavailable, display placeholder with "Screenshot coming soon" message

**FR125:** Screenshot images include metadata display:
- **Template version:** CloudFormation template version used in capture
- **Capture date:** ISO 8601 timestamp of when screenshot was taken
- **Region:** AWS region shown in screenshot (us-west-2)
- **Metadata format:** Subtle caption below image with expandable details

**FR126:** Walkthrough explore pages (architecture, experiments, limits, production) display annotated screenshots showing:
- **Architecture tours:** Service interconnections with callout annotations
- **Experiments:** Before/after comparisons for configurable parameters
- **Limits:** Error states and boundary conditions
- **Production:** Production-ready configuration examples

**FR127:** Screenshots support click-to-zoom functionality:
- **Desktop:** Lightbox modal on click
- **Mobile:** Full-screen native image zoom
- **Keyboard:** Enter key triggers zoom, Escape closes
- **Accessibility:** Focus trap in modal, aria-modal attribute

**FR128:** Screenshot component accepts configuration via data file:
```yaml
# screenshots.yaml per scenario
council-chatbot:
  step-1:
    - id: lambda-overview
      filename: council-chatbot-lambda-overview.png
      alt: "Lambda function overview showing council chatbot function"
      caption: "The Lambda function that powers the council chatbot"
      highlight_regions:
        - x: 100, y: 50, width: 200, height: 30, label: "Function name"
```

### Walkthrough Index Page

**FR129:** Portal includes `/walkthroughs/` index page listing all scenario walkthroughs:
- **Layout:** Card grid matching scenario gallery design language
- **Per-card content:** Scenario name, icon, step count, estimated time
- **Filtering:** By category (AI, IoT, Analytics), difficulty, time
- **Sorting:** Alphabetical (default), popularity, newest

**FR130:** Walkthrough index cards display preview thumbnails:
- **Image source:** First step screenshot from each walkthrough
- **Lazy loading:** Images load on scroll for performance
- **Placeholder:** Scenario icon while image loads

**FR131:** Walkthrough index includes scenario category badges:
- **AI Scenarios:** Council Chatbot, Planning AI, FOI Redaction, Text-to-Speech
- **IoT Scenarios:** Smart Car Park
- **Analytics Scenarios:** QuickSight Dashboard
- **Badge display:** Visual tag on each card

**FR132:** Walkthrough index provides search functionality:
- **Search fields:** Scenario name, description, AWS services used
- **Real-time filtering:** Results update as user types
- **Empty state:** "No walkthroughs match your search" with clear button

### Navigation Enhancement

**FR133:** Portal header includes persistent navigation menu:
- **Desktop layout:** Horizontal menu items: Scenarios | Walkthroughs | Quiz | Get Started
- **Mobile layout:** Hamburger menu with same items
- **Active state:** Current section highlighted
- **GOV.UK compliant:** Uses govuk-header navigation patterns

**FR134:** Scenario dropdown in navigation shows all 6 scenarios:
- **Submenu trigger:** Hover on desktop, tap on mobile
- **Submenu content:** Scenario names with icons
- **Direct links:** Each item links to scenario detail page

**FR135:** Walkthrough dropdown shows scenario groupings:
- **Structure:** Grouped by category (AI, IoT, Analytics)
- **Items:** Scenario name → links to walkthrough index for that scenario
- **Badge:** Step count next to each item (e.g., "Council Chatbot (5 steps)")

**FR136:** Breadcrumb navigation on all walkthrough pages:
- **Format:** Home > Walkthroughs > {Scenario} > {Step}
- **Clickable:** All segments are navigable links
- **Mobile:** Truncated to show last 2 segments with ellipsis

### Scenario-Walkthrough Linking

**FR137:** Each scenario detail page includes prominent "Start Walkthrough" CTA:
- **Position:** Below scenario description, above deployment section
- **Style:** Primary button (green govuk-button)
- **Text:** "Start walkthrough ({N} steps)"
- **Link:** To walkthrough index page for that scenario

**FR138:** Scenario detail page shows walkthrough progress indicator:
- **Display:** If user has started walkthrough, show completion percentage
- **Storage:** Progress stored in localStorage per scenario
- **Reset:** Clear button to restart walkthrough

**FR139:** Walkthrough completion links back to scenario:
- **Complete page CTA:** "Return to {Scenario}" button
- **Evidence pack prompt:** "Generate Evidence Pack" button
- **Next scenario suggestion:** Based on quiz results or category

**FR140:** Scenario cards in gallery show walkthrough availability:
- **Badge:** "Walkthrough available" indicator
- **Step count:** "{N} step guided tour"
- **Icon:** Play button overlay on scenario image

### Visual Consistency & Accessibility

**FR141:** All screenshots meet accessibility requirements:
- **Alt text:** Descriptive, 125 characters max, describes content not appearance
- **Caption:** Optional longer description below image
- **High contrast:** Screenshots captured with browser zoom at 100%
- **No text-in-image dependency:** All text visible in screenshots also in body text

**FR142:** Screenshot annotations use accessible patterns:
- **Callout boxes:** Sufficient contrast (4.5:1 minimum)
- **Arrows/highlights:** Not sole conveyor of information
- **Numbering:** Sequential numbers with corresponding legend text
- **Colors:** Not used alone to convey meaning

**FR143:** Screenshots responsive across breakpoints:
- **Desktop (>1024px):** Full-width in content column
- **Tablet (768-1024px):** Full-width with maintained aspect ratio
- **Mobile (<768px):** Full-width, pinch-to-zoom enabled
- **Retina support:** 2x resolution images for high-DPI displays

**FR144:** Screenshot loading optimized for performance:
- **Format:** WebP with PNG fallback
- **Lazy loading:** Loading="lazy" attribute on all images below fold
- **Placeholder:** Low-resolution blur placeholder during load
- **Caching:** Browser cache headers (1 week for screenshots)

**FR145:** Screenshot gallery component for multi-image pages:
- **Layout:** Thumbnail row with main preview area
- **Navigation:** Previous/Next arrows, keyboard support
- **Caption sync:** Caption updates with selected image
- **Mobile:** Swipe gesture support

### Screenshot Maintenance Integration

**FR146:** Screenshot component integrates with visual regression alerts:
- **Drift notification:** If screenshot has pending baseline update, show info banner
- **Outdated warning:** If screenshot >30 days old, show update-pending indicator
- **Admin view:** Maintainers see screenshot metadata and update status

**FR147:** Missing screenshot handling is graceful:
- **Fallback image:** Scenario-specific placeholder (not generic 404)
- **Message:** "Screenshot updating - please check back soon"
- **Analytics:** Track missing screenshot views for prioritization
- **Admin alert:** Notify maintainers when fallbacks triggered >10 times

**FR148:** Screenshot versioning supports rollback:
- **Version display:** Current version shown in metadata
- **History access:** Maintainers can view previous versions
- **Rollback button:** One-click restore to previous version (admin only)

### Analytics & Tracking

**FR149:** Screenshot interactions tracked for analytics:
- **Events captured:** view, zoom, annotation-hover, download
- **Per-screenshot:** Track which screenshots get most engagement
- **Journey correlation:** Screenshot views correlated with walkthrough completion

**FR150:** Navigation interactions tracked:
- **Menu clicks:** Track navigation menu usage patterns
- **Search usage:** Track walkthrough index search queries
- **Breadcrumb clicks:** Track navigation path preferences

---

## Extended Non-Functional Requirements (NFR59-NFR66)

### Screenshot Quality Standards

**NFR59:** Screenshot resolution and quality requirements:
- **Minimum resolution:** 1920×1080 capture, 1280×720 display
- **File size:** <500KB per image (WebP), <1MB (PNG fallback)
- **Compression:** Quality setting 85% for WebP
- **Aspect ratio:** 16:9 standard, 4:3 for specific console views

**NFR60:** Screenshot freshness requirements:
- **Maximum age:** 30 days since last successful capture
- **Template alignment:** Screenshots regenerated within 48 hours of CloudFormation template changes
- **Visual regression check:** Run on every capture, flag >10% diff

### Navigation Performance

**NFR61:** Navigation menu performance requirements:
- **Initial load:** Header navigation renders within 100ms of DOMContentLoaded
- **Dropdown delay:** Submenus appear within 150ms of hover/tap
- **Mobile menu:** Hamburger menu opens within 200ms
- **No layout shift:** Navigation doesn't cause CLS during load

**NFR62:** Walkthrough index page performance:
- **Initial load:** Index page loads within 2 seconds on 3G
- **Search response:** Filter results update within 100ms
- **Lazy loading:** Below-fold images don't block initial render
- **Lighthouse score:** 90+ performance score target

### Accessibility Compliance

**NFR63:** Screenshot accessibility compliance:
- **Alt text coverage:** 100% of screenshots have meaningful alt text
- **Caption availability:** 100% of screenshots have visible captions
- **Zoom accessibility:** Click-to-zoom works with keyboard alone
- **Screen reader:** Screenshots announced with context

**NFR64:** Navigation accessibility compliance:
- **Keyboard navigation:** All menu items reachable via Tab/Arrow keys
- **Focus visible:** Clear focus indicators on all interactive elements
- **ARIA attributes:** Correct aria-expanded, aria-haspopup on dropdowns
- **Mobile touch targets:** 44×44px minimum touch area

### Content Consistency

**NFR65:** Screenshot annotation consistency:
- **Annotation style:** Consistent color palette (#1d70b8 primary callout)
- **Font size:** 14px minimum for annotation labels
- **Numbering format:** Consistent 1, 2, 3 across all scenarios
- **Arrow style:** Consistent arrowhead and line weight

**NFR66:** Navigation copy consistency:
- **Menu labels:** Consistent naming across navigation instances
- **Scenario names:** Exact match between nav, cards, and pages
- **Walkthrough references:** Consistent "walkthrough" terminology (not "tutorial" or "guide")

---

## Epic Breakdown: Screenshot Integration & Navigation

### Epic 13: Screenshot Content Population

**Goal:** Integrate real AWS Console screenshots into all walkthrough pages

**Stories:**

| Story | Name | Points |
|-------|------|--------|
| 13.1 | Screenshot component with metadata display | 5 |
| 13.2 | Screenshot data files for all 6 scenarios | 8 |
| 13.3 | Council Chatbot walkthrough screenshot integration | 5 |
| 13.4 | Planning AI walkthrough screenshot integration | 5 |
| 13.5 | FOI Redaction walkthrough screenshot integration | 5 |
| 13.6 | Smart Car Park walkthrough screenshot integration | 5 |
| 13.7 | Text-to-Speech walkthrough screenshot integration | 5 |
| 13.8 | QuickSight Dashboard walkthrough screenshot integration | 5 |
| 13.9 | Click-to-zoom lightbox component | 5 |
| 13.10 | Missing screenshot fallback handling | 3 |

**Total:** 51 points

**Acceptance Criteria:**
- All ~60 walkthrough pages have at least one relevant screenshot
- Screenshots display metadata (capture date, template version, region)
- Click-to-zoom works on desktop and mobile
- Missing screenshots show graceful fallback

---

### Epic 14: Walkthrough Index & Navigation

**Goal:** Create central walkthrough index and header navigation

**Stories:**

| Story | Name | Points |
|-------|------|--------|
| 14.1 | Walkthrough index page layout and cards | 8 |
| 14.2 | Category filtering and badges | 5 |
| 14.3 | Search functionality for walkthroughs | 5 |
| 14.4 | Header navigation component with dropdowns | 8 |
| 14.5 | Mobile navigation (hamburger menu) | 5 |
| 14.6 | Breadcrumb navigation component | 3 |
| 14.7 | Navigation active state highlighting | 3 |

**Total:** 37 points

**Acceptance Criteria:**
- `/walkthroughs/` page lists all 6 scenario walkthroughs
- Header shows Scenarios | Walkthroughs | Quiz | Get Started
- Dropdowns work on desktop hover and mobile tap
- Breadcrumbs show on all walkthrough pages
- Mobile navigation follows GOV.UK patterns

---

### Epic 15: Scenario-Walkthrough Linking

**Goal:** Connect scenario pages to their walkthroughs bidirectionally

**Stories:**

| Story | Name | Points |
|-------|------|--------|
| 15.1 | "Start Walkthrough" CTA on scenario pages | 5 |
| 15.2 | Walkthrough progress tracking (localStorage) | 5 |
| 15.3 | Walkthrough completion page links | 3 |
| 15.4 | Scenario gallery walkthrough badges | 3 |
| 15.5 | Cross-scenario recommendations on completion | 5 |

**Total:** 21 points

**Acceptance Criteria:**
- Each scenario page has prominent walkthrough CTA
- Progress persists across sessions
- Completion page suggests next steps
- Gallery cards indicate walkthrough availability

---

### Epic 16: Visual Consistency & Accessibility

**Goal:** Ensure screenshots meet accessibility and quality standards

**Stories:**

| Story | Name | Points |
|-------|------|--------|
| 16.1 | Alt text and caption audit/population | 8 |
| 16.2 | Screenshot annotation component | 5 |
| 16.3 | Responsive screenshot sizing | 3 |
| 16.4 | WebP conversion and optimization | 5 |
| 16.5 | Screenshot gallery component | 5 |
| 16.6 | Accessibility testing and remediation | 5 |
| 16.7 | Navigation keyboard accessibility audit | 3 |

**Total:** 34 points

**Acceptance Criteria:**
- 100% screenshots have meaningful alt text
- Annotations follow consistent visual style
- Screenshots render correctly at all breakpoints
- Lighthouse accessibility score 95+
- All navigation keyboard-accessible

---

## Updated PRD Totals (v1.5)

| Category | v1.4 Total | v1.5 Extension | New Total |
|----------|------------|----------------|-----------|
| Functional Requirements | 123 | +27 (FR124-FR150) | **150 FRs** |
| Non-Functional Requirements | 58 | +8 (NFR59-NFR66) | **66 NFRs** |
| Epics | 12 + Sprint 0 | +4 (Epic 13-16) | **16 Epics + Sprint 0** |
| Stories | 71 | +29 | **100 Stories** |
| Total Story Points | ~150 | +143 | **~293 Points** |

### Epic Dependencies

```
Sprint 0 (Complete) ──┬──► Epic 13 (Screenshots) ──┬──► Epic 16 (Accessibility)
                      │                            │
                      ├──► Epic 14 (Navigation) ───┤
                      │                            │
                      └──► Epic 15 (Linking) ──────┘
```

### Implementation Priority

| Priority | Epic | Rationale |
|----------|------|-----------|
| 1 | Epic 13 | Core value - screenshots are the primary deliverable |
| 2 | Epic 14 | Navigation enables discovery of screenshot content |
| 3 | Epic 15 | Linking maximizes screenshot exposure |
| 4 | Epic 16 | Quality assurance - can run in parallel with 13-15 |

### Success Criteria for v1.5

| Metric | Target |
|--------|--------|
| Walkthrough pages with screenshots | 100% |
| Screenshot load time | <2 seconds |
| Navigation menu usage | 30%+ sessions |
| Walkthrough index visits | 20%+ sessions |
| Accessibility score | 95+ |
| Visual regression coverage | 100% |

---

_Extension v1.5 complete. Screenshot integration, navigation enhancement, and visual accessibility requirements now fully specified._

---

## PRD Extension: Scenario Application Fixes & Real AWS Service Integration (v1.7)

**Added:** 2025-11-30
**Trigger:** Post-implementation review revealed critical gaps in scenario applications
**Scope:** Fix broken/incomplete scenario web applications and integrate real AWS services

### Problem Statement

During post-implementation review of Epic 18-23 (Scenario Web Application Frontends), critical issues were identified:

| Scenario | Stack Name | Current State | Issue |
|----------|------------|---------------|-------|
| Council Chatbot | `ndx-try-council-chatbot` | 403 Forbidden | Lambda URL not publicly accessible; needs real Bedrock AI integration |
| Planning AI | `ndx-try-planning-ai` | 403 Forbidden | Lambda URL not publicly accessible; displays empty page |
| FOI Redaction | `ndx-try-foi-redaction` | 403 Forbidden | Lambda URL not publicly accessible; displays empty page |
| Smart Car Park | `ndx-try-smart-car-park` | 403 Forbidden | Lambda URL not publicly accessible; not working |
| Text-to-Speech | `ndx-try-text-to-speech` | Working | ✓ Functional with Polly integration |
| QuickSight Dashboard | `ndx-try-quicksight-dashboard` | Working | Lambda-based mockup, NOT actual QuickSight integration |

### Root Cause Analysis

**Epic 18-23 Misinterpretation:**
The web application epics were implemented as **standalone Lambda-served HTML pages with sample data**, rather than **actual AWS service integrations**. This means:

1. **Council Chatbot** - Has chat UI but no Bedrock/Claude integration (hardcoded responses)
2. **Planning AI** - Has upload UI but no Textract/Comprehend/Bedrock integration (no actual document processing)
3. **FOI Redaction** - Has text input UI but no Comprehend PII detection (no actual redaction)
4. **Smart Car Park** - Has dashboard UI but no IoT Core integration (no real-time sensor data)
5. **QuickSight Dashboard** - Has Chart.js visualizations but no QuickSight embedding (not actual QuickSight)

**Access Issues:**
Four of six scenarios return 403 Forbidden because:
- Lambda Function URLs configured with `AuthType: AWS_IAM` instead of `AuthType: NONE`
- Or missing `FunctionUrlAuthType: NONE` in CloudFormation template

### Solution Approach

This extension adds **Epic 24: Scenario Application Remediation** to fix all identified issues.

**Two-Phase Approach:**

1. **Phase 1: Fix Access & Basic Functionality** - Make all 6 scenario applications publicly accessible and functional with sample data
2. **Phase 2: Real AWS Service Integration** - Connect scenarios to actual AWS services (Bedrock, Textract, Comprehend, IoT Core, QuickSight)

---

### Functional Requirements (FR211-FR235)

#### Council Chatbot - Real AI Integration

- **FR211:** Council Chatbot Lambda Function URL MUST be publicly accessible (AuthType: NONE)
- **FR212:** Council Chatbot MUST integrate with Amazon Bedrock Claude model for responses
- **FR213:** Council Chatbot MUST have a system prompt defining council assistant persona
- **FR214:** Council Chatbot MUST handle conversation context (multi-turn dialogue)
- **FR215:** Council Chatbot MUST gracefully handle Bedrock errors with user-friendly messages

#### Planning AI - Document Processing

- **FR216:** Planning AI Lambda Function URL MUST be publicly accessible (AuthType: NONE)
- **FR217:** Planning AI MUST accept PDF/image document uploads
- **FR218:** Planning AI MUST use Amazon Textract to extract text from uploaded documents
- **FR219:** Planning AI MUST use Amazon Comprehend or Bedrock to identify planning application fields
- **FR220:** Planning AI MUST display extracted data in structured format (applicant, property, description)

#### FOI Redaction - PII Detection

- **FR221:** FOI Redaction Lambda Function URL MUST be publicly accessible (AuthType: NONE)
- **FR222:** FOI Redaction MUST use Amazon Comprehend PII detection on submitted text
- **FR223:** FOI Redaction MUST highlight detected PII entities with category labels
- **FR224:** FOI Redaction MUST provide redacted output with PII replaced by category placeholders
- **FR225:** FOI Redaction MUST display confidence scores for each detected PII entity

#### Smart Car Park - IoT Data

- **FR226:** Smart Car Park Lambda Function URL MUST be publicly accessible (AuthType: NONE)
- **FR227:** Smart Car Park MUST display real-time parking occupancy data
- **FR228:** Smart Car Park MUST use DynamoDB for storing parking sensor state
- **FR229:** Smart Car Park MUST auto-refresh dashboard data every 30 seconds
- **FR230:** Smart Car Park SHOULD optionally connect to IoT Core for live sensor simulation

#### QuickSight Dashboard - Actual QuickSight

- **FR231:** QuickSight Dashboard scenario MUST clarify it is a "QuickSight-style" dashboard demonstration
- **FR232:** QuickSight Dashboard MUST display realistic council performance metrics
- **FR233:** QuickSight Dashboard SHOULD include link to actual QuickSight embedding documentation
- **FR234:** QuickSight Dashboard SHOULD note that actual QuickSight embedding requires QuickSight Enterprise license

#### Text-to-Speech - Verification

- **FR235:** Text-to-Speech application MUST be verified working with Amazon Polly (already functional)

---

### Non-Functional Requirements (NFR73-NFR78)

- **NFR73:** All scenario Lambda Function URLs MUST return HTTP 200 for GET requests within 30 seconds (cold start tolerance)
- **NFR74:** Real AWS service integrations MUST include IAM policies with least-privilege permissions
- **NFR75:** Bedrock model access MUST use on-demand inference (no provisioned throughput for demo)
- **NFR76:** Textract usage MUST use async processing for documents >1 page
- **NFR77:** Comprehend PII detection MUST use real-time API (not batch)
- **NFR78:** All scenario applications MUST work without requiring user authentication

---

### Epic 24: Scenario Application Remediation

**Goal:** Fix all 6 scenario applications to be publicly accessible and integrate real AWS services

**Stories:**

| Story | Name | Points |
|-------|------|--------|
| 24.1 | Fix Lambda Function URL access (all 6 scenarios) | 5 |
| 24.2 | Council Chatbot Bedrock integration | 13 |
| 24.3 | Planning AI Textract + Comprehend integration | 13 |
| 24.4 | FOI Redaction Comprehend PII integration | 8 |
| 24.5 | Smart Car Park DynamoDB + data simulation | 8 |
| 24.6 | QuickSight Dashboard clarification and documentation | 3 |
| 24.7 | End-to-end validation of all 6 scenarios | 5 |

**Total:** 55 points

### Story Details

#### Story 24.1: Fix Lambda Function URL Access

**Acceptance Criteria:**
- All 6 scenario Lambda Function URLs return HTTP 200 for GET requests
- CloudFormation templates updated with `AuthType: NONE` or `FunctionUrlAuthType: NONE`
- Redeploy all 6 stacks to apply access fixes

---

#### Story 24.2: Council Chatbot Bedrock Integration

**Acceptance Criteria:**
- Lambda function calls Amazon Bedrock Claude 3 Sonnet or Haiku
- System prompt defines council assistant persona with context about UK local government
- Multi-turn conversation supported (conversation history passed to Bedrock)
- Sample questions generate meaningful AI responses
- Error handling for Bedrock throttling/unavailability
- IAM role has `bedrock:InvokeModel` permission

**Sample System Prompt:**
```
You are a helpful AI assistant for a UK local council. You help residents with questions about council services including:
- Council Tax and payments
- Bin collection schedules
- Planning applications
- Housing services
- Benefits and support
Answer in a friendly, professional tone. If you don't know something specific to this council, explain that you'd need to check their specific policies.
```

---

#### Story 24.3: Planning AI Textract + Comprehend Integration

**Acceptance Criteria:**
- Document upload accepts PDF, PNG, JPEG formats (max 5MB)
- Lambda calls Amazon Textract AnalyzeDocument API
- Extracted text processed by Comprehend or Bedrock to identify:
  - Applicant name
  - Property address
  - Development description
  - Application type (householder, full, outline)
- Results displayed in structured cards
- IAM role has `textract:AnalyzeDocument` and `comprehend:DetectEntities` permissions

---

#### Story 24.4: FOI Redaction Comprehend PII Integration

**Acceptance Criteria:**
- Text input accepts up to 5000 characters
- Lambda calls Amazon Comprehend DetectPiiEntities API
- Detected PII highlighted inline with color-coded categories:
  - NAME (blue)
  - ADDRESS (green)
  - EMAIL (orange)
  - PHONE (purple)
  - DATE_TIME (gray)
- Redacted output shows `[NAME]`, `[ADDRESS]`, etc. placeholders
- Confidence scores displayed for each entity
- IAM role has `comprehend:DetectPiiEntities` permission

---

#### Story 24.5: Smart Car Park DynamoDB + Data Simulation

**Acceptance Criteria:**
- DynamoDB table stores parking bay states (occupied/available/reserved)
- Lambda generates simulated sensor updates every 5 minutes
- Dashboard shows:
  - Total bays, available, occupied
  - Occupancy percentage
  - Historical occupancy chart (last 24 hours)
- Auto-refresh every 30 seconds
- IAM role has `dynamodb:Query`, `dynamodb:Scan`, `dynamodb:PutItem` permissions

---

#### Story 24.6: QuickSight Dashboard Clarification

**Acceptance Criteria:**
- Dashboard page clearly states "QuickSight-style Dashboard Demonstration"
- Information panel explains:
  - This demonstrates the type of analytics QuickSight can provide
  - Actual QuickSight embedding requires Enterprise license
  - Link to QuickSight embedding documentation
- Dashboard continues to function with Chart.js visualizations

---

#### Story 24.7: End-to-End Validation

**Acceptance Criteria:**
- All 6 scenarios pass E2E test suites
- Manual verification of each AWS service integration
- Screenshot capture of working scenarios
- Documentation of Lambda Function URLs updated

---

### Updated PRD Totals (v1.7)

| Category | v1.5 Total | v1.7 Extension | New Total |
|----------|------------|----------------|-----------|
| Functional Requirements | 150 | +25 (FR211-FR235) | **175 FRs** |
| Non-Functional Requirements | 66 | +6 (NFR73-NFR78) | **72 NFRs** |
| Epics | 16 + Sprint 0 | +1 (Epic 24) | **17 Epics + Sprint 0** |
| Stories | 100 | +7 | **107 Stories** |
| Total Story Points | ~293 | +55 | **~348 Points** |

### Implementation Priority

| Priority | Story | Rationale |
|----------|-------|-----------|
| 1 | 24.1 | Unblocks all other work - scenarios must be accessible |
| 2 | 24.2 | Council Chatbot is flagship scenario, AI integration is key differentiator |
| 3 | 24.4 | FOI Redaction is simplest integration (single API call) |
| 4 | 24.3 | Planning AI requires multi-service orchestration |
| 5 | 24.5 | Smart Car Park requires data simulation setup |
| 6 | 24.6 | QuickSight clarification is documentation-only |
| 7 | 24.7 | Validation comes after all fixes |

### Success Criteria for v1.7

| Metric | Target |
|--------|--------|
| Scenarios returning HTTP 200 | 6/6 (100%) |
| Scenarios with real AWS service integration | 5/6 (83%) |
| E2E tests passing | 100% |
| User can complete full demo flow | All 6 scenarios |

---

_Extension v1.7 complete. Scenario application remediation and real AWS service integration requirements now fully specified._

---

_This PRD captures the essence of ndx_try_aws_scenarios_

_**Product Value:** "Informed confidence that levels the playing field" - making it harder for councils to dismiss AWS without genuine evaluation, easier for technical teams to build evidence-based cases for modernisation._

_Created through collaborative discovery between cns and AI facilitator, grounded in Product Brief, Market Research, and validated decision matrix._
