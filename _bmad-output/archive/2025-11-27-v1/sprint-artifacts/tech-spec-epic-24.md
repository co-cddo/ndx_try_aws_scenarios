# Epic 24: Scenario Application Remediation - Technical Specification

**Generated:** 2025-11-30
**Epic:** Scenario Application Remediation
**Stories:** 7
**Story Points:** 55
**PRD Reference:** PRD v1.7 Extension (FR211-FR235, NFR73-NFR78)

---

## Executive Summary

Epic 24 remediates critical issues discovered in Epic 18-23 implementations. The scenario web applications were delivered as HTML mockups with sample data instead of real AWS service integrations. This epic fixes Lambda Function URL access issues and integrates real AWS AI/IoT services.

---

## Problem Statement

### Current State (Post Epic 18-23)

| Scenario | URL Status | Implementation Reality |
|----------|------------|------------------------|
| Council Chatbot | 200 OK | Keyword regex matching (NOT Bedrock) |
| Planning AI | 200 OK | Hardcoded sample data (NOT Textract) |
| FOI Redaction | 200 OK | **REAL Amazon Comprehend PII** ✓ |
| Smart Car Park | 200 OK | Random data generation (NOT DynamoDB) |
| Text-to-Speech | 200 OK | **REAL Amazon Polly** ✓ |
| QuickSight Dashboard | 200 OK | Chart.js mock (NOT QuickSight) |

### Root Cause Analysis

1. **AuthType: NONE** - All 6 templates correctly configured (verified via code inspection)
2. **403 Errors** - Stacks not deployed to AWS account, not auth configuration issues
3. **Mock Implementations** - Lambda code uses hardcoded/random data instead of SDK calls
4. **IAM Roles Exist** - Templates have Bedrock/Textract permissions but unused

---

## Architecture

### Current Lambda Architecture (All 6 Scenarios)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CloudFormation Stack                          │
├─────────────────────────────────────────────────────────────────┤
│  Lambda Function (Python 3.12)                                   │
│  ├── ZipFile: Inline Python (~40KB HTML embedded)               │
│  ├── FunctionUrl: AuthType: NONE                                │
│  ├── IAM Role: Bedrock/Textract/Comprehend/Polly permissions    │
│  └── Handler: GET → HTML, POST → JSON                           │
└─────────────────────────────────────────────────────────────────┘
```

### Target Architecture (Post-Remediation)

```
┌─────────────────────────────────────────────────────────────────┐
│                 Council Chatbot Stack                            │
├─────────────────────────────────────────────────────────────────┤
│  Lambda → Bedrock Runtime (claude-instant-v1)                   │
│  ├── System prompt: UK council assistant persona                │
│  ├── Max tokens: 1024                                           │
│  └── Cost target: <$0.01/interaction                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 Planning AI Stack                                │
├─────────────────────────────────────────────────────────────────┤
│  Lambda → Textract (analyze_document)                           │
│  ├── S3 bucket for document uploads (presigned URLs)            │
│  ├── Comprehend for entity detection (optional)                 │
│  └── FeatureTypes: FORMS, TABLES                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 FOI Redaction Stack (Already Working)            │
├─────────────────────────────────────────────────────────────────┤
│  Lambda → Comprehend (detect_pii_entities)                      │
│  ├── Confidence threshold: 0.85                                 │
│  ├── Entity types: NAME, ADDRESS, SSN, PHONE, etc.              │
│  └── Redaction: Replace with [REDACTED]                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 Smart Car Park Stack                             │
├─────────────────────────────────────────────────────────────────┤
│  Lambda → DynamoDB (scan/query)                                 │
│  ├── Table: ${StackName}-parking-data                           │
│  ├── Partition key: carParkId (String)                          │
│  ├── 50 bays across 5 car parks                                 │
│  └── EventBridge: Simulation updates every 30s (optional)       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 Text-to-Speech Stack (Already Working)           │
├─────────────────────────────────────────────────────────────────┤
│  Lambda → Polly (synthesize_speech)                             │
│  ├── Voices: Amy, Emma, Brian, Arthur (neural)                  │
│  ├── Output: audio/mpeg                                         │
│  └── Max text length: 3000 characters                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 QuickSight Dashboard Stack (Documentation Only)  │
├─────────────────────────────────────────────────────────────────┤
│  Lambda → Chart.js (static data)                                │
│  ├── No AWS service integration                                 │
│  ├── Documentation clarification needed                         │
│  └── Explain QuickSight licensing for production                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Lambda Function URLs (Current)

