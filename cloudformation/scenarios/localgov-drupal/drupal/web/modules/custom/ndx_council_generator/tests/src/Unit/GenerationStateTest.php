<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit;

use Drupal\ndx_council_generator\Value\GenerationState;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for GenerationState value object.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Value\GenerationState
 * @group ndx_council_generator
 *
 * Story 5.1: ndx_council_generator Module Foundation
 */
class GenerationStateTest extends TestCase {

  /**
   * Test idle state creation.
   *
   * @covers ::idle
   */
  public function testIdleState(): void {
    $state = GenerationState::idle();

    $this->assertEquals(GenerationState::STATUS_IDLE, $state->status);
    $this->assertNull($state->identity);
    $this->assertEquals(0, $state->currentStep);
    $this->assertEquals(0, $state->totalSteps);
    $this->assertNull($state->currentPhase);
    $this->assertNull($state->lastError);
    $this->assertEquals(0, $state->startedAt);
    $this->assertNull($state->completedAt);
  }

  /**
   * Test progress percentage calculation.
   *
   * @covers ::getProgressPercentage
   */
  public function testProgressPercentage(): void {
    $state = new GenerationState(
      status: GenerationState::STATUS_GENERATING_CONTENT,
      identity: NULL,
      currentStep: 50,
      totalSteps: 100,
      currentPhase: 'Test phase',
      lastError: NULL,
      startedAt: time(),
      completedAt: NULL,
    );

    $this->assertEquals(50, $state->getProgressPercentage());
  }

  /**
   * Test progress percentage with zero total steps.
   *
   * @covers ::getProgressPercentage
   */
  public function testProgressPercentageZeroTotal(): void {
    $state = GenerationState::idle();

    $this->assertEquals(0, $state->getProgressPercentage());
  }

  /**
   * Test isComplete method.
   *
   * @covers ::isComplete
   */
  public function testIsComplete(): void {
    $completeState = GenerationState::idle()->withStatus(GenerationState::STATUS_COMPLETE);
    $inProgressState = GenerationState::idle()->withStatus(GenerationState::STATUS_GENERATING_CONTENT);

    $this->assertTrue($completeState->isComplete());
    $this->assertFalse($inProgressState->isComplete());
  }

  /**
   * Test isInProgress method.
   *
   * @covers ::isInProgress
   */
  public function testIsInProgress(): void {
    $generatingIdentity = GenerationState::idle()->withStatus(GenerationState::STATUS_GENERATING_IDENTITY);
    $generatingContent = GenerationState::idle()->withStatus(GenerationState::STATUS_GENERATING_CONTENT);
    $generatingImages = GenerationState::idle()->withStatus(GenerationState::STATUS_GENERATING_IMAGES);
    $idle = GenerationState::idle();
    $complete = GenerationState::idle()->withStatus(GenerationState::STATUS_COMPLETE);

    $this->assertTrue($generatingIdentity->isInProgress());
    $this->assertTrue($generatingContent->isInProgress());
    $this->assertTrue($generatingImages->isInProgress());
    $this->assertFalse($idle->isInProgress());
    $this->assertFalse($complete->isInProgress());
  }

  /**
   * Test hasError method.
   *
   * @covers ::hasError
   */
  public function testHasError(): void {
    $errorState = GenerationState::idle()->withError('Test error');
    $normalState = GenerationState::idle();

    $this->assertTrue($errorState->hasError());
    $this->assertFalse($normalState->hasError());
  }

  /**
   * Test toArray and fromArray roundtrip.
   *
   * @covers ::toArray
   * @covers ::fromArray
   */
  public function testArrayRoundtrip(): void {
    $original = new GenerationState(
      status: GenerationState::STATUS_GENERATING_CONTENT,
      identity: ['name' => 'Test Council', 'region' => 'South West'],
      currentStep: 25,
      totalSteps: 100,
      currentPhase: 'Creating service pages',
      lastError: NULL,
      startedAt: 1703851200,
      completedAt: NULL,
    );

    $array = $original->toArray();
    $restored = GenerationState::fromArray($array);

    $this->assertEquals($original->status, $restored->status);
    $this->assertEquals($original->identity, $restored->identity);
    $this->assertEquals($original->currentStep, $restored->currentStep);
    $this->assertEquals($original->totalSteps, $restored->totalSteps);
    $this->assertEquals($original->currentPhase, $restored->currentPhase);
    $this->assertEquals($original->lastError, $restored->lastError);
    $this->assertEquals($original->startedAt, $restored->startedAt);
  }

