/**
 * @file
 * NDX Walkthrough JavaScript.
 *
 * Implements the guided tour overlay with:
 * - Spotlight highlighting of target elements
 * - Modal positioning relative to targets
 * - Focus trap within modal
 * - Keyboard navigation (Tab, Escape)
 * - Progress persistence via localStorage
 * - Auto-trigger on first login
 *
 * Story 2.5: Walkthrough Overlay in Drupal
 */

(function (Drupal, drupalSettings) {
  'use strict';

  /**
   * NDX Walkthrough controller.
   */
  Drupal.behaviors.ndxWalkthrough = {
    attach: function (context) {
      // Only initialize once.
      if (context !== document) {
        return;
      }

      const settings = drupalSettings.ndxWalkthrough || {};
      const steps = settings.steps || [];
      const storageKey = settings.storageKey || 'ndx_walkthrough_progress';

      if (steps.length === 0) {
        return;
      }

      // DOM elements.
      const overlay = document.getElementById('ndx-walkthrough-overlay');
      const modal = document.getElementById('ndx-walkthrough-modal');
      const trigger = document.getElementById('ndx-walkthrough-trigger');
      const closeBtn = modal ? modal.querySelector('.ndx-walkthrough-close') : null;
      const prevBtn = document.getElementById('ndx-walkthrough-prev');
      const nextBtn = document.getElementById('ndx-walkthrough-next');
      const skipBtn = document.getElementById('ndx-walkthrough-skip');
      const titleEl = document.getElementById('ndx-walkthrough-title');
      const contentEl = document.getElementById('ndx-walkthrough-content');
      const counterEl = document.getElementById('ndx-walkthrough-counter');

      if (!overlay || !modal || !trigger) {
        return;
      }

      // State.
      let currentStep = 0;
      let isActive = false;
      let spotlight = null;
      let previouslyFocusedElement = null;

      /**
       * Get saved progress from localStorage.
       */
      function getProgress() {
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            return JSON.parse(saved);
          }
        } catch (e) {
          // Ignore localStorage errors.
        }
        return null;
      }

      /**
       * Save progress to localStorage.
       */
      function saveProgress() {
        try {
          localStorage.setItem(storageKey, JSON.stringify({
            currentStep: currentStep,
            completed: false
          }));
        } catch (e) {
          // Ignore localStorage errors.
        }
      }

      /**
       * Clear progress from localStorage.
       */
      function clearProgress() {
        try {
          localStorage.setItem(storageKey, JSON.stringify({
            currentStep: 0,
            completed: true
          }));
        } catch (e) {
          // Ignore localStorage errors.
        }
      }

      /**
       * Check if this is the first login.
       */
      function isFirstLogin() {
        const progress = getProgress();
        // First login if no progress saved at all.
        return progress === null;
      }

      /**
       * Create spotlight element.
       */
      function createSpotlight() {
        if (spotlight) {
          spotlight.remove();
        }
        spotlight = document.createElement('div');
        spotlight.className = 'ndx-walkthrough-spotlight';
        document.body.appendChild(spotlight);
        return spotlight;
      }

      /**
       * Scroll target element into view if needed.
       */
      function scrollTargetIntoView(target) {
        if (!target) {
          return Promise.resolve();
        }

        const rect = target.getBoundingClientRect();
        const isInView = rect.top >= 0 &&
                         rect.left >= 0 &&
                         rect.bottom <= window.innerHeight &&
                         rect.right <= window.innerWidth;

        if (!isInView) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
          // Allow time for smooth scroll to complete.
          return new Promise(function(resolve) {
            setTimeout(resolve, 300);
          });
        }

        return Promise.resolve();
      }

      /**
       * Position spotlight around target element.
       */
      function positionSpotlight(targetSelector) {
        if (!spotlight) {
          createSpotlight();
        }

        if (!targetSelector) {
          spotlight.style.display = 'none';
          return;
        }

        const target = document.querySelector(targetSelector);
        if (!target) {
          spotlight.style.display = 'none';
          return;
        }

        const rect = target.getBoundingClientRect();
        const padding = 8;

        spotlight.style.display = 'block';
        spotlight.style.top = (rect.top - padding) + 'px';
        spotlight.style.left = (rect.left - padding) + 'px';
        spotlight.style.width = (rect.width + padding * 2) + 'px';
        spotlight.style.height = (rect.height + padding * 2) + 'px';
      }

      /**
       * Position modal relative to target.
       */
      function positionModal(step) {
        modal.classList.remove('is-centered');

        if (!step.target) {
          // Center the modal for steps without a target.
          modal.classList.add('is-centered');
          return;
        }

        const target = document.querySelector(step.target);
        if (!target) {
          modal.classList.add('is-centered');
          return;
        }

        const targetRect = target.getBoundingClientRect();
        const modalRect = modal.getBoundingClientRect();
        const padding = 20;
        const spotlightPadding = 16;

        let top, left;

        // Position based on specified position or auto-detect.
        const position = step.position || 'bottom';

        switch (position) {
          case 'bottom':
            top = targetRect.bottom + spotlightPadding + padding;
            left = targetRect.left;
            break;
          case 'top':
            top = targetRect.top - modalRect.height - spotlightPadding - padding;
            left = targetRect.left;
            break;
          case 'left':
            top = targetRect.top;
            left = targetRect.left - modalRect.width - spotlightPadding - padding;
            break;
          case 'right':
            top = targetRect.top;
            left = targetRect.right + spotlightPadding + padding;
            break;
          default:
            top = targetRect.bottom + spotlightPadding + padding;
            left = targetRect.left;
        }

        // Keep modal within viewport.
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (left + modalRect.width > viewportWidth - padding) {
          left = viewportWidth - modalRect.width - padding;
        }
        if (left < padding) {
          left = padding;
        }
        if (top + modalRect.height > viewportHeight - padding) {
          top = viewportHeight - modalRect.height - padding;
        }
        if (top < padding) {
          top = padding;
        }

        modal.style.top = top + 'px';
        modal.style.left = left + 'px';
      }

      /**
       * Update modal content for current step.
       */
      function updateContent() {
        const step = steps[currentStep];
        if (!step) {
          return;
        }

        titleEl.textContent = step.title;
        contentEl.textContent = step.content;
        counterEl.textContent = Drupal.t('Step @current of @total', {
          '@current': currentStep + 1,
          '@total': steps.length
        });

        // Update button states.
        if (prevBtn) {
          if (currentStep === 0) {
            prevBtn.setAttribute('hidden', '');
          } else {
            prevBtn.removeAttribute('hidden');
          }
        }

        if (nextBtn) {
          if (currentStep === steps.length - 1) {
            nextBtn.textContent = Drupal.t('Finish');
          } else {
            nextBtn.textContent = Drupal.t('Next');
          }
        }

        // Scroll target into view, then position elements.
        var target = step.target ? document.querySelector(step.target) : null;
        scrollTargetIntoView(target).then(function() {
          positionSpotlight(step.target);
          positionModal(step);
        });
      }

      /**
       * Get all focusable elements within modal.
       */
      function getFocusableElements() {
        const focusable = modal.querySelectorAll(
          'button:not([hidden]):not([disabled]), ' +
          '[href], ' +
          'input:not([hidden]):not([disabled]), ' +
          'select:not([hidden]):not([disabled]), ' +
          'textarea:not([hidden]):not([disabled]), ' +
          '[tabindex]:not([tabindex="-1"]):not([hidden]):not([disabled])'
        );
        return Array.from(focusable);
      }

      /**
       * Trap focus within modal.
       */
      function trapFocus(event) {
        if (!isActive) {
          return;
        }

        const focusable = getFocusableElements();
        if (focusable.length === 0) {
          return;
        }

        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];

        if (event.shiftKey) {
          // Shift + Tab.
          if (document.activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable.focus();
          }
        } else {
          // Tab.
          if (document.activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable.focus();
          }
        }
      }

      /**
       * Handle keyboard events.
       */
      function handleKeydown(event) {
        if (!isActive) {
          return;
        }

        switch (event.key) {
          case 'Escape':
            event.preventDefault();
            closeTour();
            break;
          case 'Tab':
            trapFocus(event);
            break;
        }
      }

      /**
       * Start the walkthrough tour.
       */
      function startTour() {
        const progress = getProgress();

        // Resume from saved position if incomplete.
        if (progress && !progress.completed && progress.currentStep < steps.length) {
          currentStep = progress.currentStep;
        } else {
          currentStep = 0;
        }

        previouslyFocusedElement = document.activeElement;
        isActive = true;

        overlay.classList.add('is-active');
        overlay.setAttribute('aria-hidden', 'false');
        modal.classList.add('is-active');
        modal.setAttribute('aria-hidden', 'false');
        trigger.setAttribute('aria-expanded', 'true');

        createSpotlight();
        updateContent();
        saveProgress();

        // Focus the modal.
        modal.focus();

        // Add keyboard listener.
        document.addEventListener('keydown', handleKeydown);
      }

      /**
       * Close the walkthrough tour.
       */
      function closeTour() {
        isActive = false;

        overlay.classList.remove('is-active');
        overlay.setAttribute('aria-hidden', 'true');
        modal.classList.remove('is-active');
        modal.setAttribute('aria-hidden', 'true');
        trigger.setAttribute('aria-expanded', 'false');

        if (spotlight) {
          spotlight.remove();
          spotlight = null;
        }

        // Remove keyboard listener.
        document.removeEventListener('keydown', handleKeydown);

        // Return focus to trigger element.
        if (previouslyFocusedElement) {
          previouslyFocusedElement.focus();
        } else {
          trigger.focus();
        }
      }

      /**
       * Go to next step.
       */
      function nextStep() {
        if (currentStep < steps.length - 1) {
          currentStep++;
          updateContent();
          saveProgress();
        } else {
          // Tour complete.
          clearProgress();
          closeTour();
        }
      }

      /**
       * Go to previous step.
       */
      function prevStep() {
        if (currentStep > 0) {
          currentStep--;
          updateContent();
          saveProgress();
        }
      }

      /**
       * Skip the tour.
       */
      function skipTour() {
        clearProgress();
        closeTour();
      }

      // Event listeners.
      trigger.addEventListener('click', startTour);
      if (closeBtn) {
        closeBtn.addEventListener('click', closeTour);
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', nextStep);
      }
      if (prevBtn) {
        prevBtn.addEventListener('click', prevStep);
      }
      if (skipBtn) {
        skipBtn.addEventListener('click', skipTour);
      }

      // Listen for external triggers (e.g., welcome block button).
      var externalTriggers = document.querySelectorAll('[data-walkthrough-trigger="true"]');
      externalTriggers.forEach(function(el) {
        el.addEventListener('click', startTour);
      });

      // Reposition on window resize.
      window.addEventListener('resize', function () {
        if (isActive) {
          const step = steps[currentStep];
          positionSpotlight(step ? step.target : null);
          positionModal(step || {});
        }
      });

      // Auto-start on first login.
      if (isFirstLogin()) {
        // Small delay to ensure page is fully rendered.
        setTimeout(startTour, 500);
      }
    }
  };

})(Drupal, drupalSettings);
