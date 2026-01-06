<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Value;

/**
 * Value object representing content cleanup results.
 */
final class ContentCleanupResult {

  /**
   * Constructs a ContentCleanupResult.
   *
   * @param int $nodesDeleted
   *   Number of nodes deleted.
   * @param int $mediaDeleted
   *   Number of media entities deleted.
   * @param int $menuLinksDeleted
   *   Number of menu links deleted.
   * @param int $filesDeleted
   *   Number of files deleted.
   * @param bool $stateCleared
   *   Whether state was cleared.
   * @param array $errors
   *   Any errors encountered during cleanup.
   */
  public function __construct(
    public readonly int $nodesDeleted,
    public readonly int $mediaDeleted,
    public readonly int $menuLinksDeleted,
    public readonly int $filesDeleted,
    public readonly bool $stateCleared,
    public readonly array $errors = [],
  ) {}

  /**
   * Get total items deleted.
   *
   * @return int
   *   Total count of deleted items.
   */
  public function getTotalDeleted(): int {
    return $this->nodesDeleted + $this->mediaDeleted + $this->menuLinksDeleted + $this->filesDeleted;
  }

  /**
   * Check if cleanup had any errors.
   *
   * @return bool
   *   TRUE if there were errors.
   */
  public function hasErrors(): bool {
    return !empty($this->errors);
  }

  /**
   * Create a successful empty result.
   *
   * @return self
   *   Empty cleanup result.
   */
  public static function empty(): self {
    return new self(0, 0, 0, 0, FALSE);
  }

  /**
   * Create a failure result.
   *
   * @param string $error
   *   The error message.
   *
   * @return self
   *   Failure result.
   */
  public static function failure(string $error): self {
    return new self(0, 0, 0, 0, FALSE, [$error]);
  }

}
