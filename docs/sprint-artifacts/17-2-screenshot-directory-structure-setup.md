# Story 17.2: Screenshot Directory Structure Setup

Status: done

## Story

As a **developer**,
I want **to create the directory structure for git-based screenshots**,
so that **screenshot files have a consistent location in the repository**.

## Acceptance Criteria

1. **AC-17.2.1:** Create `src/assets/images/screenshots/` directory - DONE
2. **AC-17.2.2:** Create subdirectory for each of 6 scenarios - DONE
3. **AC-17.2.3:** Verify Eleventy passthrough copy includes screenshots directory - DONE
4. **AC-17.2.4:** Add `.gitkeep` files to maintain empty directories in git - DONE
5. **AC-17.2.5:** Verify directory structure matches YAML data file references - DONE

## Tasks / Subtasks

- [x] Task 1: Create root screenshots directory (AC: 1)
  - [x] mkdir src/assets/images/screenshots/
- [x] Task 2: Create scenario subdirectories (AC: 2)
  - [x] council-chatbot/
  - [x] planning-ai/
  - [x] foi-redaction/
  - [x] smart-car-park/
  - [x] text-to-speech/
  - [x] quicksight-dashboard/
- [x] Task 3: Verify Eleventy passthrough (AC: 3)
  - [x] Check eleventy.config.js includes src/assets
- [x] Task 4: Add .gitkeep files (AC: 4)
  - [x] Add .gitkeep to each scenario directory
- [x] Task 5: Verify YAML alignment (AC: 5)
  - [x] council-chatbot.yaml references council-chatbot/
  - [x] All other YAML files reference matching directories

## Dev Notes

### Directory Structure Created

```
src/assets/images/screenshots/
├── council-chatbot/
│   └── .gitkeep
├── planning-ai/
│   └── .gitkeep
├── foi-redaction/
│   └── .gitkeep
├── smart-car-park/
│   └── .gitkeep
├── text-to-speech/
│   └── .gitkeep
└── quicksight-dashboard/
    └── .gitkeep
```

### Eleventy Configuration

Passthrough copy already configured in eleventy.config.js:
```javascript
eleventyConfig.addPassthroughCopy('src/assets');
```

### File List

- `src/assets/images/screenshots/council-chatbot/.gitkeep` - NEW
- `src/assets/images/screenshots/planning-ai/.gitkeep` - NEW
- `src/assets/images/screenshots/foi-redaction/.gitkeep` - NEW
- `src/assets/images/screenshots/smart-car-park/.gitkeep` - NEW
- `src/assets/images/screenshots/text-to-speech/.gitkeep` - NEW
- `src/assets/images/screenshots/quicksight-dashboard/.gitkeep` - NEW

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. Created screenshot directories for all 6 scenarios
2. Added .gitkeep files to maintain empty directories
3. Eleventy passthrough already configured for src/assets
4. Directory names match YAML data file scenario IDs
