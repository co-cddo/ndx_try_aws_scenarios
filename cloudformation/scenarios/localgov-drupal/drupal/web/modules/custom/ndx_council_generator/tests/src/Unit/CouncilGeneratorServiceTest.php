<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Config\ImmutableConfig;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\ndx_aws_ai\Service\BedrockServiceInterface;
use Drupal\ndx_council_generator\Service\CouncilGeneratorService;
use Drupal\ndx_council_generator\Service\CouncilGeneratorServiceInterface;
use Drupal\ndx_council_generator\Service\GenerationStateManagerInterface;
use Drupal\ndx_council_generator\Value\GenerationState;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

/**
 * Unit tests for CouncilGeneratorService.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Service\CouncilGeneratorService
 * @group ndx_council_generator
 *
 * Story 5.1: ndx_council_generator Module Foundation
 */
class CouncilGeneratorServiceTest extends TestCase {

  /**
   * Mock state manager.
   *
   * @var \Drupal\ndx_council_generator\Service\GenerationStateManagerInterface|\PHPUnit\Framework\MockObject\MockObject
   */
  protected $stateManager;

  /**
   * Mock bedrock service.
   *
   * @var \Drupal\ndx_aws_ai\Service\BedrockServiceInterface|\PHPUnit\Framework\MockObject\MockObject
   */
  protected $bedrockService;

  /**
   * Mock entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface|\PHPUnit\Framework\MockObject\MockObject
   */
  protected $entityTypeManager;

  /**
   * Mock logger.
   *
   * @var \Psr\Log\LoggerInterface|\PHPUnit\Framework\MockObject\MockObject
   */
  protected $logger;

  /**
   * Mock config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface|\PHPUnit\Framework\MockObject\MockObject
   */
  protected $configFactory;

  /**
   * The service under test.
   *
   * @var \Drupal\ndx_council_generator\Service\CouncilGeneratorService
   */
  protected CouncilGeneratorService $service;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->stateManager = $this->createMock(GenerationStateManagerInterface::class);
    $this->bedrockService = $this->createMock(BedrockServiceInterface::class);
    $this->entityTypeManager = $this->createMock(EntityTypeManagerInterface::class);
    $this->logger = $this->createMock(LoggerInterface::class);
    $this->configFactory = $this->createMock(ConfigFactoryInterface::class);

