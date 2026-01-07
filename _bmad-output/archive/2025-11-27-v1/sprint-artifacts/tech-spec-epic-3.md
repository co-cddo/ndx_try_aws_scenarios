# Epic Technical Specification: Guided Scenario Experiences

Date: 2025-11-28
Author: cns
Epic ID: 3
Status: Ready for Review

---

## Overview

Epic 3 transforms deployed AWS scenarios from static infrastructure into **interactive learning experiences** that deliver "wow moments" within 15 minutes. Building on Epic 1's discovery portal and Epic 2's deployment infrastructure, this epic provides guided walkthroughs with realistic UK council sample data, enabling users to experience AWS services actually working with data they recognize.

The core user value is: **"I deployed a scenario and experienced AWS actually working with council data I recognize."** This addresses the critical gap between deployment (Epic 2) and evidence generation (Epic 4) - without a compelling hands-on experience, councils cannot form informed opinions about AWS capabilities.

**Key Insight from PRD:** The 65-80% action rate target requires councils to have a "visceral understanding" of what AWS can do. Abstract deployments don't create this - seeing a chatbot answer "When is bin collection in Birmingham?" or watching an AI extract planning application details creates the compelling narrative needed for stakeholder buy-in.

This epic implements **FRs 13-15 (Guided Walkthroughs)** and **FRs 30-32 (Sample Data)**, delivering:
- **Sample Data Framework**: Realistic, GDPR-compliant UK council data generators
- **6 Scenario Walkthroughs**: Step-by-step guided interactions with success indicators
- **"Wow Moment" Orchestration**: Pre-planned interaction sequences that showcase key capabilities
- **Reflection Prompts**: Contextual prompts connecting AWS features to council use cases

**Strategic Positioning:** Epic 3 is the "prove it works" phase - turning skepticism into advocacy by demonstrating tangible value with familiar council data patterns.

## Objectives and Scope

### In Scope

- **Sample Data Framework**: Reusable data generation system producing realistic UK council data (names, addresses, service requests, planning applications) that is clearly synthetic but recognizable
- **Council Chatbot Walkthrough**: "Ask the Chatbot" guided experience with 10+ pre-written council questions and expected responses demonstrating Bedrock capabilities
- **Planning Application AI Walkthrough**: "Upload and Extract" guided experience with sample planning documents and AI field extraction demonstration
- **FOI Redaction Walkthrough**: "Redact This Document" guided experience with sample FOI requests showing automatic PII detection and redaction
- **Smart Car Park IoT Walkthrough**: "View Real-Time Dashboard" guided experience with simulated sensor data and occupancy visualization
- **Text-to-Speech Walkthrough**: "Generate Audio" guided experience converting council announcements to accessible audio formats
- **QuickSight Dashboard Walkthrough**: "Explore Your Data" guided experience with pre-populated council analytics dashboards
- **Step-by-Step Guidance**: Numbered walkthrough steps with screenshots, expected outcomes, and success indicators
- **"Wow Moment" Markers**: Explicit callouts highlighting key capabilities (e.g., "Notice how the AI extracted the applicant name automatically")
- **Reflection Prompts**: Questions connecting demonstrated features to user's council context (e.g., "How many FOI requests does your council process monthly?")
- **Sample Data Seeding**: Automated population of deployed scenarios with realistic test data during CloudFormation deployment
- **Fallback Content**: Static screenshots and recorded outputs for users who cannot interact live
- **Accessibility**: All walkthroughs screen-reader compatible; sample data includes diverse UK names and accessible formats
- **Scenario Completion Tracking**: Clear "You've completed the walkthrough" confirmation with next steps (Evidence Pack in Epic 4)
- **Mobile-Responsive Walkthroughs**: All guided content accessible on tablet/mobile devices
- **Error Recovery Guidance**: "Something went wrong?" troubleshooting for each walkthrough step
- **Time Estimates**: Per-step and total time indicators (target: each walkthrough <15 minutes)
- **Skill Reinforcement**: Brief explanations of AWS services used at each step
- **Copy-Paste Inputs**: All sample queries, file names, and commands easily copyable
- **Progress Persistence**: Walkthrough progress saved to localStorage for session continuity

### Out of Scope

- Evidence Pack generation (Epic 4)
- Custom data upload (users use provided sample data only)
- Real council data integration (sample data only)
- Video recording of user sessions
- Collaborative/multi-user walkthroughs
- Walkthrough localization (English only)
- Advanced customization of walkthrough paths
- Integration with council IT systems

### Phase 2 Commitments (Documented)

- User-uploaded sample data validation and processing
- Walkthrough branching based on user role/preferences
- Comparison mode (side-by-side scenarios)
- "Share my experience" social/email sharing
- Walkthrough analytics dashboard (completion rates, drop-off points)
- Council-specific data templates (e.g., "Generate data for a district council")
- Video screen recording with narration overlay

### Scope Prioritization

**P1 - Launch Blockers** (Must have for Epic 3 launch):
- Sample Data Framework with core generators (names, addresses, service requests)
- Council Chatbot walkthrough with 10 sample questions
- Planning Application AI walkthrough with 3 sample documents
- Step-by-step guidance UI component
- Progress tracking (per walkthrough)
- "Wow moment" callouts
- Completion confirmation

**P2 - Launch Enhancers** (Should have, launch can proceed without):
- FOI Redaction walkthrough
- Smart Car Park IoT walkthrough
- Text-to-Speech walkthrough
- QuickSight Dashboard walkthrough
- Reflection prompts
- Error recovery guidance per step
- Skill reinforcement explanations
- Copy-paste helper buttons

**P3 - Fast Follow** (Deliver within 2 weeks of launch):
- Mobile-responsive optimization
- Progress persistence (localStorage)
- Time estimates per step
- Fallback static content for failed interactions
- Accessibility audit and remediation

### Value Chain Insights

**Core Value Proposition for Epic 3:**
> "Experience AWS working with council data you recognize, not abstract demos"

**Critical Success Factors:**
1. **Sample data feels real** - UK names, addresses, council terminology create recognition
2. **Walkthroughs are completable in 15 minutes** - Respects council users' time constraints
3. **"Wow moments" are genuinely impressive** - Not underwhelming demos but capability showcases
4. **Clear connection to council use cases** - Every step relates to real council problems

**Competitive Advantage:** No other AWS evaluation resource provides UK council-specific guided experiences with recognizable data patterns.

## System Architecture Alignment

### Architecture Components Referenced

This epic extends Epic 2's deployment infrastructure with interactive guidance and sample data:

| Decision | Component | Epic 3 Implementation |
|----------|-----------|----------------------|
| ADR-1: Portal Model | Static Site (Eleventy 11ty) | Walkthrough content as Markdown/Nunjucks; interaction happens in deployed AWS services |
| ADR-4: Client-Side JS | Vanilla JavaScript | Walkthrough progress tracking, copy-to-clipboard, step navigation |
| ADR-6: Design System | GOV.UK Frontend 5.13.0 | Walkthrough components, step indicators, notification banners |
| ADR-5: Cost Controls | Sample Data Budget | Sample data generation stays within deployment cost caps |

### Architectural Constraints

- **Walkthrough content is static**: Step-by-step guides rendered at build time; actual interactions happen in user's deployed AWS resources
- **No portal-to-AWS communication**: Portal cannot query deployed scenario status; guidance is pre-written for expected states
- **Sample data seeded at deployment**: CloudFormation templates include Lambda functions that populate sample data during stack creation
- **User's AWS account boundary**: All interactions occur in user's Innovation Sandbox; portal provides guidance only
- **No real-time orchestration**: Walkthroughs describe what user should do; cannot programmatically control AWS resources
- **Scenario state assumptions**: Walkthroughs assume successful Epic 2 deployment; error states documented separately

### Walkthrough Architecture Pattern

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     EPIC 3 WALKTHROUGH ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    NDX:TRY PORTAL (Static)                         │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │   │
│  │  │ Step 1     │  │ Step 2     │  │ Step 3     │  │ Complete   │  │   │
│  │  │ Guidance   │→ │ Guidance   │→ │ Guidance   │→ │ Summary    │  │   │
│  │  │ Screenshot │  │ Screenshot │  │ Screenshot │  │ Next Steps │  │   │
│  │  │ Copy Input │  │ Copy Input │  │ Expected   │  │ Evidence   │  │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↕ User follows guidance                      │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              USER'S AWS INNOVATION SANDBOX                         │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                   │   │
│  │  │ Deployed   │  │ Sample     │  │ AWS        │                   │   │
│  │  │ Scenario   │  │ Data       │  │ Console    │                   │   │
│  │  │ Resources  │  │ (Seeded)   │  │ Interface  │                   │   │
│  │  └────────────┘  └────────────┘  └────────────┘                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Sample Data Seeding Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SAMPLE DATA SEEDING FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  CloudFormation Stack Creation                                            │
│           │                                                               │
│           ▼                                                               │
│  ┌─────────────────┐                                                     │
│  │ CustomResource  │  (CloudFormation custom resource trigger)           │
│  │ DataSeedTrigger │                                                     │
│  └────────┬────────┘                                                     │
│           │                                                               │
│           ▼                                                               │
│  ┌─────────────────┐                                                     │
│  │ Lambda:         │                                                     │
│  │ SampleDataSeeder│                                                     │
│  │ - UK names      │                                                     │
│  │ - Addresses     │                                                     │
│  │ - Service reqs  │                                                     │
│  └────────┬────────┘                                                     │
│           │                                                               │
│           ▼                                                               │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │           Scenario-Specific Data Targets                  │            │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │            │
│  │  │DynamoDB │  │   S3    │  │ Bedrock │  │QuickSight│     │            │
│  │  │ Tables  │  │ Buckets │  │ Context │  │ Datasets │     │            │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │            │
│  └─────────────────────────────────────────────────────────┘            │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Integration with Epic 2 Deployment

