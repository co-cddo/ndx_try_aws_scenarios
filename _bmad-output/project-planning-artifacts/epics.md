---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
workflowComplete: true
inputDocuments:
  - "_bmad-output/prd.md"
  - "_bmad-output/project-planning-artifacts/architecture.md"
  - "_bmad-output/project-planning-artifacts/ux-design-specification.md"
---

# ndx_try_aws_scenarios - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for ndx_try_aws_scenarios, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: **One-Click Deployment**
- CloudFormation Quick Create URL with pre-filled parameters
- Stack deploys in <10 minutes
- Admin credentials available in CloudFormation Outputs
- Drupal accessible via ALB URL immediately after deployment

FR2: **Pre-Populated Sample Content**
- Init container seeds LocalGov Drupal content types on first boot
- Content reflects UK council patterns (services, guides, directories)
- Homepage displays navigation to all content sections
- Content is read/write (users can edit during demo)

FR3: **DEMO Banner**
- Fixed banner at top of every page
- High-visibility design (striped yellow/red)
- Text: "DEMONSTRATION SITE - [Council Name] is a fictional council"
- Cannot be dismissed by regular users

FR4: **AI Content Editor** (Growth)
- AI CKEditor integration via aws_bedrock_chat module
- Claude model (Nova 2 Pro) provides suggestions in editor toolbar
- Works with existing LocalGov Drupal content types
- Requires Bedrock model access enabled in AWS account

FR5: **Accessibility AI Features** (Growth)
- Auto Alt Text: Rekognition/Nova 2 Omni vision generates image descriptions on upload
- Listen to Page: Polly Neural TTS button on public pages (7 languages)
- Readability Simplification: One-click plain English rewrite
- Translation: 75+ language selector via Amazon Translate

FR6: **Dynamic Council Generation** (Growth)
- Random council identity (name, region, population, character)
- Bedrock generates all text content with local flavour
- Nova 2 Omni generates location photos and headshots
- Each deployment produces unique combination
- Generation cost <$1.50 per deployment

FR7: **Walkthrough Documentation**
- Step-by-step guide with screenshots
- Covers: credentials, login, exploring, editing, AI features, architecture, cleanup
- 30-40 screenshots covering key interactions
- Accessible from scenario page and within deployed Drupal

### NonFunctional Requirements

**Performance:**
- NFR1: Page load time <3 seconds (GOV.UK performance standard)
- NFR2: Drupal admin response <2 seconds
- NFR3: AI feature response <5 seconds
- NFR4: Init container runtime <5 minutes
- NFR5: Total deployment time <15 minutes

**Security:**
- NFR6: HTTPS only (ALB with ACM certificate or CloudFront)
- NFR7: Aurora encryption at rest (default)
- NFR8: EFS encryption in-transit and at-rest
- NFR9: IAM least privilege with scoped roles for Fargate task and Lambda
- NFR10: Secrets Manager for DB credentials
- NFR11: VPC isolation - Private subnets for RDS, public for ALB
- NFR12: Minimal security group ingress (80/443 from internet, 3306 from ECS only)

**Scalability:**
- NFR13: Support 10-20 concurrent users (demo environment)
- NFR14: Aurora Serverless v2 0.5-2 ACU with scale-to-zero
- NFR15: Single Fargate task (0.5 vCPU, 1GB)

**Accessibility:**
- NFR16: WCAG 2.2 AA compliance (LocalGov Drupal provides foundation)
- NFR17: Full screen reader support via semantic HTML
- NFR18: Keyboard navigation for all functions
- NFR19: GOV.UK Design System colour contrast compliance
- NFR20: AI enhancements demonstrate TTS, alt text, plain English

**Integration:**
- NFR21: AWS Bedrock with Nova 2 Pro/Lite/Omni models
- NFR22: Amazon Polly with Neural voices (7 languages)
- NFR23: Amazon Translate (75+ languages)
- NFR24: Amazon Rekognition DetectLabels
- NFR25: Amazon Textract AnalyzeDocument

**Cost:**
- NFR26: Infrastructure cost per trial <$2.00
- NFR27: AI generation cost <$1.50 per deployment

### Additional Requirements

**From Architecture - Starter Template/Infrastructure:**
- CDK (TypeScript) synthesized to CloudFormation for distribution
- ghcr.io container registry for open-source image hosting
- Default VPC with public subnets, single AZ (no NAT Gateway costs)
- Aurora Serverless v2 with scale-to-zero capability
- EFS for persistent Drupal file storage
- Entrypoint + WaitCondition + status page initialization pattern
- Drush commands for site:install, config:import, localgov:generate-council
- ECS Exec for development debugging
- DeploymentMode parameter (development/production)
- Container pull from ghcr.io (no ECR setup needed)

**From Architecture - AI Integration:**
- Native Drupal modules (ndx_aws_ai, ndx_council_generator, ndx_demo_banner)
- Nova 2 Pro for content generation
- Nova 2 Lite for simplification/search
- Nova 2 Omni for image generation and vision
- Polly Neural voices: EN, CY (Welsh), FR, RO, ES, CS, PL
- Images specified throughout content, batch generated at end
- CKEditor plugin for AI toolbar integration

**From Architecture - Project Structure (for scaffolding):**
- cloudformation/scenarios/localgov-drupal/cdk/ (IaC)
- cloudformation/scenarios/localgov-drupal/docker/ (Container)
- cloudformation/scenarios/localgov-drupal/drupal/ (CMS codebase)
- cloudformation/scenarios/localgov-drupal/tests/ (CDK/PHP/Playwright tests)
- src/scenarios/localgov-drupal/ (Portal pages)

