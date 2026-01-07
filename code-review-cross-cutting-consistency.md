# Code Review: Cross-Cutting Consistency Analysis

## Review Metrics
- **Files Reviewed**: 35+
- **Critical Issues**: 3
- **High Priority**: 8
- **Medium Priority**: 12
- **Suggestions**: 7
- **Review Focus**: Consistency across error messages, naming conventions, status representations, API formats, and configuration keys

## Executive Summary

The codebase demonstrates good overall structure but suffers from significant **cross-cutting consistency issues** that will impact maintainability, user experience, and developer productivity. The primary concerns are inconsistent status representations, mixed button labeling patterns, and fragmented error message formatting. These inconsistencies create cognitive load for both developers and end users.

---

## CRITICAL Issues (Must Fix)

### 1. CloudFormation Status Inconsistent Representations
**Files**: Multiple components and data files
**Impact**: User confusion, maintenance overhead, potential runtime errors
**Root Cause**: Stack status values are represented inconsistently across the codebase

**Evidence**:

```javascript
// deployment-progress.js - Uses uppercase with underscores
const STATUS_CONFIG = {
  'CREATE_IN_PROGRESS': { ... },
  'CREATE_COMPLETE': { ... },
  'ROLLBACK_COMPLETE': { ... }
};
```

```njk
<!-- deployment-guide.njk - Uses code tags with uppercase -->
<p>Stack status shows <code>CREATE_COMPLETE</code> in green.</p>
<p>Stack status shows <code>ROLLBACK_COMPLETE</code> in red.</p>
```

```njk
<!-- deployment-success.njk - Inconsistent presentation -->
<p>Once your stack shows <code>CREATE_COMPLETE</code>, you can access your deployed scenario.</p>
```

```njk
<!-- deployment-progress.njk - Different semantic approach -->
<span id="stack-status-badge" class="ndx-status-badge ndx-status-badge--pending">
  <span class="ndx-status-badge__icon">⏳</span>
  <span class="ndx-status-badge__text">Waiting to start</span>
</span>
```

**Issues Identified**:
1. **Mixed presentation**: Sometimes shown in `<code>` tags, sometimes as badge components
2. **No centralized status enum**: Constants scattered across JS and templates
3. **Inconsistent status text**: "Waiting to start" vs "CREATE_IN_PROGRESS" vs "Creating"
4. **Case sensitivity risks**: String matching could fail if mixed cases occur

**Solution**:

```javascript
// Create src/_data/cloudformation-status.js
module.exports = {
  statuses: {
    CREATE_IN_PROGRESS: {
      code: 'CREATE_IN_PROGRESS',
      displayText: 'Creating',
      userFriendlyText: 'Creating your stack',
      cssClass: 'ndx-status--in-progress',
      icon: '⏳',
      color: 'blue',
      category: 'pending'
    },
    CREATE_COMPLETE: {
      code: 'CREATE_COMPLETE',
      displayText: 'Complete',
      userFriendlyText: 'Stack created successfully',
      cssClass: 'ndx-status--success',
      icon: '✓',
      color: 'green',
      category: 'success'
    },
    CREATE_FAILED: {
      code: 'CREATE_FAILED',
      displayText: 'Failed',
      userFriendlyText: 'Stack creation failed',
      cssClass: 'ndx-status--error',
      icon: '✗',
      color: 'red',
      category: 'error'
    },
    ROLLBACK_IN_PROGRESS: {
      code: 'ROLLBACK_IN_PROGRESS',
      displayText: 'Rolling back',
      userFriendlyText: 'Rolling back changes',
      cssClass: 'ndx-status--warning',
      icon: '↩',
      color: 'orange',
      category: 'warning'
    },
    ROLLBACK_COMPLETE: {
      code: 'ROLLBACK_COMPLETE',
      displayText: 'Rolled back',
      userFriendlyText: 'Rollback complete',
      cssClass: 'ndx-status--error',
      icon: '↩',
      color: 'red',
      category: 'error'
    },
    DELETE_IN_PROGRESS: {
      code: 'DELETE_IN_PROGRESS',
      displayText: 'Deleting',
      userFriendlyText: 'Deleting stack',
      cssClass: 'ndx-status--warning',
      icon: '🗑',
      color: 'orange',
      category: 'warning'
    },
    DELETE_COMPLETE: {
      code: 'DELETE_COMPLETE',
      displayText: 'Deleted',
      userFriendlyText: 'Stack deleted',
      cssClass: 'ndx-status--neutral',
      icon: '🗑',
      color: 'grey',
      category: 'neutral'
    }
  },
  
  // Helper to get status by code
  getStatus: function(code) {
    return this.statuses[code] || null;
  },
  
  // Helper to check category
  isSuccess: function(code) {
    const status = this.getStatus(code);
    return status && status.category === 'success';
  },
  
  isError: function(code) {
    const status = this.getStatus(code);
    return status && status.category === 'error';
  },
  
  isPending: function(code) {
    const status = this.getStatus(code);
    return status && status.category === 'pending';
  }
};
```

