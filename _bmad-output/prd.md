# AI-Enhanced LocalGov Drupal on AWS - Product Requirements Document

**Author:** cns
**Date:** 2025-12-23
**Version:** 1.0
**PRD Type:** New Scenario Addition (Brownfield)

---

## Executive Summary

This PRD defines a new flagship scenario for the NDX Try AWS Scenarios platform: **AI-Enhanced LocalGov Drupal on AWS**. This scenario enables UK local councils to deploy a fully functional LocalGov Drupal CMS with 7 integrated AWS AI services, dynamically generated unique council content, and comprehensive walkthrough documentation—all deployable via one-click CloudFormation in under 15 minutes.

### What Makes This Special

1. **Unique every deployment** - Bedrock generates a fictional UK council with contextual content and AI-generated images
2. **7 AWS AI services in action** - Content editing, accessibility, translation, document processing integrated into the CMS workflow
3. **Best-practice architecture at trial prices** - Aurora Serverless v2 scale-to-zero makes production-grade infrastructure affordable (~$0.25/90min)
4. **First-class UK public sector focus** - LocalGov Drupal is trusted by 50+ UK councils; this showcases AWS enhancing that ecosystem
5. **WCAG 2.2/EAA compliance showcase** - AI features directly address June 2025 accessibility deadlines

---

## Project Classification

**Technical Type:** Web Application (CMS with Serverless Backend)
**Domain:** GovTech (UK Local Government)
**Complexity:** High

This is a **brownfield addition** to the existing NDX Try AWS Scenarios platform, which currently includes 6 deployable scenarios. The new LocalGov Drupal scenario requires:
- New CloudFormation template(s) for Drupal infrastructure
- New Lambda functions for AI integrations and content generation
- New portal pages with walkthrough guides
- Integration with existing screenshot pipeline and evidence pack framework

### Domain Context

UK local government operates under specific regulatory and accessibility requirements:
- **WCAG 2.2** compliance required for public-facing services
- **European Accessibility Act (EAA)** deadline: June 2025
- **GOV.UK Design System** patterns expected by users
- **53+ councils** already use LocalGov Drupal in production
- Procurement via **G-Cloud** and **OGVA** frameworks

---

## Success Criteria

### Primary Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Deployment success rate | >95% | CloudFormation stack creates without errors |
| Time to first interaction | <15 minutes | From "Deploy" click to logged-in CMS |
| AI feature demo coverage | 7/7 features | All AI integrations functional |
| Infrastructure cost per trial | <$2.00 | Combined infra + AI generation costs |
| User task completion | >80% | Complete walkthrough guide end-to-end |

### Business Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| Scenario deployments/month | 50+ | Measure interest from council audience |
| Evidence pack downloads | 30% of deployments | Indicates serious evaluation |
| LGA AI Hub referrals | Track source | Partnership success indicator |
| Time on scenario pages | >5 minutes | Engagement with content |

---

## Product Scope

### MVP - Minimum Viable Product

**Core Infrastructure:**
- [ ] CloudFormation template deploying LocalGov Drupal on Fargate
- [ ] Aurora Serverless v2 (scale-to-zero) for MySQL database
- [ ] EFS for persistent Drupal file storage
- [ ] Public subnet architecture (no NAT Gateway costs)
- [ ] Application Load Balancer with HTTPS

**Sample Content:**
- [ ] Init container pattern for first-run setup
- [ ] Pre-seeded LocalGov Drupal content types (services, guides, directories)
- [ ] DEMO banner on all pages ("This is a demonstration site")
- [ ] Admin credentials output via CloudFormation

**Walkthrough Documentation:**
- [ ] Getting started guide (credentials, login)
- [ ] Content editing walkthrough
- [ ] Architecture overview page
- [ ] Cleanup instructions

**Portal Integration:**
- [ ] Scenario card in gallery
- [ ] Scenario detail page with deployment button
- [ ] Integration with existing screenshot pipeline

### Growth Features (Post-MVP)

**AI-Enhanced Content Creation (7 AI Features):**
1. [ ] AI Content Editor (Bedrock Claude) - Writing assistance in CKEditor
2. [ ] Simplify for Readability (Bedrock) - One-click plain English rewrite
3. [ ] Auto Alt Text (Rekognition) - WCAG-compliant image descriptions
4. [ ] Listen to Page (Polly) - Text-to-speech accessibility
5. [ ] Real-time Translation (Translate) - 75+ language support
6. [ ] Summarize PDF to Web (Textract + Bedrock) - Accessibility compliance
7. [ ] Intelligent Search (Kendra) - Natural language content discovery

**Dynamic Council Generation:**
- [ ] Random council identity generator (name, region, character)
- [ ] Bedrock content generation (~140 pages of contextual content)
- [ ] Titan Image Generator for unique location photos, councillor headshots
- [ ] Themed variations (Urban/Rural/Coastal/Historic)

