<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Aws\Exception\AwsException;
use Aws\Textract\TextractClient;
use Drupal\ndx_aws_ai\Exception\AwsServiceException;
use Drupal\ndx_aws_ai\RateLimiter\TextractRateLimiter;
use Drupal\ndx_aws_ai\Result\TextractResult;

/**
 * Amazon Textract document processing service.
 *
 * Provides text extraction, table detection, and form field identification
 * from PDFs and images using synchronous and asynchronous operations.
 *
 * Story 4.4: Textract Service Integration
 */
class TextractService implements TextractServiceInterface {

  /**
   * The Textract client (lazy initialized).
   */
  protected ?TextractClient $client = NULL;

  /**
   * Constructs a TextractService.
   *
   * @param \Drupal\ndx_aws_ai\Service\AwsClientFactory $clientFactory
   *   The AWS client factory.
   * @param \Drupal\ndx_aws_ai\Service\AwsErrorHandler $errorHandler
   *   The AWS error handler.
   * @param \Drupal\ndx_aws_ai\RateLimiter\TextractRateLimiter $rateLimiter
   *   The rate limiter for API calls.
   */
  public function __construct(
    protected AwsClientFactory $clientFactory,
    protected AwsErrorHandler $errorHandler,
    protected TextractRateLimiter $rateLimiter,
  ) {
    // Client is lazy initialized in getClient() to avoid issues during
    // service container initialization and module discovery.
  }

  /**
   * Get the Textract client, creating it lazily if needed.
   *
   * @return \Aws\Textract\TextractClient
   *   The Textract client.
   */
  protected function getClient(): TextractClient {
    if ($this->client === NULL) {
      $this->client = $this->clientFactory->getTextractClient();
    }
    return $this->client;
  }

  /**
   * {@inheritdoc}
   */
  public function detectDocumentText(string $documentData, string $mimeType, bool $isBase64 = FALSE): TextractResult {
    $this->validateFormat($mimeType);

    // Decode if base64.
    $binaryData = $isBase64 ? base64_decode($documentData) : $documentData;
    $this->validateSyncFileSize(strlen($binaryData));

    return $this->invokeDetectText($binaryData);
  }

  /**
   * {@inheritdoc}
   */
  public function detectDocumentTextFromFile(string $filePath): TextractResult {
    $this->validateFile($filePath);
    $mimeType = $this->getMimeType($filePath);
    $documentData = file_get_contents($filePath);

    if ($documentData === FALSE) {
      throw new \InvalidArgumentException("Unable to read file: {$filePath}");
    }

    $this->validateSyncFileSize(strlen($documentData));

    return $this->invokeDetectText($documentData);
  }

  /**
   * {@inheritdoc}
   */
  public function analyzeDocument(string $documentData, string $mimeType, array $featureTypes = [self::FEATURE_TABLES, self::FEATURE_FORMS], bool $isBase64 = FALSE): TextractResult {
    $this->validateFormat($mimeType);
    $this->validateFeatureTypes($featureTypes);

    // Decode if base64.
    $binaryData = $isBase64 ? base64_decode($documentData) : $documentData;
    $this->validateSyncFileSize(strlen($binaryData));

    return $this->invokeAnalyzeDocument($binaryData, $featureTypes);
  }

  /**
   * {@inheritdoc}
   */
  public function analyzeDocumentFromFile(string $filePath, array $featureTypes = [self::FEATURE_TABLES, self::FEATURE_FORMS]): TextractResult {
    $this->validateFile($filePath);
    $this->validateFeatureTypes($featureTypes);

    $documentData = file_get_contents($filePath);
    if ($documentData === FALSE) {
      throw new \InvalidArgumentException("Unable to read file: {$filePath}");
    }

    $this->validateSyncFileSize(strlen($documentData));

    return $this->invokeAnalyzeDocument($documentData, $featureTypes);
  }

