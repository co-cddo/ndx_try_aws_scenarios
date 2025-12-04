# AWS Federation Credentials Management

**Document Version:** 1.0
**Last Updated:** 2025-11-29
**Story:** S0.1 - AWS Federation Service Account Setup
**Owner:** DevOps Team

---

## Overview

This document describes the credential management system for the NDX Screenshot Automation pipeline. The system uses AWS IAM federation tokens to provide time-limited, read-only access to the AWS Console for screenshot capture.

### Security Model

- **IAM User:** `ndx-screenshot-automation` (long-term credentials)
- **Federation Token:** Generated on-demand via `sts:GetFederationToken` (short-term credentials)
- **Session Duration:** Maximum 1 hour (3600 seconds) per NFR50
- **Access Control:** Explicit allowlist for read-only actions; explicit deny for modifications (NFR48)
- **Credential Storage:** GitHub Secrets (server-side only per NFR49)
- **Rotation Schedule:** Every 90 days
- **Audit Trail:** All federation sessions logged to CloudTrail (AC1.5)

### Key Principles

1. **Never log credentials** - Use error codes only (FEDERATION_FAILED)
2. **Least privilege** - Read-only console access via allowlist approach
3. **Time-limited sessions** - 1-hour maximum, no refresh capability
4. **Automated verification** - Pipeline validates credentials before capture
5. **90-day rotation** - Mandatory rotation cycle with documented procedure

---

## Credential Rotation Procedure

### Prerequisites

- AWS CLI configured with administrative credentials
- GitHub repository admin access
- Access to CloudFormation console or CLI
- Calendar/task management system for rotation reminders

### Standard 90-Day Rotation

Follow this procedure every 90 days to rotate the IAM access keys:

#### Step 1: Verify Current Credentials (Day -7)

One week before rotation, verify current setup:

```bash
# Test current credentials work
aws sts get-caller-identity \
  --profile ndx-screenshot-automation

# Expected output shows ndx-screenshot-automation user
# {
#   "UserId": "AIDAXXXXXXXXXXXXXXXXX",
#   "Account": "123456789012",
#   "Arn": "arn:aws:iam::123456789012:user/ndx-screenshot-automation"
# }

# Test federation token generation
aws sts get-federation-token \
  --name test-rotation-session \
  --duration-seconds 900 \
  --profile ndx-screenshot-automation

# Expected: Successfully returns temporary credentials
```

**If verification fails:** Follow emergency rotation procedure instead.

#### Step 2: Create New Access Key (Day 0 - Rotation Day)

```bash
# Create new access key for the user
aws iam create-access-key \
  --user-name ndx-screenshot-automation \
  --output json > new-access-key.json

# IMPORTANT: Save this file securely - the secret will not be shown again
# Store in password manager or secure vault immediately
```

**Output example:**
```json
{
  "AccessKey": {
    "UserName": "ndx-screenshot-automation",
    "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
    "Status": "Active",
    "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "CreateDate": "2025-11-29T10:00:00Z"
  }
}
```

**Critical Security Step:**
- DO NOT commit new-access-key.json to git
- Add to .gitignore if not already present
- Store secret in password manager immediately
- Delete file after GitHub Secrets updated

#### Step 3: Update GitHub Secrets (Day 0)

Navigate to repository settings and update secrets:

1. **Update AWS_FEDERATION_ACCESS_KEY_ID:**
   - GitHub → Repository → Settings → Secrets and variables → Actions
   - Find `AWS_FEDERATION_ACCESS_KEY_ID`
   - Click "Update"
   - Paste new `AccessKeyId` from Step 2
   - Click "Update secret"

2. **Update AWS_FEDERATION_SECRET_ACCESS_KEY:**
   - Find `AWS_FEDERATION_SECRET_ACCESS_KEY`
   - Click "Update"
   - Paste new `SecretAccessKey` from Step 2
   - Click "Update secret"

3. **Verify secrets updated:**
   ```bash
   # Check when secret was last updated (requires GitHub CLI)
   gh secret list

   # Expected: AWS_FEDERATION_* secrets show Updated: 1 minute ago
   ```

#### Step 4: Test New Credentials (Day 0)

Trigger a manual screenshot capture to verify new credentials work:

1. **Manual workflow trigger:**
   - GitHub → Actions → "Screenshot Capture Pipeline"
   - Click "Run workflow"
   - Select branch: main
   - Select scenario: "council-chatbot" (fastest test)
   - Click "Run workflow"

2. **Monitor execution:**
   ```bash
   # Watch workflow status (requires GitHub CLI)
   gh run watch
   ```

