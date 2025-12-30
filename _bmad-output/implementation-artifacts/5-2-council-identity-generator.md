# Story 5.2: Council Identity Generator

Status: done

## Story

As a **deploying user**,
I want **a unique fictional council identity generated**,
So that **my demo feels distinct and realistic**.

## Acceptance Criteria

1. **Given** council generation is triggered
   **When** identity generation runs
   **Then** the system generates:
   - Council name (e.g., "Thornbridge District Council")
   - Region (one of 9 English regions + Wales/Scotland/NI)
   - Theme/character (e.g., "coastal tourism", "industrial heritage")
   - Population range (small/medium/large)
   - Local flavour keywords for content
   **And** the identity is stored in Drupal configuration
   **And** the DEMO banner displays the generated council name
   **And** identity generation completes in under 10 seconds

## Tasks / Subtasks

- [ ] **Task 1: Council Identity Value Object** (AC: 1)
  - [ ] 1.1 Create `CouncilIdentity.php` value object with all identity fields
  - [ ] 1.2 Add validation for required fields (name, region, theme)
  - [ ] 1.3 Add population ranges constants (small: <30k, medium: 30k-100k, large: >100k)
  - [ ] 1.4 Implement `toArray()` and `fromArray()` for serialization
  - [ ] 1.5 Add region constants for all 12 UK regions

- [ ] **Task 2: Identity Generator Interface** (AC: 1)
  - [ ] 2.1 Create `CouncilIdentityGeneratorInterface.php`
  - [ ] 2.2 Define `generate(array $options = []): CouncilIdentity` method
  - [ ] 2.3 Define options for region preference, theme preference
  - [ ] 2.4 Document expected options structure

- [ ] **Task 3: Identity Generator Service** (AC: 1)
  - [ ] 3.1 Create `CouncilIdentityGenerator.php` implementing interface
  - [ ] 3.2 Inject BedrockService from ndx_aws_ai
  - [ ] 3.3 Inject GenerationStateManager for progress tracking
  - [ ] 3.4 Create prompt template for council identity generation
  - [ ] 3.5 Implement generate() method calling Bedrock Nova 2 Pro
  - [ ] 3.6 Parse structured JSON response from AI

- [ ] **Task 4: Prompt Template System** (AC: 1)
  - [ ] 4.1 Create `prompts/council-identity.txt` template file
  - [ ] 4.2 Include UK council naming conventions
  - [ ] 4.3 Include region-specific themes and characteristics
  - [ ] 4.4 Include local flavour keyword generation
  - [ ] 4.5 Specify JSON output format for reliable parsing

- [ ] **Task 5: Identity Storage** (AC: 1)
  - [ ] 5.1 Create `ndx_council_generator.schema.yml` for config schema
  - [ ] 5.2 Store identity in Drupal config API (`ndx_council_generator.council_identity`)
  - [ ] 5.3 Implement `saveIdentity(CouncilIdentity $identity)` method
  - [ ] 5.4 Implement `loadIdentity(): ?CouncilIdentity` method
  - [ ] 5.5 Add identity to GenerationState via setIdentity()

- [ ] **Task 6: Demo Banner Integration** (AC: 1)
  - [ ] 6.1 Modify ndx_demo_banner module to accept dynamic council name
  - [ ] 6.2 Inject council identity config into banner template
  - [ ] 6.3 Add fallback text if no identity generated
  - [ ] 6.4 Update banner text: "DEMONSTRATION SITE - [Council Name] is a fictional council"
  - [ ] 6.5 Cache banner config for performance

- [ ] **Task 7: Service Registration** (AC: 1)
  - [ ] 7.1 Register IdentityGenerator in services.yml
  - [ ] 7.2 Wire up BedrockService dependency
  - [ ] 7.3 Wire up ConfigFactory dependency
  - [ ] 7.4 Wire up Logger dependency
  - [ ] 7.5 Update CouncilGeneratorService to use IdentityGenerator

