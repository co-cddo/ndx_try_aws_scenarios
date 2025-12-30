<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\Core\Extension\ModuleExtensionList;
use Drupal\ndx_council_generator\Value\ContentSpecification;
use Psr\Log\LoggerInterface;
use Symfony\Component\Yaml\Yaml;
use Symfony\Component\Yaml\Exception\ParseException;

/**
 * Manages content generation templates.
 *
 * Story 5.3: Content Generation Templates
 */
class ContentTemplateManager implements ContentTemplateManagerInterface {

  /**
   * Template file names.
   */
  protected const TEMPLATE_FILES = [
    'service-pages',
    'guide-pages',
    'directory-entries',
    'news-articles',
    'homepage',
  ];

  /**
   * Cache of loaded templates.
   *
   * @var array<string, ContentSpecification>
   */
  protected array $templates = [];

  /**
   * Whether templates have been loaded.
   */
  protected bool $loaded = FALSE;

  /**
   * Constructs a ContentTemplateManager.
   *
   * @param \Drupal\Core\Extension\ModuleExtensionList $moduleExtensionList
   *   The module extension list.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected ModuleExtensionList $moduleExtensionList,
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function loadAllTemplates(): array {
    if ($this->loaded) {
      return $this->templates;
    }

    foreach (self::TEMPLATE_FILES as $file) {
      $this->loadTemplateFile($file);
    }

    $this->loaded = TRUE;

    $this->logger->info('Loaded @count content templates', [
      '@count' => count($this->templates),
    ]);

    return $this->templates;
  }

  /**
   * Load a single template file.
   *
   * @param string $name
   *   The template file name (without extension).
   */
  protected function loadTemplateFile(string $name): void {
    $modulePath = $this->moduleExtensionList->getPath('ndx_council_generator');
    $filePath = $modulePath . '/prompts/content/' . $name . '.yaml';

    if (!file_exists($filePath)) {
      $this->logger->warning('Template file not found: @file', [
        '@file' => $filePath,
      ]);
      return;
    }

    try {
      $data = Yaml::parseFile($filePath);
    }
    catch (ParseException $e) {
      $this->logger->error('Failed to parse template file @file: @error', [
        '@file' => $filePath,
        '@error' => $e->getMessage(),
      ]);
      return;
    }

    $contentType = $data['content_type'] ?? 'page';
    $generationOrder = $data['generation_order'] ?? 100;

    foreach ($data['items'] ?? [] as $item) {
      // Inherit content type and order from file-level settings.
      $item['content_type'] = $item['content_type'] ?? $contentType;
      $item['generation_order'] = $item['generation_order'] ?? $generationOrder;

      try {
        $spec = ContentSpecification::fromArray($item);
        $this->templates[$spec->id] = $spec;
      }
      catch (\Exception $e) {
        $this->logger->error('Failed to create ContentSpecification from @file item @id: @error', [
          '@file' => $name,
          '@id' => $item['id'] ?? 'unknown',
          '@error' => $e->getMessage(),
        ]);
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public function getTemplatesByType(string $contentType): array {
    return array_filter(
      $this->loadAllTemplates(),
      fn(ContentSpecification $spec) => $spec->contentType === $contentType
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getTemplate(string $id): ?ContentSpecification {
    $templates = $this->loadAllTemplates();
    return $templates[$id] ?? NULL;
  }

  /**
   * {@inheritdoc}
   */
  public function getContentCount(): int {
    return count($this->loadAllTemplates());
  }

  /**
   * {@inheritdoc}
   */
  public function getImageCount(): int {
    $count = 0;
    foreach ($this->loadAllTemplates() as $spec) {
      $count += $spec->getImageCount();
    }
    return $count;
  }

  /**
   * {@inheritdoc}
   */
  public function getTemplatesInOrder(): array {
    $templates = $this->loadAllTemplates();

    // Sort by generation order.
    uasort($templates, fn(ContentSpecification $a, ContentSpecification $b) =>
      $a->order <=> $b->order
    );

    return array_values($templates);
  }

  /**
   * {@inheritdoc}
   */
  public function validateTemplates(): array {
    $errors = [];
    $templates = $this->loadAllTemplates();

    if (empty($templates)) {
      $errors[] = 'No templates loaded';
      return $errors;
    }

    foreach ($templates as $spec) {
      // Check required fields.
      if (empty($spec->id)) {
        $errors[] = 'Template missing ID';
      }
      if (empty($spec->prompt)) {
        $errors[] = "Template {$spec->id}: Missing prompt";
      }
      if (empty($spec->titleTemplate)) {
        $errors[] = "Template {$spec->id}: Missing title_template";
      }

      // Check dependencies reference valid IDs.
      foreach ($spec->dependencies as $depId) {
        if (!isset($templates[$depId])) {
          $errors[] = "Template {$spec->id}: Dependency '{$depId}' not found";
        }
      }

      // Check for circular dependencies (simple check).
      if (in_array($spec->id, $spec->dependencies, TRUE)) {
        $errors[] = "Template {$spec->id}: Self-referencing dependency";
      }

      // Validate image specifications.
      foreach ($spec->images as $image) {
        if (empty($image->prompt)) {
          $errors[] = "Template {$spec->id}: Image missing prompt";
        }
        if (!$image::isValidType($image->type)) {
          $errors[] = "Template {$spec->id}: Invalid image type '{$image->type}'";
        }
      }
    }

    return $errors;
  }

  /**
   * Reset the template cache.
   */
  public function resetCache(): void {
    $this->templates = [];
    $this->loaded = FALSE;
  }

}