3. **Expected outcome:**
   - Pipeline completes successfully
   - Screenshots uploaded to S3
   - No authentication errors in logs

**If test fails:** Rollback to old credentials immediately (see Rollback Procedure).

#### Step 5: Deactivate Old Access Key (Day 0 + 4 hours)

After confirming new credentials work for 4 hours:

```bash
# List all access keys for the user
aws iam list-access-keys \
  --user-name ndx-screenshot-automation

# Deactivate the OLD access key (not the new one!)
aws iam update-access-key \
  --user-name ndx-screenshot-automation \
  --access-key-id AKIAOLDKEYEXAMPLE \
  --status Inactive
```

**Validation:**
```bash
# Verify only one active key
aws iam list-access-keys \
  --user-name ndx-screenshot-automation \
  --query 'AccessKeyMetadata[?Status==`Active`]'

# Expected: Only the NEW access key should be Active
```

#### Step 6: Delete Old Access Key (Day 0 + 7 days)

After one week of successful operation with new credentials:

```bash
# Delete the old access key permanently
aws iam delete-access-key \
  --user-name ndx-screenshot-automation \
  --access-key-id AKIAOLDKEYEXAMPLE

# Confirm deletion
aws iam list-access-keys \
  --user-name ndx-screenshot-automation

# Expected: Only the new access key should exist
```

#### Step 7: Update Rotation Log (Day 0 + 7 days)

Document the completed rotation:

```bash
# Add entry to rotation log
echo "$(date -u +%Y-%m-%d) | Access key rotated | New key: AKIAIOSFODNN7EXAMPLE | Next rotation: $(date -u -v+90d +%Y-%m-%d)" >> docs/ops/rotation-log.txt

# Schedule next rotation reminder
# Add calendar event for 90 days from now
```

### Rotation Timeline Summary

| Day | Action | Duration |
|-----|--------|----------|
| Day -7 | Verify current credentials | 10 minutes |
| Day 0 | Create new access key | 5 minutes |
| Day 0 | Update GitHub Secrets | 5 minutes |
| Day 0 | Test new credentials | 15 minutes |
| Day 0 + 4h | Deactivate old key | 5 minutes |
| Day 0 + 7d | Delete old key | 2 minutes |
| Day 0 + 7d | Update rotation log | 2 minutes |
| **Total active time:** | | **~44 minutes** |

---

## Emergency Rotation Procedure

Use this procedure if credentials are compromised, exposed in logs, or suspected to be leaked.

### Immediate Actions (Within 15 minutes)

#### Step 1: Disable All Access Keys Immediately

```bash
# List all keys
aws iam list-access-keys \
  --user-name ndx-screenshot-automation

# Disable ALL keys immediately
aws iam update-access-key \
  --user-name ndx-screenshot-automation \
  --access-key-id AKIAKEY1EXAMPLE \
  --status Inactive

aws iam update-access-key \
  --user-name ndx-screenshot-automation \
  --access-key-id AKIAKEY2EXAMPLE \
  --status Inactive
```

**This will immediately stop all screenshot automation.** Proceed to Step 2.

#### Step 2: Create New Access Key

```bash
# Create replacement key
aws iam create-access-key \
  --user-name ndx-screenshot-automation \
  --output json > emergency-access-key.json

# Store securely immediately
```

#### Step 3: Update GitHub Secrets Urgently

Follow Step 3 from standard rotation procedure, but skip the 4-hour validation period.

#### Step 4: Delete Compromised Keys

```bash
# Delete ALL old keys immediately
aws iam delete-access-key \
  --user-name ndx-screenshot-automation \
  --access-key-id AKIAKEY1EXAMPLE

aws iam delete-access-key \
  --user-name ndx-screenshot-automation \
  --access-key-id AKIAKEY2EXAMPLE
```

#### Step 5: Review CloudTrail Logs

Check for unauthorized usage:

```bash
# Query CloudTrail for recent federation calls
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=ndx-screenshot-automation \
  --start-time $(date -u -v-24H +%Y-%m-%dT%H:%M:%S) \
  --max-results 50

# Review for:
# - Unusual IP addresses
# - Unexpected timestamps
# - Failed authentication attempts
# - Actions outside normal automation scope
```

#### Step 6: Notify Security Team

Send notification to security team with:
- Incident timestamp
- Suspected exposure vector
- Actions taken
- CloudTrail review summary

#### Step 7: Test New Credentials

Run manual screenshot capture (Step 4 from standard rotation).

### Post-Emergency Review (Within 48 hours)

1. **Root cause analysis:** How were credentials exposed?
2. **Process improvement:** Update procedures to prevent recurrence
3. **Audit trail review:** Complete CloudTrail analysis for past 90 days
4. **Documentation update:** Revise security procedures as needed

