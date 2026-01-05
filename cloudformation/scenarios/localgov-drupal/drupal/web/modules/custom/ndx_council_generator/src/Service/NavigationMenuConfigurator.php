<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\menu_link_content\Entity\MenuLinkContent;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Drupal\ndx_council_generator\Value\MenuConfigurationResult;
use Psr\Log\LoggerInterface;

/**
 * Navigation menu configuration service.
 *
 * Story 5.9: Navigation Menu Configuration
 *
 * Creates and configures the main navigation menu after council content
 * generation, ensuring all generated content is discoverable from the homepage.
 */
class NavigationMenuConfigurator implements NavigationMenuConfiguratorInterface {

  /**
   * Menu name for the main navigation.
   */
  protected const MENU_NAME = 'main';

  /**
   * Marker to identify generator-created menu links.
   */
  protected const GENERATOR_MARKER = '[ndx_generated]';

  /**
   * Content type constants.
   */
  protected const CONTENT_TYPE_SERVICES_LANDING = 'localgov_services_landing';
  protected const CONTENT_TYPE_SERVICES_PAGE = 'localgov_services_page';
  protected const CONTENT_TYPE_NEWS_ARTICLE = 'localgov_news_article';
  protected const CONTENT_TYPE_PAGE = 'page';

  /**
   * Title pattern constants.
   */
  protected const TITLE_PATTERN_WELCOME = 'Welcome to';
  protected const TITLE_PATTERN_CONTACT = 'Contact';
  protected const TITLE_PATTERN_ABOUT = 'About';

  /**
   * Constructs a NavigationMenuConfigurator.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger service.
   */
  public function __construct(
    protected EntityTypeManagerInterface $entityTypeManager,
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function configureNavigation(CouncilIdentity $identity): MenuConfigurationResult {
    $errors = [];
    $skipped = 0;

    try {
      // Create main menu links and capture the Services link UUID.
      $mainLinksCreated = 0;
      $servicesUuid = NULL;

      $mainMenuItems = $this->getMainMenuItems($identity);

      foreach ($mainMenuItems as $item) {
        if ($this->menuLinkExists($item['title'], self::MENU_NAME)) {
          $skipped++;
          $this->logger->debug('Menu link already exists: @title', ['@title' => $item['title']]);

          // If Services exists, get its UUID for child links.
          if ($item['title'] === 'Services') {
            $existing = $this->getExistingMenuLink($item['title'], self::MENU_NAME);
            if ($existing) {
              $servicesUuid = $existing->uuid();
            }
          }
          continue;
        }

        $menuLink = $this->createMenuLink($item);
        if ($menuLink) {
          $mainLinksCreated++;
          if ($item['title'] === 'Services') {
            $servicesUuid = $menuLink->uuid();
          }
        }
      }

      // Create service category child links under Services.
      $categoryLinksCreated = 0;
      if ($servicesUuid !== NULL) {
        $categoryLinksCreated = $this->createServiceCategoryLinks($servicesUuid, $identity);
      }
      else {
        $this->logger->warning('Could not find Services menu link UUID for child links');
      }

      $this->logger->info('Navigation configured: @summary', [
        '@summary' => sprintf(
          '%d main links, %d category links, %d skipped',
          $mainLinksCreated,
          $categoryLinksCreated,
          $skipped
        ),
      ]);

      return new MenuConfigurationResult(
        $mainLinksCreated,
        $categoryLinksCreated,
        $skipped,
        $errors
      );
    }
    catch (\Exception $e) {
      $this->logger->error('Navigation configuration failed: @error', [
        '@error' => $e->getMessage(),
      ]);
      return MenuConfigurationResult::failure($e->getMessage());
    }
  }

  /**
   * {@inheritdoc}
   */
  public function createMainMenuLinks(CouncilIdentity $identity): int {
    $created = 0;
    $items = $this->getMainMenuItems($identity);

    foreach ($items as $item) {
      if ($this->menuLinkExists($item['title'], self::MENU_NAME)) {
        continue;
      }

      if ($this->createMenuLink($item)) {
        $created++;
      }
    }

    return $created;
  }

  /**
   * {@inheritdoc}
   */
  public function createServiceCategoryLinks(string $servicesParentUuid, CouncilIdentity $identity): int {
    $created = 0;

    try {
      $nodeStorage = $this->entityTypeManager->getStorage('node');

      // Query for service landing pages (category pages).
      $query = $nodeStorage->getQuery()
        ->condition('type', self::CONTENT_TYPE_SERVICES_LANDING)
        ->condition('status', 1)
        ->accessCheck(FALSE)
        ->sort('title', 'ASC');

      $nids = $query->execute();

      if (empty($nids)) {
        $this->logger->debug('No service landing pages found for category links');
        return 0;
      }

      $nodes = $nodeStorage->loadMultiple($nids);
      $parentId = 'menu_link_content:' . $servicesParentUuid;
      $weight = 0;

      foreach ($nodes as $node) {
        $title = $node->getTitle();

        // Skip the homepage landing page (starts with "Welcome to").
        if (str_starts_with($title, self::TITLE_PATTERN_WELCOME)) {
          continue;
        }

        if ($this->menuLinkExists($title, self::MENU_NAME, $parentId)) {
          $this->logger->debug('Service category link already exists: @title', ['@title' => $title]);
          continue;
        }

        // Double-check existence to prevent race condition duplicates.
        if ($this->menuLinkExists($title, self::MENU_NAME, $parentId)) {
          $this->logger->debug('Service category link already exists (race condition avoided): @title', [
            '@title' => $title,
          ]);
          continue;
        }

        // Mark category links with generator marker for identification.
        $description = self::GENERATOR_MARKER . ' ' . sprintf('View %s services', $title);

        $menuLink = MenuLinkContent::create([
          'title' => $title,
          'link' => ['uri' => 'internal:/node/' . $node->id()],
          'menu_name' => self::MENU_NAME,
          'parent' => $parentId,
          'weight' => $weight++,
          'expanded' => FALSE,
          'description' => $description,
        ]);

        $menuLink->save();
        $created++;

        $this->logger->debug('Created service category link: @title', ['@title' => $title]);
      }
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to create service category links: @error', [
        '@error' => $e->getMessage(),
      ]);
    }

