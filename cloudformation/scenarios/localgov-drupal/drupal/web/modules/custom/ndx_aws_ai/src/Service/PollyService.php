<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Aws\Exception\AwsException;
use Aws\Polly\PollyClient;
use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\ndx_aws_ai\Exception\AwsServiceException;
use Drupal\ndx_aws_ai\RateLimiter\PollyRateLimiter;
use Psr\Log\LoggerInterface;

/**
 * Amazon Polly service for text-to-speech synthesis.
 *
 * Provides TTS with support for 7 languages commonly needed by UK councils.
 * Uses Neural voices where available, falling back to Standard for languages
 * without Neural support (Welsh, Romanian).
 *
 * Features:
 * - MP3 audio output
 * - Automatic text chunking for long content (>3000 chars)
 * - Audio caching to avoid regeneration
 * - Rate limiting with exponential backoff
 *
 * Story 4.1: Polly TTS Service Integration
 */
class PollyService implements PollyServiceInterface {

  /**
   * Maximum characters per Polly request for neural voices.
   */
  protected const MAX_CHARS_PER_REQUEST = 3000;

  /**
   * Cache time-to-live in seconds (24 hours).
   */
  protected const CACHE_TTL = 86400;

  /**
   * Directory for cached audio files.
   */
  protected const CACHE_DIRECTORY = 'public://polly-cache';

  /**
   * The Polly client (lazy initialized).
   */
  protected ?PollyClient $client = NULL;

  /**
   * Constructs a PollyService.
   *
   * @param \Drupal\ndx_aws_ai\Service\AwsClientFactory $clientFactory
   *   The AWS client factory.
   * @param \Drupal\ndx_aws_ai\Service\AwsErrorHandler $errorHandler
   *   The AWS error handler.
   * @param \Drupal\ndx_aws_ai\RateLimiter\PollyRateLimiter $rateLimiter
   *   The rate limiter for API calls.
   * @param \Drupal\Core\Cache\CacheBackendInterface $cache
   *   The cache backend.
   * @param \Drupal\Core\File\FileSystemInterface $fileSystem
   *   The file system service.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected AwsClientFactory $clientFactory,
    protected AwsErrorHandler $errorHandler,
    protected PollyRateLimiter $rateLimiter,
    protected CacheBackendInterface $cache,
    protected FileSystemInterface $fileSystem,
    protected LoggerInterface $logger,
  ) {
    // Client is lazy initialized in getClient() to avoid issues during
    // service container initialization and module discovery.
  }

  /**
   * Get the Polly client, creating it lazily if needed.
   *
   * @return \Aws\Polly\PollyClient
   *   The Polly client.
   */
  protected function getClient(): PollyClient {
    if ($this->client === NULL) {
      $this->client = $this->clientFactory->getPollyClient();
    }
    return $this->client;
  }

  /**
   * {@inheritdoc}
   */
  public function synthesizeSpeech(string $text, string $languageCode = 'en-GB', ?string $voiceId = NULL): string {
    // Validate language code.
    if (!isset(self::SUPPORTED_LANGUAGES[$languageCode])) {
      throw new AwsServiceException(
        message: "Unsupported language code: $languageCode",
        awsErrorCode: 'InvalidParameterValue',
        awsService: 'Polly',
        userMessage: "The language '$languageCode' is not supported for text-to-speech.",
      );
    }

    // Get voice configuration.
    $voiceConfig = self::SUPPORTED_LANGUAGES[$languageCode];
    $voice = $voiceId ?? $voiceConfig['voice'];
    $engine = $voiceConfig['engine'];

    // Check cache first.
    $cacheKey = $this->buildCacheKey($text, $languageCode, $voice);
    $cached = $this->getCachedAudio($cacheKey);
    if ($cached !== NULL) {
      $this->logger->debug('Polly cache hit for @language', [
        '@language' => $languageCode,
      ]);
      return $cached;
    }

    // Synthesize speech with retry logic.
    $audio = $this->executeWithRetry($text, $voice, $engine);

    // Cache the result.
    $this->cacheAudio($cacheKey, $audio, $languageCode);

    // Log usage.
    $this->errorHandler->logOperation('Polly', 'SynthesizeSpeech', [
      'language' => $languageCode,
      'voice' => $voice,
      'engine' => $engine,
      'characters' => strlen($text),
    ]);

    return $audio;
  }

