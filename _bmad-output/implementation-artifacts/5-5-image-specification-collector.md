# Story 5.5: Image Specification Collector

Status: done

## Story

As a **developer**,
I want **image specifications collected during content generation**,
So that **images can be batch generated efficiently**.

## Acceptance Criteria

1. **Given** content is being generated
   **When** a template specifies an image need
   **Then** the collector:
   - Records image type (hero, headshot, location, etc.)
   - Stores the prompt/description for generation
   - Links to the content node that needs it
   - Assigns placeholder in content
   **And** specifications are stored in a queue
   **And** duplicate specifications are deduplicated
   **And** the queue is persisted for batch processing

## Tasks / Subtasks

- [x] **Task 1: ImageQueueItem Value Object** (AC: 1)
  - [x] 1.1 Create `Value/ImageQueueItem.php` with readonly properties
  - [x] 1.2 Include: `specId`, `imageSpec`, `nodeId`, `fieldName`, `status`
  - [x] 1.3 Include: `createdAt`, `processedAt`, `error`
  - [x] 1.4 Add status constants: PENDING, PROCESSING, COMPLETE, FAILED
  - [x] 1.5 Add `toArray()` and `fromArray()` for queue persistence

- [x] **Task 2: ImageQueue Value Object** (AC: 1)
  - [x] 2.1 Create `Value/ImageQueue.php` as collection
  - [x] 2.2 Include: `items`, `createdAt`, `lastUpdated`
  - [x] 2.3 Add `addItem(ImageQueueItem $item): self`
  - [x] 2.4 Add `getPending(): array` to filter pending items
  - [x] 2.5 Add `getByNodeId(int $nodeId): array` for node lookup
  - [x] 2.6 Add deduplication via `isDuplicate()` and `addDuplicate()`

- [x] **Task 3: ImageSpecificationCollectorInterface** (AC: 1)
  - [x] 3.1 Create `Service/ImageSpecificationCollectorInterface.php`
  - [x] 3.2 Define `collectFromContent(ContentSpecification $spec, int $nodeId, CouncilIdentity $identity): void`
  - [x] 3.3 Define `getQueue(): ImageQueue`
  - [x] 3.4 Define `clearQueue(): void`
  - [x] 3.5 Define `markProcessed(string $specId, int $mediaId): void`
  - [x] 3.6 Define `markFailed(string $specId, string $error): void`

- [x] **Task 4: ImageSpecificationCollector Service** (AC: 1)
  - [x] 4.1 Create `Service/ImageSpecificationCollector.php` implementing interface
  - [x] 4.2 Inject: `StateInterface`, `LoggerInterface`
  - [x] 4.3 Implement queue persistence via Drupal State API
  - [x] 4.4 Extract ImageSpecifications from ContentSpecification
  - [x] 4.5 Render image prompts with CouncilIdentity variables

- [x] **Task 5: Deduplication Logic** (AC: 1)
  - [x] 5.1 Generate hash from image type, dimensions, and rendered prompt
  - [x] 5.2 Track seen hashes to detect duplicates
  - [x] 5.3 Link duplicate requests to same queue item
  - [x] 5.4 Log deduplicated items for debugging
  - [x] 5.5 Store duplicate mappings for media assignment

- [x] **Task 6: Integration with ContentGenerationOrchestrator** (AC: 1)
  - [x] 6.1 Inject ImageSpecificationCollector into orchestrator
  - [x] 6.2 Call collectFromContent() after successful node creation
  - [x] 6.3 Pass nodeId and identity for context
  - [x] 6.4 Update services.yml with new dependency
  - [x] 6.5 Log image count statistics after generation complete

- [x] **Task 7: Queue Statistics** (AC: 1)
  - [x] 7.1 Add `getStatistics(): ImageQueueStatistics` method
  - [x] 7.2 Create `Value/ImageQueueStatistics.php` value object
  - [x] 7.3 Include: total, pending, completed, failed counts
  - [x] 7.4 Include: estimated processing time based on averages
  - [x] 7.5 Add `toArray()` for logging

- [x] **Task 8: Service Registration** (AC: 1)
  - [x] 8.1 Register `ndx_council_generator.image_collector` in services.yml
  - [x] 8.2 Add State API dependency
  - [x] 8.3 Update content_orchestrator with image_collector dependency
  - [x] 8.4 Verify DI configuration

- [x] **Task 9: Unit Tests** (AC: 1)
  - [x] 9.1 Create `ImageQueueItemTest.php` for value object
  - [x] 9.2 Create `ImageQueueTest.php` for collection
  - [x] 9.3 Create `ImageSpecificationCollectorTest.php` with mocked dependencies
  - [x] 9.4 Test deduplication logic with various scenarios
  - [x] 9.5 Test queue persistence and recovery

