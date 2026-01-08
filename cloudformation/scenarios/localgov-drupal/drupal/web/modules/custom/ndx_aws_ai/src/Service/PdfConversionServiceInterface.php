<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Drupal\ndx_aws_ai\Result\PdfConversionResult;

/**
 * Interface for PDF-to-Web conversion service.
 *
 * Provides PDF document processing and conversion to accessible HTML content
 * using Amazon Textract and Bedrock services.
 *
 * Story 4.8: PDF-to-Web Conversion
 */
interface PdfConversionServiceInterface {

  /**
   * Maximum file size for synchronous processing (5MB).
   */
  public const MAX_SYNC_FILE_SIZE = 5242880;

  /**
   * Conversion status constants.
   */
  public const STATUS_PENDING = 'pending';
  public const STATUS_EXTRACTING = 'extracting';
  public const STATUS_ANALYZING = 'analyzing';
  public const STATUS_STRUCTURING = 'structuring';
  public const STATUS_COMPLETE = 'complete';
  public const STATUS_ERROR = 'error';

  /**
   * Conversion steps for progress tracking.
   */
  public const STEPS = [
    self::STATUS_EXTRACTING => 'Extracting text from PDF...',
    self::STATUS_ANALYZING => 'Analyzing document structure...',
    self::STATUS_STRUCTURING => 'Creating accessible HTML...',
    self::STATUS_COMPLETE => 'Conversion complete',
  ];

  /**
   * Convert a PDF file to structured HTML content.
   *
   * Performs synchronous conversion for files under 5MB.
   *
   * @param string $filePath
   *   The path to the PDF file.
   *
   * @return \Drupal\ndx_aws_ai\Result\PdfConversionResult
   *   The conversion result with HTML content.
   *
   * @throws \InvalidArgumentException
   *   If the file is not found or not a PDF.
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If AWS service calls fail.
   */
  public function convertPdf(string $filePath): PdfConversionResult;

  /**
   * Start an asynchronous conversion job.
   *
   * For files larger than 5MB or when progress tracking is needed.
   *
   * @param int $fileId
   *   The Drupal file entity ID.
   *
   * @return string
   *   The job ID for tracking progress.
   *
   * @throws \InvalidArgumentException
   *   If the file is not found or not a PDF.
   */
  public function startConversion(int $fileId): string;

  /**
   * Get the status of a conversion job.
   *
   * @param string $jobId
   *   The job ID from startConversion().
   *
   * @return array
   *   Array with keys:
   *   - status: Current status (pending, extracting, analyzing, structuring, complete, error)
   *   - step: Human-readable step description
   *   - progress: Percentage complete (0-100)
   *   - result: PdfConversionResult when complete, NULL otherwise
   *   - error: Error message if status is 'error'
   */
  public function getStatus(string $jobId): array;

  /**
   * Structure raw text into semantic HTML using Bedrock.
   *
   * @param string $rawText
   *   The raw text extracted from PDF.
   *
   * @return string
   *   Structured HTML with semantic tags.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If Bedrock call fails.
   */
  public function structureContent(string $rawText): string;

  /**
   * Convert Textract table data to accessible HTML.
   *
   * @param array $tables
   *   Array of table data from TextractResult.
   *
   * @return string
   *   HTML tables with GOV.UK styling and accessibility attributes.
   */
  public function convertTablesToHtml(array $tables): string;

  /**
   * Generate a caption for a table using Bedrock.
   *
   * @param array $table
   *   The table data structure.
   *
   * @return string
   *   A brief, descriptive caption.
   */
  public function generateTableCaption(array $table): string;

  /**
   * Check if a file is valid for conversion.
   *
   * @param string $mimeType
   *   The file MIME type.
   * @param int $fileSize
   *   The file size in bytes.
   *
   * @return bool
   *   TRUE if the file can be converted.
   */
  public function isValidForConversion(string $mimeType, int $fileSize): bool;

  /**
   * Check if the service is available.
   *
   * @return bool
   *   TRUE if both Textract and Bedrock services are available.
   */
  public function isAvailable(): bool;

}
