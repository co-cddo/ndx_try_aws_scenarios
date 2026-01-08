# Brainstorming Session Results

**Session Date:** 2025-12-23
**Facilitator:** BMAD Analyst
**Participant:** cns

## Session Start

**Approach Selected:** AI-Recommended Techniques
**Techniques Planned:**
1. Resource Constraints (reframed as "elegant simplicity within best practices")
2. First Principles Thinking
3. SCAMPER Method
4. Question Storming (optional)

## Executive Summary

**Topic:** New LocalGov Drupal scenario for ndx_try_aws_scenarios - creating a CloudFormation-based deployment with getting started guides, optimized for quick deployment and low cost.

**Session Goals:**
- Create CloudFormation template for LocalGov Drupal deployment
- Develop getting started guides for the deployment
- Optimize for speed of deployment (quick spin-up)
- Optimize for cost efficiency (cheap to run)
- **Critical constraint:** Minimum viable BUT best practice - no compromising on security, architecture quality, or proper patterns

**Techniques Used:** Resource Constraints, First Principles Thinking, SCAMPER (AI Integration), Dynamic Generation, UX/Documentation

**Total Ideas Generated:** 25+

### Key Themes Identified:

1. **Best practice doesn't mean expensive** - Aurora Serverless v2 scale-to-zero makes production-grade DB affordable
2. **AI is the differentiator** - 7 AWS AI services integrated into CMS workflow
3. **Unique every time** - Dynamic council generation creates memorable, shareable demos
4. **Documentation as code** - Test-driven guides stay accurate automatically
5. **Accessibility is compelling** - WCAG 2.2 / EAA compliance features resonate with council audiences

## Technique Sessions

### Technique 1: Resource Constraints

**Framing:** Finding elegant simplicity within best practices - not cutting corners, but right-sizing.

**Architecture Requirements Established:**

| Component | Requirement | Flexibility |
|-----------|-------------|-------------|
| Compute | Fargate ECS | Maybe Lightsail containers |
| Database | Aurora Serverless v2 | Single-AZ acceptable |
| Storage | EFS | Required for persistence |
| Caching | Redis/ElastiCache | Nice-to-have |
| CDN | CloudFront | Nice-to-have |

**Key Discovery: Aurora Serverless v2 Scale-to-Zero (2025)**

Major pricing update verified via Perplexity research:
- Aurora Serverless v2 now supports **scale-to-zero** - no charges when idle
- Previous minimum 0.5 ACU baseline (~$43/month) eliminated
- This makes "best practice" architecture genuinely affordable for trials

**Verified 2025 Pricing (us-east-1):**

| Service | Price | Notes |
|---------|-------|-------|
| Aurora Serverless v2 | $0.12/ACU-hour | Scale-to-zero when idle |
| NAT Gateway | $0.045/hour + $0.045/GB | ~$33/month per gateway |
| EFS Standard | $0.30/GB-month | One Zone: $0.16/GB |
| Fargate (Linux/x86) | $0.04048/vCPU-hr + $0.00445/GB-hr | ARM ~20% cheaper |

**Revised 90-minute Trial Cost Estimate:**

| Component | Config | Cost |
|-----------|--------|------|
| Aurora Serverless v2 | 0.5-1 ACU, scale-to-zero after | ~$0.09-0.18 |
| Fargate | 0.5 vCPU, 1GB | ~$0.04 |
| EFS | <1GB | ~$0.00 |
| ALB | Per hour + LCU | ~$0.02 |
| **Total** | | **~$0.15-0.25** |

**Decision:** Public subnets with security groups (no NAT Gateways) - secure and cost-effective for trials.

---

### Technique 2: First Principles Thinking

**Core Question:** What does a council officer need to walk away understanding?

**Essential Trial Experience:**
- View a working site with real content (not empty CMS)
- Log in and edit existing pages
- See LocalGov Drupal-specific features (not just vanilla Drupal)

**Sample Content Decision: Showcase LocalGov Drupal Differentiators**

