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
  public const POPULATION_SMALL = 'small';
  public const POPULATION_MEDIUM = 'medium';
  public const POPULATION_LARGE = 'large';

  /**
   * Valid population ranges.
   */
  public const VALID_POPULATION_RANGES = [
    self::POPULATION_SMALL,
    self::POPULATION_MEDIUM,
    self::POPULATION_LARGE,
  ];

  /**
   * Constructs a CouncilIdentity.
   *
   * @param string $name
   *   Council name (e.g., "Thornbridge District Council").
   * @param string $regionKey
   *   Region key from REGIONS constant.
   * @param string $themeKey
   *   Theme key from THEMES constant.
   * @param string $populationRange
   *   Population range (small/medium/large).
   * @param int $populationEstimate
   *   Estimated population number.
   * @param array $flavourKeywords
   *   Local flavour keywords for content generation.
   * @param string $motto
   *   Council motto.
   * @param int $generatedAt
   *   Unix timestamp when identity was generated.
   */
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
   *
   * @return string
   *   Human-readable region name.
   */
  public function getRegionName(): string {
    return self::REGIONS[$this->regionKey] ?? $this->regionKey;
  }

  /**
   * Get theme display name.
   *
   * @return string
   *   Human-readable theme description.
   */
  public function getThemeName(): string {
    return self::THEMES[$this->themeKey] ?? $this->themeKey;
  }

  /**
   * Get population range for display.
   *
   * @return string
   *   Human-readable population range.
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
   * Check if region is valid.
   *
   * @param string $regionKey
   *   Region key to check.
   *
   * @return bool
   *   TRUE if valid.
   */
  public static function isValidRegion(string $regionKey): bool {
    return isset(self::REGIONS[$regionKey]);
  }

  /**
   * Check if theme is valid.
   *
   * @param string $themeKey
   *   Theme key to check.
   *
   * @return bool
   *   TRUE if valid.
   */
  public static function isValidTheme(string $themeKey): bool {
    return isset(self::THEMES[$themeKey]);
  }

  /**
   * Check if population range is valid.
   *
   * @param string $range
   *   Population range to check.
   *
   * @return bool
   *   TRUE if valid.
   */
  public static function isValidPopulationRange(string $range): bool {
    return in_array($range, self::VALID_POPULATION_RANGES, TRUE);
  }

  /**
   * Get flavour keywords as comma-separated string.
   *
   * @return string
   *   Keywords joined by commas.
   */
  public function getFlavourKeywordsString(): string {
    return implode(', ', $this->flavourKeywords);
  }

  /**
   * Convert to array for storage.
   *
   * @return array
   *   Identity as associative array.
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
   *
   * @param array $data
   *   Identity data array.
   *
   * @return self
   *   New CouncilIdentity instance.
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

  /**
   * Create a default/fallback identity.
   *
   * @return self
   *   Default council identity.
   */
  public static function createDefault(): self {
    return new self(
      name: 'Westbridge District Council',
      regionKey: 'east_midlands',
      themeKey: 'market_town',
      populationRange: self::POPULATION_MEDIUM,
      populationEstimate: 45000,
      flavourKeywords: ['market square', 'river crossing', 'historic bridges', 'wool trade', 'ancient charter'],
      motto: 'Service with Pride',
      generatedAt: time(),
    );
  }

}
