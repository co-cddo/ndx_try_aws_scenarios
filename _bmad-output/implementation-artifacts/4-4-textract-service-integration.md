# Story 4.4: Textract Service Integration

Status: done

## Story

As a **developer building document processing features**,
I want **an Amazon Textract client service**,
So that **I can extract structured content from PDFs**.

## Acceptance Criteria

1. **Given** the ndx_aws_ai module is enabled
   **When** I inject the Textract service
   **Then** I can:
   - Upload PDF documents for analysis
   - Extract text with layout preservation
   - Identify tables and form fields
   - Handle multi-page documents
   **And** extracted content includes confidence scores
   **And** the service handles scanned documents (OCR)
   **And** processing status is trackable for async operations

## Tasks / Subtasks

- [ ] **Task 1: Create Textract Service Interface** (AC: 1)
  - [ ] 1.1 Create `TextractServiceInterface.php` in `ndx_aws_ai/src/Service/`
  - [ ] 1.2 Define method signatures for document analysis
  - [ ] 1.3 Define supported document formats constant (PDF, JPEG, PNG)
  - [ ] 1.4 Define maximum file size constant (5MB for sync, 500MB for async)
  - [ ] 1.5 Define operation types: DetectText, AnalyzeDocument, StartDocumentAnalysis

- [ ] **Task 2: Create Textract Result Value Objects** (AC: 1)
  - [ ] 2.1 Create `TextractResult.php` value object with blocks, tables, forms
  - [ ] 2.2 Create `TextractBlock.php` for individual text/line/word blocks
  - [ ] 2.3 Create `TextractTable.php` for table structure
  - [ ] 2.4 Create `TextractKeyValue.php` for form field key-value pairs
  - [ ] 2.5 Include confidence scores at all levels

- [ ] **Task 3: Implement Textract Service Class** (AC: 1)
  - [ ] 3.1 Create `TextractService.php` implementing TextractServiceInterface
  - [ ] 3.2 Use AwsClientFactory to get Textract client
  - [ ] 3.3 Implement synchronous `detectDocumentText()` for simple text extraction
  - [ ] 3.4 Implement synchronous `analyzeDocument()` for tables/forms

- [ ] **Task 4: Implement Async Document Processing** (AC: 1)
  - [ ] 4.1 Implement `startDocumentAnalysis()` for large/multi-page documents
  - [ ] 4.2 Implement `getDocumentAnalysis()` for polling job status
  - [ ] 4.3 Store job IDs in Drupal state for tracking
  - [ ] 4.4 Implement `isJobComplete()` status check method
  - [ ] 4.5 Handle SUCCEEDED, IN_PROGRESS, FAILED job states

- [ ] **Task 5: S3 Integration for Async Operations** (AC: 1)
  - [ ] 5.1 Configure S3 bucket for async document upload
  - [ ] 5.2 Implement `uploadDocumentToS3()` helper method
  - [ ] 5.3 Implement S3 bucket reference for async API calls
  - [ ] 5.4 Handle cleanup of processed documents

- [ ] **Task 6: Rate Limiting & Error Handling** (AC: 1)
  - [ ] 6.1 Create `TextractRateLimiter.php` following existing pattern
  - [ ] 6.2 Handle Textract-specific error codes (ProvisionedThroughputExceededException)
  - [ ] 6.3 Implement retry logic for transient failures
  - [ ] 6.4 Log operation metrics (processing time, page count)

- [ ] **Task 7: Service Registration & Testing** (AC: 1)
  - [ ] 7.1 Register TextractService in `ndx_aws_ai.services.yml`
  - [ ] 7.2 Create unit tests with mocked Textract client
  - [ ] 7.3 Test block parsing and table reconstruction
  - [ ] 7.4 Document service API in code comments

## Dev Notes

### Textract API Operations

Amazon Textract provides three main operations:

1. **DetectDocumentText** - Basic OCR, extracts all text with layout
2. **AnalyzeDocument** - Adds table and form detection
3. **StartDocumentAnalysis** - Async version for multi-page PDFs

