<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Value;

/**
 * Value object representing the image generation queue.
 *
 * Story 5.5: Image Specification Collector
 */
final class ImageQueue {

  /**
   * Constructs an ImageQueue.
   *
   * @param array<string, ImageQueueItem> $items
   *   Queue items keyed by ID.
   * @param array<string, string> $duplicates
   *   Duplicate mappings (hash => original hash).
   * @param int $createdAt
   *   Unix timestamp when queue was created.
   * @param int $lastUpdated
   *   Unix timestamp of last update.
   */
  public function __construct(
    public readonly array $items = [],
    public readonly array $duplicates = [],
    public readonly int $createdAt = 0,
    public readonly int $lastUpdated = 0,
  ) {}

  /**
   * Create an empty queue.
   *
   * @return self
   *   An empty queue.
   */
  public static function create(): self {
    $now = time();
    return new self(
      items: [],
      duplicates: [],
      createdAt: $now,
      lastUpdated: $now,
    );
  }

  /**
   * Add an item to the queue.
   *
   * @param \Drupal\ndx_council_generator\Value\ImageQueueItem $item
   *   The item to add.
   *
   * @return self
   *   Updated queue.
   */
  public function addItem(ImageQueueItem $item): self {
    $items = $this->items;
    $items[$item->id] = $item;

    return new self(
      items: $items,
      duplicates: $this->duplicates,
      createdAt: $this->createdAt,
      lastUpdated: time(),
    );
  }

  /**
   * Update an item in the queue.
   *
   * @param \Drupal\ndx_council_generator\Value\ImageQueueItem $item
   *   The updated item.
   *
   * @return self
   *   Updated queue.
   */
  public function updateItem(ImageQueueItem $item): self {
    if (!isset($this->items[$item->id])) {
      return $this;
    }

    $items = $this->items;
    $items[$item->id] = $item;

    return new self(
      items: $items,
      duplicates: $this->duplicates,
      createdAt: $this->createdAt,
      lastUpdated: time(),
    );
  }

  /**
   * Register a duplicate mapping.
   *
   * @param string $duplicateId
   *   The duplicate hash.
   * @param string $originalId
   *   The original hash to map to.
   *
   * @return self
   *   Updated queue.
   */
  public function addDuplicate(string $duplicateId, string $originalId): self {
    $duplicates = $this->duplicates;
    $duplicates[$duplicateId] = $originalId;

    return new self(
      items: $this->items,
      duplicates: $duplicates,
      createdAt: $this->createdAt,
      lastUpdated: time(),
    );
  }

  /**
   * Get an item by ID.
   *
   * @param string $id
   *   The item ID.
   *
   * @return \Drupal\ndx_council_generator\Value\ImageQueueItem|null
   *   The item or NULL if not found.
   */
  public function getItem(string $id): ?ImageQueueItem {
    return $this->items[$id] ?? NULL;
  }

  /**
   * Check if an ID exists in the queue.
   *
   * @param string $id
   *   The ID to check.
   *
   * @return bool
   *   TRUE if exists.
   */
  public function hasItem(string $id): bool {
    return isset($this->items[$id]);
  }

  /**
   * Check if an ID is registered as a duplicate.
   *
   * @param string $id
   *   The ID to check.
   *
   * @return bool
   *   TRUE if this is a duplicate.
   */
  public function isDuplicate(string $id): bool {
    return isset($this->duplicates[$id]);
  }

  /**
   * Get the original ID for a duplicate.
   *
   * @param string $duplicateId
   *   The duplicate ID.
   *
   * @return string|null
   *   The original ID or NULL if not a duplicate.
   */
  public function getOriginalId(string $duplicateId): ?string {
    return $this->duplicates[$duplicateId] ?? NULL;
  }

  /**
   * Get all duplicate IDs that map to an original.
   *
   * @param string $originalId
   *   The original item ID.
   *
   * @return array<string>
   *   Array of duplicate IDs.
   */
  public function getDuplicatesOf(string $originalId): array {
    $duplicateIds = [];
    foreach ($this->duplicates as $dupId => $origId) {
      if ($origId === $originalId) {
        $duplicateIds[] = $dupId;
      }
    }
    return $duplicateIds;
  }

