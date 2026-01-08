<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Value;

/**
 * Value object representing menu configuration results.
 *
 * Story 5.9: Navigation Menu Configuration
 */
final class MenuConfigurationResult {

  /**
   * Constructs a MenuConfigurationResult.
   *
   * @param int $mainLinksCreated
   *   Number of top-level main menu links created.
   * @param int $categoryLinksCreated
   *   Number of service category child links created.
   * @param int $linksSkipped
   *   Number of links skipped (already existed).
   * @param array<string> $errors
   *   List of error messages encountered.
   */
  public function __construct(
    public readonly int $mainLinksCreated,
    public readonly int $categoryLinksCreated,
    public readonly int $linksSkipped,
    public readonly array $errors = [],
  ) {}

  /**
   * Get total links created.
   *
   * @return int
   *   Total count of created links.
   */
  public function getTotalCreated(): int {
    return $this->mainLinksCreated + $this->categoryLinksCreated;
  }

  /**
   * Check if there were any errors.
   *
   * @return bool
   *   TRUE if errors occurred.
   */
  public function hasErrors(): bool {
    return !empty($this->errors);
  }

  /**
   * Check if configuration was successful.
   *
   * @return bool
   *   TRUE if at least one link was created and no errors.
   */
  public function isSuccessful(): bool {
    return $this->getTotalCreated() > 0 || $this->linksSkipped > 0;
  }

  /**
   * Get a summary text of the result.
   *
   * @return string
   *   Human-readable summary.
   */
  public function getSummaryText(): string {
    $parts = [];

    if ($this->mainLinksCreated > 0) {
      $parts[] = sprintf('%d main links', $this->mainLinksCreated);
    }
    if ($this->categoryLinksCreated > 0) {
      $parts[] = sprintf('%d category links', $this->categoryLinksCreated);
    }
    if ($this->linksSkipped > 0) {
      $parts[] = sprintf('%d skipped', $this->linksSkipped);
    }
    if ($this->hasErrors()) {
      $parts[] = sprintf('%d errors', count($this->errors));
    }

    return implode(', ', $parts) ?: 'No changes';
  }

  /**
   * Create a result for a successful configuration.
   *
   * @param int $mainLinks
   *   Number of main links created.
   * @param int $categoryLinks
   *   Number of category links created.
   * @param int $skipped
   *   Number of links skipped.
   *
   * @return self
   *   A new result instance.
   */
  public static function success(int $mainLinks, int $categoryLinks, int $skipped = 0): self {
    return new self($mainLinks, $categoryLinks, $skipped, []);
  }

  /**
   * Create a result for a failed configuration.
   *
   * @param string $error
   *   The error message.
   *
   * @return self
   *   A new result instance.
   */
  public static function failure(string $error): self {
    return new self(0, 0, 0, [$error]);
  }

}
