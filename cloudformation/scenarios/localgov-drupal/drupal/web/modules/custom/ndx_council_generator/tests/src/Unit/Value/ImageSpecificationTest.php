<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit\Value;

use Drupal\ndx_council_generator\Value\CouncilIdentity;
use Drupal\ndx_council_generator\Value\ImageSpecification;
use PHPUnit\Framework\TestCase;

/**
 * Tests the ImageSpecification value object.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Value\ImageSpecification
 * @group ndx_council_generator
 */
class ImageSpecificationTest extends TestCase {

  /**
   * Tests basic constructor and properties.
   *
   * @covers ::__construct
   */
  public function testConstructor(): void {
    $spec = new ImageSpecification(
      type: 'hero',
      prompt: 'British town centre with {{region_name}}',
      dimensions: '1200x630',
      style: 'photo',
      contentId: 'service-waste',
      fieldName: 'field_hero_image'
    );

    $this->assertEquals('hero', $spec->type);
    $this->assertEquals('British town centre with {{region_name}}', $spec->prompt);
    $this->assertEquals('1200x630', $spec->dimensions);
    $this->assertEquals('photo', $spec->style);
    $this->assertEquals('service-waste', $spec->contentId);
    $this->assertEquals('field_hero_image', $spec->fieldName);
  }

  /**
   * Tests dimension parsing for various formats.
   *
   * @covers ::getWidth
   * @covers ::getHeight
   * @dataProvider dimensionProvider
   */
  public function testDimensionParsing(string $dimensions, int $expectedWidth, int $expectedHeight): void {
    $spec = new ImageSpecification(
      type: 'location',
      prompt: 'Test prompt',
      dimensions: $dimensions,
      style: 'photo',
      contentId: NULL,
      fieldName: NULL
    );

    $this->assertEquals($expectedWidth, $spec->getWidth());
    $this->assertEquals($expectedHeight, $spec->getHeight());
  }

  /**
   * Data provider for dimension parsing tests.
   *
   * @return array<string, array{string, int, int}>
   */
  public static function dimensionProvider(): array {
    return [
      'hero dimensions' => ['1920x600', 1920, 600],
      'location dimensions' => ['800x600', 800, 600],
      'standard dimensions' => ['1200x630', 1200, 630],
      'square dimensions' => ['512x512', 512, 512],
    ];
  }

  /**
   * Tests aspect ratio calculation.
   *
   * @covers ::getAspectRatio
   */
  public function testGetAspectRatio(): void {
    $spec = new ImageSpecification(
      type: 'hero',
      prompt: 'Test',
      dimensions: '1920x1080',
      style: 'photo',
      contentId: NULL,
      fieldName: NULL
    );

    $this->assertEqualsWithDelta(16 / 9, $spec->getAspectRatio(), 0.01);
  }

  /**
   * Tests prompt rendering with council identity.
   *
   * @covers ::renderPrompt
   */
  public function testRenderPrompt(): void {
    $spec = new ImageSpecification(
      type: 'hero',
      prompt: 'Panoramic view of {{region_name}} with {{theme_description}} character',
      dimensions: '1920x600',
      style: 'photo',
      contentId: NULL,
      fieldName: 'field_hero_image'
    );

    $identity = new CouncilIdentity(
      name: 'Westshire Council',
      regionKey: 'midlands',
      themeKey: 'market-town',
      populationEstimate: 150000,
      flavourKeywords: ['historic', 'market'],
      motto: 'Progress through unity'
    );

    $rendered = $spec->renderPrompt($identity);

    $this->assertStringContainsString('Midlands', $rendered);
    $this->assertStringContainsString('Market Town', $rendered);
  }

  /**
   * Tests creating ImageSpecification from array.
   *
   * @covers ::fromArray
   */
  public function testFromArray(): void {
    $data = [
      'type' => 'location',
      'prompt' => 'British park with families',
      'dimensions' => '800x600',
      'style' => 'illustration',
      'field_name' => 'field_location_image',
    ];

    $spec = ImageSpecification::fromArray($data);

    $this->assertEquals('location', $spec->type);
    $this->assertEquals('British park with families', $spec->prompt);
    $this->assertEquals('800x600', $spec->dimensions);
    $this->assertEquals('illustration', $spec->style);
    $this->assertEquals('field_location_image', $spec->fieldName);
  }

  /**
   * Tests fromArray with default values.
   *
   * @covers ::fromArray
   */
  public function testFromArrayWithDefaults(): void {
    $data = [
      'type' => 'icon',
      'prompt' => 'Council logo',
    ];

    $spec = ImageSpecification::fromArray($data);

    $this->assertEquals('icon', $spec->type);
    $this->assertEquals('Council logo', $spec->prompt);
    $this->assertEquals('1200x630', $spec->dimensions);
    $this->assertEquals('photo', $spec->style);
    $this->assertNull($spec->fieldName);
  }

  /**
   * Tests converting ImageSpecification to array.
   *
   * @covers ::toArray
   */
  public function testToArray(): void {
    $spec = new ImageSpecification(
      type: 'hero',
      prompt: 'Test prompt',
      dimensions: '1920x600',
      style: 'photo',
      contentId: 'test-content',
      fieldName: 'field_hero'
    );

    $array = $spec->toArray();

    $this->assertEquals([
      'type' => 'hero',
      'prompt' => 'Test prompt',
      'dimensions' => '1920x600',
      'style' => 'photo',
      'content_id' => 'test-content',
      'field_name' => 'field_hero',
    ], $array);
  }

  /**
   * Tests valid image types.
   *
   * @covers ::isValidType
   * @dataProvider validTypeProvider
   */
  public function testValidTypes(string $type, bool $expected): void {
    $this->assertEquals($expected, ImageSpecification::isValidType($type));
  }

  /**
   * Data provider for valid image types.
   *
   * @return array<string, array{string, bool}>
   */
  public static function validTypeProvider(): array {
    return [
      'hero' => ['hero', TRUE],
      'headshot' => ['headshot', TRUE],
      'location' => ['location', TRUE],
      'icon' => ['icon', TRUE],
      'document' => ['document', TRUE],
      'invalid' => ['invalid_type', FALSE],
    ];
  }

  /**
   * Tests type constants.
   *
   * @covers ::VALID_TYPES
   */
  public function testTypeConstants(): void {
    $this->assertEquals('hero', ImageSpecification::TYPE_HERO);
    $this->assertEquals('headshot', ImageSpecification::TYPE_HEADSHOT);
    $this->assertEquals('location', ImageSpecification::TYPE_LOCATION);
    $this->assertEquals('icon', ImageSpecification::TYPE_ICON);
    $this->assertEquals('document', ImageSpecification::TYPE_DOCUMENT);
  }

  /**
   * Tests style constants.
   */
  public function testStyleConstants(): void {
    $this->assertEquals('photo', ImageSpecification::STYLE_PHOTO);
    $this->assertEquals('illustration', ImageSpecification::STYLE_ILLUSTRATION);
    $this->assertEquals('icon', ImageSpecification::STYLE_ICON);
  }

}
