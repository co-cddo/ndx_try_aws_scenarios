<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Result;

/**
 * Value object representing the result of an image generation request.
 *
 * Story 5.6: Batch Image Generation
 */
final class ImageGenerationResult {

  /**
   * Constructs an ImageGenerationResult.
   *
   * @param bool $success
   *   Whether the generation succeeded.
   * @param string|null $imageData
   *   The raw image data (binary).
   * @param string|null $mimeType
   *   The image MIME type.
   * @param string|null $error
   *   Error message if generation failed.
   * @param float $processingTimeMs
   *   Time taken in milliseconds.
   * @param int $width
   *   Generated image width.
   * @param int $height
   *   Generated image height.
   */
  public function __construct(
    public readonly bool $success,
    public readonly ?string $imageData,
    public readonly ?string $mimeType,
    public readonly ?string $error,
    public readonly float $processingTimeMs,
    public readonly int $width = 0,
    public readonly int $height = 0,
  ) {}

  /**
   * Create a successful result.
   *
   * @param string $imageData
   *   The raw image data (binary).
   * @param string $mimeType
   *   The image MIME type.
   * @param float $processingTimeMs
   *   Time taken in milliseconds.
   * @param int $width
   *   Generated image width.
   * @param int $height
   *   Generated image height.
   *
   * @return self
   *   A success result.
   */
  public static function fromSuccess(
    string $imageData,
    string $mimeType,
    float $processingTimeMs,
    int $width = 0,
    int $height = 0,
  ): self {
    return new self(
      success: TRUE,
      imageData: $imageData,
      mimeType: $mimeType,
      error: NULL,
      processingTimeMs: $processingTimeMs,
      width: $width,
      height: $height,
    );
  }

  /**
   * Create a failure result.
   *
   * @param string $error
   *   The error message.
   * @param float $processingTimeMs
   *   Time taken in milliseconds.
   *
   * @return self
   *   A failure result.
   */
  public static function fromFailure(string $error, float $processingTimeMs = 0): self {
    return new self(
      success: FALSE,
      imageData: NULL,
      mimeType: NULL,
      error: $error,
      processingTimeMs: $processingTimeMs,
    );
  }

  /**
   * Get the image data as base64-encoded string.
   *
   * @return string
   *   Base64-encoded image data, or empty string if no data.
   */
  public function getImageAsBase64(): string {
    if ($this->imageData === NULL) {
      return '';
    }
    return base64_encode($this->imageData);
  }

  /**
   * Get the image data size in bytes.
   *
   * @return int
   *   Size in bytes, or 0 if no data.
   */
  public function getImageSize(): int {
    if ($this->imageData === NULL) {
      return 0;
    }
    return strlen($this->imageData);
  }

  /**
   * Get dimensions as string.
   *
   * @return string
   *   Dimensions in WxH format.
   */
  public function getDimensionsString(): string {
    return sprintf('%dx%d', $this->width, $this->height);
  }

  /**
   * Convert to array for logging/debugging.
   *
   * @return array<string, mixed>
   *   Array representation (excludes image data for size).
   */
  public function toArray(): array {
    return [
      'success' => $this->success,
      'mime_type' => $this->mimeType,
      'error' => $this->error,
      'processing_time_ms' => $this->processingTimeMs,
      'width' => $this->width,
      'height' => $this->height,
      'image_size_bytes' => $this->getImageSize(),
    ];
  }

}
