# Story 19.4: CloudFormation Deployment Integration

Status: done

## Story

As a **NDX:Try platform maintainer**,
I want **the Planning AI web application deployed via CloudFormation**,
so that **it integrates with the existing NDX:Try deployment workflow**.

## Acceptance Criteria

### AC-19.4.1: Stack Deployment

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19.4.1a | Stack deploys without errors | CloudFormation console |
| AC-19.4.1b | Lambda Function URL created | Stack outputs |
| AC-19.4.1c | S3 bucket created for documents | Stack outputs |
| AC-19.4.1d | IAM role with appropriate permissions | IAM inspection |

### AC-19.4.2: URL Output

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19.4.2a | AnalyzerURL output exported | Stack outputs |
| AC-19.4.2b | URL is accessible publicly | curl test |
| AC-19.4.2c | GET returns HTML | curl test |
| AC-19.4.2d | POST returns JSON | curl test |

### AC-19.4.3: Resource Configuration

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-19.4.3a | Lambda timeout set to 30 seconds | Console inspection |
| AC-19.4.3b | Lambda memory set to 256 MB | Console inspection |
| AC-19.4.3c | CORS configured for Function URL | Console inspection |
| AC-19.4.3d | Resources tagged with project/scenario | Console inspection |

## Tasks / Subtasks

- [x] Task 1: Verify CloudFormation template
  - [x] 1.1 Lambda function with inline code
  - [x] 1.2 Lambda Function URL resource
  - [x] 1.3 IAM role with S3 permissions
  - [x] 1.4 S3 bucket with encryption

- [x] Task 2: Deploy stack
  - [x] 2.1 Run aws cloudformation deploy
  - [x] 2.2 Verify stack status CREATE_COMPLETE
  - [x] 2.3 Capture stack outputs

- [x] Task 3: Verify deployment
  - [x] 3.1 Test GET endpoint
  - [x] 3.2 Test POST endpoint
  - [x] 3.3 Verify CORS headers

## Technical Notes

**Stack Name:** `ndx-try-planning-ai`
**Region:** us-west-2

**Stack Outputs:**
- AnalyzerURL: Lambda Function URL endpoint
- DocumentsBucket: S3 bucket name
- ScenarioInfo: JSON metadata

## Dependencies

- Stories 19.1-19.3 (Web interface implemented) - DONE

## Definition of Done

- [x] Stack deploys successfully
- [x] Function URL accessible
- [x] GET returns HTML interface
- [x] POST returns JSON analysis
- [x] Code review approved

## Dev Record

### Session Log

**2025-11-30 - Deployment Verified**

**Developer:** Claude Code

**Deployment Command:**
```bash
aws cloudformation deploy \
  --stack-name ndx-try-planning-ai \
  --template-file cloudformation/scenarios/planning-ai/template.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

**Stack Outputs:**
```json
{
  "AnalyzerURL": "https://zh7vdzicwrc2aiqx4s6cypcwfu0qcmus.lambda-url.us-west-2.on.aws/",
  "DocumentsBucket": "ndx-try-planning-docs-449788867583-us-west-2",
  "ScenarioInfo": {
    "scenario": "planning-ai",
    "environment": "sandbox",
    "autoCleanup": "2 hours",
    "mode": "rule-based extraction (sandbox)",
    "note": "Production uses Amazon Textract + Bedrock AI"
  }
}
```

**Verification Tests:**
```bash
# GET returns HTML
curl -s https://zh7vdzicwrc2aiqx4s6cypcwfu0qcmus.lambda-url.us-west-2.on.aws/ | grep "DOCTYPE"
# Output: <!DOCTYPE html>

# POST returns JSON
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"filename": "sample.pdf"}' \
  https://zh7vdzicwrc2aiqx4s6cypcwfu0qcmus.lambda-url.us-west-2.on.aws/ | jq .success
# Output: true
```

**Resources Created:**
- Lambda Function: `ndx-try-planning-analyzer-us-west-2`
- S3 Bucket: `ndx-try-planning-docs-449788867583-us-west-2`
- IAM Role: `ndx-try-planning-ai-role-us-west-2`
- CloudWatch Log Group: `/aws/lambda/ndx-try-planning-analyzer-us-west-2`

---

_Story created: 2025-11-30_
_Epic: 19 - Planning Application AI Web Application_
