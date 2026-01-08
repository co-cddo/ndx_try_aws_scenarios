/**
 * @file
 * AI Diff Highlighting for before/after text comparison.
 *
 * Story 3.7: AI Preview Modal
 *
 * Provides word-level diff highlighting between original and modified text,
 * showing additions, deletions, and changes with accessible styling.
 */

(function (Drupal) {
  'use strict';

  /**
   * AI Diff namespace.
   */
  Drupal.ndxAwsAi = Drupal.ndxAwsAi || {};
  Drupal.ndxAwsAi.diff = {};

  /**
   * Tokenize text into words while preserving whitespace info.
   *
   * @param {string} text
   *   The text to tokenize.
   *
   * @return {Array}
   *   Array of {word, trailing} objects.
   */
  function tokenize(text) {
    if (!text) {
      return [];
    }

    var tokens = [];
    var regex = /(\S+)(\s*)/g;
    var match;

    while ((match = regex.exec(text)) !== null) {
      tokens.push({
        word: match[1],
        trailing: match[2] || ''
      });
    }

    return tokens;
  }

  /**
   * Normalize word for comparison (lowercase, trim punctuation).
   *
   * @param {string} word
   *   The word to normalize.
   *
   * @return {string}
   *   Normalized word for comparison.
   */
  function normalizeWord(word) {
    return word.toLowerCase().replace(/[.,!?;:'"()[\]{}]/g, '');
  }

  /**
   * Compute Longest Common Subsequence table.
   *
   * @param {Array} a
   *   First array of tokens.
   * @param {Array} b
   *   Second array of tokens.
   *
   * @return {Array}
   *   LCS dynamic programming table.
   */
  function computeLCS(a, b) {
    var m = a.length;
    var n = b.length;
    var dp = [];

    for (var i = 0; i <= m; i++) {
      dp[i] = [];
      for (var j = 0; j <= n; j++) {
        if (i === 0 || j === 0) {
          dp[i][j] = 0;
        }
        else if (normalizeWord(a[i - 1].word) === normalizeWord(b[j - 1].word)) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        }
        else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp;
  }

  /**
   * Backtrack through LCS table to find diff operations.
   *
   * @param {Array} dp
   *   LCS table.
   * @param {Array} a
   *   Original tokens.
   * @param {Array} b
   *   Modified tokens.
   *
   * @return {Array}
   *   Array of diff operations.
   */
  function backtrack(dp, a, b) {
    var result = [];
    var i = a.length;
    var j = b.length;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && normalizeWord(a[i - 1].word) === normalizeWord(b[j - 1].word)) {
        // Words match (possibly with different case/punctuation).
        result.unshift({
          type: 'same',
          original: a[i - 1],
          modified: b[j - 1]
        });
        i--;
        j--;
      }
      else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        // Addition.
        result.unshift({
          type: 'added',
          modified: b[j - 1]
        });
        j--;
      }
      else {
        // Deletion.
        result.unshift({
          type: 'removed',
          original: a[i - 1]
        });
        i--;
      }
    }

    return result;
  }

  /**
   * Compute word-level diff between two texts.
   *
   * @param {string} original
   *   Original text.
   * @param {string} modified
   *   Modified text.
   *
   * @return {Array}
   *   Array of diff operations with type (same, added, removed).
   */
  Drupal.ndxAwsAi.diff.computeDiff = function (original, modified) {
    var originalTokens = tokenize(original);
    var modifiedTokens = tokenize(modified);

    var dp = computeLCS(originalTokens, modifiedTokens);
    return backtrack(dp, originalTokens, modifiedTokens);
  };

  /**
   * Generate HTML with diff highlighting.
   *
   * @param {Array} diffOps
   *   Array of diff operations.
   * @param {string} mode
   *   'original' to show original with deletions, 'modified' to show modified with additions.
   *
   * @return {string}
   *   HTML string with diff highlighting.
   */
  Drupal.ndxAwsAi.diff.toHtml = function (diffOps, mode) {
    var html = [];

    diffOps.forEach(function (op) {
      if (op.type === 'same') {
        var token = mode === 'original' ? op.original : op.modified;
        html.push(escapeHtml(token.word) + escapeHtml(token.trailing));
      }
      else if (op.type === 'added' && mode === 'modified') {
        html.push(
          '<span class="ai-diff-added" aria-label="' + Drupal.t('Added text') + '">' +
          escapeHtml(op.modified.word) +
          '</span>' +
          escapeHtml(op.modified.trailing)
        );
      }
      else if (op.type === 'removed' && mode === 'original') {
        html.push(
          '<span class="ai-diff-removed" aria-label="' + Drupal.t('Removed text') + '">' +
          escapeHtml(op.original.word) +
          '</span>' +
          escapeHtml(op.original.trailing)
        );
      }
    });

    return html.join('');
  };

  /**
   * Generate side-by-side diff display.
   *
   * @param {string} original
   *   Original text.
   * @param {string} modified
   *   Modified text.
   *
   * @return {Object}
   *   Object with originalHtml and modifiedHtml properties.
   */
  Drupal.ndxAwsAi.diff.sideBySide = function (original, modified) {
    var diffOps = Drupal.ndxAwsAi.diff.computeDiff(original, modified);

    return {
      originalHtml: Drupal.ndxAwsAi.diff.toHtml(diffOps, 'original'),
      modifiedHtml: Drupal.ndxAwsAi.diff.toHtml(diffOps, 'modified'),
      stats: getDiffStats(diffOps)
    };
  };

  /**
   * Get statistics about the diff.
   *
   * @param {Array} diffOps
   *   Array of diff operations.
   *
   * @return {Object}
   *   Object with added, removed, and same counts.
   */
  function getDiffStats(diffOps) {
    var stats = { added: 0, removed: 0, same: 0 };

    diffOps.forEach(function (op) {
      stats[op.type]++;
    });

    return stats;
  }

  /**
   * Escape HTML special characters.
   *
   * @param {string} str
   *   String to escape.
   *
   * @return {string}
   *   Escaped string.
   */
  function escapeHtml(str) {
    if (!str) {
      return '';
    }
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Apply diff highlighting to a comparison container.
   *
   * @param {HTMLElement} container
   *   Container with .ai-diff-original and .ai-diff-modified elements.
   * @param {string} original
   *   Original text.
   * @param {string} modified
   *   Modified text.
   */
  Drupal.ndxAwsAi.diff.applyToContainer = function (container, original, modified) {
    var originalEl = container.querySelector('.ai-diff-original');
    var modifiedEl = container.querySelector('.ai-diff-modified');

    if (!originalEl || !modifiedEl) {
      return;
    }

    var result = Drupal.ndxAwsAi.diff.sideBySide(original, modified);

    originalEl.innerHTML = result.originalHtml;
    modifiedEl.innerHTML = result.modifiedHtml;

    // Announce diff stats for screen readers.
    var statsMessage = Drupal.t('@added words added, @removed words removed', {
      '@added': result.stats.added,
      '@removed': result.stats.removed
    });

    Drupal.ndxAwsAi.announce(statsMessage, 'polite');
  };

  /**
   * Toggle diff highlighting visibility.
   *
   * @param {HTMLElement} container
   *   The diff container.
   * @param {boolean} show
   *   Whether to show highlighting.
   */
  Drupal.ndxAwsAi.diff.toggleHighlight = function (container, show) {
    if (show) {
      container.classList.add('ai-diff-highlight-enabled');
    }
    else {
      container.classList.remove('ai-diff-highlight-enabled');
    }
  };

})(Drupal);
