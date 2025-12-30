<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Response;

use Aws\Result;
use Psr\Log\LoggerInterface;

/**
 * Parser for Bedrock Converse API responses.
 *
 * Extracts text content, usage statistics, and validates response structure
 * from Amazon Bedrock model responses.
 *
 * Story 3.2: Bedrock Service Integration
 */
class BedrockResponseParser {

  /**
   * Constructs a BedrockResponseParser.
   *
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected LoggerInterface $logger,
  ) {}

  /**
   * Extract text content from a Bedrock Converse API response.
   *
   * @param \Aws\Result $result
   *   The AWS SDK result object.
   *
   * @return string
   *   The extracted text content.
   *
   * @throws \InvalidArgumentException
   *   If the response structure is invalid or content is empty.
   */
  public function extractContent(Result $result): string {
    $data = $result->toArray();

    // Navigate the Converse API response structure.
    // Expected: output.message.content[0].text
    if (!isset($data['output']['message']['content'])) {
      $this->logger->error('Bedrock response missing content structure');
      throw new \InvalidArgumentException(
        'Invalid Bedrock response: missing output.message.content'
      );
    }

    $contentBlocks = $data['output']['message']['content'];

    if (empty($contentBlocks)) {
      $this->logger->warning('Bedrock response has empty content array');
      throw new \InvalidArgumentException(
        'Invalid Bedrock response: content array is empty'
      );
    }

    // Extract text from the first content block.
    $text = $this->extractTextFromBlocks($contentBlocks);

    if (empty($text)) {
      $this->logger->warning('Bedrock response has no text content');
      throw new \InvalidArgumentException(
        'Invalid Bedrock response: no text content found'
      );
    }

    // Validate the text is valid UTF-8.
    if (!$this->isValidUtf8($text)) {
      $this->logger->error('Bedrock response contains invalid UTF-8');
      throw new \InvalidArgumentException(
        'Invalid Bedrock response: content is not valid UTF-8'
      );
    }

    return $text;
  }

  /**
   * Extract usage statistics from a Bedrock response.
   *
   * @param \Aws\Result $result
   *   The AWS SDK result object.
   *
   * @return array{inputTokens: int, outputTokens: int, totalTokens: int}
   *   The usage statistics.
   */
  public function extractUsage(Result $result): array {
    $data = $result->toArray();

    $usage = $data['usage'] ?? [];

    return [
      'inputTokens' => (int) ($usage['inputTokens'] ?? 0),
      'outputTokens' => (int) ($usage['outputTokens'] ?? 0),
      'totalTokens' => (int) ($usage['totalTokens'] ?? 0),
    ];
  }

  /**
   * Extract the stop reason from a Bedrock response.
   *
   * @param \Aws\Result $result
   *   The AWS SDK result object.
   *
   * @return string|null
   *   The stop reason (e.g., 'end_turn', 'max_tokens'), or NULL if not present.
   */
  public function extractStopReason(Result $result): ?string {
    $data = $result->toArray();

    return $data['stopReason'] ?? NULL;
  }

  /**
   * Check if the response indicates the output was truncated.
   *
   * @param \Aws\Result $result
   *   The AWS SDK result object.
   *
   * @return bool
   *   TRUE if the response was truncated due to max tokens.
   */
  public function isTruncated(Result $result): bool {
    return $this->extractStopReason($result) === 'max_tokens';
  }

  /**
   * Extract text content from content blocks.
   *
   * Handles multiple content blocks and concatenates text from all.
   *
   * @param array<int, array<string, mixed>> $contentBlocks
   *   The content blocks from the response.
   *
   * @return string
   *   The concatenated text content.
   */
  protected function extractTextFromBlocks(array $contentBlocks): string {
    $textParts = [];

    foreach ($contentBlocks as $block) {
      if (isset($block['text']) && is_string($block['text'])) {
        $textParts[] = $block['text'];
      }
    }

    return implode("\n", $textParts);
  }

  /**
   * Check if a string is valid UTF-8.
   *
   * @param string $text
   *   The text to validate.
   *
   * @return bool
   *   TRUE if the text is valid UTF-8.
   */
  protected function isValidUtf8(string $text): bool {
    return mb_check_encoding($text, 'UTF-8');
  }

  /**
   * Parse a complete response and return structured data.
   *
   * Convenience method that extracts all relevant information from a response.
   *
   * @param \Aws\Result $result
   *   The AWS SDK result object.
   *
   * @return array{content: string, usage: array{inputTokens: int, outputTokens: int, totalTokens: int}, stopReason: string|null, truncated: bool}
   *   Structured response data.
   */
  public function parse(Result $result): array {
    return [
      'content' => $this->extractContent($result),
      'usage' => $this->extractUsage($result),
      'stopReason' => $this->extractStopReason($result),
      'truncated' => $this->isTruncated($result),
    ];
  }

}
