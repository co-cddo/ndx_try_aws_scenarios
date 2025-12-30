<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

/**
 * Interface for Amazon Bedrock service integration.
 *
 * Provides access to Nova models for content generation.
 *
 * Story 3.1: ndx_aws_ai Module Foundation
 */
interface BedrockServiceInterface {

  /**
   * Nova Pro model for complex content generation (multimodal).
   */
  public const MODEL_NOVA_PRO = 'amazon.nova-pro-v1:0';

  /**
   * Nova Lite model for simpler tasks like simplification (multimodal).
   */
  public const MODEL_NOVA_LITE = 'amazon.nova-lite-v1:0';

  /**
   * Nova Premier model for highest quality multimodal tasks.
   */
  public const MODEL_NOVA_PREMIER = 'amazon.nova-premier-v1:0';

  /**
   * Generate content using a Bedrock model.
   *
   * @param string $prompt
   *   The prompt to send to the model.
   * @param string $model
   *   The model ID to use (defaults to Nova Pro).
   * @param array<string, mixed> $options
   *   Additional options (e.g., temperature, maxTokens).
   *
   * @return string
   *   The generated content.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function generateContent(string $prompt, string $model = self::MODEL_NOVA_PRO, array $options = []): string;

  /**
   * Simplify text to plain English using Nova Lite.
   *
   * @param string $text
   *   The text to simplify.
   * @param int $targetReadingAge
   *   Target reading age (default 9 for plain English).
   *
   * @return string
   *   The simplified text.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function simplifyText(string $text, int $targetReadingAge = 9): string;

  /**
   * Describe an image using Nova Pro vision capabilities.
   *
   * Nova Pro and Nova Lite support multimodal image input.
   *
   * @param string $imageData
   *   Base64-encoded image data.
   * @param string $mimeType
   *   The image MIME type (e.g., 'image/jpeg').
   *
   * @return string
   *   A description of the image for alt text.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function describeImage(string $imageData, string $mimeType): string;

}
