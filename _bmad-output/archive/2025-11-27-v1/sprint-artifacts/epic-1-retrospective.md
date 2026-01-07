# Epic 1 Retrospective: Portal Foundation & Discovery

**Date:** 2025-11-28
**Facilitator:** Bob (Scrum Master - AI)
**Participants:** cns

---

## Epic Summary

| Metric | Value |
|--------|-------|
| Epic | 1 - Portal Foundation & Discovery |
| Stories Completed | 4/4 (100%) |
| Duration | Sprint 1 |
| Status | COMPLETE |

### Stories Delivered

| Story | Title | Status | Code Review |
|-------|-------|--------|-------------|
| 1.1 | Portal Foundation - Homepage, Navigation & Build Infrastructure | Done | Approved |
| 1.2 | Scenario Selector Quiz - 3-Question Discovery Flow | Done | Approved |
| 1.3 | Scenario Gallery - Cards, Filtering, Metadata | Done | Approved |
| 1.4 | Quick-Start Guide - Your 15-Minute Journey | Done | Approved |

---

## What Went Well

### 1. GOV.UK Frontend Integration
The @x-govuk/govuk-eleventy-plugin provided excellent baseline accessibility and consistent styling. Successfully upgraded to Eleventy 3.x for plugin compatibility.

### 2. Schema Validation Pipeline
AJV-based validation with actionable error messages. Both `scenarios.yaml` and `quizConfig.yaml` validate successfully. CI gate blocks bad data from entering the build.

### 3. Progressive Enhancement
All 3 interactive features (quiz, gallery filters, journey steps) work without JavaScript. IIFE pattern applied consistently across all JavaScript modules.

### 4. Build Performance
0.48s build time is excellent for developer experience. Schema validation adds only ~2s. Well under the 3-minute target.

### 5. Accessibility First
pa11y and Lighthouse CI configured in pipeline. GOV.UK Frontend provides WCAG 2.2 AA baseline. Only third-party footer SVG issue found (not our code).

### 6. Code Review Quality
Every story received AI-assisted code review with detailed AC validation tables and task completion verification. Zero false completions detected.

---

## What Could Improve

### 1. Missing .gitignore
Story 1.1 code review noted missing .gitignore file. Need to add before pushing to main branch.

### 2. GOV.UK CSS Loading Issue
The `stylesheets` option in eleventy.config.js was overriding the default GOV.UK CSS. Required creating `src/assets/application.scss` to properly import GOV.UK Frontend + custom styles. This configuration pattern should be documented.

### 3. Manual Testing Gaps
Task 6 items (keyboard navigation, screen reader, timing) consistently marked incomplete across stories. Need to schedule dedicated manual testing time.

### 4. Missing Explicit Dependency
`js-yaml` used transitively but not declared explicitly in package.json. Should add to prevent future npm install failures.

### 5. File Naming Inconsistency
Mix of kebab-case (`scenarios.yaml`) and camelCase (`quizConfig.yaml`). Should standardize on one convention.

---

## Key Learnings

| Learning | Context | Apply To |
|----------|---------|----------|
| Use `.njk` extension for HTML-heavy pages | Markdown wraps content unexpectedly in paragraphs | All future pages with complex HTML |
| Eleventy 3.x requires ESM format | `export default` not `module.exports` | All config file updates |
| YAML data extension must be registered | `addDataExtension('yaml,yml', ...)` required in Eleventy 3.x | Eleventy setup documentation |
| GOV.UK breakpoints: 641px, 1020px | Not 768px, 1024px as commonly assumed | All responsive CSS |
| Schema validation catches errors early | AJV with `allErrors: true` provides all issues at once | All data files |
| Progressive enhancement via IIFE | `hidden` attribute + JS enhancement pattern | All interactive features |
| Don't override `stylesheets` option | Use `application.scss` to include GOV.UK + custom CSS | Eleventy config |

---

## Technical Debt Identified

| Item | Priority | Owner | Target |
|------|----------|-------|--------|
| Add `.gitignore` file | High | Dev | Before Epic 2 |
| Add `js-yaml` to package.json | Medium | Dev | Before Epic 2 |
| Complete manual accessibility tests | Medium | QA | Before production |
| Document application.scss pattern | Low | Tech Writer | Sprint 2 |
| Standardize YAML filename convention | Low | Dev | Sprint 2 |

---

## Impact on Epic 2

### What's Ready
- Scenarios data structure (`scenarios.yaml`) with comprehensive metadata
- Schema validation pipeline (ready to extend)
- GOV.UK Frontend + Eleventy build working correctly
- Navigation structure ready for scenario pages
- CSS organization pattern established
- Quiz → Scenario routing in place

### What Needs Attention for Epic 2
- Create individual scenario detail pages (one per scenario)
- Add architecture diagram rendering (Mermaid.js)
- Add CloudFormation deployment integration
- Document extension pattern for new scenarios
- Address technical debt items above

---

## Retrospective Grade

**Overall: A-**

| Category | Score | Notes |
|----------|-------|-------|
| Completion | 5/5 | 4/4 stories delivered |
| Quality | 4/5 | All code reviews approved, 3 medium issues noted |
| Accessibility | 4/5 | Automated tests pass, manual tests pending |
| Architecture | 5/5 | ADRs followed, progressive enhancement achieved |
| Documentation | 4/5 | Dev notes comprehensive, some gaps remain |

---

## Action Items for Next Epic

1. **[High]** Fix technical debt before starting Epic 2 (gitignore, js-yaml, CSS documentation)
2. **[Medium]** Complete manual accessibility testing for Stories 1.1-1.4
3. **[Medium]** Establish scenario detail page template before Epic 2 stories
4. **[Low]** Document learnings in project README or contributing guide

---

## Appendix: Files Created in Epic 1

### Pages
- `src/index.md` - Homepage with hero, trust indicators, scenario preview
- `src/quiz.md` - 3-question scenario selector quiz
- `src/scenarios/index.njk` - Scenario gallery with filtering
- `src/get-started.njk` - 6-step journey guide
- `src/accessibility.md` - Accessibility statement
- `src/contact.md` - Contact page
- `src/404.md` - Custom 404 error page

### JavaScript
- `src/assets/js/quiz.js` - Quiz logic with progressive enhancement (462 lines)
- `src/assets/js/gallery-filter.js` - Gallery filtering with URL params

### Data
- `src/_data/scenarios.yaml` - 6 scenario definitions with metadata
- `src/_data/quizConfig.yaml` - Quiz questions, options, weights
- `src/_data/navigation.yaml` - Navigation structure
- `src/_data/site.yaml` - Global site configuration

### Schemas
- `schemas/scenario.schema.json` - Scenario data validation
- `schemas/quiz-config.schema.json` - Quiz config validation

### Infrastructure
- `eleventy.config.js` - Eleventy 3.x ESM configuration
- `package.json` - Dependencies and scripts
- `.github/workflows/build-deploy.yml` - CI/CD pipeline
- `.pa11yci.json` - Accessibility test configuration
- `lighthouserc.js` - Performance test configuration
- `scripts/validate-schema.js` - Schema validation script

### Styles
- `src/assets/css/custom.css` - Custom styles (~500 lines)
- `src/assets/application.scss` - SCSS entry point (GOV.UK + custom)

---

*Retrospective completed: 2025-11-28*
*Next epic: Epic 2 - Scenario Deep-Dives*
