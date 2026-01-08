<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\media\MediaInterface;
use Drupal\ndx_aws_ai\Result\AltTextResult;
use Psr\Log\LoggerInterface;

/**
 * AI-powered alt-text generation service.
 *
 * Generates WCAG-compliant alt-text for images using the Nova 2 Omni
 * Vision service, with support for Drupal media entities.
 *
 * Story 4.5: Auto Alt-Text on Media Upload
 */
class AltTextGeneratorService implements AltTextGeneratorInterface {

  /**
   * Known image bundle field mappings.
   */
  protected const IMAGE_BUNDLE_FIELDS = [
    'image' => 'field_media_image',
    'file' => 'field_media_file',
  ];

  /**
   * Constructs an AltTextGeneratorService.
   *
   * @param \Drupal\ndx_aws_ai\Service\VisionServiceInterface $visionService
   *   The Vision service for image analysis.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\Core\File\FileSystemInterface $fileSystem
   *   The file system service.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected VisionServiceInterface $visionService,
    protected EntityTypeManagerInterface $entityTypeManager,
    protected FileSystemInterface $fileSystem,
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function generateAltText(
    string $imageData,
    string $mimeType,
    ?string $context = NULL,
    bool $isBase64 = FALSE,
  ): AltTextResult {
    $startTime = microtime(TRUE);

    try {
      $result = $this->visionService->generateAltText($imageData, $mimeType, $isBase64);

      $processingTimeMs = (microtime(TRUE) - $startTime) * 1000;
      $altText = $result->getAccessibleText();

      $this->logger->info('Alt-text generated: @length chars', [
        '@length' => strlen($altText),
      ]);

      return AltTextResult::success(
        altText: $altText,
        confidence: 95.0,
        processingTimeMs: $processingTimeMs,
      );
    }
    catch (\Exception $e) {
      $processingTimeMs = (microtime(TRUE) - $startTime) * 1000;

      $this->logger->error('Alt-text generation failed: @error', [
        '@error' => $e->getMessage(),
      ]);

      return AltTextResult::failure(
        error: $e->getMessage(),
        processingTimeMs: $processingTimeMs,
      );
    }
  }

  /**
   * {@inheritdoc}
   */
  public function generateAltTextFromUri(string $uri, ?string $context = NULL): AltTextResult {
    $startTime = microtime(TRUE);

    try {
      $realPath = $this->fileSystem->realpath($uri);
      if ($realPath === FALSE) {
        throw new \InvalidArgumentException("Cannot resolve URI: {$uri}");
      }

      $result = $this->visionService->generateAltTextFromFile($realPath);

      $processingTimeMs = (microtime(TRUE) - $startTime) * 1000;
      $altText = $result->getAccessibleText();

      return AltTextResult::success(
        altText: $altText,
        confidence: 95.0,
        processingTimeMs: $processingTimeMs,
        sourceUri: $uri,
      );
    }
    catch (\Exception $e) {
      $processingTimeMs = (microtime(TRUE) - $startTime) * 1000;

      $this->logger->error('Alt-text generation from URI failed: @uri - @error', [
        '@uri' => $uri,
        '@error' => $e->getMessage(),
      ]);

      return AltTextResult::failure(
        error: $e->getMessage(),
        processingTimeMs: $processingTimeMs,
        sourceUri: $uri,
      );
    }
  }

