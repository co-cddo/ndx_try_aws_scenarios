<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

/**
 * Interface for creating media entities from generated images.
 *
 * Story 5.6: Batch Image Generation
 */
interface MediaCreatorInterface {

  /**
   * Create a media entity from generated image data.
   *
   * @param string $imageData
   *   The raw image data (binary).
   * @param string $mimeType
   *   The image MIME type.
   * @param string $specId
   *   The specification ID (for naming).
   * @param string $councilName
   *   The council name (for naming and alt text).
   *
   * @return int
   *   The created media entity ID.
   *
   * @throws \Exception
   *   If media creation fails.
   */
  public function createFromImage(
    string $imageData,
    string $mimeType,
    string $specId,
    string $councilName,
  ): int;

  /**
   * Update a node's image field with a media reference.
   *
   * @param int $nodeId
   *   The node ID to update.
   * @param string $fieldName
   *   The field name to update.
   * @param int $mediaId
   *   The media entity ID to reference.
   *
   * @throws \Exception
   *   If node update fails.
   */
  public function updateNodeField(int $nodeId, string $fieldName, int $mediaId): void;

  /**
   * Generate a file name for the image.
   *
   * @param string $specId
   *   The specification ID.
   * @param string $extension
   *   The file extension.
   *
   * @return string
   *   The generated file name.
   */
  public function generateFileName(string $specId, string $extension): string;

  /**
   * Generate alt text for an image.
   *
   * @param string $specId
   *   The specification ID.
   * @param string $councilName
   *   The council name.
   *
   * @return string
   *   The alt text.
   */
  public function generateAltText(string $specId, string $councilName): string;

}
