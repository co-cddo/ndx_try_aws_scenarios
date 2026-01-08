<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\Core\State\StateInterface;
use Drupal\ndx_council_generator\Value\GenerationState;

/**
 * Manages generation state via Drupal State API.
 *
 * Story 5.1: ndx_council_generator Module Foundation
 */
class GenerationStateManager implements GenerationStateManagerInterface {

  /**
   * Constructs a GenerationStateManager.
   *
   * @param \Drupal\Core\State\StateInterface $state
   *   The Drupal state service.
   * @param \Drupal\Core\Logger\LoggerChannelInterface $logger
   *   The logger channel.
   */
  public function __construct(
    protected readonly StateInterface $state,
    protected readonly LoggerChannelInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function getState(): GenerationState {
    $data = $this->state->get(self::STATE_KEY, []);

    if (empty($data)) {
      return GenerationState::idle();
    }

    return GenerationState::fromArray($data);
  }

  /**
   * {@inheritdoc}
   */
  public function saveState(GenerationState $state): void {
    $this->state->set(self::STATE_KEY, $state->toArray());

    $this->logger->debug('Generation state saved: @status (step @step/@total)', [
      '@status' => $state->status,
      '@step' => $state->currentStep,
      '@total' => $state->totalSteps,
    ]);
  }

  /**
   * {@inheritdoc}
   */
  public function clearState(): void {
    $this->state->delete(self::STATE_KEY);
    $this->logger->info('Generation state cleared.');
  }

  /**
   * {@inheritdoc}
   */
  public function updateProgress(int $currentStep, int $totalSteps, string $phase): void {
    $currentState = $this->getState();
    $newState = $currentState->withProgress($currentStep, $totalSteps, $phase);
    $this->saveState($newState);
  }

  /**
   * {@inheritdoc}
   */
  public function updateStatus(string $status): void {
    if (!in_array($status, GenerationState::VALID_STATUSES, TRUE)) {
      throw new \InvalidArgumentException(sprintf('Invalid status: %s', $status));
    }

    $currentState = $this->getState();
    $newState = $currentState->withStatus($status);
    $this->saveState($newState);
  }

  /**
   * {@inheritdoc}
   */
  public function setError(string $message): void {
    $currentState = $this->getState();
    $newState = $currentState->withError($message);
    $this->saveState($newState);

    $this->logger->error('Generation error: @message', [
      '@message' => $message,
    ]);
  }

  /**
   * {@inheritdoc}
   */
  public function markComplete(): void {
    $currentState = $this->getState();
    $newState = $currentState->withStatus(GenerationState::STATUS_COMPLETE);
    $this->saveState($newState);

    $this->logger->info('Generation completed successfully.');
  }

  /**
   * {@inheritdoc}
   */
  public function isGenerating(): bool {
    return $this->getState()->isInProgress();
  }

  /**
   * {@inheritdoc}
   */
  public function startGeneration(int $totalSteps): GenerationState {
    $state = new GenerationState(
      status: GenerationState::STATUS_GENERATING_IDENTITY,
      identity: NULL,
      currentStep: 0,
      totalSteps: $totalSteps,
      currentPhase: 'Starting generation',
      lastError: NULL,
      startedAt: time(),
      completedAt: NULL,
    );

    $this->saveState($state);

    $this->logger->info('Generation started with @total total steps.', [
      '@total' => $totalSteps,
    ]);

    return $state;
  }

  /**
   * {@inheritdoc}
   */
  public function setIdentity(array $identity): void {
    $currentState = $this->getState();
    $newState = $currentState->withIdentity($identity);
    $this->saveState($newState);

    $this->logger->info('Council identity set: @name', [
      '@name' => $identity['name'] ?? 'Unknown',
    ]);
  }

}
