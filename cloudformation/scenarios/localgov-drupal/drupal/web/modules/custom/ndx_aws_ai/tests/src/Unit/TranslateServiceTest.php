<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_aws_ai\Unit;

use Aws\Result;
use Aws\Translate\TranslateClient;
use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\ndx_aws_ai\RateLimiter\TranslateRateLimiter;
use Drupal\ndx_aws_ai\Result\LanguageDetectionResult;
use Drupal\ndx_aws_ai\Result\TranslationResult;
use Drupal\ndx_aws_ai\Service\AwsClientFactory;
use Drupal\ndx_aws_ai\Service\AwsErrorHandler;
use Drupal\ndx_aws_ai\Service\TranslateService;
use Drupal\ndx_aws_ai\Service\TranslateServiceInterface;
use Drupal\Tests\UnitTestCase;
use Prophecy\Argument;
use Prophecy\PhpUnit\ProphecyTrait;
use Psr\Log\LoggerInterface;

/**
 * Tests for TranslateService.
 *
 * @coversDefaultClass \Drupal\ndx_aws_ai\Service\TranslateService
 * @group ndx_aws_ai
 *
 * Story 4.2: Amazon Translate Service Integration
 */
class TranslateServiceTest extends UnitTestCase {

  use ProphecyTrait;

  /**
   * The mocked AWS client factory.
   *
   * @var \Drupal\ndx_aws_ai\Service\AwsClientFactory|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $clientFactory;

  /**
   * The mocked Translate client.
   *
   * @var \Aws\Translate\TranslateClient|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $translateClient;

  /**
   * The mocked error handler.
   *
   * @var \Drupal\ndx_aws_ai\Service\AwsErrorHandler|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $errorHandler;

  /**
   * The mocked rate limiter.
   *
   * @var \Drupal\ndx_aws_ai\RateLimiter\TranslateRateLimiter|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $rateLimiter;

  /**
   * The mocked cache backend.
   *
   * @var \Drupal\Core\Cache\CacheBackendInterface|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $cache;

  /**
   * The mocked logger.
   *
   * @var \Psr\Log\LoggerInterface|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $logger;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->translateClient = $this->prophesize(TranslateClient::class);
    $this->clientFactory = $this->prophesize(AwsClientFactory::class);
    $this->clientFactory->getTranslateClient()
      ->willReturn($this->translateClient->reveal());

    $this->errorHandler = $this->prophesize(AwsErrorHandler::class);
    $this->rateLimiter = $this->prophesize(TranslateRateLimiter::class);
    $this->cache = $this->prophesize(CacheBackendInterface::class);
    $this->logger = $this->prophesize(LoggerInterface::class);
  }

  /**
   * Create a TranslateService with mocked dependencies.
   *
   * @return \Drupal\ndx_aws_ai\Service\TranslateService
   *   The service under test.
   */
  protected function createService(): TranslateService {
    return new TranslateService(
      $this->clientFactory->reveal(),
      $this->errorHandler->reveal(),
      $this->rateLimiter->reveal(),
      $this->cache->reveal(),
      $this->logger->reveal(),
    );
  }

  /**
   * Tests translateText with auto-detection.
   *
   * @covers ::translateText
   */
  public function testTranslateTextWithAutoDetection(): void {
    $text = 'Hello, world!';
    $expectedTranslation = 'Bonjour, le monde!';

    // No cache hit.
    $this->cache->get(Argument::any())->willReturn(FALSE);

    // Set up expectations.
    $this->rateLimiter->getMaxRetries()->willReturn(3);
    $this->rateLimiter->waitIfNeeded()->shouldBeCalled();
    $this->rateLimiter->recordSuccess()->shouldBeCalled();

    $this->translateClient->translateText([
      'Text' => $text,
      'SourceLanguageCode' => 'auto',
      'TargetLanguageCode' => 'fr',
    ])->willReturn(new Result([
      'TranslatedText' => $expectedTranslation,
      'SourceLanguageCode' => 'en',
      'TargetLanguageCode' => 'fr',
    ]));

    // Caching setup.
    $this->cache->set(Argument::any(), Argument::any(), Argument::any())
      ->shouldBeCalled();

    $this->errorHandler->logOperation('Translate', 'TranslateText', [
      'source' => 'en',
      'target' => 'fr',
      'characters' => strlen($text),
      'auto_detected' => TRUE,
    ])->shouldBeCalled();

    $this->logger->debug(Argument::any(), Argument::any())
      ->shouldBeCalled();

    $service = $this->createService();
    $result = $service->translateText($text, 'fr');

    $this->assertInstanceOf(TranslationResult::class, $result);
    $this->assertEquals($expectedTranslation, $result->translatedText);
    $this->assertEquals('en', $result->sourceLanguage);
    $this->assertEquals('fr', $result->targetLanguage);
    $this->assertTrue($result->wasAutoDetected);
    $this->assertFalse($result->fromCache);
  }

