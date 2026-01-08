<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit\Value;

use Drupal\ndx_council_generator\Value\ImageQueue;
use Drupal\ndx_council_generator\Value\ImageQueueItem;
use Drupal\ndx_council_generator\Value\ImageQueueStatistics;
use Drupal\ndx_council_generator\Value\ImageSpecification;
use PHPUnit\Framework\TestCase;

/**
 * Tests the ImageQueueStatistics value object.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Value\ImageQueueStatistics
 * @group ndx_council_generator
 */
class ImageQueueStatisticsTest extends TestCase {

  /**
   * Creates a test ImageQueueItem with specified status.
   */
  protected function createTestItem(string $id, string $status = ImageQueueItem::STATUS_PENDING): ImageQueueItem {
    $imageSpec = ImageSpecification::fromArray([
      'type' => 'hero',
      'prompt' => 'Test prompt',
      'dimensions' => '1200x630',
      'style' => 'photo',
    ]);

    $item = ImageQueueItem::create(
      id: $id,
      contentSpecId: 'test',
      imageSpec: $imageSpec,
      nodeId: 1,
      fieldName: 'field_image',
    );

    if ($status === ImageQueueItem::STATUS_COMPLETE) {
      return $item->withComplete(100);
    }
    if ($status === ImageQueueItem::STATUS_FAILED) {
      return $item->withFailed('Error');
    }

    return $item;
  }

  /**
   * Tests fromQueue factory method.
   *
   * @covers ::fromQueue
   */
  public function testFromQueue(): void {
    $queue = ImageQueue::create();
    $queue = $queue->addItem($this->createTestItem('pending-1', ImageQueueItem::STATUS_PENDING));
    $queue = $queue->addItem($this->createTestItem('complete-1', ImageQueueItem::STATUS_COMPLETE));
    $queue = $queue->addItem($this->createTestItem('failed-1', ImageQueueItem::STATUS_FAILED));
    $queue = $queue->addDuplicate('dup-1', 'pending-1');

    $stats = ImageQueueStatistics::fromQueue($queue);

    $this->assertEquals(3, $stats->totalCount);
    $this->assertEquals(1, $stats->pendingCount);
    $this->assertEquals(1, $stats->completedCount);
    $this->assertEquals(1, $stats->failedCount);
    $this->assertEquals(1, $stats->duplicateCount);
  }

  /**
   * Tests getCompletionPercentage method.
   *
   * @covers ::getCompletionPercentage
   */
  public function testGetCompletionPercentage(): void {
    $stats = new ImageQueueStatistics(
      totalCount: 10,
      pendingCount: 3,
      completedCount: 7,
      failedCount: 0,
      duplicateCount: 0,
      createdAt: time(),
      lastUpdated: time(),
    );

    $this->assertEquals(70, $stats->getCompletionPercentage());
  }

  /**
   * Tests getCompletionPercentage with empty queue.
   *
   * @covers ::getCompletionPercentage
   */
  public function testGetCompletionPercentageEmpty(): void {
    $stats = new ImageQueueStatistics(
      totalCount: 0,
      pendingCount: 0,
      completedCount: 0,
      failedCount: 0,
      duplicateCount: 0,
      createdAt: time(),
      lastUpdated: time(),
    );

    $this->assertEquals(100, $stats->getCompletionPercentage());
  }

  /**
   * Tests getEstimatedRemainingSeconds method.
   *
   * @covers ::getEstimatedRemainingSeconds
   */
  public function testGetEstimatedRemainingSeconds(): void {
    $stats = new ImageQueueStatistics(
      totalCount: 10,
      pendingCount: 5,
      completedCount: 5,
      failedCount: 0,
      duplicateCount: 0,
      createdAt: time(),
      lastUpdated: time(),
    );

    // With custom average time of 2000ms per image.
    $remaining = $stats->getEstimatedRemainingSeconds(2000);
    $this->assertEquals(10, $remaining);
  }

  /**
   * Tests getEstimatedTimeDisplay method.
   *
   * @covers ::getEstimatedTimeDisplay
   */
  public function testGetEstimatedTimeDisplay(): void {
    // Test with seconds (less than 60s).
    $stats = new ImageQueueStatistics(
      totalCount: 10,
      pendingCount: 2,
      completedCount: 8,
      failedCount: 0,
      duplicateCount: 0,
      createdAt: time(),
      lastUpdated: time(),
    );

    // 2 pending * 5000ms = 10000ms = 10 seconds.
    $display = $stats->getEstimatedTimeDisplay();
    $this->assertStringContainsString('10 seconds', $display);
  }

