<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Value;

/**
 * Value object representing an image generation specification.
 *
 * Story 5.3: Content Generation Templates
 */
final class ImageSpecification {

  /**
   * Image type constants.
   */
  public const TYPE_HERO = 'hero';
  public const TYPE_HEADSHOT = 'headshot';
  public const TYPE_LOCATION = 'location';
  public const TYPE_ICON = 'icon';
  public const TYPE_DOCUMENT = 'document';

  /**
   * Style constants.
   */
  public const STYLE_PHOTO = 'photo';
  public const STYLE_ILLUSTRATION = 'illustration';
  public const STYLE_ICON = 'icon';

  /**
   * Valid image types.
   */
  public const VALID_TYPES = [
    self::TYPE_HERO,
    self::TYPE_HEADSHOT,
    self::TYPE_LOCATION,
    self::TYPE_ICON,
    self::TYPE_DOCUMENT,
  ];

  /**
   * Constructs an ImageSpecification.
   *
   * @param string $type
   *   Image type (hero, headshot, location, icon, document).
   * @param string $prompt
   *   The generation prompt with placeholders.
   * @param string $dimensions
   *   Dimensions in WxH format (e.g., "1200x630").
   * @param string $style
   *   Visual style (photo, illustration, icon).
   * @param string|null $contentId
   *   ID of content this image is linked to.
   * @param string|null $fieldName
   *   Drupal field name this image maps to.
   */
  public function __construct(
    public readonly string $type,
    public readonly string $prompt,
    public readonly string $dimensions,
    public readonly string $style,
    public readonly ?string $contentId,
    public readonly ?string $fieldName,
  ) {}

  /**
   * Get width from dimensions string.
   *
   * @return int
   *   The width in pixels.
   */
  public function getWidth(): int {
    $parts = explode('x', strtolower($this->dimensions));
    return (int) ($parts[0] ?? 1200);
  }

  /**
   * Get height from dimensions string.
   *
   * @return int
   *   The height in pixels.
   */
  public function getHeight(): int {
    $parts = explode('x', strtolower($this->dimensions));
    return (int) ($parts[1] ?? 630);
  }

  /**
   * Get aspect ratio.
   *
   * @return float
   *   Width divided by height.
   */
  public function getAspectRatio(): float {
    $height = $this->getHeight();
    if ($height === 0) {
      return 1.0;
    }
    return $this->getWidth() / $height;
  }

  /**
   * Check if this is a valid image type.
   *
   * @param string $type
   *   The type to check.
   *
   * @return bool
   *   TRUE if valid.
   */
  public static function isValidType(string $type): bool {
    return in_array($type, self::VALID_TYPES, TRUE);
  }

  /**
   * Render prompt with council identity variables.
   *
   * @param \Drupal\ndx_council_generator\Value\CouncilIdentity $identity
   *   The council identity.
   *
   * @return string
   *   The rendered prompt.
   */
  public function renderPrompt(CouncilIdentity $identity): string {
    return strtr($this->prompt, [
      '{{council_name}}' => $identity->name,
      '{{region_name}}' => $identity->getRegionName(),
      '{{region_key}}' => $identity->regionKey,
      '{{theme_description}}' => $identity->getThemeName(),
      '{{theme_key}}' => $identity->themeKey,
      '{{population}}' => number_format($identity->populationEstimate),
      '{{flavour_keywords}}' => $identity->getFlavourKeywordsString(),
      '{{motto}}' => $identity->motto,
    ]);
  }

  /**
   * Create from array.
   *
   * @param array $data
   *   Image specification data.
   *
   * @return self
   *   New ImageSpecification instance.
   */
  public static function fromArray(array $data): self {
    return new self(
      type: $data['type'] ?? self::TYPE_HERO,
      prompt: $data['prompt'] ?? '',
      dimensions: $data['dimensions'] ?? '1200x630',
      style: $data['style'] ?? self::STYLE_PHOTO,
      contentId: $data['content_id'] ?? NULL,
      fieldName: $data['field_name'] ?? NULL,
    );
  }

  /**
   * Convert to array.
   *
   * @return array
   *   Array representation.
   */
  public function toArray(): array {
    return [
      'type' => $this->type,
      'prompt' => $this->prompt,
      'dimensions' => $this->dimensions,
      'style' => $this->style,
      'content_id' => $this->contentId,
      'field_name' => $this->fieldName,
    ];
  }

}