- [ ] **Task 8: Performance Optimization** (AC: 1)
  - [ ] 8.1 Ensure single Bedrock API call for identity generation
  - [ ] 8.2 Add timing instrumentation to verify <10s requirement
  - [ ] 8.3 Implement timeout handling (15s max)
  - [ ] 8.4 Log token usage for cost tracking
  - [ ] 8.5 Cache generated identity to avoid regeneration

- [ ] **Task 9: Unit Tests** (AC: 1)
  - [ ] 9.1 Create `CouncilIdentityTest.php` for value object
  - [ ] 9.2 Create `CouncilIdentityGeneratorTest.php` with mocked Bedrock
  - [ ] 9.3 Test all 12 UK regions are valid
  - [ ] 9.4 Test population range calculations
  - [ ] 9.5 Test JSON parsing and error handling

## Dev Notes

### Council Identity Value Object

```php
<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Value;

/**
 * Value object representing a generated council identity.
 *
 * Story 5.2: Council Identity Generator
 */
final class CouncilIdentity {

  /**
   * UK Regions - 9 English regions + Wales, Scotland, Northern Ireland.
   */
  public const REGIONS = [
    'north_east' => 'North East England',
    'north_west' => 'North West England',
    'yorkshire' => 'Yorkshire and the Humber',
    'east_midlands' => 'East Midlands',
    'west_midlands' => 'West Midlands',
    'east' => 'East of England',
    'london' => 'London',
    'south_east' => 'South East England',
    'south_west' => 'South West England',
    'wales' => 'Wales',
    'scotland' => 'Scotland',
    'northern_ireland' => 'Northern Ireland',
  ];

  /**
   * Council themes/characters.
   */
  public const THEMES = [
    'coastal_tourism' => 'Coastal tourism and maritime heritage',
    'industrial_heritage' => 'Industrial heritage and regeneration',
    'market_town' => 'Historic market town',
    'rural_agricultural' => 'Rural agricultural community',
    'university_city' => 'University city and innovation hub',
    'commuter_belt' => 'Commuter belt and green spaces',
    'mining_legacy' => 'Former mining community',
    'cathedral_city' => 'Cathedral city with medieval heritage',
  ];

  /**
   * Population ranges.
   */
  public const POPULATION_SMALL = 'small';    // < 30,000
  public const POPULATION_MEDIUM = 'medium';  // 30,000 - 100,000
  public const POPULATION_LARGE = 'large';    // > 100,000

  public function __construct(
    public readonly string $name,
    public readonly string $regionKey,
    public readonly string $themeKey,
    public readonly string $populationRange,
    public readonly int $populationEstimate,
    public readonly array $flavourKeywords,
    public readonly string $motto,
    public readonly int $generatedAt,
  ) {}

  /**
   * Get region display name.
   */
  public function getRegionName(): string {
    return self::REGIONS[$this->regionKey] ?? $this->regionKey;
  }

  /**
   * Get theme display name.
   */
  public function getThemeName(): string {
    return self::THEMES[$this->themeKey] ?? $this->themeKey;
  }

  /**
   * Get population range for display.
   */
  public function getPopulationDisplay(): string {
    return match ($this->populationRange) {
      self::POPULATION_SMALL => 'Small (<30,000)',
      self::POPULATION_MEDIUM => 'Medium (30,000-100,000)',
      self::POPULATION_LARGE => 'Large (>100,000)',
      default => $this->populationRange,
    };
  }

  /**
   * Convert to array for storage.
   */
  public function toArray(): array {
    return [
      'name' => $this->name,
      'regionKey' => $this->regionKey,
      'themeKey' => $this->themeKey,
      'populationRange' => $this->populationRange,
      'populationEstimate' => $this->populationEstimate,
      'flavourKeywords' => $this->flavourKeywords,
      'motto' => $this->motto,
      'generatedAt' => $this->generatedAt,
    ];
  }

  /**
   * Create from array.
   */
  public static function fromArray(array $data): self {
    return new self(
      name: $data['name'] ?? '',
      regionKey: $data['regionKey'] ?? 'east_midlands',
      themeKey: $data['themeKey'] ?? 'market_town',
      populationRange: $data['populationRange'] ?? self::POPULATION_MEDIUM,
      populationEstimate: (int) ($data['populationEstimate'] ?? 50000),
      flavourKeywords: $data['flavourKeywords'] ?? [],
      motto: $data['motto'] ?? '',
      generatedAt: (int) ($data['generatedAt'] ?? time()),
    );
  }
}
```

