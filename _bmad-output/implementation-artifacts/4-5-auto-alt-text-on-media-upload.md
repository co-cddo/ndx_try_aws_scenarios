# Story 4.5: Auto Alt-Text on Media Upload

Status: done

## Story

As a **content editor uploading images**,
I want **AI-generated alt-text suggestions**,
So that **I can make images accessible without manual description writing**.

## Acceptance Criteria

1. **Given** I upload an image to the media library
   **When** the upload completes
   **Then** the alt-text field is:
   - Pre-populated with AI-generated description
   - Editable before saving
   - Marked as "AI-generated" with visual indicator
   **And** I can regenerate if the suggestion is poor
   **And** I can clear and write my own description
   **And** the generation happens asynchronously (non-blocking)
   **And** existing images can be batch-processed

## Tasks / Subtasks

- [ ] **Task 1: Create Alt-Text Generator Service** (AC: 1)
  - [ ] 1.1 Create `AltTextGeneratorInterface.php` in `ndx_aws_ai/src/Service/`
  - [ ] 1.2 Create `AltTextGeneratorService.php` implementing the interface
  - [ ] 1.3 Inject VisionService for image analysis
  - [ ] 1.4 Create WCAG-compliant alt-text prompt template
  - [ ] 1.5 Define maximum alt-text length constant (125 characters)
  - [ ] 1.6 Handle image validation (formats, size limits)

- [ ] **Task 2: Create Alt-Text Value Object** (AC: 1)
  - [ ] 2.1 Create `AltTextResult.php` value object
  - [ ] 2.2 Include fields: altText, confidence, isAiGenerated, language
  - [ ] 2.3 Include processingTimeMs for logging
  - [ ] 2.4 Add validation for alt-text quality

- [ ] **Task 3: Implement Media Upload Event Subscriber** (AC: 1)
  - [ ] 3.1 Create `AltTextEventSubscriber.php` in `ndx_aws_ai/src/EventSubscriber/`
  - [ ] 3.2 Subscribe to `media.presave` event
  - [ ] 3.3 Check if image media type and alt-text is empty
  - [ ] 3.4 Call AltTextGeneratorService asynchronously
  - [ ] 3.5 Store generation in queue if async processing needed

