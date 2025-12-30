<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Drupal\media\MediaInterface;
use Drupal\ndx_aws_ai\Result\AltTextResult;

/**
 * Interface for AI-powered alt-text generation service.
 *
 * Provides WCAG-compliant alt-text generation for media images
 * using the Nova 2 Omni Vision service.
 *
 * Story 4.5: Auto Alt-Text on Media Upload
 */
interface AltTextGeneratorInterface {

  /**
   * Maximum recommended alt-text length in characters.
   */
  public const MAX_ALT_TEXT_LENGTH = 125;

  /**
   * Default batch size for bulk processing.
   */
  public const DEFAULT_BATCH_SIZE = 10;

  /**
   * Generate alt-text for raw image data.
   *
   * @param string $imageData
   *   The image data (binary or base64-encoded).
   * @param string $mimeType
   *   The image MIME type (e.g., 'image/jpeg').
   * @param string|null $context
   *   Optional context about where the image is used.
   * @param bool $isBase64
   *   TRUE if imageData is already base64-encoded.
   *
   * @return \Drupal\ndx_aws_ai\Result\AltTextResult
   *   The alt-text generation result.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   * @throws \InvalidArgumentException
   *   If the image format is not supported.
   */
  public function generateAltText(
    string $imageData,
    string $mimeType,
    ?string $context = NULL,
    bool $isBase64 = FALSE,
  ): AltTextResult;

  /**
   * Generate alt-text from a Drupal file URI.
   *
   * @param string $uri
   *   The Drupal stream wrapper URI (e.g., 'public://images/photo.jpg').
   * @param string|null $context
   *   Optional context about where the image is used.
   *
   * @return \Drupal\ndx_aws_ai\Result\AltTextResult
   *   The alt-text generation result.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   * @throws \InvalidArgumentException
   *   If the file doesn't exist or format is not supported.
   */
  public function generateAltTextFromUri(string $uri, ?string $context = NULL): AltTextResult;

  /**
   * Generate alt-text for a media entity.
   *
   * @param \Drupal\media\MediaInterface $media
   *   The media entity (must be of bundle 'image').
   * @param string|null $context
   *   Optional context about where the image is used.
   *
   * @return \Drupal\ndx_aws_ai\Result\AltTextResult
   *   The alt-text generation result.
   *
   * @throws \InvalidArgumentException
   *   If the media entity is not an image type.
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function generateAltTextForMedia(
    MediaInterface $media,
    ?string $context = NULL,
  ): AltTextResult;

  /**
   * Regenerate alt-text for a media entity, replacing existing value.
   *
   * @param \Drupal\media\MediaInterface $media
   *   The media entity to regenerate alt-text for.
   * @param bool $saveEntity
   *   Whether to save the media entity after updating.
   *
   * @return \Drupal\ndx_aws_ai\Result\AltTextResult
   *   The alt-text generation result.
   *
   * @throws \InvalidArgumentException
   *   If the media entity is not an image type.
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function regenerateAltText(
    MediaInterface $media,
    bool $saveEntity = FALSE,
  ): AltTextResult;

  /**
   * Batch generate alt-text for multiple media entities.
   *
   * @param array $mediaIds
   *   Array of media entity IDs to process.
   * @param int $batchSize
   *   Number of items to process per batch (for rate limiting).
   * @param bool $skipExisting
   *   Whether to skip media that already has alt-text.
   *
   * @return array<int, \Drupal\ndx_aws_ai\Result\AltTextResult>
   *   Array of results keyed by media ID.
   */
  public function batchGenerate(
    array $mediaIds,
    int $batchSize = self::DEFAULT_BATCH_SIZE,
    bool $skipExisting = TRUE,
  ): array;

  /**
   * Check if a media entity has AI-generated alt-text.
   *
   * @param \Drupal\media\MediaInterface $media
   *   The media entity to check.
   *
   * @return bool
   *   TRUE if the alt-text was AI-generated.
   */
  public function hasAiGeneratedAltText(MediaInterface $media): bool;

  /**
   * Check if a media entity needs alt-text generation.
   *
   * @param \Drupal\media\MediaInterface $media
   *   The media entity to check.
   *
   * @return bool
   *   TRUE if alt-text should be generated (empty or missing).
   */
  public function needsAltText(MediaInterface $media): bool;

  /**
   * Get the image field name for a media bundle.
   *
   * @param string $bundle
   *   The media bundle (e.g., 'image').
   *
   * @return string|null
   *   The field name or NULL if not an image bundle.
   */
  public function getImageFieldName(string $bundle): ?string;

  /**
   * Check if the alt-text generation service is available.
   *
   * @return bool
   *   TRUE if the service is properly configured.
   */
  public function isAvailable(): bool;

}
