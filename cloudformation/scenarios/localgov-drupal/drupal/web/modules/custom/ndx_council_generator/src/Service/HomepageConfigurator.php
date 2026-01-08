<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\block\Entity\Block;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityStorageException;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Drupal\ndx_council_generator\Value\HomepageConfigurationResult;
use Psr\Log\LoggerInterface;

/**
 * Homepage configuration service.
 *
 * Story 5.10: Homepage Views and Blocks Configuration
 *
 * Configures the homepage to display service categories, latest news,
 * and quick action links after council content generation.
 */
class HomepageConfigurator implements HomepageConfiguratorInterface {

  /**
   * Marker to identify generator-created blocks.
   */
  protected const GENERATOR_MARKER = 'ndx_generated';

  /**
   * Block ID prefix for generated blocks.
   */
  protected const BLOCK_PREFIX = 'ndx_';

  /**
   * Theme name for block placement.
   */
  protected const THEME_NAME = 'localgov_scarfolk';

  /**
   * Content type constants.
   */
  protected const CONTENT_TYPE_SERVICES_LANDING = 'localgov_services_landing';
  protected const CONTENT_TYPE_NEWS_ARTICLE = 'localgov_news_article';

  /**
   * Title pattern for homepage.
   */
  protected const TITLE_PATTERN_WELCOME = 'Welcome to';

  /**
   * View configurations for homepage blocks.
   *
   * Keys are internal names, values contain view_id and display_id.
   */
  protected const VIEW_CONFIGS = [
    'services' => [
      'view_id' => 'services',
      'display_id' => 'block_1',
    ],
    'news' => [
      'view_id' => 'localgov_news_list',
      'display_id' => 'block_1',
    ],
  ];

