<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\ndx_council_generator\Value\ContentGenerationResult;
use Drupal\ndx_council_generator\Value\ContentSpecification;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Drupal\ndx_council_generator\Value\GenerationProgress;
use Drupal\ndx_council_generator\Value\GenerationSummary;

/**
 * Interface for content generation orchestrator service.
 *
 * Story 5.4: Content Generation Orchestrator
 */
interface ContentGenerationOrchestratorInterface {

  /**
   * Generate all content based on templates and council identity.
   *
   * Processes all content specifications in order, creating Drupal nodes
   * for each one. Progress is tracked and individual failures don't stop
   * the overall generation.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity to use for content generation.
   * @param callable|null $progressCallback
   *   Optional callback invoked after each item with GenerationProgress.
   *
   * @return \Drupal\ndx_council_generator\Value\GenerationSummary
   *   Summary of the generation run.
   */
  public function generateAll(CouncilIdentity $identity, ?callable $progressCallback = NULL): GenerationSummary;

  /**
   * Generate a single content item.
   *
   * @param \Drupal\ndx_council_generator\Value\ContentSpecification $spec
   *   The content specification to generate.
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity for variable injection.
   *
   * @return \Drupal\ndx_council_generator\Value\ContentGenerationResult
   *   The result of generating this content item.
   */
  public function generateSingle(ContentSpecification $spec, CouncilIdentity $identity): ContentGenerationResult;

  /**
   * Retry failed content generation items.
   *
   * Re-processes only the items that failed in a previous run.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity to use.
   * @param callable|null $progressCallback
   *   Optional callback invoked after each item.
   *
   * @return \Drupal\ndx_council_generator\Value\GenerationSummary
   *   Summary of the retry run.
   */
  public function retryFailed(CouncilIdentity $identity, ?callable $progressCallback = NULL): GenerationSummary;

  /**
   * Get the current generation progress.
   *
   * @return \Drupal\ndx_council_generator\Value\GenerationProgress|null
   *   Current progress or NULL if not generating.
   */
  public function getProgress(): ?GenerationProgress;

  /**
   * Check if generation is currently in progress.
   *
   * @return bool
   *   TRUE if actively generating content.
   */
  public function isGenerating(): bool;

  /**
   * Get the list of failed spec IDs from the last run.
   *
   * @return array<string>
   *   List of spec IDs that failed.
   */
  public function getFailedSpecIds(): array;

}
