# Epic Technical Specification: QuickSight Dashboard Exploration

Date: 2025-11-28
Author: cns
Epic ID: 11
Status: Draft

---

## Overview

Epic 11 extends the hands-on exploration framework to the QuickSight Dashboard scenario. Users will explore data visualization, filtering, drill-down capabilities, and report sharing.

This epic follows the patterns established in Epic 6 (Reference Implementation), reusing exploration components and reducing implementation effort by ~40%.

**User Value Statement:** "I understand how to filter data, create visualizations, and share insights with stakeholders."

## Objectives and Scope

### In Scope

- **Story 11.1:** Exploration Landing Page with analytics-focused persona paths
- **Story 11.2:** 5 guided experiments (filtering, drill-down, export, calculated fields, scheduling)
- **Story 11.3:** Architecture tour covering Glue, S3, QuickSight datasets and embedding
- **Story 11.4:** 3 boundary challenges (empty dataset, large date range, complex calculations)
- **Story 11.5:** Production guidance for council reporting integration
- **Story 11.6:** Screenshot automation for QuickSight exploration pages
- Reuse of Epic 6 components
- QuickSight-specific data file: `src/_data/exploration/quicksight.yaml`

### Out of Scope

- Modifications to the core QuickSight CloudFormation template
- Changes to the basic walkthrough (Story 3.7)
- Custom QuickSight themes

### Dependencies

- **Epic 6 (Contexted):** Reusable components established
- **Story 3.7 (Done):** QuickSight Dashboard Walkthrough must exist
- **Deployed QuickSight scenario:** Live dashboard for experiments

## System Architecture Alignment

### QuickSight Analytics Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Data Sources                             │
│                     ├── S3 (CSV/Parquet files)               │
│                     └── Glue Catalog (Schema)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     QuickSight Dataset                       │
│                     ├── SPICE Import (in-memory)             │
│                     ├── Calculated Fields                    │
│                     └── Refresh Schedule                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     QuickSight Analysis                      │
│                     ├── Visuals (charts, tables, KPIs)       │
│                     ├── Parameters (user filters)            │
│                     └── Calculated Metrics                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     QuickSight Dashboard                     │
│                     ├── Published View                       │
│                     ├── Embedded in Portal                   │
│                     └── Scheduled Reports (PDF/Email)        │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Design

### Services and Modules

#### New Files to Create

| File | Purpose | Story |
|------|---------|-------|
| `src/walkthroughs/quicksight/explore/index.njk` | Exploration landing page | 11.1 |
| `src/walkthroughs/quicksight/explore/experiments.njk` | 5 guided experiments | 11.2 |
| `src/walkthroughs/quicksight/explore/architecture.njk` | Visual + Console tours | 11.3 |
| `src/walkthroughs/quicksight/explore/limits.njk` | 3 boundary challenges | 11.4 |
| `src/walkthroughs/quicksight/explore/production.njk` | Production guidance | 11.5 |
| `src/_data/exploration/quicksight.yaml` | Exploration activity metadata | 11.1-11.5 |
| `src/assets/images/exploration/quicksight/` | Screenshot directory | 11.6 |

### Data Models and Contracts

#### Exploration Activity Data Model

