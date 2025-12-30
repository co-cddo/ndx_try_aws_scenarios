<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\RateLimiter;

use Psr\Log\LoggerInterface;

/**
 * Rate limiter for Amazon Textract API calls.
 *
 * Implements exponential backoff with jitter for handling
 * Textract throttling and transient errors.
 *
 * Story 4.4: Textract Service Integration
 */
class TextractRateLimiter {

  /**
   * Maximum number of retry attempts.
   */
  protected const MAX_RETRIES = 3;

  /**
   * Base delay between requests in milliseconds.
   */
  protected const BASE_DELAY_MS = 200;

  /**
   * Maximum delay between retries in milliseconds.
   */
  protected const MAX_DELAY_MS = 5000;

  /**
   * Retryable Textract error codes.
   */
  protected const RETRYABLE_ERRORS = [
    'ThrottlingException',
    'ProvisionedThroughputExceededException',
    'InternalServerError',
    'ServiceUnavailableException',
    'LimitExceededException',
  ];

  /**
   * Timestamp of the last request.
   *
   * @var float
   */
  protected float $lastRequestTime = 0;

  /**
   * Count of consecutive failures.
   *
   * @var int
   */
  protected int $consecutiveFailures = 0;

  /**
   * Constructs a TextractRateLimiter.
   *
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected LoggerInterface $logger,
  ) {}

  /**
   * Wait if needed before making a request.
   *
   * Ensures minimum spacing between requests and applies
   * additional delay based on recent failure count.
   */
  public function waitIfNeeded(): void {
    $now = microtime(TRUE) * 1000;
    $elapsed = $now - $this->lastRequestTime;

    // Calculate delay based on failure count.
    $delay = self::BASE_DELAY_MS;
    if ($this->consecutiveFailures > 0) {
      $delay = min(
        self::MAX_DELAY_MS,
        self::BASE_DELAY_MS * pow(2, $this->consecutiveFailures)
      );
    }

    if ($elapsed < $delay) {
      $sleepMs = (int) ($delay - $elapsed);
      usleep($sleepMs * 1000);
    }

    $this->lastRequestTime = microtime(TRUE) * 1000;
  }

  /**
   * Record a successful request.
   *
   * Resets the failure counter on success.
   */
  public function recordSuccess(): void {
    $this->consecutiveFailures = 0;
  }

  /**
   * Record a failed request.
   *
   * Increments the failure counter for backoff calculation.
   */
  public function recordFailure(): void {
    $this->consecutiveFailures = min($this->consecutiveFailures + 1, self::MAX_RETRIES);
  }

  /**
   * Check if an error code is retryable.
   *
   * @param string $errorCode
   *   The AWS error code.
   *
   * @return bool
   *   TRUE if the error is retryable.
   */
  public function isRetryable(string $errorCode): bool {
    return in_array($errorCode, self::RETRYABLE_ERRORS, TRUE);
  }

  /**
   * Get the maximum number of retries.
   *
   * @return int
   *   Maximum retry attempts.
   */
  public function getMaxRetries(): int {
    return self::MAX_RETRIES;
  }

  /**
   * Wait before a retry attempt with exponential backoff.
   *
   * @param int $attempt
   *   The current attempt number (0-based).
   */
  public function waitForRetry(int $attempt): void {
    // Calculate delay with exponential backoff and jitter.
    $baseDelay = self::BASE_DELAY_MS * pow(2, $attempt);
    $jitter = mt_rand(0, (int) ($baseDelay * 0.5));
    $delay = min(self::MAX_DELAY_MS, $baseDelay + $jitter);

    $this->logger->debug('Textract rate limiter waiting @delay ms before retry @attempt', [
      '@delay' => $delay,
      '@attempt' => $attempt + 1,
    ]);

    usleep((int) $delay * 1000);
  }

  /**
   * Reset the rate limiter state.
   */
  public function reset(): void {
    $this->consecutiveFailures = 0;
    $this->lastRequestTime = 0;
  }

  /**
   * Get the current consecutive failure count.
   *
   * @return int
   *   Number of consecutive failures.
   */
  public function getConsecutiveFailures(): int {
    return $this->consecutiveFailures;
  }

}
