/**
 * @file
 * Alt-text auto-generation functionality for media uploads.
 *
 * Story 4.5: Auto Alt-Text on Media Upload
 *
 * Automatically generates WCAG-compliant alt-text when images are uploaded
 * to the media library.
 */

(function (Drupal, drupalSettings, once) {
  'use strict';

  /**
   * Alt-text generator behavior.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.ndxAltTextGenerator = {
    attach: function (context, settings) {
      // Find all image file inputs in media forms.
      const fileInputs = once(
        'ndx-alt-text-generator',
        'input[type="file"][accept*="image"]',
        context
      );

      fileInputs.forEach(function (input) {
        input.addEventListener('change', function (event) {
          Drupal.ndxAltText.handleFileChange(event.target);
        });
      });

      // Also watch for managed file widgets that use AJAX.
      const managedFileWrappers = once(
        'ndx-alt-text-managed',
        '.form-managed-file',
        context
      );

      managedFileWrappers.forEach(function (wrapper) {
        Drupal.ndxAltText.watchManagedFile(wrapper);
      });

      // Set up generate buttons.
      const generateButtons = once(
        'ndx-alt-text-generate-btn',
        '.alt-text-generate-btn',
        context
      );

      generateButtons.forEach(function (button) {
        button.addEventListener('click', function (event) {
          event.preventDefault();
          Drupal.ndxAltText.handleGenerateClick(button);
        });
      });
    }
  };

  /**
   * Namespace for alt-text generation functions.
   */
  Drupal.ndxAltText = Drupal.ndxAltText || {

    /**
     * API endpoint for alt-text generation.
     */
    endpoint: '/api/ndx-ai/alt-text/generate',

    /**
     * Handle file input change event.
     *
     * @param {HTMLInputElement} input
     *   The file input element.
     */
    handleFileChange: function (input) {
      const files = input.files;
      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];
      if (!file.type.startsWith('image/')) {
        return;
      }

      // Find the associated alt-text field.
      const altField = this.findAltTextField(input);
      if (!altField) {
        console.log('Alt-text field not found for input');
        return;
      }

      // Only generate if alt field is empty.
      if (altField.value.trim() !== '') {
        return;
      }

      // Show loading state.
      this.setLoadingState(altField, true);

      // Read file and generate alt-text.
      this.generateFromFile(file, altField);
    },

    /**
     * Watch a managed file widget for file uploads.
     *
     * @param {HTMLElement} wrapper
     *   The managed file wrapper element.
     */
    watchManagedFile: function (wrapper) {
      const self = this;
      let lastFidValue = null;
      let processingTriggered = false;

      const observer = new MutationObserver(function (mutations) {
        // Check if a file was uploaded (fid hidden field appears or changes).
        const fidInput = wrapper.querySelector('input[name*="[fids]"]');
        if (!fidInput || !fidInput.value) {
          lastFidValue = null;
          processingTriggered = false;
          return;
        }

        // Only trigger once per file upload.
        if (fidInput.value === lastFidValue && processingTriggered) {
          return;
        }

        lastFidValue = fidInput.value;

        // Use setTimeout to ensure DOM is fully updated after AJAX.
        setTimeout(function () {
          // Look for alt field in wrapper first, then in the form.
          let altField = wrapper.querySelector('input[name*="[alt]"]');
          if (!altField) {
            const form = wrapper.closest('form');
            if (form) {
              altField = form.querySelector('input[name*="[alt]"]');
            }
          }

          if (altField && altField.value.trim() === '' && !processingTriggered) {
            processingTriggered = true;
            console.log('Auto-generating alt-text for file ID:', fidInput.value);
            self.generateFromFileId(fidInput.value, altField, function () {
              // Reset after completion to allow regeneration.
              processingTriggered = false;
            });
          }
        }, 500);
      });

      observer.observe(wrapper, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['value']
      });
    },

    /**
     * Handle click on generate button.
     *
     * @param {HTMLElement} button
     *   The generate button.
     */
    handleGenerateClick: function (button) {
      const fileId = button.dataset.fileId;
      const altFieldSelector = button.dataset.altField;
      const altField = document.querySelector(altFieldSelector);

      if (!altField) {
        console.error('Alt field not found:', altFieldSelector);
        return;
      }

      if (fileId) {
        this.setLoadingState(altField, true);
        button.disabled = true;
        this.generateFromFileId(fileId, altField, function () {
          button.disabled = false;
        });
      }
    },

    /**
     * Find the alt-text field associated with a file input.
     *
     * @param {HTMLElement} element
     *   The file input or wrapper element.
     *
     * @return {HTMLInputElement|null}
     *   The alt-text input field, or null if not found.
     */
    findAltTextField: function (element) {
      // Look for common patterns in Drupal media forms.
      const wrapper = element.closest('.form-item, .form-managed-file, .media-library-add-form__input-wrapper, .field--type-image');

      if (wrapper) {
        // Try common selectors.
        const selectors = [
          'input[name*="[alt]"]',
          'input[data-drupal-selector*="alt"]',
          '.field--name-field-media-image input[name*="[alt]"]',
          'input.form-text[id*="alt"]'
        ];

        for (const selector of selectors) {
          const field = wrapper.querySelector(selector);
          if (field) {
            return field;
          }
        }

        // Look in parent container too.
        const form = wrapper.closest('form');
        if (form) {
          for (const selector of selectors) {
            const field = form.querySelector(selector);
            if (field) {
              return field;
            }
          }
        }
      }

      return null;
    },

    /**
     * Generate alt-text from a File object using base64.
     *
     * @param {File} file
     *   The image file.
     * @param {HTMLInputElement} altField
     *   The alt-text input field.
     */
    generateFromFile: function (file, altField) {
      const self = this;
      const reader = new FileReader();

      reader.onload = function (e) {
        const base64Data = e.target.result.split(',')[1];
        const mimeType = file.type;

        self.callApi('/api/ndx-ai/alt-text/generate-base64', {
          image_data: base64Data,
          mime_type: mimeType
        }, altField);
      };

      reader.onerror = function () {
        self.setLoadingState(altField, false);
        self.showError(altField, 'Failed to read image file.');
      };

      reader.readAsDataURL(file);
    },

    /**
     * Generate alt-text from a file ID.
     *
     * @param {string|number} fileId
     *   The Drupal file entity ID.
     * @param {HTMLInputElement} altField
     *   The alt-text input field.
     * @param {Function} [callback]
     *   Optional callback to run after completion.
     */
    generateFromFileId: function (fileId, altField, callback) {
      this.setLoadingState(altField, true);
      this.callApi('/api/ndx-ai/alt-text/generate', {
        file_id: parseInt(fileId, 10)
      }, altField, callback);
    },

    /**
     * Call the alt-text generation API.
     *
     * @param {string} endpoint
     *   The API endpoint.
     * @param {Object} data
     *   The request payload.
     * @param {HTMLInputElement} altField
     *   The alt-text input field.
     * @param {Function} [callback]
     *   Optional callback to run after completion.
     */
    callApi: function (endpoint, data, altField, callback) {
      const self = this;

      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(data),
        credentials: 'same-origin'
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (result) {
          self.setLoadingState(altField, false);

          if (result.success && result.alt_text) {
            altField.value = result.alt_text;
            self.showSuccess(altField, 'AI-generated alt-text applied.');
            // Trigger change event so Drupal knows the field was updated.
            altField.dispatchEvent(new Event('change', { bubbles: true }));
            // Announce for screen readers.
            Drupal.announce(Drupal.t('AI-generated alt-text has been added: @text', { '@text': result.alt_text }));
          } else {
            self.showError(altField, result.error || 'Failed to generate alt-text.');
          }

          if (callback) {
            callback();
          }
        })
        .catch(function (error) {
          console.error('Alt-text generation error:', error);
          self.setLoadingState(altField, false);
          self.showError(altField, 'An error occurred while generating alt-text.');

          if (callback) {
            callback();
          }
        });
    },

    /**
     * Set loading state on alt-text field.
     *
     * @param {HTMLInputElement} altField
     *   The alt-text input field.
     * @param {boolean} isLoading
     *   Whether loading is in progress.
     */
    setLoadingState: function (altField, isLoading) {
      const wrapper = altField.closest('.form-item') || altField.parentElement;

      if (isLoading) {
        altField.disabled = true;
        altField.classList.add('alt-text-loading');
        wrapper.classList.add('alt-text-generating');

        // Add spinner if not already present.
        if (!wrapper.querySelector('.alt-text-spinner')) {
          const spinner = document.createElement('span');
          spinner.className = 'alt-text-spinner';
          spinner.innerHTML = '<span class="visually-hidden">' + Drupal.t('Generating alt-text...') + '</span>';
          wrapper.appendChild(spinner);
        }
      } else {
        altField.disabled = false;
        altField.classList.remove('alt-text-loading');
        wrapper.classList.remove('alt-text-generating');

        // Remove spinner.
        const spinner = wrapper.querySelector('.alt-text-spinner');
        if (spinner) {
          spinner.remove();
        }
      }
    },

    /**
     * Show success message near alt-text field.
     *
     * @param {HTMLInputElement} altField
     *   The alt-text input field.
     * @param {string} message
     *   The success message.
     */
    showSuccess: function (altField, message) {
      this.showMessage(altField, message, 'status');
    },

    /**
     * Show error message near alt-text field.
     *
     * @param {HTMLInputElement} altField
     *   The alt-text input field.
     * @param {string} message
     *   The error message.
     */
    showError: function (altField, message) {
      this.showMessage(altField, message, 'error');
    },

    /**
     * Show a message near the alt-text field.
     *
     * @param {HTMLInputElement} altField
     *   The alt-text input field.
     * @param {string} message
     *   The message text.
     * @param {string} type
     *   Message type: 'status' or 'error'.
     */
    showMessage: function (altField, message, type) {
      const wrapper = altField.closest('.form-item') || altField.parentElement;

      // Remove existing messages.
      const existing = wrapper.querySelector('.alt-text-message');
      if (existing) {
        existing.remove();
      }

      // Create message element.
      const msgEl = document.createElement('div');
      msgEl.className = 'alt-text-message alt-text-message--' + type;
      msgEl.setAttribute('role', type === 'error' ? 'alert' : 'status');
      msgEl.textContent = message;

      wrapper.appendChild(msgEl);

      // Auto-remove after 5 seconds.
      setTimeout(function () {
        msgEl.remove();
      }, 5000);
    }
  };

})(Drupal, drupalSettings, once);