### Prompt Template (council-identity.txt)

```
You are generating a unique fictional UK council identity for a demonstration website.
Generate a realistic but entirely fictional council that could exist in the UK.

Requirements:
1. Council name should follow UK naming conventions:
   - "[Place] District Council"
   - "[Place] Borough Council"
   - "[Place] County Council"
   - "[Place] City Council"

2. The place name should be:
   - Plausible sounding for the UK
   - NOT a real UK place name
   - 1-2 words maximum

3. Region must be one of: {{REGION_OPTIONS}}

4. Theme must be one of: {{THEME_OPTIONS}}

5. Population must be realistic for the council type:
   - small: 15,000 - 30,000
   - medium: 30,000 - 100,000
   - large: 100,000 - 300,000

6. Generate 5-8 local flavour keywords that match the theme and region.

7. Generate a traditional council motto (brief, in English).

{{#if region_preference}}
Preferred region: {{region_preference}}
{{/if}}

{{#if theme_preference}}
Preferred theme: {{theme_preference}}
{{/if}}

Respond ONLY with valid JSON in this exact format:
{
  "name": "Thornbridge District Council",
  "regionKey": "yorkshire",
  "themeKey": "market_town",
  "populationRange": "medium",
  "populationEstimate": 45000,
  "flavourKeywords": ["wool trade", "market square", "river crossing", "stone bridges", "ancient charter"],
  "motto": "Service with Pride"
}
```

### Identity Generator Service

