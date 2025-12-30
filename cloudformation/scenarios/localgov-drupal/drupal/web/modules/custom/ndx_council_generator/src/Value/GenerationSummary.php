<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Value;

/**
 * Value object representing a content generation summary.
 *
 * Story 5.4: Content Generation Orchestrator
 */
final class GenerationSummary {

  /**
   * Constructs a GenerationSummary.
   *
   * @param int $totalProcessed
   *   Total number of items processed.
   * @param int $successCount
   *   Number of successful generations.
   * @param int $failureCount
   *   Number of failed generations.
   * @param array<ContentGenerationResult> $results
   *   All individual results.
   * @param int $totalDurationMs
   *   Total duration in milliseconds.
   * @param int $startedAt
   *   Unix timestamp when generation started.
   * @param int $completedAt
   *   Unix timestamp when generation completed.
   * @param array<string> $failedSpecIds
   *   List of spec IDs that failed.
   */
  public function __construct(
    public readonly int $totalProcessed,
    public readonly int $successCount,
    public readonly int $failureCount,
    public readonly array $results,
    public readonly int $totalDurationMs,
    public readonly int $startedAt,
    public readonly int $completedAt,
    public readonly array $failedSpecIds = [],
  ) {}

  /**
   * Create a summary from a list of results.
   *
   * @param array<ContentGenerationResult> $results
   *   The generation results.
   * @param int $startedAt
   *   When generation started.
   *
   * @return self
   *   A new GenerationSummary.
   */
  public static function fromResults(array $results, int $startedAt): self {
    $successCount = 0;
    $failureCount = 0;
    $totalDurationMs = 0;
    $failedSpecIds = [];

    foreach ($results as $result) {
      if ($result->success) {
        $successCount++;
      }
      else {
        $failureCount++;
        $failedSpecIds[] = $result->specId;
      }
      $totalDurationMs += $result->processingTimeMs;
    }

    return new self(
      totalProcessed: count($results),
      successCount: $successCount,
      failureCount: $failureCount,
      results: $results,
      totalDurationMs: $totalDurationMs,
      startedAt: $startedAt,
      completedAt: time(),
      failedSpecIds: $failedSpecIds,
    );
  }

  /**
   * Get the success rate as a percentage.
   *
   * @return float
   *   Success rate (0.0 - 100.0).
   */
  public function getSuccessRate(): float {
    if ($this->totalProcessed === 0) {
      return 0.0;
    }
    return ($this->successCount / $this->totalProcessed) * 100.0;
  }

  /**
   * Get average processing time per item in milliseconds.
   *
   * @return int
   *   Average time per item.
   */
  public function getAverageTimePerItemMs(): int {
    if ($this->totalProcessed === 0) {
      return 0;
    }
    return (int) round($this->totalDurationMs / $this->totalProcessed);
  }

  /**
   * Get total duration in seconds.
   *
   * @return float
   *   Duration in seconds.
   */
  public function getTotalDurationSeconds(): float {
    return $this->totalDurationMs / 1000.0;
  }

  /**
   * Check if all items succeeded.
   *
   * @return bool
   *   TRUE if no failures.
   */
  public function isFullySuccessful(): bool {
    return $this->failureCount === 0 && $this->totalProcessed > 0;
  }

  /**
   * Check if there were any failures.
   *
   * @return bool
   *   TRUE if any items failed.
   */
  public function hasFailures(): bool {
    return $this->failureCount > 0;
  }

  /**
   * Get a human-readable summary.
   *
   * @return string
   *   Summary text.
   */
  public function getSummaryText(): string {
    $duration = $this->getTotalDurationSeconds();

    if ($this->isFullySuccessful()) {
      return sprintf(
        'Content generation complete: %d items in %.1fs (%.0f%% success rate)',
        $this->totalProcessed,
        $duration,
        $this->getSuccessRate()
      );
    }

    return sprintf(
      'Content generation complete: %d/%d items succeeded, %d failed in %.1fs',
      $this->successCount,
      $this->totalProcessed,
      $this->failureCount,
      $duration
    );
  }

  /**
   * Convert to array for structured logging.
   *
   * @return array<string, mixed>
   *   Summary data for logging.
   */
  public function toLogArray(): array {
    return [
      'total_processed' => $this->totalProcessed,
      'success_count' => $this->successCount,
      'failure_count' => $this->failureCount,
      'success_rate' => round($this->getSuccessRate(), 2),
      'total_duration_ms' => $this->totalDurationMs,
      'average_time_per_item_ms' => $this->getAverageTimePerItemMs(),
      'started_at' => $this->startedAt,
      'completed_at' => $this->completedAt,
      'failed_spec_ids' => $this->failedSpecIds,
    ];
  }

  /**
   * Convert to array for storage.
   *
   * @return array<string, mixed>
   *   Full summary data.
   */
  public function toArray(): array {
    return [
      'total_processed' => $this->totalProcessed,
      'success_count' => $this->successCount,
      'failure_count' => $this->failureCount,
      'results' => array_map(fn($r) => $r->toArray(), $this->results),
      'total_duration_ms' => $this->totalDurationMs,
      'started_at' => $this->startedAt,
      'completed_at' => $this->completedAt,
      'failed_spec_ids' => $this->failedSpecIds,
    ];
  }

  /**
   * Create from array.
   *
   * @param array<string, mixed> $data
   *   The summary data.
   *
   * @return self
   *   A new GenerationSummary.
   */
  public static function fromArray(array $data): self {
    $results = [];
    foreach ($data['results'] ?? [] as $resultData) {
      $results[] = ContentGenerationResult::fromArray($resultData);
    }

    return new self(
      totalProcessed: (int) ($data['total_processed'] ?? 0),
      successCount: (int) ($data['success_count'] ?? 0),
      failureCount: (int) ($data['failure_count'] ?? 0),
      results: $results,
      totalDurationMs: (int) ($data['total_duration_ms'] ?? 0),
      startedAt: (int) ($data['started_at'] ?? 0),
      completedAt: (int) ($data['completed_at'] ?? 0),
      failedSpecIds: $data['failed_spec_ids'] ?? [],
    );
  }

}
