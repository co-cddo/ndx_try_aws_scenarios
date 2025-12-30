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
  protected const DEFAULT_RATE_LIMIT_DELAY_MS = 500;

  /**
   * Maximum retry attempts for throttled requests.
   */
  protected const MAX_THROTTLE_RETRIES = 3;

  /**
   * Current generation progress.
   */
  protected ?GenerationProgress $currentProgress = NULL;

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
   */
  public function __construct(
    protected ContentTemplateManagerInterface $templateManager,
    protected BedrockServiceInterface $bedrockService,
    protected GenerationStateManagerInterface $stateManager,
    protected EntityTypeManagerInterface $entityTypeManager,
    protected ConfigFactoryInterface $configFactory,
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function generateAll(CouncilIdentity $identity, ?callable $progressCallback = NULL): GenerationSummary {
    $templates = $this->templateManager->getTemplatesInOrder();
    $totalItems = count($templates);
    $startedAt = time();
    $results = [];

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
    $values = [
      'type' => $bundle,
      'status' => 1,
      'uid' => 1,
    ];

    // Map drupal fields from specification.
    foreach ($spec->drupalFields as $drupalField => $contentKey) {
      if (isset($contentData[$contentKey])) {
        $values[$drupalField] = $this->prepareFieldValue($drupalField, $contentData[$contentKey]);
      }
    }

    // Fallback title from template if not in content.
    if (!isset($values['title']) || empty($values['title'])) {
      $values['title'] = $spec->renderTitle($identity);
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
      ContentSpecification::TYPE_GUIDE_PAGE => 'localgov_guides_page',
      ContentSpecification::TYPE_DIRECTORY => 'localgov_directory_venue',
      ContentSpecification::TYPE_NEWS => 'localgov_news_article',
      ContentSpecification::TYPE_PAGE => 'page',
    ];

    return $mapping[$contentType] ?? 'page';
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
    if ($fieldName === 'body') {
      return [
        'value' => is_string($value) ? $value : json_encode($value),
        'format' => 'full_html',
      ];
    }

    // Handle summary field.
    if (str_contains($fieldName, 'summary')) {
      return is_string($value) ? $value : json_encode($value);
    }

    return $value;
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

}
