/**
 * @file
 * NDX Walkthrough JavaScript.
 *
 * Implements the guided tour overlay with:
 * - Spotlight highlighting of target elements
 * - Modal positioning relative to targets
 * - Focus trap within modal
 * - Keyboard navigation (Tab, Escape)
 * - Section navigation menu for 7 AI features
 * - Progress tracking per-feature via localStorage
 * - Learn More links to mini-guides
 * - Evidence Pack unlock on completion
 * - Auto-trigger on first login
 *
 * Story 2.5: Walkthrough Overlay in Drupal
 * Story 6.1: Integrated Walkthrough Overlay
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

      var settings = drupalSettings.ndxWalkthrough || {};
      var steps = settings.steps || [];
      var features = settings.features || {};
      var storageKey = settings.storageKey || 'ndx_walkthrough_progress';
      var evidencePackUrl = settings.evidencePackUrl || '/admin/ndx/evidence-pack';

      if (steps.length === 0) {
        return;
      }

      // DOM elements.
      var overlay = document.getElementById('ndx-walkthrough-overlay');
      var modal = document.getElementById('ndx-walkthrough-modal');
      var trigger = document.getElementById('ndx-walkthrough-trigger');
      var closeBtn = modal ? modal.querySelector('.ndx-walkthrough-close') : null;
      var prevBtn = document.getElementById('ndx-walkthrough-prev');
      var nextBtn = document.getElementById('ndx-walkthrough-next');
      var skipBtn = document.getElementById('ndx-walkthrough-skip');
      var titleEl = document.getElementById('ndx-walkthrough-title');
      var contentEl = document.getElementById('ndx-walkthrough-content');
      var counterEl = document.getElementById('ndx-walkthrough-counter');
      var featureLabelEl = document.getElementById('ndx-walkthrough-feature-label');
      var learnMoreEl = document.getElementById('ndx-walkthrough-learn-more');
      var evidencePackEl = document.getElementById('ndx-walkthrough-evidence-pack');
      var progressBar = modal ? modal.querySelector('.ndx-walkthrough-progress__bar') : null;
      var progressText = modal ? modal.querySelector('.ndx-walkthrough-progress__text') : null;
      var progressContainer = modal ? modal.querySelector('.ndx-walkthrough-progress') : null;
      var sectionsToggle = document.getElementById('ndx-walkthrough-sections-toggle');
      var sectionsMenu = document.getElementById('ndx-walkthrough-sections-menu');
      var sectionsList = sectionsMenu ? sectionsMenu.querySelector('.ndx-walkthrough-sections-list') : null;

      if (!overlay || !modal || !trigger) {
        return;
      }

      // State.
      var currentStep = 0;
      var isActive = false;
      var spotlight = null;
      var previouslyFocusedElement = null;
      var sectionsMenuOpen = false;

      /**
       * Get the default progress structure.
       */
      function getDefaultProgress() {
        var featureProgress = {};
        Object.keys(features).forEach(function(key) {
          featureProgress[key] = { completed: false, viewedAt: null };
        });
        // Add 'complete' feature for the final step
        featureProgress['complete'] = { completed: false, viewedAt: null };

        return {
          currentStep: 0,
          completed: false,
          startedAt: null,
          features: featureProgress,
          evidencePackUnlocked: false,
          completedAt: null
        };
      }

      /**
       * Get saved progress from localStorage.
       */
      function getProgress() {
        try {
          var saved = localStorage.getItem(storageKey);
          if (saved) {
            var parsed = JSON.parse(saved);
            // Migrate old format to new format if needed
            if (!parsed.features) {
              var defaultProgress = getDefaultProgress();
              parsed.features = defaultProgress.features;
              parsed.evidencePackUnlocked = false;
              parsed.completedAt = null;
            }
            return parsed;
          }
        } catch (e) {
          // Ignore localStorage errors.
        }
        return null;
      }

      /**
       * Save progress to localStorage.
       */
      function saveProgress(progress) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(progress));
        } catch (e) {
          // Ignore localStorage errors.
        }
      }

      /**
       * Mark a feature as viewed.
       */
      function markFeatureViewed(featureKey) {
        var progress = getProgress() || getDefaultProgress();
        if (progress.features[featureKey] && !progress.features[featureKey].viewedAt) {
          progress.features[featureKey].viewedAt = new Date().toISOString();
          saveProgress(progress);
        }
      }

      /**
       * Mark a feature as completed.
       */
      function markFeatureComplete(featureKey) {
        var progress = getProgress() || getDefaultProgress();
        if (progress.features[featureKey]) {
          progress.features[featureKey].completed = true;
          progress.features[featureKey].viewedAt = progress.features[featureKey].viewedAt || new Date().toISOString();
          saveProgress(progress);
        }
      }

      /**
       * Get feature progress data.
       */
      function getFeatureProgress() {
        var progress = getProgress() || getDefaultProgress();
        return progress.features;
      }

      /**
       * Calculate overall completion percentage.
       */
      function getOverallCompletion() {
        var progress = getProgress() || getDefaultProgress();
        var featureKeys = Object.keys(features);
        if (featureKeys.length === 0) return 0;

        var completedCount = featureKeys.filter(function(key) {
          return progress.features[key] && progress.features[key].completed;
        }).length;

        return Math.round((completedCount / featureKeys.length) * 100);
      }

      /**
       * Check if all features are complete.
       */
      function allFeaturesComplete() {
        var progress = getProgress() || getDefaultProgress();
        return Object.keys(features).every(function(key) {
          return progress.features[key] && progress.features[key].completed;
        });
      }

      /**
       * Unlock evidence pack.
       */
      function unlockEvidencePack() {
        var progress = getProgress() || getDefaultProgress();
        progress.evidencePackUnlocked = true;
        progress.completedAt = new Date().toISOString();
        saveProgress(progress);
      }

      /**
       * Check if evidence pack is unlocked.
       */
      function isEvidencePackUnlocked() {
        var progress = getProgress();
        return progress && progress.evidencePackUnlocked;
      }

      /**
       * Clear all progress from localStorage.
       */
      function clearProgress() {
        var progress = getProgress() || getDefaultProgress();
        progress.currentStep = 0;
        progress.completed = true;
        saveProgress(progress);
      }

      /**
       * Check if this is the first login.
       */
      function isFirstLogin() {
        var progress = getProgress();
        // First login if no progress saved at all.
        return progress === null;
      }

      /**
       * Get the first step index for a feature.
       */
      function getFirstStepForFeature(featureKey) {
        for (var i = 0; i < steps.length; i++) {
          if (steps[i].feature === featureKey) {
            return i;
          }
        }
        return 0;
      }

      /**
       * Check if we're on the last step of a feature.
       */
      function isLastStepOfFeature(stepIndex) {
        var step = steps[stepIndex];
        if (!step) return false;

        var nextStep = steps[stepIndex + 1];
        return !nextStep || nextStep.feature !== step.feature;
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

        var rect = target.getBoundingClientRect();
        var isInView = rect.top >= 0 &&
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

        var target = document.querySelector(targetSelector);
        if (!target) {
          spotlight.style.display = 'none';
          return;
        }

        var rect = target.getBoundingClientRect();
        var padding = 8;

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

        var target = document.querySelector(step.target);
        if (!target) {
          modal.classList.add('is-centered');
          return;
        }

        var targetRect = target.getBoundingClientRect();
        var modalRect = modal.getBoundingClientRect();
        var padding = 20;
        var spotlightPadding = 16;

        var top, left;

        // Position based on specified position or auto-detect.
        var position = step.position || 'bottom';

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
        var viewportWidth = window.innerWidth;
        var viewportHeight = window.innerHeight;

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
       * Update the progress bar display.
       */
      function updateProgressBar() {
        var completion = getOverallCompletion();
        if (progressBar) {
          progressBar.style.width = completion + '%';
        }
        if (progressText) {
          progressText.textContent = completion + '% complete';
        }
        if (progressContainer) {
          progressContainer.setAttribute('aria-valuenow', completion);
        }
      }

      /**
       * Build and populate the section navigation menu.
       */
      function buildSectionsMenu() {
        if (!sectionsList) return;

        var featureProgress = getFeatureProgress();
        var html = '';

        Object.keys(features).forEach(function(key) {
          var feature = features[key];
          var isComplete = featureProgress[key] && featureProgress[key].completed;
          var currentFeature = steps[currentStep] ? steps[currentStep].feature : null;
          var isActive = key === currentFeature;

          var btnClasses = ['ndx-walkthrough-sections-btn'];
          if (isActive) btnClasses.push('ndx-walkthrough-sections-btn--active');
          if (isComplete) btnClasses.push('ndx-walkthrough-sections-btn--completed');

          html += '<li class="ndx-walkthrough-sections-item">';
          html += '<button type="button" class="' + btnClasses.join(' ') + '" data-feature="' + key + '" role="menuitem">';
          html += '<span class="ndx-walkthrough-sections-icon" aria-hidden="true">' + feature.icon + '</span>';
          html += '<span class="ndx-walkthrough-sections-label">' + feature.label + '</span>';
          if (isComplete) {
            html += '<span class="ndx-walkthrough-sections-status ndx-walkthrough-sections-status--complete" aria-label="Completed"></span>';
          }
          html += '</button>';
          html += '</li>';
        });

        sectionsList.innerHTML = html;

        // Add click handlers to section buttons
        sectionsList.querySelectorAll('.ndx-walkthrough-sections-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var featureKey = btn.getAttribute('data-feature');
            jumpToFeature(featureKey);
            closeSectionsMenu();
          });
        });
      }

      /**
       * Jump to the first step of a feature.
       * If feature is completed, offer replay option.
       */
      function jumpToFeature(featureKey) {
        var featureProgress = getFeatureProgress();
        var isCompleted = featureProgress[featureKey] && featureProgress[featureKey].completed;

        var stepIndex = getFirstStepForFeature(featureKey);
        currentStep = stepIndex;
        updateContent();

        var progress = getProgress() || getDefaultProgress();
        progress.currentStep = currentStep;
        saveProgress(progress);

        // Show replay notification for completed features
        if (isCompleted && featureKey !== 'complete') {
          showReplayNotification(featureKey);
        }
      }

      /**
       * Show notification that user is replaying a completed section.
       */
      function showReplayNotification(featureKey) {
        var feature = features[featureKey];
        if (!feature) return;

        // Add temporary replay badge to title
        var badge = document.createElement('span');
        badge.className = 'ndx-walkthrough-replay-badge';
        badge.textContent = 'Replaying';
        badge.setAttribute('aria-label', 'Replaying completed section');

        if (titleEl && !titleEl.querySelector('.ndx-walkthrough-replay-badge')) {
          titleEl.appendChild(badge);
          // Remove badge after 3 seconds
          setTimeout(function() {
            if (badge.parentNode) {
              badge.parentNode.removeChild(badge);
            }
          }, 3000);
        }
      }

      /**
       * Skip to next incomplete feature.
       */
      function skipToNextIncomplete() {
        var featureProgress = getFeatureProgress();
        var featureKeys = Object.keys(features);

        for (var i = 0; i < featureKeys.length; i++) {
          var key = featureKeys[i];
          if (!featureProgress[key] || !featureProgress[key].completed) {
            jumpToFeature(key);
            return;
          }
        }
        // All complete - go to final step
        currentStep = steps.length - 1;
        updateContent();
      }

      /**
       * Toggle sections menu open/closed.
       */
      function toggleSectionsMenu() {
        sectionsMenuOpen = !sectionsMenuOpen;
        if (sectionsMenuOpen) {
          openSectionsMenu();
        } else {
          closeSectionsMenu();
        }
      }

      /**
       * Open sections menu.
       */
      function openSectionsMenu() {
        if (!sectionsMenu || !sectionsToggle) return;

        buildSectionsMenu();
        sectionsMenu.removeAttribute('hidden');
        sectionsToggle.setAttribute('aria-expanded', 'true');
        sectionsMenuOpen = true;

        // Focus first button in menu
        var firstBtn = sectionsMenu.querySelector('.ndx-walkthrough-sections-btn');
        if (firstBtn) {
          firstBtn.focus();
        }
      }

      /**
       * Close sections menu.
       */
      function closeSectionsMenu() {
        if (!sectionsMenu || !sectionsToggle) return;

        sectionsMenu.setAttribute('hidden', '');
        sectionsToggle.setAttribute('aria-expanded', 'false');
        sectionsMenuOpen = false;
      }

      /**
       * Update modal content for current step.
       */
      function updateContent() {
        var step = steps[currentStep];
        if (!step) {
          return;
        }

        // Update title and content
        titleEl.textContent = step.title;
        contentEl.textContent = step.content;
        counterEl.textContent = Drupal.t('Step @current of @total', {
          '@current': currentStep + 1,
          '@total': steps.length
        });

        // Update feature label
        if (featureLabelEl) {
          featureLabelEl.textContent = step.featureLabel || 'Tour';
        }

        // Mark feature as viewed
        if (step.feature) {
          markFeatureViewed(step.feature);
        }

        // Update Learn More link
        if (learnMoreEl) {
          if (step.learnMoreUrl) {
            learnMoreEl.href = step.learnMoreUrl;
            learnMoreEl.removeAttribute('hidden');
          } else {
            learnMoreEl.setAttribute('hidden', '');
          }
        }

        // Update Evidence Pack button
        if (evidencePackEl) {
          if (step.showEvidencePack && (allFeaturesComplete() || isEvidencePackUnlocked())) {
            evidencePackEl.href = evidencePackUrl;
            evidencePackEl.removeAttribute('hidden');
            if (!isEvidencePackUnlocked()) {
              unlockEvidencePack();
            }
          } else {
            evidencePackEl.setAttribute('hidden', '');
          }
        }

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

        // Update progress bar
        updateProgressBar();

        // Close sections menu if open
        closeSectionsMenu();

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
        var focusable = modal.querySelectorAll(
          'button:not([hidden]):not([disabled]), ' +
          'a[href]:not([hidden]):not([disabled]), ' +
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

        var focusable = getFocusableElements();
        if (focusable.length === 0) {
          return;
        }

        var firstFocusable = focusable[0];
        var lastFocusable = focusable[focusable.length - 1];

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
            if (sectionsMenuOpen) {
              closeSectionsMenu();
              sectionsToggle.focus();
            } else {
              closeTour();
            }
            break;
          case 'Tab':
            trapFocus(event);
            break;
          case 'ArrowDown':
          case 'ArrowUp':
            if (sectionsMenuOpen) {
              event.preventDefault();
              handleMenuArrowNavigation(event.key);
            }
            break;
        }
      }

      /**
       * Handle arrow key navigation in sections menu.
       */
      function handleMenuArrowNavigation(key) {
        var buttons = sectionsList ? sectionsList.querySelectorAll('.ndx-walkthrough-sections-btn') : [];
        if (buttons.length === 0) return;

        var currentIndex = -1;
        buttons.forEach(function(btn, index) {
          if (document.activeElement === btn) {
            currentIndex = index;
          }
        });

        var nextIndex;
        if (key === 'ArrowDown') {
          nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
        }

        buttons[nextIndex].focus();
      }

      /**
       * Start the walkthrough tour.
       */
      function startTour() {
        var progress = getProgress();

        // Resume from saved position if incomplete.
        if (progress && !progress.completed && progress.currentStep < steps.length) {
          currentStep = progress.currentStep;
        } else {
          currentStep = 0;
          // Initialize progress if new
          if (!progress) {
            progress = getDefaultProgress();
            progress.startedAt = new Date().toISOString();
            saveProgress(progress);
          }
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

        // Save current step
        progress = getProgress() || getDefaultProgress();
        progress.currentStep = currentStep;
        saveProgress(progress);

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

        closeSectionsMenu();

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
        var step = steps[currentStep];

        // Mark feature complete if this is the last step of the feature
        if (step && step.feature && isLastStepOfFeature(currentStep)) {
          markFeatureComplete(step.feature);
        }

        if (currentStep < steps.length - 1) {
          currentStep++;
          updateContent();

          // Save progress
          var progress = getProgress() || getDefaultProgress();
          progress.currentStep = currentStep;
          saveProgress(progress);
        } else {
          // Tour complete - mark final step complete
          if (step && step.feature) {
            markFeatureComplete(step.feature);
          }
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

          // Save progress
          var progress = getProgress() || getDefaultProgress();
          progress.currentStep = currentStep;
          saveProgress(progress);
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
      if (sectionsToggle) {
        sectionsToggle.addEventListener('click', toggleSectionsMenu);
      }

      // Close sections menu when clicking outside
      document.addEventListener('click', function(event) {
        if (sectionsMenuOpen && !sectionsMenu.contains(event.target) && !sectionsToggle.contains(event.target)) {
          closeSectionsMenu();
        }
      });

      // Listen for external triggers (e.g., welcome block button).
      var externalTriggers = document.querySelectorAll('[data-walkthrough-trigger="true"]');
      externalTriggers.forEach(function(el) {
        el.addEventListener('click', startTour);
      });

      // Reposition on window resize.
      window.addEventListener('resize', function () {
        if (isActive) {
          var step = steps[currentStep];
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
