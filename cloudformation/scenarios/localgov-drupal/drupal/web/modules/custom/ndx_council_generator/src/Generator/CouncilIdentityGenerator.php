<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Generator;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Extension\ModuleExtensionList;
use Drupal\ndx_aws_ai\Service\BedrockServiceInterface;
use Drupal\ndx_council_generator\Service\GenerationStateManagerInterface;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Psr\Log\LoggerInterface;

/**
 * Generates unique council identities using AWS Bedrock.
 *
 * Story 5.2: Council Identity Generator
 */
class CouncilIdentityGenerator implements CouncilIdentityGeneratorInterface {

  /**
   * Config key for stored identity.
   */
  public const CONFIG_KEY = 'ndx_council_generator.council_identity';

  /**
   * Maximum generation time in seconds.
   */
  public const MAX_GENERATION_TIME = 15;

  /**
   * Constructs a CouncilIdentityGenerator.
   *
   * @param \Drupal\ndx_aws_ai\Service\BedrockServiceInterface $bedrock
   *   The Bedrock service.
   * @param \Drupal\ndx_council_generator\Service\GenerationStateManagerInterface $stateManager
   *   The generation state manager.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The config factory.
   * @param \Drupal\Core\Extension\ModuleExtensionList $moduleExtensionList
   *   The module extension list.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected BedrockServiceInterface $bedrock,
    protected GenerationStateManagerInterface $stateManager,
    protected ConfigFactoryInterface $configFactory,
    protected ModuleExtensionList $moduleExtensionList,
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function generate(array $options = []): CouncilIdentity {
    $startTime = microtime(TRUE);

    $this->logger->info('Starting council identity generation', [
      'options' => $options,
    ]);

    // Build prompt from template.
    $prompt = $this->buildPrompt($options);

    try {
      $response = $this->bedrock->generateContent($prompt, BedrockServiceInterface::MODEL_NOVA_PRO);

      // Log token usage for cost tracking (Task 8.4).
      $this->logTokenUsage($prompt, $response);

      $identity = $this->parseResponse($response);

      // Store in config.
      $this->saveIdentity($identity);

      // Update generation state.
      $this->stateManager->setIdentity($identity->toArray());

      $duration = microtime(TRUE) - $startTime;
      $this->logger->info('Council identity generated', [
        'name' => $identity->name,
        'region' => $identity->regionKey,
        'theme' => $identity->themeKey,
        'duration_seconds' => round($duration, 2),
      ]);

      return $identity;
    }
    catch (\Exception $e) {
      $this->logger->error('Council identity generation failed', [
        'error' => $e->getMessage(),
      ]);
      throw $e;
    }
  }

  /**
   * Build prompt from template.
   *
   * @param array $options
   *   Generation options.
   *
   * @return string
   *   The complete prompt.
   */
  protected function buildPrompt(array $options): string {
    $template = $this->loadPromptTemplate();

    // Replace region options.
    $regionOptions = implode(', ', array_keys(CouncilIdentity::REGIONS));
    $template = str_replace('{{REGION_OPTIONS}}', $regionOptions, $template);

    // Replace theme options.
    $themeOptions = implode(', ', array_keys(CouncilIdentity::THEMES));
    $template = str_replace('{{THEME_OPTIONS}}', $themeOptions, $template);

    // Handle conditional region preference section.
    if (!empty($options['region']) && CouncilIdentity::isValidRegion($options['region'])) {
      $template = preg_replace(
        '/\{\{#if region_preference\}\}(.*?)\{\{\/if\}\}/s',
        '$1',
        $template
      );
      $template = str_replace('{{region_preference}}', $options['region'], $template);
    }
    else {
      $template = preg_replace('/\{\{#if region_preference\}\}.*?\{\{\/if\}\}/s', '', $template);
    }

    // Handle conditional theme preference section.
    if (!empty($options['theme']) && CouncilIdentity::isValidTheme($options['theme'])) {
      $template = preg_replace(
        '/\{\{#if theme_preference\}\}(.*?)\{\{\/if\}\}/s',
        '$1',
        $template
      );
      $template = str_replace('{{theme_preference}}', $options['theme'], $template);
    }
    else {
      $template = preg_replace('/\{\{#if theme_preference\}\}.*?\{\{\/if\}\}/s', '', $template);
    }

    // Handle conditional population preference section.
    if (!empty($options['population']) && CouncilIdentity::isValidPopulationRange($options['population'])) {
      $template = preg_replace(
        '/\{\{#if population_preference\}\}(.*?)\{\{\/if\}\}/s',
        '$1',
        $template
      );
      $template = str_replace('{{population_preference}}', $options['population'], $template);
    }
    else {
      $template = preg_replace('/\{\{#if population_preference\}\}.*?\{\{\/if\}\}/s', '', $template);
    }

    return trim($template);
  }