  /**
   * Tests translateText with explicit source language.
   *
   * @covers ::translateText
   */
  public function testTranslateTextWithExplicitSource(): void {
    $text = 'Hello, world!';
    $expectedTranslation = 'Hola, mundo!';

    // No cache hit.
    $this->cache->get(Argument::any())->willReturn(FALSE);

    $this->rateLimiter->getMaxRetries()->willReturn(3);
    $this->rateLimiter->waitIfNeeded()->shouldBeCalled();
    $this->rateLimiter->recordSuccess()->shouldBeCalled();

    $this->translateClient->translateText([
      'Text' => $text,
      'SourceLanguageCode' => 'en',
      'TargetLanguageCode' => 'es',
    ])->willReturn(new Result([
      'TranslatedText' => $expectedTranslation,
      'SourceLanguageCode' => 'en',
      'TargetLanguageCode' => 'es',
    ]));

    $this->cache->set(Argument::any(), Argument::any(), Argument::any())
      ->shouldBeCalled();

    $this->errorHandler->logOperation('Translate', 'TranslateText', [
      'source' => 'en',
      'target' => 'es',
      'characters' => strlen($text),
      'auto_detected' => FALSE,
    ])->shouldBeCalled();

    $this->logger->debug(Argument::any(), Argument::any())
      ->shouldBeCalled();

    $service = $this->createService();
    $result = $service->translateText($text, 'es', 'en');

    $this->assertEquals($expectedTranslation, $result->translatedText);
    $this->assertEquals('en', $result->sourceLanguage);
    $this->assertEquals('es', $result->targetLanguage);
    $this->assertFalse($result->wasAutoDetected);
  }

  /**
   * Tests cache hit returns cached translation.
   *
   * @covers ::translateText
   */
  public function testTranslateTextCacheHit(): void {
    $text = 'Cached text.';
    $cachedResult = new TranslationResult(
      translatedText: 'Texte mis en cache.',
      sourceLanguage: 'en',
      targetLanguage: 'fr',
      wasAutoDetected: TRUE,
      confidence: NULL,
      fromCache: FALSE,
    );

    // Cache hit.
    $cacheItem = new \stdClass();
    $cacheItem->data = $cachedResult;
    $this->cache->get(Argument::any())->willReturn($cacheItem);

    // Translate should not be called.
    $this->translateClient->translateText(Argument::any())
      ->shouldNotBeCalled();

    $this->logger->debug('Translate cache hit for @target', ['@target' => 'fr'])
      ->shouldBeCalled();

    $service = $this->createService();
    $result = $service->translateText($text, 'fr');

    $this->assertEquals('Texte mis en cache.', $result->translatedText);
    $this->assertTrue($result->fromCache);
  }

  /**
   * Tests unsupported target language throws exception.
   *
   * @covers ::translateText
   */
  public function testTranslateTextUnsupportedTargetLanguage(): void {
    $this->expectException(\Drupal\ndx_aws_ai\Exception\AwsServiceException::class);
    $this->expectExceptionMessage("Unsupported target language: zz");

    $service = $this->createService();
    $service->translateText('Hello', 'zz');
  }

  /**
   * Tests unsupported source language throws exception.
   *
   * @covers ::translateText
   */
  public function testTranslateTextUnsupportedSourceLanguage(): void {
    $this->expectException(\Drupal\ndx_aws_ai\Exception\AwsServiceException::class);
    $this->expectExceptionMessage("Unsupported source language: zz");

    $service = $this->createService();
    $service->translateText('Hello', 'fr', 'zz');
  }

  /**
   * Tests same source and target language throws exception.
   *
   * @covers ::translateText
   */
  public function testTranslateTextSameSourceAndTarget(): void {
    $this->expectException(\Drupal\ndx_aws_ai\Exception\AwsServiceException::class);
    $this->expectExceptionMessage("Source and target language are the same: en");

    $service = $this->createService();
    $service->translateText('Hello', 'en', 'en');
  }