```yaml
# src/_data/exploration/quicksight.yaml
scenario_id: quicksight
scenario_title: QuickSight Dashboard
total_time_estimate: "40 minutes"
activities:
  - id: exp1
    title: "Apply Date Range Filters"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "Filters let you focus on specific time periods"
    is_first: true
    safe_badge: true
    interaction: "Use the date picker to select Last 7 Days, Last Month, Custom Range"
    expected_output: "All charts update to show filtered data"
    screenshot: "experiments/exp1-date-filter.png"

  - id: exp2
    title: "Drill Down into Data Points"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "Drill-down reveals detailed information"
    safe_badge: true
    interaction: "Click on a chart bar to see underlying data"
    expected_output: "Detailed table appears showing individual records"
    screenshot: "experiments/exp2-drill-down.png"

  - id: exp3
    title: "Export Charts and Reports"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "Data can be exported for offline analysis"
    safe_badge: true
    export_options:
      - format: "PDF"
        description: "Full dashboard as print-ready document"
      - format: "CSV"
        description: "Underlying data for spreadsheet analysis"
      - format: "PNG"
        description: "Chart image for presentations"
    expected_output: "Download file in chosen format"
    screenshot: "experiments/exp3-export.png"

  - id: exp4
    title: "Create Simple Calculated Field"
    category: experiments
    persona: both
    time_estimate: "10 min"
    learning: "Calculated fields derive new metrics from existing data"
    safe_badge: true
    calculation_examples:
      - name: "Percentage"
        formula: "{completedApplications} / {totalApplications} * 100"
        description: "Completion rate as percentage"
      - name: "Running Total"
        formula: "runningSum({dailyCount})"
        description: "Cumulative count over time"
    expected_output: "New metric appears in visualizations"
    screenshot: "experiments/exp4-calculated-field.png"

  - id: exp5
    title: "Schedule Report Delivery"
    category: experiments
    persona: both
    time_estimate: "5 min"
    learning: "Automated reports keep stakeholders informed"
    safe_badge: true
    schedule_options:
      - frequency: "Daily"
        time: "8:00 AM"
      - frequency: "Weekly"
        day: "Monday"
      - frequency: "Monthly"
        day: "1st"
    delivery_options:
      - type: "Email"
        description: "PDF attached to email"
    expected_output: "Schedule confirmation displayed"
    screenshot: "experiments/exp5-schedule.png"

  # Architecture Tour
  - id: arch-visual
    title: "Visual Architecture Tour"
    category: architecture
    persona: visual
    time_estimate: "10 min"
    learning: "How data flows from source to dashboard"
    steps:
      - title: "Data Stored in S3"
        description: "Your council data lives in cloud storage"
        screenshot: "architecture/step1-s3.png"
      - title: "Glue Catalogs Schema"
        description: "AWS Glue understands the data structure"
        screenshot: "architecture/step2-glue.png"
      - title: "SPICE Loads Data"
        description: "QuickSight's fast engine loads data into memory"
        screenshot: "architecture/step3-spice.png"
      - title: "Visuals Created"
        description: "Charts and tables render from the data"
        screenshot: "architecture/step4-visuals.png"
      - title: "Dashboard Published"
        description: "Final dashboard shared with users"
        screenshot: "architecture/step5-dashboard.png"

  - id: arch-console
    title: "Console Architecture Tour"
    category: architecture
    persona: technical
    time_estimate: "15 min"
    learning: "Navigate AWS Console to see QuickSight configuration"
    steps:
      - title: "S3 Data Bucket"
        console_url: "https://s3.console.aws.amazon.com/s3/"
        what_to_look_for: "Data files, folder structure, formats"
        screenshot: "architecture/console-s3.png"
      - title: "Glue Data Catalog"
        console_url: "https://console.aws.amazon.com/glue/"
        what_to_look_for: "Tables, schemas, crawlers"
        screenshot: "architecture/console-glue.png"
      - title: "QuickSight Datasets"
        console_url: "https://quicksight.aws.amazon.com/"
        what_to_look_for: "Dataset configuration, SPICE capacity"
        screenshot: "architecture/console-datasets.png"
      - title: "QuickSight Analysis"
        console_url: "https://quicksight.aws.amazon.com/"
        what_to_look_for: "Visual types, parameters, calculated fields"
        screenshot: "architecture/console-analysis.png"

  # Boundary Challenges
  - id: limit1
    title: "Filter to Empty Dataset"
    category: limits
    persona: both
    time_estimate: "5 min"
    learning: "Dashboard handles no-data gracefully"
    challenge_description: "Apply filter that matches no records"
    expected_behavior: "Charts show 'No data' message, not errors"
    business_implication: "Users need clear feedback when filters too narrow"
    recovery: "Reset filters to see all data"
    screenshot: "limits/limit1-empty.png"

  - id: limit2
    title: "Large Date Range Query"
    category: limits
    persona: both
    time_estimate: "5 min"
    learning: "Large queries may take longer to load"
    challenge_description: "Select 'All Time' date range (years of data)"
    expected_behavior: "Loading indicator, then results (may be slower)"
    business_implication: "SPICE caching helps, but very large queries need patience"
    recovery: "Use more specific date range for faster results"
    screenshot: "limits/limit2-large-range.png"

  - id: limit3
    title: "Complex Calculated Field"
    category: limits
    persona: both
    time_estimate: "5 min"
    learning: "Complex calculations have limits"
    challenge_description: "Create nested calculated field with multiple operations"
    expected_behavior: "May show syntax error or performance warning"
    business_implication: "Complex analytics may need pre-processing in Glue"
    recovery: "Simplify formula or use pre-calculated fields"
    screenshot: "limits/limit3-complex.png"
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Dashboard initial load | <5 seconds | SPICE in-memory |
| Filter application | <2 seconds | Client-side filtering |
| Export generation | <10 seconds | Server-side rendering |

### Usability

| Requirement | Implementation |
|-------------|----------------|
| Mobile responsive | QuickSight responsive design |
| Keyboard navigation | Native QuickSight support |
| Color contrast | QuickSight themes WCAG compliant |

## Acceptance Criteria (Authoritative)

### Story 11.1: Exploration Landing Page

- [ ] Persona selection for analytics focus
- [ ] 5 Visual-First activities covering data exploration
- [ ] 5 Console activities for QuickSight administration
- [ ] Unique focus areas: filtering, visualization, reporting
- [ ] Reuses Epic 6 layout and components

### Story 11.2: "What Can I Change?" Experiments

- [ ] Experiment 1: Date range filtering
- [ ] Experiment 2: Drill-down into data points
- [ ] Experiment 3: Export (PDF/CSV/PNG)
- [ ] Experiment 4: Create calculated field
- [ ] Experiment 5: Schedule report delivery
- [ ] Interactive dashboard for all experiments

### Story 11.3: "How Does It Work?" Architecture Tour

- [ ] Visual Tour: Data flow from S3 to dashboard (5 steps)
- [ ] Console Tour: S3, Glue, QuickSight datasets/analysis
- [ ] SPICE caching explanation
- [ ] Embedding options overview

### Story 11.4: "Test the Limits" Boundary Exercise

- [ ] Challenge 1: Filter to empty dataset
- [ ] Challenge 2: Large date range query
- [ ] Challenge 3: Complex calculated field
- [ ] Each shows expected behavior and workarounds

### Story 11.5: "Take It Further" Production Guidance

- [ ] Integration with council data sources
- [ ] Row-level security for multi-department access
- [ ] Scheduled report distribution
- [ ] Dashboard embedding options
- [ ] Cost optimization (SPICE vs direct query)

### Story 11.6: Screenshot Automation Pipeline

- [ ] QuickSight pages added to shared pipeline
- [ ] Dashboard states captured (filtered, drilled-down)
- [ ] Export dialogs documented

## Traceability Mapping

| Story | Functional Requirements | Non-Functional Requirements |
|-------|------------------------|----------------------------|
| 11.1 | FR57, FR58, FR59, FR60, FR90 | NFR37, NFR39, NFR40 |
| 11.2 | FR65, FR66, FR67, FR68 | NFR37, NFR39, NFR40 |
| 11.3 | FR69, FR70, FR71, FR83 | NFR37, NFR38, NFR39 |
| 11.4 | FR72, FR73, FR74 | NFR37, NFR39 |
| 11.5 | FR75, FR76, FR77 | NFR39 |
| 11.6 | FR61, FR62, FR63, FR81 | NFR38, NFR44 |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| QuickSight embedding requires authentication | Medium | Medium | Use anonymous embedding for demo |
| SPICE capacity limits in demo | Low | Low | Sample data sized appropriately |

### Assumptions

- QuickSight dashboard accessible in demo account
- Sample data representative of council reporting needs
- SPICE refresh working for demo dataset

## Test Strategy Summary

### Integration Testing

| Test | Method | Automation |
|------|--------|------------|
| Dashboard load | Playwright E2E | GitHub Actions |
| Filter interaction | Playwright E2E | GitHub Actions |
| Export functionality | Download verification | GitHub Actions |

### Manual Testing Checklist

- [ ] Date filter updates all charts
- [ ] Drill-down shows correct details
- [ ] PDF export readable
- [ ] CSV export has correct data
- [ ] Calculated field formula works
- [ ] Schedule confirmation displays
