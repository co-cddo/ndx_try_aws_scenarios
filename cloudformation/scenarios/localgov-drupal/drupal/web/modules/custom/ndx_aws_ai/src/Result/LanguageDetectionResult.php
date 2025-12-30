<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Result;

/**
 * Value object representing a language detection result.
 *
 * Encapsulates the detected language code along with a confidence score
 * indicating how certain the detection is.
 *
 * Story 4.2: Amazon Translate Service Integration
 */
final class LanguageDetectionResult {

  /**
   * Constructs a LanguageDetectionResult.
   *
   * @param string $languageCode
   *   The detected language code (e.g., 'en', 'fr').
   * @param float|null $confidence
   *   The confidence score (0.0 to 1.0), or NULL if not available.
   * @param string|null $languageName
   *   The human-readable language name, if available.
   */
  public function __construct(
    public readonly string $languageCode,
    public readonly ?float $confidence = NULL,
    public readonly ?string $languageName = NULL,
  ) {}

  /**
   * Get the detected language code.
   *
   * @return string
   *   The language code (e.g., 'en', 'fr').
   */
  public function getLanguageCode(): string {
    return $this->languageCode;
  }

  /**
   * Get the confidence score.
   *
   * @return float|null
   *   The confidence score between 0.0 and 1.0, or NULL if not available.
   */
  public function getConfidence(): ?float {
    return $this->confidence;
  }

  /**
   * Get the human-readable language name.
   *
   * @return string|null
   *   The language name, or NULL if not available.
   */
  public function getLanguageName(): ?string {
    return $this->languageName;
  }

  /**
   * Check if the detection confidence is high.
   *
   * A high confidence detection has a score of 0.8 or above.
   * Returns FALSE if confidence is not available (NULL).
   *
   * @return bool
   *   TRUE if confidence is >= 0.8, FALSE otherwise.
   */
  public function isHighConfidence(): bool {
    return $this->confidence !== NULL && $this->confidence >= 0.8;
  }

  /**
   * Create a result from Translate API response.
   *
   * Note: Amazon Translate does not return confidence scores for language
   * detection. If you need confidence scores, use Amazon Comprehend instead.
   *
   * @param string $languageCode
   *   The detected language code.
   * @param float|null $confidence
   *   The confidence score, or NULL if not available from the API.
   * @param array<string, string> $languageMap
   *   Map of language codes to names.
   *
   * @return self
   *   A new LanguageDetectionResult instance.
   */
  public static function fromApiResponse(
    string $languageCode,
    ?float $confidence = NULL,
    array $languageMap = [],
  ): self {
    $languageName = $languageMap[$languageCode] ?? NULL;
    return new self(
      languageCode: $languageCode,
      confidence: $confidence,
      languageName: $languageName,
    );
  }

}