| Epic 2 Output | Epic 3 Input | Integration Point |
|---------------|--------------|-------------------|
| Deployed CloudFormation stack | Walkthrough assumes active stack | Walkthrough start page checks deployment status guidance |
| CloudFormation Outputs (URLs) | Scenario-specific endpoints | Walkthrough steps reference output values |
| Cost acknowledgment state | Walkthrough context | Remind user of cleanup timing |
| AWS Console access pattern | Continuation of same session | User remains logged in for walkthrough |

### Scenario-Specific Architecture Notes

| Scenario | Sample Data Target | Key Interactive Element |
|----------|-------------------|------------------------|
| **Council Chatbot** | DynamoDB knowledge base, S3 documents | Bedrock chat interface via Lambda Function URL |
| **Planning AI** | S3 sample documents (PDF, images) | API Gateway + Lambda for document upload/processing |
| **FOI Redaction** | S3 sample FOI documents | Lambda + Comprehend for PII detection |
| **Smart Car Park** | IoT simulator Lambda, DynamoDB readings | CloudWatch dashboard, IoT Core topic |
| **Text-to-Speech** | S3 sample text content | Polly via Lambda Function URL |
| **QuickSight** | Pre-populated Athena dataset | QuickSight embedded dashboard URL |

## Detailed Design

### Services and Modules

#### Portal Modules (Static Site - Build Time)

| Module | Technology | Purpose |
|--------|------------|---------|
| **Walkthrough Renderer** | Nunjucks templates | Renders step-by-step walkthrough pages from YAML configuration |
| **Progress Tracker** | Vanilla JavaScript | Tracks completed steps in localStorage, updates progress indicators |
| **Copy-to-Clipboard** | Vanilla JavaScript | Copies sample inputs/commands with visual confirmation |
| **Step Navigator** | Vanilla JavaScript | Next/Previous step navigation with keyboard support |
| **Wow Moment Highlighter** | CSS + JavaScript | Animated callout components for capability highlights |
| **Reflection Prompt Display** | Nunjucks + JS | Collapsible reflection questions with optional response capture |

#### CloudFormation Template Modules (Per Scenario)

| Module | Technology | Purpose |
|--------|------------|---------|
| **SampleDataSeeder Lambda** | Python/Node.js Lambda | CloudFormation Custom Resource that populates sample data on stack creation |
| **UKDataGenerator** | Lambda Layer | Shared library for generating realistic UK council data (names, addresses, postcodes) |
| **ScenarioDataConfig** | CloudFormation Parameter | Scenario-specific data generation configuration |

#### Sample Data Generation Components

| Component | Output | Data Volume |
|-----------|--------|-------------|
| **UK Name Generator** | First name, surname, title | 50 unique names per deployment |
| **UK Address Generator** | Street, city, postcode | 50 unique addresses (valid postcode format) |
| **Council Service Request Generator** | Service type, description, status, dates | 100 sample service requests |
| **Planning Application Generator** | Application reference, type, description, decision | 20 sample planning applications |
| **FOI Request Generator** | Request text, response, PII markers | 10 sample FOI requests with redaction targets |
| **IoT Sensor Data Generator** | Timestamp, occupancy, sensor ID | 1000 data points (simulated 24h history) |

### Data Models and Contracts

#### Walkthrough Configuration Schema (walkthrough-config.yaml)

```yaml
# Per-scenario walkthrough configuration
walkthroughs:
  - scenarioId: "council-chatbot"
    title: "Ask the Council Chatbot"
    description: "Experience AI answering council queries with realistic data"
    estimatedMinutes: 12
    prerequisites:
      - "Deployment completed successfully (Epic 2)"
      - "AWS Console session active"

    steps:
      - stepNumber: 1
        title: "Access the Chatbot Interface"
        instruction: "Click the 'ChatbotURL' link from your deployment outputs"
        screenshot: "/assets/walkthroughs/chatbot/step1-access.png"
        expectedOutcome: "Chatbot interface loads with 'How can I help?' prompt"
        copyableInput: null
        wowMoment: false
        timeEstimate: "30 seconds"
        troubleshooting:
          - symptom: "Page doesn't load"
            solution: "Check your deployment completed - stack status should be CREATE_COMPLETE"
            link: "/help/deployment-check"

      - stepNumber: 2
        title: "Ask About Bin Collection"
        instruction: "Type the sample question and press Enter"
        screenshot: "/assets/walkthroughs/chatbot/step2-bin-query.png"
        copyableInput: "When is bin collection in Birmingham B15?"
        expectedOutcome: "Chatbot responds with bin collection schedule for the postcode"
        wowMoment: true
        wowMomentText: "Notice how the AI understood the postcode and returned specific schedule data"
        timeEstimate: "1 minute"
        awsServiceHighlight:
          service: "Amazon Bedrock"
          explanation: "Claude processes natural language and retrieves information from the knowledge base"

      - stepNumber: 3
        title: "Try a Complex Query"
        instruction: "Ask a follow-up question requiring reasoning"
        screenshot: "/assets/walkthroughs/chatbot/step3-complex.png"
        copyableInput: "I missed the collection yesterday. What should I do?"
        expectedOutcome: "Chatbot provides guidance on missed collection procedures"
        wowMoment: true
        wowMomentText: "The AI maintains conversation context and provides helpful next steps"
        timeEstimate: "1 minute"
        reflectionPrompt:
          question: "How many bin collection enquiries does your council handle monthly?"
          context: "Councils typically receive 500-2000 bin-related calls per month"

    completion:
      title: "Walkthrough Complete!"
      summary: "You've experienced AI-powered citizen enquiry handling"
      keyTakeaways:
        - "Natural language understanding eliminates form-filling"
        - "Context retention enables conversational interactions"
        - "24/7 availability reduces call centre load"
      nextSteps:
        - label: "Generate Evidence Pack"
          link: "/scenarios/council-chatbot/evidence"
          description: "Create a summary document for stakeholder review"
          epic: 4
        - label: "Try Another Scenario"
          link: "/scenarios/"
          description: "Explore other AWS scenarios for councils"
      cleanupReminder:
        text: "Resources will auto-delete in {remainingMinutes} minutes"
        extendLink: "/help/extend-session"
```

#### Sample Data Schema (sample-data-config.yaml)

```yaml
# Sample data configuration per scenario
sampleData:
  councilChatbot:
    knowledgeBase:
      - category: "Waste & Recycling"
        entries:
          - question: "bin collection schedule"
            answer: "Bin collections vary by postcode. Enter your postcode for specific days."
            postcodeData:
              - postcode: "B15 2TT"
                generalWaste: "Monday"
                recycling: "Thursday"
                gardenWaste: "Alternate Fridays"
          - question: "missed collection"
            answer: "Report missed collections within 48 hours via the council website or call 0121 XXX XXXX."
      - category: "Council Tax"
        entries:
          - question: "council tax bands"
            answer: "Council tax bands range from A to H based on property value as of 1991."
          - question: "payment methods"
            answer: "Pay by Direct Debit, online, phone, or at PayPoint locations."
      - category: "Planning"
        entries:
          - question: "planning application status"
            answer: "Check application status online using your reference number starting with 'PA/'."

    sampleConversations:
      - userInput: "When is bin collection in Birmingham B15?"
        expectedResponse: "For postcode B15, general waste collection is on Monday, recycling on Thursday."
      - userInput: "I missed the collection yesterday. What should I do?"
        expectedResponse: "If your bin wasn't collected, please report it within 48 hours at..."

  planningAI:
    sampleDocuments:
      - filename: "sample-planning-app-001.pdf"
        type: "householder"
        extractableFields:
          applicantName: "Sarah Thompson"
          propertyAddress: "42 Oak Lane, Birmingham, B15 2TT"
          proposalDescription: "Two-storey rear extension"
          applicationDate: "2024-11-15"
      - filename: "sample-planning-app-002.pdf"
        type: "full"
        extractableFields:
          applicantName: "Midlands Development Ltd"
          propertyAddress: "Former Factory Site, Industrial Road, B7 4AA"
          proposalDescription: "Demolition of existing buildings and construction of 50 residential units"
          applicationDate: "2024-10-22"

  foiRedaction:
    sampleDocuments:
      - filename: "sample-foi-response-001.docx"
        piiLocations:
          - type: "name"
            text: "John David Smith"
            offsetStart: 234
            offsetEnd: 250
          - type: "address"
            text: "15 Elm Street, Manchester, M1 4BT"
            offsetStart: 456
            offsetEnd: 492
          - type: "phone"
            text: "07712 345678"
            offsetStart: 512
            offsetEnd: 524
          - type: "email"
            text: "john.smith@example.com"
            offsetStart: 540
            offsetEnd: 562
        expectedRedactions: 4
```

#### UK Data Generator Configuration

```yaml
# UK-specific data generation rules
ukDataConfig:
  names:
    firstNames:
      male: ["James", "William", "Oliver", "George", "Harry", "Jack", "Jacob", "Noah", "Charlie", "Thomas"]
      female: ["Olivia", "Amelia", "Isla", "Ava", "Emily", "Sophie", "Grace", "Lily", "Freya", "Ivy"]
    surnames: ["Smith", "Jones", "Williams", "Taylor", "Brown", "Davies", "Evans", "Wilson", "Thomas", "Roberts"]

  addresses:
    streetTypes: ["Street", "Road", "Lane", "Avenue", "Close", "Drive", "Way", "Crescent", "Gardens", "Place"]
    streetNames: ["High", "Station", "Church", "Park", "Victoria", "King", "Queen", "Mill", "Green", "Oak"]
    cities:
      - name: "Birmingham"
        postcodePrefix: "B"
        districts: ["Edgbaston", "Moseley", "Selly Oak", "Erdington", "Sutton Coldfield"]
      - name: "Manchester"
        postcodePrefix: "M"
        districts: ["Didsbury", "Chorlton", "Salford", "Stockport", "Trafford"]
      - name: "Leeds"
        postcodePrefix: "LS"
        districts: ["Headingley", "Roundhay", "Chapel Allerton", "Horsforth", "Morley"]

  councilServices:
    categories:
      - name: "Waste & Recycling"
        types: ["Missed bin", "Bin replacement", "Bulky waste collection", "Fly tipping report"]
      - name: "Highways"
        types: ["Pothole report", "Street light fault", "Pavement repair", "Road marking"]
      - name: "Housing"
        types: ["Housing application", "Repair request", "Anti-social behaviour", "Homeless enquiry"]
      - name: "Council Tax"
        types: ["Payment query", "Discount application", "Address change", "Band review"]
```

