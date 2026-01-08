<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_aws_ai\Unit;

use Aws\BedrockRuntime\BedrockRuntimeClient;
use Aws\Result;
use Drupal\ndx_aws_ai\RateLimiter\VisionRateLimiter;
use Drupal\ndx_aws_ai\Result\ImageAnalysisResult;
use Drupal\ndx_aws_ai\Service\AwsClientFactory;
use Drupal\ndx_aws_ai\Service\AwsErrorHandler;
use Drupal\ndx_aws_ai\Service\VisionService;
use Drupal\ndx_aws_ai\Service\VisionServiceInterface;
use PHPUnit\Framework\TestCase;
use Prophecy\Argument;
use Prophecy\PhpUnit\ProphecyTrait;

/**
 * Unit tests for VisionService.
 *
 * @coversDefaultClass \Drupal\ndx_aws_ai\Service\VisionService
 * @group ndx_aws_ai
 *
 * Story 4.3: Nova 2 Omni Vision Service
 */
class VisionServiceTest extends TestCase {

  use ProphecyTrait;

  /**
   * The mocked Bedrock client.
   *
   * @var \Aws\BedrockRuntime\BedrockRuntimeClient|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $bedrockClient;

  /**
   * The mocked client factory.
   *
   * @var \Drupal\ndx_aws_ai\Service\AwsClientFactory|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $clientFactory;

  /**
   * The mocked error handler.
   *
   * @var \Drupal\ndx_aws_ai\Service\AwsErrorHandler|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $errorHandler;

  /**
   * The mocked rate limiter.
   *
   * @var \Drupal\ndx_aws_ai\RateLimiter\VisionRateLimiter|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $rateLimiter;

  /**
   * The service under test.
   *
   * @var \Drupal\ndx_aws_ai\Service\VisionService
   */
  protected VisionService $service;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->bedrockClient = $this->prophesize(BedrockRuntimeClient::class);
    $this->clientFactory = $this->prophesize(AwsClientFactory::class);
    $this->errorHandler = $this->prophesize(AwsErrorHandler::class);
    $this->rateLimiter = $this->prophesize(VisionRateLimiter::class);

    // Configure client factory to return mocked Bedrock client.
    $this->clientFactory->getBedrockClient()
      ->willReturn($this->bedrockClient->reveal());

    // Configure rate limiter defaults.
    $this->rateLimiter->waitIfNeeded()->willReturn(NULL);
    $this->rateLimiter->recordSuccess()->willReturn(NULL);
    $this->rateLimiter->getMaxRetries()->willReturn(3);

