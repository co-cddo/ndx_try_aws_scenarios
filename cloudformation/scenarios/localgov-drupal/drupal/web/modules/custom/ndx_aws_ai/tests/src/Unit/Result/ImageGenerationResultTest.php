<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_aws_ai\Unit\Result;

use Drupal\ndx_aws_ai\Result\ImageGenerationResult;
use PHPUnit\Framework\TestCase;

/**
 * Tests for ImageGenerationResult value object.
 *
 * @coversDefaultClass \Drupal\ndx_aws_ai\Result\ImageGenerationResult
 * @group ndx_aws_ai
 */
class ImageGenerationResultTest extends TestCase {

  /**
   * Tests fromSuccess factory method.
   *
   * @covers ::fromSuccess
   */
  public function testFromSuccess(): void {
    $imageData = 'fake-image-binary-data';
    $result = ImageGenerationResult::fromSuccess(
      imageData: $imageData,
      mimeType: 'image/png',
      processingTimeMs: 1500.5,
      width: 1024,
      height: 768,
    );

    $this->assertTrue($result->success);
    $this->assertEquals($imageData, $result->imageData);
    $this->assertEquals('image/png', $result->mimeType);
    $this->assertEquals(1500.5, $result->processingTimeMs);
    $this->assertEquals(1024, $result->width);
    $this->assertEquals(768, $result->height);
    $this->assertNull($result->error);
  }

  /**
   * Tests fromFailure factory method.
   *
   * @covers ::fromFailure
   */
  public function testFromFailure(): void {
    $result = ImageGenerationResult::fromFailure(
      error: 'API call failed',
      processingTimeMs: 500.0,
    );

    $this->assertFalse($result->success);
    $this->assertNull($result->imageData);
    $this->assertNull($result->mimeType);
    $this->assertEquals('API call failed', $result->error);
    $this->assertEquals(500.0, $result->processingTimeMs);
    $this->assertEquals(0, $result->width);
    $this->assertEquals(0, $result->height);
  }

  /**
   * Tests fromFailure with default processing time.
   *
   * @covers ::fromFailure
   */
  public function testFromFailureDefaultTime(): void {
    $result = ImageGenerationResult::fromFailure('Some error');

    $this->assertFalse($result->success);
    $this->assertEquals('Some error', $result->error);
    $this->assertEquals(0, $result->processingTimeMs);
  }

  /**
   * Tests getImageAsBase64 method.
   *
   * @covers ::getImageAsBase64
   */
  public function testGetImageAsBase64(): void {
    $imageData = 'test image data';
    $result = ImageGenerationResult::fromSuccess(
      imageData: $imageData,
      mimeType: 'image/png',
      processingTimeMs: 100.0,
    );

    $expected = base64_encode($imageData);
    $this->assertEquals($expected, $result->getImageAsBase64());
  }

  /**
   * Tests getImageAsBase64 with empty data.
   *
   * @covers ::getImageAsBase64
   */
  public function testGetImageAsBase64EmptyData(): void {
    $result = ImageGenerationResult::fromFailure('Failed');

    $this->assertEquals('', $result->getImageAsBase64());
  }

  /**
   * Tests immutability of the result object.
   *
   * @covers ::__construct
   */
  public function testImmutability(): void {
    $result = ImageGenerationResult::fromSuccess(
      imageData: 'data',
      mimeType: 'image/png',
      processingTimeMs: 100.0,
    );

    // Properties are readonly, so we verify they exist and have correct types.
    $this->assertIsBool($result->success);
    $this->assertIsString($result->imageData);
    $this->assertIsFloat($result->processingTimeMs);
  }

}