  /**
   * Tests batch translation.
   *
   * @covers ::translateBatch
   */
  public function testTranslateBatch(): void {
    $texts = ['Hello', 'World'];
    $translations = ['Bonjour', 'Monde'];

    // No cache hits.
    $this->cache->get(Argument::any())->willReturn(FALSE);

    $this->rateLimiter->getMaxRetries()->willReturn(3);
    $this->rateLimiter->waitIfNeeded()->shouldBeCalled();
    $this->rateLimiter->recordSuccess()->shouldBeCalled();

    // First translation.
    $this->translateClient->translateText([
      'Text' => 'Hello',
      'SourceLanguageCode' => 'auto',
      'TargetLanguageCode' => 'fr',
    ])->willReturn(new Result([
      'TranslatedText' => 'Bonjour',
      'SourceLanguageCode' => 'en',
      'TargetLanguageCode' => 'fr',
    ]));

    // Second translation.
    $this->translateClient->translateText([
      'Text' => 'World',
      'SourceLanguageCode' => 'auto',
      'TargetLanguageCode' => 'fr',
    ])->willReturn(new Result([
      'TranslatedText' => 'Monde',
      'SourceLanguageCode' => 'en',
      'TargetLanguageCode' => 'fr',
    ]));

    $this->cache->set(Argument::any(), Argument::any(), Argument::any())
      ->shouldBeCalled();

    $this->errorHandler->logOperation(Argument::cetera())->shouldBeCalled();
    $this->logger->debug(Argument::any(), Argument::any())->shouldBeCalled();

    $service = $this->createService();
    $results = $service->translateBatch($texts, 'fr');

    $this->assertCount(2, $results);
    $this->assertEquals('Bonjour', $results[0]->translatedText);
    $this->assertEquals('Monde', $results[1]->translatedText);
  }

  /**
   * Tests getSupportedLanguages returns full list.
   *
   * @covers ::getSupportedLanguages
   */
  public function testGetSupportedLanguages(): void {
    $service = $this->createService();
    $languages = $service->getSupportedLanguages();

    $this->assertIsArray($languages);
    $this->assertArrayHasKey('en', $languages);
    $this->assertArrayHasKey('fr', $languages);
    $this->assertArrayHasKey('cy', $languages);
    $this->assertGreaterThan(50, count($languages));
  }

  /**
   * Tests getPriorityLanguages returns UK council priorities.
   *
   * @covers ::getPriorityLanguages
   */
  public function testGetPriorityLanguages(): void {
    $service = $this->createService();
    $languages = $service->getPriorityLanguages();

    $this->assertIsArray($languages);
    $this->assertArrayHasKey('en', $languages);
    $this->assertArrayHasKey('cy', $languages);
    $this->assertArrayHasKey('pl', $languages);
    $this->assertArrayHasKey('ur', $languages);
    $this->assertLessThan(25, count($languages));
  }

  /**
   * Tests isLanguagePairSupported.
   *
   * @covers ::isLanguagePairSupported
   */
  public function testIsLanguagePairSupported(): void {
    $service = $this->createService();

    // Valid pairs.
    $this->assertTrue($service->isLanguagePairSupported('en', 'fr'));
    $this->assertTrue($service->isLanguagePairSupported('auto', 'fr'));
    $this->assertTrue($service->isLanguagePairSupported('cy', 'en'));

    // Invalid pairs.
    $this->assertFalse($service->isLanguagePairSupported('zz', 'en'));
    $this->assertFalse($service->isLanguagePairSupported('en', 'zz'));
  }

  /**
   * Tests the service implements the interface.
   *
   * @covers ::__construct
   */
  public function testImplementsInterface(): void {
    $service = $this->createService();
    $this->assertInstanceOf(TranslateServiceInterface::class, $service);
  }

  /**
   * Tests supported languages constant has Welsh.
   *
   * @covers \Drupal\ndx_aws_ai\Service\TranslateServiceInterface
   */
  public function testSupportedLanguagesHasWelsh(): void {
    $this->assertArrayHasKey('cy', TranslateServiceInterface::SUPPORTED_LANGUAGES);
    $this->assertEquals('Welsh', TranslateServiceInterface::SUPPORTED_LANGUAGES['cy']);
  }

  /**
   * Tests LANGUAGE_AUTO constant.
   *
   * @covers \Drupal\ndx_aws_ai\Service\TranslateServiceInterface
   */
  public function testLanguageAutoConstant(): void {
    $this->assertEquals('auto', TranslateServiceInterface::LANGUAGE_AUTO);
  }

