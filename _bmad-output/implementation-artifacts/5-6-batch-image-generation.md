# Story 5.6: Batch Image Generation

Status: done

## Story

As a **system administrator**,
I want **all images generated in a single batch at the end**,
So that **generation is efficient and cost-effective**.

## Acceptance Criteria

1. **Given** content generation is complete and image specs are queued
   **When** batch image generation runs
   **Then** the system:
   - Processes image queue using Amazon Titan Image Generator
   - Generates images matching specifications (type, dimensions, style)
   - Uploads to Drupal media library as Image media entities
   - Updates content nodes with generated image references
   **And** progress is trackable (X of Y images)
   **And** failed images are logged with retry option
   **And** total image generation cost stays under $1.00

## Tasks / Subtasks

- [x] **Task 1: ImageGenerationServiceInterface** (AC: 1)
  - [x] 1.1 Create `Service/ImageGenerationServiceInterface.php` in ndx_aws_ai module
  - [x] 1.2 Define `generateImage(ImageSpecification $spec, CouncilIdentity $identity): ImageGenerationResult`
  - [x] 1.3 Define `isAvailable(): bool` for service availability check
  - [x] 1.4 Add MODEL_TITAN_IMAGE constant for amazon.titan-image-generator-v2:0

- [x] **Task 2: ImageGenerationResult Value Object** (AC: 1)
  - [x] 2.1 Create `Result/ImageGenerationResult.php` in ndx_aws_ai module
  - [x] 2.2 Include readonly properties: success, imageData, mimeType, error, processingTimeMs
  - [x] 2.3 Add factory methods: `fromSuccess()`, `fromFailure()`
  - [x] 2.4 Add `getImageAsBase64(): string` method
  - [x] 2.5 Add `toArray()` for logging/debugging

- [x] **Task 3: ImageGenerationService Implementation** (AC: 1)
  - [x] 3.1 Create `Service/ImageGenerationService.php` in ndx_aws_ai module
  - [x] 3.2 Inject AwsClientFactory, AwsErrorHandler, LoggerInterface
  - [x] 3.3 Implement Titan Image Generator API call with retry logic
  - [x] 3.4 Map ImageSpecification dimensions to valid Titan sizes
  - [x] 3.5 Build prompts with style prefixes (photorealistic, illustration, etc.)
  - [x] 3.6 Handle rate limiting with exponential backoff
  - [x] 3.7 Register service in ndx_aws_ai.services.yml

- [x] **Task 4: ImageBatchProcessorInterface** (AC: 1)
  - [x] 4.1 Create `Service/ImageBatchProcessorInterface.php` in ndx_council_generator
  - [x] 4.2 Define `processQueue(?callable $progressCallback): ImageBatchResult`
  - [x] 4.3 Define `processItem(string $itemId): ImageGenerationResult`
  - [x] 4.4 Define `retryFailed(?callable $progressCallback): ImageBatchResult`
  - [x] 4.5 Define `getProgress(): ?GenerationProgress`

- [x] **Task 5: ImageBatchResult Value Object** (AC: 1)
  - [x] 5.1 Create `Value/ImageBatchResult.php` in ndx_council_generator
  - [x] 5.2 Include: totalProcessed, successCount, failureCount, mediaIds
  - [x] 5.3 Include: startedAt, completedAt, totalProcessingTimeMs
  - [x] 5.4 Add `isFullySuccessful(): bool` and `hasFailures(): bool`
  - [x] 5.5 Add `getFailedItemIds(): array` for retry capability
  - [x] 5.6 Add `getSummaryText(): string` for logging

- [x] **Task 6: ImageBatchProcessor Service** (AC: 1)
  - [x] 6.1 Create `Service/ImageBatchProcessor.php` implementing interface
  - [x] 6.2 Inject: ImageGenerationService, ImageSpecificationCollector, EntityTypeManager
  - [x] 6.3 Inject: FileSystemInterface, LoggerInterface, GenerationStateManager
  - [x] 6.4 Process queue items in order, tracking progress
  - [x] 6.5 Apply rate limiting between API calls (configurable delay)
  - [x] 6.6 Update GenerationState with image generation progress

