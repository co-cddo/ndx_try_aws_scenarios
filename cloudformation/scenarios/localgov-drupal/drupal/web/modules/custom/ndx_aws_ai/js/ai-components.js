/**
 * @file
 * AI Component behaviours for Drupal.
 *
 * Provides JavaScript functionality for AI-powered UI components including:
 * - State transitions (loading → success/error)
 * - Focus management for accessibility
 * - Keyboard navigation support
 * - Auto-dismiss functionality for success states
 *
 * Story 3.3: AI Component Design System
 *
 * WCAG 2.2 AA Compliance:
 * - Keyboard accessible (Enter/Space to activate buttons)
 * - Focus management during state changes
 * - Respects prefers-reduced-motion
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Namespace for AI component utilities.
   */
  Drupal.ndxAwsAi = Drupal.ndxAwsAi || {};

  /**
   * State constants for AI operations.
   */
  Drupal.ndxAwsAi.states = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
  };

  /**
   * Check if user prefers reduced motion.
   *
   * @return {boolean}
   *   True if reduced motion is preferred.
   */
  Drupal.ndxAwsAi.prefersReducedMotion = function () {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  /**
   * Announce a message to screen readers.
   *
   * @param {string} message
   *   The message to announce.
   * @param {string} priority
   *   Priority level: 'polite' or 'assertive'.
   */
  Drupal.ndxAwsAi.announce = function (message, priority) {
    if (typeof Drupal.announce === 'function') {
      Drupal.announce(message, priority || 'polite');
    }
  };

  /**
   * AI Action Button behaviour.
   *
   * Attaches click handlers and keyboard accessibility to AI action buttons.
   */
  Drupal.behaviors.ndxAwsAiActionButton = {
    attach: function (context) {
      once('ai-action-button', '.ai-action-button', context).forEach(function (button) {
        // Handle click events.
        button.addEventListener('click', function (event) {
          var action = button.getAttribute('data-ai-action');
          if (action && !button.disabled) {
            // Dispatch custom event for action handlers.
            var customEvent = new CustomEvent('ai:action', {
              bubbles: true,
              detail: {
                action: action,
                button: button
              }
            });
            button.dispatchEvent(customEvent);
          }
        });

        // Ensure keyboard accessibility (Enter and Space).
        button.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            button.click();
          }
        });
      });
    }
  };

  /**
   * AI Loading State behaviour.
   *
   * Manages loading state visibility and announcements.
   */
  Drupal.behaviors.ndxAwsAiLoadingState = {
    attach: function (context) {
      once('ai-loading-state', '.ai-loading-state', context).forEach(function (element) {
        // Announce loading state to screen readers.
        var message = element.querySelector('.ai-loading-state__message');
        if (message) {
          Drupal.ndxAwsAi.announce(message.textContent, 'polite');
        }
      });
    }
  };

  /**
   * AI Error State behaviour.
   *
   * Attaches retry handlers and focus management for error states.
   */
  Drupal.behaviors.ndxAwsAiErrorState = {
    attach: function (context) {
      once('ai-error-state', '.ai-error-state', context).forEach(function (element) {
        var retryButton = element.querySelector('.ai-error-state__retry');

        if (retryButton) {
          retryButton.addEventListener('click', function (event) {
            var action = retryButton.getAttribute('data-ai-action');
            if (action) {
              // Dispatch retry event.
              var customEvent = new CustomEvent('ai:retry', {
                bubbles: true,
                detail: {
                  action: action,
                  element: element
                }
              });
              element.dispatchEvent(customEvent);
            }
          });
        }

        // Focus the retry button for accessibility.
        if (retryButton && document.activeElement !== retryButton) {
          // Small delay to ensure DOM is ready.
          setTimeout(function () {
            retryButton.focus();
          }, 100);
        }
      });
    }
  };

  /**
   * AI Success State behaviour.
   *
   * Manages auto-dismiss and dismiss button functionality.
   */
  Drupal.behaviors.ndxAwsAiSuccessState = {
    attach: function (context) {
      once('ai-success-state', '.ai-success-state', context).forEach(function (element) {
        var dismissButton = element.querySelector('.ai-success-state__dismiss');
        var autoDismissTime = parseInt(element.getAttribute('data-auto-dismiss'), 10);

        /**
         * Dismiss the success state.
         */
        var dismiss = function () {
          if (Drupal.ndxAwsAi.prefersReducedMotion()) {
            element.remove();
          } else {
            element.classList.add('ai-success-state--dismissing');
            element.addEventListener('animationend', function () {
              element.remove();
            }, { once: true });
          }

          // Dispatch dismiss event.
          var customEvent = new CustomEvent('ai:dismiss', {
            bubbles: true,
            detail: {
              element: element
            }
          });
          document.dispatchEvent(customEvent);
        };

        // Handle manual dismiss.
        if (dismissButton) {
          dismissButton.addEventListener('click', dismiss);
        }

        // Handle auto-dismiss.
        if (autoDismissTime > 0) {
          setTimeout(dismiss, autoDismissTime);
        }

        // Announce success to screen readers.
        var message = element.querySelector('.ai-success-state__message');
        if (message) {
          Drupal.ndxAwsAi.announce(message.textContent, 'polite');
        }
      });
    }
  };

  /**
   * State Container Manager.
   *
   * Utility for managing state transitions in AI components.
   */
  Drupal.ndxAwsAi.StateManager = function (container) {
    this.container = container;
    this.currentState = Drupal.ndxAwsAi.states.IDLE;
  };

  /**
   * Transition to a new state.
   *
   * @param {string} newState
   *   The new state to transition to.
   * @param {Object} options
   *   Optional configuration for the transition.
   */
  Drupal.ndxAwsAi.StateManager.prototype.setState = function (newState, options) {
    var states = Drupal.ndxAwsAi.states;
    var container = this.container;
    var previousState = this.currentState;
    options = options || {};

    // Remove all state classes.
    container.classList.remove(
      'ai-state-container--loading',
      'ai-state-container--success',
      'ai-state-container--error'
    );

    // Add new state class.
    if (newState !== states.IDLE) {
      container.classList.add('ai-state-container--' + newState);
    }

    // Update ARIA attributes.
    container.setAttribute('aria-busy', newState === states.LOADING ? 'true' : 'false');

    // Update current state before dispatching event.
    this.currentState = newState;

    // Dispatch state change event.
    var customEvent = new CustomEvent('ai:statechange', {
      bubbles: true,
      detail: {
        previousState: previousState,
        newState: newState,
        options: options
      }
    });
    container.dispatchEvent(customEvent);

    return this;
  };

  /**
   * Show loading state.
   *
   * @param {string} message
   *   Optional loading message.
   */
  Drupal.ndxAwsAi.StateManager.prototype.showLoading = function (message) {
    this.setState(Drupal.ndxAwsAi.states.LOADING, { message: message });
    if (message) {
      Drupal.ndxAwsAi.announce(message, 'polite');
    }
    return this;
  };

  /**
   * Show success state.
   *
   * @param {string} message
   *   Success message.
   * @param {number} autoDismiss
   *   Auto-dismiss time in milliseconds.
   */
  Drupal.ndxAwsAi.StateManager.prototype.showSuccess = function (message, autoDismiss) {
    this.setState(Drupal.ndxAwsAi.states.SUCCESS, {
      message: message,
      autoDismiss: autoDismiss
    });
    if (message) {
      Drupal.ndxAwsAi.announce(message, 'polite');
    }
    return this;
  };

  /**
   * Show error state.
   *
   * @param {string} message
   *   Error message.
   * @param {string} errorCode
   *   Optional error code.
   */
  Drupal.ndxAwsAi.StateManager.prototype.showError = function (message, errorCode) {
    this.setState(Drupal.ndxAwsAi.states.ERROR, {
      message: message,
      errorCode: errorCode
    });
    if (message) {
      Drupal.ndxAwsAi.announce(message, 'assertive');
    }
    return this;
  };

  /**
   * Reset to idle state.
   */
  Drupal.ndxAwsAi.StateManager.prototype.reset = function () {
    return this.setState(Drupal.ndxAwsAi.states.IDLE);
  };

  /**
   * Focus management utility.
   *
   * Manages focus during state transitions for accessibility.
   */
  Drupal.ndxAwsAi.focusFirst = function (container, selector) {
    var focusable = container.querySelector(
      selector || 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) {
      focusable.focus();
    }
  };

})(Drupal, once);
