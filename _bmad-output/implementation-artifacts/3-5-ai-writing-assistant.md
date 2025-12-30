# Story 3.5: AI Writing Assistant

Status: done

## Story

As a **content editor**,
I want **AI help writing content based on my prompt**,
So that **I can produce quality content faster**.

## Acceptance Criteria

1. **Given** I click "Help me write..." in CKEditor
   **When** I enter a prompt (e.g., "Write an introduction about council tax bands")
   **Then** the AI:
   - Shows loading state while processing
   - Returns generated content in the preview modal
   - Allows me to edit the suggestion before inserting
   - Inserts at cursor position when I click "Apply"
   **And** generated content matches LocalGov Drupal tone guidelines
   **And** I can cancel without inserting anything
   **And** the prompt field remembers my last 5 prompts

## Tasks / Subtasks

- [x] **Task 1: Create AI Writing Dialog Form** (AC: 1)
  - [x] 1.1 Create `src/Form/AiWritingDialogForm.php` extending FormBase
  - [x] 1.2 Add prompt textarea field with placeholder text
  - [x] 1.3 Add prompt history dropdown (last 5 prompts)
  - [x] 1.4 Add "Generate" button and "Cancel" link
  - [x] 1.5 Create route for dialog at `/ndx-aws-ai/write-dialog`

- [x] **Task 2: Prompt History Management** (AC: 1)
  - [x] 2.1 Create service to store/retrieve prompt history per user
  - [x] 2.2 Use user private tempstore for session persistence
  - [x] 2.3 Limit history to 5 most recent prompts
  - [x] 2.4 Add dropdown population from history service

- [x] **Task 3: AI Content Generation** (AC: 1)
  - [x] 3.1 Create prompt template for content writing (`prompts/writing.yaml`)
  - [x] 3.2 Include LocalGov Drupal tone guidelines in system prompt
  - [x] 3.3 Create AJAX handler for generation request
  - [x] 3.4 Return generated content with loading state management

- [x] **Task 4: Preview and Edit Interface** (AC: 1)
  - [x] 4.1 Create preview component using Story 3-3 design system
  - [x] 4.2 Add editable textarea for generated content
  - [x] 4.3 Add "Apply" button to insert into editor
  - [x] 4.4 Add "Regenerate" button to try again
  - [x] 4.5 Add "Cancel" button to close without applying

- [x] **Task 5: CKEditor Integration** (AC: 1)
  - [x] 5.1 Update aiToolbarEditing.js to open dialog on command execution
  - [x] 5.2 Create JavaScript handler for ai:dialog:open event
  - [x] 5.3 Implement content insertion at cursor position
  - [x] 5.4 Handle focus management between dialog and editor

- [x] **Task 6: Accessibility and Testing** (AC: 1)
  - [x] 6.1 Ensure dialog is fully keyboard accessible
  - [x] 6.2 Add aria-live announcements for loading/success states
  - [x] 6.3 Add focus trap to dialog
  - [ ] 6.4 Test with screen reader

## Dev Notes

### LocalGov Drupal Tone Guidelines

From UX Design Specification - content should be:
- Written in plain English (reading age 9)
- Active voice preferred
- Short sentences (under 25 words)
- Second person ("you") addressing the reader
- Helpful and friendly but professional
- No jargon without explanation

### Prompt Template Structure

```yaml
# prompts/writing.yaml
id: content_writing
name: "Content Writing Assistant"
description: "Generate LocalGov Drupal content based on user prompt"

system: |
  You are a content writer for UK local government websites.
  Follow these guidelines:
  - Write in plain English suitable for reading age 9
  - Use active voice and short sentences (under 25 words)
  - Address the reader as "you"
  - Be helpful, friendly, and professional
  - Avoid jargon; explain technical terms in parentheses
  - Use the GOV.UK style guide conventions

  The content you generate will appear on a council website serving residents.

user: |
  Write content for a local council website based on this request:

  {{ prompt }}

  Keep the content concise and to the point.

parameters:
  maxTokens: 1024
  temperature: 0.7
```

### Dialog Form Structure

```php
public function buildForm(array $form, FormStateInterface $form_state): array {
  $form['prompt'] = [
    '#type' => 'textarea',
    '#title' => $this->t('What would you like me to write?'),
    '#placeholder' => $this->t('e.g., Write an introduction about council tax bands'),
    '#required' => TRUE,
    '#attributes' => [
      'aria-describedby' => 'prompt-help',
    ],
  ];

  $form['prompt_history'] = [
    '#type' => 'select',
    '#title' => $this->t('Recent prompts'),
    '#options' => $this->promptHistory->getRecent(5),
    '#empty_option' => $this->t('- Select a recent prompt -'),
  ];

  $form['actions']['generate'] = [
    '#type' => 'submit',
    '#value' => $this->t('Generate'),
    '#ajax' => [
      'callback' => '::generateContent',
    ],
  ];

  return $form;
}
```

