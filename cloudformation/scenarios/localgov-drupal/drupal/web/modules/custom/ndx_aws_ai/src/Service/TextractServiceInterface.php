<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

/**
 * Interface for Amazon Textract document analysis service.
 *
 * Provides PDF and image document text extraction.
 *
 * Story 3.1: ndx_aws_ai Module Foundation
 */
interface TextractServiceInterface {

  /**
   * Analyze a document and extract text.
   *
   * @param string $documentData
   *   Base64-encoded document data (PDF or image).
   *
   * @return string
   *   The extracted text content.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function analyzeDocument(string $documentData): string;

  /**
   * Extract structured data from a document.
   *
   * @param string $documentData
   *   Base64-encoded document data.
   *
   * @return array<string, mixed>
   *   Structured data including text, tables, and forms.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function extractStructuredData(string $documentData): array;

  /**
   * Extract tables from a document.
   *
   * @param string $documentData
   *   Base64-encoded document data.
   *
   * @return array<int, array<int, array<int, string>>>
   *   Array of tables, each containing rows of cells.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function extractTables(string $documentData): array;

  /**
   * Extract form key-value pairs from a document.
   *
   * @param string $documentData
   *   Base64-encoded document data.
   *
   * @return array<string, string>
   *   Array of form field names to values.
   *
   * @throws \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   If the API call fails.
   */
  public function extractFormFields(string $documentData): array;

}
