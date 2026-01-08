<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\ndx_aws_ai\Service\BedrockServiceInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Controller for AI service status checks.
 *
 * Story 3.4: CKEditor AI Toolbar Plugin
 *
 * Provides an endpoint for checking AI service availability,
 * used by the CKEditor AI toolbar to enable/disable features.
 */
class AiStatusController extends ControllerBase {

  /**
   * The Bedrock service.
   *
   * @var \Drupal\ndx_aws_ai\Service\BedrockServiceInterface
   */
  protected BedrockServiceInterface $bedrockService;

  /**
   * Constructs an AiStatusController object.
   *
   * @param \Drupal\ndx_aws_ai\Service\BedrockServiceInterface $bedrock_service
   *   The Bedrock service.
   */
  public function __construct(BedrockServiceInterface $bedrock_service) {
    $this->bedrockService = $bedrock_service;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('ndx_aws_ai.bedrock')
    );
  }

  /**
   * Returns the AI service availability status.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with availability status.
   */
  public function status(): JsonResponse {
    $available = $this->checkBedrockAvailability();

    return new JsonResponse([
      'available' => $available,
      'message' => $available ? 'AI services ready' : 'AI services unavailable',
      'timestamp' => time(),
    ]);
  }

  /**
   * Checks if Amazon Bedrock services are available.
   *
   * @return bool
   *   TRUE if Bedrock is available, FALSE otherwise.
   */
  protected function checkBedrockAvailability(): bool {
    try {
      // Check if the Bedrock service is configured and accessible.
      return $this->bedrockService->isAvailable();
    }
    catch (\Exception $e) {
      // Log the error but don't expose details to the client.
      $this->getLogger('ndx_aws_ai')->warning(
        'AI availability check failed: @message',
        ['@message' => $e->getMessage()]
      );
      return FALSE;
    }
  }

}
