<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\file\FileInterface;
use Drupal\ndx_aws_ai\Service\AltTextGeneratorInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Controller for AI alt-text generation API.
 *
 * Provides REST endpoints to generate alt-text for images using
 * Amazon Bedrock Nova 2 Omni Vision service.
 *
 * Story 4.5: Auto Alt-Text on Media Upload
 */
class AltTextController extends ControllerBase {

  /**
   * Constructs an AltTextController.
   *
   * @param \Drupal\ndx_aws_ai\Service\AltTextGeneratorInterface $altTextGenerator
   *   The alt-text generator service.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected AltTextGeneratorInterface $altTextGenerator,
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('ndx_aws_ai.alt_text_generator'),
      $container->get('logger.channel.ndx_aws_ai'),
    );
  }

  /**
   * Generate alt-text from a file ID.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request containing file_id.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with generated alt-text or error.
   */
  public function generateFromFile(Request $request): JsonResponse {
    // Parse JSON body.
    $content = $request->getContent();
    $data = json_decode($content, TRUE);

    if (!$data || empty($data['file_id'])) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => $this->t('No file ID provided.')->render(),
      ], Response::HTTP_BAD_REQUEST);
    }

    $fileId = (int) $data['file_id'];

    try {
      // Load the file entity.
      $file = $this->entityTypeManager()->getStorage('file')->load($fileId);
      if (!$file instanceof FileInterface) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => $this->t('File not found.')->render(),
        ], Response::HTTP_NOT_FOUND);
      }

      // Check if it's an image.
      $mimeType = $file->getMimeType();
      if (!str_starts_with($mimeType, 'image/')) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => $this->t('File is not an image.')->render(),
        ], Response::HTTP_BAD_REQUEST);
      }

      // Generate alt-text.
      $uri = $file->getFileUri();
      $result = $this->altTextGenerator->generateAltTextFromUri($uri);

      if ($result->isSuccess()) {
        return new JsonResponse([
          'success' => TRUE,
          'alt_text' => $result->altText,
          'confidence' => $result->confidence,
          'processing_time_ms' => $result->processingTimeMs,
        ]);
      }
      else {
        return new JsonResponse([
          'success' => FALSE,
          'error' => $result->error ?? $this->t('Alt-text generation failed.')->render(),
        ], Response::HTTP_INTERNAL_SERVER_ERROR);
      }
    }
    catch (\Exception $e) {
      $this->logger->error('Alt-text generation failed: @error', [
        '@error' => $e->getMessage(),
      ]);

      return new JsonResponse([
        'success' => FALSE,
        'error' => $this->t('Unable to generate alt-text. Please try again.')->render(),
      ], Response::HTTP_INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate alt-text from base64-encoded image data.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request containing image_data and mime_type.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with generated alt-text or error.
   */
  public function generateFromBase64(Request $request): JsonResponse {
    // Parse JSON body.
    $content = $request->getContent();
    $data = json_decode($content, TRUE);

    if (!$data || empty($data['image_data']) || empty($data['mime_type'])) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => $this->t('Image data and MIME type are required.')->render(),
      ], Response::HTTP_BAD_REQUEST);
    }

    $imageData = $data['image_data'];
    $mimeType = $data['mime_type'];

    // Validate MIME type.
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($mimeType, $allowedTypes, TRUE)) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => $this->t('Unsupported image type: @type', ['@type' => $mimeType])->render(),
      ], Response::HTTP_BAD_REQUEST);
    }

    try {
      $result = $this->altTextGenerator->generateAltText($imageData, $mimeType, NULL, TRUE);

      if ($result->isSuccess()) {
        return new JsonResponse([
          'success' => TRUE,
          'alt_text' => $result->altText,
          'confidence' => $result->confidence,
          'processing_time_ms' => $result->processingTimeMs,
        ]);
      }
      else {
        return new JsonResponse([
          'success' => FALSE,
          'error' => $result->error ?? $this->t('Alt-text generation failed.')->render(),
        ], Response::HTTP_INTERNAL_SERVER_ERROR);
      }
    }
    catch (\Exception $e) {
      $this->logger->error('Alt-text generation from base64 failed: @error', [
        '@error' => $e->getMessage(),
      ]);

      return new JsonResponse([
        'success' => FALSE,
        'error' => $this->t('Unable to generate alt-text. Please try again.')->render(),
      ], Response::HTTP_INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Check if alt-text generation service is available.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with availability status.
   */
  public function checkAvailability(): JsonResponse {
    $isAvailable = $this->altTextGenerator->isAvailable();

    return new JsonResponse([
      'available' => $isAvailable,
    ]);
  }

}
