<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\ndx_council_generator\Batch\GenerationBatchOperations;
use Drupal\ndx_council_generator\Service\CouncilGeneratorServiceInterface;
use Drupal\ndx_council_generator\Service\GenerationStateManagerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * API controller for council generation.
 *
 * Story 5.1: ndx_council_generator Module Foundation
 */
class GenerationApiController extends ControllerBase {

  /**
   * Constructs a GenerationApiController.
   *
   * @param \Drupal\ndx_council_generator\Service\GenerationStateManagerInterface $stateManager
   *   The generation state manager.
   * @param \Drupal\ndx_council_generator\Service\CouncilGeneratorServiceInterface $generatorService
   *   The council generator service.
   */
  public function __construct(
    protected readonly GenerationStateManagerInterface $stateManager,
    protected readonly CouncilGeneratorServiceInterface $generatorService,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('ndx_council_generator.state_manager'),
      $container->get('ndx_council_generator.generator'),
    );
  }

  /**
   * Get current generation status.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with status data.
   */
  public function status(): JsonResponse {
    $state = $this->stateManager->getState();

    return new JsonResponse([
      'success' => TRUE,
      'status' => $state->status,
      'progress' => $state->getProgressPercentage(),
      'currentStep' => $state->currentStep,
      'totalSteps' => $state->totalSteps,
      'currentPhase' => $state->currentPhase,
      'identity' => $state->identity,
      'error' => $state->lastError,
      'isComplete' => $state->isComplete(),
      'isInProgress' => $state->isInProgress(),
      'accessibleText' => $state->getAccessibleProgressText(),
    ]);
  }

  /**
   * Start generation.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request object.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response.
   */
  public function start(Request $request): JsonResponse {
    // Check if already generating.
    if ($this->stateManager->isGenerating()) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Generation already in progress.',
      ], 409);
    }

    // Check service availability.
    if (!$this->generatorService->isAvailable()) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'AWS services not available.',
      ], 503);
    }

    // Parse options from request.
    $content = $request->getContent();
    $data = $content ? json_decode($content, TRUE) : [];

    $options = [
      'skip_images' => (bool) ($data['skipImages'] ?? FALSE),
      'region' => $data['region'] ?? NULL,
    ];

    // Start generation using service.
    $started = $this->generatorService->startGeneration($options);

    if (!$started) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Failed to start generation.',
      ], 500);
    }

    $state = $this->stateManager->getState();

    return new JsonResponse([
      'success' => TRUE,
      'message' => 'Generation started.',
      'status' => $state->status,
      'totalSteps' => $state->totalSteps,
    ]);
  }

  /**
   * Cancel generation.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response.
   */
  public function cancel(): JsonResponse {
    $state = $this->stateManager->getState();

    if ($state->isIdle()) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'No generation in progress to cancel.',
      ], 400);
    }

    $this->generatorService->cancelGeneration();

    return new JsonResponse([
      'success' => TRUE,
      'message' => 'Generation cancelled.',
    ]);
  }

}
