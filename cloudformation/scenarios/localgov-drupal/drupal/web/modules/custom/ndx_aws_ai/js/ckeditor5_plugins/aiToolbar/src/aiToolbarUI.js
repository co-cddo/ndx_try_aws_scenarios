/**
 * @file
 * AI Toolbar UI plugin with dropdown interface.
 *
 * Story 3.4: CKEditor AI Toolbar Plugin
 *
 * This plugin creates the AI dropdown button in the CKEditor 5 toolbar,
 * providing access to AI-powered content editing features.
 */

import { Plugin } from 'ckeditor5/src/core';
import {
  createDropdown,
  addListToDropdown,
  Model,
} from 'ckeditor5/src/ui';
import { Collection } from 'ckeditor5/src/utils';

/**
 * AI sparkle icon SVG.
 *
 * @type {string}
 */
const aiSparkleIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L13.09 8.26L18 6L15.74 10.91L22 12L15.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L8.26 13.09L2 12L8.26 10.91L6 6L10.91 8.26L12 2Z" fill="currentColor"/>
</svg>`;

/**
 * AI Toolbar UI plugin.
 *
 * Creates the dropdown button with AI options in the toolbar.
 *
 * @extends module:core/plugin~Plugin
 */
export default class AiToolbarUI extends Plugin {
  /**
   * @inheritDoc
   */
  static get pluginName() {
    return 'AiToolbarUI';
  }

  /**
   * @inheritDoc
   */
  init() {
    const editor = this.editor;
    const t = editor.t;

    // Store AI availability status.
    this._aiAvailable = false;

    // Listen for AI availability changes.
    editor.on('ai:availability', (evt, data) => {
      this._aiAvailable = data.available;
      this._updateDropdownState();
    });

    // Register the toolbar dropdown component.
    editor.ui.componentFactory.add('aiToolbar', (locale) => {
      const dropdown = createDropdown(locale);

      // Configure the dropdown button.
      dropdown.buttonView.set({
        label: t('AI Assistant'),
        icon: aiSparkleIcon,
        tooltip: true,
        withText: false,
        class: 'ai-toolbar-dropdown',
      });

      // Add accessibility attributes.
      dropdown.buttonView.extendTemplate({
        attributes: {
          'aria-label': t('AI Assistant - writing and simplification tools'),
          'aria-haspopup': 'true',
        },
      });

      // Create dropdown items.
      const items = this._getDropdownItems(locale);
      addListToDropdown(dropdown, items);

      // Handle item execution.
      dropdown.on('execute', (evt) => {
        const commandName = evt.source.commandName;
        if (commandName) {
          editor.execute(commandName);
        }
      });

      // Store reference for state updates.
      this._dropdown = dropdown;

      // Apply initial state.
      this._updateDropdownState();

      // Add custom CSS class for GOV.UK styling.
      dropdown.extendTemplate({
        attributes: {
          class: ['ai-toolbar-dropdown-container'],
        },
      });

      return dropdown;
    });
  }

  /**
   * Creates the dropdown menu items.
   *
   * @param {Object} locale - The editor locale.
   * @returns {Collection} Collection of dropdown items.
   * @private
   */
  _getDropdownItems(locale) {
    const editor = this.editor;
    const t = editor.t;
    const collection = new Collection();

    // "Help me write..." item.
    const writeItemModel = new Model({
      label: t('Help me write...'),
      commandName: 'aiWrite',
      withText: true,
      class: 'ai-toolbar-item ai-toolbar-item--write',
    });

    // Bind to command state.
    const writeCommand = editor.commands.get('aiWrite');
    if (writeCommand) {
      writeItemModel.bind('isEnabled').to(writeCommand, 'isEnabled');
    }

    collection.add({
      type: 'button',
      model: writeItemModel,
    });

    // "Simplify to plain English" item.
    const simplifyItemModel = new Model({
      label: t('Simplify to plain English'),
      commandName: 'aiSimplify',
      withText: true,
      class: 'ai-toolbar-item ai-toolbar-item--simplify',
    });

    // Bind to command state.
    const simplifyCommand = editor.commands.get('aiSimplify');
    if (simplifyCommand) {
      simplifyItemModel.bind('isEnabled').to(simplifyCommand, 'isEnabled');
    }

    collection.add({
      type: 'button',
      model: simplifyItemModel,
    });

    return collection;
  }

  /**
   * Updates the dropdown button state based on AI availability.
   *
   * @private
   */
  _updateDropdownState() {
    if (!this._dropdown) {
      return;
    }

    const editor = this.editor;
    const t = editor.t;

    if (this._aiAvailable) {
      this._dropdown.buttonView.set({
        tooltip: t('AI Assistant'),
        isEnabled: true,
      });
      this._dropdown.buttonView.element?.classList.remove('ai-unavailable');
    }
    else {
      this._dropdown.buttonView.set({
        tooltip: t('AI services unavailable'),
        isEnabled: false,
      });
      this._dropdown.buttonView.element?.classList.add('ai-unavailable');
    }
  }
}
