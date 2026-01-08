/**
 * Credentials Card Component - Story 2.3
 *
 * Provides copy-to-clipboard and password toggle functionality for:
 * - Drupal site URL
 * - Admin username
 * - Admin password (with show/hide toggle)
 *
 * Includes:
 * - Visual feedback on copy success
 * - Screen reader announcements
 * - Keyboard accessibility
 * - Security: no sensitive data logged
 */

(function () {
  'use strict';

  // Configuration
  const COPY_FEEDBACK_DURATION = 2000; // ms to show "Copied!" feedback
  const ANNOUNCEMENT_CLEAR_DELAY = 1000; // ms before clearing aria-live

  // DOM elements
  let copyButtons;
  let toggleButtons;
  let announcementArea;

  /**
   * Initialize the credentials card component
   */
  function init() {
    const container = document.getElementById('credentials-card');
    if (!container) return;

    // Cache DOM elements
    copyButtons = container.querySelectorAll('.ndx-copy-btn');
    toggleButtons = container.querySelectorAll('.ndx-toggle-btn');
    announcementArea = document.getElementById('copy-announcement');

    // Bind event listeners
    copyButtons.forEach(function (button) {
      button.addEventListener('click', handleCopy);
    });

    toggleButtons.forEach(function (button) {
      button.addEventListener('click', handleToggle);
    });

    // Initialize login button URL
    initLoginButton();
  }

  /**
   * Handle copy button click
   * @param {Event} event - Click event
   */
  function handleCopy(event) {
    const button = event.currentTarget;
    const targetId = button.getAttribute('data-copy-target');
    const input = document.getElementById(targetId);

    if (!input) return;

    const text = input.value;
    const label = getFieldLabel(targetId);

    copyToClipboard(text)
      .then(function () {
        showCopySuccess(button);
        announce(label + ' copied to clipboard');
      })
      .catch(function () {
        showCopyFallback(button, input);
        announce('Copy failed. Please select and copy manually.');
      });
  }

  /**
   * Copy text to clipboard using Clipboard API
   * @param {string} text - Text to copy
   * @returns {Promise} Resolves on success, rejects on failure
   */
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    // Fallback for older browsers
    return new Promise(function (resolve, reject) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        textarea.setAttribute('readonly', '');
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (success) {
          resolve();
        } else {
          reject(new Error('Copy command failed'));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Show copy success feedback on button
   * @param {HTMLElement} button - The copy button
   */
  function showCopySuccess(button) {
    const textSpan = button.querySelector('.ndx-copy-btn__text');
    const iconSpan = button.querySelector('.ndx-copy-btn__icon');
    const originalText = textSpan.textContent;
    const originalIcon = iconSpan.textContent;

    // Update to success state
    textSpan.textContent = 'Copied!';
    iconSpan.textContent = '✓';
    button.classList.add('ndx-copy-btn--success');

    // Reset after delay
    setTimeout(function () {
      textSpan.textContent = originalText;
      iconSpan.textContent = originalIcon;
      button.classList.remove('ndx-copy-btn--success');
    }, COPY_FEEDBACK_DURATION);
  }

  /**
   * Show fallback when copy fails (select the input)
   * @param {HTMLElement} button - The copy button
   * @param {HTMLInputElement} input - The input element
   */
  function showCopyFallback(button, input) {
    // Select the input text
    input.select();
    input.setSelectionRange(0, 99999); // For mobile

    // Show error state briefly
    const textSpan = button.querySelector('.ndx-copy-btn__text');
    const originalText = textSpan.textContent;
    textSpan.textContent = 'Select & Copy';

    setTimeout(function () {
      textSpan.textContent = originalText;
    }, COPY_FEEDBACK_DURATION);
  }

  /**
   * Handle password toggle button click
   * @param {Event} event - Click event
   */
  function handleToggle(event) {
    const button = event.currentTarget;
    const targetId = button.getAttribute('data-toggle-target');
    const input = document.getElementById(targetId);

    if (!input) return;

    const isHidden = input.type === 'password';
    const showIcon = button.querySelector('.ndx-toggle-btn__icon--show');
    const hideIcon = button.querySelector('.ndx-toggle-btn__icon--hide');
    const textSpan = button.querySelector('.ndx-toggle-btn__text');

    if (isHidden) {
      // Show password
      input.type = 'text';
      button.setAttribute('aria-pressed', 'true');
      button.setAttribute('aria-label', 'Hide password');
      if (showIcon) showIcon.hidden = true;
      if (hideIcon) hideIcon.hidden = false;
      textSpan.textContent = 'Hide';
      announce('Password shown');
    } else {
      // Hide password
      input.type = 'password';
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', 'Show password');
      if (showIcon) showIcon.hidden = false;
      if (hideIcon) hideIcon.hidden = true;
      textSpan.textContent = 'Show';
      announce('Password hidden');
    }
  }

  /**
   * Get human-readable label for a field
   * @param {string} fieldId - The field ID
   * @returns {string} Human-readable label
   */
  function getFieldLabel(fieldId) {
    const labels = {
      'credential-url': 'Site URL',
      'credential-username': 'Username',
      'credential-password': 'Password'
    };
    return labels[fieldId] || 'Text';
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   */
  function announce(message) {
    if (!announcementArea) return;

    announcementArea.textContent = message;

    // Clear after delay to allow future announcements
    setTimeout(function () {
      announcementArea.textContent = '';
    }, ANNOUNCEMENT_CLEAR_DELAY);
  }

  /**
   * Initialize the login button with the Drupal admin URL
   */
  function initLoginButton() {
    const loginBtn = document.getElementById('login-admin-btn');
    const urlInput = document.getElementById('credential-url');
    const openSiteBtn = document.getElementById('open-site-btn');

    if (!loginBtn || !urlInput) return;

    // Update login button href when URL input changes
    // For now, set based on input value
    const siteUrl = urlInput.value;
    if (siteUrl && siteUrl !== 'https://your-drupal-site.example.com') {
      loginBtn.href = siteUrl + '/user/login';
      if (openSiteBtn) {
        openSiteBtn.href = siteUrl;
      }
    }

    // Listen for URL input changes (if user pastes their actual URL)
    urlInput.addEventListener('change', function () {
      const newUrl = urlInput.value;
      if (newUrl && newUrl.startsWith('http')) {
        loginBtn.href = newUrl + '/user/login';
        if (openSiteBtn) {
          openSiteBtn.href = newUrl;
        }
      }
    });

    // Make input editable for user to paste their actual URL
    urlInput.removeAttribute('readonly');
    urlInput.placeholder = 'Paste your DrupalUrl from CloudFormation Outputs';
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