### APIs and Interfaces

Epic 3 has no new runtime APIs. All interfaces are either:
1. **Static content** rendered at build time
2. **CloudFormation Custom Resources** executing during deployment
3. **User-facing AWS service interfaces** (Lambda Function URLs, API Gateway, etc.)

#### Portal Interfaces

| Interface | Type | Description |
|-----------|------|-------------|
| **Walkthrough State** | localStorage | `{scenarioId}-walkthrough-progress`: JSON object tracking completed steps |
| **Completion Events** | Custom Events | `walkthroughStepComplete`, `walkthroughComplete` for analytics (Epic 5) |
| **Copy Confirmation** | Visual feedback | Toast notification on successful copy-to-clipboard |

#### CloudFormation Custom Resource Interface

```yaml
# Custom Resource for sample data seeding
Type: AWS::CloudFormation::CustomResource
Properties:
  ServiceToken: !GetAtt SampleDataSeederFunction.Arn
  ScenarioId: !Ref ScenarioTag
  DataConfig:
    recordCount: 50
    includeCategories:
      - "names"
      - "addresses"
      - "serviceRequests"
  TargetResources:
    dynamoDbTable: !Ref KnowledgeBaseTable
    s3Bucket: !Ref SampleDocumentsBucket
```

### Workflows and Sequencing

#### User Walkthrough Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      WALKTHROUGH USER JOURNEY                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Epic 2 Deployment Complete                                               │
│           │                                                               │
│           ▼                                                               │
│  ┌─────────────────┐                                                     │
│  │ Deployment      │  "Deployment successful! Ready to explore?"         │
│  │ Success Page    │                                                     │
│  └────────┬────────┘                                                     │
│           │                                                               │
│           ▼                                                               │
│  ┌─────────────────┐                                                     │
│  │ Walkthrough     │  Overview: What you'll do, time estimate, prereqs   │
│  │ Landing Page    │                                                     │
│  └────────┬────────┘                                                     │
│           │ "Start Walkthrough"                                           │
│           ▼                                                               │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │                    STEP LOOP                              │            │
│  │  ┌────────────┐                                          │            │
│  │  │ Step N     │                                          │            │
│  │  │ - Read     │                                          │            │
│  │  │ - Copy     │◀─────────────────┐                       │            │
│  │  │ - Do       │                  │                       │            │
│  │  │ - Verify   │                  │                       │            │
│  │  └─────┬──────┘                  │                       │            │
│  │        │ "Mark Complete"         │                       │            │
│  │        ▼                         │                       │            │
│  │  ┌────────────┐           ┌──────┴─────┐                │            │
│  │  │ Progress   │───Yes────▶│ More Steps? │                │            │
│  │  │ Saved      │           └──────┬─────┘                │            │
│  │  └────────────┘                  │ No                    │            │
│  │                                  ▼                       │            │
│  └──────────────────────────────────────────────────────────┘            │
│                                                                           │
│  ┌─────────────────┐                                                     │
│  │ Completion      │  Summary, key takeaways, next steps                 │
│  │ Page            │  → Evidence Pack (Epic 4)                           │
│  └─────────────────┘  → Try another scenario                             │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Sample Data Seeding Workflow (CloudFormation)

```
Stack CREATE_IN_PROGRESS
         │
         ▼
┌─────────────────┐
│ Core Resources  │  (DynamoDB, S3, Lambda, etc.)
│ Created         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Custom Resource │  DataSeedTrigger depends on core resources
│ Triggered       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SampleDataSeeder│
│ Lambda Executes │
│ - Generate data │
│ - Write to DB   │
│ - Upload to S3  │
└────────┬────────┘
         │
         ▼ (on success)
┌─────────────────┐
│ CustomResource  │
│ SUCCESS signal  │
│ to CloudFormation│
└────────┬────────┘
         │
         ▼
Stack CREATE_COMPLETE
(Sample data ready for walkthrough)
```

#### User Emotional Journey Map

The following emotional journey map guides UX decisions for walkthrough design:

```
Emotion
   │
 😊 │                    ⭐WOW1        ⭐WOW2              ✓Complete
   │                      ╱╲            ╱╲                  ╱
   │                     ╱  ╲          ╱  ╲                ╱
 😐 │        ╱╲         ╱    ╲        ╱    ╲──────────────╱
   │       ╱  ╲       ╱      ╲      ╱
   │      ╱    ╲     ╱        ╲    ╱
 😟 │─────╱      ╲───╱          ╲──╱
   │   Start   First         Context    Completion
   │   Anxiety Load          Retention
   └──────────────────────────────────────────────────────▶ Time
```

**Key Journey Insights (Applied to Design):**

| Stage | Emotional State | Design Response |
|-------|-----------------|-----------------|
| **Transition from Epic 2** | Relief + "What now?" uncertainty | Immediate CTA with time commitment |
| **Walkthrough Landing** | Setting expectations, mild anxiety | "No technical knowledge required" reassurance |
| **First Interaction** | Nervous excitement | Screenshot preview, placeholder hints |
| **First Wow Moment** | Delight and validation | Explicit callout explaining the magic |
| **Context Retention** | Second wow, building confidence | Highlight AI memory capability |
| **Completion** | Accomplishment, "What next?" | Clear next actions, save insights option |

#### Walkthrough Step Component Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SINGLE STEP COMPONENT                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ STEP HEADER                                                      │     │
│  │  [Step 2 of 5]  "Ask About Bin Collection"  [⏱ 1 min]           │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ INSTRUCTION                                                      │     │
│  │  "Type the sample question and press Enter"                      │     │
│  │                                                                  │     │
│  │  ┌──────────────────────────────────────────────────────────┐   │     │
│  │  │ 📋 When is bin collection in Birmingham B15?    [Copy]   │   │     │
│  │  └──────────────────────────────────────────────────────────┘   │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ SCREENSHOT                                                       │     │
│  │  [Annotated screenshot showing where to type]                    │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ EXPECTED OUTCOME                                                 │     │
│  │  ✓ "Chatbot responds with bin collection schedule for postcode" │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ ⭐ WOW MOMENT                                                    │     │
│  │  "Notice how the AI understood the postcode and returned        │     │
│  │   specific schedule data"                                        │     │
│  │                                                                  │     │
│  │  AWS Service: Amazon Bedrock                                     │     │
│  │  "Claude processes natural language and retrieves information   │     │
│  │   from the knowledge base"                                       │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ TROUBLESHOOTING (collapsed by default)                          │     │
│  │  ▶ "Something went wrong?"                                       │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ NAVIGATION                                                       │     │
│  │  [← Previous]              [Mark Complete & Continue →]         │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Walkthrough Page Load** | <2 seconds | Static page render time |
| **Step Navigation** | <100ms | Client-side JS transition |
| **Copy-to-Clipboard** | <50ms | User action to confirmation |
| **Progress Save** | <100ms | localStorage write |
| **Sample Data Seeding** | <60 seconds | CloudFormation Custom Resource duration |
| **Screenshot Load** | <1 second | Optimized image delivery |

**Optimization Strategies:**
- Walkthrough pages pre-rendered at build time (no server-side rendering)
- Screenshots optimized (WebP with PNG fallback, responsive srcset)
- JavaScript deferred loading (non-blocking)
- localStorage operations are synchronous but fast for small data
- Sample data seeding runs in parallel with other CloudFormation resources where possible

**Sample Data Constraints:**
- Maximum 50 names/addresses per deployment (adequate for demo)
- Maximum 100 service request records
- Sample documents total <10MB per scenario
- Seeding Lambda timeout: 60 seconds (sufficient for all scenarios)

### Security

| Control | Implementation | Rationale |
|---------|----------------|-----------|
| **No PII in Walkthroughs** | All sample data is synthetic | GDPR compliance, no real citizen data |
| **Sample Data Isolation** | Generated fresh per deployment | No data sharing between users |
| **Transport Security** | HTTPS enforced | GitHub Pages default |
| **No User Input Storage** | Reflection prompts client-side only | No server-side data collection |
| **AWS Account Boundary** | All interactions in user's account | No cross-account access |
| **Synthetic Data Markers** | Sample data includes "SAMPLE" indicators | Prevents confusion with real data |

**Sample Data Security Principles:**
- Names, addresses, and postcodes are algorithmically generated, not from real datasets
- Sample documents (PDFs, images) created specifically for walkthroughs
- PII markers in FOI documents are fictional examples
- No real council data included in any scenario
- Sample data clearly labeled as synthetic (e.g., "Sample planning application - not real")

### Reliability/Availability

| Metric | Target | Implementation |
|--------|--------|----------------|
| **Portal Uptime** | 99.9% | GitHub Pages SLA (unchanged from Epic 1) |
| **Sample Data Seeding Success** | 95%+ | CloudFormation Custom Resource with error handling |
| **Walkthrough Completion Rate** | 80%+ target | UI designed for clear progression |
| **Progress Persistence** | Session-durable | localStorage survives browser refresh |

**Failure Modes and Mitigations:**

| Failure | Impact | Mitigation |
|---------|--------|------------|
| Sample data seeding fails | User cannot follow walkthrough with expected data | Fallback to static screenshots + "manual demo" path |
| localStorage unavailable | Progress not saved | Graceful degradation, still functional |
| AWS service interaction fails | "Wow moment" doesn't occur | Troubleshooting guidance per step |
| Screenshot missing | Step unclear | Alt text describes expected outcome |

**Sample Data Seeding Reliability:**
- Lambda function includes retry logic (3 attempts)
- Partial success acceptable (some data better than none)
- CloudFormation rollback on complete failure (user can retry deployment)
- Monitoring via CloudWatch Logs

### Observability

