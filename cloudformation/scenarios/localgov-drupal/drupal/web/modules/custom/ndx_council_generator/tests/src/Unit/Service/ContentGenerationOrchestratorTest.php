<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Config\ImmutableConfig;
use Drupal\Core\Entity\EntityStorageInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\ndx_aws_ai\Service\BedrockServiceInterface;
use Drupal\ndx_council_generator\Service\ContentGenerationOrchestrator;
use Drupal\ndx_council_generator\Service\ContentTemplateManagerInterface;
use Drupal\ndx_council_generator\Service\GenerationStateManagerInterface;
use Drupal\ndx_council_generator\Service\ImageSpecificationCollectorInterface;
use Drupal\ndx_council_generator\Value\ContentSpecification;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Drupal\ndx_council_generator\Value\GenerationState;
use Drupal\node\NodeInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

/**
 * Tests the ContentGenerationOrchestrator service.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Service\ContentGenerationOrchestrator
 * @group ndx_council_generator
 */
class ContentGenerationOrchestratorTest extends TestCase {

  /**
   * The mocked template manager.
   */
  protected MockObject $templateManager;

  /**
   * The mocked Bedrock service.
   */
  protected MockObject $bedrockService;

  /**
   * The mocked state manager.
   */
  protected MockObject $stateManager;

  /**
   * The mocked entity type manager.
   */
  protected MockObject $entityTypeManager;

  /**
   * The mocked config factory.
   */
  protected MockObject $configFactory;

  /**
   * The mocked logger.
   */
  protected MockObject $logger;

  /**
   * The orchestrator under test.
   */
  protected ContentGenerationOrchestrator $orchestrator;

  /**
   * Test council identity.
   */
  protected CouncilIdentity $identity;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->templateManager = $this->createMock(ContentTemplateManagerInterface::class);
    $this->bedrockService = $this->createMock(BedrockServiceInterface::class);
    $this->stateManager = $this->createMock(GenerationStateManagerInterface::class);
    $this->entityTypeManager = $this->createMock(EntityTypeManagerInterface::class);
    $this->configFactory = $this->createMock(ConfigFactoryInterface::class);
    $this->logger = $this->createMock(LoggerInterface::class);

    // Configure default config mock.
    $config = $this->createMock(ImmutableConfig::class);
    $config->method('get')->willReturn(0);
    $this->configFactory->method('get')->willReturn($config);

    // Configure default state mock.
    $idleState = GenerationState::idle();
    $this->stateManager->method('getState')->willReturn($idleState);

    $this->orchestrator = new ContentGenerationOrchestrator(
      $this->templateManager,
      $this->bedrockService,
      $this->stateManager,
      $this->entityTypeManager,
      $this->configFactory,
      $this->logger
    );

