<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit;

use Drupal\ndx_council_generator\Value\CouncilIdentity;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for CouncilIdentity value object.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Value\CouncilIdentity
 * @group ndx_council_generator
 *
 * Story 5.2: Council Identity Generator
 */
class CouncilIdentityTest extends TestCase {

  /**
   * Test construction with valid data.
   *
   * @covers ::__construct
   */
  public function testConstruction(): void {
    $identity = new CouncilIdentity(
      name: 'Thornbridge District Council',
      regionKey: 'yorkshire',
      themeKey: 'market_town',
      populationRange: 'medium',
      populationEstimate: 45000,
      flavourKeywords: ['wool trade', 'market square'],
      motto: 'Service with Pride',
      generatedAt: 1703851200,
    );

    $this->assertEquals('Thornbridge District Council', $identity->name);
    $this->assertEquals('yorkshire', $identity->regionKey);
    $this->assertEquals('market_town', $identity->themeKey);
    $this->assertEquals('medium', $identity->populationRange);
    $this->assertEquals(45000, $identity->populationEstimate);
    $this->assertEquals(['wool trade', 'market square'], $identity->flavourKeywords);
    $this->assertEquals('Service with Pride', $identity->motto);
    $this->assertEquals(1703851200, $identity->generatedAt);
  }

  /**
   * Test getRegionName returns human-readable name.
   *
   * @covers ::getRegionName
   */
  public function testGetRegionName(): void {
    $identity = CouncilIdentity::fromArray([
      'name' => 'Test Council',
      'regionKey' => 'yorkshire',
    ]);

    $this->assertEquals('Yorkshire and the Humber', $identity->getRegionName());
  }

  /**
   * Test getRegionName with invalid key falls back to key.
   *
   * @covers ::getRegionName
   */
  public function testGetRegionNameFallback(): void {
    $identity = CouncilIdentity::fromArray([
      'name' => 'Test Council',
      'regionKey' => 'invalid_region',
    ]);

    $this->assertEquals('invalid_region', $identity->getRegionName());
  }

  /**
   * Test getThemeName returns human-readable name.
   *
   * @covers ::getThemeName
   */
  public function testGetThemeName(): void {
    $identity = CouncilIdentity::fromArray([
      'name' => 'Test Council',
      'themeKey' => 'coastal_tourism',
    ]);

    $this->assertEquals('Coastal tourism and maritime heritage', $identity->getThemeName());
  }

  /**
   * Test getPopulationDisplay for all ranges.
   *
   * @covers ::getPopulationDisplay
   * @dataProvider populationDisplayProvider
   */
  public function testGetPopulationDisplay(string $range, string $expected): void {
    $identity = CouncilIdentity::fromArray([
      'name' => 'Test Council',
      'populationRange' => $range,
    ]);

    $this->assertEquals($expected, $identity->getPopulationDisplay());
  }

  /**
   * Data provider for population display tests.
   */
  public static function populationDisplayProvider(): array {
    return [
      ['small', 'Small (<30,000)'],
      ['medium', 'Medium (30,000-100,000)'],
      ['large', 'Large (>100,000)'],
      ['unknown', 'unknown'],
    ];
  }

  /**
   * Test isValidRegion with all valid regions.
   *
   * @covers ::isValidRegion
   */
  public function testIsValidRegion(): void {
    // All 12 UK regions should be valid.
    $validRegions = [
      'north_east',
      'north_west',
      'yorkshire',
      'east_midlands',
      'west_midlands',
      'east',
      'london',
      'south_east',
      'south_west',
      'wales',
      'scotland',
      'northern_ireland',
    ];

    foreach ($validRegions as $region) {
      $this->assertTrue(
        CouncilIdentity::isValidRegion($region),
        "Expected '$region' to be valid"
      );
    }

    // Invalid regions should be invalid.
    $this->assertFalse(CouncilIdentity::isValidRegion('invalid'));
    $this->assertFalse(CouncilIdentity::isValidRegion(''));
    $this->assertFalse(CouncilIdentity::isValidRegion('Yorkshire'));
  }

  /**
   * Test isValidTheme with all valid themes.
   *
   * @covers ::isValidTheme
   */
  public function testIsValidTheme(): void {
    $validThemes = [
      'coastal_tourism',
      'industrial_heritage',
      'market_town',
      'rural_agricultural',
      'university_city',
      'commuter_belt',
      'mining_legacy',
      'cathedral_city',
    ];

    foreach ($validThemes as $theme) {
      $this->assertTrue(
        CouncilIdentity::isValidTheme($theme),
        "Expected '$theme' to be valid"
      );
    }

    $this->assertFalse(CouncilIdentity::isValidTheme('invalid'));
  }

  /**
   * Test isValidPopulationRange.
   *
   * @covers ::isValidPopulationRange
   */
  public function testIsValidPopulationRange(): void {
    $this->assertTrue(CouncilIdentity::isValidPopulationRange('small'));
    $this->assertTrue(CouncilIdentity::isValidPopulationRange('medium'));
    $this->assertTrue(CouncilIdentity::isValidPopulationRange('large'));
    $this->assertFalse(CouncilIdentity::isValidPopulationRange('tiny'));
    $this->assertFalse(CouncilIdentity::isValidPopulationRange(''));
  }

  /**
   * Test getFlavourKeywordsString.
   *
   * @covers ::getFlavourKeywordsString
   */
  public function testGetFlavourKeywordsString(): void {
    $identity = CouncilIdentity::fromArray([
      'name' => 'Test Council',
      'flavourKeywords' => ['wool trade', 'market square', 'river crossing'],
    ]);

    $this->assertEquals(
      'wool trade, market square, river crossing',
      $identity->getFlavourKeywordsString()
    );
  }

