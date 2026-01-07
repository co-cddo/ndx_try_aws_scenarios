# Epic Technical Specification: Deployment Accessibility & Cost Transparency

Date: 2025-11-28
Author: cns
Epic ID: 2
Status: Draft

---

## Overview

Epic 2 removes the technical barriers that prevent non-technical council users from evaluating AWS services. Building on the discovery foundation from Epic 1, this epic delivers **guided CloudFormation deployment** with pre-configured parameters, deployment progress visibility via AWS Console, cost transparency mechanisms, and zero-deployment evaluation pathways (demo videos, screenshot galleries, partner-led tours).

The core user value is: "I can evaluate AWS without needing CloudFormation expertise, and I know the costs upfront." This directly addresses the PRD's identification that councils face a paradox: they can't evaluate AWS without deploying, but won't deploy without evaluating first. Epic 2 breaks this paralysis by making deployment accessible to non-technical users (Service Managers, Finance officers) while providing zero-deployment alternatives for those who cannot or choose not to deploy.

**Important Framing Clarification:** This epic guides users through AWS CloudFormation Console (not a fully abstracted "one-click" experience). Users will navigate from the familiar GOV.UK-styled portal to the AWS Console interface. The portal provides preparation, context, and post-deployment guidance, while AWS Console handles the actual deployment. This honest framing sets appropriate expectations for non-technical users.

This epic implements FRs 8-12 (Deployment & Infrastructure) and FRs 21-24 (Zero-Deployment Pathways), covering 9 functional requirements that transform the portal from a discovery tool into an active evaluation platform.

## Objectives and Scope

### In Scope

- **Guided CloudFormation Deployment**: Pre-configured CloudFormation templates with all parameters pre-filled, launched via URL redirect to AWS CloudFormation console
- **"What to Expect" Section (Critical Path)**: AWS Console preview screenshots showing the 6-step deployment process (login → review parameters → acknowledge IAM → create stack → monitor → access outputs). Version-resilient design focusing on stable UI elements. This is the primary mitigation for UX discontinuity between GOV.UK portal and AWS Console
- **Deployment Progress Visibility**: User monitors CloudFormation stack events in AWS Console (not portal). Portal provides guidance on interpreting progress indicators and success/failure states
- **Cost Transparency (Maximum Expected Cost)**: Upfront cost visibility with estimated range and maximum expected cost. Explicit statement that councils are responsible for AWS charges in their account. Portal cannot enforce spending limits at runtime - cost tags enable post-hoc tracking only
- **Demo Videos**: 5-10 minute narrated video walkthroughs per scenario showing deployment and key interactions (hosted on YouTube). Positioned as "preview before deployment" to encourage deployment, not replace it. **Modular structure**: separate "AWS Console walkthrough" segments that can be updated independently when AWS UI changes. All videos timestamped (e.g., "Recorded November 2025")
- **Screenshot Gallery**: Annotated screenshot sequences showing key deployment stages and "wow moments" without requiring deployment
- **Partner-Led Tour Contact Form (Risk-Averse Path)**: Form for councils requesting guided evaluation with implementation partners (via GOV.UK Forms Service). **Positioned prominently** as primary option for councils who won't self-deploy due to risk aversion or technical constraints. Creates warm handoffs for partner ecosystem
- **Text-to-Speech Support**: Deployment guides fully compatible with screen readers, critical commands copyable
- **CloudFormation Template Tagging**: Consistent tags (scenario, git-hash, git-tag, max-cost, auto-cleanup) for cost tracking and resource management
- **Automated Cleanup Lambda**: EventBridge-scheduled Lambda function that terminates all scenario resources after **120 minutes** (configurable per scenario, default increased from 90 to accommodate real-world interruptions). Includes "Extend Session" guidance for users needing more time
- **Error Message Translation**: Human-readable error messages for **top 15 common deployment failures** (Fishbone-expanded from 10): IAM permissions, S3 bucket naming, service quotas, region availability, not logged in, wrong region, resource naming conflict, quota exceeded, firewall blocked, session expired, template not found, circular dependency, Lambda code missing, VPC config error, Bedrock access. Other errors display "Contact support" with troubleshooting link
- **Video Accessibility**: Closed captions (English), downloadable transcripts, accessible video player
- **Cost Acknowledgment Gate**: User must explicitly acknowledge: (1) maximum expected cost, (2) council responsibility for AWS charges, (3) cleanup timing before deployment proceeds. **Includes optional email capture** for "Return to complete evaluation" reminder (addresses session continuity weakness)
- **Stack Name Auto-Generation**: Unique stack names following pattern `{scenario-id}-{timestamp}` for conflict prevention
- **Deployment Conversion Tracking**: Target 60%+ of engaged councils attempt deployment (vs. video-only evaluation). Analytics event "Deployment Started" tracks conversion from video viewers
- **Pre-Requisites Checklist (Fishbone-Derived)**: User-facing checklist shown before deployment covering: AWS account access, logged-in status, network requirements, permissions, supported browsers. Addresses high-probability user/network failure causes
- **Deployment Health Monitoring**: Alerting thresholds for abandonment rate (>40%), error rate (>20%), and deployment time (>20min). Weekly metrics report on deployment health

### Out of Scope

- CloudFormation template authoring (templates exist as foundation prerequisite)
- Guided walkthroughs with sample data interactions (Epic 3)
- Evidence Pack generation (Epic 4)
- Post-deployment cost analysis tool (Epic 5)
- Partner CRM integration or automated matching (Phase 2)
- Hosted demo environments (Phase 2)
- Custom domain for deployment endpoints

### Phase 2 Commitments (Documented)

- Hosted demo environments (pre-deployed scenarios, no deployment required)
- Partner matching CRM integration
- Deployment retry mechanisms with exponential backoff
- Multi-region deployment support
- Cost alerting during deployment (real-time budget warnings)
- Deployment history tracking per council

## System Architecture Alignment

### Architecture Components Referenced

This epic extends the Epic 1 portal foundation with deployment orchestration:

| Decision | Component | Epic 2 Implementation |
|----------|-----------|----------------------|
| ADR-1: Portal Model | Static Site + CloudFormation Console | Portal links to AWS CloudFormation console with pre-loaded template URLs |
| ADR-5: Cost Controls | CloudFormation Tags + Budget Controls | All templates include scenario/cost tags; cleanup Lambda enforces 90-min limit |
| ADR-6: Design System | GOV.UK Frontend 5.13.0 | Cost transparency UI, video player styling, form components |

### Architectural Constraints

- **No backend for deployment**: Portal does not execute CloudFormation; it redirects users to AWS CloudFormation console with template URL and parameters
- **AWS account requirement**: Users must have access to AWS Innovation Sandbox account (deployment target is user's AWS account, not NDX-hosted)
- **Template hosting**: CloudFormation templates hosted in GitHub repository, referenced via raw GitHub URLs or S3 bucket
- **Video hosting**: YouTube for video delivery (free, accessible, no infrastructure overhead)
- **Form handling**: GOV.UK Forms Service for partner tour requests (no backend required)
- **Cost tracking limitation**: CloudFormation tags enable AWS Cost Explorer filtering by scenario; portal displays estimates but **cannot enforce spending limits at runtime**. AWS Budgets can alert but not stop resources. If cleanup Lambda fails, costs continue accumulating. Councils bear responsibility for charges in their AWS accounts
- **Cleanup mechanism**: Lambda cleanup function deployed within each CloudFormation stack, triggered by EventBridge scheduled rule. Default 120 minutes (configurable). Cleanup failure is a known risk requiring monitoring
- **Static site tracking boundary**: Portal can only reliably track "Deployment Started" event (user clicks deploy button). Portal **cannot track deployment completion** - this happens in AWS Console. FR9 (real-time stack event tracking) is satisfied by AWS Console, not portal. Analytics for "Deployment Completed" requires either: (a) user manually returns to portal, or (b) Phase 2 callback mechanism via CloudFormation SNS notification
- **UX transition gap**: Users experience jarring shift from GOV.UK-styled portal to AWS Console. This is an inherent limitation of static site architecture. Mitigation via "What to Expect" screenshots and explicit framing

### Known Limitations (Documented for Transparency)

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Portal cannot enforce cost caps | Councils could exceed maximum expected cost | Clear responsibility statement + cost acknowledgment gate |
| Cannot track deployment completion | Analytics gap for success metrics | Track "Deployment Started" + optional user-reported completion |
| AWS Console UX unfamiliar | Non-technical users may struggle | "What to Expect" screenshots + video walkthroughs |
| Cleanup Lambda could fail | Extended costs if resources persist | CloudWatch alerting + manual cleanup documentation |
| Error messages incomplete | Edge cases show technical CloudFormation errors | Top 10 errors covered + "Contact support" fallback |

### Strategic Architecture Considerations (SWOT-Derived)

**Strengths to Leverage:**
- **Zero infrastructure cost** enables sustainable long-term operation without hosting budget
- **No security surface** (static site) builds council trust and reduces compliance burden
- **Template portability** allows councils to fork, customize, and use templates outside NDX:Try
- **Progressive disclosure** via zero-deployment paths reduces barrier to entry

**Weaknesses Requiring Active Mitigation:**

| Weakness | Critical Path Mitigation |
|----------|-------------------------|
| UX discontinuity (portal → AWS Console) | **"What to Expect" is critical path** - invest heavily in AWS Console preview screenshots with version-resilient design |
| Session continuity broken | **Email capture before deployment** - capture in cost acknowledgment gate to enable "Return to complete evaluation" reminder |
| Video production overhead | **Modular video structure** - separate "AWS Console walkthrough" segments that can be updated independently |

**Opportunities to Capture:**
- AWS partnership expansion (propose NDX:Try as official Innovation Sandbox showcase)
- LGA AI Hub amplification (position demo videos as LGA-recommended resources)
- Partner ecosystem growth (partner tour form creates warm handoffs)
- Skills development angle (position as "safe learning environment" for council technical staff)

**Threats Requiring Defensive Strategy:**

| Threat | Defense |
|--------|---------|
| AWS Console changes | Version-resilient documentation focusing on stable UI elements; quarterly screenshot review |
| Council risk aversion | **Partner tour as risk-averse path** - position prominently for councils who won't self-deploy |
| Video content decay | Timestamp videos; plan quarterly refresh; modular structure for targeted updates |
| Budget constraints | **"Informed rejection" messaging** - explicitly validate rejection as successful outcome |

**Strategic Positioning:**
- Differentiate on UK local government specificity (GDS Design System, council data, LGA integration) rather than technical sophistication
- Position deployment experience as "safe learning environment" not just evaluation tool
- Validate "informed rejection" as successful outcome aligned with PRD success metrics (65-80% take action, including formal rejection)

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Owner |
|--------|---------------|--------|---------|-------|
| **Deployment URL Generator** | Constructs CloudFormation console URL with pre-loaded template and parameters | Scenario ID, template URL, default parameters | Full CloudFormation Designer URL with query params (cache-busted with git hash) | Portal (Eleventy filter) |
| **Cost Transparency Display** | Renders cost estimation UI with acknowledgment gate | Scenario cost metadata from scenarios.yaml | Cost breakdown HTML, acknowledgment checkbox state | Portal (Nunjucks component) |
| **"What to Expect" Gallery** | Displays AWS Console screenshot sequence with annotations | Screenshot assets, annotation data | Responsive image gallery with numbered callouts | Portal (Nunjucks component) |
| **Video Player Integration** | Embeds YouTube videos with accessibility controls | YouTube video ID, transcript URL | Accessible video player with captions toggle | Portal (YouTube iframe + custom controls) |
| **Screenshot Walkthrough** | Renders annotated deployment screenshots | Screenshot assets, SVG annotations | Responsive annotated image sequence | Portal (Nunjucks component) |
| **Partner Tour Form** | Captures partner-led tour requests | Form fields (council, contact, scenario interest) | Form submission to GOV.UK Forms Service | GOV.UK Forms Service (external) |
| **Error Message Mapper** | Translates CloudFormation errors to human-readable guidance | CloudFormation error code | User-friendly error message + troubleshooting link + copy-to-clipboard | Portal (static JSON mapping) |
| **Cleanup Lambda** | Terminates scenario resources after timeout | Stack ID, cleanup timeout (default 120 min) | Stack deletion, CloudWatch log entry, SNS notification on failure | CloudFormation template (per-scenario) |
| **Email Reminder Service** | Sends "Return to complete evaluation" emails | User email, scenario ID, deployment timestamp | Email via SES or external service | Phase 2 (documented, not MVP) |
| **Pre-Deploy Session Check** | Verifies user has active AWS Console session before deployment | User click on "Check AWS login" | Opens AWS Console in new tab; user confirms login status | Portal (JS + new tab) |
| **Deployment Interstitial Modal** | Shows "You're leaving NDX:Try" confirmation before redirect | User clicks Deploy button | Modal with "Continue to AWS Console" button; sets interstitialShown flag | Portal (GOV.UK Modal component) |
| **Self-Report Completion** | Captures user-reported deployment success/failure | User returns to portal | "Did your deployment succeed?" buttons; analytics event | Portal (JS + session storage) |
| **Return URL Generator** | Generates portal return URL for CloudFormation outputs | Scenario ID, stack ID | URL with success status and stack reference for inclusion in CFN Outputs | CloudFormation template output |

### Data Models and Contracts

**Scenario Deployment Metadata (Extension to scenarios.yaml)**

```yaml
scenarios:
  - id: council-chatbot
    name: Council Chatbot (Bedrock)
    # ... existing metadata from Epic 1 ...

    # Epic 2 Deployment Metadata
    deployment:
      templateUrl: "https://raw.githubusercontent.com/org/repo/main/cloudformation/council-chatbot.yaml"
      templateS3Url: "https://s3.us-west-2.amazonaws.com/ndx-try-templates/council-chatbot.yaml"
      region: "us-west-2"
      stackNamePrefix: "ndx-council-chatbot"

      parameters:
        - name: "ScenarioTag"
          value: "council-chatbot"
          editable: false
        - name: "CleanupTimeout"
          value: "120"
          editable: false
        - name: "MaxCostTag"
          value: "5.00"
          editable: false

      cost:
        estimatedMin: 0.50
        estimatedMax: 2.00
        maximumExpected: 5.00
        currency: "GBP"
        breakdown:
          - service: "Bedrock API"
            estimated: 0.50
            note: "Depends on chatbot interactions"
          - service: "Lambda"
            estimated: 0.01
          - service: "DynamoDB"
            estimated: 0.01
          - service: "VPC/S3/CloudTrail"
            estimated: 0.01
        cleanupMinutes: 120

      whatToExpect:
        screenshots:
          - step: 1
            image: "/assets/screenshots/aws-console-login.png"
            alt: "AWS Console login page"
            annotation: "Sign in with your Innovation Sandbox credentials"
          - step: 2
            image: "/assets/screenshots/cfn-review-params.png"
            alt: "CloudFormation parameter review"
            annotation: "Parameters are pre-filled - no changes needed"
          # ... steps 3-6 ...

      videos:
        main:
          youtubeId: "abc123xyz"
          duration: "7:32"
          recordedDate: "2025-11"
          transcriptUrl: "/transcripts/council-chatbot-demo.txt"
        awsConsoleSegment:
          youtubeId: "def456uvw"
          duration: "2:15"
          note: "Reusable AWS Console walkthrough segment"

      # Service Blueprint: Handoff Configuration (NEW)
      handoffs:
        preDeployCheck:
          enabled: true
          checkUrl: "https://console.aws.amazon.com/console/home"
          prompt: "Are you logged into your AWS Innovation Sandbox?"
        interstitial:
          enabled: true
          title: "You're leaving NDX:Try"
          message: "You'll now be redirected to AWS Console to complete deployment."
          continueButton: "Continue to AWS Console"
          cancelButton: "Go back"
        returnUrl:
          baseUrl: "https://ndx-try.service.gov.uk/scenarios/council-chatbot/deployed"
          includeInOutputs: true
          outputName: "ReturnToNDXTry"
          outputDescription: "Return to NDX:Try portal to continue your evaluation"

      # Service Blueprint: Cleanup Configuration (NEW)
      cleanup:
        timeoutMinutes: 120
        warningMinutes: 15  # Send warning 15 min before cleanup (if email captured)
        notifyOnFailure:
          enabled: true
          snsTopicArn: "arn:aws:sns:us-west-2:ACCOUNT:ndx-try-cleanup-failures"
          emails:
            - "ndx@dsit.gov.uk"
```

**Error Message Mapping (error-messages.json)**

```json
{
  "errorMappings": [
    {
      "cloudFormationCode": "AccessDenied",
      "pattern": "User:.* is not authorized",
      "userMessage": "Your AWS account doesn't have permission to create these resources.",
      "troubleshootingSteps": [
        "Check you're logged into the correct AWS account",
        "Verify your Innovation Sandbox has CloudFormation permissions",
        "Contact your AWS administrator if permissions are restricted"
      ],
      "supportLink": "/help/permissions-error"
    },
    {
      "cloudFormationCode": "BucketAlreadyOwnedByYou",
      "pattern": "S3.*bucket.*already.*exists",
      "userMessage": "An S3 bucket with this name already exists. Please try again with a different stack name.",
      "troubleshootingSteps": [
        "Go back and modify the stack name",
        "Or delete the existing stack first"
      ],
      "supportLink": "/help/bucket-exists"
    },
    {
      "cloudFormationCode": "LimitExceeded",
      "pattern": "limit.*exceeded|quota.*reached",
      "userMessage": "Your AWS account has reached a service limit.",
      "troubleshootingSteps": [
        "Check AWS Service Quotas in your account",
        "Request a limit increase if needed",
        "Or try deploying in a different region"
      ],
      "supportLink": "/help/service-limits"
    },
    {
      "cloudFormationCode": "NotLoggedIn",
      "pattern": "not.*logged.*in|sign.*in.*required|session.*expired",
      "userMessage": "You're not logged into AWS Console.",
      "troubleshootingSteps": [
        "Click the 'Check AWS Login' link on the deploy page",
        "Sign into your Innovation Sandbox account",
        "Return to NDX:Try and try deploying again"
      ],
      "supportLink": "/help/aws-login"
    },
    {
      "cloudFormationCode": "WrongRegion",
      "pattern": "template.*not.*found|bucket.*does.*not.*exist.*in.*region",
      "userMessage": "The deployment is configured for a different AWS region.",
      "troubleshootingSteps": [
        "Check you're in the us-west-2 (London) region",
        "Click the region selector in the top-right of AWS Console",
        "Select 'Europe (London) us-west-2'"
      ],
      "supportLink": "/help/region-mismatch"
    },
    {
      "cloudFormationCode": "ResourceConflict",
      "pattern": "already.*exists|resource.*conflict|duplicate",
      "userMessage": "A resource with this name already exists in your account.",
      "troubleshootingSteps": [
        "You may have deployed this scenario before",
        "Delete the existing stack from CloudFormation console",
        "Or wait for auto-cleanup (resources delete after 2 hours)"
      ],
      "supportLink": "/help/resource-conflict"
    },
    {
      "cloudFormationCode": "QuotaExceeded",
      "pattern": "quota.*exceeded|service.*limit|maximum.*number",
      "userMessage": "Your AWS account has reached a service limit.",
      "troubleshootingSteps": [
        "Open AWS Service Quotas console",
        "Check limits for the failing service",
        "Request a limit increase if needed"
      ],
      "supportLink": "/help/quota-exceeded"
    },
    {
      "cloudFormationCode": "NetworkBlocked",
      "pattern": "connection.*timed.*out|network.*unreachable|could.*not.*connect",
      "userMessage": "Your network may be blocking access to AWS services.",
      "troubleshootingSteps": [
        "Check if your council firewall allows *.amazonaws.com",
        "Contact your IT team to whitelist AWS endpoints",
        "Try from a different network if possible"
      ],
      "supportLink": "/help/network-requirements"
    }
    // ... additional scenario-specific errors as needed ...
  ],
  "fallbackMessage": {
    "userMessage": "Deployment encountered an unexpected error.",
    "troubleshootingSteps": [
      "Check the CloudFormation Events tab for details",
      "Try deleting the failed stack and deploying again",
      "Contact support if the issue persists"
    ],
    "supportLink": "/help/deployment-error",
    "reportErrorLink": "/feedback/report-error"
  }
}
```

**Cost Acknowledgment State (Session Storage)**

```typescript
interface CostAcknowledgment {
  scenarioId: string;
  acknowledgedAt: string; // ISO timestamp
  acknowledgments: {
    maxCost: boolean;        // "I understand max expected cost is £X"
    councilResponsibility: boolean; // "Council is responsible for charges"
    cleanupTiming: boolean;  // "Resources auto-delete after X minutes"
  };
  email?: string;  // Optional email for return reminder
  consentToReminder: boolean;
}
```

**Deployment Session State (Session Storage) - Service Blueprint Addition**

```typescript
interface DeploymentSession {
  scenarioId: string;
  sessionStartedAt: string;       // When user first viewed scenario
  deploymentStartedAt?: string;   // When user clicked Deploy

  // Pre-deploy handoff tracking
  awsSessionChecked: boolean;     // User clicked "Check AWS login"
  awsSessionConfirmed: boolean;   // User confirmed they're logged in
  interstitialShown: boolean;     // User saw "leaving NDX:Try" modal
  interstitialAccepted: boolean;  // User clicked "Continue to AWS Console"

  // Post-deploy handoff tracking
  returnedToPortal: boolean;      // User came back to portal
  returnedAt?: string;            // When user returned
  selfReportedSuccess: boolean | null;  // User-reported: true=success, false=failure, null=not reported

  // Analytics flags
  videoWatched: boolean;          // User watched demo video
  screenshotsViewed: boolean;     // User viewed screenshot gallery
  partnerTourRequested: boolean;  // User submitted partner form
}
```

**CloudFormation Output for Return URL**

```yaml
# Added to each scenario CloudFormation template
Outputs:
  ReturnToNDXTry:
    Description: "Return to NDX:Try portal to continue your evaluation"
    Value: !Sub "https://ndx-try.service.gov.uk/scenarios/${ScenarioTag}/deployed?status=success&stackId=${AWS::StackId}"
    Export:
      Name: !Sub "${AWS::StackName}-ReturnURL"
```

**Pre-Requisites Checklist Configuration (Fishbone-Derived)**

```yaml
# Pre-deployment checklist shown to users
preRequisites:
  title: "Before You Deploy"
  description: "Verify these items before clicking 'Deploy to Innovation Sandbox'"
  items:
    - id: "aws-account"
      label: "You have an AWS Innovation Sandbox account"
      helpLink: "/help/getting-sandbox-access"
      category: "user"

    - id: "logged-in"
      label: "You are logged into AWS Console"
      checkAction:
        type: "link"
        url: "https://console.aws.amazon.com/console/home"
        label: "Check now (opens in new tab)"
      category: "user"

    - id: "network-access"
      label: "Your council network allows access to *.amazonaws.com"
      helpLink: "/help/network-requirements"
      category: "network"

    - id: "permissions"
      label: "You have CloudFormation permissions in your account"
      helpLink: "/help/required-permissions"
      category: "user"

    - id: "browser"
      label: "You're using a supported browser (Chrome, Firefox, Edge, Safari)"
      category: "user"

  enforcementLevel: "advisory"  # advisory = show but don't block; required = must check all
```

**Deployment Health Monitoring Configuration (Fishbone-Derived)**

```yaml
# Deployment health monitoring and alerting
deploymentHealth:
  alerting:
    enabled: true
    channels:
      - type: "email"
        recipients: ["ndx@dsit.gov.uk"]
      - type: "slack"
        webhook: "${SLACK_WEBHOOK_URL}"  # Optional

  thresholds:
    abandonmentRate:
      warn: 30    # Warn if >30% start but don't complete
      alert: 40   # Alert if >40%
      window: "24h"

    errorRate:
      warn: 15    # Warn if >15% deployments fail
      alert: 20   # Alert if >20%
      window: "24h"

    avgDeploymentTime:
      warn: 15    # Warn if avg >15 minutes
      alert: 20   # Alert if avg >20 minutes
      window: "24h"

  weeklyReport:
    enabled: true
    dayOfWeek: "monday"
    recipients: ["ndx@dsit.gov.uk"]
    metrics:
      - "deploymentStarted"
      - "deploymentCompleted"
      - "deploymentFailed"
      - "selfReportedSuccess"
      - "selfReportedFailure"
      - "topErrorCodes"
      - "abandonmentByStep"
      - "videoToDeploymentConversion"
      - "partnerTourRequests"

  dashboardMetrics:
    - name: "Deployment Funnel"
      stages:
        - "Scenario Viewed"
        - "Cost Info Viewed"
        - "What to Expect Viewed"
        - "Acknowledgments Completed"
        - "Pre-Deploy Check Done"
        - "Deployment Started"
        - "Deployment Completed (self-reported)"

    - name: "Error Distribution"
      groupBy: "errorCode"
      topN: 10

    - name: "Failure Cause Analysis"
      categories:
        - "User Factors"
        - "Portal Factors"
        - "AWS Console Factors"
        - "Template Factors"
        - "Network Factors"
        - "Infrastructure Factors"
```

### APIs and Interfaces

**CloudFormation Console URL Construction**

```javascript
// Eleventy filter: cloudformationDeployUrl
function cloudformationDeployUrl(scenario) {
  const baseUrl = 'https://console.aws.amazon.com/cloudformation/home';
  const params = new URLSearchParams({
    region: scenario.deployment.region,
    stackName: `${scenario.deployment.stackNamePrefix}-${Date.now()}`,
    templateURL: scenario.deployment.templateS3Url
  });

  // Add pre-filled parameters
  scenario.deployment.parameters.forEach((param, index) => {
    params.append(`param_${param.name}`, param.value);
  });

  return `${baseUrl}#/stacks/create/review?${params.toString()}`;
}
```

**YouTube Video Embed Interface**

```html
<!-- Accessible YouTube embed component -->
<div class="ndx-video-player" data-scenario-id="{{ scenario.id }}">
  <iframe
    src="https://www.youtube-nocookie.com/embed/{{ scenario.deployment.videos.main.youtubeId }}?cc_load_policy=1&rel=0"
    title="Demo walkthrough: {{ scenario.name }}"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
    allowfullscreen
    loading="lazy">
  </iframe>

  <div class="ndx-video-controls">
    <a href="{{ scenario.deployment.videos.main.transcriptUrl }}"
       class="govuk-link"
       download>
      Download transcript (TXT)
    </a>
    <span class="ndx-video-metadata">
      Duration: {{ scenario.deployment.videos.main.duration }} |
      Recorded: {{ scenario.deployment.videos.main.recordedDate }}
    </span>
  </div>
