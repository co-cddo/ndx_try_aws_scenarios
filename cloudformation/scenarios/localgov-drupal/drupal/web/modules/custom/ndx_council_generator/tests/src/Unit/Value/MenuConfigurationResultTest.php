<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit\Value;

use Drupal\ndx_council_generator\Value\MenuConfigurationResult;
use PHPUnit\Framework\TestCase;

/**
 * Tests for MenuConfigurationResult value object.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Value\MenuConfigurationResult
 * @group ndx_council_generator
 */
class MenuConfigurationResultTest extends TestCase {

  /**
   * Tests basic construction.
   *
   * @covers ::__construct
   */
  public function testConstruction(): void {
    $result = new MenuConfigurationResult(3, 5, 2, ['Error 1']);

    $this->assertEquals(3, $result->mainLinksCreated);
    $this->assertEquals(5, $result->categoryLinksCreated);
    $this->assertEquals(2, $result->linksSkipped);
    $this->assertEquals(['Error 1'], $result->errors);
  }

  /**
   * Tests getTotalCreated method.
   *
   * @covers ::getTotalCreated
   */
  public function testGetTotalCreated(): void {
    $result = new MenuConfigurationResult(4, 6, 0);

    $this->assertEquals(10, $result->getTotalCreated());
  }

  /**
   * Tests hasErrors method.
   *
   * @covers ::hasErrors
   */
  public function testHasErrors(): void {
    $noErrors = new MenuConfigurationResult(1, 2, 0);
    $withErrors = new MenuConfigurationResult(1, 2, 0, ['Something went wrong']);

    $this->assertFalse($noErrors->hasErrors());
    $this->assertTrue($withErrors->hasErrors());
  }

  /**
   * Tests isSuccessful method.
   *
   * @covers ::isSuccessful
   */
  public function testIsSuccessful(): void {
    $successful = new MenuConfigurationResult(3, 2, 0);
    $skippedOnly = new MenuConfigurationResult(0, 0, 5);
    $empty = new MenuConfigurationResult(0, 0, 0);

    $this->assertTrue($successful->isSuccessful());
    $this->assertTrue($skippedOnly->isSuccessful());
    $this->assertFalse($empty->isSuccessful());
  }

  /**
   * Tests getSummaryText method.
   *
   * @covers ::getSummaryText
   * @dataProvider summaryTextProvider
   */
  public function testGetSummaryText(int $main, int $categories, int $skipped, array $errors, string $expected): void {
    $result = new MenuConfigurationResult($main, $categories, $skipped, $errors);

    $this->assertEquals($expected, $result->getSummaryText());
  }

  /**
   * Data provider for summary text tests.
   */
  public static function summaryTextProvider(): array {
    return [
      'all counts' => [
        3, 5, 2, ['Error'],
        '3 main links, 5 category links, 2 skipped, 1 errors',
      ],
      'main and categories only' => [
        4, 6, 0, [],
        '4 main links, 6 category links',
      ],
      'skipped only' => [
        0, 0, 10, [],
        '10 skipped',
      ],
      'no changes' => [
        0, 0, 0, [],
        'No changes',
      ],
      'main links only' => [
        2, 0, 0, [],
        '2 main links',
      ],
    ];
  }

  /**
   * Tests success factory method.
   *
   * @covers ::success
   */
  public function testSuccessFactory(): void {
    $result = MenuConfigurationResult::success(4, 8, 2);

    $this->assertEquals(4, $result->mainLinksCreated);
    $this->assertEquals(8, $result->categoryLinksCreated);
    $this->assertEquals(2, $result->linksSkipped);
    $this->assertEmpty($result->errors);
    $this->assertFalse($result->hasErrors());
  }

  /**
   * Tests failure factory method.
   *
   * @covers ::failure
   */
  public function testFailureFactory(): void {
    $result = MenuConfigurationResult::failure('Database error');

    $this->assertEquals(0, $result->mainLinksCreated);
    $this->assertEquals(0, $result->categoryLinksCreated);
    $this->assertEquals(0, $result->linksSkipped);
    $this->assertEquals(['Database error'], $result->errors);
    $this->assertTrue($result->hasErrors());
  }

}
