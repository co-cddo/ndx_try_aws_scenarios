# NDX:Try AWS Scenarios

[![Build and Deploy](https://github.com/co-cddo/ndx_try_aws_scenarios/actions/workflows/build-deploy.yml/badge.svg)](https://github.com/co-cddo/ndx_try_aws_scenarios/actions/workflows/build-deploy.yml)
[![Docker Build](https://github.com/co-cddo/ndx_try_aws_scenarios/actions/workflows/docker-build.yml/badge.svg)](https://github.com/co-cddo/ndx_try_aws_scenarios/actions/workflows/docker-build.yml)
![GitHub License](https://img.shields.io/github/license/co-cddo/ndx_try_aws_scenarios)

> Zero-cost AWS evaluation platform for UK local government. Try before you buy.

## Overview

NDX:Try AWS Scenarios is a free platform helping UK councils explore AWS cloud solutions through hands-on evaluation. Deploy real AI and cloud scenarios in 15 minutes, test with realistic council data, and generate committee-ready evidence packs.

## Features

- **6 Pre-built Scenarios**: Council Chatbot, Planning AI, FOI Redaction, Smart Car Park, Text to Speech, QuickSight Dashboard
- **One-Click Deployment**: CloudFormation templates for instant AWS provisioning
- **Innovation Sandbox**: Isolated evaluation environment with automatic cleanup
- **Evidence Packs**: Generate committee-ready PDFs with ROI analysis
- **GOV.UK Design System**: Fully accessible (WCAG 2.2 AA compliant)
- **Completely FREE**: Provided by AWS as part of NDX:Try programme

## Technology Stack

- **Static Site Generator**: [Eleventy (11ty)](https://www.11ty.dev/) v3.x
- **CSS Framework**: [GOV.UK Frontend](https://frontend.design-system.service.gov.uk/) v5.13
- **Infrastructure**: AWS CloudFormation templates
- **Testing**: Vitest, Playwright, Pa11y, Lighthouse CI
- **Node.js**: v20+

## Quick Start

### Prerequisites

- Node.js 20 or higher
- npm (included with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/co-cddo/ndx_try_aws_scenarios.git
   cd ndx_try_aws_scenarios
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:8080](http://localhost:8080) in your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start development server with hot reload |
| `npm run build` | Build production site to `_site/` |
| `npm run validate:schema` | Validate scenarios.yaml against JSON schema |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:a11y` | Run accessibility tests (Pa11y) |
| `npm run test:lighthouse` | Run Lighthouse CI |
| `npm run test:playwright` | Run Playwright E2E tests |

## Project Structure

```
ndx_try_aws_scenarios/
├── src/                    # Source files
│   ├── _data/             # Data files (scenarios.yaml, quizConfig.yaml)
│   ├── _includes/         # Nunjucks templates
│   ├── assets/            # CSS, images, static files
│   ├── scenarios/         # Scenario detail pages
│   └── walkthroughs/      # Step-by-step walkthrough pages
├── cloudformation/        # AWS CloudFormation templates
│   └── scenarios/         # Per-scenario deployment templates
├── schemas/               # JSON schemas for validation
├── scripts/               # Build and utility scripts
├── tests/                 # Test files
├── docs/                  # Project documentation
└── eleventy.config.js     # Eleventy configuration
```

## AWS Scenarios

| Scenario | Difficulty | Time | Primary Use Case |
|----------|------------|------|------------------|
| Council Chatbot | Beginner | 15 min | 24/7 AI resident support |
| Planning AI | Intermediate | 30 min | Planning application processing |
| FOI Redaction | Intermediate | 25 min | Automated sensitive data redaction |
| Smart Car Park | Advanced | 45 min | IoT parking availability |
| Text to Speech | Beginner | 15 min | Accessibility audio generation |
| QuickSight Dashboard | Intermediate | 30 min | Service performance analytics |

## Contributing

We welcome contributions from the community. Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `chore:` Maintenance tasks

## Deployment

The site is automatically deployed to GitHub Pages when changes are merged to `main`.

**Production URL**: https://aws.try.ndx.digital.cabinet-office.gov.uk

## Governance

NDX:Try is part of the National Digital Exchange (NDX), which sits within the Government Digital Service (GDS).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- **Enquiries**: [ndx@dsit.gov.uk](mailto:ndx@dsit.gov.uk)
- **GitHub Issues**: For bug reports and feature requests

---

*Part of the National Digital Exchange (NDX) initiative.*
