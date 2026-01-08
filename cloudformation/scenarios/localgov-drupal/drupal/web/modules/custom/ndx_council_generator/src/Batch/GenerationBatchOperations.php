<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Batch;

use Drupal\ndx_council_generator\Service\CouncilGeneratorServiceInterface;
use Drupal\ndx_council_generator\Value\GenerationState;

/**
 * Batch operations for council generation.
 *
 * Story 5.1: ndx_council_generator Module Foundation
 */
class GenerationBatchOperations {

  /**
   * Batch operation: Generate council identity.
   *
   * @param array $options
   *   Generation options.
   * @param array $context
   *   Batch context.
   */
  public static function generateIdentity(array $options, array &$context): void {
    /** @var \Drupal\ndx_council_generator\Service\GenerationStateManagerInterface $stateManager */
    $stateManager = \Drupal::service('ndx_council_generator.state_manager');

    try {
      // Update status.
      $stateManager->updateStatus(GenerationState::STATUS_GENERATING_IDENTITY);

      // Identity generation logic will be implemented in Story 5.2.
      // This is the batch operation skeleton.
      $context['results']['identity'] = [
        'name' => 'Generated Council',
        'region' => 'South West',
        'theme' => 'coastal tourism',
      ];
      $context['message'] = t('Generating council identity...');

      $stateManager->updateProgress(
        CouncilGeneratorServiceInterface::IDENTITY_STEPS,
        self::getTotalSteps($options),
        'Identity generation complete'
      );

      // Store identity in state.
      $stateManager->setIdentity($context['results']['identity']);

    }
    catch (\Exception $e) {
      $stateManager->setError($e->getMessage());
      $context['results']['errors'][] = $e->getMessage();
    }
  }

  /**
   * Batch operation: Generate content pages.
   *
   * @param string $contentType
   *   Content type to generate.
   * @param int $count
   *   Number of items to generate.
   * @param array $options
   *   Generation options.
   * @param array $context
   *   Batch context.
   */
  public static function generateContent(string $contentType, int $count, array $options, array &$context): void {
    /** @var \Drupal\ndx_council_generator\Service\GenerationStateManagerInterface $stateManager */
    $stateManager = \Drupal::service('ndx_council_generator.state_manager');

    try {
      $stateManager->updateStatus(GenerationState::STATUS_GENERATING_CONTENT);

      // Content generation logic will be implemented in Story 5.3/5.4.
      // This is the batch operation skeleton.
      $context['message'] = t('Generating @type content (@count items)...', [
        '@type' => $contentType,
        '@count' => $count,
      ]);

      // Track generated items.
      if (!isset($context['results']['content'])) {
        $context['results']['content'] = [];
      }
      $context['results']['content'][$contentType] = $count;

      // Update progress.
      $currentStep = CouncilGeneratorServiceInterface::IDENTITY_STEPS +
        (count($context['results']['content']) * 10);

      $stateManager->updateProgress(
        $currentStep,
        self::getTotalSteps($options),
        sprintf('Generated %s content', $contentType)
      );

    }
    catch (\Exception $e) {
      $stateManager->setError($e->getMessage());
      $context['results']['errors'][] = $e->getMessage();
    }
  }

