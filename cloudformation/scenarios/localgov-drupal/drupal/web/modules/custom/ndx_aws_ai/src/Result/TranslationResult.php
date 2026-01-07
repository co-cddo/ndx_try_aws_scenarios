<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Result;

/**
 * Value object representing a translation result.
 *
 * Encapsulates the translated text along with metadata about the translation
 * such as source and target languages, and whether language was auto-detected.
 *
 * Story 4.2: Amazon Translate Service Integration
 */
final class TranslationResult {

  /**
   * Constructs a TranslationResult.
   *
   * @param string $translatedText
   *   The translated text.
   * @param string $sourceLanguage
   *   The source language code (detected or provided).
   * @param string $targetLanguage
   *   The target language code.
   * @param bool $wasAutoDetected
   *   Whether the source language was auto-detected.
   * @param float|null $confidence
   *   Confidence score for auto-detected language (0-1).
   * @param bool $fromCache
   *   Whether this result came from cache.
   */
  public function __construct(
    public readonly string $translatedText,
    public readonly string $sourceLanguage,
    public readonly string $targetLanguage,
    public readonly bool $wasAutoDetected = FALSE,
    public readonly ?float $confidence = NULL,
    public readonly bool $fromCache = FALSE,
  ) {}

  /**
   * Get the translated text.
   *
   * @return string
   *   The translated text.
   */
  public function getText(): string {
    return $this->translatedText;
  }

  /**
   * Get the translated text (alias for controller compatibility).
   *
   * @return string
   *   The translated text.
   */
  public function getTranslatedText(): string {
    return $this->translatedText;
  }

  /**
   * Get the source language code.
   *
   * @return string
   *   The source language code.
   */
  public function getSourceLanguage(): string {
    return $this->sourceLanguage;
  }

  /**
   * Get the target language code.
   *
   * @return string
   *   The target language code.
   */
  public function getTargetLanguage(): string {
    return $this->targetLanguage;
  }

  /**
   * Check if language was auto-detected.
   *
   * @return bool
   *   TRUE if source language was auto-detected.
   */
  public function wasLanguageAutoDetected(): bool {
    return $this->wasAutoDetected;
  }

  /**
   * Get the detection confidence score.
   *
   * @return float|null
   *   The confidence score (0-1), or NULL if not auto-detected.
   */
  public function getConfidence(): ?float {
    return $this->confidence;
  }

  /**
   * Check if result was served from cache.
   *
   * @return bool
   *   TRUE if result came from cache.
   */
  public function isFromCache(): bool {
    return $this->fromCache;
  }

  /**
   * Create a result from API response data.
   *
   * @param string $translatedText
   *   The translated text from API.
   * @param string $sourceLanguage
   *   The detected/provided source language.
   * @param string $targetLanguage
   *   The target language.
   * @param string $requestedSource
   *   The originally requested source language ('auto' or specific).
   *
   * @return self
   *   A new TranslationResult instance.
   */
  public static function fromApiResponse(
    string $translatedText,
    string $sourceLanguage,
    string $targetLanguage,
    string $requestedSource,
  ): self {
    return new self(
      translatedText: $translatedText,
      sourceLanguage: $sourceLanguage,
      targetLanguage: $targetLanguage,
      wasAutoDetected: $requestedSource === 'auto',
      confidence: NULL,
      fromCache: FALSE,
    );
  }

  /**
   * Create a cached version of this result.
   *
   * @return self
   *   A new TranslationResult with fromCache set to TRUE.
   */
  public function asCached(): self {
    return new self(
      translatedText: $this->translatedText,
      sourceLanguage: $this->sourceLanguage,
      targetLanguage: $this->targetLanguage,
      wasAutoDetected: $this->wasAutoDetected,
      confidence: $this->confidence,
      fromCache: TRUE,
    );
  }

}