| Scenario | Stack Name | Lambda URL |
|----------|-----------|------------|
| Council Chatbot | ndx-try-council-chatbot | https://e4pfwce2ljm6hjpstosrx6xkey0awfsp.lambda-url.us-west-2.on.aws/ |
| Planning AI | ndx-try-planning-ai | https://pqxnz7kz4v5ghpnazfkdbpropu0xxavy.lambda-url.us-west-2.on.aws/ |
| FOI Redaction | ndx-try-foi-redaction | https://yx3lob2aijklqfcqmllqhgrvye0bcacq.lambda-url.us-west-2.on.aws/ |
| Smart Car Park | ndx-try-smart-car-park | https://atnntc67ecpqj4f2m6hlrh7qiy0xfyya.lambda-url.us-west-2.on.aws/ |
| Text-to-Speech | ndx-try-text-to-speech | https://xh5x4w73p2bldzmyel3q45koki0mtlou.lambda-url.us-west-2.on.aws/ |
| QuickSight Dashboard | ndx-try-quicksight-dashboard | https://2o6kjtqzjdbn4mqurav4jhkvq40scjej.lambda-url.us-west-2.on.aws/ |

---

## AWS Service Integration Patterns

### Story 24.2: Bedrock Integration (Council Chatbot)

```python
import boto3
import json

bedrock = boto3.client('bedrock-runtime', region_name='us-west-2')

COUNCIL_ASSISTANT_PROMPT = """You are a helpful UK local council service assistant.
You help residents with questions about:
- Waste collection and recycling
- Council tax and benefits
- Planning applications
- Housing services
- Environmental health
- Parking permits
Keep responses concise and helpful. If you don't know something specific
about the council, provide general guidance and suggest contacting the council directly."""

def get_ai_response(user_query):
    response = bedrock.invoke_model(
        modelId='anthropic.claude-instant-v1',
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": user_query}],
            "system": COUNCIL_ASSISTANT_PROMPT
        })
    )
    result = json.loads(response['body'].read())
    return result['content'][0]['text']
```

### Story 24.3: Textract Integration (Planning AI)

```python
import boto3

textract = boto3.client('textract', region_name='us-west-2')

def analyze_document(bucket, key):
    response = textract.analyze_document(
        Document={'S3Object': {'Bucket': bucket, 'Key': key}},
        FeatureTypes=['FORMS', 'TABLES']
    )

    # Extract key-value pairs
    key_values = {}
    for block in response['Blocks']:
        if block['BlockType'] == 'KEY_VALUE_SET' and 'KEY' in block.get('EntityTypes', []):
            key_text = get_text_from_block(block, response['Blocks'])
            value_block = find_value_block(block, response['Blocks'])
            if value_block:
                value_text = get_text_from_block(value_block, response['Blocks'])
                key_values[key_text] = value_text

    return key_values
```

### Story 24.4: Comprehend PII Detection (FOI - Already Implemented)

```python
import boto3

comprehend = boto3.client('comprehend', region_name='us-west-2')

def detect_and_redact_pii(text, confidence_threshold=0.85):
    response = comprehend.detect_pii_entities(
        Text=text,
        LanguageCode='en'
    )

    entities = []
    redacted_text = text

    # Sort by offset descending to preserve positions during replacement
    for entity in sorted(response['Entities'], key=lambda x: x['BeginOffset'], reverse=True):
        if entity['Score'] >= confidence_threshold:
            entities.append({
                'type': entity['Type'],
                'text': text[entity['BeginOffset']:entity['EndOffset']],
                'confidence': entity['Score']
            })
            redacted_text = (
                redacted_text[:entity['BeginOffset']] +
                f"[{entity['Type']}]" +
                redacted_text[entity['EndOffset']:]
            )

    return redacted_text, entities
```

### Story 24.5: DynamoDB Integration (Smart Car Park)

```python
import boto3
import random
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='us-west-2')

def get_parking_data(table_name):
    table = dynamodb.Table(table_name)
    response = table.scan()
    return response['Items']

def simulate_parking_update(table_name, car_park_id, total_bays):
    """Simulate IoT sensor updates"""
    table = dynamodb.Table(table_name)

    # Simulate realistic occupancy patterns
    hour = datetime.now().hour
    if 9 <= hour <= 17:  # Business hours - higher occupancy
        occupied = random.randint(int(total_bays * 0.7), total_bays)
    else:
        occupied = random.randint(0, int(total_bays * 0.4))

    table.update_item(
        Key={'carParkId': car_park_id},
        UpdateExpression='SET occupiedBays = :o, lastUpdated = :t',
        ExpressionAttributeValues={
            ':o': occupied,
            ':t': datetime.now().isoformat()
        }
    )
```

---

## Story Dependencies

```
Story 24.1 (Deploy All Stacks)
    │
    ├──► Story 24.2 (Bedrock Integration)
    │
    ├──► Story 24.3 (Textract Integration)
    │
    ├──► Story 24.4 (FOI Verification) - Already working
    │
    ├──► Story 24.5 (DynamoDB Integration)
    │
    └──► Story 24.6 (QuickSight Docs) - No code changes

All Stories ──► Story 24.7 (E2E Validation)
```