  /**
   * Tests isComplete method.
   *
   * @covers ::isComplete
   */
  public function testIsComplete(): void {
    $complete = new ImageQueueStatistics(
      totalCount: 5,
      pendingCount: 0,
      completedCount: 5,
      failedCount: 0,
      duplicateCount: 0,
      createdAt: time(),
      lastUpdated: time(),
    );

    $incomplete = new ImageQueueStatistics(
      totalCount: 5,
      pendingCount: 2,
      completedCount: 3,
      failedCount: 0,
      duplicateCount: 0,
      createdAt: time(),
      lastUpdated: time(),
    );

    $this->assertTrue($complete->isComplete());
    $this->assertFalse($incomplete->isComplete());
  }

  /**
   * Tests hasFailures method.
   *
   * @covers ::hasFailures
   */
  public function testHasFailures(): void {
    $withFailures = new ImageQueueStatistics(
      totalCount: 5,
      pendingCount: 0,
      completedCount: 4,
      failedCount: 1,
      duplicateCount: 0,
      createdAt: time(),
      lastUpdated: time(),
    );

    $noFailures = new ImageQueueStatistics(
      totalCount: 5,
      pendingCount: 0,
      completedCount: 5,
      failedCount: 0,
      duplicateCount: 0,
      createdAt: time(),
      lastUpdated: time(),
    );

    $this->assertTrue($withFailures->hasFailures());
    $this->assertFalse($noFailures->hasFailures());
  }

  /**
   * Tests getSuccessRate method.
   *
   * @covers ::getSuccessRate
   */
  public function testGetSuccessRate(): void {
    $stats = new ImageQueueStatistics(
      totalCount: 10,
      pendingCount: 2,
      completedCount: 6,
      failedCount: 2,
      duplicateCount: 0,
      createdAt: time(),
      lastUpdated: time(),
    );

    // 6 completed out of 8 processed = 0.75.
    $this->assertEquals(0.75, $stats->getSuccessRate());
  }

  /**
   * Tests getSuccessRate with no processed items.
   *
   * @covers ::getSuccessRate
   */
  public function testGetSuccessRateNoProcessed(): void {
    $stats = new ImageQueueStatistics(
      totalCount: 5,
      pendingCount: 5,
      completedCount: 0,
      failedCount: 0,
      duplicateCount: 0,
      createdAt: time(),
      lastUpdated: time(),
    );

    $this->assertEquals(1.0, $stats->getSuccessRate());
  }

  /**
   * Tests toArray method.
   *
   * @covers ::toArray
   */
  public function testToArray(): void {
    $now = time();
    $stats = new ImageQueueStatistics(
      totalCount: 10,
      pendingCount: 3,
      completedCount: 6,
      failedCount: 1,
      duplicateCount: 2,
      createdAt: $now,
      lastUpdated: $now,
    );

    $array = $stats->toArray();

    $this->assertEquals(10, $array['total']);
    $this->assertEquals(3, $array['pending']);
    $this->assertEquals(6, $array['completed']);
    $this->assertEquals(1, $array['failed']);
    $this->assertEquals(2, $array['duplicates']);
    $this->assertEquals(60, $array['completion_pct']);
    $this->assertArrayHasKey('estimated_remaining', $array);
    $this->assertEquals($now, $array['created_at']);
    $this->assertEquals($now, $array['last_updated']);
  }

  /**
   * Tests getSummaryText method.
   *
   * @covers ::getSummaryText
   */
  public function testGetSummaryText(): void {
    $stats = new ImageQueueStatistics(
      totalCount: 10,
      pendingCount: 4,
      completedCount: 5,
      failedCount: 1,
      duplicateCount: 2,
      createdAt: time(),
      lastUpdated: time(),
    );

    $summary = $stats->getSummaryText();

    $this->assertStringContainsString('5/10', $summary);
    $this->assertStringContainsString('50%', $summary);
    $this->assertStringContainsString('1 failed', $summary);
    $this->assertStringContainsString('2 duplicates', $summary);
  }

}
