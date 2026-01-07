---
stepsCompleted: ["topic-discovery", "research-execution", "compilation"]
inputDocuments: []
workflowType: 'research'
lastStep: 3
research_type: 'technical'
research_topic: 'NDX Try AWS Scenarios - LocalGov Drupal & AWS Integration'
research_goals: 'Comprehensive research for showcasing cloud/AWS value through deployable scenarios'
user_name: 'cns'
date: '2025-12-23'
web_research_enabled: true
source_verification: true
---

# Technical Research Report: NDX Try AWS Scenarios

**Date:** 2025-12-23
**Author:** cns
**Research Type:** Technical
**Application:** NDX Try AWS Scenarios - Showcasing Cloud/AWS Value for CDDO

---

## Executive Summary

This comprehensive research document covers 12 interconnected technical topics relevant to the NDX Try AWS Scenarios project. The research focuses on cost optimization, architecture visualization, LocalGov Drupal integration, and AWS best practices for demo/sandbox environments in the UK public sector context.

**Key Findings:**

1. **AWS Fargate Spot** offers up to 70% cost savings for demo workloads with proper interruption handling
2. **CDK diagram tools** (cdk-dia, cdk-graph, cfn-diagram) enable automated architecture documentation
3. **LocalGov Drupal** is trusted by 50+ UK councils with a robust microsites platform
4. **Drupal AI modules** integrate with AWS Bedrock, Comprehend, Rekognition, and other ML services
5. **AWS Graviton** delivers up to 40% better price-performance for PHP workloads
6. **CloudFormation IaC Generator** can import existing resources and generate CDK code
7. **UK Public Sector** has established frameworks (OGVA, G-Cloud) for AWS adoption

---

## Table of Contents

