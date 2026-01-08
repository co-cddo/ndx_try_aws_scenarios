# Story 5.10: Homepage Views and Blocks Configuration

Status: done

## Story

As a **council website visitor**,
I want **a homepage that displays service categories, latest news, and quick action links**,
so that **I can quickly find the information I need without navigating through menus**.

## Acceptance Criteria

1. **Service directory view on homepage** - Homepage displays all service categories in a 3-column grid layout with links to each service landing page
2. **Latest news block** - Homepage shows the 3 most recent news articles with titles, images, and dates
3. **Quick actions block** - Homepage includes prominent quick action tiles for common tasks (Report, Pay, Apply, Find)
4. **Hero section** - Homepage has a branded hero banner with council name and "How can we help?" prompt
5. **Block placement automated** - The generator configures block placement in the homepage regions without manual admin intervention
6. **Mobile responsive** - All homepage components work correctly on mobile devices (handled by LocalGov theme)
7. **Empty state handling** - If no news exists, the news block displays gracefully (no errors)
8. **Integration with Drush command** - Block/view configuration runs as part of `drush localgov:generate-council`

## Tasks / Subtasks

- [x] Task 1: Create HomepageConfigurator service (AC: 1, 2, 3, 5)
  - [x] 1.1 Create `HomepageConfiguratorInterface` defining the contract
  - [x] 1.2 Implement `HomepageConfigurator` service class
  - [x] 1.3 Add `configureHomepage()` main entry point
  - [x] 1.4 Add `configureServicesBlock()` for service category grid (uses LocalGov `services` view)
  - [x] 1.5 Add `configureNewsBlock()` for news teaser display (uses `localgov_news_list` view)
  - [x] 1.6 Add `configureQuickActionsBlock()` for action tiles
  - [x] 1.7 Register service in `ndx_council_generator.services.yml`

- [x] Task 2: Implement Service Directory View (AC: 1)
  - [x] 2.1 Uses LocalGov's existing `services` view with `block_1` display
  - [x] 2.2 Block plugin: `views_block:services-block_1`
  - [x] 2.3 Configured with visibility for `<front>` only
  - [x] 2.4 Placed in content region

- [x] Task 3: Implement Latest News Block (AC: 2, 7)
  - [x] 3.1 Uses LocalGov's existing `localgov_news_list` view
  - [x] 3.2 Block plugin: `views_block:localgov_news_list-block_1`
  - [x] 3.3 Configured to show 3 items
  - [x] 3.4 Checks for news content before creating block (empty state handling)
  - [x] 3.5 Placed in content region

- [x] Task 4: Implement Quick Actions Block (AC: 3)
  - [x] 4.1 Uses block_content entity (basic block type)
  - [x] 4.2 Generated HTML with 4 action links: Report, Pay, Apply, Find
  - [x] 4.3 Includes CSS class structure for styling
  - [x] 4.4 Placed in content_top region

- [x] Task 5: Configure Front Page (AC: 4)
  - [x] 5.1 Sets site front page to generated homepage node
  - [x] 5.2 Uses system.site config to set page.front

- [x] Task 6: Integrate with Drush command (AC: 8)
  - [x] 6.1 Added `homepageConfigurator` dependency to `CouncilGeneratorCommands`
  - [x] 6.2 Added Phase 5: `runHomepagePhase()`
  - [x] 6.3 Called after navigation phase
  - [x] 6.4 Added progress output for homepage configuration
  - [x] 6.5 Updated phase labels to Phase 1/5 through 5/5

- [x] Task 7: Wire service in services.yml (AC: 5)
  - [x] 7.1 Added `@ndx_council_generator.homepage_configurator` argument
  - [x] 7.2 Service registered in `ndx_council_generator.services.yml`

- [x] Task 8: Testing (AC: 6, 7)
  - [x] 8.1 Created unit tests for `HomepageConfigurationResult`
  - [x] 8.2 Mobile responsiveness handled by LocalGov theme
  - [x] 8.3 Empty state handled via `hasNewsContent()` check

## Dev Notes

### LocalGov Drupal Views

LocalGov Drupal includes several built-in views that we can leverage:
- `localgov_news` - News article listings with "Latest" and "Archive" displays
- `localgov_services_directories` - Service category listings
- `localgov_services_landing` - Service landing page children

Check if these views exist before creating custom ones:
```php
$view = \Drupal::entityTypeManager()->getStorage('view')->load('localgov_news');
if ($view) {
  // Use existing view, just ensure block display is enabled
}
```

### Block Placement via Config

Blocks are placed programmatically using BlockInterface:
```php
use Drupal\block\Entity\Block;

$block = Block::create([
  'id' => 'localgov_news_latest_homepage',
  'theme' => 'localgov_theme',
  'region' => 'content',
  'plugin' => 'views_block:localgov_news-latest',
  'settings' => [
    'label' => 'Latest News',
    'label_display' => 'visible',
    'items_per_page' => 3,
  ],
  'visibility' => [
    'request_path' => [
      'id' => 'request_path',
      'pages' => '<front>',
      'negate' => FALSE,
    ],
  ],
]);
$block->save();
```

### Quick Actions Block Options

Two approaches:
1. **Custom Block Content** - Create block_content entity with action links in body
2. **Menu Block** - Create a dedicated "Quick Actions" menu and display as block

Recommend approach 1 for simplicity and flexibility.

### Theme Regions

LocalGov theme regions for homepage:
- `hero` - Banner/hero area
- `content_top` - Above main content
- `content` - Main content area
- `sidebar_first` / `sidebar_second` - Sidebars
- `footer` - Footer area

### References

- [Source: _bmad-output/epic-5-gap-analysis.md#Phase-2-Homepage-Views] - Gap analysis requirements
- [Source: cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/src/Service/NavigationMenuConfigurator.php] - Pattern for service implementation
- LocalGov Drupal views: Check `/admin/structure/views` for available displays

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

- Followed NavigationMenuConfigurator pattern for service implementation
- Uses Block entity creation with third party settings for GENERATOR_MARKER identification
- Views block plugins require correct format: `views_block:{view_id}-{display_id}`
- LocalGov theme regions discovered via admin: content_top, content, etc.

### Completion Notes List

1. Created HomepageConfiguratorInterface with contract for homepage configuration
2. Implemented HomepageConfigurator service with:
   - `configureHomepage()` - main entry point orchestrating all configuration
   - `setFrontPage()` - sets system.site front page config
   - `configureServicesBlock()` - creates views block for services view
   - `configureNewsBlock()` - creates views block for news view (with empty state check)
   - `configureQuickActionsBlock()` - creates block_content with quick action HTML
   - `clearGeneratedBlocks()` - removes blocks with GENERATOR_MARKER
3. Created HomepageConfigurationResult value object for result tracking
4. Integrated with CouncilGeneratorCommands:
   - Added homepageConfigurator dependency
   - Added runHomepagePhase() as Phase 5/5
   - Updated printCompletionSummary() to include homepage stats
   - Removed duplicate configureFrontPage() method (now in HomepageConfigurator)
5. Created unit tests for HomepageConfigurationResult
6. Deployed new Docker image to ECS

### File List

**New Files:**
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/src/Service/HomepageConfiguratorInterface.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/src/Service/HomepageConfigurator.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/src/Value/HomepageConfigurationResult.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/tests/src/Unit/Value/HomepageConfigurationResultTest.php

**Modified Files:**
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/ndx_council_generator.services.yml
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_council_generator/src/Commands/CouncilGeneratorCommands.php
