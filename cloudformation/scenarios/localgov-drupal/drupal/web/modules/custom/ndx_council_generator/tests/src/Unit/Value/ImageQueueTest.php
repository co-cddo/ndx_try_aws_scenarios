<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit\Value;

use Drupal\ndx_council_generator\Value\ImageQueue;
use Drupal\ndx_council_generator\Value\ImageQueueItem;
use Drupal\ndx_council_generator\Value\ImageSpecification;
use PHPUnit\Framework\TestCase;

/**
 * Tests the ImageQueue value object.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Value\ImageQueue
 * @group ndx_council_generator
 */
class ImageQueueTest extends TestCase {

  /**
   * Creates a test ImageQueueItem.
   */
  protected function createTestItem(string $id, string $status = ImageQueueItem::STATUS_PENDING): ImageQueueItem {
    $imageSpec = ImageSpecification::fromArray([
      'type' => 'hero',
      'prompt' => 'Test prompt for ' . $id,
      'dimensions' => '1200x630',
      'style' => 'photo',
    ]);

    $item = ImageQueueItem::create(
      id: $id,
      contentSpecId: 'test-content',
      imageSpec: $imageSpec,
      nodeId: 1,
      fieldName: 'field_image',
    );

    // Apply status if not pending.
    if ($status === ImageQueueItem::STATUS_COMPLETE) {
      return $item->withComplete(100);
    }
    if ($status === ImageQueueItem::STATUS_FAILED) {
      return $item->withFailed('Test error');
    }

    return $item;
  }

  /**
   * Tests create factory method.
   *
   * @covers ::create
   */
  public function testCreate(): void {
    $queue = ImageQueue::create();

    $this->assertEmpty($queue->items);
    $this->assertEmpty($queue->duplicates);
    $this->assertGreaterThan(0, $queue->createdAt);
    $this->assertGreaterThan(0, $queue->lastUpdated);
    $this->assertTrue($queue->isEmpty());
  }

  /**
   * Tests addItem method.
   *
   * @covers ::addItem
   * @covers ::getItem
   * @covers ::hasItem
   */
  public function testAddItem(): void {
    $queue = ImageQueue::create();
    $item = $this->createTestItem('item-1');

    $queue = $queue->addItem($item);

    $this->assertCount(1, $queue->items);
    $this->assertTrue($queue->hasItem('item-1'));
    $this->assertSame($item, $queue->getItem('item-1'));
    $this->assertFalse($queue->isEmpty());
  }

  /**
   * Tests updateItem method.
   *
   * @covers ::updateItem
   */
  public function testUpdateItem(): void {
    $queue = ImageQueue::create();
    $item = $this->createTestItem('item-1');
    $queue = $queue->addItem($item);

    $updatedItem = $item->withComplete(999);
    $queue = $queue->updateItem($updatedItem);

    $retrievedItem = $queue->getItem('item-1');
    $this->assertTrue($retrievedItem->isComplete());
    $this->assertEquals(999, $retrievedItem->mediaId);
  }

  /**
   * Tests updateItem with non-existent item.
   *
   * @covers ::updateItem
   */
  public function testUpdateItemNonExistent(): void {
    $queue = ImageQueue::create();
    $item = $this->createTestItem('non-existent');

    $result = $queue->updateItem($item);

    $this->assertSame($queue, $result);
    $this->assertFalse($queue->hasItem('non-existent'));
  }

  /**
   * Tests addDuplicate method.
   *
   * @covers ::addDuplicate
   * @covers ::isDuplicate
   * @covers ::getOriginalId
   */
  public function testAddDuplicate(): void {
    $queue = ImageQueue::create();
    $item = $this->createTestItem('original');
    $queue = $queue->addItem($item);

    $queue = $queue->addDuplicate('duplicate-1', 'original');

    $this->assertTrue($queue->isDuplicate('duplicate-1'));
    $this->assertFalse($queue->isDuplicate('original'));
    $this->assertEquals('original', $queue->getOriginalId('duplicate-1'));
    $this->assertNull($queue->getOriginalId('original'));
  }

  /**
   * Tests getPending method.
   *
   * @covers ::getPending
   * @covers ::getPendingCount
   */
  public function testGetPending(): void {
    $queue = ImageQueue::create();
    $queue = $queue->addItem($this->createTestItem('pending-1', ImageQueueItem::STATUS_PENDING));
    $queue = $queue->addItem($this->createTestItem('complete-1', ImageQueueItem::STATUS_COMPLETE));
    $queue = $queue->addItem($this->createTestItem('pending-2', ImageQueueItem::STATUS_PENDING));

    $pending = $queue->getPending();

    $this->assertCount(2, $pending);
    $this->assertArrayHasKey('pending-1', $pending);
    $this->assertArrayHasKey('pending-2', $pending);
    $this->assertEquals(2, $queue->getPendingCount());
  }

  /**
   * Tests getCompleted method.
   *
   * @covers ::getCompleted
   * @covers ::getCompletedCount
   */
  public function testGetCompleted(): void {
    $queue = ImageQueue::create();
    $queue = $queue->addItem($this->createTestItem('pending-1', ImageQueueItem::STATUS_PENDING));
    $queue = $queue->addItem($this->createTestItem('complete-1', ImageQueueItem::STATUS_COMPLETE));
    $queue = $queue->addItem($this->createTestItem('complete-2', ImageQueueItem::STATUS_COMPLETE));

    $completed = $queue->getCompleted();

    $this->assertCount(2, $completed);
    $this->assertArrayHasKey('complete-1', $completed);
    $this->assertArrayHasKey('complete-2', $completed);
    $this->assertEquals(2, $queue->getCompletedCount());
  }

