<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Commands;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\ndx_aws_ai\Service\ImageGenerationServiceInterface;
use Drupal\ndx_council_generator\Generator\CouncilIdentityGeneratorInterface;
use Drupal\ndx_council_generator\Service\ContentGenerationOrchestratorInterface;
use Drupal\ndx_council_generator\Service\ContentTemplateManagerInterface;
use Drupal\ndx_council_generator\Service\GenerationStateManagerInterface;
use Drupal\ndx_council_generator\Service\ImageBatchProcessorInterface;
use Drupal\ndx_council_generator\Service\ImageSpecificationCollectorInterface;
use Drupal\ndx_council_generator\Service\NavigationMenuConfiguratorInterface;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Drush\Commands\DrushCommands;

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
   * @param \Drupal\ndx_aws_ai\Service\ImageGenerationServiceInterface|null $imageGenerationService
   *   The image generation service.
   * @param \Drupal\Core\File\FileSystemInterface|null $fileSystem
   *   The file system service.
   * @param \Drupal\Core\Config\ConfigFactoryInterface|null $configFactory
   *   The config factory.
   * @param \Drupal\ndx_council_generator\Service\NavigationMenuConfiguratorInterface|null $navigationConfigurator
   *   The navigation menu configurator service.
   */
  public function __construct(
    protected CouncilIdentityGeneratorInterface $identityGenerator,
    protected ContentGenerationOrchestratorInterface $contentOrchestrator,
    protected ImageBatchProcessorInterface $imageBatchProcessor,
    protected ImageSpecificationCollectorInterface $imageCollector,
    protected ContentTemplateManagerInterface $templateManager,
    protected GenerationStateManagerInterface $stateManager,
    protected ?ImageGenerationServiceInterface $imageGenerationService = NULL,
    protected ?FileSystemInterface $fileSystem = NULL,
    protected ?ConfigFactoryInterface $configFactory = NULL,
    protected ?NavigationMenuConfiguratorInterface $navigationConfigurator = NULL,
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
   * @option detailed Show detailed progress information
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
    'detailed' => FALSE,
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

      // Phase 1b: Generate Council Crest/Logo.
      if (!$options['skip-images']) {
        $this->runCrestGenerationPhase($identity);
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

      // Phase 4: Configure Navigation Menu.
      $navigationResult = $this->runNavigationPhase($identity);

      // Print completion summary.
      $this->printCompletionSummary($identity, $contentResult, $imageResult, $navigationResult, $startTime);

      // Configure front page to the generated homepage.
      $this->configureFrontPage($identity);

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
      $this->io()->writeln(sprintf('  <info>✓</info> Region: %s', $identity->getRegionName()));
      $this->io()->writeln(sprintf('  <info>✓</info> Theme: %s', $identity->getThemeName()));
      $this->io()->writeln(sprintf('  <info>✓</info> Population: %s (%s)', number_format($identity->populationEstimate), $identity->populationRange));
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
      if ($options['detailed'] && $processedCount % 5 === 0) {
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
    $totalImages = $queue->getCount();
    $pendingImages = $queue->getPendingCount();
    $duplicates = $queue->getDuplicateCount();

    $processedCount = 0;

    $progressCallback = function ($progress) use (&$processedCount, $pendingImages, $options): void {
      $processedCount++;
      if ($options['detailed'] && $processedCount % 3 === 0) {
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
   * Run Phase 4: Navigation Menu Configuration.
   *
   * Story 5.9: Configure navigation menus after content generation.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   *
   * @return array|null
   *   Navigation configuration stats or NULL if service unavailable.
   */
  protected function runNavigationPhase(CouncilIdentity $identity): ?array {
    if ($this->navigationConfigurator === NULL) {
      $this->logger->warning('Navigation configurator not available');
      return NULL;
    }

    $this->io()->section('[Phase 4/4] Configuring Navigation');

    try {
      $result = $this->navigationConfigurator->configureNavigation($identity);

      $this->io()->writeln(sprintf('  <info>✓</info> Main menu links: %d created', $result->mainLinksCreated));
      $this->io()->writeln(sprintf('  <info>✓</info> Service categories: %d created', $result->categoryLinksCreated));

      if ($result->linksSkipped > 0) {
        $this->io()->writeln(sprintf('  <comment>→</comment> Existing links skipped: %d', $result->linksSkipped));
      }

      if ($result->hasErrors()) {
        foreach ($result->errors as $error) {
          $this->io()->writeln(sprintf('  <error>✗</error> Error: %s', $error));
        }
      }

      $this->io()->writeln('');

      return [
        'total' => $result->getTotalCreated(),
        'main' => $result->mainLinksCreated,
        'categories' => $result->categoryLinksCreated,
        'skipped' => $result->linksSkipped,
      ];
    }
    catch (\Exception $e) {
      $this->io()->error('Navigation configuration failed: ' . $e->getMessage());
      $this->logger->error('Navigation configuration failed', [
        'error' => $e->getMessage(),
      ]);
      // Return NULL but don't fail the entire generation.
      return NULL;
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
   * @param array|null $navigationResult
   *   Navigation configuration results or NULL if skipped.
   * @param float $startTime
   *   Start time as microtime.
   */
  protected function printCompletionSummary(
    CouncilIdentity $identity,
    array $contentResult,
    ?array $imageResult,
    ?array $navigationResult,
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

    if ($navigationResult !== NULL) {
      $navInfo = sprintf('%d menu links', $navigationResult['total']);
      if ($navigationResult['skipped'] > 0) {
        $navInfo .= sprintf(' (%d existing)', $navigationResult['skipped']);
      }
      $this->io()->writeln(sprintf('  Navigation:   %s', $navInfo));
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

  /**
   * Run crest/logo generation phase.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   */
  protected function runCrestGenerationPhase(CouncilIdentity $identity): void {
    if ($this->imageGenerationService === NULL || $this->fileSystem === NULL || $this->configFactory === NULL) {
      $this->logger->warning('Image generation services not available for crest generation');
      return;
    }

    $this->io()->writeln('  Generating council crest...');

    try {
      // Generate a professional council crest/logo.
      $prompt = sprintf(
        'A professional local government council logo or crest for "%s" council in the UK. ' .
        'Clean, simple, modern civic design suitable for official documents. ' .
        'Professional shield or emblem style. Solid background, high contrast. ' .
        'No text, no words, just the visual emblem design. Corporate blue and gold colors. ' .
        'Minimalist heraldic style.',
        $identity->name
      );

      $result = $this->imageGenerationService->generateImage(
        prompt: $prompt,
        width: 512,
        height: 512,
        style: 'illustration',
      );

      if (!$result->success || $result->imageData === NULL) {
        $this->logger->warning('Crest generation failed: @error', [
          '@error' => $result->error ?? 'Unknown error',
        ]);
        $this->io()->writeln('  <comment>Crest generation skipped (generation failed)</comment>');
        return;
      }

      // Save to public files directory.
      $directory = 'public://generated-images';
      $this->fileSystem->prepareDirectory(
        $directory,
        FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS
      );

      $logoPath = $directory . '/council-logo.png';
      $savedUri = $this->fileSystem->saveData(
        $result->imageData,
        $logoPath,
        FileSystemInterface::EXISTS_REPLACE
      );

      if ($savedUri === FALSE) {
        $this->logger->warning('Failed to save crest image');
        return;
      }

      // Configure the site logo using theme settings.
      $config = $this->configFactory->getEditable('system.theme.global');
      $config->set('logo.use_default', FALSE);
      $config->set('logo.path', $savedUri);
      $config->save();

      $this->io()->writeln(sprintf('  <info>✓</info> Council crest generated: %s', $savedUri));

    }
    catch (\Exception $e) {
      $this->logger->warning('Crest generation error: @error', [
        '@error' => $e->getMessage(),
      ]);
      $this->io()->writeln('  <comment>Crest generation skipped (error occurred)</comment>');
    }
  }

  /**
   * Configure the site front page to the generated homepage.
   *
   * Finds the homepage node (Welcome to X) and sets it as the site front page.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   */
  protected function configureFrontPage(CouncilIdentity $identity): void {
    if ($this->configFactory === NULL) {
      $this->logger->warning('Config factory not available for front page configuration');
      return;
    }

    $this->io()->writeln('');
    $this->io()->writeln('  Configuring site front page...');

    try {
      // Use Drupal's entity type manager to find the homepage.
      $entityTypeManager = \Drupal::entityTypeManager();
      $nodeStorage = $entityTypeManager->getStorage('node');

      // Look for the homepage by title pattern.
      $expectedTitle = 'Welcome to ' . $identity->name;
      $nodes = $nodeStorage->loadByProperties([
        'type' => 'localgov_services_landing',
        'title' => $expectedTitle,
      ]);

      if (empty($nodes)) {
        // Fallback: look for any node starting with "Welcome to".
        $query = $nodeStorage->getQuery()
          ->condition('type', 'localgov_services_landing')
          ->condition('title', 'Welcome to%', 'LIKE')
          ->accessCheck(FALSE)
          ->range(0, 1);
        $nids = $query->execute();
        if (!empty($nids)) {
          $nodes = $nodeStorage->loadMultiple($nids);
        }
      }

      if (empty($nodes)) {
        $this->io()->writeln('  <comment>No homepage node found to set as front page</comment>');
        return;
      }

      $homepage = reset($nodes);
      $nid = $homepage->id();

      // Set the front page configuration.
      $config = $this->configFactory->getEditable('system.site');
      $config->set('page.front', '/node/' . $nid);
      $config->save();

      $this->io()->writeln(sprintf('  <info>✓</info> Front page set to node/%d (%s)', $nid, $homepage->getTitle()));

    }
    catch (\Exception $e) {
      $this->logger->warning('Front page configuration error: @error', [
        '@error' => $e->getMessage(),
      ]);
      $this->io()->writeln('  <comment>Front page configuration failed: ' . $e->getMessage() . '</comment>');
    }
  }

}
