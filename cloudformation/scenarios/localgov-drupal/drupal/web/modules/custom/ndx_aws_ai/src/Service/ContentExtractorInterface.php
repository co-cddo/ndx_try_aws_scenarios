<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Drupal\node\NodeInterface;

/**
 * Interface for content extraction service.
 *
 * Extracts readable text content from Drupal nodes for use with
 * text-to-speech synthesis.
 *
 * Story 4.6: Listen to Page (TTS Button)
 */
interface ContentExtractorInterface {

  /**
   * Extract readable text content from a node.
   *
   * @param \Drupal\node\NodeInterface $node
   *   The node to extract content from.
   *
   * @return string
   *   The extracted text content suitable for TTS.
   */
  public function extractFromNode(NodeInterface $node): string;

  /**
   * Clean HTML and prepare text for TTS synthesis.
   *
   * @param string $html
   *   The HTML content to clean.
   *
   * @return string
   *   Plain text suitable for TTS.
   */
  public function cleanForTts(string $html): string;

  /**
   * Extract content from rendered HTML page.
   *
   * @param string $html
   *   The full rendered HTML page.
   * @param string $selector
   *   CSS selector for the main content area.
   *
   * @return string
   *   The extracted text content.
   */
  public function extractFromHtml(string $html, string $selector = 'article.node'): string;

}
