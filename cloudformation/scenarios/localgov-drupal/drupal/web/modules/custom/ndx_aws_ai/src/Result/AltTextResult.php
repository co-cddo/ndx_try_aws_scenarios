<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Result;

/**
 * Value object for alt-text generation results.
 *
 * Encapsulates the result of AI alt-text generation including
 * the text, confidence, and metadata about the generation.
 *
 * Story 4.5: Auto Alt-Text on Media Upload
 */
final class AltTextResult {

  /**
   * Maximum recommended alt-text length.
   */
  public const MAX_LENGTH = 125;

  /**
   * Constructs an AltTextResult.
   *
   * @param string $altText
   *   The generated alt-text.
   * @param float $confidence
   *   Confidence score (0-100).
   * @param bool $isAiGenerated
   *   Whether the text was AI-generated.
   * @param string $language
   *   The language code of the alt-text.
   * @param float $processingTimeMs
   *   Processing time in milliseconds.
   * @param string|null $error
   *   Error message if generation failed.
   * @param string|null $sourceUri
   *   The source image URI if applicable.
   * @param int|null $mediaId
   *   The media entity ID if applicable.
   */
  public function __construct(
    public readonly string $altText,
    public readonly float $confidence,
    public readonly bool $isAiGenerated,
    public readonly string $language,
    public readonly float $processingTimeMs,
    public readonly ?string $error = NULL,
    public readonly ?string $sourceUri = NULL,
    public readonly ?int $mediaId = NULL,
  ) {}

  /**
   * Create a successful result.
   *
   * @param string $altText
   *   The generated alt-text.
   * @param float $confidence
   *   Confidence score.
   * @param float $processingTimeMs
   *   Processing time.
   * @param string|null $sourceUri
   *   Optional source URI.
   * @param int|null $mediaId
   *   Optional media ID.
   *
   * @return self
   *   A new AltTextResult instance.
   */
  public static function success(
    string $altText,
    float $confidence,
    float $processingTimeMs,
    ?string $sourceUri = NULL,
    ?int $mediaId = NULL,
  ): self {
    return new self(
      altText: $altText,
      confidence: $confidence,
      isAiGenerated: TRUE,
      language: 'en',
      processingTimeMs: $processingTimeMs,
      error: NULL,
      sourceUri: $sourceUri,
      mediaId: $mediaId,
    );
  }

  /**
   * Create a failed result.
   *
   * @param string $error
   *   The error message.
   * @param float $processingTimeMs
   *   Processing time.
   * @param string|null $sourceUri
   *   Optional source URI.
   * @param int|null $mediaId
   *   Optional media ID.
   *
   * @return self
   *   A new failed AltTextResult instance.
   */
  public static function failure(
    string $error,
    float $processingTimeMs,
    ?string $sourceUri = NULL,
    ?int $mediaId = NULL,
  ): self {
    return new self(
      altText: '',
      confidence: 0.0,
      isAiGenerated: FALSE,
      language: 'en',
      processingTimeMs: $processingTimeMs,
      error: $error,
      sourceUri: $sourceUri,
      mediaId: $mediaId,
    );
  }

  /**
   * Create a result for a decorative image.
   *
   * @param float $processingTimeMs
   *   Processing time.
   * @param string|null $sourceUri
   *   Optional source URI.
   * @param int|null $mediaId
   *   Optional media ID.
   *
   * @return self
   *   A new AltTextResult for a decorative image.
   */
  public static function decorative(
    float $processingTimeMs,
    ?string $sourceUri = NULL,
    ?int $mediaId = NULL,
  ): self {
    return new self(
      altText: '',
      confidence: 100.0,
      isAiGenerated: TRUE,
      language: 'en',
      processingTimeMs: $processingTimeMs,
      error: NULL,
      sourceUri: $sourceUri,
      mediaId: $mediaId,
    );
  }

  /**
   * Check if the generation was successful.
   *
   * @return bool
   *   TRUE if generation succeeded.
   */
  public function isSuccess(): bool {
    return $this->error === NULL;
  }

  /**
   * Check if this is a decorative image (intentionally empty alt-text).
   *
   * @return bool
   *   TRUE if the image is decorative.
   */
  public function isDecorative(): bool {
    return $this->altText === '' && $this->isSuccess();
  }

  /**
   * Check if the alt-text meets WCAG length guidelines.
   *
   * @return bool
   *   TRUE if under 125 characters.
   */
  public function meetsLengthGuideline(): bool {
    return strlen($this->altText) <= self::MAX_LENGTH;
  }

  /**
   * Get the alt-text length.
   *
   * @return int
   *   The character count.
   */
  public function getLength(): int {
    return strlen($this->altText);
  }

  /**
   * Check if the alt-text is high confidence.
   *
   * @param float $threshold
   *   Minimum confidence threshold (default 80%).
   *
   * @return bool
   *   TRUE if confidence exceeds threshold.
   */
  public function isHighConfidence(float $threshold = 80.0): bool {
    return $this->confidence >= $threshold;
  }

  /**
   * Get processing time in seconds.
   *
   * @return float
   *   Processing time in seconds.
   */
  public function getProcessingTimeSeconds(): float {
    return $this->processingTimeMs / 1000;
  }

  /**
   * Create a copy with a truncated alt-text.
   *
   * @param int $maxLength
   *   Maximum length (default 125).
   *
   * @return self
   *   A new result with truncated alt-text.
   */
  public function withTruncatedText(int $maxLength = self::MAX_LENGTH): self {
    if (strlen($this->altText) <= $maxLength) {
      return $this;
    }

    $truncated = substr($this->altText, 0, $maxLength - 3) . '...';

    return new self(
      altText: $truncated,
      confidence: $this->confidence,
      isAiGenerated: $this->isAiGenerated,
      language: $this->language,
      processingTimeMs: $this->processingTimeMs,
      error: $this->error,
      sourceUri: $this->sourceUri,
      mediaId: $this->mediaId,
    );
  }

  /**
   * Convert to array for serialization.
   *
   * @return array<string, mixed>
   *   The result as an array.
   */
  public function toArray(): array {
    return [
      'altText' => $this->altText,
      'confidence' => $this->confidence,
      'isAiGenerated' => $this->isAiGenerated,
      'language' => $this->language,
      'processingTimeMs' => $this->processingTimeMs,
      'error' => $this->error,
      'sourceUri' => $this->sourceUri,
      'mediaId' => $this->mediaId,
      'isSuccess' => $this->isSuccess(),
      'meetsLengthGuideline' => $this->meetsLengthGuideline(),
    ];
  }

}
