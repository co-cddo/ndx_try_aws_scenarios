<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\Core\State\StateInterface;
use Drupal\ndx_council_generator\Value\ContentSpecification;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Drupal\ndx_council_generator\Value\ImageQueue;
use Drupal\ndx_council_generator\Value\ImageQueueItem;
use Drupal\ndx_council_generator\Value\ImageQueueStatistics;
use Drupal\ndx_council_generator\Value\ImageSpecification;
use Psr\Log\LoggerInterface;

/**
 * Collects image specifications during content generation.
 *
 * Story 5.5: Image Specification Collector
 */
class ImageSpecificationCollector implements ImageSpecificationCollectorInterface {

  /**
   * State key for storing the image queue.
   */
  protected const STATE_KEY = 'ndx_council_generator.image_queue';

  /**
   * Cached queue instance.
   */
  protected ?ImageQueue $queue = NULL;

  /**
   * Constructs an ImageSpecificationCollector.
   *
   * @param \Drupal\Core\State\StateInterface $state
   *   The state service for queue persistence.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected StateInterface $state,
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function collectFromContent(ContentSpecification $spec, int $nodeId, CouncilIdentity $identity): void {
    if (!$spec->hasImages()) {
      return;
    }

    $queue = $this->loadQueue();
    $renderedImages = $spec->getRenderedImages($identity);

    foreach ($renderedImages as $imageSpec) {
      $queue = $this->addImageToQueue($queue, $spec->id, $imageSpec, $nodeId);
    }

    $this->saveQueue($queue);

    $this->logger->info('Collected @count images from @id for node @nodeId', [
      '@count' => count($renderedImages),
      '@id' => $spec->id,
      '@nodeId' => $nodeId,
    ]);
  }

  /**
   * {@inheritdoc}
   */
  public function getQueue(): ImageQueue {
    return $this->loadQueue();
  }

  /**
   * {@inheritdoc}
   */
  public function getStatistics(): ImageQueueStatistics {
    return ImageQueueStatistics::fromQueue($this->loadQueue());
  }

  /**
   * {@inheritdoc}
   */
  public function clearQueue(): void {
    $this->queue = ImageQueue::create();
    $this->state->delete(self::STATE_KEY);
    $this->logger->info('Image queue cleared');
  }

  /**
   * {@inheritdoc}
   */
  public function markProcessed(string $specId, int $mediaId): void {
    $queue = $this->loadQueue();
    $item = $queue->getItem($specId);

    if ($item === NULL) {
      $this->logger->warning('Cannot mark processed: item @id not found', ['@id' => $specId]);
      return;
    }

    $updatedItem = $item->withComplete($mediaId);
    $queue = $queue->updateItem($updatedItem);
    $this->saveQueue($queue);

    $this->logger->debug('Marked image @id as processed with media @mediaId', [
      '@id' => $specId,
      '@mediaId' => $mediaId,
    ]);
  }

  /**
   * {@inheritdoc}
   */
  public function markFailed(string $specId, string $error): void {
    $queue = $this->loadQueue();
    $item = $queue->getItem($specId);

    if ($item === NULL) {
      $this->logger->warning('Cannot mark failed: item @id not found', ['@id' => $specId]);
      return;
    }

    $updatedItem = $item->withFailed($error);
    $queue = $queue->updateItem($updatedItem);
    $this->saveQueue($queue);

    $this->logger->warning('Marked image @id as failed: @error', [
      '@id' => $specId,
      '@error' => $error,
    ]);
  }

  /**
   * {@inheritdoc}
   */
  public function getMediaId(string $specId): ?int {
    $queue = $this->loadQueue();

    // Check if this is a duplicate.
    $originalId = $queue->getOriginalId($specId);
    $itemId = $originalId ?? $specId;

    $item = $queue->getItem($itemId);
    return $item?->mediaId;
  }

  /**
   * {@inheritdoc}
   */
  public function getPendingIds(): array {
    return array_keys($this->loadQueue()->getPending());
  }

