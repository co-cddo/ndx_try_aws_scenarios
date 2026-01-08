<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\ndx_council_generator\Value\ContentSpecification;

/**
 * Interface for content template management.
 *
 * Story 5.3: Content Generation Templates
 */
interface ContentTemplateManagerInterface {

  /**
   * Load all content templates.
   *
   * @return array<string, ContentSpecification>
   *   Array of ContentSpecification objects keyed by ID.
   */
  public function loadAllTemplates(): array;

  /**
   * Get templates filtered by content type.
   *
   * @param string $contentType
   *   Drupal content type machine name.
   *
   * @return array<string, ContentSpecification>
   *   Array of matching ContentSpecification objects.
   */
  public function getTemplatesByType(string $contentType): array;

  /**
   * Get a single template by ID.
   *
   * @param string $id
   *   Template ID.
   *
   * @return ContentSpecification|null
   *   The template or NULL if not found.
   */
  public function getTemplate(string $id): ?ContentSpecification;

  /**
   * Get total content count across all templates.
   *
   * @return int
   *   Number of content items to generate.
   */
  public function getContentCount(): int;

  /**
   * Get total image count across all templates.
   *
   * @return int
   *   Number of images to generate.
   */
  public function getImageCount(): int;

  /**
   * Get templates in generation order.
   *
   * @return array<ContentSpecification>
   *   Array of ContentSpecification objects sorted by order.
   */
  public function getTemplatesInOrder(): array;

  /**
   * Validate all templates are properly configured.
   *
   * @return array
   *   Array of validation errors, empty if valid.
   */
  public function validateTemplates(): array;

}