**Epic 3 Observability Components:**

| Component | Implementation | Purpose |
|-----------|----------------|---------|
| **Sample Seeding Logs** | CloudWatch Logs | Debug data generation issues |
| **Walkthrough Progress** | localStorage (client-side) | User session continuity |
| **Completion Events** | Custom JS events | Future analytics integration (Epic 5) |
| **Error Tracking** | Console logging | Development debugging |

**Metrics to Track (Epic 5 Integration):**

| Metric | Type | Insight |
|--------|------|---------|
| `walkthrough_started` | Counter | User engagement |
| `walkthrough_step_completed` | Counter per step | Drop-off analysis |
| `walkthrough_completed` | Counter | Success rate |
| `copy_button_clicked` | Counter | Usability signal |
| `troubleshooting_expanded` | Counter | Pain points identification |
| `wow_moment_viewed` | Counter | Feature awareness |

**No Real-Time Monitoring in Epic 3:**
- Sample data seeding monitored via CloudWatch (per-deployment)
- Portal-side observability deferred to Epic 5 analytics
- Client-side errors logged to console only

## Dependencies and Integrations

### External Dependencies

| Dependency | Version | Purpose | Risk Level |
|------------|---------|---------|------------|
| **Epic 1 Portal** | Completed | Base static site, navigation, scenario pages | Low - prerequisite |
| **Epic 2 Deployment** | Completed | CloudFormation deployment flow, stack outputs | Low - prerequisite |
| **Eleventy** | 2.x | Static site generation for walkthrough pages | Low - already in use |
| **GOV.UK Frontend** | 5.13.0 | Step indicator, notification components | Low - already in use |
| **AWS Lambda** | Runtime | Sample data seeding function | Low - managed service |
| **AWS CloudFormation** | Service | Custom Resource for data seeding | Low - core to platform |

### Platform Dependencies

| Platform | Purpose | SLA | Fallback |
|----------|---------|-----|----------|
| **GitHub Pages** | Walkthrough page hosting | 99.9% | Same as Epic 1 |
| **AWS Lambda** | Sample data generation | 99.95% | Manual data seeding instructions |
| **AWS DynamoDB** | Sample data storage (chatbot) | 99.99% | Pre-populated data in template |
| **AWS S3** | Sample document storage | 99.99% | Documents bundled in Lambda |

### Integration Points

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     EPIC 3 INTEGRATION MAP                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  EPIC 1 (Portal)           EPIC 2 (Deploy)           EPIC 3 (Walkthrough)│
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐      │
│  │ Scenario    │          │ Deployment  │          │ Walkthrough │      │
│  │ Pages       │──────────│ Success     │──────────│ Landing     │      │
│  │             │          │ Page        │          │ Page        │      │
│  └─────────────┘          └─────────────┘          └──────┬──────┘      │
│                                  │                        │              │
│                                  ▼                        ▼              │
│                           ┌─────────────┐          ┌─────────────┐      │
│                           │ CloudFormation│         │ Step-by-    │      │
│                           │ Outputs     │◀─────────│ Step Guide  │      │
│                           │ (URLs)      │  uses    │             │      │
│                           └─────────────┘          └──────┬──────┘      │
│                                  │                        │              │
│                                  ▼                        ▼              │
│                           ┌─────────────┐          ┌─────────────┐      │
│                           │ Sample Data │          │ Completion  │      │
│                           │ Seeder      │          │ Page        │      │
│                           │ Lambda      │          │ → Epic 4    │      │
│                           └─────────────┘          └─────────────┘      │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Epic Handoffs

| From | To | Handoff Data | Integration Point |
|------|-----|--------------|-------------------|
| **Epic 2** | **Epic 3** | CloudFormation stack outputs (URLs, ARNs) | Walkthrough steps reference output values |
| **Epic 2** | **Epic 3** | Deployment success confirmation | Walkthrough landing page entry point |
| **Epic 2** | **Epic 3** | Cost acknowledgment state | Cleanup reminder in walkthrough |
| **Epic 3** | **Epic 4** | Walkthrough completion status | Evidence Pack generation trigger |
| **Epic 3** | **Epic 4** | Session interaction data | Evidence Pack content source |

### CloudFormation Template Dependencies (Per Scenario)

| Scenario | Required Resources | Sample Data Target |
|----------|-------------------|-------------------|
| **Council Chatbot** | DynamoDB, Lambda, Bedrock | DynamoDB knowledge base |
| **Planning AI** | S3, Lambda, Textract/Comprehend | S3 sample documents |
| **FOI Redaction** | S3, Lambda, Comprehend | S3 FOI documents |
| **Smart Car Park** | IoT Core, Lambda, DynamoDB, CloudWatch | DynamoDB sensor readings |
| **Text-to-Speech** | S3, Lambda, Polly | S3 text content |
| **QuickSight** | Athena, S3, QuickSight | S3 dataset files |

### Dependency Versioning

**Lambda Layer for UK Data Generator:**
- Shared Lambda Layer deployed to each scenario stack
- Version pinned to ensure consistent data generation
- Update process: new layer version → test → update CloudFormation templates

## Acceptance Criteria (Authoritative)

This section consolidates all acceptance criteria for Epic 3 as the single source of truth for implementation validation.

### AC-3.1: Sample Data Framework

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.1.1 | UK Name Generator produces 50 unique names with realistic UK distribution | Unit test |
| AC-3.1.2 | UK Address Generator produces valid UK postcode formats | Unit test + regex validation |
| AC-3.1.3 | Service Request Generator produces 100 records across 4 categories | Unit test |
| AC-3.1.4 | Sample data seeding completes within 60 seconds | CloudFormation timing |
| AC-3.1.5 | Sample data is clearly marked as synthetic (includes "SAMPLE" markers) | Visual inspection |
| AC-3.1.6 | No real PII included in any sample data | Security review |
| AC-3.1.7 | Lambda Layer deploys successfully across all scenario stacks | Integration test |
| AC-3.1.8 | Data generation is deterministic with seed (reproducible for testing) | Unit test |
| AC-3.1.9 | Seeding Lambda validates record count before returning SUCCESS to CloudFormation | Integration test |
| AC-3.1.10 | CloudWatch alarm triggers if seeding exceeds 45 seconds (pre-timeout warning) | CloudWatch config |
| AC-3.1.11 | Post-deployment health check verifies sample data exists before showing "Ready to explore" | Integration test |
| AC-3.1.12 | "Re-seed sample data" button available if health check detects missing/corrupt data | Functional test |
| AC-3.1.13 | Seeding status exposed via CloudFormation output (COMPLETE/PARTIAL/FAILED with record counts) | CloudFormation test |

### AC-3.2: Council Chatbot Walkthrough

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.2.1 | Walkthrough landing page displays with title, description, time estimate | Visual inspection |
| AC-3.2.2 | Step 1 (Access Chatbot) displays with screenshot and expected outcome | Visual inspection |
| AC-3.2.3 | Step 2 (Bin Collection Query) has copyable input and wow moment callout | Functional test |
| AC-3.2.4 | Copy-to-clipboard function works with visual confirmation | Functional test |
| AC-3.2.5 | Chatbot responds to sample queries with relevant answers | Manual test |
| AC-3.2.6 | All 10 sample questions have expected responses documented | Content review |
| AC-3.2.7 | Walkthrough completion page displays with key takeaways | Visual inspection |
| AC-3.2.8 | "Generate Evidence Pack" link visible (placeholder for Epic 4) | Visual inspection |
| AC-3.2.9 | Progress persists across browser refresh (localStorage) | Functional test |
| AC-3.2.10 | Walkthrough completable in <15 minutes | Timed user test |
| AC-3.2.11 | Walkthrough landing shows "No technical knowledge required" reassurance | Visual inspection |
| AC-3.2.12 | Chatbot interface includes placeholder hint text (e.g., "Try: When is bin collection in B15?") | Visual inspection |
| AC-3.2.13 | Wow moment callouts explain technical achievement in plain English | Content review |
| AC-3.2.14 | Walkthrough landing displays "Sample data status: ✓ Ready" with live verification | Functional test |
| AC-3.2.15 | Manual data seeding fallback instructions displayed if automated seeding detected as failed | Functional test |
| AC-3.2.16 | Value proposition emphasizes "10 minutes to understand if this solves your problem" | Content review |

### AC-3.3: Planning Application AI Walkthrough

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.3.1 | 3 sample planning documents uploaded to S3 during deployment | Integration test |
| AC-3.3.2 | Step-by-step guide for document upload process displays correctly | Visual inspection |
| AC-3.3.3 | AI field extraction demo shows applicant name, address, description | Manual test |
| AC-3.3.4 | Extracted fields match sample document content | Functional test |
| AC-3.3.5 | Wow moment highlights automatic extraction capability | Visual inspection |
| AC-3.3.6 | Reflection prompt asks about council's planning application volume | Visual inspection |
| AC-3.3.7 | Troubleshooting section covers common upload failures | Visual inspection |

### AC-3.4: FOI Redaction Walkthrough

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.4.1 | Sample FOI documents contain clearly marked PII locations | Content review |
| AC-3.4.2 | Redaction demo correctly identifies 4 PII types (name, address, phone, email) | Functional test |
| AC-3.4.3 | Redacted output shows PII replaced with markers | Visual verification |
| AC-3.4.4 | Step guide explains PII detection confidence scores | Visual inspection |
| AC-3.4.5 | Walkthrough completable in <12 minutes | Timed user test |

### AC-3.5: Smart Car Park IoT Walkthrough

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.5.1 | 1000 simulated sensor readings populate DynamoDB on deployment | Integration test |
| AC-3.5.2 | CloudWatch dashboard displays occupancy data | Manual test |
| AC-3.5.3 | Walkthrough explains IoT data flow from sensor to dashboard | Visual inspection |
| AC-3.5.4 | Real-time simulation shows occupancy changes | Functional test |
| AC-3.5.5 | AWS service callouts explain IoT Core, Lambda, CloudWatch | Visual inspection |

