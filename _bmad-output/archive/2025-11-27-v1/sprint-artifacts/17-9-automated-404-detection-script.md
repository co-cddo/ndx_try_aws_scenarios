# Story 17.9: Automated 404 Detection Script

Status: done

## Story

As a **developer**,
I want **to have an automated script that validates screenshot references**,
so that **we can prevent 404 errors in CI/CD**.

## Acceptance Criteria

1. **AC-17.9.1:** Script reads all 6 screenshot YAML files - DONE
2. **AC-17.9.2:** Script extracts all filename references - DONE
3. **AC-17.9.3:** Script checks each file exists in the corresponding directory - DONE
4. **AC-17.9.4:** Script outputs clear pass/fail with list of missing files - DONE
5. **AC-17.9.5:** Script exits with non-zero code if any files missing - DONE
6. **AC-17.9.6:** Script can be run as npm script (`npm run check:screenshots`) - DONE

## Tasks / Subtasks

- [x] Task 1: Create script file (AC: 1-5)
  - [x] Read YAML files with js-yaml
  - [x] Extract filenames from steps and explore sections
  - [x] Check file existence in screenshots directory
  - [x] Output colored pass/fail results
  - [x] Exit with appropriate code
- [x] Task 2: Add npm script (AC: 6)
  - [x] Add check:screenshots to package.json
  - [x] Test script execution

## Dev Notes

### Script Output Example

```
============================================================
Screenshot 404 Detection Check
============================================================

[FAIL] council-chatbot
      Present: 0/16
      Missing files:
        - step-1-cloudformation-outputs.png
        ...

============================================================
Total: 0 present, 101 missing
============================================================

FAILED: Some screenshots are missing!
```

### File List

- `scripts/check-screenshots.js` - NEW: Screenshot validation script
- `package.json` - MODIFIED: Added check:screenshots script

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. Script correctly identifies all 101 missing screenshots across 6 scenarios
2. Reads from YAML steps and explore sections (architecture, experiments, limits, production)
3. Colored output for easy pass/fail identification
4. Exit code 0 for success, 1 for failures
5. npm script works: `npm run check:screenshots`
