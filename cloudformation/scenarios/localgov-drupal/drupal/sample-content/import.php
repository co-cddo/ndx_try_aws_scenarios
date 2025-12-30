<?php

/**
 * @file
 * Sample content import script for LocalGov Drupal.
 *
 * This script imports static sample content for the NDX Try AWS demonstration.
 * It creates services, guides, directories, and news articles using LocalGov
 * Drupal content types.
 *
 * Usage: drush scr /var/www/drupal/sample-content/import.php
 *
 * Story 1.9: Static Sample Content
 */

use Drupal\node\Entity\Node;
use Drupal\taxonomy\Entity\Term;
use Drupal\menu_link_content\Entity\MenuLinkContent;
use Symfony\Component\Yaml\Yaml;

// Get the sample content directory
$content_dir = dirname(__FILE__);

/**
 * Log a message.
 */
function content_log($message) {
  echo "[" . date('Y-m-d H:i:s') . "] $message\n";
}

/**
 * Create a taxonomy term if it doesn't exist.
 */
function create_term_if_not_exists($name, $vocabulary) {
  $terms = \Drupal::entityTypeManager()
    ->getStorage('taxonomy_term')
    ->loadByProperties(['name' => $name, 'vid' => $vocabulary]);

  if (!empty($terms)) {
    return reset($terms);
  }

  $term = Term::create([
    'vid' => $vocabulary,
    'name' => $name,
  ]);
  $term->save();
  return $term;
}

/**
 * Import service pages.
 */
function import_services($content_dir) {
  content_log("Importing service pages...");

  $yaml_file = $content_dir . '/services.yml';
  if (!file_exists($yaml_file)) {
    content_log("  Warning: services.yml not found");
    return 0;
  }

  $content = Yaml::parseFile($yaml_file);
  $count = 0;

  foreach ($content['services'] as $service) {
    // Check if service already exists
    $existing = \Drupal::entityTypeManager()
      ->getStorage('node')
      ->loadByProperties(['title' => $service['title'], 'type' => 'localgov_services_page']);

    if (!empty($existing)) {
      content_log("  Skipping existing: " . $service['title']);
      continue;
    }

    // Create topic term if vocabulary exists
    $topic_tid = NULL;
    if (!empty($service['topic'])) {
      try {
        $term = create_term_if_not_exists($service['topic'], 'localgov_services_category');
        $topic_tid = $term->id();
      }
      catch (\Exception $e) {
        // Vocabulary might not exist, skip topic assignment
      }
    }

    $node_data = [
      'type' => 'localgov_services_page',
      'title' => $service['title'],
      'body' => [
        'value' => $service['body'],
        'summary' => $service['summary'],
        'format' => 'full_html',
      ],
      'status' => 1,
      'promote' => 0,
    ];

    // Add topic reference if available
    if ($topic_tid) {
      $node_data['localgov_services_category'] = ['target_id' => $topic_tid];
    }

    try {
      $node = Node::create($node_data);
      $node->save();
      $count++;
      content_log("  Created: " . $service['title']);
    }
    catch (\Exception $e) {
      content_log("  Error creating {$service['title']}: " . $e->getMessage());

      // Fall back to basic page if localgov content type not available
      try {
        $node = Node::create([
          'type' => 'page',
          'title' => $service['title'],
          'body' => [
            'value' => $service['body'],
            'summary' => $service['summary'],
            'format' => 'full_html',
          ],
          'status' => 1,
        ]);
        $node->save();
        $count++;
        content_log("  Created (as page): " . $service['title']);
      }
      catch (\Exception $e2) {
        content_log("  Failed to create: " . $service['title']);
      }
    }
  }

  content_log("  Imported $count services");
  return $count;
}

/**
 * Import step-by-step guides.
 */
