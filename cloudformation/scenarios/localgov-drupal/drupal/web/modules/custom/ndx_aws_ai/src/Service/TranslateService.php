<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Aws\Exception\AwsException;
use Aws\Translate\TranslateClient;
use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\ndx_aws_ai\Exception\AwsServiceException;
use Drupal\ndx_aws_ai\RateLimiter\TranslateRateLimiter;
use Drupal\ndx_aws_ai\Result\LanguageDetectionResult;
use Drupal\ndx_aws_ai\Result\TranslationResult;
use Psr\Log\LoggerInterface;

/**
 * Amazon Translate service for multi-language translation.
 *
 * Provides translation capabilities for 75+ languages with support for:
 * - Auto-detection of source language
 * - HTML content preservation
 * - Batch translation
 * - Translation caching
 * - Rate limiting with exponential backoff
 *
 * Story 4.2: Amazon Translate Service Integration
 */
class TranslateService implements TranslateServiceInterface {

  /**
   * Maximum text length per request (10,000 bytes).
   */
  protected const MAX_TEXT_LENGTH = 10000;

  /**
   * Cache TTL in seconds (7 days for translations).
   */
  protected const CACHE_TTL = 604800;

  /**
   * Cache key prefix.
   */
  protected const CACHE_PREFIX = 'translate';

  /**
   * The Translate client.
   */
  protected TranslateClient $client;

  /**
   * Constructs a TranslateService.
   *
   * @param \Drupal\ndx_aws_ai\Service\AwsClientFactory $clientFactory
   *   The AWS client factory.
   * @param \Drupal\ndx_aws_ai\Service\AwsErrorHandler $errorHandler
   *   The AWS error handler.
   * @param \Drupal\ndx_aws_ai\RateLimiter\TranslateRateLimiter $rateLimiter
   *   The rate limiter for API calls.
   * @param \Drupal\Core\Cache\CacheBackendInterface $cache
   *   The cache backend.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected AwsClientFactory $clientFactory,
    protected AwsErrorHandler $errorHandler,
    protected TranslateRateLimiter $rateLimiter,
    protected CacheBackendInterface $cache,
    protected LoggerInterface $logger,
  ) {
    $this->client = $this->clientFactory->getTranslateClient();
  }

  /**
   * {@inheritdoc}
   */
  public function translateText(string $text, string $targetLanguage, string $sourceLanguage = self::LANGUAGE_AUTO): TranslationResult {
    // Validate languages.
    $this->validateLanguages($sourceLanguage, $targetLanguage);

    // Check text length.
    if (strlen($text) > self::MAX_TEXT_LENGTH) {
      throw new AwsServiceException(
        message: 'Text exceeds maximum length of ' . self::MAX_TEXT_LENGTH . ' bytes',
        awsErrorCode: 'TextSizeLimitExceededException',
        awsService: 'Translate',
        userMessage: 'The text is too long to translate. Please try a shorter text.',
      );
    }

    // Check cache first.
    $cacheKey = $this->buildCacheKey($text, $sourceLanguage, $targetLanguage);
    $cached = $this->getCachedTranslation($cacheKey);
    if ($cached !== NULL) {
      $this->logger->debug('Translate cache hit for @target', [
        '@target' => $targetLanguage,
      ]);
      return $cached->asCached();
    }

    // Translate with retry logic.
    $result = $this->executeWithRetry($text, $sourceLanguage, $targetLanguage);

    // Cache the result.
    $this->cacheTranslation($cacheKey, $result);

    // Log usage.
    $this->errorHandler->logOperation('Translate', 'TranslateText', [
      'source' => $result->sourceLanguage,
      'target' => $targetLanguage,
      'characters' => strlen($text),
      'auto_detected' => $result->wasAutoDetected,
    ]);

    return $result;
  }

