<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Drupal\ndx_council_generator\Value\HomepageConfigurationResult;

/**
 * Interface for homepage configuration service.
 *
 * Story 5.10: Homepage Views and Blocks Configuration
 *
 * Configures the homepage to display service categories, latest news,
 * and quick action links after council content generation.
 */
interface HomepageConfiguratorInterface {

  /**
   * Configures the homepage for the generated council.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   *
   * @return \Drupal\ndx_council_generator\Value\HomepageConfigurationResult
   *   The configuration result.
   */
  public function configureHomepage(CouncilIdentity $identity): HomepageConfigurationResult;

  /**
   * Sets the front page to the council's homepage node.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   *
   * @return bool
   *   TRUE if successful, FALSE otherwise.
   */
  public function setFrontPage(CouncilIdentity $identity): bool;

  /**
   * Configures the services view block for the homepage.
   *
   * @return bool
   *   TRUE if successful, FALSE otherwise.
   */
  public function configureServicesBlock(): bool;

  /**
   * Configures the latest news block for the homepage.
   *
   * @return bool
   *   TRUE if successful, FALSE otherwise.
   */
  public function configureNewsBlock(): bool;

  /**
   * Clears any generator-configured homepage blocks.
   *
   * @return int
   *   The number of blocks cleared.
   */
  public function clearGeneratedBlocks(): int;

}