| Content | Type | Purpose |
|---------|------|---------|
| Homepage | Basic page | Welcome, links to services |
| "Waste & Recycling" | localgov_services | Service landing + sub-pages |
| "Find your bin collection day" | localgov_directories | Interactive finder |
| "How to apply for planning permission" | localgov_guides | Step-by-step guide |
| News article | News | "Council launches new website" |

**LocalGov Drupal Features Worth Highlighting:**
- localgov_services: Service pages with departmental access patterns
- localgov_directories: Finders, events, directories ("Find your nearest...")
- localgov_guides: Step-by-step accessible guides (replacing PDFs)
- WCAG 2.2 accessibility baked in
- 53+ councils, 100+ live sites using it

**Content Deployment Method: Init Container**
- Runs once on first deploy, then exits
- Uses Drush CLI (composer, drush site-install, content creation)
- Keeps main container image clean
- Easier to update content without rebuilding main image

---

### Technique 3: SCAMPER - AI Integration Exploration

**Pivot:** Rather than just adapting existing patterns, we explored what AWS AI services could add to LocalGov Drupal.

**Research Findings: Drupal + AWS AI Integrations**

Existing modules discovered:
- `aws_bedrock_chat` (v1.1.0) - GenAI chatbot, Bedrock Agents, FedRAMP-ready
- `ai_provider_aws_bedrock` - Connects Drupal AI module to Bedrock
- `AI CKEditor` - Writing assistant in the editor toolbar
- `AI Content Suggestions` - Readability scoring, tone adjustment
- `AI Image Alt Text` - Auto-generate accessible alt text

**Decision: Full AI-Enhanced Demo Suite**

All 7 AI demos to be included:

| # | Demo | AWS Service | Council Value |
|---|------|-------------|---------------|
| 1 | **AI Content Editor** | Bedrock (Claude) | Writing assistance while editing |
| 2 | **Simplify for Readability** | Bedrock | Plain English (reading age 9) |
| 3 | **Auto Alt Text** | Rekognition | WCAG 2.2 image accessibility |
| 4 | **Listen to Page (TTS)** | Polly | Audio accessibility, 40+ languages |
| 5 | **Real-time Translation** | Translate | 75+ languages for diverse communities |
| 6 | **Summarize PDF to Web** | Textract + Bedrock | Replace inaccessible PDFs (EAA compliance) |
| 7 | **Intelligent Search** | Kendra | Natural language "find anything" |

**The Story Arc:**
> "From editor to accessible, multilingual content in minutes - with AI assistance at every step."

**Additional AWS Services Required:**
- Amazon Bedrock (Claude model access)
- Amazon Polly
- Amazon Translate
- Amazon Rekognition
- Amazon Textract
- Amazon Kendra (optional - most complex to set up)

**Architecture Implications:**
- IAM roles need permissions for all AI services
- Bedrock model access must be enabled in account
- Kendra requires index + Drupal connector setup
- Init container must install/configure all AI modules

---

### Technique 4: Dynamic Content Generation

**Big Idea:** Every deployment generates a UNIQUE fictional UK council!

**How It Works:**
1. Init container generates random council identity (name, region, character)
2. Bedrock Claude generates all page content with local flavour
3. Bedrock Titan Image Generator creates unique images (town centre, parks, councillor headshots)
4. Content imported into Drupal via Drush
5. Every demo is one-of-a-kind

**Council Identity Seed Example:**
```json
{
  "council_name": "Westbury District Council",
  "region": "Somerset",
  "main_town": "Westbury",
  "villages": ["Ashton Vale", "Brookfield", "Clearwater"],
  "population": 87000,
  "character": "Historic market town with rural hinterland"
}
```

**Generation Costs (~$1.50 per deployment):**
| Content Type | Count | Cost |
|--------------|-------|------|
| Text (Claude Haiku) | ~140 pages | ~$0.02 |
| Hero images | 5 | $0.20 |
| Location photos | 15 | $0.60 |
| Councillor headshots | 8 | $0.32 |
| Service icons | 12 | $0.12 |
| News photos | 6 | $0.24 |

**Optional Themed Variations:**
- Urban Borough (London suburb, diverse)
- Rural District (villages, farming)
- Coastal Town (seaside, tourism)
- Historic City (cathedral, heritage)
- Industrial Town (regeneration)