  /**
   * {@inheritdoc}
   */
  public function getVoices(string $languageCode): array {
    $this->rateLimiter->waitIfNeeded();

    try {
      $result = $this->getClient()->describeVoices([
        'LanguageCode' => $languageCode,
      ]);

      $voices = [];
      foreach ($result['Voices'] ?? [] as $voice) {
        $voices[$voice['Id']] = $voice['Name'];
      }

      $this->rateLimiter->recordSuccess();
      return $voices;
    }
    catch (AwsException $e) {
      $this->rateLimiter->recordFailure();
      throw $this->errorHandler->handleException($e, 'Polly', 'DescribeVoices');
    }
  }

  /**
   * {@inheritdoc}
   */
  public function synthesizeLongText(string $text, string $languageCode = 'en-GB'): string {
    // If text is short enough, use single synthesis.
    if (strlen($text) <= self::MAX_CHARS_PER_REQUEST) {
      return $this->synthesizeSpeech($text, $languageCode);
    }

    // Check cache for the full text first.
    $voiceConfig = self::SUPPORTED_LANGUAGES[$languageCode] ?? self::SUPPORTED_LANGUAGES['en-GB'];
    $cacheKey = $this->buildCacheKey($text, $languageCode, $voiceConfig['voice']);
    $cached = $this->getCachedAudio($cacheKey);
    if ($cached !== NULL) {
      $this->logger->debug('Polly cache hit for long text @language', [
        '@language' => $languageCode,
      ]);
      return $cached;
    }

    // Split text into chunks.
    $chunks = $this->splitText($text);

    $this->logger->info('Polly synthesizing long text in @count chunks', [
      '@count' => count($chunks),
    ]);

    // Synthesize each chunk.
    $audioChunks = [];
    foreach ($chunks as $chunk) {
      $audioChunks[] = $this->synthesizeSpeech($chunk, $languageCode);
    }

    // Concatenate audio chunks.
    // Note: Simple concatenation works for MP3 but may have minor glitches.
    // For production, consider using FFmpeg for seamless joining.
    $combinedAudio = implode('', $audioChunks);

    // Cache the combined result.
    $this->cacheAudio($cacheKey, $combinedAudio, $languageCode);

    return $combinedAudio;
  }

  /**
   * Execute a Polly SynthesizeSpeech call with retry logic.
   *
   * @param string $text
   *   The text to synthesize.
   * @param string $voiceId
   *   The voice ID to use.
   * @param string $engine
   *   The engine type (neural or standard).
   *
   * @return string
   *   The audio content as binary string.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails after retries.
   */
  protected function executeWithRetry(string $text, string $voiceId, string $engine): string {
    $attempt = 0;
    $lastException = NULL;

    while ($attempt < $this->rateLimiter->getMaxRetries()) {
      try {
        $this->rateLimiter->waitIfNeeded();

        $result = $this->getClient()->synthesizeSpeech([
          'Engine' => $engine,
          'OutputFormat' => 'mp3',
          'Text' => $text,
          'TextType' => 'text',
          'VoiceId' => $voiceId,
        ]);

        // Get the audio stream.
        $audioStream = $result['AudioStream'];
        $audio = $audioStream->getContents();

        $this->rateLimiter->recordSuccess();
        return $audio;
      }
      catch (AwsException $e) {
        $lastException = $e;
        $errorCode = $e->getAwsErrorCode() ?? 'UnknownError';

        if ($this->rateLimiter->isRetryable($errorCode) && $attempt < $this->rateLimiter->getMaxRetries() - 1) {
          $this->errorHandler->logRetry('Polly', 'SynthesizeSpeech', $attempt + 1, $errorCode);
          $this->rateLimiter->recordFailure();
          $this->rateLimiter->waitForRetry($attempt);
          $attempt++;
          continue;
        }

        throw $this->errorHandler->handleException($e, 'Polly', 'SynthesizeSpeech');
      }
    }

    if ($lastException !== NULL) {
      throw $this->errorHandler->handleException($lastException, 'Polly', 'SynthesizeSpeech');
    }

    throw new AwsServiceException(
      message: 'Maximum retries exceeded',
      awsErrorCode: 'MaxRetriesExceeded',
      awsService: 'Polly',
      userMessage: 'The text-to-speech service is currently unavailable. Please try again later.',
    );
  }

