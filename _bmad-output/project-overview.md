# NDX:Try AWS Scenarios - Project Overview

**Date:** 2025-12-23
**Type:** Multi-part (Web + Infrastructure)
**Architecture:** Static Site + Serverless AWS

## Executive Summary

NDX:Try AWS Scenarios is a free platform helping UK councils explore AWS cloud solutions through hands-on evaluation. The project consists of:

1. **Documentation Portal** - An Eleventy-powered static site using GOV.UK Design System that guides councils through deploying and evaluating AWS scenarios
2. **AWS Mini-Applications** - 6 deployable CloudFormation templates demonstrating real AI and cloud capabilities for council use cases

Councils can deploy real AI scenarios in 15 minutes, test with realistic council data, and generate committee-ready evidence packs documenting ROI and security posture.

**Key Business Value:**
- Zero cost to councils (provided by AWS as part of NDX:Try programme)
- One-click deployment via CloudFormation Quick Create
- Realistic UK council sample data
- Committee-ready evidence packs with ROI projections
- Part of LGA AI Hub ecosystem

## Project Classification

- **Repository Type:** Multi-part Monorepo
- **Project Type(s):** web (portal) + infra (AWS scenarios)
- **Primary Language(s):** JavaScript/TypeScript (portal), Python (Lambda functions)
- **Architecture Pattern:** Static Site Generation + Serverless Event-Driven

## Multi-Part Structure

This project consists of 2 distinct parts:

### Documentation Portal

- **Type:** web (Static Site)
- **Location:** `src/`
- **Purpose:** User-facing website that documents scenarios, guides deployment, and generates evidence packs
- **Tech Stack:** Eleventy 3.x, GOV.UK Frontend 5.13, Nunjucks templating, YAML data files, TypeScript utilities

### AWS Scenario Templates

- **Type:** infra (Infrastructure as Code)
- **Location:** `cloudformation/`
- **Purpose:** 6 deployable serverless applications demonstrating AWS services for UK council use cases
- **Tech Stack:** AWS CloudFormation/SAM, Python 3.12 Lambda functions, AWS services (Bedrock, Comprehend, Polly, IoT, QuickSight)

### How Parts Integrate

```
┌─────────────────────────────────────────────────────────────────┐
│                    Documentation Portal                         │
│  (Eleventy + GOV.UK Frontend)                                   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Scenario     │  │ Walkthrough  │  │ Evidence     │           │
│  │ Pages        │  │ Guides       │  │ Packs        │           │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘           │
│         │                 │                                      │
│         ▼                 ▼                                      │
│  ┌──────────────────────────────────────────────┐               │
│  │  scenarios.yaml (Master Data Source)          │               │
│  │  - Deployment URLs → CloudFormation Quick     │               │
│  │  - Success Metrics → Evidence Packs           │               │
│  │  - Screenshots → Walkthrough Guides           │               │
│  └──────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ CloudFormation Quick Create URLs
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Scenario Templates                        │
│  (CloudFormation + Lambda)                                       │
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                   │
│  │ Council    │ │ Planning   │ │ FOI        │                   │
│  │ Chatbot    │ │ AI         │ │ Redaction  │                   │
│  │ (Bedrock)  │ │ (Textract) │ │ (Compreh.) │                   │
│  └────────────┘ └────────────┘ └────────────┘                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                   │
│  │ Smart Car  │ │ Text to    │ │ QuickSight │                   │
│  │ Park (IoT) │ │ Speech     │ │ Dashboard  │                   │
│  └────────────┘ └────────────┘ └────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack Summary

### Portal Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Generator** | Eleventy 3.x | Static site generation |
| **Framework** | GOV.UK Frontend 5.13 | UI components, accessibility |
| **Plugin** | @x-govuk/govuk-eleventy-plugin | GOV.UK integration |
| **Templating** | Nunjucks | Page templates, components |
| **Data** | YAML | Scenario configuration |
| **Testing** | Vitest, Playwright, Pa11y | Unit, E2E, accessibility |
| **Deployment** | GitHub Pages | Static hosting |

### AWS Scenarios Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **IaC** | CloudFormation/SAM | Infrastructure definition |
| **Runtime** | Python 3.12 | Lambda functions |
| **AI** | Amazon Bedrock (Nova Pro) | Conversational AI |
| **NLP** | Amazon Comprehend | PII detection, entity extraction |
| **OCR** | Amazon Textract | Document text extraction |
| **Speech** | Amazon Polly | Text-to-speech |
| **IoT** | AWS IoT Core | Sensor data ingestion |
| **Analytics** | Amazon QuickSight | Dashboards |
| **Storage** | Amazon S3 | Documents, audio files |
| **Compute** | AWS Lambda | Serverless functions |

## Key Features

### Portal Features
- **Scenario Gallery** - Filterable cards with difficulty levels and time estimates
- **One-Click Deployment** - CloudFormation Quick Create URLs with pre-configured parameters
- **Walkthroughs** - Step-by-step guides with annotated screenshots
- **Evidence Packs** - PDF-ready committee reports with ROI projections
- **Accessibility** - WCAG 2.2 AA compliant, GOV.UK Design System
- **Quiz** - Scenario selector based on user needs

### AWS Scenario Features
- **Council Chatbot** - AI-powered resident Q&A using Amazon Nova Pro
- **Planning AI** - Document extraction for planning applications
- **FOI Redaction** - Automated PII detection and redaction
- **Smart Car Park** - IoT parking availability with real-time dashboard
- **Text to Speech** - Accessibility audio generation
- **QuickSight Dashboard** - Council service performance analytics

## Architecture Highlights

### Portal Architecture
- **Static Generation**: All pages pre-built at build time for fast loading
- **Data-Driven**: Single `scenarios.yaml` drives all scenario content
- **Component Library**: Reusable Nunjucks components for consistency
- **Progressive Enhancement**: Works without JavaScript

### AWS Architecture
- **Serverless**: No servers to manage, pay-per-use
- **Event-Driven**: Lambda triggered by HTTP, S3, IoT events
- **Auto-Cleanup**: Resources expire after 2 hours (configurable)
- **Sandbox Isolation**: Each deployment is isolated

## Development Overview

### Prerequisites

- Node.js 20+
- npm (included with Node.js)
- AWS account (for scenario deployment)
- AWS CLI configured (optional, for testing)

### Getting Started

```bash
# Clone repository
git clone https://github.com/co-cddo/ndx_try_aws_scenarios.git
cd ndx_try_aws_scenarios

