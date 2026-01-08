<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\Core\Url;
use Drupal\ndx_aws_ai\Service\PdfConversionServiceInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for PDF-to-Web conversion endpoints.
 *
 * Provides REST API endpoints for uploading PDFs and converting
 * them to accessible web content.
 *
 * Story 4.8: PDF-to-Web Conversion
 */
class PdfConversionController extends ControllerBase {

  /**
   * Maximum file size for upload (5MB).
   */
  private const MAX_UPLOAD_SIZE = 5242880;

  /**
   * Constructs a PdfConversionController.
   *
   * Note: Uses parent's $this->entityTypeManager() instead of injecting
   * EntityTypeManagerInterface to avoid PHP 8.2 readonly property conflict.
   *
   * @param \Drupal\ndx_aws_ai\Service\PdfConversionServiceInterface $conversionService
   *   The PDF conversion service.
   * @param \Drupal\Core\Logger\LoggerChannelInterface $logger
   *   The logger.
   */
  public function __construct(
    private readonly PdfConversionServiceInterface $conversionService,
    private readonly LoggerChannelInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('ndx_aws_ai.pdf_conversion'),
      $container->get('logger.channel.ndx_aws_ai'),
    );
  }

  /**
   * Start PDF conversion from uploaded file.
   *
   * Expects POST with JSON body containing file_id.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The HTTP request.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with job ID or error.
   */
  public function convert(Request $request): JsonResponse {
    // Check service availability.
    if (!$this->conversionService->isAvailable()) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'PDF conversion service is not available. Please check AWS configuration.',
      ], 503);
    }

    // Parse request body.
    $data = json_decode($request->getContent(), TRUE);
    if (json_last_error() !== JSON_ERROR_NONE) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Invalid JSON in request body',
      ], 400);
    }

    // Validate file_id.
    $fileId = $data['file_id'] ?? NULL;
    if (!$fileId || !is_numeric($fileId)) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Missing or invalid file_id parameter',
      ], 400);
    }

    // Load and validate file.
    $file = $this->entityTypeManager()->getStorage('file')->load($fileId);
    if (!$file) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'File not found',
      ], 404);
    }

    // Validate MIME type.
    $mimeType = $file->getMimeType();
    if ($mimeType !== 'application/pdf') {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Only PDF files are supported. Received: ' . $mimeType,
      ], 400);
    }

    // Validate file size.
    $fileSize = $file->getSize();
    if ($fileSize > self::MAX_UPLOAD_SIZE) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => sprintf(
          'File too large. Maximum size is %s MB.',
          self::MAX_UPLOAD_SIZE / 1048576
        ),
      ], 413);
    }

    try {
      // Start conversion job.
      $jobId = $this->conversionService->startConversion((int) $fileId);

      $this->logger->info('Started PDF conversion job: @job for file: @file', [
        '@job' => $jobId,
        '@file' => $file->getFilename(),
      ]);

      return new JsonResponse([
        'success' => TRUE,
        'jobId' => $jobId,
        'statusUrl' => Url::fromRoute('ndx_aws_ai.pdf.status', ['jobId' => $jobId])->toString(),
        'message' => 'Conversion started',
      ]);
    }
    catch (\InvalidArgumentException $e) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => $e->getMessage(),
      ], 400);
    }
    catch (\Exception $e) {
      $this->logger->error('PDF conversion error: @error', ['@error' => $e->getMessage()]);

      return new JsonResponse([
        'success' => FALSE,
        'error' => 'An error occurred starting the conversion. Please try again.',
      ], 500);
    }
  }

  /**
   * Get conversion job status.
   *
   * @param string $jobId
   *   The job ID.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with status information.
   */
  public function status(string $jobId): JsonResponse {
    // Validate job ID format.
    if (!preg_match('/^pdf_\d+_[a-f0-9]+$/', $jobId)) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Invalid job ID format',
      ], 400);
    }

    $status = $this->conversionService->getStatus($jobId);

    return new JsonResponse([
      'success' => $status['status'] !== PdfConversionServiceInterface::STATUS_ERROR,
      'status' => $status['status'],
      'step' => $status['step'],
      'progress' => $status['progress'],
      'result' => $status['result'],
      'error' => $status['error'],
    ]);
  }

  /**
   * Create a draft node from conversion result.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The HTTP request.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with node ID or error.
   */
  public function createNode(Request $request): JsonResponse {
    $data = json_decode($request->getContent(), TRUE);
    if (json_last_error() !== JSON_ERROR_NONE) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Invalid JSON in request body',
      ], 400);
    }

    // Validate required fields.
    $jobId = $data['job_id'] ?? NULL;
    $title = $data['title'] ?? NULL;

    if (!$jobId) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Missing job_id parameter',
      ], 400);
    }

    if (!$title) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Missing title parameter',
      ], 400);
    }

    // Get job status and result.
    $status = $this->conversionService->getStatus($jobId);

    if ($status['status'] !== PdfConversionServiceInterface::STATUS_COMPLETE) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Conversion is not complete',
      ], 400);
    }

    $result = $status['result'];
    if (!$result || empty($result['html'])) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'No conversion result available',
      ], 400);
    }

    try {
      // Create the page node.
      $nodeStorage = $this->entityTypeManager()->getStorage('node');

      // Use localgov_services_page content type (LocalGov Drupal doesn't have 'page').
      $node = $nodeStorage->create([
        'type' => 'localgov_services_page',
        'title' => $title,
        'body' => [
          'value' => $result['html'],
          'format' => 'full_html',
        ],
        'status' => 0, // Unpublished (draft).
      ]);

      $node->save();

      $this->logger->info('Created draft node @nid from PDF conversion @job', [
        '@nid' => $node->id(),
        '@job' => $jobId,
      ]);

      return new JsonResponse([
        'success' => TRUE,
        'nodeId' => $node->id(),
        'editUrl' => Url::fromRoute('entity.node.edit_form', ['node' => $node->id()])->toString(),
        'message' => 'Draft page created successfully',
      ]);
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to create node: @error', ['@error' => $e->getMessage()]);

      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Failed to create page. Please try again.',
      ], 500);
    }
  }

  /**
   * Check if PDF conversion is available.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with availability status.
   */
  public function checkAvailability(): JsonResponse {
    $available = $this->conversionService->isAvailable();

    return new JsonResponse([
      'available' => $available,
      'maxFileSize' => self::MAX_UPLOAD_SIZE,
      'maxFileSizeMb' => self::MAX_UPLOAD_SIZE / 1048576,
    ]);
  }

}