## Dev Notes

### Queue Storage

The image queue is stored in Drupal State API:

```php
$state->get('ndx_council_generator.image_queue', []);
```

Queue structure:
```php
[
  'items' => [
    'hash-123' => [
      'spec_id' => 'service-waste-recycling:hero',
      'image_spec' => [...],  // Rendered ImageSpecification
      'node_id' => 42,
      'field_name' => 'field_hero_image',
      'status' => 'pending',
      'created_at' => 1735000000,
      'processed_at' => null,
      'media_id' => null,
      'error' => null,
    ],
  ],
  'duplicates' => [
    'hash-456' => 'hash-123',  // Maps to original
  ],
  'created_at' => 1735000000,
  'last_updated' => 1735000100,
]
```

### Deduplication Hash

Hash is generated from:
- Image type (hero, location, icon, etc.)
- Dimensions (1200x630)
- Normalized prompt (lowercase, trimmed whitespace)

```php
$hash = md5(sprintf('%s:%s:%s',
  $spec->type,
  $spec->dimensions,
  strtolower(trim($renderedPrompt))
));
```

### Integration Point

The orchestrator calls the collector after each successful node creation:

```php
// In ContentGenerationOrchestrator::generateSingle()
if ($result->success) {
  $this->imageCollector->collectFromContent(
    $spec,
    $result->nodeId,
    $identity
  );
}
```

### Expected Queue Size

From Story 5-3 templates:
- 47 content items
- Most have 1 hero image
- Some have multiple images (step images in guides)
- Estimated 50-60 total images before deduplication
- After deduplication: ~40-50 unique images

### Project Structure Notes

- Follows existing module structure at `web/modules/custom/ndx_council_generator/`
- Value objects in `src/Value/` with readonly properties
- Services in `src/Service/` with interface+implementation pattern
- Tests in `tests/src/Unit/` following Drupal testing standards

### References

- [Source: _bmad-output/implementation-artifacts/5-3-content-generation-templates.md]
- [Source: _bmad-output/implementation-artifacts/5-4-content-generation-orchestrator.md]
- [Source: ndx_council_generator/src/Value/ImageSpecification.php]
- [Source: ndx_council_generator/src/Service/ContentGenerationOrchestrator.php]

## Dependencies

- Story 5.3: Content Generation Templates (ImageSpecification value object)
- Story 5.4: Content Generation Orchestrator (integration point)
- Drupal State API for queue persistence

## Out of Scope

- Actual image generation (Story 5-6)
- Media entity creation (Story 5-6)
- Node field updates with generated images (Story 5-6)

## Definition of Done

- [x] ImageSpecificationCollector service collects images from templates
- [x] Queue items include node ID and field name for later updates
- [x] Duplicate images are detected and deduplicated
- [x] Queue is persisted via Drupal State API
- [x] Queue supports pending/processed/failed status tracking
- [x] Statistics available for progress reporting
- [x] Orchestrator integration collects images during generation
- [x] All value objects have unit tests
- [x] Service has unit tests with mocked State API
- [x] Code follows Drupal coding standards

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

### Completion Notes List

- Implemented ImageQueueItem value object with status workflow (pending → processing → complete/failed)
- Implemented ImageQueue value object with deduplication support via hash mappings
- Implemented ImageQueueStatistics for progress reporting with estimated time calculations
- Created ImageSpecificationCollector service with Drupal State API persistence
- Deduplication uses MD5 hash of image type + dimensions + normalized prompt
- Integrated with ContentGenerationOrchestrator via optional constructor parameter
- Updated services.yml with image_collector service and orchestrator dependency
- All tests use mocked dependencies following Drupal testing patterns

### File List

- `ndx_council_generator.services.yml` - Added image_collector service and orchestrator dependency
- `src/Value/ImageQueueItem.php` - Queue item value object with status workflow
- `src/Value/ImageQueue.php` - Queue collection with deduplication support
- `src/Value/ImageQueueStatistics.php` - Statistics value object for progress reporting
- `src/Service/ImageSpecificationCollectorInterface.php` - Collector interface
- `src/Service/ImageSpecificationCollector.php` - Collector implementation with State API
- `src/Service/ContentGenerationOrchestrator.php` - Updated with image collection integration
- `tests/src/Unit/Value/ImageQueueItemTest.php` - Queue item unit tests
- `tests/src/Unit/Value/ImageQueueTest.php` - Queue unit tests
- `tests/src/Unit/Value/ImageQueueStatisticsTest.php` - Statistics unit tests
- `tests/src/Unit/Service/ImageSpecificationCollectorTest.php` - Collector service tests
- `tests/src/Unit/Service/ContentGenerationOrchestratorTest.php` - Added image collector integration tests