### AC-3.6: Text-to-Speech Walkthrough

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.6.1 | Sample council announcement text provided for conversion | Visual inspection |
| AC-3.6.2 | Polly generates audio file from sample text | Functional test |
| AC-3.6.3 | Audio playback works in browser | Functional test |
| AC-3.6.4 | Multiple voice options demonstrated | Manual test |
| AC-3.6.5 | Walkthrough explains accessibility use case | Visual inspection |

### AC-3.7: QuickSight Dashboard Walkthrough

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.7.1 | Sample dataset populates Athena/S3 on deployment | Integration test |
| AC-3.7.2 | QuickSight dashboard accessible via CloudFormation output URL | Functional test |
| AC-3.7.3 | Dashboard displays council service metrics visualizations | Visual inspection |
| AC-3.7.4 | Interactive elements (filters, drill-down) demonstrated | Manual test |
| AC-3.7.5 | Walkthrough explains self-service analytics capability | Visual inspection |

### AC-3.8: Walkthrough UI Components

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.8.1 | Step indicator shows current step and total steps | Visual inspection |
| AC-3.8.2 | Next/Previous navigation buttons work correctly | Functional test |
| AC-3.8.3 | "Mark Complete" button advances to next step | Functional test |
| AC-3.8.4 | Wow moment callouts have distinctive visual styling | Visual inspection |
| AC-3.8.5 | Troubleshooting sections are collapsible | Functional test |
| AC-3.8.6 | All screenshots have alt text | Accessibility audit |
| AC-3.8.7 | Keyboard navigation works through all walkthrough steps | Accessibility test |
| AC-3.8.8 | Screen reader correctly announces step content | VoiceOver/NVDA test |
| AC-3.8.9 | Mobile layout displays correctly at 320px viewport | Responsive test |
| AC-3.8.10 | Time estimate displays per step and total | Visual inspection |
| AC-3.8.11 | Pre-interaction anxiety addressed with reassurance messaging at start | Visual inspection |

### AC-3.9: Progress and Completion

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.9.1 | Progress saves to localStorage after each step completion | Functional test |
| AC-3.9.2 | Resuming walkthrough returns to last completed step | Functional test |
| AC-3.9.3 | Completion page summarizes key takeaways | Visual inspection |
| AC-3.9.4 | "Try Another Scenario" links to gallery | Click test |
| AC-3.9.5 | Cleanup reminder displays remaining time with reassuring "no action needed" message | Visual inspection |
| AC-3.9.6 | Walkthrough completion triggers analytics event stub | Code inspection |
| AC-3.9.7 | Completion page includes "Save insights" copy-to-clipboard for key takeaways | Functional test |
| AC-3.9.8 | Email capture available for "Notify me when Evidence Pack ready" (Epic 4 bridge) | Functional test |
| AC-3.9.9 | Completion includes "Compare to your process" worksheet download | Functional test |

### AC-3.10: Epic Handoff & Engagement

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.10.1 | Deployment success page auto-redirects to walkthrough after 5-second countdown (opt-out available) | Functional test |
| AC-3.10.2 | Email capture at deployment offers "Complete your walkthrough" reminder series (30min, 2hr, 24hr) | Integration test |
| AC-3.10.3 | Walkthrough entry point prominently visible on deployment success page | Visual inspection |
| AC-3.10.4 | Pre-deployment messaging sets expectation: "Block 15 minutes total (5 deploy + 10 explore)" | Visual inspection |
| AC-3.10.5 | Deployment success includes social proof: "X councils have explored this walkthrough" | Visual inspection |
| AC-3.10.6 | Loss aversion messaging displayed: "You have 2 hours to explore before auto-cleanup" | Visual inspection |

### AC-3.11: Wow Moment Effectiveness

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.11.1 | Pre-wow context establishes "before" state (manual process pain) before showing "after" (AI result) | Content review |
| AC-3.11.2 | Time-saved calculation displayed: "This took X seconds. Manual processing averages Y minutes" | Visual inspection |
| AC-3.11.3 | Council-specific terminology used in all example queries and outputs | Content review |
| AC-3.11.4 | Wow moment visual hierarchy ensures callout noticed (not buried in content) | Visual inspection |
| AC-3.11.5 | Persona toggles available: "Why this matters to: [CTO] [Service Manager] [Finance]" | Functional test |
| AC-3.11.6 | Every wow includes quantified business impact (time saved, cost avoided, risk reduced) | Content review |
| AC-3.11.7 | Reflection prompts personalized by role: "As a [selected role], this means..." | Functional test |

### AC-3.12: Screenshot Resilience

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.12.1 | Screenshots annotated with numbered markers; instructions reference markers not colors/positions | Visual inspection |
| AC-3.12.2 | Every screenshot has equivalent standalone text instruction | Content review |
| AC-3.12.3 | "Last verified: [date]" timestamp displayed on each walkthrough page | Visual inspection |
| AC-3.12.4 | Monthly screenshot audit calendar reminder configured | Operational check |

### AC-3.13: Accessibility Compliance

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.13.1 | Copy-to-clipboard announces "Copied to clipboard" via aria-live region | VoiceOver test |
| AC-3.13.2 | Step completion triggers screen reader announcement: "Step N complete. N of M total" | NVDA test |
| AC-3.13.3 | Wow moment callout styling meets WCAG 2.1 AAA contrast (7:1 ratio) | Contrast checker |
| AC-3.13.4 | All interactive elements have visible focus indicators meeting WCAG 2.1 | Accessibility audit |

### AC-3.14: Flexible Engagement Modes

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.14.1 | "Quick Taste" mode available: steps 1-2 only, completable in 3 minutes | Timed test |
| AC-3.14.2 | "Continue later" button sends email with deep-link to current step | Integration test |
| AC-3.14.3 | Each step provides standalone value if user stops there (no cliff-hanger steps) | Content review |

### AC-3.15: Cross-Tab Guidance

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.15.1 | "Open in AWS Console" buttons construct region-aware deep links from deployment outputs | Functional test |
| AC-3.15.2 | Each step includes checkpoint: "Did you see X? [Yes] [No, help me]" with branching | Functional test |
| AC-3.15.3 | AWS session expiry detected with re-authentication guidance displayed | Functional test |

### AC-3.16: Council-Type Customization

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.16.1 | Walkthrough landing asks "What type of council?" (District/County/Unitary/Metropolitan) | Visual inspection |
| AC-3.16.2 | Sample scenarios adjust based on council type (County=highways, District=planning, etc.) | Content verification |
| AC-3.16.3 | At least one sample service request mirrors real common patterns per council type | Content review |

### AC-3.17: Persona-Adaptive Content

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.17.1 | Plain English toggle removes all technical jargon from wow moments and explanations | Functional test |
| AC-3.17.2 | 60-second inactivity triggers contextual "Need help with this step?" prompt | Functional test |
| AC-3.17.3 | "View Architecture" expands inline diagram showing AWS services and data flow | Visual inspection |
| AC-3.17.4 | Security Posture card displays encryption, IAM scope, and data residency per scenario | Content review |
| AC-3.17.5 | "View CloudFormation Template" link opens template in syntax-highlighted readable format | Functional test |

### AC-3.18: Business Case & Sharing

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.18.1 | "Generate Stakeholder Summary" creates 1-page PDF with key points for leadership presentation | Functional test |
| AC-3.18.2 | Interactive savings calculator: input current volumes → see projected time/cost savings | Functional test |
| AC-3.18.3 | Full TCO breakdown shows deployment cost + estimated monthly run cost + exit cost | Visual inspection |
| AC-3.18.4 | "Share My Experience" exports 1-page PDF summary with screenshots and key metrics | Functional test |
| AC-3.18.5 | "Need Help?" footer links to NDX support resources, FAQ, and community channels | Visual inspection |

### AC-3.19: Frontstage Polish

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.19.1 | Skeleton loader displays during walkthrough page initialization | Visual test |
| AC-3.19.2 | "AI is processing your request..." guidance shown while waiting for Bedrock response | Content review |
| AC-3.19.3 | Walkthrough completion triggers celebration animation (confetti or equivalent) | Visual test |
| AC-3.19.4 | Each step shows estimated time for next step ("Next step: ~30 seconds") | Visual inspection |
| AC-3.19.5 | After 30 seconds waiting for AI response, "Taking longer than usual" guidance displays | Functional test |
| AC-3.19.6 | First AWS interaction includes "First request may take a few extra seconds" note | Content review |
| AC-3.19.7 | "Sample data ready!" notification displays when CloudFormation seeding completes | Functional test |
| AC-3.19.8 | Step transitions include smooth 300ms fade animation | Visual test |
| AC-3.19.9 | Error messages are step-contextual ("Error copying query" not generic "Clipboard error") | Content review |
| AC-3.19.10 | "Preparing sample data..." status visible during CloudFormation seeding phase | Visual inspection |
| AC-3.19.11 | PDF export shows "Generating your summary..." spinner during creation | Visual test |

### AC-3.20: Backstage Resilience

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.20.1 | Service worker caches walkthrough steps for offline resilience | Functional test |
| AC-3.20.2 | localStorage integrity check on init; corrupted state triggers reset prompt | Functional test |
| AC-3.20.3 | Next walkthrough step prefetched while current step displays | Network inspection |
| AC-3.20.4 | Clipboard API fallback for browsers without navigator.clipboard support | Cross-browser test |
| AC-3.20.5 | "Is your AWS console tab still open?" prompt if user returns after 5+ minutes | Functional test |
| AC-3.20.6 | Analytics events queued with retry logic if localStorage write fails | Unit test |
| AC-3.20.7 | Partial seeding failure triggers automatic retry (max 2 attempts) before failing | Integration test |

### AC-3.21: Support Process Quality

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-3.21.1 | Static assets include cache-busting version query parameter | Build verification |
| AC-3.21.2 | Content version number displayed in walkthrough footer | Visual inspection |
| AC-3.21.3 | Browser support matrix documented and tested (Chrome, Firefox, Safari, Edge latest-2) | Documentation + test |
| AC-3.21.4 | CloudFormation output freshness indicator ("URLs valid until stack update") | Visual inspection |
| AC-3.21.5 | "Check AWS service status" link available in troubleshooting sections | Visual inspection |

