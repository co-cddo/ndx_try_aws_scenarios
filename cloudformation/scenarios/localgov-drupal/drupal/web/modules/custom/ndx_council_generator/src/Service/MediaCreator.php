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
    $directory = self::IMAGE_DIRECTORY;
    $this->fileSystem->prepareDirectory(
      $directory,
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

    // Check if specified field exists on the node, otherwise auto-detect.
    $actualFieldName = $fieldName;
    if (!$node->hasField($fieldName)) {
      $actualFieldName = $this->detectImageField($node);
      if ($actualFieldName === NULL) {
        $this->logger->warning('No image field found on node @id (tried @field and auto-detect)', [
          '@field' => $fieldName,
          '@id' => $nodeId,
        ]);
        return;
      }
      $this->logger->info('Auto-detected image field @actual for node @id (specified: @field)', [
        '@actual' => $actualFieldName,
        '@field' => $fieldName,
        '@id' => $nodeId,
      ]);
    }

    // Check if this is a paragraphs field (localgov_page_components).
    $fieldDefinition = $node->getFieldDefinition($actualFieldName);
    $fieldType = $fieldDefinition?->getType();

    if ($fieldType === 'entity_reference_revisions' || $actualFieldName === 'localgov_page_components') {
      // This is a paragraphs field - create a localgov_image paragraph.
      $this->addImageParagraph($node, $actualFieldName, $mediaId);
      return;
    }

    // Standard media reference field.
    $node->set($actualFieldName, ['target_id' => $mediaId]);
    $node->save();

    $this->logger->debug('Updated node @node field @field with media @media', [
      '@node' => $nodeId,
      '@field' => $actualFieldName,
      '@media' => $mediaId,
    ]);
  }

  /**
   * Add an image paragraph to a node's paragraphs field.
   *
   * LocalGov Drupal uses paragraph fields for page content, so we create
   * a localgov_image paragraph with the media reference.
   *
   * @param \Drupal\node\NodeInterface $node
   *   The node entity.
   * @param string $fieldName
   *   The paragraphs field name.
   * @param int $mediaId
   *   The media entity ID.
   */
  protected function addImageParagraph($node, string $fieldName, int $mediaId): void {
    try {
      $paragraphStorage = $this->entityTypeManager->getStorage('paragraph');

      // Create a localgov_image paragraph.
      $paragraph = $paragraphStorage->create([
        'type' => 'localgov_image',
        'localgov_image' => [
          'target_id' => $mediaId,
        ],
      ]);
      $paragraph->save();

      // Get existing paragraphs and prepend the image (so it shows at top).
      $existingValues = $node->get($fieldName)->getValue();
      $newValue = [
        'target_id' => $paragraph->id(),
        'target_revision_id' => $paragraph->getRevisionId(),
      ];

      // Prepend image paragraph to show at beginning of content.
      array_unshift($existingValues, $newValue);
      $node->set($fieldName, $existingValues);
      $node->save();

      $this->logger->info('Added image paragraph to node @node field @field with media @media', [
        '@node' => $node->id(),
        '@field' => $fieldName,
        '@media' => $mediaId,
      ]);
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to create image paragraph for node @node: @error', [
        '@node' => $node->id(),
        '@error' => $e->getMessage(),
      ]);
    }
  }

  /**
   * Auto-detect an image/media field on a node.
   *
   * @param \Drupal\node\NodeInterface $node
   *   The node entity.
   *
   * @return string|null
   *   The field name if found, NULL otherwise.
   */
  protected function detectImageField($node): ?string {
    // Common image field names in LocalGov Drupal and standard Drupal.
    // Order matters - direct image fields first, then paragraphs as fallback.
    $candidates = [
      // Direct media/image reference fields (preferred).
      'field_media_image',           // LocalGov news, standard media reference.
      'localgov_event_image',        // LocalGov events image.
      'localgov_subsites_banner',    // LocalGov subsites banner.
      'field_hero_image',            // Hero (our default).
      'field_image',                 // Standard image field.
      'field_banner_image',          // Banner.
      'field_featured_image',        // Featured.
      'field_page_header_image',     // LocalGov page header.
      'field_teaser_image',          // LocalGov teaser image.
      // Paragraphs field as fallback (for services pages, guides, etc).
      'localgov_page_components',    // LocalGov page components (paragraphs).
    ];

    // Log available fields for debugging.
    $availableFields = array_keys($node->getFieldDefinitions());
    $this->logger->debug('Available fields on node type @type: @fields', [
      '@type' => $node->bundle(),
      '@fields' => implode(', ', array_filter($availableFields, fn($f) => str_starts_with($f, 'field_') || str_starts_with($f, 'localgov_'))),
    ]);

    foreach ($candidates as $fieldName) {
      if ($node->hasField($fieldName)) {
        $this->logger->debug('Found candidate image field: @field', ['@field' => $fieldName]);
        return $fieldName;
      }
    }

    // Fallback: look for any field that accepts media or image reference.
    foreach ($node->getFieldDefinitions() as $name => $definition) {
      $type = $definition->getType();
      // Check for media references or image references.
      if (in_array($type, ['entity_reference', 'entity_reference_revisions']) &&
          (str_contains($name, 'image') || str_contains($name, 'media') || str_contains($name, 'banner'))) {
        $this->logger->debug('Found fallback image field: @field (type: @type)', [
          '@field' => $name,
          '@type' => $type,
        ]);
        return $name;
      }
    }

    // Log that no field was found.
    $this->logger->warning('No image field found on node type @type', [
      '@type' => $node->bundle(),
    ]);

    return NULL;
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
