/**
 * @file
 * Content Translation widget JavaScript.
 *
 * Provides client-side functionality for translating page content
 * using Amazon Translate service via REST API.
 *
 * Story 4.7: Content Translation
 */

(function (Drupal, drupalSettings, once) {
  'use strict';

  /**
   * Content Translation behavior.
   */
  Drupal.behaviors.ndxContentTranslation = {
    attach: function (context) {
      once('ndx-content-translation', '.translation-widget', context).forEach(function (widget) {
        new TranslationWidget(widget);
      });
    }
  };

  /**
   * TranslationWidget class.
   *
   * @param {HTMLElement} widget - The widget container element.
   */
  function TranslationWidget(widget) {
    this.widget = widget;
    this.settings = drupalSettings.ndxTranslation || {};

    // State management.
    this.state = {
      currentLanguage: null,
      originalContent: null,
      isTranslated: false,
      isLoading: false,
      recentLanguages: this.getRecentLanguages(),
      preferredLanguage: localStorage.getItem('ndx_preferred_language')
    };

    // DOM elements.
    this.elements = {
      searchInput: widget.querySelector('.translation-search'),
      languageSelect: widget.querySelector('.translation-language-select'),
      submitButton: widget.querySelector('.translation-submit'),
      revertButton: widget.querySelector('.translation-revert'),
      banner: widget.querySelector('.translation-banner'),
      bannerLanguage: widget.querySelector('.translation-banner__language'),
      rememberCheckbox: widget.querySelector('.translation-remember-checkbox'),
      loadingIndicator: widget.querySelector('.translation-widget__loading'),
      errorArea: widget.querySelector('.translation-widget__error'),
      statusArea: widget.querySelector('.translation-widget__status'),
      recentGroup: widget.querySelector('.translation-recent-group'),
      priorityGroup: widget.querySelector('.translation-priority-group'),
      allGroup: widget.querySelector('.translation-all-group')
    };

    this.init();
  }

  /**
   * Initialize the widget.
   */
  TranslationWidget.prototype.init = function () {
    this.populateRecentLanguages();
    this.bindEvents();

    // Auto-translate if preference exists and enabled.
    if (this.settings.autoTranslate && this.state.preferredLanguage) {
      this.translatePage(this.state.preferredLanguage);
    }
  };

  /**
   * Bind event handlers.
   */
  TranslationWidget.prototype.bindEvents = function () {
    var self = this;

    // Language selection change.
    if (this.elements.languageSelect) {
      this.elements.languageSelect.addEventListener('change', function () {
        self.elements.submitButton.disabled = !this.value;
      });
    }

    // Submit button click.
    if (this.elements.submitButton) {
      this.elements.submitButton.addEventListener('click', function () {
        var targetLanguage = self.elements.languageSelect.value;
        if (targetLanguage) {
          self.translatePage(targetLanguage);
        }
      });
    }

    // Revert button click.
    if (this.elements.revertButton) {
      this.elements.revertButton.addEventListener('click', function (e) {
        // Shift+click clears preference.
        if (e.shiftKey) {
          self.clearPreference();
        }
        self.revertToOriginal();
      });
    }

    // Remember checkbox change.
    if (this.elements.rememberCheckbox) {
      this.elements.rememberCheckbox.addEventListener('change', function () {
        if (this.checked && self.state.currentLanguage) {
          self.savePreference(self.state.currentLanguage);
        } else {
          self.clearPreference();
        }
      });
    }

    // Search input filtering.
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', function () {
        self.filterLanguages(this.value);
      });

      // Clear search on Escape.
      this.elements.searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          this.value = '';
          self.filterLanguages('');
          this.blur();
        }
      });
    }

    // Keyboard shortcuts for select.
    if (this.elements.languageSelect) {
      this.elements.languageSelect.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && this.value) {
          e.preventDefault();
          self.translatePage(this.value);
        }
      });
    }
  };

  /**
   * Populate recent languages in the dropdown.
   */
  TranslationWidget.prototype.populateRecentLanguages = function () {
    if (!this.elements.recentGroup || this.state.recentLanguages.length === 0) {
      return;
    }

    var allLanguages = this.settings.allLanguages || {};
    var fragment = document.createDocumentFragment();

    this.state.recentLanguages.forEach(function (code) {
      if (allLanguages[code]) {
        var option = document.createElement('option');
        option.value = code;
        option.textContent = allLanguages[code];
        fragment.appendChild(option);
      }
    });

    if (fragment.hasChildNodes()) {
      this.elements.recentGroup.innerHTML = '';
      this.elements.recentGroup.appendChild(fragment);
      this.elements.recentGroup.hidden = false;
    }
  };

  /**
   * Filter languages based on search term.
   *
   * @param {string} searchTerm - The search term.
   */
  TranslationWidget.prototype.filterLanguages = function (searchTerm) {
    var normalizedSearch = searchTerm.toLowerCase().trim();
    var select = this.elements.languageSelect;
    var options = select.querySelectorAll('option');

    options.forEach(function (option) {
      if (!option.value) return; // Skip placeholder.

      var languageName = option.textContent.toLowerCase();
      var languageCode = option.value.toLowerCase();
      var matches = !normalizedSearch ||
                    languageName.includes(normalizedSearch) ||
                    languageCode.includes(normalizedSearch);

      option.hidden = !matches;
    });

    // Show/hide optgroups based on visible options.
    var optgroups = select.querySelectorAll('optgroup');
    optgroups.forEach(function (group) {
      var visibleOptions = group.querySelectorAll('option:not([hidden])');
      group.hidden = visibleOptions.length === 0;
    });
  };

  /**
   * Translate the page content.
   *
   * @param {string} targetLanguage - The target language code.
   */
  TranslationWidget.prototype.translatePage = function (targetLanguage) {
    var self = this;

    if (this.state.isLoading) {
      return;
    }

    // Store original content if not already stored.
    if (!this.state.originalContent) {
      var contentArea = this.getContentArea();
      if (!contentArea) {
        this.showError(Drupal.t('Could not find content to translate.'));
        return;
      }
      this.state.originalContent = contentArea.innerHTML;
    }

    this.setLoading(true);
    this.hideError();

    fetch(this.settings.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html: this.state.originalContent,
        targetLanguage: targetLanguage
      })
    })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      self.setLoading(false);

      if (data.success) {
        self.applyTranslation(data, targetLanguage);
      } else {
        self.showError(data.error || Drupal.t('Translation failed.'));
      }
    })
    .catch(function (error) {
      self.setLoading(false);
      self.showError(Drupal.t('Network error. Please try again.'));
      console.error('Translation error:', error);
    });
  };

  /**
   * Apply the translation to the page.
   *
   * @param {Object} data - The translation response data.
   * @param {string} targetLanguage - The target language code.
   */
  TranslationWidget.prototype.applyTranslation = function (data, targetLanguage) {
    var contentArea = this.getContentArea();
    if (!contentArea) {
      return;
    }

    // Replace content.
    contentArea.innerHTML = data.translatedHtml;

    // Update lang attribute on content area.
    contentArea.setAttribute('lang', targetLanguage);

    // Update state.
    this.state.currentLanguage = targetLanguage;
    this.state.isTranslated = true;

    // Show banner.
    this.showTranslationBanner(data.languageName);

    // Update recent languages.
    this.updateRecentLanguages(targetLanguage);

    // Update select to show current language.
    this.elements.languageSelect.value = targetLanguage;

    // Announce to screen readers.
    this.announce(Drupal.t('Page translated to @language', {
      '@language': data.languageName
    }));

    // Check remember checkbox if preference was saved.
    if (this.state.preferredLanguage === targetLanguage) {
      this.elements.rememberCheckbox.checked = true;
    }
  };

  /**
   * Revert to the original content.
   */
  TranslationWidget.prototype.revertToOriginal = function () {
    if (!this.state.originalContent) {
      return;
    }

    var contentArea = this.getContentArea();
    if (!contentArea) {
      return;
    }

    // Restore original content.
    contentArea.innerHTML = this.state.originalContent;

    // Remove lang attribute or reset to page default.
    contentArea.removeAttribute('lang');

    // Update state.
    this.state.isTranslated = false;
    this.state.currentLanguage = null;

    // Hide banner.
    this.hideTranslationBanner();

    // Reset select.
    this.elements.languageSelect.value = '';
    this.elements.submitButton.disabled = true;

    // Uncheck remember checkbox.
    this.elements.rememberCheckbox.checked = false;

    // Announce to screen readers.
    this.announce(Drupal.t('Showing original content'));
  };

  /**
   * Get the main content area element.
   *
   * @return {HTMLElement|null} The content area or null.
   */
  TranslationWidget.prototype.getContentArea = function () {
    // Try common LocalGov Drupal selectors.
    var selectors = [
      'article.node .node__content',
      'article.node',
      '.node__content',
      'main .content',
      'main article',
      'main'
    ];

    for (var i = 0; i < selectors.length; i++) {
      var element = document.querySelector(selectors[i]);
      if (element) {
        return element;
      }
    }

    return null;
  };

  /**
   * Show the translation banner.
   *
   * @param {string} languageName - The translated language name.
   */
  TranslationWidget.prototype.showTranslationBanner = function (languageName) {
    if (this.elements.banner) {
      this.elements.bannerLanguage.textContent = languageName;
      this.elements.banner.hidden = false;
    }
  };

  /**
   * Hide the translation banner.
   */
  TranslationWidget.prototype.hideTranslationBanner = function () {
    if (this.elements.banner) {
      this.elements.banner.hidden = true;
    }
  };

  /**
   * Set loading state.
   *
   * @param {boolean} loading - Whether loading is in progress.
   */
  TranslationWidget.prototype.setLoading = function (loading) {
    this.state.isLoading = loading;

    if (this.elements.loadingIndicator) {
      this.elements.loadingIndicator.hidden = !loading;
    }

    this.elements.submitButton.disabled = loading || !this.elements.languageSelect.value;
    this.widget.classList.toggle('translation-widget--loading', loading);

    if (loading) {
      this.announce(Drupal.t('Translating page content...'));
    }
  };

  /**
   * Show an error message.
   *
   * @param {string} message - The error message.
   */
  TranslationWidget.prototype.showError = function (message) {
    if (this.elements.errorArea) {
      this.elements.errorArea.textContent = message;
      this.elements.errorArea.hidden = false;
    }
    this.announce(Drupal.t('Error: @message', { '@message': message }));
  };

  /**
   * Hide the error message.
   */
  TranslationWidget.prototype.hideError = function () {
    if (this.elements.errorArea) {
      this.elements.errorArea.hidden = true;
      this.elements.errorArea.textContent = '';
    }
  };

  /**
   * Announce a message to screen readers.
   *
   * @param {string} message - The message to announce.
   */
  TranslationWidget.prototype.announce = function (message) {
    if (Drupal.announce) {
      Drupal.announce(message);
    }
    if (this.elements.statusArea) {
      this.elements.statusArea.textContent = message;
    }
  };

  /**
   * Get recently used languages from localStorage.
   *
   * @return {Array} Array of language codes.
   */
  TranslationWidget.prototype.getRecentLanguages = function () {
    try {
      var stored = localStorage.getItem('ndx_recent_languages');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };

  /**
   * Update recently used languages.
   *
   * @param {string} languageCode - The language code to add.
   */
  TranslationWidget.prototype.updateRecentLanguages = function (languageCode) {
    // Remove if already exists.
    var recent = this.state.recentLanguages.filter(function (code) {
      return code !== languageCode;
    });

    // Add to front.
    recent.unshift(languageCode);

    // Keep only last 5.
    this.state.recentLanguages = recent.slice(0, 5);

    // Save to localStorage.
    try {
      localStorage.setItem('ndx_recent_languages', JSON.stringify(this.state.recentLanguages));
    } catch (e) {
      // localStorage may be unavailable.
    }

    // Update dropdown.
    this.populateRecentLanguages();
  };

  /**
   * Save language preference.
   *
   * @param {string} languageCode - The language code to save.
   */
  TranslationWidget.prototype.savePreference = function (languageCode) {
    this.state.preferredLanguage = languageCode;
    try {
      localStorage.setItem('ndx_preferred_language', languageCode);
    } catch (e) {
      // localStorage may be unavailable.
    }
  };

  /**
   * Clear language preference.
   */
  TranslationWidget.prototype.clearPreference = function () {
    this.state.preferredLanguage = null;
    try {
      localStorage.removeItem('ndx_preferred_language');
    } catch (e) {
      // localStorage may be unavailable.
    }
  };

})(Drupal, drupalSettings, once);
