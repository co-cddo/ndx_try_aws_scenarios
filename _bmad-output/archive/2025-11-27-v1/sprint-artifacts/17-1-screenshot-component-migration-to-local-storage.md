# Story 17.1: Screenshot Component Migration to Local Storage

Status: done

## Story

As a **developer**,
I want **to update the screenshot component to reference local git-based storage**,
so that **screenshots work without external S3 dependencies**.

## Acceptance Criteria

1. **AC-17.1.1:** `baseUrl` changed from S3 to `/assets/images/screenshots` - DONE
2. **AC-17.1.2:** Remove WebP source variants (simplify to PNG only initially) - DONE
3. **AC-17.1.3:** Remove responsive srcset (use single image size) - DONE
4. **AC-17.1.4:** Fallback mechanism still works for missing images - DONE (unchanged)
5. **AC-17.1.5:** Component passes existing accessibility requirements - DONE
6. **AC-17.1.6:** No changes required to screenshot YAML data files - DONE

## Tasks / Subtasks

- [x] Task 1: Update baseUrl (AC: 1)
  - [x] Change from S3 URL to /assets/images/screenshots
  - [x] Update component documentation comments
- [x] Task 2: Simplify image handling (AC: 2, 3)
  - [x] Remove WebP source variants
  - [x] Remove responsive srcset
  - [x] Keep single PNG image format
- [x] Task 3: Verify fallback mechanism (AC: 4)
  - [x] Confirm onerror handler still works
  - [x] Confirm fallback SVG paths unchanged
- [x] Task 4: Verify accessibility (AC: 5)
  - [x] Alt text handling unchanged
  - [x] Keyboard zoom trigger unchanged
- [x] Task 5: Verify no YAML changes needed (AC: 6)
  - [x] Screenshot data files reference filenames only
  - [x] Component constructs full path from scenario + filename

## Dev Notes

- Original S3 URL: `https://ndx-try-screenshots.s3.us-west-2.amazonaws.com/current`
- New local path: `/assets/images/screenshots`
- Simplified from picture element with WebP/responsive to single img tag
- Can re-enable responsive variants with image optimization pipeline later

### File List

- `src/_includes/components/screenshot.njk` - MODIFIED: Changed baseUrl and simplified image handling

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. Changed baseUrl from S3 to local path
2. Simplified from picture element to single img tag
3. Removed WebP and responsive srcset (can be re-enabled later)
4. Fallback mechanism preserved
5. No changes to YAML data files required
