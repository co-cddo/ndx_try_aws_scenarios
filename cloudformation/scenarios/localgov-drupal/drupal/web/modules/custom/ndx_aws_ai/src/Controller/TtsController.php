<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Controller;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Controller\ControllerBase;
use Drupal\ndx_aws_ai\Service\ContentExtractorInterface;
use Drupal\ndx_aws_ai\Service\PollyServiceInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Controller for text-to-speech API endpoints.
 *
 * Provides endpoints for synthesizing text to speech using Amazon Polly.
 *
 * Story 4.6: Listen to Page (TTS Button)
 */
class TtsController extends ControllerBase {

  /**
   * Cache expiry time in seconds (24 hours).
   */
  protected const CACHE_EXPIRY = 86400;

  /**
   * Maximum text length for synthesis.
   */
  protected const MAX_TEXT_LENGTH = 100000;

  /**
   * Language name mapping for UI.
   */
  protected const LANGUAGE_NAMES = [
    'en-GB' => 'English (UK)',
    'cy-GB' => 'Cymraeg (Welsh)',
    'fr-FR' => 'Fran&ccedil;ais',
    'ro-RO' => 'Rom&acirc;n&#259;',
    'es-ES' => 'Espa&ntilde;ol',
    'cs-CZ' => '&#268;e&scaron;tina',
    'pl-PL' => 'Polski',
  ];

  /**
   * Constructs a TtsController.
   *
   * @param \Drupal\ndx_aws_ai\Service\PollyServiceInterface $pollyService
   *   The Polly TTS service.
   * @param \Drupal\ndx_aws_ai\Service\ContentExtractorInterface $contentExtractor
   *   The content extractor service.
   * @param \Drupal\Core\Cache\CacheBackendInterface $cache
   *   The cache backend.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected PollyServiceInterface $pollyService,
    protected ContentExtractorInterface $contentExtractor,
    protected CacheBackendInterface $cache,
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): self {
    return new self(
      $container->get('ndx_aws_ai.polly'),
      $container->get('ndx_aws_ai.content_extractor'),
      $container->get('cache.default'),
      $container->get('logger.channel.ndx_aws_ai'),
    );
  }

  /**
   * Synthesize text to speech.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request object.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   The audio response or error.
   */
  public function synthesize(Request $request): Response {
    try {
      $data = json_decode($request->getContent(), TRUE);

      if (json_last_error() !== JSON_ERROR_NONE) {
        throw new BadRequestHttpException('Invalid JSON payload');
      }

      $text = $data['text'] ?? '';
      $language = $data['language'] ?? 'en-GB';

      // Validate text.
      if (empty(trim($text))) {
        throw new BadRequestHttpException('No text provided for synthesis');
      }

      if (strlen($text) > self::MAX_TEXT_LENGTH) {
        throw new BadRequestHttpException('Text exceeds maximum length of ' . self::MAX_TEXT_LENGTH . ' characters');
      }

      // Validate language.
      if (!isset(PollyServiceInterface::SUPPORTED_LANGUAGES[$language])) {
        throw new BadRequestHttpException('Unsupported language: ' . $language);
      }

      // Check cache.
      $cacheId = 'ndx_tts:' . md5($text . ':' . $language);
      $cached = $this->cache->get($cacheId);

      if ($cached) {
        $this->logger->debug('TTS cache hit for @chars chars in @lang', [
          '@chars' => strlen($text),
          '@lang' => $language,
        ]);
        return $this->createAudioResponse($cached->data);
      }

      // Generate audio.
      $audio = $this->pollyService->synthesizeLongText($text, $language);

      // Cache the result.
      $this->cache->set($cacheId, $audio, time() + self::CACHE_EXPIRY);

      $this->logger->info('TTS synthesized @chars chars in @lang', [
        '@chars' => strlen($text),
        '@lang' => $language,
      ]);

      return $this->createAudioResponse($audio);
    }
    catch (BadRequestHttpException $e) {
      return new JsonResponse([
        'error' => $e->getMessage(),
      ], 400);
    }
    catch (\Exception $e) {
      $this->logger->error('TTS synthesis failed: @error', [
        '@error' => $e->getMessage(),
      ]);

      return new JsonResponse([
        'error' => 'Speech synthesis failed. Please try again later.',
      ], 500);
    }
  }

  /**
   * Get available languages for TTS.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with language options.
   */
  public function getLanguages(): JsonResponse {
    $languages = [];

    foreach (PollyServiceInterface::SUPPORTED_LANGUAGES as $code => $config) {
      $languages[] = [
        'code' => $code,
        'name' => html_entity_decode(self::LANGUAGE_NAMES[$code] ?? $code, ENT_QUOTES | ENT_HTML5, 'UTF-8'),
        'voice' => $config['voice'],
        'engine' => $config['engine'],
      ];
    }

    return new JsonResponse($languages);
  }

  /**
   * Create an audio response with proper headers.
   *
   * @param string $audio
   *   The audio content as binary string.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   The HTTP response.
   */
  protected function createAudioResponse(string $audio): Response {
    return new Response($audio, 200, [
      'Content-Type' => 'audio/mpeg',
      'Content-Length' => strlen($audio),
      'Cache-Control' => 'public, max-age=3600',
      'Accept-Ranges' => 'bytes',
    ]);
  }

}
