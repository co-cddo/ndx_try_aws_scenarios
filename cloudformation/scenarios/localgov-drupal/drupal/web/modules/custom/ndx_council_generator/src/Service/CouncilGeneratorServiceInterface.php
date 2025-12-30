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
   * Estimated steps for generation.
   */
  public const IDENTITY_STEPS = 3;
  public const CONTENT_STEPS = 140;
  public const IMAGE_STEPS = 30;

  /**
   * Start council generation process.
   *
   * @param array $options
   *   Optional generation options:
   *   - region: Preferred UK region.
   *   - theme: Preferred council theme/character.
   *   - skip_images: If TRUE, skip image generation.
   *
   * @return bool
   *   TRUE if generation started successfully.
   */
  public function startGeneration(array $options = []): bool;

  /**
   * Get current generation progress.
   *
   * @return \Drupal\ndx_council_generator\Value\GenerationState
   *   Current generation state.
   */
  public function getProgress(): GenerationState;

  /**
   * Pause current generation.
   *
   * Generation can be resumed later from the current step.
   */
  public function pauseGeneration(): void;

  /**
   * Resume paused generation.
   *
   * Continues from the last saved checkpoint.
   */
  public function resumeGeneration(): void;

  /**
   * Cancel and reset generation.
   *
   * This clears all generation state. Any partially generated content
   * may need to be cleaned up separately.
   */
  public function cancelGeneration(): void;

  /**
   * Check if generation service is available.
   *
   * Verifies that required AWS services are accessible.
   *
   * @return bool
   *   TRUE if service is available and ready.
   */
  public function isAvailable(): bool;

  /**
   * Get estimated total steps for full generation.
   *
   * @param bool $includeImages
   *   Whether to include image generation steps.
   *
   * @return int
   *   Total estimated steps.
   */
  public function getEstimatedTotalSteps(bool $includeImages = TRUE): int;

}