  /**
   * Batch operation: Generate images.
   *
   * @param array $imageSpecs
   *   Image specifications to generate.
   * @param array $options
   *   Generation options.
   * @param array $context
   *   Batch context.
   */
  public static function generateImages(array $imageSpecs, array $options, array &$context): void {
    /** @var \Drupal\ndx_council_generator\Service\GenerationStateManagerInterface $stateManager */
    $stateManager = \Drupal::service('ndx_council_generator.state_manager');

    // Skip if image generation disabled.
    if (!empty($options['skip_images'])) {
      $context['message'] = t('Skipping image generation.');
      return;
    }

    try {
      $stateManager->updateStatus(GenerationState::STATUS_GENERATING_IMAGES);

      // Image generation logic will be implemented in Story 5.6.
      // This is the batch operation skeleton.
      $context['message'] = t('Generating images (@count items)...', [
        '@count' => count($imageSpecs),
      ]);

      $context['results']['images'] = count($imageSpecs);

      // Update progress.
      $currentStep = CouncilGeneratorServiceInterface::IDENTITY_STEPS +
        CouncilGeneratorServiceInterface::CONTENT_STEPS +
        CouncilGeneratorServiceInterface::IMAGE_STEPS;

      $stateManager->updateProgress(
        $currentStep,
        self::getTotalSteps($options),
        'Image generation complete'
      );

    }
    catch (\Exception $e) {
      $stateManager->setError($e->getMessage());
      $context['results']['errors'][] = $e->getMessage();
    }
  }

  /**
   * Batch finished callback.
   *
   * @param bool $success
   *   Whether the batch succeeded.
   * @param array $results
   *   Batch results.
   * @param array $operations
   *   Operations that were not completed.
   */
  public static function finished(bool $success, array $results, array $operations): void {
    /** @var \Drupal\ndx_council_generator\Service\GenerationStateManagerInterface $stateManager */
    $stateManager = \Drupal::service('ndx_council_generator.state_manager');

    if ($success && empty($results['errors'])) {
      $stateManager->markComplete();

      $message = t('Council generation completed successfully.');

      // Add summary.
      if (!empty($results['identity'])) {
        $message .= ' ' . t('Council: @name (@region)', [
          '@name' => $results['identity']['name'] ?? 'Unknown',
          '@region' => $results['identity']['region'] ?? 'Unknown',
        ]);
      }

      if (!empty($results['content'])) {
        $total = array_sum($results['content']);
        $message .= ' ' . t('@count content items created.', ['@count' => $total]);
      }

      if (!empty($results['images'])) {
        $message .= ' ' . t('@count images generated.', ['@count' => $results['images']]);
      }

      \Drupal::messenger()->addStatus($message);
    }
    else {
      $errors = $results['errors'] ?? ['Unknown error'];
      $errorMessage = implode(', ', $errors);

      \Drupal::messenger()->addError(t('Council generation failed: @error', [
        '@error' => $errorMessage,
      ]));

      // State manager already has error set from individual operations.
    }
  }

  /**
   * Get total steps based on options.
   *
   * @param array $options
   *   Generation options.
   *
   * @return int
   *   Total steps.
   */
  protected static function getTotalSteps(array $options): int {
    $total = CouncilGeneratorServiceInterface::IDENTITY_STEPS +
      CouncilGeneratorServiceInterface::CONTENT_STEPS;

    if (empty($options['skip_images'])) {
      $total += CouncilGeneratorServiceInterface::IMAGE_STEPS;
    }

    return $total;
  }

  /**
   * Create batch definition for full generation.
   *
   * @param array $options
   *   Generation options.
   *
   * @return array
   *   Batch definition array.
   */
  public static function createBatch(array $options = []): array {
    $operations = [];

    // Identity generation.
    $operations[] = [
      [self::class, 'generateIdentity'],
      [$options],
    ];

    // Content generation - broken into chunks.
    // These will be expanded in Story 5.3/5.4.
    $contentTypes = [
      'service_page' => 20,
      'guide' => 8,
      'directory_entry' => 15,
      'news' => 5,
    ];

    foreach ($contentTypes as $type => $count) {
      $operations[] = [
        [self::class, 'generateContent'],
        [$type, $count, $options],
      ];
    }

    // Image generation.
    if (empty($options['skip_images'])) {
      $operations[] = [
        [self::class, 'generateImages'],
        [[], $options],
      ];
    }

    return [
      'title' => t('Generating Council'),
      'operations' => $operations,
      'finished' => [self::class, 'finished'],
      'init_message' => t('Initializing council generation...'),
      'progress_message' => t('Processing @current of @total.'),
      'error_message' => t('Council generation encountered an error.'),
    ];
  }

}