**Enhanced Documentation:**
- [ ] Playwright-generated screenshots committed to repo
- [ ] Annotated AI feature tour
- [ ] Test-driven documentation pipeline

### Vision (Future)

- **Multi-scenario chaining** - Deploy LocalGov Drupal as foundation, add Council Chatbot as integration
- **Microsite demo** - Showcase LocalGov Drupal Microsites platform for multi-site management
- **Production migration path** - Guide for councils to take demo infrastructure to production
- **Cost calculator** - Estimate monthly costs for production LocalGov Drupal on AWS

---

## Domain-Specific Requirements

### UK Local Government Context

| Requirement | Rationale | Implementation |
|-------------|-----------|----------------|
| GOV.UK Design System | User expectation, accessibility | LocalGov Drupal includes this by default |
| WCAG 2.2 AA compliance | Legal requirement | LocalGov Drupal certified; AI features enhance |
| Plain English content | Government Digital Service standard | AI readability tool demonstrates |
| Accessible documents | EAA June 2025 deadline | PDF-to-Web AI feature addresses |
| Data residency | UK councils require UK data | Deploy in eu-west-2 (London) |

### Sample Data Requirements

The dynamically generated council must feel authentic:

| Content Type | Count | Example |
|--------------|-------|---------|
| Service pages | 15-20 | "Waste & Recycling", "Planning Applications" |
| Guide pages | 5-8 | "How to apply for planning permission" |
| Directory entries | 10-15 | "Find your bin collection day" |
| News articles | 5 | "Council launches new website" |
| Location photos | 15 | Town centre, parks, civic buildings |
| Councillor headshots | 8 | AI-generated professional portraits |

This section shapes all functional and non-functional requirements below.

---

## Functional Requirements

### FR1: One-Click Deployment

**As a** council officer evaluating AWS
**I want to** deploy LocalGov Drupal with one click
**So that** I can experience the CMS without technical setup

**Acceptance Criteria:**
- CloudFormation Quick Create URL with pre-filled parameters
- Stack deploys in <10 minutes
- Admin credentials available in CloudFormation Outputs
- Drupal accessible via ALB URL immediately after deployment

### FR2: Pre-Populated Sample Content

**As a** council officer
**I want to** see realistic council content already in the CMS
**So that** I can understand how my content would look

**Acceptance Criteria:**
- Init container seeds LocalGov Drupal content types on first boot
- Content reflects UK council patterns (services, guides, directories)
- Homepage displays navigation to all content sections
- Content is read/write (users can edit during demo)

### FR3: DEMO Banner

**As a** site visitor
**I want to** clearly understand this is not a real council site
**So that** I don't confuse demo content with real services

**Acceptance Criteria:**
- Fixed banner at top of every page
- High-visibility design (striped yellow/red)
- Text: "DEMONSTRATION SITE - [Council Name] is a fictional council"
- Cannot be dismissed by regular users

### FR4: AI Content Editor (Growth)

**As a** content editor
**I want to** get AI writing assistance while editing
**So that** I can create better content faster

**Acceptance Criteria:**
- AI CKEditor integration via aws_bedrock_chat module
- Claude model provides suggestions in editor toolbar
- Works with existing LocalGov Drupal content types
- Requires Bedrock model access enabled in AWS account

### FR5: Accessibility AI Features (Growth)

**As a** council accessibility officer
**I want to** use AI to improve content accessibility
**So that** I can meet WCAG 2.2 requirements efficiently

**Acceptance Criteria:**
- Auto Alt Text: Rekognition generates image descriptions on upload
- Listen to Page: Polly TTS button on public pages
- Readability Simplification: One-click plain English rewrite
- Translation: 75+ language selector via Amazon Translate

### FR6: Dynamic Council Generation (Growth)

**As a** demo visitor
**I want to** see a unique fictional council
**So that** the demo feels fresh and shareable

**Acceptance Criteria:**
- Random council identity (name, region, population, character)
- Bedrock generates all text content with local flavour
- Titan Image Generator creates location photos and headshots
- Each deployment produces unique combination
- Generation cost <$1.50 per deployment

### FR7: Walkthrough Documentation

**As a** council officer
**I want to** follow a clear guide through the demo
**So that** I can experience all features systematically

**Acceptance Criteria:**
- Step-by-step guide with screenshots
- Covers: credentials, login, exploring, editing, AI features, architecture, cleanup
- 30-40 screenshots covering key interactions
- Accessible from scenario page and within deployed Drupal

---

## Non-Functional Requirements

### Performance

| Metric | Requirement | Rationale |
|--------|-------------|-----------|
| Page load time | <3 seconds | GOV.UK performance standard |
| Drupal admin response | <2 seconds | Acceptable CMS experience |
| AI feature response | <5 seconds | User expectation for AI tools |
| Init container runtime | <5 minutes | Part of deployment time budget |
| Total deployment time | <15 minutes | Core scenario promise |