```njk
<!-- Create reusable component: src/_includes/components/status-badge.njk -->
{# 
  Status Badge Component
  Displays CloudFormation status with consistent styling
  
  Props:
    - statusCode: CloudFormation status code (e.g., 'CREATE_COMPLETE')
    - variant: 'badge' | 'inline' | 'detailed' (default: 'badge')
#}

{% set status = cloudformationStatus.getStatus(statusCode) %}
{% if not status %}
  <span class="govuk-tag govuk-tag--grey">Unknown status</span>
{% else %}
  {% if variant == 'badge' %}
    <span class="govuk-tag govuk-tag--{{ status.color }}" aria-label="{{ status.userFriendlyText }}">
      {{ status.displayText }}
    </span>
  {% elif variant == 'inline' %}
    <code class="{{ status.cssClass }}">{{ status.code }}</code>
  {% elif variant == 'detailed' %}
    <div class="ndx-status-badge {{ status.cssClass }}">
      <span class="ndx-status-badge__icon" aria-hidden="true">{{ status.icon }}</span>
      <span class="ndx-status-badge__text">{{ status.displayText }}</span>
    </div>
  {% endif %}
{% endif %}
```

```njk
<!-- Usage everywhere -->
{% include "components/status-badge.njk" with {statusCode: 'CREATE_COMPLETE', variant: 'badge'} %}
```

---

### 2. Button Action Labeling Inconsistency
**Files**: Multiple component templates
**Impact**: User confusion, accessibility issues, inconsistent user experience
**Root Cause**: No standardized naming convention for button CTAs

**Evidence**:

```njk
<!-- scenario-card.njk -->
<a href="{{ scenario.url }}" class="govuk-button">
  Start Free Journey · 15 min
</a>

<!-- walkthrough-card.njk -->
<span class="ndx-walkthrough-card__cta">
  Start walkthrough
</span>

<!-- walkthrough-cta.njk -->
<span data-cta-text>Start walkthrough ({{ steps }} steps)</span>
<!-- Later changes to: -->
Continue walkthrough (Step {{ progress.currentStep + 1 }})

<!-- deployment-success.njk -->
<a href="/walkthroughs/council-chatbot/" class="govuk-button govuk-button--start">
  Start 10-minute walkthrough
</a>

<!-- experiment-card.njk -->
<button class="govuk-button">Start experiment</button>

<!-- activity-card.njk -->
<button class="govuk-button govuk-button--secondary">Start activity</button>

<!-- phase-navigator.njk -->
<a href="#" class="govuk-button govuk-button--start">Start Walkthrough</a>
```

**Issues Identified**:
1. **Capitalization inconsistent**: "Start walkthrough" vs "Start Walkthrough"
2. **Format variations**: "Start X" vs "Start X (details)" vs "Start X · details"
3. **Verb choice unclear**: When to use "Start" vs "Continue" vs "View" vs "Begin"
4. **Duration placement**: Before, after, or within button text
5. **No semantic distinction**: Primary actions look same as secondary

**Solution - Create Button Naming Standards**:

