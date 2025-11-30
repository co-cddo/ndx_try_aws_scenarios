/**
 * Mobile Navigation Controller (Story 14.5)
 *
 * Provides mobile hamburger menu functionality:
 * - Slide-in panel from right
 * - Accordion expand/collapse for dropdowns
 * - Focus trapping when open
 * - 44x44px touch targets
 * - Escape key to close
 */

(function() {
  'use strict';

  // Elements
  let mobileNav = null;
  let backdrop = null;
  let toggleBtn = null;
  let closeBtn = null;
  let focusableElements = [];
  let firstFocusable = null;
  let lastFocusable = null;
  let triggerElement = null;

  /**
   * Initialize mobile navigation
   */
  function init() {
    mobileNav = document.querySelector('.ndx-mobile-nav');
    backdrop = document.querySelector('.ndx-mobile-nav__backdrop');
    toggleBtn = document.querySelector('.ndx-mobile-nav-toggle');
    closeBtn = document.querySelector('.ndx-mobile-nav__close');

    if (!mobileNav || !toggleBtn) return;

    // Toggle button click
    toggleBtn.addEventListener('click', openNav);

    // Close button click
    if (closeBtn) {
      closeBtn.addEventListener('click', closeNav);
    }

    // Backdrop click
    if (backdrop) {
      backdrop.addEventListener('click', closeNav);
    }

    // Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen()) {
        closeNav();
      }
    });

    // Accordion triggers
    const accordionTriggers = mobileNav.querySelectorAll('.ndx-mobile-nav__accordion-trigger');
    accordionTriggers.forEach(function(trigger, index) {
      trigger.addEventListener('click', function() {
        toggleAccordion(trigger);
      });

      // Story 16.7: Arrow key navigation between accordion triggers
      trigger.addEventListener('keydown', function(e) {
        handleAccordionKeydown(e, accordionTriggers, index);
      });
    });

    // Setup focus trap elements
    updateFocusableElements();
  }

  /**
   * Handle arrow key navigation between accordion triggers (Story 16.7)
   */
  function handleAccordionKeydown(e, triggers, currentIndex) {
    let targetIndex = -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        targetIndex = (currentIndex + 1) % triggers.length;
        break;

      case 'ArrowUp':
        e.preventDefault();
        targetIndex = (currentIndex - 1 + triggers.length) % triggers.length;
        break;

      case 'Home':
        e.preventDefault();
        targetIndex = 0;
        break;

      case 'End':
        e.preventDefault();
        targetIndex = triggers.length - 1;
        break;
    }

    if (targetIndex >= 0) {
      triggers[targetIndex].focus();
    }
  }

  /**
   * Check if mobile nav is open
   */
  function isOpen() {
    return mobileNav && mobileNav.classList.contains('ndx-mobile-nav--open');
  }

  /**
   * Open mobile navigation
   */
  function openNav() {
    if (!mobileNav) return;

    triggerElement = document.activeElement;

    mobileNav.classList.add('ndx-mobile-nav--open');
    if (backdrop) {
      backdrop.classList.add('ndx-mobile-nav__backdrop--visible');
    }

    document.body.classList.add('ndx-mobile-nav-open');

    // Update focusable elements and trap focus
    updateFocusableElements();

    // Focus first focusable element (close button)
    if (closeBtn) {
      closeBtn.focus();
    } else if (firstFocusable) {
      firstFocusable.focus();
    }

    // Add focus trap listener
    mobileNav.addEventListener('keydown', trapFocus);
  }

  /**
   * Close mobile navigation
   */
  function closeNav() {
    if (!mobileNav) return;

    mobileNav.classList.remove('ndx-mobile-nav--open');
    if (backdrop) {
      backdrop.classList.remove('ndx-mobile-nav__backdrop--visible');
    }

    document.body.classList.remove('ndx-mobile-nav-open');

    // Remove focus trap listener
    mobileNav.removeEventListener('keydown', trapFocus);

    // Return focus to trigger element
    if (triggerElement) {
      triggerElement.focus();
    }
  }

  /**
   * Toggle accordion section
   */
  function toggleAccordion(trigger) {
    const content = trigger.nextElementSibling;
    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      // Close
      trigger.setAttribute('aria-expanded', 'false');
      if (content) {
        content.classList.remove('ndx-mobile-nav__accordion-content--open');
      }
    } else {
      // Open
      trigger.setAttribute('aria-expanded', 'true');
      if (content) {
        content.classList.add('ndx-mobile-nav__accordion-content--open');
      }
    }

    // Update focusable elements after accordion change
    updateFocusableElements();
  }

  /**
   * Update list of focusable elements for focus trapping
   */
  function updateFocusableElements() {
    if (!mobileNav) return;

    const selector = [
      'a[href]:not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'input:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    // Only include visible elements
    focusableElements = Array.from(mobileNav.querySelectorAll(selector)).filter(function(el) {
      return el.offsetParent !== null;
    });

    firstFocusable = focusableElements[0];
    lastFocusable = focusableElements[focusableElements.length - 1];
  }

  /**
   * Trap focus within mobile navigation
   */
  function trapFocus(e) {
    if (e.key !== 'Tab') return;

    // Update in case accordion state changed
    updateFocusableElements();

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
