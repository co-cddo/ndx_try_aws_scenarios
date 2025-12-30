<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\ndx_aws_ai\Service\BedrockServiceInterface;
use Drupal\ndx_council_generator\Exception\GenerationException;
use Drupal\ndx_council_generator\Value\GenerationState;

/**
 * Orchestrates council identity and content generation.
 *
 * Story 5.1: ndx_council_generator Module Foundation
 */
class CouncilGeneratorService implements CouncilGeneratorServiceInterface {

  /**
   * Constructs a CouncilGeneratorService.
   *
   * @param \Drupal\ndx_council_generator\Service\GenerationStateManagerInterface $stateManager
   *   The generation state manager.
   * @param \Drupal\ndx_aws_ai\Service\BedrockServiceInterface $bedrockService
   *   The Bedrock service.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\Core\Logger\LoggerChannelInterface $logger
   *   The logger channel.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The config factory.
   */
  public function __construct(
    protected readonly GenerationStateManagerInterface $stateManager,
    protected readonly BedrockServiceInterface $bedrockService,
    protected readonly EntityTypeManagerInterface $entityTypeManager,
    protected readonly LoggerChannelInterface $logger,
    protected readonly ConfigFactoryInterface $configFactory,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function startGeneration(array $options = []): bool {
    // Check if already generating.
    if ($this->stateManager->isGenerating()) {
      $this->logger->warning('Cannot start generation: already in progress.');
      return FALSE;
    }

    // Check service availability.
    if (!$this->isAvailable()) {
      $this->logger->error('Cannot start generation: AWS services not available.');
      return FALSE;
    }

    $includeImages = !($options['skip_images'] ?? FALSE);
    $totalSteps = $this->getEstimatedTotalSteps($includeImages);

    try {
      // Initialize state.
      $this->stateManager->startGeneration($totalSteps);

      $this->logger->info('Council generation started with options: @options', [
        '@options' => json_encode($options),
      ]);

      // Actual generation logic will be implemented in Story 5.2+
      // This foundation provides the orchestration skeleton.

      return TRUE;
    }
    catch (\Exception $e) {
      $this->stateManager->setError($e->getMessage());
      $this->logger->error('Failed to start generation: @error', [
        '@error' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function getProgress(): GenerationState {
    return $this->stateManager->getState();
  }

  /**
   * {@inheritdoc}
   */
  public function pauseGeneration(): void {
    $state = $this->stateManager->getState();

    if (!$state->isInProgress()) {
      $this->logger->warning('Cannot pause: generation not in progress.');
      return;
    }

    $this->stateManager->updateStatus(GenerationState::STATUS_PAUSED);
    $this->logger->info('Generation paused at step @step.', [
      '@step' => $state->currentStep,
    ]);
  }

  /**
   * {@inheritdoc}
   */
  public function resumeGeneration(): void {
    $state = $this->stateManager->getState();

    if (!$state->isPaused()) {
      $this->logger->warning('Cannot resume: generation not paused.');
      return;
    }

    // Determine which phase to resume.
    $resumeStatus = $this->determineResumeStatus($state);
    $this->stateManager->updateStatus($resumeStatus);

    $this->logger->info('Generation resumed from step @step.', [
      '@step' => $state->currentStep,
    ]);
  }

  /**
   * {@inheritdoc}
   */
  public function cancelGeneration(): void {
    $state = $this->stateManager->getState();

    if ($state->isIdle()) {
      $this->logger->info('Nothing to cancel: generation not started.');
      return;
    }

    $this->stateManager->clearState();
    $this->logger->info('Generation cancelled and state cleared.');
  }

  /**
   * {@inheritdoc}
   */
  public function isAvailable(): bool {
    try {
      return $this->bedrockService->isAvailable();
    }
    catch (\Exception $e) {
      $this->logger->error('Service availability check failed: @error', [
        '@error' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function getEstimatedTotalSteps(bool $includeImages = TRUE): int {
    $total = self::IDENTITY_STEPS + self::CONTENT_STEPS;

    if ($includeImages) {
      $total += self::IMAGE_STEPS;
    }

    return $total;
  }

  /**
   * Determine which status to resume to based on progress.
   *
   * @param \Drupal\ndx_council_generator\Value\GenerationState $state
   *   Current state.
   *
   * @return string
   *   Status to resume to.
   */
  protected function determineResumeStatus(GenerationState $state): string {
    $step = $state->currentStep;

    if ($step < self::IDENTITY_STEPS) {
      return GenerationState::STATUS_GENERATING_IDENTITY;
    }

    if ($step < self::IDENTITY_STEPS + self::CONTENT_STEPS) {
      return GenerationState::STATUS_GENERATING_CONTENT;
    }

    return GenerationState::STATUS_GENERATING_IMAGES;
  }

}