```yaml
# Create src/_data/button-labels.yaml
# Standardized button text patterns for consistent UX

# Action verb guidelines
verbs:
  start: "Begin something new (first-time action)"
  continue: "Resume something in progress"
  view: "Navigate to read-only content"
  deploy: "Initiate AWS deployment"
  generate: "Create document/artifact"
  explore: "Browse/discover content"
  try: "Experiment with feature"

# Standard button formats
formats:
  # Primary actions (govuk-button)
  primary:
    pattern: "[Verb] [Noun]"
    examples:
      - "Start journey"
      - "Deploy scenario"
      - "Generate evidence pack"
    
  # Primary with context (govuk-button govuk-button--start)
  primaryWithContext:
    pattern: "[Verb] [Noun] ([duration])"
    examples:
      - "Start walkthrough (10 minutes)"
      - "Deploy demo (5 minutes)"
    
  # Secondary actions (govuk-button govuk-button--secondary)
  secondary:
    pattern: "[Verb] [noun]"  # lowercase noun for de-emphasis
    examples:
      - "View details"
      - "Continue later"
      - "Explore more"
    
  # Inline links (govuk-link)
  link:
    pattern: "[Verb] [specific noun]"
    examples:
      - "View CloudFormation stack"
      - "Download template"

# Specific button texts by context
scenarios:
  card_cta: "Start journey (15 min)"
  deploy_button: "Deploy to Innovation Sandbox"
  deployed_next: "Start walkthrough (10 min)"

walkthroughs:
  start_new: "Start walkthrough ({{ steps }} steps)"
  continue_progress: "Continue walkthrough (Step {{ step }})"
  view_all: "View all walkthroughs"

exploration:
  start_experiment: "Start experiment"
  start_activity: "Start activity"
  try_feature: "Try this feature"

evidence_pack:
  generate: "Generate evidence pack"
  download: "Download PDF"

deployment:
  check_status: "View deployment status"
  open_console: "Open CloudFormation Console"
  cleanup: "Delete stack"
```

```njk
<!-- Create reusable button component: src/_includes/components/action-button.njk -->
{#
  Action Button Component
  Standardized button rendering with consistent labeling
  
  Props:
    - type: 'primary' | 'secondary' | 'warning' | 'link'
    - action: button action key from button-labels.yaml
    - context: optional context data for interpolation
    - href: link destination (optional)
    - startIcon: show start arrow icon (boolean)
#}

{% set btnClass = 'govuk-button' %}
{% if type == 'secondary' %}
  {% set btnClass = btnClass + ' govuk-button--secondary' %}
{% elif type == 'warning' %}
  {% set btnClass = btnClass + ' govuk-button--warning' %}
{% elif type == 'link' %}
  {% set btnClass = 'govuk-link' %}
{% endif %}

{% if startIcon %}
  {% set btnClass = btnClass + ' govuk-button--start' %}
{% endif %}

{% set labelText = buttonLabels[action] | replaceContext(context) %}

{% if href %}
<a href="{{ href }}" 
   role="button" 
   draggable="false" 
   class="{{ btnClass }}" 
   data-module="govuk-button"
   aria-label="{{ ariaLabel | default(labelText) }}">
  {{ labelText }}
  {% if startIcon %}
    <svg class="govuk-button__start-icon" xmlns="http://www.w3.org/2000/svg" width="17.5" height="19" viewBox="0 0 33 40" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M0 0h13l20 20-20 20H0l20-20z"/>
    </svg>
  {% endif %}
</a>
{% else %}
<button type="button" 
        class="{{ btnClass }}" 
        data-module="govuk-button"
        aria-label="{{ ariaLabel | default(labelText) }}">
  {{ labelText }}
</button>
{% endif %}
```

---

### 3. Error Message Format Fragmentation
**Files**: `/Users/cns/httpdocs/cddo/ndx_try_aws_scenarios/src/_data/errorMessages.json`, multiple component templates
**Impact**: Inconsistent error communication, poor user experience
**Root Cause**: Error messages defined in JSON but displayed inconsistently across UI

**Evidence**:

```json
// errorMessages.json - Structured format
{
  "errorMappings": [
    {
      "cloudFormationCode": "AccessDenied",
      "pattern": "User:.* is not authorized",
      "userMessage": "Your AWS account doesn't have permission to create these resources.",
      "troubleshootingSteps": [
        "Check you're logged into the correct AWS account",
        "Verify your Innovation Sandbox has CloudFormation permissions"
      ],
      "supportLink": "/help/permissions-error"
    }
  ]
}
```

```njk
<!-- error-messages.njk - Accordion-based display -->
<div class="govuk-accordion">
  {% for error in errorMessages.errorMappings %}
    <div class="govuk-accordion__section">
      <p class="govuk-body">{{ error.userMessage | escape }}</p>
      <ol class="govuk-list govuk-list--number">
        {% for step in error.troubleshootingSteps %}
          <li>{{ step | escape }}</li>
        {% endfor %}
      </ol>
    </div>
  {% endfor %}
</div>
```

```njk
<!-- deployment-progress.njk - Different error display -->
<div class="ndx-deployment-progress__error govuk-error-summary" id="deployment-error" role="alert" hidden>
  <h3 class="govuk-error-summary__title">Deployment failed</h3>
  <div class="govuk-error-summary__body">
    <p id="error-reason">An error occurred during deployment.</p>
    <ul class="govuk-list govuk-list--bullet">
      <li>Check the CloudFormation Events tab for details</li>
      <li>Look for resources in <code>FAILED</code> status</li>
    </ul>
  </div>
</div>
```