  /**
   * Tests translateHtml with basic HTML content.
   *
   * @covers ::translateHtml
   */
  public function testTranslateHtmlBasic(): void {
    $html = '<p>Hello</p><p>World</p>';
    $expectedTranslations = ['Bonjour', 'Monde'];

    // No cache hit.
    $this->cache->get(Argument::any())->willReturn(FALSE);

    $this->rateLimiter->getMaxRetries()->willReturn(3);
    $this->rateLimiter->waitIfNeeded()->shouldBeCalled();
    $this->rateLimiter->recordSuccess()->shouldBeCalled();

    // First segment translation.
    $this->translateClient->translateText([
      'Text' => 'Hello',
      'SourceLanguageCode' => 'auto',
      'TargetLanguageCode' => 'fr',
    ])->willReturn(new Result([
      'TranslatedText' => 'Bonjour',
      'SourceLanguageCode' => 'en',
      'TargetLanguageCode' => 'fr',
    ]));

    // Second segment translation.
    $this->translateClient->translateText([
      'Text' => 'World',
      'SourceLanguageCode' => 'auto',
      'TargetLanguageCode' => 'fr',
    ])->willReturn(new Result([
      'TranslatedText' => 'Monde',
      'SourceLanguageCode' => 'en',
      'TargetLanguageCode' => 'fr',
    ]));

    $this->cache->set(Argument::any(), Argument::any(), Argument::any())
      ->shouldBeCalled();

    $this->errorHandler->logOperation(Argument::cetera())->shouldBeCalled();
    $this->logger->debug(Argument::any(), Argument::any())->shouldBeCalled();

    $service = $this->createService();
    $result = $service->translateHtml($html, 'fr');

    $this->assertInstanceOf(TranslationResult::class, $result);
    $this->assertStringContainsString('Bonjour', $result->translatedText);
    $this->assertStringContainsString('Monde', $result->translatedText);
    $this->assertStringContainsString('<p>', $result->translatedText);
    $this->assertStringContainsString('</p>', $result->translatedText);
  }

  /**
   * Tests translateHtml preserves HTML tags with attributes.
   *
   * @covers ::translateHtml
   */
  public function testTranslateHtmlPreservesTags(): void {
    $html = '<div class="important">Important text</div>';

    // No cache hit.
    $this->cache->get(Argument::any())->willReturn(FALSE);

    $this->rateLimiter->getMaxRetries()->willReturn(3);
    $this->rateLimiter->waitIfNeeded()->shouldBeCalled();
    $this->rateLimiter->recordSuccess()->shouldBeCalled();

    $this->translateClient->translateText([
      'Text' => 'Important text',
      'SourceLanguageCode' => 'en',
      'TargetLanguageCode' => 'cy',
    ])->willReturn(new Result([
      'TranslatedText' => 'Testun pwysig',
      'SourceLanguageCode' => 'en',
      'TargetLanguageCode' => 'cy',
    ]));

    $this->cache->set(Argument::any(), Argument::any(), Argument::any())
      ->shouldBeCalled();

    $this->errorHandler->logOperation(Argument::cetera())->shouldBeCalled();
    $this->logger->debug(Argument::any(), Argument::any())->shouldBeCalled();

    $service = $this->createService();
    $result = $service->translateHtml($html, 'cy', 'en');

    // Verify HTML structure is preserved.
    $this->assertStringContainsString('<div class="important">', $result->translatedText);
    $this->assertStringContainsString('</div>', $result->translatedText);
    $this->assertStringContainsString('Testun pwysig', $result->translatedText);
  }

  /**
   * Tests translateHtml with empty HTML.
   *
   * @covers ::translateHtml
   */
  public function testTranslateHtmlEmpty(): void {
    $html = '<div></div>';

    // No cache hit.
    $this->cache->get(Argument::any())->willReturn(FALSE);

    // No translation should be called for empty content.
    $this->translateClient->translateText(Argument::any())
      ->shouldNotBeCalled();

    $service = $this->createService();
    $result = $service->translateHtml($html, 'fr');

    // HTML structure should be preserved.
    $this->assertEquals($html, $result->translatedText);
  }

  /**
   * Tests detectLanguage returns NULL confidence.
   *
   * @covers ::detectLanguage
   */
  public function testDetectLanguageNullConfidence(): void {
    $text = 'Bonjour le monde';

    $this->rateLimiter->waitIfNeeded()->shouldBeCalled();
    $this->rateLimiter->recordSuccess()->shouldBeCalled();

    $this->translateClient->translateText([
      'Text' => 'Bonjour le monde',
      'SourceLanguageCode' => 'auto',
      'TargetLanguageCode' => 'en',
    ])->willReturn(new Result([
      'TranslatedText' => 'Hello world',
      'SourceLanguageCode' => 'fr',
      'TargetLanguageCode' => 'en',
    ]));

    $service = $this->createService();
    $result = $service->detectLanguage($text);

    $this->assertEquals('fr', $result->languageCode);
    // Amazon Translate doesn't provide confidence - should be NULL.
    $this->assertNull($result->confidence);
    $this->assertFalse($result->isHighConfidence());
    $this->assertEquals('French', $result->languageName);
  }

}