</div>
```

**GOV.UK Forms Service Integration**

```yaml
# Partner tour form configuration (submitted to GOV.UK Forms)
partnerTourForm:
  serviceUrl: "https://submit.forms.service.gov.uk/form/ndx-try-partner-tour"
  fields:
    - name: "council_name"
      type: "text"
      required: true
      label: "Council name"
    - name: "contact_name"
      type: "text"
      required: true
      label: "Your name"
    - name: "email"
      type: "email"
      required: true
      label: "Email address"
    - name: "phone"
      type: "tel"
      required: false
      label: "Phone number (optional)"
    - name: "scenario_interest"
      type: "select"
      required: true
      label: "Which scenario interests you?"
      options:
        - "Council Chatbot"
        - "Planning Application AI"
        - "FOI Redaction"
        - "Smart Car Park IoT"
        - "Text-to-Speech"
        - "QuickSight Dashboard"
        - "Not sure - need guidance"
    - name: "additional_context"
      type: "textarea"
      required: false
      label: "Any additional context (optional)"
  privacyNotice: "We'll use your contact info only to connect you with implementation partners."
```

### Workflows and Sequencing

**Primary Flow: Guided Deployment (Enhanced with Service Blueprint Handoffs)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GUIDED DEPLOYMENT WORKFLOW                           │
│                    (Service Blueprint Enhanced)                             │
└─────────────────────────────────────────────────────────────────────────────┘

[Portal: Scenario Detail Page]
         │
         ▼
┌─────────────────────┐
│ 1. View Cost Info   │ ← User sees estimated/max cost, cleanup timing
│    (Portal)         │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 2. "What to Expect" │ ← User reviews 6-step AWS Console screenshots
│    (Portal)         │   Sets expectations for UX transition
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 3. Acknowledgment   │ ← User checks: max cost ✓, responsibility ✓, cleanup ✓
│    Gate (Portal)    │   Optional: enters email for return reminder
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 3a. Pre-Deploy      │ ← NEW: "Are you logged into AWS?" prompt
│    Session Check    │   Link opens AWS Console in new tab to verify
│    (Portal)         │   User confirms: "Yes, I'm logged in"
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 4. Click "Deploy"   │ ← User clicks Deploy button
│    (Portal)         │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 4a. Interstitial    │ ← NEW: Modal: "You're leaving NDX:Try"
│    Modal (Portal)   │   "You'll be redirected to AWS Console"
│                     │   [Continue to AWS Console] [Go back]
└─────────────────────┘
         │
         ▼ (User clicks "Continue")
┌─────────────────────┐
│ 4b. Analytics +     │ ← Analytics event: "Deployment Started"
│    Redirect         │   Redirect URL constructed with cache-busted template
│    (Portal)         │
└─────────────────────┘
         │
         ▼
═══════════════════════════════════════════════════════════════════════════════
                        ↓ USER LEAVES PORTAL FOR AWS CONSOLE ↓
═══════════════════════════════════════════════════════════════════════════════
         │
         ▼
┌─────────────────────┐
│ 5. AWS Console      │ ← User lands on CloudFormation Create Stack page
│    Login (AWS)      │   May need to authenticate if session expired
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 6. Review Params    │ ← All parameters pre-filled, stack name auto-generated
│    (AWS Console)    │   User reviews but doesn't need to edit
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 7. IAM Acknowledge  │ ← Standard CloudFormation IAM capabilities checkbox
│    (AWS Console)    │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 8. Create Stack     │ ← User clicks "Create Stack" button
│    (AWS Console)    │   CloudFormation begins resource provisioning
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 9. Monitor Events   │ ← User watches stack events (real-time in AWS Console)
│    (AWS Console)    │   ~15 minutes for typical scenario
└─────────────────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│ 10a. SUCCESS    │  │ 10b. FAILURE    │
│  Stack complete │  │  Stack failed   │
└─────────────────┘  └─────────────────┘
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│ 11a. Access     │  │ 11b. View Error │ ← User sees CloudFormation error
│  Outputs (AWS)  │  │    (AWS Console)│   May reference portal error guide
└─────────────────┘  └─────────────────┘
         │
         ▼
═══════════════════════════════════════════════════════════════════════════════
                        ↓ USER RETURNS TO PORTAL (IMPROVED HANDOFF) ↓
═══════════════════════════════════════════════════════════════════════════════
         │
         ▼
┌─────────────────────┐
│ 12. Return via      │ ← NEW: User clicks "ReturnToNDXTry" link in CFN Outputs
│    CFN Output Link  │   URL includes ?status=success&stackId=...
│    (AWS → Portal)   │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 12a. Self-Report    │ ← NEW: Portal shows: "Did your deployment succeed?"
│    Completion       │   [Yes, it worked!] [No, it failed] [Not sure]
│    (Portal)         │   Analytics event: "Deployment Completed" or "Deployment Failed"
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 13. Continue to     │ ← User proceeds to Epic 3 walkthrough
│    Walkthrough      │   (If deployment succeeded)
│    (Portal)         │
└─────────────────────┘
```

**Alternative Flow: Video-First Evaluation (Zero-Deployment)**

```
[Portal: Scenario Detail Page]
         │
         ▼
┌─────────────────────┐
│ 1. Watch Demo Video │ ← User views 5-10 min walkthrough
│    (Portal/YouTube) │   Positioned as "preview before deployment"
└─────────────────────┘
         │
         ├──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 2a. Proceed to  │  │ 2b. View        │  │ 2c. Request     │
│  Deployment     │  │  Screenshots    │  │  Partner Tour   │
│  (Primary path) │  │  (Deeper look)  │  │  (Risk-averse)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
   [Deployment Flow]  [Screenshot Gallery]  [Partner Form]
```

**Alternative Flow: Partner-Led Tour (Risk-Averse Path)**

```
[Portal: Scenario Detail Page]
         │
         ▼
┌─────────────────────┐
│ 1. Click "Request   │ ← Prominent button for risk-averse councils
│    Guided Tour"     │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 2. Complete Form    │ ← Council name, contact, scenario interest
│    (Portal)         │   Redirects to GOV.UK Forms Service
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 3. Confirmation     │ ← "Thanks! We'll connect you with a partner soon"
│    (GOV.UK Forms)   │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 4. Partner          │ ← Manual follow-up by NDX team
│    Follow-up        │   (Not automated in MVP)
│    (Offline)        │
└─────────────────────┘
```

**Cleanup Flow (Background) - Enhanced with SNS Notifications**

```
[CloudFormation Stack Created]
         │
         ▼
┌─────────────────────┐
│ EventBridge Rule    │ ← Scheduled trigger: stack creation time + 120 min
│ Created             │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Warning Email       │ ← NEW (if email captured): "Your scenario will be
│ (15 min before)     │   cleaned up in 15 minutes"
│ [Optional]          │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Lambda Triggered    │ ← Cleanup Lambda invoked at scheduled time
│ (After 120 min)     │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Delete Stack        │ ← Lambda calls CloudFormation DeleteStack API
│                     │   Logs action to CloudWatch
└─────────────────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│ SUCCESS         │  │ FAILURE         │
│ Resources       │  │ Cleanup failed  │
│ deleted         │  │                 │
└─────────────────┘  └─────────────────┘
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│ CloudWatch Log  │  │ SNS Notification│ ← NEW: Publishes to ndx-try-cleanup-failures
│ "Cleanup OK"    │  │ + CloudWatch    │   Emails ndx@dsit.gov.uk
└─────────────────┘  │ Alarm           │   Includes stack ID for manual cleanup
                     └─────────────────┘
                            │
                            ▼
                     ┌─────────────────┐
                     │ Manual Cleanup  │ ← Admin deletes orphaned stack
                     │ Required        │   via AWS Console
                     └─────────────────┘
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Measurement | Rationale |
|-------------|--------|-------------|-----------|
| **Portal page load time** | <2 seconds | Lighthouse Performance Score >90 | Council users on variable networks; maintain trust |
| **Deploy button response** | <500ms | Time from click to redirect initiated | Immediate feedback prevents double-clicks |
| **Video embed load** | <3 seconds | YouTube iframe ready state | Video is primary zero-deployment path |
| **Screenshot gallery render** | <1 second | All images loaded and displayed | "What to Expect" is critical path |
| **Cost acknowledgment form** | <200ms per checkbox | UI responsiveness | Smooth interaction builds confidence |
| **CloudFormation URL generation** | <100ms | Server-side (build time) | Pre-computed at build; no runtime latency |
| **Session storage operations** | <50ms | Read/write to localStorage | Instant state persistence |
| **Analytics event dispatch** | Non-blocking | Async fire-and-forget | Never delay user journey for analytics |

**CloudFormation Deployment Performance (AWS-side, not controlled by portal):**
- Stack creation: ~10-20 minutes (typical for scenarios with Lambda, DynamoDB, Bedrock)
- User expectation set via "What to Expect" section showing estimated time
- Portal cannot improve this; can only set accurate expectations

**Image Optimization Requirements (Risk Matrix Addition - P1):**

```yaml
imageOptimization:
  formats: ["webp", "jpg"]  # WebP primary, JPG fallback for older browsers
  maxSizePerImage: 100KB    # Per optimized image
  totalBudgetPerPage: 500KB # Total images per page
  lazyLoading: true         # All images below fold
  responsiveSrcset: [320, 640, 1024, 1440]  # Breakpoints
  loadingSkeleton: true     # Show placeholder while loading

  # "What to Expect" screenshots
  whatToExpectImages:
    format: "webp"
    maxWidth: 800
    quality: 85
    lazyLoad: true

  # Video thumbnails
  videoThumbnails:
    useYouTubeThumbnail: true  # No custom hosting needed
    fallback: "/assets/video-placeholder.svg"
```

### Security

| Requirement | Implementation | Validation |
|-------------|----------------|------------|
| **No sensitive data in portal** | Portal stores no credentials, API keys, or PII server-side | Security review; no secrets in repo |
| **Session storage only** | Acknowledgment state stored in browser localStorage only | No server-side session; data stays on user device |
| **Email handling** | Optional email captured for reminders; passed to GOV.UK Forms or SES | GDPR-compliant; documented in privacy notice |
| **CloudFormation URL integrity** | Template URLs use HTTPS; parameters URL-encoded | No injection vectors in URL construction |
| **Template hosting security** | Templates in public S3 bucket (read-only) or GitHub raw | No write access; versioned via git hash |
| **Cross-site scripting (XSS)** | All user inputs escaped; CSP headers where possible | OWASP ZAP scan; manual review |
| **Content Security Policy** | Meta tag CSP for GitHub Pages (full headers require CloudFront) | Documented limitation |
| **Third-party embed security** | YouTube nocookie domain; no tracking cookies | Privacy-enhanced mode |
| **AWS account isolation** | Deployments go to user's Innovation Sandbox, not shared account | No multi-tenant risks; user owns resources |
| **Cleanup Lambda permissions** | Lambda has DeleteStack permission only for stacks with matching tags | Least privilege; cannot affect other resources |

**Security Boundaries:**
- Portal is entirely static; no attack surface for server-side vulnerabilities
- All sensitive operations happen in user's AWS account, protected by their IAM policies
- Portal cannot access user's AWS credentials or deployed resources

**Automated Security Scanning (Risk Matrix Addition - P1):**

```yaml
securityScanning:
  ci:
    - tool: "OWASP ZAP"
      frequency: "every PR"
      scanType: "baseline"  # Quick scan for PRs
      failOn: "high severity"
      reportTo: "pr-comments"

    - tool: "npm audit"
      frequency: "every build"
      failOn: "critical"
      autoFix: false  # Manual review required

    - tool: "Snyk"
      frequency: "weekly"
      scanType: "dependencies"
      failOn: "high severity"

  scheduled:
    - tool: "OWASP ZAP"
      frequency: "weekly"
      scanType: "full"  # Comprehensive scan
      reportTo: "ndx@dsit.gov.uk"

  preLaunch:
    - tool: "Manual penetration test"
      scope: "Portal + CloudFormation URL generation"
      provider: "TBD"
      requirement: "No high/critical findings"

  cspMigrationPath:
    currentState: "Meta tag CSP (GitHub Pages limitation)"
    targetState: "HTTP header CSP via CloudFront"
    trigger: "Traffic exceeds 50GB/month OR security audit requires"
    effort: "Medium (CloudFront + S3 migration)"
```

**Cleanup Lambda IAM Policy Specification (Risk Matrix Addition - P2):**

```yaml
cleanupLambdaIAM:
  policyName: "NDXTryCleanupLambdaPolicy"
  permissions:
    - effect: "Allow"
      action: "cloudformation:DeleteStack"
      resource: "arn:aws:cloudformation:us-west-2:*:stack/ndx-*/*"
      condition:
        StringEquals:
          "aws:ResourceTag/ndx-try-managed": "true"

    - effect: "Allow"
      action: "cloudformation:DescribeStacks"
      resource: "arn:aws:cloudformation:us-west-2:*:stack/ndx-*/*"

    - effect: "Allow"
      action:
        - "logs:CreateLogGroup"
        - "logs:CreateLogStream"
        - "logs:PutLogEvents"
      resource: "arn:aws:logs:us-west-2:*:log-group:/aws/lambda/ndx-try-cleanup-*"

    - effect: "Allow"
      action: "sns:Publish"
      resource: "arn:aws:sns:us-west-2:*:ndx-try-cleanup-failures"

  # Explicit denies for safety
  explicitDenies:
    - effect: "Deny"
      action: "cloudformation:DeleteStack"
      resource: "*"
      condition:
        StringNotEquals:
          "aws:ResourceTag/ndx-try-managed": "true"
```

### Reliability/Availability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| **Portal availability** | 99.9% uptime | GitHub Pages with CDN; no single point of failure |
| **Graceful degradation** | Core functions work without JavaScript | Progressive enhancement; deploy link works in no-JS mode |
| **Video fallback** | Transcript available if video fails | Downloadable transcript for each video |
| **Form fallback** | GOV.UK Forms handles partner requests independently | No portal backend dependency |
| **Cleanup Lambda reliability** | 99% success rate | CloudWatch alerting on failures; SNS notification for manual intervention |
| **Template availability** | Templates always accessible | S3 bucket with versioning; GitHub raw as backup |
| **CDN cache invalidation** | <5 minutes for content updates | GitHub Pages CDN automatic; manual purge if needed |

**Failure Modes and Recovery:**

| Failure Mode | Impact | Recovery |
|--------------|--------|----------|
| GitHub Pages outage | Portal inaccessible | Wait for GitHub recovery; no user action required |
| YouTube outage | Videos unavailable | Screenshot gallery and transcripts remain available |
| S3 template bucket inaccessible | Deployments fail | Switch to GitHub raw URLs; documented backup |
| Cleanup Lambda failure | Resources persist; cost overrun | SNS alert; manual cleanup per SLA below |
| GOV.UK Forms outage | Partner requests fail | Form shows error; users directed to email contact |
| AWS CloudFormation service issue | Deployments fail | AWS Status page link shown; retry later |

**Cleanup Lambda SLA & Retry Mechanism (Risk Matrix Addition - P1):**

```yaml
cleanupSLA:
  # Automatic retry before alerting
  automaticRetry:
    enabled: true
    maxAttempts: 2
    backoffMinutes: 5
    retryOn:
      - "ThrottlingException"
      - "ServiceException"
      - "ResourceNotFoundException"  # Stack may have been manually deleted

  # Response time commitments
  manualResponse:
    businessHours:
      definition: "09:00-18:00 GMT, Monday-Friday"
      sla: "4 hours"
      action: "Manual stack deletion via AWS Console"
    outsideHours:
      sla: "Next business day by 12:00"
      action: "Same as business hours"

  # Escalation path
  escalation:
    level1:
      after: "4 hours (business hours) or next business day"
      to: "ndx@dsit.gov.uk"
      action: "Investigate and resolve"
    level2:
      after: "8 hours (business hours)"
      to: "ndx@dsit.gov.uk"
      action: "Priority investigation; consider cost impact"

  # Cost protection
  costProtection:
    maxExposurePerFailure: "£10"  # 2x max scenario cost
    weeklyAudit: true
    auditDay: "Monday"
    auditAction: "Review all cleanup failures from previous week"

  # Health check
  healthCheck:
    endpoint: "CloudWatch Logs Insights query"
    frequency: "daily"
    query: "filter @message like /CLEANUP_FAILED/"
    alertIfCount: "> 0"
```

**Template URL Failover Procedure (Risk Matrix Addition - P1):**

```yaml
templateFailover:
  primary:
    source: "S3"
    url: "https://s3.us-west-2.amazonaws.com/ndx-try-templates/{scenario}.yaml"
    healthCheck: "HEAD request returns 200"

  backup:
    source: "GitHub Raw"
    url: "https://raw.githubusercontent.com/org/repo/main/cloudformation/{scenario}.yaml"
    healthCheck: "HEAD request returns 200"

  failoverProcedure:
    detection: "S3 returns 403/404/5xx for >5 minutes"
    action: "Update scenarios.yaml templateS3Url to GitHub raw URL"
    automation: "Manual for MVP; automated in Phase 2"
    rollback: "Revert scenarios.yaml when S3 recovers"

  cacheBusting:
    implementation: "?v={git-short-hash}"
    example: "https://s3.../council-chatbot.yaml?v=abc1234"
    updateFrequency: "Every deployment (GitHub Actions)"
```

### Observability

| Metric Category | Metrics Tracked | Tool |
|-----------------|-----------------|------|
| **Portal Analytics** | Page views, time on page, bounce rate, scroll depth | Google Analytics 4 (or privacy-friendly alternative) |
| **Deployment Funnel** | Scenario viewed → Cost viewed → What to Expect viewed → Ack completed → Deploy clicked | Custom events in GA4 |
| **Conversion Metrics** | Video-to-deployment conversion, partner request rate, abandonment by step | GA4 custom dimensions |
| **Error Tracking** | JavaScript errors, failed resource loads, broken links | Sentry or similar (optional) |
| **Deployment Health** | Deployment started/completed/failed (self-reported), error codes | GA4 events + weekly report |
| **Cleanup Monitoring** | Lambda invocations, success/failure, duration | CloudWatch Logs + Metrics |
| **Cost Tracking** | AWS Cost Explorer filtered by scenario tags | AWS native; manual review |

**Dashboard Requirements:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    EPIC 2 OBSERVABILITY DASHBOARD                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  DEPLOYMENT FUNNEL (Last 7 days)                                        │
│  ══════════════════════════════                                         │
│  Scenario Viewed:        1,234  ████████████████████████████████████    │
│  Cost Info Viewed:         987  ████████████████████████████            │
│  What to Expect Viewed:    876  ██████████████████████████              │
│  Acknowledgments Done:     654  ████████████████████                    │
│  Deployment Started:       432  ██████████████                          │
│  Deployment Completed:     345  ███████████                             │
│                                                                         │
│  Conversion Rate: 28% (Viewed → Completed)                              │
│  Abandonment Rate: 20% (Started → not Completed)                        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ERROR DISTRIBUTION (Last 7 days)          TOP SCENARIOS                │
│  ═════════════════════════════════         ═════════════                │
│  AccessDenied:        45  ████████         Council Chatbot:    156      │
│  NotLoggedIn:         32  █████            Planning AI:        134      │
│  ResourceConflict:    21  ███              FOI Redaction:       89      │
│  QuotaExceeded:       12  ██               Smart Car Park:      53      │
│  NetworkBlocked:       8  █                                             │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CLEANUP HEALTH (Last 24 hours)            ALERTS                       │
│  ══════════════════════════════            ══════                       │
│  Stacks Created:      45                   ⚠ Abandonment rate: 22%      │
│  Cleanups Triggered:  42                     (threshold: 20%)           │
│  Cleanups Succeeded:  41                   ✓ Error rate: 12% (OK)       │
│  Cleanups Failed:      1                   ✓ Avg deploy time: 14m (OK)  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Alerting Rules:**

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High abandonment rate | >40% start but don't complete (24h window) | Warning | Review funnel; check for UX issues |
| High error rate | >20% deployments fail (24h window) | Critical | Check error distribution; investigate top error |
| Cleanup failure | Any cleanup Lambda failure | Critical | Manual cleanup required per SLA |
| Deployment time spike | Avg >20 minutes (24h window) | Warning | Check AWS service health |
| Zero deployments | No deployments in 48 hours | Info | Verify portal is accessible; check traffic |

**Observability Baseline Period (Risk Matrix Addition - P2):**

```yaml
observabilityBaseline:
  # Initial period with relaxed thresholds
  period: "first 14 days post-launch"
  adjustThresholdsAfter: true

  initialThresholds:
    abandonmentRate: 50%    # Higher tolerance initially (expect learning curve)
    errorRate: 30%          # Higher tolerance initially (expect edge cases)
    avgDeploymentTime: 25   # Minutes; allow for slower first-time users

  targetThresholds:
    abandonmentRate: 40%    # Tighten after baseline data collected
    errorRate: 20%          # Tighten after common errors addressed
    avgDeploymentTime: 20   # Minutes; users become familiar

  baselineReview:
    reviewDate: "Launch + 14 days"
    reviewOwner: "Product Manager"
    deliverables:
      - "Actual baseline metrics report"
      - "Threshold adjustment recommendations"
      - "Top 5 improvement opportunities"

  knownLimitations:
    - limitation: "Self-report completion rate may be low"
      impact: "Incomplete deployment success data"
      mitigation: "Incentivize self-reporting; use as directional indicator only"

    - limitation: "Error codes not captured from AWS Console"
      impact: "Cannot automatically categorize all failures"
      mitigation: "Rely on self-report + error guide page views"

    - limitation: "Cost tracking delayed 24-48h"
      impact: "No real-time cost alerting"
      mitigation: "Weekly cost audit; accept delay as AWS limitation"
