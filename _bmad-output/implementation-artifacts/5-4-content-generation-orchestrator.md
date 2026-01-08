# Story 5.4: Content Generation Orchestrator

Status: done

## Story

As a **system administrator**,
I want **content generated sequentially with progress tracking**,
So that **I can monitor generation and handle failures**.

## Acceptance Criteria

1. **Given** council identity and templates are ready
   **When** content generation runs
   **Then** the orchestrator:
   - Processes content types in defined order
   - Creates Drupal nodes with generated content
   - Tracks progress (X of Y pages complete)
   - Handles individual page failures without stopping
   - Reports summary on completion
   **And** progress is visible via Drush output or admin UI
   **And** failed pages are logged and can be retried
   **And** generation respects Bedrock rate limits

## Tasks / Subtasks

- [x] **Task 1: ContentGenerationOrchestrator Service Interface** (AC: 1)
  - [x] 1.1 Create `ContentGenerationOrchestratorInterface.php` with method signatures
  - [x] 1.2 Define `generateAll(CouncilIdentity $identity): GenerationResult`
  - [x] 1.3 Define `generateSingle(ContentSpecification $spec, CouncilIdentity $identity): ContentGenerationResult`
  - [x] 1.4 Define `retryFailed(): GenerationResult` for re-processing failures
  - [x] 1.5 Define `getProgress(): GenerationProgress` value object accessor

- [x] **Task 2: ContentGenerationResult Value Object** (AC: 1)
  - [x] 2.1 Create `Value/ContentGenerationResult.php` with readonly properties
  - [x] 2.2 Include: `specId`, `success`, `nodeId`, `error`, `generatedAt`
  - [x] 2.3 Add `fromSuccess(string $specId, int $nodeId)` factory
  - [x] 2.4 Add `fromFailure(string $specId, string $error)` factory
  - [x] 2.5 Add `toArray()` and `fromArray()` for persistence

- [x] **Task 3: GenerationProgress Value Object** (AC: 1)
  - [x] 3.1 Reused existing `Value/GenerationProgress.php` from Story 5-1
  - [x] 3.2 Existing implementation has phase-based progress tracking
  - [x] 3.3 Has `getPercentage(): int` calculation
  - [x] 3.4 Story 5-1 implementation covers phase tracking
  - [x] 3.5 Has `getProgressText(): string` for human-readable status

- [x] **Task 4: GenerationSummary Value Object** (AC: 1)
  - [x] 4.1 Create `Value/GenerationSummary.php` for final reporting
  - [x] 4.2 Include: `totalProcessed`, `successCount`, `failureCount`, `results`
  - [x] 4.3 Include: `totalDuration`, `averageTimePerItem`, `failedSpecs`
  - [x] 4.4 Add `getSuccessRate(): float` calculation
  - [x] 4.5 Add `toLogArray(): array` for structured logging

- [x] **Task 5: ContentGenerationOrchestrator Service** (AC: 1)
  - [x] 5.1 Create `Service/ContentGenerationOrchestrator.php` implementing interface
  - [x] 5.2 Inject: `ContentTemplateManager`, `BedrockService`, `GenerationStateManager`, `EntityTypeManager`, `Logger`
  - [x] 5.3 Implement `generateAll()` iterating templates in order
  - [x] 5.4 Implement `generateSingle()` calling Bedrock and creating node
  - [x] 5.5 Update state via `GenerationStateManager` after each item

- [x] **Task 6: Node Creation Logic** (AC: 1)
  - [x] 6.1 Parse Bedrock JSON response to extract content fields
  - [x] 6.2 Create node using `Entity::create()` with correct bundle
  - [x] 6.3 Map ContentSpecification drupalFields to node field values
  - [x] 6.4 Handle different LocalGov Drupal content types appropriately
  - [x] 6.5 Save node and return node ID for result tracking

- [x] **Task 7: Error Handling and Recovery** (AC: 1)
  - [x] 7.1 Wrap individual item processing in try-catch
  - [x] 7.2 Log failures with full context (specId, error, attempt count)
  - [x] 7.3 Store failed spec IDs in state for retry capability
  - [x] 7.4 Continue processing remaining items after failure
  - [x] 7.5 Implement `retryFailed()` to reprocess only failed items

- [x] **Task 8: Rate Limiting Integration** (AC: 1)
  - [x] 8.1 Implemented exponential backoff for throttled requests
  - [x] 8.2 Add configurable delay between API calls (default 500ms)
  - [x] 8.3 Handle throttling errors with exponential backoff
  - [x] 8.4 Throttle detection via error message patterns
  - [x] 8.5 Config setting via ndx_council_generator.settings

- [x] **Task 9: Progress Callback Support** (AC: 1)
  - [x] 9.1 Add optional `$progressCallback` parameter to `generateAll()`
  - [x] 9.2 Call callback after each item with current progress
  - [x] 9.3 Support callable signature: `function(GenerationProgress $progress): void`
  - [x] 9.4 Callback enables Drush command to output progress
  - [x] 9.5 State updates enable admin UI to poll for progress

- [x] **Task 10: Service Registration** (AC: 1)
  - [x] 10.1 Register `ndx_council_generator.content_orchestrator` in services.yml
  - [x] 10.2 Add dependencies: content_template_manager, bedrock, state_manager, entity_type.manager
  - [x] 10.3 Config via ndx_council_generator.settings for rate_limit_delay_ms
  - [x] 10.4 Service registered with proper DI

