<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Value;

/**
 * Value object representing an item in the image generation queue.
 *
 * Story 5.5: Image Specification Collector
 */
final class ImageQueueItem {

  /**
   * Status: waiting to be processed.
   */
  public const STATUS_PENDING = 'pending';

  /**
   * Status: currently being processed.
   */
  public const STATUS_PROCESSING = 'processing';

  /**
   * Status: successfully generated.
   */
  public const STATUS_COMPLETE = 'complete';

  /**
   * Status: generation failed.
   */
  public const STATUS_FAILED = 'failed';

  /**
   * Valid status values.
   */
  public const VALID_STATUSES = [
    self::STATUS_PENDING,
    self::STATUS_PROCESSING,
    self::STATUS_COMPLETE,
    self::STATUS_FAILED,
  ];

  /**
   * Constructs an ImageQueueItem.
   *
   * @param string $id
   *   Unique queue item ID (hash).
   * @param string $contentSpecId
   *   The content specification ID this image belongs to.
   * @param \Drupal\ndx_council_generator\Value\ImageSpecification $imageSpec
   *   The image specification with rendered prompt.
   * @param int $nodeId
   *   The Drupal node ID that needs this image.
   * @param string $fieldName
   *   The field name on the node for this image.
   * @param string $status
   *   Current processing status.
   * @param int $createdAt
   *   Unix timestamp when added to queue.
   * @param int|null $processedAt
   *   Unix timestamp when processing completed.
   * @param int|null $mediaId
   *   The created media entity ID if successful.
   * @param string|null $error
   *   Error message if failed.
   */
  public function __construct(
    public readonly string $id,
    public readonly string $contentSpecId,
    public readonly ImageSpecification $imageSpec,
    public readonly int $nodeId,
    public readonly string $fieldName,
    public readonly string $status = self::STATUS_PENDING,
    public readonly int $createdAt = 0,
    public readonly ?int $processedAt = NULL,
    public readonly ?int $mediaId = NULL,
    public readonly ?string $error = NULL,
  ) {}

  /**
   * Create a new pending queue item.
   *
   * @param string $id
   *   Unique queue item ID.
   * @param string $contentSpecId
   *   Content specification ID.
   * @param \Drupal\ndx_council_generator\Value\ImageSpecification $imageSpec
   *   The image specification.
   * @param int $nodeId
   *   Node ID.
   * @param string $fieldName
   *   Field name for the image.
   *
   * @return self
   *   A new pending queue item.
   */
  public static function create(
    string $id,
    string $contentSpecId,
    ImageSpecification $imageSpec,
    int $nodeId,
    string $fieldName,
  ): self {
    return new self(
      id: $id,
      contentSpecId: $contentSpecId,
      imageSpec: $imageSpec,
      nodeId: $nodeId,
      fieldName: $fieldName,
      status: self::STATUS_PENDING,
      createdAt: time(),
    );
  }

  /**
   * Check if this item is pending.
   *
   * @return bool
   *   TRUE if pending.
   */
  public function isPending(): bool {
    return $this->status === self::STATUS_PENDING;
  }

  /**
   * Check if this item is complete.
   *
   * @return bool
   *   TRUE if complete.
   */
  public function isComplete(): bool {
    return $this->status === self::STATUS_COMPLETE;
  }

  /**
   * Check if this item failed.
   *
   * @return bool
   *   TRUE if failed.
   */
  public function isFailed(): bool {
    return $this->status === self::STATUS_FAILED;
  }

  /**
   * Create a new item marked as processing.
   *
   * @return self
   *   Updated item.
   */
  public function withProcessing(): self {
    return new self(
      id: $this->id,
      contentSpecId: $this->contentSpecId,
      imageSpec: $this->imageSpec,
      nodeId: $this->nodeId,
      fieldName: $this->fieldName,
      status: self::STATUS_PROCESSING,
      createdAt: $this->createdAt,
      processedAt: NULL,
      mediaId: NULL,
      error: NULL,
    );
  }

  /**
   * Create a new item marked as complete.
   *
   * @param int $mediaId
   *   The created media entity ID.
   *
   * @return self
   *   Updated item.
   */
  public function withComplete(int $mediaId): self {
    return new self(
      id: $this->id,
      contentSpecId: $this->contentSpecId,
      imageSpec: $this->imageSpec,
      nodeId: $this->nodeId,
      fieldName: $this->fieldName,
      status: self::STATUS_COMPLETE,
      createdAt: $this->createdAt,
      processedAt: time(),
      mediaId: $mediaId,
      error: NULL,
    );
  }

  /**
   * Create a new item marked as failed.
   *
   * @param string $error
   *   The error message.
   *
   * @return self
   *   Updated item.
   */
  public function withFailed(string $error): self {
    return new self(
      id: $this->id,
      contentSpecId: $this->contentSpecId,
      imageSpec: $this->imageSpec,
      nodeId: $this->nodeId,
      fieldName: $this->fieldName,
      status: self::STATUS_FAILED,
      createdAt: $this->createdAt,
      processedAt: time(),
      mediaId: NULL,
      error: $error,
    );
  }

  /**
   * Convert to array for storage.
   *
   * @return array<string, mixed>
   *   The item as an array.
   */
  public function toArray(): array {
    return [
      'id' => $this->id,
      'content_spec_id' => $this->contentSpecId,
      'image_spec' => $this->imageSpec->toArray(),
      'node_id' => $this->nodeId,
      'field_name' => $this->fieldName,
      'status' => $this->status,
      'created_at' => $this->createdAt,
      'processed_at' => $this->processedAt,
      'media_id' => $this->mediaId,
      'error' => $this->error,
    ];
  }

  /**
   * Create from array.
   *
   * @param array<string, mixed> $data
   *   The item data.
   *
   * @return self
   *   A new ImageQueueItem.
   */
  public static function fromArray(array $data): self {
    return new self(
      id: $data['id'] ?? '',
      contentSpecId: $data['content_spec_id'] ?? '',
      imageSpec: ImageSpecification::fromArray($data['image_spec'] ?? []),
      nodeId: (int) ($data['node_id'] ?? 0),
      fieldName: $data['field_name'] ?? '',
      status: $data['status'] ?? self::STATUS_PENDING,
      createdAt: (int) ($data['created_at'] ?? time()),
      processedAt: isset($data['processed_at']) ? (int) $data['processed_at'] : NULL,
      mediaId: isset($data['media_id']) ? (int) $data['media_id'] : NULL,
      error: $data['error'] ?? NULL,
    );
  }

}