    $this->service = new CouncilGeneratorService(
      $this->stateManager,
      $this->bedrockService,
      $this->entityTypeManager,
      $this->logger,
      $this->configFactory,
    );
  }

  /**
   * Test isAvailable returns true when bedrock is available.
   *
   * @covers ::isAvailable
   */
  public function testIsAvailableReturnsTrueWhenBedrockAvailable(): void {
    $this->bedrockService->expects($this->once())
      ->method('isAvailable')
      ->willReturn(TRUE);

    $this->assertTrue($this->service->isAvailable());
  }

  /**
   * Test isAvailable returns false when bedrock is unavailable.
   *
   * @covers ::isAvailable
   */
  public function testIsAvailableReturnsFalseWhenBedrockUnavailable(): void {
    $this->bedrockService->expects($this->once())
      ->method('isAvailable')
      ->willReturn(FALSE);

    $this->assertFalse($this->service->isAvailable());
  }

  /**
   * Test getEstimatedTotalSteps with images.
   *
   * @covers ::getEstimatedTotalSteps
   */
  public function testGetEstimatedTotalStepsWithImages(): void {
    $expected = CouncilGeneratorServiceInterface::IDENTITY_STEPS +
      CouncilGeneratorServiceInterface::CONTENT_STEPS +
      CouncilGeneratorServiceInterface::IMAGE_STEPS;

    // TRUE means include images.
    $this->assertEquals($expected, $this->service->getEstimatedTotalSteps(TRUE));
  }

  /**
   * Test getEstimatedTotalSteps without images.
   *
   * @covers ::getEstimatedTotalSteps
   */
  public function testGetEstimatedTotalStepsWithoutImages(): void {
    $expected = CouncilGeneratorServiceInterface::IDENTITY_STEPS +
      CouncilGeneratorServiceInterface::CONTENT_STEPS;

    // FALSE means skip images.
    $this->assertEquals($expected, $this->service->getEstimatedTotalSteps(FALSE));
  }

  /**
   * Test startGeneration when not available.
   *
   * @covers ::startGeneration
   */
  public function testStartGenerationWhenUnavailable(): void {
    // Must pass the isGenerating check first.
    $this->stateManager->expects($this->once())
      ->method('isGenerating')
      ->willReturn(FALSE);

    $this->bedrockService->expects($this->once())
      ->method('isAvailable')
      ->willReturn(FALSE);

    $this->logger->expects($this->once())
      ->method('error')
      ->with($this->stringContains('AWS services not available'));

    $result = $this->service->startGeneration([]);

    $this->assertFalse($result);
  }

  /**
   * Test startGeneration when already generating.
   *
   * @covers ::startGeneration
   */
  public function testStartGenerationWhenAlreadyGenerating(): void {
    $this->bedrockService->expects($this->once())
      ->method('isAvailable')
      ->willReturn(TRUE);

    $this->stateManager->expects($this->once())
      ->method('isGenerating')
      ->willReturn(TRUE);

    $this->logger->expects($this->once())
      ->method('warning')
      ->with($this->stringContains('already in progress'));

    $result = $this->service->startGeneration([]);

    $this->assertFalse($result);
  }

  /**
   * Test startGeneration success path.
   *
   * @covers ::startGeneration
   */
  public function testStartGenerationSuccess(): void {
    $this->bedrockService->expects($this->once())
      ->method('isAvailable')
      ->willReturn(TRUE);

    $this->stateManager->expects($this->once())
      ->method('isGenerating')
      ->willReturn(FALSE);

    $totalSteps = CouncilGeneratorServiceInterface::IDENTITY_STEPS +
      CouncilGeneratorServiceInterface::CONTENT_STEPS +
      CouncilGeneratorServiceInterface::IMAGE_STEPS;

    $this->stateManager->expects($this->once())
      ->method('startGeneration')
      ->with($totalSteps);

    $this->logger->expects($this->once())
      ->method('info')
      ->with($this->stringContains('started'));

    $result = $this->service->startGeneration([]);

    $this->assertTrue($result);
  }

  /**
   * Test startGeneration with skip_images option.
   *
   * @covers ::startGeneration
   */
  public function testStartGenerationWithSkipImages(): void {
    $this->bedrockService->expects($this->once())
      ->method('isAvailable')
      ->willReturn(TRUE);

    $this->stateManager->expects($this->once())
      ->method('isGenerating')
      ->willReturn(FALSE);

    $totalStepsNoImages = CouncilGeneratorServiceInterface::IDENTITY_STEPS +
      CouncilGeneratorServiceInterface::CONTENT_STEPS;

    $this->stateManager->expects($this->once())
      ->method('startGeneration')
      ->with($totalStepsNoImages);

    // Don't expect specific log since we're testing options flow.
    $this->logger->expects($this->once())
      ->method('info');

    $result = $this->service->startGeneration(['skip_images' => TRUE]);

    $this->assertTrue($result);
  }

  /**
   * Test getProgress delegates to state manager.
   *
   * @covers ::getProgress
   */
  public function testGetProgressDelegatesToStateManager(): void {
    $state = GenerationState::idle();

    $this->stateManager->expects($this->once())
      ->method('getState')
      ->willReturn($state);

    $result = $this->service->getProgress();

    $this->assertSame($state, $result);
  }

  /**
   * Test pauseGeneration when in progress.
   *
   * @covers ::pauseGeneration
   */
  public function testPauseGenerationWhenInProgress(): void {
    $inProgressState = GenerationState::idle()
      ->withStatus(GenerationState::STATUS_GENERATING_CONTENT);

    $this->stateManager->expects($this->once())
      ->method('getState')
      ->willReturn($inProgressState);

    $this->stateManager->expects($this->once())
      ->method('updateStatus')
      ->with(GenerationState::STATUS_PAUSED);

    $this->logger->expects($this->once())
      ->method('info')
      ->with($this->stringContains('paused'));

    $this->service->pauseGeneration();
  }

  /**
   * Test pauseGeneration when not in progress.
   *
   * @covers ::pauseGeneration
   */
  public function testPauseGenerationWhenNotInProgress(): void {
    $idleState = GenerationState::idle();

    $this->stateManager->expects($this->once())
      ->method('getState')
      ->willReturn($idleState);

    $this->stateManager->expects($this->never())
      ->method('updateStatus');

    $this->logger->expects($this->once())
      ->method('warning')
      ->with($this->stringContains('not in progress'));

    $this->service->pauseGeneration();
  }

  /**
   * Test resumeGeneration when paused.
   *
   * @covers ::resumeGeneration
   */
  public function testResumeGenerationWhenPaused(): void {
    // Create a paused state with currentStep=0.
    // Since step < IDENTITY_STEPS (3), resumes to GENERATING_IDENTITY.
    $pausedState = GenerationState::idle()
      ->withStatus(GenerationState::STATUS_PAUSED);

    $this->stateManager->expects($this->once())
      ->method('getState')
      ->willReturn($pausedState);

    // With step=0, should resume to identity generation.
    $this->stateManager->expects($this->once())
      ->method('updateStatus')
      ->with(GenerationState::STATUS_GENERATING_IDENTITY);

    $this->logger->expects($this->once())
      ->method('info')
      ->with($this->stringContains('resumed'));

    $this->service->resumeGeneration();
  }

  /**
   * Test resumeGeneration when not paused.
   *
   * @covers ::resumeGeneration
   */
  public function testResumeGenerationWhenNotPaused(): void {
    $idleState = GenerationState::idle();

    $this->stateManager->expects($this->once())
      ->method('getState')
      ->willReturn($idleState);

    $this->stateManager->expects($this->never())
      ->method('updateStatus');

    $this->logger->expects($this->once())
      ->method('warning')
      ->with($this->stringContains('not paused'));

    $this->service->resumeGeneration();
  }

  /**
   * Test cancelGeneration clears state when in progress.
   *
   * @covers ::cancelGeneration
   */
  public function testCancelGenerationClearsState(): void {
    // Return a non-idle state so cancellation proceeds.
    $inProgressState = GenerationState::idle()
      ->withStatus(GenerationState::STATUS_GENERATING_CONTENT);

    $this->stateManager->expects($this->once())
      ->method('getState')
      ->willReturn($inProgressState);

    $this->stateManager->expects($this->once())
      ->method('clearState');

    $this->logger->expects($this->once())
      ->method('info')
      ->with($this->stringContains('cancelled'));

    $this->service->cancelGeneration();
  }

  /**
   * Test cancelGeneration does nothing when idle.
   *
   * @covers ::cancelGeneration
   */
  public function testCancelGenerationWhenIdle(): void {
    $idleState = GenerationState::idle();

    $this->stateManager->expects($this->once())
      ->method('getState')
      ->willReturn($idleState);

    $this->stateManager->expects($this->never())
      ->method('clearState');

    $this->logger->expects($this->once())
      ->method('info')
      ->with($this->stringContains('Nothing to cancel'));

    $this->service->cancelGeneration();
  }

}
