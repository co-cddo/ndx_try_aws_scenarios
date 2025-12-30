# Story 5.1: ndx_council_generator Module Foundation

Status: review

## Story

As a **developer**,
I want **a base module for council generation orchestration**,
So that **all generation features share common infrastructure**.

## Acceptance Criteria

1. **Given** the ndx_council_generator module is installed
   **When** I enable it in Drupal
   **Then** the module:
   - Depends on ndx_aws_ai for Bedrock access
   - Provides generation state management
   - Implements progress tracking hooks
   - Exposes generation service for dependency injection
   **And** the module integrates with Drupal's batch API
   **And** generation can be paused and resumed
   **And** errors are logged with context for debugging

## Tasks / Subtasks

- [ ] **Task 1: Module Scaffold** (AC: 1)
  - [ ] 1.1 Create `ndx_council_generator.info.yml` with ndx_aws_ai dependency
  - [ ] 1.2 Create `ndx_council_generator.module` with hook implementations
  - [ ] 1.3 Create `ndx_council_generator.services.yml` for DI
  - [ ] 1.4 Create `ndx_council_generator.permissions.yml`
  - [ ] 1.5 Create module directory structure (src/Service, src/Form, etc.)

- [ ] **Task 2: Generation State Manager** (AC: 1)
  - [ ] 2.1 Create `GenerationStateInterface.php` defining state contract
  - [ ] 2.2 Create `GenerationState.php` value object (identity, progress, status)
  - [ ] 2.3 Create `GenerationStateManagerInterface.php`
  - [ ] 2.4 Create `GenerationStateManager.php` using Drupal State API
  - [ ] 2.5 Implement save/load/clear methods for generation state

- [ ] **Task 3: Council Generation Service** (AC: 1)
  - [ ] 3.1 Create `CouncilGeneratorServiceInterface.php`
  - [ ] 3.2 Create `CouncilGeneratorService.php` with orchestration logic
  - [ ] 3.3 Inject BedrockService dependency from ndx_aws_ai
  - [ ] 3.4 Implement startGeneration() method stub
  - [ ] 3.5 Implement getProgress() and getStatus() methods

- [ ] **Task 4: Progress Tracking** (AC: 1)
  - [ ] 4.1 Create `GenerationProgressInterface.php`
  - [ ] 4.2 Create `GenerationProgress.php` with step/total/percentage
  - [ ] 4.3 Implement progress event hooks
  - [ ] 4.4 Create progress logging with context
  - [ ] 4.5 Add aria-live compatible progress output format

- [ ] **Task 5: Batch API Integration** (AC: 1)
  - [ ] 5.1 Create batch operation callback functions
  - [ ] 5.2 Implement batch set creation for generation phases
  - [ ] 5.3 Add batch finished callback with summary
  - [ ] 5.4 Integrate with Drupal's batch system
  - [ ] 5.5 Support pause/resume via batch checkpoints

- [ ] **Task 6: Error Handling & Logging** (AC: 1)
  - [ ] 6.1 Create `GenerationException.php` with context data
  - [ ] 6.2 Implement centralized error handler
  - [ ] 6.3 Add structured logging with generation context
  - [ ] 6.4 Create error recovery mechanism
  - [ ] 6.5 Implement retry logic for transient failures

- [ ] **Task 7: Configuration & Admin UI** (AC: 1)
  - [ ] 7.1 Create `ndx_council_generator.routing.yml` for admin routes
  - [ ] 7.2 Create `GenerationStatusForm.php` showing current state
  - [ ] 7.3 Add admin menu link
  - [ ] 7.4 Create status page showing generation progress
  - [ ] 7.5 Add "Clear State" functionality for debugging

- [ ] **Task 8: Unit Tests** (AC: 1)
  - [ ] 8.1 Create `GenerationStateManagerTest.php`
  - [ ] 8.2 Create `CouncilGeneratorServiceTest.php`
  - [ ] 8.3 Create `GenerationProgressTest.php`
  - [ ] 8.4 Mock BedrockService for isolation
  - [ ] 8.5 Test error handling and recovery

## Dev Notes

### Module Info File

```yaml
# ndx_council_generator.info.yml
name: 'NDX Council Generator'
type: module
description: 'Generates unique fictional UK council identity and content using AWS Bedrock AI.'
core_version_requirement: ^10
package: NDX
dependencies:
  - ndx_aws_ai:ndx_aws_ai

# Story 5.1: ndx_council_generator Module Foundation
```

### Services Definition

