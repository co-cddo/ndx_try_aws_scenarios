<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit\Value;

use Drupal\ndx_council_generator\Value\ImageQueueItem;
use Drupal\ndx_council_generator\Value\ImageSpecification;
use PHPUnit\Framework\TestCase;

/**
 * Tests the ImageQueueItem value object.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Value\ImageQueueItem
 * @group ndx_council_generator
 */
class ImageQueueItemTest extends TestCase {

  /**
   * Test image specification for tests.
   */
  protected ImageSpecification $imageSpec;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->imageSpec = ImageSpecification::fromArray([
      'type' => 'hero',
      'prompt' => 'A scenic view of the town',
      'dimensions' => '1200x630',
      'style' => 'photo',
      'field_name' => 'field_hero_image',
    ]);
  }

  /**
   * Tests create factory method.
   *
   * @covers ::create
   */
  public function testCreate(): void {
    $item = ImageQueueItem::create(
      id: 'hash-123',
      contentSpecId: 'service-waste',
      imageSpec: $this->imageSpec,
      nodeId: 42,
      fieldName: 'field_hero_image',
    );

    $this->assertEquals('hash-123', $item->id);
    $this->assertEquals('service-waste', $item->contentSpecId);
    $this->assertSame($this->imageSpec, $item->imageSpec);
    $this->assertEquals(42, $item->nodeId);
    $this->assertEquals('field_hero_image', $item->fieldName);
    $this->assertEquals(ImageQueueItem::STATUS_PENDING, $item->status);
    $this->assertGreaterThan(0, $item->createdAt);
    $this->assertNull($item->processedAt);
    $this->assertNull($item->mediaId);
    $this->assertNull($item->error);
  }

  /**
   * Tests isPending method.
   *
   * @covers ::isPending
   */
  public function testIsPending(): void {
    $item = ImageQueueItem::create(
      id: 'hash-1',
      contentSpecId: 'test',
      imageSpec: $this->imageSpec,
      nodeId: 1,
      fieldName: 'field_image',
    );

    $this->assertTrue($item->isPending());
    $this->assertFalse($item->isComplete());
    $this->assertFalse($item->isFailed());
  }

  /**
   * Tests withProcessing method.
   *
   * @covers ::withProcessing
   */
  public function testWithProcessing(): void {
    $item = ImageQueueItem::create(
      id: 'hash-1',
      contentSpecId: 'test',
      imageSpec: $this->imageSpec,
      nodeId: 1,
      fieldName: 'field_image',
    );

    $processing = $item->withProcessing();

    $this->assertEquals(ImageQueueItem::STATUS_PROCESSING, $processing->status);
    $this->assertEquals($item->id, $processing->id);
    $this->assertEquals($item->nodeId, $processing->nodeId);
    $this->assertNull($processing->mediaId);
    $this->assertNull($processing->error);
  }

  /**
   * Tests withComplete method.
   *
   * @covers ::withComplete
   * @covers ::isComplete
   */
  public function testWithComplete(): void {
    $item = ImageQueueItem::create(
      id: 'hash-1',
      contentSpecId: 'test',
      imageSpec: $this->imageSpec,
      nodeId: 1,
      fieldName: 'field_image',
    );

    $complete = $item->withComplete(999);

    $this->assertEquals(ImageQueueItem::STATUS_COMPLETE, $complete->status);
    $this->assertTrue($complete->isComplete());
    $this->assertFalse($complete->isPending());
    $this->assertEquals(999, $complete->mediaId);
    $this->assertNull($complete->error);
    $this->assertNotNull($complete->processedAt);
  }

  /**
   * Tests withFailed method.
   *
   * @covers ::withFailed
   * @covers ::isFailed
   */
  public function testWithFailed(): void {
    $item = ImageQueueItem::create(
      id: 'hash-1',
      contentSpecId: 'test',
      imageSpec: $this->imageSpec,
      nodeId: 1,
      fieldName: 'field_image',
    );

    $failed = $item->withFailed('API error');

    $this->assertEquals(ImageQueueItem::STATUS_FAILED, $failed->status);
    $this->assertTrue($failed->isFailed());
    $this->assertFalse($failed->isPending());
    $this->assertNull($failed->mediaId);
    $this->assertEquals('API error', $failed->error);
    $this->assertNotNull($failed->processedAt);
  }

  /**
   * Tests toArray method.
   *
   * @covers ::toArray
   */
  public function testToArray(): void {
    $item = ImageQueueItem::create(
      id: 'hash-123',
      contentSpecId: 'service-waste',
      imageSpec: $this->imageSpec,
      nodeId: 42,
      fieldName: 'field_hero_image',
    );

    $array = $item->toArray();

    $this->assertEquals('hash-123', $array['id']);
    $this->assertEquals('service-waste', $array['content_spec_id']);
    $this->assertIsArray($array['image_spec']);
    $this->assertEquals(42, $array['node_id']);
    $this->assertEquals('field_hero_image', $array['field_name']);
    $this->assertEquals(ImageQueueItem::STATUS_PENDING, $array['status']);
    $this->assertNotNull($array['created_at']);
    $this->assertNull($array['processed_at']);
    $this->assertNull($array['media_id']);
    $this->assertNull($array['error']);
  }

  /**
   * Tests fromArray method.
   *
   * @covers ::fromArray
   */
  public function testFromArray(): void {
    $data = [
      'id' => 'hash-456',
      'content_spec_id' => 'news-article',
      'image_spec' => [
        'type' => 'location',
        'prompt' => 'Town hall building',
        'dimensions' => '800x600',
        'style' => 'photo',
      ],
      'node_id' => 99,
      'field_name' => 'field_location_image',
      'status' => ImageQueueItem::STATUS_COMPLETE,
      'created_at' => 1735000000,
      'processed_at' => 1735000100,
      'media_id' => 555,
      'error' => NULL,
    ];

    $item = ImageQueueItem::fromArray($data);

    $this->assertEquals('hash-456', $item->id);
    $this->assertEquals('news-article', $item->contentSpecId);
    $this->assertEquals('location', $item->imageSpec->type);
    $this->assertEquals(99, $item->nodeId);
    $this->assertEquals('field_location_image', $item->fieldName);
    $this->assertEquals(ImageQueueItem::STATUS_COMPLETE, $item->status);
    $this->assertEquals(1735000000, $item->createdAt);
    $this->assertEquals(1735000100, $item->processedAt);
    $this->assertEquals(555, $item->mediaId);
    $this->assertNull($item->error);
  }

  /**
   * Tests status constants.
   *
   * @covers ::VALID_STATUSES
   */
  public function testStatusConstants(): void {
    $this->assertContains(ImageQueueItem::STATUS_PENDING, ImageQueueItem::VALID_STATUSES);
    $this->assertContains(ImageQueueItem::STATUS_PROCESSING, ImageQueueItem::VALID_STATUSES);
    $this->assertContains(ImageQueueItem::STATUS_COMPLETE, ImageQueueItem::VALID_STATUSES);
    $this->assertContains(ImageQueueItem::STATUS_FAILED, ImageQueueItem::VALID_STATUSES);
    $this->assertCount(4, ImageQueueItem::VALID_STATUSES);
  }

}