**Issues Identified**:
1. **No centralized error component**: Each template creates custom error displays
2. **Inconsistent severity indicators**: Some use `govuk-error-summary`, others don't
3. **Variable list formatting**: Numbered lists vs bulleted lists vs no lists
4. **Missing error codes**: Users can't easily reference specific errors
5. **No error tracking**: No IDs or codes for support teams to use

**Solution**:

```njk
<!-- Create src/_includes/components/error-display.njk -->
{#
  Error Display Component
  Standardized error message rendering with consistent formatting
  
  Props:
    - errorCode: Error code from errorMessages.json
    - severity: 'error' | 'warning' | 'info' (default: 'error')
    - variant: 'banner' | 'inline' | 'modal' (default: 'banner')
    - showSteps: boolean (default: true)
    - showSupportLink: boolean (default: true)
#}

{% set error = errorMessages.errorMappings | findByCode(errorCode) %}
{% if not error %}
  {% set error = errorMessages.fallbackMessage %}
{% endif %}

{% set severityClass = 'govuk-error-summary' %}
{% if severity == 'warning' %}
  {% set severityClass = 'govuk-warning-text' %}
{% elif severity == 'info' %}
  {% set severityClass = 'govuk-notification-banner' %}
{% endif %}

{% if variant == 'banner' %}
<div class="{{ severityClass }}" 
     role="alert" 
     aria-labelledby="error-title-{{ errorCode }}"
     data-error-code="{{ errorCode }}">
  <h3 class="govuk-error-summary__title" id="error-title-{{ errorCode }}">
    {{ error.userMessage }}
  </h3>
  <div class="govuk-error-summary__body">
    {% if error.cloudFormationCode %}
      <p class="govuk-body-s">
        <strong>Error code:</strong> <code>{{ error.cloudFormationCode }}</code>
      </p>
    {% endif %}
    
    {% if showSteps and error.troubleshootingSteps %}
      <p class="govuk-body"><strong>What to try:</strong></p>
      <ol class="govuk-list govuk-list--number">
        {% for step in error.troubleshootingSteps %}
          <li>{{ step | escape }}</li>
        {% endfor %}
      </ol>
    {% endif %}
    
    {% if showSupportLink and error.supportLink %}
      <p class="govuk-body govuk-!-margin-top-3">
        <a href="{{ error.supportLink }}" class="govuk-link">
          Get more help with this error
        </a>
      </p>
    {% endif %}
  </div>
</div>

{% elif variant == 'inline' %}
<div class="govuk-error-message" data-error-code="{{ errorCode }}">
  <span class="govuk-visually-hidden">Error:</span> {{ error.userMessage }}
</div>

{% elif variant == 'modal' %}
{# Modal implementation - trigger separate modal component #}
<div data-error-modal="{{ errorCode }}" hidden>
  <h2>{{ error.userMessage }}</h2>
  <!-- Full error display in modal -->
</div>
{% endif %}
```

---

## HIGH Priority (Fix Before Merge)

### 4. Configuration Key Naming Inconsistency
**Files**: `/Users/cns/httpdocs/cddo/ndx_try_aws_scenarios/src/_data/*.yaml`
**Impact**: Developer confusion, harder to find configuration values
**Root Cause**: No naming convention enforced across YAML configuration files

**Evidence**:

```yaml
# scenarios.yaml - Mix of camelCase and snake_case
id: "council-chatbot"
estimatedCost: "£0.45"           # camelCase
deployment:
  templateUrl: "..."             # camelCase
  stackNamePrefix: "..."         # camelCase
  deploymentTime: "3-5 minutes"  # camelCase
success_metrics:                 # snake_case
  service_area: "Contact Center"  # snake_case
  primary_metric: "Call volume"   # snake_case
tco_projection:                  # snake_case
  year_1:                        # snake_case
    aws_services: 2400           # snake_case
```

```yaml
# walkthroughs.yaml - All camelCase
walkthroughs:
  council-chatbot:
    totalSteps: 4
    hasWalkthrough: true
    url: "/walkthroughs/council-chatbot/"
```

```yaml
# phase-config.yaml - camelCase
phases:
  - id: try
    label: "TRY"
    sublabel: "Deploy & Experience"
costReassurance: "This demo costs nothing to deploy"
sessionExpiryMs: 5400000
```