    $this->service = new VisionService(
      $this->clientFactory->reveal(),
      $this->errorHandler->reveal(),
      $this->rateLimiter->reveal(),
    );
  }

  /**
   * Test successful image analysis.
   *
   * @covers ::analyzeImage
   */
  public function testAnalyzeImageSuccess(): void {
    $imageData = base64_encode('fake-image-data');
    $mimeType = 'image/jpeg';
    $description = 'A photo of a city council meeting with people seated around a table.';

    $this->errorHandler->logOperation('Vision', 'analyzeImage', Argument::that(function ($arg) {
      return $arg['model'] === 'amazon.nova-pro-v1:0'
        && $arg['format'] === 'jpeg'
        && $arg['isAppropriate'] === TRUE
        && isset($arg['processingTimeMs']);
    }))->shouldBeCalled();

    $this->bedrockClient->converse([
      'modelId' => 'amazon.nova-pro-v1:0',
      'messages' => $this->buildExpectedMessages($imageData, 'jpeg', FALSE),
      'inferenceConfig' => [
        'maxTokens' => 1024,
        'temperature' => 0.3,
      ],
      'system' => [
        ['text' => $this->getAnalysisSystemPrompt()],
      ],
    ])->willReturn(new Result([
      'stopReason' => 'end_turn',
      'output' => [
        'message' => [
          'content' => [
            ['text' => $description],
          ],
        ],
      ],
    ]));

    $result = $this->service->analyzeImage($imageData, $mimeType, TRUE);

    $this->assertInstanceOf(ImageAnalysisResult::class, $result);
    $this->assertTrue($result->isSuccess());
    $this->assertTrue($result->isAppropriate);
    $this->assertEquals($description, $result->description);
    $this->assertNull($result->altText);
    $this->assertNull($result->moderationReason);
    $this->assertGreaterThan(0, $result->processingTimeMs);
  }

  /**
   * Test alt-text generation.
   *
   * @covers ::generateAltText
   */
  public function testGenerateAltTextSuccess(): void {
    $imageData = base64_encode('fake-image-data');
    $mimeType = 'image/png';
    $altText = 'Council members discussing planning application at town hall meeting';

    $this->errorHandler->logOperation('Vision', 'generateAltText', Argument::that(function ($arg) {
      return $arg['model'] === 'amazon.nova-lite-v1:0'
        && $arg['format'] === 'png'
        && $arg['isAppropriate'] === TRUE
        && isset($arg['processingTimeMs']);
    }))->shouldBeCalled();

    $this->bedrockClient->converse([
      'modelId' => 'amazon.nova-lite-v1:0',
      'messages' => $this->buildExpectedMessages($imageData, 'png', TRUE),
      'inferenceConfig' => [
        'maxTokens' => 256,
        'temperature' => 0.3,
      ],
    ])->willReturn(new Result([
      'stopReason' => 'end_turn',
      'output' => [
        'message' => [
          'content' => [
            ['text' => $altText],
          ],
        ],
      ],
    ]));

    $result = $this->service->generateAltText($imageData, $mimeType, TRUE);

    $this->assertTrue($result->isSuccess());
    $this->assertTrue($result->hasAltText());
    $this->assertEquals($altText, $result->altText);
    $this->assertEquals($altText, $result->description);
  }

  /**
   * Test alt-text truncation.
   *
   * @covers ::generateAltText
   */
  public function testGenerateAltTextTruncation(): void {
    $imageData = base64_encode('fake-image-data');
    $mimeType = 'image/jpeg';
    // Create a very long alt text that exceeds 125 characters.
    $longAltText = 'This is a very detailed description of the image that contains way more than one hundred and twenty five characters which is the maximum allowed for WCAG compliant alt text generation by our service.';

    $this->errorHandler->logOperation('Vision', 'generateAltText', Argument::that(function ($arg) {
      return $arg['model'] === 'amazon.nova-lite-v1:0'
        && $arg['format'] === 'jpeg'
        && $arg['isAppropriate'] === TRUE
        && isset($arg['processingTimeMs']);
    }))->shouldBeCalled();

    $this->bedrockClient->converse([
      'modelId' => 'amazon.nova-lite-v1:0',
      'messages' => $this->buildExpectedMessages($imageData, 'jpeg', TRUE),
      'inferenceConfig' => [
        'maxTokens' => 256,
        'temperature' => 0.3,
      ],
    ])->willReturn(new Result([
      'stopReason' => 'end_turn',
      'output' => [
        'message' => [
          'content' => [
            ['text' => $longAltText],
          ],
        ],
      ],
    ]));

    $result = $this->service->generateAltText($imageData, $mimeType, TRUE);

    $this->assertTrue($result->hasAltText());
    $this->assertLessThanOrEqual(VisionServiceInterface::MAX_ALT_TEXT_LENGTH, mb_strlen($result->altText));
    $this->assertStringEndsWith('...', $result->altText);
  }

  /**
   * Test content moderation - filtered content.
   *
   * @covers ::analyzeImage
   */
  public function testContentModerationFiltered(): void {
    $imageData = base64_encode('fake-image-data');
    $mimeType = 'image/jpeg';

    $this->errorHandler->logOperation('Vision', 'analyzeImage', Argument::that(function ($arg) {
      return $arg['model'] === 'amazon.nova-pro-v1:0'
        && $arg['format'] === 'jpeg'
        && $arg['isAppropriate'] === FALSE
        && isset($arg['processingTimeMs']);
    }))->shouldBeCalled();

    $this->bedrockClient->converse([
      'modelId' => 'amazon.nova-pro-v1:0',
      'messages' => $this->buildExpectedMessages($imageData, 'jpeg', FALSE),
      'inferenceConfig' => [
        'maxTokens' => 1024,
        'temperature' => 0.3,
      ],
      'system' => [
        ['text' => $this->getAnalysisSystemPrompt()],
      ],
    ])->willReturn(new Result([
      'stopReason' => 'content_filtered',
      'output' => [
        'message' => [
          'content' => [],
        ],
      ],
    ]));

    $result = $this->service->analyzeImage($imageData, $mimeType, TRUE);

    $this->assertFalse($result->isSuccess());
    $this->assertFalse($result->isAppropriate);
    $this->assertEquals(ImageAnalysisResult::MODERATION_FILTERED, $result->moderationReason);
    $this->assertEquals('', $result->description);
  }

  /**
   * Test content moderation - inappropriate content detected in text.
   *
   * @covers ::analyzeImage
   */
  public function testContentModerationInappropriateText(): void {
    $imageData = base64_encode('fake-image-data');
    $mimeType = 'image/jpeg';

    $this->errorHandler->logOperation('Vision', 'analyzeImage', Argument::that(function ($arg) {
      return $arg['model'] === 'amazon.nova-pro-v1:0'
        && $arg['format'] === 'jpeg'
        && $arg['isAppropriate'] === FALSE
        && isset($arg['processingTimeMs']);
    }))->shouldBeCalled();

    $this->bedrockClient->converse([
      'modelId' => 'amazon.nova-pro-v1:0',
      'messages' => $this->buildExpectedMessages($imageData, 'jpeg', FALSE),
      'inferenceConfig' => [
        'maxTokens' => 1024,
        'temperature' => 0.3,
      ],
      'system' => [
        ['text' => $this->getAnalysisSystemPrompt()],
      ],
    ])->willReturn(new Result([
      'stopReason' => 'end_turn',
      'output' => [
        'message' => [
          'content' => [
            ['text' => 'I cannot describe this image due to inappropriate content.'],
          ],
        ],
      ],
    ]));

    $result = $this->service->analyzeImage($imageData, $mimeType, TRUE);

    $this->assertFalse($result->isSuccess());
    $this->assertFalse($result->isAppropriate);
    $this->assertEquals(ImageAnalysisResult::MODERATION_INAPPROPRIATE, $result->moderationReason);
  }

  /**
   * Test unsupported format throws exception.
   *
   * @covers ::analyzeImage
   */
  public function testUnsupportedFormatThrowsException(): void {
    $imageData = base64_encode('fake-image-data');
    $mimeType = 'image/bmp';

    $this->expectException(\InvalidArgumentException::class);
    $this->expectExceptionMessage('Unsupported image format: image/bmp');

    $this->service->analyzeImage($imageData, $mimeType, TRUE);
  }

  /**
   * Test file too large throws exception.
   *
   * @covers ::analyzeImage
   */
  public function testFileTooLargeThrowsException(): void {
    // Create data larger than 5MB (base64 encoded).
    // 5MB binary = ~6.67MB base64.
    $largeData = str_repeat('x', 8 * 1024 * 1024);
    $mimeType = 'image/jpeg';

    $this->expectException(\InvalidArgumentException::class);
    $this->expectExceptionMessage('File size exceeds maximum of 5MB');

    $this->service->analyzeImage($largeData, $mimeType, TRUE);
  }

  /**
   * Test supported format validation.
   *
   * @covers ::isSupportedFormat
   * @dataProvider supportedFormatProvider
   */
  public function testIsSupportedFormat(string $mimeType, bool $expected): void {
    $this->assertEquals($expected, $this->service->isSupportedFormat($mimeType));
  }

  /**
   * Data provider for format validation tests.
   */
  public static function supportedFormatProvider(): array {
    return [
      'jpeg' => ['image/jpeg', TRUE],
      'jpg' => ['image/jpg', TRUE],
      'png' => ['image/png', TRUE],
      'webp' => ['image/webp', TRUE],
      'gif' => ['image/gif', FALSE],
      'bmp' => ['image/bmp', FALSE],
      'svg' => ['image/svg+xml', FALSE],
      'tiff' => ['image/tiff', FALSE],
    ];
  }

  /**
   * Test file size validation.
   *
   * @covers ::isValidFileSize
   * @dataProvider fileSizeProvider
   */
  public function testIsValidFileSize(int $size, bool $expected): void {
    $this->assertEquals($expected, $this->service->isValidFileSize($size));
  }

  /**
   * Data provider for file size validation tests.
   */
  public static function fileSizeProvider(): array {
    return [
      'zero' => [0, FALSE],
      'negative' => [-1, FALSE],
      'small' => [1024, TRUE],
      '1mb' => [1024 * 1024, TRUE],
      '5mb' => [5 * 1024 * 1024, TRUE],
      'over_5mb' => [5 * 1024 * 1024 + 1, FALSE],
      'large' => [10 * 1024 * 1024, FALSE],
    ];
  }

  /**
   * Test getSupportedFormats returns correct formats.
   *
   * @covers ::getSupportedFormats
   */
  public function testGetSupportedFormats(): void {
    $formats = $this->service->getSupportedFormats();

    $this->assertIsArray($formats);
    $this->assertArrayHasKey('image/jpeg', $formats);
    $this->assertArrayHasKey('image/png', $formats);
    $this->assertArrayHasKey('image/webp', $formats);
    $this->assertEquals('jpeg', $formats['image/jpeg']);
    $this->assertEquals('png', $formats['image/png']);
    $this->assertEquals('webp', $formats['image/webp']);
  }

  /**
   * Test isAvailable returns true when configured.
   *
   * @covers ::isAvailable
   */
  public function testIsAvailableTrue(): void {
    $this->bedrockClient->getConfig()
      ->willReturn(['region' => 'us-east-1']);

    $this->assertTrue($this->service->isAvailable());
  }

  /**
   * Test isAvailable returns false when not configured.
   *
   * @covers ::isAvailable
   */
  public function testIsAvailableFalseNoRegion(): void {
    $this->bedrockClient->getConfig()
      ->willReturn(['region' => '']);

    $this->assertFalse($this->service->isAvailable());
  }

  /**
   * Test ImageAnalysisResult value object.
   *
   * @covers \Drupal\ndx_aws_ai\Result\ImageAnalysisResult
   */
  public function testImageAnalysisResultFromSuccess(): void {
    $result = ImageAnalysisResult::fromSuccess(
      description: 'A council meeting',
      processingTimeMs: 1500.5,
      altText: 'Council meeting',
      extendedDescription: 'A detailed view of the council meeting room.',
    );

    $this->assertTrue($result->isSuccess());
    $this->assertTrue($result->isAppropriate);
    $this->assertTrue($result->hasAltText());
    $this->assertTrue($result->hasExtendedDescription());
    $this->assertEquals('A council meeting', $result->description);
    $this->assertEquals('Council meeting', $result->altText);
    $this->assertEquals('A detailed view of the council meeting room.', $result->extendedDescription);
    $this->assertEquals(1500.5, $result->processingTimeMs);
    $this->assertEquals(1.5005, $result->getProcessingTimeSeconds());
    $this->assertNull($result->moderationReason);
  }

  /**
   * Test ImageAnalysisResult fromModeration factory.
   *
   * @covers \Drupal\ndx_aws_ai\Result\ImageAnalysisResult
   */
  public function testImageAnalysisResultFromModeration(): void {
    $result = ImageAnalysisResult::fromModeration(
      reason: ImageAnalysisResult::MODERATION_INAPPROPRIATE,
      processingTimeMs: 500.0,
    );

    $this->assertFalse($result->isSuccess());
    $this->assertFalse($result->isAppropriate);
    $this->assertFalse($result->hasAltText());
    $this->assertFalse($result->hasExtendedDescription());
    $this->assertEquals('', $result->description);
    $this->assertNull($result->altText);
    $this->assertEquals(ImageAnalysisResult::MODERATION_INAPPROPRIATE, $result->moderationReason);
  }

  /**
   * Test getAccessibleText returns alt text when available.
   *
   * @covers \Drupal\ndx_aws_ai\Result\ImageAnalysisResult::getAccessibleText
   */
  public function testGetAccessibleTextWithAltText(): void {
    $result = ImageAnalysisResult::fromSuccess(
      description: 'A very long description that would need truncation',
      processingTimeMs: 100.0,
      altText: 'Short alt text',
    );

    $this->assertEquals('Short alt text', $result->getAccessibleText());
  }

  /**
   * Test getAccessibleText falls back to truncated description.
   *
   * @covers \Drupal\ndx_aws_ai\Result\ImageAnalysisResult::getAccessibleText
   */
  public function testGetAccessibleTextFallbackToDescription(): void {
    $longDescription = str_repeat('A council meeting with various participants discussing important matters. ', 5);
    $result = ImageAnalysisResult::fromSuccess(
      description: $longDescription,
      processingTimeMs: 100.0,
    );

    $accessibleText = $result->getAccessibleText(125);
    $this->assertLessThanOrEqual(125, mb_strlen($accessibleText));
    $this->assertStringEndsWith('...', $accessibleText);
  }

  /**
   * Test getAccessibleText returns empty for moderated content.
   *
   * @covers \Drupal\ndx_aws_ai\Result\ImageAnalysisResult::getAccessibleText
   */
  public function testGetAccessibleTextForModeratedContent(): void {
    $result = ImageAnalysisResult::fromModeration(
      reason: ImageAnalysisResult::MODERATION_FILTERED,
      processingTimeMs: 100.0,
    );

    $this->assertEquals('', $result->getAccessibleText());
  }

  /**
   * Test empty response handling.
   *
   * @covers ::analyzeImage
   */
  public function testEmptyResponseHandling(): void {
    $imageData = base64_encode('fake-image-data');
    $mimeType = 'image/jpeg';

    $this->errorHandler->logOperation('Vision', 'analyzeImage', Argument::that(function ($arg) {
      return $arg['model'] === 'amazon.nova-pro-v1:0'
        && $arg['format'] === 'jpeg'
        && $arg['isAppropriate'] === TRUE
        && isset($arg['processingTimeMs']);
    }))->shouldBeCalled();

    $this->bedrockClient->converse([
      'modelId' => 'amazon.nova-pro-v1:0',
      'messages' => $this->buildExpectedMessages($imageData, 'jpeg', FALSE),
      'inferenceConfig' => [
        'maxTokens' => 1024,
        'temperature' => 0.3,
      ],
      'system' => [
        ['text' => $this->getAnalysisSystemPrompt()],
      ],
    ])->willReturn(new Result([
      'stopReason' => 'end_turn',
      'output' => [
        'message' => [
          'content' => [],
        ],
      ],
    ]));

    $result = $this->service->analyzeImage($imageData, $mimeType, TRUE);

    // Empty response should still be appropriate but not successful.
    $this->assertTrue($result->isAppropriate);
    $this->assertFalse($result->isSuccess());
    $this->assertEquals('', $result->description);
  }

  /**
   * Test WebP format support.
   *
   * @covers ::analyzeImage
   */
  public function testWebpFormatSupport(): void {
    $imageData = base64_encode('fake-webp-data');
    $mimeType = 'image/webp';
    $description = 'A WebP image of council buildings.';

    $this->errorHandler->logOperation('Vision', 'analyzeImage', Argument::that(function ($arg) {
      return $arg['model'] === 'amazon.nova-pro-v1:0'
        && $arg['format'] === 'webp'
        && $arg['isAppropriate'] === TRUE
        && isset($arg['processingTimeMs']);
    }))->shouldBeCalled();

    $this->bedrockClient->converse([
      'modelId' => 'amazon.nova-pro-v1:0',
      'messages' => $this->buildExpectedMessages($imageData, 'webp', FALSE),
      'inferenceConfig' => [
        'maxTokens' => 1024,
        'temperature' => 0.3,
      ],
      'system' => [
        ['text' => $this->getAnalysisSystemPrompt()],
      ],
    ])->willReturn(new Result([
      'stopReason' => 'end_turn',
      'output' => [
        'message' => [
          'content' => [
            ['text' => $description],
          ],
        ],
      ],
    ]));

    $result = $this->service->analyzeImage($imageData, $mimeType, TRUE);

    $this->assertTrue($result->isSuccess());
    $this->assertEquals($description, $result->description);
  }

  /**
   * Build expected message structure for assertions.
   *
   * @param string $imageBase64
   *   Base64-encoded image data.
   * @param string $format
   *   Image format.
   * @param bool $isAltText
   *   Whether this is an alt-text request.
   *
   * @return array
   *   Expected messages array.
   */
  protected function buildExpectedMessages(string $imageBase64, string $format, bool $isAltText): array {
    $prompt = $isAltText ? $this->getAltTextPrompt() : $this->getDescriptionPrompt();

    return [
      [
        'role' => 'user',
        'content' => [
          [
            'image' => [
              'format' => $format,
              'source' => [
                'bytes' => base64_decode($imageBase64),
              ],
            ],
          ],
          ['text' => $prompt],
        ],
      ],
    ];
  }

  /**
   * Get the analysis system prompt.
   */
  protected function getAnalysisSystemPrompt(): string {
    return <<<'PROMPT'
You are an expert image analyst. Provide clear, accurate descriptions of images.
Focus on:
1. Main subjects and their actions
2. Setting and context
3. Important details and text visible in the image
4. Colors, composition, and visual elements

Be objective and factual. Do not speculate about things not visible in the image.
If you detect any inappropriate, harmful, or sensitive content, clearly indicate this.
PROMPT;
  }

  /**
   * Get the alt-text prompt.
   */
  protected function getAltTextPrompt(): string {
    return <<<'PROMPT'
Analyze this image and generate concise alt-text following WCAG 2.2 AA guidelines:

1. Be specific and succinct (aim for 125 characters or less)
2. Describe the content and function, not the appearance
3. Don't start with "Image of" or "Picture of"
4. Include relevant text that appears in the image
5. For decorative images, indicate if purely decorative
6. For complex images (charts, diagrams), provide brief summary

Focus on what a screen reader user needs to understand the image's purpose in context.

Respond with ONLY the alt-text, nothing else.
PROMPT;
  }

  /**
   * Get the description prompt.
   */
  protected function getDescriptionPrompt(): string {
    return <<<'PROMPT'
Describe this image in detail. Include:
- What is the main subject or focus?
- What is happening in the image?
- What is the setting or background?
- Are there any people, and what are they doing?
- Is there any text visible in the image?
- What colors and visual elements are prominent?

Provide a comprehensive but clear description suitable for someone who cannot see the image.
PROMPT;
  }

}
