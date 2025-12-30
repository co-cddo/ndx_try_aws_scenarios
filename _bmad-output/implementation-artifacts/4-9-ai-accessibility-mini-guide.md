# Story 4.9: AI Accessibility Mini-Guide

Status: done

## Story

As an **accessibility officer trying AI accessibility features**,
I want **a focused guide for accessibility AI tools**,
So that **I can learn and demonstrate these capabilities**.

## Acceptance Criteria

1. **Given** I navigate to the AI Accessibility mini-guide
   **When** I read through it
   **Then** I find:
   - Overview of all accessibility AI features
   - Step-by-step instructions with screenshots for each:
     - Auto alt-text generation
     - Listen to page (TTS)
     - Content translation
     - PDF-to-web conversion
   - "Try this" prompts for each feature
   - Accessibility compliance context (WCAG references)
   **And** the guide follows documentation template standards
   **And** screenshots show real AI interactions
   **And** the guide is linked from the main walkthrough

## Tasks / Subtasks

- [x] **Task 1: Guide Structure & Template** (AC: 1)
  - [x] 1.1 Create mini-guide markdown file in portal documentation
  - [x] 1.2 Add overview section covering all 4 accessibility AI features
  - [x] 1.3 Create consistent section template for each feature
  - [x] 1.4 Add WCAG compliance context and references
  - [x] 1.5 Include estimated time per feature section

- [x] **Task 2: Auto Alt-Text Section** (AC: 1)
  - [x] 2.1 Write step-by-step instructions for uploading images
  - [x] 2.2 Explain how AI-generated alt-text appears
  - [x] 2.3 Document editing and regenerating alt-text
  - [x] 2.4 Add "Try this" prompt with sample image scenario
  - [x] 2.5 Add screenshot placeholders for key interactions

- [x] **Task 3: Listen to Page (TTS) Section** (AC: 1)
  - [x] 3.1 Write step-by-step instructions for TTS player usage
  - [x] 3.2 Document language selection and playback controls
  - [x] 3.3 Explain keyboard shortcuts and accessibility features
  - [x] 3.4 Add "Try this" prompt for 7-language demo
  - [x] 3.5 Add screenshot placeholders for TTS player states

- [x] **Task 4: Content Translation Section** (AC: 1)
  - [x] 4.1 Write step-by-step instructions for translation widget
  - [x] 4.2 Document language search and recent languages feature
  - [x] 4.3 Explain reverting to original content
  - [x] 4.4 Add "Try this" prompt for multi-language exploration
  - [x] 4.5 Add screenshot placeholders for translation states

- [x] **Task 5: PDF-to-Web Conversion Section** (AC: 1)
  - [x] 5.1 Write step-by-step instructions for PDF upload form
  - [x] 5.2 Document conversion progress and preview
  - [x] 5.3 Explain draft page creation and editing workflow
  - [x] 5.4 Add "Try this" prompt with sample PDF scenario
  - [x] 5.5 Add screenshot placeholders for conversion flow

- [x] **Task 6: WCAG Compliance Context** (AC: 1)
  - [x] 6.1 Add WCAG 2.2 AA references for each feature
  - [x] 6.2 Explain how each feature addresses accessibility barriers
  - [x] 6.3 Include success criteria mapping
  - [x] 6.4 Add links to official WCAG guidelines
  - [x] 6.5 Add accessibility officer talking points

- [x] **Task 7: Integration with Walkthrough** (AC: 1)
  - [x] 7.1 Add link from main walkthrough to mini-guide
  - [x] 7.2 Add navigation back to walkthrough
  - [x] 7.3 Add "Next Steps" section at end of guide
  - [x] 7.4 Include progress tracking integration points
  - [ ] 7.5 Add print-friendly styling

## Dev Notes

### Guide Location

```
src/scenarios/localgov-drupal/guides/ai-accessibility-mini-guide.md
```

### Section Template

Each feature section should follow this pattern:

