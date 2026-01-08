<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Url;
use Drupal\ndx_aws_ai\Service\TranslateServiceInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides a 'Translate this Page' block.
 *
 * Allows visitors to translate page content to 75+ languages using
 * Amazon Translate service. Stores language preference in localStorage
 * for cross-page persistence.
 *
 * Story 4.7: Content Translation
 *
 * @Block(
 *   id = "ndx_content_translation",
 *   admin_label = @Translation("Translate this Page"),
 *   category = @Translation("AI Accessibility"),
 * )
 */
class ContentTranslationBlock extends BlockBase implements ContainerFactoryPluginInterface {

  /**
   * The Translate service.
   */
  protected TranslateServiceInterface $translateService;

  /**
   * {@inheritdoc}
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    TranslateServiceInterface $translateService,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->translateService = $translateService;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(
    ContainerInterface $container,
    array $configuration,
    $plugin_id,
    $plugin_definition,
  ): static {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('ndx_aws_ai.translate'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration(): array {
    return [
      'show_search' => TRUE,
      'show_priority_languages' => TRUE,
      'remember_preference' => TRUE,
      'auto_translate' => FALSE,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state): array {
    $form = parent::blockForm($form, $form_state);

    $form['show_search'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show language search'),
      '#description' => $this->t('Display a search/filter input to find languages quickly.'),
      '#default_value' => $this->configuration['show_search'],
    ];

    $form['show_priority_languages'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show priority languages'),
      '#description' => $this->t('Display commonly used UK council languages at the top.'),
      '#default_value' => $this->configuration['show_priority_languages'],
    ];

    $form['remember_preference'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Remember language preference'),
      '#description' => $this->t('Store language choice in browser for future visits.'),
      '#default_value' => $this->configuration['remember_preference'],
    ];

    $form['auto_translate'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Auto-translate on page load'),
      '#description' => $this->t('Automatically translate if a preference is saved.'),
      '#default_value' => $this->configuration['auto_translate'],
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state): void {
    parent::blockSubmit($form, $form_state);

    $this->configuration['show_search'] = $form_state->getValue('show_search');
    $this->configuration['show_priority_languages'] = $form_state->getValue('show_priority_languages');
    $this->configuration['remember_preference'] = $form_state->getValue('remember_preference');
    $this->configuration['auto_translate'] = $form_state->getValue('auto_translate');
  }

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    // Check if service is available.
    if (!$this->translateService->isAvailable()) {
      return [
        '#markup' => '',
        '#cache' => ['max-age' => 60],
      ];
    }

    $priorityLanguages = $this->translateService->getPriorityLanguages();
    $allLanguages = $this->translateService->getSupportedLanguages();

    return [
      '#theme' => 'content_translation_widget',
      '#show_search' => $this->configuration['show_search'],
      '#show_priority_languages' => $this->configuration['show_priority_languages'],
      '#priority_languages' => $priorityLanguages,
      '#all_languages' => $allLanguages,
      '#attributes' => [
        'role' => 'region',
        'aria-label' => $this->t('Page translation'),
      ],
      '#attached' => [
        'library' => ['ndx_aws_ai/content-translation'],
        'drupalSettings' => [
          'ndxTranslation' => [
            'endpoint' => Url::fromRoute('ndx_aws_ai.translation.translate')->toString(),
            'languagesEndpoint' => Url::fromRoute('ndx_aws_ai.translation.languages')->toString(),
            'priorityLanguages' => $priorityLanguages,
            'allLanguages' => $allLanguages,
            'showSearch' => $this->configuration['show_search'],
            'showPriorityLanguages' => $this->configuration['show_priority_languages'],
            'rememberPreference' => $this->configuration['remember_preference'],
            'autoTranslate' => $this->configuration['auto_translate'],
          ],
        ],
      ],
      '#cache' => [
        'contexts' => ['url.path'],
        'max-age' => 3600,
      ],
    ];
  }

}
