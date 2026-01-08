/**
 * @file
 * AI Writing Dialog handler for CKEditor integration.
 *
 * Story 3.5: AI Writing Assistant
 *
 * Handles the dialog opening, content generation, and insertion
 * back into the CKEditor.
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Global namespace for AI writing functionality.
   */
  Drupal.ndxAwsAi = Drupal.ndxAwsAi || {};

  /**
   * Reference to the active CKEditor instance.
   */
  Drupal.ndxAwsAi.activeEditor = null;

  /**
   * Reference to the active dialog.
   */
  Drupal.ndxAwsAi.activeDialog = null;

  /**
   * Handle ai:dialog:open event from CKEditor.
   *
   * @param {CustomEvent} event
   *   The custom event with detail.action and detail.editor.
   */
  function handleDialogOpen(event) {
    var action = event.detail.action;
    var editor = event.detail.editor;

    if (action !== 'write') {
      return;
    }

    // Store editor reference for later insertion.
    Drupal.ndxAwsAi.activeEditor = editor;

    // Open the dialog.
    openWritingDialog();
  }

  /**
   * Opens the AI writing dialog.
   */
  function openWritingDialog() {
    var dialogUrl = Drupal.url('ndx-aws-ai/write-dialog');

    // Create dialog options.
    var dialogOptions = {
      title: Drupal.t('AI Writing Assistant'),
      width: '600px',
      dialogClass: 'ai-writing-dialog-wrapper',
      modal: true,
      closeOnEscape: true,
      close: function () {
        Drupal.ndxAwsAi.activeEditor = null;
        Drupal.ndxAwsAi.activeDialog = null;
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
   * Find the first CKEditor 5 instance on the page.
   *
   * @returns {Object|null}
   *   The CKEditor 5 editor instance, or null if not found.
   */
  function findCKEditor() {
    // Method 1: Check Drupal.CKEditor5Instances (Map in Drupal 10)
    if (typeof Drupal.CKEditor5Instances !== 'undefined') {
      var instances = Drupal.CKEditor5Instances;

      // Handle Map object (Drupal 10)
      if (instances instanceof Map && instances.size > 0) {
        var firstEntry = instances.values().next();
        if (!firstEntry.done) {
          return firstEntry.value;
        }
      }

      // Handle plain object (fallback for older versions)
      if (typeof instances === 'object' && !(instances instanceof Map)) {
        for (var id in instances) {
          if (instances.hasOwnProperty(id)) {
            return instances[id];
          }
        }
      }
    }

    // Method 2: Find via DOM element (reliable fallback)
    var editable = document.querySelector('.ck-editor__editable');
    if (editable && editable.ckeditorInstance) {
      return editable.ckeditorInstance;
    }

    return null;
  }

  /**
   * Insert content into the active CKEditor.
   *
   * @param {string} content
   *   The content to insert (can be HTML or plain text).
   */
  Drupal.ndxAwsAi.insertContent = function (content) {
    // Try to get stored editor reference, or find one on the page.
    var editor = Drupal.ndxAwsAi.activeEditor || findCKEditor();

    if (!editor) {
      // Show user-friendly error instead of silent fail.
      var errorContainer = document.querySelector('#ai-error-container');
      if (errorContainer) {
        errorContainer.innerHTML = '<div class="ai-error-message">' +
          Drupal.t('No editor found. Please open this dialog from within a content editor.') +
          '</div>';
        errorContainer.classList.remove('ai-hidden');
      }
      Drupal.ndxAwsAi.announce(
        Drupal.t('Cannot insert content - no editor available'),
        'assertive'
      );
      return false;
    }

    try {
      // Check if content looks like HTML.
      var isHtml = /<[a-z][\s\S]*>/i.test(content);

      if (isHtml) {
        // Use the clipboard pipeline to insert HTML content.
        var viewFragment = editor.data.processor.toView(content);
        var modelFragment = editor.data.toModel(viewFragment);

        editor.model.insertContent(modelFragment);
      } else {
        // For plain text, insert as text.
        editor.model.change(function (writer) {
          var selection = editor.model.document.selection;
          var insertPosition = selection.getFirstPosition();
          writer.insertText(content, insertPosition);
        });
      }

      // Focus the editor after insertion.
      editor.editing.view.focus();

      // Announce success.
      Drupal.ndxAwsAi.announce(
        Drupal.t('Content inserted into editor'),
        'polite'
      );

      return true;
    }
    catch (error) {
      console.error('Failed to insert content:', error);
      Drupal.ndxAwsAi.announce(
        Drupal.t('Failed to insert content. Please try again.'),
        'assertive'
      );
      return false;
    }
  };

  /**
   * Close the active dialog.
   */
  Drupal.ndxAwsAi.closeDialog = function () {
    // Clear editor reference first.
    Drupal.ndxAwsAi.activeEditor = null;

    // Try to close the native dialog first.
    if (Drupal.ndxAwsAi.activeDialog) {
      Drupal.ndxAwsAi.activeDialog.close();
    }

    // Find and close jQuery UI dialog properly.
    // The dialog content is inside .ui-dialog-content, which is the element
    // that has the dialog widget attached.
    var $dialogContent = jQuery('.ui-dialog-content');
    if ($dialogContent.length && $dialogContent.dialog('instance')) {
      try {
        $dialogContent.dialog('close');
        $dialogContent.dialog('destroy');
        $dialogContent.remove();
      }
      catch (e) {
        // Dialog may already be destroyed.
      }
    }

    // Remove any lingering overlay.
    jQuery('.ui-widget-overlay').remove();

    // Restore body scroll.
    jQuery('body').css('overflow', '');
    jQuery('html').css('overflow', '');

    Drupal.ndxAwsAi.activeDialog = null;
  };

  /**
   * Announce message to screen readers.
   *
   * @param {string} message
   *   The message to announce.
   * @param {string} priority
   *   The priority ('polite' or 'assertive').
   */
  Drupal.ndxAwsAi.announce = function (message, priority) {
    if (typeof Drupal.announce === 'function') {
      Drupal.announce(message, priority);
    }
  };

  /**
   * jQuery plugin for announce command.
   */
  jQuery.fn.ndxAwsAiAnnounce = function (message, priority) {
    Drupal.ndxAwsAi.announce(message, priority);
  };

  /**
   * Drupal behavior for AI writing dialog.
   */
  Drupal.behaviors.ndxAwsAiWritingDialog = {
    attach: function (context, settings) {
      // Listen for the ai:dialog:open event.
      once('ai-dialog-listener', 'body', context).forEach(function () {
        document.addEventListener('ai:dialog:open', handleDialogOpen);
      });

      // Handle prompt history selection.
      once('ai-prompt-history', '.ai-prompt-history', context).forEach(function (select) {
        select.addEventListener('change', function () {
          var promptInput = document.querySelector('.ai-prompt-input');
          if (promptInput && select.value) {
            promptInput.value = select.value;
            promptInput.focus();
          }
        });
      });

      // Handle Apply button.
      once('ai-apply-button', '#ai-apply-button', context).forEach(function (button) {
        button.addEventListener('click', function (e) {
          e.preventDefault();
          var content = document.querySelector('.ai-generated-content');
          if (content && content.value) {
            Drupal.ndxAwsAi.insertContent(content.value);
            Drupal.ndxAwsAi.closeDialog();
          }
        });
      });

      // Handle Cancel button.
      once('ai-cancel-button', '[data-action="cancel"]', context).forEach(function (button) {
        button.addEventListener('click', function (e) {
          e.preventDefault();
          Drupal.ndxAwsAi.closeDialog();
        });
      });

      // Show loading state before AJAX.
      once('ai-loading-trigger', '#edit-generate', context).forEach(function (button) {
        button.addEventListener('click', function () {
          var loading = document.querySelector('#ai-loading-indicator');
          var error = document.querySelector('#ai-error-container');
          if (loading) {
            loading.classList.remove('ai-hidden');
          }
          if (error) {
            error.classList.add('ai-hidden');
          }
        });
      });

      // Focus trap for modal accessibility.
      once('ai-focus-trap', '.ai-writing-dialog', context).forEach(function (dialog) {
        setupFocusTrap(dialog);
      });
    },
  };

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
        Drupal.ndxAwsAi.closeDialog();
      }
    });

    // Focus first element.
    firstElement.focus();
  }

})(Drupal, once);