# Install dependencies
npm install

# Start development server
npm start

# Open http://localhost:8080
```

### Key Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start development server with hot reload |
| `npm run build` | Build production site to `_site/` |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:a11y` | Run accessibility tests (Pa11y) |
| `npm run test:lighthouse` | Run Lighthouse CI |
| `npm run test:playwright` | Run Playwright E2E tests |
| `npm run validate:schema` | Validate scenarios.yaml against schema |

## Repository Structure

```
ndx_try_aws_scenarios/
├── src/                      # Portal source files
│   ├── _data/               # YAML data (scenarios, navigation)
│   ├── _includes/           # Nunjucks templates
│   │   ├── components/      # Reusable UI components
│   │   ├── layouts/         # Page layouts
│   │   └── evidence-pack/   # Evidence pack sections
│   ├── scenarios/           # Scenario detail pages
│   ├── walkthroughs/        # Step-by-step guides
│   ├── next-steps/          # Post-scenario guidance
│   └── lib/                 # TypeScript utilities
├── cloudformation/          # AWS IaC templates
│   ├── scenarios/           # Per-scenario templates
│   │   ├── council-chatbot/
│   │   ├── planning-ai/
│   │   ├── foi-redaction/
│   │   ├── smart-car-park/
│   │   ├── text-to-speech/
│   │   └── quicksight-dashboard/
│   ├── functions/           # Shared Lambda functions
│   └── layers/              # Lambda layers
├── schemas/                 # JSON schemas for validation
├── scripts/                 # Build and utility scripts
├── tests/                   # Test files
├── docs/                    # Project documentation
├── _site/                   # Build output (gitignored)
└── _bmad-output/            # BMAD workflow outputs
```

## Documentation Map

For detailed information, see:

- [index.md](./index.md) - Master documentation index
- [source-tree-analysis.md](./source-tree-analysis.md) - Annotated directory structure
- [architecture-portal.md](./architecture-portal.md) - Portal architecture details
- [architecture-aws-scenarios.md](./architecture-aws-scenarios.md) - AWS architecture details
- [development-guide-portal.md](./development-guide-portal.md) - Portal development workflow
- [development-guide-aws-scenarios.md](./development-guide-aws-scenarios.md) - AWS scenario development

---

_Generated using BMAD Method `document-project` workflow on 2025-12-23_
