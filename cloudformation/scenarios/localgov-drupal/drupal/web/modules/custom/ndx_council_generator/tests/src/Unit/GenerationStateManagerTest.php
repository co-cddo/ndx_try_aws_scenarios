<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit;

use Drupal\Core\State\StateInterface;
use Drupal\ndx_council_generator\Service\GenerationStateManager;
use Drupal\ndx_council_generator\Service\GenerationStateManagerInterface;
use Drupal\ndx_council_generator\Value\GenerationState;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

/**
 * Unit tests for GenerationStateManager service.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Service\GenerationStateManager
 * @group ndx_council_generator
 *
 * Story 5.1: ndx_council_generator Module Foundation
 */
class GenerationStateManagerTest extends TestCase {

  /**
   * Mock state service.
   *
   * @var \Drupal\Core\State\StateInterface|\PHPUnit\Framework\MockObject\MockObject
   */
  protected $state;

  /**
   * Mock logger.
   *
   * @var \Psr\Log\LoggerInterface|\PHPUnit\Framework\MockObject\MockObject
   */
  protected $logger;

  /**
   * The state manager under test.
   *
   * @var \Drupal\ndx_council_generator\Service\GenerationStateManager
   */
  protected GenerationStateManager $stateManager;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->state = $this->createMock(StateInterface::class);
    $this->logger = $this->createMock(LoggerInterface::class);