  /**
   * Add an image to the queue with deduplication.
   *
   * @param \Drupal\ndx_council_generator\Value\ImageQueue $queue
   *   The current queue.
   * @param string $contentSpecId
   *   The content specification ID.
   * @param \Drupal\ndx_council_generator\Value\ImageSpecification $imageSpec
   *   The image specification.
   * @param int $nodeId
   *   The node ID.
   *
   * @return \Drupal\ndx_council_generator\Value\ImageQueue
   *   The updated queue.
   */
  protected function addImageToQueue(
    ImageQueue $queue,
    string $contentSpecId,
    ImageSpecification $imageSpec,
    int $nodeId
  ): ImageQueue {
    $hash = $this->generateHash($imageSpec);

    // Check for existing item with same hash.
    if ($queue->hasItem($hash)) {
      $this->logger->debug('Duplicate image detected: @hash', ['@hash' => $hash]);
      return $queue;
    }

    // Check for duplicates that were already registered.
    if ($queue->isDuplicate($hash)) {
      $this->logger->debug('Image already registered as duplicate: @hash', ['@hash' => $hash]);
      return $queue;
    }

    // Check for potential duplicates among all existing items.
    $existingHash = $this->findDuplicateHash($queue, $imageSpec);
    if ($existingHash !== NULL) {
      $queue = $queue->addDuplicate($hash, $existingHash);
      $this->logger->debug('Registered duplicate @hash -> @original', [
        '@hash' => $hash,
        '@original' => $existingHash,
      ]);
      return $queue;
    }

    // Add as new item.
    $fieldName = $imageSpec->fieldName ?? 'field_hero_image';
    $item = ImageQueueItem::create(
      id: $hash,
      contentSpecId: $contentSpecId,
      imageSpec: $imageSpec,
      nodeId: $nodeId,
      fieldName: $fieldName,
    );

    return $queue->addItem($item);
  }

  /**
   * Generate a hash for deduplication.
   *
   * @param \Drupal\ndx_council_generator\Value\ImageSpecification $imageSpec
   *   The image specification.
   *
   * @return string
   *   The hash string.
   */
  protected function generateHash(ImageSpecification $imageSpec): string {
    // Normalize prompt for comparison.
    $normalizedPrompt = strtolower(trim($imageSpec->prompt));
    $normalizedPrompt = preg_replace('/\s+/', ' ', $normalizedPrompt);

    return md5(sprintf('%s:%s:%s',
      $imageSpec->type,
      $imageSpec->dimensions,
      $normalizedPrompt
    ));
  }

  /**
   * Find an existing hash that matches this image spec.
   *
   * @param \Drupal\ndx_council_generator\Value\ImageQueue $queue
   *   The queue to search.
   * @param \Drupal\ndx_council_generator\Value\ImageSpecification $imageSpec
   *   The image specification.
   *
   * @return string|null
   *   The existing hash if found, NULL otherwise.
   */
  protected function findDuplicateHash(ImageQueue $queue, ImageSpecification $imageSpec): ?string {
    $newHash = $this->generateHash($imageSpec);

    foreach ($queue->items as $existingItem) {
      $existingHash = $this->generateHash($existingItem->imageSpec);
      if ($existingHash === $newHash && $existingItem->id !== $newHash) {
        return $existingItem->id;
      }
    }

    return NULL;
  }

  /**
   * Load the queue from state.
   *
   * @return \Drupal\ndx_council_generator\Value\ImageQueue
   *   The loaded queue.
   */
  protected function loadQueue(): ImageQueue {
    if ($this->queue !== NULL) {
      return $this->queue;
    }

    $data = $this->state->get(self::STATE_KEY);

    if ($data === NULL) {
      $this->queue = ImageQueue::create();
    }
    else {
      $this->queue = ImageQueue::fromArray($data);
    }

    return $this->queue;
  }

  /**
   * Save the queue to state.
   *
   * @param \Drupal\ndx_council_generator\Value\ImageQueue $queue
   *   The queue to save.
   */
  protected function saveQueue(ImageQueue $queue): void {
    $this->queue = $queue;
    $this->state->set(self::STATE_KEY, $queue->toArray());
  }

}