### Acceptance Criteria Verification Matrix

| Story | Total ACs | Automated | Manual |
|-------|-----------|-----------|--------|
| 3.1 Sample Data Framework | 13 | 9 | 4 |
| 3.2 Council Chatbot | 16 | 6 | 10 |
| 3.3 Planning AI | 7 | 3 | 4 |
| 3.4 FOI Redaction | 5 | 2 | 3 |
| 3.5 Smart Car Park | 5 | 2 | 3 |
| 3.6 Text-to-Speech | 5 | 2 | 3 |
| 3.7 QuickSight | 5 | 2 | 3 |
| 3.8 UI Components | 11 | 5 | 6 |
| 3.9 Progress & Completion | 9 | 6 | 3 |
| 3.10 Epic Handoff & Engagement | 6 | 3 | 3 |
| 3.11 Wow Moment Effectiveness | 7 | 2 | 5 |
| 3.12 Screenshot Resilience | 4 | 1 | 3 |
| 3.13 Accessibility Compliance | 4 | 3 | 1 |
| 3.14 Flexible Engagement Modes | 3 | 2 | 1 |
| 3.15 Cross-Tab Guidance | 3 | 3 | 0 |
| 3.16 Council-Type Customization | 3 | 1 | 2 |
| 3.17 Persona-Adaptive Content | 5 | 3 | 2 |
| 3.18 Business Case & Sharing | 5 | 4 | 1 |
| 3.19 Frontstage Polish | 11 | 6 | 5 |
| 3.20 Backstage Resilience | 7 | 6 | 1 |
| 3.21 Support Process Quality | 5 | 2 | 3 |
| **Total** | **139** | **72** | **67** |

*Elicitation enhancements applied:*
- *+6 ACs via Journey Mapping (AC-3.2.11-13, AC-3.8.11, AC-3.9.7-8)*
- *+21 ACs via Pre-mortem Analysis (AC-3.1.9-10, AC-3.2.14-16, AC-3.9.9, AC-3.10.1-3, AC-3.11.1-4, AC-3.12.1-4, AC-3.13.1-4)*
- *+18 ACs via Devil's Advocate (AC-3.1.11-13, AC-3.10.4-6, AC-3.11.5-7, AC-3.14.1-3, AC-3.15.1-3, AC-3.16.1-3)*
- *+10 ACs via Empathy Map (AC-3.17.1-5, AC-3.18.1-5)*
- *+23 ACs via Service Blueprint (AC-3.19.1-11, AC-3.20.1-7, AC-3.21.1-5)*

## Traceability Mapping

This section maps PRD requirements (FRs) to Epic 3 implementation artifacts and acceptance criteria.

### FR → Epic 3 Story Mapping

| FR ID | Requirement | Epic 3 Story | Status |
|-------|-------------|--------------|--------|
| FR13 | Demo Walkthrough guide with sample data | Story 3.2-3.7 | P1/P2 |
| FR14 | Clear success indicators for demo tasks | AC-3.8.1 (Step indicator) | P1 |
| FR15 | Guided prompts connecting features to council use cases | Reflection Prompts | P2 |
| FR30 | Sample data representative of UK council datasets | Story 3.1 | P1 |
| FR31 | Sample data includes variety (names, addresses, requests) | AC-3.1.1-3 | P1 |
| FR32 | Sample data GDPR compliant (synthetic) | AC-3.1.6 | P1 |
| FR27 | "What You'll Learn" skills list per scenario | Skill Reinforcement | P2 |

### FR → Acceptance Criteria Mapping

| FR ID | Primary AC | Secondary ACs |
|-------|------------|---------------|
| FR13 | AC-3.2.1 (Walkthrough landing page) | AC-3.2.2-7, AC-3.3.2, AC-3.4-7 |
| FR14 | AC-3.8.1 (Step indicator) | AC-3.8.3, AC-3.9.3 |
| FR15 | AC-3.2.5 (Reflection prompt) | AC-3.3.6 |
| FR30 | AC-3.1.1-3 (UK data generators) | AC-3.1.5 |
| FR31 | AC-3.1.1 (Names), AC-3.1.2 (Addresses), AC-3.1.3 (Requests) | - |
| FR32 | AC-3.1.6 (No real PII) | AC-3.1.5 (SAMPLE markers) |

### UX Design → Implementation Mapping

| UX Component | Tech Spec Section | Implementation |
|--------------|-------------------|----------------|
| Walkthrough Landing Page | AC-3.2.1 | `src/walkthroughs/{scenario}/index.njk` |
| Step-by-Step Guide | AC-3.8.1-5 | `_includes/components/walkthrough-step.njk` |
| Copy-to-Clipboard Button | AC-3.2.4 | `assets/js/walkthrough.js` |
| Wow Moment Callout | AC-3.8.4 | `_includes/components/wow-moment.njk` |
| Progress Indicator | AC-3.8.1 | GOV.UK Step-by-step navigation pattern |
| Completion Summary | AC-3.9.3 | `src/walkthroughs/{scenario}/complete.njk` |

### Architecture Decision → Implementation Mapping

| ADR | Implementation Impact | Verification |
|-----|----------------------|--------------|
| ADR-1: Static Site | Walkthrough content pre-rendered, interactions in AWS | All walkthrough pages static |
| ADR-4: Vanilla JavaScript | Progress tracking, copy-to-clipboard in plain JS | No framework dependencies |
| ADR-5: Cost Controls | Sample data within deployment budget | AC-3.1.4 (60s seeding) |
| ADR-6: GOV.UK Frontend | Step indicator, notification patterns | Visual consistency |

### Epic 2 → Epic 3 Dependency Mapping

| Epic 2 Output | Epic 3 Dependency | Verification |
|---------------|-------------------|--------------|
| CloudFormation stack deployed | Walkthrough assumes active stack | AC-3.2.1 prerequisites |
| CloudFormation Outputs (URLs) | Step instructions reference outputs | AC-3.2.2 (ChatbotURL) |
| Sample data seeding | Data available for interactions | AC-3.1.4 |
| Cost acknowledgment complete | Cleanup reminder in walkthrough | AC-3.9.5 |

### File → FR/AC Traceability

| File Path | FRs Addressed | Key ACs |
|-----------|---------------|---------|
| `src/walkthroughs/council-chatbot/*.njk` | FR13, FR14 | AC-3.2.1-10 |
| `src/walkthroughs/planning-ai/*.njk` | FR13, FR14, FR15 | AC-3.3.1-7 |
| `_data/walkthrough-config.yaml` | FR13 | All walkthrough ACs |
| `_data/sample-data-config.yaml` | FR30, FR31, FR32 | AC-3.1.1-8 |
| `cloudformation/layers/uk-data-generator/` | FR30, FR31 | AC-3.1.1-3, AC-3.1.7 |
| `_includes/components/walkthrough-step.njk` | FR14 | AC-3.8.1-5 |
| `_includes/components/wow-moment.njk` | FR15 | AC-3.8.4 |
| `assets/js/walkthrough.js` | FR14 | AC-3.2.4, AC-3.8.2-3, AC-3.9.1-2 |

### Coverage Gaps (Intentional)

These requirements are explicitly **out of scope** for Epic 3:

| FR ID | Requirement | Target Epic |
|-------|-------------|-------------|
| FR16 | "What You Experienced" reflection summary | Epic 4 |
| FR17 | Business case generation prompts | Epic 4 |
| FR18 | Evidence Pack generator | Epic 4 |
| FR33 | Session event capture | Epic 5 |
| FR34 | Analytics dashboard | Epic 5 |
| FR19 | Cost breakdown report | Epic 4/5 |

## Risks, Assumptions, Open Questions

### Risks

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|------------|--------|------------|-------|
| R3.1 | Sample data doesn't feel realistic enough | Medium | High | User testing with council staff; iterate on data patterns | PM |
| R3.2 | Walkthrough steps don't match actual AWS interface | High | Medium | Version-resilient screenshots; focus on stable UI elements | Dev Lead |
| R3.3 | Sample data seeding fails during deployment | Medium | High | Fallback static content; robust error handling in Lambda | Dev Lead |
| R3.4 | Walkthroughs take longer than 15 minutes | Medium | Medium | Timed user testing; streamline steps if needed | UX |
| R3.5 | Wow moments underwhelm users | Medium | High | Pre-test with council users; enhance with better examples | PM |
| R3.6 | CloudFormation Custom Resource timeout | Low | High | Optimize data generation; parallel processing | Dev Lead |
| R3.7 | AWS service changes break walkthrough accuracy | High | Medium | Quarterly content review; monitor AWS announcements | DevOps |
| R3.8 | Users skip walkthroughs entirely | Medium | Medium | Prominent placement; clear value proposition | PM |
| R3.9 | Sample documents difficult to create/maintain | Medium | Low | Templated document generation; reuse across scenarios | Content |
| R3.10 | Bedrock response variability confuses users | Medium | Medium | Document expected vs actual; tolerance in validation | Dev Lead |

### Assumptions

| ID | Assumption | Rationale | Validation Method |
|----|------------|-----------|-------------------|
| A3.1 | Users complete Epic 2 deployment before walkthrough | Prerequisite flow | Walkthrough landing page checks |
| A3.2 | 15 minutes is sufficient for meaningful demo | PRD "15-minute success" target | Timed user testing |
| A3.3 | UK-specific data enhances recognition | Target audience is UK councils | User feedback |
| A3.4 | Static walkthrough guidance is sufficient | No real-time orchestration possible | User completion rates |
| A3.5 | Sample data volume (50-100 records) is adequate | Demonstration purposes, not production | User feedback |
| A3.6 | AWS service interfaces stable enough for screenshots | Major UI changes are rare | Quarterly review |
| A3.7 | Users will read instructions before interacting | Guided format encourages following | Completion rates |
| A3.8 | Wow moments create memorable experiences | Psychological impact of "aha" moments | User feedback |
| A3.9 | Copy-to-clipboard reduces errors | Typing introduces mistakes | Error rate tracking |
| A3.10 | Reflection prompts connect features to use cases | Contextual questions aid understanding | User feedback |

