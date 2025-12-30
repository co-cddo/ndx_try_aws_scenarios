<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\ndx_aws_ai\Result\ImageGenerationResult;
use Drupal\ndx_aws_ai\Service\ImageGenerationServiceInterface;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Drupal\ndx_council_generator\Value\GenerationProgress;
use Drupal\ndx_council_generator\Value\GenerationState;
use Drupal\ndx_council_generator\Value\ImageBatchResult;
use Psr\Log\LoggerInterface;

/**
 * Processes image generation queue in batches.
 *
 * Story 5.6: Batch Image Generation
 */
class ImageBatchProcessor implements ImageBatchProcessorInterface {

  /**
   * Default delay between API calls in milliseconds.
   */
  protected const DEFAULT_RATE_LIMIT_DELAY_MS = 1000;

  /**
   * Current processing progress.
   */
  protected ?GenerationProgress $currentProgress = NULL;

  /**
   * Constructs an ImageBatchProcessor.
   *
   * @param \Drupal\ndx_aws_ai\Service\ImageGenerationServiceInterface $imageGenerationService
   *   The image generation service.
   * @param \Drupal\ndx_council_generator\Service\ImageSpecificationCollectorInterface $imageCollector
   *   The image specification collector.
   * @param \Drupal\ndx_council_generator\Service\MediaCreatorInterface $mediaCreator
   *   The media creator service.
   * @param \Drupal\ndx_council_generator\Service\GenerationStateManagerInterface $stateManager
   *   The generation state manager.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The config factory.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected ImageGenerationServiceInterface $imageGenerationService,
    protected ImageSpecificationCollectorInterface $imageCollector,
    protected MediaCreatorInterface $mediaCreator,
    protected GenerationStateManagerInterface $stateManager,
    protected ConfigFactoryInterface $configFactory,
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function processQueue(CouncilIdentity $identity, ?callable $progressCallback = NULL): ImageBatchResult {
    $queue = $this->imageCollector->getQueue();
    $pendingIds = $this->imageCollector->getPendingIds();
    $totalItems = count($pendingIds);

    if ($totalItems === 0) {
      $this->logger->info('No pending images to process');
      return ImageBatchResult::empty();
    }

    $startedAt = time();
    $results = [];
    $mediaIds = [];
    $failedItemIds = [];

    $this->currentProgress = GenerationProgress::image(0, $totalItems, 'Starting');

    // Update state to image generation.
    $this->stateManager->updateStatus(GenerationState::STATUS_GENERATING_IMAGES);
    $this->stateManager->updateProgress(0, $totalItems, 'Starting image generation');

    $this->logger->info('Starting batch image generation: @total items', [
      '@total' => $totalItems,
    ]);

    $step = 0;
    foreach ($pendingIds as $itemId) {
      $step++;

      $item = $queue->getItem($itemId);
      if ($item === NULL) {
        $this->logger->warning('Queue item not found: @id', ['@id' => $itemId]);
        continue;
      }

      // Update progress.
      $this->currentProgress = GenerationProgress::image(
        $step,
        $totalItems,
        $item->contentSpecId
      );

      $this->stateManager->updateProgress(
        $step,
        $totalItems,
        sprintf('Generating: %s', $item->contentSpecId)
      );

      // Generate the image.
      $result = $this->processItem($itemId, $identity);
      $results[] = $result;

      if ($result->success && $result->imageData !== NULL) {
        // Create media entity.
        try {
          $mediaId = $this->mediaCreator->createFromImage(
            $result->imageData,
            $result->mimeType ?? 'image/png',
            $item->contentSpecId,
            $identity->name,
          );

          $mediaIds[] = $mediaId;

          // Update node with media reference.
          if ($item->nodeId !== NULL && $item->fieldName !== NULL) {
            $this->mediaCreator->updateNodeField(
              $item->nodeId,
              $item->fieldName,
              $mediaId
            );
          }

          // Mark as processed in collector.
          $this->imageCollector->markProcessed($itemId, $mediaId);

          // Handle duplicates - assign same media to duplicate references.
          $this->resolveDuplicates($queue, $itemId, $mediaId, $identity);

          $this->logger->info('Generated image for @spec: media @mediaId', [
            '@spec' => $item->contentSpecId,
            '@mediaId' => $mediaId,
          ]);
        }
        catch (\Exception $e) {
          $this->logger->error('Failed to create media for @spec: @error', [
            '@spec' => $item->contentSpecId,
            '@error' => $e->getMessage(),
          ]);
          $this->imageCollector->markFailed($itemId, $e->getMessage());
          $failedItemIds[] = $itemId;
        }
      }
      else {
        $this->imageCollector->markFailed($itemId, $result->error ?? 'Unknown error');
        $failedItemIds[] = $itemId;
      }

      // Call progress callback if provided.
      if ($progressCallback !== NULL) {
        $progressCallback($this->currentProgress);
      }

      // Rate limiting delay between API calls.
      $this->applyRateLimitDelay();
    }

    $batchResult = ImageBatchResult::fromResults($results, $mediaIds, $failedItemIds, $startedAt);

    $this->logger->info('Batch image generation complete: @summary', [
      '@summary' => $batchResult->getSummaryText(),
    ]);

    $this->currentProgress = NULL;

    return $batchResult;
  }

  /**
   * {@inheritdoc}
   */
  public function processItem(string $itemId, CouncilIdentity $identity): ImageGenerationResult {
    $queue = $this->imageCollector->getQueue();
    $item = $queue->getItem($itemId);

    if ($item === NULL) {
      return ImageGenerationResult::fromFailure('Queue item not found');
    }

    $imageSpec = $item->imageSpec;

    // Render the prompt with council identity.
    $prompt = $imageSpec->renderPrompt($identity);

    $this->logger->debug('Generating image: @spec (@dimensions)', [
      '@spec' => $item->contentSpecId,
      '@dimensions' => $imageSpec->dimensions,
    ]);

    // Generate the image.
    return $this->imageGenerationService->generateImage(
      prompt: $prompt,
      width: $imageSpec->getWidth(),
      height: $imageSpec->getHeight(),
      style: $imageSpec->style,
    );
  }