- [x] **Task 7: Media Entity Creation** (AC: 1)
  - [x] 7.1 Create `Service/MediaCreatorInterface.php` for media creation
  - [x] 7.2 Create `Service/MediaCreator.php` implementation
  - [x] 7.3 Save generated image to public files (public://generated-images/)
  - [x] 7.4 Create Image media entity with alt text from spec
  - [x] 7.5 Return media ID for node field update
  - [x] 7.6 Handle file name generation with council prefix

- [x] **Task 8: Node Field Update** (AC: 1)
  - [x] 8.1 Extend MediaCreator to update node image fields
  - [x] 8.2 Map fieldName from ImageQueueItem to node field
  - [x] 8.3 Handle media reference field update
  - [x] 8.4 Support single and multi-value image fields
  - [x] 8.5 Log successful node updates

- [x] **Task 9: Duplicate Image Resolution** (AC: 1)
  - [x] 9.1 When processing queue, resolve duplicates to same media ID
  - [x] 9.2 After generating original, update all duplicate mappings
  - [x] 9.3 Update all nodes that reference the duplicate
  - [x] 9.4 Track duplicate resolution in batch result

- [x] **Task 10: Service Registration** (AC: 1)
  - [x] 10.1 Register ImageGenerationService in ndx_aws_ai.services.yml
  - [x] 10.2 Register MediaCreator in ndx_council_generator.services.yml
  - [x] 10.3 Register ImageBatchProcessor in ndx_council_generator.services.yml
  - [x] 10.4 Wire up all dependencies correctly

- [x] **Task 11: Unit Tests** (AC: 1)
  - [x] 11.1 Create `ImageGenerationResultTest.php` for result value object
  - [x] 11.2 Create `ImageBatchResultTest.php` for batch result
  - [x] 11.3 Create `ImageGenerationServiceTest.php` with mocked AWS client
  - [x] 11.4 Create `ImageBatchProcessorTest.php` with mocked dependencies
  - [x] 11.5 Create `MediaCreatorTest.php` with mocked entity managers
  - [x] 11.6 Test error handling and retry scenarios

## Dev Notes

### Amazon Titan Image Generator

The Titan Image Generator v2 model (`amazon.titan-image-generator-v2:0`) supports:
- Text-to-image generation
- Multiple output sizes (512x512 to 1408x1408)
- Style presets (photorealistic, digital-art, anime, etc.)

API Request format:
```php
$request = [
  'modelId' => 'amazon.titan-image-generator-v2:0',
  'contentType' => 'application/json',
  'accept' => 'application/json',
  'body' => json_encode([
    'taskType' => 'TEXT_IMAGE',
    'textToImageParams' => [
      'text' => $prompt,
    ],
    'imageGenerationConfig' => [
      'numberOfImages' => 1,
      'height' => $height,
      'width' => $width,
      'cfgScale' => 8.0,  // Prompt adherence (1-10)
    ],
  ]),
];

$response = $client->invokeModel($request);
$body = json_decode($response['body']);
$imageBase64 = $body['images'][0];
```

### Valid Titan Image Sizes

Titan supports specific dimensions:
- 1024x1024 (square - default)
- 768x768 (square - smaller)
- 512x512 (square - smallest)
- 768x1152 (portrait)
- 384x576 (portrait - smaller)
- 1152x768 (landscape)
- 576x384 (landscape - smaller)
- 768x1280 (portrait - tall)
- 1280x768 (landscape - wide)

Map requested dimensions to nearest valid size:
```php
protected function mapToValidDimensions(int $width, int $height): array {
  $sizes = [
    [1024, 1024], [768, 768], [512, 512],
    [768, 1152], [384, 576], [1152, 768],
    [576, 384], [768, 1280], [1280, 768],
  ];

  $aspectRatio = $width / $height;
  $bestMatch = null;
  $bestDiff = PHP_FLOAT_MAX;

  foreach ($sizes as [$w, $h]) {
    $ratio = $w / $h;
    $diff = abs($aspectRatio - $ratio);
    if ($diff < $bestDiff) {
      $bestDiff = $diff;
      $bestMatch = [$w, $h];
    }
  }

  return $bestMatch;
}
```

### Style Prefix Mapping

Map ImageSpecification styles to prompt prefixes:
```php
protected function getStylePrefix(string $style): string {
  return match ($style) {
    'photo' => 'Photorealistic photograph, high quality, professional photography,',
    'illustration' => 'Digital illustration, clean design, modern style,',
    'icon' => 'Simple icon, flat design, minimal, vector style,',
    default => '',
  };
}
```

### Integration with ImageSpecificationCollector

```php
public function processQueue(?callable $progressCallback = NULL): ImageBatchResult {
  $queue = $this->imageCollector->getQueue();
  $pendingIds = $queue->getPendingIds();
  $results = [];

  foreach ($pendingIds as $itemId) {
    $item = $queue->getItem($itemId);

    // Generate image
    $genResult = $this->imageGenerationService->generateImage(
      $item->imageSpec,
      $this->currentIdentity
    );

    if ($genResult->success) {
      // Create media entity
      $mediaId = $this->mediaCreator->createFromImage(
        $genResult->imageData,
        $genResult->mimeType,
        $item->contentSpecId,
        $item->fieldName
      );

      // Update node with media reference
      $this->mediaCreator->updateNodeField(
        $item->nodeId,
        $item->fieldName,
        $mediaId
      );

      // Mark as processed
      $this->imageCollector->markProcessed($itemId, $mediaId);

      // Handle duplicates
      $this->resolveDuplicates($queue, $itemId, $mediaId);
    } else {
      $this->imageCollector->markFailed($itemId, $genResult->error);
    }

    $results[] = $genResult;

    if ($progressCallback) {
      $progressCallback($this->getProgress());
    }

    // Rate limiting
    $this->applyRateLimitDelay();
  }

  return ImageBatchResult::fromResults($results);
}
```

### Media Creation

```php
public function createFromImage(
  string $imageData,
  string $mimeType,
  string $specId,
  string $fieldName
): int {
  // Generate file name
  $extension = $this->getExtensionFromMime($mimeType);
  $fileName = sprintf('generated-%s-%s.%s', $specId, time(), $extension);

  // Save file
  $directory = 'public://generated-images';
  $this->fileSystem->prepareDirectory($directory, FileSystemInterface::CREATE_DIRECTORY);
  $uri = $directory . '/' . $fileName;
  $this->fileSystem->saveData($imageData, $uri);

  // Create file entity
  $file = $this->entityTypeManager->getStorage('file')->create([
    'uri' => $uri,
    'uid' => 1,
    'status' => 1,
  ]);
  $file->save();

  // Create media entity
  $media = $this->entityTypeManager->getStorage('media')->create([
    'bundle' => 'image',
    'name' => $this->generateMediaName($specId),
    'field_media_image' => [
      'target_id' => $file->id(),
      'alt' => $this->generateAltText($specId),
    ],
    'uid' => 1,
    'status' => 1,
  ]);
  $media->save();

  return (int) $media->id();
}
```

### Cost Estimation

Based on Titan Image Generator pricing (~$0.01 per image):
- Expected queue size: 40-50 unique images
- Estimated cost: $0.40-$0.50 per generation
- Well under $1.00 budget

### Expected Queue After Content Generation

From Story 5-5:
- 47 content items
- Most have 1 hero image
- Some guides have step images
- ~50-60 total image specs
- After deduplication: ~40-50 unique images

### Project Structure

```
ndx_aws_ai/
├── src/
│   ├── Result/
│   │   └── ImageGenerationResult.php    # NEW
│   └── Service/
│       ├── ImageGenerationService.php       # NEW
│       └── ImageGenerationServiceInterface.php  # NEW
└── tests/
    └── src/Unit/
        ├── Result/
        │   └── ImageGenerationResultTest.php  # NEW
        └── Service/
            └── ImageGenerationServiceTest.php  # NEW

ndx_council_generator/
├── src/
│   ├── Service/
│   │   ├── ImageBatchProcessor.php       # NEW
│   │   ├── ImageBatchProcessorInterface.php  # NEW
│   │   ├── MediaCreator.php              # NEW
│   │   └── MediaCreatorInterface.php     # NEW
│   └── Value/
│       └── ImageBatchResult.php          # NEW
└── tests/
    └── src/Unit/
        ├── Service/
        │   ├── ImageBatchProcessorTest.php  # NEW
        │   └── MediaCreatorTest.php         # NEW
        └── Value/
            └── ImageBatchResultTest.php     # NEW
```

## Dependencies

- Story 5.5: Image Specification Collector (provides queue to process)
- Story 5.4: Content Generation Orchestrator (creates nodes to update)
- ndx_aws_ai module: AwsClientFactory for Bedrock access
- Drupal Core: Media, File entity types

## Out of Scope

- Custom image editing/cropping (use generated dimensions)
- Image caching/CDN (Drupal handles this)
- Multiple image generation per call (one at a time for reliability)
- Alternative image generation models (Titan only for now)

## Definition of Done

- [x] ImageGenerationService calls Titan Image Generator successfully
- [x] Generated images are saved to Drupal media library
- [x] Content nodes are updated with generated image references
- [x] Progress is trackable during batch processing
- [x] Failed images are logged with error details
- [x] Retry mechanism works for failed items
- [x] Duplicate images resolve to same media ID
- [x] Total cost stays under $1.00 for full generation
- [x] All value objects have unit tests
- [x] All services have unit tests with mocked dependencies
- [x] Code follows Drupal coding standards