  /**
   * Split text into chunks at natural boundaries.
   *
   * Splits at sentence boundaries where possible, falling back to
   * clause boundaries, then word boundaries.
   *
   * @param string $text
   *   The text to split.
   *
   * @return array<string>
   *   Array of text chunks, each under MAX_CHARS_PER_REQUEST.
   */
  protected function splitText(string $text): array {
    $maxLength = self::MAX_CHARS_PER_REQUEST;
    $chunks = [];

    // First, split by paragraphs.
    $paragraphs = preg_split('/\n\s*\n/', $text);

    $currentChunk = '';
    foreach ($paragraphs as $paragraph) {
      $paragraph = trim($paragraph);
      if (empty($paragraph)) {
        continue;
      }

      // If adding this paragraph would exceed limit.
      if (strlen($currentChunk) + strlen($paragraph) + 2 > $maxLength) {
        // Save current chunk if not empty.
        if (!empty($currentChunk)) {
          $chunks[] = trim($currentChunk);
          $currentChunk = '';
        }

        // If paragraph itself is too long, split by sentences.
        if (strlen($paragraph) > $maxLength) {
          $sentences = $this->splitIntoSentences($paragraph);
          foreach ($sentences as $sentence) {
            if (strlen($currentChunk) + strlen($sentence) + 1 > $maxLength) {
              if (!empty($currentChunk)) {
                $chunks[] = trim($currentChunk);
                $currentChunk = '';
              }

              // If sentence itself is too long, split by words.
              if (strlen($sentence) > $maxLength) {
                $chunks = array_merge($chunks, $this->splitByWords($sentence, $maxLength));
              }
              else {
                $currentChunk = $sentence;
              }
            }
            else {
              $currentChunk .= ($currentChunk ? ' ' : '') . $sentence;
            }
          }
        }
        else {
          $currentChunk = $paragraph;
        }
      }
      else {
        $currentChunk .= ($currentChunk ? "\n\n" : '') . $paragraph;
      }
    }

    // Add final chunk.
    if (!empty($currentChunk)) {
      $chunks[] = trim($currentChunk);
    }

    return $chunks;
  }

  /**
   * Split text into sentences.
   *
   * @param string $text
   *   The text to split.
   *
   * @return array<string>
   *   Array of sentences.
   */
  protected function splitIntoSentences(string $text): array {
    // Split on sentence-ending punctuation followed by space.
    $sentences = preg_split('/(?<=[.!?])\s+/', $text);
    return array_filter($sentences, fn($s) => !empty(trim($s)));
  }