---

### Technique 5: UX & Documentation Requirements

**DEMO Banner Requirement:**
- Fixed banner at top of every page
- Clear "DEMONSTRATION ONLY - Not a real council" message
- Includes generated council name
- High-visibility striped design (yellow/red)

**First-Class Walkthrough Guide:**
1. Finding credentials (CloudFormation Console screenshots)
2. Logging into Drupal
3. Exploring content
4. Editing pages
5. AI Features Tour (all 7 features)
6. Architecture overview
7. Clean up instructions

**Test-Driven Documentation (Build-Time):**
- Playwright tests generate screenshots + annotations
- Screenshots committed to version control
- Markdown guides generated from test annotations
- CI just builds - no live testing needed
- Regenerate when demo changes

**Guide Structure:**
```
src/content/guides/localgov-drupal/
├── index.md
├── 01-getting-started.md
├── 02-exploring-content.md
├── 03-editing-pages.md
├── 04-ai-features.md
├── 05-architecture.md
└── 06-cleanup.md
```

**~30-40 screenshots committed to version control**

## Idea Categorization

### Immediate Opportunities

_Ideas ready to implement now_

1. **Aurora Serverless v2 with Scale-to-Zero** - 2025 pricing makes best-practice DB affordable (~$0.09-0.18 for 90 min trial)
2. **EFS for persistent storage** - Required for Drupal file storage, minimal cost
3. **Public subnets (no NAT)** - Secure with security groups, avoids $33/month per NAT gateway
4. **Init container for setup** - Clean separation, runs Drush, exits
5. **DEMO banner** - Simple CSS/template injection, critical for avoiding confusion
6. **LocalGov Drupal content types** - Use existing localgov_services, localgov_directories, localgov_guides modules

### Future Innovations

_Ideas requiring development/research_

1. **AI Content Editor (Bedrock)** - aws_bedrock_chat and AI CKEditor modules exist, need integration work
2. **Auto Alt Text (Rekognition)** - AI Image Alt Text module exists, needs AWS provider config
3. **Text-to-Speech (Polly)** - "Listen to this page" button, accessibility win
4. **Real-time Translation (Translate)** - 75+ languages for diverse communities
5. **Content Simplification (Bedrock)** - Readability scoring + one-click rewrite
6. **Test-driven documentation** - Playwright generates screenshots at build time

### Moonshots

_Ambitious, transformative concepts_

1. **Dynamic Council Generation** - Every deployment creates unique fictional council via Bedrock
2. **AI Image Generation** - Titan Image Generator creates town photos, councillor headshots
3. **PDF-to-Web Conversion** - Textract + Bedrock summarizes documents for accessibility
4. **Intelligent Search (Kendra)** - Natural language "find anything" across all content
5. **Themed Council Variations** - Urban/Rural/Coastal/Historic deployment options

### Insights and Learnings

_Key realizations from the session_

1. **Aurora Serverless v2 scale-to-zero changes everything** - Best practice is now affordable for trials
2. **Existing Drupal AI modules are mature** - aws_bedrock_chat, AI CKEditor, AI Image Alt Text all production-ready
3. **LocalGov Drupal has specific content types** - Should showcase what makes it different from vanilla Drupal
4. **53+ councils already use LocalGov Drupal** - This is a credible, proven platform
5. **Dynamic content generation is feasible** - ~$1.50 per deployment for unique council
6. **Test-driven docs solve the screenshot maintenance problem** - Generate at build time, commit to repo
7. **WCAG 2.2 and EAA compliance** - AI features directly address accessibility requirements (June 2025 deadline)

## Action Planning

### Top 3 Priority Ideas

#### #1 Priority: Core Infrastructure (Best-Practice Stack)

- **Rationale:** Foundation for everything else. Must be solid before adding AI features.
- **Next steps:**
  1. Create CloudFormation template with Aurora Serverless v2 (scale-to-zero), EFS, Fargate
  2. Build LocalGov Drupal container image with init container pattern
  3. Implement DEMO banner in Drupal theme
  4. Create sample content seed files using LocalGov Drupal content types
  5. Test deployment end-to-end
