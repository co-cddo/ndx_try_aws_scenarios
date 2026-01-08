<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit\Service;

use Drupal\Core\Extension\ModuleExtensionList;
use Drupal\ndx_council_generator\Service\ContentTemplateManager;
use Drupal\ndx_council_generator\Value\ContentSpecification;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

/**
 * Tests the ContentTemplateManager service.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Service\ContentTemplateManager
 * @group ndx_council_generator
 */
class ContentTemplateManagerTest extends TestCase {

  /**
   * The module extension list mock.
   *
   * @var \Drupal\Core\Extension\ModuleExtensionList&\PHPUnit\Framework\MockObject\MockObject
   */
  protected MockObject $moduleExtensionList;

  /**
   * The logger mock.
   *
   * @var \Psr\Log\LoggerInterface&\PHPUnit\Framework\MockObject\MockObject
   */
  protected MockObject $logger;

  /**
   * The content template manager.
   *
   * @var \Drupal\ndx_council_generator\Service\ContentTemplateManager
   */
  protected ContentTemplateManager $manager;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->moduleExtensionList = $this->createMock(ModuleExtensionList::class);
    $this->logger = $this->createMock(LoggerInterface::class);

    // Use the actual module path for real template files.
    $modulePath = dirname(__DIR__, 4);

    $this->moduleExtensionList
      ->method('getPath')
      ->with('ndx_council_generator')
      ->willReturn($modulePath);

