<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\ndx_council_generator\Value\ContentCleanupResult;

/**
 * Interface for content cleanup service.
 *
 * Provides functionality to delete all generated council content,
 * ensuring a clean slate before fresh generation.
 */
interface ContentCleanupServiceInterface {

  /**
   * Content types that are managed by the generator.
   */
  public const GENERATED_CONTENT_TYPES = [
    'localgov_services_landing',
    'localgov_services_page',
    'localgov_guides_page',
    'localgov_news_article',
  ];

  /**
   * Clean up all generated content.
   *
   * Deletes all nodes, media, menu links, and state created by the generator.
   *
   * @return \Drupal\ndx_council_generator\Value\ContentCleanupResult
   *   Result containing counts of deleted items.
   */
  public function cleanupAll(): ContentCleanupResult;

  /**
   * Delete all nodes of the generated content types.
   *
   * @return int
   *   Number of nodes deleted.
   */
  public function deleteAllNodes(): int;

  /**
   * Delete all media entities.
   *
   * @return int
   *   Number of media entities deleted.
   */
  public function deleteAllMedia(): int;

  /**
   * Delete all generated files from the filesystem.
   *
   * @return int
   *   Number of files deleted.
   */
  public function deleteGeneratedFiles(): int;

  /**
   * Clear all generation state.
   *
   * @return bool
   *   TRUE if state was cleared successfully.
   */
  public function clearState(): bool;

}
