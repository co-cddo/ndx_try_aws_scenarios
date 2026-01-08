<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\RateLimiter;

use Psr\Log\LoggerInterface;

/**
 * Rate limiter for Amazon Translate API calls with exponential backoff.
 *
 * Implements retry logic for transient errors with configurable
 * backoff parameters. Follows the same pattern as PollyRateLimiter
 * but with Translate-specific error codes.
 *
 * Story 4.2: Amazon Translate Service Integration
 */
class TranslateRateLimiter {

  /**
   * Maximum number of retries.
   */
  protected const MAX_RETRIES = 3;

  /**
   * Base delay in milliseconds (1 second).
   */
  protected const BASE_DELAY_MS = 1000;

  /**
   * Maximum delay in milliseconds (30 seconds).
   */
  protected const MAX_DELAY_MS = 30000;

  /**
   * Jitter factor (0-1) to add randomness to delays.
   */
  protected const JITTER_FACTOR = 0.2;

  /**
   * AWS error codes that are retryable.
   */
  protected const RETRYABLE_ERRORS = [
    'ThrottlingException',
    'Throttling',
    'TooManyRequestsException',
    'ServiceUnavailableException',
    'ServiceUnavailable',
    'InternalServerException',
    'InternalServerError',
    'RequestTimeout',
    'LimitExceededException',
  ];

  /**
   * Timestamp of last request.
   */
  protected int $lastRequestTime = 0;

  /**
   * Number of consecutive failures.
   */
  protected int $consecutiveFailures = 0;

  /**
   * Constructs a TranslateRateLimiter.
   *
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected LoggerInterface $logger,
  ) {}

  /**
   * Get the maximum number of retries.
   *
   * @return int
   *   The maximum retry count.
   */
  public function getMaxRetries(): int {
    return self::MAX_RETRIES;
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
   * Wait if rate limiting requires a delay.
   *
   * Adds a small delay between consecutive requests to avoid
   * overwhelming the API.
   */
  public function waitIfNeeded(): void {
    // Add minimum spacing between requests (100ms).
    $minSpacing = 100;
    $elapsed = $this->getElapsedSinceLastRequest();

    if ($elapsed < $minSpacing) {
      $delay = $minSpacing - $elapsed;
      $this->sleep($delay);
    }

    $this->lastRequestTime = $this->getCurrentTimeMs();
  }

  /**
   * Wait before retrying after a failure.
   *
   * Uses exponential backoff with jitter.
   *
   * @param int $attempt
   *   The current attempt number (0-indexed).
   */
  public function waitForRetry(int $attempt): void {
    $delay = $this->calculateBackoffDelay($attempt);

    $this->logger->debug('Translate rate limiter waiting @delay ms before retry @attempt', [
      '@delay' => $delay,
      '@attempt' => $attempt + 1,
    ]);

    $this->sleep($delay);
  }

  /**
   * Record a successful API call.
   *
   * Resets the consecutive failure count.
   */
  public function recordSuccess(): void {
    $this->consecutiveFailures = 0;
    $this->lastRequestTime = $this->getCurrentTimeMs();
  }

  /**
   * Record a failed API call.
   *
   * Increments the consecutive failure count.
   */
  public function recordFailure(): void {
    $this->consecutiveFailures++;
    $this->lastRequestTime = $this->getCurrentTimeMs();
  }

  /**
   * Get the number of consecutive failures.
   *
   * @return int
   *   The failure count.
   */
  public function getConsecutiveFailures(): int {
    return $this->consecutiveFailures;
  }

  /**
   * Calculate the backoff delay for a retry attempt.
   *
   * Uses exponential backoff: delay = base * 2^attempt + jitter
   *
   * @param int $attempt
   *   The attempt number (0-indexed).
   *
   * @return int
   *   The delay in milliseconds.
   */
  protected function calculateBackoffDelay(int $attempt): int {
    // Exponential backoff: base * 2^attempt.
    $baseDelay = self::BASE_DELAY_MS * (2 ** $attempt);

    // Cap at maximum delay.
    $baseDelay = min($baseDelay, self::MAX_DELAY_MS);

    // Add jitter (random factor to avoid thundering herd).
    $jitter = (int) ($baseDelay * self::JITTER_FACTOR * $this->getRandomFactor());
    $delay = $baseDelay + $jitter;

    return min($delay, self::MAX_DELAY_MS);
  }

  /**
   * Get elapsed time since last request in milliseconds.
   *
   * @return int
   *   Elapsed time in milliseconds.
   */
  protected function getElapsedSinceLastRequest(): int {
    if ($this->lastRequestTime === 0) {
      return PHP_INT_MAX;
    }

    return $this->getCurrentTimeMs() - $this->lastRequestTime;
  }

  /**
   * Get current time in milliseconds.
   *
   * @return int
   *   Current time in milliseconds.
   */
  protected function getCurrentTimeMs(): int {
    return (int) (microtime(TRUE) * 1000);
  }

  /**
   * Get a random factor between 0 and 1.
   *
   * Protected method to allow mocking in tests.
   *
   * @return float
   *   Random factor.
   */
  protected function getRandomFactor(): float {
    return mt_rand(0, 1000) / 1000;
  }

  /**
   * Sleep for a specified number of milliseconds.
   *
   * Protected method to allow mocking in tests.
   *
   * @param int $milliseconds
   *   Time to sleep in milliseconds.
   */
  protected function sleep(int $milliseconds): void {
    usleep($milliseconds * 1000);
  }

}
