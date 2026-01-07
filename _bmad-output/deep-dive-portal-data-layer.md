# NDX:Try AWS Scenarios - Portal Data Layer Deep-Dive

**Date:** 2025-12-23
**Analysis Type:** Exhaustive Data File Analysis
**Total Data Files:** 30 YAML/JSON files
**Location:** `src/_data/`

## Executive Summary

This document provides a comprehensive deep-dive analysis of all 30 YAML and JSON data files driving the NDX:Try AWS Scenarios portal. The data layer serves as the single source of truth for all scenario content, configuration, and sample data.

## Data File Inventory

### Core Configuration Files (6)

| File | Lines | Purpose |
|------|-------|---------|
| `scenarios.yaml` | 868 | Master scenario definitions |
| `walkthroughs.yaml` | 85 | Walkthrough step mappings |
| `quizConfig.yaml` | 172 | Quiz recommendation engine |
| `site.yaml` | 69 | Global site configuration |
| `navigation.yaml` | 85 | Navigation structure |
| `forms.yaml` | 182 | Form references and URLs |

### Feature Configuration Files (4)

| File | Lines | Purpose |
|------|-------|---------|
| `phase-config.yaml` | 144 | Three-phase journey structure |
| `pathways.yaml` | 30 | Next steps by evaluation outcome |
| `sample-data-config.yaml` | 326 | Data generation parameters |
| `errorMessages.json` | 224 | CloudFormation error mappings |

### Sample Data Files (9)

| File | Lines | Purpose |
|------|-------|---------|
| `chatbot-sample-questions.yaml` | 99 | 10 sample Q&A pairs |
| `foi-sample-documents.yaml` | 369 | 3 FOI documents with PII |
| `planning-sample-documents.yaml` | 193 | 3 planning applications |
| `evidence-pack-sample.yaml` | 351 | Evidence pack test data |
| `smart-car-park-sample-data.yaml` | 486 | IoT sensor configurations |
| `text-to-speech-sample-data.yaml` | 515 | TTS announcements |
| `quicksight-sample-data.yaml` | 830 | Dashboard metrics |
| `success-stories.yaml` | 99 | Placeholder case studies |

### Exploration Activity Files (6)

Located in `src/_data/exploration/`:
- `council-chatbot.yaml` - 214 lines
- `planning-ai.yaml` - 210 lines
- `foi-redaction.yaml`
- `smart-car-park.yaml`
- `text-to-speech.yaml`
- `quicksight-dashboard.yaml`

### Screenshot Manifest Files (6)

Located in `src/_data/screenshots/`:
- One file per scenario with step-by-step screenshot definitions

---

## Data Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    NDX:Try Data Architecture                    │
└─────────────────────────────────────────────────────────────────┘

                          ELEVENTY STATIC SITE
                                 │
                    ┌────────────┴────────────┐
                    │                         │
            ┌───────▼───────┐        ┌───────▼────────┐
            │  CORE CONFIG  │        │  FEATURE CONFIG│
            ├───────────────┤        ├────────────────┤
            │ scenarios.yaml│        │phase-config.ya │
            │walkthroughs.y │        │ pathways.yaml  │
            │ quizConfig.ya │        │sample-data.cfg │
            │    site.yaml  │        │errorMessages.js│
            │navigation.yaml│        │   forms.yaml   │
            └───────┬───────┘        └────────┬───────┘
                    │                         │
        ┌───────────┴─────────────────────────┴──────────┐
        │                                                │
    ┌───▼────────────────┐              ┌───────────────▼────┐
    │  SCENARIO CONTENT  │              │ WALKTHROUGH CONTENT│
    ├────────────────────┤              ├────────────────────┤
    │ 6 Scenarios:       │              │ Sample Data Files: │
    │ • council-chatbot  │──────────────│ • chatbot-Q&A     │
    │ • planning-ai      │              │ • foi-samples     │
    │ • foi-redaction    │              │ • planning-samples│
    │ • smart-car-park   │              │ • smart-car-data  │
    │ • text-to-speech   │              │ • tts-data        │
    │ • quicksight       │              │ • quicksight-data │
    └────┬───────────────┘              └────┬──────────────┘
         │                                   │
         ├───────────────────────┬───────────┘
         │                       │
    ┌────▼─────────────┐    ┌────▼────────────┐
    │  EXPLORATION     │    │  SCREENSHOTS    │
    │  ACTIVITIES      │    │  MANIFESTS      │
    └──────────────────┘    └─────────────────┘
