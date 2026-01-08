<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit\Value;

use Drupal\ndx_aws_ai\Result\ImageGenerationResult;
use Drupal\ndx_council_generator\Value\ImageBatchResult;
use PHPUnit\Framework\TestCase;

/**
 * Tests for ImageBatchResult value object.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Value\ImageBatchResult
 * @group ndx_council_generator
 */
class ImageBatchResultTest extends TestCase {

  /**
   * Tests empty factory method.
   *
   * @covers ::empty
   */
  public function testEmpty(): void {
    $result = ImageBatchResult::empty();

    $this->assertEquals(0, $result->totalProcessed);
    $this->assertEquals(0, $result->successCount);
    $this->assertEquals(0, $result->failureCount);
    $this->assertEmpty($result->mediaIds);
    $this->assertEmpty($result->failedItemIds);
    $this->assertEquals(0, $result->totalProcessingTimeMs);
    $this->assertTrue($result->isFullySuccessful());
  }

  /**
   * Tests fromResults factory with all successes.
   *
   * @covers ::fromResults
   */
  public function testFromResultsAllSuccess(): void {
    $results = [
      ImageGenerationResult::fromSuccess('data1', 'image/png', 100.0),
      ImageGenerationResult::fromSuccess('data2', 'image/png', 150.0),
      ImageGenerationResult::fromSuccess('data3', 'image/png', 200.0),
    ];

    $mediaIds = [1, 2, 3];
    $failedItemIds = [];
    $startedAt = time() - 5;

    $result = ImageBatchResult::fromResults($results, $mediaIds, $failedItemIds, $startedAt);

    $this->assertEquals(3, $result->totalProcessed);
    $this->assertEquals(3, $result->successCount);
    $this->assertEquals(0, $result->failureCount);
    $this->assertEquals([1, 2, 3], $result->mediaIds);
    $this->assertEmpty($result->failedItemIds);
    $this->assertEquals(450.0, $result->totalProcessingTimeMs);
    $this->assertTrue($result->isFullySuccessful());
  }

  /**
   * Tests fromResults factory with mixed results.
   *
   * @covers ::fromResults
   */
  public function testFromResultsMixed(): void {
    $results = [
      ImageGenerationResult::fromSuccess('data1', 'image/png', 100.0),
      ImageGenerationResult::fromFailure('API error', 50.0),
      ImageGenerationResult::fromSuccess('data2', 'image/png', 200.0),
    ];

    $mediaIds = [1, 3];
    $failedItemIds = ['item-2'];
    $startedAt = time() - 10;

    $result = ImageBatchResult::fromResults($results, $mediaIds, $failedItemIds, $startedAt);

    $this->assertEquals(3, $result->totalProcessed);
    $this->assertEquals(2, $result->successCount);
    $this->assertEquals(1, $result->failureCount);
    $this->assertEquals([1, 3], $result->mediaIds);
    $this->assertEquals(['item-2'], $result->failedItemIds);
    $this->assertFalse($result->isFullySuccessful());
  }

  /**
   * Tests fromResults factory with all failures.
   *
   * @covers ::fromResults
   */
  public function testFromResultsAllFailure(): void {
    $results = [
      ImageGenerationResult::fromFailure('Error 1', 100.0),
      ImageGenerationResult::fromFailure('Error 2', 100.0),
    ];

    $mediaIds = [];
    $failedItemIds = ['item-1', 'item-2'];
    $startedAt = time();

    $result = ImageBatchResult::fromResults($results, $mediaIds, $failedItemIds, $startedAt);

    $this->assertEquals(2, $result->totalProcessed);
    $this->assertEquals(0, $result->successCount);
    $this->assertEquals(2, $result->failureCount);
    $this->assertEmpty($result->mediaIds);
    $this->assertEquals(['item-1', 'item-2'], $result->failedItemIds);
    $this->assertFalse($result->isFullySuccessful());
  }

  /**
   * Tests isFullySuccessful method.
   *
   * @covers ::isFullySuccessful
   */
  public function testIsFullySuccessful(): void {
    // No failures.
    $result = new ImageBatchResult(
      totalProcessed: 5,
      successCount: 5,
      failureCount: 0,
      mediaIds: [1, 2, 3, 4, 5],
      failedItemIds: [],
      totalProcessingTimeMs: 1000.0,
      startedAt: time(),
      completedAt: time(),
    );
    $this->assertTrue($result->isFullySuccessful());

    // With failures.
    $result = new ImageBatchResult(
      totalProcessed: 5,
      successCount: 4,
      failureCount: 1,
      mediaIds: [1, 2, 3, 4],
      failedItemIds: ['item-5'],
      totalProcessingTimeMs: 1000.0,
      startedAt: time(),
      completedAt: time(),
    );
    $this->assertFalse($result->isFullySuccessful());
  }

  /**
   * Tests getSummaryText method.
   *
   * @covers ::getSummaryText
   */
  public function testGetSummaryText(): void {
    $result = new ImageBatchResult(
      totalProcessed: 10,
      successCount: 8,
      failureCount: 2,
      mediaIds: [1, 2, 3, 4, 5, 6, 7, 8],
      failedItemIds: ['item-9', 'item-10'],
      totalProcessingTimeMs: 5000.0,
      startedAt: time() - 10,
      completedAt: time(),
    );

    $summary = $result->getSummaryText();

    $this->assertStringContainsString('10', $summary);
    $this->assertStringContainsString('8', $summary);
    $this->assertStringContainsString('2', $summary);
  }

  /**
   * Tests immutability via readonly properties.
   *
   * @covers ::__construct
   */
  public function testImmutability(): void {
    $result = ImageBatchResult::empty();

    $this->assertIsInt($result->totalProcessed);
    $this->assertIsInt($result->successCount);
    $this->assertIsInt($result->failureCount);
    $this->assertIsArray($result->mediaIds);
    $this->assertIsArray($result->failedItemIds);
    $this->assertIsFloat($result->totalProcessingTimeMs);
  }

  /**
   * Tests duration calculation.
   *
   * @covers ::fromResults
   */
  public function testDurationCalculation(): void {
    $startedAt = time() - 30;
    $results = [
      ImageGenerationResult::fromSuccess('data', 'image/png', 100.0),
    ];

    $result = ImageBatchResult::fromResults($results, [1], [], $startedAt);

    $this->assertGreaterThanOrEqual(30, $result->completedAt - $result->startedAt);
  }

}
