<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_aws_ai\Unit;

use Aws\Result;
use Aws\Textract\TextractClient;
use Drupal\ndx_aws_ai\RateLimiter\TextractRateLimiter;
use Drupal\ndx_aws_ai\Result\TextractResult;
use Drupal\ndx_aws_ai\Service\AwsClientFactory;
use Drupal\ndx_aws_ai\Service\AwsErrorHandler;
use Drupal\ndx_aws_ai\Service\TextractService;
use Drupal\ndx_aws_ai\Service\TextractServiceInterface;
use PHPUnit\Framework\TestCase;
use Prophecy\Argument;
use Prophecy\PhpUnit\ProphecyTrait;

/**
 * Unit tests for TextractService.
 *
 * @coversDefaultClass \Drupal\ndx_aws_ai\Service\TextractService
 * @group ndx_aws_ai
 *
 * Story 4.4: Textract Service Integration
 */
class TextractServiceTest extends TestCase {

  use ProphecyTrait;

  /**
   * The mocked Textract client.
   *
   * @var \Aws\Textract\TextractClient|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $textractClient;

  /**
   * The mocked client factory.
   *
   * @var \Drupal\ndx_aws_ai\Service\AwsClientFactory|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $clientFactory;

  /**
   * The mocked error handler.
   *
   * @var \Drupal\ndx_aws_ai\Service\AwsErrorHandler|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $errorHandler;

  /**
   * The mocked rate limiter.
   *
   * @var \Drupal\ndx_aws_ai\RateLimiter\TextractRateLimiter|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $rateLimiter;

  /**
   * The service under test.
   *
   * @var \Drupal\ndx_aws_ai\Service\TextractService
   */
  protected TextractService $service;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->textractClient = $this->prophesize(TextractClient::class);
    $this->clientFactory = $this->prophesize(AwsClientFactory::class);
    $this->errorHandler = $this->prophesize(AwsErrorHandler::class);
    $this->rateLimiter = $this->prophesize(TextractRateLimiter::class);

    // Configure client factory to return mocked Textract client.
    $this->clientFactory->getTextractClient()
      ->willReturn($this->textractClient->reveal());

    // Configure rate limiter defaults.
    $this->rateLimiter->waitIfNeeded()->willReturn(NULL);
    $this->rateLimiter->recordSuccess()->willReturn(NULL);
    $this->rateLimiter->getMaxRetries()->willReturn(3);

