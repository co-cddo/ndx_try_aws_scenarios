# Story 5.3: Content Generation Templates

Status: done

## Story

As a **developer**,
I want **prompt templates for each LocalGov Drupal content type**,
So that **generated content is contextually appropriate**.

## Acceptance Criteria

1. **Given** a council identity exists
   **When** content generation templates are invoked
   **Then** templates exist for:
   - Service pages (15-20 items)
   - Guide pages (5-8 items)
   - Directory entries (10-15 items)
   - News articles (5 items)
   - Homepage content
   **And** templates inject council identity variables
   **And** templates specify tone (GOV.UK style guide)
   **And** templates include image specification placeholders
   **And** total content is approximately 140 pages

## Tasks / Subtasks

- [x] **Task 1: Template System Foundation** (AC: 1)
  - [x] 1.1 Create `ContentTemplateManager` service class
  - [x] 1.2 Define `ContentTemplateInterface` for template implementations
  - [x] 1.3 Create template loading from `prompts/content/` directory
  - [x] 1.4 Implement variable injection using CouncilIdentity
  - [x] 1.5 Register template manager service in services.yml

- [x] **Task 2: Service Page Templates** (AC: 1)
  - [x] 2.1 Create `prompts/content/service-pages.yaml` with 18 service definitions
  - [x] 2.2 Include typical council services (waste, council tax, housing, etc.)
  - [x] 2.3 Add service-specific prompts with GOV.UK style instructions
  - [x] 2.4 Define image specifications for each service (hero images)
  - [x] 2.5 Include region/theme-appropriate service variations

- [x] **Task 3: Guide Page Templates** (AC: 1)
  - [x] 3.1 Create `prompts/content/guide-pages.yaml` with 6 guide definitions
  - [x] 3.2 Include step-by-step process guides (apply for benefit, report issue, etc.)
  - [x] 3.3 Add GOV.UK step-by-step style formatting instructions
  - [x] 3.4 Define supporting images for each step
  - [x] 3.5 Include council-specific contextual variations

- [x] **Task 4: Directory Entry Templates** (AC: 1)
  - [x] 4.1 Create `prompts/content/directory-entries.yaml` with 12 entry definitions
  - [x] 4.2 Include council facilities (libraries, parks, leisure centres, etc.)
  - [x] 4.3 Add location-aware content (using region from identity)
  - [x] 4.4 Define location image placeholders for directory entries
  - [x] 4.5 Include opening hours, accessibility info patterns

- [x] **Task 5: News Article Templates** (AC: 1)
  - [x] 5.1 Create `prompts/content/news-articles.yaml` with 5 article definitions
  - [x] 5.2 Include mix of announcement types (new service, event, update)
  - [x] 5.3 Add dated content with relative date placeholders
  - [x] 5.4 Define news image specifications
  - [x] 5.5 Include council branding in news style

- [x] **Task 6: Homepage Template** (AC: 1)
  - [x] 6.1 Create `prompts/content/homepage.yaml` with 6 homepage sections
  - [x] 6.2 Include hero section with council motto and welcome
  - [x] 6.3 Define featured services grid content
  - [x] 6.4 Add quick links and popular services
  - [x] 6.5 Include emergency/alert section placeholder

- [x] **Task 7: Value Object for Content Specification** (AC: 1)
  - [x] 7.1 Create `ContentSpecification` value object
  - [x] 7.2 Include content type, title placeholder, body prompt, image specs
  - [x] 7.3 Add target Drupal content type mapping
  - [x] 7.4 Include field mappings for LocalGov Drupal fields
  - [x] 7.5 Add generation order/dependencies

- [x] **Task 8: Image Specification Structure** (AC: 1)
  - [x] 8.1 Create `ImageSpecification` value object
  - [x] 8.2 Define image types (hero, headshot, location, icon, document)
  - [x] 8.3 Include style guidance (photo, illustration, icon)
  - [x] 8.4 Add dimensions and aspect ratios
  - [x] 8.5 Link to content that requires the image