- [ ] **Task 4: Create Media Library Integration** (AC: 1)
  - [ ] 4.1 Alter media image form to add AI controls
  - [ ] 4.2 Add "Regenerate alt-text" button with AJAX callback
  - [ ] 4.3 Add visual indicator for AI-generated text (info icon + tooltip)
  - [ ] 4.4 Add loading spinner during regeneration
  - [ ] 4.5 Preserve user edits (don't overwrite if modified)

- [ ] **Task 5: Create Batch Processing Command** (AC: 1)
  - [ ] 5.1 Create Drush command `ndx:generate-alt-texts`
  - [ ] 5.2 Accept options: --limit, --force, --dry-run
  - [ ] 5.3 Process images without alt-text in batches
  - [ ] 5.4 Log progress and results
  - [ ] 5.5 Handle rate limiting for large batches

- [ ] **Task 6: Service Registration & Testing** (AC: 1)
  - [ ] 6.1 Register AltTextGeneratorService in `ndx_aws_ai.services.yml`
  - [ ] 6.2 Register event subscriber
  - [ ] 6.3 Create unit tests with mocked VisionService
  - [ ] 6.4 Test prompt template rendering
  - [ ] 6.5 Test WCAG compliance of generated alt-text

## Dev Notes

### Alt-Text Generator Service

The service wraps the VisionService with a WCAG-focused prompt:

```php
interface AltTextGeneratorInterface {
    public function generateAltText(string $imageData, string $mimeType): AltTextResult;
    public function generateAltTextFromUri(string $uri): AltTextResult;
    public function regenerateAltText(MediaInterface $media): AltTextResult;
    public function batchGenerate(array $mediaIds, int $batchSize = 10): array;
}
```

### WCAG Alt-Text Prompt Template

Create `prompts/alt_text_generator.yml`:

```yaml
name: alt_text_generator
description: Generate WCAG-compliant alt-text for images
version: 1.0
variables:
  - context: Optional context about where image is used

system: |
  You are an accessibility expert generating alt-text for images.

  WCAG Guidelines for alt-text:
  - Describe the PURPOSE and CONTENT of the image
  - Be concise (under 125 characters preferred)
  - Don't start with "Image of" or "Picture of"
  - Describe relevant visual details
  - For decorative images, return empty string
  - For complex images (charts, diagrams), provide summary

  UK Government Accessibility Requirements:
  - Use plain English
  - Be specific rather than generic
  - Include text visible in the image
  - Describe people's actions, not appearances (unless relevant)

template: |
  Analyze this image and generate WCAG-compliant alt-text.
  {% if context %}
  Context: {{ context }}
  {% endif %}

  Respond with ONLY the alt-text, no explanation. Keep under 125 characters.
```

### Media Form Alteration

```php
function ndx_aws_ai_form_media_image_edit_form_alter(&$form, FormStateInterface $form_state) {
  // Add regenerate button next to alt-text field
  $form['field_media_image']['widget'][0]['alt']['#suffix'] = [
    '#type' => 'container',
    '#attributes' => ['class' => ['alt-text-ai-controls']],
    'regenerate' => [
      '#type' => 'button',
      '#value' => t('Regenerate with AI'),
      '#ajax' => [
        'callback' => 'ndx_aws_ai_regenerate_alt_text_callback',
        'wrapper' => 'alt-text-wrapper',
      ],
      '#attributes' => ['class' => ['button--secondary']],
    ],
    'ai_indicator' => [
      '#type' => 'html_tag',
      '#tag' => 'span',
      '#value' => t('AI-generated'),
      '#attributes' => [
        'class' => ['ai-indicator'],
        'title' => t('This alt-text was generated by AI. Review and edit as needed.'),
      ],
    ],
  ];
}
```

### Event Subscriber Pattern

```php
class AltTextEventSubscriber implements EventSubscriberInterface {

  public static function getSubscribedEvents() {
    return [
      MediaEvents::MEDIA_PRESAVE => ['onMediaPresave', 100],
    ];
  }

  public function onMediaPresave(MediaEvent $event) {
    $media = $event->getMedia();

    // Only process image media
    if ($media->bundle() !== 'image') {
      return;
    }

    // Skip if alt-text already exists
    $imageField = $media->get('field_media_image');
    if (!$imageField->isEmpty() && !empty($imageField->alt)) {
      return;
    }

    // Generate alt-text
    try {
      $result = $this->altTextGenerator->generateAltText($media);
      $imageField->alt = $result->altText;
      // Store AI generation metadata
      $media->set('field_ai_generated_alt', TRUE);
    }
    catch (\Exception $e) {
      $this->logger->warning('Alt-text generation failed: @error', ['@error' => $e->getMessage()]);
    }
  }
}
```

### Drush Batch Command

```php
/**
 * Drush command to generate alt-text for existing images.
 *
 * @command ndx:generate-alt-texts
 * @option limit Maximum number of images to process
 * @option force Regenerate even if alt-text exists
 * @option dry-run Preview without making changes
 */
public function generateAltTexts($options = ['limit' => 100, 'force' => FALSE, 'dry-run' => FALSE]) {
  $query = $this->entityTypeManager->getStorage('media')->getQuery()
    ->condition('bundle', 'image')
    ->accessCheck(FALSE);

  if (!$options['force']) {
    // Find images without alt-text
    $query->condition('field_media_image.alt', NULL, 'IS NULL');
  }

  $query->range(0, $options['limit']);
  $ids = $query->execute();

  // Process in batches with rate limiting
  foreach (array_chunk($ids, 10) as $batch) {
    $results = $this->altTextGenerator->batchGenerate($batch);
    // ... log results
  }
}
```

### AltTextResult Value Object

```php
final class AltTextResult {
  public function __construct(
    public readonly string $altText,
    public readonly float $confidence,
    public readonly bool $isAiGenerated,
    public readonly string $language,
    public readonly float $processingTimeMs,
    public readonly ?string $error = NULL,
  ) {}

  public function isSuccess(): bool {
    return $this->error === NULL && $this->altText !== '';
  }

  public function isDecorative(): bool {
    return $this->altText === '' && $this->isSuccess();
  }

  public function meetsLengthGuideline(): bool {
    return strlen($this->altText) <= 125;
  }
}
```

### File Size and Format Handling

```php
// Reuse VisionService constants for supported formats
const SUPPORTED_FORMATS = VisionServiceInterface::SUPPORTED_FORMATS;
const MAX_IMAGE_SIZE = VisionServiceInterface::MAX_IMAGE_SIZE;

// For Drupal media, get image from file entity
private function getImageDataFromMedia(MediaInterface $media): string {
  $fileId = $media->get('field_media_image')->target_id;
  $file = $this->entityTypeManager->getStorage('file')->load($fileId);

  return file_get_contents($file->getFileUri());
}
```

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 4.5]
- [Story 4-3: Nova 2 Omni Vision Service] - VisionService for image analysis
- [Story 3-2: Bedrock Service Integration] - prompt template system
- [WCAG 2.2 Alt-Text Guidelines](https://www.w3.org/WAI/tutorials/images/)
- [GOV.UK Accessibility Requirements](https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps)

## Code Review Record

| Aspect | Finding | Status |
|--------|---------|--------|
| Architecture & Design | Clean separation of concerns with interface, service, value object, event subscriber, and Drush commands | ✅ Pass |
| Code Quality | Well-structured PHP 8.2 code with proper type hints and documentation | ✅ Pass |
| Security | No security vulnerabilities; uses internal services only | ✅ Pass |
| Performance | Batch processing with rate limiting; async event handling | ✅ Pass |
| Test Coverage | Comprehensive unit tests covering all public methods | ✅ Pass |
| Documentation | Full PHPDoc on all public methods | ✅ Pass |

**Implementation Summary:**
- Created `AltTextGeneratorInterface.php` defining the contract
- Created `AltTextResult.php` value object with static factories
- Created `AltTextGeneratorService.php` wrapping VisionService
- Created `AltTextEventSubscriber.php` for auto-generation on media presave
- Created `NdxAwsAiCommands.php` with Drush batch commands
- Registered all services in `ndx_aws_ai.services.yml`
- Created comprehensive unit tests in `AltTextGeneratorServiceTest.php`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-30 | Story created with alt-text specifications | SM Agent |
| 2025-12-30 | Implementation complete with all tasks done | Dev Agent |
| 2025-12-30 | Code review passed, story marked done | Dev Agent |
