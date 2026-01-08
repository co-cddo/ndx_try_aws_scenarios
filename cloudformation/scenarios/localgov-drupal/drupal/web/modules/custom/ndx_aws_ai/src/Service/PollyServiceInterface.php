<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

/**
 * Interface for Amazon Polly text-to-speech service.
 *
 * Provides TTS with support for multiple languages. Most voices use Neural
 * engine for high quality, with fallback to Standard where Neural unavailable.
 *
 * Story 3.1: ndx_aws_ai Module Foundation
 */
interface PollyServiceInterface {

  /**
   * Supported languages with their default voices and engines.
   *
   * EN: English (UK) - Amy (Neural)
   * CY: Welsh - Gwyneth (Standard only - no Neural available)
   * FR: French - Lea (Neural)
   * RO: Romanian - Carmen (Standard only - no Neural available)
   * ES: Spanish - Lucia (Neural)
   * CS: Czech - Jitka (Neural)
   * PL: Polish - Ola (Neural)
   */
  public const SUPPORTED_LANGUAGES = [
    'en-GB' => ['voice' => 'Amy', 'engine' => 'neural'],
    'cy-GB' => ['voice' => 'Gwyneth', 'engine' => 'standard'],
    'fr-FR' => ['voice' => 'Lea', 'engine' => 'neural'],
    'ro-RO' => ['voice' => 'Carmen', 'engine' => 'standard'],
    'es-ES' => ['voice' => 'Lucia', 'engine' => 'neural'],
    'cs-CZ' => ['voice' => 'Jitka', 'engine' => 'neural'],
    'pl-PL' => ['voice' => 'Ola', 'engine' => 'neural'],
  ];

  /**
   * Neural voice engine for high-quality speech.
   */
  public const ENGINE_NEURAL = 'neural';

  /**
   * Standard voice engine (fallback for languages without Neural support).
   */
  public const ENGINE_STANDARD = 'standard';

  /**
   * Synthesize text to speech.
   *
   * @param string $text
   *   The text to synthesize.
   * @param string $languageCode
   *   The language code (e.g., 'en-GB').
   * @param string|null $voiceId
   *   Optional voice ID override.
   *
   * @return string
   *   The audio content as a binary string (MP3 format).
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function synthesizeSpeech(string $text, string $languageCode = 'en-GB', ?string $voiceId = NULL): string;

  /**
   * Get available voices for a language.
   *
   * @param string $languageCode
   *   The language code.
   *
   * @return array<string, string>
   *   Array of voice IDs to voice names.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function getVoices(string $languageCode): array;

  /**
   * Synthesize long text with automatic chunking.
   *
   * Polly has a 3000 character limit for neural voices.
   * This method handles splitting and concatenating.
   *
   * @param string $text
   *   The text to synthesize (can be longer than 3000 chars).
   * @param string $languageCode
   *   The language code.
   *
   * @return string
   *   The audio content as a binary string (MP3 format).
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function synthesizeLongText(string $text, string $languageCode = 'en-GB'): string;

}
