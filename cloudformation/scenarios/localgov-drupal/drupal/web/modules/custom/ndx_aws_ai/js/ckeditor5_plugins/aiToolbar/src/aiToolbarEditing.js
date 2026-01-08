/**
 * @file
 * AI Toolbar Editing plugin with command registration.
 *
 * Story 3.4: CKEditor AI Toolbar Plugin
 *
 * This plugin registers the AI commands that can be executed
 * from the toolbar or via keyboard shortcuts.
 */

import { Plugin } from 'ckeditor5/src/core';
import { Command } from 'ckeditor5/src/core';

/**
 * AI Write Command - triggers the "Help me write..." dialog.
 *
 * @extends module:core/command~Command
 */
class AiWriteCommand extends Command {
  /**
   * @inheritDoc
   */
  execute() {
    const editor = this.editor;
    const selection = editor.model.document.selection;

    // Get selected text if any.
    let selectedText = '';
    const range = selection.getFirstRange();

    if (range && !range.isCollapsed) {
      for (const item of range.getItems()) {
        if (item.is('$textProxy')) {
          selectedText += item.data;
        }
      }
    }

    // Dispatch custom event for Drupal JavaScript to handle.
    const event = new CustomEvent('ai:dialog:open', {
      bubbles: true,
      detail: {
        action: 'write',
        selectedText: selectedText,
        editor: editor,
      },
    });
    document.dispatchEvent(event);

    // Log for debugging.
    if (typeof Drupal !== 'undefined' && Drupal.ndxAwsAi) {
      Drupal.ndxAwsAi.announce('Opening AI writing assistant', 'polite');
    }
  }

  /**
   * @inheritDoc
   */
  refresh() {
    // Command is enabled when AI services are available.
    const aiToolbarPlugin = this.editor.plugins.get('AiToolbar');
    this.isEnabled = aiToolbarPlugin ? aiToolbarPlugin.isAiAvailable() : false;
  }
}

/**
 * AI Simplify Command - triggers the "Simplify to plain English" action.
 *
 * @extends module:core/command~Command
 */
class AiSimplifyCommand extends Command {
  /**
   * @inheritDoc
   */
  execute() {
    const editor = this.editor;
    const selection = editor.model.document.selection;

    // Get selected text - required for simplification.
    let selectedText = '';
    const range = selection.getFirstRange();

    if (range && !range.isCollapsed) {
      for (const item of range.getItems()) {
        if (item.is('$textProxy')) {
          selectedText += item.data;
        }
      }
    }

    // If no text selected, show message.
    if (!selectedText.trim()) {
      if (typeof Drupal !== 'undefined' && Drupal.ndxAwsAi) {
        Drupal.ndxAwsAi.announce('Please select text to simplify', 'assertive');
      }
      return;
    }

    // Dispatch custom event for Drupal JavaScript to handle.
    const event = new CustomEvent('ai:dialog:open', {
      bubbles: true,
      detail: {
        action: 'simplify',
        selectedText: selectedText,
        editor: editor,
      },
    });
    document.dispatchEvent(event);

    // Log for debugging.
    if (typeof Drupal !== 'undefined' && Drupal.ndxAwsAi) {
      Drupal.ndxAwsAi.announce('Opening AI simplification tool', 'polite');
    }
  }

  /**
   * @inheritDoc
   */
  refresh() {
    const editor = this.editor;
    const selection = editor.model.document.selection;
    const aiToolbarPlugin = editor.plugins.get('AiToolbar');
    const aiAvailable = aiToolbarPlugin ? aiToolbarPlugin.isAiAvailable() : false;

    // Check if there's selected text.
    const range = selection.getFirstRange();
    const hasSelection = range && !range.isCollapsed;

    // Command is enabled when AI is available AND text is selected.
    this.isEnabled = aiAvailable && hasSelection;
  }
}

/**
 * AI Toolbar Editing plugin.
 *
 * Registers the AI commands with the editor.
 *
 * @extends module:core/plugin~Plugin
 */
export default class AiToolbarEditing extends Plugin {
  /**
   * @inheritDoc
   */
  static get pluginName() {
    return 'AiToolbarEditing';
  }

  /**
   * @inheritDoc
   */
  init() {
    const editor = this.editor;

    // Register the AI write command.
    editor.commands.add('aiWrite', new AiWriteCommand(editor));

    // Register the AI simplify command.
    editor.commands.add('aiSimplify', new AiSimplifyCommand(editor));

    // Listen for AI availability changes to refresh command states.
    editor.on('ai:availability', () => {
      editor.commands.get('aiWrite').refresh();
      editor.commands.get('aiSimplify').refresh();
    });
  }
}
