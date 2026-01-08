<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Result;

/**
 * Value object for Textract document analysis results.
 *
 * Represents the extracted content from a document including text blocks,
 * tables, form key-value pairs, and confidence scores.
 *
 * Story 4.4: Textract Service Integration
 */
final class TextractResult {

  /**
   * Block type constants matching Textract API.
   */
  public const BLOCK_PAGE = 'PAGE';
  public const BLOCK_LINE = 'LINE';
  public const BLOCK_WORD = 'WORD';
  public const BLOCK_TABLE = 'TABLE';
  public const BLOCK_CELL = 'CELL';
  public const BLOCK_KEY_VALUE_SET = 'KEY_VALUE_SET';
  public const BLOCK_SELECTION_ELEMENT = 'SELECTION_ELEMENT';

  /**
   * Constructs a TextractResult.
   *
   * @param string $rawText
   *   The concatenated raw text from the document.
   * @param array $lines
   *   Array of text lines with confidence scores.
   * @param array $tables
   *   Array of table data structures.
   * @param array $keyValues
   *   Array of form key-value pairs.
   * @param float $processingTimeMs
   *   Processing time in milliseconds.
   * @param int $pageCount
   *   Number of pages processed.
   * @param float $averageConfidence
   *   Average confidence score (0-100).
   * @param string|null $jobId
   *   Job ID for async operations.
   * @param string|null $nextToken
   *   Pagination token for additional results.
   * @param string $jobStatus
   *   Job status: SUCCEEDED, IN_PROGRESS, FAILED, PARTIAL_SUCCESS.
   * @param array $blocks
   *   Raw block data from Textract for advanced processing.
   */
  public function __construct(
    public readonly string $rawText,
    public readonly array $lines,
    public readonly array $tables,
    public readonly array $keyValues,
    public readonly float $processingTimeMs,
    public readonly int $pageCount,
    public readonly float $averageConfidence,
    public readonly ?string $jobId = NULL,
    public readonly ?string $nextToken = NULL,
    public readonly string $jobStatus = 'SUCCEEDED',
    public readonly array $blocks = [],
  ) {}

  /**
   * Create a result from Textract DetectDocumentText response.
   *
   * @param array $blocks
   *   The blocks from Textract response.
   * @param float $processingTimeMs
   *   Processing time in milliseconds.
   *
   * @return self
   *   A new TextractResult instance.
   */
  public static function fromDetectTextResponse(array $blocks, float $processingTimeMs): self {
    $lines = [];
    $rawTextParts = [];
    $confidences = [];
    $pageCount = 0;

    foreach ($blocks as $block) {
      $type = $block['BlockType'] ?? '';

      if ($type === self::BLOCK_PAGE) {
        $pageCount++;
      }

      if ($type === self::BLOCK_LINE) {
        $text = $block['Text'] ?? '';
        $confidence = $block['Confidence'] ?? 0.0;
        $lines[] = [
          'text' => $text,
          'confidence' => $confidence,
          'id' => $block['Id'] ?? '',
          'geometry' => $block['Geometry'] ?? [],
        ];
        $rawTextParts[] = $text;
        $confidences[] = $confidence;
      }
    }

    $avgConfidence = count($confidences) > 0
      ? array_sum($confidences) / count($confidences)
      : 0.0;

    return new self(
      rawText: implode("\n", $rawTextParts),
      lines: $lines,
      tables: [],
      keyValues: [],
      processingTimeMs: $processingTimeMs,
      pageCount: max(1, $pageCount),
      averageConfidence: $avgConfidence,
      blocks: $blocks,
    );
  }

