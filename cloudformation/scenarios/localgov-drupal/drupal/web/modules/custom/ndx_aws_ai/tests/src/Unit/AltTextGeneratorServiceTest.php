<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_aws_ai\Unit;

use Drupal\Core\Entity\EntityStorageInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\file\FileInterface;
use Drupal\media\MediaInterface;
use Drupal\ndx_aws_ai\Result\AltTextResult;
use Drupal\ndx_aws_ai\Result\ImageAnalysisResult;
use Drupal\ndx_aws_ai\Service\AltTextGeneratorService;
use Drupal\ndx_aws_ai\Service\VisionServiceInterface;
use PHPUnit\Framework\TestCase;
use Prophecy\Argument;
use Prophecy\PhpUnit\ProphecyTrait;
use Psr\Log\LoggerInterface;

/**
 * Unit tests for AltTextGeneratorService.
 *
 * @coversDefaultClass \Drupal\ndx_aws_ai\Service\AltTextGeneratorService
 * @group ndx_aws_ai
 *
 * Story 4.5: Auto Alt-Text on Media Upload
 */
class AltTextGeneratorServiceTest extends TestCase {

  use ProphecyTrait;

  /**
   * The mocked Vision service.
   *
   * @var \Drupal\ndx_aws_ai\Service\VisionServiceInterface|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $visionService;

  /**
   * The mocked entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $entityTypeManager;

  /**
   * The mocked file system.
   *
   * @var \Drupal\Core\File\FileSystemInterface|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $fileSystem;

  /**
   * The mocked logger.
   *
   * @var \Psr\Log\LoggerInterface|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $logger;

  /**
   * The service under test.
   *
   * @var \Drupal\ndx_aws_ai\Service\AltTextGeneratorService
   */
  protected AltTextGeneratorService $service;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->visionService = $this->prophesize(VisionServiceInterface::class);
    $this->entityTypeManager = $this->prophesize(EntityTypeManagerInterface::class);
    $this->fileSystem = $this->prophesize(FileSystemInterface::class);
    $this->logger = $this->prophesize(LoggerInterface::class);

    $this->logger->info(Argument::any(), Argument::any())->willReturn(NULL);
    $this->logger->error(Argument::any(), Argument::any())->willReturn(NULL);
    $this->logger->warning(Argument::any(), Argument::any())->willReturn(NULL);

