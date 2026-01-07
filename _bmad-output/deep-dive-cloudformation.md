# NDX:Try AWS Scenarios - CloudFormation Deep-Dive

**Date:** 2025-12-23
**Analysis Type:** Exhaustive Template Analysis
**Total Templates:** 6 scenario templates + supporting infrastructure
**Location:** `cloudformation/`

## Executive Summary

This document provides a comprehensive deep-dive analysis of all CloudFormation templates in the NDX:Try AWS Scenarios project. All scenarios use serverless architecture with Lambda Function URLs (no API Gateway), auto-cleanup S3 lifecycles, and integrated CloudFormation custom resources for sample data.

## Template Inventory

### Scenario Templates

| Scenario | File | Lines | Primary AWS Services |
|----------|------|-------|---------------------|
| Council Chatbot | `scenarios/council-chatbot/template.yaml` | 1,032 | Bedrock (Nova Pro), Lambda, S3 |
| Planning AI | `scenarios/planning-ai/template.yaml` | 1,270+ | Textract, Comprehend, Lambda, S3 |
| FOI Redaction | `scenarios/foi-redaction/template.yaml` | 820 | Comprehend PII, Lambda, S3 |
| Smart Car Park | `scenarios/smart-car-park/template.yaml` | 700 | DynamoDB, Lambda, S3 |
| Text to Speech | `scenarios/text-to-speech/template.yaml` | 647 | Polly, Lambda, S3 |
| QuickSight Dashboard | `scenarios/quicksight-dashboard/template.yaml` | 926 | QuickSight, Glue, S3 |

### Supporting Infrastructure

| Component | Location | Purpose |
|-----------|----------|---------|
| Sample Data Seeder | `functions/sample-data-seeder/` | CloudFormation custom resource |
| UK Data Generator | `layers/uk-data-generator/` | Lambda layer for UK sample data |
| Screenshot Automation | `screenshot-automation/` | Reference stack health checks |

---

## Per-Scenario Resource Documentation

### Council Chatbot (Amazon Nova Pro + Bedrock)

**Resources:**
- `KnowledgeBaseBucket` - S3 bucket for knowledge base
- `ChatbotRole` - IAM role with Bedrock access
- `ChatbotFunction` - Lambda with inline Python (~370 lines)
- `ChatbotFunctionUrl` - Public HTTP endpoint
- `ChatbotLogGroup` - CloudWatch logs (7-day retention)

**Lambda Configuration:**
- Runtime: Python 3.12
- Memory: 256 MB
- Timeout: 30 seconds
- Bedrock Model: `amazon.nova-pro-v1:0`

**Features:**
- HTML UI rendering (chat interface)
- Topic categorization (bin collections, council tax, planning)
- Session storage for conversation history
- 6 predefined sample questions

---

### Planning AI (Amazon Textract + Comprehend)

**Resources:**
- `PlanningDocsBucket` - S3 for planning documents
- `PlanningAIRole` - IAM with Textract + Comprehend
- `PlanningAnalyzerFunction` - Lambda (~1,000+ lines)
- `PlanningAnalyzerFunctionUrl` - Public endpoint
- `PlanningLogGroup` - CloudWatch logs

**Lambda Configuration:**
- Runtime: Python 3.12
- Memory: 512 MB
- Timeout: 60 seconds

**Features:**
- Document upload with drag-and-drop
- Real Amazon Textract text extraction
- Comprehend NER (Named Entity Recognition)
- PDF and image support
- Processing timeline UI

---

### FOI Redaction (Amazon Comprehend PII)

**Resources:**
- `DocumentsBucket` - S3 for documents + redacted output
- `RedactionRole` - IAM with Comprehend access
- `RedactionFunction` - Lambda (~750 lines)
- `RedactionFunctionUrl` - Public endpoint
- `RedactionLogGroup` - CloudWatch logs

**Parameters:**
- `RedactionConfidenceThreshold` (0.5-0.99, default: 0.85)

**PII Types Detected:**
```
NAME, ADDRESS, PHONE, EMAIL, SSN_UK, BANK_ACCOUNT_NUMBER,
CREDIT_DEBIT_NUMBER, DATE_TIME, DRIVER_ID, IP_ADDRESS,
PASSPORT_NUMBER, UK_NATIONAL_INSURANCE_NUMBER
```

---

### Smart Car Park (DynamoDB IoT Simulation)

**Resources:**
- `ParkingDataTable` - DynamoDB (PAY_PER_REQUEST)
- `ParkingDataBucket` - S3 for historical data
- `SmartParkingRole` - IAM with DynamoDB access
- `ParkingSimulatorFunction` - Lambda (~650 lines)
- `ParkingSimulatorFunctionUrl` - Public endpoint

**Parameters:**
- `SimulatedSensors` (5-100, default: 20)

**Car Parks Configured:**
- Town Centre Multi-Storey (450 spaces, £1.50/hr)
- Market Square (120 spaces, £1.20/hr)
- Railway Station (280 spaces, £2.00/hr)
- Leisure Centre (200 spaces, £1.00/hr)