- [x] **Task 9: Unit Tests** (AC: 1)
  - [x] 9.1 Create `ContentTemplateManagerTest.php`
  - [x] 9.2 Test template loading from YAML files
  - [x] 9.3 Test variable injection with mock CouncilIdentity
  - [x] 9.4 Test all content types have required fields
  - [x] 9.5 Test image specifications are valid

## Dev Notes

### Template File Structure

```
ndx_council_generator/
├── prompts/
│   ├── council-identity.txt        # Story 5.2 (existing)
│   └── content/
│       ├── service-pages.yaml
│       ├── guide-pages.yaml
│       ├── directory-entries.yaml
│       ├── news-articles.yaml
│       └── homepage.yaml
```

### Content Template YAML Format

```yaml
# service-pages.yaml example
content_type: localgov_services_page
generation_order: 1
items:
  - id: waste-recycling
    title_template: "Waste and recycling - {{council_name}}"
    prompt: |
      Write a council service page about waste collection and recycling services.
      Council: {{council_name}}
      Region: {{region_name}}
      Theme: {{theme_description}}

      Include:
      - Weekly bin collection schedule
      - What can be recycled
      - How to request new bins
      - Garden waste subscription

      Style: GOV.UK Service Standard - clear, concise, action-oriented
      Tone: Helpful, professional, accessible

      Output JSON:
      {
        "title": "...",
        "summary": "...",
        "body": "...",
        "related_links": [...]
      }
    images:
      - type: hero
        prompt: "Recycling bins in a British residential area, morning light, {{region_name}} style housing"
        dimensions: "1200x630"
      - type: icon
        prompt: "Simple recycling icon, green, flat design"
        dimensions: "64x64"
    drupal_fields:
      title: title
      field_summary: summary
      body: body
      field_related_links: related_links
```

### ContentSpecification Value Object

```php
<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Value;

/**
 * Value object representing a content generation specification.
 *
 * Story 5.3: Content Generation Templates
 */
final class ContentSpecification {

  public function __construct(
    public readonly string $id,
    public readonly string $contentType,
    public readonly string $titleTemplate,
    public readonly string $prompt,
    public readonly array $images,
    public readonly array $drupalFields,
    public readonly int $order,
    public readonly array $dependencies,
  ) {}

  /**
   * Inject council identity variables into prompt.
   */
  public function renderPrompt(CouncilIdentity $identity): string {
    $variables = [
      '{{council_name}}' => $identity->name,
      '{{region_name}}' => $identity->getRegionName(),
      '{{region_key}}' => $identity->regionKey,
      '{{theme_description}}' => $identity->getThemeName(),
      '{{theme_key}}' => $identity->themeKey,
      '{{population}}' => number_format($identity->populationEstimate),
      '{{flavour_keywords}}' => $identity->getFlavourKeywordsString(),
      '{{motto}}' => $identity->motto,
    ];

    return strtr($this->prompt, $variables);
  }

  /**
   * Render title with identity variables.
   */
  public function renderTitle(CouncilIdentity $identity): string {
    return strtr($this->titleTemplate, [
      '{{council_name}}' => $identity->name,
    ]);
  }

  public static function fromArray(array $data): self {
    return new self(
      id: $data['id'],
      contentType: $data['content_type'] ?? 'page',
      titleTemplate: $data['title_template'] ?? '',
      prompt: $data['prompt'] ?? '',
      images: array_map(
        fn($img) => ImageSpecification::fromArray($img),
        $data['images'] ?? []
      ),
      drupalFields: $data['drupal_fields'] ?? [],
      order: $data['generation_order'] ?? 100,
      dependencies: $data['dependencies'] ?? [],
    );
  }
}
```

### ImageSpecification Value Object