- [x] **Task 11: Unit Tests** (AC: 1)
  - [x] 11.1 Create `ContentGenerationResultTest.php` for value object
  - [x] 11.2 GenerationProgress covered by Story 5-1 tests
  - [x] 11.3 Create `GenerationSummaryTest.php` for value object
  - [x] 11.4 Create `ContentGenerationOrchestratorTest.php` with mocked dependencies
  - [x] 11.5 Test error handling, progress tracking, and summary generation

## Dev Notes

### Service Architecture

The ContentGenerationOrchestrator is the core service that coordinates content generation. It uses:

1. **ContentTemplateManager** (Story 5-3): Provides ordered list of ContentSpecifications
2. **BedrockService** (ndx_aws_ai): Generates content via Nova Pro model
3. **GenerationStateManager** (Story 5-1): Persists progress for pause/resume
4. **EntityTypeManager** (Drupal core): Creates node entities

### Generation Flow

```
generateAll(identity)
  │
  ├─> Get ordered templates from ContentTemplateManager
  │
  ├─> For each ContentSpecification:
  │     ├─> Render prompt with CouncilIdentity variables
  │     ├─> Call BedrockService.generateContent(prompt)
  │     ├─> Parse JSON response
  │     ├─> Create Drupal node with content
  │     ├─> Update GenerationStateManager progress
  │     ├─> Call progressCallback if provided
  │     └─> Store ContentGenerationResult
  │
  └─> Return GenerationSummary
```

### Bedrock Prompt Structure

ContentSpecification prompts are designed to return JSON:

```json
{
  "title": "Generated title",
  "summary": "Short summary text",
  "body": "<p>Full HTML body content...</p>",
  "related_links": [
    {"title": "Link text", "url": "/path"}
  ]
}
```

### LocalGov Drupal Content Type Mappings

| Content Type | Bundle | Key Fields |
|--------------|--------|------------|
| localgov_services_page | localgov_services_page | title, field_summary, body, field_service_landing |
| localgov_guides_page | localgov_guides_page | title, body, field_guide_parent |
| localgov_directory | localgov_directory_venue | title, body, field_address, field_opening_hours |
| localgov_news_article | localgov_news_article | title, body, field_news_date |
| page | page | title, body |

### Rate Limiting Strategy

- Default delay: 500ms between API calls
- Exponential backoff on throttling: 1s, 2s, 4s, 8s (max 3 retries)
- Total expected time for 47 items: ~25-30 seconds

### Error Recovery

Failed items are stored in GenerationState.metadata['failed_specs']:
```php
[
  'service-waste-recycling' => [
    'error' => 'API timeout',
    'attempts' => 1,
    'last_attempt' => 1735000000,
  ],
]
```

The `retryFailed()` method re-processes only these items.

### Project Structure Notes

- Aligns with existing module structure at `web/modules/custom/ndx_council_generator/`
- Value objects follow established pattern from Story 5-1, 5-2, 5-3
- Services use constructor property promotion (PHP 8.1+)
- Tests in `tests/src/Unit/` following Drupal testing standards

### References

- [Source: _bmad-output/implementation-artifacts/5-1-ndx-council-generator-module-foundation.md]
- [Source: _bmad-output/implementation-artifacts/5-2-council-identity-generator.md]
- [Source: _bmad-output/implementation-artifacts/5-3-content-generation-templates.md]
- [Source: ndx_council_generator/src/Service/ContentTemplateManager.php]
- [Source: ndx_council_generator/src/Value/ContentSpecification.php]
- [Source: ndx_aws_ai/src/Service/BedrockServiceInterface.php]

## Dependencies

- Story 5.1: ndx_council_generator module foundation (GenerationStateManager)
- Story 5.2: Council Identity Generator (CouncilIdentity value object)
- Story 5.3: Content Generation Templates (ContentTemplateManager, ContentSpecification)
- ndx_aws_ai module (BedrockService)

## Out of Scope

- Image specification collection (Story 5-5)
- Batch image generation (Story 5-6)
- Drush command interface (Story 5-7)
- Admin UI for progress display (future enhancement)

## Definition of Done

- [x] ContentGenerationOrchestrator service processes all templates in order
- [x] Drupal nodes are created with correct content type and field mappings
- [x] Progress is tracked and persisted via GenerationStateManager
- [x] Individual failures don't stop overall generation
- [x] Failed items can be retried via retryFailed() method
- [x] Rate limiting prevents Bedrock API throttling
- [x] Progress callback enables real-time progress reporting
- [x] All value objects have unit tests
- [x] Service has unit tests with mocked dependencies
- [x] Code follows Drupal coding standards

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

### Completion Notes List

- Implemented ContentGenerationOrchestrator service for coordinating AI content generation
- Created ContentGenerationResult value object for tracking individual item results
- Created GenerationSummary value object for batch generation reporting
- Reused existing GenerationProgress from Story 5-1 for phase-based progress tracking
- Implemented exponential backoff for Bedrock API throttling (1s, 2s, 4s retries)
- Configurable rate limit delay between API calls (default 500ms)
- Progress callback support enables Drush and admin UI integration
- Failed specs stored in state metadata for retry capability
- All tests use mocked dependencies following Drupal testing patterns

### File List

- `ndx_council_generator.services.yml` - Added content_orchestrator service
- `src/Service/ContentGenerationOrchestratorInterface.php` - Orchestrator interface
- `src/Service/ContentGenerationOrchestrator.php` - Main orchestrator implementation
- `src/Value/ContentGenerationResult.php` - Individual result value object
- `src/Value/GenerationSummary.php` - Batch summary value object
- `tests/src/Unit/Value/ContentGenerationResultTest.php` - Result tests
- `tests/src/Unit/Value/GenerationSummaryTest.php` - Summary tests
- `tests/src/Unit/Service/ContentGenerationOrchestratorTest.php` - Orchestrator tests
