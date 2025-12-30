<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Drupal\ndx_aws_ai\Result\ImageGenerationResult;

/**
 * Interface for AI image generation service.
 *
 * Provides text-to-image generation using Amazon Titan Image Generator.
 *
 * Story 5.6: Batch Image Generation
 */
interface ImageGenerationServiceInterface {

  /**
   * Amazon Titan Image Generator v2 model ID.
   */
  public const MODEL_TITAN_IMAGE = 'amazon.titan-image-generator-v2:0';

  /**
   * Default configuration scale (prompt adherence).
   */
  public const DEFAULT_CFG_SCALE = 8.0;

  /**
   * Valid dimensions supported by Titan Image Generator.
   *
   * @var array<int, array{0: int, 1: int}>
   */
  public const VALID_DIMENSIONS = [
    [1024, 1024],
    [768, 768],
    [512, 512],
    [768, 1152],
    [384, 576],
    [1152, 768],
    [576, 384],
    [768, 1280],
    [1280, 768],
  ];

  /**
   * Generate an image from a text prompt.
   *
   * @param string $prompt
   *   The text prompt describing the image to generate.
   * @param int $width
   *   Desired image width (will be mapped to valid Titan dimensions).
   * @param int $height
   *   Desired image height (will be mapped to valid Titan dimensions).
   * @param string $style
   *   Style hint: 'photo', 'illustration', or 'icon'.
   *
   * @return \Drupal\ndx_aws_ai\Result\ImageGenerationResult
   *   The generation result containing image data or error.
   */
  public function generateImage(
    string $prompt,
    int $width = 1024,
    int $height = 1024,
    string $style = 'photo',
  ): ImageGenerationResult;

  /**
   * Check if the image generation service is available.
   *
   * @return bool
   *   TRUE if the service is available, FALSE otherwise.
   */
  public function isAvailable(): bool;

  /**
   * Get the list of valid dimensions supported by the image generator.
   *
   * @return array<int, array{0: int, 1: int}>
   *   Array of [width, height] pairs.
   */
  public function getValidDimensions(): array;

  /**
   * Map requested dimensions to the nearest valid Titan dimensions.
   *
   * @param int $width
   *   Requested width.
   * @param int $height
   *   Requested height.
   *
   * @return array{0: int, 1: int}
   *   Valid [width, height] pair closest to requested aspect ratio.
   */
  public function mapToValidDimensions(int $width, int $height): array;

}
