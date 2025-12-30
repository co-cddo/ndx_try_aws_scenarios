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
   *
   * @return \Drupal\ndx_council_generator\Value\GenerationState
   *   Current state, or idle state if not set.
   */
  public function getState(): GenerationState;

  /**
   * Save generation state.
   *
   * @param \Drupal\ndx_council_generator\Value\GenerationState $state
   *   State to save.
   */
  public function saveState(GenerationState $state): void;

  /**
   * Clear generation state (reset to idle).
   */
  public function clearState(): void;

  /**
   * Update progress within current state.
   *
   * @param int $currentStep
   *   Current step number.
   * @param int $totalSteps
   *   Total number of steps.
   * @param string $phase
   *   Current phase description.
   */
  public function updateProgress(int $currentStep, int $totalSteps, string $phase): void;

  /**
   * Update state status.
   *
   * @param string $status
   *   New status value.
   */
  public function updateStatus(string $status): void;

  /**
   * Set error state with message.
   *
   * @param string $message
   *   Error message.
   */
  public function setError(string $message): void;

  /**
   * Mark generation as complete.
   */
  public function markComplete(): void;

  /**
   * Check if generation is currently in progress.
   *
   * @return bool
   *   TRUE if generation is in progress.
   */
  public function isGenerating(): bool;

  /**
   * Start a new generation (resets state with start timestamp).
   *
   * @param int $totalSteps
   *   Expected total steps.
   *
   * @return \Drupal\ndx_council_generator\Value\GenerationState
   *   New started state.
   */
  public function startGeneration(int $totalSteps): GenerationState;

  /**
   * Store identity data in state.
   *
   * @param array $identity
   *   Council identity data.
   */
  public function setIdentity(array $identity): void;

}
