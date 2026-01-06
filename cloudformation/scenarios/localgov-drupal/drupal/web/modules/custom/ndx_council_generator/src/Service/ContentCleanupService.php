<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\ndx_council_generator\Value\ContentCleanupResult;
use Psr\Log\LoggerInterface;

/**
 * Content cleanup service.
 *
 * Provides functionality to delete all generated council content,
 * ensuring a clean slate before fresh generation.
 */
class ContentCleanupService implements ContentCleanupServiceInterface {

  /**
   * Batch size for entity deletion to prevent memory issues.
   */
  protected const BATCH_SIZE = 50;

  /**
   * Constructs a ContentCleanupService.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\ndx_council_generator\Service\NavigationMenuConfiguratorInterface $navigationConfigurator
   *   The navigation menu configurator.
   * @param \Drupal\ndx_council_generator\Service\GenerationStateManagerInterface $stateManager
   *   The generation state manager.
   * @param \Drupal\Core\File\FileSystemInterface $fileSystem
   *   The file system service.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger service.
   */
  public function __construct(
    protected EntityTypeManagerInterface $entityTypeManager,
    protected NavigationMenuConfiguratorInterface $navigationConfigurator,
    protected GenerationStateManagerInterface $stateManager,
    protected FileSystemInterface $fileSystem,
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function cleanupAll(): ContentCleanupResult {
    $errors = [];

    $this->logger->info('Starting full content cleanup');

    // Delete nodes first (they may reference media).
    try {
      $nodesDeleted = $this->deleteAllNodes();
    }
    catch (\Exception $e) {
      $nodesDeleted = 0;
      $errors[] = 'Node deletion failed: ' . $e->getMessage();
      $this->logger->error('Node deletion failed: @error', ['@error' => $e->getMessage()]);
    }

    // Delete media entities.
    try {
      $mediaDeleted = $this->deleteAllMedia();
    }
    catch (\Exception $e) {
      $mediaDeleted = 0;
      $errors[] = 'Media deletion failed: ' . $e->getMessage();
      $this->logger->error('Media deletion failed: @error', ['@error' => $e->getMessage()]);
    }

    // Delete menu links.
    try {
      $menuLinksDeleted = $this->navigationConfigurator->clearGeneratedMenuLinks();
    }
    catch (\Exception $e) {
      $menuLinksDeleted = 0;
      $errors[] = 'Menu link deletion failed: ' . $e->getMessage();
      $this->logger->error('Menu link deletion failed: @error', ['@error' => $e->getMessage()]);
    }

    // Delete generated files.
    try {
      $filesDeleted = $this->deleteGeneratedFiles();
    }
    catch (\Exception $e) {
      $filesDeleted = 0;
      $errors[] = 'File deletion failed: ' . $e->getMessage();
      $this->logger->error('File deletion failed: @error', ['@error' => $e->getMessage()]);
    }

    // Clear state.
    try {
      $stateCleared = $this->clearState();
    }
    catch (\Exception $e) {
      $stateCleared = FALSE;
      $errors[] = 'State clearing failed: ' . $e->getMessage();
      $this->logger->error('State clearing failed: @error', ['@error' => $e->getMessage()]);
    }

    $result = new ContentCleanupResult(
      $nodesDeleted,
      $mediaDeleted,
      $menuLinksDeleted,
      $filesDeleted,
      $stateCleared,
      $errors
    );

    $this->logger->info('Content cleanup complete: @summary', [
      '@summary' => sprintf(
        '%d nodes, %d media, %d menu links, %d files deleted',
        $nodesDeleted,
        $mediaDeleted,
        $menuLinksDeleted,
        $filesDeleted
      ),
    ]);

    return $result;
  }

  /**
   * {@inheritdoc}
   */
  public function deleteAllNodes(): int {
    $deleted = 0;
    $nodeStorage = $this->entityTypeManager->getStorage('node');

    foreach (self::GENERATED_CONTENT_TYPES as $contentType) {
      $deleted += $this->deleteNodesOfType($nodeStorage, $contentType);
    }

    return $deleted;
  }

  /**
   * Delete all nodes of a specific type in batches.
   *
   * @param object $nodeStorage
   *   The node storage.
   * @param string $contentType
   *   The content type to delete.
   *
   * @return int
   *   Number of nodes deleted.
   */
  protected function deleteNodesOfType($nodeStorage, string $contentType): int {
    $deleted = 0;

    do {
      $query = $nodeStorage->getQuery()
        ->condition('type', $contentType)
        ->accessCheck(FALSE)
        ->range(0, self::BATCH_SIZE);

      $nids = $query->execute();

      if (empty($nids)) {
        break;
      }

      $nodes = $nodeStorage->loadMultiple($nids);
      foreach ($nodes as $node) {
        $node->delete();
        $deleted++;
      }

      $this->logger->debug('Deleted batch of @count @type nodes', [
        '@count' => count($nids),
        '@type' => $contentType,
      ]);

    } while (!empty($nids));

    $this->logger->info('Deleted @count @type nodes', [
      '@count' => $deleted,
      '@type' => $contentType,
    ]);

    return $deleted;
  }

  /**
   * {@inheritdoc}
   */
  public function deleteAllMedia(): int {
    $deleted = 0;
    $mediaStorage = $this->entityTypeManager->getStorage('media');

    do {
      $query = $mediaStorage->getQuery()
        ->accessCheck(FALSE)
        ->range(0, self::BATCH_SIZE);

      $mids = $query->execute();

      if (empty($mids)) {
        break;
      }

      $mediaEntities = $mediaStorage->loadMultiple($mids);
      foreach ($mediaEntities as $media) {
        $media->delete();
        $deleted++;
      }

      $this->logger->debug('Deleted batch of @count media entities', [
        '@count' => count($mids),
      ]);

    } while (!empty($mids));

    $this->logger->info('Deleted @count media entities', ['@count' => $deleted]);

    return $deleted;
  }

  /**
   * {@inheritdoc}
   */
  public function deleteGeneratedFiles(): int {
    $deleted = 0;

    // Delete files in the generated-images directory.
    $directory = 'public://generated-images';
    if (is_dir($directory)) {
      $files = $this->fileSystem->scanDirectory($directory, '/.*/');
      foreach ($files as $file) {
        try {
          $this->fileSystem->delete($file->uri);
          $deleted++;
        }
        catch (\Exception $e) {
          $this->logger->warning('Could not delete file @file: @error', [
            '@file' => $file->uri,
            '@error' => $e->getMessage(),
          ]);
        }
      }

      // Try to remove the directory itself.
      @rmdir($this->fileSystem->realpath($directory));
    }

    // Clean up orphaned file entities.
    $fileStorage = $this->entityTypeManager->getStorage('file');

    // Delete file entities that reference generated-images directory.
    $query = $fileStorage->getQuery()
      ->condition('uri', 'public://generated-images/%', 'LIKE')
      ->accessCheck(FALSE);

    $fids = $query->execute();
    if (!empty($fids)) {
      $files = $fileStorage->loadMultiple($fids);
      foreach ($files as $file) {
        $file->delete();
        $deleted++;
      }
    }

    $this->logger->info('Deleted @count generated files', ['@count' => $deleted]);

    return $deleted;
  }

  /**
   * {@inheritdoc}
   */
  public function clearState(): bool {
    try {
      $this->stateManager->clearState();
      $this->logger->info('Generation state cleared');
      return TRUE;
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to clear state: @error', ['@error' => $e->getMessage()]);
      return FALSE;
    }
  }

}