```yaml
# ndx_council_generator.services.yml
services:
  ndx_council_generator.state_manager:
    class: Drupal\ndx_council_generator\Service\GenerationStateManager
    arguments: ['@state', '@logger.channel.ndx_council_generator']

  ndx_council_generator.generator:
    class: Drupal\ndx_council_generator\Service\CouncilGeneratorService
    arguments:
      - '@ndx_council_generator.state_manager'
      - '@ndx_aws_ai.bedrock'
      - '@entity_type.manager'
      - '@logger.channel.ndx_council_generator'

  logger.channel.ndx_council_generator:
    parent: logger.channel_base
    arguments: ['ndx_council_generator']
```

### Generation State Value Object

```php
<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Value;

/**
 * Value object representing current generation state.
 *
 * Story 5.1: ndx_council_generator Module Foundation
 */
final class GenerationState {

  public const STATUS_IDLE = 'idle';
  public const STATUS_GENERATING_IDENTITY = 'generating_identity';
  public const STATUS_GENERATING_CONTENT = 'generating_content';
  public const STATUS_GENERATING_IMAGES = 'generating_images';
  public const STATUS_COMPLETE = 'complete';
  public const STATUS_ERROR = 'error';
  public const STATUS_PAUSED = 'paused';

  public function __construct(
    public readonly string $status,
    public readonly ?array $identity,
    public readonly int $currentStep,
    public readonly int $totalSteps,
    public readonly ?string $currentPhase,
    public readonly ?string $lastError,
    public readonly int $startedAt,
    public readonly ?int $completedAt,
  ) {}

  public function getProgressPercentage(): int {
    if ($this->totalSteps === 0) {
      return 0;
    }
    return (int) round(($this->currentStep / $this->totalSteps) * 100);
  }

  public function isComplete(): bool {
    return $this->status === self::STATUS_COMPLETE;
  }

  public function isInProgress(): bool {
    return in_array($this->status, [
      self::STATUS_GENERATING_IDENTITY,
      self::STATUS_GENERATING_CONTENT,
      self::STATUS_GENERATING_IMAGES,
    ], TRUE);
  }

  public function toArray(): array {
    return [
      'status' => $this->status,
      'identity' => $this->identity,
      'current_step' => $this->currentStep,
      'total_steps' => $this->totalSteps,
      'current_phase' => $this->currentPhase,
      'last_error' => $this->lastError,
      'started_at' => $this->startedAt,
      'completed_at' => $this->completedAt,
      'progress_percentage' => $this->getProgressPercentage(),
    ];
  }

  public static function fromArray(array $data): self {
    return new self(
      status: $data['status'] ?? self::STATUS_IDLE,
      identity: $data['identity'] ?? NULL,
      currentStep: $data['current_step'] ?? 0,
      totalSteps: $data['total_steps'] ?? 0,
      currentPhase: $data['current_phase'] ?? NULL,
      lastError: $data['last_error'] ?? NULL,
      startedAt: $data['started_at'] ?? 0,
      completedAt: $data['completed_at'] ?? NULL,
    );
  }

  public static function idle(): self {
    return new self(
      status: self::STATUS_IDLE,
      identity: NULL,
      currentStep: 0,
      totalSteps: 0,
      currentPhase: NULL,
      lastError: NULL,
      startedAt: 0,
      completedAt: NULL,
    );
  }
}
```

### State Manager Interface

```php
<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\ndx_council_generator\Value\GenerationState;

/**
 * Interface for generation state management.
 *
 * Story 5.1: ndx_council_generator Module Foundation
 */
interface GenerationStateManagerInterface {

  /**
   * State key in Drupal State API.
   */
  public const STATE_KEY = 'ndx_council_generator.generation_state';

  /**
   * Get current generation state.
   */
  public function getState(): GenerationState;

  /**
   * Save generation state.
   */
  public function saveState(GenerationState $state): void;

  /**
   * Clear generation state (reset to idle).
   */
  public function clearState(): void;

  /**
   * Update progress within current state.
   */
  public function updateProgress(int $currentStep, int $totalSteps, string $phase): void;

  /**
   * Set error state with message.
   */
  public function setError(string $message): void;

  /**
   * Mark generation as complete.
   */
  public function markComplete(): void;

  /**
   * Check if generation is currently in progress.
   */
  public function isGenerating(): bool;
}
```

### Council Generator Service Interface