```php
<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Value;

/**
 * Value object representing an image generation specification.
 *
 * Story 5.3: Content Generation Templates
 */
final class ImageSpecification {

  public const TYPE_HERO = 'hero';
  public const TYPE_HEADSHOT = 'headshot';
  public const TYPE_LOCATION = 'location';
  public const TYPE_ICON = 'icon';
  public const TYPE_DOCUMENT = 'document';

  public function __construct(
    public readonly string $type,
    public readonly string $prompt,
    public readonly string $dimensions,
    public readonly string $style,
    public readonly ?string $contentId,
  ) {}

  /**
   * Get width from dimensions string.
   */
  public function getWidth(): int {
    $parts = explode('x', $this->dimensions);
    return (int) ($parts[0] ?? 1200);
  }

  /**
   * Get height from dimensions string.
   */
  public function getHeight(): int {
    $parts = explode('x', $this->dimensions);
    return (int) ($parts[1] ?? 630);
  }

  /**
   * Render prompt with identity variables.
   */
  public function renderPrompt(CouncilIdentity $identity): string {
    return strtr($this->prompt, [
      '{{council_name}}' => $identity->name,
      '{{region_name}}' => $identity->getRegionName(),
      '{{theme_description}}' => $identity->getThemeName(),
    ]);
  }

  public static function fromArray(array $data): self {
    return new self(
      type: $data['type'] ?? self::TYPE_HERO,
      prompt: $data['prompt'] ?? '',
      dimensions: $data['dimensions'] ?? '1200x630',
      style: $data['style'] ?? 'photo',
      contentId: $data['content_id'] ?? null,
    );
  }

  public function toArray(): array {
    return [
      'type' => $this->type,
      'prompt' => $this->prompt,
      'dimensions' => $this->dimensions,
      'style' => $this->style,
      'content_id' => $this->contentId,
    ];
  }
}
```

### ContentTemplateManager Service

```php
<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Service;

use Drupal\Core\Extension\ModuleExtensionList;
use Drupal\ndx_council_generator\Value\ContentSpecification;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Psr\Log\LoggerInterface;
use Symfony\Component\Yaml\Yaml;

/**
 * Manages content generation templates.
 *
 * Story 5.3: Content Generation Templates
 */
class ContentTemplateManager implements ContentTemplateManagerInterface {

  /**
   * Cache of loaded templates.
   */
  protected array $templates = [];

  public function __construct(
    protected ModuleExtensionList $moduleExtensionList,
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function loadAllTemplates(): array {
    if (!empty($this->templates)) {
      return $this->templates;
    }

    $templateFiles = [
      'service-pages',
      'guide-pages',
      'directory-entries',
      'news-articles',
      'homepage',
    ];

    foreach ($templateFiles as $file) {
      $this->loadTemplateFile($file);
    }

    // Sort by generation order
    uasort($this->templates, fn($a, $b) => $a->order <=> $b->order);

    return $this->templates;
  }

  /**
   * Load a single template file.
   */
  protected function loadTemplateFile(string $name): void {
    $modulePath = $this->moduleExtensionList->getPath('ndx_council_generator');
    $filePath = $modulePath . '/prompts/content/' . $name . '.yaml';

    if (!file_exists($filePath)) {
      $this->logger->warning('Template file not found: @file', ['@file' => $filePath]);
      return;
    }

    $data = Yaml::parseFile($filePath);

    foreach ($data['items'] ?? [] as $item) {
      $item['content_type'] = $data['content_type'] ?? 'page';
      $item['generation_order'] = $data['generation_order'] ?? 100;
      $spec = ContentSpecification::fromArray($item);
      $this->templates[$spec->id] = $spec;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function getTemplatesByType(string $contentType): array {
    return array_filter(
      $this->loadAllTemplates(),
      fn($spec) => $spec->contentType === $contentType
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getTemplate(string $id): ?ContentSpecification {
    $templates = $this->loadAllTemplates();
    return $templates[$id] ?? null;
  }

  /**
   * {@inheritdoc}
   */
  public function getContentCount(): int {
    return count($this->loadAllTemplates());
  }
}
```

