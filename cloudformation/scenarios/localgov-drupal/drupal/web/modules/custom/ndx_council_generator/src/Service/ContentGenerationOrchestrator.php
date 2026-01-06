<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\ndx_aws_ai\Service\BedrockServiceInterface;
use Drupal\ndx_council_generator\Value\ContentGenerationResult;
use Drupal\ndx_council_generator\Value\ContentSpecification;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Drupal\ndx_council_generator\Value\GenerationProgress;
use Drupal\ndx_council_generator\Value\GenerationState;
use Drupal\ndx_council_generator\Value\GenerationSummary;
use Psr\Log\LoggerInterface;

/**
 * Orchestrates content generation using AI templates.
 *
 * Story 5.4: Content Generation Orchestrator
 */
class ContentGenerationOrchestrator implements ContentGenerationOrchestratorInterface {

  /**
   * Default delay between API calls in milliseconds.
   */
  protected const DEFAULT_RATE_LIMIT_DELAY_MS = 0;

  /**
   * Maximum retry attempts for throttled requests.
   */
  protected const MAX_THROTTLE_RETRIES = 3;

  /**
   * Current generation progress.
   */
  protected ?GenerationProgress $currentProgress = NULL;

  /**
   * The council identity for current generation run.
   */
  protected ?CouncilIdentity $currentIdentity = NULL;

