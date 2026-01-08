<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

/**
 * Interface for Amazon Rekognition image analysis service.
 *
 * Provides DetectLabels for automatic image descriptions.
 *
 * Story 3.1: ndx_aws_ai Module Foundation
 */
interface RekognitionServiceInterface {

  /**
   * Default minimum confidence for label detection.
   */
  public const DEFAULT_MIN_CONFIDENCE = 70.0;

  /**
   * Maximum labels to return.
   */
  public const DEFAULT_MAX_LABELS = 10;

  /**
   * Detect labels in an image.
   *
   * @param string $imageData
   *   Base64-encoded image data.
   * @param float $minConfidence
   *   Minimum confidence threshold (0-100).
   * @param int $maxLabels
   *   Maximum number of labels to return.
   *
   * @return array<int, array{name: string, confidence: float, parents: array<string>}>
   *   Array of detected labels with confidence scores.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function detectLabels(
    string $imageData,
    float $minConfidence = self::DEFAULT_MIN_CONFIDENCE,
    int $maxLabels = self::DEFAULT_MAX_LABELS,
  ): array;

  /**
   * Generate alt text from detected labels.
   *
   * @param string $imageData
   *   Base64-encoded image data.
   *
   * @return string
   *   A human-readable description suitable for alt text.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function generateAltText(string $imageData): string;

  /**
   * Detect text in an image (OCR).
   *
   * @param string $imageData
   *   Base64-encoded image data.
   *
   * @return array<int, array{text: string, confidence: float, type: string}>
   *   Array of detected text with confidence scores.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function detectText(string $imageData): array;

}
