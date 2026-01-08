# Story 6.4: Portal Understand Page

Status: done

## Story

As a **technical decision-maker**,
I want **architecture diagrams and explanations**,
So that **I understand how the AI features work under the hood**.

## Acceptance Criteria

1. **Given** I navigate to the Understand page on the portal
   **When** the page loads
   **Then** I see:
   - High-level architecture diagram (CDK → AWS services)
   - Component breakdown for each AI feature
   - Data flow explanations (e.g., "Image → Nova 2 Omni → Alt-text")
   - AWS service icons and names

2. **Given** the architecture diagrams are displayed
   **When** I view them
   **Then** diagrams are accessible (alt-text, text alternatives)

3. **Given** I view technical terms
   **When** clicking on AWS services
   **Then** technical terms link to AWS documentation

4. **Given** the page loads
   **When** JavaScript is disabled
   **Then** the page works without JavaScript (progressive enhancement)

## Tasks / Subtasks

- [x] **Task 1: Create Architecture Data** (AC: 1, 3)
  - [x] 1.1 Create `src/_data/architecture/localgov-drupal.yaml`
  - [x] 1.2 Define high-level architecture components (CDK, ECS, RDS, etc.)
  - [x] 1.3 Define AI feature data flows for all 7 features
  - [x] 1.4 Include AWS service icons and documentation links

- [x] **Task 2: Create Understand Page Template** (AC: 1, 2, 4)
  - [x] 2.1 Create `src/walkthroughs/localgov-drupal/explore/understand/index.njk`
  - [x] 2.2 Use `page` layout with appropriate front matter
  - [x] 2.3 Include phase-navigator and breadcrumb navigation
  - [x] 2.4 Ensure content works without JavaScript

- [x] **Task 3: Create Architecture Diagram Component** (AC: 1, 2)
  - [x] 3.1 Inline SVG diagram in understand/index.njk (no separate component needed)
  - [x] 3.2 Use SVG-based diagrams with proper accessibility
  - [x] 3.3 Include detailed alt-text for screen readers via figcaption
  - [x] 3.4 Provide text alternative via GOV.UK Details component

- [x] **Task 4: Create Data Flow Component** (AC: 1, 2)
  - [x] 4.1 Create `src/_includes/components/data-flow-card.njk`
  - [x] 4.2 Display step-by-step data flow for each AI feature
  - [x] 4.3 Use arrows/icons to show data transformation
  - [x] 4.4 Include AWS service icons (7 icon types)

- [x] **Task 5: Add AWS Service Links** (AC: 3)
  - [x] 5.1 Link each AWS service name to official documentation
  - [x] 5.2 Use external link icon pattern from GOV.UK
  - [x] 5.3 Open links in new tabs with proper security attributes (rel="noopener noreferrer")

- [x] **Task 6: Implement Cost Information Section** (AC: 1)
  - [x] 6.1 Add cost overview per AI feature (in data-flow-card costNote)
  - [x] 6.2 Link to AWS pricing pages
  - [x] 6.3 Include disclaimer about demo vs production costs (govuk-warning-text)

- [x] **Task 7: Verify Build and Accessibility** (AC: 1, 2, 3, 4)
  - [x] 7.1 Run `npm run build` to verify page builds - 110 files generated
  - [x] 7.2 Verify responsive layout via CSS media queries
  - [x] 7.3 Test with JavaScript disabled - all content is static HTML/CSS
  - [x] 7.4 Verify screen reader accessibility - visually-hidden text, ARIA labels

## Dev Notes

### Architecture Components to Document

| Layer | Components |
|-------|------------|
| Infrastructure | CDK (TypeScript), CloudFormation |
| Compute | ECS Fargate, Application Load Balancer |
| Database | Aurora MySQL Serverless v2 |
| Storage | EFS (files), S3 (media/cache) |
| AI Services | Bedrock (Nova 2 Pro/Lite/Omni), Polly, Translate, Textract, Rekognition |

### AI Feature Data Flows

| Feature | Data Flow |
|---------|-----------|
| AI Content Editing | Text → Bedrock Nova Pro → Improved text |
| Readability Simplification | Complex text → Bedrock Nova Lite → Plain English |
| Auto Alt-Text | Image → Bedrock Nova Lite Vision → Alt-text |
| Text-to-Speech | Page text → Amazon Polly → MP3 audio |
| Content Translation | English → Amazon Translate → 75+ languages |
| PDF-to-Web | PDF → Textract → Bedrock → Structured HTML |
| Dynamic Council | Seed → Bedrock → Identity + Content + Images |

### AWS Service Documentation Links

- Bedrock: https://docs.aws.amazon.com/bedrock/
- Polly: https://docs.aws.amazon.com/polly/
- Translate: https://docs.aws.amazon.com/translate/
- Textract: https://docs.aws.amazon.com/textract/
- ECS: https://docs.aws.amazon.com/ecs/
- Aurora: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/

### Existing Patterns to Follow

- `experiment-card.njk` - Card component pattern from Story 6.3
- `ai-feature-card.njk` - Card component pattern from Story 6.2
- `phase-navigator.njk` - Phase/progress tracking
- GOV.UK Design System patterns for external links

### File Structure

```
src/
├── _data/
│   └── architecture/
│       └── localgov-drupal.yaml     # Architecture definitions
├── _includes/
│   └── components/
│       ├── architecture-diagram.njk  # High-level diagram
│       └── data-flow-card.njk        # Feature data flow
├── walkthroughs/
│   └── localgov-drupal/
│       └── explore/
│           └── understand/
│               └── index.njk          # New page
```

### Design Considerations

- Diagrams should be simple and scannable
- Use GOV.UK colours for visual hierarchy
- Progressive enhancement: text content works without diagrams
- Technical audience but plain language explanations
- Mobile-friendly: diagrams scale appropriately

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-03 | Story created from epics | SM Agent |