### Open Questions

| ID | Question | Status | Resolution | Impact |
|----|----------|--------|------------|--------|
| Q3.1 | How many sample questions should chatbot have? | **Resolved** | 10 questions across 4 categories | Content scope |
| Q3.2 | Should walkthroughs support "skip to step"? | **Resolved** | No - linear progression enforced | UX simplicity |
| Q3.3 | How to handle Bedrock response variability? | **Resolved** | Document "expected response like" not exact match | Content approach |
| Q3.4 | Should sample data be randomized per deployment? | **Resolved** | No - deterministic for predictable walkthroughs | Testing consistency |
| Q3.5 | What happens if user's deployment times out mid-walkthrough? | Open | TBD - need guidance content | User experience |
| Q3.6 | Should there be a "demo mode" without deployment? | **Resolved** | No - Epic 2 videos serve this purpose | Scope clarity |
| Q3.7 | How detailed should troubleshooting guidance be? | Open | TBD - need user testing data | Content depth |
| Q3.8 | Should walkthrough progress sync across devices? | **Resolved** | No - localStorage only (no accounts) | Technical simplicity |
| Q3.9 | What if QuickSight requires additional user setup? | Open | TBD - need to test QuickSight flow | Integration complexity |
| Q3.10 | Should walkthroughs have audio narration option? | **Resolved** | Phase 2 - out of scope for MVP | Accessibility enhancement |

### Implementation Notes from Q&A

**Sample Questions (Q3.1):** 10 questions provide sufficient variety without overwhelming. Categories:
- Waste & Recycling (3 questions)
- Council Tax (2 questions)
- Planning (2 questions)
- General Services (3 questions)

**Linear Progression (Q3.2):** Enforcing linear flow ensures users don't miss prerequisite steps. "Jump to step" creates support burden for confused users.

**Bedrock Variability (Q3.3):** Documentation will use "You should see a response like..." rather than exact match. Walkthroughs explain LLM variability.

**Deterministic Data (Q3.4):** Same sample data every time enables:
- Predictable screenshots
- Consistent expected outcomes
- Easier testing and debugging

### Pre-Mortem Analysis (Elicitation Enhanced)

*Full pre-mortem analysis imagining Epic 3 failure 6 months post-launch:*

#### Scenario A: "The Demo That Didn't Demo" (Walkthrough Abandonment)
**Failure:** Only 25% walkthrough completion vs 65-80% target
| Contributing Factor | Warning Sign | Mitigation (AC) |
|---------------------|--------------|-----------------|
| Users felt "done" after deployment | Low walkthrough_started events | AC-3.10.1: Auto-redirect countdown |
| Missing urgency to explore | High deployment, low walkthrough entry | AC-3.10.2: Email reminder series |
| "I'll do it later" syndrome | Large timestamp gap | AC-3.2.16: 10-minute value prop |

#### Scenario B: "The Outdated Screenshots Disaster"
**Failure:** AWS UI changes made walkthroughs appear broken
| Contributing Factor | Warning Sign | Mitigation (AC) |
|---------------------|--------------|-----------------|
| Screenshot dependency | AWS release notes | AC-3.12.1: Numbered markers |
| No change monitoring | spike in troubleshooting events | AC-3.12.4: Monthly audit |
| Brittle "click blue button" | Support tickets | AC-3.12.2: Standalone text |

#### Scenario C: "The Silent Seeding Failure"
**Failure:** 40% of deployments had missing sample data
| Contributing Factor | Warning Sign | Mitigation (AC) |
|---------------------|--------------|-----------------|
| Lambda timeout | CloudWatch alarms | AC-3.1.10: 45s warning |
| Partial failures hidden | Record count mismatch | AC-3.1.9: Validation before SUCCESS |
| No pre-walkthrough check | "Empty database" reports | AC-3.2.14: Data status indicator |

#### Scenario D: "The Underwhelming Wow"
**Failure:** Negative sentiment: "It worked but so what?"
| Contributing Factor | Warning Sign | Mitigation (AC) |
|---------------------|--------------|-----------------|
| Generic examples | "Not relevant to us" feedback | AC-3.11.3: Council terminology |
| No baseline comparison | "We could do this already" | AC-3.11.2: Time-saved calculation |
| Anticlimactic pacing | Low wow_moment_viewed counts | AC-3.11.1: Before/after context |

#### Scenario E: "The Accessibility Lawsuit"
**Failure:** Public sector equality duty violation
| Contributing Factor | Warning Sign | Mitigation (AC) |
|---------------------|--------------|-----------------|
| Screenshot-only instructions | axe-core warnings | AC-3.12.2: Text equivalents |
| Copy button keyboard trap | Accessibility test failures | AC-3.13.1: aria-live announcement |
| Low contrast wow moments | Automated warnings | AC-3.13.3: WCAG AAA (7:1) |

#### Pre-mortem Priority Summary

| Risk | Likelihood | Impact | ACs Added |
|------|------------|--------|-----------|
| **B: Outdated Screenshots** | High | High | AC-3.12.1-4 |
| **A: Walkthrough Abandonment** | High | High | AC-3.10.1-3, AC-3.2.16 |
| **C: Seeding Failures** | Medium | Critical | AC-3.1.9-10, AC-3.2.14-15 |
| **D: Underwhelming Wow** | Medium | High | AC-3.11.1-4, AC-3.9.9 |
| **E: Accessibility** | Low | Critical | AC-3.13.1-4 |

### Devil's Advocate Analysis (Elicitation Enhanced)

*Challenging core assumptions through deliberate opposition:*

#### Challenge 1: "15 Minutes is Fantasy"
**Assumption Challenged:** Council staff have 15 uninterrupted minutes.
**Counter-Reality:** 3-minute windows between meetings; context-switching destroys progress.
**Strengthened By:** AC-3.14.1-3 (Quick Taste mode, Continue Later, self-contained steps)

#### Challenge 2: "Static Guidance Creates Confusion"
**Assumption Challenged:** Users can follow static guides while juggling AWS tabs.
**Counter-Reality:** Tab-switching cognitive load; CloudFormation outputs get lost; AWS sessions expire.
**Strengthened By:** AC-3.15.1-3 (Deep links, checkpoints, session expiry detection)

#### Challenge 3: "UK Data ≠ Relatable Data"
**Assumption Challenged:** Birmingham postcodes resonate with Devon councils.
**Counter-Reality:** UK has 300+ diverse councils; generic UK data is still fake data.
**Strengthened By:** AC-3.16.1-3 (Council type selector, type-specific scenarios, real patterns)

#### Challenge 4: "One Wow Fits None"
**Assumption Challenged:** Universal wow moments impress everyone.
**Counter-Reality:** CTO wants architecture; Service Manager wants time saved; Finance wants cost avoided.
**Strengthened By:** AC-3.11.5-7 (Persona toggles, quantified impact, role-based prompts)

#### Challenge 5: "Deployment ≠ Exploration"
**Assumption Challenged:** Users naturally flow from deployment to walkthrough.
**Counter-Reality:** Deployment creates "done" feeling; users close laptop and forget.
**Strengthened By:** AC-3.10.4-6 (Time-block messaging, social proof, loss aversion)

#### Challenge 6: "Seeding Success ≠ Data Ready"
**Assumption Challenged:** CloudFormation SUCCESS means sample data exists.
**Counter-Reality:** Partial writes, cold starts, throttling create silent failures.
**Strengthened By:** AC-3.1.11-13 (Health check, re-seed button, granular status output)

#### Devil's Advocate Priority Summary

| Assumption Challenged | Blind Spot | Critical AC |
|-----------------------|-----------|-------------|
| 15-minute sessions | No micro-interaction path | AC-3.14.1: Quick Taste |
| Static guidance works | No state verification | AC-3.15.2: Checkpoints |
| UK = realistic | No council-type context | AC-3.16.1: Council selector |
| Universal wow | No persona framing | AC-3.11.5: Persona toggle |
| Natural flow | No expectation setting | AC-3.10.4: Time-block |
| Seeding = ready | No verification | AC-3.1.11: Health check |

### Empathy Map Analysis (Elicitation Enhanced)

*Understanding walkthrough users through what they think, feel, see, say, and do:*

#### Persona: Sarah — Service Manager
| Dimension | Key Insight | Gap Addressed |
|-----------|-------------|---------------|
| **Thinks** | "How do I explain this to my director?" | AC-3.18.1: Stakeholder Summary PDF |
| **Feels** | Overwhelmed by technical jargon | AC-3.17.1: Plain English toggle |
| **Sees** | Cost numbers without context | AC-3.18.3: Full TCO breakdown |
| **Says** | "Show me what it does, not how" | AC-3.17.3: Architecture as optional |
| **Does** | Stops when confused | AC-3.17.2: Inactivity prompt |

#### Persona: David — IT Director/CTO
| Dimension | Key Insight | Gap Addressed |
|-----------|-------------|---------------|
| **Thinks** | "Is this secure enough?" | AC-3.17.4: Security Posture card |
| **Feels** | Curious about architecture | AC-3.17.3: View Architecture |
| **Sees** | CloudFormation template — wants to inspect | AC-3.17.5: Template viewer |
| **Says** | "Show me the architecture diagram" | AC-3.17.3: Inline diagram |
| **Does** | Reviews IAM policies | AC-3.17.4: IAM scope visibility |

#### Persona: Margaret — Finance Director
| Dimension | Key Insight | Gap Addressed |
|-----------|-------------|---------------|
| **Thinks** | "What's the business case?" | AC-3.18.1: Stakeholder Summary |
| **Feels** | Suspicious of tech hype | AC-3.18.3: Honest TCO |
| **Sees** | No ROI numbers | AC-3.18.2: Savings calculator |
| **Says** | "Show me the numbers" | AC-3.18.2: Interactive calculator |
| **Does** | Compares to vendor quotes | AC-3.18.3: Full cost visibility |

