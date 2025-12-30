<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\PromptTemplate;

use Drupal\Core\Extension\ModuleHandlerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Yaml\Yaml;

/**
 * Manages prompt templates for AI services.
 *
 * Loads YAML-based prompt templates from the module's prompts directory
 * and provides variable substitution.
 *
 * Story 3.2: Bedrock Service Integration
 */
class PromptTemplateManager {

  /**
   * Cache of loaded templates.
   *
   * @var array<string, array<string, mixed>>
   */
  protected array $templateCache = [];

  /**
   * Path to the prompts directory.
   */
  protected string $promptsPath;

  /**
   * Constructs a PromptTemplateManager.
   *
   * @param \Drupal\Core\Extension\ModuleHandlerInterface $moduleHandler
   *   The module handler.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected ModuleHandlerInterface $moduleHandler,
    protected LoggerInterface $logger,
  ) {
    $modulePath = $this->moduleHandler->getModule('ndx_aws_ai')->getPath();
    $this->promptsPath = $modulePath . '/prompts';
  }

  /**
   * Load a prompt template by name.
   *
   * @param string $templateName
   *   The template name (without .yml extension).
   *
   * @return array<string, mixed>
   *   The parsed template array.
   *
   * @throws \InvalidArgumentException
   *   If the template file does not exist.
   */
  public function loadTemplate(string $templateName): array {
    if (isset($this->templateCache[$templateName])) {
      return $this->templateCache[$templateName];
    }

    $filePath = $this->promptsPath . '/' . $templateName . '.yml';

    if (!file_exists($filePath)) {
      $this->logger->error('Prompt template not found: @template', [
        '@template' => $templateName,
      ]);
      throw new \InvalidArgumentException(
        sprintf('Prompt template "%s" not found at %s', $templateName, $filePath)
      );
    }

    try {
      $content = file_get_contents($filePath);
      if ($content === FALSE) {
        throw new \RuntimeException('Failed to read template file');
      }

      $template = Yaml::parse($content);
      if (!is_array($template)) {
        throw new \RuntimeException('Template must be a YAML mapping');
      }

      $this->templateCache[$templateName] = $template;

      $this->logger->debug('Loaded prompt template: @template', [
        '@template' => $templateName,
      ]);

      return $template;

    }
    catch (\Exception $e) {
      $this->logger->error('Failed to parse prompt template @template: @error', [
        '@template' => $templateName,
        '@error' => $e->getMessage(),
      ]);
      throw new \InvalidArgumentException(
        sprintf('Failed to parse template "%s": %s', $templateName, $e->getMessage()),
        0,
        $e
      );
    }
  }

  /**
   * Render a template with variable substitution.
   *
   * @param array<string, mixed> $template
   *   The template array (must contain 'user' key with prompt text).
   * @param array<string, string> $variables
   *   Variables to substitute (key => value).
   *
   * @return string
   *   The rendered prompt with variables substituted.
   */
  public function render(array $template, array $variables): string {
    $prompt = $template['user'] ?? '';

    if (empty($prompt)) {
      return '';
    }

    // Replace {{variable}} placeholders with values.
    foreach ($variables as $key => $value) {
      $placeholder = '{{' . $key . '}}';
      $prompt = str_replace($placeholder, $value, $prompt);
    }

    return $prompt;
  }

  /**
   * Render just the system prompt from a template.
   *
   * @param array<string, mixed> $template
   *   The template array.
   * @param array<string, string> $variables
   *   Variables to substitute.
   *
   * @return string|null
   *   The rendered system prompt, or NULL if not defined.
   */
  public function renderSystem(array $template, array $variables): ?string {
    if (!isset($template['system'])) {
      return NULL;
    }

    $systemPrompt = $template['system'];

    foreach ($variables as $key => $value) {
      $placeholder = '{{' . $key . '}}';
      $systemPrompt = str_replace($placeholder, $value, $systemPrompt);
    }

    return $systemPrompt;
  }

  /**
   * Get the model ID recommended by a template.
   *
   * @param array<string, mixed> $template
   *   The template array.
   *
   * @return string|null
   *   The recommended model name, or NULL if not specified.
   */
  public function getTemplateModel(array $template): ?string {
    return $template['model'] ?? NULL;
  }

  /**
   * Get inference parameters from a template.
   *
   * @param array<string, mixed> $template
   *   The template array.
   *
   * @return array<string, mixed>
   *   The parameters array (may be empty).
   */
  public function getTemplateParameters(array $template): array {
    return $template['parameters'] ?? [];
  }

  /**
   * List all available template names.
   *
   * @return array<string>
   *   Array of template names (without .yml extension).
   */
  public function listTemplates(): array {
    $templates = [];

    if (!is_dir($this->promptsPath)) {
      return $templates;
    }

    $files = scandir($this->promptsPath);
    if ($files === FALSE) {
      return $templates;
    }

    foreach ($files as $file) {
      if (str_ends_with($file, '.yml')) {
        $templates[] = substr($file, 0, -4);
      }
    }

    return $templates;
  }

  /**
   * Clear the template cache.
   */
  public function clearCache(): void {
    $this->templateCache = [];
  }

}