  /**
   * Test withProgress creates new state with updated progress.
   *
   * @covers ::withProgress
   */
  public function testWithProgress(): void {
    $original = GenerationState::idle()
      ->withStatus(GenerationState::STATUS_GENERATING_CONTENT);

    $updated = $original->withProgress(50, 100, 'Halfway done');

    // Original should be unchanged.
    $this->assertEquals(0, $original->currentStep);

    // New state should have updated values.
    $this->assertEquals(50, $updated->currentStep);
    $this->assertEquals(100, $updated->totalSteps);
    $this->assertEquals('Halfway done', $updated->currentPhase);
  }

  /**
   * Test withIdentity creates new state with identity.
   *
   * @covers ::withIdentity
   */
  public function testWithIdentity(): void {
    $identity = ['name' => 'Thornbridge District Council', 'region' => 'Yorkshire'];
    $state = GenerationState::idle()->withIdentity($identity);

    $this->assertEquals($identity, $state->identity);
  }

  /**
   * Test withError creates error state.
   *
   * @covers ::withError
   */
  public function testWithError(): void {
    $state = GenerationState::idle()->withError('Something went wrong');

    $this->assertEquals(GenerationState::STATUS_ERROR, $state->status);
    $this->assertEquals('Something went wrong', $state->lastError);
  }

  /**
   * Test accessible progress text.
   *
   * @covers ::getAccessibleProgressText
   */
  public function testAccessibleProgressText(): void {
    // Idle state.
    $idle = GenerationState::idle();
    $this->assertStringContainsString('not started', $idle->getAccessibleProgressText());

    // In progress.
    $inProgress = new GenerationState(
      status: GenerationState::STATUS_GENERATING_CONTENT,
      identity: NULL,
      currentStep: 25,
      totalSteps: 100,
      currentPhase: 'Creating content',
      lastError: NULL,
      startedAt: time(),
      completedAt: NULL,
    );
    $progressText = $inProgress->getAccessibleProgressText();
    $this->assertStringContainsString('25%', $progressText);
    $this->assertStringContainsString('Creating content', $progressText);

    // Complete.
    $complete = GenerationState::idle()->withStatus(GenerationState::STATUS_COMPLETE);
    $this->assertStringContainsString('complete', $complete->getAccessibleProgressText());

    // Error.
    $error = GenerationState::idle()->withError('Test failure');
    $this->assertStringContainsString('failed', $error->getAccessibleProgressText());
    $this->assertStringContainsString('Test failure', $error->getAccessibleProgressText());
  }

  /**
   * Test all valid statuses are defined.
   *
   * @covers ::VALID_STATUSES
   */
  public function testValidStatuses(): void {
    $this->assertContains(GenerationState::STATUS_IDLE, GenerationState::VALID_STATUSES);
    $this->assertContains(GenerationState::STATUS_GENERATING_IDENTITY, GenerationState::VALID_STATUSES);
    $this->assertContains(GenerationState::STATUS_GENERATING_CONTENT, GenerationState::VALID_STATUSES);
    $this->assertContains(GenerationState::STATUS_GENERATING_IMAGES, GenerationState::VALID_STATUSES);
    $this->assertContains(GenerationState::STATUS_COMPLETE, GenerationState::VALID_STATUSES);
    $this->assertContains(GenerationState::STATUS_ERROR, GenerationState::VALID_STATUSES);
    $this->assertContains(GenerationState::STATUS_PAUSED, GenerationState::VALID_STATUSES);
    $this->assertCount(7, GenerationState::VALID_STATUSES);
  }

}