```php
<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\ndx_council_generator\Value\GenerationState;

/**
 * Interface for council generation orchestration.
 *
 * Story 5.1: ndx_council_generator Module Foundation
 */
interface CouncilGeneratorServiceInterface {

  /**
   * Start council generation process.
   *
   * @param array $options
   *   Optional generation options (region preference, theme, etc.)
   *
   * @return bool
   *   TRUE if generation started successfully.
   */
  public function startGeneration(array $options = []): bool;

  /**
   * Get current generation progress.
   */
  public function getProgress(): GenerationState;

  /**
   * Pause current generation.
   */
  public function pauseGeneration(): void;

  /**
   * Resume paused generation.
   */
  public function resumeGeneration(): void;

  /**
   * Cancel and reset generation.
   */
  public function cancelGeneration(): void;

  /**
   * Check if generation service is available.
   */
  public function isAvailable(): bool;
}
```

### Batch Operations Pattern

```php
<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Batch;

/**
 * Batch operations for council generation.
 *
 * Story 5.1: ndx_council_generator Module Foundation
 */
class GenerationBatchOperations {

  /**
   * Batch operation: Generate council identity.
   */
  public static function generateIdentity(array $options, array &$context): void {
    $generator = \Drupal::service('ndx_council_generator.generator');
    $stateManager = \Drupal::service('ndx_council_generator.state_manager');

    try {
      // Identity generation logic (Story 5.2)
      $context['results']['identity'] = [];
      $context['message'] = t('Generating council identity...');

      $stateManager->updateProgress(1, 3, 'identity');
    }
    catch (\Exception $e) {
      $stateManager->setError($e->getMessage());
      $context['results']['errors'][] = $e->getMessage();
    }
  }

  /**
   * Batch finished callback.
   */
  public static function finished(bool $success, array $results, array $operations): void {
    $stateManager = \Drupal::service('ndx_council_generator.state_manager');

    if ($success && empty($results['errors'])) {
      $stateManager->markComplete();
      \Drupal::messenger()->addStatus(t('Council generation completed successfully.'));
    }
    else {
      $errors = $results['errors'] ?? ['Unknown error'];
      \Drupal::messenger()->addError(t('Council generation failed: @error', [
        '@error' => implode(', ', $errors),
      ]));
    }
  }
}
```

### Directory Structure

```
ndx_council_generator/
├── ndx_council_generator.info.yml
├── ndx_council_generator.module
├── ndx_council_generator.services.yml
├── ndx_council_generator.permissions.yml
├── ndx_council_generator.routing.yml
├── ndx_council_generator.links.menu.yml
├── src/
│   ├── Batch/
│   │   └── GenerationBatchOperations.php
│   ├── Exception/
│   │   └── GenerationException.php
│   ├── Form/
│   │   └── GenerationStatusForm.php
│   ├── Service/
│   │   ├── CouncilGeneratorService.php
│   │   ├── CouncilGeneratorServiceInterface.php
│   │   ├── GenerationStateManager.php
│   │   └── GenerationStateManagerInterface.php
│   └── Value/
│       ├── GenerationProgress.php
│       └── GenerationState.php
└── tests/
    └── src/
        └── Unit/
            ├── CouncilGeneratorServiceTest.php
            ├── GenerationStateManagerTest.php
            └── GenerationStateTest.php
```

### Progress Tracking Format

For aria-live compatible progress:

```php
/**
 * Get progress as accessible text.
 */
public function getAccessibleProgress(): string {
  $state = $this->stateManager->getState();

  return sprintf(
    'Council generation: %d%% complete. Current phase: %s. Step %d of %d.',
    $state->getProgressPercentage(),
    $state->currentPhase ?? 'initializing',
    $state->currentStep,
    $state->totalSteps
  );
}
```

## Dependencies

- ndx_aws_ai module (Story 3-1, 3-2)
- Drupal State API
- Drupal Batch API
- Drupal Logger

## Out of Scope

- Actual identity generation logic (Story 5-2)
- Content template processing (Story 5-3)
- Image generation (Story 5-6)
- Drush command (Story 5-7)

## Definition of Done

- [ ] Module installs and enables without errors
- [ ] Module depends on ndx_aws_ai
- [ ] GenerationStateManager saves/loads state via Drupal State API
- [ ] CouncilGeneratorService provides orchestration skeleton
- [ ] Batch API integration allows pause/resume
- [ ] Progress tracking updates state with step/total/phase
- [ ] Error handling logs with context
- [ ] Admin status page shows generation state
- [ ] Unit tests pass for state management
- [ ] Code follows Drupal coding standards