    $this->manager = new ContentTemplateManager(
      $this->moduleExtensionList,
      $this->logger
    );
  }

  /**
   * Tests loadAllTemplates returns templates.
   *
   * @covers ::loadAllTemplates
   */
  public function testLoadAllTemplates(): void {
    $templates = $this->manager->loadAllTemplates();

    $this->assertNotEmpty($templates);
    $this->assertContainsOnlyInstancesOf(ContentSpecification::class, $templates);
  }

  /**
   * Tests getTemplatesByType filters correctly.
   *
   * @covers ::getTemplatesByType
   */
  public function testGetTemplatesByType(): void {
    $servicePages = $this->manager->getTemplatesByType('localgov_services_page');

    $this->assertNotEmpty($servicePages);
    foreach ($servicePages as $template) {
      $this->assertInstanceOf(ContentSpecification::class, $template);
      $this->assertEquals('localgov_services_page', $template->contentType);
    }
  }

  /**
   * Tests getTemplatesByType returns empty for unknown type.
   *
   * @covers ::getTemplatesByType
   */
  public function testGetTemplatesByTypeUnknown(): void {
    $unknown = $this->manager->getTemplatesByType('unknown_type');

    $this->assertIsArray($unknown);
    $this->assertEmpty($unknown);
  }

  /**
   * Tests getTemplate retrieves specific template.
   *
   * @covers ::getTemplate
   */
  public function testGetTemplate(): void {
    $template = $this->manager->getTemplate('service-waste-recycling');

    $this->assertInstanceOf(ContentSpecification::class, $template);
    $this->assertEquals('service-waste-recycling', $template->id);
  }

  /**
   * Tests getTemplate returns null for unknown ID.
   *
   * @covers ::getTemplate
   */
  public function testGetTemplateUnknown(): void {
    $template = $this->manager->getTemplate('nonexistent-template');

    $this->assertNull($template);
  }

  /**
   * Tests getContentCount returns correct count.
   *
   * @covers ::getContentCount
   */
  public function testGetContentCount(): void {
    $count = $this->manager->getContentCount();

    // We expect 47 items: 18 services + 6 guides + 12 directories + 5 news + 6 homepage.
    $this->assertEquals(47, $count);
  }

  /**
   * Tests getImageCount returns correct count.
   *
   * @covers ::getImageCount
   */
  public function testGetImageCount(): void {
    $count = $this->manager->getImageCount();

    // Most templates have one hero image.
    $this->assertGreaterThan(0, $count);
  }

  /**
   * Tests getTemplatesInOrder returns sorted templates.
   *
   * @covers ::getTemplatesInOrder
   */
  public function testGetTemplatesInOrder(): void {
    $templates = $this->manager->getTemplatesInOrder();

    $this->assertNotEmpty($templates);

    // Verify templates are sorted by generation order.
    $previousOrder = 0;
    foreach ($templates as $template) {
      $this->assertGreaterThanOrEqual($previousOrder, $template->order);
      $previousOrder = $template->order;
    }
  }

  /**
   * Tests content types are correctly assigned.
   *
   * @covers ::loadAllTemplates
   */
  public function testContentTypesAreCorrect(): void {
    $templates = $this->manager->loadAllTemplates();

    $typeCount = [];
    foreach ($templates as $template) {
      $type = $template->contentType;
      $typeCount[$type] = ($typeCount[$type] ?? 0) + 1;
    }

    // Verify expected content type distribution.
    $this->assertEquals(18, $typeCount['localgov_services_page'] ?? 0);
    $this->assertEquals(6, $typeCount['localgov_guides_page'] ?? 0);
    $this->assertEquals(12, $typeCount['localgov_directory'] ?? 0);
    $this->assertEquals(5, $typeCount['localgov_news_article'] ?? 0);
    $this->assertEquals(6, $typeCount['page'] ?? 0);
  }

  /**
   * Tests validateTemplates returns validation results.
   *
   * @covers ::validateTemplates
   */
  public function testValidateTemplates(): void {
    $errors = $this->manager->validateTemplates();

    $this->assertIsArray($errors);
    // Should have no errors for valid templates.
    // Note: validateTemplates() returns array of error strings, empty if valid.
    $this->assertEmpty($errors, 'Template validation found errors: ' . implode(', ', $errors));
  }

  /**
   * Tests templates have required fields.
   *
   * @covers ::loadAllTemplates
   */
  public function testTemplatesHaveRequiredFields(): void {
    $templates = $this->manager->loadAllTemplates();

    foreach ($templates as $template) {
      $this->assertNotEmpty($template->id, 'Template must have an ID');
      $this->assertNotEmpty($template->titleTemplate, 'Template must have a title template');
      $this->assertNotEmpty($template->prompt, 'Template must have a prompt');
      $this->assertNotEmpty($template->contentType, 'Template must have a content type');
      $this->assertGreaterThan(0, $template->order, 'Template must have a generation order');
    }
  }

  /**
   * Tests service pages have correct structure.
   *
   * @covers ::getTemplatesByType
   */
  public function testServicePagesStructure(): void {
    $servicePages = $this->manager->getTemplatesByType('localgov_services_page');

    foreach ($servicePages as $template) {
      // All service pages should have hero images.
      $this->assertTrue($template->hasImages(), "Service page {$template->id} should have images");

      // Should have drupal_fields mapping.
      $this->assertNotEmpty($template->drupalFields, "Service page {$template->id} should have drupal_fields");
    }
  }

  /**
   * Tests guide pages have step-by-step structure.
   *
   * @covers ::getTemplatesByType
   */
  public function testGuidePagesStructure(): void {
    $guidePages = $this->manager->getTemplatesByType('localgov_guides_page');

    foreach ($guidePages as $template) {
      $prompt = $template->prompt;
      // Guide prompts should mention steps.
      $this->assertStringContainsString('step', strtolower($prompt), "Guide {$template->id} should mention steps");
    }
  }

  /**
   * Tests news articles have expected fields.
   *
   * @covers ::getTemplatesByType
   */
  public function testNewsArticlesStructure(): void {
    $newsArticles = $this->manager->getTemplatesByType('localgov_news_article');

    $this->assertCount(5, $newsArticles);

    foreach ($newsArticles as $template) {
      // News articles should map to body.
      $this->assertArrayHasKey('body', $template->drupalFields, "News {$template->id} should have body field mapping");
    }
  }

  /**
   * Tests directory entries have location-appropriate prompts.
   *
   * @covers ::getTemplatesByType
   */
  public function testDirectoryEntriesStructure(): void {
    $directories = $this->manager->getTemplatesByType('localgov_directory');

    $this->assertCount(12, $directories);

    foreach ($directories as $template) {
      $prompt = $template->prompt;
      // Directory entries should ask for address/location info.
      $hasLocationInfo = str_contains(strtolower($prompt), 'address') ||
        str_contains(strtolower($prompt), 'location') ||
        str_contains(strtolower($prompt), 'opening hours');

      $this->assertTrue($hasLocationInfo, "Directory {$template->id} should request location info");
    }
  }

  /**
   * Tests homepage sections have correct order.
   *
   * @covers ::getTemplatesByType
   */
  public function testHomepageSectionsOrder(): void {
    $homepageSections = $this->manager->getTemplatesByType('page');

    // Should be 6 homepage sections.
    $this->assertCount(6, $homepageSections);

    // All should have generation_order 5.
    foreach ($homepageSections as $template) {
      $this->assertEquals(5, $template->order);
    }
  }

  /**
   * Tests template caching works correctly.
   *
   * @covers ::loadAllTemplates
   * @covers ::resetCache
   */
  public function testTemplateCaching(): void {
    // Load templates twice.
    $firstLoad = $this->manager->loadAllTemplates();
    $secondLoad = $this->manager->loadAllTemplates();

    // Should return the same cached result.
    $this->assertSame(count($firstLoad), count($secondLoad));

    // Reset cache and reload.
    $this->manager->resetCache();
    $thirdLoad = $this->manager->loadAllTemplates();

    $this->assertSame(count($firstLoad), count($thirdLoad));
  }

}