  /**
   * Constructs a ContentGenerationOrchestrator.
   *
   * @param \Drupal\ndx_council_generator\Service\ContentTemplateManagerInterface $templateManager
   *   The content template manager.
   * @param \Drupal\ndx_aws_ai\Service\BedrockServiceInterface $bedrockService
   *   The Bedrock AI service.
   * @param \Drupal\ndx_council_generator\Service\GenerationStateManagerInterface $stateManager
   *   The generation state manager.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The config factory.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   * @param \Drupal\ndx_council_generator\Service\ImageSpecificationCollectorInterface|null $imageCollector
   *   The image specification collector.
   */
  public function __construct(
    protected ContentTemplateManagerInterface $templateManager,
    protected BedrockServiceInterface $bedrockService,
    protected GenerationStateManagerInterface $stateManager,
    protected EntityTypeManagerInterface $entityTypeManager,
    protected ConfigFactoryInterface $configFactory,
    protected LoggerInterface $logger,
    protected ?ImageSpecificationCollectorInterface $imageCollector = NULL,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function generateAll(CouncilIdentity $identity, ?callable $progressCallback = NULL): GenerationSummary {
    $templates = $this->templateManager->getTemplatesInOrder();
    $totalItems = count($templates);
    $startedAt = time();
    $results = [];

    $this->currentIdentity = $identity;
    $this->currentProgress = GenerationProgress::content(0, $totalItems, 'Starting');

    // Update state to content generation.
    $this->stateManager->updateStatus(GenerationState::STATUS_GENERATING_CONTENT);
    $this->stateManager->updateProgress(0, $totalItems, 'Starting content generation');

    $this->logger->info('Starting content generation: @total items', [
      '@total' => $totalItems,
    ]);

    $step = 0;
    foreach ($templates as $spec) {
      $step++;

      // Update progress.
      $this->currentProgress = GenerationProgress::content(
        $step,
        $totalItems,
        $spec->id
      );

      $this->stateManager->updateProgress(
        $step,
        $totalItems,
        sprintf('Generating: %s', $spec->id)
      );

      // Generate the content.
      $result = $this->generateSingle($spec, $identity);
      $results[] = $result;

      // Call progress callback if provided.
      if ($progressCallback !== NULL) {
        $progressCallback($this->currentProgress);
      }

      // Rate limiting delay between API calls.
      $this->applyRateLimitDelay();
    }

    $summary = GenerationSummary::fromResults($results, $startedAt);

    // Store failed spec IDs for retry capability.
    $this->storeFailedSpecs($summary->failedSpecIds);

    // Log summary.
    $this->logger->info('Content generation complete: @summary', [
      '@summary' => $summary->getSummaryText(),
    ]);

    $this->currentProgress = NULL;
    $this->currentIdentity = NULL;

    // Log image collection statistics.
    if ($this->imageCollector !== NULL) {
      $stats = $this->imageCollector->getStatistics();
      $this->logger->info('Image queue: @stats', ['@stats' => $stats->getSummaryText()]);
    }

    // Link service pages to the landing page for homepage display.
    $this->linkServicesToLanding($identity);

    // Link news articles to the newsroom landing page.
    $this->linkNewsToNewsroom($identity);

    return $summary;
  }

  /**
   * {@inheritdoc}
   */
  public function generateSingle(ContentSpecification $spec, CouncilIdentity $identity): ContentGenerationResult {
    $startTime = microtime(TRUE);

    try {
      $this->logger->debug('Generating content: @id', ['@id' => $spec->id]);

      // Render the prompt with identity variables.
      $prompt = $spec->renderPrompt($identity);

      // Call Bedrock to generate content.
      $responseText = $this->callBedrockWithRetry($prompt);

      // Parse the JSON response.
      $contentData = $this->parseBedrockResponse($responseText, $spec->id);

      // Create the Drupal node.
      $nodeId = $this->createNode($spec, $contentData, $identity);

      $processingTimeMs = (int) ((microtime(TRUE) - $startTime) * 1000);

      $this->logger->info('Generated content for @id: node @nodeId', [
        '@id' => $spec->id,
        '@nodeId' => $nodeId,
      ]);

      // Collect image specifications for later batch generation.
      $this->collectImagesFromContent($spec, $nodeId, $identity);

      return ContentGenerationResult::fromSuccess($spec->id, $nodeId, $processingTimeMs);
    }
    catch (\Exception $e) {
      $processingTimeMs = (int) ((microtime(TRUE) - $startTime) * 1000);

      $this->logger->error('Failed to generate @id: @error', [
        '@id' => $spec->id,
        '@error' => $e->getMessage(),
      ]);

      return ContentGenerationResult::fromFailure($spec->id, $e->getMessage(), $processingTimeMs);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function retryFailed(CouncilIdentity $identity, ?callable $progressCallback = NULL): GenerationSummary {
    $failedSpecIds = $this->getFailedSpecIds();

    if (empty($failedSpecIds)) {
      $this->logger->info('No failed items to retry');
      return GenerationSummary::fromResults([], time());
    }

    $startedAt = time();
    $results = [];
    $totalItems = count($failedSpecIds);

    $this->currentProgress = GenerationProgress::content(0, $totalItems, 'Retrying failed items');

    $this->logger->info('Retrying @count failed items', ['@count' => $totalItems]);

    $step = 0;
    foreach ($failedSpecIds as $specId) {
      $step++;

      $spec = $this->templateManager->getTemplate($specId);
      if ($spec === NULL) {
        $this->logger->warning('Template not found for retry: @id', ['@id' => $specId]);
        $results[] = ContentGenerationResult::fromFailure($specId, 'Template not found');
        continue;
      }

      $this->currentProgress = GenerationProgress::content($step, $totalItems, $specId);

      $result = $this->generateSingle($spec, $identity);
      $results[] = $result;

      if ($progressCallback !== NULL) {
        $progressCallback($this->currentProgress);
      }

      $this->applyRateLimitDelay();
    }

    $summary = GenerationSummary::fromResults($results, $startedAt);

    // Update stored failed specs.
    $this->storeFailedSpecs($summary->failedSpecIds);

    $this->currentProgress = NULL;

    return $summary;
  }

  /**
   * {@inheritdoc}
   */
  public function getProgress(): ?GenerationProgress {
    return $this->currentProgress;
  }

  /**
   * {@inheritdoc}
   */
  public function isGenerating(): bool {
    return $this->currentProgress !== NULL;
  }

  /**
   * {@inheritdoc}
   */
  public function getFailedSpecIds(): array {
    $state = $this->stateManager->getState();
    $metadata = $state->identity['_metadata'] ?? [];
    return $metadata['failed_specs'] ?? [];
  }

  /**
   * Call Bedrock with retry logic for throttling.
   *
   * @param string $prompt
   *   The prompt to send.
   *
   * @return string
   *   The response text.
   *
   * @throws \Exception
   *   If all retries fail.
   */
  protected function callBedrockWithRetry(string $prompt): string {
    $attempts = 0;
    $lastError = NULL;

    while ($attempts < self::MAX_THROTTLE_RETRIES) {
      try {
        return $this->bedrockService->generateContent($prompt);
      }
      catch (\Exception $e) {
        $lastError = $e;
        $attempts++;

        // Check if this is a throttling error.
        if ($this->isThrottlingError($e) && $attempts < self::MAX_THROTTLE_RETRIES) {
          $backoffMs = $this->calculateBackoff($attempts);
          $this->logger->warning('Bedrock throttled, backing off @ms ms (attempt @attempt)', [
            '@ms' => $backoffMs,
            '@attempt' => $attempts,
          ]);
          usleep($backoffMs * 1000);
          continue;
        }

        throw $e;
      }
    }

    throw $lastError ?? new \RuntimeException('Max retries exceeded');
  }

  /**
   * Check if an exception indicates throttling.
   *
   * @param \Exception $e
   *   The exception to check.
   *
   * @return bool
   *   TRUE if this is a throttling error.
   */
  protected function isThrottlingError(\Exception $e): bool {
    $message = strtolower($e->getMessage());
    return str_contains($message, 'throttl') ||
           str_contains($message, 'rate') ||
           str_contains($message, 'limit') ||
           str_contains($message, 'too many requests');
  }

  /**
   * Calculate exponential backoff delay.
   *
   * @param int $attempt
   *   The current attempt number.
   *
   * @return int
   *   Backoff delay in milliseconds.
   */
  protected function calculateBackoff(int $attempt): int {
    // Exponential backoff: 1s, 2s, 4s, 8s.
    return (int) (1000 * pow(2, $attempt - 1));
  }

  /**
   * Parse Bedrock response JSON.
   *
   * @param string $responseText
   *   The raw response text from Bedrock.
   * @param string $specId
   *   The spec ID for error context.
   *
   * @return array<string, mixed>
   *   The parsed content data.
   *
   * @throws \RuntimeException
   *   If JSON parsing fails.
   */
  protected function parseBedrockResponse(string $responseText, string $specId): array {
    // Try to extract JSON from the response.
    // Bedrock may include explanation text before/after JSON.
    $jsonMatch = preg_match('/\{[\s\S]*\}/', $responseText, $matches);

    if (!$jsonMatch) {
      throw new \RuntimeException(sprintf(
        'No JSON found in Bedrock response for %s',
        $specId
      ));
    }

    $jsonData = json_decode($matches[0], TRUE);

    if (json_last_error() !== JSON_ERROR_NONE) {
      throw new \RuntimeException(sprintf(
        'Failed to parse JSON for %s: %s',
        $specId,
        json_last_error_msg()
      ));
    }

    return $jsonData;
  }

  /**
   * Create a Drupal node from generated content.
   *
   * @param \Drupal\ndx_council_generator\Value\ContentSpecification $spec
   *   The content specification.
   * @param array<string, mixed> $contentData
   *   The generated content data.
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   *
   * @return int
   *   The created node ID.
   *
   * @throws \Exception
   *   If node creation fails.
   */
  protected function createNode(ContentSpecification $spec, array $contentData, CouncilIdentity $identity): int {
    $nodeStorage = $this->entityTypeManager->getStorage('node');

    // Determine the node bundle from content type.
    $bundle = $this->getNodeBundle($spec->contentType);

    // Build node values.
    // Note: LocalGov Drupal uses Content Moderation module, so we must set
    // moderation_state in addition to status for content to be published.
    $values = [
      'type' => $bundle,
      'status' => 1,
      'uid' => 1,
      'moderation_state' => 'published',
    ];

    // Log the content data received from Bedrock for debugging.
    $this->logger->debug('Creating node @id with data keys: @keys', [
      '@id' => $spec->id,
      '@keys' => implode(', ', array_keys($contentData)),
    ]);

    // Map drupal fields from specification.
    foreach ($spec->drupalFields as $drupalField => $contentKey) {
      if (isset($contentData[$contentKey])) {
        $values[$drupalField] = $this->prepareFieldValue($drupalField, $contentData[$contentKey]);
        $this->logger->debug('Mapped field @drupal <- @key (length: @len)', [
          '@drupal' => $drupalField,
          '@key' => $contentKey,
          '@len' => is_string($contentData[$contentKey]) ? strlen($contentData[$contentKey]) : 'array',
        ]);
      }
      else {
        $this->logger->warning('Content key @key not found in Bedrock response for @id', [
          '@key' => $contentKey,
          '@id' => $spec->id,
        ]);
      }
    }

    // Fallback title from template if not in content.
    if (!isset($values['title']) || empty($values['title'])) {
      $values['title'] = $spec->renderTitle($identity);
    }

    // Ensure title is a non-empty string (critical for node creation).
    if (!is_string($values['title']) || trim($values['title']) === '') {
      $values['title'] = ucfirst(str_replace('-', ' ', $spec->id)) . ' - ' . $identity->name;
    }

    // LocalGov service pages require a summary field.
    // Generate one from body content or title if not provided.
    if (!isset($values['field_summary']) || empty($values['field_summary'])) {
      $summary = '';
      if (isset($contentData['summary'])) {
        $summary = $contentData['summary'];
      }
      elseif (isset($contentData['body'])) {
        // Extract first sentence from body as summary.
        $bodyText = is_string($contentData['body']) ? strip_tags($contentData['body']) : '';
        $summary = $this->extractSummary($bodyText, 200);
      }
      if (empty($summary)) {
        $summary = sprintf('Information about %s from %s.', $values['title'], $identity->name);
      }
      $values['field_summary'] = $summary;
    }

    // Ensure body content is set - this is critical for landing pages.
    // LocalGov landing pages have a 'body' field but it may not be mapped.
    if (!isset($values['body']) && isset($contentData['body'])) {
      $values['body'] = $this->prepareFieldValue('body', $contentData['body']);
      $this->logger->info('Added body content fallback for @id', ['@id' => $spec->id]);
    }

    // Log the final values being set on the node.
    $this->logger->debug('Node @id values: body set: @has_body, summary set: @has_summary', [
      '@id' => $spec->id,
      '@has_body' => isset($values['body']) ? 'yes' : 'no',
      '@has_summary' => isset($values['field_summary']) ? 'yes' : 'no',
    ]);

    // Ensure we're using a valid node bundle.
    if (!$this->entityTypeManager->getStorage('node_type')->load($bundle)) {
      $this->logger->error('Node type @bundle not found. Ensure LocalGov modules are enabled.', [
        '@bundle' => $bundle,
      ]);
      throw new \RuntimeException(sprintf(
        'Node type %s not found. Ensure LocalGov modules are enabled.',
        $bundle
      ));
    }

    // For service pages, set parent to the homepage (services landing).
    // LocalGov Drupal uses localgov_services_parent to establish page hierarchy.
    if ($bundle === 'localgov_services_page' && !isset($values['localgov_services_parent'])) {
      $parentNid = $this->findServicesLandingPage($identity);
      if ($parentNid !== NULL) {
        $values['localgov_services_parent'] = ['target_id' => $parentNid];
        $this->logger->debug('Setting parent for service page: @parent', [
          '@parent' => $parentNid,
        ]);
      }
    }

    // Create and save the node.
    $node = $nodeStorage->create($values);
    $node->save();

    return (int) $node->id();
  }

  /**
   * Get the node bundle for a content type.
   *
   * @param string $contentType
   *   The content type from specification.
   *
   * @return string
   *   The node bundle machine name.
   */
  protected function getNodeBundle(string $contentType): string {
    // Map content types to bundles.
    $mapping = [
      ContentSpecification::TYPE_SERVICE_PAGE => 'localgov_services_page',
      ContentSpecification::TYPE_SERVICE_LANDING => 'localgov_services_landing',
      ContentSpecification::TYPE_GUIDE_PAGE => 'localgov_guides_page',
      ContentSpecification::TYPE_DIRECTORY => 'localgov_directory_venue',
      ContentSpecification::TYPE_NEWS => 'localgov_news_article',
      ContentSpecification::TYPE_PAGE => 'page',
    ];

    // If exact match not found, try the content type string directly.
    if (isset($mapping[$contentType])) {
      return $mapping[$contentType];
    }

    // Allow direct bundle names (for flexibility).
    return $contentType;
  }

  /**
   * Prepare a field value for the node.
   *
   * @param string $fieldName
   *   The Drupal field name.
   * @param mixed $value
   *   The raw value.
   *
   * @return mixed
   *   The prepared value.
   */
  protected function prepareFieldValue(string $fieldName, mixed $value): mixed {
    // Handle body field with format.
    // LocalGov Drupal uses 'wysiwyg' format instead of 'full_html'.
    if ($fieldName === 'body') {
      $bodyValue = $value;

      // If this is an array of steps (guide pages), convert to HTML.
      if (is_array($value) && $this->looksLikeStepsArray($value)) {
        $bodyValue = $this->convertStepsToHtml($value);
      }
      elseif (!is_string($value)) {
        // Fallback: convert other arrays/objects to readable format.
        $bodyValue = json_encode($value, JSON_PRETTY_PRINT);
      }

      // Sanitize HTML content to remove broken image references.
      $bodyValue = $this->sanitizeGeneratedHtml($bodyValue);

      return [
        'value' => $bodyValue,
        'format' => 'wysiwyg',
      ];
    }

    // Handle summary field - also needs format for LocalGov.
    if (str_contains($fieldName, 'summary')) {
      $summaryValue = is_string($value) ? $value : json_encode($value);
      // Summary fields in LocalGov may need format too.
      return $summaryValue;
    }

    return $value;
  }

  /**
   * Check if an array looks like a steps array from guide pages.
   *
   * @param array $value
   *   The value to check.
   *
   * @return bool
   *   TRUE if this looks like a steps array.
   */
  protected function looksLikeStepsArray(array $value): bool {
    // Steps arrays are indexed arrays of objects with title/content keys.
    if (empty($value)) {
      return FALSE;
    }

    // Check if it's an indexed array (not associative).
    if (array_keys($value) !== range(0, count($value) - 1)) {
      return FALSE;
    }

    // Check first item has step-like structure.
    $first = $value[0];
    if (!is_array($first)) {
      return FALSE;
    }

    // Look for common step keys.
    return isset($first['title']) || isset($first['content']) ||
           isset($first['step_number']) || isset($first['step']);
  }

  /**
   * Convert a steps array to HTML.
   *
   * @param array $steps
   *   Array of step objects.
   *
   * @return string
   *   HTML representation of the steps.
   */
  protected function convertStepsToHtml(array $steps): string {
    $html = '<div class="guide-steps">';

    foreach ($steps as $index => $step) {
      $stepNumber = $step['step_number'] ?? $step['number'] ?? ($index + 1);
      $title = $step['title'] ?? $step['step'] ?? sprintf('Step %d', $stepNumber);
      $content = $step['content'] ?? $step['description'] ?? $step['body'] ?? '';

      // Ensure title is a string (Bedrock may return unexpected types).
      $title = is_string($title) ? $title : (string) $title;

      // Clean up title - remove "Step N:" prefix if already present.
      $title = preg_replace('/^Step\s+\d+[:.]\s*/i', '', $title);

      $html .= sprintf(
        '<div class="guide-step">
          <h3 class="guide-step__title">Step %d: %s</h3>
          <div class="guide-step__content">%s</div>
        </div>',
        $stepNumber,
        htmlspecialchars($title, ENT_QUOTES, 'UTF-8'),
        $this->sanitizeHtmlContent($content)
      );
    }

    $html .= '</div>';

    return $html;
  }

  /**
   * Sanitize HTML content - allow safe tags, escape dangerous ones.
   *
   * @param string $content
   *   The content to sanitize.
   *
   * @return string
   *   Sanitized HTML content.
   */
  protected function sanitizeHtmlContent(string $content): string {
    // If content is already HTML, preserve safe tags.
    if (str_contains($content, '<')) {
      // Allow common safe tags.
      return strip_tags($content, '<p><br><ul><ol><li><strong><em><a><h4><h5><span>');
    }

    // Plain text - convert newlines to paragraphs.
    $paragraphs = array_filter(array_map('trim', explode("\n\n", $content)));
    if (count($paragraphs) > 1) {
      return '<p>' . implode('</p><p>', array_map(fn($p) => htmlspecialchars($p, ENT_QUOTES, 'UTF-8'), $paragraphs)) . '</p>';
    }

    return '<p>' . htmlspecialchars($content, ENT_QUOTES, 'UTF-8') . '</p>';
  }

  /**
   * Sanitize generated HTML to remove broken image references.
   *
   * AI-generated content may include placeholder image URLs that don't exist.
   * This method removes or replaces them to prevent 404 errors.
   *
   * @param string $html
   *   The HTML content to sanitize.
   *
   * @return string
   *   Sanitized HTML content.
   */
  protected function sanitizeGeneratedHtml(string $html): string {
    // Remove img tags with placeholder/broken URLs.
    // Common patterns from AI-generated content.
    $patterns = [
      // Remove img tags with placeholder URLs.
      '/<img[^>]*src=["\'][^"\']*placeholder[^"\']*["\'][^>]*\/?>/i',
      '/<img[^>]*src=["\'][^"\']*example\.com[^"\']*["\'][^>]*\/?>/i',
      '/<img[^>]*src=["\'][^"\']*lorem[^"\']*["\'][^>]*\/?>/i',
      '/<img[^>]*src=["\'][^"\']*unsplash[^"\']*["\'][^>]*\/?>/i',
      '/<img[^>]*src=["\'][^"\']*picsum[^"\']*["\'][^>]*\/?>/i',
      // Remove img tags with relative paths that don't exist.
      '/<img[^>]*src=["\']\/images\/[^"\']*["\'][^>]*\/?>/i',
      '/<img[^>]*src=["\']images\/[^"\']*["\'][^>]*\/?>/i',
      // Remove img tags with http:// URLs (external images we can't verify).
      '/<img[^>]*src=["\']http:\/\/[^"\']*["\'][^>]*\/?>/i',
      // Remove img tags with generic stock photo URLs.
      '/<img[^>]*src=["\'][^"\']*stock[^"\']*["\'][^>]*\/?>/i',
    ];

    foreach ($patterns as $pattern) {
      $html = preg_replace($pattern, '', $html);
    }

    // Remove empty figure tags that might remain after image removal.
    $html = preg_replace('/<figure[^>]*>\s*<\/figure>/i', '', $html);

    // Remove multiple consecutive empty paragraphs.
    $html = preg_replace('/(<p>\s*<\/p>\s*){2,}/', '<p></p>', $html);

    // Clean up whitespace.
    $html = preg_replace('/\s+/', ' ', $html);
    $html = preg_replace('/>\s+</', '><', $html);

    return trim($html);
  }

  /**
   * Find the "Services" landing page for parenting service pages.
   *
   * Service pages should be parented to the "Services" landing page
   * (not the homepage) for proper LocalGov hierarchy.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   *
   * @return int|null
   *   The node ID of the services landing page, or NULL if not found.
   */
  protected function findServicesLandingPage(CouncilIdentity $identity): ?int {
    try {
      $nodeStorage = $this->entityTypeManager->getStorage('node');

      // First, try to find the "Services" landing page by exact title.
      $nodes = $nodeStorage->loadByProperties([
        'type' => 'localgov_services_landing',
        'title' => 'Services',
        'status' => 1,
      ]);

      if (!empty($nodes)) {
        $node = reset($nodes);
        $this->logger->debug('Found Services landing page: @nid', ['@nid' => $node->id()]);
        return (int) $node->id();
      }

      // Fallback: find the homepage (Welcome to...) as last resort.
      $homepageTitle = 'Welcome to ' . $identity->name;
      $nodes = $nodeStorage->loadByProperties([
        'type' => 'localgov_services_landing',
        'title' => $homepageTitle,
        'status' => 1,
      ]);

      if (!empty($nodes)) {
        $node = reset($nodes);
        $this->logger->debug('Using homepage as parent: @nid', ['@nid' => $node->id()]);
        return (int) $node->id();
      }

      // Last resort: find first services_landing page.
      $query = $nodeStorage->getQuery()
        ->condition('type', 'localgov_services_landing')
        ->condition('status', 1)
        ->accessCheck(FALSE)
        ->sort('created', 'ASC')
        ->range(0, 1);

      $nids = $query->execute();
      if (!empty($nids)) {
        return (int) reset($nids);
      }

      $this->logger->warning('No services landing page found for parenting');
      return NULL;
    }
    catch (\Exception $e) {
      $this->logger->error('Error finding services landing page: @error', [
        '@error' => $e->getMessage(),
      ]);
      return NULL;
    }
  }

  /**
   * Apply rate limiting delay between API calls.
   */
  protected function applyRateLimitDelay(): void {
    $config = $this->configFactory->get('ndx_council_generator.settings');
    $delayMs = $config->get('rate_limit_delay_ms') ?? self::DEFAULT_RATE_LIMIT_DELAY_MS;

    if ($delayMs > 0) {
      usleep($delayMs * 1000);
    }
  }

  /**
   * Store failed spec IDs in state for retry capability.
   *
   * @param array<string> $failedSpecIds
   *   The list of failed spec IDs.
   */
  protected function storeFailedSpecs(array $failedSpecIds): void {
    $state = $this->stateManager->getState();
    $identity = $state->identity ?? [];
    $identity['_metadata'] = $identity['_metadata'] ?? [];
    $identity['_metadata']['failed_specs'] = $failedSpecIds;
    $this->stateManager->setIdentity($identity);
  }

  /**
   * Collect image specifications from content for batch processing.
   *
   * @param \Drupal\ndx_council_generator\Value\ContentSpecification $spec
   *   The content specification.
   * @param int $nodeId
   *   The created node ID.
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   */
  protected function collectImagesFromContent(ContentSpecification $spec, int $nodeId, CouncilIdentity $identity): void {
    if ($this->imageCollector === NULL) {
      return;
    }

    if (!$spec->hasImages()) {
      return;
    }

    $this->imageCollector->collectFromContent($spec, $nodeId, $identity);
  }

  /**
   * Link service pages to landing pages via localgov_destinations.
   *
   * This sets up both the homepage and Services landing page to display
   * child service pages as tiles/cards.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   */
  public function linkServicesToLanding(CouncilIdentity $identity): void {
    try {
      $nodeStorage = $this->entityTypeManager->getStorage('node');

      // Find all service pages.
      $serviceNids = $this->entityTypeManager->getStorage('node')
        ->getQuery()
        ->condition('type', 'localgov_services_page')
        ->condition('status', 1)
        ->accessCheck(FALSE)
        ->execute();

      if (empty($serviceNids)) {
        $this->logger->info('No service pages found to link');
        return;
      }

      // Build full references array for all services.
      $allRefs = [];
      foreach (array_values($serviceNids) as $nid) {
        $allRefs[] = ['target_id' => $nid];
      }

      // Link to homepage (limit to 12 for display).
      $homepageNid = $this->findHomepage($identity);
      if ($homepageNid !== NULL) {
        $homepage = $nodeStorage->load($homepageNid);
        if ($homepage !== NULL) {
          $homepageRefs = array_slice($allRefs, 0, 12);
          $homepage->set('localgov_destinations', $homepageRefs);
          $homepage->save();
          $this->logger->info('Linked @count services to homepage @nid', [
            '@count' => count($homepageRefs),
            '@nid' => $homepageNid,
          ]);
        }
      }
      else {
        $this->logger->warning('No homepage found - cannot link services to homepage');
      }

      // Link to Services landing page (show all services).
      $servicesNid = $this->findServicesLandingPage($identity);
      if ($servicesNid !== NULL) {
        $servicesPage = $nodeStorage->load($servicesNid);
        if ($servicesPage !== NULL) {
          $servicesPage->set('localgov_destinations', $allRefs);
          $servicesPage->save();
          $this->logger->info('Linked @count services to Services landing page @nid', [
            '@count' => count($allRefs),
            '@nid' => $servicesNid,
          ]);
        }
      }
      else {
        $this->logger->warning('No Services landing page found');
      }
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to link services to landing pages: @error', [
        '@error' => $e->getMessage(),
      ]);
    }
  }

  /**
   * Link news articles to the newsroom landing page.
   *
   * LocalGov News module requires news articles to have a reference to their
   * parent newsroom via the localgov_newsroom field for proper display.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   */
  public function linkNewsToNewsroom(CouncilIdentity $identity): void {
    try {
      $nodeStorage = $this->entityTypeManager->getStorage('node');

      // Find the newsroom landing page.
      $newsroomNid = $this->findNewsroomLandingPage();
      if ($newsroomNid === NULL) {
        $this->logger->warning('No newsroom landing page found - news articles will not display');
        return;
      }

      // Find all news articles.
      $articleNids = $nodeStorage->getQuery()
        ->condition('type', 'localgov_news_article')
        ->condition('status', 1)
        ->accessCheck(FALSE)
        ->execute();

      if (empty($articleNids)) {
        $this->logger->info('No news articles found to link');
        return;
      }

      // Link each article to the newsroom.
      $linked = 0;
      foreach ($articleNids as $nid) {
        $article = $nodeStorage->load($nid);
        if ($article !== NULL && $article->hasField('localgov_newsroom')) {
          // Check if already linked.
          $currentValue = $article->get('localgov_newsroom')->target_id;
          if ($currentValue !== $newsroomNid) {
            $article->set('localgov_newsroom', ['target_id' => $newsroomNid]);
            $article->save();
            $linked++;
          }
        }
      }

      $this->logger->info('Linked @count news articles to newsroom @nid', [
        '@count' => $linked,
        '@nid' => $newsroomNid,
      ]);
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to link news articles to newsroom: @error', [
        '@error' => $e->getMessage(),
      ]);
    }
  }

  /**
   * Find the newsroom landing page.
   *
   * @return int|null
   *   The node ID of the newsroom, or NULL if not found.
   */
  protected function findNewsroomLandingPage(): ?int {
    try {
      $nodeStorage = $this->entityTypeManager->getStorage('node');

      // Find the newsroom by exact title.
      $nodes = $nodeStorage->loadByProperties([
        'type' => 'localgov_newsroom',
        'title' => 'News and updates',
        'status' => 1,
      ]);

      if (!empty($nodes)) {
        $node = reset($nodes);
        $this->logger->debug('Found newsroom: @nid', ['@nid' => $node->id()]);
        return (int) $node->id();
      }

      // Fallback: find any newsroom.
      $query = $nodeStorage->getQuery()
        ->condition('type', 'localgov_newsroom')
        ->condition('status', 1)
        ->accessCheck(FALSE)
        ->range(0, 1);

      $nids = $query->execute();
      if (!empty($nids)) {
        return (int) reset($nids);
      }

      $this->logger->warning('No newsroom landing page found');
      return NULL;
    }
    catch (\Exception $e) {
      $this->logger->error('Error finding newsroom: @error', [
        '@error' => $e->getMessage(),
      ]);
      return NULL;
    }
  }

  /**
   * Find the homepage ("Welcome to...") landing page.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   *
   * @return int|null
   *   The node ID of the homepage, or NULL if not found.
   */
  protected function findHomepage(CouncilIdentity $identity): ?int {
    try {
      $nodeStorage = $this->entityTypeManager->getStorage('node');

      // Find the homepage by exact title.
      $homepageTitle = 'Welcome to ' . $identity->name;
      $nodes = $nodeStorage->loadByProperties([
        'type' => 'localgov_services_landing',
        'title' => $homepageTitle,
        'status' => 1,
      ]);

      if (!empty($nodes)) {
        $node = reset($nodes);
        return (int) $node->id();
      }

      // Fallback: find any services_landing with "Welcome to" in title.
      $query = $nodeStorage->getQuery()
        ->condition('type', 'localgov_services_landing')
        ->condition('title', '%Welcome to%', 'LIKE')
        ->condition('status', 1)
        ->accessCheck(FALSE)
        ->range(0, 1);

      $nids = $query->execute();
      if (!empty($nids)) {
        return (int) reset($nids);
      }

      $this->logger->warning('No homepage found');
      return NULL;
    }
    catch (\Exception $e) {
      $this->logger->error('Error finding homepage: @error', [
        '@error' => $e->getMessage(),
      ]);
      return NULL;
    }
  }

  /**
   * Extract a summary from body text.
   *
   * @param string $text
   *   The body text to extract from.
   * @param int $maxLength
   *   Maximum length of the summary.
   *
   * @return string
   *   The extracted summary.
   */
  protected function extractSummary(string $text, int $maxLength = 200): string {
    // Clean up the text.
    $text = trim($text);
    if (empty($text)) {
      return '';
    }

    // Try to get first sentence.
    if (preg_match('/^([^.!?]+[.!?])/', $text, $matches)) {
      $summary = trim($matches[1]);
      if (strlen($summary) <= $maxLength) {
        return $summary;
      }
    }

    // Truncate at word boundary.
    if (strlen($text) > $maxLength) {
      $text = substr($text, 0, $maxLength);
      $lastSpace = strrpos($text, ' ');
      if ($lastSpace !== FALSE) {
        $text = substr($text, 0, $lastSpace);
      }
      $text .= '...';
    }

    return $text;
  }

}
