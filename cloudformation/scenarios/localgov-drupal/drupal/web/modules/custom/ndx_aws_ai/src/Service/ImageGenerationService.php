<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Aws\BedrockRuntime\BedrockRuntimeClient;
use Aws\Exception\AwsException;
use Drupal\ndx_aws_ai\Result\ImageGenerationResult;
use Psr\Log\LoggerInterface;

/**
 * Image generation service using Amazon Nova Canvas.
 *
 * Generates images from text prompts using the Nova Canvas model.
 *
 * Story 5.6: Batch Image Generation
 */
class ImageGenerationService implements ImageGenerationServiceInterface {

  /**
   * Maximum retry attempts for throttled requests.
   */
  protected const MAX_RETRIES = 3;

  /**
   * Base delay for exponential backoff in milliseconds.
   */
  protected const BASE_BACKOFF_MS = 1000;

  /**
   * The Bedrock Runtime client (lazy initialized).
   */
  protected ?BedrockRuntimeClient $client = NULL;

  /**
   * Constructs an ImageGenerationService.
   *
   * @param \Drupal\ndx_aws_ai\Service\AwsClientFactory $clientFactory
   *   The AWS client factory.
   * @param \Drupal\ndx_aws_ai\Service\AwsErrorHandler $errorHandler
   *   The AWS error handler.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected AwsClientFactory $clientFactory,
    protected AwsErrorHandler $errorHandler,
    protected LoggerInterface $logger,
  ) {
    // Client is lazy initialized in getClient() to avoid issues during
    // service container initialization and module discovery.
  }

  /**
   * Get the Bedrock client, creating it lazily if needed.
   *
   * @return \Aws\BedrockRuntime\BedrockRuntimeClient
   *   The Bedrock Runtime client.
   */
  protected function getClient(): BedrockRuntimeClient {
    if ($this->client === NULL) {
      $this->client = $this->clientFactory->getBedrockClient();
    }
    return $this->client;
  }

  /**
   * {@inheritdoc}
   */
  public function generateImage(
    string $prompt,
    int $width = 1024,
    int $height = 1024,
    string $style = 'photo',
  ): ImageGenerationResult {
    $startTime = microtime(TRUE);

    // Map to valid dimensions.
    [$validWidth, $validHeight] = $this->mapToValidDimensions($width, $height);

    // Build the full prompt with style prefix.
    $fullPrompt = $this->buildPromptWithStyle($prompt, $style);

    $this->logger->debug('Generating image: @dimensions, style: @style', [
      '@dimensions' => sprintf('%dx%d', $validWidth, $validHeight),
      '@style' => $style,
    ]);

    $attempt = 0;
    $lastException = NULL;

    while ($attempt < self::MAX_RETRIES) {
      try {
        $result = $this->invokeModel($fullPrompt, $validWidth, $validHeight);
        $processingTimeMs = (microtime(TRUE) - $startTime) * 1000;

        $this->logger->info('Image generated successfully: @size bytes in @time ms', [
          '@size' => strlen($result),
          '@time' => round($processingTimeMs),
        ]);

        return ImageGenerationResult::fromSuccess(
          imageData: $result,
          mimeType: 'image/png',
          processingTimeMs: $processingTimeMs,
          width: $validWidth,
          height: $validHeight,
        );
      }
      catch (AwsException $e) {
        $lastException = $e;
        $errorCode = $e->getAwsErrorCode() ?? 'UnknownError';

        if ($this->isRetryable($errorCode) && $attempt < self::MAX_RETRIES - 1) {
          $this->logger->warning('Image generation throttled, retrying (attempt @attempt): @error', [
            '@attempt' => $attempt + 1,
            '@error' => $errorCode,
          ]);
          $this->waitForRetry($attempt);
          $attempt++;
          continue;
        }

        $processingTimeMs = (microtime(TRUE) - $startTime) * 1000;
        $this->logger->error('Image generation failed: @error', [
          '@error' => $e->getMessage(),
        ]);

        return ImageGenerationResult::fromFailure(
          error: $e->getMessage(),
          processingTimeMs: $processingTimeMs,
        );
      }
      catch (\Exception $e) {
        $processingTimeMs = (microtime(TRUE) - $startTime) * 1000;
        $this->logger->error('Image generation error: @error', [
          '@error' => $e->getMessage(),
        ]);

        return ImageGenerationResult::fromFailure(
          error: $e->getMessage(),
          processingTimeMs: $processingTimeMs,
        );
      }
    }

    $processingTimeMs = (microtime(TRUE) - $startTime) * 1000;
    $errorMessage = $lastException?->getMessage() ?? 'Maximum retries exceeded';

    return ImageGenerationResult::fromFailure(
      error: $errorMessage,
      processingTimeMs: $processingTimeMs,
    );
  }

