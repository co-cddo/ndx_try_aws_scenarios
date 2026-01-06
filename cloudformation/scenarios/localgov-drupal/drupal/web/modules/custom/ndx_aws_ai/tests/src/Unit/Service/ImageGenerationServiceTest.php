<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_aws_ai\Unit\Service;

use Aws\BedrockRuntime\BedrockRuntimeClient;
use Aws\Result;
use Drupal\ndx_aws_ai\Service\AwsClientFactory;
use Drupal\ndx_aws_ai\Service\AwsErrorHandler;
use Drupal\ndx_aws_ai\Service\ImageGenerationService;
use Drupal\ndx_aws_ai\Service\ImageGenerationServiceInterface;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

/**
 * Tests for ImageGenerationService.
 *
 * @coversDefaultClass \Drupal\ndx_aws_ai\Service\ImageGenerationService
 * @group ndx_aws_ai
 */
class ImageGenerationServiceTest extends TestCase {

  /**
   * Mock client factory.
   */
  protected AwsClientFactory $clientFactory;

  /**
   * Mock error handler.
   */
  protected AwsErrorHandler $errorHandler;

  /**
   * Mock logger.
   */
  protected LoggerInterface $logger;

  /**
   * Mock Bedrock client.
   */
  protected BedrockRuntimeClient $bedrockClient;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->clientFactory = $this->createMock(AwsClientFactory::class);
    $this->errorHandler = $this->createMock(AwsErrorHandler::class);
    $this->logger = $this->createMock(LoggerInterface::class);
    $this->bedrockClient = $this->createMock(BedrockRuntimeClient::class);

    // Default: return the mock client.
    $this->clientFactory
      ->method('getBedrockClient')
      ->willReturn($this->bedrockClient);
  }

  /**
   * Creates a service instance with mocked dependencies.
   */
  protected function createService(): ImageGenerationService {
    return new ImageGenerationService(
      $this->clientFactory,
      $this->errorHandler,
      $this->logger,
    );
  }

  /**
   * Tests mapToValidDimensions with exact match.
   *
   * @covers ::mapToValidDimensions
   */
  public function testMapToValidDimensionsExactMatch(): void {
    $service = $this->createService();

    $result = $service->mapToValidDimensions(1024, 1024);
    $this->assertEquals([1024, 1024], $result);

    $result = $service->mapToValidDimensions(768, 768);
    $this->assertEquals([768, 768], $result);
  }

  /**
   * Tests mapToValidDimensions with aspect ratio mapping.
   *
   * @covers ::mapToValidDimensions
   */
  public function testMapToValidDimensionsAspectRatio(): void {
    $service = $this->createService();

    // 16:9 aspect should map to landscape.
    $result = $service->mapToValidDimensions(1920, 1080);
    $this->assertEquals(2, count($result));
    $this->assertGreaterThan($result[1], $result[0]);

    // Portrait aspect.
    $result = $service->mapToValidDimensions(600, 900);
    $this->assertEquals(2, count($result));
    $this->assertLessThan($result[1], $result[0]);

    // Square aspect.
    $result = $service->mapToValidDimensions(500, 500);
    $this->assertEquals(2, count($result));
    $this->assertEquals($result[0], $result[1]);
  }

  /**
   * Tests isAvailable returns true when client available.
   *
   * @covers ::isAvailable
   */
  public function testIsAvailableTrue(): void {
    $this->bedrockClient
      ->method('getConfig')
      ->willReturn(['region' => 'us-east-1']);

    $service = $this->createService();
    $this->assertTrue($service->isAvailable());
  }

  /**
   * Tests isAvailable returns false when client not available.
   *
   * @covers ::isAvailable
   */
  public function testIsAvailableFalse(): void {
    $this->bedrockClient
      ->method('getConfig')
      ->willReturn([]);

    $service = $this->createService();
    $this->assertFalse($service->isAvailable());
  }

  /**
   * Tests generateImage with successful response.
   *
   * @covers ::generateImage
   */
  public function testGenerateImageSuccess(): void {
    $imageBase64 = base64_encode('fake-image-data');

    $awsResult = new Result([
      'body' => json_encode([
        'images' => [$imageBase64],
      ]),
    ]);

    $this->bedrockClient
      ->expects($this->once())
      ->method('invokeModel')
      ->willReturn($awsResult);

    $service = $this->createService();
    $result = $service->generateImage(
      prompt: 'A test image',
      width: 1024,
      height: 1024,
      style: 'photo',
    );

    $this->assertTrue($result->success);
    $this->assertEquals('fake-image-data', $result->imageData);
    $this->assertEquals('image/png', $result->mimeType);
  }

  /**
   * Tests generateImage with API failure.
   *
   * @covers ::generateImage
   */
  public function testGenerateImageFailure(): void {
    $this->bedrockClient
      ->expects($this->once())
      ->method('invokeModel')
      ->willThrowException(new \Exception('API error'));

    $service = $this->createService();
    $result = $service->generateImage(
      prompt: 'A test image',
      width: 1024,
      height: 1024,
      style: 'photo',
    );

    $this->assertFalse($result->success);
    $this->assertNotNull($result->error);
  }

  /**
   * Tests valid dimensions constant.
   *
   * @covers ::VALID_DIMENSIONS
   */
  public function testValidDimensionsConstant(): void {
    $this->assertIsArray(ImageGenerationServiceInterface::VALID_DIMENSIONS);
    $this->assertNotEmpty(ImageGenerationServiceInterface::VALID_DIMENSIONS);

    // Verify 1024x1024 is in the list.
    $this->assertContains([1024, 1024], ImageGenerationServiceInterface::VALID_DIMENSIONS);
  }

  /**
   * Tests model constant.
   *
   * @covers ::MODEL_NOVA_CANVAS
   */
  public function testModelConstant(): void {
    $this->assertEquals(
      'amazon.nova-canvas-v1:0',
      ImageGenerationServiceInterface::MODEL_NOVA_CANVAS
    );
  }

}
