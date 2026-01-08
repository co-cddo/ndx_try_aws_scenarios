<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit\Service;

use Drupal\Core\State\StateInterface;
use Drupal\ndx_council_generator\Service\ImageSpecificationCollector;
use Drupal\ndx_council_generator\Value\ContentSpecification;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Drupal\ndx_council_generator\Value\ImageQueueItem;
use Drupal\ndx_council_generator\Value\ImageSpecification;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

/**
 * Tests the ImageSpecificationCollector service.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Service\ImageSpecificationCollector
 * @group ndx_council_generator
 */
class ImageSpecificationCollectorTest extends TestCase {

  /**
   * The mocked state service.
   */
  protected MockObject $state;

  /**
   * The mocked logger.
   */
  protected MockObject $logger;

  /**
   * The collector under test.
   */
  protected ImageSpecificationCollector $collector;

  /**
   * Test council identity.
   */
  protected CouncilIdentity $identity;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->state = $this->createMock(StateInterface::class);
    $this->logger = $this->createMock(LoggerInterface::class);

    // Default state returns empty queue.
    $this->state->method('get')->willReturn(NULL);

    $this->collector = new ImageSpecificationCollector(
      $this->state,
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
   * Creates a content specification with images.
   */
  protected function createSpecWithImages(string $id, array $images): ContentSpecification {
    return ContentSpecification::fromArray([
      'id' => $id,
      'content_type' => 'localgov_services_page',
      'title_template' => 'Test - {{council_name}}',
      'prompt' => 'Generate content',
      'images' => $images,
      'drupal_fields' => ['title' => 'title'],
    ]);
  }

  /**
   * Tests collectFromContent with single image.
   *
   * @covers ::collectFromContent
   * @covers ::getQueue
   */
  public function testCollectFromContentSingleImage(): void {
    $spec = $this->createSpecWithImages('test-service', [
      [
        'type' => 'hero',
        'prompt' => 'A view of {{council_name}}',
        'dimensions' => '1200x630',
        'style' => 'photo',
        'field_name' => 'field_hero_image',
      ],
    ]);

    // Expect state to be set with queue data.
    $this->state->expects($this->once())
      ->method('set')
      ->with('ndx_council_generator.image_queue', $this->isType('array'));

    $this->collector->collectFromContent($spec, 42, $this->identity);

    $queue = $this->collector->getQueue();
    $this->assertEquals(1, $queue->getCount());
    $this->assertEquals(0, $queue->getDuplicateCount());
  }

  /**
   * Tests collectFromContent with no images.
   *
   * @covers ::collectFromContent
   */
  public function testCollectFromContentNoImages(): void {
    $spec = $this->createSpecWithImages('no-images', []);

    // State should not be called since there are no images.
    $this->state->expects($this->never())
      ->method('set');

    $this->collector->collectFromContent($spec, 42, $this->identity);

    $queue = $this->collector->getQueue();
    $this->assertTrue($queue->isEmpty());
  }

  /**
   * Tests clearQueue method.
   *
   * @covers ::clearQueue
   */
  public function testClearQueue(): void {
    $spec = $this->createSpecWithImages('test-service', [
      [
        'type' => 'hero',
        'prompt' => 'A view',
        'dimensions' => '1200x630',
        'style' => 'photo',
      ],
    ]);

    // First add an item.
    $this->collector->collectFromContent($spec, 42, $this->identity);

    // Now clear.
    $this->state->expects($this->once())
      ->method('delete')
      ->with('ndx_council_generator.image_queue');

    $this->collector->clearQueue();

    $queue = $this->collector->getQueue();
    $this->assertTrue($queue->isEmpty());
  }

  /**
   * Tests getStatistics method.
   *
   * @covers ::getStatistics
   */
  public function testGetStatistics(): void {
    $spec = $this->createSpecWithImages('test-service', [
      [
        'type' => 'hero',
        'prompt' => 'Hero image',
        'dimensions' => '1200x630',
        'style' => 'photo',
      ],
      [
        'type' => 'location',
        'prompt' => 'Location image',
        'dimensions' => '800x600',
        'style' => 'photo',
      ],
    ]);

    $this->collector->collectFromContent($spec, 42, $this->identity);

    $stats = $this->collector->getStatistics();

    $this->assertEquals(2, $stats->totalCount);
    $this->assertEquals(2, $stats->pendingCount);
    $this->assertEquals(0, $stats->completedCount);
    $this->assertEquals(0, $stats->failedCount);
    $this->assertFalse($stats->isComplete());
  }

  /**
   * Tests getPendingIds method.
   *
   * @covers ::getPendingIds
   */
  public function testGetPendingIds(): void {
    $spec = $this->createSpecWithImages('test-service', [
      [
        'type' => 'hero',
        'prompt' => 'Hero image',
        'dimensions' => '1200x630',
        'style' => 'photo',
      ],
    ]);

    $this->collector->collectFromContent($spec, 42, $this->identity);

    $pendingIds = $this->collector->getPendingIds();

    $this->assertCount(1, $pendingIds);
    $this->assertIsString($pendingIds[0]);
  }

  /**
   * Tests deduplication of identical images.
   *
   * @covers ::collectFromContent
   */
  public function testDeduplication(): void {
    // Same prompt should result in same hash.
    $spec1 = $this->createSpecWithImages('service-1', [
      [
        'type' => 'hero',
        'prompt' => 'Generic council view',
        'dimensions' => '1200x630',
        'style' => 'photo',
      ],
    ]);

    $spec2 = $this->createSpecWithImages('service-2', [
      [
        'type' => 'hero',
        'prompt' => 'Generic council view',
        'dimensions' => '1200x630',
        'style' => 'photo',
      ],
    ]);

    $this->collector->collectFromContent($spec1, 1, $this->identity);
    $this->collector->collectFromContent($spec2, 2, $this->identity);

    $queue = $this->collector->getQueue();

    // Should have 1 unique item since both are identical.
    $this->assertEquals(1, $queue->getCount());
  }

  /**
   * Tests markProcessed method.
   *
   * @covers ::markProcessed
   * @covers ::getMediaId
   */
  public function testMarkProcessed(): void {
    $spec = $this->createSpecWithImages('test-service', [
      [
        'type' => 'hero',
        'prompt' => 'Hero image',
        'dimensions' => '1200x630',
        'style' => 'photo',
      ],
    ]);

    $this->collector->collectFromContent($spec, 42, $this->identity);

    $pendingIds = $this->collector->getPendingIds();
    $itemId = $pendingIds[0];

    $this->collector->markProcessed($itemId, 999);

    $queue = $this->collector->getQueue();
    $item = $queue->getItem($itemId);

    $this->assertTrue($item->isComplete());
    $this->assertEquals(999, $item->mediaId);
    $this->assertEquals(999, $this->collector->getMediaId($itemId));
  }

  /**
   * Tests markFailed method.
   *
   * @covers ::markFailed
   */
  public function testMarkFailed(): void {
    $spec = $this->createSpecWithImages('test-service', [
      [
        'type' => 'hero',
        'prompt' => 'Hero image',
        'dimensions' => '1200x630',
        'style' => 'photo',
      ],
    ]);

    $this->collector->collectFromContent($spec, 42, $this->identity);

    $pendingIds = $this->collector->getPendingIds();
    $itemId = $pendingIds[0];

    $this->collector->markFailed($itemId, 'API Error');

    $queue = $this->collector->getQueue();
    $item = $queue->getItem($itemId);

    $this->assertTrue($item->isFailed());
    $this->assertEquals('API Error', $item->error);
  }

  /**
   * Tests markProcessed with non-existent item.
   *
   * @covers ::markProcessed
   */
  public function testMarkProcessedNonExistent(): void {
    $this->logger->expects($this->once())
      ->method('warning')
      ->with(
        $this->stringContains('Cannot mark processed'),
        $this->anything()
      );

    $this->collector->markProcessed('non-existent-id', 999);
  }

  /**
   * Tests markFailed with non-existent item.
   *
   * @covers ::markFailed
   */
  public function testMarkFailedNonExistent(): void {
    $this->logger->expects($this->once())
      ->method('warning')
      ->with(
        $this->stringContains('Cannot mark failed'),
        $this->anything()
      );

    $this->collector->markFailed('non-existent-id', 'Error');
  }

  /**
   * Tests getMediaId returns null for pending item.
   *
   * @covers ::getMediaId
   */
  public function testGetMediaIdPending(): void {
    $spec = $this->createSpecWithImages('test-service', [
      [
        'type' => 'hero',
        'prompt' => 'Hero image',
        'dimensions' => '1200x630',
        'style' => 'photo',
      ],
    ]);

    $this->collector->collectFromContent($spec, 42, $this->identity);

    $pendingIds = $this->collector->getPendingIds();
    $itemId = $pendingIds[0];

    $this->assertNull($this->collector->getMediaId($itemId));
  }

  /**
   * Tests getMediaId returns null for non-existent item.
   *
   * @covers ::getMediaId
   */
  public function testGetMediaIdNonExistent(): void {
    $this->assertNull($this->collector->getMediaId('non-existent'));
  }

  /**
   * Tests queue persistence via state.
   *
   * @covers ::collectFromContent
   */
  public function testQueuePersistence(): void {
    $spec = $this->createSpecWithImages('test-service', [
      [
        'type' => 'hero',
        'prompt' => 'Hero image',
        'dimensions' => '1200x630',
        'style' => 'photo',
      ],
    ]);

    $savedData = NULL;
    $this->state->expects($this->atLeastOnce())
      ->method('set')
      ->willReturnCallback(function ($key, $data) use (&$savedData) {
        $savedData = $data;
      });

    $this->collector->collectFromContent($spec, 42, $this->identity);

    $this->assertNotNull($savedData);
    $this->assertArrayHasKey('items', $savedData);
    $this->assertArrayHasKey('duplicates', $savedData);
    $this->assertArrayHasKey('created_at', $savedData);
    $this->assertArrayHasKey('last_updated', $savedData);
  }

  /**
   * Tests loading from existing state.
   *
   * @covers ::getQueue
   */
  public function testLoadFromExistingState(): void {
    $existingData = [
      'items' => [
        'hash-123' => [
          'id' => 'hash-123',
          'content_spec_id' => 'old-service',
          'image_spec' => [
            'type' => 'hero',
            'prompt' => 'Old prompt',
            'dimensions' => '1200x630',
            'style' => 'photo',
          ],
          'node_id' => 10,
          'field_name' => 'field_hero_image',
          'status' => ImageQueueItem::STATUS_COMPLETE,
          'created_at' => 1735000000,
          'processed_at' => 1735000100,
          'media_id' => 555,
          'error' => NULL,
        ],
      ],
      'duplicates' => [],
      'created_at' => 1735000000,
      'last_updated' => 1735000100,
    ];

    // Reset collector with state that returns existing data.
    $state = $this->createMock(StateInterface::class);
    $state->method('get')
      ->with('ndx_council_generator.image_queue')
      ->willReturn($existingData);

    $collector = new ImageSpecificationCollector($state, $this->logger);

    $queue = $collector->getQueue();

    $this->assertEquals(1, $queue->getCount());
    $this->assertTrue($queue->hasItem('hash-123'));

    $item = $queue->getItem('hash-123');
    $this->assertTrue($item->isComplete());
    $this->assertEquals(555, $item->mediaId);
  }

}