    $this->identity = new CouncilIdentity(
      name: 'Test Council',
      regionKey: 'midlands',
      themeKey: 'market-town',
      populationEstimate: 100000,
      flavourKeywords: ['historic'],
      motto: 'Test motto'
    );
  }

  /**
   * Tests generateAll with successful generation.
   *
   * @covers ::generateAll
   */
  public function testGenerateAllSuccess(): void {
    // Create a mock content specification.
    $spec = ContentSpecification::fromArray([
      'id' => 'test-service',
      'content_type' => 'localgov_services_page',
      'title_template' => 'Test Service - {{council_name}}',
      'prompt' => 'Generate test content for {{council_name}}',
      'drupal_fields' => ['title' => 'title', 'body' => 'body'],
    ]);

    $this->templateManager->method('getTemplatesInOrder')
      ->willReturn([$spec]);

    // Mock Bedrock response.
    $this->bedrockService->method('generateContent')
      ->willReturn('{"title": "Generated Title", "body": "<p>Generated content</p>"}');

    // Mock node creation.
    $node = $this->createMock(NodeInterface::class);
    $node->method('id')->willReturn(123);

    $nodeStorage = $this->createMock(EntityStorageInterface::class);
    $nodeStorage->method('create')->willReturn($node);

    $this->entityTypeManager->method('getStorage')
      ->with('node')
      ->willReturn($nodeStorage);

    // Execute generation.
    $summary = $this->orchestrator->generateAll($this->identity);

    $this->assertEquals(1, $summary->totalProcessed);
    $this->assertEquals(1, $summary->successCount);
    $this->assertEquals(0, $summary->failureCount);
    $this->assertTrue($summary->isFullySuccessful());
  }

  /**
   * Tests generateAll with a failure.
   *
   * @covers ::generateAll
   */
  public function testGenerateAllWithFailure(): void {
    $spec = ContentSpecification::fromArray([
      'id' => 'failing-service',
      'content_type' => 'page',
      'title_template' => 'Test',
      'prompt' => 'Generate content',
      'drupal_fields' => ['title' => 'title'],
    ]);

    $this->templateManager->method('getTemplatesInOrder')
      ->willReturn([$spec]);

    // Mock Bedrock to throw an exception.
    $this->bedrockService->method('generateContent')
      ->willThrowException(new \RuntimeException('API error'));

    $summary = $this->orchestrator->generateAll($this->identity);

    $this->assertEquals(1, $summary->totalProcessed);
    $this->assertEquals(0, $summary->successCount);
    $this->assertEquals(1, $summary->failureCount);
    $this->assertTrue($summary->hasFailures());
    $this->assertEquals(['failing-service'], $summary->failedSpecIds);
  }

  /**
   * Tests generateSingle returns success result.
   *
   * @covers ::generateSingle
   */
  public function testGenerateSingleSuccess(): void {
    $spec = ContentSpecification::fromArray([
      'id' => 'single-test',
      'content_type' => 'page',
      'title_template' => 'Single Test',
      'prompt' => 'Generate single',
      'drupal_fields' => ['title' => 'title', 'body' => 'body'],
    ]);

    $this->bedrockService->method('generateContent')
      ->willReturn('{"title": "Test", "body": "<p>Content</p>"}');

    $node = $this->createMock(NodeInterface::class);
    $node->method('id')->willReturn(456);

    $nodeStorage = $this->createMock(EntityStorageInterface::class);
    $nodeStorage->method('create')->willReturn($node);

    $this->entityTypeManager->method('getStorage')
      ->with('node')
      ->willReturn($nodeStorage);

    $result = $this->orchestrator->generateSingle($spec, $this->identity);

    $this->assertTrue($result->success);
    $this->assertEquals('single-test', $result->specId);
    $this->assertEquals(456, $result->nodeId);
    $this->assertNull($result->error);
  }

  /**
   * Tests generateSingle returns failure result on error.
   *
   * @covers ::generateSingle
   */
  public function testGenerateSingleFailure(): void {
    $spec = ContentSpecification::fromArray([
      'id' => 'failing-single',
      'content_type' => 'page',
      'title_template' => 'Test',
      'prompt' => 'Generate',
      'drupal_fields' => [],
    ]);

    $this->bedrockService->method('generateContent')
      ->willThrowException(new \RuntimeException('Connection failed'));

    $result = $this->orchestrator->generateSingle($spec, $this->identity);

    $this->assertFalse($result->success);
    $this->assertEquals('failing-single', $result->specId);
    $this->assertNull($result->nodeId);
    $this->assertEquals('Connection failed', $result->error);
  }

  /**
   * Tests progress callback is invoked.
   *
   * @covers ::generateAll
   */
  public function testProgressCallbackInvoked(): void {
    $spec1 = ContentSpecification::fromArray([
      'id' => 'spec-1',
      'content_type' => 'page',
      'title_template' => 'Test 1',
      'prompt' => 'Generate 1',
      'drupal_fields' => ['title' => 'title'],
    ]);

    $spec2 = ContentSpecification::fromArray([
      'id' => 'spec-2',
      'content_type' => 'page',
      'title_template' => 'Test 2',
      'prompt' => 'Generate 2',
      'drupal_fields' => ['title' => 'title'],
    ]);

    $this->templateManager->method('getTemplatesInOrder')
      ->willReturn([$spec1, $spec2]);

    $this->bedrockService->method('generateContent')
      ->willReturn('{"title": "Test"}');

    $node = $this->createMock(NodeInterface::class);
    $node->method('id')->willReturn(1);

    $nodeStorage = $this->createMock(EntityStorageInterface::class);
    $nodeStorage->method('create')->willReturn($node);

    $this->entityTypeManager->method('getStorage')
      ->willReturn($nodeStorage);

    $callbackInvocations = 0;
    $callback = function ($progress) use (&$callbackInvocations) {
      $callbackInvocations++;
    };

    $this->orchestrator->generateAll($this->identity, $callback);

    $this->assertEquals(2, $callbackInvocations);
  }

  /**
   * Tests isGenerating returns correct state.
   *
   * @covers ::isGenerating
   * @covers ::getProgress
   */
  public function testIsGenerating(): void {
    // Initially not generating.
    $this->assertFalse($this->orchestrator->isGenerating());
    $this->assertNull($this->orchestrator->getProgress());
  }

  /**
   * Tests getFailedSpecIds returns empty initially.
   *
   * @covers ::getFailedSpecIds
   */
  public function testGetFailedSpecIdsEmpty(): void {
    $failedIds = $this->orchestrator->getFailedSpecIds();
    $this->assertIsArray($failedIds);
    $this->assertEmpty($failedIds);
  }

  /**
   * Tests retryFailed with no failed items.
   *
   * @covers ::retryFailed
   */
  public function testRetryFailedNoItems(): void {
    $summary = $this->orchestrator->retryFailed($this->identity);

    $this->assertEquals(0, $summary->totalProcessed);
    $this->assertTrue($summary->isFullySuccessful());
  }

  /**
   * Tests JSON parsing handles wrapped responses.
   *
   * @covers ::generateSingle
   */
  public function testJsonParsingWithExtraText(): void {
    $spec = ContentSpecification::fromArray([
      'id' => 'json-test',
      'content_type' => 'page',
      'title_template' => 'Test',
      'prompt' => 'Generate',
      'drupal_fields' => ['title' => 'title'],
    ]);

    // Bedrock sometimes wraps JSON with explanation text.
    $this->bedrockService->method('generateContent')
      ->willReturn('Here is the content: {"title": "Wrapped JSON"} I hope this helps!');

    $node = $this->createMock(NodeInterface::class);
    $node->method('id')->willReturn(789);

    $nodeStorage = $this->createMock(EntityStorageInterface::class);
    $nodeStorage->method('create')->willReturn($node);

    $this->entityTypeManager->method('getStorage')
      ->willReturn($nodeStorage);

    $result = $this->orchestrator->generateSingle($spec, $this->identity);

    $this->assertTrue($result->success);
    $this->assertEquals(789, $result->nodeId);
  }

  /**
   * Tests generation with multiple content types.
   *
   * @covers ::generateAll
   */
  public function testGenerateAllMultipleTypes(): void {
    $specs = [
      ContentSpecification::fromArray([
        'id' => 'service-page',
        'content_type' => 'localgov_services_page',
        'title_template' => 'Service',
        'prompt' => 'Generate service',
        'drupal_fields' => ['title' => 'title'],
      ]),
      ContentSpecification::fromArray([
        'id' => 'news-article',
        'content_type' => 'localgov_news_article',
        'title_template' => 'News',
        'prompt' => 'Generate news',
        'drupal_fields' => ['title' => 'title'],
      ]),
      ContentSpecification::fromArray([
        'id' => 'directory-entry',
        'content_type' => 'localgov_directory',
        'title_template' => 'Directory',
        'prompt' => 'Generate directory',
        'drupal_fields' => ['title' => 'title'],
      ]),
    ];

    $this->templateManager->method('getTemplatesInOrder')
      ->willReturn($specs);

    $this->bedrockService->method('generateContent')
      ->willReturn('{"title": "Test"}');

    $node = $this->createMock(NodeInterface::class);
    $node->method('id')->willReturn(1);

    $nodeStorage = $this->createMock(EntityStorageInterface::class);
    $nodeStorage->method('create')->willReturn($node);

    $this->entityTypeManager->method('getStorage')
      ->willReturn($nodeStorage);

    $summary = $this->orchestrator->generateAll($this->identity);

    $this->assertEquals(3, $summary->totalProcessed);
    $this->assertEquals(3, $summary->successCount);
  }

  /**
   * Tests image collector integration.
   *
   * @covers ::generateSingle
   */
  public function testImageCollectorIntegration(): void {
    $spec = ContentSpecification::fromArray([
      'id' => 'service-with-image',
      'content_type' => 'page',
      'title_template' => 'Test',
      'prompt' => 'Generate',
      'drupal_fields' => ['title' => 'title'],
      'images' => [
        [
          'type' => 'hero',
          'prompt' => 'A scenic view',
          'dimensions' => '1200x630',
          'style' => 'photo',
        ],
      ],
    ]);

    $this->templateManager->method('getTemplatesInOrder')
      ->willReturn([$spec]);

    $this->bedrockService->method('generateContent')
      ->willReturn('{"title": "Test"}');

    $node = $this->createMock(NodeInterface::class);
    $node->method('id')->willReturn(123);

    $nodeStorage = $this->createMock(EntityStorageInterface::class);
    $nodeStorage->method('create')->willReturn($node);

    $this->entityTypeManager->method('getStorage')
      ->willReturn($nodeStorage);

    // Create image collector mock.
    $imageCollector = $this->createMock(ImageSpecificationCollectorInterface::class);

    // Expect collectFromContent to be called.
    $imageCollector->expects($this->once())
      ->method('collectFromContent')
      ->with(
        $this->isInstanceOf(ContentSpecification::class),
        $this->equalTo(123),
        $this->isInstanceOf(CouncilIdentity::class)
      );

    // Create orchestrator with image collector.
    $orchestratorWithCollector = new ContentGenerationOrchestrator(
      $this->templateManager,
      $this->bedrockService,
      $this->stateManager,
      $this->entityTypeManager,
      $this->configFactory,
      $this->logger,
      $imageCollector
    );

    $summary = $orchestratorWithCollector->generateAll($this->identity);

    $this->assertEquals(1, $summary->successCount);
  }

  /**
   * Tests that image collector is not called for specs without images.
   *
   * @covers ::generateSingle
   */
  public function testImageCollectorNotCalledForNoImages(): void {
    $spec = ContentSpecification::fromArray([
      'id' => 'no-images',
      'content_type' => 'page',
      'title_template' => 'Test',
      'prompt' => 'Generate',
      'drupal_fields' => ['title' => 'title'],
      'images' => [],
    ]);

    $this->templateManager->method('getTemplatesInOrder')
      ->willReturn([$spec]);

    $this->bedrockService->method('generateContent')
      ->willReturn('{"title": "Test"}');

    $node = $this->createMock(NodeInterface::class);
    $node->method('id')->willReturn(123);

    $nodeStorage = $this->createMock(EntityStorageInterface::class);
    $nodeStorage->method('create')->willReturn($node);

    $this->entityTypeManager->method('getStorage')
      ->willReturn($nodeStorage);

    // Create image collector mock.
    $imageCollector = $this->createMock(ImageSpecificationCollectorInterface::class);

    // Expect collectFromContent to NOT be called.
    $imageCollector->expects($this->never())
      ->method('collectFromContent');

    // Create orchestrator with image collector.
    $orchestratorWithCollector = new ContentGenerationOrchestrator(
      $this->templateManager,
      $this->bedrockService,
      $this->stateManager,
      $this->entityTypeManager,
      $this->configFactory,
      $this->logger,
      $imageCollector
    );

    $orchestratorWithCollector->generateAll($this->identity);
  }

}
