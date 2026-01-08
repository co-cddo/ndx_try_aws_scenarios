<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Config\ImmutableConfig;
use Drupal\ndx_aws_ai\Result\ImageGenerationResult;
use Drupal\ndx_aws_ai\Service\ImageGenerationServiceInterface;
use Drupal\ndx_council_generator\Service\GenerationStateManagerInterface;
use Drupal\ndx_council_generator\Service\ImageBatchProcessor;
use Drupal\ndx_council_generator\Service\ImageSpecificationCollectorInterface;
use Drupal\ndx_council_generator\Service\MediaCreatorInterface;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Drupal\ndx_council_generator\Value\ImageQueue;
use Drupal\ndx_council_generator\Value\ImageQueueItem;
use Drupal\ndx_council_generator\Value\ImageSpec;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

/**
 * Tests for ImageBatchProcessor service.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Service\ImageBatchProcessor
 * @group ndx_council_generator
 */
class ImageBatchProcessorTest extends TestCase {

  /**
   * Mock image generation service.
   */
  protected ImageGenerationServiceInterface $imageGenerationService;

  /**
   * Mock image collector.
   */
  protected ImageSpecificationCollectorInterface $imageCollector;

  /**
   * Mock media creator.
   */
  protected MediaCreatorInterface $mediaCreator;

  /**
   * Mock state manager.
   */
  protected GenerationStateManagerInterface $stateManager;

  /**
   * Mock config factory.
   */
  protected ConfigFactoryInterface $configFactory;

  /**
   * Mock logger.
   */
  protected LoggerInterface $logger;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->imageGenerationService = $this->createMock(ImageGenerationServiceInterface::class);
    $this->imageCollector = $this->createMock(ImageSpecificationCollectorInterface::class);
    $this->mediaCreator = $this->createMock(MediaCreatorInterface::class);
    $this->stateManager = $this->createMock(GenerationStateManagerInterface::class);
    $this->configFactory = $this->createMock(ConfigFactoryInterface::class);
    $this->logger = $this->createMock(LoggerInterface::class);