```php
use Aws\Textract\TextractClient;

$client = new TextractClient([
    'version' => 'latest',
    'region' => $this->config->get('aws_region'),
]);

// Synchronous text detection
$result = $client->detectDocumentText([
    'Document' => [
        'Bytes' => file_get_contents($filePath),
    ],
]);

// Synchronous analysis with tables/forms
$result = $client->analyzeDocument([
    'Document' => [
        'Bytes' => file_get_contents($filePath),
    ],
    'FeatureTypes' => ['TABLES', 'FORMS'],
]);

// Async for multi-page PDF
$result = $client->startDocumentAnalysis([
    'DocumentLocation' => [
        'S3Object' => [
            'Bucket' => 'my-bucket',
            'Name' => 'document.pdf',
        ],
    ],
    'FeatureTypes' => ['TABLES', 'FORMS'],
]);
$jobId = $result['JobId'];

// Poll for results
$response = $client->getDocumentAnalysis([
    'JobId' => $jobId,
]);
```

### Block Types Returned by Textract

- `PAGE` - Individual document page
- `LINE` - A line of text
- `WORD` - Individual words within lines
- `TABLE` - Table structure (CELL blocks as children)
- `CELL` - Table cells (row/column indices)
- `KEY_VALUE_SET` - Form key-value pairs
- `SELECTION_ELEMENT` - Checkboxes/radio buttons

### Reconstructing Tables

```php
// Cells reference their row/column via RowIndex and ColumnIndex
// Tables have CHILD relationships to CELL blocks
$tables = [];
foreach ($blocks as $block) {
    if ($block['BlockType'] === 'TABLE') {
        $cells = $this->getCellsForTable($block, $blocks);
        $table = $this->reconstructTable($cells);
        $tables[] = $table;
    }
}
```

### TextractResult Value Object

```php
final class TextractResult {
    public function __construct(
        public readonly array $pages,
        public readonly array $tables,
        public readonly array $keyValues,
        public readonly string $rawText,
        public readonly float $processingTimeMs,
        public readonly int $pageCount,
        public readonly ?string $jobId = NULL,
    ) {}

    public static function fromSyncResponse(array $blocks, float $timeMs): self
    public static function fromAsyncResponse(array $blocks, string $jobId, float $timeMs): self
}
```

### File Size Limits

- Synchronous: 5MB max (single page only for PDFs)
- Async: 500MB max, multi-page PDFs supported
- Supported formats: PDF, JPEG, PNG

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 4.4]
- [Story 4-1: Polly TTS Service Integration] - pattern for AWS service clients
- [Story 4-2: Amazon Translate Service Integration] - pattern for AWS service clients
- [Story 4-3: Nova 2 Omni Vision Service] - pattern for AWS service clients
- [Amazon Textract Documentation](https://docs.aws.amazon.com/textract/latest/dg/)
- [Textract API Reference](https://docs.aws.amazon.com/textract/latest/dg/API_Reference.html)

## Code Review Record

**Review Date:** 2025-12-30
**Reviewer:** Code Review Agent
**Status:** APPROVED with minor fixes

### Findings

1. **Minor - Missing test for base64 input path**
   - **Location:** TextractServiceTest.php
   - **Issue:** The `isBase64` parameter path wasn't covered by tests
   - **Fix:** Added `testDetectDocumentTextBase64()` test case
   - **Status:** ✅ Fixed

### Summary

The implementation follows established patterns from Polly, Translate, and Vision services. The code is well-structured with:
- Comprehensive interface with constants and documentation
- TextractResult value object with static factories for different response types
- Proper table and form key-value pair extraction from block structures
- Rate limiting with exponential backoff
- Full unit test coverage including data providers

All acceptance criteria have been met. The service provides both synchronous (DetectDocumentText, AnalyzeDocument) and asynchronous (StartDocumentAnalysis, GetDocumentAnalysis) operations as specified.

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-30 | Story created with Textract specifications | SM Agent |
| 2025-12-30 | Implementation complete with all files | Dev Agent |
| 2025-12-30 | Code review passed with minor test fix | Review Agent |
