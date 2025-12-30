<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\EventSubscriber;

use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\media\MediaInterface;
use Drupal\ndx_aws_ai\Service\AltTextGeneratorInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Drupal\Core\Entity\EntityTypeEvents;

/**
 * Event subscriber for automatic alt-text generation on media upload.
 *
 * Listens to media entity presave events and generates alt-text
 * for image media types when alt-text is empty.
 *
 * Story 4.5: Auto Alt-Text on Media Upload
 */
class AltTextEventSubscriber implements EventSubscriberInterface {

  /**
   * Constructs an AltTextEventSubscriber.
   *
   * @param \Drupal\ndx_aws_ai\Service\AltTextGeneratorInterface $altTextGenerator
   *   The alt-text generator service.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The config factory.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected AltTextGeneratorInterface $altTextGenerator,
    protected ConfigFactoryInterface $configFactory,
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents(): array {
    // Subscribe to entity hook events instead of MediaEvents
    // which requires Drupal 10.3+.
    return [
      'hook_event_dispatcher.entity.presave' => ['onMediaPresave', 100],
    ];
  }

  /**
   * Handle media presave event.
   *
   * @param mixed $event
   *   The entity event (hook_event_dispatcher format).
   */
  public function onMediaPresave($event): void {
    // Extract entity from event (hook_event_dispatcher pattern).
    $entity = method_exists($event, 'getEntity') ? $event->getEntity() : NULL;

    if ($entity instanceof MediaInterface) {
      $this->processMediaEntity($entity);
    }
  }

  /**
   * Process a media entity for alt-text generation.
   *
   * @param \Drupal\media\MediaInterface $media
   *   The media entity.
   */
  protected function processMediaEntity(MediaInterface $media): void {
    // Check if auto-generation is enabled.
    if (!$this->isAutoGenerationEnabled()) {
      return;
    }

    // Check if service is available.
    if (!$this->altTextGenerator->isAvailable()) {
      $this->logger->debug('Alt-text auto-generation skipped: service unavailable');
      return;
    }

    // Check if this media needs alt-text.
    if (!$this->altTextGenerator->needsAltText($media)) {
      return;
    }

    // Get the image field name for this bundle.
    $imageFieldName = $this->altTextGenerator->getImageFieldName($media->bundle());
    if ($imageFieldName === NULL) {
      return;
    }

    try {
      $result = $this->altTextGenerator->generateAltTextForMedia($media);

      if ($result->isSuccess()) {
        // Update the alt-text field.
        $imageField = $media->get($imageFieldName);
        $imageField->alt = $result->altText;

        // Mark as AI-generated if field exists.
        if ($media->hasField('field_ai_generated_alt')) {
          $media->set('field_ai_generated_alt', TRUE);
        }

        $this->logger->info('Auto-generated alt-text for media @id: "@alt"', [
          '@id' => $media->id() ?? 'new',
          '@alt' => substr($result->altText, 0, 50) . (strlen($result->altText) > 50 ? '...' : ''),
        ]);
      }
      else {
        $this->logger->warning('Alt-text auto-generation failed for media @id: @error', [
          '@id' => $media->id() ?? 'new',
          '@error' => $result->error,
        ]);
      }
    }
    catch (\Exception $e) {
      $this->logger->error('Alt-text auto-generation exception for media @id: @error', [
        '@id' => $media->id() ?? 'new',
        '@error' => $e->getMessage(),
      ]);
    }
  }

  /**
   * Check if auto-generation is enabled in configuration.
   *
   * @return bool
   *   TRUE if auto-generation is enabled.
   */
  protected function isAutoGenerationEnabled(): bool {
    $config = $this->configFactory->get('ndx_aws_ai.settings');
    return (bool) $config->get('alt_text_auto_generate') ?? TRUE;
  }

}