    $this->service = new TextractService(
      $this->clientFactory->reveal(),
      $this->errorHandler->reveal(),
      $this->rateLimiter->reveal(),
    );
  }

  /**
   * Test successful text detection.
   *
   * @covers ::detectDocumentText
   */
  public function testDetectDocumentTextSuccess(): void {
    $documentData = 'fake-pdf-data';
    $mimeType = 'application/pdf';

    $blocks = $this->getSampleTextBlocks();

    $this->errorHandler->logOperation('Textract', 'detectDocumentText', Argument::that(function ($arg) {
      return $arg['lineCount'] === 3
        && $arg['pageCount'] === 1
        && isset($arg['averageConfidence'])
        && isset($arg['processingTimeMs']);
    }))->shouldBeCalled();

    $this->textractClient->detectDocumentText([
      'Document' => ['Bytes' => $documentData],
    ])->willReturn(new Result(['Blocks' => $blocks]));

    $result = $this->service->detectDocumentText($documentData, $mimeType);

    $this->assertInstanceOf(TextractResult::class, $result);
    $this->assertTrue($result->isSuccess());
    $this->assertEquals(1, $result->pageCount);
    $this->assertCount(3, $result->lines);
    $this->assertStringContainsString('Planning Application', $result->rawText);
    $this->assertGreaterThan(0, $result->processingTimeMs);
  }

  /**
   * Test successful document analysis with tables and forms.
   *
   * @covers ::analyzeDocument
   */
  public function testAnalyzeDocumentSuccess(): void {
    $documentData = 'fake-pdf-data';
    $mimeType = 'application/pdf';

    $blocks = $this->getSampleAnalysisBlocks();

    $this->errorHandler->logOperation('Textract', 'analyzeDocument', Argument::that(function ($arg) {
      return isset($arg['lineCount'])
        && isset($arg['tableCount'])
        && isset($arg['keyValueCount'])
        && $arg['featureTypes'] === ['TABLES', 'FORMS']
        && isset($arg['processingTimeMs']);
    }))->shouldBeCalled();

    $this->textractClient->analyzeDocument([
      'Document' => ['Bytes' => $documentData],
      'FeatureTypes' => ['TABLES', 'FORMS'],
    ])->willReturn(new Result(['Blocks' => $blocks]));

    $result = $this->service->analyzeDocument($documentData, $mimeType);

    $this->assertInstanceOf(TextractResult::class, $result);
    $this->assertTrue($result->isSuccess());
    $this->assertFalse($result->hasTables());
    $this->assertFalse($result->hasKeyValues());
  }

  /**
   * Test start async document analysis.
   *
   * @covers ::startDocumentAnalysis
   */
  public function testStartDocumentAnalysisSuccess(): void {
    $s3Bucket = 'my-bucket';
    $s3Key = 'documents/test.pdf';
    $jobId = 'abc123def456';

    $this->errorHandler->logOperation('Textract', 'startDocumentAnalysis', Argument::that(function ($arg) use ($s3Bucket, $s3Key, $jobId) {
      return $arg['jobId'] === $jobId
        && $arg['s3Bucket'] === $s3Bucket
        && $arg['s3Key'] === $s3Key
        && isset($arg['processingTimeMs']);
    }))->shouldBeCalled();

    $this->textractClient->startDocumentAnalysis([
      'DocumentLocation' => [
        'S3Object' => [
          'Bucket' => $s3Bucket,
          'Name' => $s3Key,
        ],
      ],
      'FeatureTypes' => ['TABLES', 'FORMS'],
    ])->willReturn(new Result(['JobId' => $jobId]));

    $result = $this->service->startDocumentAnalysis($s3Bucket, $s3Key);

    $this->assertEquals($jobId, $result);
  }

  /**
   * Test get async document analysis results.
   *
   * @covers ::getDocumentAnalysis
   */
  public function testGetDocumentAnalysisSuccess(): void {
    $jobId = 'abc123def456';
    $blocks = $this->getSampleTextBlocks();

    $this->errorHandler->logOperation('Textract', 'getDocumentAnalysis', Argument::that(function ($arg) use ($jobId) {
      return $arg['jobId'] === $jobId
        && $arg['jobStatus'] === 'SUCCEEDED'
        && isset($arg['processingTimeMs']);
    }))->shouldBeCalled();

    $this->textractClient->getDocumentAnalysis([
      'JobId' => $jobId,
    ])->willReturn(new Result([
      'JobStatus' => 'SUCCEEDED',
      'Blocks' => $blocks,
    ]));

    $result = $this->service->getDocumentAnalysis($jobId);

    $this->assertInstanceOf(TextractResult::class, $result);
    $this->assertTrue($result->isSuccess());
    $this->assertEquals($jobId, $result->jobId);
    $this->assertEquals('SUCCEEDED', $result->jobStatus);
  }

  /**
   * Test get async document analysis in progress.
   *
   * @covers ::getDocumentAnalysis
   */
  public function testGetDocumentAnalysisInProgress(): void {
    $jobId = 'abc123def456';

    $this->errorHandler->logOperation('Textract', 'getDocumentAnalysis', Argument::that(function ($arg) use ($jobId) {
      return $arg['jobId'] === $jobId
        && $arg['jobStatus'] === 'IN_PROGRESS';
    }))->shouldBeCalled();

    $this->textractClient->getDocumentAnalysis([
      'JobId' => $jobId,
    ])->willReturn(new Result([
      'JobStatus' => 'IN_PROGRESS',
      'Blocks' => [],
    ]));

    $result = $this->service->getDocumentAnalysis($jobId);

    $this->assertTrue($result->isInProgress());
    $this->assertFalse($result->isSuccess());
    $this->assertEquals('IN_PROGRESS', $result->jobStatus);
  }

  /**
   * Test unsupported format throws exception.
   *
   * @covers ::detectDocumentText
   */
  public function testUnsupportedFormatThrowsException(): void {
    $documentData = 'fake-doc-data';
    $mimeType = 'application/msword';

    $this->expectException(\InvalidArgumentException::class);
    $this->expectExceptionMessage('Unsupported document format: application/msword');

    $this->service->detectDocumentText($documentData, $mimeType);
  }

  /**
   * Test file too large throws exception.
   *
   * @covers ::detectDocumentText
   */
  public function testFileTooLargeThrowsException(): void {
    // Create data larger than 5MB.
    $largeData = str_repeat('x', 6 * 1024 * 1024);
    $mimeType = 'application/pdf';

    $this->expectException(\InvalidArgumentException::class);
    $this->expectExceptionMessage('File size exceeds maximum of 5MB for synchronous operations');

    $this->service->detectDocumentText($largeData, $mimeType);
  }

  /**
   * Test supported format validation.
   *
   * @covers ::isSupportedFormat
   * @dataProvider supportedFormatProvider
   */
  public function testIsSupportedFormat(string $mimeType, bool $expected): void {
    $this->assertEquals($expected, $this->service->isSupportedFormat($mimeType));
  }

  /**
   * Data provider for format validation tests.
   */
  public static function supportedFormatProvider(): array {
    return [
      'pdf' => ['application/pdf', TRUE],
      'jpeg' => ['image/jpeg', TRUE],
      'jpg' => ['image/jpg', TRUE],
      'png' => ['image/png', TRUE],
      'gif' => ['image/gif', FALSE],
      'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', FALSE],
      'doc' => ['application/msword', FALSE],
      'txt' => ['text/plain', FALSE],
    ];
  }

  /**
   * Test sync file size validation.
   *
   * @covers ::isValidSyncFileSize
   * @dataProvider syncFileSizeProvider
   */
  public function testIsValidSyncFileSize(int $size, bool $expected): void {
    $this->assertEquals($expected, $this->service->isValidSyncFileSize($size));
  }

  /**
   * Data provider for sync file size validation tests.
   */
  public static function syncFileSizeProvider(): array {
    return [
      'zero' => [0, FALSE],
      'negative' => [-1, FALSE],
      'small' => [1024, TRUE],
      '1mb' => [1024 * 1024, TRUE],
      '5mb' => [5 * 1024 * 1024, TRUE],
      'over_5mb' => [5 * 1024 * 1024 + 1, FALSE],
      'large' => [10 * 1024 * 1024, FALSE],
    ];
  }

  /**
   * Test async file size validation.
   *
   * @covers ::isValidAsyncFileSize
   * @dataProvider asyncFileSizeProvider
   */
  public function testIsValidAsyncFileSize(int $size, bool $expected): void {
    $this->assertEquals($expected, $this->service->isValidAsyncFileSize($size));
  }

  /**
   * Data provider for async file size validation tests.
   */
  public static function asyncFileSizeProvider(): array {
    return [
      'zero' => [0, FALSE],
      'small' => [1024 * 1024, TRUE],
      '100mb' => [100 * 1024 * 1024, TRUE],
      '500mb' => [500 * 1024 * 1024, TRUE],
      'over_500mb' => [500 * 1024 * 1024 + 1, FALSE],
    ];
  }

  /**
   * Test getSupportedFormats returns correct formats.
   *
   * @covers ::getSupportedFormats
   */
  public function testGetSupportedFormats(): void {
    $formats = $this->service->getSupportedFormats();

    $this->assertIsArray($formats);
    $this->assertArrayHasKey('application/pdf', $formats);
    $this->assertArrayHasKey('image/jpeg', $formats);
    $this->assertArrayHasKey('image/png', $formats);
    $this->assertEquals('pdf', $formats['application/pdf']);
    $this->assertEquals('jpeg', $formats['image/jpeg']);
    $this->assertEquals('png', $formats['image/png']);
  }

  /**
   * Test isAvailable returns true when configured.
   *
   * @covers ::isAvailable
   */
  public function testIsAvailableTrue(): void {
    $this->textractClient->getConfig()
      ->willReturn(['region' => 'us-east-1']);

    $this->assertTrue($this->service->isAvailable());
  }

  /**
   * Test isAvailable returns false when not configured.
   *
   * @covers ::isAvailable
   */
  public function testIsAvailableFalseNoRegion(): void {
    $this->textractClient->getConfig()
      ->willReturn(['region' => '']);

    $this->assertFalse($this->service->isAvailable());
  }

  /**
   * Test TextractResult value object from detect text response.
   *
   * @covers \Drupal\ndx_aws_ai\Result\TextractResult
   */
  public function testTextractResultFromDetectTextResponse(): void {
    $blocks = $this->getSampleTextBlocks();
    $result = TextractResult::fromDetectTextResponse($blocks, 150.5);

    $this->assertTrue($result->isSuccess());
    $this->assertEquals(1, $result->pageCount);
    $this->assertEquals(150.5, $result->processingTimeMs);
    $this->assertEquals(0.1505, $result->getProcessingTimeSeconds());
    $this->assertFalse($result->hasTables());
    $this->assertFalse($result->hasKeyValues());
    $this->assertFalse($result->hasMoreResults());
  }

  /**
   * Test TextractResult getKeyValuesAsArray method.
   *
   * @covers \Drupal\ndx_aws_ai\Result\TextractResult
   */
  public function testTextractResultGetKeyValuesAsArray(): void {
    $result = new TextractResult(
      rawText: 'Sample text',
      lines: [],
      tables: [],
      keyValues: [
        ['key' => 'Name', 'value' => 'John Doe'],
        ['key' => 'Date', 'value' => '2025-01-15'],
        ['key' => 'Amount', 'value' => '£500.00'],
      ],
      processingTimeMs: 100.0,
      pageCount: 1,
      averageConfidence: 95.0,
    );

    $array = $result->getKeyValuesAsArray();

    $this->assertCount(3, $array);
    $this->assertEquals('John Doe', $array['Name']);
    $this->assertEquals('2025-01-15', $array['Date']);
    $this->assertEquals('£500.00', $array['Amount']);
  }

  /**
   * Test TextractResult from job status.
   *
   * @covers \Drupal\ndx_aws_ai\Result\TextractResult
   */
  public function testTextractResultFromJobStatus(): void {
    $result = TextractResult::fromJobStatus('job123', 'IN_PROGRESS', 50.0);

    $this->assertFalse($result->isSuccess());
    $this->assertTrue($result->isInProgress());
    $this->assertEquals('job123', $result->jobId);
    $this->assertEquals('IN_PROGRESS', $result->jobStatus);
    $this->assertEquals('', $result->rawText);
    $this->assertEquals(0, $result->pageCount);
  }

  /**
   * Test base64-encoded document processing.
   *
   * @covers ::detectDocumentText
   */
  public function testDetectDocumentTextBase64(): void {
    $rawData = 'fake-pdf-data';
    $base64Data = base64_encode($rawData);
    $mimeType = 'application/pdf';

    $blocks = $this->getSampleTextBlocks();

    $this->errorHandler->logOperation('Textract', 'detectDocumentText', Argument::any())->shouldBeCalled();

    // Expect the decoded data to be sent to AWS.
    $this->textractClient->detectDocumentText([
      'Document' => ['Bytes' => $rawData],
    ])->willReturn(new Result(['Blocks' => $blocks]));

    $result = $this->service->detectDocumentText($base64Data, $mimeType, TRUE);

    $this->assertInstanceOf(TextractResult::class, $result);
    $this->assertTrue($result->isSuccess());
  }

  /**
   * Test invalid feature type throws exception.
   *
   * @covers ::analyzeDocument
   */
  public function testInvalidFeatureTypeThrowsException(): void {
    $documentData = 'fake-pdf-data';
    $mimeType = 'application/pdf';

    $this->expectException(\InvalidArgumentException::class);
    $this->expectExceptionMessage('Invalid feature type: INVALID');

    $this->service->analyzeDocument($documentData, $mimeType, ['INVALID']);
  }

  /**
   * Test isJobComplete method.
   *
   * @covers ::isJobComplete
   */
  public function testIsJobComplete(): void {
    $jobId = 'abc123def456';

    $this->errorHandler->logOperation('Textract', 'getDocumentAnalysis', Argument::any())->shouldBeCalled();

    $this->textractClient->getDocumentAnalysis([
      'JobId' => $jobId,
    ])->willReturn(new Result([
      'JobStatus' => 'SUCCEEDED',
      'Blocks' => [],
    ]));

    $this->assertTrue($this->service->isJobComplete($jobId));
  }

  /**
   * Get sample text blocks for testing.
   *
   * @return array
   *   Array of sample blocks.
   */
  protected function getSampleTextBlocks(): array {
    return [
      [
        'BlockType' => 'PAGE',
        'Id' => 'page-1',
        'Geometry' => [],
      ],
      [
        'BlockType' => 'LINE',
        'Id' => 'line-1',
        'Text' => 'Planning Application Form',
        'Confidence' => 99.5,
        'Geometry' => [],
      ],
      [
        'BlockType' => 'LINE',
        'Id' => 'line-2',
        'Text' => 'Applicant Name: John Smith',
        'Confidence' => 98.2,
        'Geometry' => [],
      ],
      [
        'BlockType' => 'LINE',
        'Id' => 'line-3',
        'Text' => 'Application Reference: PA/2025/001',
        'Confidence' => 97.8,
        'Geometry' => [],
      ],
    ];
  }

  /**
   * Get sample analysis blocks for testing.
   *
   * @return array
   *   Array of sample blocks including tables and forms.
   */
  protected function getSampleAnalysisBlocks(): array {
    return [
      [
        'BlockType' => 'PAGE',
        'Id' => 'page-1',
        'Geometry' => [],
      ],
      [
        'BlockType' => 'LINE',
        'Id' => 'line-1',
        'Text' => 'Document Analysis Test',
        'Confidence' => 99.0,
        'Geometry' => [],
      ],
    ];
  }

}