---

## Credential Verification Steps

### Pre-Deployment Verification

Before deploying the CloudFormation stack:

```bash
# Verify you have correct permissions to create IAM users
aws iam get-user

# Expected: Your current user with admin permissions
```

### Post-Deployment Verification

After CloudFormation stack creation:

```bash
# Retrieve stack outputs
aws cloudformation describe-stacks \
  --stack-name screenshot-automation-iam \
  --query 'Stacks[0].Outputs'

# Expected outputs:
# - FederationUserArn
# - FederationAccessKeyId
# - FederationUserName
# - FederationSessionDuration
# Note: FederationSecretAccessKey won't show (NoEcho)

# Test GetFederationToken permission
aws sts get-federation-token \
  --name verification-test \
  --duration-seconds 900 \
  --profile ndx-screenshot-automation

# Expected: Returns temporary credentials with:
# - AccessKeyId
# - SecretAccessKey
# - SessionToken
# - Expiration (15 minutes from now)
```

### Ongoing Health Checks

Automated health check runs in GitHub Actions on every screenshot capture:

```yaml
# Excerpt from .github/workflows/screenshot-capture.yml
- name: Verify Federation Credentials
  run: |
    aws sts get-caller-identity
    aws sts get-federation-token --name health-check --duration-seconds 900
```

Manual verification command:

```bash
# Quick credential test
aws sts get-caller-identity \
  --profile ndx-screenshot-automation && \
  echo "✓ Credentials valid"

# Full federation test
aws sts get-federation-token \
  --name manual-test \
  --duration-seconds 3600 \
  --profile ndx-screenshot-automation && \
  echo "✓ Federation working"
```

---

## GitHub Secrets Setup Instructions

### Initial Setup (After CloudFormation Deployment)

1. **Retrieve credentials from CloudFormation outputs:**

   ```bash
   # Get Access Key ID
   aws cloudformation describe-stacks \
     --stack-name screenshot-automation-iam \
     --query 'Stacks[0].Outputs[?OutputKey==`FederationAccessKeyId`].OutputValue' \
     --output text

   # Get Secret Access Key (from stack creation output only!)
   # This value is only shown ONCE during stack creation
   # If you missed it, you must create new access keys
   ```

2. **Add secrets to GitHub repository:**

   **Via GitHub Web UI:**
   - Navigate to: Repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add each secret individually:

   | Secret Name | Value Source | Example |
   |-------------|--------------|---------|
   | `AWS_FEDERATION_ACCESS_KEY_ID` | CloudFormation output | AKIAIOSFODNN7EXAMPLE |
   | `AWS_FEDERATION_SECRET_ACCESS_KEY` | Stack creation output | wJalrXUtnFEMI/K7MDENG/... |
   | `AWS_REGION` | Manual entry | us-west-2 |
   | `AWS_ACCOUNT_ID` | Manual entry | 123456789012 |

   **Via GitHub CLI:**
   ```bash
   # Set secrets using gh CLI
   gh secret set AWS_FEDERATION_ACCESS_KEY_ID --body "AKIAIOSFODNN7EXAMPLE"
   gh secret set AWS_FEDERATION_SECRET_ACCESS_KEY --body "wJalrXUtnFEMI/..."
   gh secret set AWS_REGION --body "us-west-2"
   gh secret set AWS_ACCOUNT_ID --body "123456789012"
   ```

3. **Verify secrets are set:**

   ```bash
   # List all repository secrets
   gh secret list

   # Expected output:
   # AWS_FEDERATION_ACCESS_KEY_ID       Updated 2025-11-29
   # AWS_FEDERATION_SECRET_ACCESS_KEY   Updated 2025-11-29
   # AWS_REGION                         Updated 2025-11-29
   # AWS_ACCOUNT_ID                     Updated 2025-11-29
   ```

4. **Test in GitHub Actions:**

   Trigger manual workflow run to verify secrets work in CI/CD environment.

---

## Rotation Reminder Calendar Suggestion

Set up automated reminders to ensure rotation happens on schedule:

### Calendar Events

Create recurring calendar events with these details:

**Event 1: Pre-Rotation Verification**
- **Recurrence:** Every 90 days
- **Time:** Day -7, 10:00 AM
- **Title:** AWS Federation Credentials - Pre-Rotation Check
- **Description:**
  ```
  Verify current AWS federation credentials are working.
  Follow: docs/ops/federation-credentials.md#step-1-verify-current-credentials
  Timeline: 10 minutes
  ```
- **Attendees:** DevOps team lead

