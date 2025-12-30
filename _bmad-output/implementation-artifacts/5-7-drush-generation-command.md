# Story 5.7: Drush Generation Command

Status: done

## Story

As a **developer or administrator**,
I want **a Drush command to trigger council generation**,
So that **generation can run during deployment or manually**.

## Acceptance Criteria

1. **Given** the ndx_council_generator module is enabled
   **When** I run `drush localgov:generate-council`
   **Then** the command:
   - Generates council identity
   - Generates all content pages
   - Generates all images
   - Reports progress to stdout
   - Returns exit code 0 on success
   **And** the command supports `--dry-run` to preview
   **And** the command supports `--skip-images` for faster testing
   **And** the command integrates with entrypoint for first-boot

## Tasks / Subtasks

- [x] **Task 1: Drush Command Class** (AC: 1)
  - [x] 1.1 Create `Commands/CouncilGeneratorCommands.php` in ndx_council_generator
  - [x] 1.2 Implement `localgov:generate-council` command with Drush annotations
  - [x] 1.3 Inject CouncilGeneratorService, ImageBatchProcessor, LoggerInterface
  - [x] 1.4 Add command alias `localgov:gen`

- [x] **Task 2: Command Options** (AC: 1)
  - [x] 2.1 Add `--dry-run` option to preview generation without saving
  - [x] 2.2 Add `--skip-images` option to skip image generation phase
  - [x] 2.3 Add `--force` option to regenerate even if council exists
  - [x] 2.4 Add `--region` option to specify council region
  - [x] 2.5 Add `--verbose` option for detailed progress output

- [x] **Task 3: Progress Reporting** (AC: 1)
  - [x] 3.1 Output phase headers (Identity, Content, Images)
  - [x] 3.2 Show progress bars for content and image generation
  - [x] 3.3 Display summary statistics on completion
  - [x] 3.4 Report errors with context (node type, item id)
  - [x] 3.5 Support both TTY and non-TTY output modes

- [x] **Task 4: Generation Orchestration** (AC: 1)
  - [x] 4.1 Call CouncilIdentityGenerator for identity phase
  - [x] 4.2 Call ContentGenerationOrchestrator for content phase
  - [x] 4.3 Call ImageBatchProcessor for image phase (if not skipped)
  - [x] 4.4 Handle partial failures gracefully with retry option
  - [x] 4.5 Return exit code 0 on success, 1 on failure

- [x] **Task 5: Dry Run Mode** (AC: 1)
  - [x] 5.1 Generate and display council identity without saving
  - [x] 5.2 List content types and estimated page counts
  - [x] 5.3 Estimate image count from templates
  - [x] 5.4 Calculate and display cost estimate
  - [x] 5.5 Output "No changes made" confirmation

- [x] **Task 6: Service Registration** (AC: 1)
  - [x] 6.1 Register command class in ndx_council_generator.services.yml
  - [x] 6.2 Add drush.command tag for service discovery
  - [x] 6.3 Wire up all required dependencies

- [x] **Task 7: Integration with Entrypoint** (AC: 1)
  - [x] 7.1 Document entrypoint integration in command help text
  - [x] 7.2 Add `--non-interactive` option for automated runs
  - [x] 7.3 Ensure command exits cleanly for init-container use
  - [x] 7.4 Support environment variable configuration

- [x] **Task 8: Unit Tests** (AC: 1)
  - [x] 8.1 Create `CouncilGeneratorCommandsTest.php` with mocked services
  - [x] 8.2 Test dry-run mode outputs preview
  - [x] 8.3 Test skip-images flag skips image phase
  - [x] 8.4 Test error handling with partial failures
  - [x] 8.5 Test exit codes for success/failure scenarios

## Dev Notes

### Drush Command Structure

```php
namespace Drupal\ndx_council_generator\Commands;

use Drush\Commands\DrushCommands;

/**
 * Drush commands for council generation.
 */
class CouncilGeneratorCommands extends DrushCommands {

  /**
   * Generate a unique fictional council with AI content.
   *
   * @command localgov:generate-council
   * @aliases localgov:gen
   * @option dry-run Preview generation without saving changes
   * @option skip-images Skip image generation phase for faster testing
   * @option force Regenerate even if a council already exists
   * @option region Specify council region (e.g., "South West", "Wales")
   * @option verbose Show detailed progress information
   * @option non-interactive Run without prompts for automated use
   * @usage drush localgov:generate-council
   *   Generate a new council with full content and images.
   * @usage drush localgov:gen --dry-run
   *   Preview what would be generated without saving.
   * @usage drush localgov:gen --skip-images --force
   *   Regenerate content only, skipping images.
   */
  public function generateCouncil($options = [
    'dry-run' => FALSE,
    'skip-images' => FALSE,
    'force' => FALSE,
    'region' => NULL,
    'verbose' => FALSE,
    'non-interactive' => FALSE,
  ]) {
    // Implementation
  }
}
```

### Progress Output Format