  /**
   * Test toArray serialization.
   *
   * @covers ::toArray
   */
  public function testToArray(): void {
    $identity = new CouncilIdentity(
      name: 'Thornbridge District Council',
      regionKey: 'yorkshire',
      themeKey: 'market_town',
      populationRange: 'medium',
      populationEstimate: 45000,
      flavourKeywords: ['wool trade', 'market square'],
      motto: 'Service with Pride',
      generatedAt: 1703851200,
    );

    $array = $identity->toArray();

    $this->assertEquals('Thornbridge District Council', $array['name']);
    $this->assertEquals('yorkshire', $array['regionKey']);
    $this->assertEquals('market_town', $array['themeKey']);
    $this->assertEquals('medium', $array['populationRange']);
    $this->assertEquals(45000, $array['populationEstimate']);
    $this->assertEquals(['wool trade', 'market square'], $array['flavourKeywords']);
    $this->assertEquals('Service with Pride', $array['motto']);
    $this->assertEquals(1703851200, $array['generatedAt']);
  }

  /**
   * Test fromArray deserialization.
   *
   * @covers ::fromArray
   */
  public function testFromArray(): void {
    $data = [
      'name' => 'Ashworth Borough Council',
      'regionKey' => 'north_west',
      'themeKey' => 'industrial_heritage',
      'populationRange' => 'large',
      'populationEstimate' => 150000,
      'flavourKeywords' => ['cotton mills', 'canal heritage'],
      'motto' => 'Forward Together',
      'generatedAt' => 1703851200,
    ];

    $identity = CouncilIdentity::fromArray($data);

    $this->assertEquals('Ashworth Borough Council', $identity->name);
    $this->assertEquals('north_west', $identity->regionKey);
    $this->assertEquals('industrial_heritage', $identity->themeKey);
    $this->assertEquals('large', $identity->populationRange);
    $this->assertEquals(150000, $identity->populationEstimate);
  }

  /**
   * Test fromArray with missing fields uses defaults.
   *
   * @covers ::fromArray
   */
  public function testFromArrayWithDefaults(): void {
    $data = ['name' => 'Test Council'];
    $identity = CouncilIdentity::fromArray($data);

    $this->assertEquals('Test Council', $identity->name);
    $this->assertEquals('east_midlands', $identity->regionKey);
    $this->assertEquals('market_town', $identity->themeKey);
    $this->assertEquals('medium', $identity->populationRange);
    $this->assertEquals(50000, $identity->populationEstimate);
    $this->assertEquals([], $identity->flavourKeywords);
    $this->assertEquals('', $identity->motto);
  }

  /**
   * Test createDefault factory method.
   *
   * @covers ::createDefault
   */
  public function testCreateDefault(): void {
    $identity = CouncilIdentity::createDefault();

    $this->assertEquals('Westbridge District Council', $identity->name);
    $this->assertEquals('east_midlands', $identity->regionKey);
    $this->assertEquals('market_town', $identity->themeKey);
    $this->assertEquals('medium', $identity->populationRange);
    $this->assertEquals(45000, $identity->populationEstimate);
    $this->assertNotEmpty($identity->flavourKeywords);
    $this->assertNotEmpty($identity->motto);
    $this->assertGreaterThan(0, $identity->generatedAt);
  }

  /**
   * Test round-trip serialization.
   *
   * @covers ::toArray
   * @covers ::fromArray
   */
  public function testRoundTripSerialization(): void {
    $original = new CouncilIdentity(
      name: 'Brackenmoor County Council',
      regionKey: 'scotland',
      themeKey: 'rural_agricultural',
      populationRange: 'small',
      populationEstimate: 22000,
      flavourKeywords: ['highland cattle', 'whisky distillery', 'ancient stones'],
      motto: 'Strength in Unity',
      generatedAt: 1703851200,
    );

    $array = $original->toArray();
    $restored = CouncilIdentity::fromArray($array);

    $this->assertEquals($original->name, $restored->name);
    $this->assertEquals($original->regionKey, $restored->regionKey);
    $this->assertEquals($original->themeKey, $restored->themeKey);
    $this->assertEquals($original->populationRange, $restored->populationRange);
    $this->assertEquals($original->populationEstimate, $restored->populationEstimate);
    $this->assertEquals($original->flavourKeywords, $restored->flavourKeywords);
    $this->assertEquals($original->motto, $restored->motto);
    $this->assertEquals($original->generatedAt, $restored->generatedAt);
  }

  /**
   * Test REGIONS constant has all 12 UK regions.
   *
   * @covers ::REGIONS
   */
  public function testRegionsConstant(): void {
    $this->assertCount(12, CouncilIdentity::REGIONS);
    $this->assertArrayHasKey('north_east', CouncilIdentity::REGIONS);
    $this->assertArrayHasKey('wales', CouncilIdentity::REGIONS);
    $this->assertArrayHasKey('scotland', CouncilIdentity::REGIONS);
    $this->assertArrayHasKey('northern_ireland', CouncilIdentity::REGIONS);
  }

  /**
   * Test THEMES constant has all 8 themes.
   *
   * @covers ::THEMES
   */
  public function testThemesConstant(): void {
    $this->assertCount(8, CouncilIdentity::THEMES);
    $this->assertArrayHasKey('coastal_tourism', CouncilIdentity::THEMES);
    $this->assertArrayHasKey('industrial_heritage', CouncilIdentity::THEMES);
    $this->assertArrayHasKey('market_town', CouncilIdentity::THEMES);
  }

}