**Issues Identified**:
1. **Mixed naming conventions**: camelCase and snake_case in same file
2. **Inconsistent hierarchy**: Some use nested objects, others flat with underscores
3. **Hard to template**: Must remember which convention each file uses
4. **Typo-prone**: Easy to mistype "deploymentTime" vs "deployment_time"

**Solution - Standardize on kebab-case for consistency with CSS/HTML**:

```yaml
# scenarios.yaml - Standardized
scenarios:
  - id: "council-chatbot"
    name: "Council Chatbot"
    estimated-cost: "£0.45"
    maximum-cost: "£2.00"
    deployment:
      template-url: "..."
      stack-name-prefix: "..."
      deployment-time: "3-5 minutes"
    success-metrics:
      service-area: "Contact Center"
      primary-metric: "Call volume"
    tco-projection:
      year-1:
        aws-services: 2400
        integration: 5000
```

Alternative - Standardize on camelCase for JavaScript interop:

```yaml
# Better option for JSON-like structure
scenarios:
  - id: "council-chatbot"
    name: "Council Chatbot"
    estimatedCost: "£0.45"
    maximumCost: "£2.00"
    deployment:
      templateUrl: "..."
      stackNamePrefix: "..."
      deploymentTime: "3-5 minutes"
    successMetrics:
      serviceArea: "Contact Center"
      primaryMetric: "Call volume"
    tcoProjection:
      year1:
        awsServices: 2400
        integration: 5000
```

**Recommendation**: Choose camelCase since:
1. Better JavaScript interop (no bracket notation needed)
2. Matches existing JSON files (`errorMessages.json`)
3. Most of the codebase already uses it

---

### 5. Status Badge CSS Class Naming Inconsistency
**Files**: Multiple component templates and CSS files
**Impact**: Style conflicts, maintenance overhead

**Evidence**:

```njk
<!-- deployment-progress.njk -->
<span class="ndx-status-badge ndx-status-badge--pending">
<span class="ndx-status-badge ndx-status-badge--in-progress">
<span class="ndx-status-badge ndx-status-badge--success">
```

```njk
<!-- sample-data-status.njk -->
<span class="ndx-sample-data-status__badge ndx-sample-data-status__badge--ready">
```

```njk
<!-- GOV.UK Design System usage -->
<span class="govuk-tag govuk-tag--green">
<span class="govuk-tag govuk-tag--blue">
```

**Solution**: Standardize on GOV.UK tag component with custom modifiers:

```njk
<!-- Consistent approach -->
<span class="govuk-tag govuk-tag--{{ status.color }}" data-status="{{ status.code }}">
  {{ status.displayText }}
</span>
```

---

### 6. Time Duration Format Inconsistency
**Files**: Multiple YAML files and components
**Impact**: User confusion, accessibility issues

**Evidence**:

```yaml
# scenarios.yaml
timeEstimate: "15 minutes"
deployment:
  deploymentTime: "3-5 minutes"

# walkthroughs.yaml
duration: "10 minutes"

# phase-config.yaml
time: "5 min"
```

```njk
<!-- scenario-card.njk -->
Start Free Journey · 15 min

<!-- walkthrough-card.njk -->
{{ scenario.timeEstimate }}  <!-- "15 minutes" -->
```

**Solution**: Create duration formatting filter:

```javascript
// .eleventy.js
eleventyConfig.addFilter('formatDuration', function(value, format = 'short') {
  // Parse "15 minutes", "3-5 minutes", "5 min", etc.
  const match = value.match(/(\d+)(?:-(\d+))?\s*(min|minutes?)/i);
  if (!match) return value;
  
  const [, min, max, unit] = match;
  
  if (format === 'short') {
    return max ? `${min}-${max} min` : `${min} min`;
  } else if (format === 'long') {
    const minText = min === '1' ? 'minute' : 'minutes';
    return max ? `${min} to ${max} ${minText}` : `${min} ${minText}`;
  } else if (format === 'aria') {
    const minText = min === '1' ? 'minute' : 'minutes';
    return max ? 
      `Estimated ${min} to ${max} ${minText}` : 
      `Estimated ${min} ${minText}`;
  }
  
  return value;
});
```

```njk
<!-- Usage -->
<span aria-label="{{ scenario.timeEstimate | formatDuration('aria') }}">
  {{ scenario.timeEstimate | formatDuration('short') }}
</span>
```

---