- **Resources needed:** CloudFormation expertise, Drupal/Drush knowledge, ECR repository

#### #2 Priority: AI-Enhanced Features (7 AI Integrations)

- **Rationale:** Major differentiator - shows AWS AI services in action for council use cases
- **Next steps:**
  1. Configure Bedrock model access (Claude, Titan Image)
  2. Install and configure aws_bedrock_chat, AI CKEditor, AI Image Alt Text modules
  3. Create custom Polly integration for "Listen to page"
  4. Create custom Translate integration for language switcher
  5. Test each AI feature individually, then together
- **Resources needed:** Bedrock access, IAM permissions for all AI services, Drupal module configuration

#### #3 Priority: Dynamic Content Generation + Documentation

- **Rationale:** "Unique council every time" is the wow factor; docs ensure people can actually use it
- **Next steps:**
  1. Build council identity generator (random names, regions, characters)
  2. Create Bedrock prompts for content generation (services, news, guides)
  3. Create Titan Image prompts for location photos, headshots
  4. Build Playwright test suite that generates walkthrough screenshots
  5. Create guide generation pipeline (test annotations → markdown)
  6. Commit initial screenshots and guides to repo
- **Resources needed:** Bedrock batch inference, Titan Image Generator, Playwright expertise

## Reflection and Follow-up

### What Worked Well

1. **Resource Constraints technique** - Forced clarity on what "minimum viable best practice" actually means
2. **First Principles exploration** - Identified that demo needs hands-on editing experience, not just viewing
3. **Real-time research (Perplexity)** - Discovered Aurora scale-to-zero pricing change, mature Drupal AI modules
4. **UK council website analysis** - Crawling real sites gave realistic content structure
5. **Building on each idea** - AI features → Dynamic generation → Test-driven docs flowed naturally

### Areas for Further Exploration

1. **LocalGov Drupal module compatibility** - Verify all AI modules work with localgov distribution
2. **Bedrock model availability** - Confirm Claude and Titan Image are available in target region
3. **drupal.org reliability** - Site was offline during session; may affect LocalGov Drupal package installation
4. **Kendra complexity** - Most complex AI service to integrate; may defer to v2
5. **Image generation quality** - Test Titan Image Generator output for UK council context

### Recommended Follow-up Techniques

1. **Technical spike** - Build minimal CloudFormation + Drupal deployment to validate architecture
2. **AI feature prototyping** - Test each Drupal AI module individually before integration
3. **Content generation testing** - Run Bedrock prompts to validate council content quality
4. **User testing** - Get council officers to try walkthrough guide for clarity

### Questions That Emerged

1. How long does init container content generation take? (Target: <5 minutes)
2. Can we pre-generate some content to speed up deployment while keeping uniqueness?
3. What's the fallback if Bedrock is unavailable during deployment?
4. Should Kendra be optional add-on or core feature?
5. How do we handle Drupal security updates in the container image?
6. What's the auto-cleanup strategy (Lambda to delete after 90 mins)?

### Next Session Planning

- **Suggested topics:** Technical architecture deep-dive, CloudFormation template structure
- **Preparation needed:** Review existing localgov-drupal-cdk-notes.md for reusable patterns, set up Bedrock model access

---

## Summary: What We're Building

**"AI-Enhanced LocalGov Drupal on AWS"** - A flagship demo scenario that:

1. **Deploys best-practice infrastructure** (Aurora Serverless v2, EFS, Fargate) affordably
2. **Generates unique fictional UK council** content and images via Bedrock at deploy time
3. **Showcases 7 AWS AI services** integrated into the CMS editing experience
4. **Provides first-class walkthrough documentation** generated from Playwright tests
5. **Includes prominent DEMO banner** to prevent confusion with real councils

**Estimated costs:**
- Infrastructure (90 min): ~$0.25
- AI content generation: ~$1.50
- **Total per demo: ~$1.75**

**This is genuinely innovative** - no other demo dynamically generates unique content with AI while showcasing AI-assisted content editing.

---

_Session facilitated using the BMAD CIS brainstorming framework_