function import_guides($content_dir) {
  content_log("Importing step-by-step guides...");

  $yaml_file = $content_dir . '/guides.yml';
  if (!file_exists($yaml_file)) {
    content_log("  Warning: guides.yml not found");
    return 0;
  }

  $content = Yaml::parseFile($yaml_file);
  $count = 0;

  foreach ($content['guides'] as $guide) {
    // Check if guide already exists
    $existing = \Drupal::entityTypeManager()
      ->getStorage('node')
      ->loadByProperties(['title' => $guide['title']]);

    if (!empty($existing)) {
      content_log("  Skipping existing: " . $guide['title']);
      continue;
    }

    // Build step content as HTML
    $body = '<p>' . $guide['summary'] . '</p>';
    foreach ($guide['steps'] as $index => $step) {
      $step_num = $index + 1;
      $body .= "<h2>Step $step_num: {$step['title']}</h2>";
      $body .= $step['body'];
    }

    try {
      // Try localgov_step_by_step first
      $node = Node::create([
        'type' => 'localgov_step_by_step',
        'title' => $guide['title'],
        'body' => [
          'value' => $body,
          'summary' => $guide['summary'],
          'format' => 'full_html',
        ],
        'status' => 1,
      ]);
      $node->save();
      $count++;
      content_log("  Created: " . $guide['title']);
    }
    catch (\Exception $e) {
      // Fall back to basic page
      try {
        $node = Node::create([
          'type' => 'page',
          'title' => $guide['title'],
          'body' => [
            'value' => $body,
            'summary' => $guide['summary'],
            'format' => 'full_html',
          ],
          'status' => 1,
        ]);
        $node->save();
        $count++;
        content_log("  Created (as page): " . $guide['title']);
      }
      catch (\Exception $e2) {
        content_log("  Failed to create: " . $guide['title']);
      }
    }
  }

  content_log("  Imported $count guides");
  return $count;
}

/**
 * Import directory entries.
 */
function import_directories($content_dir) {
  content_log("Importing directory entries...");

  $yaml_file = $content_dir . '/directories.yml';
  if (!file_exists($yaml_file)) {
    content_log("  Warning: directories.yml not found");
    return 0;
  }

  $content = Yaml::parseFile($yaml_file);
  $count = 0;

  foreach ($content['directories'] as $entry) {
    // Check if entry already exists
    $existing = \Drupal::entityTypeManager()
      ->getStorage('node')
      ->loadByProperties(['title' => $entry['title']]);

    if (!empty($existing)) {
      content_log("  Skipping existing: " . $entry['title']);
      continue;
    }

    // Build body content with address and details
    $body = '<p>' . $entry['summary'] . '</p>';

    if (!empty($entry['address'])) {
      $addr = $entry['address'];
      $body .= '<h2>Address</h2><p>';
      if (!empty($addr['line1'])) $body .= $addr['line1'] . '<br>';
      if (!empty($addr['line2'])) $body .= $addr['line2'] . '<br>';
      if (!empty($addr['city'])) $body .= $addr['city'] . '<br>';
      if (!empty($addr['postcode'])) $body .= $addr['postcode'];
      $body .= '</p>';
    }

    if (!empty($entry['phone']) || !empty($entry['email'])) {
      $body .= '<h2>Contact</h2><ul>';
      if (!empty($entry['phone'])) $body .= '<li>Phone: ' . $entry['phone'] . '</li>';
      if (!empty($entry['email'])) $body .= '<li>Email: ' . $entry['email'] . '</li>';
      $body .= '</ul>';
    }

    if (!empty($entry['opening_hours'])) {
      $body .= '<h2>Opening hours</h2><pre>' . $entry['opening_hours'] . '</pre>';
    }

    if (!empty($entry['facilities'])) {
      $body .= '<h2>Facilities</h2><ul>';
      foreach ($entry['facilities'] as $facility) {
        $body .= '<li>' . $facility . '</li>';
      }
      $body .= '</ul>';
    }

    try {
      // Try localgov_directory_venue first
      $node = Node::create([
        'type' => 'localgov_directory_venue',
        'title' => $entry['title'],
        'body' => [
          'value' => $body,
          'summary' => $entry['summary'],
          'format' => 'full_html',
        ],
        'status' => 1,
      ]);
      $node->save();
      $count++;
      content_log("  Created: " . $entry['title']);
    }
    catch (\Exception $e) {
      // Fall back to basic page
      try {
        $node = Node::create([
          'type' => 'page',
          'title' => $entry['title'],
          'body' => [
            'value' => $body,
            'summary' => $entry['summary'],
            'format' => 'full_html',
          ],
          'status' => 1,
        ]);
        $node->save();
        $count++;
        content_log("  Created (as page): " . $entry['title']);
      }
      catch (\Exception $e2) {
        content_log("  Failed to create: " . $entry['title']);
      }
    }
  }

  content_log("  Imported $count directory entries");
  return $count;
}

