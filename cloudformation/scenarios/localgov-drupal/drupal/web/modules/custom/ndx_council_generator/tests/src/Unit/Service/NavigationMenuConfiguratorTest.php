<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit\Service;

use Drupal\Core\Entity\EntityStorageInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Entity\Query\QueryInterface;
use Drupal\ndx_council_generator\Service\NavigationMenuConfigurator;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

/**
 * Tests for NavigationMenuConfigurator service.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Service\NavigationMenuConfigurator
 * @group ndx_council_generator
 */
class NavigationMenuConfiguratorTest extends TestCase {

  /**
   * Mock entity type manager.
   */
  protected EntityTypeManagerInterface $entityTypeManager;

  /**
   * Mock logger.
   */
  protected LoggerInterface $logger;

  /**
   * Test identity.
   */
  protected CouncilIdentity $identity;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->entityTypeManager = $this->createMock(EntityTypeManagerInterface::class);
    $this->logger = $this->createMock(LoggerInterface::class);

    // Create a test identity.
    $this->identity = new CouncilIdentity(
      name: 'Test Borough Council',
      region: 'south_east',
      theme: 'coastal',
      population: 'medium',
      populationEstimate: 150000,
      characteristics: ['coastal', 'tourism'],
      councilType: 'borough',
      establishedYear: 1974,
    );
  }

  /**
   * Tests that menuLinkExists returns false when no links exist.
   *
   * @covers ::menuLinkExists
   */
  public function testMenuLinkExistsReturnsFalseWhenNoneExist(): void {
    $storage = $this->createMock(EntityStorageInterface::class);
    $storage->expects($this->once())
      ->method('loadByProperties')
      ->with([
        'title' => 'Services',
        'menu_name' => 'main',
      ])
      ->willReturn([]);

    $this->entityTypeManager->expects($this->once())
      ->method('getStorage')
      ->with('menu_link_content')
      ->willReturn($storage);

    $service = new NavigationMenuConfigurator($this->entityTypeManager, $this->logger);
    $result = $service->menuLinkExists('Services', 'main');

    $this->assertFalse($result);
  }

  /**
   * Tests that menuLinkExists returns true when link exists.
   *
   * @covers ::menuLinkExists
   */
  public function testMenuLinkExistsReturnsTrueWhenExists(): void {
    $mockLink = $this->createMock(\Drupal\menu_link_content\Entity\MenuLinkContent::class);
    $storage = $this->createMock(EntityStorageInterface::class);
    $storage->expects($this->once())
      ->method('loadByProperties')
      ->willReturn([$mockLink]);

    $this->entityTypeManager->expects($this->once())
      ->method('getStorage')
      ->with('menu_link_content')
      ->willReturn($storage);

    $service = new NavigationMenuConfigurator($this->entityTypeManager, $this->logger);
    $result = $service->menuLinkExists('Services', 'main');

    $this->assertTrue($result);
  }

  /**
   * Tests that menuLinkExists checks parent when provided.
   *
   * @covers ::menuLinkExists
   */
  public function testMenuLinkExistsWithParent(): void {
    $storage = $this->createMock(EntityStorageInterface::class);
    $storage->expects($this->once())
      ->method('loadByProperties')
      ->with([
        'title' => 'Waste Services',
        'menu_name' => 'main',
        'parent' => 'menu_link_content:abc-123',
      ])
      ->willReturn([]);

    $this->entityTypeManager->expects($this->once())
      ->method('getStorage')
      ->with('menu_link_content')
      ->willReturn($storage);

    $service = new NavigationMenuConfigurator($this->entityTypeManager, $this->logger);
    $result = $service->menuLinkExists('Waste Services', 'main', 'menu_link_content:abc-123');

    $this->assertFalse($result);
  }

  /**
   * Tests clearGeneratedMenuLinks only deletes links with GENERATOR_MARKER.
   *
   * @covers ::clearGeneratedMenuLinks
   */
  public function testClearGeneratedMenuLinks(): void {
    // Link with generator marker - should be deleted.
    $mockLink1 = $this->createMock(\Drupal\menu_link_content\Entity\MenuLinkContent::class);
    $mockLink1->expects($this->once())
      ->method('getDescription')
      ->willReturn('[ndx_generated] Council services');
    $mockLink1->expects($this->once())
      ->method('getTitle')
      ->willReturn('Services');
    $mockLink1->expects($this->once())->method('delete');

    // Link without generator marker - should NOT be deleted.
    $mockLink2 = $this->createMock(\Drupal\menu_link_content\Entity\MenuLinkContent::class);
    $mockLink2->expects($this->once())
      ->method('getDescription')
      ->willReturn('User created link');
    $mockLink2->expects($this->never())->method('delete');

    // Another link with generator marker - should be deleted.
    $mockLink3 = $this->createMock(\Drupal\menu_link_content\Entity\MenuLinkContent::class);
    $mockLink3->expects($this->once())
      ->method('getDescription')
      ->willReturn('[ndx_generated] News section');
    $mockLink3->expects($this->once())
      ->method('getTitle')
      ->willReturn('News');
    $mockLink3->expects($this->once())->method('delete');

    $storage = $this->createMock(EntityStorageInterface::class);
    $storage->expects($this->once())
      ->method('loadByProperties')
      ->with(['menu_name' => 'main'])
      ->willReturn([$mockLink1, $mockLink2, $mockLink3]);

    $this->entityTypeManager->expects($this->once())
      ->method('getStorage')
      ->with('menu_link_content')
      ->willReturn($storage);

    $this->logger->expects($this->once())
      ->method('info')
      ->with('Cleared @count generated menu links from main menu', ['@count' => 2]);

    $service = new NavigationMenuConfigurator($this->entityTypeManager, $this->logger);
    $result = $service->clearGeneratedMenuLinks();

    // Only 2 links should be deleted (the ones with generator marker).
    $this->assertEquals(2, $result);
  }

  /**
   * Tests createServiceCategoryLinks with no service landing pages.
   *
   * @covers ::createServiceCategoryLinks
   */
  public function testCreateServiceCategoryLinksWithNoNodes(): void {
    $query = $this->createMock(QueryInterface::class);
    $query->expects($this->once())->method('condition')->willReturnSelf();
    $query->expects($this->once())->method('accessCheck')->willReturnSelf();
    $query->expects($this->once())->method('sort')->willReturnSelf();
    $query->expects($this->once())->method('execute')->willReturn([]);

    $nodeStorage = $this->createMock(EntityStorageInterface::class);
    $nodeStorage->expects($this->once())
      ->method('getQuery')
      ->willReturn($query);

    $this->entityTypeManager->expects($this->once())
      ->method('getStorage')
      ->with('node')
      ->willReturn($nodeStorage);

    $this->logger->expects($this->once())
      ->method('debug')
      ->with('No service landing pages found for category links');

    $service = new NavigationMenuConfigurator($this->entityTypeManager, $this->logger);
    $result = $service->createServiceCategoryLinks('abc-uuid-123', $this->identity);

    $this->assertEquals(0, $result);
  }

}
