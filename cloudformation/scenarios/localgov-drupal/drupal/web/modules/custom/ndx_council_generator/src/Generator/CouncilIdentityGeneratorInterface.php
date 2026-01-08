<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Generator;

use Drupal\ndx_council_generator\Value\CouncilIdentity;

/**
 * Interface for council identity generation.
 *
 * Story 5.2: Council Identity Generator
 */
interface CouncilIdentityGeneratorInterface {

  /**
   * Generate a unique council identity.
   *
   * @param array $options
   *   Optional generation options:
   *   - 'region': Preferred region key (e.g., 'yorkshire', 'wales').
   *   - 'theme': Preferred theme key (e.g., 'coastal_tourism', 'market_town').
   *   - 'population': Preferred population range ('small', 'medium', 'large').
   *
   * @return \Drupal\ndx_council_generator\Value\CouncilIdentity
   *   Generated council identity.
   *
   * @throws \RuntimeException
   *   If generation fails.
   */
  public function generate(array $options = []): CouncilIdentity;

  /**
   * Save identity to Drupal configuration.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The identity to save.
   */
  public function saveIdentity(CouncilIdentity $identity): void;

  /**
   * Load identity from Drupal configuration.
   *
   * @return \Drupal\ndx_council_generator\Value\CouncilIdentity|null
   *   The stored identity, or NULL if none exists.
   */
  public function loadIdentity(): ?CouncilIdentity;

  /**
   * Check if an identity has been generated.
   *
   * @return bool
   *   TRUE if an identity exists in configuration.
   */
  public function hasIdentity(): bool;

  /**
   * Clear the stored identity.
   */
  public function clearIdentity(): void;

}
