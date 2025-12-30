<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Aws\BedrockRuntime\BedrockRuntimeClient;
use Aws\Exception\AwsException;
use Drupal\ndx_aws_ai\Exception\AwsServiceException;
use Drupal\ndx_aws_ai\PromptTemplate\PromptTemplateManager;
use Drupal\ndx_aws_ai\RateLimiter\BedrockRateLimiter;
use Drupal\ndx_aws_ai\Response\BedrockResponseParser;

/**
 * Amazon Bedrock service for AI content generation.
 *
 * Provides access to Nova models for content generation, simplification,
 * and image description.
 *
 * Story 3.2: Bedrock Service Integration
 */
class BedrockService implements BedrockServiceInterface {

  /**
   * The Bedrock Runtime client.
   */
  protected BedrockRuntimeClient $client;

  /**
   * Constructs a BedrockService.
   *
   * @param \Drupal\ndx_aws_ai\Service\AwsClientFactory $clientFactory
   *   The AWS client factory.
   * @param \Drupal\ndx_aws_ai\Service\AwsErrorHandler $errorHandler
   *   The AWS error handler.
   * @param \Drupal\ndx_aws_ai\PromptTemplate\PromptTemplateManager $promptManager
   *   The prompt template manager.
   * @param \Drupal\ndx_aws_ai\RateLimiter\BedrockRateLimiter $rateLimiter
   *   The rate limiter for API calls.
   * @param \Drupal\ndx_aws_ai\Response\BedrockResponseParser $responseParser
   *   The response parser.
   */
  public function __construct(
    protected AwsClientFactory $clientFactory,
    protected AwsErrorHandler $errorHandler,
    protected PromptTemplateManager $promptManager,
    protected BedrockRateLimiter $rateLimiter,
    protected BedrockResponseParser $responseParser,
  ) {
    $this->client = $this->clientFactory->getBedrockClient();
  }

  /**
   * {@inheritdoc}
   */
  public function generateContent(string $prompt, string $model = self::MODEL_NOVA_PRO, array $options = []): string {
    $inferenceConfig = [
      'maxTokens' => $options['maxTokens'] ?? 4096,
      'temperature' => $options['temperature'] ?? 0.7,
      'topP' => $options['topP'] ?? 0.9,
    ];

    return $this->invokeModel(
      modelId: $model,
      prompt: $prompt,
      systemPrompt: $options['systemPrompt'] ?? NULL,
      inferenceConfig: $inferenceConfig,
    );
  }

  /**
   * {@inheritdoc}
   */
  public function simplifyText(string $text, int $targetReadingAge = 9): string {
    $template = $this->promptManager->loadTemplate('simplification');
    $prompt = $this->promptManager->render($template, [
      'text' => $text,
      'target_age' => (string) $targetReadingAge,
    ]);

    $systemPrompt = $this->promptManager->renderSystem($template, [
      'target_age' => (string) $targetReadingAge,
    ]);

    $inferenceConfig = [
      'maxTokens' => $template['parameters']['maxTokens'] ?? 2048,
      'temperature' => $template['parameters']['temperature'] ?? 0.3,
    ];

    return $this->invokeModel(
      modelId: self::MODEL_NOVA_LITE,
      prompt: $prompt,
      systemPrompt: $systemPrompt,
      inferenceConfig: $inferenceConfig,
    );
  }

  /**
   * {@inheritdoc}
   */
  public function describeImage(string $imageData, string $mimeType): string {
    $template = $this->promptManager->loadTemplate('image_description');
    $prompt = $template['user'] ?? 'Describe this image for use as alt text. Be concise and descriptive.';

    $inferenceConfig = [
      'maxTokens' => $template['parameters']['maxTokens'] ?? 256,
      'temperature' => $template['parameters']['temperature'] ?? 0.3,
    ];

    return $this->invokeModelWithImage(
      modelId: self::MODEL_NOVA_PRO,
      prompt: $prompt,
      imageData: $imageData,
      mimeType: $mimeType,
      systemPrompt: $template['system'] ?? NULL,
      inferenceConfig: $inferenceConfig,
    );
  }

  /**
   * Invoke a Bedrock model with text prompt.
   *
   * @param string $modelId
   *   The model ID to use.
   * @param string $prompt
   *   The user prompt.
   * @param string|null $systemPrompt
   *   Optional system prompt.
   * @param array<string, mixed> $inferenceConfig
   *   Inference configuration (maxTokens, temperature, etc.).
   *
   * @return string
   *   The generated content.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails after retries.
   */
  protected function invokeModel(
    string $modelId,
    string $prompt,
    ?string $systemPrompt,
    array $inferenceConfig,
  ): string {
    $messages = [
      [
        'role' => 'user',
        'content' => [
          ['text' => $prompt],
        ],
      ],
    ];

    $request = [
      'modelId' => $modelId,
      'messages' => $messages,
      'inferenceConfig' => $inferenceConfig,
    ];

    if ($systemPrompt !== NULL) {
      $request['system'] = [
        ['text' => $systemPrompt],
      ];
    }

    return $this->executeWithRetry($request, $modelId, 'Converse');
  }