  /**
   * {@inheritdoc}
   */
  public function isAvailable(): bool {
    try {
      // Use getRegion() method - the SDK stores region as 'signing_region'
      // in getConfig() which doesn't include a 'region' key.
      $region = $this->getClient()->getRegion();
      return !empty($region);
    }
    catch (\Exception $e) {
      return FALSE;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function getValidDimensions(): array {
    return self::VALID_DIMENSIONS;
  }

  /**
   * {@inheritdoc}
   */
  public function mapToValidDimensions(int $width, int $height): array {
    // Calculate requested aspect ratio.
    $requestedRatio = $width / max($height, 1);

    $bestMatch = [1024, 1024];
    $bestDiff = PHP_FLOAT_MAX;

    foreach (self::VALID_DIMENSIONS as [$w, $h]) {
      $ratio = $w / $h;
      $diff = abs($requestedRatio - $ratio);

      if ($diff < $bestDiff) {
        $bestDiff = $diff;
        $bestMatch = [$w, $h];
      }
    }

    return $bestMatch;
  }

  /**
   * Invoke the Nova Canvas model.
   *
   * @param string $prompt
   *   The full prompt with style prefix.
   * @param int $width
   *   Image width.
   * @param int $height
   *   Image height.
   *
   * @return string
   *   The raw image data (binary).
   *
   * @throws \Aws\Exception\AwsException
   *   If the API call fails.
   * @throws \RuntimeException
   *   If the response cannot be parsed.
   */
  protected function invokeModel(string $prompt, int $width, int $height): string {
    $body = [
      'taskType' => 'TEXT_IMAGE',
      'textToImageParams' => [
        'text' => $prompt,
      ],
      'imageGenerationConfig' => [
        'numberOfImages' => 1,
        'height' => $height,
        'width' => $width,
        'cfgScale' => self::DEFAULT_CFG_SCALE,
        'quality' => self::DEFAULT_QUALITY,
      ],
    ];

    $request = [
      'modelId' => self::MODEL_NOVA_CANVAS,
      'contentType' => 'application/json',
      'accept' => 'application/json',
      'body' => json_encode($body),
    ];

    $response = $this->getClient()->invokeModel($request);

    // Parse response - handle PSR-7 StreamInterface from Guzzle.
    $responseBody = $response['body'] ?? '';
    if ($responseBody instanceof \Psr\Http\Message\StreamInterface) {
      $responseBody = (string) $responseBody;
    }
    elseif (is_resource($responseBody)) {
      $responseBody = stream_get_contents($responseBody);
    }

    $data = json_decode($responseBody, TRUE);

    if (json_last_error() !== JSON_ERROR_NONE) {
      throw new \RuntimeException('Failed to parse image generation response: ' . json_last_error_msg());
    }

    if (empty($data['images'][0])) {
      throw new \RuntimeException('No image data in response');
    }

    // Decode base64 image.
    $imageData = base64_decode($data['images'][0], TRUE);

    if ($imageData === FALSE) {
      throw new \RuntimeException('Failed to decode base64 image data');
    }

    return $imageData;
  }

  /**
   * Build prompt with style prefix.
   *
   * @param string $prompt
   *   The base prompt.
   * @param string $style
   *   The style hint.
   *
   * @return string
   *   The prompt with style prefix.
   */
  protected function buildPromptWithStyle(string $prompt, string $style): string {
    $prefix = match ($style) {
      'photo' => 'Photorealistic photograph, high quality, professional photography, natural lighting,',
      'illustration' => 'Digital illustration, clean modern design, professional artwork,',
      'icon' => 'Simple flat icon, minimal design, vector style, solid colors,',
      default => '',
    };

    if ($prefix !== '') {
      return $prefix . ' ' . $prompt;
    }

    return $prompt;
  }

  /**
   * Check if an error code is retryable.
   *
   * @param string $errorCode
   *   The AWS error code.
   *
   * @return bool
   *   TRUE if the error is retryable.
   */
  protected function isRetryable(string $errorCode): bool {
    $retryableCodes = [
      'ThrottlingException',
      'TooManyRequestsException',
      'ServiceUnavailable',
      'ServiceUnavailableException',
      'InternalServerError',
      'InternalServerException',
    ];

    return in_array($errorCode, $retryableCodes, TRUE);
  }

  /**
   * Wait for retry with exponential backoff.
   *
   * @param int $attempt
   *   The current attempt number (0-based).
   */
  protected function waitForRetry(int $attempt): void {
    $delayMs = self::BASE_BACKOFF_MS * (int) pow(2, $attempt);
    // Add jitter (0-25%).
    $jitter = (int) ($delayMs * (mt_rand(0, 25) / 100));
    usleep(($delayMs + $jitter) * 1000);
  }

}