    $this->service = new AltTextGeneratorService(
      $this->visionService->reveal(),
      $this->entityTypeManager->reveal(),
      $this->fileSystem->reveal(),
      $this->logger->reveal(),
    );
  }

  /**
   * Test successful alt-text generation from raw data.
   *
   * @covers ::generateAltText
   */
  public function testGenerateAltTextSuccess(): void {
    $imageData = 'fake-image-data';
    $mimeType = 'image/jpeg';
    $expectedAlt = 'A red brick building with white windows';

    $visionResult = ImageAnalysisResult::fromSuccess(
      description: $expectedAlt,
      processingTimeMs: 150.0,
      altText: $expectedAlt,
    );

    $this->visionService->generateAltText($imageData, $mimeType, FALSE)
      ->willReturn($visionResult);

    $result = $this->service->generateAltText($imageData, $mimeType);

    $this->assertInstanceOf(AltTextResult::class, $result);
    $this->assertTrue($result->isSuccess());
    $this->assertEquals($expectedAlt, $result->altText);
    $this->assertTrue($result->isAiGenerated);
  }

  /**
   * Test alt-text generation failure handling.
   *
   * @covers ::generateAltText
   */
  public function testGenerateAltTextFailure(): void {
    $imageData = 'fake-image-data';
    $mimeType = 'image/jpeg';

    $this->visionService->generateAltText($imageData, $mimeType, FALSE)
      ->willThrow(new \Exception('Vision API error'));

    $result = $this->service->generateAltText($imageData, $mimeType);

    $this->assertInstanceOf(AltTextResult::class, $result);
    $this->assertFalse($result->isSuccess());
    $this->assertEquals('', $result->altText);
    $this->assertStringContainsString('Vision API error', $result->error);
  }

  /**
   * Test alt-text generation from URI.
   *
   * @covers ::generateAltTextFromUri
   */
  public function testGenerateAltTextFromUriSuccess(): void {
    $uri = 'public://images/test.jpg';
    $realPath = '/var/www/files/images/test.jpg';
    $expectedAlt = 'A beautiful sunset over the ocean';

    $this->fileSystem->realpath($uri)->willReturn($realPath);

    $visionResult = ImageAnalysisResult::fromSuccess(
      description: $expectedAlt,
      processingTimeMs: 200.0,
      altText: $expectedAlt,
    );

    $this->visionService->generateAltTextFromFile($realPath)
      ->willReturn($visionResult);

    $result = $this->service->generateAltTextFromUri($uri);

    $this->assertTrue($result->isSuccess());
    $this->assertEquals($expectedAlt, $result->altText);
    $this->assertEquals($uri, $result->sourceUri);
  }

  /**
   * Test alt-text generation for media entity.
   *
   * @covers ::generateAltTextForMedia
   */
  public function testGenerateAltTextForMediaSuccess(): void {
    $uri = 'public://images/media-test.jpg';
    $realPath = '/var/www/files/images/media-test.jpg';
    $expectedAlt = 'Council meeting in progress';
    $mediaId = 42;
    $fileId = 123;

    // Set up file entity mock.
    $file = $this->prophesize(FileInterface::class);
    $file->getFileUri()->willReturn($uri);

    // Set up file storage.
    $fileStorage = $this->prophesize(EntityStorageInterface::class);
    $fileStorage->load($fileId)->willReturn($file->reveal());

    $this->entityTypeManager->getStorage('file')
      ->willReturn($fileStorage->reveal());

    // Set up image field.
    $imageField = $this->prophesize(FieldItemListInterface::class);
    $imageField->isEmpty()->willReturn(FALSE);
    $imageField->__get('target_id')->willReturn($fileId);

    // Set up media entity.
    $media = $this->prophesize(MediaInterface::class);
    $media->bundle()->willReturn('image');
    $media->id()->willReturn($mediaId);
    $media->hasField('field_media_image')->willReturn(TRUE);
    $media->get('field_media_image')->willReturn($imageField->reveal());

    $this->fileSystem->realpath($uri)->willReturn($realPath);

    $visionResult = ImageAnalysisResult::fromSuccess(
      description: $expectedAlt,
      processingTimeMs: 180.0,
      altText: $expectedAlt,
    );

    $this->visionService->generateAltTextFromFile($realPath)
      ->willReturn($visionResult);

    $result = $this->service->generateAltTextForMedia($media->reveal());

    $this->assertTrue($result->isSuccess());
    $this->assertEquals($expectedAlt, $result->altText);
    $this->assertEquals($mediaId, $result->mediaId);
    $this->assertEquals($uri, $result->sourceUri);
  }

  /**
   * Test non-image media bundle is rejected.
   *
   * @covers ::generateAltTextForMedia
   */
  public function testGenerateAltTextForMediaNonImageBundle(): void {
    $media = $this->prophesize(MediaInterface::class);
    $media->bundle()->willReturn('document');
    $media->id()->willReturn(1);

    $result = $this->service->generateAltTextForMedia($media->reveal());

    $this->assertFalse($result->isSuccess());
    $this->assertStringContainsString('not an image type', $result->error);
  }

  /**
   * Test needsAltText detection.
   *
   * @covers ::needsAltText
   */
  public function testNeedsAltTextTrue(): void {
    // Set up image field with empty alt.
    $imageField = $this->prophesize(FieldItemListInterface::class);
    $imageField->isEmpty()->willReturn(FALSE);
    $imageField->__get('alt')->willReturn('');

    $media = $this->prophesize(MediaInterface::class);
    $media->bundle()->willReturn('image');
    $media->hasField('field_media_image')->willReturn(TRUE);
    $media->get('field_media_image')->willReturn($imageField->reveal());

    $this->assertTrue($this->service->needsAltText($media->reveal()));
  }

  /**
   * Test needsAltText returns false when alt exists.
   *
   * @covers ::needsAltText
   */
  public function testNeedsAltTextFalse(): void {
    // Set up image field with existing alt.
    $imageField = $this->prophesize(FieldItemListInterface::class);
    $imageField->isEmpty()->willReturn(FALSE);
    $imageField->__get('alt')->willReturn('Existing alt text');

    $media = $this->prophesize(MediaInterface::class);
    $media->bundle()->willReturn('image');
    $media->hasField('field_media_image')->willReturn(TRUE);
    $media->get('field_media_image')->willReturn($imageField->reveal());

    $this->assertFalse($this->service->needsAltText($media->reveal()));
  }

  /**
   * Test getImageFieldName returns correct field.
   *
   * @covers ::getImageFieldName
   */
  public function testGetImageFieldName(): void {
    $this->assertEquals('field_media_image', $this->service->getImageFieldName('image'));
    $this->assertNull($this->service->getImageFieldName('document'));
    $this->assertNull($this->service->getImageFieldName('video'));
  }

  /**
   * Test isAvailable delegates to VisionService.
   *
   * @covers ::isAvailable
   */
  public function testIsAvailable(): void {
    $this->visionService->isAvailable()->willReturn(TRUE);
    $this->assertTrue($this->service->isAvailable());

    $this->visionService->isAvailable()->willReturn(FALSE);
    $this->assertFalse($this->service->isAvailable());
  }

  /**
   * Test hasAiGeneratedAltText.
   *
   * @covers ::hasAiGeneratedAltText
   */
  public function testHasAiGeneratedAltText(): void {
    // Media with AI flag.
    $aiField = $this->prophesize(FieldItemListInterface::class);
    $aiField->__get('value')->willReturn(TRUE);

    $media = $this->prophesize(MediaInterface::class);
    $media->hasField('field_ai_generated_alt')->willReturn(TRUE);
    $media->get('field_ai_generated_alt')->willReturn($aiField->reveal());

    $this->assertTrue($this->service->hasAiGeneratedAltText($media->reveal()));
  }

  /**
   * Test AltTextResult value object.
   *
   * @covers \Drupal\ndx_aws_ai\Result\AltTextResult
   */
  public function testAltTextResultSuccess(): void {
    $result = AltTextResult::success(
      altText: 'Test alt text',
      confidence: 95.0,
      processingTimeMs: 100.0,
      sourceUri: 'public://test.jpg',
      mediaId: 42,
    );

    $this->assertTrue($result->isSuccess());
    $this->assertFalse($result->isDecorative());
    $this->assertTrue($result->meetsLengthGuideline());
    $this->assertTrue($result->isAiGenerated);
    $this->assertEquals(42, $result->mediaId);
  }

  /**
   * Test AltTextResult failure factory.
   *
   * @covers \Drupal\ndx_aws_ai\Result\AltTextResult
   */
  public function testAltTextResultFailure(): void {
    $result = AltTextResult::failure(
      error: 'API timeout',
      processingTimeMs: 5000.0,
    );

    $this->assertFalse($result->isSuccess());
    $this->assertEquals('', $result->altText);
    $this->assertEquals('API timeout', $result->error);
  }

  /**
   * Test AltTextResult decorative factory.
   *
   * @covers \Drupal\ndx_aws_ai\Result\AltTextResult
   */
  public function testAltTextResultDecorative(): void {
    $result = AltTextResult::decorative(
      processingTimeMs: 50.0,
    );

    $this->assertTrue($result->isSuccess());
    $this->assertTrue($result->isDecorative());
    $this->assertEquals('', $result->altText);
  }

  /**
   * Test AltTextResult length guideline check.
   *
   * @covers \Drupal\ndx_aws_ai\Result\AltTextResult
   */
  public function testAltTextResultLengthGuideline(): void {
    $shortResult = AltTextResult::success('Short alt', 90.0, 100.0);
    $this->assertTrue($shortResult->meetsLengthGuideline());

    $longAlt = str_repeat('a', 150);
    $longResult = AltTextResult::success($longAlt, 90.0, 100.0);
    $this->assertFalse($longResult->meetsLengthGuideline());
  }

  /**
   * Test AltTextResult truncation.
   *
   * @covers \Drupal\ndx_aws_ai\Result\AltTextResult
   */
  public function testAltTextResultTruncation(): void {
    $longAlt = str_repeat('a', 150);
    $result = AltTextResult::success($longAlt, 90.0, 100.0);

    $truncated = $result->withTruncatedText(125);

    $this->assertEquals(125, strlen($truncated->altText));
    $this->assertStringEndsWith('...', $truncated->altText);
  }

  /**
   * Test AltTextResult toArray conversion.
   *
   * @covers \Drupal\ndx_aws_ai\Result\AltTextResult
   */
  public function testAltTextResultToArray(): void {
    $result = AltTextResult::success(
      altText: 'Test alt',
      confidence: 95.0,
      processingTimeMs: 100.0,
    );

    $array = $result->toArray();

    $this->assertArrayHasKey('altText', $array);
    $this->assertArrayHasKey('confidence', $array);
    $this->assertArrayHasKey('isSuccess', $array);
    $this->assertArrayHasKey('meetsLengthGuideline', $array);
    $this->assertEquals('Test alt', $array['altText']);
    $this->assertTrue($array['isSuccess']);
  }

}
