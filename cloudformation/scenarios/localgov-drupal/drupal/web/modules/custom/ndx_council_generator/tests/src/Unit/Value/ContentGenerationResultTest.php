<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit\Value;

use Drupal\ndx_council_generator\Value\ContentGenerationResult;
use PHPUnit\Framework\TestCase;

/**
 * Tests the ContentGenerationResult value object.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Value\ContentGenerationResult
 * @group ndx_council_generator
 */
class ContentGenerationResultTest extends TestCase {

  /**
   * Tests creating a successful result.
   *
   * @covers ::fromSuccess
   * @covers ::__construct
   */
  public function testFromSuccess(): void {
    $result = ContentGenerationResult::fromSuccess('service-waste', 123, 1500);

    $this->assertEquals('service-waste', $result->specId);
    $this->assertTrue($result->success);
    $this->assertEquals(123, $result->nodeId);
    $this->assertNull($result->error);
    $this->assertEquals(1500, $result->processingTimeMs);
    $this->assertGreaterThan(0, $result->generatedAt);
  }

  /**
   * Tests creating a failed result.
   *
   * @covers ::fromFailure
   */
  public function testFromFailure(): void {
    $result = ContentGenerationResult::fromFailure('service-waste', 'API timeout', 500);

    $this->assertEquals('service-waste', $result->specId);
    $this->assertFalse($result->success);
    $this->assertNull($result->nodeId);
    $this->assertEquals('API timeout', $result->error);
    $this->assertEquals(500, $result->processingTimeMs);
  }

  /**
   * Tests array conversion.
   *
   * @covers ::toArray
   * @covers ::fromArray
   */
  public function testArrayConversion(): void {
    $original = ContentGenerationResult::fromSuccess('test-spec', 456, 2000);
    $array = $original->toArray();

    $this->assertEquals('test-spec', $array['spec_id']);
    $this->assertTrue($array['success']);
    $this->assertEquals(456, $array['node_id']);
    $this->assertEquals(2000, $array['processing_time_ms']);

    $restored = ContentGenerationResult::fromArray($array);

    $this->assertEquals($original->specId, $restored->specId);
    $this->assertEquals($original->success, $restored->success);
    $this->assertEquals($original->nodeId, $restored->nodeId);
    $this->assertEquals($original->processingTimeMs, $restored->processingTimeMs);
  }

  /**
   * Tests fromArray with minimal data.
   *
   * @covers ::fromArray
   */
  public function testFromArrayWithDefaults(): void {
    $result = ContentGenerationResult::fromArray([
      'spec_id' => 'minimal-spec',
    ]);

    $this->assertEquals('minimal-spec', $result->specId);
    $this->assertFalse($result->success);
    $this->assertNull($result->nodeId);
    $this->assertNull($result->error);
    $this->assertEquals(0, $result->processingTimeMs);
  }

  /**
   * Tests failed result array conversion.
   *
   * @covers ::toArray
   */
  public function testFailedResultToArray(): void {
    $result = ContentGenerationResult::fromFailure('error-spec', 'Something broke', 100);
    $array = $result->toArray();

    $this->assertEquals('error-spec', $array['spec_id']);
    $this->assertFalse($array['success']);
    $this->assertNull($array['node_id']);
    $this->assertEquals('Something broke', $array['error']);
    $this->assertEquals(100, $array['processing_time_ms']);
  }

}
