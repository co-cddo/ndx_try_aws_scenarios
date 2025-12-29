# LocalGov Drupal on AWS - Scenario

AI-Enhanced LocalGov Drupal demonstration environment for NDX:Try AWS Scenarios.

## Overview

This scenario deploys a fully functional LocalGov Drupal CMS with 7 integrated AWS AI services:

1. **AI Content Editor** - Bedrock Nova 2 Pro for content assistance
2. **Readability Simplification** - Nova 2 Lite for plain language conversion
3. **Auto Alt-Text** - Nova 2 Omni vision for image descriptions
4. **Listen to Page** - Amazon Polly TTS in 7 languages
5. **Content Translation** - Amazon Translate for multilingual content
6. **PDF to Web** - Amazon Textract for document conversion
7. **Enhanced Search** - Bedrock-powered semantic search

## Project Structure

```
localgov-drupal/
├── cdk/           # CDK infrastructure code
├── docker/        # Container image definition
├── drupal/        # Drupal codebase and modules
├── tests/         # Test suites
└── template.yaml  # Synthesized CloudFormation
```

## Development

### Prerequisites

- Node.js 20+
- AWS CLI configured
- AWS CDK CLI (`npm install -g aws-cdk`)

### Build and Deploy

```bash
# Build CDK
cd cdk
npm install
npm run build

# Synthesize CloudFormation
cdk synth

# Deploy (requires AWS credentials)
cdk deploy
```

### Run Tests

```bash
cd cdk
npm test
```

## Architecture

- **Compute**: AWS Fargate (0.5 vCPU, 1GB RAM)
- **Database**: Aurora Serverless v2 (MySQL)
- **Storage**: Amazon EFS
- **Load Balancer**: Application Load Balancer
- **Container Registry**: ghcr.io (public)

## Cost

Estimated cost: ~$1.80-2.00 per 90-minute demo session.

## License

MIT - See LICENSE in repository root.
