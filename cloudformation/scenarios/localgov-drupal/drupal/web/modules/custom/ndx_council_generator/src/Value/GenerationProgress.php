<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Value;

/**
 * Value object representing generation progress.
 *
 * Story 5.1: ndx_council_generator Module Foundation
 */
final class GenerationProgress {

  /**
   * Phase constants for progress tracking.
   */
  public const PHASE_IDENTITY = 'identity';
  public const PHASE_CONTENT = 'content';
  public const PHASE_IMAGES = 'images';
  public const PHASE_COMPLETE = 'complete';

  /**
   * Constructs a GenerationProgress.
   *
   * @param string $phase
   *   Current phase identifier.
   * @param string $phaseLabel
   *   Human-readable phase label.
   * @param int $currentStep
   *   Current step within phase.
   * @param int $totalSteps
   *   Total steps in phase.
   * @param string|null $currentItem
   *   Description of current item being processed.
   */
  public function __construct(
    public readonly string $phase,
    public readonly string $phaseLabel,
    public readonly int $currentStep,
    public readonly int $totalSteps,
    public readonly ?string $currentItem = NULL,
  ) {}

  /**
   * Get phase progress percentage.
   *
   * @return int
   *   Progress percentage (0-100).
   */
  public function getPercentage(): int {
    if ($this->totalSteps === 0) {
      return 0;
    }
    return (int) round(($this->currentStep / $this->totalSteps) * 100);
  }

  /**
   * Get progress text for display.
   *
   * @return string
   *   Human-readable progress text.
   */
  public function getProgressText(): string {
    $text = sprintf(
      '%s: Step %d of %d (%d%%)',
      $this->phaseLabel,
      $this->currentStep,
      $this->totalSteps,
      $this->getPercentage()
    );

    if ($this->currentItem !== NULL) {
      $text .= sprintf(' - %s', $this->currentItem);
    }

    return $text;
  }

  /**
   * Check if phase is complete.
   *
   * @return bool
   *   TRUE if current step equals total steps.
   */
  public function isPhaseComplete(): bool {
    return $this->currentStep >= $this->totalSteps && $this->totalSteps > 0;
  }

  /**
   * Convert to array for serialization.
   *
   * @return array
   *   Progress as associative array.
   */
  public function toArray(): array {
    return [
      'phase' => $this->phase,
      'phase_label' => $this->phaseLabel,
      'current_step' => $this->currentStep,
      'total_steps' => $this->totalSteps,
      'current_item' => $this->currentItem,
      'percentage' => $this->getPercentage(),
      'progress_text' => $this->getProgressText(),
    ];
  }

  /**
   * Create from array.
   *
   * @param array $data
   *   Progress data array.
   *
   * @return self
   *   New GenerationProgress instance.
   */
  public static function fromArray(array $data): self {
    return new self(
      phase: $data['phase'] ?? self::PHASE_IDENTITY,
      phaseLabel: $data['phase_label'] ?? 'Processing',
      currentStep: (int) ($data['current_step'] ?? 0),
      totalSteps: (int) ($data['total_steps'] ?? 0),
      currentItem: $data['current_item'] ?? NULL,
    );
  }

  /**
   * Create progress for identity generation phase.
   *
   * @param int $step
   *   Current step.
   * @param int $total
   *   Total steps.
   * @param string|null $item
   *   Current item description.
   *
   * @return self
   *   Progress for identity phase.
   */
  public static function identity(int $step, int $total, ?string $item = NULL): self {
    return new self(
      phase: self::PHASE_IDENTITY,
      phaseLabel: 'Generating council identity',
      currentStep: $step,
      totalSteps: $total,
      currentItem: $item,
    );
  }

  /**
   * Create progress for content generation phase.
   *
   * @param int $step
   *   Current step.
   * @param int $total
   *   Total steps.
   * @param string|null $item
   *   Current item description.
   *
   * @return self
   *   Progress for content phase.
   */
  public static function content(int $step, int $total, ?string $item = NULL): self {
    return new self(
      phase: self::PHASE_CONTENT,
      phaseLabel: 'Generating content',
      currentStep: $step,
      totalSteps: $total,
      currentItem: $item,
    );
  }

  /**
   * Create progress for image generation phase.
   *
   * @param int $step
   *   Current step.
   * @param int $total
   *   Total steps.
   * @param string|null $item
   *   Current item description.
   *
   * @return self
   *   Progress for images phase.
   */
  public static function images(int $step, int $total, ?string $item = NULL): self {
    return new self(
      phase: self::PHASE_IMAGES,
      phaseLabel: 'Generating images',
      currentStep: $step,
      totalSteps: $total,
      currentItem: $item,
    );
  }

  /**
   * Create complete progress state.
   *
   * @return self
   *   Complete progress state.
   */
  public static function complete(): self {
    return new self(
      phase: self::PHASE_COMPLETE,
      phaseLabel: 'Complete',
      currentStep: 1,
      totalSteps: 1,
      currentItem: NULL,
    );
  }

}