  /**
   * {@inheritdoc}
   */
  public function startDocumentAnalysis(string $s3Bucket, string $s3Key, array $featureTypes = [self::FEATURE_TABLES, self::FEATURE_FORMS]): string {
    $this->validateFeatureTypes($featureTypes);
    $startTime = microtime(TRUE);

    $request = [
      'DocumentLocation' => [
        'S3Object' => [
          'Bucket' => $s3Bucket,
          'Name' => $s3Key,
        ],
      ],
      'FeatureTypes' => $featureTypes,
    ];

    $attempt = 0;
    $lastException = NULL;

    while ($attempt < $this->rateLimiter->getMaxRetries()) {
      try {
        $this->rateLimiter->waitIfNeeded();
        $result = $this->getClient()->startDocumentAnalysis($request);
        $this->rateLimiter->recordSuccess();

        $jobId = $result['JobId'] ?? '';
        $processingTimeMs = (microtime(TRUE) - $startTime) * 1000;

        $this->errorHandler->logOperation('Textract', 'startDocumentAnalysis', [
          'jobId' => $jobId,
          's3Bucket' => $s3Bucket,
          's3Key' => $s3Key,
          'featureTypes' => $featureTypes,
          'processingTimeMs' => round($processingTimeMs, 2),
        ]);

        return $jobId;
      }
      catch (AwsException $e) {
        $lastException = $e;
        $errorCode = $e->getAwsErrorCode() ?? 'UnknownError';

        if ($this->rateLimiter->isRetryable($errorCode) && $attempt < $this->rateLimiter->getMaxRetries() - 1) {
          $this->errorHandler->logRetry('Textract', 'startDocumentAnalysis', $attempt + 1, $errorCode);
          $this->rateLimiter->recordFailure();
          $this->rateLimiter->waitForRetry($attempt);
          $attempt++;
          continue;
        }

        throw $this->errorHandler->handleException($e, 'Textract', 'startDocumentAnalysis');
      }
    }

    if ($lastException !== NULL) {
      throw $this->errorHandler->handleException($lastException, 'Textract', 'startDocumentAnalysis');
    }

    throw new AwsServiceException(
      message: 'Maximum retries exceeded',
      awsErrorCode: 'MaxRetriesExceeded',
      awsService: 'Textract',
      userMessage: 'The document analysis service is currently unavailable. Please try again later.',
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getDocumentAnalysis(string $jobId, ?string $nextToken = NULL): TextractResult {
    $startTime = microtime(TRUE);

    $request = ['JobId' => $jobId];
    if ($nextToken !== NULL) {
      $request['NextToken'] = $nextToken;
    }

    $attempt = 0;
    $lastException = NULL;

    while ($attempt < $this->rateLimiter->getMaxRetries()) {
      try {
        $this->rateLimiter->waitIfNeeded();
        $result = $this->getClient()->getDocumentAnalysis($request);
        $this->rateLimiter->recordSuccess();

        $processingTimeMs = (microtime(TRUE) - $startTime) * 1000;

        $textractResult = TextractResult::fromAsyncResponse(
          $result->toArray(),
          $jobId,
          $processingTimeMs
        );

        $this->errorHandler->logOperation('Textract', 'getDocumentAnalysis', [
          'jobId' => $jobId,
          'jobStatus' => $textractResult->jobStatus,
          'pageCount' => $textractResult->pageCount,
          'hasMoreResults' => $textractResult->hasMoreResults(),
          'processingTimeMs' => round($processingTimeMs, 2),
        ]);

        return $textractResult;
      }
      catch (AwsException $e) {
        $lastException = $e;
        $errorCode = $e->getAwsErrorCode() ?? 'UnknownError';

        if ($this->rateLimiter->isRetryable($errorCode) && $attempt < $this->rateLimiter->getMaxRetries() - 1) {
          $this->errorHandler->logRetry('Textract', 'getDocumentAnalysis', $attempt + 1, $errorCode);
          $this->rateLimiter->recordFailure();
          $this->rateLimiter->waitForRetry($attempt);
          $attempt++;
          continue;
        }

        throw $this->errorHandler->handleException($e, 'Textract', 'getDocumentAnalysis');
      }
    }

    if ($lastException !== NULL) {
      throw $this->errorHandler->handleException($lastException, 'Textract', 'getDocumentAnalysis');
    }

    throw new AwsServiceException(
      message: 'Maximum retries exceeded',
      awsErrorCode: 'MaxRetriesExceeded',
      awsService: 'Textract',
      userMessage: 'The document analysis service is currently unavailable. Please try again later.',
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getJobStatus(string $jobId): string {
    $result = $this->getDocumentAnalysis($jobId);
    return $result->jobStatus;
  }

  /**
   * {@inheritdoc}
   */
  public function isJobComplete(string $jobId): bool {
    $status = $this->getJobStatus($jobId);
    return $status !== self::JOB_STATUS_IN_PROGRESS;
  }

  /**
   * {@inheritdoc}
   */
  public function isSupportedFormat(string $mimeType): bool {
    return isset(self::SUPPORTED_FORMATS[$mimeType]);
  }

  /**
   * {@inheritdoc}
   */
  public function isValidSyncFileSize(int $sizeInBytes): bool {
    return $sizeInBytes > 0 && $sizeInBytes <= self::MAX_SYNC_FILE_SIZE;
  }

  /**
   * {@inheritdoc}
   */
  public function isValidAsyncFileSize(int $sizeInBytes): bool {
    return $sizeInBytes > 0 && $sizeInBytes <= self::MAX_ASYNC_FILE_SIZE;
  }

  /**
   * {@inheritdoc}
   */
  public function getSupportedFormats(): array {
    return self::SUPPORTED_FORMATS;
  }

  /**
   * {@inheritdoc}
   */
  public function isAvailable(): bool {
    try {
      // Use getRegion() method - the SDK stores region as 'signing_region'
      // in getConfig() which doesn't include a 'region' key.
      $region = $this->getClient()->getRegion();
      return !empty($region);
    }
    catch (\Exception $e) {
      return FALSE;
    }
  }

  /**
   * Invoke DetectDocumentText API.
   *
   * @param string $documentData
   *   Binary document data.
   *
   * @return \Drupal\ndx_aws_ai\Result\TextractResult
   *   The extraction result.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  protected function invokeDetectText(string $documentData): TextractResult {
    $startTime = microtime(TRUE);

    $request = [
      'Document' => [
        'Bytes' => $documentData,
      ],
    ];

    $attempt = 0;
    $lastException = NULL;

    while ($attempt < $this->rateLimiter->getMaxRetries()) {
      try {
        $this->rateLimiter->waitIfNeeded();
        $result = $this->getClient()->detectDocumentText($request);
        $this->rateLimiter->recordSuccess();

        $processingTimeMs = (microtime(TRUE) - $startTime) * 1000;
        $blocks = $result['Blocks'] ?? [];

        $textractResult = TextractResult::fromDetectTextResponse($blocks, $processingTimeMs);

        $this->errorHandler->logOperation('Textract', 'detectDocumentText', [
          'lineCount' => count($textractResult->lines),
          'pageCount' => $textractResult->pageCount,
          'averageConfidence' => round($textractResult->averageConfidence, 2),
          'processingTimeMs' => round($processingTimeMs, 2),
        ]);

        return $textractResult;
      }
      catch (AwsException $e) {
        $lastException = $e;
        $errorCode = $e->getAwsErrorCode() ?? 'UnknownError';

        if ($this->rateLimiter->isRetryable($errorCode) && $attempt < $this->rateLimiter->getMaxRetries() - 1) {
          $this->errorHandler->logRetry('Textract', 'detectDocumentText', $attempt + 1, $errorCode);
          $this->rateLimiter->recordFailure();
          $this->rateLimiter->waitForRetry($attempt);
          $attempt++;
          continue;
        }

        throw $this->errorHandler->handleException($e, 'Textract', 'detectDocumentText');
      }
    }

    if ($lastException !== NULL) {
      throw $this->errorHandler->handleException($lastException, 'Textract', 'detectDocumentText');
    }

    throw new AwsServiceException(
      message: 'Maximum retries exceeded',
      awsErrorCode: 'MaxRetriesExceeded',
      awsService: 'Textract',
      userMessage: 'The document analysis service is currently unavailable. Please try again later.',
    );
  }

  /**
   * Invoke AnalyzeDocument API.
   *
   * @param string $documentData
   *   Binary document data.
   * @param array $featureTypes
   *   Feature types to analyze.
   *
   * @return \Drupal\ndx_aws_ai\Result\TextractResult
   *   The analysis result.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  protected function invokeAnalyzeDocument(string $documentData, array $featureTypes): TextractResult {
    $startTime = microtime(TRUE);

    $request = [
      'Document' => [
        'Bytes' => $documentData,
      ],
      'FeatureTypes' => $featureTypes,
    ];

    $attempt = 0;
    $lastException = NULL;

    while ($attempt < $this->rateLimiter->getMaxRetries()) {
      try {
        $this->rateLimiter->waitIfNeeded();
        $result = $this->getClient()->analyzeDocument($request);
        $this->rateLimiter->recordSuccess();

        $processingTimeMs = (microtime(TRUE) - $startTime) * 1000;
        $blocks = $result['Blocks'] ?? [];

        $textractResult = TextractResult::fromAnalyzeDocumentResponse($blocks, $processingTimeMs);

        $this->errorHandler->logOperation('Textract', 'analyzeDocument', [
          'lineCount' => count($textractResult->lines),
          'tableCount' => count($textractResult->tables),
          'keyValueCount' => count($textractResult->keyValues),
          'pageCount' => $textractResult->pageCount,
          'averageConfidence' => round($textractResult->averageConfidence, 2),
          'featureTypes' => $featureTypes,
          'processingTimeMs' => round($processingTimeMs, 2),
        ]);

        return $textractResult;
      }
      catch (AwsException $e) {
        $lastException = $e;
        $errorCode = $e->getAwsErrorCode() ?? 'UnknownError';

        if ($this->rateLimiter->isRetryable($errorCode) && $attempt < $this->rateLimiter->getMaxRetries() - 1) {
          $this->errorHandler->logRetry('Textract', 'analyzeDocument', $attempt + 1, $errorCode);
          $this->rateLimiter->recordFailure();
          $this->rateLimiter->waitForRetry($attempt);
          $attempt++;
          continue;
        }

        throw $this->errorHandler->handleException($e, 'Textract', 'analyzeDocument');
      }
    }

    if ($lastException !== NULL) {
      throw $this->errorHandler->handleException($lastException, 'Textract', 'analyzeDocument');
    }

    throw new AwsServiceException(
      message: 'Maximum retries exceeded',
      awsErrorCode: 'MaxRetriesExceeded',
      awsService: 'Textract',
      userMessage: 'The document analysis service is currently unavailable. Please try again later.',
    );
  }

  /**
   * Validate document format.
   *
   * @param string $mimeType
   *   The MIME type to validate.
   *
   * @throws \InvalidArgumentException
   *   If format is not supported.
   */
  protected function validateFormat(string $mimeType): void {
    if (!$this->isSupportedFormat($mimeType)) {
      $supported = implode(', ', array_keys(self::SUPPORTED_FORMATS));
      throw new \InvalidArgumentException(
        "Unsupported document format: {$mimeType}. Supported formats: {$supported}"
      );
    }
  }

  /**
   * Validate file size for sync operations.
   *
   * @param int $sizeInBytes
   *   The file size.
   *
   * @throws \InvalidArgumentException
   *   If file is too large.
   */
  protected function validateSyncFileSize(int $sizeInBytes): void {
    if (!$this->isValidSyncFileSize($sizeInBytes)) {
      $maxMb = self::MAX_SYNC_FILE_SIZE / 1024 / 1024;
      throw new \InvalidArgumentException(
        "File size exceeds maximum of {$maxMb}MB for synchronous operations. Use async methods for larger files."
      );
    }
  }

  /**
   * Validate feature types.
   *
   * @param array $featureTypes
   *   The feature types to validate.
   *
   * @throws \InvalidArgumentException
   *   If invalid feature type is specified.
   */
  protected function validateFeatureTypes(array $featureTypes): void {
    $validTypes = [
      self::FEATURE_TABLES,
      self::FEATURE_FORMS,
      self::FEATURE_SIGNATURES,
      self::FEATURE_LAYOUT,
    ];

    foreach ($featureTypes as $type) {
      if (!in_array($type, $validTypes, TRUE)) {
        throw new \InvalidArgumentException(
          "Invalid feature type: {$type}. Valid types: " . implode(', ', $validTypes)
        );
      }
    }
  }

  /**
   * Validate a file path.
   *
   * @param string $filePath
   *   The file path to validate.
   *
   * @throws \InvalidArgumentException
   *   If file doesn't exist or has invalid format.
   */
  protected function validateFile(string $filePath): void {
    if (!file_exists($filePath)) {
      throw new \InvalidArgumentException("File not found: {$filePath}");
    }

    if (!is_readable($filePath)) {
      throw new \InvalidArgumentException("File not readable: {$filePath}");
    }

    $mimeType = $this->getMimeType($filePath);
    $this->validateFormat($mimeType);
  }

  /**
   * Get MIME type of a file.
   *
   * @param string $filePath
   *   The file path.
   *
   * @return string
   *   The MIME type.
   */
  protected function getMimeType(string $filePath): string {
    $mimeType = mime_content_type($filePath);
    return $mimeType !== FALSE ? $mimeType : 'application/octet-stream';
  }

}
