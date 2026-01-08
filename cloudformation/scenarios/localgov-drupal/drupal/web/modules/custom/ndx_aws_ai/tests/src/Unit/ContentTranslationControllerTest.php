<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_aws_ai\Unit;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\Core\StringTranslation\TranslationInterface;
use Drupal\ndx_aws_ai\Controller\ContentTranslationController;
use Drupal\ndx_aws_ai\Result\TranslationResult;
use Drupal\ndx_aws_ai\Service\TranslateServiceInterface;
use PHPUnit\Framework\TestCase;
use Prophecy\Argument;
use Prophecy\PhpUnit\ProphecyTrait;
use Symfony\Component\HttpFoundation\Request;

/**
 * Unit tests for ContentTranslationController.
 *
 * @coversDefaultClass \Drupal\ndx_aws_ai\Controller\ContentTranslationController
 * @group ndx_aws_ai
 *
 * Story 4.7: Content Translation
 */
class ContentTranslationControllerTest extends TestCase {

  use ProphecyTrait;

  /**
   * The mocked Translate service.
   *
   * @var \Drupal\ndx_aws_ai\Service\TranslateServiceInterface|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $translateService;

  /**
   * The mocked cache backend.
   *
   * @var \Drupal\Core\Cache\CacheBackendInterface|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $cache;

  /**
   * The mocked logger.
   *
   * @var \Drupal\Core\Logger\LoggerChannelInterface|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $logger;

  /**
   * The controller under test.
   *
   * @var \Drupal\ndx_aws_ai\Controller\ContentTranslationController
   */
  protected ContentTranslationController $controller;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->translateService = $this->prophesize(TranslateServiceInterface::class);
    $this->cache = $this->prophesize(CacheBackendInterface::class);
    $this->logger = $this->prophesize(LoggerChannelInterface::class);

    // Set up default logger behavior.
    $this->logger->debug(Argument::any(), Argument::any())->willReturn(NULL);
    $this->logger->info(Argument::any(), Argument::any())->willReturn(NULL);
    $this->logger->error(Argument::any(), Argument::any())->willReturn(NULL);

    // Set up default supported languages.
    $this->translateService->getSupportedLanguages()->willReturn([
      'en' => 'English',
      'cy' => 'Welsh',
      'fr' => 'French',
      'es' => 'Spanish',
      'pl' => 'Polish',
    ]);

    $this->translateService->getPriorityLanguages()->willReturn([
      'en' => 'English',
      'cy' => 'Welsh',
    ]);

    $this->controller = new ContentTranslationController(
      $this->translateService->reveal(),
      $this->cache->reveal(),
      $this->logger->reveal(),
    );

    // Set up string translation.
    $translation = $this->prophesize(TranslationInterface::class);
    $translation->translateString(Argument::any())->will(function ($args) {
      return $args[0];
    });