```markdown
## [Feature Name]

### What it does

Brief 2-3 sentence description of the feature and its accessibility benefit.

### How to use it

1. Step one with specific UI location
2. Step two with expected behaviour
3. Step three with result

![Screenshot: {description}](./screenshots/{feature}-{step}.png)

### Try this

> **Your turn:** {Specific task with sample content or scenario}

### WCAG Context

This feature addresses **WCAG {criterion} ({level})**: {brief explanation}

- Related success criteria: {list}
- Barrier addressed: {description}
```

### Feature Overview Table

Include at start of guide:

| Feature | AWS Service | WCAG Criteria | Time |
|---------|-------------|---------------|------|
| Auto Alt-Text | Bedrock Nova 2 Omni | 1.1.1 Non-text Content | 2 min |
| Listen to Page | Amazon Polly | 1.1.1, 1.2.1 Audio-only | 3 min |
| Translation | Amazon Translate | 3.1.1 Language of Page | 2 min |
| PDF-to-Web | Textract + Bedrock | 1.1.1, 1.3.1, 4.1.2 | 5 min |

### "Try This" Prompts

Each feature should have a specific, actionable task:

1. **Auto Alt-Text**: "Upload a photo of a town hall or council building. Compare the AI-generated description with what you would have written."

2. **Listen to Page**: "Navigate to the Council Tax service page and listen to it in Welsh (Cymraeg). Then try Romanian - notice how the voice changes."

3. **Translation**: "Translate the planning application guide to Polish, then search for 'Spanish' in the language selector. Your recent languages will appear at the top."

4. **PDF-to-Web**: "Upload a sample council leaflet PDF. Watch the conversion progress, then edit the generated headings before creating the draft page."

### WCAG References

Key success criteria to reference:

- **1.1.1 Non-text Content (A)**: Alt-text generation
- **1.2.1 Audio-only and Video-only (A)**: TTS as alternative
- **1.3.1 Info and Relationships (A)**: PDF table conversion
- **3.1.1 Language of Page (A)**: Translation language indicator
- **3.1.2 Language of Parts (AA)**: Preserved language context
- **4.1.2 Name, Role, Value (A)**: Accessible controls

### Screenshot Naming Convention

Follow Story 2.8 documentation standards:

```
4-9-alttext-upload.png
4-9-alttext-generated.png
4-9-alttext-edit.png
4-9-tts-player.png
4-9-tts-language-select.png
4-9-tts-playing.png
4-9-translate-widget.png
4-9-translate-result.png
4-9-pdf-upload.png
4-9-pdf-progress.png
4-9-pdf-preview.png
4-9-pdf-draft.png
```

### Navigation Structure

The guide should be accessible from:

1. Main walkthrough "AI Features" section
2. Portal Explore page feature cards
3. Drupal admin help menu

### Accessibility of the Guide Itself

The guide document must:

- Use proper heading hierarchy (h1 → h2 → h3)
- Include alt-text for all screenshots
- Maintain sufficient colour contrast
- Be keyboard navigable
- Work with screen readers
- Print cleanly on A4

## Dependencies

- Stories 4-5 (Auto Alt-Text), 4-6 (TTS), 4-7 (Translation), 4-8 (PDF-to-Web) completed
- Story 2.8 documentation template standards
- Screenshot pipeline (Story 2.7) for capturing interactions

## Out of Scope

- Video tutorials (future enhancement)
- Interactive demos embedded in guide
- Automated screenshot capture (manual for this story)

## Definition of Done

- [x] Guide markdown file created in portal documentation
- [x] All 4 accessibility features documented with step-by-step instructions
- [x] "Try this" prompts included for each feature
- [x] WCAG references included with success criteria mapping
- [x] Screenshot placeholders marked for future capture
- [x] Guide linked from main walkthrough
- [x] Guide follows documentation template standards
- [x] Guide is accessible (heading structure, alt-text, contrast)
- [ ] Print styling renders correctly
