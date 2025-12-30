<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Controller;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\ndx_aws_ai\Exception\AwsServiceException;
use Drupal\ndx_aws_ai\Service\TranslateServiceInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for content translation API endpoints.
 *
 * Provides REST endpoints for translating page content using
 * Amazon Translate service. Implements caching to reduce API costs.
 *
 * Story 4.7: Content Translation
 */
class ContentTranslationController extends ControllerBase {

  /**
   * Cache TTL for translations (7 days in seconds).
   */
  protected const CACHE_TTL = 604800;

  /**
   * Maximum HTML content size (500KB).
   */
  protected const MAX_CONTENT_SIZE = 512000;

  /**
   * The Translate service.
   */
  protected TranslateServiceInterface $translateService;

  /**
   * The cache backend.
   */
  protected CacheBackendInterface $cache;

  /**
   * The logger.
   */
  protected LoggerChannelInterface $logger;

  /**
   * {@inheritdoc}
   */
  public function __construct(
    TranslateServiceInterface $translateService,
    CacheBackendInterface $cache,
    LoggerChannelInterface $logger,
  ) {
    $this->translateService = $translateService;
    $this->cache = $cache;
    $this->logger = $logger;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('ndx_aws_ai.translate'),
      $container->get('cache.default'),
      $container->get('logger.channel.ndx_aws_ai'),
    );
  }

  /**
   * Translate HTML content to a target language.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request object containing JSON body with 'html' and 'targetLanguage'.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with translated HTML or error message.
   */
  public function translate(Request $request): JsonResponse {
    $data = json_decode($request->getContent(), TRUE);

    $html = $data['html'] ?? '';
    $targetLanguage = $data['targetLanguage'] ?? '';
    $sourceLanguage = $data['sourceLanguage'] ?? TranslateServiceInterface::LANGUAGE_AUTO;

    // Validate required parameters.
    if (empty($html)) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => $this->t('No content provided for translation.')->__toString(),
      ], 400);
    }

    if (empty($targetLanguage)) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => $this->t('No target language specified.')->__toString(),
      ], 400);
    }

    // Validate content size.
    if (strlen($html) > self::MAX_CONTENT_SIZE) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => $this->t('Content is too large to translate.')->__toString(),
      ], 413);
    }

    // Validate language is supported.
    $supportedLanguages = $this->translateService->getSupportedLanguages();
    if (!isset($supportedLanguages[$targetLanguage])) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => $this->t('Unsupported target language: @lang', [
          '@lang' => $targetLanguage,
        ])->__toString(),
      ], 400);
    }

    // Check cache first.
    $cid = $this->getCacheId($html, $targetLanguage, $sourceLanguage);
    if ($cached = $this->cache->get($cid)) {
      $this->logger->debug('Translation cache hit for @lang', [
        '@lang' => $targetLanguage,
      ]);

      return new JsonResponse([
        'success' => TRUE,
        'translatedHtml' => $cached->data['html'],
        'languageName' => $cached->data['languageName'],
        'sourceLanguage' => $cached->data['sourceLanguage'],
        'cached' => TRUE,
      ]);
    }

    // Perform translation.
    try {
      $startTime = microtime(TRUE);

      $result = $this->translateService->translateHtml(
        $html,
        $targetLanguage,
        $sourceLanguage,
      );

      $processingTime = round((microtime(TRUE) - $startTime) * 1000);
      $languageName = $supportedLanguages[$targetLanguage];
      $detectedSource = $result->getSourceLanguage();

      // Cache the translation.
      $this->cache->set($cid, [
        'html' => $result->getTranslatedText(),
        'languageName' => $languageName,
        'sourceLanguage' => $detectedSource,
      ], time() + self::CACHE_TTL);

      $this->logger->info('Content translated to @lang in @time ms', [
        '@lang' => $languageName,
        '@time' => $processingTime,
      ]);

      return new JsonResponse([
        'success' => TRUE,
        'translatedHtml' => $result->getTranslatedText(),
        'languageName' => $languageName,
        'sourceLanguage' => $detectedSource,
        'processingTimeMs' => $processingTime,
        'cached' => FALSE,
      ]);

    }
    catch (AwsServiceException $e) {
      $this->logger->error('Translation failed: @message', [
        '@message' => $e->getMessage(),
      ]);

      return new JsonResponse([
        'success' => FALSE,
        'error' => $this->t('Translation service temporarily unavailable. Please try again later.')->__toString(),
      ], 503);
    }
    catch (\Exception $e) {
      $this->logger->error('Unexpected translation error: @message', [
        '@message' => $e->getMessage(),
      ]);

      return new JsonResponse([
        'success' => FALSE,
        'error' => $this->t('An error occurred during translation.')->__toString(),
      ], 500);
    }
  }

  /**
   * Get the list of supported languages.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with priority and all supported languages.
   */
  public function getLanguages(): JsonResponse {
    return new JsonResponse([
      'priority' => $this->translateService->getPriorityLanguages(),
      'all' => $this->translateService->getSupportedLanguages(),
    ]);
  }

  /**
   * Generate a cache ID for a translation.
   *
   * @param string $html
   *   The HTML content.
   * @param string $targetLanguage
   *   The target language code.
   * @param string $sourceLanguage
   *   The source language code.
   *
   * @return string
   *   The cache ID.
   */
  protected function getCacheId(string $html, string $targetLanguage, string $sourceLanguage): string {
    return 'ndx_translation:' . $sourceLanguage . ':' . $targetLanguage . ':' . hash('sha256', $html);
  }

}
