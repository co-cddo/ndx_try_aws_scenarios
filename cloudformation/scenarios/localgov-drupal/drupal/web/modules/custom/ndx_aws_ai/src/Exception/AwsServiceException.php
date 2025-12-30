<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Exception;

/**
 * Exception thrown when an AWS service operation fails.
 *
 * Provides user-friendly error messages while preserving technical details
 * for logging and debugging.
 *
 * Story 3.1: ndx_aws_ai Module Foundation
 */
class AwsServiceException extends \Exception {

  /**
   * The AWS error code.
   */
  protected string $awsErrorCode;

  /**
   * The AWS service that generated the error.
   */
  protected string $awsService;

  /**
   * User-friendly error message.
   */
  protected string $userMessage;

  /**
   * Constructs an AwsServiceException.
   *
   * @param string $message
   *   The technical error message.
   * @param string $awsErrorCode
   *   The AWS error code (e.g., 'AccessDeniedException').
   * @param string $awsService
   *   The AWS service name (e.g., 'Bedrock').
   * @param string $userMessage
   *   A user-friendly error message.
   * @param int $code
   *   The exception code.
   * @param \Throwable|null $previous
   *   The previous throwable used for exception chaining.
   */
  public function __construct(
    string $message,
    string $awsErrorCode = '',
    string $awsService = '',
    string $userMessage = '',
    int $code = 0,
    ?\Throwable $previous = NULL,
  ) {
    parent::__construct($message, $code, $previous);
    $this->awsErrorCode = $awsErrorCode;
    $this->awsService = $awsService;
    $this->userMessage = $userMessage ?: $message;
  }

  /**
   * Get the AWS error code.
   *
   * @return string
   *   The AWS error code.
   */
  public function getAwsErrorCode(): string {
    return $this->awsErrorCode;
  }

  /**
   * Get the AWS service name.
   *
   * @return string
   *   The AWS service name.
   */
  public function getAwsService(): string {
    return $this->awsService;
  }

  /**
   * Get the user-friendly error message.
   *
   * @return string
   *   A message suitable for display to end users.
   */
  public function getUserMessage(): string {
    return $this->userMessage;
  }

}
