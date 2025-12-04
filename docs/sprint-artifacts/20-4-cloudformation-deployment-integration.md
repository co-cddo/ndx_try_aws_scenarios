# Story 20.4: CloudFormation Deployment Integration

Status: done

## Story

As a **DevOps engineer**,
I want **the FOI Redaction web UI deployed via CloudFormation**,
so that **it integrates with existing infrastructure and can be deployed consistently**.

## Acceptance Criteria

### AC-20.4.1: CloudFormation Update

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.4.1a | Template includes web UI code | Template inspection |
| AC-20.4.1b | Lambda handler supports GET and POST | API test |
| AC-20.4.1c | Function URL CORS allows GET method | CORS test |

### AC-20.4.2: Deployment

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-20.4.2a | Stack deploys without errors | CloudFormation console |
| AC-20.4.2b | Function URL accessible publicly | curl test |
| AC-20.4.2c | Output exports URL correctly | CloudFormation outputs |

## Dependencies

- Stories 20.1-20.3 (Web UI implemented) - DONE

## Definition of Done

- [x] CloudFormation template updated
- [x] Stack deployed successfully
- [x] Function URL working
- [x] All outputs exported correctly

## Dev Record

### Session Log

**2025-11-30 - Implementation Complete**

**Developer:** Claude Code

**CloudFormation Changes:**
- `cloudformation/scenarios/foi-redaction/template.yaml`
- Added `render_redaction_html()` function in Lambda code
- Updated `lambda_handler` to check HTTP method
- CORS AllowMethods includes GET and POST

**Deployment:**
```bash
aws cloudformation deploy \
  --stack-name ndx-try-foi-redaction \
  --template-file cloudformation/scenarios/foi-redaction/template.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

**Outputs:**
- RedactionURL: `https://w6fqqfs2g4snys5reifxovnvae0nmkrq.lambda-url.us-west-2.on.aws/`
- DocumentsBucket: ndx-try-foi-docs-449788867583-us-west-2
- ConfidenceThreshold: 0.85

---

_Story created: 2025-11-30_
_Epic: 20 - FOI Redaction Web Application_