    // Default config with no rate limit delay for tests.
    $config = $this->createMock(ImmutableConfig::class);
    $config->method('get')
      ->with('image_rate_limit_delay_ms')
      ->willReturn(0);
    $this->configFactory->method('get')
      ->with('ndx_council_generator.settings')
      ->willReturn($config);
  }

  /**
   * Creates a processor instance with mocked dependencies.
   */
  protected function createProcessor(): ImageBatchProcessor {
    return new ImageBatchProcessor(
      $this->imageGenerationService,
      $this->imageCollector,
      $this->mediaCreator,
      $this->stateManager,
      $this->configFactory,
      $this->logger,
    );
  }

  /**
   * Creates a test council identity.
   */
  protected function createIdentity(): CouncilIdentity {
    return new CouncilIdentity(
      name: 'Test Council',
      region: 'South West',
      population: 150000,
      councilType: 'district',
      characteristics: ['coastal', 'tourist'],
      primaryServices: ['waste', 'planning'],
    );
  }

  /**
   * Tests processQueue with empty queue.
   *
   * @covers ::processQueue
   */
  public function testProcessQueueEmpty(): void {
    $this->imageCollector
      ->expects($this->once())
      ->method('getPendingIds')
      ->willReturn([]);

    $processor = $this->createProcessor();
    $identity = $this->createIdentity();

    $result = $processor->processQueue($identity);

    $this->assertEquals(0, $result->totalProcessed);
    $this->assertTrue($result->isFullySuccessful());
  }

  /**
   * Tests processQueue with single item success.
   *
   * @covers ::processQueue
   */
  public function testProcessQueueSingleSuccess(): void {
    $imageSpec = new ImageSpec(
      promptTemplate: 'A test image for {{council_name}}',
      dimensions: '1024x1024',
      style: 'photo',
    );

    $queueItem = new ImageQueueItem(
      id: 'item-1',
      imageSpec: $imageSpec,
      contentSpecId: 'test-spec',
      nodeId: 123,
      fieldName: 'field_image',
    );

    $queue = ImageQueue::create()->addItem($queueItem);

    $this->imageCollector
      ->method('getPendingIds')
      ->willReturn(['item-1']);

    $this->imageCollector
      ->method('getQueue')
      ->willReturn($queue);

    $this->imageGenerationService
      ->expects($this->once())
      ->method('generateImage')
      ->willReturn(ImageGenerationResult::fromSuccess(
        imageData: 'fake-image-data',
        mimeType: 'image/png',
        processingTimeMs: 1000.0,
      ));

    $this->mediaCreator
      ->expects($this->once())
      ->method('createFromImage')
      ->willReturn(456);

    $this->mediaCreator
      ->expects($this->once())
      ->method('updateNodeField')
      ->with(123, 'field_image', 456);

    $this->imageCollector
      ->expects($this->once())
      ->method('markProcessed')
      ->with('item-1', 456);

    $processor = $this->createProcessor();
    $identity = $this->createIdentity();

    $result = $processor->processQueue($identity);

    $this->assertEquals(1, $result->totalProcessed);
    $this->assertEquals(1, $result->successCount);
    $this->assertEquals(0, $result->failureCount);
    $this->assertContains(456, $result->mediaIds);
  }

  /**
   * Tests processQueue with failure.
   *
   * @covers ::processQueue
   */
  public function testProcessQueueWithFailure(): void {
    $imageSpec = new ImageSpec(
      promptTemplate: 'A test image',
      dimensions: '1024x1024',
      style: 'photo',
    );

    $queueItem = new ImageQueueItem(
      id: 'item-1',
      imageSpec: $imageSpec,
      contentSpecId: 'test-spec',
    );

    $queue = ImageQueue::create()->addItem($queueItem);

    $this->imageCollector
      ->method('getPendingIds')
      ->willReturn(['item-1']);

    $this->imageCollector
      ->method('getQueue')
      ->willReturn($queue);

    $this->imageGenerationService
      ->expects($this->once())
      ->method('generateImage')
      ->willReturn(ImageGenerationResult::fromFailure('API error'));

    $this->imageCollector
      ->expects($this->once())
      ->method('markFailed')
      ->with('item-1', 'API error');

    $processor = $this->createProcessor();
    $identity = $this->createIdentity();

    $result = $processor->processQueue($identity);

    $this->assertEquals(1, $result->totalProcessed);
    $this->assertEquals(0, $result->successCount);
    $this->assertEquals(1, $result->failureCount);
    $this->assertContains('item-1', $result->failedItemIds);
  }

  /**
   * Tests isProcessing before and after processing.
   *
   * @covers ::isProcessing
   * @covers ::getProgress
   */
  public function testIsProcessing(): void {
    $processor = $this->createProcessor();

    // Should not be processing initially.
    $this->assertFalse($processor->isProcessing());
    $this->assertNull($processor->getProgress());
  }

  /**
   * Tests progress callback is called.
   *
   * @covers ::processQueue
   */
  public function testProgressCallback(): void {
    $imageSpec = new ImageSpec(
      promptTemplate: 'Test',
      dimensions: '1024x1024',
      style: 'photo',
    );

    $queueItem = new ImageQueueItem(
      id: 'item-1',
      imageSpec: $imageSpec,
      contentSpecId: 'test-spec',
    );

    $queue = ImageQueue::create()->addItem($queueItem);

    $this->imageCollector
      ->method('getPendingIds')
      ->willReturn(['item-1']);

    $this->imageCollector
      ->method('getQueue')
      ->willReturn($queue);

    $this->imageGenerationService
      ->method('generateImage')
      ->willReturn(ImageGenerationResult::fromSuccess('data', 'image/png', 100.0));

    $this->mediaCreator
      ->method('createFromImage')
      ->willReturn(1);

    $callbackCalled = FALSE;
    $callback = function ($progress) use (&$callbackCalled): void {
      $callbackCalled = TRUE;
      $this->assertNotNull($progress);
    };

    $processor = $this->createProcessor();
    $processor->processQueue($this->createIdentity(), $callback);

    $this->assertTrue($callbackCalled);
  }

  /**
   * Tests processItem with missing queue item.
   *
   * @covers ::processItem
   */
  public function testProcessItemMissing(): void {
    $queue = ImageQueue::create();

    $this->imageCollector
      ->method('getQueue')
      ->willReturn($queue);

    $processor = $this->createProcessor();
    $result = $processor->processItem('non-existent', $this->createIdentity());

    $this->assertFalse($result->success);
    $this->assertEquals('Queue item not found', $result->error);
  }

}
