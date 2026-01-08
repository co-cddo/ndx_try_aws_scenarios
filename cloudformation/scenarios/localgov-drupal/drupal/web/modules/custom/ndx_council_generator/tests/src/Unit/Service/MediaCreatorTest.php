<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit\Service;

use Drupal\ndx_council_generator\Service\MediaCreator;
use PHPUnit\Framework\TestCase;

/**
 * Tests for MediaCreator service.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Service\MediaCreator
 * @group ndx_council_generator
 */
class MediaCreatorTest extends TestCase {

  /**
   * Tests generateFileName method.
   *
   * @covers ::generateFileName
   * @dataProvider fileNameProvider
   */
  public function testGenerateFileName(string $specId, string $extension, string $expectedPattern): void {
    $entityTypeManager = $this->createMock(\Drupal\Core\Entity\EntityTypeManagerInterface::class);
    $fileSystem = $this->createMock(\Drupal\Core\File\FileSystemInterface::class);
    $logger = $this->createMock(\Psr\Log\LoggerInterface::class);

    $service = new MediaCreator($entityTypeManager, $fileSystem, $logger);
    $result = $service->generateFileName($specId, $extension);

    $this->assertMatchesRegularExpression($expectedPattern, $result);
  }

  /**
   * Data provider for file name tests.
   */
  public static function fileNameProvider(): array {
    return [
      'simple spec id' => [
        'homepage-hero',
        'png',
        '/^generated-homepage-hero-\d+\.png$/',
      ],
      'complex spec id' => [
        'service-guide-waste-collection',
        'jpg',
        '/^generated-service-guide-waste-collection-\d+\.jpg$/',
      ],
      'spec with uppercase' => [
        'Service-GUIDE-Test',
        'webp',
        '/^generated-service-guide-test-\d+\.webp$/',
      ],
      'spec with special chars' => [
        'test@spec#id!',
        'png',
        '/^generated-test-spec-id-\d+\.png$/',
      ],
      'spec with multiple dashes' => [
        'test---spec---id',
        'gif',
        '/^generated-test-spec-id-\d+\.gif$/',
      ],
    ];
  }

  /**
   * Tests generateAltText method.
   *
   * @covers ::generateAltText
   * @dataProvider altTextProvider
   */
  public function testGenerateAltText(string $specId, string $councilName, string $expectedContains): void {
    $entityTypeManager = $this->createMock(\Drupal\Core\Entity\EntityTypeManagerInterface::class);
    $fileSystem = $this->createMock(\Drupal\Core\File\FileSystemInterface::class);
    $logger = $this->createMock(\Psr\Log\LoggerInterface::class);

    $service = new MediaCreator($entityTypeManager, $fileSystem, $logger);
    $result = $service->generateAltText($specId, $councilName);

    $this->assertStringContainsString($councilName, $result);
    $this->assertStringContainsString($expectedContains, $result);
  }

  /**
   * Data provider for alt text tests.
   */
  public static function altTextProvider(): array {
    return [
      'hero image' => [
        'hero-parks',
        'Test Council',
        'Hero parks',
      ],
      'service guide' => [
        'service-guide-waste',
        'Example Borough',
        'Example Borough',
      ],
      'simple homepage' => [
        'homepage',
        'My Council',
        'Image for My Council',
      ],
    ];
  }

  /**
   * Tests that filtered spec IDs produce fallback alt text.
   *
   * @covers ::generateAltText
   */
  public function testGenerateAltTextFallback(): void {
    $entityTypeManager = $this->createMock(\Drupal\Core\Entity\EntityTypeManagerInterface::class);
    $fileSystem = $this->createMock(\Drupal\Core\File\FileSystemInterface::class);
    $logger = $this->createMock(\Psr\Log\LoggerInterface::class);

    $service = new MediaCreator($entityTypeManager, $fileSystem, $logger);

    // All common prefixes should result in fallback.
    $result = $service->generateAltText('homepage', 'Test Council');
    $this->assertEquals('Image for Test Council', $result);
  }

}