    $container = new \Symfony\Component\DependencyInjection\ContainerBuilder();
    $container->set('string_translation', $translation->reveal());
    \Drupal::setContainer($container);
  }

  /**
   * Test successful translation.
   *
   * @covers ::translate
   */
  public function testTranslateSuccess(): void {
    $html = '<p>Hello world</p>';
    $targetLanguage = 'fr';

    // Cache miss.
    $this->cache->get(Argument::any())->willReturn(FALSE);

    // Mock translation result.
    $translationResult = $this->prophesize(TranslationResult::class);
    $translationResult->getTranslatedText()->willReturn('<p>Bonjour le monde</p>');
    $translationResult->getSourceLanguage()->willReturn('en');

    $this->translateService->translateHtml($html, $targetLanguage, 'auto')
      ->willReturn($translationResult->reveal());

    // Expect cache set.
    $this->cache->set(Argument::any(), Argument::any(), Argument::any())->shouldBeCalled();

    $request = Request::create('/api/ndx-ai/translation/translate', 'POST', [], [], [], [], json_encode([
      'html' => $html,
      'targetLanguage' => $targetLanguage,
    ]));

    $response = $this->controller->translate($request);

    $this->assertEquals(200, $response->getStatusCode());

    $data = json_decode($response->getContent(), TRUE);
    $this->assertTrue($data['success']);
    $this->assertEquals('<p>Bonjour le monde</p>', $data['translatedHtml']);
    $this->assertEquals('French', $data['languageName']);
    $this->assertEquals('en', $data['sourceLanguage']);
    $this->assertFalse($data['cached']);
  }

  /**
   * Test translation cache hit.
   *
   * @covers ::translate
   */
  public function testTranslateCacheHit(): void {
    $html = '<p>Hello world</p>';
    $targetLanguage = 'fr';

    // Cache hit.
    $cachedData = (object) [
      'data' => [
        'html' => '<p>Bonjour le monde</p>',
        'languageName' => 'French',
        'sourceLanguage' => 'en',
      ],
    ];
    $this->cache->get(Argument::any())->willReturn($cachedData);

    // Translation service should not be called.
    $this->translateService->translateHtml(Argument::any(), Argument::any(), Argument::any())
      ->shouldNotBeCalled();

    $request = Request::create('/api/ndx-ai/translation/translate', 'POST', [], [], [], [], json_encode([
      'html' => $html,
      'targetLanguage' => $targetLanguage,
    ]));

    $response = $this->controller->translate($request);

    $this->assertEquals(200, $response->getStatusCode());

    $data = json_decode($response->getContent(), TRUE);
    $this->assertTrue($data['success']);
    $this->assertTrue($data['cached']);
  }

  /**
   * Test translation with missing HTML.
   *
   * @covers ::translate
   */
  public function testTranslateMissingHtml(): void {
    $request = Request::create('/api/ndx-ai/translation/translate', 'POST', [], [], [], [], json_encode([
      'targetLanguage' => 'fr',
    ]));

    $response = $this->controller->translate($request);

    $this->assertEquals(400, $response->getStatusCode());

    $data = json_decode($response->getContent(), TRUE);
    $this->assertFalse($data['success']);
    $this->assertNotEmpty($data['error']);
  }

  /**
   * Test translation with missing target language.
   *
   * @covers ::translate
   */
  public function testTranslateMissingTargetLanguage(): void {
    $request = Request::create('/api/ndx-ai/translation/translate', 'POST', [], [], [], [], json_encode([
      'html' => '<p>Hello world</p>',
    ]));

    $response = $this->controller->translate($request);

    $this->assertEquals(400, $response->getStatusCode());

    $data = json_decode($response->getContent(), TRUE);
    $this->assertFalse($data['success']);
    $this->assertNotEmpty($data['error']);
  }

  /**
   * Test translation with unsupported language.
   *
   * @covers ::translate
   */
  public function testTranslateUnsupportedLanguage(): void {
    $request = Request::create('/api/ndx-ai/translation/translate', 'POST', [], [], [], [], json_encode([
      'html' => '<p>Hello world</p>',
      'targetLanguage' => 'xx', // Invalid language code.
    ]));

    $response = $this->controller->translate($request);

    $this->assertEquals(400, $response->getStatusCode());

    $data = json_decode($response->getContent(), TRUE);
    $this->assertFalse($data['success']);
    $this->assertStringContainsString('Unsupported', $data['error']);
  }

  /**
   * Test translation with content too large.
   *
   * @covers ::translate
   */
  public function testTranslateContentTooLarge(): void {
    // Create content larger than 512KB.
    $largeHtml = str_repeat('<p>Hello world</p>', 50000);

    $request = Request::create('/api/ndx-ai/translation/translate', 'POST', [], [], [], [], json_encode([
      'html' => $largeHtml,
      'targetLanguage' => 'fr',
    ]));

    $response = $this->controller->translate($request);

    $this->assertEquals(413, $response->getStatusCode());

    $data = json_decode($response->getContent(), TRUE);
    $this->assertFalse($data['success']);
    $this->assertStringContainsString('too large', $data['error']);
  }

  /**
   * Test getLanguages endpoint.
   *
   * @covers ::getLanguages
   */
  public function testGetLanguages(): void {
    $response = $this->controller->getLanguages();

    $this->assertEquals(200, $response->getStatusCode());

    $data = json_decode($response->getContent(), TRUE);
    $this->assertArrayHasKey('priority', $data);
    $this->assertArrayHasKey('all', $data);
    $this->assertArrayHasKey('en', $data['priority']);
    $this->assertArrayHasKey('cy', $data['priority']);
    $this->assertArrayHasKey('fr', $data['all']);
  }

}