  /**
   * {@inheritdoc}
   */
  public function generateAltTextForMedia(
    MediaInterface $media,
    ?string $context = NULL,
  ): AltTextResult {
    $startTime = microtime(TRUE);

    try {
      $imageFieldName = $this->getImageFieldName($media->bundle());
      if ($imageFieldName === NULL) {
        throw new \InvalidArgumentException("Media bundle '{$media->bundle()}' is not an image type");
      }

      if (!$media->hasField($imageFieldName)) {
        throw new \InvalidArgumentException("Media entity missing image field: {$imageFieldName}");
      }

      $imageField = $media->get($imageFieldName);
      if ($imageField->isEmpty()) {
        throw new \InvalidArgumentException('Media entity has no image attached');
      }

      $fileId = $imageField->target_id;
      $file = $this->entityTypeManager->getStorage('file')->load($fileId);
      if ($file === NULL) {
        throw new \InvalidArgumentException("File entity not found: {$fileId}");
      }

      $uri = $file->getFileUri();
      $realPath = $this->fileSystem->realpath($uri);
      if ($realPath === FALSE) {
        throw new \InvalidArgumentException("Cannot resolve file URI: {$uri}");
      }

      $result = $this->visionService->generateAltTextFromFile($realPath);

      $processingTimeMs = (microtime(TRUE) - $startTime) * 1000;
      $altText = $result->getAccessibleText();

      $this->logger->info('Alt-text generated for media @id: @length chars', [
        '@id' => $media->id(),
        '@length' => strlen($altText),
      ]);

      return AltTextResult::success(
        altText: $altText,
        confidence: 95.0,
        processingTimeMs: $processingTimeMs,
        sourceUri: $uri,
        mediaId: (int) $media->id(),
      );
    }
    catch (\Exception $e) {
      $processingTimeMs = (microtime(TRUE) - $startTime) * 1000;

      $this->logger->error('Alt-text generation for media @id failed: @error', [
        '@id' => $media->id() ?? 'new',
        '@error' => $e->getMessage(),
      ]);

      return AltTextResult::failure(
        error: $e->getMessage(),
        processingTimeMs: $processingTimeMs,
        mediaId: $media->id() ? (int) $media->id() : NULL,
      );
    }
  }

  /**
   * {@inheritdoc}
   */
  public function regenerateAltText(
    MediaInterface $media,
    bool $saveEntity = FALSE,
  ): AltTextResult {
    $result = $this->generateAltTextForMedia($media);

    if ($result->isSuccess()) {
      $imageFieldName = $this->getImageFieldName($media->bundle());
      if ($imageFieldName !== NULL && $media->hasField($imageFieldName)) {
        $imageField = $media->get($imageFieldName);
        $imageField->alt = $result->altText;

        // Mark as AI-generated.
        if ($media->hasField('field_ai_generated_alt')) {
          $media->set('field_ai_generated_alt', TRUE);
        }

        if ($saveEntity) {
          $media->save();
        }
      }
    }

    return $result;
  }

  /**
   * {@inheritdoc}
   */
  public function batchGenerate(
    array $mediaIds,
    int $batchSize = self::DEFAULT_BATCH_SIZE,
    bool $skipExisting = TRUE,
  ): array {
    $results = [];
    $mediaStorage = $this->entityTypeManager->getStorage('media');

    $batches = array_chunk($mediaIds, $batchSize);
    $totalBatches = count($batches);
    $currentBatch = 0;

    foreach ($batches as $batch) {
      $currentBatch++;
      $this->logger->info('Processing batch @current of @total', [
        '@current' => $currentBatch,
        '@total' => $totalBatches,
      ]);

      $entities = $mediaStorage->loadMultiple($batch);

      foreach ($entities as $mediaId => $media) {
        if (!$media instanceof MediaInterface) {
          continue;
        }

        // Skip if already has alt-text and skipExisting is true.
        if ($skipExisting && !$this->needsAltText($media)) {
          $results[$mediaId] = AltTextResult::failure(
            error: 'Skipped: alt-text already exists',
            processingTimeMs: 0,
            mediaId: (int) $mediaId,
          );
          continue;
        }

        $results[$mediaId] = $this->regenerateAltText($media, TRUE);

        // Rate limiting: small delay between items.
        usleep(100000);
      }
    }

    return $results;
  }

  /**
   * {@inheritdoc}
   */
  public function hasAiGeneratedAltText(MediaInterface $media): bool {
    if ($media->hasField('field_ai_generated_alt')) {
      return (bool) $media->get('field_ai_generated_alt')->value;
    }
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function needsAltText(MediaInterface $media): bool {
    $imageFieldName = $this->getImageFieldName($media->bundle());
    if ($imageFieldName === NULL) {
      return FALSE;
    }

    if (!$media->hasField($imageFieldName)) {
      return FALSE;
    }

    $imageField = $media->get($imageFieldName);
    if ($imageField->isEmpty()) {
      return FALSE;
    }

    // Check if alt-text is empty.
    $alt = $imageField->alt ?? '';
    return empty(trim($alt));
  }

  /**
   * {@inheritdoc}
   */
  public function getImageFieldName(string $bundle): ?string {
    return self::IMAGE_BUNDLE_FIELDS[$bundle] ?? NULL;
  }

  /**
   * {@inheritdoc}
   */
  public function isAvailable(): bool {
    return $this->visionService->isAvailable();
  }

}