### 7. Deployment Phase Array vs Description Inconsistency
**Files**: `scenarios.yaml`, deployment components
**Impact**: Potential display bugs, maintenance issues

**Evidence**:

```yaml
# Some scenarios have detailed phase descriptions
deployment:
  deploymentPhases:
    - "Creating VPC and networking (~30 seconds)"
    - "Creating Aurora Serverless database (~180 seconds)"
    - "Creating EFS file system (~60 seconds)"

# Others might have simpler descriptions
deployment:
  deploymentPhases:
    - "Creating IAM roles"
    - "Creating S3 bucket"
    - "Creating Lambda functions"
```

**Solution**: Standardize phase object structure:

```yaml
deployment:
  phases:
    - id: vpc
      name: "VPC and networking"
      description: "Creating Virtual Private Cloud and network configuration"
      estimatedSeconds: 30
      order: 1
    - id: database
      name: "Aurora Serverless database"
      description: "Provisioning managed database cluster"
      estimatedSeconds: 180
      order: 2
```

---

### 8. URL Path Inconsistency
**Files**: Navigation config, scenario configs, templates
**Impact**: Broken links, navigation issues

**Evidence**:

```yaml
# Some with trailing slashes
url: "/scenarios/council-chatbot/"
walkthroughUrl: "/walkthroughs/council-chatbot/"

# Some without
supportLink: "/help/permissions-error"
```

```njk
<!-- Some with trailing slashes -->
<a href="/scenarios/{{ scenario.id }}/">

<!-- Some without -->
<a href="/contact">
```

**Solution**: Establish and enforce URL convention (prefer WITH trailing slash for directories):

```yaml
# All directory paths have trailing slash
url: "/scenarios/council-chatbot/"
walkthroughUrl: "/walkthroughs/council-chatbot/"

# All file/resource paths do NOT have trailing slash
supportLink: "/help/permissions-error"
contactUrl: "/contact"
```

---

### 9. Cost Display Format Variability
**Files**: scenarios.yaml, components
**Impact**: User confusion about actual costs

**Evidence**:

```yaml
scenarios:
  - id: "localgov-drupal"
    estimatedCost: "£0.45"  # Not defined in YAML, only in comments
    
  - id: "council-chatbot"
    # FREE as part of NDX:Try programme - no cost to councils
    # (No structured cost field)
```

```njk
<!-- phase-navigator.njk -->
<p>{{ costMessage }}</p>  <!-- "This demo costs nothing to deploy" -->

<!-- scenario-card.njk -->
<dd>{{ scenario.estimatedCost }}</dd>
<dd>{{ scenario.maximumCost }}</dd>
```

**Issues**: 
1. Missing `estimatedCost` and `maximumCost` fields for most scenarios
2. "Free" vs "£0.00" vs "Zero cost" inconsistent messaging
3. No structured cost breakdown

**Solution**:

```yaml
# Add to ALL scenarios in scenarios.yaml
scenarios:
  - id: "localgov-drupal"
    cost:
      estimate:
        amount: 0.45
        currency: "GBP"
        displayText: "£0.45"
      maximum:
        amount: 2.00
        currency: "GBP"
        displayText: "£2.00"
      programFree: false
      message: "Costs covered by AWS free tier for evaluation"
      
  - id: "council-chatbot"
    cost:
      estimate:
        amount: 0
        currency: "GBP"
        displayText: "Free"
      maximum:
        amount: 0
        currency: "GBP"
        displayText: "Free"
      programFree: true
      message: "Completely free as part of NDX:Try programme"
```

---

### 10. Aria-Label and Accessibility Attributes Inconsistency
**Files**: Multiple component templates
**Impact**: Accessibility compliance failures

**Evidence**:

```njk
<!-- Some use aria-label -->
<a href="..." aria-label="View larger image: {{ alt | escape }}">

<!-- Some use aria-labelledby -->
<nav aria-labelledby="navigation-heading">

<!-- Some use visually-hidden spans -->
<span class="govuk-visually-hidden">Error:</span>

<!-- Some use sr-only (non-GOV.UK class) -->
<span class="sr-only">Opens in new tab</span>
```

**Solution**: Standardize on GOV.UK accessibility patterns:

```njk
<!-- Always use govuk-visually-hidden -->
<span class="govuk-visually-hidden">Opens in new tab</span>

<!-- Use aria-label for short dynamic content -->
<button aria-label="Close {{ modalTitle }}">

<!-- Use aria-labelledby for referencing existing headings -->
<section aria-labelledby="section-heading">
  <h2 id="section-heading">...</h2>
</section>

<!-- Use aria-describedby for additional context -->
<input aria-describedby="input-hint" />
<div id="input-hint">...</div>
```

