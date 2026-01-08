<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_aws_ai\Unit;

use Drupal\Core\Entity\EntityStorageInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\file\FileInterface;
use Drupal\ndx_aws_ai\Controller\PdfConversionController;
use Drupal\ndx_aws_ai\Service\PdfConversionServiceInterface;
use PHPUnit\Framework\TestCase;
use Prophecy\Argument;
use Prophecy\PhpUnit\ProphecyTrait;
use Symfony\Component\HttpFoundation\Request;

/**
 * Unit tests for PdfConversionController.
 *
 * @coversDefaultClass \Drupal\ndx_aws_ai\Controller\PdfConversionController
 * @group ndx_aws_ai
 *
 * Story 4.8: PDF-to-Web Conversion
 */
class PdfConversionControllerTest extends TestCase {

  use ProphecyTrait;

  /**
   * The mocked conversion service.
   *
   * @var \Drupal\ndx_aws_ai\Service\PdfConversionServiceInterface|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $conversionService;

  /**
   * The mocked entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $entityTypeManager;

  /**
   * The mocked file storage.
   *
   * @var \Drupal\Core\Entity\EntityStorageInterface|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $fileStorage;

  /**
   * The mocked logger.
   *
   * @var \Drupal\Core\Logger\LoggerChannelInterface|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $logger;

  /**
   * The controller under test.
   *
   * @var \Drupal\ndx_aws_ai\Controller\PdfConversionController
   */
  protected PdfConversionController $controller;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->conversionService = $this->prophesize(PdfConversionServiceInterface::class);
    $this->entityTypeManager = $this->prophesize(EntityTypeManagerInterface::class);
    $this->fileStorage = $this->prophesize(EntityStorageInterface::class);
    $this->logger = $this->prophesize(LoggerChannelInterface::class);

    // Set up default behaviors.
    $this->logger->info(Argument::any(), Argument::any())->willReturn(NULL);
    $this->logger->error(Argument::any(), Argument::any())->willReturn(NULL);
    $this->entityTypeManager->getStorage('file')->willReturn($this->fileStorage->reveal());
    $this->conversionService->isAvailable()->willReturn(TRUE);

