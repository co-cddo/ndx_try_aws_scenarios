<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Value;

/**
 * Value object representing image queue statistics.
 *
 * Story 5.5: Image Specification Collector
 */
final class ImageQueueStatistics {

  /**
   * Average time per image in milliseconds (estimate).
   */
  private const ESTIMATED_MS_PER_IMAGE = 5000;

  /**
   * Constructs ImageQueueStatistics.
   *
   * @param int $totalCount
   *   Total number of items in queue.
   * @param int $pendingCount
   *   Number of pending items.
   * @param int $completedCount
   *   Number of completed items.
   * @param int $failedCount
   *   Number of failed items.
   * @param int $duplicateCount
   *   Number of duplicate mappings.
   * @param int $createdAt
   *   Unix timestamp when queue was created.
   * @param int $lastUpdated
   *   Unix timestamp of last update.
   */
  public function __construct(
    public readonly int $totalCount,
    public readonly int $pendingCount,
    public readonly int $completedCount,
    public readonly int $failedCount,
    public readonly int $duplicateCount,
    public readonly int $createdAt,
    public readonly int $lastUpdated,
  ) {}

  /**
   * Create from an ImageQueue.
   *
   * @param \Drupal\ndx_council_generator\Value\ImageQueue $queue
   *   The image queue.
   *
   * @return self
   *   New statistics instance.
   */
  public static function fromQueue(ImageQueue $queue): self {
    return new self(
      totalCount: $queue->getCount(),
      pendingCount: $queue->getPendingCount(),
      completedCount: $queue->getCompletedCount(),
      failedCount: $queue->getFailedCount(),
      duplicateCount: $queue->getDuplicateCount(),
      createdAt: $queue->createdAt,
      lastUpdated: $queue->lastUpdated,
    );
  }

  /**
   * Get completion percentage.
   *
   * @return int
   *   Percentage complete (0-100).
   */
  public function getCompletionPercentage(): int {
    if ($this->totalCount === 0) {
      return 100;
    }
    return (int) round(($this->completedCount / $this->totalCount) * 100);
  }

  /**
   * Get estimated remaining time in seconds.
   *
   * @param int|null $averageTimeMs
   *   Average time per image in ms, or NULL to use default.
   *
   * @return int
   *   Estimated seconds remaining.
   */
  public function getEstimatedRemainingSeconds(?int $averageTimeMs = NULL): int {
    $avgMs = $averageTimeMs ?? self::ESTIMATED_MS_PER_IMAGE;
    return (int) (($this->pendingCount * $avgMs) / 1000);
  }

  /**
   * Get human-readable estimated time.
   *
   * @return string
   *   Human-readable time estimate.
   */
  public function getEstimatedTimeDisplay(): string {
    $seconds = $this->getEstimatedRemainingSeconds();

    if ($seconds < 60) {
      return sprintf('%d seconds', $seconds);
    }

    $minutes = (int) floor($seconds / 60);
    $remainingSeconds = $seconds % 60;

    if ($minutes < 60) {
      if ($remainingSeconds > 0) {
        return sprintf('%d min %d sec', $minutes, $remainingSeconds);
      }
      return sprintf('%d minutes', $minutes);
    }

    $hours = (int) floor($minutes / 60);
    $remainingMinutes = $minutes % 60;

    return sprintf('%d hr %d min', $hours, $remainingMinutes);
  }

  /**
   * Check if queue is complete.
   *
   * @return bool
   *   TRUE if all items are processed.
   */
  public function isComplete(): bool {
    return $this->pendingCount === 0;
  }

  /**
   * Check if queue has failures.
   *
   * @return bool
   *   TRUE if any items failed.
   */
  public function hasFailures(): bool {
    return $this->failedCount > 0;
  }

  /**
   * Get success rate.
   *
   * @return float
   *   Success rate as decimal (0.0 - 1.0).
   */
  public function getSuccessRate(): float {
    $processed = $this->completedCount + $this->failedCount;
    if ($processed === 0) {
      return 1.0;
    }
    return $this->completedCount / $processed;
  }

  /**
   * Convert to array for logging.
   *
   * @return array<string, mixed>
   *   Array representation.
   */
  public function toArray(): array {
    return [
      'total' => $this->totalCount,
      'pending' => $this->pendingCount,
      'completed' => $this->completedCount,
      'failed' => $this->failedCount,
      'duplicates' => $this->duplicateCount,
      'completion_pct' => $this->getCompletionPercentage(),
      'estimated_remaining' => $this->getEstimatedTimeDisplay(),
      'created_at' => $this->createdAt,
      'last_updated' => $this->lastUpdated,
    ];
  }

  /**
   * Get summary text for logging.
   *
   * @return string
   *   Human-readable summary.
   */
  public function getSummaryText(): string {
    return sprintf(
      '%d/%d complete (%d%%), %d failed, %d duplicates, ~%s remaining',
      $this->completedCount,
      $this->totalCount,
      $this->getCompletionPercentage(),
      $this->failedCount,
      $this->duplicateCount,
      $this->getEstimatedTimeDisplay()
    );
  }

}
