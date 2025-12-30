<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Drupal\ndx_aws_ai\Result\ImageAnalysisResult;

/**
 * Interface for Nova 2 Omni vision service.
 *
 * Provides image analysis capabilities using Amazon Nova models for
 * generating descriptions and WCAG-compliant alt-text.
 *
 * Story 4.3: Nova 2 Omni Vision Service
 */
interface VisionServiceInterface {

  /**
   * Supported image formats.
   */
  public const SUPPORTED_FORMATS = [
    'image/jpeg' => 'jpeg',
    'image/jpg' => 'jpeg',
    'image/png' => 'png',
    'image/webp' => 'webp',
  ];

  /**
   * Maximum file size in bytes (5MB).
   */
  public const MAX_FILE_SIZE = 5242880;

  /**
   * Maximum alt-text length in characters.
   */
  public const MAX_ALT_TEXT_LENGTH = 125;

  /**
   * Analyze an image and return a detailed description.
   *
   * @param string $imageData
   *   The image data (binary or base64-encoded).
   * @param string $mimeType
   *   The image MIME type (e.g., 'image/jpeg').
   * @param bool $isBase64
   *   TRUE if imageData is already base64-encoded.
   *
   * @return \Drupal\ndx_aws_ai\Result\ImageAnalysisResult
   *   The analysis result with description and moderation info.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   * @throws \InvalidArgumentException
   *   If the image format is not supported or file is too large.
   */
  public function analyzeImage(string $imageData, string $mimeType, bool $isBase64 = FALSE): ImageAnalysisResult;

  /**
   * Analyze an image from a file path.
   *
   * @param string $filePath
   *   The absolute path to the image file.
   *
   * @return \Drupal\ndx_aws_ai\Result\ImageAnalysisResult
   *   The analysis result with description and moderation info.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   * @throws \InvalidArgumentException
   *   If the file doesn't exist, format is not supported, or file is too large.
   */
  public function analyzeImageFromFile(string $filePath): ImageAnalysisResult;

  /**
   * Generate WCAG-compliant alt-text for an image.
   *
   * Generates concise alt-text following WCAG 2.2 AA guidelines,
   * optimized for screen readers.
   *
   * @param string $imageData
   *   The image data (binary or base64-encoded).
   * @param string $mimeType
   *   The image MIME type.
   * @param bool $isBase64
   *   TRUE if imageData is already base64-encoded.
   *
   * @return \Drupal\ndx_aws_ai\Result\ImageAnalysisResult
   *   The result with alt-text in the altText field.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   * @throws \InvalidArgumentException
   *   If the image format is not supported or file is too large.
   */
  public function generateAltText(string $imageData, string $mimeType, bool $isBase64 = FALSE): ImageAnalysisResult;

  /**
   * Generate alt-text from a file path.
   *
   * @param string $filePath
   *   The absolute path to the image file.
   *
   * @return \Drupal\ndx_aws_ai\Result\ImageAnalysisResult
   *   The result with alt-text in the altText field.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   * @throws \InvalidArgumentException
   *   If the file doesn't exist, format is not supported, or file is too large.
   */
  public function generateAltTextFromFile(string $filePath): ImageAnalysisResult;

  /**
   * Check if a MIME type is supported.
   *
   * @param string $mimeType
   *   The MIME type to check.
   *
   * @return bool
   *   TRUE if the format is supported.
   */
  public function isSupportedFormat(string $mimeType): bool;

  /**
   * Check if file size is within limits.
   *
   * @param int $sizeInBytes
   *   The file size in bytes.
   *
   * @return bool
   *   TRUE if the size is acceptable.
   */
  public function isValidFileSize(int $sizeInBytes): bool;

  /**
   * Get list of supported image formats.
   *
   * @return array<string, string>
   *   Array of MIME type to format name mappings.
   */
  public function getSupportedFormats(): array;

  /**
   * Check if the Vision service is available.
   *
   * @return bool
   *   TRUE if the service is configured and accessible.
   */
  public function isAvailable(): bool;

}
