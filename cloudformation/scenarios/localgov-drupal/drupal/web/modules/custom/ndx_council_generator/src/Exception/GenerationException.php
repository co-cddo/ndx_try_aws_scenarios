<?php

declare(strict_types=1);

namespace Drupal\ndx_council_generator\Exception;

/**
 * Exception for council generation errors.
 *
 * Story 5.1: ndx_council_generator Module Foundation
 */
class GenerationException extends \RuntimeException {

  /**
   * Context data for debugging.
   *
   * @var array
   */
  protected array $context = [];

  /**
   * The phase during which the error occurred.
   *
   * @var string|null
   */
  protected ?string $phase = NULL;

  /**
   * The step number when error occurred.
   *
   * @var int|null
   */
  protected ?int $step = NULL;

  /**
   * Constructs a GenerationException.
   *
   * @param string $message
   *   Error message.
   * @param array $context
   *   Additional context data.
   * @param string|null $phase
   *   Current phase when error occurred.
   * @param int|null $step
   *   Current step when error occurred.
   * @param int $code
   *   Error code.
   * @param \Throwable|null $previous
   *   Previous exception.
   */
  public function __construct(
    string $message,
    array $context = [],
    ?string $phase = NULL,
    ?int $step = NULL,
    int $code = 0,
    ?\Throwable $previous = NULL,
  ) {
    parent::__construct($message, $code, $previous);
    $this->context = $context;
    $this->phase = $phase;
    $this->step = $step;
  }

  /**
   * Get context data.
   *
   * @return array
   *   Context data array.
   */
  public function getContext(): array {
    return $this->context;
  }

  /**
   * Get the phase during which the error occurred.
   *
   * @return string|null
   *   Phase name or NULL if not set.
   */
  public function getPhase(): ?string {
    return $this->phase;
  }

  /**
   * Get the step number when error occurred.
   *
   * @return int|null
   *   Step number or NULL if not set.
   */
  public function getStep(): ?int {
    return $this->step;
  }

  /**
   * Get full exception data for logging.
   *
   * @return array
   *   Complete exception data.
   */
  public function toArray(): array {
    return [
      'message' => $this->getMessage(),
      'code' => $this->getCode(),
      'phase' => $this->phase,
      'step' => $this->step,
      'context' => $this->context,
      'file' => $this->getFile(),
      'line' => $this->getLine(),
      'trace' => $this->getTraceAsString(),
    ];
  }

  /**
   * Create exception for identity generation failure.
   *
   * @param string $message
   *   Error message.
   * @param array $context
   *   Context data.
   * @param \Throwable|null $previous
   *   Previous exception.
   *
   * @return self
   *   New exception instance.
   */
  public static function identityFailed(string $message, array $context = [], ?\Throwable $previous = NULL): self {
    return new self(
      message: $message,
      context: $context,
      phase: 'identity',
      step: NULL,
      code: 1001,
      previous: $previous,
    );
  }

  /**
   * Create exception for content generation failure.
   *
   * @param string $message
   *   Error message.
   * @param int $step
   *   Current step.
   * @param array $context
   *   Context data.
   * @param \Throwable|null $previous
   *   Previous exception.
   *
   * @return self
   *   New exception instance.
   */
  public static function contentFailed(string $message, int $step, array $context = [], ?\Throwable $previous = NULL): self {
    return new self(
      message: $message,
      context: $context,
      phase: 'content',
      step: $step,
      code: 1002,
      previous: $previous,
    );
  }

  /**
   * Create exception for image generation failure.
   *
   * @param string $message
   *   Error message.
   * @param int $step
   *   Current step.
   * @param array $context
   *   Context data.
   * @param \Throwable|null $previous
   *   Previous exception.
   *
   * @return self
   *   New exception instance.
   */
  public static function imageFailed(string $message, int $step, array $context = [], ?\Throwable $previous = NULL): self {
    return new self(
      message: $message,
      context: $context,
      phase: 'images',
      step: $step,
      code: 1003,
      previous: $previous,
    );
  }

  /**
   * Create exception for AWS service failure.
   *
   * @param string $service
   *   AWS service name.
   * @param string $message
   *   Error message.
   * @param \Throwable|null $previous
   *   Previous exception.
   *
   * @return self
   *   New exception instance.
   */
  public static function awsServiceFailed(string $service, string $message, ?\Throwable $previous = NULL): self {
    return new self(
      message: sprintf('AWS %s service error: %s', $service, $message),
      context: ['service' => $service],
      phase: NULL,
      step: NULL,
      code: 2001,
      previous: $previous,
    );
  }

}