  /**
   * Split text by words to fit within max length.
   *
   * @param string $text
   *   The text to split.
   * @param int $maxLength
   *   Maximum length per chunk.
   *
   * @return array<string>
   *   Array of text chunks.
   */
  protected function splitByWords(string $text, int $maxLength): array {
    $words = preg_split('/\s+/', $text);
    $chunks = [];
    $currentChunk = '';

    foreach ($words as $word) {
      if (strlen($currentChunk) + strlen($word) + 1 > $maxLength) {
        if (!empty($currentChunk)) {
          $chunks[] = trim($currentChunk);
        }
        $currentChunk = $word;
      }
      else {
        $currentChunk .= ($currentChunk ? ' ' : '') . $word;
      }
    }

    if (!empty($currentChunk)) {
      $chunks[] = trim($currentChunk);
    }

    return $chunks;
  }

  /**
   * Build a cache key for audio content.
   *
   * @param string $text
   *   The text content.
   * @param string $languageCode
   *   The language code.
   * @param string $voiceId
   *   The voice ID.
   *
   * @return string
   *   The cache key.
   */
  protected function buildCacheKey(string $text, string $languageCode, string $voiceId): string {
    $hash = hash('sha256', $text . $languageCode . $voiceId);
    return "polly:$languageCode:$hash";
  }

  /**
   * Get cached audio if available.
   *
   * @param string $cacheKey
   *   The cache key.
   *
   * @return string|null
   *   The cached audio data, or NULL if not cached.
   */
  protected function getCachedAudio(string $cacheKey): ?string {
    $cached = $this->cache->get($cacheKey);
    if ($cached && isset($cached->data)) {
      // The cache stores the file path, read the file.
      $filePath = $cached->data;
      if (file_exists($filePath)) {
        $content = file_get_contents($filePath);
        return $content !== FALSE ? $content : NULL;
      }
    }
    return NULL;
  }

  /**
   * Cache audio content.
   *
   * @param string $cacheKey
   *   The cache key.
   * @param string $audio
   *   The audio content.
   * @param string $languageCode
   *   The language code (for directory organization).
   */
  protected function cacheAudio(string $cacheKey, string $audio, string $languageCode): void {
    // Ensure cache directory exists.
    $directory = self::CACHE_DIRECTORY . '/' . $languageCode;
    $this->fileSystem->prepareDirectory($directory, FileSystemInterface::CREATE_DIRECTORY);

    // Generate filename from cache key.
    $hash = explode(':', $cacheKey)[2] ?? hash('sha256', $cacheKey);
    $filePath = $directory . '/' . $hash . '.mp3';

    // Save audio to file.
    $this->fileSystem->saveData($audio, $filePath, FileSystemInterface::EXISTS_REPLACE);

    // Store file path in cache.
    $expire = time() + self::CACHE_TTL;
    $this->cache->set($cacheKey, $filePath, $expire);

    $this->logger->debug('Polly audio cached at @path', [
      '@path' => $filePath,
    ]);
  }

  /**
   * Clear all cached audio for a language.
   *
   * @param string|null $languageCode
   *   The language code, or NULL to clear all.
   */
  public function clearCache(?string $languageCode = NULL): void {
    if ($languageCode === NULL) {
      // Clear all cached audio.
      $directory = self::CACHE_DIRECTORY;
    }
    else {
      $directory = self::CACHE_DIRECTORY . '/' . $languageCode;
    }

    // Delete files in directory using Drupal's realpath.
    $realPath = $this->fileSystem->realpath($directory);
    if ($realPath && is_dir($realPath)) {
      $this->fileSystem->deleteRecursive($directory);
      $this->logger->info('Polly cache cleared for @dir', [
        '@dir' => $directory,
      ]);
    }

    // Invalidate cache entries.
    $this->cache->invalidateAll();
  }

  /**
   * Check if the Polly service is available.
   *
   * @return bool
   *   TRUE if the service is configured and accessible.
   */
  public function isAvailable(): bool {
    try {
      // Use getRegion() method - the SDK stores region as 'signing_region'
      // in getConfig() which doesn't include a 'region' key.
      $region = $this->getClient()->getRegion();
      return !empty($region);
    }
    catch (\Exception $e) {
      return FALSE;
    }
  }

}
