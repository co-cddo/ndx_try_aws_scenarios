<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Commands;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\ndx_aws_ai\Service\AltTextGeneratorInterface;
use Drush\Attributes as CLI;
use Drush\Commands\DrushCommands;
use Psr\Log\LoggerInterface;

/**
 * Drush commands for NDX AWS AI module.
 *
 * Story 4.5: Auto Alt-Text on Media Upload
 */
final class NdxAwsAiCommands extends DrushCommands {

  /**
   * Constructs NdxAwsAiCommands.
   *
   * @param \Drupal\ndx_aws_ai\Service\AltTextGeneratorInterface $altTextGenerator
   *   The alt-text generator service.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected AltTextGeneratorInterface $altTextGenerator,
    protected EntityTypeManagerInterface $entityTypeManager,
    protected LoggerInterface $logger,
  ) {
    parent::__construct();
  }

  /**
   * Generate alt-text for media images.
   *
   * @param array $options
   *   Command options.
   *
   * @command ndx:generate-alt-texts
   * @aliases ndx-alt
   * @usage ndx:generate-alt-texts
   *   Generate alt-text for all images missing alt-text.
   * @usage ndx:generate-alt-texts --limit=50
   *   Process up to 50 images.
   * @usage ndx:generate-alt-texts --force
   *   Regenerate alt-text even for images that already have it.
   * @usage ndx:generate-alt-texts --dry-run
   *   Preview what would be processed without making changes.
   */
  #[CLI\Command(name: 'ndx:generate-alt-texts', aliases: ['ndx-alt'])]
  #[CLI\Option(name: 'limit', description: 'Maximum number of images to process')]
  #[CLI\Option(name: 'force', description: 'Regenerate even if alt-text exists')]
  #[CLI\Option(name: 'dry-run', description: 'Preview without making changes')]
  #[CLI\Option(name: 'batch-size', description: 'Number of items per batch')]
  public function generateAltTexts(
    array $options = [
      'limit' => 100,
      'force' => FALSE,
      'dry-run' => FALSE,
      'batch-size' => 10,
    ],
  ): void {
    $limit = (int) $options['limit'];
    $force = (bool) $options['force'];
    $dryRun = (bool) $options['dry-run'];
    $batchSize = (int) $options['batch-size'];

    if (!$this->altTextGenerator->isAvailable()) {
      $this->logger()->error('Alt-text generation service is not available. Check AWS configuration.');
      return;
    }

    $this->logger()->info('Finding media images to process...');

    // Build query.
    $query = $this->entityTypeManager->getStorage('media')->getQuery()
      ->condition('bundle', 'image')
      ->accessCheck(FALSE);

    if (!$force) {
      // Find images without alt-text using entity query.
      // Note: This is an approximation - we'll filter more precisely later.
      $query->notExists('field_ai_generated_alt');
    }

    $query->range(0, $limit);
    $ids = $query->execute();

    if (empty($ids)) {
      $this->logger()->success('No media images found to process.');
      return;
    }

    // Further filter to only images that need alt-text.
    $filteredIds = $this->filterIdsNeedingAltText($ids, $force);

    if (empty($filteredIds)) {
      $this->logger()->success('All media images already have alt-text.');
      return;
    }

    $count = count($filteredIds);
    $this->logger()->info("Found {$count} images to process.");

    if ($dryRun) {
      $this->logger()->notice('Dry run mode - no changes will be made.');
      $this->previewImages($filteredIds);
      return;
    }

    // Process in batches.
    $results = $this->altTextGenerator->batchGenerate(
      $filteredIds,
      $batchSize,
      !$force
    );

    // Report results.
    $success = 0;
    $failed = 0;
    $skipped = 0;

    foreach ($results as $mediaId => $result) {
      if ($result->isSuccess()) {
        $success++;
        $this->logger()->info("Media @id: @alt", [
          '@id' => $mediaId,
          '@alt' => substr($result->altText, 0, 60) . (strlen($result->altText) > 60 ? '...' : ''),
        ]);
      }
      elseif (str_contains($result->error ?? '', 'Skipped')) {
        $skipped++;
      }
      else {
        $failed++;
        $this->logger()->warning("Media @id failed: @error", [
          '@id' => $mediaId,
          '@error' => $result->error,
        ]);
      }
    }

    $this->logger()->success("Complete: {$success} generated, {$skipped} skipped, {$failed} failed.");
  }

  /**
   * Check alt-text generation service status.
   *
   * @command ndx:alt-text-status
   * @aliases ndx-alt-status
   * @usage ndx:alt-text-status
   *   Check if the alt-text generation service is available.
   */
  #[CLI\Command(name: 'ndx:alt-text-status', aliases: ['ndx-alt-status'])]
  public function altTextStatus(): void {
    if ($this->altTextGenerator->isAvailable()) {
      $this->logger()->success('Alt-text generation service is available.');
    }
    else {
      $this->logger()->error('Alt-text generation service is NOT available.');
      $this->logger()->info('Check AWS credentials and Vision service configuration.');
    }

    // Count images needing alt-text.
    $query = $this->entityTypeManager->getStorage('media')->getQuery()
      ->condition('bundle', 'image')
      ->accessCheck(FALSE);

    $totalImages = count($query->execute());

    // Load and check each for alt-text.
    $needsAlt = 0;
    $hasAlt = 0;
    $aiGenerated = 0;

    $ids = $query->execute();
    $storage = $this->entityTypeManager->getStorage('media');

    foreach (array_chunk($ids, 50) as $batch) {
      $entities = $storage->loadMultiple($batch);
      foreach ($entities as $media) {
        if ($this->altTextGenerator->needsAltText($media)) {
          $needsAlt++;
        }
        else {
          $hasAlt++;
        }
        if ($this->altTextGenerator->hasAiGeneratedAltText($media)) {
          $aiGenerated++;
        }
      }
    }

    $this->logger()->info("Total image media: {$totalImages}");
    $this->logger()->info("With alt-text: {$hasAlt}");
    $this->logger()->info("Needing alt-text: {$needsAlt}");
    $this->logger()->info("AI-generated: {$aiGenerated}");
  }

  /**
   * Filter media IDs to only those needing alt-text.
   *
   * @param array $ids
   *   Media entity IDs.
   * @param bool $force
   *   If TRUE, include all IDs regardless of existing alt-text.
   *
   * @return array
   *   Filtered array of IDs.
   */
  protected function filterIdsNeedingAltText(array $ids, bool $force): array {
    if ($force) {
      return $ids;
    }

    $filtered = [];
    $storage = $this->entityTypeManager->getStorage('media');

    foreach (array_chunk($ids, 50) as $batch) {
      $entities = $storage->loadMultiple($batch);
      foreach ($entities as $id => $media) {
        if ($this->altTextGenerator->needsAltText($media)) {
          $filtered[] = $id;
        }
      }
    }

    return $filtered;
  }

  /**
   * Preview images that would be processed.
   *
   * @param array $ids
   *   Media entity IDs.
   */
  protected function previewImages(array $ids): void {
    $storage = $this->entityTypeManager->getStorage('media');

    foreach (array_chunk($ids, 50) as $batch) {
      $entities = $storage->loadMultiple($batch);
      foreach ($entities as $id => $media) {
        $name = $media->getName() ?? 'Untitled';
        $this->logger()->notice("Would process: Media @id - @name", [
          '@id' => $id,
          '@name' => $name,
        ]);
      }
    }
  }

}
