<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit\Value;

use Drupal\ndx_council_generator\Value\ContentGenerationResult;
use Drupal\ndx_council_generator\Value\GenerationSummary;
use PHPUnit\Framework\TestCase;

/**
 * Tests the GenerationSummary value object.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Value\GenerationSummary
 * @group ndx_council_generator
 */
class GenerationSummaryTest extends TestCase {

  /**
   * Tests creating a summary from successful results.
   *
   * @covers ::fromResults
   * @covers ::__construct
   */
  public function testFromResultsAllSuccess(): void {
    $results = [
      ContentGenerationResult::fromSuccess('spec-1', 1, 1000),
      ContentGenerationResult::fromSuccess('spec-2', 2, 1500),
      ContentGenerationResult::fromSuccess('spec-3', 3, 2000),
    ];

    $summary = GenerationSummary::fromResults($results, time() - 5);

    $this->assertEquals(3, $summary->totalProcessed);
    $this->assertEquals(3, $summary->successCount);
    $this->assertEquals(0, $summary->failureCount);
    $this->assertEquals(4500, $summary->totalDurationMs);
    $this->assertEmpty($summary->failedSpecIds);
  }

  /**
   * Tests creating a summary with mixed results.
   *
   * @covers ::fromResults
   */
  public function testFromResultsMixed(): void {
    $results = [
      ContentGenerationResult::fromSuccess('spec-1', 1, 1000),
      ContentGenerationResult::fromFailure('spec-2', 'Error', 500),
      ContentGenerationResult::fromSuccess('spec-3', 3, 1500),
      ContentGenerationResult::fromFailure('spec-4', 'Timeout', 200),
    ];

    $summary = GenerationSummary::fromResults($results, time() - 10);

    $this->assertEquals(4, $summary->totalProcessed);
    $this->assertEquals(2, $summary->successCount);
    $this->assertEquals(2, $summary->failureCount);
    $this->assertEquals(['spec-2', 'spec-4'], $summary->failedSpecIds);
  }

  /**
   * Tests success rate calculation.
   *
   * @covers ::getSuccessRate
   */
  public function testGetSuccessRate(): void {
    $results = [
      ContentGenerationResult::fromSuccess('spec-1', 1, 1000),
      ContentGenerationResult::fromSuccess('spec-2', 2, 1000),
      ContentGenerationResult::fromFailure('spec-3', 'Error', 500),
      ContentGenerationResult::fromSuccess('spec-4', 4, 1000),
    ];

    $summary = GenerationSummary::fromResults($results, time());

    $this->assertEquals(75.0, $summary->getSuccessRate());
  }

  /**
   * Tests success rate with no results.
   *
   * @covers ::getSuccessRate
   */
  public function testGetSuccessRateEmpty(): void {
    $summary = GenerationSummary::fromResults([], time());

    $this->assertEquals(0.0, $summary->getSuccessRate());
  }

  /**
   * Tests average time per item calculation.
   *
   * @covers ::getAverageTimePerItemMs
   */
  public function testGetAverageTimePerItemMs(): void {
    $results = [
      ContentGenerationResult::fromSuccess('spec-1', 1, 1000),
      ContentGenerationResult::fromSuccess('spec-2', 2, 2000),
      ContentGenerationResult::fromSuccess('spec-3', 3, 3000),
    ];

    $summary = GenerationSummary::fromResults($results, time());

    $this->assertEquals(2000, $summary->getAverageTimePerItemMs());
  }

  /**
   * Tests total duration in seconds.
   *
   * @covers ::getTotalDurationSeconds
   */
  public function testGetTotalDurationSeconds(): void {
    $results = [
      ContentGenerationResult::fromSuccess('spec-1', 1, 2500),
    ];

    $summary = GenerationSummary::fromResults($results, time());

    $this->assertEquals(2.5, $summary->getTotalDurationSeconds());
  }

  /**
   * Tests isFullySuccessful method.
   *
   * @covers ::isFullySuccessful
   */
  public function testIsFullySuccessful(): void {
    $successResults = [
      ContentGenerationResult::fromSuccess('spec-1', 1, 1000),
      ContentGenerationResult::fromSuccess('spec-2', 2, 1000),
    ];

    $successSummary = GenerationSummary::fromResults($successResults, time());
    $this->assertTrue($successSummary->isFullySuccessful());

    $mixedResults = [
      ContentGenerationResult::fromSuccess('spec-1', 1, 1000),
      ContentGenerationResult::fromFailure('spec-2', 'Error', 500),
    ];

    $mixedSummary = GenerationSummary::fromResults($mixedResults, time());
    $this->assertFalse($mixedSummary->isFullySuccessful());
  }

  /**
   * Tests hasFailures method.
   *
   * @covers ::hasFailures
   */
  public function testHasFailures(): void {
    $successResults = [
      ContentGenerationResult::fromSuccess('spec-1', 1, 1000),
    ];

    $successSummary = GenerationSummary::fromResults($successResults, time());
    $this->assertFalse($successSummary->hasFailures());

    $failedResults = [
      ContentGenerationResult::fromFailure('spec-1', 'Error', 500),
    ];

    $failedSummary = GenerationSummary::fromResults($failedResults, time());
    $this->assertTrue($failedSummary->hasFailures());
  }

  /**
   * Tests summary text generation.
   *
   * @covers ::getSummaryText
   */
  public function testGetSummaryText(): void {
    $successResults = [
      ContentGenerationResult::fromSuccess('spec-1', 1, 2500),
    ];

    $successSummary = GenerationSummary::fromResults($successResults, time());
    $text = $successSummary->getSummaryText();

    $this->assertStringContainsString('1 items', $text);
    $this->assertStringContainsString('100%', $text);
  }

  /**
   * Tests log array conversion.
   *
   * @covers ::toLogArray
   */
  public function testToLogArray(): void {
    $results = [
      ContentGenerationResult::fromSuccess('spec-1', 1, 1000),
      ContentGenerationResult::fromFailure('spec-2', 'Error', 500),
    ];

    $summary = GenerationSummary::fromResults($results, time());
    $logArray = $summary->toLogArray();

    $this->assertEquals(2, $logArray['total_processed']);
    $this->assertEquals(1, $logArray['success_count']);
    $this->assertEquals(1, $logArray['failure_count']);
    $this->assertEquals(50.0, $logArray['success_rate']);
    $this->assertEquals(['spec-2'], $logArray['failed_spec_ids']);
  }

  /**
   * Tests array conversion and restoration.
   *
   * @covers ::toArray
   * @covers ::fromArray
   */
  public function testArrayConversion(): void {
    $results = [
      ContentGenerationResult::fromSuccess('spec-1', 1, 1000),
      ContentGenerationResult::fromFailure('spec-2', 'Error', 500),
    ];

    $original = GenerationSummary::fromResults($results, time() - 10);
    $array = $original->toArray();

    $this->assertEquals(2, $array['total_processed']);
    $this->assertCount(2, $array['results']);

    $restored = GenerationSummary::fromArray($array);

    $this->assertEquals($original->totalProcessed, $restored->totalProcessed);
    $this->assertEquals($original->successCount, $restored->successCount);
    $this->assertEquals($original->failureCount, $restored->failureCount);
    $this->assertCount(2, $restored->results);
  }

}
