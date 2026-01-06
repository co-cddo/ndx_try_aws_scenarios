<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Drupal\ndx_aws_ai\Result\ImageGenerationResult;

/**
 * Interface for AI image generation service.
 *
 * Provides text-to-image generation using Amazon Nova Canvas.
 *
 * Story 5.6: Batch Image Generation
 */
interface ImageGenerationServiceInterface {

  /**
   * Amazon Nova Canvas model ID for image generation.
   */
  public const MODEL_NOVA_CANVAS = 'amazon.nova-canvas-v1:0';

  /**
   * Default configuration scale (prompt adherence). Range: 1.0-10.0.
   */
  public const DEFAULT_CFG_SCALE = 8.0;

  /**
   * Default quality setting for Nova Canvas.
   */
  public const DEFAULT_QUALITY = 'standard';

  /**
   * Common dimensions supported by Nova Canvas.
   *
   * Nova Canvas supports flexible dimensions:
   * - Each side: 320-4096px, divisible by 16
   * - Aspect ratio: 1:4 to 4:1
   * - Max total pixels: 4,194,304
   *
   * These are common presets for convenience.
   *
   * @var array<int, array{0: int, 1: int}>
   */
  public const VALID_DIMENSIONS = [
    [1024, 1024],  // Square
    [1280, 720],   // 16:9 landscape
    [720, 1280],   // 9:16 portrait
    [1024, 576],   // Wide banner
    [576, 1024],   // Tall banner
    [768, 768],    // Medium square
    [1280, 1280],  // Large square
    [1920, 1080],  // Full HD landscape
    [1080, 1920],  // Full HD portrait
  ];

  /**
   * Generate an image from a text prompt.
   *
   * @param string $prompt
   *   The text prompt describing the image to generate.
   * @param int $width
   *   Desired image width (will be validated for Nova Canvas requirements).
   * @param int $height
   *   Desired image height (will be validated for Nova Canvas requirements).
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
   * Map requested dimensions to valid Nova Canvas dimensions.
   *
   * Finds the nearest valid dimension from VALID_DIMENSIONS presets
   * based on aspect ratio matching.
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
