<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Commands;

use Drupal\ndx_council_generator\Generator\CouncilIdentityGeneratorInterface;
use Drupal\ndx_council_generator\Service\ContentGenerationOrchestratorInterface;
use Drupal\ndx_council_generator\Service\ContentTemplateManagerInterface;
use Drupal\ndx_council_generator\Service\GenerationStateManagerInterface;
use Drupal\ndx_council_generator\Service\ImageBatchProcessorInterface;
use Drupal\ndx_council_generator\Service\ImageSpecificationCollectorInterface;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Drush\Commands\DrushCommands;
use Psr\Log\LoggerInterface;

/**
 * Drush commands for council generation.
 *
 * Story 5.7: Drush Generation Command
 *
 * @codeCoverageIgnore
 */
class CouncilGeneratorCommands extends DrushCommands {

  /**
   * Exit code for success.
   */
  public const EXIT_SUCCESS = 0;

  /**
   * Exit code for failure.
   */
  public const EXIT_FAILURE = 1;

  /**
   * Exit code for configuration error.
   */
  public const EXIT_CONFIG_ERROR = 2;

  /**
   * Constructs a CouncilGeneratorCommands object.
   *
   * @param \Drupal\ndx_council_generator\Generator\CouncilIdentityGeneratorInterface $identityGenerator
   *   The identity generator.
   * @param \Drupal\ndx_council_generator\Service\ContentGenerationOrchestratorInterface $contentOrchestrator
   *   The content generation orchestrator.
   * @param \Drupal\ndx_council_generator\Service\ImageBatchProcessorInterface $imageBatchProcessor
   *   The image batch processor.
   * @param \Drupal\ndx_council_generator\Service\ImageSpecificationCollectorInterface $imageCollector
   *   The image specification collector.
   * @param \Drupal\ndx_council_generator\Service\ContentTemplateManagerInterface $templateManager
   *   The content template manager.
   * @param \Drupal\ndx_council_generator\Service\GenerationStateManagerInterface $stateManager
   *   The generation state manager.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected CouncilIdentityGeneratorInterface $identityGenerator,
    protected ContentGenerationOrchestratorInterface $contentOrchestrator,
    protected ImageBatchProcessorInterface $imageBatchProcessor,
    protected ImageSpecificationCollectorInterface $imageCollector,
    protected ContentTemplateManagerInterface $templateManager,
    protected GenerationStateManagerInterface $stateManager,
    protected LoggerInterface $logger,
  ) {
    parent::__construct();
  }

  /**
   * Generate a unique fictional council with AI content.
   *
   * @command localgov:generate-council
   * @aliases localgov:gen
   * @option dry-run Preview generation without saving changes
   * @option skip-images Skip image generation phase for faster testing
   * @option force Regenerate even if a council already exists
   * @option region Specify council region (e.g., "south_west", "wales")
   * @option verbose Show detailed progress information
   * @option non-interactive Run without prompts for automated use
   * @usage drush localgov:generate-council
   *   Generate a new council with full content and images.
   * @usage drush localgov:gen --dry-run
   *   Preview what would be generated without saving.
   * @usage drush localgov:gen --skip-images --force
   *   Regenerate content only, skipping images.
   *
   * @return int
   *   Exit code: 0 on success, 1 on failure, 2 on config error.
   */
  public function generateCouncil(array $options = [
    'dry-run' => FALSE,
    'skip-images' => FALSE,
    'force' => FALSE,
    'region' => NULL,
    'verbose' => FALSE,
    'non-interactive' => FALSE,
  ]): int {
    $startTime = microtime(TRUE);

    $this->printHeader($options['dry-run']);

    // Check if council already exists.
    if ($this->identityGenerator->hasIdentity() && !$options['force']) {
      $existingIdentity = $this->identityGenerator->loadIdentity();
      $this->io()->warning(sprintf(
        'Council already exists: %s. Use --force to regenerate.',
        $existingIdentity->name
      ));
      return self::EXIT_SUCCESS;
    }

    // Dry run mode.
    if ($options['dry-run']) {
      return $this->runDryRun($options);
    }

    try {
      // Phase 1: Generate Identity.
      $identity = $this->runIdentityPhase($options);
      if ($identity === NULL) {
        return self::EXIT_FAILURE;
      }

      // Phase 2: Generate Content.
      $contentResult = $this->runContentPhase($identity, $options);
      if ($contentResult === FALSE) {
        return self::EXIT_FAILURE;
      }

      // Phase 3: Generate Images (unless skipped).
      $imageResult = NULL;
      if (!$options['skip-images']) {
        $imageResult = $this->runImagePhase($identity, $options);
        if ($imageResult === FALSE) {
          return self::EXIT_FAILURE;
        }
      }

      // Print completion summary.
      $this->printCompletionSummary($identity, $contentResult, $imageResult, $startTime);

      $this->stateManager->markComplete();

      return self::EXIT_SUCCESS;

    }
    catch (\Exception $e) {
      $this->io()->error('Generation failed: ' . $e->getMessage());
      $this->logger->error('Council generation failed', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
      ]);
      $this->stateManager->setError($e->getMessage());
      return self::EXIT_FAILURE;
    }
  }

  /**
   * Print the command header.
   *
   * @param bool $dryRun
   *   Whether this is a dry run.
   */
  protected function printHeader(bool $dryRun): void {
    $this->io()->writeln('');
    $this->io()->writeln(str_repeat('=', 80));
    $suffix = $dryRun ? ' (DRY RUN)' : '';
    $this->io()->writeln('  LocalGov Drupal - Council Generation' . $suffix);
    $this->io()->writeln(str_repeat('=', 80));
    $this->io()->writeln('');
  }

  /**
   * Run dry run mode showing preview.
   *
   * @param array $options
   *   Command options.
   *
   * @return int
   *   Exit code.
   */
  protected function runDryRun(array $options): int {
    $this->io()->section('Preview of generation:');

    // Identity preview.
    $this->io()->writeln('  <info>Council Identity:</info>');
    $this->io()->writeln('    Name: Random (AI-generated)');
    if ($options['region']) {
      $this->io()->writeln(sprintf('    Region: %s (specified)', $options['region']));
    }
    else {
      $this->io()->writeln('    Region: Random selection');
    }
    $this->io()->writeln('    Theme: Will be generated based on region');
    $this->io()->writeln('    Population: Random size selection');
    $this->io()->writeln('');

    // Content preview.
    $contentCount = $this->templateManager->getContentCount();
    $templates = $this->templateManager->loadAllTemplates();
    $byType = [];
    foreach ($templates as $spec) {
      $type = $spec->contentType;
      $byType[$type] = ($byType[$type] ?? 0) + 1;
    }

    $this->io()->writeln('  <info>Content to Generate:</info>');
    foreach ($byType as $type => $count) {
      $this->io()->writeln(sprintf('    - %s: %d pages', ucfirst(str_replace('_', ' ', $type)), $count));
    }
    $this->io()->writeln(sprintf('    Total: %d pages', $contentCount));
    $this->io()->writeln('');

    // Image preview.
    $imageCount = $this->templateManager->getImageCount();
    $this->io()->writeln('  <info>Images to Generate:</info>');
    $this->io()->writeln(sprintf('    - Total specifications: ~%d', $imageCount));
    $estimatedUnique = (int) round($imageCount * 0.85);
    $this->io()->writeln(sprintf('    - After deduplication: ~%d unique images', $estimatedUnique));
    $this->io()->writeln('');

    // Cost estimate.
    $this->io()->writeln('  <info>Estimated Cost:</info>');
    $contentCost = sprintf('$%.2f-%.2f', $contentCount * 0.008, $contentCount * 0.012);
    $imageCost = sprintf('$%.2f-%.2f', $estimatedUnique * 0.008, $estimatedUnique * 0.012);
    $totalMin = ($contentCount * 0.008) + ($estimatedUnique * 0.008);
    $totalMax = ($contentCount * 0.012) + ($estimatedUnique * 0.012);
    $this->io()->writeln(sprintf('    - Content generation: %s', $contentCost));
    if (!$options['skip-images']) {
      $this->io()->writeln(sprintf('    - Image generation: %s', $imageCost));
    }
    $this->io()->writeln(sprintf('    Total: $%.2f-%.2f', $totalMin, $totalMax));
    $this->io()->writeln('');

    $this->io()->success('No changes made (dry run mode)');
    $this->io()->writeln('To proceed with generation, run without --dry-run flag.');

    return self::EXIT_SUCCESS;
  }

  /**
   * Run Phase 1: Identity Generation.
   *
   * @param array $options
   *   Command options.
   *
   * @return \Drupal\ndx_council_generator\Value\CouncilIdentity|null
   *   Generated identity or NULL on failure.
   */
  protected function runIdentityPhase(array $options): ?CouncilIdentity {
    $this->io()->section('[Phase 1/3] Generating Council Identity');

    $generationOptions = [];
    if (!empty($options['region'])) {
      $generationOptions['region'] = $options['region'];
    }

    try {
      $identity = $this->identityGenerator->generate($generationOptions);

      $this->io()->writeln(sprintf('  <info>✓</info> Name: %s', $identity->name));
      $this->io()->writeln(sprintf('  <info>✓</info> Region: %s', $identity->getRegionLabel()));
      $this->io()->writeln(sprintf('  <info>✓</info> Theme: %s', $identity->getThemeLabel()));
      $this->io()->writeln(sprintf('  <info>✓</info> Population: %s (%s)', number_format($identity->getPopulationValue()), $identity->populationRange));
      $this->io()->writeln('');

      return $identity;
    }
    catch (\Exception $e) {
      $this->io()->error('Identity generation failed: ' . $e->getMessage());
      return NULL;
    }
  }

  /**
   * Run Phase 2: Content Generation.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   * @param array $options
   *   Command options.
   *
   * @return array|false
   *   Content generation stats or FALSE on failure.
   */
  protected function runContentPhase(CouncilIdentity $identity, array $options): array|false {
    $this->io()->section('[Phase 2/3] Generating Content');

    $templates = $this->templateManager->loadAllTemplates();
    $byType = [];
    foreach ($templates as $spec) {
      $type = $spec->contentType;
      $byType[$type] = ($byType[$type] ?? 0) + 1;
    }

    $totalCount = count($templates);
    $processedCount = 0;
    $successCount = 0;

    $progressCallback = function ($progress) use (&$processedCount, &$successCount, $totalCount, $options): void {
      $processedCount++;
      if ($progress && isset($progress->currentStep)) {
        $successCount = $progress->currentStep;
      }
      if ($options['verbose'] && $processedCount % 5 === 0) {
        $this->io()->writeln(sprintf('    Progress: %d/%d', $processedCount, $totalCount));
      }
    };

    try {
      $result = $this->contentOrchestrator->generateAll($identity, $progressCallback);

      // Print summary by type.
      foreach ($byType as $type => $count) {
        $label = str_pad(ucfirst(str_replace('_', ' ', $type)) . ':', 16);
        $bar = $this->createProgressBar($count, $count);
        $this->io()->writeln(sprintf('  %s %s %d/%d (100%%)', $label, $bar, $count, $count));
      }

      $this->io()->writeln('');
      $this->io()->writeln(sprintf('  Total pages generated: %d', $result->totalProcessed));
      if ($result->hasFailures()) {
        $this->io()->writeln(sprintf('  <comment>Failed: %d</comment>', $result->failureCount));
      }
      $this->io()->writeln('');

      return [
        'total' => $result->totalProcessed,
        'success' => $result->successCount,
        'failed' => $result->failureCount,
      ];
    }
    catch (\Exception $e) {
      $this->io()->error('Content generation failed: ' . $e->getMessage());
      return FALSE;
    }
  }

  /**
   * Run Phase 3: Image Generation.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   * @param array $options
   *   Command options.
   *
   * @return array|false
   *   Image generation stats or FALSE on failure.
   */
  protected function runImagePhase(CouncilIdentity $identity, array $options): array|false {
    $this->io()->section('[Phase 3/3] Generating Images');

    $queue = $this->imageCollector->getQueue();
    $totalImages = $queue->getTotalCount();
    $pendingImages = count($queue->getPendingIds());
    $duplicates = $queue->getDuplicateCount();

    $processedCount = 0;

    $progressCallback = function ($progress) use (&$processedCount, $pendingImages, $options): void {
      $processedCount++;
      if ($options['verbose'] && $processedCount % 3 === 0) {
        $this->io()->writeln(sprintf('    Progress: %d/%d', $processedCount, $pendingImages));
      }
    };

    try {
      $result = $this->imageBatchProcessor->processQueue($identity, $progressCallback);

      $bar = $this->createProgressBar($result->totalProcessed, $result->totalProcessed);
      $this->io()->writeln(sprintf('  Progress:     %s %d/%d (100%%)', $bar, $result->totalProcessed, $result->totalProcessed));

      if ($duplicates > 0) {
        $this->io()->writeln(sprintf('  Duplicates resolved: %d', $duplicates));
      }

      $this->io()->writeln('');
      $this->io()->writeln(sprintf('  Total images generated: %d', $result->successCount));
      if ($result->hasFailures()) {
        $this->io()->writeln(sprintf('  <comment>Failed: %d</comment>', $result->failureCount));
      }
      $this->io()->writeln('');

      return [
        'total' => $totalImages,
        'generated' => $result->successCount,
        'duplicates' => $duplicates,
        'failed' => $result->failureCount,
      ];
    }
    catch (\Exception $e) {
      $this->io()->error('Image generation failed: ' . $e->getMessage());
      return FALSE;
    }
  }

  /**
   * Print completion summary.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   * @param array $contentResult
   *   Content generation results.
   * @param array|null $imageResult
   *   Image generation results or NULL if skipped.
   * @param float $startTime
   *   Start time as microtime.
   */
  protected function printCompletionSummary(
    CouncilIdentity $identity,
    array $contentResult,
    ?array $imageResult,
    float $startTime,
  ): void {
    $duration = microtime(TRUE) - $startTime;

    $this->io()->writeln(str_repeat('=', 80));
    $this->io()->writeln('  Generation Complete');
    $this->io()->writeln(str_repeat('=', 80));
    $this->io()->writeln('');
    $this->io()->writeln(sprintf('  Council:      %s', $identity->name));
    $this->io()->writeln(sprintf('  Content:      %d pages', $contentResult['total']));

    if ($imageResult !== NULL) {
      $imageInfo = sprintf('%d generated', $imageResult['generated']);
      if ($imageResult['duplicates'] > 0) {
        $imageInfo .= sprintf(' (%d duplicates resolved)', $imageResult['duplicates']);
      }
      $this->io()->writeln(sprintf('  Images:       %s', $imageInfo));
    }
    else {
      $this->io()->writeln('  Images:       Skipped (--skip-images)');
    }

    $this->io()->writeln(sprintf('  Duration:     %s', $this->formatDuration($duration)));

    // Estimate cost.
    $contentCost = $contentResult['total'] * 0.01;
    $imageCost = $imageResult !== NULL ? $imageResult['generated'] * 0.01 : 0;
    $totalCost = $contentCost + $imageCost;
    $this->io()->writeln(sprintf('  Est. Cost:    $%.2f', $totalCost));

    $this->io()->writeln('');
    $this->io()->success('Council generation complete!');
  }

  /**
   * Create a simple text-based progress bar.
   *
   * @param int $current
   *   Current progress.
   * @param int $total
   *   Total items.
   * @param int $width
   *   Bar width in characters.
   *
   * @return string
   *   Progress bar string.
   */
  protected function createProgressBar(int $current, int $total, int $width = 20): string {
    if ($total === 0) {
      return '[' . str_repeat(' ', $width) . ']';
    }

    $progress = (int) round(($current / $total) * $width);
    $filled = str_repeat('█', $progress);
    $empty = str_repeat(' ', $width - $progress);

    return '[' . $filled . $empty . ']';
  }

  /**
   * Format duration in human-readable format.
   *
   * @param float $seconds
   *   Duration in seconds.
   *
   * @return string
   *   Formatted duration string.
   */
  protected function formatDuration(float $seconds): string {
    if ($seconds < 60) {
      return sprintf('%.1fs', $seconds);
    }

    $minutes = (int) floor($seconds / 60);
    $remainingSeconds = (int) ($seconds % 60);

    return sprintf('%dm %ds', $minutes, $remainingSeconds);
  }

}
