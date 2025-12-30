<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\ndx_council_generator\Batch\GenerationBatchOperations;
use Drupal\ndx_council_generator\Service\CouncilGeneratorServiceInterface;
use Drupal\ndx_council_generator\Service\GenerationStateManagerInterface;
use Drupal\ndx_council_generator\Value\GenerationState;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Form for viewing and managing council generation status.
 *
 * Story 5.1: ndx_council_generator Module Foundation
 */
class GenerationStatusForm extends FormBase {

  /**
   * Constructs a GenerationStatusForm.
   *
   * @param \Drupal\ndx_council_generator\Service\GenerationStateManagerInterface $stateManager
   *   The generation state manager.
   * @param \Drupal\ndx_council_generator\Service\CouncilGeneratorServiceInterface $generatorService
   *   The council generator service.
   */
  public function __construct(
    protected readonly GenerationStateManagerInterface $stateManager,
    protected readonly CouncilGeneratorServiceInterface $generatorService,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('ndx_council_generator.state_manager'),
      $container->get('ndx_council_generator.generator'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'ndx_council_generator_status_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $state = $this->stateManager->getState();

    // Status display.
    $form['status'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['council-generator-status'],
        'aria-live' => 'polite',
      ],
    ];

    $form['status']['current_status'] = [
      '#type' => 'item',
      '#title' => $this->t('Current Status'),
      '#markup' => $this->formatStatus($state),
    ];

    // Progress display.
    if ($state->isInProgress() || $state->isPaused()) {
      $form['status']['progress'] = [
        '#type' => 'item',
        '#title' => $this->t('Progress'),
        '#markup' => $this->formatProgress($state),
      ];

      $form['status']['progress_bar'] = [
        '#type' => 'html_tag',
        '#tag' => 'progress',
        '#attributes' => [
          'value' => $state->getProgressPercentage(),
          'max' => 100,
          'class' => ['council-generator-progress'],
        ],
      ];
    }

    // Identity display if available.
    if ($state->identity) {
      $form['identity'] = [
        '#type' => 'details',
        '#title' => $this->t('Council Identity'),
        '#open' => TRUE,
      ];

      $form['identity']['details'] = [
        '#type' => 'table',
        '#header' => [$this->t('Field'), $this->t('Value')],
        '#rows' => $this->formatIdentityRows($state->identity),
      ];
    }

    // Error display.
    if ($state->hasError()) {
      $form['error'] = [
        '#type' => 'container',
        '#attributes' => ['class' => ['messages', 'messages--error']],
      ];

      $form['error']['message'] = [
        '#markup' => $this->t('Last error: @error', ['@error' => $state->lastError]),
      ];
    }

    // Actions based on current state.
    $form['actions'] = [
      '#type' => 'actions',
    ];

    if ($state->isIdle() || $state->hasError() || $state->isComplete()) {
      $form['actions']['start'] = [
        '#type' => 'submit',
        '#value' => $this->t('Start Generation'),
        '#submit' => ['::startGeneration'],
        '#disabled' => !$this->generatorService->isAvailable(),
      ];

      if (!$this->generatorService->isAvailable()) {
        $form['actions']['availability_warning'] = [
          '#markup' => '<p class="messages messages--warning">' .
            $this->t('AWS services are not available. Check module configuration.') .
            '</p>',
        ];
      }
    }

    if ($state->isInProgress()) {
      $form['actions']['pause'] = [
        '#type' => 'submit',
        '#value' => $this->t('Pause'),
        '#submit' => ['::pauseGeneration'],
      ];
    }

    if ($state->isPaused()) {
      $form['actions']['resume'] = [
        '#type' => 'submit',
        '#value' => $this->t('Resume'),
        '#submit' => ['::resumeGeneration'],
      ];
    }

    if (!$state->isIdle()) {
      $form['actions']['clear'] = [
        '#type' => 'submit',
        '#value' => $this->t('Clear State'),
        '#submit' => ['::clearState'],
        '#attributes' => [
          'class' => ['button--danger'],
        ],
      ];
    }

    // Generation options (only when idle).
    if ($state->isIdle() || $state->hasError() || $state->isComplete()) {
      $form['options'] = [
        '#type' => 'details',
        '#title' => $this->t('Generation Options'),
        '#open' => FALSE,
      ];

      $form['options']['skip_images'] = [
        '#type' => 'checkbox',
        '#title' => $this->t('Skip image generation'),
        '#description' => $this->t('Generate content without images (faster, for testing).'),
        '#default_value' => FALSE,
      ];

      $form['options']['region'] = [
        '#type' => 'select',
        '#title' => $this->t('Preferred Region'),
        '#options' => [
          '' => $this->t('- Random -'),
          'north_east' => $this->t('North East'),
          'north_west' => $this->t('North West'),
          'yorkshire' => $this->t('Yorkshire and the Humber'),
          'east_midlands' => $this->t('East Midlands'),
          'west_midlands' => $this->t('West Midlands'),
          'east' => $this->t('East of England'),
          'london' => $this->t('London'),
          'south_east' => $this->t('South East'),
          'south_west' => $this->t('South West'),
          'wales' => $this->t('Wales'),
          'scotland' => $this->t('Scotland'),
          'northern_ireland' => $this->t('Northern Ireland'),
        ],
        '#description' => $this->t('Optionally specify a UK region for the generated council.'),
      ];
    }

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    // Default submit does nothing - actions have their own handlers.
  }

