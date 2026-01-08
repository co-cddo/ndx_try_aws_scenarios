<?php

namespace Drupal\ndx_welcome\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Url;

/**
 * Provides a 'Welcome' Block.
 *
 * Displays council name, welcome message, and quick links
 * to help users navigate the CMS.
 *
 * Story 1.11: First Login Welcome Experience
 *
 * @Block(
 *   id = "ndx_welcome_block",
 *   admin_label = @Translation("NDX Welcome Block"),
 *   category = @Translation("NDX"),
 * )
 */
class WelcomeBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function build() {
    // Get council name from environment or use default.
    $council_name = getenv('COUNCIL_NAME') ?: 'Westbridge Council';

    // Define quick links for admin navigation.
    $quick_links = [
      [
        'title' => $this->t('Manage Content'),
        'description' => $this->t('Create, edit, and publish pages'),
        'url' => Url::fromRoute('system.admin_content')->toString(),
        'icon' => 'edit',
      ],
      [
        'title' => $this->t('Media Library'),
        'description' => $this->t('Upload and manage images'),
        'url' => Url::fromRoute('entity.media.collection')->toString(),
        'icon' => 'image',
      ],
      [
        'title' => $this->t('View Site'),
        'description' => $this->t('See your public website'),
        'url' => Url::fromRoute('<front>')->toString(),
        'icon' => 'external',
      ],
      [
        'title' => $this->t('LocalGov Drupal Docs'),
        'description' => $this->t('Learn more about the CMS'),
        'url' => 'https://localgovdrupal.org/resources/documentation',
        'icon' => 'help',
        'external' => TRUE,
      ],
    ];

    return [
      '#theme' => 'ndx_welcome_block',
      '#council_name' => $council_name,
      '#quick_links' => $quick_links,
      '#attached' => [
        'library' => [
          'ndx_welcome/welcome',
        ],
      ],
      '#cache' => [
        'contexts' => ['user.roles:authenticated'],
        'max-age' => 3600,
      ],
    ];
  }

}
