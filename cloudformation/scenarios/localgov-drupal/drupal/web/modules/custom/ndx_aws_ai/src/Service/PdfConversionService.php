<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\Core\State\StateInterface;
use Drupal\ndx_aws_ai\Result\PdfConversionResult;

/**
 * Service for converting PDFs to accessible web content.
 *
 * Uses Amazon Textract for text extraction and Amazon Bedrock
 * for content structuring into semantic HTML.
 *
 * Story 4.8: PDF-to-Web Conversion
 */
class PdfConversionService implements PdfConversionServiceInterface {

  /**
   * State key prefix for job tracking.
   */
  private const STATE_PREFIX = 'ndx_pdf_conversion.job.';

  /**
   * Job expiration time in seconds (1 hour).
   */
  private const JOB_EXPIRY = 3600;

  /**
   * Constructs a PdfConversionService.
   *
   * @param \Drupal\ndx_aws_ai\Service\TextractServiceInterface $textractService
   *   The Textract service.
   * @param \Drupal\ndx_aws_ai\Service\BedrockServiceInterface $bedrockService
   *   The Bedrock service.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\Core\State\StateInterface $state
   *   The state service for job tracking.
   * @param \Drupal\Core\Logger\LoggerChannelInterface $logger
   *   The logger.
   */
  public function __construct(
    private readonly TextractServiceInterface $textractService,
    private readonly BedrockServiceInterface $bedrockService,
    private readonly EntityTypeManagerInterface $entityTypeManager,
    private readonly StateInterface $state,
    private readonly LoggerChannelInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function convertPdf(string $filePath): PdfConversionResult {
    $startTime = microtime(TRUE);

    // Validate file exists.
    if (!file_exists($filePath)) {
      throw new \InvalidArgumentException("File not found: {$filePath}");
    }

    // Validate MIME type.
    $mimeType = mime_content_type($filePath);
    if ($mimeType !== 'application/pdf') {
      throw new \InvalidArgumentException("File is not a PDF: {$mimeType}");
    }

    // Validate file size for sync processing.
    $fileSize = filesize($filePath);
    if ($fileSize > self::MAX_SYNC_FILE_SIZE) {
      throw new \InvalidArgumentException(
        sprintf(
          'File too large for synchronous processing: %s bytes (max %s)',
          $fileSize,
          self::MAX_SYNC_FILE_SIZE
        )
      );
    }

    $this->logger->debug('Starting PDF conversion for: @path', ['@path' => $filePath]);

    try {
      // Extract text and tables using Textract.
      $textractResult = $this->textractService->analyzeDocumentFromFile(
        $filePath,
        [
          TextractServiceInterface::FEATURE_TABLES,
          TextractServiceInterface::FEATURE_LAYOUT,
        ]
      );

      if (!$textractResult->isSuccess()) {
        throw new \RuntimeException('Textract extraction failed');
      }

      // Structure content using Bedrock.
      $structuredHtml = $this->structureContent($textractResult->rawText);

      // Convert tables to accessible HTML.
      $tablesHtml = $this->convertTablesToHtml($textractResult->tables);

      $processingTime = (microtime(TRUE) - $startTime) * 1000;

      $this->logger->info('PDF conversion complete: @pages pages, @tables tables, @ms ms', [
        '@pages' => $textractResult->pageCount,
        '@tables' => count($textractResult->tables),
        '@ms' => round($processingTime),
      ]);

      return PdfConversionResult::fromProcessing(
        $textractResult,
        $structuredHtml,
        $tablesHtml,
        $processingTime,
      );
    }
    catch (\Exception $e) {
      $this->logger->error('PDF conversion failed: @error', ['@error' => $e->getMessage()]);
      throw $e;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function startConversion(int $fileId): string {
    // Load the file entity.
    $file = $this->entityTypeManager->getStorage('file')->load($fileId);
    if (!$file) {
      throw new \InvalidArgumentException("File not found: {$fileId}");
    }

    // Validate MIME type.
    if ($file->getMimeType() !== 'application/pdf') {
      throw new \InvalidArgumentException('Only PDF files are supported');
    }

    // Generate job ID.
    $jobId = 'pdf_' . $fileId . '_' . bin2hex(random_bytes(8));

    // Initialize job state.
    $this->state->set(self::STATE_PREFIX . $jobId, [
      'status' => self::STATUS_PENDING,
      'step' => 'Initializing...',
      'progress' => 0,
      'file_id' => $fileId,
      'file_path' => $file->getFileUri(),
      'started' => time(),
      'result' => NULL,
      'error' => NULL,
    ]);

    // In a real implementation, this would queue background processing.
    // For the demo, we process synchronously but track progress.
    $this->processJob($jobId);

    return $jobId;
  }

  /**
   * {@inheritdoc}
   */
  public function getStatus(string $jobId): array {
    $data = $this->state->get(self::STATE_PREFIX . $jobId);

    if (!$data) {
      return [
        'status' => self::STATUS_ERROR,
        'step' => 'Job not found',
        'progress' => 0,
        'result' => NULL,
        'error' => 'Conversion job not found',
      ];
    }

    // Check for expired jobs.
    if (isset($data['started']) && (time() - $data['started']) > self::JOB_EXPIRY) {
      $this->state->delete(self::STATE_PREFIX . $jobId);
      return [
        'status' => self::STATUS_ERROR,
        'step' => 'Job expired',
        'progress' => 0,
        'result' => NULL,
        'error' => 'Conversion job has expired',
      ];
    }

    return [
      'status' => $data['status'],
      'step' => $data['step'],
      'progress' => $data['progress'],
      'result' => $data['result'],
      'error' => $data['error'],
    ];
  }

  /**
   * Process a conversion job.
   *
   * @param string $jobId
   *   The job ID.
   */
  private function processJob(string $jobId): void {
    $data = $this->state->get(self::STATE_PREFIX . $jobId);
    if (!$data) {
      return;
    }

    $startTime = microtime(TRUE);

    try {
      // Step 1: Extract text.
      $this->updateJobStatus($jobId, self::STATUS_EXTRACTING, 20);

      $filePath = $data['file_path'];
      $realPath = \Drupal::service('file_system')->realpath($filePath);

      $textractResult = $this->textractService->analyzeDocumentFromFile(
        $realPath,
        [
          TextractServiceInterface::FEATURE_TABLES,
          TextractServiceInterface::FEATURE_LAYOUT,
        ]
      );

      if (!$textractResult->isSuccess()) {
        throw new \RuntimeException('Textract extraction failed');
      }

      // Step 2: Analyze structure.
      $this->updateJobStatus($jobId, self::STATUS_ANALYZING, 50);

      // Step 3: Structure content.
      $this->updateJobStatus($jobId, self::STATUS_STRUCTURING, 70);

      $structuredHtml = $this->structureContent($textractResult->rawText);
      $tablesHtml = $this->convertTablesToHtml($textractResult->tables);

      $processingTime = (microtime(TRUE) - $startTime) * 1000;

      $result = PdfConversionResult::fromProcessing(
        $textractResult,
        $structuredHtml,
        $tablesHtml,
        $processingTime,
      );

      // Step 4: Complete.
      $this->updateJobStatus($jobId, self::STATUS_COMPLETE, 100, $result->toArray());
    }
    catch (\Exception $e) {
      $this->updateJobStatus($jobId, self::STATUS_ERROR, 0, NULL, $e->getMessage());
    }
  }

  /**
   * Update job status in state.
   *
   * @param string $jobId
   *   The job ID.
   * @param string $status
   *   The new status.
   * @param int $progress
   *   Progress percentage.
   * @param array|null $result
   *   The result data when complete.
   * @param string|null $error
   *   Error message if failed.
   */
  private function updateJobStatus(
    string $jobId,
    string $status,
    int $progress,
    ?array $result = NULL,
    ?string $error = NULL,
  ): void {
    $data = $this->state->get(self::STATE_PREFIX . $jobId);
    if ($data) {
      $data['status'] = $status;
      $data['step'] = self::STEPS[$status] ?? $status;
      $data['progress'] = $progress;
      if ($result !== NULL) {
        $data['result'] = $result;
      }
      if ($error !== NULL) {
        $data['error'] = $error;
      }
      $this->state->set(self::STATE_PREFIX . $jobId, $data);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function structureContent(string $rawText): string {
    if (empty(trim($rawText))) {
      return '';
    }

    // Limit text to prevent token overflow.
    $maxChars = 15000;
    if (strlen($rawText) > $maxChars) {
      $rawText = substr($rawText, 0, $maxChars) . "\n\n[Content truncated for processing...]";
    }

    $prompt = $this->getStructuringPrompt($rawText);

    try {
      $result = $this->bedrockService->generateContent(
        $prompt,
        BedrockServiceInterface::MODEL_NOVA_LITE,
        [
          'temperature' => 0.3,
          'maxTokens' => 4000,
        ]
      );

      // Clean up the response.
      $html = $this->cleanHtmlResponse($result);

      return $html;
    }
    catch (\Exception $e) {
      $this->logger->error('Content structuring failed: @error', ['@error' => $e->getMessage()]);
      // Fall back to basic formatting.
      return $this->basicFormatting($rawText);
    }
  }

  /**
   * Get the prompt for content structuring.
   *
   * @param string $rawText
   *   The raw text to structure.
   *
   * @return string
   *   The prompt for Bedrock.
   */
  private function getStructuringPrompt(string $rawText): string {
    return <<<PROMPT
You are converting extracted PDF text into semantic HTML for a UK council website.

Input text:
{$rawText}

Instructions:
1. Add semantic HTML structure using h2, h3, p, ul, ol tags
2. Identify natural section breaks for headings (h2 for main sections, h3 for subsections)
3. Convert bullet points or numbered lists to proper HTML lists
4. Preserve paragraph breaks as separate <p> tags
5. Follow GOV.UK content guidelines for clarity
6. Do NOT include <html>, <head>, <body> tags - only content tags
7. Do NOT add any CSS styles or classes
8. Do NOT include the original heading if it was just a document title

Output ONLY the structured HTML content with no explanation:
PROMPT;
  }

  /**
   * Clean the AI-generated HTML response.
   *
   * @param string $response
   *   The raw response from Bedrock.
   *
   * @return string
   *   Cleaned HTML content.
   */
  private function cleanHtmlResponse(string $response): string {
    // Remove code block markers.
    $response = preg_replace('/^```html?\s*/i', '', $response);
    $response = preg_replace('/\s*```$/', '', $response);

    // Remove any full document tags.
    $response = preg_replace('/<\/?(?:html|head|body|meta|title)[^>]*>/i', '', $response);

    // Remove DOCTYPE.
    $response = preg_replace('/<!DOCTYPE[^>]*>/i', '', $response);

    // Clean up whitespace.
    $response = trim($response);

    return $response;
  }

  /**
   * Basic text formatting fallback.
   *
   * @param string $text
   *   The raw text.
   *
   * @return string
   *   Basic HTML formatting.
   */
  private function basicFormatting(string $text): string {
    $paragraphs = preg_split('/\n\s*\n/', $text);
    $html = '';

    foreach ($paragraphs as $para) {
      $para = trim($para);
      if (empty($para)) {
        continue;
      }
      $html .= '<p>' . htmlspecialchars($para) . '</p>' . "\n";
    }

    return $html;
  }

  /**
   * {@inheritdoc}
   */
  public function convertTablesToHtml(array $tables): string {
    if (empty($tables)) {
      return '';
    }

    $html = '';

    foreach ($tables as $index => $table) {
      $html .= $this->convertSingleTable($table, $index + 1);
    }

    return $html;
  }

  /**
   * Convert a single table to accessible HTML.
   *
   * @param array $table
   *   The table data.
   * @param int $tableNum
   *   The table number for caption.
   *
   * @return string
   *   The HTML table.
   */
  private function convertSingleTable(array $table, int $tableNum): string {
    $rows = $table['rows'] ?? [];

    if (empty($rows)) {
      return '';
    }

    $caption = $this->generateTableCaption($table);

    $html = '<table class="govuk-table">' . "\n";
    $html .= '  <caption class="govuk-table__caption govuk-table__caption--m">' .
      htmlspecialchars($caption) . '</caption>' . "\n";

    $firstRow = TRUE;
    $inBody = FALSE;

    foreach ($rows as $row) {
      if ($firstRow) {
        // Assume first row is header.
        $html .= '  <thead class="govuk-table__head">' . "\n";
        $html .= '    <tr class="govuk-table__row">' . "\n";

        foreach ($row as $cell) {
          $html .= '      <th scope="col" class="govuk-table__header">' .
            htmlspecialchars((string) $cell) . '</th>' . "\n";
        }

        $html .= '    </tr>' . "\n";
        $html .= '  </thead>' . "\n";
        $html .= '  <tbody class="govuk-table__body">' . "\n";
        $firstRow = FALSE;
        $inBody = TRUE;
      }
      else {
        $html .= '    <tr class="govuk-table__row">' . "\n";

        foreach ($row as $cell) {
          $html .= '      <td class="govuk-table__cell">' .
            htmlspecialchars((string) $cell) . '</td>' . "\n";
        }

        $html .= '    </tr>' . "\n";
      }
    }

    if ($inBody) {
      $html .= '  </tbody>' . "\n";
    }

    $html .= '</table>' . "\n";

    return $html;
  }

  /**
   * {@inheritdoc}
   */
  public function generateTableCaption(array $table): string {
    $rows = $table['rows'] ?? [];
    $firstRow = $rows[0] ?? [];

    // Try to generate a descriptive caption from headers.
    if (!empty($firstRow)) {
      $headers = array_filter(array_map('trim', $firstRow));
      if (count($headers) >= 2) {
        // Use Bedrock to generate a caption if we have headers.
        try {
          $headerStr = implode(', ', array_slice($headers, 0, 5));
          $prompt = "Generate a brief (5-10 word) table caption for a table with these column headers: {$headerStr}. Output only the caption, no quotes or punctuation.";

          $caption = $this->bedrockService->generateContent(
            $prompt,
            BedrockServiceInterface::MODEL_NOVA_LITE,
            ['temperature' => 0.3, 'maxTokens' => 50]
          );

          $caption = trim($caption, " \n\r\t\v\0\"'");
          if (!empty($caption) && strlen($caption) < 100) {
            return $caption;
          }
        }
        catch (\Exception $e) {
          // Fall through to default.
        }
      }
    }

    return 'Data table';
  }

  /**
   * {@inheritdoc}
   */
  public function isValidForConversion(string $mimeType, int $fileSize): bool {
    if ($mimeType !== 'application/pdf') {
      return FALSE;
    }

    // Allow files up to 500MB for async, 5MB for sync.
    return $fileSize <= TextractServiceInterface::MAX_ASYNC_FILE_SIZE;
  }

  /**
   * {@inheritdoc}
   */
  public function isAvailable(): bool {
    return $this->textractService->isAvailable() && $this->bedrockService->isAvailable();
  }

}