  /**
   * {@inheritdoc}
   */
  public function translateHtml(string $html, string $targetLanguage, string $sourceLanguage = self::LANGUAGE_AUTO): TranslationResult {
    // Validate languages.
    $this->validateLanguages($sourceLanguage, $targetLanguage);

    // Check text length.
    if (strlen($html) > self::MAX_TEXT_LENGTH) {
      throw new AwsServiceException(
        message: 'HTML content exceeds maximum length of ' . self::MAX_TEXT_LENGTH . ' bytes',
        awsErrorCode: 'TextSizeLimitExceededException',
        awsService: 'Translate',
        userMessage: 'The HTML content is too long to translate. Please try shorter content.',
      );
    }

    // Check cache first.
    $cacheKey = $this->buildCacheKey($html, $sourceLanguage, $targetLanguage, 'html');
    $cached = $this->getCachedTranslation($cacheKey);
    if ($cached !== NULL) {
      $this->logger->debug('Translate HTML cache hit for @target', [
        '@target' => $targetLanguage,
      ]);
      return $cached->asCached();
    }

    // Extract text segments and preserve HTML structure.
    $segments = $this->extractHtmlSegments($html);

    // If no translatable content, return as-is.
    if (empty($segments['texts'])) {
      return new TranslationResult(
        translatedText: $html,
        sourceLanguage: $sourceLanguage === self::LANGUAGE_AUTO ? 'en' : $sourceLanguage,
        targetLanguage: $targetLanguage,
        wasAutoDetected: FALSE,
        confidence: NULL,
        fromCache: FALSE,
      );
    }

    // Translate all text segments.
    $translatedTexts = [];
    $detectedLanguage = NULL;
    $wasAutoDetected = FALSE;

    foreach ($segments['texts'] as $text) {
      $result = $this->executeWithRetry($text, $sourceLanguage, $targetLanguage);
      $translatedTexts[] = $result->translatedText;
      if ($detectedLanguage === NULL) {
        $detectedLanguage = $result->sourceLanguage;
        $wasAutoDetected = $result->wasAutoDetected;
      }
    }

    // Reconstruct HTML with translated text.
    $translatedHtml = $this->reconstructHtml($segments['template'], $translatedTexts);

    $finalResult = new TranslationResult(
      translatedText: $translatedHtml,
      sourceLanguage: $detectedLanguage ?? 'en',
      targetLanguage: $targetLanguage,
      wasAutoDetected: $wasAutoDetected,
      confidence: NULL,
      fromCache: FALSE,
    );

    // Cache the result.
    $this->cacheTranslation($cacheKey, $finalResult);

    // Log usage.
    $this->errorHandler->logOperation('Translate', 'TranslateHtml', [
      'source' => $detectedLanguage,
      'target' => $targetLanguage,
      'segments' => count($segments['texts']),
      'characters' => strlen($html),
    ]);

    return $finalResult;
  }

  /**
   * {@inheritdoc}
   */
  public function translateBatch(array $texts, string $targetLanguage, string $sourceLanguage = self::LANGUAGE_AUTO): array {
    // Validate languages.
    $this->validateLanguages($sourceLanguage, $targetLanguage);

    $results = [];
    foreach ($texts as $text) {
      // Skip empty texts.
      if (empty(trim($text))) {
        $results[] = new TranslationResult(
          translatedText: $text,
          sourceLanguage: $sourceLanguage === self::LANGUAGE_AUTO ? 'en' : $sourceLanguage,
          targetLanguage: $targetLanguage,
          wasAutoDetected: FALSE,
          confidence: NULL,
          fromCache: FALSE,
        );
        continue;
      }

      try {
        $results[] = $this->translateText($text, $targetLanguage, $sourceLanguage);
      }
      catch (AwsServiceException $e) {
        // Log the error but continue with remaining texts.
        $this->logger->warning('Batch translation failed for segment: @error', [
          '@error' => $e->getMessage(),
        ]);
        // Return original text on failure.
        $results[] = new TranslationResult(
          translatedText: $text,
          sourceLanguage: $sourceLanguage === self::LANGUAGE_AUTO ? 'en' : $sourceLanguage,
          targetLanguage: $targetLanguage,
          wasAutoDetected: FALSE,
          confidence: NULL,
          fromCache: FALSE,
        );
      }
    }

    return $results;
  }

  /**
   * {@inheritdoc}
   */
  public function detectLanguage(string $text): LanguageDetectionResult {
    $this->rateLimiter->waitIfNeeded();

    try {
      // Use TranslateText with auto-detection to get language.
      $result = $this->client->translateText([
        'Text' => substr($text, 0, 100), // Only need a small sample.
        'SourceLanguageCode' => 'auto',
        'TargetLanguageCode' => 'en',
      ]);

      $detectedCode = $result['SourceLanguageCode'];

      $this->rateLimiter->recordSuccess();

      // Note: Amazon Translate does not provide confidence scores.
      // Pass NULL to indicate confidence is unavailable.
      return LanguageDetectionResult::fromApiResponse(
        languageCode: $detectedCode,
        confidence: NULL,
        languageMap: self::SUPPORTED_LANGUAGES,
      );
    }
    catch (AwsException $e) {
      $this->rateLimiter->recordFailure();
      throw $this->errorHandler->handleException($e, 'Translate', 'DetectLanguage');
    }
  }