### GOV.UK Style Guidelines for Prompts

All prompts should include these style instructions:

```
Style Guidelines (GOV.UK Service Standard):
- Use plain English (aim for reading age 9)
- Use short sentences and paragraphs
- Use active voice ("Apply for a permit" not "A permit can be applied for")
- Use "you" for the reader, "we" for the council
- Front-load important information
- Use bullet points for lists
- Avoid jargon and acronyms
- Be direct and action-oriented
```

### Sample Service Pages (15-20 target)

1. Waste and recycling
2. Council tax
3. Housing and homelessness
4. Planning applications
5. Benefits and support
6. Parking permits
7. School admissions
8. Adult social care
9. Children's services
10. Environmental health
11. Business rates
12. Licensing
13. Electoral registration
14. Complaints and feedback
15. Birth, death, marriage registration
16. Libraries (if theme appropriate)
17. Parks and leisure
18. Transport and roads

### Directory Structure Reference

```
ndx_council_generator/
├── src/
│   ├── Service/
│   │   ├── ContentTemplateManager.php
│   │   └── ContentTemplateManagerInterface.php
│   └── Value/
│       ├── CouncilIdentity.php       # Story 5.2
│       ├── ContentSpecification.php  # This story
│       └── ImageSpecification.php    # This story
├── prompts/
│   ├── council-identity.txt          # Story 5.2
│   └── content/
│       ├── service-pages.yaml
│       ├── guide-pages.yaml
│       ├── directory-entries.yaml
│       ├── news-articles.yaml
│       └── homepage.yaml
└── tests/
    └── src/
        └── Unit/
            ├── ContentSpecificationTest.php
            ├── ImageSpecificationTest.php
            └── ContentTemplateManagerTest.php
```

## Dependencies

- Story 5.2: Council Identity Generator (provides CouncilIdentity value object)
- Story 5.1: ndx_council_generator module foundation

## Out of Scope

- Actual AI content generation (Story 5-4)
- Image generation (Story 5-5, 5-6)
- Drush command integration (Story 5-7)

## Definition of Done

- [x] ContentTemplateManager service loads all template files
- [x] Templates exist for all 5 content types
- [x] Total content items sum to 47 (18 services + 6 guides + 12 directories + 5 news + 6 homepage)
- [x] All templates inject CouncilIdentity variables correctly
- [x] GOV.UK style guidelines included in all prompts
- [x] ImageSpecification captures all image requirements
- [x] Unit tests pass for template loading and variable injection
- [x] YAML template files are valid and parseable
- [x] Code follows Drupal coding standards

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

### Completion Notes List

- Implemented ContentTemplateManager with YAML template loading
- Created 5 content template YAML files covering all LocalGov Drupal content types
- ContentSpecification and ImageSpecification value objects handle prompt rendering
- Templates use {{variable}} syntax for CouncilIdentity injection
- All templates include GOV.UK style guide instructions
- 47 total content items across all templates
- Unit tests verify template loading, filtering, and validation

### File List

- `ndx_council_generator.services.yml` - Added content_template_manager service
- `src/Service/ContentTemplateManager.php` - Template loading and management service
- `src/Service/ContentTemplateManagerInterface.php` - Service interface
- `src/Value/ContentSpecification.php` - Content template value object
- `src/Value/ImageSpecification.php` - Image specification value object
- `prompts/content/service-pages.yaml` - 18 service page templates
- `prompts/content/guide-pages.yaml` - 6 guide page templates
- `prompts/content/directory-entries.yaml` - 12 directory entry templates
- `prompts/content/news-articles.yaml` - 5 news article templates
- `prompts/content/homepage.yaml` - 6 homepage section templates
- `tests/src/Unit/Value/ImageSpecificationTest.php` - ImageSpecification tests
- `tests/src/Unit/Value/ContentSpecificationTest.php` - ContentSpecification tests
- `tests/src/Unit/Service/ContentTemplateManagerTest.php` - Template manager tests
