<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Result;

/**
 * Value object for PDF conversion results.
 *
 * Contains the converted HTML content and metadata about the conversion.
 *
 * Story 4.8: PDF-to-Web Conversion
 */
final class PdfConversionResult {

  /**
   * Constructs a PdfConversionResult.
   *
   * @param string $html
   *   The structured HTML content.
   * @param string $rawText
   *   The raw text extracted from the PDF.
   * @param array $tables
   *   Array of table data extracted.
   * @param int $pageCount
   *   Number of pages in the PDF.
   * @param float $confidence
   *   Average confidence score (0-100).
   * @param float $processingTimeMs
   *   Total processing time in milliseconds.
   * @param array $images
   *   Array of extracted images with alt-text.
   * @param array $metadata
   *   Additional metadata about the conversion.
   */
  public function __construct(
    public readonly string $html,
    public readonly string $rawText,
    public readonly array $tables,
    public readonly int $pageCount,
    public readonly float $confidence,
    public readonly float $processingTimeMs = 0.0,
    public readonly array $images = [],
    public readonly array $metadata = [],
  ) {}

  /**
   * Create a result from Textract extraction and Bedrock structuring.
   *
   * @param \Drupal\ndx_aws_ai\Result\TextractResult $textractResult
   *   The Textract extraction result.
   * @param string $structuredHtml
   *   The HTML structured by Bedrock.
   * @param string $tablesHtml
   *   The HTML for converted tables.
   * @param float $processingTimeMs
   *   Total processing time.
   *
   * @return self
   *   A new PdfConversionResult instance.
   */
  public static function fromProcessing(
    TextractResult $textractResult,
    string $structuredHtml,
    string $tablesHtml,
    float $processingTimeMs,
  ): self {
    // Combine structured content and tables.
    $fullHtml = $structuredHtml;
    if (!empty($tablesHtml)) {
      $fullHtml .= "\n\n" . $tablesHtml;
    }

    return new self(
      html: $fullHtml,
      rawText: $textractResult->rawText,
      tables: $textractResult->tables,
      pageCount: $textractResult->pageCount,
      confidence: $textractResult->averageConfidence,
      processingTimeMs: $processingTimeMs,
      metadata: [
        'textract_processing_ms' => $textractResult->processingTimeMs,
        'table_count' => count($textractResult->tables),
        'line_count' => count($textractResult->lines),
      ],
    );
  }

  /**
   * Create a failed result.
   *
   * @param string $error
   *   The error message.
   *
   * @return self
   *   A result indicating failure.
   */
  public static function failed(string $error): self {
    return new self(
      html: '',
      rawText: '',
      tables: [],
      pageCount: 0,
      confidence: 0.0,
      metadata: ['error' => $error],
    );
  }

  /**
   * Check if the conversion was successful.
   *
   * @return bool
   *   TRUE if conversion produced HTML content.
   */
  public function isSuccess(): bool {
    return !empty($this->html) && !isset($this->metadata['error']);
  }

  /**
   * Get the error message if conversion failed.
   *
   * @return string|null
   *   The error message or NULL if successful.
   */
  public function getError(): ?string {
    return $this->metadata['error'] ?? NULL;
  }

  /**
   * Check if the result contains tables.
   *
   * @return bool
   *   TRUE if tables were extracted.
   */
  public function hasTables(): bool {
    return count($this->tables) > 0;
  }

  /**
   * Check if the result contains images.
   *
   * @return bool
   *   TRUE if images were extracted.
   */
  public function hasImages(): bool {
    return count($this->images) > 0;
  }

  /**
   * Get processing time in seconds.
   *
   * @return float
   *   Processing time in seconds.
   */
  public function getProcessingTimeSeconds(): float {
    return $this->processingTimeMs / 1000;
  }

  /**
   * Get word count from raw text.
   *
   * @return int
   *   Approximate word count.
   */
  public function getWordCount(): int {
    return str_word_count($this->rawText);
  }

  /**
   * Get the table count.
   *
   * @return int
   *   Number of tables extracted.
   */
  public function getTableCount(): int {
    return count($this->tables);
  }

  /**
   * Convert to array for JSON serialization.
   *
   * @return array
   *   Array representation.
   */
  public function toArray(): array {
    return [
      'html' => $this->html,
      'rawText' => $this->rawText,
      'pageCount' => $this->pageCount,
      'tableCount' => $this->getTableCount(),
      'wordCount' => $this->getWordCount(),
      'confidence' => round($this->confidence, 1),
      'processingTimeMs' => round($this->processingTimeMs, 0),
      'hasImages' => $this->hasImages(),
    ];
  }

}