  /**
   * {@inheritdoc}
   */
  public function getSupportedLanguages(): array {
    return self::SUPPORTED_LANGUAGES;
  }

  /**
   * {@inheritdoc}
   */
  public function getPriorityLanguages(): array {
    return self::PRIORITY_LANGUAGES;
  }

  /**
   * {@inheritdoc}
   */
  public function isLanguagePairSupported(string $sourceLanguage, string $targetLanguage): bool {
    // Auto is always valid for source.
    if ($sourceLanguage === self::LANGUAGE_AUTO) {
      return isset(self::SUPPORTED_LANGUAGES[$targetLanguage]);
    }

    // Both languages must be in supported list.
    return isset(self::SUPPORTED_LANGUAGES[$sourceLanguage])
      && isset(self::SUPPORTED_LANGUAGES[$targetLanguage]);
  }

  /**
   * {@inheritdoc}
   */
  public function clearCache(?string $targetLanguage = NULL): void {
    // Drupal's default cache backend doesn't support wildcard invalidation.
    // We must invalidate all translation cache entries.
    // If targetLanguage is specified, log it but still clear all
    // (future enhancement: use cache tags for selective invalidation).
    $this->cache->invalidateAll();

    if ($targetLanguage !== NULL) {
      $this->logger->info('Translate cache cleared (requested @target, cleared all - selective invalidation not supported)', [
        '@target' => $targetLanguage,
      ]);
    }
    else {
      $this->logger->info('Translate cache cleared for all languages');
    }
  }

  /**
   * Execute a translate API call with retry logic.
   *
   * @param string $text
   *   The text to translate.
   * @param string $sourceLanguage
   *   The source language code or 'auto'.
   * @param string $targetLanguage
   *   The target language code.
   *
   * @return \Drupal\ndx_aws_ai\Result\TranslationResult
   *   The translation result.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails after retries.
   */
  protected function executeWithRetry(string $text, string $sourceLanguage, string $targetLanguage): TranslationResult {
    $attempt = 0;
    $lastException = NULL;

    while ($attempt < $this->rateLimiter->getMaxRetries()) {
      try {
        $this->rateLimiter->waitIfNeeded();

        $result = $this->client->translateText([
          'Text' => $text,
          'SourceLanguageCode' => $sourceLanguage,
          'TargetLanguageCode' => $targetLanguage,
        ]);

        $this->rateLimiter->recordSuccess();

        return TranslationResult::fromApiResponse(
          translatedText: $result['TranslatedText'],
          sourceLanguage: $result['SourceLanguageCode'],
          targetLanguage: $result['TargetLanguageCode'],
          requestedSource: $sourceLanguage,
        );
      }
      catch (AwsException $e) {
        $lastException = $e;
        $errorCode = $e->getAwsErrorCode() ?? 'UnknownError';

        if ($this->rateLimiter->isRetryable($errorCode) && $attempt < $this->rateLimiter->getMaxRetries() - 1) {
          $this->errorHandler->logRetry('Translate', 'TranslateText', $attempt + 1, $errorCode);
          $this->rateLimiter->recordFailure();
          $this->rateLimiter->waitForRetry($attempt);
          $attempt++;
          continue;
        }

        throw $this->errorHandler->handleException($e, 'Translate', 'TranslateText');
      }
    }

    if ($lastException !== NULL) {
      throw $this->errorHandler->handleException($lastException, 'Translate', 'TranslateText');
    }

    throw new AwsServiceException(
      message: 'Maximum retries exceeded',
      awsErrorCode: 'MaxRetriesExceeded',
      awsService: 'Translate',
      userMessage: 'The translation service is currently unavailable. Please try again later.',
    );
  }