```php
<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Generator;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\ndx_aws_ai\Service\BedrockServiceInterface;
use Drupal\ndx_council_generator\Service\GenerationStateManagerInterface;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Psr\Log\LoggerInterface;

/**
 * Generates unique council identities using AWS Bedrock.
 *
 * Story 5.2: Council Identity Generator
 */
class CouncilIdentityGenerator implements CouncilIdentityGeneratorInterface {

  /**
   * Config key for stored identity.
   */
  public const CONFIG_KEY = 'ndx_council_generator.council_identity';

  /**
   * Maximum generation time in seconds.
   */
  public const MAX_GENERATION_TIME = 15;

  public function __construct(
    protected BedrockServiceInterface $bedrock,
    protected GenerationStateManagerInterface $stateManager,
    protected ConfigFactoryInterface $configFactory,
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function generate(array $options = []): CouncilIdentity {
    $startTime = microtime(true);

    $this->logger->info('Starting council identity generation', [
      'options' => $options,
    ]);

    // Build prompt from template
    $prompt = $this->buildPrompt($options);

    // Call Bedrock
    try {
      $response = $this->bedrock->generateContent($prompt, 'nova-2-pro');
      $identity = $this->parseResponse($response);

      // Store in config
      $this->saveIdentity($identity);

      // Update generation state
      $this->stateManager->setIdentity($identity->toArray());

      $duration = microtime(true) - $startTime;
      $this->logger->info('Council identity generated', [
        'name' => $identity->name,
        'region' => $identity->regionKey,
        'theme' => $identity->themeKey,
        'duration_seconds' => round($duration, 2),
      ]);

      return $identity;

    } catch (\Exception $e) {
      $this->logger->error('Council identity generation failed', [
        'error' => $e->getMessage(),
      ]);
      throw $e;
    }
  }

  /**
   * Build prompt from template.
   */
  protected function buildPrompt(array $options): string {
    $template = $this->loadPromptTemplate();

    // Replace region options
    $regionOptions = implode(', ', array_keys(CouncilIdentity::REGIONS));
    $template = str_replace('{{REGION_OPTIONS}}', $regionOptions, $template);

    // Replace theme options
    $themeOptions = implode(', ', array_keys(CouncilIdentity::THEMES));
    $template = str_replace('{{THEME_OPTIONS}}', $themeOptions, $template);

    // Handle conditional sections
    if (!empty($options['region'])) {
      $template = preg_replace(
        '/\{\{#if region_preference\}\}(.*?)\{\{\/if\}\}/s',
        '$1',
        $template
      );
      $template = str_replace('{{region_preference}}', $options['region'], $template);
    } else {
      $template = preg_replace('/\{\{#if region_preference\}\}.*?\{\{\/if\}\}/s', '', $template);
    }

    if (!empty($options['theme'])) {
      $template = preg_replace(
        '/\{\{#if theme_preference\}\}(.*?)\{\{\/if\}\}/s',
        '$1',
        $template
      );
      $template = str_replace('{{theme_preference}}', $options['theme'], $template);
    } else {
      $template = preg_replace('/\{\{#if theme_preference\}\}.*?\{\{\/if\}\}/s', '', $template);
    }

    return $template;
  }

  /**
   * Load prompt template from file.
   */
  protected function loadPromptTemplate(): string {
    $modulePath = \Drupal::service('extension.list.module')->getPath('ndx_council_generator');
    $templatePath = $modulePath . '/prompts/council-identity.txt';

    if (!file_exists($templatePath)) {
      throw new \RuntimeException('Council identity prompt template not found');
    }

    return file_get_contents($templatePath);
  }

  /**
   * Parse AI response into CouncilIdentity.
   */
  protected function parseResponse(string $response): CouncilIdentity {
    // Extract JSON from response (may have markdown formatting)
    $jsonMatch = [];
    if (preg_match('/\{.*\}/s', $response, $jsonMatch)) {
      $json = $jsonMatch[0];
    } else {
      throw new \RuntimeException('No JSON found in AI response');
    }

    $data = json_decode($json, TRUE);
    if (json_last_error() !== JSON_ERROR_NONE) {
      throw new \RuntimeException('Invalid JSON in AI response: ' . json_last_error_msg());
    }

    // Validate required fields
    $required = ['name', 'regionKey', 'themeKey', 'populationRange'];
    foreach ($required as $field) {
      if (empty($data[$field])) {
        throw new \RuntimeException("Missing required field: $field");
      }
    }

    // Validate region
    if (!isset(CouncilIdentity::REGIONS[$data['regionKey']])) {
      $this->logger->warning('Invalid region returned, using default', [
        'returned' => $data['regionKey'],
      ]);
      $data['regionKey'] = 'east_midlands';
    }

    // Add generation timestamp
    $data['generatedAt'] = time();

    return CouncilIdentity::fromArray($data);
  }

  /**
   * Save identity to Drupal config.
   */
  public function saveIdentity(CouncilIdentity $identity): void {
    $config = $this->configFactory->getEditable(self::CONFIG_KEY);
    $config->setData($identity->toArray());
    $config->save();

    $this->logger->info('Council identity saved to config', [
      'name' => $identity->name,
    ]);
  }

  /**
   * Load identity from Drupal config.
   */
  public function loadIdentity(): ?CouncilIdentity {
    $config = $this->configFactory->get(self::CONFIG_KEY);
    $data = $config->getRawData();

    if (empty($data) || empty($data['name'])) {
      return NULL;
    }

    return CouncilIdentity::fromArray($data);
  }
}
```

### Services Registration Update

```yaml
# ndx_council_generator.services.yml additions
services:
  ndx_council_generator.identity_generator:
    class: Drupal\ndx_council_generator\Generator\CouncilIdentityGenerator
    arguments:
      - '@ndx_aws_ai.bedrock'
      - '@ndx_council_generator.state_manager'
      - '@config.factory'
      - '@logger.channel.ndx_council_generator'
```

