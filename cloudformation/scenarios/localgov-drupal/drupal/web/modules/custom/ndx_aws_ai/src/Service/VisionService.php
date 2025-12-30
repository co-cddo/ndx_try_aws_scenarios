<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Aws\BedrockRuntime\BedrockRuntimeClient;
use Aws\Exception\AwsException;
use Drupal\ndx_aws_ai\Exception\AwsServiceException;
use Drupal\ndx_aws_ai\RateLimiter\VisionRateLimiter;
use Drupal\ndx_aws_ai\Result\ImageAnalysisResult;

/**
 * Nova 2 Omni vision service for image analysis and alt-text generation.
 *
 * Uses Amazon Bedrock Nova models to analyze images and generate
 * WCAG-compliant accessibility descriptions.
 *
 * Story 4.3: Nova 2 Omni Vision Service
 */
class VisionService implements VisionServiceInterface {

  /**
   * The model ID for Nova Lite (fastest, good for alt-text).
   */
  protected const MODEL_NOVA_LITE = 'amazon.nova-lite-v1:0';

  /**
   * The model ID for Nova Pro (higher quality descriptions).
   */
  protected const MODEL_NOVA_PRO = 'amazon.nova-pro-v1:0';

  /**
   * System prompt for general image analysis.
   */
  protected const ANALYSIS_SYSTEM_PROMPT = <<<'PROMPT'
You are an expert image analyst. Provide clear, accurate descriptions of images.
Focus on:
1. Main subjects and their actions
2. Setting and context
3. Important details and text visible in the image
4. Colors, composition, and visual elements

Be objective and factual. Do not speculate about things not visible in the image.
If you detect any inappropriate, harmful, or sensitive content, clearly indicate this.
PROMPT;

  /**
   * Prompt template for WCAG alt-text generation.
   */
  protected const ALT_TEXT_PROMPT = <<<'PROMPT'
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

  /**
   * Prompt template for detailed image description.
   */
  protected const DESCRIPTION_PROMPT = <<<'PROMPT'
Describe this image in detail. Include:
- What is the main subject or focus?
- What is happening in the image?
- What is the setting or background?
- Are there any people, and what are they doing?
- Is there any text visible in the image?
- What colors and visual elements are prominent?

Provide a comprehensive but clear description suitable for someone who cannot see the image.
PROMPT;

  /**
   * The Bedrock Runtime client.
   */
  protected BedrockRuntimeClient $client;

  /**
   * Constructs a VisionService.
   *
   * @param \Drupal\ndx_aws_ai\Service\AwsClientFactory $clientFactory
   *   The AWS client factory.
   * @param \Drupal\ndx_aws_ai\Service\AwsErrorHandler $errorHandler
   *   The AWS error handler.
   * @param \Drupal\ndx_aws_ai\RateLimiter\VisionRateLimiter $rateLimiter
   *   The rate limiter for API calls.
   */
  public function __construct(
    protected AwsClientFactory $clientFactory,
    protected AwsErrorHandler $errorHandler,
    protected VisionRateLimiter $rateLimiter,
  ) {
    $this->client = $this->clientFactory->getBedrockClient();
  }

  /**
   * {@inheritdoc}
   */
  public function analyzeImage(string $imageData, string $mimeType, bool $isBase64 = FALSE): ImageAnalysisResult {
    $this->validateFormat($mimeType);

    // Convert to base64 if needed.
    $base64Data = $isBase64 ? $imageData : base64_encode($imageData);

    // Validate file size (base64 is ~33% larger).
    $binarySize = $isBase64 ? (int) (strlen($imageData) * 0.75) : strlen($imageData);
    $this->validateFileSize($binarySize);

    return $this->invokeVisionModel(
      imageBase64: $base64Data,
      mimeType: $mimeType,
      prompt: self::DESCRIPTION_PROMPT,
      systemPrompt: self::ANALYSIS_SYSTEM_PROMPT,
      generateAltText: FALSE,
    );
  }

  /**
   * {@inheritdoc}
   */
  public function analyzeImageFromFile(string $filePath): ImageAnalysisResult {
    $this->validateFile($filePath);
    $mimeType = $this->getMimeType($filePath);
    $imageData = file_get_contents($filePath);

    if ($imageData === FALSE) {
      throw new \InvalidArgumentException("Unable to read file: {$filePath}");
    }

    return $this->analyzeImage($imageData, $mimeType, FALSE);
  }

  /**
   * {@inheritdoc}
   */
  public function generateAltText(string $imageData, string $mimeType, bool $isBase64 = FALSE): ImageAnalysisResult {
    $this->validateFormat($mimeType);

    // Convert to base64 if needed.
    $base64Data = $isBase64 ? $imageData : base64_encode($imageData);

    // Validate file size (base64 is ~33% larger).
    $binarySize = $isBase64 ? (int) (strlen($imageData) * 0.75) : strlen($imageData);
    $this->validateFileSize($binarySize);

    return $this->invokeVisionModel(
      imageBase64: $base64Data,
      mimeType: $mimeType,
      prompt: self::ALT_TEXT_PROMPT,
      systemPrompt: NULL,
      generateAltText: TRUE,
    );
  }