  /**
   * Validate source and target languages.
   *
   * @param string $sourceLanguage
   *   The source language code.
   * @param string $targetLanguage
   *   The target language code.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the language pair is not supported.
   */
  protected function validateLanguages(string $sourceLanguage, string $targetLanguage): void {
    // Check target language is supported.
    if (!isset(self::SUPPORTED_LANGUAGES[$targetLanguage])) {
      throw new AwsServiceException(
        message: "Unsupported target language: $targetLanguage",
        awsErrorCode: 'UnsupportedLanguagePairException',
        awsService: 'Translate',
        userMessage: "The language '$targetLanguage' is not supported for translation.",
      );
    }

    // Check source language if not auto-detect.
    if ($sourceLanguage !== self::LANGUAGE_AUTO && !isset(self::SUPPORTED_LANGUAGES[$sourceLanguage])) {
      throw new AwsServiceException(
        message: "Unsupported source language: $sourceLanguage",
        awsErrorCode: 'UnsupportedLanguagePairException',
        awsService: 'Translate',
        userMessage: "The source language '$sourceLanguage' is not supported.",
      );
    }

    // Source and target cannot be the same (unless auto-detect).
    if ($sourceLanguage !== self::LANGUAGE_AUTO && $sourceLanguage === $targetLanguage) {
      throw new AwsServiceException(
        message: "Source and target language are the same: $sourceLanguage",
        awsErrorCode: 'InvalidParameterValue',
        awsService: 'Translate',
        userMessage: "Source and target language cannot be the same.",
      );
    }
  }

  /**
   * Build a cache key for translation.
   *
   * @param string $text
   *   The text content.
   * @param string $sourceLanguage
   *   The source language.
   * @param string $targetLanguage
   *   The target language.
   * @param string $type
   *   The content type (text or html).
   *
   * @return string
   *   The cache key.
   */
  protected function buildCacheKey(string $text, string $sourceLanguage, string $targetLanguage, string $type = 'text'): string {
    $hash = hash('sha256', $text);
    return self::CACHE_PREFIX . ":{$type}:{$sourceLanguage}:{$targetLanguage}:{$hash}";
  }

  /**
   * Get a cached translation if available.
   *
   * @param string $cacheKey
   *   The cache key.
   *
   * @return \Drupal\ndx_aws_ai\Result\TranslationResult|null
   *   The cached result, or NULL if not cached.
   */
  protected function getCachedTranslation(string $cacheKey): ?TranslationResult {
    $cached = $this->cache->get($cacheKey);
    if ($cached && isset($cached->data) && $cached->data instanceof TranslationResult) {
      return $cached->data;
    }
    return NULL;
  }

  /**
   * Cache a translation result.
   *
   * @param string $cacheKey
   *   The cache key.
   * @param \Drupal\ndx_aws_ai\Result\TranslationResult $result
   *   The translation result.
   */
  protected function cacheTranslation(string $cacheKey, TranslationResult $result): void {
    $expire = time() + self::CACHE_TTL;
    $this->cache->set($cacheKey, $result, $expire);

    $this->logger->debug('Translate result cached with key @key', [
      '@key' => $cacheKey,
    ]);
  }

  /**
   * Extract text segments from HTML, preserving structure.
   *
   * @param string $html
   *   The HTML content.
   *
   * @return array{template: string, texts: array<string>}
   *   Array with template and extracted text segments.
   */
  protected function extractHtmlSegments(string $html): array {
    $texts = [];
    $counter = 0;

    // Pattern to match text content between tags.
    // This is a simplified approach - for complex HTML, consider using DOMDocument.
    $template = preg_replace_callback(
      '/>([^<]+)</u',
      function ($matches) use (&$texts, &$counter) {
        $text = trim($matches[1]);
        if (!empty($text) && !ctype_space($text)) {
          $texts[] = $matches[1];
          $placeholder = ">{{TRANSLATE_$counter}}<";
          $counter++;
          return $placeholder;
        }
        return $matches[0];
      },
      $html
    );

    return [
      'template' => $template ?? $html,
      'texts' => $texts,
    ];
  }

  /**
   * Reconstruct HTML from template with translated text.
   *
   * @param string $template
   *   The HTML template with placeholders.
   * @param array<string> $texts
   *   The translated text segments.
   *
   * @return string
   *   The reconstructed HTML.
   */
  protected function reconstructHtml(string $template, array $texts): string {
    $result = $template;
    foreach ($texts as $index => $text) {
      $result = str_replace("{{TRANSLATE_$index}}", $text, $result);
    }
    return $result;
  }

  /**
   * Check if the Translate service is available.
   *
   * @return bool
   *   TRUE if the service is configured and accessible.
   */
  public function isAvailable(): bool {
    try {
      $config = $this->client->getConfig();
      return !empty($config['region']);
    }
    catch (\Exception $e) {
      return FALSE;
    }
  }

}