```
$ drush localgov:generate-council

================================================================================
  LocalGov Drupal - Council Generation
================================================================================

[Phase 1/3] Generating Council Identity
  ✓ Name: Thornbridge District Council
  ✓ Region: South West
  ✓ Theme: Coastal tourism and maritime heritage
  ✓ Population: 85,000 (Medium)

[Phase 2/3] Generating Content
  Services:     [████████████████████] 20/20 (100%)
  Guides:       [████████████████████]  8/8  (100%)
  Directories:  [████████████████████] 15/15 (100%)
  News:         [████████████████████]  5/5  (100%)

  Total pages generated: 48

[Phase 3/3] Generating Images
  Progress:     [████████████████████] 42/42 (100%)
  Duplicates resolved: 8

  Total images generated: 34

================================================================================
  Generation Complete
================================================================================

  Council:      Thornbridge District Council
  Content:      48 pages
  Images:       34 generated (8 duplicates resolved)
  Duration:     4m 32s
  Est. Cost:    $0.87

  View site: https://drupal.example.com
```

### Dry Run Output

```
$ drush localgov:generate-council --dry-run

================================================================================
  LocalGov Drupal - Council Generation (DRY RUN)
================================================================================

Preview of generation:

  Council Identity:
    Name: Thornbridge District Council (random)
    Region: South West (random)
    Theme: Will be generated based on region
    Population: Random size selection

  Content to Generate:
    - Services: 15-20 pages
    - Guides: 5-8 pages
    - Directories: 10-15 pages
    - News: 5 pages
    - Homepage: 1 page
    Total: ~45-50 pages

  Images to Generate:
    - Hero images: ~25
    - Headshots: ~8
    - Location photos: ~12
    Total: ~45 images (after deduplication: ~35-40)

  Estimated Cost:
    - Content generation: $0.40-0.50
    - Image generation: $0.35-0.45
    Total: $0.75-0.95

  No changes made (dry run mode)

To proceed with generation, run without --dry-run flag.
```

### Service Registration

```yaml
# ndx_council_generator.services.yml

  ndx_council_generator.commands:
    class: Drupal\ndx_council_generator\Commands\CouncilGeneratorCommands
    arguments:
      - '@ndx_council_generator.generator'
      - '@ndx_council_generator.identity_generator'
      - '@ndx_council_generator.content_orchestrator'
      - '@ndx_council_generator.image_batch_processor'
      - '@ndx_council_generator.state_manager'
      - '@logger.channel.ndx_council_generator'
    tags:
      - { name: drush.command }
```

### Exit Codes

- 0: Success - all phases completed
- 1: Failure - one or more phases failed
- 2: Configuration error - module not properly configured

### Entrypoint Integration

The command should work seamlessly in the container entrypoint:

```bash
#!/bin/bash
# Container entrypoint script

# ... database wait logic ...

# Check if council already exists
if drush localgov:gen --dry-run 2>&1 | grep -q "Council already exists"; then
    echo "Council already generated, skipping..."
else
    echo "Generating new council..."
    drush localgov:generate-council --non-interactive --verbose
    exit_code=$?
    if [ $exit_code -ne 0 ]; then
        echo "Council generation failed with exit code $exit_code"
        exit $exit_code
    fi
fi

# Signal WaitCondition success
# ...
```

### Error Handling

```php
try {
  $this->runPhase('identity');
  $this->runPhase('content');
  if (!$options['skip-images']) {
    $this->runPhase('images');
  }

  $this->io()->success('Generation complete');
  return self::EXIT_SUCCESS;

} catch (GenerationException $e) {
  $this->io()->error($e->getMessage());
  $this->logger()->error('Generation failed: @error', [
    '@error' => $e->getMessage(),
  ]);
  return self::EXIT_FAILURE;
}
```

### Project Structure

```
ndx_council_generator/
├── src/
│   └── Commands/
│       └── CouncilGeneratorCommands.php    # NEW
└── tests/
    └── src/Unit/
        └── Commands/
            └── CouncilGeneratorCommandsTest.php  # NEW
```

## Dependencies

- Story 5.1: Module foundation (provides services)
- Story 5.2: Council identity generator
- Story 5.3: Content templates
- Story 5.4: Content orchestrator
- Story 5.5: Image specification collector
- Story 5.6: Batch image processor
- Drush 12.x (via Drupal Drush Launcher)

## Out of Scope

- Admin UI for generation (Drush only for MVP)
- Scheduling/cron generation (manual or entrypoint only)
- Multiple council generation per site
- Incremental content updates (full regeneration only)

## Definition of Done

- [x] `drush localgov:generate-council` command works end-to-end
- [x] `--dry-run` shows preview without making changes
- [x] `--skip-images` completes content-only generation
- [x] `--force` regenerates existing council
- [x] Progress is visible in stdout with clear phase indicators
- [x] Exit codes correctly indicate success (0) or failure (1)
- [x] Command help text explains all options
- [x] Unit tests cover all command options and error scenarios
- [x] Command integrates cleanly with container entrypoint
- [x] Code follows Drupal coding standards