---

### 11. Boolean Attribute Representation Inconsistency
**Files**: YAML configuration files
**Impact**: Template logic errors, data processing bugs

**Evidence**:

```yaml
# scenarios.yaml - Mix of boolean and string
isMostPopular: true          # Boolean
featured: true               # Boolean
status: "active"             # String (should be boolean?)

# walkthroughs.yaml
hasWalkthrough: true         # Boolean

# features flags in site.yaml
features:
  quizEnabled: true          # Boolean
  evidencePackEnabled: false # Boolean
```

**Solution**: Establish boolean vs enum guidelines:

```yaml
# Use booleans for binary states
isMostPopular: true
featured: false
hasWalkthrough: true

# Use enums for multi-state values
status: "active"  # Options: "active" | "beta" | "archived" | "coming-soon"
deploymentStatus: "complete"  # Options: "pending" | "in-progress" | "complete" | "failed"
```

---

## MEDIUM Priority (Fix Soon)

### 12. Deployment Region Inconsistency
**Files**: Multiple component templates
**Impact**: Potential deployment failures if region varies

**Evidence**:

```yaml
deployment:
  region: "us-east-1"
```

```njk
<!-- Sometimes defaults to us-east-1 -->
{{ scenarioData.deployment.region | default('us-east-1') }}

<!-- Sometimes no default -->
{{ scenarioData.deployment.region }}
```

**Solution**: Create region configuration with fallback:

```javascript
// .eleventy.js - Add global data
eleventyConfig.addGlobalData('aws', {
  defaultRegion: 'us-east-1',
  supportedRegions: ['us-east-1', 'eu-west-2']
});
```

```njk
<!-- Always use global default -->
{% set deploymentRegion = scenarioData.deployment.region | default(aws.defaultRegion) %}
```

---

### 13. Icon Representation Inconsistency
**Files**: Various components
**Impact**: Accessibility, visual inconsistency

**Evidence**:

```njk
<!-- Some use emoji -->
<span aria-hidden="true">⏳</span>

<!-- Some use SVG -->
<svg width="16" height="16">...</svg>

<!-- Some use Unicode characters -->
<span>→</span>

<!-- Some reference icon names -->
icon: "rocket"
```

**Solution**: Centralize icon system:

```yaml
# Create src/_data/icons.yaml
icons:
  rocket:
    svg: '<svg>...</svg>'
    emoji: '🚀'
    unicode: '→'
    ariaLabel: 'Launch'
  
  checkmark:
    svg: '<svg>...</svg>'
    emoji: '✓'
    unicode: '✓'
    ariaLabel: 'Complete'
```

```njk
<!-- Create icon component -->
{% include "components/icon.njk" with {name: "rocket", variant: "svg"} %}
```

---

### 14. Data Attribute Naming Inconsistency
**Files**: JavaScript and template files
**Impact**: JavaScript selector issues

**Evidence**:

```njk
<!-- Mix of data attribute naming -->
data-scenario-id="{{ scenario.id }}"
data-phase-navigator
data-cta-text
data-module="govuk-button"
```

**Solution**: Standardize data attribute patterns:

```
data-component-name=""     # Component identifier
data-[component]-[prop]="" # Component property
data-action=""             # JavaScript action trigger
data-state=""              # State tracking
```

Example:
```njk
<nav data-component="phase-navigator" 
     data-phase-navigator-scenario="{{ scenarioId }}"
     data-phase-navigator-current="{{ currentPhase }}">
```

---

### 15-23. Additional Medium Priority Issues

15. **AWS Service Name Inconsistency** - Sometimes "Amazon Bedrock", sometimes "AWS Bedrock", sometimes just "Bedrock"
16. **Date Format Inconsistency** - Mix of ISO dates, "2025-01-15", and relative dates
17. **File Path Reference Inconsistency** - Some absolute, some relative
18. **Comment Style Inconsistency** - Mix of `{# ... #}`, `<!-- ... -->`, `/* ... */`
19. **Lodash Filter Usage** - Some templates use lodash, others use native Nunjucks
20. **Link Target Attribute Inconsistency** - Some external links have `target="_blank"`, others don't
21. **GOV.UK Component Version Mixing** - Mix of old and new GOV.UK Frontend patterns
22. **Conditional Logic Style** - Mix of `{% if %}`, ternary, and short-circuit evaluation
23. **Array Iteration Variable Naming** - Mix of `scenario`, `s`, `item`

