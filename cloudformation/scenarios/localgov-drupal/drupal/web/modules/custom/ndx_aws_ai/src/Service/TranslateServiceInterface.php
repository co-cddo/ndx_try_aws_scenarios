<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Drupal\ndx_aws_ai\Result\LanguageDetectionResult;
use Drupal\ndx_aws_ai\Result\TranslationResult;

/**
 * Interface for Amazon Translate service.
 *
 * Provides translation capabilities for 75+ languages with auto-detection,
 * HTML preservation, and batch translation support.
 *
 * Story 3.1: ndx_aws_ai Module Foundation
 * Story 4.2: Amazon Translate Service Integration
 */
interface TranslateServiceInterface {

  /**
   * Special source language code for auto-detection.
   */
  public const LANGUAGE_AUTO = 'auto';

  /**
   * Priority languages commonly used by UK councils.
   */
  public const PRIORITY_LANGUAGES = [
    'en' => 'English',
    'cy' => 'Welsh',
    'gd' => 'Scottish Gaelic',
    'ga' => 'Irish',
    'pl' => 'Polish',
    'ro' => 'Romanian',
    'ur' => 'Urdu',
    'pa' => 'Punjabi',
    'bn' => 'Bengali',
    'gu' => 'Gujarati',
    'zh' => 'Chinese (Simplified)',
    'ar' => 'Arabic',
    'fr' => 'French',
    'es' => 'Spanish',
    'pt' => 'Portuguese',
    'de' => 'German',
    'hi' => 'Hindi',
    'ta' => 'Tamil',
  ];

  /**
   * Full list of supported language codes.
   *
   * Amazon Translate supports 75+ languages. This list includes commonly
   * used languages for UK council services.
   */
  public const SUPPORTED_LANGUAGES = [
    'af' => 'Afrikaans',
    'sq' => 'Albanian',
    'am' => 'Amharic',
    'ar' => 'Arabic',
    'hy' => 'Armenian',
    'az' => 'Azerbaijani',
    'bn' => 'Bengali',
    'bs' => 'Bosnian',
    'bg' => 'Bulgarian',
    'ca' => 'Catalan',
    'zh' => 'Chinese (Simplified)',
    'zh-TW' => 'Chinese (Traditional)',
    'hr' => 'Croatian',
    'cs' => 'Czech',
    'da' => 'Danish',
    'fa-AF' => 'Dari',
    'nl' => 'Dutch',
    'en' => 'English',
    'et' => 'Estonian',
    'fa' => 'Farsi (Persian)',
    'tl' => 'Filipino, Tagalog',
    'fi' => 'Finnish',
    'fr' => 'French',
    'fr-CA' => 'French (Canada)',
    'ka' => 'Georgian',
    'de' => 'German',
    'el' => 'Greek',
    'gu' => 'Gujarati',
    'ht' => 'Haitian Creole',
    'ha' => 'Hausa',
    'he' => 'Hebrew',
    'hi' => 'Hindi',
    'hu' => 'Hungarian',
    'is' => 'Icelandic',
    'id' => 'Indonesian',
    'ga' => 'Irish',
    'it' => 'Italian',
    'ja' => 'Japanese',
    'kn' => 'Kannada',
    'kk' => 'Kazakh',
    'ko' => 'Korean',
    'lv' => 'Latvian',
    'lt' => 'Lithuanian',
    'mk' => 'Macedonian',
    'ms' => 'Malay',
    'ml' => 'Malayalam',
    'mt' => 'Maltese',
    'mr' => 'Marathi',
    'mn' => 'Mongolian',
    'no' => 'Norwegian',
    'ps' => 'Pashto',
    'pl' => 'Polish',
    'pt' => 'Portuguese (Brazil)',
    'pt-PT' => 'Portuguese (Portugal)',
    'pa' => 'Punjabi',
    'ro' => 'Romanian',
    'ru' => 'Russian',
    'sr' => 'Serbian',
    'si' => 'Sinhala',
    'sk' => 'Slovak',
    'sl' => 'Slovenian',
    'so' => 'Somali',
    'es' => 'Spanish',
    'es-MX' => 'Spanish (Mexico)',
    'sw' => 'Swahili',
    'sv' => 'Swedish',
    'gd' => 'Scottish Gaelic',
    'ta' => 'Tamil',
    'te' => 'Telugu',
    'th' => 'Thai',
    'tr' => 'Turkish',
    'uk' => 'Ukrainian',
    'ur' => 'Urdu',
    'uz' => 'Uzbek',
    'vi' => 'Vietnamese',
    'cy' => 'Welsh',
  ];

  /**
   * Translate text to a target language.
   *
   * @param string $text
   *   The text to translate.
   * @param string $targetLanguage
   *   The target language code (e.g., 'cy' for Welsh).
   * @param string $sourceLanguage
   *   The source language code, or 'auto' for auto-detection.
   *
   * @return \Drupal\ndx_aws_ai\Result\TranslationResult
   *   The translation result with text and metadata.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function translateText(string $text, string $targetLanguage, string $sourceLanguage = self::LANGUAGE_AUTO): TranslationResult;

  /**
   * Translate HTML content, preserving markup structure.
   *
   * @param string $html
   *   The HTML content to translate.
   * @param string $targetLanguage
   *   The target language code.
   * @param string $sourceLanguage
   *   The source language code, or 'auto' for auto-detection.
   *
   * @return \Drupal\ndx_aws_ai\Result\TranslationResult
   *   The translation result with preserved HTML structure.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function translateHtml(string $html, string $targetLanguage, string $sourceLanguage = self::LANGUAGE_AUTO): TranslationResult;

  /**
   * Translate multiple text segments in batch.
   *
   * @param array<string> $texts
   *   Array of text segments to translate.
   * @param string $targetLanguage
   *   The target language code.
   * @param string $sourceLanguage
   *   The source language code, or 'auto' for auto-detection.
   *
   * @return array<\Drupal\ndx_aws_ai\Result\TranslationResult>
   *   Array of translation results in the same order as input.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function translateBatch(array $texts, string $targetLanguage, string $sourceLanguage = self::LANGUAGE_AUTO): array;

  /**
   * Detect the language of text.
   *
   * @param string $text
   *   The text to analyze.
   *
   * @return \Drupal\ndx_aws_ai\Result\LanguageDetectionResult
   *   The language detection result with code and confidence.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function detectLanguage(string $text): LanguageDetectionResult;

  /**
   * Get list of supported target languages.
   *
   * @return array<string, string>
   *   Array of language codes to language names.
   */
  public function getSupportedLanguages(): array;

  /**
   * Get priority languages for UK councils.
   *
   * @return array<string, string>
   *   Array of language codes to language names.
   */
  public function getPriorityLanguages(): array;

  /**
   * Check if a language pair is supported.
   *
   * @param string $sourceLanguage
   *   The source language code.
   * @param string $targetLanguage
   *   The target language code.
   *
   * @return bool
   *   TRUE if the language pair is supported.
   */
  public function isLanguagePairSupported(string $sourceLanguage, string $targetLanguage): bool;

  /**
   * Clear the translation cache.
   *
   * @param string|null $targetLanguage
   *   Optional target language to clear, or NULL to clear all.
   */
  public function clearCache(?string $targetLanguage = NULL): void;

  /**
   * Check if the Translate service is available.
   *
   * @return bool
   *   TRUE if the service is configured and accessible.
   */
  public function isAvailable(): bool;

}