---

### Text to Speech (Amazon Polly)

**Resources:**
- `AudioBucket` - S3 for generated audio
- `TextToSpeechRole` - IAM with Polly access
- `TextToSpeechFunction` - Lambda (~480 lines)
- `TextToSpeechFunctionUrl` - Public endpoint

**Parameters:**
- `VoiceId` (Amy|Emma|Brian|Arthur, default: Amy)
- `OutputFormat` (mp3|ogg_vorbis|pcm, default: mp3)

**Voices (UK English Neural):**
- Amy (Female, Default)
- Emma (Female)
- Brian (Male)
- Arthur (Male)

---

### QuickSight Dashboard (BI Analytics)

**Resources:**
- `DataBucket` - S3 for source data
- `DataGeneratorFunction` - Lambda for sample data
- `DataGeneratorTrigger` - CloudFormation custom resource
- `QuickSightS3AccessRole` - IAM for QuickSight
- `CouncilDataSource` - QuickSight DataSource
- `CouncilDataSet` - QuickSight DataSet (SPICE import)
- `CouncilDashboard` - QuickSight Dashboard

**Sample Data:**
- 12 months of council performance data
- 8 regions × 9 service areas
- ~5,000+ rows generated

**Dashboard Visuals:**
- KPI cards (Total Cases, Resolution Rate, Satisfaction)
- Bar charts (Cases by Service, Satisfaction by Service)
- Data table with drill-down

---

## AWS Service Usage Matrix

| Service | Scenarios | Purpose |
|---------|-----------|---------|
| Lambda | All 6 | Event handlers + web UI |
| S3 | All 6 | Document/data storage |
| IAM | All 6 | Role + policy management |
| Bedrock | Council Chatbot | AI responses (Nova Pro) |
| Textract | Planning AI | Text extraction |
| Comprehend | Planning AI, FOI | NER, PII detection |
| Polly | Text to Speech | Speech synthesis |
| DynamoDB | Smart Car Park | Persistent data |
| QuickSight | Dashboard | BI analytics |
| CloudWatch | All 6 | Logging (7-day retention) |

---

## Design Patterns

### Pattern 1: Lambda Function URL (Not API Gateway)
- Simpler, cost-effective for demos
- Direct public access (`AuthType: NONE`)
- Built-in CORS support

### Pattern 2: Inline Lambda Code (ZipFile)
- Single-file deployment
- No CodeBuild required
- HTML UI rendering in Python
- Limit: 4,096 bytes (compressed)

### Pattern 3: Self-Rendering Lambda
```python
def lambda_handler(event, context):
    method = event['requestContext']['http']['method']
    if method == 'GET':
        return {'body': render_html(), 'headers': {'Content-Type': 'text/html'}}
    if method == 'POST':
        return {'body': json.dumps(process(event['body']))}
```

### Pattern 4: Auto-Cleanup
- S3 lifecycle: 1-day expiration
- CloudWatch logs: 7-day retention
- DynamoDB: No TTL (manual cleanup)

---

## UK Data Generator Layer

**Purpose:** Reusable library for realistic UK council data

**Classes:**
- `UKNameGenerator` - ONS-based UK names
- `UKAddressGenerator` - Valid UK postcodes (B, M, LS prefixes)
- `CouncilServiceGenerator` - Service requests (Waste, Highways, Housing, Council Tax)
- `CouncilDataGenerator` - Main orchestrator

**Features:**
- Deterministic generation (seed-based)
- SAMPLE markers for identification
- ~750 name combinations
- 4 service categories

---

## Security Analysis

### Authentication
- Lambda Function URLs: `AuthType: NONE` (public demo access)
- No authentication layer (demo scenarios)

### Data Protection
- S3 encryption: AES256 (all buckets)
- Public access blocks: ENABLED
- Presigned URLs: 1-hour expiry

### Data Retention
- S3 auto-cleanup: 1-day expiration
- CloudWatch: 7-day retention
- No PII in sample data (all marked `[SAMPLE]`)

---

## Cost Estimation (per scenario, sandbox)

| Component | Monthly Cost |
|-----------|-------------|
| Lambda | $0.20 (1M requests) |
| S3 | $0.50 (1GB + requests) |
| CloudWatch | $0.30 (logs + metrics) |
| AWS Service | $0-10 (varies) |
| **Total** | **~$1-15/month** |

QuickSight: $18+/user (separate)

---

## Total Resources Created (All Scenarios)

| Resource Type | Count |
|---------------|-------|
| Lambda Functions | 6 + 1 seeder |
| Lambda Function URLs | 6 |
| S3 Buckets | 6 |
| IAM Roles | 6 |
| CloudWatch Log Groups | 6 |
| DynamoDB Tables | 1 |
| QuickSight Resources | 3 |
| Lambda Layers | 1 |

---

_Generated using BMAD Method `document-project` deep-dive workflow on 2025-12-23_