    $this->controller = new PdfConversionController(
      $this->conversionService->reveal(),
      $this->entityTypeManager->reveal(),
      $this->logger->reveal(),
    );
  }

  /**
   * Test successful conversion start.
   *
   * @covers ::convert
   */
  public function testConvertSuccess(): void {
    $fileId = 123;
    $jobId = 'pdf_123_abc123';

    // Mock file entity.
    $file = $this->prophesize(FileInterface::class);
    $file->getMimeType()->willReturn('application/pdf');
    $file->getSize()->willReturn(1024 * 1024); // 1MB.
    $file->getFilename()->willReturn('test.pdf');

    $this->fileStorage->load($fileId)->willReturn($file->reveal());
    $this->conversionService->startConversion($fileId)->willReturn($jobId);

    $request = Request::create('/api/ndx-ai/pdf/convert', 'POST', [], [], [], [], json_encode([
      'file_id' => $fileId,
    ]));

    $response = $this->controller->convert($request);

    $this->assertEquals(200, $response->getStatusCode());

    $data = json_decode($response->getContent(), TRUE);
    $this->assertTrue($data['success']);
    $this->assertEquals($jobId, $data['jobId']);
    $this->assertArrayHasKey('statusUrl', $data);
  }

  /**
   * Test conversion with missing file_id.
   *
   * @covers ::convert
   */
  public function testConvertMissingFileId(): void {
    $request = Request::create('/api/ndx-ai/pdf/convert', 'POST', [], [], [], [], json_encode([
      // No file_id.
    ]));

    $response = $this->controller->convert($request);

    $this->assertEquals(400, $response->getStatusCode());

    $data = json_decode($response->getContent(), TRUE);
    $this->assertFalse($data['success']);
    $this->assertStringContainsString('file_id', $data['error']);
  }

  /**
   * Test conversion with file not found.
   *
   * @covers ::convert
   */
  public function testConvertFileNotFound(): void {
    $fileId = 999;

    $this->fileStorage->load($fileId)->willReturn(NULL);

    $request = Request::create('/api/ndx-ai/pdf/convert', 'POST', [], [], [], [], json_encode([
      'file_id' => $fileId,
    ]));

    $response = $this->controller->convert($request);

    $this->assertEquals(404, $response->getStatusCode());

    $data = json_decode($response->getContent(), TRUE);
    $this->assertFalse($data['success']);
    $this->assertStringContainsString('not found', $data['error']);
  }

  /**
   * Test conversion with non-PDF file.
   *
   * @covers ::convert
   */
  public function testConvertNonPdfFile(): void {
    $fileId = 123;

    // Mock file entity with wrong MIME type.
    $file = $this->prophesize(FileInterface::class);
    $file->getMimeType()->willReturn('image/jpeg');

    $this->fileStorage->load($fileId)->willReturn($file->reveal());

    $request = Request::create('/api/ndx-ai/pdf/convert', 'POST', [], [], [], [], json_encode([
      'file_id' => $fileId,
    ]));

    $response = $this->controller->convert($request);

    $this->assertEquals(400, $response->getStatusCode());

    $data = json_decode($response->getContent(), TRUE);
    $this->assertFalse($data['success']);
    $this->assertStringContainsString('PDF', $data['error']);
  }

  /**
   * Test conversion with file too large.
   *
   * @covers ::convert
   */
  public function testConvertFileTooLarge(): void {
    $fileId = 123;

    // Mock file entity with large size.
    $file = $this->prophesize(FileInterface::class);
    $file->getMimeType()->willReturn('application/pdf');
    $file->getSize()->willReturn(10 * 1024 * 1024); // 10MB.

    $this->fileStorage->load($fileId)->willReturn($file->reveal());

    $request = Request::create('/api/ndx-ai/pdf/convert', 'POST', [], [], [], [], json_encode([
      'file_id' => $fileId,
    ]));

    $response = $this->controller->convert($request);

    $this->assertEquals(413, $response->getStatusCode());

    $data = json_decode($response->getContent(), TRUE);
    $this->assertFalse($data['success']);
    $this->assertStringContainsString('large', $data['error']);
  }

  /**
   * Test conversion when service unavailable.
   *
   * @covers ::convert
   */
  public function testConvertServiceUnavailable(): void {
    $this->conversionService->isAvailable()->willReturn(FALSE);

    $request = Request::create('/api/ndx-ai/pdf/convert', 'POST', [], [], [], [], json_encode([
      'file_id' => 123,
    ]));

    $response = $this->controller->convert($request);

    $this->assertEquals(503, $response->getStatusCode());

    $data = json_decode($response->getContent(), TRUE);
    $this->assertFalse($data['success']);
    $this->assertStringContainsString('not available', $data['error']);
  }

  /**
   * Test status endpoint with valid job.
   *
   * @covers ::status
   */
  public function testStatusSuccess(): void {
    $jobId = 'pdf_123_abc123';

    $this->conversionService->getStatus($jobId)->willReturn([
      'status' => PdfConversionServiceInterface::STATUS_COMPLETE,
      'step' => 'Conversion complete',
      'progress' => 100,
      'result' => ['html' => '<p>Test</p>'],
      'error' => NULL,
    ]);

    $response = $this->controller->status($jobId);

    $this->assertEquals(200, $response->getStatusCode());

    $data = json_decode($response->getContent(), TRUE);
    $this->assertTrue($data['success']);
    $this->assertEquals('complete', $data['status']);
    $this->assertEquals(100, $data['progress']);
    $this->assertNotNull($data['result']);
  }

  /**
   * Test status with invalid job ID format.
   *
   * @covers ::status
   */
  public function testStatusInvalidJobId(): void {
    $response = $this->controller->status('invalid-job-id');

    $this->assertEquals(400, $response->getStatusCode());

    $data = json_decode($response->getContent(), TRUE);
    $this->assertFalse($data['success']);
    $this->assertStringContainsString('Invalid', $data['error']);
  }

  /**
   * Test availability check.
   *
   * @covers ::checkAvailability
   */
  public function testCheckAvailability(): void {
    $this->conversionService->isAvailable()->willReturn(TRUE);

    $response = $this->controller->checkAvailability();

    $this->assertEquals(200, $response->getStatusCode());

    $data = json_decode($response->getContent(), TRUE);
    $this->assertTrue($data['available']);
    $this->assertArrayHasKey('maxFileSize', $data);
    $this->assertArrayHasKey('maxFileSizeMb', $data);
  }

}
