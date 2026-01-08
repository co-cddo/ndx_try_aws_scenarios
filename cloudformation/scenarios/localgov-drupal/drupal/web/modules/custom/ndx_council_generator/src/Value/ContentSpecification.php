<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Value;

/**
 * Value object representing a content generation specification.
 *
 * Story 5.3: Content Generation Templates
 */
final class ContentSpecification {

  /**
   * LocalGov Drupal content types.
   */
  public const TYPE_SERVICE_PAGE = 'localgov_services_page';
  public const TYPE_SERVICE_LANDING = 'localgov_services_landing';
  public const TYPE_GUIDE_PAGE = 'localgov_guides_page';
  public const TYPE_DIRECTORY = 'localgov_directory';
  public const TYPE_NEWS = 'localgov_news_article';
  public const TYPE_PAGE = 'page';

  /**
   * Constructs a ContentSpecification.
   *
   * @param string $id
   *   Unique identifier for this content specification.
   * @param string $contentType
   *   Drupal content type machine name.
   * @param string $titleTemplate
   *   Title template with placeholders.
   * @param string $prompt
   *   AI generation prompt with placeholders.
   * @param array $images
   *   Array of ImageSpecification objects.
   * @param array $drupalFields
   *   Mapping of JSON output to Drupal fields.
   * @param int $order
   *   Generation order (lower = earlier).
   * @param array $dependencies
   *   IDs of content that must be generated first.
   * @param array $metadata
   *   Additional metadata for generation.
   */
  public function __construct(
    public readonly string $id,
    public readonly string $contentType,
    public readonly string $titleTemplate,
    public readonly string $prompt,
    public readonly array $images,
    public readonly array $drupalFields,
    public readonly int $order,
    public readonly array $dependencies,
    public readonly array $metadata,
  ) {}

  /**
   * Inject council identity variables into prompt.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   *
   * @return string
   *   The rendered prompt.
   */
  public function renderPrompt(CouncilIdentity $identity): string {
    return $this->replaceVariables($this->prompt, $identity);
  }

  /**
   * Render title with identity variables.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   *
   * @return string
   *   The rendered title.
   */
  public function renderTitle(CouncilIdentity $identity): string {
    $title = $this->replaceVariables($this->titleTemplate, $identity);
    // Ensure we never return an empty title.
    if (empty(trim($title))) {
      return ucfirst(str_replace('-', ' ', $this->id)) . ' - ' . $identity->name;
    }
    return $title;
  }

  /**
   * Replace template variables with identity values.
   *
   * @param string $template
   *   Template string with placeholders.
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   *
   * @return string
   *   The rendered string.
   */
  protected function replaceVariables(string $template, CouncilIdentity $identity): string {
    return strtr($template, [
      '{{council_name}}' => $identity->name,
      '{{region_name}}' => $identity->getRegionName(),
      '{{region_key}}' => $identity->regionKey,
      '{{theme_description}}' => $identity->getThemeName(),
      '{{theme_key}}' => $identity->themeKey,
      '{{population}}' => number_format($identity->populationEstimate),
      '{{population_display}}' => $identity->getPopulationDisplay(),
      '{{flavour_keywords}}' => $identity->getFlavourKeywordsString(),
      '{{motto}}' => $identity->motto,
    ]);
  }

  /**
   * Get image specifications with rendered prompts.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   *
   * @return array
   *   Array of ImageSpecification objects with rendered prompts.
   */
  public function getRenderedImages(CouncilIdentity $identity): array {
    return array_map(
      function (ImageSpecification $image) use ($identity) {
        return new ImageSpecification(
          type: $image->type,
          prompt: $image->renderPrompt($identity),
          dimensions: $image->dimensions,
          style: $image->style,
          contentId: $this->id,
          fieldName: $image->fieldName,
        );
      },
      $this->images
    );
  }

  /**
   * Check if this content has image requirements.
   *
   * @return bool
   *   TRUE if images are needed.
   */
  public function hasImages(): bool {
    return !empty($this->images);
  }

  /**
   * Get image count.
   *
   * @return int
   *   Number of images required.
   */
  public function getImageCount(): int {
    return count($this->images);
  }

  /**
   * Check if all dependencies are satisfied.
   *
   * @param array $completedIds
   *   Array of completed content IDs.
   *
   * @return bool
   *   TRUE if all dependencies are complete.
   */
  public function dependenciesSatisfied(array $completedIds): bool {
    foreach ($this->dependencies as $depId) {
      if (!in_array($depId, $completedIds, TRUE)) {
        return FALSE;
      }
    }
    return TRUE;
  }

  /**
   * Create from array.
   *
   * @param array $data
   *   Content specification data.
   *
   * @return self
   *   New ContentSpecification instance.
   */
  public static function fromArray(array $data): self {
    $images = [];
    foreach ($data['images'] ?? [] as $imageData) {
      $images[] = ImageSpecification::fromArray($imageData);
    }

    return new self(
      id: $data['id'] ?? '',
      contentType: $data['content_type'] ?? self::TYPE_PAGE,
      titleTemplate: $data['title_template'] ?? '',
      prompt: $data['prompt'] ?? '',
      images: $images,
      drupalFields: $data['drupal_fields'] ?? [],
      order: (int) ($data['generation_order'] ?? 100),
      dependencies: $data['dependencies'] ?? [],
      metadata: $data['metadata'] ?? [],
    );
  }

  /**
   * Convert to array.
   *
   * @return array
   *   Array representation.
   */
  public function toArray(): array {
    return [
      'id' => $this->id,
      'content_type' => $this->contentType,
      'title_template' => $this->titleTemplate,
      'prompt' => $this->prompt,
      'images' => array_map(fn($img) => $img->toArray(), $this->images),
      'drupal_fields' => $this->drupalFields,
      'generation_order' => $this->order,
      'dependencies' => $this->dependencies,
      'metadata' => $this->metadata,
    ];
  }

}