    return $created;
  }

  /**
   * {@inheritdoc}
   */
  public function menuLinkExists(string $title, string $menuName, ?string $parentId = NULL): bool {
    $properties = [
      'title' => $title,
      'menu_name' => $menuName,
    ];

    if ($parentId !== NULL) {
      $properties['parent'] = $parentId;
    }

    $existing = $this->entityTypeManager
      ->getStorage('menu_link_content')
      ->loadByProperties($properties);

    return !empty($existing);
  }

  /**
   * {@inheritdoc}
   */
  public function clearGeneratedMenuLinks(): int {
    $deleted = 0;

    try {
      // Find all menu links in the main menu.
      $storage = $this->entityTypeManager->getStorage('menu_link_content');
      $links = $storage->loadByProperties(['menu_name' => self::MENU_NAME]);

      foreach ($links as $link) {
        // Only delete links created by the generator (marked with GENERATOR_MARKER).
        $description = $link->getDescription() ?? '';
        if (str_contains($description, self::GENERATOR_MARKER)) {
          $link->delete();
          $deleted++;
          $this->logger->debug('Deleted generated menu link: @title', [
            '@title' => $link->getTitle(),
          ]);
        }
      }

      $this->logger->info('Cleared @count generated menu links from main menu', ['@count' => $deleted]);
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to clear menu links: @error', ['@error' => $e->getMessage()]);
    }

    return $deleted;
  }

  /**
   * Get the main menu items to create.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   *
   * @return array<array<string, mixed>>
   *   Array of menu item configurations.
   */
  protected function getMainMenuItems(CouncilIdentity $identity): array {
    $items = [];

    // Find key pages by title patterns.
    $nodeStorage = $this->entityTypeManager->getStorage('node');

    // Services link - find "Services" landing page.
    $servicesUri = $this->findNodeUri(self::CONTENT_TYPE_SERVICES_LANDING, 'Services');
    $items[] = [
      'title' => 'Services',
      'uri' => $servicesUri ?? 'internal:/',
      'weight' => 0,
      'expanded' => TRUE,
      'description' => 'Council services and information',
    ];

    // News link - find "News and updates" landing page.
    $newsUri = $this->findNodeUri(self::CONTENT_TYPE_SERVICES_LANDING, 'News and updates');
    $items[] = [
      'title' => 'News',
      'uri' => $newsUri ?? 'internal:/',
      'weight' => 10,
      'expanded' => FALSE,
      'description' => 'Latest council news and updates',
    ];

    // Contact link - find "Contact {council_name}" page.
    $contactUri = $this->findNodeUriContaining(self::CONTENT_TYPE_SERVICES_PAGE, self::TITLE_PATTERN_CONTACT . ' ' . $identity->name);
    if (!$contactUri) {
      // Fall back to any contact page.
      $contactUri = $this->findNodeUriContaining(self::CONTENT_TYPE_SERVICES_PAGE, self::TITLE_PATTERN_CONTACT);
    }
    $items[] = [
      'title' => self::TITLE_PATTERN_CONTACT,
      'uri' => $contactUri ?? 'internal:/',
      'weight' => 20,
      'expanded' => FALSE,
      'description' => 'Contact the council',
    ];

    // About link - find "About {council_name}" landing page.
    $aboutUri = $this->findNodeUriContaining(self::CONTENT_TYPE_SERVICES_LANDING, self::TITLE_PATTERN_ABOUT . ' ' . $identity->name);
    if (!$aboutUri) {
      // Fall back to any about page in services pages.
      $aboutUri = $this->findNodeUriContaining(self::CONTENT_TYPE_SERVICES_PAGE, self::TITLE_PATTERN_ABOUT);
    }
    $items[] = [
      'title' => self::TITLE_PATTERN_ABOUT,
      'uri' => $aboutUri ?? 'internal:/',
      'weight' => 30,
      'expanded' => FALSE,
      'description' => 'About the council',
    ];

    return $items;
  }

  /**
   * Create a single menu link.
   *
   * @param array<string, mixed> $item
   *   Menu item configuration.
   *
   * @return \Drupal\menu_link_content\Entity\MenuLinkContent|null
   *   The created menu link or NULL on failure.
   */
  protected function createMenuLink(array $item): ?MenuLinkContent {
    try {
      // Double-check existence to prevent race condition duplicates.
      if ($this->menuLinkExists($item['title'], self::MENU_NAME)) {
        $this->logger->debug('Menu link already exists (race condition avoided): @title', [
          '@title' => $item['title'],
        ]);
        return NULL;
      }

      // Mark description with generator marker for identification.
      $description = $item['description'] ?? '';
      $markedDescription = self::GENERATOR_MARKER . ' ' . $description;

      $menuLink = MenuLinkContent::create([
        'title' => $item['title'],
        'link' => ['uri' => $item['uri']],
        'menu_name' => self::MENU_NAME,
        'weight' => $item['weight'] ?? 0,
        'expanded' => $item['expanded'] ?? FALSE,
        'description' => $markedDescription,
      ]);

      $menuLink->save();

      $this->logger->info('Created menu link: @title -> @uri', [
        '@title' => $item['title'],
        '@uri' => $item['uri'],
      ]);

      return $menuLink;
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to create menu link @title: @error', [
        '@title' => $item['title'],
        '@error' => $e->getMessage(),
      ]);
      return NULL;
    }
  }

  /**
   * Find a node URI by type and exact title.
   *
   * @param string $type
   *   The node type.
   * @param string $title
   *   The exact title to match.
   *
   * @return string|null
   *   The internal URI or NULL if not found.
   */
  protected function findNodeUri(string $type, string $title): ?string {
    $nodeStorage = $this->entityTypeManager->getStorage('node');

    $nodes = $nodeStorage->loadByProperties([
      'type' => $type,
      'title' => $title,
      'status' => 1,
    ]);

    if (!empty($nodes)) {
      $node = reset($nodes);
      return 'internal:/node/' . $node->id();
    }

    return NULL;
  }

  /**
   * Find a node URI by type and title containing a string.
   *
   * @param string $type
   *   The node type.
   * @param string $titleContains
   *   String the title should contain.
   *
   * @return string|null
   *   The internal URI or NULL if not found.
   */
  protected function findNodeUriContaining(string $type, string $titleContains): ?string {
    $nodeStorage = $this->entityTypeManager->getStorage('node');

    // Escape SQL LIKE wildcards to prevent injection.
    $escapedTitle = addcslashes($titleContains, '%_\\');

    $query = $nodeStorage->getQuery()
      ->condition('type', $type)
      ->condition('title', '%' . $escapedTitle . '%', 'LIKE')
      ->condition('status', 1)
      ->accessCheck(FALSE)
      ->range(0, 1);

    $nids = $query->execute();

    if (!empty($nids)) {
      $nid = reset($nids);
      return 'internal:/node/' . $nid;
    }

    return NULL;
  }

  /**
   * Find the first node of a given type.
   *
   * @param string $type
   *   The node type.
   *
   * @return \Drupal\node\NodeInterface|null
   *   The node or NULL if not found.
   */
  protected function findFirstNodeOfType(string $type): ?object {
    $nodeStorage = $this->entityTypeManager->getStorage('node');

    $query = $nodeStorage->getQuery()
      ->condition('type', $type)
      ->condition('status', 1)
      ->accessCheck(FALSE)
      ->range(0, 1);

    $nids = $query->execute();

    if (!empty($nids)) {
      $nid = reset($nids);
      return $nodeStorage->load($nid);
    }

    return NULL;
  }

  /**
   * Get an existing menu link by title and menu.
   *
   * @param string $title
   *   The menu link title.
   * @param string $menuName
   *   The menu name.
   *
   * @return \Drupal\menu_link_content\Entity\MenuLinkContent|null
   *   The menu link or NULL if not found.
   */
  protected function getExistingMenuLink(string $title, string $menuName): ?MenuLinkContent {
    $links = $this->entityTypeManager
      ->getStorage('menu_link_content')
      ->loadByProperties([
        'title' => $title,
        'menu_name' => $menuName,
      ]);

    if (!empty($links)) {
      return reset($links);
    }

    return NULL;
  }

}