  /**
   * Start generation submit handler.
   */
  public function startGeneration(array &$form, FormStateInterface $form_state): void {
    $options = [
      'skip_images' => (bool) $form_state->getValue('skip_images'),
      'region' => $form_state->getValue('region') ?: NULL,
    ];

    // Use batch API for generation.
    $batch = GenerationBatchOperations::createBatch($options);
    batch_set($batch);

    $this->messenger()->addStatus($this->t('Council generation started.'));
  }

  /**
   * Pause generation submit handler.
   */
  public function pauseGeneration(array &$form, FormStateInterface $form_state): void {
    $this->generatorService->pauseGeneration();
    $this->messenger()->addStatus($this->t('Generation paused. You can resume later.'));
  }

  /**
   * Resume generation submit handler.
   */
  public function resumeGeneration(array &$form, FormStateInterface $form_state): void {
    $this->generatorService->resumeGeneration();
    $this->messenger()->addStatus($this->t('Generation resumed.'));
  }

  /**
   * Clear state submit handler.
   */
  public function clearState(array &$form, FormStateInterface $form_state): void {
    $this->stateManager->clearState();
    $this->messenger()->addStatus($this->t('Generation state cleared.'));
  }

  /**
   * Format status for display.
   *
   * @param \Drupal\ndx_council_generator\Value\GenerationState $state
   *   Current state.
   *
   * @return string
   *   Formatted status HTML.
   */
  protected function formatStatus(GenerationState $state): string {
    $statusLabels = [
      GenerationState::STATUS_IDLE => $this->t('Not started'),
      GenerationState::STATUS_GENERATING_IDENTITY => $this->t('Generating identity'),
      GenerationState::STATUS_GENERATING_CONTENT => $this->t('Generating content'),
      GenerationState::STATUS_GENERATING_IMAGES => $this->t('Generating images'),
      GenerationState::STATUS_COMPLETE => $this->t('Complete'),
      GenerationState::STATUS_ERROR => $this->t('Error'),
      GenerationState::STATUS_PAUSED => $this->t('Paused'),
    ];

    $statusClasses = [
      GenerationState::STATUS_IDLE => 'status-idle',
      GenerationState::STATUS_GENERATING_IDENTITY => 'status-in-progress',
      GenerationState::STATUS_GENERATING_CONTENT => 'status-in-progress',
      GenerationState::STATUS_GENERATING_IMAGES => 'status-in-progress',
      GenerationState::STATUS_COMPLETE => 'status-complete',
      GenerationState::STATUS_ERROR => 'status-error',
      GenerationState::STATUS_PAUSED => 'status-paused',
    ];

    $label = $statusLabels[$state->status] ?? $state->status;
    $class = $statusClasses[$state->status] ?? 'status-unknown';

    return sprintf('<span class="council-generator-status %s">%s</span>', $class, $label);
  }

  /**
   * Format progress for display.
   *
   * @param \Drupal\ndx_council_generator\Value\GenerationState $state
   *   Current state.
   *
   * @return string
   *   Formatted progress text.
   */
  protected function formatProgress(GenerationState $state): string {
    return sprintf(
      '%d%% (%d of %d steps) - %s',
      $state->getProgressPercentage(),
      $state->currentStep,
      $state->totalSteps,
      $state->currentPhase ?? 'Processing'
    );
  }

  /**
   * Format identity data as table rows.
   *
   * @param array $identity
   *   Identity data.
   *
   * @return array
   *   Table rows.
   */
  protected function formatIdentityRows(array $identity): array {
    $rows = [];

    $labels = [
      'name' => $this->t('Council Name'),
      'region' => $this->t('Region'),
      'theme' => $this->t('Theme/Character'),
      'population' => $this->t('Population'),
      'keywords' => $this->t('Local Keywords'),
    ];

    foreach ($identity as $key => $value) {
      $label = $labels[$key] ?? ucfirst(str_replace('_', ' ', $key));

      if (is_array($value)) {
        $value = implode(', ', $value);
      }

      $rows[] = [$label, $value];
    }

    return $rows;
  }

}
