<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit\Value;

use Drupal\ndx_council_generator\Value\HomepageConfigurationResult;
use PHPUnit\Framework\TestCase;

/**
 * Tests for HomepageConfigurationResult value object.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Value\HomepageConfigurationResult
 * @group ndx_council_generator
 */
class HomepageConfigurationResultTest extends TestCase {

  /**
   * Tests basic construction.
   *
   * @covers ::__construct
   */
  public function testConstruction(): void {
    $result = new HomepageConfigurationResult(
      frontPageSet: TRUE,
      blocksConfigured: 3,
      blocksSkipped: 1,
      errors: ['Error 1']
    );

    $this->assertTrue($result->frontPageSet);
    $this->assertEquals(3, $result->blocksConfigured);
    $this->assertEquals(1, $result->blocksSkipped);
    $this->assertEquals(['Error 1'], $result->errors);
  }

  /**
   * Tests default error value.
   *
   * @covers ::__construct
   */
  public function testDefaultErrors(): void {
    $result = new HomepageConfigurationResult(
      frontPageSet: TRUE,
      blocksConfigured: 2,
      blocksSkipped: 0
    );

    $this->assertEmpty($result->errors);
  }

  /**
   * Tests failure factory method.
   *
   * @covers ::failure
   */
  public function testFailureFactory(): void {
    $result = HomepageConfigurationResult::failure('Database error');

    $this->assertFalse($result->frontPageSet);
    $this->assertEquals(0, $result->blocksConfigured);
    $this->assertEquals(0, $result->blocksSkipped);
    $this->assertEquals(['Database error'], $result->errors);
  }

  /**
   * Tests isSuccessful method.
   *
   * @covers ::isSuccessful
   * @dataProvider successProvider
   */
  public function testIsSuccessful(bool $frontPageSet, int $blocksConfigured, array $errors, bool $expected): void {
    $result = new HomepageConfigurationResult(
      frontPageSet: $frontPageSet,
      blocksConfigured: $blocksConfigured,
      blocksSkipped: 0,
      errors: $errors
    );

    $this->assertEquals($expected, $result->isSuccessful());
  }

  /**
   * Data provider for success tests.
   */
  public static function successProvider(): array {
    return [
      'front page set' => [TRUE, 0, [], TRUE],
      'blocks configured' => [FALSE, 2, [], TRUE],
      'both set' => [TRUE, 3, [], TRUE],
      'with errors' => [TRUE, 2, ['Error'], FALSE],
      'nothing done' => [FALSE, 0, [], FALSE],
    ];
  }

  /**
   * Tests getTotalConfigured method.
   *
   * @covers ::getTotalConfigured
   * @dataProvider totalConfiguredProvider
   */
  public function testGetTotalConfigured(bool $frontPageSet, int $blocksConfigured, int $expected): void {
    $result = new HomepageConfigurationResult(
      frontPageSet: $frontPageSet,
      blocksConfigured: $blocksConfigured,
      blocksSkipped: 0
    );

    $this->assertEquals($expected, $result->getTotalConfigured());
  }

  /**
   * Data provider for total configured tests.
   */
  public static function totalConfiguredProvider(): array {
    return [
      'only front page' => [TRUE, 0, 1],
      'only blocks' => [FALSE, 3, 3],
      'both' => [TRUE, 3, 4],
      'neither' => [FALSE, 0, 0],
    ];
  }

  /**
   * Tests getSummary method.
   *
   * @covers ::getSummary
   * @dataProvider summaryProvider
   */
  public function testGetSummary(bool $frontPageSet, int $blocksConfigured, int $blocksSkipped, array $errors, string $expected): void {
    $result = new HomepageConfigurationResult(
      frontPageSet: $frontPageSet,
      blocksConfigured: $blocksConfigured,
      blocksSkipped: $blocksSkipped,
      errors: $errors
    );

    $this->assertEquals($expected, $result->getSummary());
  }

  /**
   * Data provider for summary tests.
   */
  public static function summaryProvider(): array {
    return [
      'all components' => [
        TRUE, 3, 1, ['Error 1', 'Error 2'],
        'front page set, 3 blocks configured, 1 blocks skipped, 2 errors',
      ],
      'front page only' => [
        TRUE, 0, 0, [],
        'front page set',
      ],
      'blocks only' => [
        FALSE, 2, 0, [],
        '2 blocks configured',
      ],
      'skipped only' => [
        FALSE, 0, 3, [],
        '3 blocks skipped',
      ],
      'no changes' => [
        FALSE, 0, 0, [],
        'no changes',
      ],
      'front page and blocks' => [
        TRUE, 2, 1, [],
        'front page set, 2 blocks configured, 1 blocks skipped',
      ],
    ];
  }

}