    $this->stateManager = new GenerationStateManager(
      $this->state,
      $this->logger,
    );
  }

  /**
   * Test getState returns idle state when no state stored.
   *
   * @covers ::getState
   */
  public function testGetStateReturnsIdleWhenEmpty(): void {
    $this->state->expects($this->once())
      ->method('get')
      ->with(GenerationStateManagerInterface::STATE_KEY, NULL)
      ->willReturn(NULL);

    $state = $this->stateManager->getState();

    $this->assertEquals(GenerationState::STATUS_IDLE, $state->status);
    $this->assertNull($state->identity);
  }

  /**
   * Test getState restores stored state.
   *
   * @covers ::getState
   */
  public function testGetStateRestoresStoredState(): void {
    $storedData = [
      'status' => GenerationState::STATUS_GENERATING_CONTENT,
      'identity' => ['name' => 'Test Council'],
      'currentStep' => 50,
      'totalSteps' => 100,
      'currentPhase' => 'Creating pages',
      'lastError' => NULL,
      'startedAt' => 1703851200,
      'completedAt' => NULL,
    ];

    $this->state->expects($this->once())
      ->method('get')
      ->with(GenerationStateManagerInterface::STATE_KEY, NULL)
      ->willReturn($storedData);

    $state = $this->stateManager->getState();

    $this->assertEquals(GenerationState::STATUS_GENERATING_CONTENT, $state->status);
    $this->assertEquals(['name' => 'Test Council'], $state->identity);
    $this->assertEquals(50, $state->currentStep);
    $this->assertEquals(100, $state->totalSteps);
  }

  /**
   * Test saveState persists to state storage.
   *
   * @covers ::saveState
   */
  public function testSaveStatePersistsState(): void {
    $state = new GenerationState(
      status: GenerationState::STATUS_GENERATING_CONTENT,
      identity: ['name' => 'Test Council'],
      currentStep: 25,
      totalSteps: 100,
      currentPhase: 'Testing',
      lastError: NULL,
      startedAt: time(),
      completedAt: NULL,
    );

    $this->state->expects($this->once())
      ->method('set')
      ->with(
        GenerationStateManagerInterface::STATE_KEY,
        $this->callback(function ($data) {
          return $data['status'] === GenerationState::STATUS_GENERATING_CONTENT
            && $data['identity'] === ['name' => 'Test Council']
            && $data['currentStep'] === 25;
        })
      );

    $this->stateManager->saveState($state);
  }

  /**
   * Test clearState removes stored state.
   *
   * @covers ::clearState
   */
  public function testClearStateRemovesState(): void {
    $this->state->expects($this->once())
      ->method('delete')
      ->with(GenerationStateManagerInterface::STATE_KEY);

    $this->logger->expects($this->once())
      ->method('info')
      ->with($this->stringContains('cleared'));

    $this->stateManager->clearState();
  }

  /**
   * Test updateProgress updates step and phase.
   *
   * @covers ::updateProgress
   */
  public function testUpdateProgressUpdatesState(): void {
    // First call to get existing state.
    $this->state->expects($this->once())
      ->method('get')
      ->with(GenerationStateManagerInterface::STATE_KEY, NULL)
      ->willReturn(NULL);

    // Should save updated state.
    $this->state->expects($this->once())
      ->method('set')
      ->with(
        GenerationStateManagerInterface::STATE_KEY,
        $this->callback(function ($data) {
          return $data['currentStep'] === 50
            && $data['totalSteps'] === 100
            && $data['currentPhase'] === 'Testing progress';
        })
      );

    $this->stateManager->updateProgress(50, 100, 'Testing progress');
  }

  /**
   * Test updateStatus changes status.
   *
   * @covers ::updateStatus
   */
  public function testUpdateStatusChangesStatus(): void {
    $this->state->expects($this->once())
      ->method('get')
      ->with(GenerationStateManagerInterface::STATE_KEY, NULL)
      ->willReturn(NULL);

    $this->state->expects($this->once())
      ->method('set')
      ->with(
        GenerationStateManagerInterface::STATE_KEY,
        $this->callback(function ($data) {
          return $data['status'] === GenerationState::STATUS_GENERATING_IMAGES;
        })
      );

    $this->stateManager->updateStatus(GenerationState::STATUS_GENERATING_IMAGES);
  }

  /**
   * Test setError sets error state.
   *
   * @covers ::setError
   */
  public function testSetErrorSetsErrorState(): void {
    $this->state->expects($this->once())
      ->method('get')
      ->with(GenerationStateManagerInterface::STATE_KEY, NULL)
      ->willReturn(NULL);

    $this->state->expects($this->once())
      ->method('set')
      ->with(
        GenerationStateManagerInterface::STATE_KEY,
        $this->callback(function ($data) {
          return $data['status'] === GenerationState::STATUS_ERROR
            && $data['lastError'] === 'Test error message';
        })
      );

    $this->logger->expects($this->once())
      ->method('error')
      ->with($this->stringContains('Test error message'));

    $this->stateManager->setError('Test error message');
  }

  /**
   * Test markComplete sets complete status.
   *
   * @covers ::markComplete
   */
  public function testMarkCompleteSetsCompleteStatus(): void {
    $this->state->expects($this->once())
      ->method('get')
      ->with(GenerationStateManagerInterface::STATE_KEY, NULL)
      ->willReturn(NULL);

    $this->state->expects($this->once())
      ->method('set')
      ->with(
        GenerationStateManagerInterface::STATE_KEY,
        $this->callback(function ($data) {
          return $data['status'] === GenerationState::STATUS_COMPLETE
            && $data['completedAt'] !== NULL;
        })
      );

    $this->logger->expects($this->once())
      ->method('info')
      ->with($this->stringContains('completed'));

    $this->stateManager->markComplete();
  }

  /**
   * Test isGenerating returns correct values.
   *
   * @covers ::isGenerating
   */
  public function testIsGeneratingReturnsCorrectValues(): void {
    // Test when generating.
    $this->state->expects($this->exactly(2))
      ->method('get')
      ->with(GenerationStateManagerInterface::STATE_KEY, NULL)
      ->willReturnOnConsecutiveCalls(
        ['status' => GenerationState::STATUS_GENERATING_CONTENT],
        ['status' => GenerationState::STATUS_IDLE]
      );

    $this->assertTrue($this->stateManager->isGenerating());

    // Reset state manager for second test.
    $this->stateManager = new GenerationStateManager($this->state, $this->logger);
    $this->assertFalse($this->stateManager->isGenerating());
  }

  /**
   * Test startGeneration initializes state correctly.
   *
   * @covers ::startGeneration
   */
  public function testStartGenerationInitializesState(): void {
    $this->state->expects($this->once())
      ->method('set')
      ->with(
        GenerationStateManagerInterface::STATE_KEY,
        $this->callback(function ($data) {
          return $data['status'] === GenerationState::STATUS_GENERATING_IDENTITY
            && $data['totalSteps'] === 173
            && $data['startedAt'] !== NULL;
        })
      );

    $this->logger->expects($this->once())
      ->method('info')
      ->with($this->stringContains('started'));

    $this->stateManager->startGeneration(173);
  }

  /**
   * Test setIdentity stores identity data.
   *
   * @covers ::setIdentity
   */
  public function testSetIdentityStoresData(): void {
    $identity = ['name' => 'Thornbridge Council', 'region' => 'Yorkshire'];

    $this->state->expects($this->once())
      ->method('get')
      ->with(GenerationStateManagerInterface::STATE_KEY, NULL)
      ->willReturn(NULL);

    $this->state->expects($this->once())
      ->method('set')
      ->with(
        GenerationStateManagerInterface::STATE_KEY,
        $this->callback(function ($data) use ($identity) {
          return $data['identity'] === $identity;
        })
      );

    $this->stateManager->setIdentity($identity);
  }

}
