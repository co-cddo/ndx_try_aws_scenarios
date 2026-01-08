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

  /**
   * All valid status values.
   */
  public const VALID_STATUSES = [
    self::STATUS_IDLE,
    self::STATUS_GENERATING_IDENTITY,
    self::STATUS_GENERATING_CONTENT,
    self::STATUS_GENERATING_IMAGES,
    self::STATUS_COMPLETE,
    self::STATUS_ERROR,
    self::STATUS_PAUSED,
  ];

  /**
   * Constructs a GenerationState.
   *
   * @param string $status
   *   Current generation status.
   * @param array|null $identity
   *   Generated council identity data.
   * @param int $currentStep
   *   Current step number.
   * @param int $totalSteps
   *   Total number of steps.
   * @param string|null $currentPhase
   *   Human-readable current phase description.
   * @param string|null $lastError
   *   Last error message if any.
   * @param int $startedAt
   *   Unix timestamp when generation started.
   * @param int|null $completedAt
   *   Unix timestamp when generation completed.
   */
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

  /**
   * Get progress as percentage.
   *
   * @return int
   *   Progress percentage (0-100).
   */
  public function getProgressPercentage(): int {
    if ($this->totalSteps === 0) {
      return 0;
    }
    return (int) round(($this->currentStep / $this->totalSteps) * 100);
  }

  /**
   * Check if generation is complete.
   *
   * @return bool
   *   TRUE if generation completed successfully.
   */
  public function isComplete(): bool {
    return $this->status === self::STATUS_COMPLETE;
  }

  /**
   * Check if generation is currently in progress.
   *
   * @return bool
   *   TRUE if generation is actively running.
   */
  public function isInProgress(): bool {
    return in_array($this->status, [
      self::STATUS_GENERATING_IDENTITY,
      self::STATUS_GENERATING_CONTENT,
      self::STATUS_GENERATING_IMAGES,
    ], TRUE);
  }

  /**
   * Check if generation has encountered an error.
   *
   * @return bool
   *   TRUE if generation failed with an error.
   */
  public function hasError(): bool {
    return $this->status === self::STATUS_ERROR;
  }

  /**
   * Check if generation is paused.
   *
   * @return bool
   *   TRUE if generation is paused.
   */
  public function isPaused(): bool {
    return $this->status === self::STATUS_PAUSED;
  }

  /**
   * Check if generation is idle (not started).
   *
   * @return bool
   *   TRUE if no generation has been started.
   */
  public function isIdle(): bool {
    return $this->status === self::STATUS_IDLE;
  }

  /**
   * Get accessible progress text for aria-live regions.
   *
   * @return string
   *   Human-readable progress description.
   */
  public function getAccessibleProgressText(): string {
    if ($this->isIdle()) {
      return 'Council generation not started.';
    }

    if ($this->isComplete()) {
      return 'Council generation complete.';
    }

    if ($this->hasError()) {
      return sprintf('Council generation failed: %s', $this->lastError ?? 'Unknown error');
    }

    return sprintf(
      'Council generation: %d%% complete. Current phase: %s. Step %d of %d.',
      $this->getProgressPercentage(),
      $this->currentPhase ?? 'initializing',
      $this->currentStep,
      $this->totalSteps
    );
  }

  /**
   * Convert state to array for storage.
   *
   * @return array
   *   State as associative array.
   */
  public function toArray(): array {
    return [
      'status' => $this->status,
      'identity' => $this->identity,
      'currentStep' => $this->currentStep,
      'totalSteps' => $this->totalSteps,
      'currentPhase' => $this->currentPhase,
      'lastError' => $this->lastError,
      'startedAt' => $this->startedAt,
      'completedAt' => $this->completedAt,
    ];
  }

  /**
   * Create state from array.
   *
   * @param array $data
   *   State data array.
   *
   * @return self
   *   New GenerationState instance.
   */
  public static function fromArray(array $data): self {
    return new self(
      status: $data['status'] ?? self::STATUS_IDLE,
      identity: $data['identity'] ?? NULL,
      currentStep: (int) ($data['currentStep'] ?? 0),
      totalSteps: (int) ($data['totalSteps'] ?? 0),
      currentPhase: $data['currentPhase'] ?? NULL,
      lastError: $data['lastError'] ?? NULL,
      startedAt: (int) ($data['startedAt'] ?? 0),
      completedAt: isset($data['completedAt']) ? (int) $data['completedAt'] : NULL,
    );
  }

  /**
   * Create an idle state.
   *
   * @return self
   *   Idle GenerationState.
   */
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

  /**
   * Create a new state with updated progress.
   *
   * @param int $currentStep
   *   New current step.
   * @param int $totalSteps
   *   New total steps.
   * @param string $phase
   *   Current phase description.
   *
   * @return self
   *   New state with updated progress.
   */
  public function withProgress(int $currentStep, int $totalSteps, string $phase): self {
    return new self(
      status: $this->status,
      identity: $this->identity,
      currentStep: $currentStep,
      totalSteps: $totalSteps,
      currentPhase: $phase,
      lastError: $this->lastError,
      startedAt: $this->startedAt,
      completedAt: $this->completedAt,
    );
  }

  /**
   * Create a new state with updated status.
   *
   * @param string $status
   *   New status.
   *
   * @return self
   *   New state with updated status.
   */
  public function withStatus(string $status): self {
    return new self(
      status: $status,
      identity: $this->identity,
      currentStep: $this->currentStep,
      totalSteps: $this->totalSteps,
      currentPhase: $this->currentPhase,
      lastError: $this->lastError,
      startedAt: $this->startedAt,
      completedAt: $status === self::STATUS_COMPLETE ? time() : $this->completedAt,
    );
  }

  /**
   * Create a new state with identity data.
   *
   * @param array $identity
   *   Council identity data.
   *
   * @return self
   *   New state with identity.
   */
  public function withIdentity(array $identity): self {
    return new self(
      status: $this->status,
      identity: $identity,
      currentStep: $this->currentStep,
      totalSteps: $this->totalSteps,
      currentPhase: $this->currentPhase,
      lastError: $this->lastError,
      startedAt: $this->startedAt,
      completedAt: $this->completedAt,
    );
  }

  /**
   * Create a new state with error.
   *
   * @param string $error
   *   Error message.
   *
   * @return self
   *   New state in error status.
   */
  public function withError(string $error): self {
    return new self(
      status: self::STATUS_ERROR,
      identity: $this->identity,
      currentStep: $this->currentStep,
      totalSteps: $this->totalSteps,
      currentPhase: $this->currentPhase,
      lastError: $error,
      startedAt: $this->startedAt,
      completedAt: NULL,
    );
  }

}
