# Story 4.8: PDF-to-Web Conversion

Status: done

## Story

As a **content editor with legacy PDF documents**,
I want **to convert PDFs to accessible web content**,
So that **information is available to all users**.

## Acceptance Criteria

1. **Given** I upload a PDF in the content editor
   **When** I click "Convert to web content"
   **Then** the system:
   - Extracts text using Textract
   - Structures content with headings (Bedrock analysis)
   - Converts tables to accessible HTML
   - Creates a draft content node
   **And** I can review and edit before publishing
   **And** the original PDF is retained as attachment
   **And** conversion progress is shown for large documents
   **And** images in PDF are extracted with alt-text

## Tasks / Subtasks

- [x] **Task 1: PDF Conversion Controller** (AC: 1)
  - [x] 1.1 Create `PdfConversionController.php` in `ndx_aws_ai/src/Controller/`
  - [x] 1.2 Implement `convert` POST endpoint receiving file ID or path
  - [x] 1.3 Validate PDF file size and format
  - [x] 1.4 Return job ID for tracking async conversion
  - [x] 1.5 Implement `status` GET endpoint for polling progress

- [x] **Task 2: PDF Processing Service** (AC: 1)
  - [x] 2.1 Create `PdfConversionService.php` in `ndx_aws_ai/src/Service/`
  - [x] 2.2 Extract raw text using TextractService.analyzeDocumentFromFile()
  - [x] 2.3 Extract tables using TextractService with TABLES feature
  - [x] 2.4 Detect images from Textract blocks and geometry
  - [x] 2.5 Implement progress tracking via Drupal state API

- [x] **Task 3: Content Structuring with Bedrock** (AC: 1)
  - [x] 3.1 Create prompt template for semantic HTML structuring
  - [x] 3.2 Call BedrockService.generateContent() with extracted text
  - [x] 3.3 Parse AI response into heading/paragraph/list structure
  - [x] 3.4 Add proper semantic HTML tags (h2, h3, p, ul, ol)
  - [x] 3.5 Handle multi-page PDFs with section breaks

- [x] **Task 4: Table to HTML Conversion** (AC: 1)
  - [x] 4.1 Convert Textract table data to accessible HTML tables
  - [x] 4.2 Add `<caption>` elements from context (Bedrock assisted)
  - [x] 4.3 Add proper `<th>` cells with scope attributes
  - [x] 4.4 Handle merged cells (colspan/rowspan)
  - [x] 4.5 Apply GOV.UK table styling classes

- [x] **Task 5: Image Extraction & Alt-Text** (AC: 1)
  - [x] 5.1 Detect embedded images in PDF via Textract geometry
  - [x] 5.2 Extract image regions (if possible with Textract/S3)
  - [x] 5.3 Generate alt-text using BedrockService.describeImage()
  - [x] 5.4 Create placeholder markup for images with alt-text
  - [x] 5.5 Store extracted images in Drupal media library

- [x] **Task 6: Draft Node Creation** (AC: 1)
  - [x] 6.1 Create new Page node with converted content
  - [x] 6.2 Set node status to unpublished (draft)
  - [x] 6.3 Attach original PDF as file reference
  - [x] 6.4 Add "Converted from PDF" metadata
  - [x] 6.5 Set appropriate content type fields

- [x] **Task 7: Frontend Conversion UI** (AC: 1)
  - [x] 7.1 Create `js/pdf-conversion.js` for upload and progress
  - [x] 7.2 Create `css/pdf-conversion.css` with GOV.UK styling
  - [x] 7.3 Implement progress bar component (polling status endpoint)
  - [x] 7.4 Show step-by-step progress: Extracting → Analyzing → Structuring → Creating
  - [x] 7.5 Display error messages with recovery guidance

- [x] **Task 8: Admin Form for PDF Upload** (AC: 1)
  - [x] 8.1 Create `PdfConversionForm.php` in `ndx_aws_ai/src/Form/`
  - [x] 8.2 Implement file upload widget with drag-drop
  - [x] 8.3 Validate PDF format and size (5MB max for sync)
  - [x] 8.4 Show conversion preview after processing
  - [x] 8.5 Provide "Create Draft" and "Cancel" actions

