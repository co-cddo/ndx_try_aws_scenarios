# AI Accessibility Features Guide

This guide covers the AI-powered accessibility tools in LocalGov Drupal. Each feature helps make council content more accessible to all users.

**Time to complete:** 12-15 minutes

---

## Overview

LocalGov Drupal includes four AI accessibility features powered by AWS services:

| Feature | What it does | AWS Service | WCAG Criteria | Time |
|---------|--------------|-------------|---------------|------|
| [Auto Alt-Text](#auto-alt-text-generation) | Generates image descriptions automatically | Bedrock Nova 2 Omni | 1.1.1 Non-text Content | 2 min |
| [Listen to Page](#listen-to-page-text-to-speech) | Reads page content aloud in 7 languages | Amazon Polly | 1.1.1, 1.2.1 Audio-only | 3 min |
| [Content Translation](#content-translation) | Translates content to 75+ languages | Amazon Translate | 3.1.1 Language of Page | 2 min |
| [PDF-to-Web Conversion](#pdf-to-web-conversion) | Converts PDFs to accessible HTML | Textract + Bedrock | 1.1.1, 1.3.1, 4.1.2 | 5 min |

---

## Auto Alt-Text Generation

### What it does

When you upload an image to the media library, AI automatically analyses the image and generates a descriptive alt-text. This helps screen reader users understand visual content without requiring manual description writing.

### How to use it

1. **Go to the Media Library**: Navigate to Content → Media → Add media → Image

2. **Upload your image**: Select or drag-drop an image file (JPEG, PNG, or WebP up to 5MB)

3. **Review the generated alt-text**: After upload completes, the Alternative text field shows:
   - AI-generated description
   - "AI-generated" indicator badge
   - Edit button to modify

4. **Edit if needed**: The AI suggestion is a starting point. Adjust the description to:
   - Add context specific to your page
   - Remove unnecessary detail
   - Match your house style

5. **Save the media item**: Click Save to store the image with its alt-text

<!-- Screenshot: 4-9-alttext-upload.png - Media upload form with file selected -->
<!-- Screenshot: 4-9-alttext-generated.png - Alt-text field with AI badge visible -->
<!-- Screenshot: 4-9-alttext-edit.png - Editing the generated alt-text -->

### Try this

> **Your turn:** Upload a photo of your local town hall or a council building. Compare the AI-generated description with what you would have written manually. Notice how the AI identifies architectural features, signage, and context.

### WCAG Context

This feature addresses **WCAG 1.1.1 Non-text Content (Level A)**: All non-text content that is presented to the user has a text alternative that serves the equivalent purpose.

**Barrier addressed:** Users who are blind or have low vision cannot perceive images. Alt-text provides an equivalent text description that screen readers can announce.

**Related success criteria:**
- 1.1.1 Non-text Content (A) - Primary criterion
- 1.4.5 Images of Text (AA) - AI describes text in images

---

## Listen to Page (Text-to-Speech)

### What it does

A TTS button on public pages allows visitors to hear content read aloud. This supports users with visual impairments, reading difficulties, or those who prefer audio content. Seven languages are available, including Welsh.

### How to use it

1. **Find the Listen button**: On any public content page, look for the "Listen to this page" button below the page title

2. **Select your language**: Click the language dropdown to choose from:
   - English (GB)
   - Welsh (Cymraeg)
   - French (Français)
   - Spanish (Español)
   - Polish (Polski)
   - Romanian (Română)
   - Czech (Čeština)

3. **Control playback**: Use the player controls:
   - **Play/Pause**: Start or pause audio (also: Space key)
   - **Stop**: Return to beginning
   - **Speed**: Adjust from 0.5x to 2x
   - **Progress bar**: Jump to any position

4. **Continue browsing**: The player stays visible while you scroll, so you can follow along with the text

<!-- Screenshot: 4-9-tts-player.png - TTS player in initial state -->
<!-- Screenshot: 4-9-tts-language-select.png - Language dropdown expanded -->
<!-- Screenshot: 4-9-tts-playing.png - Player during audio playback -->

### Try this

> **Your turn:** Navigate to the Council Tax service page and click "Listen to this page". Select Welsh (Cymraeg) and notice the natural-sounding voice. Then switch to Romanian - the voice changes to a native Romanian speaker. Try adjusting the speed to 1.5x for faster listening.

### WCAG Context

This feature addresses **WCAG 1.2.1 Audio-only and Video-only (Level A)**: An alternative for time-based media is provided that presents equivalent information.

**Barrier addressed:** Users who have difficulty reading text - whether due to visual impairment, dyslexia, cognitive load, or learning English as a second language - can consume content through audio.

**Related success criteria:**
- 1.1.1 Non-text Content (A) - Audio provides alternative to text
- 1.2.1 Audio-only (A) - Primary criterion
- 3.1.2 Language of Parts (AA) - Correct language pronunciation

---

## Content Translation

### What it does

A translation widget allows visitors to read page content in their preferred language. Amazon Translate provides high-quality machine translation to 75+ languages, making council services accessible to diverse communities.

### How to use it

1. **Find the Translate button**: On public content pages, look for the globe icon and "Translate" button in the page header

2. **Open the language selector**: Click to reveal the language panel with:
   - Search box to find languages quickly
   - Recently used languages at the top
   - Full alphabetical list below

3. **Select your language**: Click a language name. The page content translates while preserving layout and formatting

4. **Notice the translation banner**: A blue banner appears indicating the page is translated, with the selected language name

5. **Revert to English**: Click "View original" in the banner or select English from the language list

<!-- Screenshot: 4-9-translate-widget.png - Translation widget with language search -->
<!-- Screenshot: 4-9-translate-result.png - Page with translation banner visible -->

### Try this

> **Your turn:** Go to the Planning Applications guide page. Click Translate and search for "Polish" in the language selector. Notice how the content translates while keeping the page structure. Now look at the top of the language list - Polish should appear in your "Recent" languages for quick access next time.

### WCAG Context

This feature addresses **WCAG 3.1.1 Language of Page (Level A)**: The default human language of each Web page can be programmatically determined.

**Barrier addressed:** Non-English speakers may not understand council services in English. Translation removes this language barrier, enabling residents from all backgrounds to access information.

**Related success criteria:**
- 3.1.1 Language of Page (A) - Primary criterion
- 3.1.2 Language of Parts (AA) - Preserved language indicators
- 3.1.5 Reading Level (AAA) - Translation may simplify complex text

---

## PDF-to-Web Conversion

### What it does

Legacy PDF documents can be converted to accessible web pages. The system extracts text using Amazon Textract, then uses AI to structure content with proper headings and convert tables to accessible HTML. This addresses a major accessibility barrier - PDF documents are often inaccessible to screen readers.

### How to use it

1. **Access the conversion form**: Go to Content → Convert PDF to Web Content

2. **Upload your PDF**: Use the file upload field to select a PDF document (maximum 5MB)

3. **Enter a page title**: Provide a title for the web page that will be created

4. **Start conversion**: Click "Convert PDF" and watch the progress:
   - Extracting text from PDF...
   - Analysing document structure...
   - Creating accessible HTML...
   - Conversion complete

5. **Preview the result**: Review the generated content in the preview panel:
   - Check heading structure
   - Verify table formatting
   - Note the statistics (pages, tables, words, confidence)

6. **Create the draft**: Click "Create Draft Page" to save as an unpublished Drupal page

7. **Edit and publish**: The node edit form opens - refine the content, then publish when ready

<!-- Screenshot: 4-9-pdf-upload.png - PDF conversion form with file upload -->
<!-- Screenshot: 4-9-pdf-progress.png - Progress bar during conversion -->
<!-- Screenshot: 4-9-pdf-preview.png - Preview panel showing converted content -->
<!-- Screenshot: 4-9-pdf-draft.png - Draft page in node edit form -->

### Try this

> **Your turn:** Find a sample council leaflet or policy document in PDF format. Upload it to the conversion form and watch the AI analyse the structure. Pay attention to how tables are converted with proper headers and captions. After creating the draft, check the heading hierarchy in the editor - does it make sense?

### WCAG Context

This feature addresses multiple WCAG success criteria:

**WCAG 1.1.1 Non-text Content (A)**: Images in PDFs are identified and marked for alt-text.

**WCAG 1.3.1 Info and Relationships (A)**: Tables are converted with proper `<th>` headers and scope attributes. Headings use semantic HTML (h2, h3).

**WCAG 4.1.2 Name, Role, Value (A)**: Generated HTML uses proper semantic elements that assistive technologies can interpret.

**Barrier addressed:** PDF documents often lack proper structure, have inaccessible tables, and cannot be read by screen readers. Converting to semantic HTML makes this content accessible to all users.

**Related success criteria:**
- 1.1.1 Non-text Content (A)
- 1.3.1 Info and Relationships (A)
- 1.3.2 Meaningful Sequence (A)
- 2.4.6 Headings and Labels (AA)
- 4.1.2 Name, Role, Value (A)

---

## Accessibility Talking Points

When demonstrating these features to colleagues or leadership, consider these key messages:

### For Digital Teams

- AI assistance reduces manual accessibility work without replacing human judgement
- Generated alt-text and conversions are starting points, not final outputs
- Integration with existing Drupal workflow means no new tools to learn

### For Accessibility Officers

- Each feature directly addresses WCAG 2.2 Level AA success criteria
- TTS and translation support the council's duties under the Equality Act 2010
- PDF conversion tackles a persistent accessibility debt problem

### For Senior Leadership

- AI accessibility features demonstrate innovation in public service delivery
- Multi-language support serves diverse communities without additional staff
- Automated alt-text addresses a common audit finding at scale

---

## Next Steps

After exploring these AI accessibility features:

1. **Return to the main walkthrough** to explore AI content editing features
2. **Visit the Explore page** on the portal to see all available features
3. **Generate an Evidence Pack** to share your experience with colleagues

---

## Further Reading

- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [GOV.UK Accessibility Requirements](https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps)
- [LocalGov Drupal Accessibility](https://localgovdrupal.org/accessibility)