1. [AWS Fargate Spot for Container Workloads](#1-aws-fargate-spot-for-container-workloads)
2. [AWS Architecture Diagram Generation Tools](#2-aws-architecture-diagram-generation-tools)
3. [LocalGov Drupal User Guides and Documentation](#3-localgov-drupal-user-guides-and-documentation)
4. [Drupal AI Integrations with AWS Services](#4-drupal-ai-integrations-with-aws-services)
5. [CDK Diagram Generation and Documentation Tools](#5-cdk-diagram-generation-and-documentation-tools)
6. [ECS/Fargate Best Practices for CMS Workloads](#6-ecsfargate-best-practices-for-cms-workloads)
7. [UK Public Sector AWS Case Studies](#7-uk-public-sector-aws-case-studies)
8. [AWS Cost Optimization for Demo Environments](#8-aws-cost-optimization-for-demo-environments)
9. [AWS Graviton for PHP Workloads](#9-aws-graviton-for-php-workloads)
10. [CloudFormation IaC Generator for Existing Infrastructure](#10-cloudformation-iac-generator-for-existing-infrastructure)
11. [Drupal Multisite and Microsite Patterns on AWS](#11-drupal-multisite-and-microsite-patterns-on-aws)
12. [AWS Well-Architected for Demo/Sandbox Environments](#12-aws-well-architected-for-demosandbox-environments)

---

## 1. AWS Fargate Spot for Container Workloads

### Overview

AWS Fargate Spot allows running interrupt-tolerant container workloads on spare AWS capacity at significantly reduced costs—up to **70% lower** than regular Fargate pricing.

### Cost Savings Analysis

| Configuration | Regular Fargate | Fargate Spot | Savings |
|---------------|-----------------|--------------|---------|
| 1 vCPU, 1GB (eu-west-1) | $32.34/month | $9.96/month | ~69% |
| 4 vCPU, 16GB | ~$160/month | ~$48/month | ~70% |

### How It Works

- Containers run on spare AWS capacity at reduced rates
- **2-minute warning** provided before capacity reclamation
- Spot capacity may be temporarily unavailable during high demand
- ECS services automatically attempt to restart tasks when capacity returns

### Platform Support

- Available for **Amazon ECS** workloads only (not EKS)
- Supports **Linux** operating systems
- Supports **x86** and **ARM64** (Graviton) architectures

### Capacity Provider Strategy

```yaml
capacityProviderStrategy:
  - capacityProvider: FARGATE
    weight: 1
    base: 1  # Minimum guaranteed tasks
  - capacityProvider: FARGATE_SPOT
    weight: 3  # 3x more Spot tasks
```

### Best Practices for Demo Environments

1. **Use mixed strategies**: Maintain 1 on-demand task as base, scale with Spot
2. **Implement graceful shutdown**: Handle SIGTERM within 2-minute window
3. **Stateless design**: Store state in external services (RDS, EFS, ElastiCache)
4. **Multi-AZ deployment**: Improve Spot availability across zones
5. **Health checks**: Configure appropriate deregistration delays

### Application to NDX Try Scenarios

For demo environments that can tolerate brief interruptions, Fargate Spot is ideal:
- Council chatbot demos
- Planning AI document processing
- FOI redaction demonstrations

**Sources:**
- [ElasticScale - AWS Fargate Spot Cost Optimization](https://elasticscale.com/blog/aws-fargate-spot-cost-optimization-with-managed-container-workloads/)
- [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/)
- [CloudChipr - Fargate Pricing 2025](https://cloudchipr.com/blog/aws-fargate-pricing)
- [AWS Containers Blog - Cost Optimization Checklist](https://aws.amazon.com/blogs/containers/cost-optimization-checklist-for-ecs-fargate/)

---

## 2. AWS Architecture Diagram Generation Tools

### Overview

Multiple tools exist for automatically generating architecture diagrams from AWS CDK and CloudFormation code, eliminating manual diagram maintenance.

### Tool Comparison

| Tool | Input | Output | Abstraction Level | Language Support |
|------|-------|--------|-------------------|------------------|
| **cdk-dia** | CDK code | Graphviz DOT | L1/L2 constructs | TypeScript/JS |
| **cdk-graph** | CDK code | JSON graph | Configurable | All CDK languages |
| **CdkGraphDiagramPlugin** | CDK code | PNG/SVG | Filtered views | All CDK languages |
| **cfn-diagram** | CloudFormation | vis.js/draw.io/ASCII | All resources | N/A |
| **cdk2d2** | CDK code | D2 diagrams | Annotated constructs | All CDK languages |
| **InfViz** | AWS Account/CFN | Visual diagrams | Auto-discovered | N/A |

### cdk-dia

Diagrams CDK-provisioned infrastructure using Graphviz dot language:

```bash
npx cdk-dia
```

**Features:**
- Follows CDK Construct Level 1 and 2 abstractions
- Supports customizers/decorators for diagram tweaking
- Achieves better abstraction through collapsing

### cdk-graph (AWS PDK)

Part of the AWS Project Development Kit:

```typescript
import { CdkGraph } from '@aws/pdk/cdk-graph';

const graph = new CdkGraph(app, {
  plugins: [new CdkGraphDiagramPlugin()]
});
```

**Features:**
- Synthesizes serialized graph from CDK source
- Runtime interface for graph interaction
- Plugin framework for extensibility

### CdkGraphDiagramPlugin

```typescript
import { CdkGraphDiagramPlugin } from '@aws/pdk/cdk-graph-plugin-diagram';

new CdkGraphDiagramPlugin({
  defaults: {
    filterPlan: {
      preset: FilterPreset.COMPACT
    }
  }
});
```

**Features:**
- Multiple diagram configurations
- Extensive filtering options (explicit, static, regex-based)
- Compact and detailed presets

### cfn-diagram

```bash
npx cfn-dia html -t template.yaml
npx cfn-dia draw.io -t template.yaml
npx cfn-dia ascii -t template.yaml
```

**Features:**
- Visualizes CloudFormation/SAM/CDK stacks
- Multiple output formats (vis.js, draw.io, ASCII art)
- Works with existing templates

### AWS Infrastructure Composer

AWS's native visual tool:
- Available in CloudFormation console
- Integrates with VS Code via AWS Toolkit
- CodeWhisperer integration for suggestions
- Visual drag-and-drop editing

**Sources:**
- [GitHub - pistazie/cdk-dia](https://github.com/pistazie/cdk-dia)
- [AWS PDK - CDK Graph](https://aws.github.io/aws-pdk/developer_guides/cdk-graph/index.html)
- [AWS PDK - Diagram Plugin](https://aws.github.io/aws-pdk/developer_guides/cdk-graph-plugin-diagram/index.html)
- [GitHub - mhlabs/cfn-diagram](https://github.com/mhlabs/cfn-diagram)
- [GitHub - megaproaktiv/cdk2d2](https://github.com/megaproaktiv/cdk2d2)

---

## 3. LocalGov Drupal User Guides and Documentation

### Overview

LocalGov Drupal is a Drupal distribution designed by and for UK local councils. It's trusted by **over 50 councils** of all sizes throughout the UK.

### Key Resources

| Resource | URL | Purpose |
|----------|-----|---------|
| Official Website | https://localgovdrupal.org/ | Community hub |
| Documentation | https://docs.localgovdrupal.org/ | Technical guides |
| Microsites Docs | https://docs.localgovdrupal.org/microsites/ | Microsites platform |
| Drupal.org Project | https://www.drupal.org/project/localgov_microsites | Module page |
| GitHub | https://github.com/localgovdrupal | Source code |

### LocalGov Drupal CMS Features

- **GOV.UK Design System** integration for consistent user experience
- **WCAG 2.1/2.2 accessibility** compliance built-in
- **Service pages** optimized for council services
- **News and events** management
- **Directories** for locations, contacts, and facilities
- **Step-by-step guides** for complex processes

### Microsites Platform

The LocalGov Microsites platform enables councils to manage multiple branded sites from a single Drupal installation:

**Architecture:**
- Single codebase and database ("control site")
- Each microsite is a group entity with its own content and users
- Associated with unique domain names

**Installation:**
```bash
composer create-project --stability stable \
  localgovdrupal/localgov_microsites_project:^4.0 \
  MY_PROJECT --no-install
```

**Key Benefits:**
- Reduced hosting costs (single infrastructure)
- Centralized governance and oversight
- Consistent branding with customizable themes
- Simplified user management
- Easy microsite creation/deletion

**Creating a Microsite:**
1. Log into control site as controller user
2. Navigate to Microsites > Add Microsite
3. Follow wizard to name and set domain
4. Configure theme colors and typography
5. Assign editors and content creators

### Funding and Governance

LocalGov Drupal was initially funded by the **Local Digital Fund** from the Department for Levelling Up, Housing and Communities (DLUHC).

**Sources:**
- [LocalGov Drupal - Official Site](https://localgovdrupal.org/)
- [LocalGov Drupal Docs - Microsites](https://docs.localgovdrupal.org/microsites/)
- [Drupal.org - LocalGov Microsites](https://www.drupal.org/project/localgov_microsites)
- [Webcurl - LocalGov Microsites Benefits](https://www.webcurl.co.uk/blog/one-platform-many-sites-perks-using-localgov-drupals-microsites-platform)
- [Local Digital - LocalGov Drupal Beta](https://www.localdigital.gov.uk/funded-project/localgov-drupal-beta/)

---

## 4. Drupal AI Integrations with AWS Services

### Overview

Drupal's AI ecosystem integrates with 48+ AI platforms, including comprehensive AWS service support through dedicated modules.

### Core Drupal AI Module

The main **AI (Artificial Intelligence)** module provides a unified interface:

```
drupal/ai
```

**Supported AWS Providers:**
- Amazon Bedrock
- Azure (for comparison)
- Other cloud providers

### AWS Bedrock Provider Module

**Module:** `ai_provider_aws_bedrock`

**Features:**
- Integrates all AWS Bedrock models with Drupal
- Supports text generation and image embedding
- Compatible with Claude, Amazon Titan, Stable Diffusion
- Text-to-image generation
- Multimodal embeddings

**Supported Models:**
- Anthropic Claude (all versions)
- Amazon Titan Text and Embeddings
- Stable Diffusion XL
- Meta Llama 2
- Cohere Command
- AI21 Labs Jurassic

### AWS Bedrock Chat Module

**Module:** `aws_bedrock_chat`

**Features:**
- AJAX-powered real-time chat interface
- Knowledge base integration (Retrieve and Generate)
- Multiple authentication methods:
  - AWS Profile
  - Access/Secret Keys
  - Environment Variables
- Powered by Claude models

### Other AWS AI Service Integrations

| AWS Service | Use Case in Drupal | Integration Method |
|-------------|-------------------|-------------------|
| **Amazon Comprehend** | Sentiment analysis, entity extraction, topic classification | Custom module + AWS SDK |
| **Amazon Rekognition** | Image moderation, object detection, facial analysis | Custom module + AWS SDK |
| **Amazon Polly** | Text-to-speech for accessibility | Custom module + AWS SDK |
| **Amazon Transcribe** | Speech-to-text for media | Custom module + AWS SDK |
| **Amazon Textract** | Document text extraction | Custom module + AWS SDK |
| **Amazon Kendra** | Intelligent search | Custom module + AWS SDK |

### Implementation Requirements

```bash
# Add AWS SDK
composer require aws/aws-sdk-php

# Add AI module
composer require drupal/ai

# Add Bedrock provider
composer require drupal/ai_provider_aws_bedrock
```

**IAM Configuration:**
Create IAM user with permissions for:
- `bedrock:InvokeModel`
- `comprehend:*` (for Comprehend)
- `rekognition:*` (for Rekognition)
- `polly:*` (for Polly)

### Application to NDX Try Scenarios

| Scenario | AWS AI Service | Integration |
|----------|---------------|-------------|
| Council Chatbot | Amazon Bedrock (Claude) | aws_bedrock_chat module |
| Planning AI | Amazon Textract + Comprehend | Custom extraction pipeline |
| FOI Redaction | Amazon Comprehend PII | Entity detection + redaction |
| Accessibility | Amazon Polly | Text-to-speech widgets |

**Sources:**
- [Drupal.org - AWS Bedrock Provider](https://www.drupal.org/project/ai_provider_aws_bedrock)
- [Drupal.org - AWS Bedrock Chat](https://www.drupal.org/project/aws_bedrock_chat)
- [Drupal.org - AI Module](https://www.drupal.org/project/ai)
- [The Drop Times - 30 Drupal AI Modules](https://www.thedroptimes.com/50956/30-drupal-ai-framework-and-integration-modules-you-should-know)
- [Omi AI - Amazon AI with Drupal](https://www.omi.me/blogs/ai-integrations/how-to-integrate-amazon-ai-with-drupal)

---

## 5. CDK Diagram Generation and Documentation Tools

### Overview

AWS CDK provides multiple approaches for generating architecture diagrams and documentation from infrastructure code.

### AWS Project Development Kit (PDK)

The AWS PDK extends CDK with enterprise features including diagram generation.

**Installation:**
```bash
npm install @aws/pdk
```

### CdkGraph

Core graph synthesis library:

```typescript
import { CdkGraph } from '@aws/pdk/cdk-graph';

const app = new App();
// ... define stacks ...

const graph = new CdkGraph(app, {
  plugins: []
});

app.synth();
```

**Output:** Serialized JSON graph of all constructs and relationships.

### CdkGraphDiagramPlugin

Generates visual diagrams from the graph:

```typescript
import { CdkGraph } from '@aws/pdk/cdk-graph';
import {
  CdkGraphDiagramPlugin,
  FilterPreset
} from '@aws/pdk/cdk-graph-plugin-diagram';

const graph = new CdkGraph(app, {
  plugins: [
    new CdkGraphDiagramPlugin({
      defaults: {
        filterPlan: {
          preset: FilterPreset.COMPACT
        }
      },
      diagrams: [
        {
          name: 'overview',
          title: 'System Overview',
          filterPlan: { preset: FilterPreset.COMPACT }
        },
        {
          name: 'detailed',
          title: 'Detailed Architecture',
          filterPlan: { preset: FilterPreset.NONE }
        }
      ]
    })
  ]
});
```

**Filter Presets:**
- `COMPACT` - Collapsed, high-level view
- `FOCUS_xxx` - Specific resource type focus
- `NONE` - All resources visible
- Custom regex patterns

### TypeDoc Integration

For API documentation generation:

```bash
npm install typedoc typedoc-plugin-markdown
npx typedoc --out docs src/
```

**CDK-Specific Configuration:**
```json
{
  "entryPoints": ["lib/"],
  "out": "docs/api",
  "plugin": ["typedoc-plugin-markdown"],
  "readme": "none"
}
```

### Automated Documentation Pipeline

```yaml
# .github/workflows/docs.yml
name: Generate Documentation
on:
  push:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Synthesize CDK
        run: npx cdk synth

      - name: Generate diagrams
        run: |
          npx cdk-dia
          # or with PDK
          npm run build

      - name: Generate API docs
        run: npx typedoc

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

### Limitations

- L3 constructs (like AWS Service Catalog) may break graph creation
- SAM templates with macros not supported by cdk migrate
- Generated constructs are L1 type (room for modernization)

**Sources:**
- [AWS PDK - CDK Graph](https://aws.github.io/aws-pdk/developer_guides/cdk-graph/index.html)
- [AWS PDK - Diagram Plugin](https://aws.github.io/aws-pdk/developer_guides/cdk-graph-plugin-diagram/index.html)
- [Martin Mueller - CDK-dia](https://martinmueller.dev/cdk-dia-eng/)
- [DEV.to - AWS Architectural Diagrams with PDK](https://dev.to/zirkonium88/aws-architectural-diagrams-on-a-commit-base-using-aws-pdk-diagram-plugin-with-python-3b84)

---

## 6. ECS/Fargate Best Practices for CMS Workloads

### Overview

Running PHP-based CMS workloads like Drupal on ECS Fargate requires specific architectural patterns for persistence, caching, and scaling.

### Reference Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Amazon CloudFront                       │
│                    (CDN + SSL Termination)                   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                Application Load Balancer                     │
│                      (Multi-AZ)                              │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    ECS Fargate Cluster                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ PHP-FPM     │  │ PHP-FPM     │  │ PHP-FPM     │          │
│  │ + nginx     │  │ + nginx     │  │ + nginx     │          │
│  │ (Graviton)  │  │ (Graviton)  │  │ (Graviton)  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
         │                  │                    │
┌────────┴──────────────────┴────────────────────┴───────────┐
│                     Amazon EFS                               │
│            (Shared Drupal files, modules, themes)            │
└─────────────────────────────────────────────────────────────┘
         │                  │
┌────────┴─────────┐  ┌────┴──────────────────────────────────┐
│ Amazon Aurora    │  │      Amazon ElastiCache               │
│ Serverless v2    │  │         (Redis)                       │
│ (MySQL)          │  │    Session + Object Cache             │
└──────────────────┘  └───────────────────────────────────────┘
```

### Task Definition Patterns

**Multi-Container Task:**
```yaml
taskDefinition:
  family: drupal
  cpu: 1024  # 1 vCPU
  memory: 2048  # 2 GB
  runtimePlatform:
    cpuArchitecture: ARM64
    operatingSystemFamily: LINUX
  containerDefinitions:
    - name: nginx
      image: nginx:alpine
      portMappings:
        - containerPort: 80
      dependsOn:
        - containerName: php-fpm
          condition: START

    - name: php-fpm
      image: drupal:10-fpm
      mountPoints:
        - sourceVolume: drupal-files
          containerPath: /var/www/html/sites/default/files

  volumes:
    - name: drupal-files
      efsVolumeConfiguration:
        fileSystemId: fs-xxxxxxxx
        transitEncryption: ENABLED
```

### EFS Configuration

**Performance Mode:** General Purpose (for most CMS workloads)
**Throughput Mode:** Elastic (auto-scales with usage)

**OPcache Optimization:**
```ini
; php.ini optimizations for EFS
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=10000
opcache.revalidate_freq=60
opcache.validate_timestamps=0  ; Disable in production
opcache.save_comments=1
```

### Caching Strategy

**ElastiCache Redis Configuration:**
```php
// settings.php
$settings['redis.connection']['host'] = getenv('REDIS_HOST');
$settings['redis.connection']['port'] = 6379;
$settings['cache']['default'] = 'cache.backend.redis';
$settings['cache']['bins']['render'] = 'cache.backend.redis';
$settings['cache']['bins']['dynamic_page_cache'] = 'cache.backend.redis';
```

### Auto-Scaling

**Target Tracking:**
```yaml
scalableTarget:
  serviceNamespace: ecs
  resourceId: service/cluster-name/service-name
  scalableDimension: ecs:service:DesiredCount
  minCapacity: 2
  maxCapacity: 10

scalingPolicy:
  policyType: TargetTrackingScaling
  targetTrackingScalingPolicyConfiguration:
    targetValue: 75.0
    predefinedMetricSpecification:
      predefinedMetricType: ECSServiceAverageCPUUtilization
    scaleInCooldown: 300
    scaleOutCooldown: 60
```

### Health Checks

```yaml
healthCheck:
  command:
    - CMD-SHELL
    - curl -f http://localhost/health || exit 1
  interval: 30
  timeout: 5
  retries: 3
  startPeriod: 60
```

**Sources:**
- [AWS Blog - Serverless Drupal with Fargate and EFS](https://aws.amazon.com/blogs/storage/deploy-serverless-drupal-applications-using-aws-fargate-and-amazon-efs/)
- [GitHub - aws-samples/aws-refarch-drupal](https://github.com/aws-samples/aws-refarch-drupal)
- [AWS EFS - Drupal Reference Architecture](https://aws.amazon.com/efs/resources/aws-refarch-drupal/)
- [AWS Docs - ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)

---

## 7. UK Public Sector AWS Case Studies

### Overview

The UK public sector has embraced AWS cloud adoption following the 2013 "Cloud First" policy. Multiple frameworks and agreements facilitate procurement.

### Government Frameworks

| Framework | Description | Benefit |
|-----------|-------------|---------|
| **OGVA** (One Government Value Agreement) | MoU between Crown Commercial Service and AWS | Accelerated adoption, cost savings |
| **G-Cloud** | Digital Marketplace framework | Simplified procurement |
| **Digital Outcomes** | Agile delivery framework | Project-based engagement |

### Local Government Case Studies

**Hackney Council:**
- Ran core applications on AWS Cloud **4x faster**
- Achieved **50% cost reduction** vs on-premises
- Real-time monitoring and logging
- Scale IT resources based on demand

**Council AI Use Cases:**
- Spotting housing fraud through data analytics
- Identifying at-risk individuals
- Data-driven service improvements

### NHS Case Studies

**NHS e-Referral Service:**
- Completed migration to AWS cloud
- Supports national healthcare referral system

**NHS 111 Directory of Services (DoS):**
- Cloud-based service directory
- Supports 1.8 million+ population regions

**Royal Orthopaedic Hospital NHS Foundation Trust:**
- First in Europe to deploy Edison True PACS on cloud
- Intelligent productivity tools for radiologists

**Healthier Lancashire and South Cumbria ICS:**
- Scaled AWS platform rapidly
- Nexus Intelligence interactive health application
- Serves 1.8 million people

**NHS Business Services Authority (NHSBSA):**
- Deployed 80+ applications within 5 months
- Secure AWS environments with N3 connectivity
- Reduced deployment times and manual intervention

### Central Government Case Studies

**Environment Agency - NaFRA2:**
- World's first cloud-based National Flood Risk Assessment
- Interactive system for current and future flood risk
- Covers rivers, sea, and surface water for England

**Department for Transport (DfT):**
- Migrated from inefficient on-premise systems
- Manages road, rail, aviation systems

**Home Office Immigration Technology:**
- Reduced cloud costs by **40%**
- Optimized spending with proper governance

### Cloud Centre of Excellence

NHS Digital's CCoE promotes best practice approach:
- Drives cloud service adoption
- Shares knowledge and patterns
- Establishes governance frameworks

**Sources:**
- [NHS Digital - AWS Case Studies](https://digital.nhs.uk/services/cloud-centre-of-excellence/health-care-case-studies/aws-case-studies)
- [AWS - UK Innovation Stories](https://aws.amazon.com/government-education/worldwide/uk/innovation-stories/)
- [AWS - UK Public Sector](https://aws.amazon.com/government-education/worldwide/uk/)
- [Arcus Global - NHSBSA Case Study](https://www.arcusglobal.com/news/aws-case-study-nhsbsa)
- [GOV.UK - Cloud Technology](https://www.gov.uk/government/collections/cloud-technology-and-the-public-sector)

---

## 8. AWS Cost Optimization for Demo Environments

### Overview

Demo and sandbox environments present unique cost optimization opportunities through scheduling, right-sizing, and automated resource management.

### Scheduled Scaling for ECS Fargate

**Dev Environment Schedule (Mon-Fri, 7:30 AM - 6:00 PM):**

```yaml
# Scale down at 6 PM
scheduledActions:
  - scheduledActionName: scale-down-evening
    schedule: cron(0 18 ? * MON-FRI *)
    scalableTargetAction:
      minCapacity: 0
      maxCapacity: 0

  # Scale up at 7:30 AM
  - scheduledActionName: scale-up-morning
    schedule: cron(30 7 ? * MON-FRI *)
    scalableTargetAction:
      minCapacity: 1
      maxCapacity: 3
```

### CDK Implementation

```typescript
import { Schedule } from 'aws-cdk-lib/aws-applicationautoscaling';

// Scale to zero at 6 PM weekdays
scaling.scaleOnSchedule('ScaleDownEvening', {
  schedule: Schedule.cron({ hour: '18', minute: '0', weekDay: 'MON-FRI' }),
  minCapacity: 0,
  maxCapacity: 0
});

// Scale up at 7:30 AM weekdays
scaling.scaleOnSchedule('ScaleUpMorning', {
  schedule: Schedule.cron({ hour: '7', minute: '30', weekDay: 'MON-FRI' }),
  minCapacity: 1,
  maxCapacity: 3
});
```

### Aurora Serverless v2

**Auto-Pause Configuration:**
- Minimum ACUs: 0.5 (or pause completely with v1)
- Maximum ACUs: 4-8 for demo workloads
- Auto-scales within seconds

```typescript
const cluster = new rds.DatabaseCluster(this, 'Database', {
  engine: rds.DatabaseClusterEngine.auroraMysql({
    version: rds.AuroraMysqlEngineVersion.VER_3_04_0
  }),
  serverlessV2MinCapacity: 0.5,
  serverlessV2MaxCapacity: 4,
  writer: rds.ClusterInstance.serverlessV2('writer')
});
```

### SageMaker Inference Scale-to-Zero

New 2024 feature allows complete scale-down:
- Endpoints scale to zero during inactivity
- Eliminates compute costs during idle periods
- Ideal for demo AI/ML workloads

### Instance Scheduler Solution

AWS provides the **Instance Scheduler on AWS** solution:
- Automates start/stop of EC2 and RDS instances
- Tag-based scheduling
- Multiple schedule support
- CloudFormation deployment

### Cost Optimization Checklist

| Strategy | Potential Savings | Complexity |
|----------|------------------|------------|
| Scheduled shutdown (non-prod) | 60-70% | Low |
| Right-sizing with Compute Optimizer | 20-40% | Low |
| Fargate Spot for demos | 50-70% | Medium |
| Reserved capacity/Savings Plans | Up to 72% | Medium |
| Aurora Serverless auto-pause | Variable | Low |
| S3 Intelligent-Tiering | Variable | Low |

### Demo Environment Best Practices

1. **Start small**: Implement scheduled shutdowns first
2. **Tag everything**: Enable cost allocation tags
3. **Monitor**: Use Cost Explorer and budgets
4. **Automate cleanup**: Periodic resource purging
5. **Use ephemeral resources**: Lambda for event processing

**Sources:**
- [AWS Community - ECS Fargate Scheduled Scaling](https://community.aws/content/2ugJNYikdHVDOK4DUtnqsrymzpL/ecs-fargate-cost-optimization-with-scheduled-scaling)
- [FinOps - EC2 Autoscaling Optimization](https://www.finops.org/wg/cost-optimization-for-aws-ec2-autoscaling/)
- [AWS Blog - re:Invent 2024 Cost Optimization](https://aws.amazon.com/blogs/aws-cloud-financial-management/reinvent-2024-cost-optimization-highlights-that-you-were-not-expecting/)
- [CloudKeeper - Auto Scaling Best Practices](https://www.cloudkeeper.com/insights/blogs/aws-auto-scaling-cost-optimization-practices-strategies)

---

## 9. AWS Graviton for PHP Workloads

### Overview

AWS Graviton processors (ARM64) deliver significant price-performance improvements for PHP workloads, with up to **40% better price-performance** than x86 equivalents.

### PHP Performance Improvements

| PHP Version | Improvement on ARM64 | Key Optimization |
|-------------|---------------------|------------------|
| PHP 7.4 | **37% faster** vs PHP 7.3 | Zend optimizer enabled |
| PHP 8.0 | **16.5%** additional gains | JIT compiler support |
| PHP 8.1+ | Continued improvements | LuaJIT ARM64 optimization |

### Zend Optimizer for ARM

Before PHP 7.4, the Zend optimizer was not enabled for ARM. AWS worked with the PHP community to:
- Enable Zend optimizer on ARM64
- Improve performance by **up to 30%** on micro-benchmarks
- Tune JIT compiler for Graviton processors

### Graviton Generations

| Generation | Instance Types | Key Features |
|------------|---------------|--------------|
| Graviton2 | C6g, M6g, R6g, T4g | Initial ARM64 support |
| Graviton3 | C7g, M7g, R7g | 25% better performance |
| Graviton4 | C8g, M8g, R8g | 30% better for web apps |

### Price-Performance Comparison

**Graviton Benefits:**
- Up to **20% lower cost** than comparable x86 instances
- Up to **60% less energy** consumption
- Up to **40% better price-performance**

**Fargate Graviton:**
- ARM64 tasks available
- Same Spot pricing benefits
- Multi-architecture container support

### Multi-Architecture Docker Builds

```dockerfile
# Dockerfile
FROM --platform=$TARGETPLATFORM php:8.2-fpm-alpine

# Platform-agnostic build
RUN apk add --no-cache \
    nginx \
    supervisor

COPY . /var/www/html
```

**Building:**
```bash
# Build for both architectures
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t myrepo/drupal:latest \
  --push .
```

### Lambda Graviton

```typescript
new lambda.Function(this, 'Handler', {
  runtime: lambda.Runtime.NODEJS_20_X,
  architecture: lambda.Architecture.ARM_64,  // Graviton
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda')
});
```

**Benefits:**
- **34% better price-performance**
- **20% lower duration charges**
- Same functionality

### Fargate Graviton Configuration

```typescript
const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
  cpu: 1024,
  memoryLimitMiB: 2048,
  runtimePlatform: {
    cpuArchitecture: ecs.CpuArchitecture.ARM64,
    operatingSystemFamily: ecs.OperatingSystemFamily.LINUX
  }
});
```

### Benchmark Results (2024)

From AWS Graviton4 benchmarks:
- Matches Intel Sapphire Rapids at same vCPU
- Competes with AMD EPYC Genoa
- **40% improvement** for database workloads
- **40%+ improvement** for Java applications
- **30% improvement** for web applications

**Sources:**
- [AWS Blog - PHP Performance on Graviton2](https://aws.amazon.com/blogs/compute/improving-performance-of-php-for-arm64-and-impact-on-amazon-ec2-m6g-instances/)
- [AWS EC2 Graviton](https://aws.amazon.com/ec2/graviton/)
- [GitHub - aws/aws-graviton-getting-started](https://github.com/aws/aws-graviton-getting-started)
- [Phoronix - Graviton4 Benchmarks](https://www.phoronix.com/review/aws-graviton4-benchmarks)
- [MGT Commerce - Graviton2 Overview](https://www.mgt-commerce.com/blog/aws-graviton2-a-game-changer-for-the-cloud-industry/)

---

## 10. CloudFormation IaC Generator for Existing Infrastructure

### Overview

AWS CloudFormation IaC Generator enables importing existing AWS resources into CloudFormation templates and CDK applications, eliminating weeks of manual effort.

### Key Features

- Scan AWS account and catalogue manually created resources
- Generate templates for **500+ resource types**
- Recommendations for related resources (e.g., bucket policies for S3)
- Direct import into CloudFormation stacks
- CDK migration via `cdk migrate` command

### Workflow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Scan      │────>│   Generate   │────>│   Import    │
│   Account   │     │   Template   │     │   to CFN    │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           v
                    ┌──────────────┐
                    │  CDK Migrate │
                    │   (optional) │
                    └──────────────┘
```

### Using IaC Generator

**Console:**
1. Open CloudFormation Console
2. Select "IaC generator" in navigation
3. Start resource scan
4. Select resources to include
5. Generate template
6. Review and import

**CLI:**
```bash
# Start scan
aws cloudformation start-resource-scan

# List scanned resources
aws cloudformation list-resource-scan-resources \
  --resource-scan-id <scan-id>

# Create template
aws cloudformation create-generated-template \
  --generated-template-name my-template \
  --resources ResourceType=AWS::S3::Bucket,ResourceIdentifier={BucketName=my-bucket}
```

### CDK Migrate

Convert CloudFormation to CDK with a single command:

```bash
# From template file
cdk migrate --stack-name MyStack \
  --from-path template.yaml \
  --language typescript

# From deployed stack
cdk migrate --stack-name MyStack \
  --from-stack \
  --language typescript
```

**Output:**
- CDK project directory
- TypeScript/Python/Java code
- Package dependencies
- Ready for `cdk deploy`

### Generated Code Example

```typescript
// Generated L1 construct
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class MyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new s3.CfnBucket(this, 'MyBucket', {
      bucketName: 'my-existing-bucket',
      versioningConfiguration: {
        status: 'Enabled'
      },
      publicAccessBlockConfiguration: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true
      }
    });
  }
}
```

### Limitations

1. Generated constructs are **L1 type** (CfnXxx)
2. SAM templates with `AWS::Serverless-2016-10-31` macro not supported
3. Some resource relationships may need manual adjustment
4. Complex nested stacks require additional work

### Best Practices

1. **Start with small resource groups**: Test with 5-10 resources first
2. **Review generated templates**: Check for hardcoded values
3. **Parameterize**: Convert hardcoded values to parameters/variables
4. **Upgrade to L2**: Manually convert L1 to L2 constructs over time
5. **Test in isolation**: Deploy to test account before production

**Sources:**
- [InfoQ - CDK Migrate GA](https://www.infoq.com/news/2024/02/aws-cdk-migrate-ga/)
- [AWS Docs - IaC Generator](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/generate-IaC.html)
- [The Burning Monk - First Impressions](https://theburningmonk.com/2024/02/first-impressions-of-cloudformations-iac-generator-and-cdk-migrate/)
- [AWS Blog - CDK Migrate Announcement](https://aws.amazon.com/blogs/devops/announcing-cdk-migrate-a-single-command-to-migrate-to-the-aws-cdk/)
- [AWS What's New - IaC Generator Launch](https://aws.amazon.com/about-aws/whats-new/2024/02/aws-cloudformation-templates-cdk-apps-minutes/)

---

## 11. Drupal Multisite and Microsite Patterns on AWS

### Overview

Drupal supports multiple approaches for running many sites from shared infrastructure, with AWS providing scalable storage and compute options.

### Architecture Patterns

#### Pattern 1: LocalGov Microsites (Recommended for UK Councils)

Single codebase, single database with group-based site isolation:

```
┌─────────────────────────────────────────────────────────────┐
│                    Control Site (Drupal)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │Microsite│  │Microsite│  │Microsite│  │Microsite│        │
│  │   A     │  │   B     │  │   C     │  │   D     │        │
│  │ (Group) │  │ (Group) │  │ (Group) │  │ (Group) │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                    Single Aurora Database
```

**Benefits:**
- Lowest operational overhead
- Centralized updates and security patches
- Consistent governance

#### Pattern 2: Drupal Multisite (sites.php)

Multiple sites sharing codebase but separate databases:

```
┌─────────────────────────────────────────────────────────────┐
│                    Shared Drupal Codebase                    │
│                      (ECS Fargate + EFS)                     │
├─────────────────────────────────────────────────────────────┤
│  sites/site-a.example.com/  │  sites/site-b.example.com/    │
│  sites/site-c.example.com/  │  sites/site-d.example.com/    │
└─────────────────────────────────────────────────────────────┘
         │                              │
    ┌────┴────┐                    ┌────┴────┐
    │ DB: A   │                    │ DB: B   │
    └─────────┘                    └─────────┘
```

**Configuration (sites.php):**
```php
$sites['site-a.example.com'] = 'site-a';
$sites['site-b.example.com'] = 'site-b';
```

#### Pattern 3: Multi-Tenant with Separate Containers

Complete isolation per tenant:

```
┌─────────────────────────────────────────────────────────────┐
│                    ECS Fargate Cluster                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Tenant A       │  │  Tenant B       │                   │
│  │  Service        │  │  Service        │                   │
│  │  ┌───────────┐  │  │  ┌───────────┐  │                   │
│  │  │ Drupal    │  │  │  │ Drupal    │  │                   │
│  │  │ Container │  │  │  │ Container │  │                   │
│  │  └───────────┘  │  │  └───────────┘  │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### EFS for Shared Files

**Mount Configuration:**
```yaml
volumes:
  - name: drupal-shared
    efsVolumeConfiguration:
      fileSystemId: fs-xxxxxxxx
      rootDirectory: /drupal
      transitEncryption: ENABLED
      authorizationConfig:
        accessPointId: fsap-xxxxxxxx
        iam: ENABLED
```

**Access Points per Site:**
```typescript
// Create access point per tenant
const siteAAccessPoint = new efs.AccessPoint(this, 'SiteAAccessPoint', {
  fileSystem: sharedEfs,
  path: '/sites/site-a',
  createAcl: {
    ownerGid: '33',  // www-data
    ownerUid: '33',
    permissions: '755'
  },
  posixUser: {
    gid: '33',
    uid: '33'
  }
});
```

### Database Strategies

| Strategy | Use Case | Complexity |
|----------|----------|------------|
| **Single Aurora Cluster** | LocalGov Microsites, small multisite | Low |
| **Database per site** | Strict isolation requirements | Medium |
| **Aurora with schemas** | Medium isolation, shared resources | Medium |
| **Separate RDS instances** | Maximum isolation | High |

### CloudFront Multi-Site Caching

```typescript
const distribution = new cloudfront.Distribution(this, 'Distribution', {
  defaultBehavior: {
    origin: new origins.LoadBalancerV2Origin(alb),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    cachePolicy: new cloudfront.CachePolicy(this, 'DrupalCache', {
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Host'),
      cookieBehavior: cloudfront.CacheCookieBehavior.allowList('SESS*'),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all()
    })
  }
});
```

**Sources:**
- [AWS EFS - Drupal Reference Architecture](https://aws.amazon.com/efs/resources/aws-refarch-drupal/)
- [AWS Blog - Serverless Drupal with Fargate](https://aws.amazon.com/blogs/storage/deploy-serverless-drupal-applications-using-aws-fargate-and-amazon-efs/)
- [GitHub - aws-samples/aws-refarch-drupal](https://github.com/aws-samples/aws-refarch-drupal)
- [InfraSource - Drupal ECS Blueprint](https://www.infrasource.io/blueprints/drupal-aws)
- [LocalGov Drupal - Microsites Platform](https://docs.localgovdrupal.org/microsites/)

---

## 12. AWS Well-Architected for Demo/Sandbox Environments

### Overview

AWS Well-Architected Framework provides specific guidance for sandbox, demo, and temporary environments that balance experimentation with governance.

### Six Pillars Applied to Demos

| Pillar | Demo Environment Consideration |
|--------|-------------------------------|
| **Operational Excellence** | Automated provisioning/teardown, IaC |
| **Security** | Isolated accounts, no production data |
| **Reliability** | Accept lower availability, quick recovery |
| **Performance Efficiency** | Right-size aggressively, use serverless |
| **Cost Optimization** | Scheduling, Spot, auto-shutdown |
| **Sustainability** | Efficient resources, auto-cleanup |

### Account Structure

**Sandbox OU Best Practices:**

```
Management Account
└── Workloads OU
    ├── Production OU
    ├── Development OU
    └── Sandbox OU          ← Demo environments
        ├── Builder Sandbox 1
        ├── Builder Sandbox 2
        ├── Team Sandbox
        └── Hackathon Sandbox (transient)
```

**Key Principles:**
- Sandbox accounts are **never promoted** to other OUs
- **No connectivity** to internal networks or production
- **Spend limits** enforced per account
- Resources are **temporary** by nature

### Sandbox Usage Policy

Essential policy elements:
1. **Data Classification**: No sensitive/PII data in sandboxes
2. **Access Controls**: Individual or small team accounts
3. **Network Isolation**: No VPC peering to production
4. **Resource Limits**: Budget alerts and spending caps
5. **Cleanup Expectations**: Regular resource purging

### Cost Controls

**Budget Alerts:**
```typescript
new budgets.CfnBudget(this, 'SandboxBudget', {
  budget: {
    budgetName: 'SandboxMonthlyLimit',
    budgetType: 'COST',
    timeUnit: 'MONTHLY',
    budgetLimit: {
      amount: 500,
      unit: 'USD'
    }
  },
  notificationsWithSubscribers: [{
    notification: {
      notificationType: 'ACTUAL',
      comparisonOperator: 'GREATER_THAN',
      threshold: 80
    },
    subscribers: [{
      subscriptionType: 'EMAIL',
      address: 'admin@example.com'
    }]
  }]
});
```

### Automated Cleanup

**Instance Scheduler:**
- AWS-provided solution for EC2/RDS scheduling
- Tag-based resource selection
- Multiple schedule support

**Lambda Cleanup Function:**
```typescript
new events.Rule(this, 'WeeklyCleanup', {
  schedule: events.Schedule.cron({
    weekDay: 'SUN',
    hour: '3',
    minute: '0'
  }),
  targets: [new targets.LambdaFunction(cleanupLambda)]
});
```

### Security Guardrails

**Service Control Policies (SCPs):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyProductionRegions",
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": ["eu-west-2", "us-east-1"]
        }
      }
    },
    {
      "Sid": "DenyExpensiveServices",
      "Effect": "Deny",
      "Action": [
        "redshift:*",
        "emr:*",
        "sagemaker:CreateEndpoint*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Multiple Environments Pattern

Well-Architected recommends:

1. **Production**: Fully controlled, high availability
2. **Staging**: Production-like for testing
3. **Development**: Shared team resources
4. **Individual Dev**: Per-developer environments
5. **Sandbox**: Minimal controls for experimentation

### Infrastructure as Code for Demos

**Reusable Templates:**
```typescript
// Parameterized demo stack
export class DemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DemoStackProps) {
    super(scope, id, props);

    // Scheduled cleanup
    if (props.autoCleanup) {
      new events.Rule(this, 'AutoDelete', {
        schedule: events.Schedule.rate(cdk.Duration.days(7)),
        targets: [/* cleanup target */]
      });
    }

    // Cost-optimized defaults
    const cluster = new ecs.Cluster(this, 'Cluster', {
      enableFargateCapacityProviders: true,
      containerInsights: false  // Cost savings for demos
    });
  }
}
```

**Sources:**
- [AWS Well-Architected - Multiple Environments](https://docs.aws.amazon.com/wellarchitected/latest/framework/ops_dev_integ_multi_env.html)
- [AWS DevOps Guidance - Sandbox Environments](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/dl.ld.7-establish-sandbox-environments-with-spend-limits.html)
- [AWS Whitepaper - Organizing with Multiple Accounts](https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/sandbox-ou.html)
- [Coherence - AWS Sandbox Best Practices](https://www.withcoherence.com/post/aws-sandbox-environment)
- [AWS Public Sector Blog - Well-Architected Framework](https://aws.amazon.com/blogs/publicsector/aws-well-architected-framework-best-practices-for-building-and-deploying-an-optimized-cloud-environment/)

---

## Conclusions and Recommendations

### For NDX Try AWS Scenarios

Based on this comprehensive research, the following recommendations apply to the NDX Try AWS Scenarios project:

#### Architecture Recommendations

1. **Use ECS Fargate with Graviton (ARM64)** for all container workloads
   - 40% better price-performance
   - Native multi-arch container support

2. **Implement Fargate Spot** for demo scenarios
   - Up to 70% cost savings
   - Acceptable for demo workloads with graceful degradation

3. **Deploy Aurora Serverless v2** for database
   - Auto-scales to zero when idle
   - Cost-effective for variable demo usage

4. **Use Amazon EFS** for shared Drupal files
   - Multi-AZ persistence
   - Scales automatically

#### Cost Optimization Strategy

1. **Scheduled scaling** - Scale to zero outside business hours
2. **Fargate Spot capacity** - 70% savings for interruption-tolerant workloads
3. **Graviton processors** - 20-40% savings
4. **Aurora Serverless** - Pay only for active usage
5. **CloudFront caching** - Reduce origin requests

#### Documentation Automation

1. **CDK Graph + Diagram Plugin** for architecture diagrams
2. **cfn-diagram** for CloudFormation visualization
3. **Automated CI/CD pipeline** for documentation updates

#### UK Public Sector Alignment

1. **LocalGov Drupal** integration for council-focused demos
2. **OGVA/G-Cloud** procurement frameworks awareness
3. **NHS Digital patterns** for healthcare scenarios

#### AI Integration Path

1. **AWS Bedrock Provider module** for Drupal AI features
2. **Amazon Comprehend** for content analysis
3. **Amazon Polly** for accessibility (text-to-speech)

---

## Appendix: Quick Reference

### Cost Estimation (Demo Environment)

| Component | Monthly Cost (Scheduled) | Monthly Cost (24/7) |
|-----------|-------------------------|---------------------|
| ECS Fargate (1 vCPU, 2GB) Spot | ~$15 | ~$50 |
| Aurora Serverless v2 (0.5-2 ACU) | ~$30 | ~$100 |
| EFS (10GB) | ~$3 | ~$3 |
| ALB | ~$18 | ~$18 |
| CloudFront | ~$5 | ~$20 |
| **Total** | **~$71/month** | **~$191/month** |

### Useful Commands

```bash
# Generate CDK diagram
npx cdk-dia

# Migrate existing resources
cdk migrate --from-stack --stack-name MyStack

# Deploy with Spot capacity
cdk deploy --context useSpot=true

# Schedule scale-down
aws application-autoscaling put-scheduled-action \
  --service-namespace ecs \
  --resource-id service/cluster/service \
  --scheduled-action-name scale-down \
  --schedule "cron(0 18 * * ? *)" \
  --scalable-target-action MinCapacity=0,MaxCapacity=0
```

### Key Links

- [LocalGov Drupal](https://localgovdrupal.org/)
- [AWS PDK](https://aws.github.io/aws-pdk/)
- [AWS Graviton Getting Started](https://github.com/aws/aws-graviton-getting-started)
- [AWS Well-Architected](https://aws.amazon.com/architecture/well-architected/)
- [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/)

---

*Research compiled: 2025-12-23*
*Total topics covered: 12*
*Sources verified: Web search with URL citations*
