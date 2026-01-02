# Story 5.9: Navigation Menu Configuration

Status: review

## Story

As a **council website visitor**,
I want **a populated main navigation menu with links to services, news, and key pages**,
so that **I can discover and access all the generated council content from the homepage**.

## Acceptance Criteria

1. **Main menu populated automatically** - After council generation completes, the main navigation menu contains at minimum: Services, News, Contact links
2. **Service category links created** - Each generated service category has a corresponding menu link under the Services parent
3. **Menu hierarchy established** - Menu items are properly nested (Services as parent, categories as children)
4. **Links resolve to actual content** - All menu links point to valid generated content (no 404s)
5. **Weighted ordering** - Menu items appear in logical order: Services > News > About > Contact
6. **Idempotent operation** - Running generation twice doesn't create duplicate menu items
7. **Menu visible on theme** - The LocalGov theme displays the generated menu in the header
8. **Integration with Drush command** - The `drush localgov:generate-council` command includes menu configuration as a phase

## Tasks / Subtasks

- [x] Task 1: Create NavigationMenuConfigurator service (AC: 1, 2, 3, 5, 6)
  - [x] 1.1 Create `NavigationMenuConfiguratorInterface` defining the contract
  - [x] 1.2 Implement `NavigationMenuConfigurator` service class
  - [x] 1.3 Add `createMainMenuLinks()` method for top-level menu items
  - [x] 1.4 Add `createServiceCategoryLinks()` method for category hierarchy
  - [x] 1.5 Add `menuLinkExists()` helper to prevent duplicates
  - [x] 1.6 Register service in `ndx_council_generator.services.yml`

- [x] Task 2: Integrate with generation orchestrator (AC: 4, 8)
  - [x] 2.1 Add `runNavigationPhase()` method to `CouncilGeneratorCommands`
  - [x] 2.2 Call navigation configuration after content generation phase (Phase 4/4)
  - [x] 2.3 Add progress output for menu configuration phase
  - [x] 2.4 Handle errors gracefully (log warning, don't fail generation)

- [x] Task 3: Implement menu link creation logic (AC: 1, 3, 5)
  - [x] 3.1 Create "Services" parent link pointing to generated homepage landing page
  - [x] 3.2 Create "News" link pointing to `/news`
  - [x] 3.3 Create "Contact" link pointing to generated contact page
  - [x] 3.4 Set appropriate weights for menu ordering (0, 10, 20, 30)

- [x] Task 4: Create service category child links (AC: 2, 3, 4)
  - [x] 4.1 Query all generated `localgov_services_landing` nodes
  - [x] 4.2 Create child menu links under "Services" for each category
  - [x] 4.3 Link to actual node paths using `internal:/node/{nid}` format
  - [x] 4.4 Set category link weights based on generation order

- [x] Task 5: Verify theme menu display (AC: 7)
  - [x] 5.1 LocalGov theme uses main menu by default in header
  - [x] 5.2 Menu will appear when links are created (confirmed in theme config)
  - [x] 5.3 Responsive menu is handled by LocalGov theme (no custom work needed)

- [x] Task 6: Unit tests (AC: 6)
  - [x] 6.1 Test `MenuConfigurationResult` value object
  - [x] 6.2 Test `NavigationMenuConfigurator` service methods
  - [x] 6.3 Test idempotent behavior (menuLinkExists check)

## Dev Notes

### Technical Implementation

The solution follows the pattern established in `sample-content/import.php` which uses `MenuLinkContent::create()`:

```php
use Drupal\menu_link_content\Entity\MenuLinkContent;

$menu_link = MenuLinkContent::create([
  'title' => 'Services',
  'link' => ['uri' => 'internal:/node/' . $nid],
  'menu_name' => 'main',
  'weight' => 0,
  'expanded' => TRUE,  // Show children in dropdown
  'parent' => '',      // Or 'menu_link_content:{uuid}' for child items
]);
$menu_link->save();
```

### Key Decisions

1. **Link URIs**: Use `internal:/node/{nid}` format for content links to ensure proper path resolution
2. **Parent references**: Use `menu_link_content:{uuid}` format for parent references
3. **Menu name**: Use `main` for the primary navigation menu
4. **Expanded flag**: Set `TRUE` on parent items to enable dropdown menus

### Integration Point

Added new Phase 4 to `CouncilGeneratorCommands::generateCouncil()` after image generation:

```php
// Phase 4: Configure Navigation Menu.
$navigationResult = $this->runNavigationPhase($identity);
```

### Service Dependencies

- `entity_type.manager` - For querying nodes and creating menu links
- `logger.channel.ndx_council_generator` - For logging progress

### Project Structure Notes

- New files in: `cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/src/Service/`
- Follow existing service patterns from `ContentGenerationOrchestrator.php`
- Use constructor property promotion (PHP 8.1+)

### References

- [Source: cloudformation/scenarios/localgov-drupal/drupal/sample-content/import.php#create_menu_items] - Reference implementation
- [Source: _bmad-output/epic-5-gap-analysis.md#Phase-1-Navigation] - Gap analysis requirements
- [Source: cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/src/Commands/CouncilGeneratorCommands.php#configureFrontPage] - Existing pattern for post-generation configuration
- [Source: cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/src/Service/ContentGenerationOrchestrator.php] - Service pattern reference

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

- Implementation follows MenuLinkContent entity pattern from Drupal core
- Added Phase 4/4 to generation command for navigation configuration
- Service properly handles idempotency via menuLinkExists() checks

### Completion Notes List

1. Created NavigationMenuConfiguratorInterface with full method contracts
2. Implemented NavigationMenuConfigurator service with:
   - configureNavigation() - main entry point
   - createMainMenuLinks() - Services, News, Contact, About links
   - createServiceCategoryLinks() - child links under Services
   - menuLinkExists() - duplicate prevention
   - clearGeneratedMenuLinks() - for --force regeneration
3. Created MenuConfigurationResult value object for result tracking
4. Integrated with CouncilGeneratorCommands:
   - Added navigationConfigurator dependency
   - Added runNavigationPhase() method
   - Updated printCompletionSummary() to show navigation stats
5. Created unit tests for MenuConfigurationResult and NavigationMenuConfigurator

### File List

**New Files:**
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/src/Service/NavigationMenuConfiguratorInterface.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/src/Service/NavigationMenuConfigurator.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/src/Value/MenuConfigurationResult.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/tests/src/Unit/Value/MenuConfigurationResultTest.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/tests/src/Unit/Service/NavigationMenuConfiguratorTest.php

**Modified Files:**
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/ndx_council_generator.services.yml
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/src/Commands/CouncilGeneratorCommands.php