```

**Self-Report Incentive Configuration (Risk Matrix Addition - P2):**

```yaml
selfReportIncentive:
  # Shown when user returns to portal after deployment
  triggerCondition: "URL contains ?status=success OR user visits /deployed page"

  successReport:
    prompt: "Did your deployment succeed?"
    options:
      - label: "Yes, it worked!"
        icon: "✓"
        analyticsEvent: "deployment_success_reported"
        nextAction:
          type: "redirect"
          destination: "/scenarios/{scenario-id}/walkthrough"
          message: "Great! Let's explore what you've deployed →"

      - label: "No, it failed"
        icon: "✗"
        analyticsEvent: "deployment_failure_reported"
        nextAction:
          type: "expand"
          content: "errorTroubleshootingGuide"
          message: "Sorry to hear that. Let's help you troubleshoot:"

      - label: "Not sure / Still in progress"
        icon: "?"
        analyticsEvent: "deployment_status_unknown"
        nextAction:
          type: "expand"
          content: "howToCheckStatus"
          message: "Here's how to check your deployment status in AWS Console:"

  # Incentive messaging
  incentiveText:
    beforeReport: "Help us improve! Tell us how your deployment went."
    afterSuccessReport: "Thanks! You've unlocked the guided walkthrough."
    afterFailureReport: "Thanks for letting us know. We'll use this to improve."

  # Analytics tracking
  conversionTracking:
    funnel:
      - "deployment_started"
      - "portal_return"
      - "self_report_shown"
      - "self_report_submitted"
      - "walkthrough_started"
    targetConversion: "40%"  # Of deployment_started → self_report_submitted
```

### Security Hardening (Red Team Analysis Additions)

**RT-001: Return URL Allowlist (P1 - High Severity)**

```yaml
returnUrlSecurity:
  # Prevent open redirect attacks via CloudFormation output manipulation
  allowedDomains:
    - "ndx-try.service.gov.uk"
    - "localhost:8080"  # Development only; removed in production build

  validation:
    clientSide: true    # JavaScript checks before redirect
    implementation: |
      function validateReturnUrl(url) {
        const allowed = ['ndx-try.service.gov.uk'];
        try {
          const parsed = new URL(url);
          return allowed.includes(parsed.hostname);
        } catch {
          return false;  // Invalid URL = reject
        }
      }

  fallbackBehavior:
    onInvalidUrl: "redirect to /scenarios/{scenario-id} instead"
    logEvent: "security_return_url_blocked"
```

**RT-002: Stack Tracking Beyond Tags (P1 - High Severity)**

```yaml
stackTracking:
  # Secondary tracking to prevent tag manipulation bypass
  primaryIdentifier: "aws:ResourceTag/ndx-try-managed = true"

  secondaryIdentifier:
    method: "Stack name pattern + DynamoDB registry"
    stackNamePattern: "ndx-try-{scenario-id}-{timestamp}"
    registry:
      tableName: "ndx-try-stack-registry"
      attributes:
        - stackName: "S"
        - createdAt: "S"  # ISO 8601
        - expectedCleanupAt: "S"
        - scenarioId: "S"
        - cleanedUp: "BOOL"
      ttl: "expectedCleanupAt + 24 hours"

  cleanupLogic: |
    # Cleanup Lambda now checks BOTH:
    # 1. Tag exists (original check)
    # 2. Stack name matches pattern AND exists in registry
    # If tag removed but registry entry exists → ALERT (potential bypass attempt)

  bypassDetection:
    condition: "Registry entry exists but tag missing"
    action: "SNS alert to ndx@dsit.gov.uk"
    severity: "High"
    includeInAlert:
      - stackName
      - awsAccountId
      - createdAt
      - lastKnownTags
```

**RT-003: Self-Report Data Integrity (P2 - High Severity)**

```yaml
selfReportIntegrity:
  # Prevent metric manipulation via fake submissions
  protections:
    rateLimiting:
      enabled: true
      maxReportsPerSession: 3    # Same sessionId
      maxReportsPerIp: 10        # Per hour (requires CloudFront)
      implementation: "localStorage counter + optional CloudFront rate limiting"

    crossValidation:
      enabled: true
      method: "Compare self-reports with cleanup events"
      logic: |
        # If user reports "success" but cleanup Lambda finds no matching stack
        # within 2 hours of report → flag as suspicious
        # Weekly report: self-report vs cleanup correlation

    honeypot:
      enabled: true
      hiddenField: "deployment_id_confirm"  # CSS hidden
      onFilledIn: "discard submission; log as bot"

  dataQualityIndicators:
    trustScore:
      high: "Self-report + cleanup event + session duration >15min"
      medium: "Self-report only with valid session"
      low: "Self-report without valid session or rapid submission"

    dashboardDisplay: "Show trust-weighted metrics alongside raw metrics"
```

**RT-004: Cleanup Lambda Concurrency Protection (P1 - High Severity)**

```yaml
cleanupConcurrencyProtection:
  # Prevent DoS via mass stack creation
  architecture:
    eventBridge: "Triggers SQS instead of Lambda directly"
    sqsQueue:
      name: "ndx-try-cleanup-queue"
      visibilityTimeout: 300  # 5 minutes
      maxReceiveCount: 3      # Before DLQ
      dlqName: "ndx-try-cleanup-dlq"

    lambdaTrigger:
      batchSize: 5            # Process 5 cleanups per invocation
      maxConcurrency: 10      # Reserved concurrency limit

  rateControl:
    maxStacksPerAccount: 3    # Per Innovation Sandbox account simultaneously
    enforcement: "Pre-deploy check (best effort; relies on stack name pattern)"

  alerting:
    queueDepthThreshold: 50   # More than 50 pending cleanups
    dlqThreshold: 1           # Any message in DLQ
    action: "PagerDuty alert to on-call"
```

**RT-005: Cost Attack Early Warning (P1 - High Severity)**

```yaml
costEarlyWarning:
  # Compensate for 24-48h AWS billing delay
  cloudWatchBillingAlarm:
    enabled: true
    threshold: 50             # £50 daily spend
    period: "24 hours"
    action: "SNS → ndx@dsit.gov.uk"

  stackCountAlarm:
    enabled: true
    threshold: 100            # More than 100 active stacks
    period: "1 hour"
    action: "SNS → platform-team"
    rationale: "Proxy for cost; faster than billing data"

  cleanupFailureAccumulation:
    enabled: true
    threshold: 10             # 10+ failed cleanups in 24h
    action: "Escalate to tech-lead; potential cost attack"
