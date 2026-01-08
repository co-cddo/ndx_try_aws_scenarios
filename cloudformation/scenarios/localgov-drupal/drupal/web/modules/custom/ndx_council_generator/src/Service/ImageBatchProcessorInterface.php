<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\ndx_aws_ai\Result\ImageGenerationResult;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Drupal\ndx_council_generator\Value\GenerationProgress;
use Drupal\ndx_council_generator\Value\ImageBatchResult;

/**
 * Interface for batch image generation processor.
 *
 * Story 5.6: Batch Image Generation
 */
interface ImageBatchProcessorInterface {

  /**
   * Process the entire image queue.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity for context.
   * @param callable|null $progressCallback
   *   Optional callback for progress updates.
   *
   * @return \Drupal\ndx_council_generator\Value\ImageBatchResult
   *   The batch processing result.
   */
  public function processQueue(CouncilIdentity $identity, ?callable $progressCallback = NULL): ImageBatchResult;

  /**
   * Process a single queue item by ID.
   *
   * @param string $itemId
   *   The queue item ID.
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity for context.
   *
   * @return \Drupal\ndx_aws_ai\Result\ImageGenerationResult
   *   The generation result.
   */
  public function processItem(string $itemId, CouncilIdentity $identity): ImageGenerationResult;

  /**
   * Retry failed items in the queue.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity for context.
   * @param callable|null $progressCallback
   *   Optional callback for progress updates.
   *
   * @return \Drupal\ndx_council_generator\Value\ImageBatchResult
   *   The retry result.
   */
  public function retryFailed(CouncilIdentity $identity, ?callable $progressCallback = NULL): ImageBatchResult;

  /**
   * Get current processing progress.
   *
   * @return \Drupal\ndx_council_generator\Value\GenerationProgress|null
   *   The current progress, or NULL if not processing.
   */
  public function getProgress(): ?GenerationProgress;

  /**
   * Check if batch processing is currently running.
   *
   * @return bool
   *   TRUE if processing is in progress.
   */
  public function isProcessing(): bool;

}