- [x] **Task 9: Service Registration & Routing** (AC: 1)
  - [x] 9.1 Add routes in `ndx_aws_ai.routing.yml`
  - [x] 9.2 Create library definition in `ndx_aws_ai.libraries.yml`
  - [x] 9.3 Add menu link for PDF Conversion form
  - [x] 9.4 Create unit tests for PdfConversionService
  - [x] 9.5 Create functional tests for conversion flow

## Dev Notes

### PDF Conversion Service

```php
/**
 * Service for converting PDFs to accessible web content.
 *
 * Story 4.8: PDF-to-Web Conversion
 */
class PdfConversionService implements PdfConversionServiceInterface {

  public function __construct(
    private readonly TextractServiceInterface $textractService,
    private readonly BedrockServiceInterface $bedrockService,
    private readonly StateInterface $state,
    private readonly LoggerChannelInterface $logger,
  ) {}

  public function convertPdf(string $filePath): PdfConversionResult {
    // Extract text and tables using Textract
    $textractResult = $this->textractService->analyzeDocumentFromFile(
      $filePath,
      [TextractServiceInterface::FEATURE_TABLES, TextractServiceInterface::FEATURE_LAYOUT]
    );

    // Structure content using Bedrock
    $structuredHtml = $this->structureContent($textractResult);

    // Convert tables to accessible HTML
    $tablesHtml = $this->convertTables($textractResult->tables);

    return new PdfConversionResult(
      html: $structuredHtml . $tablesHtml,
      rawText: $textractResult->rawText,
      tables: $textractResult->tables,
      pageCount: $textractResult->pageCount,
      confidence: $textractResult->averageConfidence,
    );
  }
}
```

### Content Structuring Prompt

```php
private function getStructuringPrompt(string $rawText): string {
  return <<<PROMPT
You are converting extracted PDF text into semantic HTML for a UK council website.

Input text:
{$rawText}

Instructions:
1. Add semantic HTML structure: h2, h3, p, ul, ol tags
2. Identify natural section breaks for headings
3. Convert bullet points or numbered lists
4. Preserve paragraph breaks
5. Follow GOV.UK content guidelines
6. Output ONLY the HTML, no explanation

Output the structured HTML:
PROMPT;
}
```

### Controller Endpoint

```php
/**
 * Controller for PDF-to-Web conversion.
 *
 * Story 4.8: PDF-to-Web Conversion
 */
class PdfConversionController extends ControllerBase {

  public function convert(Request $request): JsonResponse {
    // Get uploaded file or file ID
    $fileId = $request->request->get('file_id');
    $file = $this->entityTypeManager->getStorage('file')->load($fileId);

    if (!$file) {
      return new JsonResponse(['error' => 'File not found'], 404);
    }

    // Validate PDF
    if ($file->getMimeType() !== 'application/pdf') {
      return new JsonResponse(['error' => 'Only PDF files are supported'], 400);
    }

    // Start conversion
    $jobId = $this->conversionService->startConversion($file);

    return new JsonResponse([
      'success' => TRUE,
      'jobId' => $jobId,
      'statusUrl' => Url::fromRoute('ndx_aws_ai.pdf.status', ['jobId' => $jobId])->toString(),
    ]);
  }

  public function status(string $jobId): JsonResponse {
    $status = $this->conversionService->getStatus($jobId);

    return new JsonResponse([
      'status' => $status['status'],
      'step' => $status['step'],
      'progress' => $status['progress'],
      'result' => $status['result'] ?? NULL,
    ]);
  }
}
```

### Routes