### Security

| Requirement | Implementation |
|-------------|----------------|
| HTTPS only | ALB with ACM certificate or CloudFront |
| Database encryption | Aurora encryption at rest (default) |
| EFS encryption | In-transit and at-rest encryption |
| IAM least privilege | Scoped roles for Fargate task and Lambda |
| Secrets management | Secrets Manager for DB credentials |
| VPC isolation | Private subnets for RDS, public for ALB |
| Security groups | Minimal ingress (80/443 from internet, 3306 from ECS only) |

### Scalability

| Aspect | Specification |
|--------|--------------|
| Concurrent users | 10-20 (demo environment) |
| Database | Aurora Serverless v2 0.5-2 ACU |
| Container | Single Fargate task (0.5 vCPU, 1GB) |
| Auto-scaling | Not required for demo (single user typically) |

### Accessibility

| Standard | Requirement |
|----------|-------------|
| WCAG 2.2 | AA compliance (LocalGov Drupal provides) |
| Screen readers | Full support via semantic HTML |
| Keyboard navigation | All functions accessible without mouse |
| Colour contrast | GOV.UK Design System compliant |
| AI enhancements | Demonstrate TTS, alt text, plain English |

### Integration

| Integration Point | Method |
|-------------------|--------|
| AWS Bedrock | IAM role with bedrock:InvokeModel |
| Amazon Polly | IAM role with polly:SynthesizeSpeech |
| Amazon Translate | IAM role with translate:TranslateText |
| Amazon Rekognition | IAM role with rekognition:DetectLabels |
| Amazon Textract | IAM role with textract:AnalyzeDocument |
| Amazon Kendra | IAM role with kendra:Query (optional) |

---

## Technical Constraints

### Inherited from NDX Try AWS Scenarios Platform

- CloudFormation-based deployment (not CDK runtime)
- Quick Create URL pattern for one-click deployment
- Evidence pack template integration
- Screenshot pipeline compatibility
- Portal deployment via GitHub Pages

### Infrastructure Cost Targets

| Component | Config | Estimated Cost (90 min) |
|-----------|--------|------------------------|
| Aurora Serverless v2 | 0.5-1 ACU, scale-to-zero | ~$0.09-0.18 |
| Fargate | 0.5 vCPU, 1GB | ~$0.04 |
| EFS | <1GB | ~$0.00 |
| ALB | Hourly + LCU | ~$0.02 |
| AI Generation (once) | Bedrock + Titan | ~$1.50 |
| **Total per demo** | | **~$1.75-2.00** |

### Region Considerations

- Primary deployment: eu-west-2 (London) for UK data residency
- Fallback: us-east-1 (most complete Bedrock model availability)
- Bedrock model access must be enabled by deploying user

---

## Dependencies

### External Dependencies

| Dependency | Risk | Mitigation |
|------------|------|------------|
| LocalGov Drupal availability | Low | Use stable release, pin versions |
| Drupal.org uptime | Medium | Mirror critical modules in S3 |
| Bedrock model access | Medium | Clear pre-requisite documentation |
| Aurora Serverless v2 scale-to-zero | Low | GA feature as of 2024 |

### Internal Dependencies

| Dependency | Owner | Status |
|------------|-------|--------|
| Screenshot pipeline | Existing | Available |
| Evidence pack framework | Existing | Available |
| Portal scenario pages | Existing pattern | Template available |
| Sample data framework | Existing | Extend for Drupal |

---

## Open Questions

1. **Kendra integration complexity** - Should intelligent search be MVP or Growth feature? (Current: Growth)
2. **Container image hosting** - ECR public gallery or build-on-deploy from GitHub?
3. **Drupal security updates** - Automated container rebuild pipeline or manual?
4. **Auto-cleanup** - Lambda to delete stack after 90 minutes? (Existing pattern from other scenarios)
5. **Multi-AZ for Aurora** - Single-AZ acceptable for demo? (Current assumption: yes)

---

## Appendix: AI Feature Module Mapping

| Feature | Drupal Module | AWS Service | Estimated Effort |
|---------|--------------|-------------|------------------|
| AI Content Editor | aws_bedrock_chat, ai_ckeditor | Bedrock (Claude) | Medium |
| Readability Simplify | ai_content_suggestions | Bedrock | Low |
| Auto Alt Text | ai_image_alt | Rekognition | Low |
| Listen to Page | Custom module | Polly | Medium |
| Translation | Custom module | Translate | Medium |
| PDF to Web | Custom module | Textract + Bedrock | High |
| Intelligent Search | Custom module | Kendra | High |

---

_This PRD captures the vision for AI-Enhanced LocalGov Drupal on AWS - a flagship demonstration of AWS AI services integrated into UK public sector content management._

_Created through collaborative discovery between cns and BMAD PM agent._
