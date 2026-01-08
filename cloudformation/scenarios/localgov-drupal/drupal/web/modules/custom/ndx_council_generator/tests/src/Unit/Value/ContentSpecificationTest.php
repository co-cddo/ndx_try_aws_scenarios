<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit\Value;

use Drupal\ndx_council_generator\Value\ContentSpecification;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Drupal\ndx_council_generator\Value\ImageSpecification;
use PHPUnit\Framework\TestCase;

/**
 * Tests the ContentSpecification value object.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Value\ContentSpecification
 * @group ndx_council_generator
 */
class ContentSpecificationTest extends TestCase {

  /**
   * A test council identity.
   */
  protected CouncilIdentity $identity;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->identity = new CouncilIdentity(
      name: 'Westshire Council',
      regionKey: 'midlands',
      themeKey: 'market-town',
      populationEstimate: 150000,
      flavourKeywords: ['historic', 'market'],
      motto: 'Progress through unity'
    );
  }

  /**
   * Tests basic constructor and properties.
   *
   * @covers ::__construct
   */
  public function testConstructor(): void {
    $imageSpec = new ImageSpecification(
      type: 'hero',
      prompt: 'Test image',
      dimensions: '1200x630',
      style: 'photo',
      contentId: NULL,
      fieldName: 'field_hero'
    );

    $spec = new ContentSpecification(
      id: 'service-waste-recycling',
      contentType: 'localgov_services_page',
      titleTemplate: 'Waste and recycling - {{council_name}}',
      prompt: 'Write a service page about waste collection...',
      images: [$imageSpec],
      drupalFields: ['title' => 'title', 'body' => 'body'],
      order: 10,
      dependencies: ['council-identity'],
      metadata: ['category' => 'environment']
    );

    $this->assertEquals('service-waste-recycling', $spec->id);
    $this->assertEquals('localgov_services_page', $spec->contentType);
    $this->assertEquals('Waste and recycling - {{council_name}}', $spec->titleTemplate);
    $this->assertEquals(10, $spec->order);
    $this->assertEquals(['council-identity'], $spec->dependencies);
    $this->assertEquals(['category' => 'environment'], $spec->metadata);
  }

  /**
   * Tests prompt rendering with council identity.
   *
   * @covers ::renderPrompt
   */
  public function testRenderPrompt(): void {
    $spec = new ContentSpecification(
      id: 'test-content',
      contentType: 'page',
      titleTemplate: 'Test',
      prompt: 'Write content for {{council_name}} in {{region_name}}. Population: {{population}}',
      images: [],
      drupalFields: [],
      order: 1,
      dependencies: [],
      metadata: []
    );

    $rendered = $spec->renderPrompt($this->identity);

    $this->assertStringContainsString('Westshire Council', $rendered);
    $this->assertStringContainsString('Midlands', $rendered);
    $this->assertStringContainsString('150,000', $rendered);
  }

  /**
   * Tests title template rendering.
   *
   * @covers ::renderTitle
   */
  public function testRenderTitle(): void {
    $spec = new ContentSpecification(
      id: 'test-content',
      contentType: 'page',
      titleTemplate: 'Welcome to {{council_name}}',
      prompt: 'Test',
      images: [],
      drupalFields: [],
      order: 1,
      dependencies: [],
      metadata: []
    );

    $this->assertEquals(
      'Welcome to Westshire Council',
      $spec->renderTitle($this->identity)
    );
  }

  /**
   * Tests hasImages method.
   *
   * @covers ::hasImages
   * @covers ::getImageCount
   */
  public function testHasImages(): void {
    $specWithoutImages = new ContentSpecification(
      id: 'no-images',
      contentType: 'page',
      titleTemplate: 'Test',
      prompt: 'Test',
      images: [],
      drupalFields: [],
      order: 1,
      dependencies: [],
      metadata: []
    );

    $this->assertFalse($specWithoutImages->hasImages());
    $this->assertEquals(0, $specWithoutImages->getImageCount());

    $imageSpec = new ImageSpecification(
      type: 'hero',
      prompt: 'Test image',
      dimensions: '1200x630',
      style: 'photo',
      contentId: NULL,
      fieldName: 'field_hero'
    );

    $specWithImages = new ContentSpecification(
      id: 'with-images',
      contentType: 'page',
      titleTemplate: 'Test',
      prompt: 'Test',
      images: [$imageSpec],
      drupalFields: [],
      order: 1,
      dependencies: [],
      metadata: []
    );

    $this->assertTrue($specWithImages->hasImages());
    $this->assertEquals(1, $specWithImages->getImageCount());
  }

  /**
   * Tests getRenderedImages method.
   *
   * @covers ::getRenderedImages
   */
  public function testGetRenderedImages(): void {
    $imageSpec = new ImageSpecification(
      type: 'hero',
      prompt: 'View of {{region_name}} town centre',
      dimensions: '1920x600',
      style: 'photo',
      contentId: NULL,
      fieldName: 'field_hero_image'
    );

    $spec = new ContentSpecification(
      id: 'test-content',
      contentType: 'page',
      titleTemplate: 'Test',
      prompt: 'Test',
      images: [$imageSpec],
      drupalFields: [],
      order: 1,
      dependencies: [],
      metadata: []
    );

    $renderedImages = $spec->getRenderedImages($this->identity);

    $this->assertCount(1, $renderedImages);
    $this->assertInstanceOf(ImageSpecification::class, $renderedImages[0]);
    $this->assertStringContainsString('Midlands', $renderedImages[0]->prompt);
    $this->assertEquals('test-content', $renderedImages[0]->contentId);
  }

  /**
   * Tests dependenciesSatisfied method.
   *
   * @covers ::dependenciesSatisfied
   */
  public function testDependenciesSatisfied(): void {
    $specNoDeps = new ContentSpecification(
      id: 'no-deps',
      contentType: 'page',
      titleTemplate: 'Test',
      prompt: 'Test',
      images: [],
      drupalFields: [],
      order: 1,
      dependencies: [],
      metadata: []
    );

    // No dependencies means always satisfied.
    $this->assertTrue($specNoDeps->dependenciesSatisfied([]));

    $specWithDeps = new ContentSpecification(
      id: 'with-deps',
      contentType: 'page',
      titleTemplate: 'Test',
      prompt: 'Test',
      images: [],
      drupalFields: [],
      order: 5,
      dependencies: ['council-identity', 'service-waste'],
      metadata: []
    );

    // Missing all dependencies.
    $this->assertFalse($specWithDeps->dependenciesSatisfied([]));

    // Missing one dependency.
    $this->assertFalse($specWithDeps->dependenciesSatisfied(['council-identity']));

    // All dependencies satisfied.
    $this->assertTrue($specWithDeps->dependenciesSatisfied(['council-identity', 'service-waste']));

    // Extra completed items don't matter.
    $this->assertTrue($specWithDeps->dependenciesSatisfied([
      'council-identity',
      'service-waste',
      'other-content',
    ]));
  }

  /**
   * Tests fromArray factory method.
   *
   * @covers ::fromArray
   */
  public function testFromArray(): void {
    $data = [
      'id' => 'service-council-tax',
      'content_type' => 'localgov_services_page',
      'title_template' => 'Council Tax - {{council_name}}',
      'prompt' => 'Write a service page about council tax...',
      'generation_order' => 10,
      'images' => [
        [
          'type' => 'hero',
          'prompt' => 'Council office reception',
          'dimensions' => '1200x630',
          'style' => 'photo',
          'field_name' => 'field_hero_image',
        ],
      ],
      'drupal_fields' => [
        'title' => 'title',
        'body' => 'body',
      ],
      'dependencies' => ['council-identity'],
      'metadata' => ['priority' => 'high'],
    ];

    $spec = ContentSpecification::fromArray($data);

    $this->assertEquals('service-council-tax', $spec->id);
    $this->assertEquals('localgov_services_page', $spec->contentType);
    $this->assertEquals('Council Tax - {{council_name}}', $spec->titleTemplate);
    $this->assertEquals(10, $spec->order);
    $this->assertTrue($spec->hasImages());
    $this->assertCount(1, $spec->images);
    $this->assertEquals(['council-identity'], $spec->dependencies);
  }

  /**
   * Tests fromArray with minimal data.
   *
   * @covers ::fromArray
   */
  public function testFromArrayWithMinimalData(): void {
    $data = [
      'id' => 'simple-page',
      'title_template' => 'Simple Page',
      'prompt' => 'Write simple content',
    ];

    $spec = ContentSpecification::fromArray($data);

    $this->assertEquals('simple-page', $spec->id);
    $this->assertEquals('page', $spec->contentType);
    $this->assertEquals(100, $spec->order);
    $this->assertFalse($spec->hasImages());
    $this->assertEmpty($spec->dependencies);
    $this->assertEmpty($spec->drupalFields);
  }

  /**
   * Tests toArray method.
   *
   * @covers ::toArray
   */
  public function testToArray(): void {
    $imageSpec = new ImageSpecification(
      type: 'hero',
      prompt: 'Test image',
      dimensions: '1200x630',
      style: 'photo',
      contentId: NULL,
      fieldName: 'field_hero'
    );

    $spec = new ContentSpecification(
      id: 'test-content',
      contentType: 'page',
      titleTemplate: 'Test Title',
      prompt: 'Test Prompt',
      images: [$imageSpec],
      drupalFields: ['title' => 'title'],
      order: 5,
      dependencies: ['dep1'],
      metadata: ['key' => 'value']
    );

    $array = $spec->toArray();

    $this->assertEquals('test-content', $array['id']);
    $this->assertEquals('page', $array['content_type']);
    $this->assertEquals('Test Title', $array['title_template']);
    $this->assertEquals('Test Prompt', $array['prompt']);
    $this->assertEquals(5, $array['generation_order']);
    $this->assertEquals(['title' => 'title'], $array['drupal_fields']);
    $this->assertEquals(['dep1'], $array['dependencies']);
    $this->assertCount(1, $array['images']);
  }

  /**
   * Tests content type constants.
   */
  public function testContentTypeConstants(): void {
    $this->assertEquals('localgov_services_page', ContentSpecification::TYPE_SERVICE_PAGE);
    $this->assertEquals('localgov_guides_page', ContentSpecification::TYPE_GUIDE_PAGE);
    $this->assertEquals('localgov_directory', ContentSpecification::TYPE_DIRECTORY);
    $this->assertEquals('localgov_news_article', ContentSpecification::TYPE_NEWS);
    $this->assertEquals('page', ContentSpecification::TYPE_PAGE);
  }

}
