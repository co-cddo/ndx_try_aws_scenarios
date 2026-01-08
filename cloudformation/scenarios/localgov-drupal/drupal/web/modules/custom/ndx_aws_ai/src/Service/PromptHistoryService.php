<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Drupal\Core\Session\AccountProxyInterface;
use Drupal\Core\TempStore\PrivateTempStoreFactory;

/**
 * Service for managing user prompt history.
 *
 * Story 3.5: AI Writing Assistant
 *
 * Stores and retrieves recent prompts per user using private tempstore,
 * allowing users to quickly reuse previous prompts.
 */
class PromptHistoryService {

  /**
   * Maximum number of prompts to store per user.
   */
  protected const MAX_HISTORY = 5;

  /**
   * The tempstore key for prompt history.
   */
  protected const TEMPSTORE_KEY = 'prompt_history';

  /**
   * The private tempstore.
   *
   * @var \Drupal\Core\TempStore\PrivateTempStore
   */
  protected $tempStore;

  /**
   * Constructs a PromptHistoryService.
   *
   * @param \Drupal\Core\TempStore\PrivateTempStoreFactory $tempStoreFactory
   *   The tempstore factory.
   * @param \Drupal\Core\Session\AccountProxyInterface $currentUser
   *   The current user.
   */
  public function __construct(
    PrivateTempStoreFactory $tempStoreFactory,
    protected AccountProxyInterface $currentUser,
  ) {
    $this->tempStore = $tempStoreFactory->get('ndx_aws_ai');
  }

  /**
   * Add a prompt to the user's history.
   *
   * @param string $prompt
   *   The prompt text to add.
   */
  public function addPrompt(string $prompt): void {
    $prompt = trim($prompt);
    if (empty($prompt)) {
      return;
    }

    $history = $this->getHistory();

    // Remove duplicate if exists.
    $history = array_filter($history, fn($item) => $item !== $prompt);

    // Add to beginning.
    array_unshift($history, $prompt);

    // Limit to max history.
    $history = array_slice($history, 0, self::MAX_HISTORY);

    $this->tempStore->set(self::TEMPSTORE_KEY, $history);
  }

  /**
   * Get the user's prompt history.
   *
   * @param int $limit
   *   Maximum number of prompts to return.
   *
   * @return array<string>
   *   Array of recent prompts, most recent first.
   */
  public function getHistory(int $limit = self::MAX_HISTORY): array {
    $history = $this->tempStore->get(self::TEMPSTORE_KEY);

    if (!is_array($history)) {
      return [];
    }

    return array_slice($history, 0, $limit);
  }

  /**
   * Get prompt history as form options.
   *
   * @param int $limit
   *   Maximum number of options to return.
   *
   * @return array<string, string>
   *   Array keyed by prompt text with truncated display values.
   */
  public function getHistoryAsOptions(int $limit = self::MAX_HISTORY): array {
    $history = $this->getHistory($limit);
    $options = [];

    foreach ($history as $prompt) {
      // Truncate long prompts for display.
      $display = strlen($prompt) > 60
        ? substr($prompt, 0, 57) . '...'
        : $prompt;
      $options[$prompt] = $display;
    }

    return $options;
  }

  /**
   * Clear the user's prompt history.
   */
  public function clearHistory(): void {
    $this->tempStore->delete(self::TEMPSTORE_KEY);
  }

}
