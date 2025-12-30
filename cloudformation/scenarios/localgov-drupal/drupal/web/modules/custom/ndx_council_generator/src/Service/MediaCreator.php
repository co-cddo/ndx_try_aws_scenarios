<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\File\FileSystemInterface;
use Psr\Log\LoggerInterface;

/**
 * Creates media entities from generated images.
 *
 * Story 5.6: Batch Image Generation
 */
class MediaCreator implements MediaCreatorInterface {

  /**
   * Directory for generated images.
   */
  protected const IMAGE_DIRECTORY = 'public://generated-images';

  /**
   * MIME type to extension mapping.
   */
  protected const MIME_EXTENSIONS = [
    'image/png' => 'png',
    'image/jpeg' => 'jpg',
    'image/gif' => 'gif',
    'image/webp' => 'webp',
  ];

  /**
   * Constructs a MediaCreator.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\Core\File\FileSystemInterface $fileSystem
   *   The file system service.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected EntityTypeManagerInterface $entityTypeManager,
    protected FileSystemInterface $fileSystem,
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function createFromImage(
    string $imageData,
    string $mimeType,
    string $specId,
    string $councilName,
  ): int {
    // Get extension from MIME type.
    $extension = self::MIME_EXTENSIONS[$mimeType] ?? 'png';

    // Generate file name.
    $fileName = $this->generateFileName($specId, $extension);

    // Ensure directory exists.
    $this->fileSystem->prepareDirectory(
      self::IMAGE_DIRECTORY,
      FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS
    );

    // Save file.
    $uri = self::IMAGE_DIRECTORY . '/' . $fileName;
    $savedUri = $this->fileSystem->saveData($imageData, $uri, FileSystemInterface::EXISTS_REPLACE);

    if ($savedUri === FALSE) {
      throw new \RuntimeException(sprintf('Failed to save image file: %s', $uri));
    }

    $this->logger->debug('Saved image file: @uri', ['@uri' => $savedUri]);

    // Create file entity.
    $fileStorage = $this->entityTypeManager->getStorage('file');
    $file = $fileStorage->create([
      'uri' => $savedUri,
      'uid' => 1,
      'status' => 1,
    ]);
    $file->save();

    $this->logger->debug('Created file entity: @id', ['@id' => $file->id()]);

    // Generate alt text.
    $altText = $this->generateAltText($specId, $councilName);

    // Create media entity.
    $mediaStorage = $this->entityTypeManager->getStorage('media');
    $media = $mediaStorage->create([
      'bundle' => 'image',
      'name' => $this->generateMediaName($specId, $councilName),
      'field_media_image' => [
        'target_id' => $file->id(),
        'alt' => $altText,
      ],
      'uid' => 1,
      'status' => 1,
    ]);
    $media->save();

    $this->logger->info('Created media entity: @id for @spec', [
      '@id' => $media->id(),
      '@spec' => $specId,
    ]);

    return (int) $media->id();
  }

  /**
   * {@inheritdoc}
   */
  public function updateNodeField(int $nodeId, string $fieldName, int $mediaId): void {
    $nodeStorage = $this->entityTypeManager->getStorage('node');
    $node = $nodeStorage->load($nodeId);

    if ($node === NULL) {
      $this->logger->warning('Node not found for image update: @id', ['@id' => $nodeId]);
      return;
    }

    // Check if field exists on the node.
    if (!$node->hasField($fieldName)) {
      $this->logger->warning('Field @field not found on node @id', [
        '@field' => $fieldName,
        '@id' => $nodeId,
      ]);
      return;
    }

    // Set the media reference.
    $node->set($fieldName, ['target_id' => $mediaId]);
    $node->save();

    $this->logger->debug('Updated node @node field @field with media @media', [
      '@node' => $nodeId,
      '@field' => $fieldName,
      '@media' => $mediaId,
    ]);
  }

  /**
   * {@inheritdoc}
   */
  public function generateFileName(string $specId, string $extension): string {
    // Sanitize spec ID for file name.
    $sanitized = preg_replace('/[^a-z0-9\-_]/', '-', strtolower($specId));
    $sanitized = preg_replace('/-+/', '-', $sanitized);
    $sanitized = trim($sanitized, '-');

    // Add timestamp for uniqueness.
    return sprintf('generated-%s-%d.%s', $sanitized, time(), $extension);
  }

  /**
   * {@inheritdoc}
   */
  public function generateAltText(string $specId, string $councilName): string {
    // Parse spec ID to generate descriptive alt text.
    $parts = explode('-', $specId);

    // Remove common prefixes.
    $filtered = array_filter($parts, fn($p) => !in_array($p, ['service', 'guide', 'directory', 'news', 'homepage']));

    if (empty($filtered)) {
      return sprintf('Image for %s', $councilName);
    }

    $description = implode(' ', $filtered);
    $description = ucfirst(str_replace('-', ' ', $description));

    return sprintf('%s - %s', $description, $councilName);
  }

  /**
   * Generate media entity name.
   *
   * @param string $specId
   *   The specification ID.
   * @param string $councilName
   *   The council name.
   *
   * @return string
   *   The media name.
   */
  protected function generateMediaName(string $specId, string $councilName): string {
    $parts = explode('-', $specId);
    $type = ucfirst($parts[0] ?? 'Generated');

    return sprintf('%s image - %s', $type, $councilName);
  }

}
