<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\ndx_council_generator\Value\CouncilIdentity;

/**
 * Interface for navigation menu configuration service.
 *
 * Story 5.9: Navigation Menu Configuration
 *
 * Provides functionality to create and configure the main navigation menu
 * after council content generation is complete. This ensures that generated
 * content is discoverable from the homepage via the main navigation.
 */
interface NavigationMenuConfiguratorInterface {

  /**
   * Configure the main navigation menu with council content.
   *
   * Creates top-level menu items (Services, News, Contact) and populates
   * the Services hierarchy with links to generated service landing pages.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity for context.
   *
   * @return \Drupal\ndx_council_generator\Value\MenuConfigurationResult
   *   Result containing counts of created/skipped links.
   */
  public function configureNavigation(CouncilIdentity $identity): MenuConfigurationResult;

  /**
   * Create top-level main menu links.
   *
   * Creates the primary navigation items: Services, News, Contact, About.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   *
   * @return int
   *   Number of menu links created.
   */
  public function createMainMenuLinks(CouncilIdentity $identity): int;

  /**
   * Create service category child links under Services.
   *
   * Queries all generated localgov_services_landing nodes and creates
   * child menu links under the Services parent item.
   *
   * @param string $servicesParentUuid
   *   The UUID of the Services parent menu link.
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   *
   * @return int
   *   Number of child menu links created.
   */
  public function createServiceCategoryLinks(string $servicesParentUuid, CouncilIdentity $identity): int;

  /**
   * Check if a menu link already exists.
   *
   * Prevents duplicate menu items from being created.
   *
   * @param string $title
   *   The menu link title.
   * @param string $menuName
   *   The menu machine name (e.g., 'main').
   * @param string|null $parentId
   *   Optional parent menu link ID.
   *
   * @return bool
   *   TRUE if the menu link exists, FALSE otherwise.
   */
  public function menuLinkExists(string $title, string $menuName, ?string $parentId = NULL): bool;

  /**
   * Clear all menu links created by the generator.
   *
   * Useful for re-generation scenarios with --force flag.
   *
   * @return int
   *   Number of menu links deleted.
   */
  public function clearGeneratedMenuLinks(): int;

}