  /**
   * Create a result from Textract AnalyzeDocument response.
   *
   * @param array $blocks
   *   The blocks from Textract response.
   * @param float $processingTimeMs
   *   Processing time in milliseconds.
   *
   * @return self
   *   A new TextractResult instance.
   */
  public static function fromAnalyzeDocumentResponse(array $blocks, float $processingTimeMs): self {
    $blockIndex = self::buildBlockIndex($blocks);
    $lines = [];
    $rawTextParts = [];
    $tables = [];
    $keyValues = [];
    $confidences = [];
    $pageCount = 0;

    foreach ($blocks as $block) {
      $type = $block['BlockType'] ?? '';
      $confidence = $block['Confidence'] ?? 0.0;

      switch ($type) {
        case self::BLOCK_PAGE:
          $pageCount++;
          break;

        case self::BLOCK_LINE:
          $text = $block['Text'] ?? '';
          $lines[] = [
            'text' => $text,
            'confidence' => $confidence,
            'id' => $block['Id'] ?? '',
            'geometry' => $block['Geometry'] ?? [],
          ];
          $rawTextParts[] = $text;
          $confidences[] = $confidence;
          break;

        case self::BLOCK_TABLE:
          $tables[] = self::reconstructTable($block, $blockIndex);
          break;

        case self::BLOCK_KEY_VALUE_SET:
          if (($block['EntityTypes'] ?? []) === ['KEY']) {
            $pair = self::extractKeyValuePair($block, $blockIndex);
            if ($pair !== NULL) {
              $keyValues[] = $pair;
            }
          }
          break;
      }
    }

    $avgConfidence = count($confidences) > 0
      ? array_sum($confidences) / count($confidences)
      : 0.0;

    return new self(
      rawText: implode("\n", $rawTextParts),
      lines: $lines,
      tables: $tables,
      keyValues: $keyValues,
      processingTimeMs: $processingTimeMs,
      pageCount: max(1, $pageCount),
      averageConfidence: $avgConfidence,
      blocks: $blocks,
    );
  }

  /**
   * Create a result from async GetDocumentAnalysis response.
   *
   * @param array $response
   *   The full Textract GetDocumentAnalysis response.
   * @param string $jobId
   *   The job ID.
   * @param float $processingTimeMs
   *   Processing time in milliseconds.
   *
   * @return self
   *   A new TextractResult instance.
   */
  public static function fromAsyncResponse(array $response, string $jobId, float $processingTimeMs): self {
    $blocks = $response['Blocks'] ?? [];
    $jobStatus = $response['JobStatus'] ?? 'SUCCEEDED';
    $nextToken = $response['NextToken'] ?? NULL;

    // If in progress, return minimal result.
    if ($jobStatus === 'IN_PROGRESS') {
      return new self(
        rawText: '',
        lines: [],
        tables: [],
        keyValues: [],
        processingTimeMs: $processingTimeMs,
        pageCount: 0,
        averageConfidence: 0.0,
        jobId: $jobId,
        nextToken: $nextToken,
        jobStatus: $jobStatus,
        blocks: [],
      );
    }

    $result = self::fromAnalyzeDocumentResponse($blocks, $processingTimeMs);

    return new self(
      rawText: $result->rawText,
      lines: $result->lines,
      tables: $result->tables,
      keyValues: $result->keyValues,
      processingTimeMs: $result->processingTimeMs,
      pageCount: $result->pageCount,
      averageConfidence: $result->averageConfidence,
      jobId: $jobId,
      nextToken: $nextToken,
      jobStatus: $jobStatus,
      blocks: $blocks,
    );
  }

  /**
   * Create a result for failed or in-progress jobs.
   *
   * @param string $jobId
   *   The job ID.
   * @param string $status
   *   The job status.
   * @param float $processingTimeMs
   *   Processing time in milliseconds.
   *
   * @return self
   *   A new TextractResult instance.
   */
  public static function fromJobStatus(string $jobId, string $status, float $processingTimeMs): self {
    return new self(
      rawText: '',
      lines: [],
      tables: [],
      keyValues: [],
      processingTimeMs: $processingTimeMs,
      pageCount: 0,
      averageConfidence: 0.0,
      jobId: $jobId,
      jobStatus: $status,
    );
  }