  /**
   * Constructs a HomepageConfigurator.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The config factory.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger service.
   */
  public function __construct(
    protected EntityTypeManagerInterface $entityTypeManager,
    protected ConfigFactoryInterface $configFactory,
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function configureHomepage(CouncilIdentity $identity): HomepageConfigurationResult {
    $errors = [];
    $blocksConfigured = 0;
    $blocksSkipped = 0;

    try {
      // Step 1: Set the front page.
      $frontPageSet = $this->setFrontPage($identity);
      if (!$frontPageSet) {
        $errors[] = 'Failed to set front page';
      }

      // Step 2: Configure services block.
      $servicesResult = $this->configureServicesBlock();
      if ($servicesResult) {
        $blocksConfigured++;
        $this->logger->info('Services block configured for homepage');
      }
      else {
        $blocksSkipped++;
        $this->logger->debug('Services block already configured or skipped');
      }

      // Step 3: Configure news block.
      $newsResult = $this->configureNewsBlock();
      if ($newsResult) {
        $blocksConfigured++;
        $this->logger->info('News block configured for homepage');
      }
      else {
        $blocksSkipped++;
        $this->logger->debug('News block already configured or skipped');
      }

      // Step 4: Configure quick actions block (optional).
      $quickActionsResult = $this->configureQuickActionsBlock($identity);
      if ($quickActionsResult) {
        $blocksConfigured++;
        $this->logger->info('Quick actions block configured for homepage');
      }
      else {
        $blocksSkipped++;
        $this->logger->debug('Quick actions block skipped');
      }

      $this->logger->info('Homepage configured: @summary', [
        '@summary' => sprintf(
          'front page %s, %d blocks configured, %d skipped',
          $frontPageSet ? 'set' : 'failed',
          $blocksConfigured,
          $blocksSkipped
        ),
      ]);

      return new HomepageConfigurationResult(
        $frontPageSet,
        $blocksConfigured,
        $blocksSkipped,
        $errors
      );
    }
    catch (\Exception $e) {
      $this->logger->error('Homepage configuration failed: @error', [
        '@error' => $e->getMessage(),
      ]);
      return HomepageConfigurationResult::failure($e->getMessage());
    }
  }

  /**
   * {@inheritdoc}
   */
  public function setFrontPage(CouncilIdentity $identity): bool {
    try {
      // Find the homepage node (Welcome to [Council Name]).
      $homepageTitle = self::TITLE_PATTERN_WELCOME . ' ' . $identity->name;
      $nodeStorage = $this->entityTypeManager->getStorage('node');

      $nodes = $nodeStorage->loadByProperties([
        'type' => self::CONTENT_TYPE_SERVICES_LANDING,
        'title' => $homepageTitle,
        'status' => 1,
      ]);

      if (empty($nodes)) {
        // Try partial match if exact title not found.
        $query = $nodeStorage->getQuery()
          ->condition('type', self::CONTENT_TYPE_SERVICES_LANDING)
          ->condition('title', '%' . addcslashes(self::TITLE_PATTERN_WELCOME, '%_\\') . '%', 'LIKE')
          ->condition('status', 1)
          ->accessCheck(FALSE)
          ->range(0, 1);

        $nids = $query->execute();
        if (!empty($nids)) {
          $nodes = $nodeStorage->loadMultiple($nids);
        }
      }

      if (empty($nodes)) {
        $this->logger->warning('Homepage node not found for: @title', [
          '@title' => $homepageTitle,
        ]);
        return FALSE;
      }

      $node = reset($nodes);
      $frontPagePath = '/node/' . $node->id();

      // Set the system site front page.
      $config = $this->configFactory->getEditable('system.site');
      $currentFrontPage = $config->get('page.front');

      if ($currentFrontPage === $frontPagePath) {
        $this->logger->debug('Front page already set to: @path', ['@path' => $frontPagePath]);
        return TRUE;
      }

      $config->set('page.front', $frontPagePath)->save();

      $this->logger->info('Front page set to: @path (@title)', [
        '@path' => $frontPagePath,
        '@title' => $node->getTitle(),
      ]);

      return TRUE;
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to set front page: @error', [
        '@error' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function configureServicesBlock(): bool {
    $blockId = self::BLOCK_PREFIX . 'services_homepage';

    // Check if block already exists.
    if ($this->blockExists($blockId)) {
      $this->logger->debug('Services block already exists: @id', ['@id' => $blockId]);
      return FALSE;
    }

    // Validate that the services view exists.
    $viewConfig = self::VIEW_CONFIGS['services'];
    if (!$this->viewDisplayExists($viewConfig['view_id'], $viewConfig['display_id'])) {
      $this->logger->warning('Services view or display not found: @view:@display', [
        '@view' => $viewConfig['view_id'],
        '@display' => $viewConfig['display_id'],
      ]);
      return FALSE;
    }

    $pluginId = sprintf('views_block:%s-%s', $viewConfig['view_id'], $viewConfig['display_id']);

    try {
      // Create a views block for services listing.
      $block = Block::create([
        'id' => $blockId,
        'theme' => $this->getActiveTheme(),
        'region' => 'content',
        'plugin' => $pluginId,
        'settings' => [
          'id' => $pluginId,
          'label' => 'Our Services',
          'label_display' => 'visible',
          'provider' => 'views',
          'items_per_page' => 'none',
        ],
        'visibility' => [
          'request_path' => [
            'id' => 'request_path',
            'pages' => '<front>',
            'negate' => FALSE,
          ],
        ],
        'weight' => 0,
        'status' => TRUE,
      ]);

      $block->setThirdPartySetting('ndx_council_generator', 'marker', self::GENERATOR_MARKER);
      $block->save();

      $this->logger->info('Created services block: @id', ['@id' => $blockId]);
      return TRUE;
    }
    catch (EntityStorageException $e) {
      $this->logger->error('Failed to create services block: @error', [
        '@error' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function configureNewsBlock(): bool {
    $blockId = self::BLOCK_PREFIX . 'news_homepage';

    // Check if block already exists.
    if ($this->blockExists($blockId)) {
      $this->logger->debug('News block already exists: @id', ['@id' => $blockId]);
      return FALSE;
    }

    // Validate that the news view exists.
    $viewConfig = self::VIEW_CONFIGS['news'];
    if (!$this->viewDisplayExists($viewConfig['view_id'], $viewConfig['display_id'])) {
      $this->logger->warning('News view or display not found: @view:@display', [
        '@view' => $viewConfig['view_id'],
        '@display' => $viewConfig['display_id'],
      ]);
      return FALSE;
    }

    // Check if any news articles exist.
    if (!$this->hasNewsContent()) {
      $this->logger->debug('No news content found, skipping news block');
      return FALSE;
    }

    $pluginId = sprintf('views_block:%s-%s', $viewConfig['view_id'], $viewConfig['display_id']);

    try {
      // Create a views block for latest news.
      $block = Block::create([
        'id' => $blockId,
        'theme' => $this->getActiveTheme(),
        'region' => 'content',
        'plugin' => $pluginId,
        'settings' => [
          'id' => $pluginId,
          'label' => 'Latest News',
          'label_display' => 'visible',
          'provider' => 'views',
          'items_per_page' => 3,
        ],
        'visibility' => [
          'request_path' => [
            'id' => 'request_path',
            'pages' => '<front>',
            'negate' => FALSE,
          ],
        ],
        'weight' => 10,
        'status' => TRUE,
      ]);

      $block->setThirdPartySetting('ndx_council_generator', 'marker', self::GENERATOR_MARKER);
      $block->save();

      $this->logger->info('Created news block: @id', ['@id' => $blockId]);
      return TRUE;
    }
    catch (EntityStorageException $e) {
      $this->logger->error('Failed to create news block: @error', [
        '@error' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * Configures the quick actions block for the homepage.
   *
   * Creates a custom block with quick action links for common council tasks.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   *
   * @return bool
   *   TRUE if successful, FALSE otherwise.
   */
  protected function configureQuickActionsBlock(CouncilIdentity $identity): bool {
    $blockId = self::BLOCK_PREFIX . 'quick_actions_homepage';

    // Check if block already exists.
    if ($this->blockExists($blockId)) {
      $this->logger->debug('Quick actions block already exists: @id', ['@id' => $blockId]);
      return FALSE;
    }

    // Validate that 'basic' block_content type exists.
    if (!$this->blockContentTypeExists('basic')) {
      $this->logger->warning('Block content type "basic" not found, skipping quick actions');
      return FALSE;
    }

    try {
      // First, create the block content entity.
      $blockContentStorage = $this->entityTypeManager->getStorage('block_content');

      // Check if block content already exists.
      $existingContent = $blockContentStorage->loadByProperties([
        'info' => 'Quick Actions - Generated',
      ]);

      if (empty($existingContent)) {
        // Create the block content with quick action links.
        $blockContent = $blockContentStorage->create([
          'type' => 'basic',
          'info' => 'Quick Actions - Generated',
          'body' => [
            'value' => $this->generateQuickActionsHtml($identity),
            'format' => 'full_html',
          ],
        ]);
        $blockContent->save();
      }
      else {
        $blockContent = reset($existingContent);
      }

      // Place the block in the content_top region.
      $block = Block::create([
        'id' => $blockId,
        'theme' => $this->getActiveTheme(),
        'region' => 'content_top',
        'plugin' => 'block_content:' . $blockContent->uuid(),
        'settings' => [
          'id' => 'block_content:' . $blockContent->uuid(),
          'label' => 'Quick Actions',
          'label_display' => '0',
          'provider' => 'block_content',
        ],
        'visibility' => [
          'request_path' => [
            'id' => 'request_path',
            'pages' => '<front>',
            'negate' => FALSE,
          ],
        ],
        'weight' => -10,
        'status' => TRUE,
      ]);

      $block->setThirdPartySetting('ndx_council_generator', 'marker', self::GENERATOR_MARKER);
      $block->save();

      $this->logger->info('Created quick actions block: @id', ['@id' => $blockId]);
      return TRUE;
    }
    catch (EntityStorageException $e) {
      $this->logger->error('Failed to create quick actions block: @error', [
        '@error' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function clearGeneratedBlocks(): int {
    $deleted = 0;

    try {
      $blockStorage = $this->entityTypeManager->getStorage('block');

      // Find all blocks with our prefix.
      $query = $blockStorage->getQuery()
        ->condition('id', self::BLOCK_PREFIX . '%', 'LIKE')
        ->accessCheck(FALSE);

      $blockIds = $query->execute();

      foreach ($blockIds as $blockId) {
        $block = $blockStorage->load($blockId);
        if ($block) {
          // Check for our marker in third party settings.
          $marker = $block->getThirdPartySetting('ndx_council_generator', 'marker');
          if ($marker === self::GENERATOR_MARKER) {
            $block->delete();
            $deleted++;
            $this->logger->debug('Deleted generated block: @id', ['@id' => $blockId]);
          }
        }
      }

      // Also delete generated block content.
      $blockContentStorage = $this->entityTypeManager->getStorage('block_content');
      $generatedContent = $blockContentStorage->loadByProperties([
        'info' => 'Quick Actions - Generated',
      ]);

      foreach ($generatedContent as $content) {
        $content->delete();
        $this->logger->debug('Deleted generated block content: @info', [
          '@info' => $content->get('info')->value,
        ]);
      }

      $this->logger->info('Cleared @count generated blocks', ['@count' => $deleted]);
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to clear generated blocks: @error', [
        '@error' => $e->getMessage(),
      ]);
    }

    return $deleted;
  }

  /**
   * Check if a block exists by ID.
   *
   * @param string $blockId
   *   The block ID.
   *
   * @return bool
   *   TRUE if the block exists, FALSE otherwise.
   */
  protected function blockExists(string $blockId): bool {
    $block = $this->entityTypeManager->getStorage('block')->load($blockId);
    return $block !== NULL;
  }

  /**
   * Check if news content exists.
   *
   * @return bool
   *   TRUE if news articles exist, FALSE otherwise.
   */
  protected function hasNewsContent(): bool {
    $query = $this->entityTypeManager->getStorage('node')->getQuery()
      ->condition('type', self::CONTENT_TYPE_NEWS_ARTICLE)
      ->condition('status', 1)
      ->accessCheck(FALSE)
      ->range(0, 1);

    $result = $query->execute();
    return !empty($result);
  }

  /**
   * Get the active theme name.
   *
   * @return string
   *   The theme name.
   */
  protected function getActiveTheme(): string {
    // Try to get the default theme from config.
    $config = $this->configFactory->get('system.theme');
    $defaultTheme = $config->get('default');

    // If theme exists, use it; otherwise fall back to our constant.
    if ($defaultTheme) {
      return $defaultTheme;
    }

    return self::THEME_NAME;
  }

  /**
   * Check if a view and display exist.
   *
   * @param string $viewId
   *   The view ID.
   * @param string $displayId
   *   The display ID.
   *
   * @return bool
   *   TRUE if both view and display exist, FALSE otherwise.
   */
  protected function viewDisplayExists(string $viewId, string $displayId): bool {
    try {
      $viewStorage = $this->entityTypeManager->getStorage('view');
      /** @var \Drupal\views\Entity\View|null $view */
      $view = $viewStorage->load($viewId);

      if ($view === NULL) {
        return FALSE;
      }

      // Check if the display exists.
      $displays = $view->get('display');
      return isset($displays[$displayId]);
    }
    catch (\Exception $e) {
      $this->logger->debug('Error checking view existence: @error', [
        '@error' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * Validate that block_content type exists.
   *
   * @param string $blockType
   *   The block content type ID.
   *
   * @return bool
   *   TRUE if the type exists, FALSE otherwise.
   */
  protected function blockContentTypeExists(string $blockType): bool {
    try {
      $storage = $this->entityTypeManager->getStorage('block_content_type');
      return $storage->load($blockType) !== NULL;
    }
    catch (\Exception $e) {
      return FALSE;
    }
  }

  /**
   * Generate HTML for quick actions block.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   *
   * @return string
   *   The HTML content.
   */
  protected function generateQuickActionsHtml(CouncilIdentity $identity): string {
    $actions = [
      [
        'title' => 'Report a problem',
        'description' => 'Report issues like potholes, fly-tipping, or streetlight faults',
        'url' => '/contact',
        'icon' => 'report',
      ],
      [
        'title' => 'Pay for it',
        'description' => 'Pay council tax, parking fines, or other bills',
        'url' => '/services',
        'icon' => 'payment',
      ],
      [
        'title' => 'Apply for it',
        'description' => 'Apply for permits, licences, or benefits',
        'url' => '/services',
        'icon' => 'apply',
      ],
      [
        'title' => 'Find information',
        'description' => 'Search our services and information',
        'url' => '/services',
        'icon' => 'search',
      ],
    ];

    $html = '<div class="quick-actions">';
    $html .= '<h2 class="quick-actions__title">How can we help you today?</h2>';
    $html .= '<div class="quick-actions__grid">';

    foreach ($actions as $action) {
      $html .= sprintf(
        '<a href="%s" class="quick-actions__item">
          <span class="quick-actions__icon quick-actions__icon--%s"></span>
          <span class="quick-actions__content">
            <span class="quick-actions__item-title">%s</span>
            <span class="quick-actions__item-desc">%s</span>
          </span>
        </a>',
        htmlspecialchars($action['url'], ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($action['icon'], ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($action['title'], ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($action['description'], ENT_QUOTES, 'UTF-8')
      );
    }

    $html .= '</div></div>';

    return $html;
  }

}