/**
 * Import news articles.
 */
function import_news($content_dir) {
  content_log("Importing news articles...");

  $yaml_file = $content_dir . '/news.yml';
  if (!file_exists($yaml_file)) {
    content_log("  Warning: news.yml not found");
    return 0;
  }

  $content = Yaml::parseFile($yaml_file);
  $count = 0;

  foreach ($content['news'] as $article) {
    // Check if article already exists
    $existing = \Drupal::entityTypeManager()
      ->getStorage('node')
      ->loadByProperties(['title' => $article['title']]);

    if (!empty($existing)) {
      content_log("  Skipping existing: " . $article['title']);
      continue;
    }

    try {
      // Try localgov_news_article first
      $node = Node::create([
        'type' => 'localgov_news_article',
        'title' => $article['title'],
        'body' => [
          'value' => $article['body'],
          'summary' => $article['summary'],
          'format' => 'full_html',
        ],
        'status' => 1,
        'promote' => 1,
        'created' => strtotime($article['date']),
      ]);
      $node->save();
      $count++;
      content_log("  Created: " . $article['title']);
    }
    catch (\Exception $e) {
      // Fall back to article type or basic page
      try {
        $node = Node::create([
          'type' => 'article',
          'title' => $article['title'],
          'body' => [
            'value' => $article['body'],
            'summary' => $article['summary'],
            'format' => 'full_html',
          ],
          'status' => 1,
          'promote' => 1,
          'created' => strtotime($article['date']),
        ]);
        $node->save();
        $count++;
        content_log("  Created (as article): " . $article['title']);
      }
      catch (\Exception $e2) {
        // Final fallback to page
        try {
          $node = Node::create([
            'type' => 'page',
            'title' => $article['title'],
            'body' => [
              'value' => $article['body'],
              'summary' => $article['summary'],
              'format' => 'full_html',
            ],
            'status' => 1,
          ]);
          $node->save();
          $count++;
          content_log("  Created (as page): " . $article['title']);
        }
        catch (\Exception $e3) {
          content_log("  Failed to create: " . $article['title']);
        }
      }
    }
  }

  content_log("  Imported $count news articles");
  return $count;
}

/**
 * Create main menu items.
 */
function create_menu_items() {
  content_log("Creating menu items...");

  $menu_items = [
    ['title' => 'Services', 'uri' => 'internal:/services', 'weight' => 0],
    ['title' => 'News', 'uri' => 'internal:/news', 'weight' => 1],
    ['title' => 'Directory', 'uri' => 'internal:/directory', 'weight' => 2],
    ['title' => 'About', 'uri' => 'internal:/about', 'weight' => 3],
  ];

  $count = 0;
  foreach ($menu_items as $item) {
    // Check if menu item exists
    $existing = \Drupal::entityTypeManager()
      ->getStorage('menu_link_content')
      ->loadByProperties([
        'title' => $item['title'],
        'menu_name' => 'main',
      ]);

    if (!empty($existing)) {
      content_log("  Skipping existing menu: " . $item['title']);
      continue;
    }

    try {
      $menu_link = MenuLinkContent::create([
        'title' => $item['title'],
        'link' => ['uri' => $item['uri']],
        'menu_name' => 'main',
        'weight' => $item['weight'],
        'expanded' => TRUE,
      ]);
      $menu_link->save();
      $count++;
      content_log("  Created menu: " . $item['title']);
    }
    catch (\Exception $e) {
      content_log("  Failed to create menu: " . $item['title']);
    }
  }

  content_log("  Created $count menu items");
  return $count;
}

// Main execution
content_log("=== Starting Sample Content Import ===");

$total = 0;
$total += import_services($content_dir);
$total += import_guides($content_dir);
$total += import_directories($content_dir);
$total += import_news($content_dir);
$total += create_menu_items();

// Clear caches
content_log("Clearing caches...");
try {
  drupal_flush_all_caches();
}
catch (\Exception $e) {
  // Cache clear might fail in some contexts
}

content_log("=== Import Complete: $total items created ===");