---

## Test Coverage Requirements

### E2E Test Files (Playwright)

| Scenario | Test File | Tests |
|----------|-----------|-------|
| Council Chatbot | tests/e2e/council-chatbot-ui.spec.ts | TBD |
| Planning AI | tests/e2e/planning-ai-ui.spec.ts | TBD |
| FOI Redaction | tests/e2e/foi-redaction-ui.spec.ts | TBD |
| Smart Car Park | tests/e2e/smart-car-park-ui.spec.ts | TBD |
| Text-to-Speech | tests/e2e/text-to-speech-ui.spec.ts | TBD |
| QuickSight Dashboard | tests/e2e/quicksight-dashboard-ui.spec.ts | 46 tests ✓ |

### Accessibility Requirements

- axe-core WCAG 2.2 AA compliance
- Skip links present
- ARIA labels on all interactive elements
- Keyboard navigation working
- Focus management correct

---

## CloudFormation Deployment Commands

```bash
# Set AWS credentials (pool-001 profile)
eval "$(aws configure export-credentials --profile pool-001 --format env)"

# Deploy all 6 stacks
aws cloudformation deploy \
  --template-file cloudformation/scenarios/council-chatbot/template.yaml \
  --stack-name ndx-try-council-chatbot \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2

aws cloudformation deploy \
  --template-file cloudformation/scenarios/planning-ai/template.yaml \
  --stack-name ndx-try-planning-ai \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2

aws cloudformation deploy \
  --template-file cloudformation/scenarios/foi-redaction/template.yaml \
  --stack-name ndx-try-foi-redaction \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2

aws cloudformation deploy \
  --template-file cloudformation/scenarios/smart-car-park/template.yaml \
  --stack-name ndx-try-smart-car-park \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2

aws cloudformation deploy \
  --template-file cloudformation/scenarios/text-to-speech/template.yaml \
  --stack-name ndx-try-text-to-speech \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2

aws cloudformation deploy \
  --template-file cloudformation/scenarios/quicksight-dashboard/template.yaml \
  --stack-name ndx-try-quicksight-dashboard \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

---

## AWS Service Quotas and Limits

| Service | Default Quota | Consideration |
|---------|---------------|---------------|
| Bedrock (Claude Instant) | Model access required | Verify model enabled in account |
| Textract | 1 TPS (sync) | Use async for large docs |
| Comprehend PII | 10 TPS | Sufficient for demo |
| Polly | 80 req/sec | Generous for demo |
| DynamoDB | On-demand | No capacity planning needed |
| Lambda | 1000 concurrent | Far exceeds demo needs |

---

## Acceptance Criteria Summary

### Story 24.1: Fix Lambda URL Access (5 points)
- All 6 stacks deployed successfully
- All 6 URLs return 200 OK
- deployment-endpoints.yaml updated

### Story 24.2: Bedrock Integration (13 points)
- Bedrock SDK calls working
- AI responses contextual
- <5 second latency
- Error handling implemented

### Story 24.3: Textract Integration (13 points)
- Document upload working
- Text extraction displayed
- Key-value pairs extracted
- Sample documents provided

### Story 24.4: FOI Verification (8 points)
- Comprehend PII detection working (already implemented)
- Redaction display correct
- Confidence scores shown

### Story 24.5: DynamoDB Integration (8 points)
- DynamoDB table created
- Lambda queries working
- Simulation updates data
- Historical tracking enabled

### Story 24.6: QuickSight Documentation (3 points)
- Walkthrough text clarified
- Architecture diagram updated
- Production guidance added

### Story 24.7: E2E Validation (5 points)
- All 6 scenarios working
- No JavaScript errors
- Accessibility passing
- Screenshots recaptured

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Bedrock model access not enabled | Check model access in AWS console first |
| Textract async processing delays | Use sync API for small docs (<5 pages) |
| DynamoDB cold start latency | Use provisioned capacity if needed |
| Large Lambda package size | Inline HTML already working, no change |
| Cross-region issues | All services in us-west-2 |

---

## Success Metrics

- [ ] 6/6 CloudFormation stacks deployed
- [ ] 6/6 Lambda URLs return 200 OK
- [ ] Council Chatbot: AI response received
- [ ] Planning AI: Document text extracted
- [ ] FOI Redaction: PII detected and redacted
- [ ] Smart Car Park: DynamoDB data displayed
- [ ] Text-to-Speech: Audio generated
- [ ] QuickSight Dashboard: Charts rendered
- [ ] All E2E tests passing
- [ ] All accessibility tests passing
- [ ] Zero deferred issues

---

_Tech spec generated: 2025-11-30_
_Epic: 24 - Scenario Application Remediation_