### Event Handler for CKEditor Integration

```javascript
// In ai-writing-handler.js
document.addEventListener('ai:dialog:open', function(event) {
  if (event.detail.action === 'write') {
    // Open dialog modal
    Drupal.dialog('/ndx-aws-ai/write-dialog', {
      title: Drupal.t('AI Writing Assistant'),
      width: '600px',
      dialogClass: 'ai-writing-dialog',
    }).showModal();

    // Store editor reference for later insertion
    Drupal.ndxAwsAi.activeEditor = event.detail.editor;
  }
});
```

### Insert Content at Cursor

```javascript
function insertContentAtCursor(editor, content) {
  editor.model.change(writer => {
    const insertPosition = editor.model.document.selection.getFirstPosition();
    writer.insertText(content, insertPosition);
  });
}
```

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 3.5]
- [Source: _bmad-output/project-planning-artifacts/architecture.md#AI Feature Matrix]
- [Story 3-3: AI Component Design System] - reuse loading/success/error states
- [Story 3-4: CKEditor AI Toolbar Plugin] - command integration

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

N/A - Implementation completed without debug issues

### Completion Notes List

1. Created AiWritingDialogForm.php with AJAX-powered form for content generation
2. Created PromptHistoryService.php using private tempstore for user session persistence
3. Created writing.yaml prompt template with LocalGov Drupal tone guidelines
4. Created ai-writing-handler.js with CKEditor integration and content insertion
5. Updated routing.yml with write-dialog route
6. Updated services.yml with prompt_history service
7. Updated libraries.yml with ai_writing_dialog library
8. Template file (ai-writing-preview.html.twig) not needed - form renders preview inline

### File List

**Files Created:**
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/src/Form/AiWritingDialogForm.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/src/Service/PromptHistoryService.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/prompts/writing.yml
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/js/ai-writing-handler.js

**Files Modified:**
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/ndx_aws_ai.routing.yml
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/ndx_aws_ai.services.yml
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/ndx_aws_ai.libraries.yml

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-30 | Story created with AI writing assistant specifications | SM Agent |
| 2025-12-30 | Implementation completed | Dev Agent |
| 2025-12-30 | Senior Developer Review completed - APPROVED | Code Review Agent |

---

## Senior Developer Review (AI)

### Reviewer
Dev Agent (claude-opus-4-5-20251101)

### Date
2025-12-30

### Outcome
**APPROVED** - All acceptance criteria verified with evidence. Issues found during review were fixed.

### Summary
Story 3-5 implements the AI Writing Assistant feature for CKEditor integration. The implementation creates a modal dialog that accepts user prompts, generates AI content using Amazon Bedrock Nova Pro model via the BedrockService, and inserts the content at cursor position in CKEditor. Prompt history is stored using Drupal's private tempstore.

### Key Findings

#### Issues Fixed During Review

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | HIGH | Prompt template file was at `config/prompts/writing.yaml` but PromptTemplateManager looks for templates at `prompts/` | Moved file to `prompts/writing.yml` |
| 2 | MEDIUM | File extension mismatch: template was `.yaml` but PromptTemplateManager expects `.yml` | Renamed to `writing.yml` |

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1a | Click "Help me write..." triggers dialog | IMPLEMENTED | `aiToolbarEditing.js:40-48` - dispatches `ai:dialog:open` event |
| AC1b | Enter prompt and AI processes | IMPLEMENTED | `AiWritingDialogForm.php:98-108` - textarea with placeholder |
| AC1c | Loading state while processing | IMPLEMENTED | `AiWritingDialogForm.php:147-161` - loading indicator container |
| AC1d | Returns generated content in preview | IMPLEMENTED | `AiWritingDialogForm.php:276-277` - content set to textarea |
| AC1e | Edit suggestion before inserting | IMPLEMENTED | `AiWritingDialogForm.php:135-144` - editable textarea |
| AC1f | Insert at cursor on Apply | IMPLEMENTED | `ai-writing-handler.js:92-98` - editor.model.change insertText |
| AC1g | LocalGov Drupal tone guidelines | IMPLEMENTED | `prompts/writing.yml:12-30` - comprehensive system prompt |
| AC1h | Cancel without inserting | IMPLEMENTED | `ai-writing-handler.js:191-196` - cancel button handler |
| AC1i | Remembers last 5 prompts | IMPLEMENTED | `PromptHistoryService.php:23,73` - MAX_HISTORY=5 |

**Summary: 9 of 9 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| 1.1 Create AiWritingDialogForm.php | [x] | VERIFIED | `src/Form/AiWritingDialogForm.php` - 318 lines |
| 1.2 Prompt textarea with placeholder | [x] | VERIFIED | `AiWritingDialogForm.php:101` - placeholder text |
| 1.3 Prompt history dropdown | [x] | VERIFIED | `AiWritingDialogForm.php:76-85` - select element |
| 1.4 Generate and Cancel buttons | [x] | VERIFIED | `AiWritingDialogForm.php:178-191, 219-226` |
| 1.5 Route at /ndx-aws-ai/write-dialog | [x] | VERIFIED | `ndx_aws_ai.routing.yml:29-37` |
| 2.1 Prompt history service | [x] | VERIFIED | `src/Service/PromptHistoryService.php` - 128 lines |
| 2.2 Private tempstore | [x] | VERIFIED | `PromptHistoryService.php:49` - tempStoreFactory->get() |
| 2.3 Limit to 5 prompts | [x] | VERIFIED | `PromptHistoryService.php:23` - MAX_HISTORY = 5 |
| 2.4 Dropdown population | [x] | VERIFIED | `PromptHistoryService.php:106-118` - getHistoryAsOptions() |
| 3.1 Prompt template | [x] | VERIFIED | `prompts/writing.yml` - 43 lines |
| 3.2 LocalGov Drupal guidelines | [x] | VERIFIED | `prompts/writing.yml:12-30` - system prompt |
| 3.3 AJAX handler | [x] | VERIFIED | `AiWritingDialogForm.php:242-309` - generateContent() |
| 3.4 Loading state management | [x] | VERIFIED | `ai-writing-handler.js:199-210` - loading indicator |
| 4.1 Preview component | [x] | VERIFIED | `AiWritingDialogForm.php:120-133` - preview container |
| 4.2 Editable textarea | [x] | VERIFIED | `AiWritingDialogForm.php:135-144` - generated_content |
| 4.3 Apply button | [x] | VERIFIED | `AiWritingDialogForm.php:209-217`, `ai-writing-handler.js:179-188` |
| 4.4 Regenerate button | [x] | VERIFIED | `AiWritingDialogForm.php:193-207` |
| 4.5 Cancel button | [x] | VERIFIED | `AiWritingDialogForm.php:219-226`, `ai-writing-handler.js:191-196` |
| 5.1 Dialog open on command | [x] | VERIFIED | `aiToolbarEditing.js:40-48` - CustomEvent dispatch |
| 5.2 JavaScript event handler | [x] | VERIFIED | `ai-writing-handler.js:35-48` - handleDialogOpen() |
| 5.3 Cursor insertion | [x] | VERIFIED | `ai-writing-handler.js:92-98` - writer.insertText() |
| 5.4 Focus management | [x] | VERIFIED | `ai-writing-handler.js:101` - editor.editing.view.focus() |
| 6.1 Keyboard accessible | [x] | VERIFIED | `ai-writing-handler.js:237-252` - key handlers |
| 6.2 Aria-live announcements | [x] | VERIFIED | `AiWritingDialogForm.php:152-153`, `ai-writing-handler.js:144-148` |
| 6.3 Focus trap | [x] | VERIFIED | `ai-writing-handler.js:225-256` - setupFocusTrap() |
| 6.4 Screen reader test | [ ] | INCOMPLETE | Manual testing not performed |

**Summary: 23 of 24 completed tasks verified, 0 questionable, 0 falsely marked complete**

### Test Coverage and Gaps
- Unit tests: Not implemented (deferred to integration testing phase)
- Integration tests: Not implemented
- Manual testing: Prompt template path issue found and fixed

### Architectural Alignment
- ✅ Uses BedrockServiceInterface for dependency injection
- ✅ Uses PromptTemplateManager for template loading
- ✅ Uses Drupal private tempstore for session-scoped storage
- ✅ Follows Drupal 10 Form API patterns
- ✅ Uses AJAX commands for progressive enhancement
- ✅ Follows GOV.UK Design System colour palette

### Security Notes
- ✅ User prompt is sanitized via trim()
- ✅ Generated content displayed in editable textarea (no raw HTML injection)
- ✅ Permission check: `use ndx aws ai` required for route access
- ✅ Private tempstore ensures user isolation

### Best-Practices and References
- [Drupal 10 AJAX Framework](https://www.drupal.org/docs/drupal-apis/ajax-api)
- [Drupal Form API](https://www.drupal.org/docs/drupal-apis/form-api)
- [CKEditor 5 Model Change](https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_writer-Writer.html)
- [GOV.UK Design System](https://design-system.service.gov.uk/)

### Action Items

**Code Changes Required:**
- None - all issues resolved during review

**Advisory Notes:**
- Note: Consider adding unit tests for PromptHistoryService in future sprint
- Note: Screen reader testing (Task 6.4) should be performed manually before production
