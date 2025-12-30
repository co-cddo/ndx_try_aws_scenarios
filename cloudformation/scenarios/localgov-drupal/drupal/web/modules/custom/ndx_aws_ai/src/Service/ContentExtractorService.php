<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Drupal\node\NodeInterface;
use Psr\Log\LoggerInterface;

/**
 * Service for extracting readable text content from Drupal entities.
 *
 * Cleans HTML and prepares text for text-to-speech synthesis,
 * removing navigation, scripts, and other non-content elements.
 *
 * Story 4.6: Listen to Page (TTS Button)
 */
class ContentExtractorService implements ContentExtractorInterface {

  /**
   * Elements to remove completely from content.
   */
  protected const REMOVE_ELEMENTS = [
    'script',
    'style',
    'nav',
    'header',
    'footer',
    'aside',
    'form',
    'iframe',
    'noscript',
    'svg',
    'canvas',
  ];

  /**
   * Selectors for sidebar and navigation content.
   */
  protected const REMOVE_SELECTORS = [
    '.sidebar',
    '.breadcrumb',
    '.navigation',
    '.menu',
    '.pager',
    '.contextual',
    '.visually-hidden',
    '[role="navigation"]',
    '[role="banner"]',
    '[role="complementary"]',
  ];

  /**
   * Constructs a ContentExtractorService.
   *
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger service.
   */
  public function __construct(
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function extractFromNode(NodeInterface $node): string {
    $content = [];

    // Add node title.
    $content[] = $node->getTitle();

    // Extract body field content.
    if ($node->hasField('body') && !$node->get('body')->isEmpty()) {
      $bodyValue = $node->get('body')->value;
      $content[] = $this->cleanForTts($bodyValue);
    }

    // Try other common text fields.
    $textFields = ['field_summary', 'field_description', 'field_content'];
    foreach ($textFields as $fieldName) {
      if ($node->hasField($fieldName) && !$node->get($fieldName)->isEmpty()) {
        $fieldValue = $node->get($fieldName)->value ?? '';
        if (!empty($fieldValue)) {
          $content[] = $this->cleanForTts($fieldValue);
        }
      }
    }

    $extracted = implode("\n\n", array_filter($content));

    $this->logger->debug('Extracted @chars characters from node @id', [
      '@chars' => strlen($extracted),
      '@id' => $node->id(),
    ]);

    return $extracted;
  }

  /**
   * {@inheritdoc}
   */
  public function cleanForTts(string $html): string {
    if (empty($html)) {
      return '';
    }

    // Remove script and style tags with content.
    $html = preg_replace('/<script[^>]*>.*?<\/script>/si', '', $html);
    $html = preg_replace('/<style[^>]*>.*?<\/style>/si', '', $html);

    // Remove comments.
    $html = preg_replace('/<!--.*?-->/s', '', $html);

    // Convert block elements to newlines for natural pauses.
    $blockElements = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'tr', 'br'];
    foreach ($blockElements as $tag) {
      $html = preg_replace("/<\/{$tag}>/i", "\n", $html);
      $html = preg_replace("/<{$tag}[^>]*>/i", "\n", $html);
    }

    // Convert list items to include bullet for natural reading.
    $html = preg_replace('/<li[^>]*>/i', "\n- ", $html);

    // Strip remaining HTML tags.
    $text = strip_tags($html);

    // Decode HTML entities.
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

    // Normalize whitespace.
    $text = preg_replace('/[ \t]+/', ' ', $text);
    $text = preg_replace('/\n\s*\n+/', "\n\n", $text);

    // Remove leading/trailing whitespace from lines.
    $lines = array_map('trim', explode("\n", $text));
    $text = implode("\n", array_filter($lines));

    return trim($text);
  }

  /**
   * {@inheritdoc}
   */
  public function extractFromHtml(string $html, string $selector = 'article.node'): string {
    if (empty($html)) {
      return '';
    }

    // Create a DOM document.
    $dom = new \DOMDocument();
    @$dom->loadHTML('<?xml encoding="UTF-8">' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);

    // Remove unwanted elements.
    $xpath = new \DOMXPath($dom);

    // Remove script, style, nav, etc.
    foreach (self::REMOVE_ELEMENTS as $tag) {
      $nodes = $xpath->query("//{$tag}");
      foreach ($nodes as $node) {
        $node->parentNode->removeChild($node);
      }
    }

    // Remove elements by class/role selectors.
    foreach (self::REMOVE_SELECTORS as $selectorItem) {
      if (str_starts_with($selectorItem, '.')) {
        $class = substr($selectorItem, 1);
        $nodes = $xpath->query("//*[contains(@class, '{$class}')]");
      }
      elseif (str_starts_with($selectorItem, '[role=')) {
        preg_match('/\[role="([^"]+)"\]/', $selectorItem, $matches);
        if (!empty($matches[1])) {
          $nodes = $xpath->query("//*[@role='{$matches[1]}']");
        }
        else {
          continue;
        }
      }
      else {
        continue;
      }

      foreach ($nodes as $node) {
        $node->parentNode->removeChild($node);
      }
    }

    // Find main content area.
    $mainContent = NULL;
    $selectors = [$selector, 'article', 'main', '.node__content', '#content'];

    foreach ($selectors as $sel) {
      if (str_starts_with($sel, '.')) {
        $class = substr($sel, 1);
        $nodes = $xpath->query("//*[contains(@class, '{$class}')]");
      }
      elseif (str_starts_with($sel, '#')) {
        $id = substr($sel, 1);
        $nodes = $xpath->query("//*[@id='{$id}']");
      }
      else {
        $nodes = $xpath->query("//{$sel}");
      }

      if ($nodes->length > 0) {
        $mainContent = $nodes->item(0);
        break;
      }
    }

    if ($mainContent === NULL) {
      // Fall back to body.
      $mainContent = $xpath->query('//body')->item(0) ?? $dom->documentElement;
    }

    // Get the text content.
    $html = $dom->saveHTML($mainContent);
    return $this->cleanForTts($html);
  }

}