  /**
   * Load prompt template from file.
   *
   * @return string
   *   The prompt template content.
   *
   * @throws \RuntimeException
   *   If template file not found.
   */
  protected function loadPromptTemplate(): string {
    $modulePath = $this->moduleExtensionList->getPath('ndx_council_generator');
    $templatePath = $modulePath . '/prompts/council-identity.txt';

    if (!file_exists($templatePath)) {
      throw new \RuntimeException('Council identity prompt template not found: ' . $templatePath);
    }

    return file_get_contents($templatePath);
  }

  /**
   * Parse AI response into CouncilIdentity.
   *
   * @param string $response
   *   The AI response text.
   *
   * @return \Drupal\ndx_council_generator\Value\CouncilIdentity
   *   The parsed identity.
   *
   * @throws \RuntimeException
   *   If parsing fails.
   */
  protected function parseResponse(string $response): CouncilIdentity {
    // Extract JSON from response (may have markdown formatting).
    $jsonMatch = [];
    if (preg_match('/\{.*\}/s', $response, $jsonMatch)) {
      $json = $jsonMatch[0];
    }
    else {
      throw new \RuntimeException('No JSON found in AI response');
    }

    $data = json_decode($json, TRUE);
    if (json_last_error() !== JSON_ERROR_NONE) {
      throw new \RuntimeException('Invalid JSON in AI response: ' . json_last_error_msg());
    }

    // Validate required fields.
    $required = ['name', 'regionKey', 'themeKey', 'populationRange'];
    foreach ($required as $field) {
      if (empty($data[$field])) {
        throw new \RuntimeException("Missing required field: $field");
      }
    }

    // Validate and normalize region.
    if (!CouncilIdentity::isValidRegion($data['regionKey'])) {
      $this->logger->warning('Invalid region returned, using default', [
        'returned' => $data['regionKey'],
      ]);
      $data['regionKey'] = 'east_midlands';
    }

    // Validate and normalize theme.
    if (!CouncilIdentity::isValidTheme($data['themeKey'])) {
      $this->logger->warning('Invalid theme returned, using default', [
        'returned' => $data['themeKey'],
      ]);
      $data['themeKey'] = 'market_town';
    }

    // Validate and normalize population range.
    if (!CouncilIdentity::isValidPopulationRange($data['populationRange'])) {
      $this->logger->warning('Invalid population range returned, using default', [
        'returned' => $data['populationRange'],
      ]);
      $data['populationRange'] = CouncilIdentity::POPULATION_MEDIUM;
    }

    // Ensure flavourKeywords is an array.
    if (!isset($data['flavourKeywords']) || !is_array($data['flavourKeywords'])) {
      $data['flavourKeywords'] = [];
    }

    // Add generation timestamp.
    $data['generatedAt'] = time();

    return CouncilIdentity::fromArray($data);
  }

  /**
   * {@inheritdoc}
   */
  public function saveIdentity(CouncilIdentity $identity): void {
    $config = $this->configFactory->getEditable(self::CONFIG_KEY);
    $config->setData($identity->toArray());
    $config->save();

    $this->logger->info('Council identity saved to config', [
      'name' => $identity->name,
    ]);
  }

  /**
   * {@inheritdoc}
   */
  public function loadIdentity(): ?CouncilIdentity {
    $config = $this->configFactory->get(self::CONFIG_KEY);
    $data = $config->getRawData();

    if (empty($data) || empty($data['name'])) {
      return NULL;
    }

    return CouncilIdentity::fromArray($data);
  }

  /**
   * {@inheritdoc}
   */
  public function hasIdentity(): bool {
    $config = $this->configFactory->get(self::CONFIG_KEY);
    $data = $config->getRawData();
    return !empty($data) && !empty($data['name']);
  }

  /**
   * {@inheritdoc}
   */
  public function clearIdentity(): void {
    $config = $this->configFactory->getEditable(self::CONFIG_KEY);
    $config->delete();

    // Also clear from generation state.
    $this->stateManager->setIdentity([]);

    $this->logger->info('Council identity cleared from config');
  }

  /**
   * Log token usage for cost tracking.
   *
   * Task 8.4: Log token usage for cost tracking.
   *
   * @param string $prompt
   *   The prompt sent to the AI.
   * @param string $response
   *   The response received from the AI.
   */
  protected function logTokenUsage(string $prompt, string $response): void {
    // Approximate token count (rough estimate: 4 chars per token).
    $inputTokens = (int) ceil(strlen($prompt) / 4);
    $outputTokens = (int) ceil(strlen($response) / 4);

    $this->logger->info('Council identity generation token usage', [
      'input_tokens_approx' => $inputTokens,
      'output_tokens_approx' => $outputTokens,
      'total_tokens_approx' => $inputTokens + $outputTokens,
      'model' => BedrockServiceInterface::MODEL_NOVA_PRO,
    ]);
  }

}