```

---

## Key Data Schemas

### Scenario Object (`scenarios.yaml`)

```yaml
scenario:
  id: string                              # Unique identifier
  name: string                            # Display name
  headline: string                        # One-liner value prop
  description: string                     # Full description
  difficulty: enum [beginner|intermediate|advanced]
  timeEstimate: string                    # e.g., "15 minutes"
  primaryPersona: enum [service-manager|technical|leadership]
  awsServices: array                      # AWS services used
  tags: array                             # Filter tags
  url: string                             # Scenario page URL
  featured: boolean                       # Homepage highlight
  status: enum [active|coming-soon|deprecated]

  deployment:
    templateUrl: string                   # S3 HTTP URL
    region: string                        # e.g., "us-east-1"
    parameters: array                     # CloudFormation params
    deploymentTime: string                # Estimated time
    outputs: array                        # Stack outputs

  success_metrics:
    service_area: string
    primary_metric: string
    baseline: object
    projection: object
    roi: object
    committee_language: string

  security_posture:
    certifications: array
    data_residency: string
    encryption: string

  tco_projection:
    year_1: object
    year_2: object
    year_3: object
```

### Quiz Configuration (`quizConfig.yaml`)

```yaml
questions:
  - id: string
    text: string
    options:
      - id: string
        label: string
        weights:                          # 0-5 per scenario
          council-chatbot: integer
          planning-ai: integer
          # ... all 6 scenarios

recommendation_algorithm:
  method: "weighted_sum"
  threshold: 3                            # Min score to recommend
  max_results: 3                          # Top N recommendations
```

### Exploration Activity Structure

```yaml
activity:
  id: string
  title: string
  category: enum [experiments|architecture|limits|production]
  persona: enum [visual|technical|both]
  time_estimate: string
  learning: string                        # Key learning outcome
  safe_badge: boolean
  input_text: string
  expected_output: string
  screenshot: string
```

---

## Configuration Patterns

### Pattern 1: Data-Driven Content
- Single `scenarios.yaml` drives all scenario content
- Template reusability through YAML data
- Easy maintenance with single update point

### Pattern 2: Weighted Recommendation Algorithm
```
For each user answer:
  For each scenario:
    score += weight_for_this_scenario

Scenarios with score >= threshold are recommended (top 3)
```

### Pattern 3: Persona-Based Content
- Visual/Service Manager: Screenshots, plain English
- Technical/Developer: AWS Console, code details
- Both: Experiments accessible to everyone

### Pattern 4: Progressive Disclosure
1. Walkthrough: 10-15 minute introduction
2. Explore: 25-45 minute deep-dive
3. Production Guidance: Implementation planning

---

## 6 AWS Scenarios Data Summary

| Scenario | Difficulty | Time | Primary Service |
|----------|------------|------|-----------------|
| Council Chatbot | Beginner | 15 min | Bedrock (Nova Pro) |
| Planning AI | Intermediate | 30 min | Textract, Comprehend |
| FOI Redaction | Intermediate | 25 min | Comprehend PII |
| Smart Car Park | Advanced | 45 min | IoT Core, Timestream |
| Text to Speech | Beginner | 15 min | Polly |
| QuickSight Dashboard | Intermediate | 30 min | QuickSight, Glue |

---

## Data Governance

### Versioning
- `sample-data-config.yaml` has version: "1.0.0"
- Recommendation: Add version fields to major config files

### Validation
- `scenarios.yaml` validated against `schemas/scenario.schema.json`
- Other files should have JSON Schema definitions

### Feature Flags
- `site.yaml` has quiz, evidence pack, analytics flags
- `success-stories.yaml` has `coming_soon` flag

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Configuration Density | ~6,000 lines of YAML/JSON |
| Scenarios Defined | 6 complete scenarios |
| Sample Data Entries | ~100 entries |
| Exploration Activities | ~80 activities |
| Screenshots Defined | ~180+ definitions |
| Quiz Options | 3 questions × 18 options |
| Error Scenarios | 14 CloudFormation errors |

---

_Generated using BMAD Method `document-project` deep-dive workflow on 2025-12-23_