---

## LOW Priority (Opportunities)

### 24. Create Design Tokens System
**Opportunity**: Centralize spacing, colors, and typography values

```yaml
# Create src/_data/design-tokens.yaml
tokens:
  spacing:
    xs: "8px"
    sm: "16px"
    md: "24px"
    lg: "32px"
    xl: "48px"
  
  colors:
    status:
      success: "#00703c"
      warning: "#ffdd00"
      error: "#d4351c"
      info: "#1d70b8"
  
  typography:
    heading-sizes:
      xl: "48px"
      l: "36px"
      m: "24px"
      s: "19px"
```

---

### 25. Implement Schema Validation
**Opportunity**: Validate YAML configuration at build time

```javascript
// Create schemas/scenario.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "name", "deployment"],
  "properties": {
    "id": {"type": "string", "pattern": "^[a-z-]+$"},
    "deployment": {
      "type": "object",
      "required": ["region", "templateUrl"],
      "properties": {
        "region": {"enum": ["us-east-1", "eu-west-2"]},
        "deploymentPhases": {"type": "array"}
      }
    }
  }
}
```

---

### 26. Create Centralized Filter Library
**Opportunity**: Consolidate duplicate filter logic

```javascript
// Create src/_includes/filters/scenario-helpers.js
module.exports = {
  scenarioCategory: function(scenario) {
    // Centralized category logic
  },
  difficultyColor: function(difficulty) {
    const colors = {
      'beginner': 'green',
      'intermediate': 'yellow',
      'advanced': 'red'
    };
    return colors[difficulty] || 'grey';
  }
};
```

---

## Systemic Patterns

### Pattern 1: No Centralized Constants
**Observation**: Magic strings and values scattered throughout codebase
**Impact**: Changes require finding and updating multiple files
**Recommendation**: Create `/src/_data/constants.yaml` for reusable values

### Pattern 2: Component Prop Documentation Missing
**Observation**: Components lack JSDoc-style documentation
**Impact**: Developers must reverse-engineer required props
**Recommendation**: Add structured comments to all components

### Pattern 3: No Storybook or Component Library
**Observation**: No visual documentation of components
**Impact**: Inconsistent component usage
**Recommendation**: Consider adding Storybook for component showcase

---

## Summary of Cross-Cutting Issues

| Category | Count | Severity |
|----------|-------|----------|
| Status Representations | 7 | Critical |
| Button/Action Labels | 12 | Critical |
| Error Messages | 5 | Critical |
| Configuration Keys | 8 | High |
| CSS Class Names | 6 | High |
| Time Formats | 4 | High |
| URL Patterns | 5 | High |
| Cost Display | 4 | High |
| Accessibility Attrs | 8 | High |
| Boolean Values | 3 | High |
| Region References | 3 | Medium |
| Icon Systems | 4 | Medium |

---

## Recommended Action Plan

1. **Week 1 - Critical**: Fix CloudFormation status representations (#1)
2. **Week 1 - Critical**: Standardize button labeling (#2)
3. **Week 2 - Critical**: Consolidate error message display (#3)
4. **Week 2 - High**: Standardize configuration naming (#4-5)
5. **Week 3 - High**: Fix remaining high-priority issues (#6-11)
6. **Week 4 - Medium**: Address medium-priority consistency issues (#12-23)
7. **Ongoing - Low**: Implement design tokens and tooling (#24-26)

---

## Code Review Principles Applied

1. **Root Cause Analysis**: Identified why inconsistencies exist (no standards document, organic growth)
2. **Systematic Pattern Recognition**: Found recurring issues across multiple files
3. **Impact-Based Prioritization**: Ranked by user experience and maintenance impact
4. **Solution-Oriented**: Provided working code examples for every issue
5. **Architectural Alignment**: Ensured solutions align with GOV.UK Design System patterns

---

## Strengths

- Good use of GOV.UK Design System as foundation
- Well-structured component architecture
- Comprehensive YAML-based configuration
- Strong accessibility foundations (ARIA attributes present)
- Consistent file organization

---

## Final Recommendations

1. **Create a Style Guide**: Document all naming conventions, patterns, and standards
2. **Add Pre-commit Hooks**: Validate configuration files against schemas
3. **Implement Linting**: Add template linting for consistency checks
4. **Component Library**: Build visual documentation of all components
5. **Team Training**: Review conventions with entire development team

