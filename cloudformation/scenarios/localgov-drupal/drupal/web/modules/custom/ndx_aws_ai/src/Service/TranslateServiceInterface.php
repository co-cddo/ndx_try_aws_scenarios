<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

/**
 * Interface for Amazon Translate service.
 *
 * Provides translation to 75+ languages.
 *
 * Story 3.1: ndx_aws_ai Module Foundation
 */
interface TranslateServiceInterface {

  /**
   * Common target languages for UK councils.
   */
  public const COMMON_LANGUAGES = [
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
  ];

  /**
   * Translate text to a target language.
   *
   * @param string $text
   *   The text to translate.
   * @param string $targetLanguage
   *   The target language code (e.g., 'cy' for Welsh).
   * @param string $sourceLanguage
   *   The source language code (default 'en' for English).
   *
   * @return string
   *   The translated text.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function translateText(string $text, string $targetLanguage, string $sourceLanguage = 'en'): string;

  /**
   * Detect the language of text.
   *
   * @param string $text
   *   The text to analyze.
   *
   * @return string
   *   The detected language code.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function detectLanguage(string $text): string;

  /**
   * Get list of supported target languages.
   *
   * @return array<string, string>
   *   Array of language codes to language names.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function getSupportedLanguages(): array;

}
