/**
 * @file
 * Main AI Toolbar plugin class.
 *
 * Story 3.4: CKEditor AI Toolbar Plugin
 *
 * This plugin adds AI assistance features to the CKEditor 5 toolbar,
 * providing content editors with AI-powered writing and simplification tools.
 */

import { Plugin } from 'ckeditor5/src/core';
import AiToolbarEditing from './aiToolbarEditing';
import AiToolbarUI from './aiToolbarUI';

/**
 * AI Toolbar plugin for CKEditor 5.
 *
 * Provides AI-powered content editing features:
 * - "Help me write..." - AI content generation
 * - "Simplify to plain English" - Text simplification
 *
 * @extends module:core/plugin~Plugin
 */
export default class AiToolbar extends Plugin {
  /**
   * @inheritDoc
   */
  static get requires() {
    return [AiToolbarEditing, AiToolbarUI];
  }

  /**
   * @inheritDoc
   */
  static get pluginName() {
    return 'AiToolbar';
  }

  /**
   * @inheritDoc
   */
  init() {
    const editor = this.editor;

    // Store AI service availability status.
    this._aiAvailable = false;

    // Check AI service availability on init.
    this._checkAiAvailability();

    // Log plugin initialization.
    if (typeof Drupal !== 'undefined' && Drupal.ndxAwsAi) {
      Drupal.ndxAwsAi.announce('AI toolbar loaded', 'polite');
    }
  }

  /**
   * Check if AI services are available.
   *
   * @private
   */
  async _checkAiAvailability() {
    try {
      const response = await fetch('/ndx-aws-ai/status', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this._aiAvailable = data.available === true;
      } else {
        this._aiAvailable = false;
      }
    } catch (error) {
      this._aiAvailable = false;
      console.warn('AI service availability check failed:', error);
    }

    // Notify UI of availability status.
    this.editor.fire('ai:availability', { available: this._aiAvailable });
  }

  /**
   * Check if AI services are currently available.
   *
   * @returns {boolean} True if AI services are available.
   */
  isAiAvailable() {
    return this._aiAvailable;
  }
}
