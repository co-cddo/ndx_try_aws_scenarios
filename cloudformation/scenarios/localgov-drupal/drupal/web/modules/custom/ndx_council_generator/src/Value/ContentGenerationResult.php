<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Value;

/**
 * Value object representing the result of generating a single content item.
 *
 * Story 5.4: Content Generation Orchestrator
 */
final class ContentGenerationResult {

  /**
   * Constructs a ContentGenerationResult.
   *
   * @param string $specId
   *   The content specification ID that was processed.
   * @param bool $success
   *   Whether generation succeeded.
   * @param int|null $nodeId
   *   The created node ID if successful.
   * @param string|null $error
   *   Error message if generation failed.
   * @param int $generatedAt
   *   Unix timestamp when the result was generated.
   * @param int $processingTimeMs
   *   Processing time in milliseconds.
   */
  public function __construct(
    public readonly string $specId,
    public readonly bool $success,
    public readonly ?int $nodeId,
    public readonly ?string $error,
    public readonly int $generatedAt,
    public readonly int $processingTimeMs = 0,
  ) {}

  /**
   * Create a successful result.
   *
   * @param string $specId
   *   The content specification ID.
   * @param int $nodeId
   *   The created node ID.
   * @param int $processingTimeMs
   *   Processing time in milliseconds.
   *
   * @return self
   *   A success result.
   */
  public static function fromSuccess(string $specId, int $nodeId, int $processingTimeMs = 0): self {
    return new self(
      specId: $specId,
      success: TRUE,
      nodeId: $nodeId,
      error: NULL,
      generatedAt: time(),
      processingTimeMs: $processingTimeMs,
    );
  }

  /**
   * Create a failed result.
   *
   * @param string $specId
   *   The content specification ID.
   * @param string $error
   *   The error message.
   * @param int $processingTimeMs
   *   Processing time in milliseconds.
   *
   * @return self
   *   A failure result.
   */
  public static function fromFailure(string $specId, string $error, int $processingTimeMs = 0): self {
    return new self(
      specId: $specId,
      success: FALSE,
      nodeId: NULL,
      error: $error,
      generatedAt: time(),
      processingTimeMs: $processingTimeMs,
    );
  }

  /**
   * Convert to array for storage.
   *
   * @return array<string, mixed>
   *   The result as an array.
   */
  public function toArray(): array {
    return [
      'spec_id' => $this->specId,
      'success' => $this->success,
      'node_id' => $this->nodeId,
      'error' => $this->error,
      'generated_at' => $this->generatedAt,
      'processing_time_ms' => $this->processingTimeMs,
    ];
  }

  /**
   * Create from array.
   *
   * @param array<string, mixed> $data
   *   The result data.
   *
   * @return self
   *   A new ContentGenerationResult.
   */
  public static function fromArray(array $data): self {
    return new self(
      specId: $data['spec_id'] ?? '',
      success: (bool) ($data['success'] ?? FALSE),
      nodeId: isset($data['node_id']) ? (int) $data['node_id'] : NULL,
      error: $data['error'] ?? NULL,
      generatedAt: (int) ($data['generated_at'] ?? time()),
      processingTimeMs: (int) ($data['processing_time_ms'] ?? 0),
    );
  }

}
