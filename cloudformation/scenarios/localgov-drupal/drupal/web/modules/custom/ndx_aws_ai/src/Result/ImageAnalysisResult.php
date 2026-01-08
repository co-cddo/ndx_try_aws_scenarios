<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Result;

/**
 * Value object for image analysis results.
 *
 * Contains the description, alt-text, content moderation status,
 * and performance metrics from image analysis operations.
 *
 * Story 4.3: Nova 2 Omni Vision Service
 */
final class ImageAnalysisResult {

  /**
   * Moderation reason when image is flagged.
   */
  public const MODERATION_INAPPROPRIATE = 'inappropriate_content';

  /**
   * Moderation reason when content is filtered.
   */
  public const MODERATION_FILTERED = 'content_filtered';

  /**
   * Constructs an ImageAnalysisResult.
   *
   * @param string $description
   *   The full description of the image.
   * @param string|null $altText
   *   The WCAG-compliant alt-text (max 125 chars), or NULL if not generated.
   * @param bool $isAppropriate
   *   TRUE if the image passed content moderation.
   * @param string|null $moderationReason
   *   The reason if content was flagged, or NULL if appropriate.
   * @param float $processingTimeMs
   *   The time taken to process the image in milliseconds.
   * @param string|null $extendedDescription
   *   Optional extended description for complex images.
   */
  public function __construct(
    public readonly string $description,
    public readonly ?string $altText,
    public readonly bool $isAppropriate,
    public readonly ?string $moderationReason,
    public readonly float $processingTimeMs,
    public readonly ?string $extendedDescription = NULL,
  ) {}

  /**
   * Create a result from successful API response.
   *
   * @param string $description
   *   The description text.
   * @param float $processingTimeMs
   *   Processing time in milliseconds.
   * @param string|null $altText
   *   Optional alt-text.
   * @param string|null $extendedDescription
   *   Optional extended description.
   *
   * @return self
   *   A new result instance.
   */
  public static function fromSuccess(
    string $description,
    float $processingTimeMs,
    ?string $altText = NULL,
    ?string $extendedDescription = NULL,
  ): self {
    return new self(
      description: $description,
      altText: $altText,
      isAppropriate: TRUE,
      moderationReason: NULL,
      processingTimeMs: $processingTimeMs,
      extendedDescription: $extendedDescription,
    );
  }

  /**
   * Create a result for content that was flagged/filtered.
   *
   * @param string $reason
   *   The moderation reason.
   * @param float $processingTimeMs
   *   Processing time in milliseconds.
   *
   * @return self
   *   A new result instance indicating moderation.
   */
  public static function fromModeration(string $reason, float $processingTimeMs): self {
    return new self(
      description: '',
      altText: NULL,
      isAppropriate: FALSE,
      moderationReason: $reason,
      processingTimeMs: $processingTimeMs,
      extendedDescription: NULL,
    );
  }

  /**
   * Check if this result represents a successful analysis.
   *
   * @return bool
   *   TRUE if analysis succeeded without moderation issues.
   */
  public function isSuccess(): bool {
    return $this->isAppropriate && !empty($this->description);
  }

  /**
   * Check if alt-text was generated.
   *
   * @return bool
   *   TRUE if alt-text is available.
   */
  public function hasAltText(): bool {
    return $this->altText !== NULL && $this->altText !== '';
  }

  /**
   * Check if extended description is available.
   *
   * @return bool
   *   TRUE if extended description is available.
   */
  public function hasExtendedDescription(): bool {
    return $this->extendedDescription !== NULL && $this->extendedDescription !== '';
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
   * Get the best available text for accessibility.
   *
   * Returns alt-text if available, otherwise falls back to
   * truncated description.
   *
   * @param int $maxLength
   *   Maximum length for fallback truncation.
   *
   * @return string
   *   The best available accessible text.
   */
  public function getAccessibleText(int $maxLength = 125): string {
    if ($this->hasAltText()) {
      return $this->altText;
    }

    if (!$this->isAppropriate) {
      return '';
    }

    // Truncate description to max length.
    if (mb_strlen($this->description) <= $maxLength) {
      return $this->description;
    }

    return mb_substr($this->description, 0, $maxLength - 3) . '...';
  }

}
