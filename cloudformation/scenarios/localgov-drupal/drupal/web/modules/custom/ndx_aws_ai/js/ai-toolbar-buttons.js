/**
 * @file
 * AI Toolbar Buttons handler.
 *
 * Story 3.4: CKEditor AI Toolbar Plugin (Alternative Implementation)
 *
 * Provides AI assistant buttons in node edit forms that trigger
 * AI writing and simplification functions.
 *
 * Updated: Simplify button now directly replaces content without modal.
 */

(function (Drupal, once) {
  'use strict';

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
   * Open the AI writing dialog.
   *
   * @param {Object|null} editor
   *   The CKEditor 5 instance to insert content into.
   */
  function openWriteDialog(editor) {
    // Store editor reference for content insertion.
    Drupal.ndxAwsAi = Drupal.ndxAwsAi || {};
    Drupal.ndxAwsAi.activeEditor = editor;

    var dialogUrl = Drupal.url('ndx-aws-ai/write-dialog');

    var dialogOptions = {
      title: Drupal.t('AI Writing Assistant'),
      width: '600px',
      dialogClass: 'ai-writing-dialog-wrapper',
      modal: true,
      closeOnEscape: true,
      close: function () {
        Drupal.ndxAwsAi.activeEditor = null;
      },
    };

    Drupal.ajax({
      url: dialogUrl,
      dialogType: 'modal',
      dialog: dialogOptions,
    }).execute();
  }

  /**
   * Get content from CKEditor (selected text or full body).
   *
   * @param {Object} editor
   *   The CKEditor 5 instance.
   * @returns {Object}
   *   Object with content and hasSelection flag.
   */
  function getEditorContent(editor) {
    var result = { content: '', hasSelection: false };

    if (!editor) {
      return result;
    }

    try {
      var selection = editor.model.document.selection;
      var range = selection.getFirstRange();

      if (!range.isCollapsed) {
        // Get selected text.
        result.hasSelection = true;
        var items = range.getItems();
        for (var item of items) {
          if (item.is('$text') || item.is('$textProxy')) {
            result.content += item.data;
          }
        }
      } else {
        // Get all content if nothing selected - strip HTML for simplification.
        var html = editor.getData();
        var temp = document.createElement('div');
        temp.innerHTML = html;
        result.content = temp.textContent || temp.innerText || '';
      }
    } catch (error) {
      console.warn('Could not get editor content:', error);
    }

    return result;
  }

  /**
   * Replace content in CKEditor.
   *
   * @param {Object} editor
   *   The CKEditor 5 instance.
   * @param {string} newContent
   *   The new content to insert.
   * @param {boolean} hasSelection
   *   Whether to replace selection only or full content.
   */
  function replaceEditorContent(editor, newContent, hasSelection) {
    if (!editor) {
      return;
    }

    editor.model.change(function (writer) {
      if (hasSelection) {
        // Replace selected text only.
        var selection = editor.model.document.selection;
        var range = selection.getFirstRange();
        writer.remove(range);
        writer.insertText(newContent, range.start);
      } else {
        // Replace full body content.
        var root = editor.model.document.getRoot();
        var rootRange = writer.createRangeIn(root);
        writer.remove(rootRange);

        // Insert new content as paragraphs.
        var paragraphs = newContent.split('\n\n');
        paragraphs.forEach(function (para) {
          if (para.trim()) {
            var paragraph = writer.createElement('paragraph');
            writer.insertText(para.trim(), paragraph);
            writer.insert(paragraph, root, 'end');
          }
        });
      }
    });

    editor.editing.view.focus();
  }

  /**
   * Show/hide loading overlay on editor.
   *
   * @param {Object} editor
   *   The CKEditor 5 instance.
   * @param {boolean} show
   *   Whether to show or hide the overlay.
   */
  function showEditorLoadingOverlay(editor, show) {
    var editorElement = document.querySelector('.ck-editor__editable');
    if (!editorElement) {
      return;
    }

    var container = editorElement.closest('.ck-editor');
    if (!container) {
      container = editorElement.parentElement;
    }

    var existingOverlay = container.querySelector('.ai-editor-loading');

    if (show && !existingOverlay) {
      var overlay = document.createElement('div');
      overlay.className = 'ai-editor-loading';
      overlay.innerHTML = '<div class="ai-spinner"></div><span>' + Drupal.t('Simplifying content...') + '</span>';
      overlay.setAttribute('role', 'status');
      overlay.setAttribute('aria-live', 'polite');
      container.style.position = 'relative';
      container.appendChild(overlay);
      editorElement.style.opacity = '0.5';
      editorElement.style.pointerEvents = 'none';
    } else if (!show && existingOverlay) {
      existingOverlay.remove();
      editorElement.style.opacity = '';
      editorElement.style.pointerEvents = '';
    }
  }

  /**
   * Simplify content directly without modal dialog.
   *
   * @param {Object} editor
   *   The CKEditor 5 instance.
   * @param {HTMLElement} button
   *   The button element that was clicked.
   */
  async function simplifyContent(editor, button) {
    Drupal.ndxAwsAi = Drupal.ndxAwsAi || {};

    // Get content to simplify.
    var editorData = getEditorContent(editor);
    var content = editorData.content;

    if (!content || !content.trim()) {
      Drupal.announce(Drupal.t('Please enter content in the editor to simplify.'), 'assertive');
      return;
    }

    if (content.trim().length < 10) {
      Drupal.announce(Drupal.t('The text is too short to simplify.'), 'assertive');
      return;
    }

    // Store original button state.
    var originalText = button.textContent;
    var originalDisabled = button.disabled;

    // Show loading state on button.
    button.disabled = true;
    button.classList.add('ai-loading');
    button.textContent = Drupal.t('Simplifying...');

    // Show loading indicator on editor.
    showEditorLoadingOverlay(editor, true);

    try {
      // Make API call to new direct endpoint.
      var response = await fetch(Drupal.url('ndx-aws-ai/api/simplify'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ text: content }),
      });

      var result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Simplification failed');
      }

      // Replace editor content with simplified version.
      replaceEditorContent(editor, result.simplified, editorData.hasSelection);

      // Success feedback on button.
      button.classList.remove('ai-loading');
      button.classList.add('ai-success');
      button.textContent = Drupal.t('Simplified!');
      Drupal.announce(Drupal.t('Content simplified successfully.'), 'polite');

      // Reset button after 2 seconds.
      setTimeout(function () {
        button.classList.remove('ai-success');
        button.textContent = originalText;
        button.disabled = originalDisabled;
      }, 2000);

    } catch (error) {
      console.error('Simplification error:', error);

      // Error feedback on button.
      button.classList.remove('ai-loading');
      button.classList.add('ai-error');
      button.textContent = Drupal.t('Error - try again');
      Drupal.announce(Drupal.t('Simplification failed. Please try again.'), 'assertive');

      // Reset button after 3 seconds.
      setTimeout(function () {
        button.classList.remove('ai-error');
        button.textContent = originalText;
        button.disabled = originalDisabled;
      }, 3000);

    } finally {
      showEditorLoadingOverlay(editor, false);
    }
  }

  /**
   * Drupal behavior for AI toolbar buttons.
   */
  Drupal.behaviors.ndxAwsAiToolbarButtons = {
    attach: function (context, settings) {
      // Handle Write button click.
      once('ai-write-btn', '.ai-write-button', context).forEach(function (button) {
        button.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();

          var editor = findCKEditor();
          openWriteDialog(editor);
        });
      });

      // Handle Simplify button click - direct replacement, no modal.
      once('ai-simplify-btn', '.ai-simplify-button', context).forEach(function (button) {
        button.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();

          var editor = findCKEditor();
          if (!editor) {
            Drupal.announce(Drupal.t('Please ensure the editor is loaded.'), 'assertive');
            return;
          }

          // Call direct simplification.
          simplifyContent(editor, button);
        });
      });
    },
  };

})(Drupal, once);