#### Empathy Map Priority Summary

| Persona | Top Unmet Need | Critical AC |
|---------|---------------|-------------|
| **Sarah** | Explaining to leadership | AC-3.18.1: Stakeholder Summary |
| **Sarah** | Plain language content | AC-3.17.1: Jargon toggle |
| **David** | Security confidence | AC-3.17.4: Security Posture |
| **David** | Technical depth option | AC-3.17.5: Template viewer |
| **Margaret** | ROI justification | AC-3.18.2: Savings calculator |
| **All** | Shareable evidence | AC-3.18.4: PDF export |

### Service Blueprint Analysis (Elicitation Enhanced)

*Mapping frontstage, backstage, and support processes to reveal hidden service gaps:*

#### Frontstage Gaps (User-Visible)
| Gap | User Impact | Resolution |
|-----|-------------|------------|
| No loading state | Blank screen confusion | AC-3.19.1: Skeleton loader |
| No AI thinking indicator | "Is it broken?" anxiety | AC-3.19.2: Processing message |
| Anticlimactic completion | Missed celebration moment | AC-3.19.3: Confetti animation |
| Abrupt step transitions | Jarring experience | AC-3.19.8: Smooth fade animation |
| Generic error messages | No actionable guidance | AC-3.19.9: Contextual errors |

#### Backstage Gaps (Hidden Infrastructure)
| Gap | Silent Failure Risk | Resolution |
|-----|---------------------|------------|
| No offline support | Network drop breaks experience | AC-3.20.1: Service worker cache |
| localStorage corruption | Lost progress, no warning | AC-3.20.2: Integrity check |
| No prefetching | Perceived slowness | AC-3.20.3: Next step prefetch |
| Clipboard API gaps | Copy fails on older browsers | AC-3.20.4: Fallback method |
| Tab context lost | Steps reference closed tab | AC-3.20.5: "Tab still open?" check |

#### Support Process Gaps
| Gap | Maintenance Risk | Resolution |
|-----|------------------|------------|
| No cache invalidation | Stale content after updates | AC-3.21.1: Cache-busting params |
| No content versioning | Can't track deployed version | AC-3.21.2: Version in footer |
| No browser matrix | Unknown compatibility | AC-3.21.3: Documented support matrix |
| No status link | Users can't self-diagnose | AC-3.21.5: AWS status link |

#### Service Blueprint Priority Summary

| Layer | Gaps Found | ACs Added | Critical Fix |
|-------|-----------|-----------|--------------|
| **Frontstage** | 11 | AC-3.19.1-11 | Loading + celebration |
| **Backstage** | 7 | AC-3.20.1-7 | Offline + integrity |
| **Support** | 5 | AC-3.21.1-5 | Versioning + matrix |

## Test Strategy Summary

### Testing Pyramid for Epic 3

```
                    ┌─────────────────┐
                    │   E2E Tests     │  (Manual)
                    │   - Full walkthrough │  6 tests (1 per scenario)
                    │   - Sample data  │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │      Integration Tests       │  (Automated)
              │  - CloudFormation deployment │  10-15 tests
              │  - Sample data seeding       │
              │  - Accessibility (axe-core)  │
              └──────────────┬───────────────┘
                             │
       ┌─────────────────────┴─────────────────────┐
       │              Unit Tests                    │  (Automated)
       │  - UK data generators                     │  30-40 tests
       │  - Progress tracking logic                │
       │  - Copy-to-clipboard function             │
       └───────────────────────────────────────────┘
```

### Automated Testing Framework

| Test Type | Tool | Trigger | Failure Action |
|-----------|------|---------|----------------|
| **Unit Tests (Data Generators)** | Jest | Every PR | Block merge |
| **Unit Tests (JS Functions)** | Jest | Every PR | Block merge |
| **CloudFormation Validation** | cfn-lint | Every PR | Block merge |
| **Sample Data Seeding** | Integration test | Pre-release | Block release |
| **Accessibility** | axe-core + pa11y | Every PR | Block merge |
| **Screenshot Existence** | Custom script | Every PR | Warn |

### Test Coverage Targets

| Area | Target | Measurement |
|------|--------|-------------|
| UK Data Generators | 95%+ | Jest coverage |
| Walkthrough JS Logic | 90%+ | Jest coverage |
| CloudFormation Templates | Lint pass | cfn-lint |
| Accessibility | 100% pages | axe-core |
| Browser Support | Chrome, Firefox, Safari, Edge | Manual testing |

### Manual Testing Requirements

#### Per-Walkthrough Testing Checklist

| Test | Scope | Owner | Frequency |
|------|-------|-------|-----------|
| Complete Walkthrough End-to-End | All steps in scenario | QA | Per story |
| Sample Data Validation | Data populated correctly | QA | Per deployment |
| Copy-to-Clipboard | All copyable inputs | QA | Per story |
| Progress Persistence | Refresh and resume | QA | Per story |
| Completion Page | All elements display | QA | Per story |
| Keyboard Navigation | All interactive elements | QA | Per story |
| Screen Reader | VoiceOver + NVDA | QA | Per story |
| Mobile Responsiveness | 320px, 768px, 1024px | QA | Per story |

#### User Acceptance Testing

| Persona | Test Scenario | Success Criteria |
|---------|---------------|------------------|
| **CTO** | Complete chatbot walkthrough | Understands AI capability, sees wow moment |
| **Service Manager** | Complete planning AI walkthrough | Recognizes time savings potential |
| **Finance** | Review cost during walkthrough | Understands cost vs value |
| **Developer** | Review sample data structure | Understands technical implementation |

### Test Data Requirements

**Sample Data Test Sets:**
- UK Name Generator: Verify 50 unique names, UK name distribution
- UK Address Generator: Verify valid postcode format (regex), realistic street names
- Service Request Generator: Verify 100 records across 4 categories
- Planning Application Generator: Verify 20 records with required fields
- FOI Document Generator: Verify PII markers are accurate

**Walkthrough Test Data:**
- Council Chatbot: 10 sample questions with expected responses
- Planning AI: 3 sample documents with extractable fields
- FOI Redaction: Documents with 4+ PII types each
- Smart Car Park: 1000 sensor readings (24h history)

### Integration Testing Protocol

**CloudFormation Deployment Tests:**

```bash
# Deploy scenario with sample data
aws cloudformation deploy \
  --template-file cloudformation/council-chatbot.yaml \
  --stack-name test-chatbot-$(date +%s) \
  --capabilities CAPABILITY_IAM

# Verify sample data seeded
aws dynamodb scan --table-name ${STACK_NAME}-KnowledgeBase | jq '.Count'
# Expected: >= 10 entries

# Verify CloudFormation outputs
aws cloudformation describe-stacks --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs'
# Expected: ChatbotURL, DashboardURL outputs present
```

### Accessibility Testing Protocol

**Automated (Every PR):**
```bash
npm run test:a11y:walkthroughs
# Runs pa11y against all walkthrough pages
# Fails on: critical, serious accessibility violations
```

**Manual (Per Story):**
1. Tab through all interactive elements (buttons, links, inputs)
2. Verify focus indicators visible
3. Test copy-to-clipboard with keyboard only (Enter/Space)
4. Test with VoiceOver (macOS) or NVDA (Windows)
5. Verify step announcements read correctly
6. Check color contrast on wow moment callouts

### Performance Testing

**Walkthrough Page Metrics:**
```json
{
  "maxPageLoadTime": "2000ms",
  "maxStepTransitionTime": "100ms",
  "maxCopyToClipboardTime": "50ms"
}
```

**Sample Data Seeding Metrics:**
- Maximum Lambda execution: 60 seconds
- Maximum data records: 1000 per scenario
- Maximum document size: 5MB per file

### Regression Testing Strategy

**Trigger:** Any change to:
- `src/walkthroughs/` content
- `_includes/components/walkthrough-*.njk`
- `assets/js/walkthrough.js`
- `_data/walkthrough-config.yaml`
- `cloudformation/layers/uk-data-generator/`

**Scope:** Full walkthrough E2E test + accessibility audit

### Bug Triage Criteria

| Severity | Definition | Response |
|----------|------------|----------|
| **Critical** | Walkthrough completely blocked, data seeding fails | Fix before merge |
| **High** | Step doesn't work as expected, wrong data displayed | Fix in same sprint |
| **Medium** | Minor UI issue, workaround exists | Fix in next sprint |
| **Low** | Cosmetic, edge case | Backlog |

### Sample Data Validation Tests

| Test | Expected Result | Automated |
|------|-----------------|-----------|
| UK names include common surnames | Smith, Jones, Williams present | Yes |
| Postcodes match UK format | Regex: `^[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}$` | Yes |
| Addresses include street types | Road, Street, Lane, Avenue present | Yes |
| Service requests span 4 categories | Waste, Highways, Housing, Council Tax | Yes |
| No real PII in any sample data | Security review confirms synthetic | Manual |
| SAMPLE markers present | Documents include "SAMPLE" text | Yes |

---

*Document generated: 2025-11-28*
*Status: Ready for Review*
*Open Questions: 3/10 open (Q3.5, Q3.7, Q3.9)*
*Dependencies: Epic 1 (Complete), Epic 2 (In Progress)*
*Next: Story creation and sprint planning*

---

## Elicitation Enhancement Summary

This tech spec was enhanced through 5 advanced elicitation methods:

| Method | ACs Added | Key Contributions |
|--------|-----------|-------------------|
| **Journey Mapping** | +6 | Emotional journey curve, anxiety reduction messaging, save insights |
| **Pre-mortem Analysis** | +21 | 5 failure scenarios, screenshot resilience, accessibility compliance |
| **Devil's Advocate** | +18 | 6 assumption challenges, flexible engagement, council customization |
| **Empathy Map** | +10 | 3 persona analyses, business case tools, stakeholder summaries |
| **Service Blueprint** | +23 | 3-layer service mapping, frontstage polish, backstage resilience |

**Total Enhancement: 61 → 139 ACs (+128%)**
