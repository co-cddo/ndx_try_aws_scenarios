/**
 * @file
 * AI Simplify Dialog handler for CKEditor integration.
 *
 * Story 3.6: Readability Simplification
 *
 * Handles the simplify dialog opening, text simplification, and replacement
 * back into the CKEditor at the selection position.
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Global namespace for AI simplify functionality.
   */
  Drupal.ndxAwsAi = Drupal.ndxAwsAi || {};

  /**
   * Reference to the active CKEditor instance and selection.
   */
  Drupal.ndxAwsAi.simplifyEditor = null;
  Drupal.ndxAwsAi.simplifySelection = null;
  Drupal.ndxAwsAi.simplifyDialog = null;

  /**
   * Handle ai:dialog:open event from CKEditor for simplify action.
   *
   * @param {CustomEvent} event
   *   The custom event with detail.action, detail.selectedText, and detail.editor.
   */
  function handleSimplifyDialogOpen(event) {
    var action = event.detail.action;
    var selectedText = event.detail.selectedText;
    var editor = event.detail.editor;

    if (action !== 'simplify') {
      return;
    }

    // Check if text is selected.
    if (!selectedText || !selectedText.trim()) {
      Drupal.ndxAwsAi.announce(
        Drupal.t('Please select text to simplify'),
        'assertive'
      );
      return;
    }

    // Store editor reference and selection for later replacement.
    Drupal.ndxAwsAi.simplifyEditor = editor;
    storeSelection(editor);

    // Open the dialog with the selected text.
    openSimplifyDialog(selectedText);
  }

  /**
   * Store the current selection from the editor.
   *
   * @param {Object} editor
   *   The CKEditor instance.
   */
  function storeSelection(editor) {
    var selection = editor.model.document.selection;
    var range = selection.getFirstRange();

    if (range) {
      Drupal.ndxAwsAi.simplifySelection = {
        start: range.start.clone(),
        end: range.end.clone(),
      };
    }
  }

  /**
   * Opens the AI simplify dialog.
   *
   * @param {string} selectedText
   *   The text selected in the editor.
   */
  function openSimplifyDialog(selectedText) {
    var dialogUrl = Drupal.url('ndx-aws-ai/simplify-dialog');
    dialogUrl += '?text=' + encodeURIComponent(selectedText);

    // Create dialog options.
    var dialogOptions = {
      title: Drupal.t('Simplify to Plain English'),
      width: '800px',
      dialogClass: 'ai-simplify-dialog-wrapper',
      modal: true,
      closeOnEscape: true,
      close: function () {
        Drupal.ndxAwsAi.simplifyEditor = null;
        Drupal.ndxAwsAi.simplifySelection = null;
        Drupal.ndxAwsAi.simplifyDialog = null;
      },
    };

    // Fetch dialog content via AJAX.
    Drupal.ajax({
      url: dialogUrl,
      dialogType: 'modal',
      dialog: dialogOptions,
    }).execute();
  }

  /**
   * Replace selected text in the active CKEditor.
   *
   * @param {string} newContent
   *   The simplified content to replace the selection with.
   */
  Drupal.ndxAwsAi.replaceSelectedText = function (newContent) {
    var editor = Drupal.ndxAwsAi.simplifyEditor;
    var selectionData = Drupal.ndxAwsAi.simplifySelection;

    if (!editor) {
      console.warn('No active editor for text replacement');
      return;
    }

    try {
      editor.model.change(function (writer) {
        var selection = editor.model.document.selection;
        var range = selection.getFirstRange();

        if (!range || range.isCollapsed) {
          // Try to restore the stored selection.
          if (selectionData) {
            range = writer.createRange(selectionData.start, selectionData.end);
          } else {
            console.warn('No selection to replace');
            return;
          }
        }

        // Remove the selected text.
        writer.remove(range);

        // Insert the new text at the start of the selection.
        writer.insertText(newContent, range.start);
      });

      // Focus the editor after replacement.
      editor.editing.view.focus();

      // Announce success.
      Drupal.ndxAwsAi.announce(
        Drupal.t('Text replaced with simplified version'),
        'polite'
      );

    }
    catch (error) {
      console.error('Failed to replace text:', error);
      Drupal.ndxAwsAi.announce(
        Drupal.t('Failed to replace text. Please try again.'),
        'assertive'
      );
    }
  };

  /**
   * Close the simplify dialog.
   */
  Drupal.ndxAwsAi.closeSimplifyDialog = function () {
    // Try to close any jQuery UI dialog.
    var dialogElement = document.querySelector('.ai-simplify-dialog-wrapper');
    if (dialogElement) {
      var $dialog = jQuery(dialogElement).closest('.ui-dialog-content');
      if ($dialog.length) {
        $dialog.dialog('close');
      }
    }
  };

  /**
   * Drupal behavior for AI simplify dialog.
   */
  Drupal.behaviors.ndxAwsAiSimplifyDialog = {
    attach: function (context, settings) {
      // Listen for the ai:dialog:open event for simplify action.
      once('ai-simplify-listener', 'body', context).forEach(function () {
        document.addEventListener('ai:dialog:open', handleSimplifyDialogOpen);
      });

      // Auto-trigger simplification on dialog load.
      if (settings.ndxAwsAi && settings.ndxAwsAi.autoSimplify) {
        once('ai-auto-simplify', '.ai-simplify-dialog', context).forEach(function (dialog) {
          var regenerateButton = dialog.querySelector('#ai-regenerate-button');
          if (regenerateButton) {
            // Trigger simplification after a short delay for UI to settle.
            setTimeout(function () {
              regenerateButton.click();
            }, 100);
          }
        });
        // Clear the flag to prevent re-triggering.
        settings.ndxAwsAi.autoSimplify = false;
      }

      // Handle Apply button.
      once('ai-simplify-apply', '#ai-simplify-apply-button', context).forEach(function (button) {
        button.addEventListener('click', function (e) {
          e.preventDefault();
          var simplifiedText = document.querySelector('.ai-simplified-text');
          if (simplifiedText && simplifiedText.value) {
            Drupal.ndxAwsAi.replaceSelectedText(simplifiedText.value);
            Drupal.ndxAwsAi.closeSimplifyDialog();
          }
        });
      });

      // Handle Cancel button.
      once('ai-simplify-cancel', '[data-action="cancel"]', context).forEach(function (button) {
        button.addEventListener('click', function (e) {
          e.preventDefault();
          Drupal.ndxAwsAi.closeSimplifyDialog();
        });
      });

      // Show loading state before AJAX.
      once('ai-simplify-loading', '#ai-regenerate-button', context).forEach(function (button) {
        button.addEventListener('click', function () {
          var loading = document.querySelector('#ai-simplify-loading');
          var error = document.querySelector('#ai-simplify-error');
          if (loading) {
            loading.classList.remove('ai-hidden');
          }
          if (error) {
            error.classList.add('ai-hidden');
          }
        });
      });

      // Focus trap for modal accessibility.
      once('ai-simplify-focus-trap', '.ai-simplify-dialog', context).forEach(function (dialog) {
        setupFocusTrap(dialog);
      });

      // Handle diff toggle.
      once('ai-diff-toggle', '#ai-diff-toggle', context).forEach(function (checkbox) {
        checkbox.addEventListener('change', function () {
          var container = document.querySelector('#ai-comparison-container');
          if (container) {
            Drupal.ndxAwsAi.diff.toggleHighlight(container, checkbox.checked);
            updateViewVisibility(checkbox.checked);
          }
        });
      });

      // Update diff when simplified text changes.
      once('ai-diff-update', '.ai-simplified-text', context).forEach(function (textarea) {
        textarea.addEventListener('input', debounce(function () {
          updateDiffDisplay();
        }, 300));
      });
    },
  };

  /**
   * Debounce helper function.
   *
   * @param {Function} func
   *   The function to debounce.
   * @param {number} wait
   *   Wait time in milliseconds.
   *
   * @return {Function}
   *   Debounced function.
   */
  function debounce(func, wait) {
    var timeout;
    return function () {
      var args = arguments;
      var that = this;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        func.apply(that, args);
      }, wait);
    };
  }

  /**
   * Update the diff display with current text values.
   */
  function updateDiffDisplay() {
    var originalText = document.querySelector('.ai-original-text');
    var simplifiedText = document.querySelector('.ai-simplified-text');
    var container = document.querySelector('#ai-comparison-container');

    if (!originalText || !simplifiedText || !container) {
      return;
    }

    if (!Drupal.ndxAwsAi.diff || !Drupal.ndxAwsAi.diff.sideBySide) {
      return;
    }

    var original = originalText.value || '';
    var modified = simplifiedText.value || '';

    if (!modified.trim()) {
      return;
    }

    var result = Drupal.ndxAwsAi.diff.sideBySide(original, modified);

    var diffOriginal = document.querySelector('#ai-diff-original');
    var diffModified = document.querySelector('#ai-diff-modified');

    if (diffOriginal) {
      diffOriginal.innerHTML = result.originalHtml;
    }
    if (diffModified) {
      diffModified.innerHTML = result.modifiedHtml;
    }

    // Show diff views, hide textareas when diff toggle is on.
    var diffToggle = document.querySelector('#ai-diff-toggle');
    if (diffToggle && diffToggle.checked) {
      updateViewVisibility(true);
    }
  }

  /**
   * Toggle between diff view and textarea view.
   *
   * @param {boolean} showDiff
   *   Whether to show diff view.
   */
  function updateViewVisibility(showDiff) {
    var diffViews = document.querySelectorAll('.ai-diff-view');
    var textareas = document.querySelectorAll('.ai-text-source');

    diffViews.forEach(function (view) {
      view.style.display = showDiff ? 'block' : 'none';
    });

    // Original textarea always hidden (it's read-only).
    var originalTextarea = document.querySelector('.ai-original-text');
    if (originalTextarea) {
      originalTextarea.style.display = 'none';
    }

    // Simplified textarea shown when not in diff mode (for editing).
    var simplifiedTextarea = document.querySelector('.ai-simplified-text');
    if (simplifiedTextarea) {
      simplifiedTextarea.style.display = showDiff ? 'none' : 'block';
    }
  }

  // Expose updateDiffDisplay for AJAX callbacks.
  Drupal.ndxAwsAi.updateDiffDisplay = updateDiffDisplay;

  /**
   * Set up focus trap for dialog accessibility.
   *
   * @param {HTMLElement} container
   *   The dialog container element.
   */
  function setupFocusTrap(container) {
    var focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) {
      return;
    }

    var firstElement = focusableElements[0];
    var lastElement = focusableElements[focusableElements.length - 1];

    container.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
        else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
      // Handle Escape key.
      if (e.key === 'Escape') {
        Drupal.ndxAwsAi.closeSimplifyDialog();
      }
    });

    // Focus first interactive element.
    if (firstElement) {
      firstElement.focus();
    }
  }

})(Drupal, once);