  /**
   * {@inheritdoc}
   */
  public function retryFailed(CouncilIdentity $identity, ?callable $progressCallback = NULL): ImageBatchResult {
    $queue = $this->imageCollector->getQueue();
    $failedIds = [];

    // Get all failed items.
    foreach ($queue->getItems() as $item) {
      if ($item->isFailed()) {
        $failedIds[] = $item->id;
      }
    }

    if (empty($failedIds)) {
      $this->logger->info('No failed images to retry');
      return ImageBatchResult::empty();
    }

    $startedAt = time();
    $results = [];
    $mediaIds = [];
    $newFailedIds = [];
    $totalItems = count($failedIds);

    $this->currentProgress = GenerationProgress::image(0, $totalItems, 'Retrying failed items');

    $this->logger->info('Retrying @count failed images', ['@count' => $totalItems]);

    $step = 0;
    foreach ($failedIds as $itemId) {
      $step++;

      $item = $queue->getItem($itemId);
      if ($item === NULL) {
        continue;
      }

      $this->currentProgress = GenerationProgress::image($step, $totalItems, $item->contentSpecId);

      // Reset the item status for retry.
      // Note: This would need a method in ImageSpecificationCollector to reset status.

      $result = $this->processItem($itemId, $identity);
      $results[] = $result;

      if ($result->success && $result->imageData !== NULL) {
        try {
          $mediaId = $this->mediaCreator->createFromImage(
            $result->imageData,
            $result->mimeType ?? 'image/png',
            $item->contentSpecId,
            $identity->name,
          );

          $mediaIds[] = $mediaId;

          if ($item->nodeId !== NULL && $item->fieldName !== NULL) {
            $this->mediaCreator->updateNodeField(
              $item->nodeId,
              $item->fieldName,
              $mediaId
            );
          }

          $this->imageCollector->markProcessed($itemId, $mediaId);
        }
        catch (\Exception $e) {
          $this->imageCollector->markFailed($itemId, $e->getMessage());
          $newFailedIds[] = $itemId;
        }
      }
      else {
        $this->imageCollector->markFailed($itemId, $result->error ?? 'Unknown error');
        $newFailedIds[] = $itemId;
      }

      if ($progressCallback !== NULL) {
        $progressCallback($this->currentProgress);
      }

      $this->applyRateLimitDelay();
    }

    $this->currentProgress = NULL;

    return ImageBatchResult::fromResults($results, $mediaIds, $newFailedIds, $startedAt);
  }

  /**
   * {@inheritdoc}
   */
  public function getProgress(): ?GenerationProgress {
    return $this->currentProgress;
  }

  /**
   * {@inheritdoc}
   */
  public function isProcessing(): bool {
    return $this->currentProgress !== NULL;
  }

  /**
   * Resolve duplicate image references to the same media.
   *
   * @param \Drupal\ndx_council_generator\Value\ImageQueue $queue
   *   The image queue.
   * @param string $originalItemId
   *   The original item ID that was generated.
   * @param int $mediaId
   *   The media ID to assign to duplicates.
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   */
  protected function resolveDuplicates($queue, string $originalItemId, int $mediaId, CouncilIdentity $identity): void {
    $duplicateIds = $queue->getDuplicatesOf($originalItemId);

    if (empty($duplicateIds)) {
      return;
    }

    $this->logger->debug('Resolving @count duplicates for @original', [
      '@count' => count($duplicateIds),
      '@original' => $originalItemId,
    ]);

    foreach ($duplicateIds as $duplicateId) {
      $item = $queue->getItem($duplicateId);
      if ($item === NULL) {
        continue;
      }

      // Update node with the same media reference.
      if ($item->nodeId !== NULL && $item->fieldName !== NULL) {
        try {
          $this->mediaCreator->updateNodeField(
            $item->nodeId,
            $item->fieldName,
            $mediaId
          );

          $this->logger->debug('Assigned duplicate @dup to media @media', [
            '@dup' => $duplicateId,
            '@media' => $mediaId,
          ]);
        }
        catch (\Exception $e) {
          $this->logger->warning('Failed to update duplicate @dup: @error', [
            '@dup' => $duplicateId,
            '@error' => $e->getMessage(),
          ]);
        }
      }
    }
  }

  /**
   * Apply rate limiting delay between API calls.
   */
  protected function applyRateLimitDelay(): void {
    $config = $this->configFactory->get('ndx_council_generator.settings');
    $delayMs = $config->get('image_rate_limit_delay_ms') ?? self::DEFAULT_RATE_LIMIT_DELAY_MS;

    if ($delayMs > 0) {
      usleep($delayMs * 1000);
    }
  }

}