### Demo Banner Integration

Update `ndx_demo_banner.module` to read council name:

```php
/**
 * Implements hook_preprocess_page().
 */
function ndx_demo_banner_preprocess_page(&$variables) {
  $config = \Drupal::config('ndx_council_generator.council_identity');
  $councilName = $config->get('name') ?? 'Demo Council';

  $variables['demo_banner'] = [
    'council_name' => $councilName,
    'message' => t('DEMONSTRATION SITE - @name is a fictional council', [
      '@name' => $councilName,
    ]),
  ];
}
```

### Directory Structure Additions

```
ndx_council_generator/
├── prompts/
│   └── council-identity.txt
├── config/
│   └── schema/
│       └── ndx_council_generator.schema.yml
├── src/
│   ├── Generator/
│   │   ├── CouncilIdentityGeneratorInterface.php
│   │   └── CouncilIdentityGenerator.php
│   └── Value/
│       └── CouncilIdentity.php
└── tests/
    └── src/
        └── Unit/
            ├── CouncilIdentityTest.php
            └── CouncilIdentityGeneratorTest.php
```

### Config Schema

```yaml
# ndx_council_generator.schema.yml
ndx_council_generator.council_identity:
  type: config_object
  label: 'Council Identity'
  mapping:
    name:
      type: string
      label: 'Council name'
    regionKey:
      type: string
      label: 'Region key'
    themeKey:
      type: string
      label: 'Theme key'
    populationRange:
      type: string
      label: 'Population range'
    populationEstimate:
      type: integer
      label: 'Population estimate'
    flavourKeywords:
      type: sequence
      label: 'Flavour keywords'
      sequence:
        type: string
    motto:
      type: string
      label: 'Council motto'
    generatedAt:
      type: integer
      label: 'Generation timestamp'
```

## Dependencies

- ndx_aws_ai module (Story 3-1, 3-2) for BedrockService
- ndx_demo_banner module (Story 1-10) for banner integration
- ndx_council_generator module foundation (Story 5-1)

## Out of Scope

- Content generation using the identity (Story 5-3, 5-4)
- Image generation (Story 5-5, 5-6)
- Admin UI for manual identity editing
- Multiple council identities per deployment

## Definition of Done

- [ ] CouncilIdentity value object created with all 12 UK regions
- [ ] Identity generator calls Bedrock Nova 2 Pro
- [ ] Prompt template produces valid JSON responses
- [ ] Identity stored in Drupal config
- [ ] Demo banner displays generated council name
- [ ] Identity generation completes in under 10 seconds
- [ ] Unit tests pass for value object and generator
- [ ] Token usage logged for cost tracking
- [ ] Code follows Drupal coding standards

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

N/A - Unit tests created for all functionality

### Completion Notes List

1. Created CouncilIdentity value object with all 12 UK regions and 8 themes
2. Created CouncilIdentityGeneratorInterface with complete method signatures
3. Implemented CouncilIdentityGenerator using Bedrock Nova 2 Pro
4. Created prompt template with Handlebars-like conditional sections
5. Added config schema for identity storage
6. Updated demo banner module to read from config with cache tags
7. Added comprehensive unit tests for value object and generator
8. Added token usage logging for cost tracking
9. Code review fixes: Added logTokenUsage method, updated clearIdentity to sync with stateManager

### File List

**Created:**
- src/Value/CouncilIdentity.php
- src/Generator/CouncilIdentityGeneratorInterface.php
- src/Generator/CouncilIdentityGenerator.php
- prompts/council-identity.txt
- config/schema/ndx_council_generator.schema.yml
- tests/src/Unit/CouncilIdentityTest.php
- tests/src/Unit/CouncilIdentityGeneratorTest.php

**Modified:**
- ndx_council_generator.services.yml (added identity_generator service)
- ../ndx_demo_banner/ndx_demo_banner.module (added council name lookup with cache tags)