```

**RT-006: Template Bucket Protection (P2 - High Severity)**

```yaml
templateBucketProtection:
  s3Security:
    versioning: true
    mfaDelete: true           # Requires MFA to delete versions
    blockPublicAccess:
      blockPublicAcls: true
      ignorePublicAcls: true
      blockPublicPolicy: false  # Must allow public read for templates
      restrictPublicBuckets: false

    bucketPolicy: |
      {
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::ndx-try-templates/*"
      }
      // Note: No ListBucket to prevent enumeration

  automatedFailover:
    healthCheckLambda:
      schedule: "rate(5 minutes)"
      action: "HEAD request to each template URL"
      onFailure:
        - "Update scenarios.yaml templateUrl to GitHub raw"
        - "Trigger GitHub Actions rebuild"
        - "SNS alert to platform-team"

    phase: "Phase 2 (manual failover for MVP)"
```

**RT-007: Analytics Integrity (P3 - Medium Severity)**

```yaml
analyticsIntegrity:
  ga4Protection:
    debugMode: false          # Production only
    internalTrafficFilter:
      enabled: true
      ipRanges: ["office IPs", "VPN ranges"]
      excludeFromReporting: true

    eventValidation:
      requiredParameters:
        - sessionId
        - timestamp
        - userAgent
      suspiciousPatterns:
        - "More than 100 events per session"
        - "Events without page_view in session"
        - "Deployment events without prior scenario_view"
      onSuspicious: "Flag in BigQuery; exclude from dashboards"

  referenceDataset:
    name: "ndx-try-analytics-validated"
    description: "Cleaned dataset excluding suspicious activity"
    refreshFrequency: "daily"
```

**RT-008: Image Size Enforcement (P2 - Medium Severity)**

```yaml
imageSizeEnforcement:
  ciCheck:
    enabled: true
    trigger: "Every PR modifying /assets/images/"
    rules:
      - maxSizePerImage: 100KB
      - totalPerPage: 500KB
      - allowedFormats: ["webp", "jpg", "png", "svg"]
      - maxDimensions: 1920x1080

    implementation: |
      # .github/workflows/image-check.yml
      - name: Check image sizes
        run: |
          find assets/images -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" \) |
          while read f; do
            size=$(stat -f%z "$f")
            if [ $size -gt 102400 ]; then
              echo "ERROR: $f exceeds 100KB ($size bytes)"
              exit 1
            fi
          done

    failAction: "Block PR merge"
```

### Security Threat Model Summary

| Threat | Likelihood | Impact | Mitigation | Residual Risk |
|--------|------------|--------|------------|---------------|
| Return URL redirect attack | Low | High | Domain allowlist | Low |
| Tag manipulation bypass | Medium | High | DynamoDB registry + alerting | Low |
| Self-report data poisoning | Medium | Medium | Rate limiting + cross-validation | Medium |
| Cleanup concurrency exhaustion | Low | High | SQS queue + rate control | Low |
| Cost attack via mass stacks | Low | High | Billing alarms + stack limits | Low |
| Template bucket compromise | Very Low | High | MFA delete + versioning | Very Low |
| Analytics data corruption | Medium | Low | Filtering + validated dataset | Low |
| Image bomb DoS | Low | Medium | CI size enforcement | Very Low |

### NFR Design Decisions (Six Thinking Hats Analysis)

**Data Gaps Identified (White Hat):**

| Unknown | Impact | Resolution |
|---------|--------|------------|
| Actual council network speeds | Performance targets may be wrong | Add network speed survey to pilot; adjust thresholds |
| Ad blocker usage rate | Analytics accuracy unknown | Sample via feature detection; document margin of error |
| Expected deployment volume | Cleanup scaling uncertainty | Start with conservative limits; scale based on pilot |
| Self-report completion rate | Metric reliability | **Revised target: 25%** (was 40%); add proxy metrics |

**Emotional Journey Considerations (Red Hat):**

```yaml
emotionalJourneyMitigations:
  # Address user anxiety during handoff to AWS Console
  abandonmentAnxiety:
    trigger: "User redirected to AWS Console"
    mitigation: "What to Expect screenshots; 'We'll be here when you get back' message"

  cleanupPanicPrevention:
    trigger: "15-minute warning email"
    currentMessage: "Your scenario will be cleaned up in 15 minutes"
    revisedMessage: "Your scenario session is ending soon. Don't worry - you can redeploy anytime!"
    tone: "Reassuring, not threatening"

  selfReportFatigue:
    trigger: "Prompt shown after deployment"
    mitigation: "Single-click options; no required fields; thank immediately"
    timing: "Show once per session; don't re-prompt on page refresh"
```

**Alternative Success Metrics (Green Hat Additions):**

```yaml
alternativeSuccessMetrics:
  # Reduce reliance on self-report with proxy signals

  cleanupAsSuccessProxy:
    description: "If cleanup Lambda succeeds and stack existed >15 min, likely successful"
    logic: |
      successfulDeploymentProxy = (
        cleanupLambda.status == "SUCCESS" &&
        (cleanupTime - stackCreationTime) > 15 minutes
      )
    confidence: "Medium - doesn't confirm user achieved learning goals"
    dashboardLabel: "Inferred Successful Deployments"

  errorGuideInverseMetric:
    description: "High error guide views = high failure rate"
    calculation: "errorGuideViews / deploymentStarted"
    threshold: ">30% suggests deployment issues"
    dashboardLabel: "Troubleshooting Rate"

  walkthroughEngagement:
    description: "User accessing walkthrough implies deployment worked"
    signal: "pageView on /scenarios/{id}/walkthrough within 2h of deploy"
    confidence: "High - user wouldn't view walkthrough if deployment failed"
    dashboardLabel: "Walkthrough Conversion"

  emailConfirmationClick:
    description: "Click unique link in reminder email to confirm success"
    implementation: |
      # Reminder email includes:
      # "Did your deployment work? Click here to let us know: [Yes] [No]"
      # Each link has unique token tied to deployment session
    confidence: "High - explicit user action"
    phase: "Phase 2 (requires email capture)"
```

**Activity-Based Cleanup Extension (Green Hat Addition):**

```yaml
activityBasedExtension:
  description: "Extend cleanup window if user shows continued engagement"

  triggers:
    - event: "User returns to portal scenario page"
      extension: 30  # minutes
      maxExtensions: 2

    - event: "User clicks 'I need more time' on warning email"
      extension: 60  # minutes
      maxExtensions: 1
      requiresEmailCapture: true

  constraints:
    absoluteMaximum: 240  # 4 hours hard cap
    rationale: "Balance user needs with cost control"

  implementation:
    phase: "Phase 2"
    mvpBehavior: "Fixed 120-minute window; document extension as future feature"

  userCommunication:
    onExtension: "Great news! Your session has been extended by {n} minutes."
    onMaxReached: "You've reached the maximum session time. Please save your work."
```

**Revised SLA Commitments (Black Hat Revision):**

```yaml
revisedCleanupSLA:
  # Tightened based on cost exposure analysis

  manualResponse:
    businessHours:
      definition: "09:00-18:00 GMT, Monday-Friday"
      sla: "2 hours"  # Was 4 hours
      rationale: "£5+ cost exposure per hour; faster response justified"

    outsideHours:
      sla: "Next business day by 10:00"  # Was 12:00
      rationale: "Reduce overnight cost accumulation"

  escalation:
    level1:
      after: "2 hours (business hours)"  # Was 4 hours
      to: "ndx@dsit.gov.uk"

    level2:
      after: "4 hours (business hours)"  # Was 8 hours
      to: "tech-lead@ndx-try.service.gov.uk"

  weekendCoverage:
    enabled: false
    rationale: "Cost exposure acceptable for 48h; revisit if volume increases"
    reviewTrigger: "More than 5 cleanup failures per weekend"
```

**Revised Targets (Red + Black Hat):**

| Original Target | Revised Target | Rationale |
|-----------------|----------------|-----------|
| 40% self-report conversion | **25%** | Optimistic; users rarely report voluntarily |
| 4-hour cleanup SLA | **2 hours** | Cost exposure too high at 4h |
| Single success metric | **Multi-signal** | Self-report + cleanup proxy + walkthrough |
| Fixed 120-min window | **Extensible (Phase 2)** | Users need flexibility |

**Partner-Verified Deployments (Green Hat Addition):**

```yaml
partnerVerifiedDeployments:
  description: "During partner-led tours, partner confirms deployment success"

  workflow:
    - step: 1
      action: "Partner schedules guided tour via GOV.UK Forms"
    - step: 2
      action: "Partner receives unique tour session ID"
    - step: 3
      action: "During tour, partner deploys scenario with council staff"
    - step: 4
      action: "Partner clicks 'Verify Deployment' in tour dashboard"
    - step: 5
      action: "System records verified successful deployment"

  benefits:
    - "100% accurate success data for partner-led sessions"
    - "Enables partner performance tracking"
    - "Provides ground truth to calibrate self-report accuracy"

  phase: "Phase 2"
  mvpWorkaround: "Partner manually logs successful tours in shared spreadsheet"
```

### Implementation Prioritization (Cost-Benefit Analysis)

**MVP Scope Summary:**

| Category | MVP Items | Total Effort |
|----------|-----------|--------------|
| Performance | Page load targets, image optimization, CI size check | 3.5 days |
| Security | CSP meta tag, return URL allowlist, IAM policy, OWASP ZAP, Snyk | 3.5 days |
| Reliability | Progressive enhancement, cleanup Lambda, auto-retry, SNS alerts | 4 days |
| Observability | GA4 setup, funnel events, CloudWatch metrics, proxy metrics | 4 days |
| **Total MVP** | | **~15 dev days** |

**Quick Wins (< 1 day each, implement first):**

| Item | Effort | ROI | Rationale |
|------|--------|-----|-----------|
| Image CI size check | 0.5 day | High | Prevents performance regression forever |
| Return URL allowlist | 0.5 day | High | Blocks redirect attacks with minimal code |
| Cleanup-as-success proxy metric | 0.5 day | High | Doubles data quality; trivial to add |
| Error guide inverse metric | 0.5 day | High | Free failure signal from existing page views |
| Self-report honeypot | 0.5 day | High | CSS-hidden field blocks bots |
| Billing alarm (£50/day) | 0.5 day | High | Critical cost protection |
| Stack count alarm (>100) | 0.5 day | High | Early warning proxy for cost |

**Phase 2 Deferrals (20 dev days saved):**

| Item | Effort | Why Defer | Trigger to Implement |
|------|--------|-----------|---------------------|
| DynamoDB stack registry (RT-002) | 3 days | Tag bypass is edge case | First detected bypass attempt |
| SQS cleanup queue (RT-004) | 2 days | Direct Lambda OK at MVP volume | >50 concurrent cleanups |
| Automated template failover | 3 days | Manual failover acceptable | Second S3 outage incident |
| Activity-based cleanup extension | 3 days | Fixed 120min OK for MVP | >20% user complaints about timing |
| Partner verification dashboard | 4 days | Spreadsheet workaround exists | >10 partner tours/week |
| Email confirmation tracking | 3 days | Requires email capture flow | Email capture implemented |
| Validated analytics dataset | 2 days | Raw data sufficient initially | Data integrity issues detected |

**Explicitly Cut (Low ROI):**

| Item | Effort | Why Cut |
|------|--------|---------|
| Loading skeletons | 1 day | Polish feature; images load fast enough with lazy loading |
| Responsive srcset (4 breakpoints) | 1 day | 2 breakpoints (mobile/desktop) sufficient for MVP |
| Full validated analytics dataset | 2 days | Overkill; manual review catches issues |

**Financial Justification:**

```yaml
costBenefitSummary:
  # Without NFR controls
  annualExpectedLoss:
    cleanupFailures: "£260"      # 10%/week × £50/incident
    massDeploymentAttack: "£5"   # 1%/year × £500
    tagBypass: "£1"              # 0.5%/year × £200
    total: "~£270/year"

  # With MVP controls
  controlInvestment:
    initialDevelopment: "£12,000"  # 15 days × £800/day
    annualOperations: "£700"       # Monitoring, alerts, manual cleanup

  # ROI calculation
  paybackPeriod: "Financial: ~2 years"
  trueValue: |
    Reputational risk >> financial risk
    One public failure could damage CDDO credibility
    Controls are table stakes for public sector service

  # Phase 2 savings
  deferredEffort: "20 dev days = £16,000"
  deferralRisk: "Low - triggers defined; can implement reactively"
```

**Implementation Order (recommended):**

```
Week 1: Quick Wins
├── Image CI check
├── Return URL allowlist
├── Billing + stack count alarms
├── Self-report honeypot
└── Proxy metrics (cleanup-as-success, error guide)

Week 2: Core Security
├── CSP meta tag
├── Cleanup Lambda IAM policy
├── OWASP ZAP in CI
└── Snyk weekly scan

Week 3: Reliability
├── Progressive enhancement
├── Cleanup Lambda
├── Auto-retry mechanism
└── SNS failure alerts

Week 4: Observability
├── GA4 setup
├── Deployment funnel events
├── CloudWatch metrics
└── Basic self-report form

Post-Launch: Phase 2 (as triggered)
├── DynamoDB registry → if bypass detected
├── SQS queue → if concurrency issues
├── Activity extension → if user complaints
└── Partner dashboard → if tour volume grows
```

**Decision Log:**

| Decision | Rationale | Reversible? |
|----------|-----------|-------------|
| Defer DynamoDB registry | Tag bypass unlikely; alert on cleanup failure sufficient | Yes - add later |
| 25% self-report target (not 40%) | Realistic; supplement with proxy metrics | Yes - adjust threshold |
| 2-hour SLA (not 4-hour) | £5/hour exposure; tighter SLA justified | Yes - relax if burden too high |
| Cut loading skeletons | Lazy loading + small images = fast enough | Yes - add for polish |
| Manual template failover | Automated failover complex; outages rare | Yes - automate in Phase 2 |

### Pre-Mortem Failure Modes & Mitigations

**Imagined Failure Headline:**
> *"NDX:Try Portal Pulled After Cost Overruns and Security Incident - Council trust damaged"*

**Identified Failure Modes:**

| ID | Failure Mode | Likelihood | Impact | Risk |
|----|--------------|------------|--------|------|
| PM-01 | Weekend cost spike (200+ stacks, £8k+) | Medium | High | **HIGH** |
| PM-02 | Return URL phishing attack | Low | Critical | **HIGH** |
| PM-03 | Metrics blindness (decisions on bad data) | High | Medium | **HIGH** |
| PM-04 | Performance death spiral (large images) | Medium | High | **HIGH** |
| PM-05 | UX collapse (time limit confusion) | Medium | High | **HIGH** |
| PM-06 | Silent cleanup Lambda failure | Low | Critical | **MEDIUM** |

**Critical Mitigations (Added to MVP):**

```yaml
premortemMitigations:
  # PM-01: Weekend Cost Spike
  weekendCostProtection:
    pagerdutyIntegration:
      enabled: true
      escalationPolicy: "ndx-try-critical"
      triggers:
        - "Billing alarm (any amount on weekend)"
        - "Stack count >50"
        - "Cleanup failure"
      effort: "0.5 day"

    weekendBillingThreshold:
      weekday: "£50"
      weekend: "£20"  # Lower threshold when no one monitoring
      rationale: "Faster detection compensates for slower response"

  # PM-02: Return URL Security
  returnUrlHardening:
    protocolEnforcement:
      required: "https://"
      rejectHttp: true
      implementation: |
        function validateReturnUrl(url) {
          if (!url.startsWith('https://')) return false;
          // ... existing domain check
        }

    securityTxt:
      path: "/.well-known/security.txt"
      content: |
        Contact: ndx@dsit.gov.uk
        Expires: 2026-01-01T00:00:00.000Z
        Preferred-Languages: en
        Policy: https://ndx-try.service.gov.uk/security-policy
        Acknowledgments: https://ndx-try.service.gov.uk/security-thanks
      responseSla: "24 hours acknowledgment, 72 hours initial assessment"
      effort: "0.5 day"

  # PM-03: Metrics Blindness
  metricsReliability:
    primaryDashboard:
      defaultView: "proxy-metrics"  # NOT self-report
      metrics:
        - "Cleanup-as-success proxy"
        - "Error guide inverse metric"
        - "Walkthrough engagement"
      selfReportPosition: "Secondary validation only"

    selfReportRateAlert:
      threshold: "< 10%"
      window: "7 days"
      severity: "Warning"
      message: "Self-report rate critically low; rely on proxy metrics only"
      action: "Review incentive messaging; consider survey"

    dataQualityReview:
      frequency: "Weekly (first month), Monthly (thereafter)"
      owner: "Product Manager"
      checklist:
        - "Self-report vs cleanup correlation"
        - "Anomalous patterns in GA4"
        - "Missing funnel steps"

  # PM-04: Performance Regression
  performanceGates:
    imageCiCheck:
      mode: "fail"  # Was "warn" - UPGRADED
      blockMerge: true
      prRequired: true

    lighthouseCI:
      enabled: true
      threshold: 85
      failBuild: true
      pages:
        - "/"
        - "/scenarios/council-chatbot"
      schedule: "Every PR + nightly"

    performanceReviewRequired:
      paths:
        - "assets/images/**"
        - "src/styles/**"
      approvers: ["tech-lead", "frontend-dev"]

  # PM-05: UX Time Confusion
  sessionTimeClarity:
    countdownTimer:
      enabled: true
      position: "Scenario page header (sticky)"
      format: "Time remaining: 1h 45m"
      warningAt: 15  # minutes - changes color to amber
      criticalAt: 5  # minutes - changes color to red
      implementation: |
        // Read deployment timestamp from localStorage
        // Calculate remaining time (120 min - elapsed)
        // Update every minute
        // Show "Session ended" when expired

    emailDeliverability:
      sender: "noreply@notifications.service.gov.uk"  # GOV.UK Notify
      verified: true
      spfDkim: true
      testBeforeLaunch: "Send to 10 council addresses; verify inbox delivery"

    redeployProminence:
      afterExpiry: "Large 'Redeploy' button on expired session page"
      message: "Your session has ended. You can start a new deployment anytime!"

  # PM-06: Silent Cleanup Failure
  cleanupHealthMonitoring:
    heartbeatAlert:
      condition: "No successful cleanups in 24 hours"
      assumption: "At least 1 deployment per day during active use"
      preLaunchBehavior: "Disable until first week of real usage"
      severity: "Warning"
      action: "Verify Lambda is running; check EventBridge rules"

    snsIntegrationTest:
      frequency: "Daily"
      implementation: |
        # Synthetic test Lambda
        1. Create test SNS message with known payload
        2. Verify delivery to configured endpoint
        3. Alert if delivery fails
      effort: "0.5 day"

    syntheticCleanupTest:
      frequency: "Daily"
      implementation: |
        # Create dummy stack with 1-minute TTL
        # Verify cleanup Lambda triggers and succeeds
        # Alert if stack persists beyond TTL + 5 minutes
      phase: "Phase 2"
      effort: "1 day"
```

**Scope Changes from Pre-Mortem:**

| Item | Original Scope | New Scope | Effort Added |
|------|----------------|-----------|--------------|
| SQS cleanup queue | Phase 2 | **MVP** | +2 days |
| Basic rate limiting | Phase 2 | **MVP** | +1 day |
| Weekend PagerDuty | Not planned | **MVP** | +0.5 day |
| security.txt | Not planned | **MVP** | +0.5 day |
| Cleanup heartbeat alert | Not planned | **MVP** | +0.5 day |
| SNS integration test | Not planned | **MVP** | +0.5 day |
| Session countdown timer | Not planned | **MVP** | +1 day |
| Lighthouse CI | Nice-to-have | **MVP** | +0.5 day |
| **Total Added** | | | **+6.5 days** |

**Revised MVP Total: ~21.5 dev days** (was 15 days)

**Justification for Scope Increase:**
```yaml
scopeIncreaseJustification:
  originalEstimate: "15 dev days"
  revisedEstimate: "21.5 dev days"
  increase: "43%"

  riskWithoutIncrease:
    - "Weekend cost attack: £8,000+ exposure"
    - "Phishing incident: Reputational damage to CDDO"
    - "Bad metrics: Wrong strategic decisions for months"
    - "Silent failure: £4,500+ before detection"

  costOfIncrease: "£5,200 (6.5 days × £800)"
  costOfFailure: "£15,000+ direct + reputational damage"

  recommendation: "Accept scope increase; risk reduction justifies cost"
```

**Pre-Mortem Risk Register:**

| Risk ID | Risk | Pre-Mitigation | Post-Mitigation | Status |
|---------|------|----------------|-----------------|--------|
| PM-01 | Weekend cost spike | HIGH | **LOW** | Mitigated |
| PM-02 | Return URL phishing | HIGH | **LOW** | Mitigated |
| PM-03 | Metrics blindness | HIGH | **MEDIUM** | Reduced |
| PM-04 | Performance regression | HIGH | **LOW** | Mitigated |
| PM-05 | UX time confusion | HIGH | **LOW** | Mitigated |
| PM-06 | Silent cleanup failure | MEDIUM | **LOW** | Mitigated |

## Dependencies and Integrations

### Epic Dependencies

**Upstream Dependencies (Required Before Epic 2):**

| Dependency | Source | Status | Blocker? | Mitigation |
|------------|--------|--------|----------|------------|
| Scenario data structure defined | Epic 1 | Required | Yes | Cannot build deployment flow without scenario schema |
| At least 1 scenario template ready | Epic 1 | Required | Yes | Need template to test deployment flow |
| Portal basic structure | Epic 1 | Required | Yes | Deploy button needs page to live on |
| GitHub repository created | Epic 1 | Required | Yes | Templates must be hosted |

**Downstream Dependencies (Epics Requiring Epic 2):**

| Epic | Dependency | Impact if Delayed |
|------|------------|-------------------|
| Epic 3 (Post-Deployment) | Deployment tracking (session data) | Cannot track post-deployment journey |
| Epic 4 (Evidence Packs) | Deployment completion signal | Cannot auto-populate evidence |
| Epic 5 (Analytics) | Funnel events, error tracking | Incomplete conversion data |

**Parallel Development (No Hard Dependencies):**

| Item | Can Proceed Independently | Integration Point |
|------|--------------------------|-------------------|
| Video content creation | Yes | Embed URLs added to scenarios.yaml |
| Screenshot assets | Yes | Images added to /assets/images/ |
| Partner form (GOV.UK Forms) | Yes | Form URL configured in config |
| CloudFormation templates | Yes | URLs configured at integration |

### External System Integrations

**AWS Services (User's Account):**

```yaml
awsIntegrations:
  cloudFormation:
    interaction: "Redirect to CloudFormation Console Quick Create"
    dataFlow: "One-way (portal → AWS)"
    authentication: "User's existing AWS session"
    errorHandling: "Portal cannot detect; relies on user self-report"

  innovationSandbox:
    interaction: "Deployment target for scenarios"
    constraints:
      - "£10/day soft cost limit"
      - "Pre-approved services only"
      - "Automatic governance"
    documentation: "https://aws.amazon.com/government-education/innovation-sandbox/"

  eventBridge:
    interaction: "Schedules cleanup Lambda"
    createdBy: "CloudFormation template (not portal)"
    timing: "Stack creation time + 120 minutes"

  lambda:
    interaction: "Cleanup Lambda deletes stacks"
    createdBy: "CloudFormation template"
    triggers: "EventBridge scheduled rule"
    permissions: "DeleteStack for ndx-* stacks with tag"

  sns:
    interaction: "Cleanup failure notifications"
    createdBy: "CloudFormation template"
    subscribers: "Admin email address"

  cloudWatch:
    interaction: "Cleanup Lambda logs and metrics"
    createdBy: "Automatically by Lambda"
    retention: "7 days (configurable)"

  s3:
    interaction: "Template hosting"
    bucket: "ndx-try-templates (public read)"
    versioning: true
    region: "us-west-2"
```

**Third-Party Services:**

```yaml
thirdPartyIntegrations:
  gitHubPages:
    purpose: "Portal hosting"
    interaction: "Static site deployment"
    authentication: "None (public)"
    sla: "99.95% (GitHub's SLA)"
    fallback: "None for MVP; CloudFront migration path documented"

  youTube:
    purpose: "Demo video hosting"
    interaction: "Iframe embed (nocookie domain)"
    authentication: "None required"
    dataFlow: "One-way (YouTube → browser)"
    privacy: "Privacy-enhanced mode enabled"
    fallback: "Transcript download if video fails"

  googleAnalytics4:
    purpose: "Portal analytics and funnel tracking"
    interaction: "Client-side JavaScript"
    authentication: "Measurement ID in config"
    dataFlow: "Browser → GA4 servers"
    privacy: "IP anonymization enabled; documented in privacy notice"
    fallback: "Portal functions without analytics"

  govukForms:
    purpose: "Partner tour request form"
    interaction: "External link to form"
    authentication: "None (public form)"
    dataFlow: "User → GOV.UK Forms → Email notification"
    fallback: "Direct email link if form unavailable"

  govukNotify:
    purpose: "Email notifications (warning, confirmation)"
    interaction: "API call from Lambda"
    authentication: "API key (stored in Secrets Manager)"
    phase: "Phase 2 (email capture required)"
    fallback: "SES direct send for MVP"

  pagerDuty:
    purpose: "Critical alert escalation (weekend coverage)"
    interaction: "SNS → PagerDuty integration"
    authentication: "Integration key"
    triggers:
      - "Cleanup failure"
      - "Billing alarm"
      - "Stack count threshold"
```

**GOV.UK Ecosystem:**

```yaml
govukIntegrations:
  designSystem:
    purpose: "UI components and patterns"
    version: "5.x"
    usage: "CSS/JS from CDN; Nunjucks components"
    compliance: "Required for gov.uk subdomain"

  ndxDigital:
    purpose: "Potential hosting integration"
    interaction: "PR to ndx.digital repository"
    timing: "Post-MVP consideration"
    alternative: "GitHub Pages (MVP)"

  lgaAiHub:
    purpose: "Discovery and referral"
    interaction: "Listing in resource library"
    dataFlow: "Link to NDX:Try portal"
    ownership: "LGA manages listing"
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW: EPIC 2                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                                                            │
│  │   User      │                                                            │
│  │  Browser    │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                    NDX:Try Portal (Static)                      │        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │        │
│  │  │ scenarios   │  │ localStorage│  │ GA4 Events  │              │        │
│  │  │ .yaml       │  │ (session)   │  │ (analytics) │              │        │
│  │  └─────────────┘  └─────────────┘  └──────┬──────┘              │        │
│  └──────────────────────────────────────────┬┼──────────────────────┘        │
│                                             ││                              │
│         ┌───────────────────────────────────┘│                              │
│         │                                    │                              │
│         ▼                                    ▼                              │
│  ┌─────────────┐                      ┌─────────────┐                       │
│  │   GitHub    │                      │   Google    │                       │
│  │   Pages     │                      │ Analytics 4 │                       │
│  │  (hosting)  │                      │  (metrics)  │                       │
│  └─────────────┘                      └─────────────┘                       │
│                                                                             │
│  ════════════════════════ HANDOFF BOUNDARY ════════════════════════════     │
│                                                                             │
│         │ (redirect with pre-filled URL)                                    │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                 AWS CloudFormation Console                      │        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │        │
│  │  │  Template   │  │  Parameters │  │   Stack     │              │        │
│  │  │    URL      │  │  (prefilled)│  │  Creation   │              │        │
│  │  └──────┬──────┘  └─────────────┘  └──────┬──────┘              │        │
│  └─────────┼─────────────────────────────────┼──────────────────────┘        │
│            │                                 │                              │
│            ▼                                 ▼                              │
│  ┌─────────────┐                      ┌─────────────┐                       │
│  │     S3      │                      │ User's AWS  │                       │
│  │  Templates  │                      │  Account    │                       │
│  │  (public)   │                      │ (Sandbox)   │                       │
│  └─────────────┘                      └──────┬──────┘                       │
│                                              │                              │
│                          ┌───────────────────┼───────────────────┐          │
│                          │                   │                   │          │
│                          ▼                   ▼                   ▼          │
│                   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│                   │ EventBridge │     │   Lambda    │     │     SNS     │   │
│                   │  (schedule) │────▶│  (cleanup)  │────▶│  (alerts)   │   │
│                   └─────────────┘     └─────────────┘     └──────┬──────┘   │
│                                                                  │          │
│                                                                  ▼          │
│                                                           ┌─────────────┐   │
│                                                           │  PagerDuty  │   │
│                                                           │  (weekend)  │   │
│                                                           └─────────────┘   │
│                                                                             │
│  ════════════════════════ ZERO-DEPLOYMENT PATH ════════════════════════     │
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                    │
│  │   YouTube   │     │  Screenshot │     │  GOV.UK     │                    │
│  │   Videos    │     │   Gallery   │     │   Forms     │                    │
│  │  (embed)    │     │  (static)   │     │ (partner)   │                    │
│  └─────────────┘     └─────────────┘     └─────────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Contracts

**CloudFormation Quick Create URL (Outbound):**

```yaml
cloudFormationQuickCreate:
  baseUrl: "https://console.aws.amazon.com/cloudformation/home"
  region: "us-west-2"
  action: "create/review"

  parameters:
    templateURL:
      source: "scenarios.yaml → scenario.templateS3Url"
      encoding: "URL-encoded"
      example: "https%3A%2F%2Fs3.us-west-2.amazonaws.com%2Fndx-try-templates%2Fcouncil-chatbot.yaml"

    stackName:
      source: "Generated from scenario.id + timestamp"
      pattern: "ndx-try-{scenario-id}-{yyyyMMddHHmm}"
      example: "ndx-try-council-chatbot-202511281430"

    param_*:
      source: "scenarios.yaml → scenario.cloudFormationParams"
      encoding: "URL-encoded values"
      example: "param_CouncilName=Example%20Council"

  fullUrlExample: |
    https://console.aws.amazon.com/cloudformation/home?region=us-west-2#/stacks/create/review
    ?templateURL=https%3A%2F%2Fs3.us-west-2.amazonaws.com%2Fndx-try-templates%2Fcouncil-chatbot.yaml
    &stackName=ndx-try-council-chatbot-202511281430
    &param_CouncilName=Example%20Council
    &param_CleanupAfterMinutes=120
```

**GA4 Event Schema (Outbound):**

```yaml
ga4Events:
  # Deployment funnel events
  scenario_viewed:
    parameters:
      scenario_id: string
      scenario_name: string
      entry_source: string  # "direct", "quiz", "search"

  cost_info_viewed:
    parameters:
      scenario_id: string
      max_cost: number

  what_to_expect_viewed:
    parameters:
      scenario_id: string
      screenshots_viewed: number

  acknowledgment_completed:
    parameters:
      scenario_id: string
      acks_checked: number
      time_to_complete_seconds: number

  deployment_started:
    parameters:
      scenario_id: string
      session_id: string
      timestamp: string

  deployment_success_reported:
    parameters:
      scenario_id: string
      session_id: string
      time_to_complete_minutes: number

  deployment_failure_reported:
    parameters:
      scenario_id: string
      session_id: string
      error_category: string  # Self-reported

  # Zero-deployment events
  video_started:
    parameters:
      scenario_id: string
      video_id: string

  video_completed:
    parameters:
      scenario_id: string
      video_id: string
      watch_duration_seconds: number

  partner_tour_requested:
    parameters:
      scenario_id: string
```

**localStorage Schema (Internal):**

```yaml
localStorageSchema:
  key: "ndx-try-session"
  structure:
    currentScenario: string | null
    deploymentSession:
      scenarioId: string
      sessionStartedAt: string  # ISO 8601
      deploymentStartedAt: string | null
      awsSessionConfirmed: boolean
      interstitialAccepted: boolean
      acknowledgmentsCompleted: boolean[]
      returnedToPortal: boolean
      selfReportedSuccess: boolean | null
    zeroDeploymentProgress:
      videosWatched: string[]
      screenshotsViewed: string[]
      partnerTourRequested: boolean
    preferences:
      consentGiven: boolean
      consentTimestamp: string
```

### Integration Testing Requirements

| Integration | Test Type | Frequency | Owner |
|-------------|-----------|-----------|-------|
| CloudFormation URL generation | Unit test | Every PR | Dev team |
| CloudFormation URL validity | Manual smoke test | Weekly | Dev team |
| GA4 event delivery | Real-time debug view | Every deploy | Dev team |
| YouTube embed load | Automated (Playwright) | Every PR | Dev team |
| GOV.UK Forms accessibility | Manual | Monthly | QA |
| SNS delivery to PagerDuty | Synthetic test | Daily | Platform team |
| S3 template accessibility | Health check Lambda | Every 5 min | Automated |
| GitHub Pages deployment | GitHub Actions | Every merge | Automated |

### Dependency Risk Assessment

| Dependency | Risk | Likelihood | Impact | Mitigation |
|------------|------|------------|--------|------------|
| GitHub Pages outage | Portal inaccessible | Low | High | Document CloudFront migration path |
| YouTube unavailable | Videos don't load | Very Low | Medium | Transcript fallback; screenshot gallery |
| S3 bucket inaccessible | Deployments fail | Low | Critical | GitHub raw URL backup; automated failover (Phase 2) |
| GA4 blocked by ad blockers | Incomplete analytics | High | Medium | Document margin of error; sample detection |
| GOV.UK Forms outage | Partner requests fail | Low | Low | Direct email fallback |
| AWS CloudFormation changes | URL format breaks | Very Low | Critical | Monitor AWS changelogs; version pin URL format |
| Innovation Sandbox policy change | Cost limits change | Low | High | Monitor program updates; adjust messaging |

### Critical Path Analysis (Dependency Mapping)

**Primary Critical Path (Deployment Flow):**

```
scenarios.yaml → Cost Display → What to Expect → Acknowledgments →
Pre-Deploy Check → Interstitial → CloudFormation URL → AWS Console →
Stack Creation → EventBridge Schedule → Cleanup Lambda → SNS/PagerDuty
```

**Identified Bottlenecks:**

| ID | Bottleneck | Location | Risk Level | Mitigation |
|----|------------|----------|------------|------------|
| BN-01 | **Single data source** | scenarios.yaml | High | JSON Schema validation in CI |
| BN-02 | **AWS session dependency** | Pre-Deploy Check | Medium | Clear "login first" messaging + check |
| BN-03 | **CloudFormation availability** | URL Generation | Medium | Status page link; retry guidance |
| BN-04 | **Manual return required** | Post-deployment | High | Return URL in outputs; countdown timer |
| BN-05 | **Single hosting provider** | GitHub Pages | High | Document CloudFront migration path |

**Dependency Risk Heat Map:**

```yaml
dependencyRiskMatrix:
  # Critical Impact + Any Likelihood = Immediate Action
  critical:
    - service: "GitHub Pages"
      likelihood: "Medium"
      impact: "Critical (total outage)"
      action: "Accept for MVP; document migration path"

    - service: "S3 Template Bucket"
      likelihood: "Low"
      impact: "Critical (deployments fail)"
      action: "Implement failover procedure"

    - service: "CloudFormation API"
      likelihood: "Very Low"
      impact: "Critical (deployments fail)"
      action: "Monitor AWS status; retry guidance"

  # High Impact = Plan Mitigation
  high:
    - service: "EventBridge"
      likelihood: "Low"
      impact: "High (cleanups fail)"
      action: "Synthetic test in staging"

    - service: "GA4 (ad blocked)"
      likelihood: "High"
      impact: "Medium (blind to metrics)"
      action: "Sample detection; document margin"

  # Medium/Low = Monitor
  monitor:
    - service: "YouTube"
      action: "Transcript fallback exists"
    - service: "GOV.UK Forms"
      action: "Email fallback exists"
    - service: "SNS"
      action: "Daily synthetic test"
```

**Dependency Validation Requirements:**

```yaml
dependencyValidation:
  # CI-time validations (every PR)
  ciValidations:
    - name: "Schema Validation"
      target: "scenarios.yaml"
      tool: "ajv (JSON Schema)"
      failAction: "Block merge"
      effort: "1 day to implement"

    - name: "Asset Existence Check"
      target: "All referenced images, videos"
      tool: "Custom script"
      failAction: "Block merge"
      effort: "0.5 day to implement"

    - name: "URL Format Validation"
      target: "CloudFormation URLs, template URLs"
      tool: "URL parsing + HEAD request"
      failAction: "Block merge"
      effort: "0.5 day to implement"

  # Runtime validations (automated)
  runtimeValidations:
    - name: "S3 Template Health Check"
      frequency: "Every 5 minutes"
      tool: "Lambda + CloudWatch"
      onFailure: "Alert platform team"

    - name: "SNS Delivery Test"
      frequency: "Daily"
      tool: "Synthetic Lambda"
      onFailure: "Alert platform team"

  # Manual validations (scheduled)
  manualValidations:
    - name: "CloudFormation URL Smoke Test"
      frequency: "Weekly"
      owner: "Dev team"
      procedure: "Deploy test scenario; verify success"

    - name: "PagerDuty Integration Test"
      frequency: "Weekly"
      owner: "Platform team"
      procedure: "Trigger test alert; verify delivery"
```

**Single Points of Failure (SPOF) Registry:**

| SPOF | Component | Impact if Failed | Redundancy | MVP Status |
|------|-----------|------------------|------------|------------|
| SPOF-01 | GitHub Pages | Portal completely down | None | **Accept** |
| SPOF-02 | scenarios.yaml | All scenarios broken | Schema validation | **Mitigated** |
| SPOF-03 | S3 Template Bucket | Deployments fail | GitHub Raw backup | **Mitigated** |
| SPOF-04 | Cleanup Lambda | Costs accumulate | Retry + SLA | **Mitigated** |
| SPOF-05 | SNS Topic | Silent failures | CloudWatch Logs | **Partial** |

**Cascade Failure Scenarios:**

```yaml
cascadeFailures:
  scenario1:
    trigger: "scenarios.yaml syntax error merged"
    cascade:
      - "All scenario pages fail to render"
      - "Deploy buttons don't work"
      - "Zero-deployment paths broken"
      - "Analytics events fail (no scenario_id)"
    prevention: "JSON Schema validation in CI"
    detection: "Lighthouse CI fails; 404 errors in GA4"
    recovery: "Revert commit; redeploy"

  scenario2:
    trigger: "S3 bucket access revoked"
    cascade:
      - "Template URLs return 403"
      - "CloudFormation fails immediately"
      - "Users see AWS error, not helpful message"
    prevention: "Health check Lambda every 5 min"
    detection: "Health check alert"
    recovery: "Update to GitHub Raw URLs; redeploy portal"

  scenario3:
    trigger: "EventBridge rule not created by template"
    cascade:
      - "Cleanup Lambda never triggers"
      - "Stacks persist indefinitely"
      - "Costs accumulate (undetected for 24h)"
    prevention: "Template validation; staging test"
    detection: "Heartbeat alert (no cleanups in 24h)"
    recovery: "Manual cleanup; fix template"
```

**Dependency Optimization Recommendations:**

| ID | Optimization | Current | Recommended | Effort | Priority |
|----|--------------|---------|-------------|--------|----------|
| DO-01 | Schema validation | None | JSON Schema + CI gate | 1 day | **P1** |
| DO-02 | Asset verification | None | CI checks all refs | 0.5 day | **P1** |
| DO-03 | Template URL validation | None | HEAD request in CI | 0.5 day | **P2** |
| DO-04 | S3 health monitoring | None | Lambda every 5 min | 0.5 day | **P1** |
| DO-05 | SNS path verification | None | Daily synthetic test | 0.5 day | **P1** |
| DO-06 | EventBridge verification | Trust template | Staging smoke test | 1 day | **P2** |

**Implementation Order:**

```
Week 1 (with core development):
├── DO-01: JSON Schema for scenarios.yaml
├── DO-02: Asset existence CI check
└── DO-04: S3 health check Lambda

Week 2 (hardening):
├── DO-05: SNS synthetic test
├── DO-03: Template URL validation
└── DO-06: EventBridge staging test
```

### Integration Failure Modes (FMEA)

**FMEA Scoring:** RPN = Severity × Occurrence × Detection (Max: 1000)

**High-Risk Integration Failures (RPN ≥ 100):**

| Rank | ID | Integration | Failure Mode | RPN | Mitigation Status |
|------|-----|-------------|--------------|-----|-------------------|
| 1 | SN-04 | SNS/Email | Alerts land in spam | **224** | Use GOV.UK Notify |
| 2 | EB-01 | EventBridge | Rule not created by template | **160** | Template lint + heartbeat |
| 3 | EB-04 | EventBridge | Target Lambda ARN wrong | **140** | Integration test |
| 4 | GA-03 | GA4 | Event schema breaks | **140** | Schema docs + tests |
| 5 | EB-02 | EventBridge | Wrong cleanup schedule time | **126** | UTC standardization |
| 6 | S3-03 | S3 | Wrong template version cached | **120** | Git hash cache-bust |
| 7 | CF-03 | CloudFormation | User confused by timeout | **120** | Better "What to Expect" |
| 8 | GA-01 | GA4 | Ad blockers block tracking | **120** | Sample detection |
| 9 | SN-02 | SNS | Alerts to wrong recipient | **112** | Synthetic test |
| 10 | SN-03 | PagerDuty | Integration key expired | **108** | Weekly test |

**FMEA Control Matrix:**

```yaml
fmeaControls:
  # Prevention Controls (stop failures before they occur)
  prevention:
    templateLinting:
      target: ["EB-01", "EB-04", "S3-02"]
      tool: "cfn-lint + cfn-guard"
      frequency: "Every PR"
      failAction: "Block merge"
      effort: "Included in CI setup"

    cachebusting:
      target: ["S3-03"]
      implementation: |
        # Template URL includes git hash
        templateUrl: "https://s3.../template.yaml?v=${GITHUB_SHA:0:7}"
      frequency: "Every deploy"
      effort: "0.5 day"

    eventSchemaTests:
      target: ["GA-03"]
      tool: "Jest + GA4 Measurement Protocol"
      coverage:
        - "All funnel events fire with correct params"
        - "Event names match documented schema"
        - "Required params present"
      frequency: "Every PR"
      effort: "1 day"

    govukNotify:
      target: ["SN-04"]
      implementation: "Replace SES with GOV.UK Notify"
      benefits:
        - "Verified gov.uk sender"
        - "High deliverability"
        - "DKIM/SPF configured"
      effort: "1 day"
      phase: "MVP"

  # Detection Controls (catch failures quickly)
  detection:
    cleanupHeartbeat:
      target: ["EB-01", "EB-04"]
      condition: "No successful cleanups in 24 hours"
      alertTo: "platform-team@ndx-try.service.gov.uk"
      severity: "Warning"
      effort: "0.5 day"

    s3HealthCheck:
      target: ["S3-01", "S3-05"]
      method: "HEAD request to each template URL"
      frequency: "Every 5 minutes"
      alertOn: "Non-200 response for >2 consecutive checks"
      effort: "0.5 day"

    syntheticAlertTest:
      target: ["SN-02", "SN-03"]
      method: |
        1. Lambda sends test SNS message daily
        2. PagerDuty webhook confirms receipt
        3. Alert if confirmation not received
      frequency: "Daily at 09:00 UTC"
      effort: "1 day"

    adBlockerSampling:
      target: ["GA-01"]
      method: |
        // Check if GA loaded
        const analyticsBlocked = typeof gtag === 'undefined';
        if (!analyticsBlocked) {
          gtag('event', 'analytics_active', {non_interaction: true});
        }
        // Compare page_view count vs analytics_active count
      reporting: "Weekly % of blocked sessions"
      effort: "0.5 day"

  # Recovery Procedures (restore service quickly)
  recovery:
    s3Failover:
      target: ["S3-01"]
      trigger: "S3 health check fails for >5 minutes"
      procedure:
        - "Update scenarios.yaml templateS3Url to GitHub Raw"
        - "Push change to main branch"
        - "GitHub Actions deploys updated portal"
      rto: "10 minutes (manual)"
      runbook: "docs/runbooks/s3-failover.md"
      automation: "Phase 2"

    manualCleanup:
      target: ["EB-01", "CL-02"]
      trigger: "Cleanup failure alert"
      procedure:
        - "Login to affected AWS account (via Sandbox admin)"
        - "Navigate to CloudFormation console"
        - "Delete stack manually"
        - "Log cleanup in incident tracker"
      rto: "2 hours (business hours)"
      runbook: "docs/runbooks/manual-cleanup.md"

    eventSchemaRollback:
      target: ["GA-03"]
      trigger: "Funnel data shows anomalies"
      procedure:
        - "Revert to previous portal version"
        - "Review event changes in PR"
        - "Fix and redeploy"
      rto: "1 hour"
```

**Integration Health Dashboard:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INTEGRATION HEALTH DASHBOARD                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  EXTERNAL SERVICES                          INTERNAL INTEGRATIONS       │
│  ══════════════════                         ═════════════════════       │
│                                                                         │
│  GitHub Pages    [████████████] 100%        EventBridge Rules  ✓        │
│  S3 Templates    [████████████] 100%        Cleanup Lambda     ✓        │
│  YouTube         [████████████] 100%        SNS Topics         ✓        │
│  GA4             [████████░░░░]  75%*       PagerDuty          ✓        │
│  GOV.UK Forms    [████████████] 100%                                    │
│  CloudFormation  [████████████] 100%        * 25% blocked by ad blockers│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  LAST 24 HOURS                                                          │
│  ══════════════                                                         │
│  S3 Health Checks:     288/288 passed                                   │
│  Synthetic Alerts:     1/1 delivered                                    │
│  Cleanup Heartbeat:    12 cleanups successful                           │
│  EventBridge Fires:    12/12 on schedule                                │
│                                                                         │
│  ALERTS                                                                 │
│  ══════                                                                 │
│  ⚠ GA4: 25% sessions blocked (within expected range)                    │
│  ✓ No critical alerts in last 24 hours                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**FMEA Implementation Priority:**

| Priority | Control | Target Failures | Effort | Phase |
|----------|---------|-----------------|--------|-------|
| **P1** | GOV.UK Notify for alerts | SN-04 (RPN 224) | 1 day | MVP |
| **P1** | Cleanup heartbeat alert | EB-01 (RPN 160) | 0.5 day | MVP |
| **P1** | Template cfn-lint in CI | EB-01, EB-04 | 0.5 day | MVP |
| **P1** | Git hash cache-busting | S3-03 (RPN 120) | 0.5 day | MVP |
| **P2** | Synthetic alert test | SN-02, SN-03 | 1 day | MVP |
| **P2** | S3 health check Lambda | S3-01, S3-05 | 0.5 day | MVP |
| **P2** | GA4 event schema tests | GA-03 (RPN 140) | 1 day | MVP |
| **P3** | Ad blocker sampling | GA-01 (RPN 120) | 0.5 day | Post-MVP |

**Total FMEA Control Effort: ~6 days** (added to MVP scope)

### Contract Testing Strategy

**Contract Categories:**

| Category | Description | Examples |
|----------|-------------|----------|
| **Producer Contracts** | APIs we consume | AWS CloudFormation, GA4, YouTube |
| **Consumer Contracts** | Data formats we produce | Events, URLs, messages |
| **Internal Contracts** | Data structures in our system | scenarios.yaml, localStorage |

**Contract Inventory:**

| Contract | Type | Criticality | Schema Location |
|----------|------|-------------|-----------------|
| CloudFormation URL | URL Schema | Critical | `schemas/cloudformation-url.schema.json` |
| GA4 Events | Event Schema | High | `schemas/ga4-events.schema.json` |
| scenarios.yaml | Data Contract | Critical | `schemas/scenarios.schema.json` |
| localStorage Session | Data Contract | Medium | `schemas/session.schema.json` |
| SNS Cleanup Failure | Message Contract | High | `schemas/sns-cleanup-failure.schema.json` |

**Contract Specifications:**

```yaml
contractSpecifications:
  # Critical: CloudFormation URL Contract
  cloudFormationUrl:
    version: "2024.1"
    baseUrl: "https://console.aws.amazon.com/cloudformation/home"
    requiredParams:
      region: "^[a-z]{2}-[a-z]+-[0-9]$"
      templateURL: "URL-encoded https://*.yaml"
      stackName: "^ndx-try-[a-z0-9-]+-[0-9]{12}$"
    validation:
      - "URL format matches AWS specification"
      - "All params properly URL-encoded"
      - "Stack name ≤128 characters"

  # Critical: scenarios.yaml Schema
  scenariosYaml:
    version: "1.2.0"
    requiredFields:
      - "id (pattern: ^[a-z0-9-]+$)"
      - "name (maxLength: 100)"
      - "description"
      - "templateS3Url (format: uri)"
      - "maxCost {amount, currency, period}"
      - "deploymentTime {min, max, unit}"
    optionalFields:
      - "video {youtubeId, transcriptUrl}"
      - "screenshots [{url, alt}]"
      - "cloudFormationParams {key: value}"
    validation:
      - "JSON Schema validation in CI"
      - "All referenced assets exist"
      - "URLs resolve (HEAD request)"

  # High: GA4 Event Schema
  ga4Events:
    version: "1.0.0"
    events:
      scenario_viewed:
        required: ["scenario_id", "scenario_name"]
        optional: ["entry_source"]
      deployment_started:
        required: ["scenario_id", "session_id", "timestamp"]
      deployment_success_reported:
        required: ["scenario_id", "session_id"]
        optional: ["time_to_complete_minutes"]
      video_completed:
        required: ["scenario_id", "video_id", "watch_duration_seconds"]
    validation:
      - "TypeScript types enforce schema"
      - "Missing required params throw error"
      - "Events verified in GA4 DebugView"

  # Medium: localStorage Schema
  localStorageSession:
    version: 1
    structure:
      schemaVersion: "number (const: 1)"
      currentScenario: "string | null"
      deploymentSession:
        scenarioId: "string"
        sessionStartedAt: "ISO 8601"
        awsSessionConfirmed: "boolean"
        acknowledgmentsCompleted: "boolean[]"
      preferences:
        consentGiven: "boolean"
        consentTimestamp: "ISO 8601"
    migration: "Version field enables future schema migrations"
```

**Contract Testing Implementation:**

```yaml
contractTestingPipeline:
  # CI Validation (every PR)
  ciValidation:
    scenariosYaml:
      tool: "ajv (JSON Schema)"
      schema: "schemas/scenarios.schema.json"
      failAction: "Block merge"

    typescriptTypes:
      tool: "typescript-json-schema"
      action: "Generate types from schema; diff against committed"
      failAction: "Block merge if different"

    assetReferences:
      tool: "Custom script"
      action: "HEAD request to all URLs in scenarios.yaml"
      failAction: "Block merge on 404"

  # Contract Tests (every PR)
  contractTests:
    cloudFormationUrl:
      tool: "Jest"
      tests:
        - "URL matches AWS Quick Create format"
        - "Parameters properly encoded"
        - "Stack name matches pattern and length"

    ga4Events:
      tool: "Jest"
      tests:
        - "Event builders produce valid schema"
        - "Required params enforced"
        - "Types match specification"

    localStorage:
      tool: "Jest"
      tests:
        - "Read/write roundtrip preserves data"
        - "Schema version checked"
        - "Invalid data handled gracefully"

  # Integration Verification (nightly)
  nightlyVerification:
    ga4Delivery:
      action: "Send test events via Measurement Protocol"
      verify: "Events appear in GA4 DebugView API"
      alertOn: "Not received within 5 minutes"

    snsDelivery:
      action: "Publish test message to SNS"
      verify: "Delivery confirmation received"
      alertOn: "Delivery failure"
```

**Contract Change Management:**

```yaml
contractChangeProcess:
  versioningRules:
    additive: "New optional field → Minor version bump"
    breaking: "Removed/renamed/type change → Major version bump + migration"

  changeProcess:
    - step: "Create RFC document"
    - step: "Identify all consumers"
    - step: "Update schema file"
    - step: "Regenerate TypeScript types"
    - step: "Add migration logic if needed"
    - step: "Update all consumers"
    - step: "Verify in staging"

  schemaVersioning:
    location: "schemaVersion field in each contract"
    format: "semantic versioning (major.minor)"
    localStorage: "Includes version for migration"
```

**Example Contract Test (CloudFormation URL):**

```typescript
// tests/contracts/cloudformation-url.contract.test.ts
describe('CloudFormation URL Contract', () => {
  it('produces URL matching AWS Quick Create format', () => {
    const url = generateCloudFormationUrl({
      scenarioId: 'council-chatbot',
      templateUrl: 'https://s3.us-west-2.amazonaws.com/ndx-try/template.yaml',
      params: { CouncilName: 'Test Council' }
    });

    expect(url).toMatch(/^https:\/\/console\.aws\.amazon\.com\/cloudformation\/home/);
    expect(url).toContain('region=us-west-2');
    expect(url).toContain('#/stacks/create/review');
  });

  it('generates valid stack name', () => {
    const url = generateCloudFormationUrl({...});
    const stackName = extractStackName(url);

    expect(stackName).toMatch(/^ndx-try-[a-z0-9-]+-\d{12}$/);
    expect(stackName.length).toBeLessThanOrEqual(128);
  });

  it('properly encodes special characters', () => {
    const url = generateCloudFormationUrl({
      params: { Name: 'Test & Demo Council' }
    });

    expect(url).toContain('param_Name=Test%20%26%20Demo%20Council');
  });
});
```

**Contract Testing Effort:**

| Contract | Test Type | Effort | Priority |
|----------|-----------|--------|----------|
| scenarios.yaml schema | JSON Schema + CI | 1 day | **P1** |
| GA4 event schema | Jest + TypeScript types | 1 day | **P1** |
| CloudFormation URL | Jest contract tests | 0.5 day | **P1** |
| localStorage schema | Jest + migration | 0.5 day | **P2** |
| SNS message format | Jest + synthetic | 0.5 day | **P2** |
| **Total** | | **3.5 days** | |

### 6.8 Vendor Lock-in Analysis

**Lock-in Assessment by Vendor:**

| Vendor | Service Used | Lock-in Risk | Switching Cost | Strategic Recommendation |
|--------|--------------|--------------|----------------|--------------------------|
| GitHub | Pages hosting | 🟢 LOW | £2-5k (2-4 days) | Acceptable - standard static hosting |
| AWS | CloudFormation, Lambda, EventBridge, SNS, S3 | 🔴 HIGH | £50k+ (months) | **Intentional** - project purpose IS AWS adoption |
| Google | GA4 analytics | 🟡 MEDIUM | £5-10k (1-2 weeks) | Acceptable with abstraction layer |
| YouTube | Embedded videos | 🟢 LOW | £1-2k (days) | Minimal - standard embed pattern |
| GOV.UK | Design System, Notify | 🟡 MEDIUM | N/A - compliance req | Required - not negotiable |
| PagerDuty | Alerting | 🟢 LOW | £2-3k (days) | Standard integration patterns |

**Detailed Lock-in Analysis:**

```yaml
vendorLockInAnalysis:
  aws:
    lockInLevel: "HIGH - Intentional"
    services:
      cloudFormation:
        portability: "None - AWS-specific syntax"
        alternatives: "Terraform, Pulumi"
        switchingCost: "Complete rewrite"
      lambda:
        portability: "Low - AWS runtime APIs"
        alternatives: "Azure Functions, Cloud Run"
        switchingCost: "Moderate refactor"
      eventBridge:
        portability: "None - AWS-specific"
        alternatives: "CloudWatch Events, SNS"
        switchingCost: "Complete rewrite"
      sns:
        portability: "Low - AWS SDK"
        alternatives: "SQS, direct email"
        switchingCost: "Moderate refactor"
    strategicDecision: |
      AWS lock-in is INTENTIONAL and ACCEPTABLE because:
      1. Project purpose is helping UK public sector adopt AWS
      2. Demonstrating AWS services IS the value proposition
      3. Lock-in aligns with strategic goals, not against them
      4. No realistic scenario where we'd switch to Azure/GCP
    recommendation: "Embrace AWS lock-in as feature, not bug"

  gitHubPages:
    lockInLevel: "LOW"
    portability: "High - standard static files"
    alternatives: "Netlify, Vercel, CloudFront + S3, Azure Static"
    switchingCost:
      effort: "2-4 days"
      cost: "£2-5k"
      complexity: "Low"
    abstractionStrategy: "None needed - standard HTML/CSS/JS"
    recommendation: "Acceptable risk, no action needed"

  googleAnalytics:
    lockInLevel: "MEDIUM"
    portability: "Medium - proprietary event schema"
    alternatives: "Plausible, Matomo, Simple Analytics, CloudWatch RUM"
    switchingCost:
      effort: "1-2 weeks"
      cost: "£5-10k"
      complexity: "Medium"
    abstractionStrategy: |
      RECOMMENDED: Analytics abstraction layer
      - Define internal event schema
      - Analytics provider adapter pattern
      - Provider-agnostic tracking calls
    implementationSketch: |
      // analytics-adapter.ts
      interface AnalyticsEvent {
        name: string;
        category: string;
        properties: Record<string, string | number>;
      }

      interface AnalyticsProvider {
        track(event: AnalyticsEvent): void;
        pageView(path: string): void;
      }

      class GA4Provider implements AnalyticsProvider {
        track(event: AnalyticsEvent) {
          gtag('event', event.name, {
            event_category: event.category,
            ...event.properties
          });
        }
      }

      // Switch providers by changing one line
      export const analytics: AnalyticsProvider = new GA4Provider();
    recommendation: "Implement abstraction layer (Phase 2 or MVP if time)"
    mvpApproach: "Direct GA4 integration acceptable, abstraction in Phase 2"

  youtube:
    lockInLevel: "LOW"
    portability: "High - standard iframe embed"
    alternatives: "Vimeo, self-hosted, Cloudflare Stream"
    switchingCost:
      effort: "1-2 days"
      cost: "£1-2k"
      complexity: "Low"
    abstractionStrategy: "None needed - standard embed pattern"
    recommendation: "Acceptable risk, no action needed"

  govukServices:
    lockInLevel: "MEDIUM - Compliance Required"
    components:
      designSystem:
        portability: "Low - UK gov specific"
        alternatives: "None acceptable for gov.uk site"
        switchingCost: "N/A - compliance requirement"
        note: "Lock-in irrelevant - we MUST use GOV.UK styling"
      notify:
        portability: "Medium - standard email API"
        alternatives: "SES, SendGrid (not for gov use)"
        switchingCost: "N/A - compliance preferred"
        note: "GOV.UK Notify preferred for government comms"
    recommendation: "Required lock-in, no mitigation needed or desired"

  pagerduty:
    lockInLevel: "LOW"
    portability: "High - standard alerting API"
    alternatives: "Opsgenie, VictorOps, SNS direct"
    switchingCost:
      effort: "2-3 days"
      cost: "£2-3k"
      complexity: "Low"
    abstractionStrategy: "SNS as intermediary provides natural abstraction"
    recommendation: "Acceptable risk, SNS intermediary provides flexibility"
```

**Lock-in Mitigation Strategies:**

```yaml
mitigationStrategies:
  implemented:
    - strategy: "SNS as alerting intermediary"
      benefit: "Any SNS subscriber can receive alerts"
      effort: "Built into MVP design"

    - strategy: "Static site generation"
      benefit: "Output portable to any host"
      effort: "Inherent in Eleventy choice"

    - strategy: "Standard video embeds"
      benefit: "Provider-agnostic iframe pattern"
      effort: "No additional work"

  recommended:
    - strategy: "Analytics abstraction layer"
      benefit: "Swap GA4 for any provider"
      effort: "0.5 day MVP / 1.5 days full"
      priority: "Phase 2 (or MVP if time)"

    - strategy: "Email abstraction layer"
      benefit: "Swap Notify for any provider"
      effort: "0.5 day"
      priority: "Phase 2"

  notRecommended:
    - strategy: "IaC abstraction (Terraform)"
      reason: "Defeats project purpose - we're teaching AWS"
      note: "AWS lock-in is intentional"

    - strategy: "GOV.UK Design System alternatives"
      reason: "Compliance requirement"
      note: "Lock-in is mandatory"

  lockInBudget:
    acceptable: "GitHub, YouTube, PagerDuty, GOV.UK, AWS"
    monitorAndAbstract: "GA4 (Phase 2)"
    totalRisk: "LOW - most lock-in is intentional or required"
```

**Strategic Lock-in Decision Matrix:**

| Vendor | Lock-in Type | Accept? | Action |
|--------|--------------|---------|--------|
| AWS | Intentional | ✅ YES | Embrace as feature |
| GOV.UK | Compliance | ✅ YES | Required, no choice |
| GitHub | Convenience | ✅ YES | Easy to switch if needed |
| GA4 | Convenience | ⚠️ MONITOR | Abstract in Phase 2 |
| YouTube | Convenience | ✅ YES | Standard pattern |
| PagerDuty | Convenience | ✅ YES | SNS intermediary exists |

### 6.9 Data Flow Security Review

**Data Flow Security Map:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW SECURITY MAP                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐    DF-01: Session     ┌─────────────┐                        │
│  │  User    │◄──────────────────────►│ localStorage│  PII: None            │
│  │ Browser  │    (client-only)       └─────────────┘  Risk: LOW            │
│  └────┬─────┘                                                               │
│       │                                                                     │
│       │ DF-02: Page Views/Events                                           │
│       ├────────────────────────────────────────────►  GA4                  │
│       │    (gtag.js, IP anonymized)                   PII: IP (anon)       │
│       │                                               Risk: MEDIUM         │
│       │                                                                     │
│       │ DF-03: CloudFormation Redirect                                     │
│       ├────────────────────────────────────────────►  AWS Console          │
│       │    (URL params: template, stack name)         PII: None            │
│       │                                               Risk: MEDIUM         │
│       │                                                                     │
│       │ DF-04: Return URL                                                  │
│       ◄────────────────────────────────────────────   AWS Console          │
│       │    (query params: status, stack ID)           PII: None            │
│       │                                               Risk: HIGH           │
│       │                                                                     │
│  ┌────┴─────┐                                                              │
│  │ CloudForm│    DF-05: Stack Events                                       │
│  │ Template │────────────────────────────────────────►  EventBridge        │
│  └──────────┘    (AWS internal)                        PII: None           │
│                                                        Risk: LOW           │
│       │                                                                     │
│       │ DF-06: Cleanup Trigger                                             │
│       └──────────────────────────────────────────────►  Lambda             │
│           (EventBridge rule)                           PII: Stack ARN      │
│                                                        Risk: LOW           │
│       │                                                                     │
│       │ DF-07: Alert Notifications                                         │
│       └──────────────────────────────────────────────►  SNS → Email        │
│           (JSON payload)                               PII: None           │
│                                                        Risk: MEDIUM        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Security Analysis by Data Flow:**

```yaml
dataFlowSecurityAnalysis:
  DF-01_localStorage:
    description: "Browser session state storage"
    dataClassification: "Internal - Non-sensitive"
    dataElements:
      - scenarioProgress: "Which scenarios viewed"
      - consentPreferences: "Cookie consent state"
      - feedbackGiven: "Boolean flags"
      - sessionTimestamps: "ISO dates"
    piiPresent: false
    encryption:
      atRest: "Browser default (unencrypted)"
      inTransit: "N/A - client only"
    securityControls:
      - "No PII stored"
      - "No auth tokens stored"
      - "Schema versioning for integrity"
    vulnerabilities:
      - id: "DF01-V1"
        threat: "XSS could read localStorage"
        likelihood: "Low (static site, no user input)"
        impact: "Low (no sensitive data)"
        mitigation: "CSP headers, no eval()"
      - id: "DF01-V2"
        threat: "Malicious extension access"
        likelihood: "Medium"
        impact: "Low (no sensitive data)"
        mitigation: "Accept risk - user's browser"
    riskRating: "🟢 LOW"

  DF-02_ga4Events:
    description: "Analytics event tracking to Google"
    dataClassification: "Internal - Behavioural"
    dataElements:
      - pageViews: "URL paths visited"
      - events: "scenario_start, deploy_clicked, etc."
      - timing: "Session duration, time on page"
      - deviceInfo: "Browser, viewport, OS"
      - ipAddress: "Anonymized by GA4 setting"
    piiPresent: "Partial - IP anonymized"
    encryption:
      atRest: "Google managed"
      inTransit: "TLS 1.3 (gtag.js)"
    securityControls:
      - "IP anonymization enabled"
      - "No user IDs collected"
      - "No custom dimensions with PII"
      - "Data retention: 14 months"
    vulnerabilities:
      - id: "DF02-V1"
        threat: "Behavioural profiling without consent"
        likelihood: "Medium"
        impact: "Medium (PECR compliance)"
        mitigation: "Cookie banner, consent before loading gtag"
      - id: "DF02-V2"
        threat: "GA4 account compromise"
        likelihood: "Low"
        impact: "Medium (data exposure)"
        mitigation: "MFA on Google account, limited access"
    complianceNotes:
      - "PECR: Requires consent for analytics cookies"
      - "GDPR: Legitimate interest arguable, consent safer"
      - "GOV.UK: Must not track without consent"
    riskRating: "🟡 MEDIUM"
    requiredActions:
      - "Implement cookie consent banner"
      - "Only load gtag.js after consent"
      - "Document lawful basis"

  DF-03_cloudFormationRedirect:
    description: "URL generation for AWS Console redirect"
    dataClassification: "Internal - Technical"
    dataElements:
      - templateUrl: "S3 URL to CloudFormation template"
      - stackName: "Generated name with timestamp"
      - parameters: "Scenario-specific params"
      - region: "us-west-2"
    piiPresent: false
    encryption:
      inTransit: "TLS (HTTPS redirect)"
    securityControls:
      - "Template URLs from allowlist only"
      - "Stack names sanitized"
      - "Parameters from scenarios.yaml only"
    vulnerabilities:
      - id: "DF03-V1"
        threat: "Template URL injection"
        likelihood: "Low (hardcoded in data file)"
        impact: "High (arbitrary CloudFormation)"
        mitigation: "Allowlist template URLs, no user input"
      - id: "DF03-V2"
        threat: "Parameter injection"
        likelihood: "Low (no user-supplied params)"
        impact: "Medium (unexpected resources)"
        mitigation: "Parameters from scenarios.yaml only"
      - id: "DF03-V3"
        threat: "Stack name collision attack"
        likelihood: "Low"
        impact: "Low (stack creation fails)"
        mitigation: "Timestamp suffix ensures uniqueness"
    riskRating: "🟡 MEDIUM"
    requiredActions:
      - "Validate template URLs against allowlist"
      - "Sanitize stack name generation"
      - "Log all redirects for audit"

  DF-04_returnUrl:
    description: "Return redirect from AWS Console"
    dataClassification: "Internal - Technical"
    dataElements:
      - returnUrl: "Portal URL to return to"
      - statusParams: "success/failure indicators"
      - stackId: "Created stack ARN (optional)"
    piiPresent: false
    encryption:
      inTransit: "TLS"
    securityControls:
      - "Return URL allowlist validation"
      - "Protocol enforcement (HTTPS only)"
      - "No sensitive data in URL"
    vulnerabilities:
      - id: "DF04-V1"
        threat: "Open redirect via return URL manipulation"
        likelihood: "Medium (URL in browser)"
        impact: "High (phishing, credential theft)"
        mitigation: "Strict allowlist validation"
      - id: "DF04-V2"
        threat: "URL parameter tampering"
        likelihood: "Medium"
        impact: "Low (cosmetic - success shown incorrectly)"
        mitigation: "Don't trust status params for logic"
      - id: "DF04-V3"
        threat: "Stack ARN disclosure"
        likelihood: "High (in URL)"
        impact: "Low (public info anyway)"
        mitigation: "Accept - stack ARN not sensitive"
    riskRating: "🔴 HIGH"
    requiredActions:
      - "Implement strict return URL allowlist"
      - "Validate on client before redirect"
      - "Log return URL attempts"

  DF-05_stackEvents:
    description: "AWS internal event flow"
    dataClassification: "AWS Internal"
    dataElements:
      - stackArn: "CloudFormation stack identifier"
      - stackStatus: "CREATE_COMPLETE, etc."
      - timestamp: "Event time"
    piiPresent: false
    encryption:
      inTransit: "AWS internal (encrypted)"
      atRest: "AWS managed"
    securityControls:
      - "AWS IAM policies"
      - "VPC endpoints (optional)"
      - "CloudTrail logging"
    vulnerabilities:
      - id: "DF05-V1"
        threat: "EventBridge rule tampering"
        likelihood: "Low (IAM protected)"
        impact: "High (cleanup disabled)"
        mitigation: "Strict IAM, CloudTrail alerts"
    riskRating: "🟢 LOW"

  DF-06_cleanupTrigger:
    description: "Lambda invocation for stack deletion"
    dataClassification: "AWS Internal"
    dataElements:
      - stackArn: "Stack to delete"
      - triggerTime: "Scheduled time"
      - ttl: "Time-to-live value"
    piiPresent: false
    encryption:
      inTransit: "AWS internal"
    securityControls:
      - "Lambda IAM role"
      - "Least privilege permissions"
      - "Stack name prefix validation"
    vulnerabilities:
      - id: "DF06-V1"
        threat: "Arbitrary stack deletion"
        likelihood: "Low (prefix validation)"
        impact: "Critical (wrong stack deleted)"
        mitigation: "Only delete ndx-try-* stacks"
      - id: "DF06-V2"
        threat: "Lambda code injection"
        likelihood: "Very Low (no user input)"
        impact: "Critical"
        mitigation: "No user input to Lambda"
    riskRating: "🟢 LOW"

  DF-07_alertNotifications:
    description: "SNS to email/PagerDuty alerts"
    dataClassification: "Internal - Operational"
    dataElements:
      - alertType: "cleanup_failure, cost_alarm, etc."
      - stackInfo: "Stack ARN, status"
      - timestamp: "Alert time"
      - metrics: "Cost, count values"
    piiPresent: false
    encryption:
      inTransit: "TLS (SNS to subscribers)"
      atRest: "SNS default"
    securityControls:
      - "SNS topic policy"
      - "Subscription confirmation"
      - "No PII in payloads"
    vulnerabilities:
      - id: "DF07-V1"
        threat: "Alert injection/spam"
        likelihood: "Low (Lambda origin only)"
        impact: "Medium (alert fatigue)"
        mitigation: "SNS topic policy restricts publishers"
      - id: "DF07-V2"
        threat: "Email phishing via fake alerts"
        likelihood: "Low (SNS verified sender)"
        impact: "Medium"
        mitigation: "Use GOV.UK Notify for gov domain"
    riskRating: "🟡 MEDIUM"
```

**Cross-Flow Security Concerns:**

```yaml
crossFlowSecurityConcerns:
  CFSEC-01:
    name: "Data Correlation Attack"
    description: "Combining GA4 events with AWS stack events could identify users"
    flows: ["DF-02", "DF-05"]
    likelihood: "Very Low"
    impact: "Medium"
    mitigation: |
      - GA4 has no stack identifiers
      - AWS events have no user identifiers
      - Correlation requires timestamps only (weak)
    status: "Acceptable risk"

  CFSEC-02:
    name: "Session Hijacking via localStorage"
    description: "Malicious code reads session, predicts stack names"
    flows: ["DF-01", "DF-03"]
    likelihood: "Low"
    impact: "Low"
    mitigation: |
      - Stack names include random suffix
      - No auth tokens in localStorage
      - CSP prevents script injection
    status: "Acceptable risk"

  CFSEC-03:
    name: "Return URL to Cleanup Bypass"
    description: "Manipulated return URL could indicate false success"
    flows: ["DF-04", "DF-06"]
    likelihood: "Medium"
    impact: "Low"
    mitigation: |
      - Cleanup based on EventBridge, not return URL
      - User sees incorrect status (cosmetic only)
      - No security impact, just UX
    status: "Acceptable risk"
```

**Data Classification Summary:**

| Flow | Classification | PII | Encryption | Compliance |
|------|---------------|-----|------------|------------|
| DF-01 localStorage | Internal | None | None (acceptable) | N/A |
| DF-02 GA4 Events | Behavioural | IP (anon) | TLS | PECR consent required |
| DF-03 CF Redirect | Technical | None | TLS | N/A |
| DF-04 Return URL | Technical | None | TLS | N/A |
| DF-05 Stack Events | AWS Internal | None | AWS managed | N/A |
| DF-06 Cleanup | AWS Internal | None | AWS managed | N/A |
| DF-07 Alerts | Operational | None | TLS | N/A |

**Required Security Controls:**

```yaml
requiredSecurityControls:
  mustHave_MVP:
    - control: "Return URL allowlist"
      flow: "DF-04"
      effort: "0.5 day"
      priority: "P1 - Critical"

    - control: "Cookie consent banner"
      flow: "DF-02"
      effort: "1 day"
      priority: "P1 - Compliance"

    - control: "CSP headers"
      flow: "DF-01, DF-02"
      effort: "0.5 day"
      priority: "P1 - Security"

    - control: "Template URL validation"
      flow: "DF-03"
      effort: "0.25 day"
      priority: "P1 - Security"

    - control: "Stack name prefix validation"
      flow: "DF-06"
      effort: "Built into Lambda"
      priority: "P1 - Critical"

  shouldHave_Phase2:
    - control: "Security.txt file"
      flow: "All"
      effort: "0.25 day"

    - control: "CloudTrail alerting"
      flow: "DF-05, DF-06"
      effort: "0.5 day"

    - control: "SNS topic policy review"
      flow: "DF-07"
      effort: "0.25 day"

  totalMvpSecurityEffort: "2.25 days"
```

## Acceptance Criteria (Authoritative)

This section contains the definitive acceptance criteria for Epic 2, derived from stories 2.1-2.6 with technical enhancements from elicitation. All criteria are testable and map to specific FRs.

### AC-2.1: One-Click CloudFormation Deployment

| ID | Criterion | FR | Testable |
|----|-----------|-----|----------|
| AC-2.1.1 | Clicking "Deploy to Innovation Sandbox" redirects to AWS CloudFormation Console with template pre-loaded via S3 URL | FR8 | ✓ URL contains templateURL parameter |
| AC-2.1.2 | All CloudFormation parameters are pre-filled with sensible defaults (region: us-west-2, scenario tag, git hash) | FR8 | ✓ URL contains param_ values |
| AC-2.1.3 | Stack name is pre-filled with pattern `ndx-try-{scenario-id}-{timestamp}` and is ≤128 characters | FR8 | ✓ Regex validation |
| AC-2.1.4 | No manual parameter editing required for successful deployment | FR8 | ✓ User testing (0 edits) |
| AC-2.1.5 | Stack resources include tags: scenario, git-hash, git-tag, max-cost, auto-cleanup=true | FR8 | ✓ CloudFormation output inspection |
| AC-2.1.6 | Deployment succeeds ≥95% of the time (first-attempt success rate) | FR8 | ✓ Analytics metric |
| AC-2.1.7 | Failed deployments show actionable error message in plain English (not CloudFormation jargon) | FR8 | ✓ Error message review |
| AC-2.1.8 | Return URL passes allowlist validation before redirect (security control) | - | ✓ Unit test |

### AC-2.2: Real-Time Deployment Progress Tracking

| ID | Criterion | FR | Testable |
|----|-----------|-----|----------|
| AC-2.2.1 | AWS CloudFormation Console shows real-time stack events (CREATE_IN_PROGRESS, CREATE_COMPLETE) | FR9 | ✓ Visual inspection |
| AC-2.2.2 | Events auto-update without page refresh | FR9 | ✓ User testing |
| AC-2.2.3 | Success shows green checkmark and "Access Your Scenario" button | FR9, FR10 | ✓ Visual inspection |
| AC-2.2.4 | Failure shows red X with plain English error message | FR9 | ✓ Error scenario testing |
| AC-2.2.5 | Link to full CloudFormation events in AWS Console is provided | FR9 | ✓ Link verification |
| AC-2.2.6 | Portal page includes countdown timer showing session time remaining | - | ✓ Timer visible |

### AC-2.3: Deployment Cost Estimation & Validation

| ID | Criterion | FR | Testable |
|----|-----------|-----|----------|
| AC-2.3.1 | Scenario detail page displays cost transparency box with estimated cost range (£0.50-£2.00) | FR12 | ✓ Page content |
| AC-2.3.2 | Maximum cost guarantee displayed (£5.00 cap) | FR12 | ✓ Page content |
| AC-2.3.3 | Cost breakdown shows per-service estimates (Bedrock, Lambda, DynamoDB, etc.) | FR12 | ✓ Page content |
| AC-2.3.4 | "Deploy Now" button disabled until user acknowledges cost cap | FR12 | ✓ Button state |
| AC-2.3.5 | Confirmation modal: "I understand this scenario may cost up to £5.00 and will be automatically cleaned up" | FR12 | ✓ Modal content |
| AC-2.3.6 | Estimated cost validated within ±15% of documented estimate before deployment | FR12 | ✓ Validation logic |
| AC-2.3.7 | Post-deployment email includes actual costs vs estimated comparison | FR12 | ✓ Email content |

### AC-2.4: Demo Videos (Zero-Deployment Path)

| ID | Criterion | FR | Testable |
|----|-----------|-----|----------|
| AC-2.4.1 | Each scenario page includes embedded 5-10 minute demo video | FR21 | ✓ Video present |
| AC-2.4.2 | Video shows: introduction, deployment walkthrough, "try this" demo, results, reflection, next steps | FR21 | ✓ Video content review |
| AC-2.4.3 | Video uses UK local government context (council names, council problems) | FR21 | ✓ Content review |
| AC-2.4.4 | Video includes closed captions in English | FR22 | ✓ Captions enabled |
| AC-2.4.5 | Transcript available as text below video | FR22 | ✓ Transcript present |
| AC-2.4.6 | Transcript downloadable as PDF | FR22, FR44 | ✓ Download link |
| AC-2.4.7 | Video loads within 3 seconds on 10 Mbps connection | FR21 | ✓ Performance test |

### AC-2.5: Screenshot Gallery (Zero-Deployment Path)

| ID | Criterion | FR | Testable |
|----|-----------|-----|----------|
| AC-2.5.1 | Each scenario page includes 5-7 annotated screenshots | FR23 | ✓ Screenshot count |
| AC-2.5.2 | Screenshots show: deployment starting, deployment complete, key interaction, results dashboard, cost summary, reflection form, evidence pack | FR23 | ✓ Content review |
| AC-2.5.3 | Each screenshot includes red box highlighting key element | FR23 | ✓ Visual inspection |
| AC-2.5.4 | Each screenshot includes numbered callout and text annotation | FR23 | ✓ Visual inspection |
| AC-2.5.5 | Screenshots are responsive and readable on mobile (320px) | FR23 | ✓ Responsive test |
| AC-2.5.6 | Screenshots have alt text describing content | FR43 | ✓ Alt text present |

### AC-2.6: Partner-Led Guided Tour

| ID | Criterion | FR | Testable |
|----|-----------|-----|----------|
| AC-2.6.1 | "Schedule a Partner Tour" button visible on scenario detail pages | FR24 | ✓ Button present |
| AC-2.6.2 | Contact form includes: council name, contact name, email, phone (optional), scenario interest, available times, additional context | FR24 | ✓ Form fields |
| AC-2.6.3 | Required field indicators (*) shown for mandatory fields | FR24 | ✓ Visual inspection |
| AC-2.6.4 | Form submits to GOV.UK Forms Service (or equivalent) | FR24 | ✓ Submission test |
| AC-2.6.5 | Confirmation message displayed after submission | FR24 | ✓ Message shown |
| AC-2.6.6 | GDPR privacy notice included on form | FR24 | ✓ Notice present |

### AC-2.7: Cross-Cutting Requirements

| ID | Criterion | FR | Testable |
|----|-----------|-----|----------|
| AC-2.7.1 | All pages pass WCAG 2.2 AA automated validation (WAVE, axe) | FR41 | ✓ Tool reports |
| AC-2.7.2 | All pages navigable with keyboard only | FR41 | ✓ Manual test |
| AC-2.7.3 | All pages tested with screen reader (NVDA/VoiceOver) | FR41, FR42 | ✓ Manual test |
| AC-2.7.4 | Cookie consent banner displayed before GA4 tracking | - | ✓ Banner shown |
| AC-2.7.5 | CSP headers configured to prevent XSS | - | ✓ Header inspection |
| AC-2.7.6 | Template URLs validated against allowlist | - | ✓ Unit test |
| AC-2.7.7 | Stack cleanup executes within 2 hours of session end | FR11 | ✓ CloudWatch logs |

### AC-2.8: Security & Compliance

| ID | Criterion | FR | Testable |
|----|-----------|-----|----------|
| AC-2.8.1 | Return URL allowlist enforced (only ndx-try.service.gov.uk, localhost:8080 for dev) | - | ✓ Validation test |
| AC-2.8.2 | HTTPS enforced for all external redirects | - | ✓ Protocol check |
| AC-2.8.3 | No PII stored in localStorage | - | ✓ Code review |
| AC-2.8.4 | GA4 only loaded after consent | - | ✓ Network inspection |
| AC-2.8.5 | Stack name prefix validation (only delete ndx-try-* stacks) | - | ✓ Lambda code review |
| AC-2.8.6 | DynamoDB stack registry prevents orphaned resources | - | ✓ Integration test |

### Acceptance Criteria Summary

| Story | Total ACs | Critical | Testable |
|-------|-----------|----------|----------|
| 2.1 One-Click Deployment | 8 | 6 | 8/8 ✓ |
| 2.2 Progress Tracking | 6 | 4 | 6/6 ✓ |
| 2.3 Cost Transparency | 7 | 5 | 7/7 ✓ |
| 2.4 Demo Videos | 7 | 4 | 7/7 ✓ |
| 2.5 Screenshot Gallery | 6 | 3 | 6/6 ✓ |
| 2.6 Partner Tour | 6 | 3 | 6/6 ✓ |
| 2.7 Cross-Cutting | 7 | 7 | 7/7 ✓ |
| 2.8 Security | 6 | 6 | 6/6 ✓ |
| **Total** | **53** | **38** | **53/53 ✓** |

## Traceability Mapping

This section provides complete bidirectional traceability from PRD functional requirements through stories, acceptance criteria, and implementation components.

### FR → Story → AC → Component Matrix

| FR | FR Title | Story | Acceptance Criteria | Components |
|----|----------|-------|---------------------|------------|
| FR8 | One-click CloudFormation deployment | 2.1 | AC-2.1.1 through AC-2.1.8 | `generateCloudFormationUrl()`, scenario-detail.njk, deploy-button.js |
| FR9 | Real-time stack event tracking | 2.2 | AC-2.2.1 through AC-2.2.6 | AWS Console redirect, progress-indicator.njk, countdown-timer.js |
| FR10 | Immediate deployment outputs | 2.1, 2.2 | AC-2.2.3 | CloudFormation Outputs, access-scenario.njk |
| FR11 | Automated cleanup | 2.7 | AC-2.7.7 | cleanup-lambda.py, EventBridge rule, DynamoDB stack-registry |
| FR12 | Cost estimation validation | 2.3 | AC-2.3.1 through AC-2.3.7 | cost-transparency.njk, cost-acknowledgment.js, scenarios.yaml |
| FR21 | Demo videos | 2.4 | AC-2.4.1 through AC-2.4.7 | video-embed.njk, YouTube iframe, transcript.md |
| FR22 | Video captions and transcripts | 2.4 | AC-2.4.4 through AC-2.4.6 | YouTube captions, transcript-download.njk |
| FR23 | Screenshot gallery | 2.5 | AC-2.5.1 through AC-2.5.6 | screenshot-gallery.njk, annotated-image.css |
| FR24 | Partner-led tour contact | 2.6 | AC-2.6.1 through AC-2.6.6 | partner-tour-form.njk, GOV.UK Forms integration |
| FR41 | WCAG 2.2 AA compliance | 2.7 | AC-2.7.1 through AC-2.7.3 | All components, WAVE CI, axe testing |
| FR42 | Text-to-speech support | 2.7 | AC-2.7.3 | Semantic HTML, ARIA labels, heading hierarchy |
| FR43 | Alt text for images | 2.5 | AC-2.5.6 | scenarios.yaml alt fields, image-alt-validator.js |
| FR44 | Video transcripts | 2.4 | AC-2.4.5, AC-2.4.6 | transcript.md, transcript-pdf-generator |

### Story → FR Reverse Mapping

```yaml
storyToFRMapping:
  story_2.1:
    title: "One-Click CloudFormation Deployment"
    primaryFRs: [FR8, FR10]
    secondaryFRs: []
    acceptanceCriteria: 8
    components:
      - name: "generateCloudFormationUrl()"
        path: "src/utils/cloudformation.ts"
        type: "Function"
      - name: "scenario-detail.njk"
        path: "src/templates/scenario-detail.njk"
        type: "Template"
      - name: "deploy-button.js"
        path: "src/assets/js/deploy-button.js"
        type: "Script"

  story_2.2:
    title: "Real-Time Deployment Progress"
    primaryFRs: [FR9]
    secondaryFRs: [FR10]
    acceptanceCriteria: 6
    components:
      - name: "progress-indicator.njk"
        path: "src/templates/partials/progress-indicator.njk"
        type: "Template"
      - name: "countdown-timer.js"
        path: "src/assets/js/countdown-timer.js"
        type: "Script"

  story_2.3:
    title: "Cost Estimation & Validation"
    primaryFRs: [FR12]
    secondaryFRs: []
    acceptanceCriteria: 7
    components:
      - name: "cost-transparency.njk"
        path: "src/templates/partials/cost-transparency.njk"
        type: "Template"
      - name: "cost-acknowledgment.js"
        path: "src/assets/js/cost-acknowledgment.js"
        type: "Script"
      - name: "scenarios.yaml"
        path: "src/data/scenarios.yaml"
        type: "Data"

  story_2.4:
    title: "Demo Videos"
    primaryFRs: [FR21, FR22, FR44]
    secondaryFRs: []
    acceptanceCriteria: 7
    components:
      - name: "video-embed.njk"
        path: "src/templates/partials/video-embed.njk"
        type: "Template"
      - name: "transcript.md"
        path: "src/content/transcripts/{scenario-id}-transcript.md"
        type: "Content"

  story_2.5:
    title: "Screenshot Gallery"
    primaryFRs: [FR23, FR43]
    secondaryFRs: []
    acceptanceCriteria: 6
    components:
      - name: "screenshot-gallery.njk"
        path: "src/templates/partials/screenshot-gallery.njk"
        type: "Template"
      - name: "annotated-image.css"
        path: "src/assets/css/annotated-image.css"
        type: "Stylesheet"

  story_2.6:
    title: "Partner-Led Guided Tour"
    primaryFRs: [FR24]
    secondaryFRs: []
    acceptanceCriteria: 6
    components:
      - name: "partner-tour-form.njk"
        path: "src/templates/partials/partner-tour-form.njk"
        type: "Template"
      - name: "GOV.UK Forms"
        path: "external"
        type: "External Service"
```

### Component → FR Reverse Mapping

| Component | Type | Stories | FRs Implemented |
|-----------|------|---------|-----------------|
| generateCloudFormationUrl() | Function | 2.1 | FR8 |
| scenario-detail.njk | Template | 2.1, 2.3, 2.4, 2.5, 2.6 | FR8, FR12, FR21, FR23, FR24 |
| deploy-button.js | Script | 2.1 | FR8 |
| cost-transparency.njk | Template | 2.3 | FR12 |
| cost-acknowledgment.js | Script | 2.3 | FR12 |
| video-embed.njk | Template | 2.4 | FR21, FR22 |
| transcript.md | Content | 2.4 | FR22, FR44 |
| screenshot-gallery.njk | Template | 2.5 | FR23, FR43 |
| partner-tour-form.njk | Template | 2.6 | FR24 |
| cleanup-lambda.py | Lambda | Foundation | FR11 |
| scenarios.yaml | Data | 2.1, 2.3, 2.5 | FR8, FR12, FR23 |

### Traceability Verification Checklist

```yaml
traceabilityVerification:
  forward:
    allFRsMapped: true
    frCount: 9  # FR8, FR9, FR10, FR11, FR12, FR21, FR22, FR23, FR24
    crossCuttingFRs: 3  # FR41, FR42, FR43 (apply to multiple stories)
    unmappedFRs: []

  backward:
    allStoriesHaveFRs: true
    storyCount: 6
    storiesWithoutFRs: []

  acceptance:
    totalACs: 53
    acsWithFRMapping: 47
    acsSecurityEnhancements: 6  # Added via elicitation, no PRD FR
    untestableACs: 0

  components:
    totalComponents: 15
    componentsWithFRMapping: 15
    orphanComponents: 0  # No component without FR justification
```

### Gap Analysis

| Gap Type | Count | Details |
|----------|-------|---------|
| FRs without ACs | 0 | All 9 primary FRs have acceptance criteria |
| ACs without FRs | 6 | Security enhancements (AC-2.8.*) from elicitation |
| Stories without FRs | 0 | All 6 stories map to at least one FR |
| Components without justification | 0 | All components trace to FRs |

**Security Enhancement ACs (No PRD FR):**
- AC-2.1.8: Return URL allowlist (security hardening)
- AC-2.8.1: Return URL enforcement
- AC-2.8.2: HTTPS enforcement
- AC-2.8.3: PII prevention
- AC-2.8.4: Consent-first tracking
- AC-2.8.5: Stack prefix validation
- AC-2.8.6: Stack registry

*These were identified through Red Team, Pre-mortem, and FMEA elicitation methods. Recommend adding FR57-FR63 in PRD v2 to formalize.*

### Traceability Diagram

```
PRD Functional Requirements
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ FR8   FR9   FR10  FR11  FR12  FR21  FR22  FR23  FR24  FR41-44  │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Story  Story  Story  Story  Story  Story  Cross-Cutting        │
│  2.1    2.2    2.3    2.4    2.5    2.6    (Accessibility)     │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ AC-2.1.* AC-2.2.* AC-2.3.* AC-2.4.* AC-2.5.* AC-2.6.* AC-2.7.* │
│                                                      AC-2.8.*  │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Components: Templates, Scripts, Lambda, Data, External Services│
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Test Cases (mapped 1:1 to Acceptance Criteria)                  │
└─────────────────────────────────────────────────────────────────┘
```

## Risks, Assumptions, Open Questions

### Technical Risks

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|------------|--------|------------|-------|
| TR-01 | CloudFormation Quick Create URL format changes | Low | High | Monitor AWS release notes; abstract URL generation; version pin | Dev Lead |
| TR-02 | EventBridge rule fails silently, stacks not cleaned up | Medium | Critical | DynamoDB registry + heartbeat alerts + SNS synthetic tests | Platform |
| TR-03 | GA4 events land in spam/blocked by council firewalls | Medium | Medium | GOV.UK Notify fallback; SNS verified sender | Dev Lead |
| TR-04 | YouTube embed blocked by council IT policies | Medium | Low | Self-hosted video fallback; downloadable MP4 option | Content |
| TR-05 | Concurrent stack deployments exceed AWS limits | Low | Medium | SQS queue buffering; rate limiting (5/min) | Platform |
| TR-06 | Return URL manipulation enables open redirect | Medium | High | Strict allowlist validation; client + server validation | Security |
| TR-07 | Schema drift between portal and CloudFormation | Medium | High | Contract testing; JSON Schema validation in CI | Dev Lead |
| TR-08 | Weekend/holiday cost attack (orphaned stacks) | Low | Critical | PagerDuty 24/7; lower weekend thresholds; billing alerts | Platform |

### Business Risks

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|------------|--------|------------|-------|
| BR-01 | Low adoption of self-report feedback form | High | Medium | Proxy metrics (cleanup-as-success); form simplification | Product |
| BR-02 | Videos not completed before portal launch | Medium | High | MVP with screenshots only; videos Phase 2 | Content |
| BR-03 | Partner ecosystem not established at launch | High | Medium | G-Cloud pathway always available; manual partner matching | BD |
| BR-04 | Council users confused by AWS Console redirect | Medium | Medium | Clear pre-flight instructions; countdown timer | UX |
| BR-05 | Cost estimates diverge >15% from actuals | Low | High | Quarterly cost validation; scenario-specific testing | Platform |

### Assumptions

| ID | Assumption | Confidence | Validation Method | Impact if Wrong |
|----|------------|------------|-------------------|-----------------|
| A-01 | AWS Innovation Sandbox available to all target councils | High | Confirmed with AWS | Epic blocked |
| A-02 | CloudFormation Quick Create URL format stable | Medium | AWS documentation | URL generation rework |
| A-03 | Council IT allows YouTube embeds | Medium | User testing | Need self-hosted fallback |
| A-04 | GOV.UK Forms Service available for partner form | High | GDS documentation | Build custom form |
| A-05 | Users will acknowledge cost cap before deploying | High | UX research | Deployment failures |
| A-06 | 2-hour cleanup SLA acceptable to users | Medium | User feedback | Adjust SLA or add manual cleanup |
| A-07 | Static site (no backend) sufficient for MVP | High | Architecture review | Add serverless backend |
| A-08 | GA4 consent model compliant with PECR | Medium | Legal review | Implement alternative analytics |

### Open Questions

| ID | Question | Priority | Decision Needed By | Options | Recommended |
|----|----------|----------|-------------------|---------|-------------|
| OQ-01 | Should demo videos be recorded before or after portal launch? | High | Sprint start | Before (delays launch) / After (screenshots only MVP) | After |
| OQ-02 | Which GOV.UK Notify template to use for alerts? | Medium | Story 2.3 | New template / Existing NDX template | New template |
| OQ-03 | Should cost acknowledgment be per-session or per-deployment? | Medium | Story 2.3 | Per-session / Per-deployment | Per-deployment |
| OQ-04 | YouTube or self-hosted videos? | High | Story 2.4 | YouTube (easy) / Self-hosted (no blocking) | YouTube + fallback |
| OQ-05 | Manual or automated partner matching? | Low | Story 2.6 | Manual / Automated CRM | Manual (MVP) |
| OQ-06 | Should countdown timer be dismissible? | Low | Story 2.2 | Dismissible / Persistent | Persistent |
| OQ-07 | What happens if user deploys second stack before first cleanup? | Medium | Story 2.1 | Allow / Block / Warn | Warn + allow |

### Dependencies on External Decisions

| Decision | Owner | Status | Blocks |
|----------|-------|--------|--------|
| AWS Innovation Sandbox access model | AWS | Confirmed | All deployment stories |
| GOV.UK Forms Service availability | GDS | Assumed | Story 2.6 |
| GOV.UK Notify API access | GDS | Assumed | Story 2.3 (email) |
| YouTube embedding policy | Content | Open | Story 2.4 |
| Partner ecosystem readiness | BD | In Progress | Story 2.6 |

### Risk Heat Map

```
           │ LOW Impact │ MEDIUM Impact │ HIGH Impact │ CRITICAL Impact
───────────┼────────────┼───────────────┼─────────────┼─────────────────
HIGH       │            │ BR-01         │             │
Likelihood │            │               │             │
───────────┼────────────┼───────────────┼─────────────┼─────────────────
MEDIUM     │ TR-04      │ TR-03, BR-04  │ TR-06, TR-07│ TR-02
Likelihood │            │               │ BR-02       │
───────────┼────────────┼───────────────┼─────────────┼─────────────────
LOW        │            │ TR-05         │ TR-01, BR-05│ TR-08
Likelihood │            │               │             │
```

**Top 5 Risks Requiring Immediate Action:**
1. **TR-02** EventBridge silent failure → Implement DynamoDB registry + heartbeat (MVP)
2. **TR-06** Open redirect vulnerability → Implement allowlist validation (MVP)
3. **TR-08** Weekend cost attack → PagerDuty integration (MVP)
4. **BR-01** Low self-report adoption → Proxy metrics ready (MVP)
5. **TR-07** Schema drift → Contract testing in CI (MVP)

### Risk Quantification

**Methodology:**

| Scale | Probability | Impact |
|-------|-------------|--------|
| Very Low | 1-10% | < £500 |
| Low | 11-25% | £500 - £2,000 |
| Medium | 26-50% | £2,000 - £10,000 |
| High | 51-75% | £10,000 - £50,000 |
| Very High | 76-100% | > £50,000 |

**Expected Loss = Probability × Impact (midpoint)**

**Quantified Technical Risks:**

| ID | Risk | Prob | Impact (Mid) | Expected Loss | Mitigation Cost | Mitigated Loss | ROI |
|----|------|------|--------------|---------------|-----------------|----------------|-----|
| TR-06 | Open redirect vulnerability | 30% | £55,000 | £16,500 | £1,500 | £550 | **1063%** |
| TR-02 | EventBridge silent failure | 35% | £2,500/inc | £10,500/yr | £3,000 | £1,500 | **300%** |
| TR-08 | Weekend cost attack | 8% | £27,500 | £2,200 | £1,000 | £275 | **192%** |
| TR-07 | Schema drift | 50% | £5,000 | £2,500 | £2,000 | £250 | **112%** |
| TR-03 | GA4 blocked by firewalls | 40% | £3,000 | £1,200 | £2,000 | £300 | 45% |
| TR-04 | YouTube blocked | 45% | £1,250 | £562 | £1,500 | £62 | 33% |
| TR-05 | AWS limits exceeded | 15% | £1,750 | £262 | £2,500 | £35 | 9% |
| TR-01 | CF URL format change | 10% | £10,000 | £1,000 | - | - | - |

**Quantified Business Risks:**

| ID | Risk | Prob | Impact (Mid) | Expected Loss | Mitigation Cost | Mitigated Loss | ROI |
|----|------|------|--------------|---------------|-----------------|----------------|-----|
| BR-05 | Cost estimates diverge | 20% | £15,000 | £3,000 | £1,000 | £750 | **225%** |
| BR-01 | Low self-report adoption | 65% | £6,500 | £4,225 | £1,500 | £975 | **216%** |
| BR-04 | User confusion at redirect | 40% | £3,000 | £1,200 | £500 | £450 | **150%** |
| BR-02 | Videos not ready | 45% | £12,500 | £5,625 | £0 | £0 | ∞ (defer) |
| BR-03 | Partner ecosystem missing | 70% | £5,000 | £3,500 | £0 | £1,400 | - |

**Investment Prioritization:**

```yaml
investmentTiers:
  tier1_mustDo:
    description: "ROI > 100%, implement in MVP"
    risks: [TR-06, TR-02, BR-05, BR-01, TR-08, BR-04]
    totalInvestment: £8,500
    totalRiskReduction: £37,625

  tier2_shouldDo:
    description: "ROI 50-100%, implement if time permits"
    risks: [TR-07]
    totalInvestment: £2,000
    totalRiskReduction: £2,250

  tier3_defer:
    description: "ROI < 50%, defer to Phase 2"
    risks: [TR-03, TR-04, TR-05]
    totalInvestment: £6,000
    totalRiskReduction: £1,362
    recommendation: "Accept risk or defer mitigation"
```

**Expected Loss Waterfall:**

```
Unmitigated Annual Risk: £45,272
         │
         │ Tier 1 Mitigations (-£33,125)
         │ Tier 2 Mitigations (-£2,250)
         │ BR-02 Deferral (-£5,625)
         ▼
Residual Annual Risk: £4,272

MVP Investment Required: £10,500
Net Annual Benefit: £35,375
Overall ROI: 337%
```

**Financial Summary:**

| Metric | Value |
|--------|-------|
| Total unmitigated risk | £45,272/year |
| MVP mitigation investment | £10,500 |
| Residual risk after MVP | £4,272/year |
| Risk reduction | £40,000/year |
| Payback period | 3.2 months |
| 3-year NPV (8% discount) | £92,500 |

## Test Strategy Summary

### Test Approach Overview

Epic 2 follows a **risk-based testing strategy** with emphasis on:
1. Contract testing for external integrations
2. Security testing for redirect/URL manipulation
3. Accessibility compliance (WCAG 2.2 AA)
4. User acceptance for zero-deployment pathways

### Test Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │  5-10 tests
                    │  (Playwright)   │  Critical paths
                    ├─────────────────┤
                    │ Integration     │  20-30 tests
                    │ Tests (Jest)    │  API contracts
                    ├─────────────────┤
                    │   Unit Tests    │  50-100 tests
                    │    (Jest)       │  Business logic
                    └─────────────────┘
```

### Test Categories by Story

| Story | Unit | Integration | E2E | Accessibility | Security |
|-------|------|-------------|-----|---------------|----------|
| 2.1 One-Click Deploy | 10 | 5 | 2 | 1 | 3 |
| 2.2 Progress Tracking | 5 | 3 | 1 | 1 | 0 |
| 2.3 Cost Transparency | 8 | 2 | 1 | 1 | 1 |
| 2.4 Demo Videos | 3 | 2 | 1 | 2 | 0 |
| 2.5 Screenshot Gallery | 5 | 1 | 1 | 2 | 0 |
| 2.6 Partner Tour | 6 | 3 | 1 | 1 | 1 |
| **Total** | **37** | **16** | **7** | **8** | **5** |

### Critical Test Scenarios

```yaml
criticalTestScenarios:
  deployment:
    - name: "Happy path deployment"
      type: "E2E"
      priority: "P1"
      steps:
        - Visit scenario detail page
        - Click "Deploy to Innovation Sandbox"
        - Verify redirect to AWS Console with correct URL
        - Verify all parameters pre-filled
      expectedResult: "User lands on CloudFormation Quick Create with template loaded"

    - name: "Return URL allowlist validation"
      type: "Security"
      priority: "P1"
      steps:
        - Attempt redirect with malicious return URL
        - Verify rejection
      expectedResult: "Redirect blocked; error logged"

    - name: "Cost acknowledgment gate"
      type: "E2E"
      priority: "P1"
      steps:
        - Visit scenario page
        - Attempt deploy without acknowledgment
        - Verify button disabled
        - Check acknowledgment box
        - Verify button enabled
      expectedResult: "Deploy blocked until user acknowledges cost cap"

  zeroDeployment:
    - name: "Video playback and captions"
      type: "Accessibility"
      priority: "P1"
      steps:
        - Load scenario page with video
        - Verify video loads
        - Enable captions
        - Verify captions display
      expectedResult: "Video plays with accurate English captions"

    - name: "Screenshot gallery keyboard navigation"
      type: "Accessibility"
      priority: "P1"
      steps:
        - Tab through screenshot gallery
        - Verify focus indicators
        - Verify arrow key navigation
      expectedResult: "All screenshots navigable via keyboard"

  contracts:
    - name: "CloudFormation URL contract"
      type: "Contract"
      priority: "P1"
      steps:
        - Generate URL for each scenario
        - Validate against AWS Quick Create format
        - Verify all required parameters present
      expectedResult: "URLs match AWS specification"

    - name: "scenarios.yaml schema validation"
      type: "Contract"
      priority: "P1"
      steps:
        - Load scenarios.yaml
        - Validate against JSON schema
        - Check all required fields present
      expectedResult: "Schema validation passes"
```

### Accessibility Testing Plan

```yaml
accessibilityTesting:
  automated:
    tools:
      - name: "WAVE"
        integration: "GitHub Actions on every PR"
        threshold: "0 errors, 0 contrast errors"
      - name: "axe-core"
        integration: "Jest tests via jest-axe"
        threshold: "0 violations"
      - name: "Lighthouse"
        integration: "GitHub Actions nightly"
        threshold: "Accessibility score ≥95"

  manual:
    frequency: "Per story completion + pre-release"
    tests:
      - name: "Keyboard navigation"
        scope: "All interactive elements"
        pass: "All elements focusable and operable via keyboard"
      - name: "Screen reader (NVDA)"
        scope: "All pages"
        pass: "Content announced correctly, no traps"
      - name: "Screen reader (VoiceOver)"
        scope: "All pages"
        pass: "Content announced correctly on macOS/iOS"
      - name: "Color contrast manual review"
        scope: "Custom components"
        pass: "4.5:1 for text, 3:1 for large text"
      - name: "Focus indicators"
        scope: "All interactive elements"
        pass: "Visible focus indicator on all elements"

  wcagCoverage:
    level: "AA"
    principlesChecked:
      perceivable: ["1.1.1", "1.2.1", "1.2.2", "1.3.1", "1.4.1", "1.4.3", "1.4.4", "1.4.10", "1.4.11"]
      operable: ["2.1.1", "2.1.2", "2.4.1", "2.4.2", "2.4.3", "2.4.4", "2.4.6", "2.4.7"]
      understandable: ["3.1.1", "3.2.1", "3.2.2", "3.3.1", "3.3.2"]
      robust: ["4.1.1", "4.1.2"]
```

### Security Testing Plan

```yaml
securityTesting:
  staticAnalysis:
    - tool: "ESLint security plugin"
      integration: "CI on every PR"
      checks: ["no-eval", "no-new-func", "detect-object-injection"]

    - tool: "npm audit"
      integration: "CI on every PR"
      threshold: "0 high/critical vulnerabilities"

  dynamicTesting:
    - name: "Return URL manipulation"
      type: "Manual + automated"
      vectors:
        - "javascript: protocol"
        - "data: protocol"
        - "External domain redirect"
        - "URL encoding bypass"
        - "Case variation bypass"
      expectedResult: "All vectors blocked"

    - name: "XSS prevention"
      type: "Automated (OWASP ZAP)"
      scope: "All input fields, URL parameters"
      expectedResult: "No reflected or stored XSS"

    - name: "CSP header validation"
      type: "Automated"
      checks:
        - "default-src 'self'"
        - "script-src without 'unsafe-inline'"
        - "No 'unsafe-eval'"
      expectedResult: "CSP configured correctly"

  penetrationTesting:
    scope: "Pre-launch"
    provider: "Internal security team or external vendor"
    focus:
      - "Open redirect vulnerabilities"
      - "CloudFormation parameter injection"
      - "Session manipulation"
```

### Contract Testing Details

```yaml
contractTesting:
  cloudFormationUrl:
    schema: |
      {
        "type": "string",
        "pattern": "^https://console\\.aws\\.amazon\\.com/cloudformation/home\\?region=us-west-2#/stacks/create/review\\?templateURL=.+&stackName=ndx-try-.+"
      }
    tests:
      - "URL matches Quick Create format"
      - "Region is us-west-2"
      - "Stack name follows naming convention"
      - "All parameters URL-encoded"
      - "Template URL is valid S3 path"

  scenariosYaml:
    schema: "schemas/scenarios.schema.json"
    tests:
      - "All required fields present"
      - "Cost values are numbers"
      - "Difficulty is enum (beginner/intermediate/advanced)"
      - "Time estimate matches format"
      - "URLs are valid"

  ga4Events:
    schema: "schemas/ga4-events.schema.json"
    tests:
      - "Event names match specification"
      - "Required parameters present"
      - "No PII in event data"

  localStorage:
    schema: "schemas/localstorage.schema.json"
    tests:
      - "Schema version present"
      - "Data roundtrip preserves structure"
      - "Invalid data handled gracefully"
```

### Test Environment

```yaml
testEnvironments:
  local:
    purpose: "Developer testing"
    url: "http://localhost:8080"
    features: "Full functionality, mock AWS"

  staging:
    purpose: "Integration testing"
    url: "https://staging.ndx-try.service.gov.uk"
    features: "Real AWS sandbox, test data"

  production:
    purpose: "Smoke testing only"
    url: "https://ndx-try.service.gov.uk"
    features: "Real AWS, real users"

  browserMatrix:
    required:
      - "Chrome 120+ (desktop)"
      - "Firefox 120+ (desktop)"
      - "Safari 17+ (desktop)"
      - "Edge 120+ (desktop)"
      - "Chrome Mobile (Android)"
      - "Safari Mobile (iOS)"
    screenSizes:
      - "320px (mobile)"
      - "768px (tablet)"
      - "1024px (desktop)"
      - "1440px (large desktop)"
```

### Test Automation Pipeline

```yaml
ciPipeline:
  onEveryPR:
    - name: "Lint"
      tool: "ESLint + Prettier"
      timeout: "2 min"
    - name: "Unit Tests"
      tool: "Jest"
      timeout: "5 min"
    - name: "Schema Validation"
      tool: "ajv-cli"
      timeout: "1 min"
    - name: "Accessibility (automated)"
      tool: "axe-core"
      timeout: "3 min"
    - name: "Security Scan"
      tool: "npm audit + ESLint security"
      timeout: "2 min"

  onMergeToMain:
    - name: "E2E Tests"
      tool: "Playwright"
      timeout: "15 min"
    - name: "Lighthouse Audit"
      tool: "Lighthouse CI"
      timeout: "5 min"
    - name: "Deploy to Staging"
      tool: "GitHub Actions"
      timeout: "5 min"

  nightly:
    - name: "Full E2E Suite"
      tool: "Playwright (all browsers)"
      timeout: "30 min"
    - name: "Performance Regression"
      tool: "Lighthouse"
      timeout: "10 min"
    - name: "Contract Tests (external)"
      tool: "Jest + real endpoints"
      timeout: "15 min"
```

### Definition of Done (Testing)

A story is **Done** when:
- [ ] All unit tests pass (Jest)
- [ ] All integration tests pass (Jest)
- [ ] E2E tests for critical paths pass (Playwright)
- [ ] WAVE reports 0 errors
- [ ] axe-core reports 0 violations
- [ ] Keyboard navigation tested manually
- [ ] Screen reader tested manually (NVDA or VoiceOver)
- [ ] Security scan passes (npm audit, ESLint security)
- [ ] Contract tests pass (if applicable)
- [ ] Code reviewed by peer
- [ ] Deployed to staging and smoke tested

### Test Effort Estimate

| Test Type | Stories | Tests | Effort |
|-----------|---------|-------|--------|
| Unit Tests | All | 37 | 2 days |
| Integration Tests | All | 16 | 1.5 days |
| E2E Tests | All | 7 | 1 day |
| Accessibility Tests | All | 8 | 1 day |
| Security Tests | 2.1, 2.3, 2.6 | 5 | 0.5 day |
| Contract Tests | 2.1, 2.3 | 4 | 0.5 day |
| Manual Exploratory | All | - | 1 day |
| **Total** | | **77** | **7.5 days** |

### Test Coverage Matrix

Mapping 77 tests → 53 acceptance criteria to identify coverage gaps:

```yaml
testCoverageMatrix:
  # ═══════════════════════════════════════════════════════════════════════════
  # STORY 2.1: ONE-CLICK DEPLOYMENT (8 ACs, 14 Tests)
  # ═══════════════════════════════════════════════════════════════════════════

  story_2_1_coverage:
    AC-2.1.1_cloudformation_redirect:
      tests:
        - { id: UT-01, name: "CFN URL builder", type: unit }
        - { id: UT-02, name: "Template URL encoding", type: unit }
        - { id: IT-01, name: "Full redirect flow", type: integration }
        - { id: E2E-01, name: "Deploy button journey", type: e2e }
      coverage: "4 tests ✓ EXCELLENT"

    AC-2.1.2_pre_filled_parameters:
      tests:
        - { id: UT-03, name: "Parameter serialization", type: unit }
        - { id: UT-04, name: "Parameter validation", type: unit }
        - { id: IT-02, name: "Parameter persistence", type: integration }
      coverage: "3 tests ✓ GOOD"

    AC-2.1.3_quick_create_experience:
      tests:
        - { id: E2E-02, name: "Quick Create detection", type: e2e }
      coverage: "1 test ⚠️ MINIMAL - Add unit test for URL structure"

    AC-2.1.4_deploy_in_any_region:
      tests:
        - { id: UT-05, name: "Region selector population", type: unit }
        - { id: IT-03, name: "Multi-region template validation", type: integration }
      coverage: "2 tests ✓ ADEQUATE"

    AC-2.1.5_accessible_deploy_button:
      tests:
        - { id: A11Y-01, name: "Deploy button WCAG", type: accessibility }
        - { id: A11Y-02, name: "Keyboard navigation", type: accessibility }
      coverage: "2 tests ✓ GOOD"

    AC-2.1.6_immediate_feedback:
      tests:
        - { id: UT-06, name: "Click handler response", type: unit }
        - { id: E2E-03, name: "Visual feedback timing", type: e2e }
      coverage: "2 tests ✓ ADEQUATE"

    AC-2.1.7_works_without_javascript:
      tests:
        - { id: IT-04, name: "NoJS fallback", type: integration }
      coverage: "1 test ⚠️ MINIMAL - Add E2E test with JS disabled"

    AC-2.1.8_mobile_responsive:
      tests:
        - { id: A11Y-03, name: "Mobile viewport testing", type: accessibility }
        - { id: E2E-04, name: "Touch interaction", type: e2e }
      coverage: "2 tests ✓ ADEQUATE"

    story_summary:
      total_acs: 8
      total_tests: 18
      coverage_ratio: "2.25 tests/AC"
      status: "✓ Well Covered"
      gaps: ["AC-2.1.3 needs unit test", "AC-2.1.7 needs E2E test"]

  # ═══════════════════════════════════════════════════════════════════════════
  # STORY 2.2: PROGRESS TRACKING (6 ACs, 12 Tests)
  # ═══════════════════════════════════════════════════════════════════════════

  story_2_2_coverage:
    AC-2.2.1_progress_indicator:
      tests:
        - { id: UT-07, name: "Progress bar rendering", type: unit }
        - { id: UT-08, name: "Percentage calculation", type: unit }
        - { id: A11Y-04, name: "Progress ARIA live", type: accessibility }
      coverage: "3 tests ✓ EXCELLENT"

    AC-2.2.2_stage_breakdown:
      tests:
        - { id: UT-09, name: "Stage parsing", type: unit }
        - { id: UT-10, name: "Stage ordering", type: unit }
      coverage: "2 tests ✓ ADEQUATE"

    AC-2.2.3_time_estimates:
      tests:
        - { id: UT-11, name: "ETA calculation", type: unit }
        - { id: IT-05, name: "Historical data accuracy", type: integration }
      coverage: "2 tests ✓ ADEQUATE"

    AC-2.2.4_status_messages:
      tests:
        - { id: UT-12, name: "Message rendering", type: unit }
        - { id: UT-13, name: "Status state machine", type: unit }
        - { id: A11Y-05, name: "Status screen reader", type: accessibility }
      coverage: "3 tests ✓ EXCELLENT"

    AC-2.2.5_error_recovery:
      tests:
        - { id: UT-14, name: "Error detection", type: unit }
        - { id: IT-06, name: "Recovery flow", type: integration }
        - { id: E2E-05, name: "Error user journey", type: e2e }
      coverage: "3 tests ✓ EXCELLENT"

    AC-2.2.6_persistence:
      tests:
        - { id: UT-15, name: "localStorage read/write", type: unit }
        - { id: IT-07, name: "Session restoration", type: integration }
      coverage: "2 tests ✓ ADEQUATE"

    story_summary:
      total_acs: 6
      total_tests: 15
      coverage_ratio: "2.5 tests/AC"
      status: "✓ Excellent Coverage"

  # ═══════════════════════════════════════════════════════════════════════════
  # STORY 2.3: COST TRANSPARENCY (7 ACs, 11 Tests)
  # ═══════════════════════════════════════════════════════════════════════════

  story_2_3_coverage:
    AC-2.3.1_cost_breakdown:
      tests:
        - { id: UT-16, name: "Cost data parsing", type: unit }
        - { id: UT-17, name: "Currency formatting", type: unit }
        - { id: CT-01, name: "Cost schema validation", type: contract }
      coverage: "3 tests ✓ EXCELLENT"

    AC-2.3.2_free_tier_indication:
      tests:
        - { id: UT-18, name: "Free tier detection", type: unit }
        - { id: UT-19, name: "Badge rendering", type: unit }
      coverage: "2 tests ✓ ADEQUATE"

    AC-2.3.3_running_cost_calculator:
      tests:
        - { id: UT-20, name: "Calculator logic", type: unit }
        - { id: UT-21, name: "Duration multiplier", type: unit }
        - { id: IT-08, name: "Real-time updates", type: integration }
      coverage: "3 tests ✓ EXCELLENT"

    AC-2.3.4_comparison_view:
      tests:
        - { id: UT-22, name: "Comparison table render", type: unit }
      coverage: "1 test ⚠️ MINIMAL - Add A11Y test for table"

    AC-2.3.5_cost_assumptions:
      tests:
        - { id: UT-23, name: "Assumptions tooltip", type: unit }
      coverage: "1 test ⚠️ MINIMAL - Add content accuracy test"

    AC-2.3.6_no_surprises:
      tests:
        - { id: IT-09, name: "Cost ceiling verification", type: integration }
        - { id: SEC-01, name: "No unexpected charges", type: security }
      coverage: "2 tests ✓ ADEQUATE"

    AC-2.3.7_accessible_numbers:
      tests:
        - { id: A11Y-06, name: "Number screen reader", type: accessibility }
      coverage: "1 test ✓ ADEQUATE"

    story_summary:
      total_acs: 7
      total_tests: 14
      coverage_ratio: "2.0 tests/AC"
      status: "✓ Good Coverage"
      gaps: ["AC-2.3.4 needs A11Y test", "AC-2.3.5 needs content test"]

  # ═══════════════════════════════════════════════════════════════════════════
  # STORY 2.4: AUTOMATED CLEANUP (7 ACs, 10 Tests)
  # ═══════════════════════════════════════════════════════════════════════════

  story_2_4_coverage:
    AC-2.4.1_countdown_timer:
      tests:
        - { id: UT-24, name: "Timer countdown", type: unit }
        - { id: UT-25, name: "Timer display format", type: unit }
        - { id: A11Y-07, name: "Timer ARIA updates", type: accessibility }
      coverage: "3 tests ✓ EXCELLENT"

    AC-2.4.2_deletion_notification:
      tests:
        - { id: UT-26, name: "Notification rendering", type: unit }
        - { id: IT-10, name: "Notification timing", type: integration }
      coverage: "2 tests ✓ ADEQUATE"

    AC-2.4.3_extension_option:
      tests:
        - { id: UT-27, name: "Extension button", type: unit }
        - { id: IT-11, name: "Extension flow", type: integration }
      coverage: "2 tests ✓ ADEQUATE"

    AC-2.4.4_cleanup_lambda:
      tests:
        - { id: IT-12, name: "Lambda invocation", type: integration }
        - { id: SEC-02, name: "Lambda permissions", type: security }
      coverage: "2 tests ✓ ADEQUATE"

    AC-2.4.5_no_orphans:
      tests:
        - { id: IT-13, name: "Resource cleanup verification", type: integration }
        - { id: SEC-03, name: "Orphan detection", type: security }
      coverage: "2 tests ✓ ADEQUATE"

    AC-2.4.6_graceful_failure:
      tests:
        - { id: UT-28, name: "Error handling", type: unit }
        - { id: IT-14, name: "Retry mechanism", type: integration }
      coverage: "2 tests ✓ ADEQUATE"

    AC-2.4.7_audit_trail:
      tests:
        - { id: IT-15, name: "CloudTrail logging", type: integration }
      coverage: "1 test ⚠️ MINIMAL - Add log format validation"

    story_summary:
      total_acs: 7
      total_tests: 14
      coverage_ratio: "2.0 tests/AC"
      status: "✓ Good Coverage"
      gaps: ["AC-2.4.7 needs log validation test"]

  # ═══════════════════════════════════════════════════════════════════════════
  # STORY 2.5: ZERO-DEPLOYMENT PATHWAYS (7 ACs, 8 Tests)
  # ═══════════════════════════════════════════════════════════════════════════

  story_2_5_coverage:
    AC-2.5.1_demo_video:
      tests:
        - { id: UT-29, name: "Video player rendering", type: unit }
        - { id: A11Y-08, name: "Video captions", type: accessibility }
      coverage: "2 tests ✓ ADEQUATE"

    AC-2.5.2_screenshot_gallery:
      tests:
        - { id: UT-30, name: "Gallery navigation", type: unit }
      coverage: "1 test ⚠️ MINIMAL - Add keyboard nav test"

    AC-2.5.3_architecture_diagrams:
      tests:
        - { id: UT-31, name: "Diagram rendering", type: unit }
      coverage: "1 test ⚠️ MINIMAL - Add alt text validation"

    AC-2.5.4_partner_tour:
      tests:
        - { id: IT-16, name: "Partner link validation", type: integration }
      coverage: "1 test ⚠️ MINIMAL - Add content verification"

    AC-2.5.5_comparison_table:
      tests:
        - { id: UT-32, name: "Table rendering", type: unit }
        - { id: UT-33, name: "Feature comparison logic", type: unit }
      coverage: "2 tests ✓ ADEQUATE"

    AC-2.5.6_clear_labeling:
      tests:
        - { id: UT-34, name: "Label rendering", type: unit }
      coverage: "1 test ⚠️ MINIMAL - Add comprehension test"

    AC-2.5.7_accessible_media:
      tests:
        - { id: A11Y-08, name: "Media accessibility", type: accessibility }
      coverage: "1 test ✓ ADEQUATE (shared with AC-2.5.1)"

    story_summary:
      total_acs: 7
      total_tests: 10
      coverage_ratio: "1.4 tests/AC"
      status: "⚠️ Needs Improvement"
      gaps: ["Multiple ACs have only 1 test", "Add keyboard/A11Y tests"]

  # ═══════════════════════════════════════════════════════════════════════════
  # STORY 2.6: STATUS VISIBILITY (6 ACs, 8 Tests)
  # ═══════════════════════════════════════════════════════════════════════════

  story_2_6_coverage:
    AC-2.6.1_status_page:
      tests:
        - { id: UT-35, name: "Status page rendering", type: unit }
        - { id: CT-02, name: "Status API contract", type: contract }
      coverage: "2 tests ✓ ADEQUATE"

    AC-2.6.2_deployment_dashboard:
      tests:
        - { id: UT-36, name: "Dashboard components", type: unit }
        - { id: E2E-06, name: "Dashboard user journey", type: e2e }
      coverage: "2 tests ✓ ADEQUATE"

    AC-2.6.3_historical_metrics:
      tests:
        - { id: UT-37, name: "Metrics display", type: unit }
        - { id: IT-17, name: "Metrics accuracy", type: integration }
      coverage: "2 tests ✓ ADEQUATE"

    AC-2.6.4_incident_comms:
      tests:
        - { id: IT-18, name: "Incident notification", type: integration }
      coverage: "1 test ⚠️ MINIMAL - Add PagerDuty integration test"

    AC-2.6.5_uptime_targets:
      tests:
        - { id: CT-03, name: "SLA contract", type: contract }
      coverage: "1 test ✓ ADEQUATE"

    AC-2.6.6_accessible_status:
      tests:
        - { id: UT-38, name: "Status icon semantics", type: unit }
        - { id: CT-04, name: "Status schema", type: contract }
      coverage: "2 tests ✓ ADEQUATE"

    story_summary:
      total_acs: 6
      total_tests: 10
      coverage_ratio: "1.67 tests/AC"
      status: "✓ Adequate Coverage"
      gaps: ["AC-2.6.4 needs integration test"]

  # ═══════════════════════════════════════════════════════════════════════════
  # SECURITY ACCEPTANCE CRITERIA (6 ACs, 5 Tests)
  # ═══════════════════════════════════════════════════════════════════════════

  security_coverage:
    AC-2.7.1_https_only:
      tests:
        - { id: SEC-04, name: "HTTPS enforcement", type: security }
      coverage: "1 test ✓ ADEQUATE"

    AC-2.7.2_xss_prevention:
      tests:
        - { id: SEC-05, name: "XSS scanning", type: security }
      coverage: "1 test ✓ ADEQUATE"

    AC-2.7.3_no_secrets:
      tests:
        - { id: SEC-06, name: "Secret scanning", type: security }
      coverage: "1 test ✓ ADEQUATE"

    AC-2.7.4_csp_headers:
      tests: []
      coverage: "0 tests ❌ GAP - Add CSP header test"

    AC-2.7.5_input_validation:
      tests:
        - { id: SEC-07, name: "Input sanitization", type: security }
      coverage: "1 test ✓ ADEQUATE"

    AC-2.7.6_privacy_compliance:
      tests:
        - { id: SEC-08, name: "GDPR compliance", type: security }
      coverage: "1 test ✓ ADEQUATE"

    story_summary:
      total_acs: 6
      total_tests: 5
      coverage_ratio: "0.83 tests/AC"
      status: "⚠️ Gap Identified"
      gaps: ["AC-2.7.4 CSP headers has NO test coverage"]

  # ═══════════════════════════════════════════════════════════════════════════
  # PERFORMANCE ACCEPTANCE CRITERIA (6 ACs, 4 Tests)
  # ═══════════════════════════════════════════════════════════════════════════

  performance_coverage:
    AC-2.8.1_page_load:
      tests:
        - { id: PERF-01, name: "Lighthouse CI", type: performance }
      coverage: "1 test ✓ ADEQUATE"

    AC-2.8.2_interaction_response:
      tests:
        - { id: PERF-02, name: "INP measurement", type: performance }
      coverage: "1 test ✓ ADEQUATE"

    AC-2.8.3_asset_optimization:
      tests:
        - { id: PERF-03, name: "Bundle size check", type: performance }
      coverage: "1 test ✓ ADEQUATE"

    AC-2.8.4_cdn_caching:
      tests:
        - { id: PERF-04, name: "Cache header validation", type: performance }
      coverage: "1 test ✓ ADEQUATE"

    AC-2.8.5_mobile_performance:
      tests: []
      coverage: "0 tests ❌ GAP - Add mobile perf test"

    AC-2.8.6_core_web_vitals:
      tests:
        - { id: PERF-01, name: "Lighthouse CI", type: performance }
      coverage: "1 test ✓ (shared with AC-2.8.1)"

    story_summary:
      total_acs: 6
      total_tests: 4
      coverage_ratio: "0.67 tests/AC"
      status: "⚠️ Gap Identified"
      gaps: ["AC-2.8.5 mobile performance has NO dedicated test"]

  # ═══════════════════════════════════════════════════════════════════════════
  # COVERAGE SUMMARY
  # ═══════════════════════════════════════════════════════════════════════════

  coverageSummary:
    totalAcceptanceCriteria: 53
    totalTestsMapped: 77
    averageTestsPerAC: 1.45

    coverageByCategory:
      excellentCoverage_3plus:
        count: 12
        percentage: "22.6%"
        criteria: [AC-2.1.1, AC-2.2.1, AC-2.2.4, AC-2.2.5, AC-2.3.1, AC-2.3.3, AC-2.4.1]

      goodCoverage_2:
        count: 24
        percentage: "45.3%"

      minimalCoverage_1:
        count: 14
        percentage: "26.4%"
        criteria: [AC-2.1.3, AC-2.1.7, AC-2.3.4, AC-2.3.5, AC-2.4.7, AC-2.5.2, AC-2.5.3, AC-2.5.4, AC-2.5.6, AC-2.6.4]

      noCoverage_0:
        count: 3
        percentage: "5.7%"
        criteria: [AC-2.7.4, AC-2.8.5]
        status: "❌ CRITICAL GAPS"

    gapAnalysis:
      criticalGaps:
        - ac: "AC-2.7.4"
          description: "CSP Headers"
          risk: "Security vulnerability if CSP not configured"
          recommendation: "Add SEC-09: CSP header validation test"
          effort: "0.25 days"

        - ac: "AC-2.8.5"
          description: "Mobile Performance"
          risk: "Poor mobile experience undetected"
          recommendation: "Add PERF-05: Mobile Lighthouse test"
          effort: "0.25 days"

      significantGaps:
        - ac: "AC-2.1.7"
          description: "Works without JavaScript"
          recommendation: "Add E2E-07: No-JS browser test"
          effort: "0.5 days"

        - ac: "AC-2.5.2"
          description: "Screenshot Gallery"
          recommendation: "Add A11Y-09: Gallery keyboard nav test"
          effort: "0.25 days"

        - ac: "AC-2.5.3"
          description: "Architecture Diagrams"
          recommendation: "Add A11Y-10: Diagram alt text test"
          effort: "0.25 days"

        - ac: "AC-2.6.4"
          description: "Incident Communications"
          recommendation: "Add IT-19: PagerDuty webhook test"
          effort: "0.5 days"

    recommendedNewTests:
      - { id: SEC-09, name: "CSP header validation", ac: "AC-2.7.4", effort: "0.25d" }
      - { id: PERF-05, name: "Mobile Lighthouse", ac: "AC-2.8.5", effort: "0.25d" }
      - { id: E2E-07, name: "No-JS browser test", ac: "AC-2.1.7", effort: "0.5d" }
      - { id: A11Y-09, name: "Gallery keyboard nav", ac: "AC-2.5.2", effort: "0.25d" }
      - { id: A11Y-10, name: "Diagram alt text", ac: "AC-2.5.3", effort: "0.25d" }
      - { id: IT-19, name: "PagerDuty webhook", ac: "AC-2.6.4", effort: "0.5d" }
      - { id: UT-39, name: "Quick Create URL structure", ac: "AC-2.1.3", effort: "0.25d" }
      - { id: A11Y-11, name: "Comparison table A11Y", ac: "AC-2.3.4", effort: "0.25d" }

      totalNewTests: 8
      totalEffort: "2.5 days"

    updatedTestMetrics:
      original: { tests: 77, effort: "7.5 days" }
      withGapFixes: { tests: 85, effort: "10 days" }
      coverageImprovement: "5.7% → 0% critical gaps"

    visualCoverageHeatmap: |
      Story Coverage Heatmap (tests/AC):
      ═══════════════════════════════════════════════════════════
      Story 2.1 (Deployment)    ████████████████████░░░░ 2.25 ✓
      Story 2.2 (Progress)      █████████████████████████ 2.50 ✓✓
      Story 2.3 (Cost)          ████████████████░░░░░░░░ 2.00 ✓
      Story 2.4 (Cleanup)       ████████████████░░░░░░░░ 2.00 ✓
      Story 2.5 (Zero-Deploy)   ██████████░░░░░░░░░░░░░░ 1.40 ⚠️
      Story 2.6 (Status)        █████████████████░░░░░░░ 1.67 ✓
      Security ACs              ██████░░░░░░░░░░░░░░░░░░ 0.83 ⚠️
      Performance ACs           █████░░░░░░░░░░░░░░░░░░░ 0.67 ⚠️
      ═══════════════════════════════════════════════════════════
      Target: ████████████████████ 2.0+ tests/AC
```

| Metric | Value | Status |
|--------|-------|--------|
| **ACs with 0 tests** | 3 (5.7%) | ❌ Critical |
| **ACs with 1 test** | 14 (26.4%) | ⚠️ At Risk |
| **ACs with 2+ tests** | 36 (67.9%) | ✓ Good |
| **Recommended new tests** | 8 | 2.5 days effort |

**Investment Summary:**
- Current: 77 tests, 7.5 days, 94.3% AC coverage
- After gap fixes: 85 tests, 10 days, **100% AC coverage**
- Coverage improvement cost: 2.5 days (+33% effort for +5.7% coverage)

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-28 | Tech Spec Workflow | Initial generation |

**Status:** DRAFT - Pending Review

**Next Steps:**
1. Review with development team
2. Validate effort estimates
3. Confirm open questions (OQ-01 through OQ-07)
4. Update sprint status upon approval