  /**
   * {@inheritdoc}
   */
  public function generateAltTextFromFile(string $filePath): ImageAnalysisResult {
    $this->validateFile($filePath);
    $mimeType = $this->getMimeType($filePath);
    $imageData = file_get_contents($filePath);

    if ($imageData === FALSE) {
      throw new \InvalidArgumentException("Unable to read file: {$filePath}");
    }

    return $this->generateAltText($imageData, $mimeType, FALSE);
  }

  /**
   * {@inheritdoc}
   */
  public function isSupportedFormat(string $mimeType): bool {
    return isset(self::SUPPORTED_FORMATS[$mimeType]);
  }

  /**
   * {@inheritdoc}
   */
  public function isValidFileSize(int $sizeInBytes): bool {
    return $sizeInBytes > 0 && $sizeInBytes <= self::MAX_FILE_SIZE;
  }

  /**
   * {@inheritdoc}
   */
  public function getSupportedFormats(): array {
    return self::SUPPORTED_FORMATS;
  }

  /**
   * {@inheritdoc}
   */
  public function isAvailable(): bool {
    try {
      $config = $this->client->getConfig();
      return !empty($config['region']);
    }
    catch (\Exception $e) {
      return FALSE;
    }
  }

  /**
   * Invoke the Bedrock vision model.
   *
   * @param string $imageBase64
   *   Base64-encoded image data.
   * @param string $mimeType
   *   The image MIME type.
   * @param string $prompt
   *   The prompt to send with the image.
   * @param string|null $systemPrompt
   *   Optional system prompt.
   * @param bool $generateAltText
   *   TRUE if generating alt-text (affects response processing).
   *
   * @return \Drupal\ndx_aws_ai\Result\ImageAnalysisResult
   *   The analysis result.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails after retries.
   */
  protected function invokeVisionModel(
    string $imageBase64,
    string $mimeType,
    string $prompt,
    ?string $systemPrompt,
    bool $generateAltText,
  ): ImageAnalysisResult {
    $startTime = microtime(TRUE);
    $operation = $generateAltText ? 'generateAltText' : 'analyzeImage';

    // Map MIME type to Bedrock format.
    $format = self::SUPPORTED_FORMATS[$mimeType] ?? 'jpeg';

    // Build the message with image and text.
    $messages = [
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

    $modelId = $generateAltText ? self::MODEL_NOVA_LITE : self::MODEL_NOVA_PRO;
    $request = [
      'modelId' => $modelId,
      'messages' => $messages,
      'inferenceConfig' => [
        'maxTokens' => $generateAltText ? 256 : 1024,
        'temperature' => 0.3,
      ],
    ];

    if ($systemPrompt !== NULL) {
      $request['system'] = [
        ['text' => $systemPrompt],
      ];
    }

    $attempt = 0;
    $lastException = NULL;

    while ($attempt < $this->rateLimiter->getMaxRetries()) {
      try {
        $this->rateLimiter->waitIfNeeded();
        $result = $this->client->converse($request);
        $this->rateLimiter->recordSuccess();

        $processingTimeMs = (microtime(TRUE) - $startTime) * 1000;

        $analysisResult = $this->parseResponse($result, $processingTimeMs, $generateAltText);

        // Log successful operation with performance metrics.
        $this->errorHandler->logOperation('Vision', $operation, [
          'model' => $modelId,
          'format' => $format,
          'processingTimeMs' => round($processingTimeMs, 2),
          'isAppropriate' => $analysisResult->isAppropriate,
        ]);

        return $analysisResult;

      }
      catch (AwsException $e) {
        $lastException = $e;
        $errorCode = $e->getAwsErrorCode() ?? 'UnknownError';

        if ($this->rateLimiter->isRetryable($errorCode) && $attempt < $this->rateLimiter->getMaxRetries() - 1) {
          $this->errorHandler->logRetry('Vision', $operation, $attempt + 1, $errorCode);
          $this->rateLimiter->recordFailure();
          $this->rateLimiter->waitForRetry($attempt);
          $attempt++;
          continue;
        }

        throw $this->errorHandler->handleException($e, 'Vision', $operation);
      }
    }

    if ($lastException !== NULL) {
      throw $this->errorHandler->handleException($lastException, 'Vision', $operation);
    }

    throw new AwsServiceException(
      message: 'Maximum retries exceeded',
      awsErrorCode: 'MaxRetriesExceeded',
      awsService: 'Vision',
      userMessage: 'The image analysis service is currently unavailable. Please try again later.',
    );
  }

  /**
   * Parse the Bedrock API response.
   *
   * @param \Aws\Result $result
   *   The API response.
   * @param float $processingTimeMs
   *   Processing time in milliseconds.
   * @param bool $generateAltText
   *   TRUE if this was an alt-text generation request.
   *
   * @return \Drupal\ndx_aws_ai\Result\ImageAnalysisResult
   *   The parsed result.
   */
  protected function parseResponse($result, float $processingTimeMs, bool $generateAltText): ImageAnalysisResult {
    // Check for content filtering.
    $stopReason = $result['stopReason'] ?? '';
    if ($stopReason === 'content_filtered') {
      return ImageAnalysisResult::fromModeration(
        reason: ImageAnalysisResult::MODERATION_FILTERED,
        processingTimeMs: $processingTimeMs,
      );
    }

    // Extract text content from response.
    $output = $result['output'] ?? [];
    $message = $output['message'] ?? [];
    $content = $message['content'] ?? [];

    $text = '';
    foreach ($content as $block) {
      if (isset($block['text'])) {
        $text .= $block['text'];
      }
    }

    $text = trim($text);

    // Check for moderation indicators in the text.
    if ($this->containsModerationFlags($text)) {
      return ImageAnalysisResult::fromModeration(
        reason: ImageAnalysisResult::MODERATION_INAPPROPRIATE,
        processingTimeMs: $processingTimeMs,
      );
    }

    if ($generateAltText) {
      // For alt-text, truncate to max length if needed.
      $altText = $this->truncateAltText($text);
      return ImageAnalysisResult::fromSuccess(
        description: $text,
        processingTimeMs: $processingTimeMs,
        altText: $altText,
      );
    }

    return ImageAnalysisResult::fromSuccess(
      description: $text,
      processingTimeMs: $processingTimeMs,
    );
  }

  /**
   * Check if response text contains moderation flags.
   *
   * @param string $text
   *   The response text.
   *
   * @return bool
   *   TRUE if moderation flags detected.
   */
  protected function containsModerationFlags(string $text): bool {
    $moderationPhrases = [
      'I cannot describe this image',
      'I am unable to process this image',
      'This image contains inappropriate content',
      'This image appears to contain harmful content',
      'I cannot provide a description of this content',
    ];

    $lowerText = strtolower($text);
    foreach ($moderationPhrases as $phrase) {
      if (str_contains($lowerText, strtolower($phrase))) {
        return TRUE;
      }
    }

    return FALSE;
  }

  /**
   * Truncate alt-text to maximum allowed length.
   *
   * @param string $text
   *   The text to truncate.
   *
   * @return string
   *   Truncated text.
   */
  protected function truncateAltText(string $text): string {
    if (mb_strlen($text) <= self::MAX_ALT_TEXT_LENGTH) {
      return $text;
    }

    // Find last space before the limit to avoid cutting words.
    $truncated = mb_substr($text, 0, self::MAX_ALT_TEXT_LENGTH - 3);
    $lastSpace = mb_strrpos($truncated, ' ');

    if ($lastSpace !== FALSE && $lastSpace > self::MAX_ALT_TEXT_LENGTH / 2) {
      $truncated = mb_substr($truncated, 0, $lastSpace);
    }

    return $truncated . '...';
  }

  /**
   * Validate image format.
   *
   * @param string $mimeType
   *   The MIME type to validate.
   *
   * @throws \InvalidArgumentException
   *   If format is not supported.
   */
  protected function validateFormat(string $mimeType): void {
    if (!$this->isSupportedFormat($mimeType)) {
      $supported = implode(', ', array_keys(self::SUPPORTED_FORMATS));
      throw new \InvalidArgumentException(
        "Unsupported image format: {$mimeType}. Supported formats: {$supported}"
      );
    }
  }

  /**
   * Validate file size.
   *
   * @param int $sizeInBytes
   *   The file size.
   *
   * @throws \InvalidArgumentException
   *   If file is too large.
   */
  protected function validateFileSize(int $sizeInBytes): void {
    if (!$this->isValidFileSize($sizeInBytes)) {
      $maxMb = self::MAX_FILE_SIZE / 1024 / 1024;
      throw new \InvalidArgumentException(
        "File size exceeds maximum of {$maxMb}MB"
      );
    }
  }

  /**
   * Validate a file path.
   *
   * @param string $filePath
   *   The file path to validate.
   *
   * @throws \InvalidArgumentException
   *   If file doesn't exist or has invalid format/size.
   */
  protected function validateFile(string $filePath): void {
    if (!file_exists($filePath)) {
      throw new \InvalidArgumentException("File not found: {$filePath}");
    }

    if (!is_readable($filePath)) {
      throw new \InvalidArgumentException("File not readable: {$filePath}");
    }

    $mimeType = $this->getMimeType($filePath);
    $this->validateFormat($mimeType);

    $fileSize = filesize($filePath);
    if ($fileSize === FALSE) {
      throw new \InvalidArgumentException("Unable to determine file size: {$filePath}");
    }
    $this->validateFileSize($fileSize);
  }

  /**
   * Get MIME type of a file.
   *
   * @param string $filePath
   *   The file path.
   *
   * @return string
   *   The MIME type.
   */
  protected function getMimeType(string $filePath): string {
    $mimeType = mime_content_type($filePath);
    return $mimeType !== FALSE ? $mimeType : 'application/octet-stream';
  }

}