  /**
   * Get all items.
   *
   * @return array<string, ImageQueueItem>
   *   All queue items.
   */
  public function getItems(): array {
    return $this->items;
  }

  /**
   * Get IDs of all pending items.
   *
   * @return array<string>
   *   Array of pending item IDs.
   */
  public function getPendingIds(): array {
    return array_keys($this->getPending());
  }

  /**
   * Get all pending items.
   *
   * @return array<string, ImageQueueItem>
   *   Pending items.
   */
  public function getPending(): array {
    return array_filter(
      $this->items,
      fn(ImageQueueItem $item) => $item->isPending()
    );
  }

  /**
   * Get all completed items.
   *
   * @return array<string, ImageQueueItem>
   *   Completed items.
   */
  public function getCompleted(): array {
    return array_filter(
      $this->items,
      fn(ImageQueueItem $item) => $item->isComplete()
    );
  }

  /**
   * Get all failed items.
   *
   * @return array<string, ImageQueueItem>
   *   Failed items.
   */
  public function getFailed(): array {
    return array_filter(
      $this->items,
      fn(ImageQueueItem $item) => $item->isFailed()
    );
  }

  /**
   * Get items by node ID.
   *
   * @param int $nodeId
   *   The node ID to filter by.
   *
   * @return array<string, ImageQueueItem>
   *   Matching items.
   */
  public function getByNodeId(int $nodeId): array {
    return array_filter(
      $this->items,
      fn(ImageQueueItem $item) => $item->nodeId === $nodeId
    );
  }

  /**
   * Get total item count.
   *
   * @return int
   *   Total items in queue.
   */
  public function getCount(): int {
    return count($this->items);
  }

  /**
   * Get count of pending items.
   *
   * @return int
   *   Pending item count.
   */
  public function getPendingCount(): int {
    return count($this->getPending());
  }

  /**
   * Get count of completed items.
   *
   * @return int
   *   Completed item count.
   */
  public function getCompletedCount(): int {
    return count($this->getCompleted());
  }

  /**
   * Get count of failed items.
   *
   * @return int
   *   Failed item count.
   */
  public function getFailedCount(): int {
    return count($this->getFailed());
  }

  /**
   * Get count of unique images (excluding duplicates).
   *
   * @return int
   *   Unique image count.
   */
  public function getUniqueCount(): int {
    return count($this->items);
  }

  /**
   * Get count of duplicate mappings.
   *
   * @return int
   *   Duplicate count.
   */
  public function getDuplicateCount(): int {
    return count($this->duplicates);
  }

  /**
   * Check if queue is empty.
   *
   * @return bool
   *   TRUE if no items.
   */
  public function isEmpty(): bool {
    return empty($this->items);
  }

  /**
   * Convert to array for storage.
   *
   * @return array<string, mixed>
   *   The queue as an array.
   */
  public function toArray(): array {
    $items = [];
    foreach ($this->items as $id => $item) {
      $items[$id] = $item->toArray();
    }

    return [
      'items' => $items,
      'duplicates' => $this->duplicates,
      'created_at' => $this->createdAt,
      'last_updated' => $this->lastUpdated,
    ];
  }

  /**
   * Create from array.
   *
   * @param array<string, mixed> $data
   *   The queue data.
   *
   * @return self
   *   A new ImageQueue.
   */
  public static function fromArray(array $data): self {
    $items = [];
    foreach ($data['items'] ?? [] as $id => $itemData) {
      $items[$id] = ImageQueueItem::fromArray($itemData);
    }

    return new self(
      items: $items,
      duplicates: $data['duplicates'] ?? [],
      createdAt: (int) ($data['created_at'] ?? time()),
      lastUpdated: (int) ($data['last_updated'] ?? time()),
    );
  }

}
