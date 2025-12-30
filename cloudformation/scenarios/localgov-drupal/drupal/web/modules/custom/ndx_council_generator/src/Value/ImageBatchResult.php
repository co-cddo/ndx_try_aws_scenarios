<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Value;

/**
 * Value object representing the result of batch image generation.
 *
 * Story 5.6: Batch Image Generation
 */
final class ImageBatchResult {

  /**
   * Constructs an ImageBatchResult.
   *
   * @param int $totalProcessed
   *   Total number of images processed.
   * @param int $successCount
   *   Number of successful generations.
   * @param int $failureCount
   *   Number of failed generations.
   * @param array<int> $mediaIds
   *   Array of created media entity IDs.
   * @param array<string> $failedItemIds
   *   Array of failed queue item IDs.
   * @param int $startedAt
   *   Timestamp when processing started.
   * @param int $completedAt
   *   Timestamp when processing completed.
   * @param float $totalProcessingTimeMs
   *   Total processing time in milliseconds.
   */
  public function __construct(
    public readonly int $totalProcessed,
    public readonly int $successCount,
    public readonly int $failureCount,
    public readonly array $mediaIds,
    public readonly array $failedItemIds,
    public readonly int $startedAt,
    public readonly int $completedAt,
    public readonly float $totalProcessingTimeMs,
  ) {}

  /**
   * Create from individual results.
   *
   * @param array<\Drupal\ndx_aws_ai\Result\ImageGenerationResult> $results
   *   Array of individual generation results.
   * @param array<int> $mediaIds
   *   Array of created media IDs.
   * @param array<string> $failedItemIds
   *   Array of failed item IDs.
   * @param int $startedAt
   *   Timestamp when processing started.
   *
   * @return self
   *   New ImageBatchResult.
   */
  public static function fromResults(
    array $results,
    array $mediaIds,
    array $failedItemIds,
    int $startedAt,
  ): self {
    $successCount = 0;
    $failureCount = 0;
    $totalTimeMs = 0.0;

    foreach ($results as $result) {
      if ($result->success) {
        $successCount++;
      }
      else {
        $failureCount++;
      }
      $totalTimeMs += $result->processingTimeMs;
    }

    return new self(
      totalProcessed: count($results),
      successCount: $successCount,
      failureCount: $failureCount,
      mediaIds: $mediaIds,
      failedItemIds: $failedItemIds,
      startedAt: $startedAt,
      completedAt: time(),
      totalProcessingTimeMs: $totalTimeMs,
    );
  }

  /**
   * Create an empty result.
   *
   * @return self
   *   Empty batch result.
   */
  public static function empty(): self {
    $now = time();
    return new self(
      totalProcessed: 0,
      successCount: 0,
      failureCount: 0,
      mediaIds: [],
      failedItemIds: [],
      startedAt: $now,
      completedAt: $now,
      totalProcessingTimeMs: 0,
    );
  }

  /**
   * Check if all images were generated successfully.
   *
   * @return bool
   *   TRUE if all succeeded.
   */
  public function isFullySuccessful(): bool {
    return $this->failureCount === 0 && $this->totalProcessed > 0;
  }

  /**
   * Check if any images failed.
   *
   * @return bool
   *   TRUE if any failed.
   */
  public function hasFailures(): bool {
    return $this->failureCount > 0;
  }

  /**
   * Get success rate as percentage.
   *
   * @return float
   *   Success percentage (0-100).
   */
  public function getSuccessRate(): float {
    if ($this->totalProcessed === 0) {
      return 100.0;
    }
    return ($this->successCount / $this->totalProcessed) * 100;
  }

  /**
   * Get duration in seconds.
   *
   * @return int
   *   Duration in seconds.
   */
  public function getDurationSeconds(): int {
    return $this->completedAt - $this->startedAt;
  }

  /**
   * Get average processing time per image.
   *
   * @return float
   *   Average time in milliseconds.
   */
  public function getAverageTimeMs(): float {
    if ($this->totalProcessed === 0) {
      return 0.0;
    }
    return $this->totalProcessingTimeMs / $this->totalProcessed;
  }

  /**
   * Get a summary text for logging.
   *
   * @return string
   *   Human-readable summary.
   */
  public function getSummaryText(): string {
    $parts = [
      sprintf('%d/%d images', $this->successCount, $this->totalProcessed),
      sprintf('%.1f%% success', $this->getSuccessRate()),
    ];

    if ($this->failureCount > 0) {
      $parts[] = sprintf('%d failed', $this->failureCount);
    }

    $parts[] = sprintf('%ds duration', $this->getDurationSeconds());

    return implode(', ', $parts);
  }

  /**
   * Convert to array.
   *
   * @return array<string, mixed>
   *   Array representation.
   */
  public function toArray(): array {
    return [
      'total_processed' => $this->totalProcessed,
      'success_count' => $this->successCount,
      'failure_count' => $this->failureCount,
      'media_ids' => $this->mediaIds,
      'failed_item_ids' => $this->failedItemIds,
      'started_at' => $this->startedAt,
      'completed_at' => $this->completedAt,
      'total_processing_time_ms' => $this->totalProcessingTimeMs,
      'success_rate' => $this->getSuccessRate(),
      'average_time_ms' => $this->getAverageTimeMs(),
    ];
  }

}