  /**
   * Check if the extraction was successful.
   *
   * @return bool
   *   TRUE if extraction succeeded.
   */
  public function isSuccess(): bool {
    return $this->jobStatus === 'SUCCEEDED' || $this->jobStatus === 'PARTIAL_SUCCESS';
  }

  /**
   * Check if there are more results to fetch.
   *
   * @return bool
   *   TRUE if more pages are available.
   */
  public function hasMoreResults(): bool {
    return $this->nextToken !== NULL;
  }

  /**
   * Check if job is still in progress.
   *
   * @return bool
   *   TRUE if job is still processing.
   */
  public function isInProgress(): bool {
    return $this->jobStatus === 'IN_PROGRESS';
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
   * Check if the result contains form key-value pairs.
   *
   * @return bool
   *   TRUE if form fields were extracted.
   */
  public function hasKeyValues(): bool {
    return count($this->keyValues) > 0;
  }

  /**
   * Get form key-value pairs as associative array.
   *
   * @return array<string, string>
   *   Array of field names to values.
   */
  public function getKeyValuesAsArray(): array {
    $result = [];
    foreach ($this->keyValues as $pair) {
      $key = $pair['key'] ?? '';
      $value = $pair['value'] ?? '';
      if ($key !== '') {
        $result[$key] = $value;
      }
    }
    return $result;
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
   * Build an index of blocks by ID for efficient lookup.
   *
   * @param array $blocks
   *   Array of block data.
   *
   * @return array<string, array>
   *   Block ID to block data map.
   */
  private static function buildBlockIndex(array $blocks): array {
    $index = [];
    foreach ($blocks as $block) {
      $id = $block['Id'] ?? '';
      if ($id !== '') {
        $index[$id] = $block;
      }
    }
    return $index;
  }

  /**
   * Reconstruct a table from Textract blocks.
   *
   * @param array $tableBlock
   *   The TABLE block.
   * @param array $blockIndex
   *   Block ID to block map.
   *
   * @return array
   *   Table data with rows, columns, and cells.
   */
  private static function reconstructTable(array $tableBlock, array $blockIndex): array {
    $cells = [];
    $maxRow = 0;
    $maxCol = 0;

    // Get all CELL children.
    $relationships = $tableBlock['Relationships'] ?? [];
    foreach ($relationships as $rel) {
      if (($rel['Type'] ?? '') === 'CHILD') {
        foreach ($rel['Ids'] ?? [] as $childId) {
          $childBlock = $blockIndex[$childId] ?? NULL;
          if ($childBlock !== NULL && ($childBlock['BlockType'] ?? '') === self::BLOCK_CELL) {
            $rowIndex = $childBlock['RowIndex'] ?? 1;
            $colIndex = $childBlock['ColumnIndex'] ?? 1;
            $rowSpan = $childBlock['RowSpan'] ?? 1;
            $colSpan = $childBlock['ColumnSpan'] ?? 1;

            // Get cell text.
            $cellText = self::getCellText($childBlock, $blockIndex);

            $cells[] = [
              'row' => $rowIndex,
              'column' => $colIndex,
              'rowSpan' => $rowSpan,
              'colSpan' => $colSpan,
              'text' => $cellText,
              'confidence' => $childBlock['Confidence'] ?? 0.0,
            ];

            $maxRow = max($maxRow, $rowIndex + $rowSpan - 1);
            $maxCol = max($maxCol, $colIndex + $colSpan - 1);
          }
        }
      }
    }

    // Build 2D array.
    $rows = [];
    for ($r = 1; $r <= $maxRow; $r++) {
      $row = [];
      for ($c = 1; $c <= $maxCol; $c++) {
        $row[$c] = '';
      }
      $rows[$r] = $row;
    }

    // Fill in cell values.
    foreach ($cells as $cell) {
      $rows[$cell['row']][$cell['column']] = $cell['text'];
    }

    // Convert to 0-indexed arrays.
    $result = [];
    foreach ($rows as $row) {
      $result[] = array_values($row);
    }

    return [
      'rows' => $result,
      'rowCount' => $maxRow,
      'columnCount' => $maxCol,
      'cells' => $cells,
      'confidence' => $tableBlock['Confidence'] ?? 0.0,
    ];
  }

  /**
   * Get text content from a cell block.
   *
   * @param array $cellBlock
   *   The CELL block.
   * @param array $blockIndex
   *   Block ID to block map.
   *
   * @return string
   *   The cell text.
   */
  private static function getCellText(array $cellBlock, array $blockIndex): string {
    $textParts = [];
    $relationships = $cellBlock['Relationships'] ?? [];

    foreach ($relationships as $rel) {
      if (($rel['Type'] ?? '') === 'CHILD') {
        foreach ($rel['Ids'] ?? [] as $childId) {
          $childBlock = $blockIndex[$childId] ?? NULL;
          if ($childBlock !== NULL) {
            $type = $childBlock['BlockType'] ?? '';
            if ($type === self::BLOCK_WORD || $type === self::BLOCK_LINE) {
              $textParts[] = $childBlock['Text'] ?? '';
            }
          }
        }
      }
    }

    return implode(' ', $textParts);
  }

  /**
   * Extract a key-value pair from KEY_VALUE_SET blocks.
   *
   * @param array $keyBlock
   *   The KEY block.
   * @param array $blockIndex
   *   Block ID to block map.
   *
   * @return array|null
   *   Key-value pair data or NULL if extraction failed.
   */
  private static function extractKeyValuePair(array $keyBlock, array $blockIndex): ?array {
    $keyText = '';
    $valueText = '';
    $valueBlockId = NULL;
    $keyConfidence = $keyBlock['Confidence'] ?? 0.0;
    $valueConfidence = 0.0;

    // Get key text.
    $relationships = $keyBlock['Relationships'] ?? [];
    foreach ($relationships as $rel) {
      $type = $rel['Type'] ?? '';
      $ids = $rel['Ids'] ?? [];

      if ($type === 'CHILD') {
        foreach ($ids as $childId) {
          $childBlock = $blockIndex[$childId] ?? NULL;
          if ($childBlock !== NULL) {
            $childType = $childBlock['BlockType'] ?? '';
            if ($childType === self::BLOCK_WORD) {
              $keyText .= ($keyText ? ' ' : '') . ($childBlock['Text'] ?? '');
            }
          }
        }
      }
      elseif ($type === 'VALUE') {
        $valueBlockId = $ids[0] ?? NULL;
      }
    }

    // Get value text.
    if ($valueBlockId !== NULL) {
      $valueBlock = $blockIndex[$valueBlockId] ?? NULL;
      if ($valueBlock !== NULL) {
        $valueConfidence = $valueBlock['Confidence'] ?? 0.0;
        $valueRels = $valueBlock['Relationships'] ?? [];
        foreach ($valueRels as $rel) {
          if (($rel['Type'] ?? '') === 'CHILD') {
            foreach ($rel['Ids'] ?? [] as $childId) {
              $childBlock = $blockIndex[$childId] ?? NULL;
              if ($childBlock !== NULL) {
                $childType = $childBlock['BlockType'] ?? '';
                if ($childType === self::BLOCK_WORD) {
                  $valueText .= ($valueText ? ' ' : '') . ($childBlock['Text'] ?? '');
                }
                elseif ($childType === self::BLOCK_SELECTION_ELEMENT) {
                  $status = $childBlock['SelectionStatus'] ?? 'NOT_SELECTED';
                  $valueText = $status === 'SELECTED' ? 'Yes' : 'No';
                }
              }
            }
          }
        }
      }
    }

    if ($keyText === '') {
      return NULL;
    }

    return [
      'key' => trim($keyText),
      'value' => trim($valueText),
      'keyConfidence' => $keyConfidence,
      'valueConfidence' => $valueConfidence,
    ];
  }

}