**Event 2: Rotation Day**
- **Recurrence:** Every 90 days
- **Time:** Day 0, 09:00 AM (off-peak hours)
- **Title:** AWS Federation Credentials - Rotation Day
- **Description:**
  ```
  Rotate AWS federation credentials for screenshot automation.
  Follow: docs/ops/federation-credentials.md#standard-90-day-rotation
  Timeline: ~1 hour (includes testing)
  Block calendar for focused work.
  ```
- **Attendees:** DevOps engineer (assigned on rotation)

**Event 3: Old Key Deletion**
- **Recurrence:** Every 90 days
- **Time:** Day +7, 10:00 AM
- **Title:** AWS Federation Credentials - Delete Old Key
- **Description:**
  ```
  Delete old access key after successful rotation.
  Follow: docs/ops/federation-credentials.md#step-6-delete-old-access-key
  Timeline: 5 minutes
  ```
- **Attendees:** DevOps team lead

### Slack/Email Reminders

Consider setting up automated Slack reminders:

```bash
# Example Slack webhook (configure in your environment)
/remind #devops "AWS Federation credential rotation in 7 days - verify current setup" at 9am on [DATE]
/remind #devops "AWS Federation credential rotation TODAY - follow rotation procedure" at 9am on [DATE]
```

### Rotation Log Template

Create `docs/ops/rotation-log.txt`:

```
# AWS Federation Credentials Rotation Log
# Format: Date | Action | New Key ID | Next Rotation Date | Performed By

2025-11-29 | Initial deployment | AKIAIOSFODNN7EXAMPLE | 2026-02-27 | DevOps Team
# 2026-02-27 | 90-day rotation | [TBD] | 2026-05-28 | [Assignee]
# 2026-05-28 | 90-day rotation | [TBD] | 2026-08-26 | [Assignee]
```

Update this log after each successful rotation.

---

## Troubleshooting

### Issue: GetFederationToken Returns Access Denied

**Symptoms:**
```
An error occurred (AccessDenied) when calling the GetFederationToken operation:
User: arn:aws:iam::123456789012:user/ndx-screenshot-automation is not authorized
to perform: sts:GetFederationToken
```

**Resolution:**
1. Verify IAM policy is attached to user:
   ```bash
   aws iam list-attached-user-policies --user-name ndx-screenshot-automation
   ```
2. Check policy document includes `sts:GetFederationToken`
3. Verify you're using correct profile/credentials

### Issue: Credentials Work Locally But Fail in GitHub Actions

**Symptoms:**
- Local `aws sts get-federation-token` succeeds
- GitHub Actions workflow fails with authentication error

**Resolution:**
1. Verify GitHub Secrets are set correctly:
   ```bash
   gh secret list
   ```
2. Check secret names match workflow YAML exactly (case-sensitive)
3. Regenerate secrets if created >90 days ago
4. Test with minimal workflow first

### Issue: Session Duration Error

**Symptoms:**
```
An error occurred (ValidationError) when calling the GetFederationToken operation:
DurationSeconds exceeds MaxSessionDuration
```

**Resolution:**
1. Check CloudFormation parameter `FederationSessionDuration` (default: 3600)
2. Ensure requested duration ≤ 3600 seconds (1 hour per NFR50)
3. Update application code to request 3600 or less

### Issue: Lost Secret Access Key

**Symptoms:**
- Forgot to save secret access key during stack creation
- Need secret key but only have access key ID

**Resolution:**
AWS does not allow retrieving secret access keys after creation. You must:
1. Create new access key (follow Step 2 of standard rotation)
2. Update GitHub Secrets
3. Delete old access key
4. This is effectively an unplanned rotation

---

## Security Contacts

**For security incidents related to credential compromise:**

| Issue Type | Contact | Response Time SLA |
|------------|---------|-------------------|
| Suspected credential leak | ndx@dsit.gov.uk | 1 hour |
| Unusual CloudTrail activity | ndx@dsit.gov.uk | 4 hours |
| Failed rotation | ndx@dsit.gov.uk | 8 hours |
| General questions | ndx@dsit.gov.uk | 1 business day |

**Emergency escalation:** Call DevOps on-call rotation

---

## References

- **Story:** S0.1 - AWS Federation Service Account Setup
- **Tech Spec:** docs/sprint-artifacts/tech-spec-sprint-0.md
- **IAM Policy:** cloudformation/screenshot-automation/iam.yaml
- **Unit Tests:** tests/unit/iam-federation-policy.test.ts
- **AWS Documentation:** [IAM User Rotation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_RotateAccessKey)
- **AWS Documentation:** [GetFederationToken API](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetFederationToken.html)

---

**Document History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-29 | BMAD Dev Workflow | Initial creation for Story S0.1 |
