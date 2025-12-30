<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\Core\Url;
use Drupal\ndx_aws_ai\Service\PollyServiceInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides a 'Listen to this page' TTS block.
 *
 * Displays a TTS player component that allows visitors to listen
 * to page content using Amazon Polly text-to-speech.
 *
 * @Block(
 *   id = "ndx_listen_to_page",
 *   admin_label = @Translation("Listen to this Page"),
 *   category = @Translation("AI Accessibility"),
 * )
 *
 * Story 4.6: Listen to Page (TTS Button)
 */
class ListenToPageBlock extends BlockBase implements ContainerFactoryPluginInterface {

  /**
   * Human-readable language names.
   */
  protected const LANGUAGE_NAMES = [
    'en-GB' => 'English (UK)',
    'cy-GB' => 'Cymraeg (Welsh)',
    'fr-FR' => 'Français',
    'ro-RO' => 'Română',
    'es-ES' => 'Español',
    'cs-CZ' => 'Čeština',
    'pl-PL' => 'Polski',
  ];

  /**
   * The current route match.
   *
   * @var \Drupal\Core\Routing\RouteMatchInterface
   */
  protected RouteMatchInterface $routeMatch;

  /**
   * {@inheritdoc}
   */
  public static function create(
    ContainerInterface $container,
    array $configuration,
    $plugin_id,
    $plugin_definition,
  ): self {
    $instance = new self($configuration, $plugin_id, $plugin_definition);
    $instance->routeMatch = $container->get('current_route_match');
    return $instance;
  }

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration(): array {
    return [
      'default_language' => 'en-GB',
      'show_speed_control' => TRUE,
      'sticky_position' => TRUE,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state): array {
    $form = parent::blockForm($form, $form_state);

    $form['default_language'] = [
      '#type' => 'select',
      '#title' => $this->t('Default language'),
      '#options' => self::LANGUAGE_NAMES,
      '#default_value' => $this->configuration['default_language'],
      '#description' => $this->t('The default language for text-to-speech.'),
    ];

    $form['show_speed_control'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show speed control'),
      '#default_value' => $this->configuration['show_speed_control'],
      '#description' => $this->t('Allow users to adjust playback speed.'),
    ];

    $form['sticky_position'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Sticky position'),
      '#default_value' => $this->configuration['sticky_position'],
      '#description' => $this->t('Keep the player visible while scrolling.'),
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state): void {
    $this->configuration['default_language'] = $form_state->getValue('default_language');
    $this->configuration['show_speed_control'] = $form_state->getValue('show_speed_control');
    $this->configuration['sticky_position'] = $form_state->getValue('sticky_position');
  }

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    // Build language options for the selector.
    $languages = [];
    foreach (PollyServiceInterface::SUPPORTED_LANGUAGES as $code => $config) {
      $languages[$code] = [
        'name' => self::LANGUAGE_NAMES[$code] ?? $code,
        'voice' => $config['voice'],
        'engine' => $config['engine'],
      ];
    }

    $classes = ['tts-player'];
    if ($this->configuration['sticky_position']) {
      $classes[] = 'tts-player--sticky';
    }

    return [
      '#theme' => 'listen_to_page_player',
      '#languages' => $languages,
      '#default_language' => $this->configuration['default_language'],
      '#show_speed_control' => $this->configuration['show_speed_control'],
      '#attributes' => [
        'class' => $classes,
        'role' => 'region',
        'aria-label' => $this->t('Audio player'),
      ],
      '#attached' => [
        'library' => ['ndx_aws_ai/tts-player'],
        'drupalSettings' => [
          'ndxTts' => [
            'endpoint' => Url::fromRoute('ndx_aws_ai.tts.synthesize')->toString(),
            'languagesEndpoint' => Url::fromRoute('ndx_aws_ai.tts.languages')->toString(),
            'languages' => $languages,
            'defaultLanguage' => $this->configuration['default_language'],
            'showSpeedControl' => $this->configuration['show_speed_control'],
          ],
        ],
      ],
      '#cache' => [
        'contexts' => ['url.path'],
      ],
    ];
  }

}
