<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\ndx_council_generator\Value\ContentSpecification;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Drupal\ndx_council_generator\Value\ImageQueue;
use Drupal\ndx_council_generator\Value\ImageQueueStatistics;

/**
 * Interface for image specification collection during content generation.
 *
 * Story 5.5: Image Specification Collector
 */
interface ImageSpecificationCollectorInterface {

  /**
   * Collect image specifications from content.
   *
   * Extracts image requirements from a content specification and adds them
   * to the processing queue. Handles deduplication of identical images.
   *
   * @param \Drupal\ndx_council_generator\Value\ContentSpecification $spec
   *   The content specification with image requirements.
   * @param int $nodeId
   *   The Drupal node ID that needs these images.
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity for prompt rendering.
   */
  public function collectFromContent(ContentSpecification $spec, int $nodeId, CouncilIdentity $identity): void;

  /**
   * Get the current image queue.
   *
   * @return \Drupal\ndx_council_generator\Value\ImageQueue
   *   The image queue.
   */
  public function getQueue(): ImageQueue;

  /**
   * Get queue statistics.
   *
   * @return \Drupal\ndx_council_generator\Value\ImageQueueStatistics
   *   Queue statistics for progress reporting.
   */
  public function getStatistics(): ImageQueueStatistics;

  /**
   * Clear the image queue.
   *
   * Removes all items and duplicates from the queue.
   */
  public function clearQueue(): void;

  /**
   * Mark an image as successfully processed.
   *
   * @param string $specId
   *   The queue item ID (hash).
   * @param int $mediaId
   *   The created media entity ID.
   */
  public function markProcessed(string $specId, int $mediaId): void;

  /**
   * Mark an image as failed.
   *
   * @param string $specId
   *   The queue item ID (hash).
   * @param string $error
   *   The error message.
   */
  public function markFailed(string $specId, string $error): void;

  /**
   * Get the media ID for a queue item (resolving duplicates).
   *
   * @param string $specId
   *   The queue item ID (may be a duplicate).
   *
   * @return int|null
   *   The media ID if resolved, NULL otherwise.
   */
  public function getMediaId(string $specId): ?int;

  /**
   * Get all pending queue item IDs.
   *
   * @return array<string>
   *   Array of pending item IDs.
   */
  public function getPendingIds(): array;

}
