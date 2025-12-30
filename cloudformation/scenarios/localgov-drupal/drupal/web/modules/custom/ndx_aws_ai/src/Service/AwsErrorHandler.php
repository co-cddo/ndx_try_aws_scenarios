<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Aws\Exception\AwsException;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\StringTranslation\TranslationInterface;
use Drupal\ndx_aws_ai\Exception\AwsServiceException;
use Psr\Log\LoggerInterface;

/**
 * Handles AWS API errors with user-friendly messages and logging.
 *
 * Story 3.1: ndx_aws_ai Module Foundation
 */
class AwsErrorHandler {

  use StringTranslationTrait;

  /**
   * The logger.
   */
  protected LoggerInterface $logger;

  /**
   * Constructs an AwsErrorHandler.
   *
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $loggerFactory
   *   The logger factory.
   * @param \Drupal\Core\StringTranslation\TranslationInterface $stringTranslation
   *   The string translation service.
   */
  public function __construct(
    LoggerChannelFactoryInterface $loggerFactory,
    TranslationInterface $stringTranslation,
  ) {
    $this->logger = $loggerFactory->get('ndx_aws_ai');
    $this->stringTranslation = $stringTranslation;
  }

  /**
   * Handle an AWS exception and convert to AwsServiceException.
   *
   * @param \Aws\Exception\AwsException $exception
   *   The AWS exception.
   * @param string $service
   *   The AWS service name (e.g., 'Bedrock', 'Polly').
   * @param string $operation
   *   The operation that failed (e.g., 'InvokeModel', 'SynthesizeSpeech').
   *
   * @return \Drupal\ndx_aws_ai\Exception\AwsServiceException
   *   A wrapped exception with user-friendly message.
   */
  public function handleException(AwsException $exception, string $service, string $operation): AwsServiceException {
    $errorCode = $exception->getAwsErrorCode() ?? 'UnknownError';
    $errorMessage = $exception->getAwsErrorMessage() ?? $exception->getMessage();

    // Log the full technical error
    $this->logger->error('AWS @service error during @operation: [@code] @message', [
      '@service' => $service,
      '@operation' => $operation,
      '@code' => $errorCode,
      '@message' => $errorMessage,
    ]);

    // Get user-friendly message
    $userMessage = $this->getUserFriendlyMessage($errorCode, $service);

    return new AwsServiceException(
      message: $errorMessage,
      awsErrorCode: $errorCode,
      awsService: $service,
      userMessage: $userMessage,
      previous: $exception,
    );
  }

  /**
   * Get a user-friendly error message for common AWS errors.
   *
   * @param string $errorCode
   *   The AWS error code.
   * @param string $service
   *   The AWS service name.
   *
   * @return string
   *   A user-friendly error message.
   */
  public function getUserFriendlyMessage(string $errorCode, string $service): string {
    return match ($errorCode) {
      'AccessDeniedException', 'AccessDenied' => (string) $this->t(
        'Permission denied. The AI service is not available in this environment. Please contact your administrator.'
      ),
      'ThrottlingException', 'Throttling' => (string) $this->t(
        'The AI service is temporarily busy. Please wait a moment and try again.'
      ),
      'ServiceUnavailableException', 'ServiceUnavailable' => (string) $this->t(
        'The AI service is temporarily unavailable. Please try again later.'
      ),
      'ValidationException' => (string) $this->t(
        'Invalid request. Please check your input and try again.'
      ),
      'ResourceNotFoundException' => (string) $this->t(
        'The requested AI model or resource was not found. Please contact your administrator.'
      ),
      'ModelNotReadyException' => (string) $this->t(
        'The AI model is not ready. Please wait a moment and try again.'
      ),
      'ModelTimeoutException' => (string) $this->t(
        'The AI request took too long. Please try with shorter content.'
      ),
      'ModelStreamErrorException' => (string) $this->t(
        'There was an error streaming the AI response. Please try again.'
      ),
      'InternalServerException', 'InternalServerError' => (string) $this->t(
        'An internal error occurred with the AI service. Please try again later.'
      ),
      'ExpiredTokenException' => (string) $this->t(
        'The security credentials have expired. Please contact your administrator.'
      ),
      'UnrecognizedClientException' => (string) $this->t(
        'Authentication failed. The AI service cannot verify the request. Please contact your administrator.'
      ),
      default => (string) $this->t(
        'An error occurred while processing your request. Please try again or contact your administrator if the problem persists.'
      ),
    };
  }

  /**
   * Log an AWS operation for debugging and cost tracking.
   *
   * @param string $service
   *   The AWS service name.
   * @param string $operation
   *   The operation performed.
   * @param array<string, mixed> $context
   *   Additional context (e.g., tokens used, duration).
   */
  public function logOperation(string $service, string $operation, array $context = []): void {
    $this->logger->info('AWS @service @operation: @context', [
      '@service' => $service,
      '@operation' => $operation,
      '@context' => json_encode($context),
    ]);
  }

  /**
   * Log a warning for retryable errors.
   *
   * @param string $service
   *   The AWS service name.
   * @param string $operation
   *   The operation that failed.
   * @param int $attempt
   *   The retry attempt number.
   * @param string $errorCode
   *   The AWS error code.
   */
  public function logRetry(string $service, string $operation, int $attempt, string $errorCode): void {
    $this->logger->warning('AWS @service @operation retry @attempt due to @code', [
      '@service' => $service,
      '@operation' => $operation,
      '@attempt' => $attempt,
      '@code' => $errorCode,
    ]);
  }

}
