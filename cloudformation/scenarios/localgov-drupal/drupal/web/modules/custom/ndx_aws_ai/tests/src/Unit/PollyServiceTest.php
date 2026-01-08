<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_aws_ai\Unit;

use Aws\Polly\PollyClient;
use Aws\Result;
use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\ndx_aws_ai\RateLimiter\PollyRateLimiter;
use Drupal\ndx_aws_ai\Service\AwsClientFactory;
use Drupal\ndx_aws_ai\Service\AwsErrorHandler;
use Drupal\ndx_aws_ai\Service\PollyService;
use Drupal\ndx_aws_ai\Service\PollyServiceInterface;
use Drupal\Tests\UnitTestCase;
use GuzzleHttp\Psr7\Stream;
use Prophecy\PhpUnit\ProphecyTrait;
use Psr\Log\LoggerInterface;

/**
 * Tests for PollyService.
 *
 * @coversDefaultClass \Drupal\ndx_aws_ai\Service\PollyService
 * @group ndx_aws_ai
 *
 * Story 4.1: Polly TTS Service Integration
 */
class PollyServiceTest extends UnitTestCase {

  use ProphecyTrait;

  /**
   * The mocked AWS client factory.
   *
   * @var \Drupal\ndx_aws_ai\Service\AwsClientFactory|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $clientFactory;

  /**
   * The mocked Polly client.
   *
   * @var \Aws\Polly\PollyClient|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $pollyClient;

  /**
   * The mocked error handler.
   *
   * @var \Drupal\ndx_aws_ai\Service\AwsErrorHandler|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $errorHandler;

  /**
   * The mocked rate limiter.
   *
   * @var \Drupal\ndx_aws_ai\RateLimiter\PollyRateLimiter|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $rateLimiter;

  /**
   * The mocked cache backend.
   *
   * @var \Drupal\Core\Cache\CacheBackendInterface|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $cache;

  /**
   * The mocked file system.
   *
   * @var \Drupal\Core\File\FileSystemInterface|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $fileSystem;

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

    $this->pollyClient = $this->prophesize(PollyClient::class);
    $this->clientFactory = $this->prophesize(AwsClientFactory::class);
    $this->clientFactory->getPollyClient()
      ->willReturn($this->pollyClient->reveal());

    $this->errorHandler = $this->prophesize(AwsErrorHandler::class);
    $this->rateLimiter = $this->prophesize(PollyRateLimiter::class);
    $this->cache = $this->prophesize(CacheBackendInterface::class);
    $this->fileSystem = $this->prophesize(FileSystemInterface::class);
    $this->logger = $this->prophesize(LoggerInterface::class);
  }

  /**
   * Create a PollyService with mocked dependencies.
   *
   * @return \Drupal\ndx_aws_ai\Service\PollyService
   *   The service under test.
   */
  protected function createService(): PollyService {
    return new PollyService(
      $this->clientFactory->reveal(),
      $this->errorHandler->reveal(),
      $this->rateLimiter->reveal(),
      $this->cache->reveal(),
      $this->fileSystem->reveal(),
      $this->logger->reveal(),
    );
  }

  /**
   * Create a mock audio stream.
   *
   * @param string $content
   *   The audio content.
   *
   * @return \GuzzleHttp\Psr7\Stream
   *   A mock stream.
   */
  protected function createMockAudioStream(string $content = 'fake-mp3-content'): Stream {
    $resource = fopen('php://memory', 'r+');
    fwrite($resource, $content);
    rewind($resource);
    return new Stream($resource);
  }

  /**
   * Tests synthesizeSpeech with default English voice.
   *
   * @covers ::synthesizeSpeech
   */
  public function testSynthesizeSpeechWithDefaultEnglish(): void {
    $text = 'Hello, this is a test.';
    $expectedAudio = 'fake-mp3-content';

    // No cache hit.
    $this->cache->get(\Prophecy\Argument::any())->willReturn(FALSE);

    // Set up expectations.
    $this->rateLimiter->getMaxRetries()->willReturn(3);
    $this->rateLimiter->waitIfNeeded()->shouldBeCalled();
    $this->rateLimiter->recordSuccess()->shouldBeCalled();

    $audioStream = $this->createMockAudioStream($expectedAudio);

    $this->pollyClient->synthesizeSpeech([
      'Engine' => 'neural',
      'OutputFormat' => 'mp3',
      'Text' => $text,
      'TextType' => 'text',
      'VoiceId' => 'Amy',
    ])->willReturn(new Result([
      'AudioStream' => $audioStream,
    ]));

    // Caching setup.
    $this->fileSystem->prepareDirectory(\Prophecy\Argument::any(), \Prophecy\Argument::any())
      ->willReturn(TRUE);
    $this->fileSystem->saveData(\Prophecy\Argument::any(), \Prophecy\Argument::any(), \Prophecy\Argument::any())
      ->willReturn('public://polly-cache/en-GB/test.mp3');
    $this->cache->set(\Prophecy\Argument::any(), \Prophecy\Argument::any(), \Prophecy\Argument::any())
      ->shouldBeCalled();

    $this->errorHandler->logOperation('Polly', 'SynthesizeSpeech', [
      'language' => 'en-GB',
      'voice' => 'Amy',
      'engine' => 'neural',
      'characters' => strlen($text),
    ])->shouldBeCalled();

    $this->logger->debug(\Prophecy\Argument::any(), \Prophecy\Argument::any())
      ->shouldBeCalled();

    $service = $this->createService();
    $result = $service->synthesizeSpeech($text, 'en-GB');

    $this->assertEquals($expectedAudio, $result);
  }