**From UX Design - Components:**
- DEMO Banner: Yellow/black stripes (#ffdd00/#0b0c0c), fixed top, 44px height
- Deployment Progress: Real-time task list + progress bar with checkmarks
- Credentials Card: Copy buttons, show/hide password, direct admin login link
- Walkthrough Overlay: Modal with highlight, step counter, skip option, focus trap
- AI Action Buttons: Secondary button + icon, CKEditor toolbar integration
- AI Preview Modal: Before/after comparison, non-destructive preview
- Evidence Pack Form: Pre-populated with session data, PDF generation

**From UX Design - Accessibility Requirements:**
- 3px yellow focus rings (#ffdd00)
- 44x44px minimum touch targets
- aria-live regions for dynamic updates
- Focus trap in modals with Escape to close
- Skip links and landmark regions
- axe-core in CI pipeline (non-bypassable)
- prefers-reduced-motion support

**From UX Design - Responsive Strategy:**
- Desktop-first (1024px+): Full feature set
- Tablet (768-1023px): Meeting presentation mode
- Mobile (<768px): Documentation viewing only, no deployment flow

### FR Coverage Map

| FR | Epic | Coverage Description |
|----|------|---------------------|
| FR1: One-Click Deployment | Epic 1 | CloudFormation Quick Create with pre-filled parameters, <10 min deploy |
| FR2: Pre-Populated Sample Content | Epic 1 | Init container seeds LocalGov Drupal content types |
| FR3: DEMO Banner | Epic 1 | Yellow/black banner on all pages indicating demo site |
| FR4: AI Content Editor | Epic 3 | Bedrock Nova 2 Pro integration in CKEditor toolbar |
| FR5: Accessibility AI Features | Epic 3 + Epic 4 | Readability (E3); Alt Text, TTS, Translation, PDF-to-Web (E4) |
| FR6: Dynamic Council Generation | Epic 5 | AI-generated unique council identity, content, and images |
| FR7: Walkthrough Documentation | Epic 2 + Epic 6 | Basic walkthrough (E2); Enhanced AI feature tour (E6) |

**All 7 FRs mapped. No gaps.**

---

## Epic List

| Epic | Title | FRs Covered | Phase |
|------|-------|-------------|-------|
| 1 | Deployable LocalGov Drupal Foundation | FR1, FR2, FR3 | Core |
| 2 | Guided Walkthrough Experience | FR7 (basic) | Core |
| 3 | AI-Powered Content Editing | FR4, FR5 (partial) | Core |
| 4 | AI Accessibility Enhancements | FR5 (remaining) | Core |
| 5 | Dynamic Council Generation | FR6 | Core |
| 6 | Polish, Integration & Enhanced Walkthrough | FR7 (enhanced) | Polish |

### Dependency Flow

```
Epic 1 (Foundation) ──► Epic 2 (Basic Walkthrough)
        │
        ├──► Epic 3 (AI Content Editing) ──┐
        │                                   │
        ├──► Epic 4 (AI Accessibility) ────┼──► Epic 6 (Enhanced Walkthrough)
        │                                   │
        └──► Epic 5 (Dynamic Generation) ──┘
```

---

## Epic 1: Deployable LocalGov Drupal Foundation

**Goal:** Council officers can deploy and access a fully functional LocalGov Drupal CMS with realistic sample content in under 15 minutes, with no technical setup required.

**FRs Covered:** FR1, FR2, FR3

**Implementation Notes:**
- CDK (TypeScript) → CloudFormation infrastructure
- ghcr.io container with LocalGov Drupal
- Aurora Serverless v2, EFS, Fargate, ALB
- Static sample content (not AI-generated)
- DEMO banner on all pages
- **Container image build & publish pipeline** to ghcr.io (GitHub Actions)
- **First login welcome experience** - council name prominently displayed, quick orientation

### Story 1.1: Project Scaffolding & CDK Setup

**As a** developer,
**I want** a properly structured project with initialized CDK,
**So that** I can build the LocalGov Drupal infrastructure with type safety and best practices.

**Acceptance Criteria:**

**Given** an empty scenario directory
**When** the scaffolding is complete
**Then** the following structure exists:
- `cloudformation/scenarios/localgov-drupal/cdk/` with initialized CDK app
- `cloudformation/scenarios/localgov-drupal/docker/` directory
- `cloudformation/scenarios/localgov-drupal/drupal/` directory
- `cloudformation/scenarios/localgov-drupal/tests/` directory
**And** `cdk synth` runs without errors
**And** TypeScript compiles successfully
**And** the main stack file `localgov-drupal-stack.ts` exists with basic structure

---

### Story 1.2: LocalGov Drupal Container Image

**As a** developer,
**I want** a Docker image containing LocalGov Drupal with all dependencies,
**So that** the CMS can run on Fargate with proper configuration.

**Acceptance Criteria:**

**Given** the docker directory structure
**When** the container image is built
**Then** it includes:
- PHP 8.2 with required extensions
- Nginx configured for Drupal
- Composer-installed LocalGov Drupal 3.x
- Drush CLI tool
**And** `drupal.settings.php` reads database credentials from environment variables
**And** the image builds successfully with `docker build`
**And** the image size is under 1GB

---

### Story 1.3: Container Build & Publish Pipeline

**As a** developer,
**I want** automated container builds published to ghcr.io,
**So that** deployments pull the latest tested image without manual intervention.

**Acceptance Criteria:**

**Given** a push to the main branch affecting the docker directory
**When** the GitHub Actions workflow runs
**Then** the container image is built and tagged with commit SHA
**And** the image is pushed to `ghcr.io/[org]/localgov-drupal`
**And** the `latest` tag is updated
**And** failed builds prevent the workflow from completing

---

### Story 1.4: CDK Networking Construct

**As a** developer,
**I want** security groups configured for the Drupal stack,
**So that** network traffic is properly isolated and secured.

**Acceptance Criteria:**

**Given** the CDK networking construct
**When** synthesized to CloudFormation
**Then** an ALB security group allows inbound 443 from 0.0.0.0/0
**And** a Fargate security group allows inbound 80 from ALB SG only
**And** an Aurora security group allows inbound 3306 from Fargate SG only
**And** an EFS security group allows inbound 2049 from Fargate SG only
**And** the stack uses the default VPC (no new VPC created)

---

### Story 1.5: CDK Database Construct

**As a** developer,
**I want** Aurora Serverless v2 provisioned with scale-to-zero,
**So that** the database is cost-effective and production-grade.

**Acceptance Criteria:**

**Given** the CDK database construct
**When** synthesized to CloudFormation
**Then** Aurora Serverless v2 MySQL 8.0 is configured
**And** capacity ranges from 0.5 to 2 ACU
**And** database credentials are stored in Secrets Manager
**And** encryption at rest is enabled
**And** the database name is `drupal`
**And** the construct exports the cluster endpoint and secret ARN

---

### Story 1.6: CDK Storage Construct

**As a** developer,
**I want** EFS provisioned for Drupal file storage,
**So that** uploaded files persist across container restarts.

**Acceptance Criteria:**

**Given** the CDK storage construct
**When** synthesized to CloudFormation
**Then** an EFS file system is created with encryption enabled
**And** an access point is configured for `/var/www/drupal/sites/default/files`
**And** the mount target is created in the default VPC subnet
**And** the construct exports the file system ID and access point ARN

---

### Story 1.7: CDK Compute Construct

**As a** developer,
**I want** Fargate service with ALB configured,
**So that** Drupal is accessible via HTTPS with load balancing.

**Acceptance Criteria:**

**Given** the CDK compute construct with dependencies on networking, database, and storage
**When** synthesized to CloudFormation
**Then** a Fargate task definition specifies:
- 0.5 vCPU, 1GB memory
- Container image from ghcr.io
- EFS volume mount
- Environment variables for database connection
- Secrets reference for credentials
**And** an ECS service runs with desired count of 1
**And** an Application Load Balancer routes HTTPS traffic to the service
**And** health checks verify `/` returns 200

---

### Story 1.8: Drupal Init & WaitCondition

**As a** deploying user,
**I want** Drupal to initialize automatically on first deployment,
**So that** the CMS is ready to use when CloudFormation completes.

**Acceptance Criteria:**

**Given** a fresh deployment with empty database
**When** the container starts
**Then** the entrypoint script:
- Waits for Aurora to be available (retry loop)
- Runs `drush site:install localgov` with admin credentials from Secrets Manager
- Runs `drush config:import` to apply exported configuration
- Signals CloudFormation WaitCondition on success
**And** a status page at `/init-status` shows progress during initialization
**And** CloudFormation stack completes only after Drupal is ready
**And** subsequent container restarts skip initialization

---

### Story 1.9: Static Sample Content

**As a** council officer,
**I want** realistic UK council content pre-loaded,
**So that** I can immediately explore how my content would look.

**Acceptance Criteria:**

**Given** Drupal initialization completes
**When** I visit the homepage
**Then** I see navigation to:
- Service pages (15-20 items: Waste & Recycling, Planning, Council Tax, etc.)
- Guide pages (5-8 items: How to apply for planning permission, etc.)
- Directory entries (10-15 items)
- News articles (5 items)
**And** all content uses LocalGov Drupal content types
**And** content is editable (read/write)
**And** sample images are included for visual completeness

---

### Story 1.10: DEMO Banner Module

**As a** site visitor,
**I want** to clearly see this is a demonstration site,
**So that** I don't confuse demo content with real council services.

**Acceptance Criteria:**

**Given** the ndx_demo_banner Drupal module is enabled
**When** I visit any page on the site
**Then** a fixed banner appears at the top with:
- Yellow/black striped design (#ffdd00/#0b0c0c)
- 44px height
- Text: "DEMONSTRATION SITE - [Council Name] is a fictional council"
**And** the banner cannot be dismissed by regular users
**And** the banner does not interfere with admin toolbar
**And** the banner is accessible (proper contrast, screen reader text)

---

### Story 1.11: First Login Welcome Experience

**As a** council officer logging in for the first time,
**I want** a welcoming orientation experience,
**So that** I feel confident navigating the CMS.

**Acceptance Criteria:**

**Given** I have logged into the Drupal admin for the first time
**When** the dashboard loads
**Then** I see the council name prominently displayed
**And** a "Start Here" prompt or quick orientation is visible
**And** the admin dashboard shows clear navigation to key areas
**And** the experience is consistent with GOV.UK design patterns

---

### Story 1.12: CloudFormation Outputs & Quick Create

**As a** council officer,
**I want** to deploy with one click using pre-filled parameters,
**So that** I can experience LocalGov Drupal without technical setup.

**Acceptance Criteria:**

**Given** the CDK stack with all constructs
**When** synthesized to CloudFormation
**Then** the template includes outputs for:
- Drupal URL (ALB DNS name)
- Admin username
- Admin password (resolved from Secrets Manager)
- CloudWatch Logs link for initialization
**And** a Quick Create URL is generated with pre-filled parameters
**And** the only required user action is clicking "Create stack"
**And** total deployment time is under 15 minutes

---

## Epic 2: Guided Walkthrough Experience

**Goal:** Users can follow a clear, step-by-step guide to explore the CMS, understand its features, complete the demo systematically, and generate an evidence pack for stakeholder reporting.

**FRs Covered:** FR7 (basic)

**Implementation Notes:**
- Portal scenario pages with screenshots
- Deployment Progress component
- Credentials Card with copy buttons
- Basic Walkthrough Overlay in Drupal admin
- Covers: credentials, login, exploring, editing, cleanup
- **Basic Evidence Pack generation** - enables early adopters to report to stakeholders
- **Progress tracking** - progress bar + completion indicators to prevent mid-walkthrough abandonment
- **Playwright screenshot pipeline foundation** - basic setup to capture screenshots early and catch regressions
- **Documentation template & standards** - define structure, terminology, screenshot conventions for consistent mini-guides

### Story 2.1: Portal Scenario Landing Page

**As a** council officer visiting the portal,
**I want** a clear scenario landing page with overview and deploy button,
**So that** I understand what I'm about to experience and can start with confidence.

**Acceptance Criteria:**

**Given** I navigate to the LocalGov Drupal scenario page
**When** the page loads
**Then** I see:
- Scenario title and brief description
- Key features summary (7 AI capabilities)
- Estimated deployment time (<15 minutes)
- Estimated cost (<$2)
- Prominent "Deploy Now" button linking to CloudFormation Quick Create
**And** the page follows GOV.UK Design System patterns
**And** the page is responsive (desktop-first, tablet and mobile supported)
**And** navigation to other scenarios is available

---

### Story 2.2: Deployment Progress Component

**As a** council officer deploying the stack,
**I want** real-time feedback on deployment progress,
**So that** I know the deployment is working and how long to wait.

**Acceptance Criteria:**

**Given** I have clicked "Create stack" in CloudFormation console
**When** I return to the portal deployment page
**Then** I see a progress component showing:
- Current stack status (CREATE_IN_PROGRESS, CREATE_COMPLETE, etc.)
- Task list with checkmarks for completed resources
- Progress bar indicating overall completion
- Estimated time remaining
**And** the display updates automatically (polling or websocket)
**And** error states are clearly indicated with guidance
**And** aria-live regions announce status changes for screen readers

---

### Story 2.3: Credentials Card Component

**As a** council officer after successful deployment,
**I want** easy access to my Drupal credentials,
**So that** I can log in immediately without searching CloudFormation outputs.

**Acceptance Criteria:**

**Given** the CloudFormation stack has completed successfully
**When** the credentials card displays
**Then** I see:
- Drupal site URL (clickable link)
- Admin username with copy button
- Admin password (hidden by default) with show/hide toggle and copy button
- Direct "Log in to Admin" button
**And** copy buttons provide visual feedback on success
**And** the card uses GOV.UK component patterns
**And** sensitive data is not logged or exposed in browser history

---

### Story 2.4: Basic Walkthrough Content

**As a** council officer new to LocalGov Drupal,
**I want** step-by-step guide pages on the portal,
**So that** I can follow a structured path through the demo.

**Acceptance Criteria:**

**Given** I am on the walkthrough pages
**When** I follow the steps
**Then** I find guides covering:
- Getting your credentials and logging in
- Exploring the homepage and navigation
- Editing existing content
- Understanding the DEMO banner
- Preparing for cleanup
**And** each step includes descriptive text and screenshots
**And** steps are numbered and progress is visible
**And** I can navigate forward, back, or jump to specific steps

---

### Story 2.5: Walkthrough Overlay in Drupal

**As a** council officer exploring the Drupal admin,
**I want** an in-CMS guided tour,
**So that** I can learn while doing without switching to external docs.

**Acceptance Criteria:**

**Given** I am logged into Drupal admin
**When** I click "Start Guided Tour" or it auto-triggers on first login
**Then** a modal overlay appears with:
- Highlighted UI element with spotlight effect
- Step instruction and context
- Step counter (e.g., "Step 3 of 8")
- Next/Previous/Skip buttons
**And** focus is trapped within the modal
**And** Escape key closes the overlay
**And** progress is saved so I can resume later
**And** the overlay meets WCAG 2.2 AA requirements

---

### Story 2.6: Progress Tracking System

**As a** council officer following the walkthrough,
**I want** to see my progress through the demo,
**So that** I stay motivated and know how much remains.

**Acceptance Criteria:**

**Given** I am progressing through the walkthrough
**When** I complete a step or section
**Then** I see:
- Progress bar showing overall completion percentage
- Completion indicators (checkmarks) for finished sections
- Visual distinction between completed, current, and upcoming steps
**And** progress persists across browser sessions (local storage)
**And** the display updates dynamically
**And** I can reset progress if desired

---

### Story 2.7: Playwright Screenshot Foundation

**As a** developer maintaining the walkthrough,
**I want** automated screenshot capture,
**So that** documentation stays current with minimal manual effort.

**Acceptance Criteria:**

**Given** a deployed LocalGov Drupal instance
**When** the Playwright test suite runs
**Then** screenshots are captured for:
- Homepage and key navigation pages
- Admin dashboard
- Content edit screens
- DEMO banner visibility
**And** screenshots are saved with consistent naming convention
**And** screenshots are stored in the portal assets directory
**And** a manifest file tracks screenshot metadata (path, description, captured date)
**And** failed captures are reported clearly

---

### Story 2.8: Documentation Template & Standards

**As a** developer writing walkthrough content,
**I want** consistent templates and conventions,
**So that** all guides have uniform quality and style.

**Acceptance Criteria:**

**Given** I need to write a new guide or mini-guide
**When** I reference the documentation standards
**Then** I find:
- Markdown template with required sections
- Screenshot naming convention (e.g., `{epic}-{story}-{step}.png`)
- Terminology glossary (consistent names for UI elements)
- Accessibility requirements for documentation
- Example of properly formatted guide
**And** the standards cover both portal pages and Drupal overlay content
**And** screenshot dimensions and quality requirements are specified

---

### Story 2.9: Basic Evidence Pack Generation

**As a** council officer reporting to stakeholders,
**I want** to generate a basic evidence pack,
**So that** I can share deployment success with my committee.

**Acceptance Criteria:**

**Given** I have completed the basic walkthrough
**When** I click "Generate Evidence Pack"
**Then** a PDF is generated containing:
- Scenario name and date
- Deployment success confirmation
- Drupal site URL
- AWS region and estimated cost
- Screenshots of homepage and admin dashboard
- Space for notes/observations
**And** form fields are pre-populated with session data
**And** the PDF downloads immediately
**And** the design follows GOV.UK document patterns

---

### Story 2.10: Cleanup Instructions

**As a** council officer finished with the demo,
**I want** clear stack deletion guidance,
**So that** I don't incur ongoing AWS costs.

**Acceptance Criteria:**

**Given** I am ready to end my demo session
**When** I navigate to the cleanup section
**Then** I find:
- Step-by-step CloudFormation deletion instructions
- Direct link to CloudFormation console filtered to my stack
- Warning about data loss (EFS files, database)
- Confirmation that costs stop after deletion
- Estimated cleanup time
**And** instructions include screenshots of the deletion process
**And** common errors (e.g., non-empty S3 buckets) are addressed

---

## Epic 3: AI-Powered Content Editing

**Goal:** Content editors can use AI assistance to write better content faster and simplify complex text to plain English with one click.

**FRs Covered:** FR4, FR5 (Readability Simplification)

**Implementation Notes:**
- ndx_aws_ai Drupal module
- CKEditor plugin integration
- Nova 2 Pro for writing assistance
- Nova 2 Lite for simplification
- AI Preview Modal (before/after comparison)
- **AI Content Editing Mini-Guide** with feature-specific screenshots and "try this" prompts
- **AI feature component design system** - establish consistent patterns (buttons, previews, loading states) for all AI features

### Story 3.1: ndx_aws_ai Module Foundation

**As a** developer,
**I want** a base Drupal module with AWS SDK integration,
**So that** all AI features share common infrastructure and configuration.

**Acceptance Criteria:**

**Given** the ndx_aws_ai module is installed
**When** I enable it in Drupal
**Then** the module:
- Initializes AWS SDK for PHP with IAM role credentials
- Provides configuration form for AWS region selection
- Implements centralized error handling for AWS API failures
- Exposes service classes for dependency injection
**And** the module has no external dependencies beyond AWS SDK
**And** credentials are obtained from task IAM role (not hardcoded)
**And** connection errors display user-friendly messages

---

### Story 3.2: Bedrock Service Integration

**As a** developer building AI features,
**I want** a Bedrock client service with prompt templates,
**So that** I can invoke Nova 2 models consistently across features.

**Acceptance Criteria:**

**Given** the ndx_aws_ai module is enabled
**When** I inject the Bedrock service
**Then** I can:
- Call Nova 2 Pro for content generation
- Call Nova 2 Lite for simplification tasks
- Use pre-defined prompt templates with variable substitution
- Handle rate limiting with exponential backoff
**And** responses are parsed and validated
**And** token usage is logged for cost tracking
**And** the service is unit testable with mock responses

---

### Story 3.3: AI Component Design System

**As a** developer building AI UI components,
**I want** consistent design patterns for AI interactions,
**So that** all AI features feel cohesive and familiar to users.

**Acceptance Criteria:**

**Given** I am implementing an AI feature UI
**When** I use the design system components
**Then** I have access to:
- AI Action Button (secondary style with AI icon)
- Loading State (spinner with "AI is thinking..." text)
- Error State (red alert with retry option)
- Success State (green confirmation)
**And** all components meet WCAG 2.2 AA requirements
**And** components use GOV.UK Design System colour palette
**And** loading states include aria-live announcements
**And** components are documented with usage examples

---

### Story 3.4: CKEditor AI Toolbar Plugin

**As a** content editor,
**I want** AI options in my CKEditor toolbar,
**So that** I can access AI assistance without leaving the editor.

**Acceptance Criteria:**

**Given** I am editing content in CKEditor
**When** I look at the toolbar
**Then** I see an "AI" dropdown button with options:
- "Help me write..."
- "Simplify to plain English"
**And** clicking an option opens the relevant AI dialog
**And** the toolbar button is keyboard accessible
**And** the plugin loads without affecting editor performance
**And** the plugin gracefully degrades if AI service unavailable

---

### Story 3.5: AI Writing Assistant

**As a** content editor,
**I want** AI help writing content based on my prompt,
**So that** I can produce quality content faster.

**Acceptance Criteria:**

**Given** I click "Help me write..." in CKEditor
**When** I enter a prompt (e.g., "Write an introduction about council tax bands")
**Then** the AI:
- Shows loading state while processing
- Returns generated content in the preview modal
- Allows me to edit the suggestion before inserting
- Inserts at cursor position when I click "Apply"
**And** generated content matches LocalGov Drupal tone guidelines
**And** I can cancel without inserting anything
**And** the prompt field remembers my last 5 prompts

---

### Story 3.6: Readability Simplification

**As a** content editor,
**I want** to simplify complex text to plain English with one click,
**So that** content is accessible to readers of all abilities.

**Acceptance Criteria:**

**Given** I have selected text in CKEditor
**When** I click "Simplify to plain English"
**Then** the AI:
- Shows loading state while processing
- Returns simplified version in preview modal
- Shows before/after comparison
- Replaces selected text when I click "Apply"
**And** simplified text targets reading age 9 (Plain English standard)
**And** technical terms are explained in parentheses where needed
**And** the original formatting (lists, headings) is preserved

---

### Story 3.7: AI Preview Modal

**As a** content editor,
**I want** to preview AI suggestions before applying them,
**So that** I maintain control over my content.

**Acceptance Criteria:**

**Given** an AI feature has generated a suggestion
**When** the preview modal opens
**Then** I see:
- Original content (if applicable) on left/top
- AI suggestion on right/bottom
- Diff highlighting showing changes
- "Apply" button to insert/replace
- "Cancel" button to discard
- "Regenerate" button to try again
**And** focus is trapped in the modal
**And** Escape key closes without applying
**And** the modal is fully accessible (screen reader, keyboard)

---

### Story 3.8: AI Content Editing Mini-Guide

**As a** council officer trying AI content features,
**I want** a focused guide for content editing AI,
**So that** I can learn and experiment with specific prompts.

**Acceptance Criteria:**

**Given** I navigate to the AI Content Editing mini-guide
**When** I read through it
**Then** I find:
- Overview of available AI writing features
- Step-by-step instructions with screenshots
- "Try this" prompts (e.g., "Ask AI to write a parking permit guide")
- Tips for getting better results
- Common use cases for council content
**And** the guide follows documentation template standards
**And** screenshots show real AI interactions
**And** the guide is linked from the main walkthrough

---

## Epic 4: AI Accessibility Enhancements

**Goal:** Accessibility officers can use AI-powered tools to make content more accessible: automatic image descriptions, text-to-speech, multi-language translation, and PDF-to-web conversion.

**FRs Covered:** FR5 (Auto Alt Text, Listen to Page, Translation, PDF to Web)

**Implementation Notes:**
- Nova 2 Omni vision for auto alt-text on media upload
- Polly Neural TTS with 7 languages (EN, CY, FR, RO, ES, CS, PL)
- Amazon Translate with 75+ languages
- Textract + Bedrock for PDF-to-web conversion
- **AI Accessibility Mini-Guide** with feature-specific screenshots and "try this" prompts

### Story 4.1: Polly TTS Service Integration

**As a** developer building text-to-speech features,
**I want** an Amazon Polly client service,
**So that** I can generate speech audio from text content.

**Acceptance Criteria:**

**Given** the ndx_aws_ai module is enabled
**When** I inject the Polly service
**Then** I can:
- Synthesize speech using Neural voices
- Select from 7 supported languages (EN, CY, FR, RO, ES, CS, PL)
- Generate MP3 audio output
- Handle long text with automatic chunking
**And** audio files are cached to avoid regeneration
**And** the service handles rate limits gracefully
**And** Welsh (CY) uses Gwyneth Neural voice

---

### Story 4.2: Amazon Translate Service Integration

**As a** developer building translation features,
**I want** an Amazon Translate client service,
**So that** I can translate content to 75+ languages.

**Acceptance Criteria:**

**Given** the ndx_aws_ai module is enabled
**When** I inject the Translate service
**Then** I can:
- Translate text between any supported language pair
- Auto-detect source language
- Preserve HTML formatting in translations
- Batch translate multiple text segments
**And** translations are cached by content hash
**And** the service returns language confidence scores
**And** unsupported language pairs return clear error messages

---

### Story 4.3: Nova 2 Omni Vision Service

**As a** developer building image analysis features,
**I want** a Nova 2 Omni vision client,
**So that** I can generate descriptions from images.

**Acceptance Criteria:**

**Given** the ndx_aws_ai module is enabled
**When** I inject the Vision service
**Then** I can:
- Analyze images and return text descriptions
- Generate alt-text optimized for accessibility
- Handle JPEG, PNG, and WebP formats
- Process images up to 5MB
**And** descriptions follow WCAG alt-text best practices
**And** the service rejects inappropriate content
**And** processing time is under 5 seconds per image

---

### Story 4.4: Textract Service Integration

**As a** developer building document processing features,
**I want** an Amazon Textract client service,
**So that** I can extract structured content from PDFs.

**Acceptance Criteria:**

**Given** the ndx_aws_ai module is enabled
**When** I inject the Textract service
**Then** I can:
- Upload PDF documents for analysis
- Extract text with layout preservation
- Identify tables and form fields
- Handle multi-page documents
**And** extracted content includes confidence scores
**And** the service handles scanned documents (OCR)
**And** processing status is trackable for async operations

---

### Story 4.5: Auto Alt-Text on Media Upload

**As a** content editor uploading images,
**I want** AI-generated alt-text suggestions,
**So that** I can make images accessible without manual description writing.

**Acceptance Criteria:**

**Given** I upload an image to the media library
**When** the upload completes
**Then** the alt-text field is:
- Pre-populated with AI-generated description
- Editable before saving
- Marked as "AI-generated" with visual indicator
**And** I can regenerate if the suggestion is poor
**And** I can clear and write my own description
**And** the generation happens asynchronously (non-blocking)
**And** existing images can be batch-processed

---

### Story 4.6: Listen to Page (TTS Button)

**As a** site visitor with visual impairments or reading difficulties,
**I want** a button to have the page read aloud,
**So that** I can consume content through audio.

**Acceptance Criteria:**

**Given** I am on a public content page
**When** I click the "Listen to this page" button
**Then** I see:
- Language selector dropdown (7 languages)
- Play/Pause/Stop controls
- Progress indicator
- Speed control (0.5x to 2x)
**And** audio is generated from main content area (not navigation)
**And** the player persists while scrolling
**And** keyboard shortcuts work (Space for play/pause)
**And** the feature is announced to screen readers

---

### Story 4.7: Content Translation

**As a** site visitor who doesn't read English,
**I want** to translate page content to my language,
**So that** I can understand council services.

**Acceptance Criteria:**

**Given** I am on a public content page
**When** I click the "Translate" button
**Then** I see:
- Language selector with 75+ options
- Search/filter for language names
- Recently used languages at top
**And** selecting a language translates the main content area
**And** a banner indicates the page is translated
**And** I can revert to original with one click
**And** translation preference is remembered across pages

---

### Story 4.8: PDF-to-Web Conversion

**As a** content editor with legacy PDF documents,
**I want** to convert PDFs to accessible web content,
**So that** information is available to all users.

**Acceptance Criteria:**

**Given** I upload a PDF in the content editor
**When** I click "Convert to web content"
**Then** the system:
- Extracts text using Textract
- Structures content with headings (Bedrock analysis)
- Converts tables to accessible HTML
- Creates a draft content node
**And** I can review and edit before publishing
**And** the original PDF is retained as attachment
**And** conversion progress is shown for large documents
**And** images in PDF are extracted with alt-text

---

### Story 4.9: AI Accessibility Mini-Guide

**As a** accessibility officer trying AI accessibility features,
**I want** a focused guide for accessibility AI tools,
**So that** I can learn and demonstrate these capabilities.

**Acceptance Criteria:**

**Given** I navigate to the AI Accessibility mini-guide
**When** I read through it
**Then** I find:
- Overview of all accessibility AI features
- Step-by-step instructions with screenshots for each:
  - Auto alt-text generation
  - Listen to page (TTS)
  - Content translation
  - PDF-to-web conversion
- "Try this" prompts for each feature
- Accessibility compliance context (WCAG references)
**And** the guide follows documentation template standards
**And** screenshots show real AI interactions
**And** the guide is linked from the main walkthrough

---

## Epic 5: Dynamic Council Generation

**Goal:** Each deployment creates a unique fictional UK council with AI-generated identity, contextual content, location photos, and councillor headshots - making every demo fresh and shareable.

**FRs Covered:** FR6

**Implementation Notes:**
- ndx_council_generator Drupal module
- Council identity: name, region, theme, population
- ~140 pages of contextual content via Nova 2 Pro
- Image specs collected, batch generated with Nova 2 Omni
- Drush command: `localgov:generate-council`
- Generation cost <$1.50
- **Dynamic Council Mini-Guide** with feature-specific screenshots explaining the generation process

### Story 5.1: ndx_council_generator Module Foundation

**As a** developer,
**I want** a base module for council generation orchestration,
**So that** all generation features share common infrastructure.

**Acceptance Criteria:**

**Given** the ndx_council_generator module is installed
**When** I enable it in Drupal
**Then** the module:
- Depends on ndx_aws_ai for Bedrock access
- Provides generation state management
- Implements progress tracking hooks
- Exposes generation service for dependency injection
**And** the module integrates with Drupal's batch API
**And** generation can be paused and resumed
**And** errors are logged with context for debugging

---

### Story 5.2: Council Identity Generator

**As a** deploying user,
**I want** a unique fictional council identity generated,
**So that** my demo feels distinct and realistic.

**Acceptance Criteria:**

**Given** council generation is triggered
**When** identity generation runs
**Then** the system generates:
- Council name (e.g., "Thornbridge District Council")
- Region (one of 9 English regions + Wales/Scotland/NI)
- Theme/character (e.g., "coastal tourism", "industrial heritage")
- Population range (small/medium/large)
- Local flavour keywords for content
**And** the identity is stored in Drupal configuration
**And** the DEMO banner displays the generated council name
**And** identity generation completes in under 10 seconds

---

### Story 5.3: Content Generation Templates

**As a** developer,
**I want** prompt templates for each LocalGov Drupal content type,
**So that** generated content is contextually appropriate.

**Acceptance Criteria:**

**Given** a council identity exists
**When** content generation templates are invoked
**Then** templates exist for:
- Service pages (15-20 items)
- Guide pages (5-8 items)
- Directory entries (10-15 items)
- News articles (5 items)
- Homepage content
**And** templates inject council identity variables
**And** templates specify tone (GOV.UK style guide)
**And** templates include image specification placeholders
**And** total content is approximately 140 pages

---

### Story 5.4: Content Generation Orchestrator

**As a** system administrator,
**I want** content generated sequentially with progress tracking,
**So that** I can monitor generation and handle failures.

**Acceptance Criteria:**

**Given** council identity and templates are ready
**When** content generation runs
**Then** the orchestrator:
- Processes content types in defined order
- Creates Drupal nodes with generated content
- Tracks progress (X of Y pages complete)
- Handles individual page failures without stopping
- Reports summary on completion
**And** progress is visible via Drush output or admin UI
**And** failed pages are logged and can be retried
**And** generation respects Bedrock rate limits

---

### Story 5.5: Image Specification Collector

**As a** developer,
**I want** image specifications collected during content generation,
**So that** images can be batch generated efficiently.

**Acceptance Criteria:**

**Given** content is being generated
**When** a template specifies an image need
**Then** the collector:
- Records image type (hero, headshot, location, etc.)
- Stores the prompt/description for generation
- Links to the content node that needs it
- Assigns placeholder in content
**And** specifications are stored in a queue
**And** duplicate specifications are deduplicated
**And** the queue is persisted for batch processing

---

### Story 5.6: Batch Image Generation

**As a** system administrator,
**I want** all images generated in a single batch at the end,
**So that** generation is efficient and cost-effective.

**Acceptance Criteria:**

**Given** content generation is complete and image specs are queued
**When** batch image generation runs
**Then** the system:
- Processes image queue using Nova 2 Omni
- Generates images matching specifications
- Uploads to Drupal media library
- Updates content nodes with generated images
**And** progress is trackable (X of Y images)
**And** failed images are logged with retry option
**And** total image generation cost stays under $1.00

---

### Story 5.7: Drush Generation Command

**As a** developer or administrator,
**I want** a Drush command to trigger council generation,
**So that** generation can run during deployment or manually.

**Acceptance Criteria:**

**Given** the ndx_council_generator module is enabled
**When** I run `drush localgov:generate-council`
**Then** the command:
- Generates council identity
- Generates all content pages
- Generates all images
- Reports progress to stdout
- Returns exit code 0 on success
**And** the command supports `--dry-run` to preview
**And** the command supports `--skip-images` for faster testing
**And** the command integrates with entrypoint for first-boot

---

### Story 5.8: Dynamic Council Mini-Guide

**As a** council officer curious about the generated council,
**I want** a guide explaining the generation process,
**So that** I understand what makes each deployment unique.

**Acceptance Criteria:**

**Given** I navigate to the Dynamic Council mini-guide
**When** I read through it
**Then** I find:
- Explanation of council identity components
- How content is tailored to the council theme
- How images are generated to match local character
- Examples of generated content variations
- "Try this" prompts (e.g., "Notice how [theme] appears in service pages")
**And** the guide follows documentation template standards
**And** screenshots show real generated content examples
**And** the guide is linked from the main walkthrough

---

## Epic 6: Polish, Integration & Enhanced Walkthrough

**Goal:** Integrate all features into a cohesive experience with comprehensive documentation, enhanced evidence packs capturing AI feature outcomes, and polished end-to-end user journeys.

**FRs Covered:** FR7 (enhanced)

**Implementation Notes:**
- Updated Walkthrough Overlay integrating all AI feature mini-guides
- New portal pages: Explore, Experiment, Understand, Extend
- Playwright screenshot pipeline for AI feature captures
- **Enhanced Evidence Pack** with AI feature outcomes and ROI metrics
- 30-40 screenshots covering complete AI interactions
- End-to-end journey polish and cross-feature integration testing

### Story 6.1: Integrated Walkthrough Overlay

**As a** council officer exploring the full demo,
**I want** a unified walkthrough that connects all features,
**So that** I experience the complete scenario cohesively.

**Acceptance Criteria:**

**Given** I am logged into Drupal admin
**When** I access the integrated walkthrough
**Then** the overlay:
- Presents a journey covering all 7 AI features
- Links to each AI mini-guide at appropriate points
- Shows overall progress across all features
- Allows jumping to specific feature sections
**And** the walkthrough adapts based on completed sections
**And** completion unlocks the enhanced evidence pack
**And** the experience flows naturally between features

---

### Story 6.2: Portal Explore Page

**As a** council officer discovering the scenario,
**I want** a feature discovery page with live links,
**So that** I can see what's available and jump directly to features.

**Acceptance Criteria:**

**Given** I navigate to the Explore page on the portal
**When** the page loads
**Then** I see:
- Grid of all 7 AI features with icons and descriptions
- "Try it now" buttons linking to Drupal feature locations
- Feature status indicators (requires login, available, etc.)
- Estimated time per feature
**And** features are grouped by category (Content, Accessibility, Generation)
**And** the page shows my deployment's Drupal URL
**And** deep links open correct Drupal admin pages

---

### Story 6.3: Portal Experiment Page

**As a** council officer wanting hands-on experience,
**I want** guided experiments for each AI feature,
**So that** I can learn by doing with specific tasks.

**Acceptance Criteria:**

**Given** I navigate to the Experiment page on the portal
**When** I select a feature to experiment with
**Then** I see:
- Specific task to complete (e.g., "Simplify this planning guidance")
- Sample content or starting point
- Step-by-step instructions
- Success criteria ("You'll know it worked when...")
**And** experiments are sequenced from simple to advanced
**And** I can mark experiments as completed
**And** completion contributes to progress tracking

---

### Story 6.4: Portal Understand Page

**As a** technical decision-maker,
**I want** architecture diagrams and explanations,
**So that** I understand how the AI features work under the hood.

**Acceptance Criteria:**

**Given** I navigate to the Understand page on the portal
**When** the page loads
**Then** I see:
- High-level architecture diagram (CDK → AWS services)
- Component breakdown for each AI feature
- Data flow explanations (e.g., "Image → Nova 2 Omni → Alt-text")
- AWS service icons and names
- Cost breakdown per feature
**And** diagrams are accessible (alt-text, text alternatives)
**And** technical terms link to AWS documentation
**And** the page works without JavaScript (progressive enhancement)

---

### Story 6.5: Portal Extend Page

**As a** council officer ready to move forward,
**I want** "what's next" guidance and resources,
**So that** I know how to proceed after the demo.

**Acceptance Criteria:**

**Given** I navigate to the Extend page on the portal
**When** the page loads
**Then** I see:
- Next steps for different personas (officer, IT, procurement)
- Links to LocalGov Drupal community resources
- AWS partner contact information
- Production deployment considerations
- Security and compliance guidance
- Related NDX scenarios to explore
**And** content is tailored to UK public sector context
**And** resources open in new tabs (external links)
**And** the page includes a feedback/contact form

---

### Story 6.6: AI Feature Screenshot Pipeline

**As a** developer maintaining documentation,
**I want** automated screenshots of all AI feature interactions,
**So that** guides stay current as features evolve.

**Acceptance Criteria:**

**Given** a deployed LocalGov Drupal instance with AI features
**When** the Playwright AI screenshot suite runs
**Then** screenshots are captured for:
- Each AI feature's toolbar/button location
- AI loading states
- AI preview modals with before/after
- Successful AI completions
- All 7 TTS language options
- Translation in action
**And** screenshots total 30-40 covering key interactions
**And** screenshots follow naming convention from Story 2.8
**And** the pipeline runs as part of CI on relevant changes

---

### Story 6.7: Enhanced Evidence Pack

**As a** council officer reporting to senior leadership,
**I want** an evidence pack capturing AI feature outcomes,
**So that** I can demonstrate the value of AI in local government.

**Acceptance Criteria:**

**Given** I have completed experiments with AI features
**When** I generate the enhanced evidence pack
**Then** the PDF includes:
- Everything from basic evidence pack (Story 2.9)
- AI features used and outcomes achieved
- Before/after examples from simplification
- Generated alt-text samples
- Council generation details (name, theme)
- Screenshots of key AI interactions
- ROI talking points for each feature
**And** form fields capture my observations
**And** the pack is branded with GOV.UK styling
**And** generation includes the council's unique identity

---

### Story 6.8: Cross-Feature UI Consistency

**As a** council officer using multiple AI features,
**I want** consistent UI patterns across all features,
**So that** the experience feels cohesive and predictable.

**Acceptance Criteria:**

**Given** I use any AI feature in the system
**When** I interact with loading states, errors, or confirmations
**Then** I experience:
- Consistent loading states across all AI features
- Unified error handling with helpful recovery guidance
- Smooth transitions between portal and Drupal
- Progress persistence across browser sessions
**And** all AI buttons use the same design system components
**And** all modals behave consistently (focus trap, Escape to close)

---

### Story 6.9: Integration Testing & Validation

**As a** developer ensuring quality,
**I want** comprehensive integration testing and validation,
**So that** the demo is production-ready and accessible.

**Acceptance Criteria:**

**Given** all features are implemented
**When** the validation suite runs
**Then** the following pass:
- Cross-feature integration tests
- No broken links or 404 errors
- Accessibility audit (axe-core) shows zero violations
- Performance meets NFR targets (<3s page load)
- Mobile-responsive documentation viewing works
- Print-friendly evidence pack renders correctly
**And** a validation report is generated
**And** CI pipeline enforces these checks

---

## Architecture Decision Records

### ADR-E001: Epic Organization Principle

**Status:** Accepted
**Decision:** User Value Slices over Technical Layers
**Rationale:** Target users (council officers) need to see working demos, not partial infrastructure. Each epic must deliver something they can experience and evaluate.

### ADR-E002: All Features Are Core

**Status:** Accepted
**Decision:** AI features (Epics 3, 4, 5) are core to the scenario, not "growth" features
**Rationale:** The LocalGov Drupal scenario's value proposition IS the AI integration. Without AI features, it's just another Drupal deployment. All 6 epics are required for the complete experience.

### ADR-E003: Walkthrough Documentation Split

**Status:** Accepted
**Decision:** Hybrid approach - Basic walkthrough (Epic 2), mini-guides per AI epic (3, 4, 5), integrated enhanced walkthrough (Epic 6)
**Rationale:** User persona focus group revealed need for earlier documentation. Pre-mortem showed documentation gaps as abandonment risk.

### ADR-E004: Evidence Pack Timing

**Status:** Accepted
**Decision:** Basic Evidence Pack in Epic 2, Enhanced in Epic 6
**Rationale:** Council cabinet members need to report to committees early. Basic pack enables this with deployment success, cost data, and initial impressions. Enhanced pack adds AI feature outcomes.

### ADR-E005: AI Feature Visibility

**Status:** Accepted
**Decision:** Show all 7 AI features immediately (no progressive reveal)
**Rationale:** Users should see the full scope of AI capabilities. Per-feature mini-guides provide sufficient guidance without artificially hiding features.

### ADR-E006: Screenshot Pipeline Timing

**Status:** Accepted
**Decision:** Playwright foundation in Epic 2
**Rationale:** Setting up foundation early (after Drupal is deployed and stable) enables automated captures throughout AI epic development. Catches regressions early.

### ADR-E007: Module Architecture for AI Features

**Status:** Accepted
**Decision:** Single ndx_aws_ai module for all AI features
**Rationale:** Shared AWS SDK client, shared error handling, shared IAM role. Features are tightly related. Architecture document specifies this approach.