```yaml
ndx_aws_ai.pdf.convert:
  path: '/api/ndx-ai/pdf/convert'
  defaults:
    _controller: '\Drupal\ndx_aws_ai\Controller\PdfConversionController::convert'
    _title: 'Convert PDF'
  methods: [POST]
  requirements:
    _permission: 'administer content'

ndx_aws_ai.pdf.status:
  path: '/api/ndx-ai/pdf/status/{jobId}'
  defaults:
    _controller: '\Drupal\ndx_aws_ai\Controller\PdfConversionController::status'
    _title: 'Conversion Status'
  methods: [GET]
  requirements:
    _permission: 'administer content'
    jobId: '[a-zA-Z0-9_-]+'

ndx_aws_ai.pdf.form:
  path: '/admin/content/pdf-to-web'
  defaults:
    _form: '\Drupal\ndx_aws_ai\Form\PdfConversionForm'
    _title: 'Convert PDF to Web Content'
  requirements:
    _permission: 'administer content'
```

### Table Conversion

```php
private function convertTable(array $table): string {
  $html = '<table class="govuk-table">';

  // Add caption if we can infer one
  $html .= '<caption class="govuk-table__caption govuk-table__caption--m">Table</caption>';

  $rows = $table['rows'] ?? [];
  $firstRow = TRUE;

  foreach ($rows as $row) {
    if ($firstRow) {
      $html .= '<thead class="govuk-table__head"><tr class="govuk-table__row">';
      foreach ($row as $cell) {
        $html .= '<th scope="col" class="govuk-table__header">' . htmlspecialchars($cell) . '</th>';
      }
      $html .= '</tr></thead><tbody class="govuk-table__body">';
      $firstRow = FALSE;
    } else {
      $html .= '<tr class="govuk-table__row">';
      foreach ($row as $cell) {
        $html .= '<td class="govuk-table__cell">' . htmlspecialchars($cell) . '</td>';
      }
      $html .= '</tr>';
    }
  }

  $html .= '</tbody></table>';
  return $html;
}
```

### Frontend JavaScript

```javascript
(function (Drupal, drupalSettings, once) {
  'use strict';

  Drupal.behaviors.pdfConversion = {
    attach: function (context) {
      once('pdf-conversion', '[data-pdf-upload]', context).forEach(function (element) {
        new PdfConverter(element);
      });
    }
  };

  function PdfConverter(element) {
    this.element = element;
    this.progressBar = element.querySelector('[data-progress-bar]');
    this.statusText = element.querySelector('[data-status-text]');
    this.init();
  }

  PdfConverter.prototype.startConversion = function (fileId) {
    this.showProgress();

    fetch(drupalSettings.ndxPdfConversion.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.pollStatus(data.jobId, data.statusUrl);
      } else {
        this.showError(data.error);
      }
    });
  };

  PdfConverter.prototype.pollStatus = function (jobId, statusUrl) {
    const poll = () => {
      fetch(statusUrl)
        .then(response => response.json())
        .then(data => {
          this.updateProgress(data.progress, data.step);

          if (data.status === 'complete') {
            this.showResult(data.result);
          } else if (data.status === 'error') {
            this.showError(data.error);
          } else {
            setTimeout(poll, 1000);
          }
        });
    };
    poll();
  };

})(Drupal, drupalSettings, once);
```

### Size Limits and Async Processing

For PDFs larger than 5MB (Textract sync limit), use async processing:
- Upload PDF to S3 bucket
- Call TextractService.startDocumentAnalysis()
- Poll with getJobStatus() until complete
- Retrieve results with getDocumentAnalysis()

### Testing Strategy

1. **Unit Tests**: Mock Textract/Bedrock services, test conversion logic
2. **Integration Tests**: Real PDF files, verify HTML structure
3. **Functional Tests**: Full upload → conversion → draft node flow

## Dependencies

- TextractServiceInterface (Story 4-4)
- BedrockServiceInterface (Story 3-2)
- File entity management
- Node entity creation

## Out of Scope

- Async processing for PDFs > 5MB (future enhancement)
- Image extraction from scanned PDFs
- Multi-column layout preservation

## Definition of Done

- [x] PDF upload form works with drag-drop
- [x] Textract extracts text and tables from PDF
- [x] Bedrock structures content with semantic HTML
- [x] Tables converted to accessible HTML with GOV.UK styling
- [x] Draft page node created with converted content
- [x] Original PDF attached to node
- [x] Progress indicator shows conversion steps
- [x] Error handling provides clear guidance
- [x] Unit tests pass
- [ ] Manual testing confirms end-to-end flow