  /**
   * Invoke a Bedrock model with image input.
   *
   * @param string $modelId
   *   The model ID to use.
   * @param string $prompt
   *   The user prompt.
   * @param string $imageData
   *   Base64-encoded image data.
   * @param string $mimeType
   *   The image MIME type.
   * @param string|null $systemPrompt
   *   Optional system prompt.
   * @param array<string, mixed> $inferenceConfig
   *   Inference configuration.
   *
   * @return string
   *   The generated content.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails after retries.
   */
  protected function invokeModelWithImage(
    string $modelId,
    string $prompt,
    string $imageData,
    string $mimeType,
    ?string $systemPrompt,
    array $inferenceConfig,
  ): string {
    // Map MIME types to Bedrock format names.
    $formatMap = [
      'image/jpeg' => 'jpeg',
      'image/jpg' => 'jpeg',
      'image/png' => 'png',
      'image/gif' => 'gif',
      'image/webp' => 'webp',
    ];

    $format = $formatMap[$mimeType] ?? 'jpeg';

    $messages = [
      [
        'role' => 'user',
        'content' => [
          [
            'image' => [
              'format' => $format,
              'source' => [
                'bytes' => base64_decode($imageData),
              ],
            ],
          ],
          ['text' => $prompt],
        ],
      ],
    ];

    $request = [
      'modelId' => $modelId,
      'messages' => $messages,
      'inferenceConfig' => $inferenceConfig,
    ];

    if ($systemPrompt !== NULL) {
      $request['system'] = [
        ['text' => $systemPrompt],
      ];
    }

    return $this->executeWithRetry($request, $modelId, 'Converse');
  }

  /**
   * Execute a Bedrock API call with retry logic.
   *
   * @param array<string, mixed> $request
   *   The API request parameters.
   * @param string $modelId
   *   The model ID being used.
   * @param string $operation
   *   The operation name for logging.
   *
   * @return string
   *   The generated content.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails after retries.
   */
  protected function executeWithRetry(array $request, string $modelId, string $operation): string {
    $attempt = 0;
    $lastException = NULL;

    while ($attempt < $this->rateLimiter->getMaxRetries()) {
      try {
        // Apply rate limiting delay if needed.
        $this->rateLimiter->waitIfNeeded();

        // Execute the API call.
        $result = $this->client->converse($request);

        // Parse and log the response.
        $content = $this->responseParser->extractContent($result);
        $usage = $this->responseParser->extractUsage($result);

        $this->errorHandler->logOperation('Bedrock', $operation, [
          'model' => $modelId,
          'inputTokens' => $usage['inputTokens'],
          'outputTokens' => $usage['outputTokens'],
          'totalTokens' => $usage['totalTokens'],
        ]);

        // Record successful call for rate limiting.
        $this->rateLimiter->recordSuccess();

        return $content;

      }
      catch (AwsException $e) {
        $lastException = $e;
        $errorCode = $e->getAwsErrorCode() ?? 'UnknownError';

        if ($this->rateLimiter->isRetryable($errorCode) && $attempt < $this->rateLimiter->getMaxRetries() - 1) {
          $this->errorHandler->logRetry('Bedrock', $operation, $attempt + 1, $errorCode);
          $this->rateLimiter->recordFailure();
          $this->rateLimiter->waitForRetry($attempt);
          $attempt++;
          continue;
        }

        // Non-retryable error or max retries exceeded.
        throw $this->errorHandler->handleException($e, 'Bedrock', $operation);
      }
    }

    // Should not reach here, but handle just in case.
    if ($lastException !== NULL) {
      throw $this->errorHandler->handleException($lastException, 'Bedrock', $operation);
    }

    throw new AwsServiceException(
      message: 'Maximum retries exceeded',
      awsErrorCode: 'MaxRetriesExceeded',
      awsService: 'Bedrock',
      userMessage: 'The AI service is currently unavailable. Please try again later.',
    );
  }

  /**
   * {@inheritdoc}
   */
  public function isAvailable(): bool {
    try {
      // Check if we have a valid client configured.
      // We don't make an actual API call to avoid unnecessary costs,
      // but we verify the client is properly configured.
      $config = $this->client->getConfig();

      // Verify we have a region configured.
      if (empty($config['region'])) {
        return FALSE;
      }

      // The client exists and is configured - service is available.
      return TRUE;
    }
    catch (\Exception $e) {
      return FALSE;
    }
  }

}
