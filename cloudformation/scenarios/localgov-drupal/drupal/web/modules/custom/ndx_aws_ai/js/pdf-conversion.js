/**
 * @file
 * PDF-to-Web conversion functionality.
 *
 * Handles PDF upload, conversion progress tracking, and draft page creation.
 *
 * Story 4.8: PDF-to-Web Conversion
 */

(function (Drupal, drupalSettings, once) {
  'use strict';

  /**
   * Behavior for PDF conversion form.
   */
  Drupal.behaviors.ndxPdfConversion = {
    attach: function (context) {
      once('pdf-conversion', '.ndx-pdf-conversion-form', context).forEach(function (form) {
        new PdfConverter(form);
      });
    }
  };

  /**
   * PDF Converter class.
   *
   * @param {HTMLFormElement} form
   *   The PDF conversion form element.
   */
  function PdfConverter(form) {
    this.form = form;
    this.settings = drupalSettings.ndxPdfConversion || {};

    // UI elements.
    this.fileInput = form.querySelector('input[type="file"]');
    this.titleInput = form.querySelector('#edit-page-title');
    this.submitButton = form.querySelector('#edit-submit');
    this.createDraftButton = form.querySelector('[data-create-draft]');

    this.progressContainer = form.querySelector('#pdf-conversion-progress');
    this.progressStep = form.querySelector('[data-progress-step]');
    this.progressBar = form.querySelector('[data-progress-bar]');
    this.progressBarFill = form.querySelector('.progress-bar-fill');

    this.resultContainer = form.querySelector('#pdf-conversion-result');
    this.previewContent = form.querySelector('[data-preview-content]');
    this.statsElement = form.querySelector('[data-stats]');

    this.errorContainer = form.querySelector('#pdf-conversion-error');
    this.errorMessage = form.querySelector('[data-error-message]');

    // State.
    this.currentJobId = null;
    this.conversionResult = null;
    this.pollInterval = null;

    this.init();
  }

  /**
   * Initialize the converter.
   */
  PdfConverter.prototype.init = function () {
    var self = this;

    // Intercept form submission.
    this.form.addEventListener('submit', function (event) {
      if (event.submitter === self.submitButton) {
        event.preventDefault();
        self.startConversion();
      } else if (event.submitter === self.createDraftButton) {
        event.preventDefault();
        self.createDraftPage();
      }
    });
  };

  /**
   * Start the PDF conversion process.
   */
  PdfConverter.prototype.startConversion = function () {
    var self = this;

    // Get file ID from managed file field.
    var fileInput = this.form.querySelector('input[name="pdf_file[fids]"]');
    var fileId = fileInput ? fileInput.value : null;

    if (!fileId) {
      this.showError(Drupal.t('Please upload a PDF file first.'));
      return;
    }

    // Validate title.
    var title = this.titleInput.value.trim();
    if (!title) {
      this.showError(Drupal.t('Please enter a page title.'));
      this.titleInput.focus();
      return;
    }

    // Show progress UI.
    this.showProgress();
    this.updateProgress(0, Drupal.t('Starting conversion...'));

    // Start conversion.
    fetch(this.settings.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_id: parseInt(fileId, 10)
      })
    })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.success) {
        self.currentJobId = data.jobId;
        self.pollStatus(data.statusUrl);
      } else {
        self.showError(data.error || Drupal.t('Failed to start conversion.'));
      }
    })
    .catch(function (error) {
      self.showError(Drupal.t('Network error. Please try again.'));
      console.error('PDF conversion error:', error);
    });
  };

  /**
   * Poll for conversion status.
   *
   * @param {string} statusUrl
   *   The status endpoint URL.
   */
  PdfConverter.prototype.pollStatus = function (statusUrl) {
    var self = this;

    // Clear any existing poll interval.
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    var poll = function () {
      fetch(statusUrl)
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          self.updateProgress(data.progress, data.step);

          if (data.status === 'complete') {
            clearInterval(self.pollInterval);
            self.pollInterval = null;
            self.conversionResult = data.result;
            self.showResult(data.result);
          } else if (data.status === 'error') {
            clearInterval(self.pollInterval);
            self.pollInterval = null;
            self.showError(data.error || Drupal.t('Conversion failed.'));
          }
          // Otherwise, continue polling.
        })
        .catch(function (error) {
          console.error('Status poll error:', error);
          // Continue polling on error.
        });
    };

    // Poll immediately, then every second.
    poll();
    this.pollInterval = setInterval(poll, 1000);
  };

  /**
   * Show progress UI.
   */
  PdfConverter.prototype.showProgress = function () {
    this.hideError();
    this.resultContainer.classList.add('js-hide');
    this.progressContainer.classList.remove('js-hide');
    this.submitButton.disabled = true;
    this.createDraftButton.classList.add('js-hide');
  };

  /**
   * Update progress display.
   *
   * @param {number} percent
   *   Progress percentage (0-100).
   * @param {string} step
   *   Current step description.
   */
  PdfConverter.prototype.updateProgress = function (percent, step) {
    this.progressStep.textContent = step;

    if (this.progressBar) {
      this.progressBar.setAttribute('aria-valuenow', percent);
    }

    if (this.progressBarFill) {
      this.progressBarFill.style.width = percent + '%';
    }

    // Announce progress to screen readers.
    Drupal.announce(step, 'polite');
  };

  /**
   * Show conversion result.
   *
   * @param {Object} result
   *   The conversion result data.
   */
  PdfConverter.prototype.showResult = function (result) {
    var self = this;

    // Hide progress, show result.
    this.progressContainer.classList.add('js-hide');
    this.resultContainer.classList.remove('js-hide');
    this.submitButton.disabled = false;
    this.createDraftButton.classList.remove('js-hide');

    // Display preview.
    if (this.previewContent && result.html) {
      // Create a safe preview container.
      var preview = document.createElement('div');
      preview.className = 'preview-html';
      preview.innerHTML = result.html;

      // Limit preview height.
      this.previewContent.innerHTML = '';
      this.previewContent.appendChild(preview);
    }

    // Display stats.
    if (this.statsElement) {
      var statsHtml = '<li>' + Drupal.t('Pages: @count', { '@count': result.pageCount }) + '</li>';
      statsHtml += '<li>' + Drupal.t('Tables: @count', { '@count': result.tableCount }) + '</li>';
      statsHtml += '<li>' + Drupal.t('Words: @count', { '@count': result.wordCount }) + '</li>';
      statsHtml += '<li>' + Drupal.t('Confidence: @percent%', { '@percent': result.confidence.toFixed(1) }) + '</li>';
      statsHtml += '<li>' + Drupal.t('Processing time: @time ms', { '@time': result.processingTimeMs.toFixed(0) }) + '</li>';
      this.statsElement.innerHTML = statsHtml;
    }

    // Announce completion.
    Drupal.announce(Drupal.t('Conversion complete. Review the preview and click Create Draft Page to save.'), 'assertive');
  };

  /**
   * Show error message.
   *
   * @param {string} message
   *   The error message.
   */
  PdfConverter.prototype.showError = function (message) {
    this.progressContainer.classList.add('js-hide');
    this.resultContainer.classList.add('js-hide');
    this.errorContainer.classList.remove('js-hide');
    this.submitButton.disabled = false;

    if (this.errorMessage) {
      this.errorMessage.textContent = message;
    }

    // Announce error.
    Drupal.announce(message, 'assertive');
  };

  /**
   * Hide error message.
   */
  PdfConverter.prototype.hideError = function () {
    this.errorContainer.classList.add('js-hide');
  };

  /**
   * Create a draft page from conversion result.
   */
  PdfConverter.prototype.createDraftPage = function () {
    var self = this;

    if (!this.currentJobId || !this.conversionResult) {
      this.showError(Drupal.t('No conversion result available.'));
      return;
    }

    var title = this.titleInput.value.trim();
    if (!title) {
      this.showError(Drupal.t('Please enter a page title.'));
      this.titleInput.focus();
      return;
    }

    // Disable button while creating.
    this.createDraftButton.disabled = true;
    this.createDraftButton.textContent = Drupal.t('Creating...');

    fetch(this.settings.createNodeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        job_id: this.currentJobId,
        title: title
      })
    })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.success) {
        // Redirect to edit the new node.
        window.location.href = data.editUrl;
      } else {
        self.createDraftButton.disabled = false;
        self.createDraftButton.textContent = Drupal.t('Create Draft Page');
        self.showError(data.error || Drupal.t('Failed to create page.'));
      }
    })
    .catch(function (error) {
      self.createDraftButton.disabled = false;
      self.createDraftButton.textContent = Drupal.t('Create Draft Page');
      self.showError(Drupal.t('Network error. Please try again.'));
      console.error('Create node error:', error);
    });
  };

})(Drupal, drupalSettings, once);