  /**
   * Tests getFailed method.
   *
   * @covers ::getFailed
   * @covers ::getFailedCount
   */
  public function testGetFailed(): void {
    $queue = ImageQueue::create();
    $queue = $queue->addItem($this->createTestItem('pending-1', ImageQueueItem::STATUS_PENDING));
    $queue = $queue->addItem($this->createTestItem('failed-1', ImageQueueItem::STATUS_FAILED));

    $failed = $queue->getFailed();

    $this->assertCount(1, $failed);
    $this->assertArrayHasKey('failed-1', $failed);
    $this->assertEquals(1, $queue->getFailedCount());
  }

  /**
   * Tests getByNodeId method.
   *
   * @covers ::getByNodeId
   */
  public function testGetByNodeId(): void {
    $imageSpec = ImageSpecification::fromArray([
      'type' => 'hero',
      'prompt' => 'Test',
      'dimensions' => '1200x630',
      'style' => 'photo',
    ]);

    $item1 = new ImageQueueItem(
      id: 'item-1',
      contentSpecId: 'test',
      imageSpec: $imageSpec,
      nodeId: 42,
      fieldName: 'field_image',
    );

    $item2 = new ImageQueueItem(
      id: 'item-2',
      contentSpecId: 'test',
      imageSpec: $imageSpec,
      nodeId: 99,
      fieldName: 'field_image',
    );

    $item3 = new ImageQueueItem(
      id: 'item-3',
      contentSpecId: 'test',
      imageSpec: $imageSpec,
      nodeId: 42,
      fieldName: 'field_secondary',
    );

    $queue = ImageQueue::create();
    $queue = $queue->addItem($item1);
    $queue = $queue->addItem($item2);
    $queue = $queue->addItem($item3);

    $node42Items = $queue->getByNodeId(42);

    $this->assertCount(2, $node42Items);
    $this->assertArrayHasKey('item-1', $node42Items);
    $this->assertArrayHasKey('item-3', $node42Items);
  }

  /**
   * Tests getCount method.
   *
   * @covers ::getCount
   * @covers ::getUniqueCount
   */
  public function testGetCount(): void {
    $queue = ImageQueue::create();
    $queue = $queue->addItem($this->createTestItem('item-1'));
    $queue = $queue->addItem($this->createTestItem('item-2'));
    $queue = $queue->addItem($this->createTestItem('item-3'));

    $this->assertEquals(3, $queue->getCount());
    $this->assertEquals(3, $queue->getUniqueCount());
  }

  /**
   * Tests getDuplicateCount method.
   *
   * @covers ::getDuplicateCount
   */
  public function testGetDuplicateCount(): void {
    $queue = ImageQueue::create();
    $queue = $queue->addItem($this->createTestItem('original'));
    $queue = $queue->addDuplicate('dup-1', 'original');
    $queue = $queue->addDuplicate('dup-2', 'original');

    $this->assertEquals(2, $queue->getDuplicateCount());
  }

  /**
   * Tests toArray method.
   *
   * @covers ::toArray
   */
  public function testToArray(): void {
    $queue = ImageQueue::create();
    $queue = $queue->addItem($this->createTestItem('item-1'));
    $queue = $queue->addDuplicate('dup-1', 'item-1');

    $array = $queue->toArray();

    $this->assertArrayHasKey('items', $array);
    $this->assertArrayHasKey('duplicates', $array);
    $this->assertArrayHasKey('created_at', $array);
    $this->assertArrayHasKey('last_updated', $array);
    $this->assertCount(1, $array['items']);
    $this->assertCount(1, $array['duplicates']);
  }

  /**
   * Tests fromArray method.
   *
   * @covers ::fromArray
   */
  public function testFromArray(): void {
    $data = [
      'items' => [
        'item-1' => [
          'id' => 'item-1',
          'content_spec_id' => 'test-content',
          'image_spec' => [
            'type' => 'hero',
            'prompt' => 'Test',
            'dimensions' => '1200x630',
            'style' => 'photo',
          ],
          'node_id' => 42,
          'field_name' => 'field_image',
          'status' => 'pending',
          'created_at' => 1735000000,
        ],
      ],
      'duplicates' => [
        'dup-1' => 'item-1',
      ],
      'created_at' => 1735000000,
      'last_updated' => 1735000100,
    ];

    $queue = ImageQueue::fromArray($data);

    $this->assertCount(1, $queue->items);
    $this->assertTrue($queue->hasItem('item-1'));
    $this->assertTrue($queue->isDuplicate('dup-1'));
    $this->assertEquals(1735000000, $queue->createdAt);
    $this->assertEquals(1735000100, $queue->lastUpdated);
  }

  /**
   * Tests isEmpty method.
   *
   * @covers ::isEmpty
   */
  public function testIsEmpty(): void {
    $queue = ImageQueue::create();
    $this->assertTrue($queue->isEmpty());

    $queue = $queue->addItem($this->createTestItem('item-1'));
    $this->assertFalse($queue->isEmpty());
  }

}
