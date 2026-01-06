/**
 * @file
 * AI Toolbar Buttons handler.
 *
 * Story 3.4: CKEditor AI Toolbar Plugin (Alternative Implementation)
 *
 * Provides AI assistant buttons in node edit forms that trigger
 * AI writing and simplification dialogs.
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
   * Open the AI simplify dialog.
   *
   * @param {Object|null} editor
   *   The CKEditor 5 instance to get content from.
   */
  function openSimplifyDialog(editor) {
    // Store editor reference.
    Drupal.ndxAwsAi = Drupal.ndxAwsAi || {};
    Drupal.ndxAwsAi.activeEditor = editor;

    // Get selected text or all content from editor.
    var content = '';
    if (editor) {
      try {
        var selection = editor.model.document.selection;
        var range = selection.getFirstRange();

        if (!range.isCollapsed) {
          // Get selected text.
          var items = range.getItems();
          for (var item of items) {
            if (item.is('$text') || item.is('$textProxy')) {
              content += item.data;
            }
          }
        } else {
          // Get all content if nothing selected.
          var root = editor.model.document.getRoot();
          content = editor.getData();
          // Strip HTML tags for simplification.
          var temp = document.createElement('div');
          temp.innerHTML = content;
          content = temp.textContent || temp.innerText || '';
        }
      } catch (error) {
        console.warn('Could not get editor content:', error);
      }
    }

    var dialogUrl = Drupal.url('ndx-aws-ai/simplify-dialog');

    var dialogOptions = {
      title: Drupal.t('Simplify Content'),
      width: '700px',
      dialogClass: 'ai-simplify-dialog-wrapper',
      modal: true,
      closeOnEscape: true,
      close: function () {
        Drupal.ndxAwsAi.activeEditor = null;
      },
    };

    // Add content as query parameter.
    if (content) {
      dialogUrl += '?text=' + encodeURIComponent(content);
    }

    Drupal.ajax({
      url: dialogUrl,
      dialogType: 'modal',
      dialog: dialogOptions,
    }).execute();
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

      // Handle Simplify button click.
      once('ai-simplify-btn', '.ai-simplify-button', context).forEach(function (button) {
        button.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();

          var editor = findCKEditor();
          if (!editor) {
            Drupal.announce(Drupal.t('Please select text in the editor first, or ensure the editor is loaded.'), 'assertive');
            return;
          }
          openSimplifyDialog(editor);
        });
      });
    },
  };

})(Drupal, once);