  /**
   * Tests synthesizeSpeech with Welsh uses standard engine.
   *
   * @covers ::synthesizeSpeech
   */
  public function testSynthesizeSpeechWithWelsh(): void {
    $text = 'Bore da, croeso.';
    $expectedAudio = 'welsh-audio';

    // No cache hit.
    $this->cache->get(\Prophecy\Argument::any())->willReturn(FALSE);

    $this->rateLimiter->getMaxRetries()->willReturn(3);
    $this->rateLimiter->waitIfNeeded()->shouldBeCalled();
    $this->rateLimiter->recordSuccess()->shouldBeCalled();

    $audioStream = $this->createMockAudioStream($expectedAudio);

    // Welsh uses standard engine and Gwyneth voice.
    $this->pollyClient->synthesizeSpeech([
      'Engine' => 'standard',
      'OutputFormat' => 'mp3',
      'Text' => $text,
      'TextType' => 'text',
      'VoiceId' => 'Gwyneth',
    ])->willReturn(new Result([
      'AudioStream' => $audioStream,
    ]));

    $this->fileSystem->prepareDirectory(\Prophecy\Argument::any(), \Prophecy\Argument::any())
      ->willReturn(TRUE);
    $this->fileSystem->saveData(\Prophecy\Argument::any(), \Prophecy\Argument::any(), \Prophecy\Argument::any())
      ->willReturn('public://polly-cache/cy-GB/test.mp3');
    $this->cache->set(\Prophecy\Argument::any(), \Prophecy\Argument::any(), \Prophecy\Argument::any())
      ->shouldBeCalled();

    $this->errorHandler->logOperation('Polly', 'SynthesizeSpeech', [
      'language' => 'cy-GB',
      'voice' => 'Gwyneth',
      'engine' => 'standard',
      'characters' => strlen($text),
    ])->shouldBeCalled();

    $this->logger->debug(\Prophecy\Argument::any(), \Prophecy\Argument::any())
      ->shouldBeCalled();

    $service = $this->createService();
    $result = $service->synthesizeSpeech($text, 'cy-GB');

    $this->assertEquals($expectedAudio, $result);
  }

  /**
   * Tests cache hit returns cached audio.
   *
   * @covers ::synthesizeSpeech
   */
  public function testSynthesizeSpeechCacheHit(): void {
    $text = 'Cached text.';
    $cachedAudio = 'cached-audio-content';

    // Create a temporary file for the cached audio.
    $tempFile = sys_get_temp_dir() . '/polly-test-' . uniqid() . '.mp3';
    file_put_contents($tempFile, $cachedAudio);

    // Cache hit returns the file path.
    $cacheItem = new \stdClass();
    $cacheItem->data = $tempFile;
    $this->cache->get(\Prophecy\Argument::any())->willReturn($cacheItem);

    // Polly should not be called.
    $this->pollyClient->synthesizeSpeech(\Prophecy\Argument::any())
      ->shouldNotBeCalled();

    $this->logger->debug('Polly cache hit for @language', ['@language' => 'en-GB'])
      ->shouldBeCalled();

    $service = $this->createService();
    $result = $service->synthesizeSpeech($text, 'en-GB');

    $this->assertEquals($cachedAudio, $result);

    // Cleanup.
    unlink($tempFile);
  }

  /**
   * Tests unsupported language throws exception.
   *
   * @covers ::synthesizeSpeech
   */
  public function testSynthesizeSpeechUnsupportedLanguage(): void {
    $this->expectException(\Drupal\ndx_aws_ai\Exception\AwsServiceException::class);
    $this->expectExceptionMessage('Unsupported language code: de-DE');

    $service = $this->createService();
    $service->synthesizeSpeech('German text', 'de-DE');
  }

  /**
   * Tests the service implements the interface.
   *
   * @covers ::__construct
   */
  public function testImplementsInterface(): void {
    $service = $this->createService();
    $this->assertInstanceOf(PollyServiceInterface::class, $service);
  }

  /**
   * Tests supported languages are correctly defined.
   *
   * @covers \Drupal\ndx_aws_ai\Service\PollyServiceInterface
   */
  public function testSupportedLanguages(): void {
    $expectedLanguages = ['en-GB', 'cy-GB', 'fr-FR', 'ro-RO', 'es-ES', 'cs-CZ', 'pl-PL'];

    foreach ($expectedLanguages as $language) {
      $this->assertArrayHasKey($language, PollyServiceInterface::SUPPORTED_LANGUAGES);
    }

    // Verify neural vs standard engines.
    $this->assertEquals('neural', PollyServiceInterface::SUPPORTED_LANGUAGES['en-GB']['engine']);
    $this->assertEquals('standard', PollyServiceInterface::SUPPORTED_LANGUAGES['cy-GB']['engine']);
    $this->assertEquals('standard', PollyServiceInterface::SUPPORTED_LANGUAGES['ro-RO']['engine']);

    // Verify Welsh uses Gwyneth.
    $this->assertEquals('Gwyneth', PollyServiceInterface::SUPPORTED_LANGUAGES['cy-GB']['voice']);
  }

  /**
   * Tests engine constants.
   *
   * @covers \Drupal\ndx_aws_ai\Service\PollyServiceInterface
   */
  public function testEngineConstants(): void {
    $this->assertEquals('neural', PollyServiceInterface::ENGINE_NEURAL);
    $this->assertEquals('standard', PollyServiceInterface::ENGINE_STANDARD);
  }

}
