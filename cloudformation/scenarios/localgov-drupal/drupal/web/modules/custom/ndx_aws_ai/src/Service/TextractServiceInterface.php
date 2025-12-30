<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Drupal\ndx_aws_ai\Result\TextractResult;

/**
 * Interface for Amazon Textract document processing service.
 *
 * Provides document text extraction, table detection, and form field
 * identification from PDFs and images using Amazon Textract.
 *
 * Story 4.4: Textract Service Integration
 */
interface TextractServiceInterface {

  /**
   * Supported document formats for Textract.
   */
  public const SUPPORTED_FORMATS = [
    'application/pdf' => 'pdf',
    'image/jpeg' => 'jpeg',
    'image/jpg' => 'jpeg',
    'image/png' => 'png',
  ];

  /**
   * Maximum file size for synchronous operations (5MB).
   */
  public const MAX_SYNC_FILE_SIZE = 5242880;

  /**
   * Maximum file size for asynchronous operations (500MB).
   */
  public const MAX_ASYNC_FILE_SIZE = 524288000;

  /**
   * Feature types for document analysis.
   */
  public const FEATURE_TABLES = 'TABLES';
  public const FEATURE_FORMS = 'FORMS';
  public const FEATURE_SIGNATURES = 'SIGNATURES';
  public const FEATURE_LAYOUT = 'LAYOUT';

  /**
   * Job status constants.
   */
  public const JOB_STATUS_IN_PROGRESS = 'IN_PROGRESS';
  public const JOB_STATUS_SUCCEEDED = 'SUCCEEDED';
  public const JOB_STATUS_FAILED = 'FAILED';
  public const JOB_STATUS_PARTIAL_SUCCESS = 'PARTIAL_SUCCESS';

  /**
   * Detect text in a document synchronously.
   *
   * Simple text extraction without table/form analysis.
   * Suitable for single-page documents under 5MB.
   *
   * @param string $documentData
   *   The document content (binary or base64).
   * @param string $mimeType
   *   The document MIME type.
   * @param bool $isBase64
   *   TRUE if documentData is already base64 encoded.
   *
   * @return \Drupal\ndx_aws_ai\Result\TextractResult
   *   The extraction result with text blocks.
   *
   * @throws \InvalidArgumentException
   *   If the document format or size is invalid.
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function detectDocumentText(string $documentData, string $mimeType, bool $isBase64 = FALSE): TextractResult;

  /**
   * Detect text from a file path synchronously.
   *
   * @param string $filePath
   *   The path to the document file.
   *
   * @return \Drupal\ndx_aws_ai\Result\TextractResult
   *   The extraction result with text blocks.
   *
   * @throws \InvalidArgumentException
   *   If the file is not found or format is invalid.
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function detectDocumentTextFromFile(string $filePath): TextractResult;

  /**
   * Analyze a document for text, tables, and forms synchronously.
   *
   * Full document analysis including table and form detection.
   * Suitable for single-page documents under 5MB.
   *
   * @param string $documentData
   *   The document content (binary or base64).
   * @param string $mimeType
   *   The document MIME type.
   * @param array $featureTypes
   *   Features to analyze: TABLES, FORMS, SIGNATURES, LAYOUT.
   * @param bool $isBase64
   *   TRUE if documentData is already base64 encoded.
   *
   * @return \Drupal\ndx_aws_ai\Result\TextractResult
   *   The analysis result with text, tables, and forms.
   *
   * @throws \InvalidArgumentException
   *   If the document format or size is invalid.
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function analyzeDocument(string $documentData, string $mimeType, array $featureTypes = [self::FEATURE_TABLES, self::FEATURE_FORMS], bool $isBase64 = FALSE): TextractResult;

  /**
   * Analyze a document from file path synchronously.
   *
   * @param string $filePath
   *   The path to the document file.
   * @param array $featureTypes
   *   Features to analyze: TABLES, FORMS, SIGNATURES, LAYOUT.
   *
   * @return \Drupal\ndx_aws_ai\Result\TextractResult
   *   The analysis result with text, tables, and forms.
   *
   * @throws \InvalidArgumentException
   *   If the file is not found or format is invalid.
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function analyzeDocumentFromFile(string $filePath, array $featureTypes = [self::FEATURE_TABLES, self::FEATURE_FORMS]): TextractResult;

  /**
   * Start asynchronous document analysis for multi-page PDFs.
   *
   * Use for documents larger than 5MB or multi-page PDFs.
   * Returns a job ID for polling results.
   *
   * @param string $s3Bucket
   *   The S3 bucket containing the document.
   * @param string $s3Key
   *   The S3 object key of the document.
   * @param array $featureTypes
   *   Features to analyze: TABLES, FORMS, SIGNATURES, LAYOUT.
   *
   * @return string
   *   The job ID for tracking the async operation.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function startDocumentAnalysis(string $s3Bucket, string $s3Key, array $featureTypes = [self::FEATURE_TABLES, self::FEATURE_FORMS]): string;

  /**
   * Get the results of an asynchronous document analysis job.
   *
   * @param string $jobId
   *   The job ID from startDocumentAnalysis.
   * @param string|null $nextToken
   *   Pagination token for large results.
   *
   * @return \Drupal\ndx_aws_ai\Result\TextractResult
   *   The analysis result (may be partial if more pages exist).
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails or job has failed.
   */
  public function getDocumentAnalysis(string $jobId, ?string $nextToken = NULL): TextractResult;

  /**
   * Check the status of an async job.
   *
   * @param string $jobId
   *   The job ID to check.
   *
   * @return string
   *   One of: IN_PROGRESS, SUCCEEDED, FAILED, PARTIAL_SUCCESS.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function getJobStatus(string $jobId): string;

  /**
   * Check if an async job is complete.
   *
   * @param string $jobId
   *   The job ID to check.
   *
   * @return bool
   *   TRUE if job is SUCCEEDED or FAILED, FALSE if IN_PROGRESS.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function isJobComplete(string $jobId): bool;

  /**
   * Check if a document format is supported.
   *
   * @param string $mimeType
   *   The MIME type to check.
   *
   * @return bool
   *   TRUE if the format is supported.
   */
  public function isSupportedFormat(string $mimeType): bool;

  /**
   * Check if file size is valid for sync operations.
   *
   * @param int $sizeInBytes
   *   The file size.
   *
   * @return bool
   *   TRUE if valid for synchronous operations.
   */
  public function isValidSyncFileSize(int $sizeInBytes): bool;

  /**
   * Check if file size is valid for async operations.
   *
   * @param int $sizeInBytes
   *   The file size.
   *
   * @return bool
   *   TRUE if valid for asynchronous operations.
   */
  public function isValidAsyncFileSize(int $sizeInBytes): bool;

  /**
   * Get supported document formats.
   *
   * @return array<string, string>
   *   Array of MIME types to format names.
   */
  public function getSupportedFormats(): array;

  /**
   * Check if the Textract service is available.
   *
   * @return bool
   *   TRUE if the service is configured and accessible.
   */
  public function isAvailable(): bool;

}
