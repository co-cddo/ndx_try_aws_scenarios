<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Value;

/**
 * Value object representing homepage configuration result.
 *
 * Story 5.10: Homepage Views and Blocks Configuration
 */
final class HomepageConfigurationResult {

  /**
   * Constructs a HomepageConfigurationResult.
   *
   * @param bool $frontPageSet
   *   Whether the front page was successfully set.
   * @param int $blocksConfigured
   *   Number of blocks configured.
   * @param int $blocksSkipped
   *   Number of blocks skipped (already configured).
   * @param array<string> $errors
   *   Any errors that occurred.
   */
  public function __construct(
    public readonly bool $frontPageSet,
    public readonly int $blocksConfigured,
    public readonly int $blocksSkipped,
    public readonly array $errors = [],
  ) {}

  /**
   * Creates a failure result.
   *
   * @param string $error
   *   The error message.
   *
   * @return self
   *   A new failure result.
   */
  public static function failure(string $error): self {
    return new self(
      frontPageSet: FALSE,
      blocksConfigured: 0,
      blocksSkipped: 0,
      errors: [$error]
    );
  }

  /**
   * Checks if the configuration was successful.
   *
   * @return bool
   *   TRUE if successful, FALSE otherwise.
   */
  public function isSuccessful(): bool {
    return empty($this->errors) && ($this->frontPageSet || $this->blocksConfigured > 0);
  }

  /**
   * Gets the total configuration count.
   *
   * @return int
   *   The total number of items configured.
   */
  public function getTotalConfigured(): int {
    return ($this->frontPageSet ? 1 : 0) + $this->blocksConfigured;
  }

  /**
   * Gets a summary string.
   *
   * @return string
   *   A human-readable summary.
   */
  public function getSummary(): string {
    $parts = [];

    if ($this->frontPageSet) {
      $parts[] = 'front page set';
    }

    if ($this->blocksConfigured > 0) {
      $parts[] = sprintf('%d blocks configured', $this->blocksConfigured);
    }

    if ($this->blocksSkipped > 0) {
      $parts[] = sprintf('%d blocks skipped', $this->blocksSkipped);
    }

    if (!empty($this->errors)) {
      $parts[] = sprintf('%d errors', count($this->errors));
    }

    return implode(', ', $parts) ?: 'no changes';
  }

}
