/**
 * Navigation Dropdown Controller (Story 14.4)
 *
 * Provides dropdown menu functionality for the header navigation:
 * - Opens on hover (desktop) with 150ms delay
 * - Opens on click (touch devices)
 * - Full keyboard navigation support
 * - ARIA attributes for accessibility
 * - Focus trapping within dropdowns
 */

(function() {
  'use strict';

  // Configuration
  const HOVER_DELAY = 150; // milliseconds
  const ESCAPE_KEY = 'Escape';
  const ARROW_DOWN_KEY = 'ArrowDown';
  const ARROW_UP_KEY = 'ArrowUp';
  const HOME_KEY = 'Home';
  const END_KEY = 'End';

  // State
  let activeDropdown = null;
  let hoverTimeout = null;
  let closeTimeout = null;

  /**
   * Initialize dropdown navigation
   */
  function init() {
    const navItems = document.querySelectorAll('.ndx-nav__item');

    if (!navItems.length) return;

    navItems.forEach(function(item) {
      const trigger = item.querySelector('.ndx-nav__trigger');
      const dropdown = item.querySelector('.ndx-nav__dropdown');

      if (!trigger || !dropdown) return;

      // Desktop: hover behavior with delay
      item.addEventListener('mouseenter', function() {
        clearTimeout(closeTimeout);
        hoverTimeout = setTimeout(function() {
          openDropdown(trigger, dropdown);
        }, HOVER_DELAY);
      });

      item.addEventListener('mouseleave', function() {
        clearTimeout(hoverTimeout);
        closeTimeout = setTimeout(function() {
          closeDropdown(trigger, dropdown);
        }, HOVER_DELAY);
      });

      // Click behavior (touch devices + keyboard)
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';

        if (isOpen) {
          closeDropdown(trigger, dropdown);
        } else {
          closeAllDropdowns();
          openDropdown(trigger, dropdown);
        }
      });

      // Keyboard navigation
      trigger.addEventListener('keydown', function(e) {
        handleTriggerKeydown(e, trigger, dropdown);
      });

      dropdown.addEventListener('keydown', function(e) {
        handleDropdownKeydown(e, trigger, dropdown);
      });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.ndx-nav__item')) {
        closeAllDropdowns();
      }
    });

    // Close dropdowns on Escape key (global)
    document.addEventListener('keydown', function(e) {
      if (e.key === ESCAPE_KEY && activeDropdown) {
        closeAllDropdowns();
        if (activeDropdown.trigger) {
          activeDropdown.trigger.focus();
        }
      }
    });
  }

  /**
   * Open a dropdown
   */
  function openDropdown(trigger, dropdown) {
    trigger.setAttribute('aria-expanded', 'true');
    dropdown.classList.add('ndx-nav__dropdown--open');
    activeDropdown = { trigger: trigger, dropdown: dropdown };

    // Announce to screen readers
    dropdown.setAttribute('aria-hidden', 'false');
  }

  /**
   * Close a dropdown
   */
  function closeDropdown(trigger, dropdown) {
    trigger.setAttribute('aria-expanded', 'false');
    dropdown.classList.remove('ndx-nav__dropdown--open');
    dropdown.setAttribute('aria-hidden', 'true');

    if (activeDropdown && activeDropdown.dropdown === dropdown) {
      activeDropdown = null;
    }
  }

  /**
   * Close all dropdowns
   */
  function closeAllDropdowns() {
    const triggers = document.querySelectorAll('.ndx-nav__trigger');
    triggers.forEach(function(trigger) {
      const dropdown = trigger.parentElement.querySelector('.ndx-nav__dropdown');
      if (dropdown) {
        closeDropdown(trigger, dropdown);
      }
    });
  }

  /**
   * Handle keydown on trigger button
   */
  function handleTriggerKeydown(e, trigger, dropdown) {
    switch (e.key) {
      case ARROW_DOWN_KEY:
        e.preventDefault();
        openDropdown(trigger, dropdown);
        focusFirstLink(dropdown);
        break;

      case ESCAPE_KEY:
        closeDropdown(trigger, dropdown);
        break;
    }
  }

  /**
   * Handle keydown within dropdown
   * Story 16.7: Full keyboard navigation with Home/End support
   */
  function handleDropdownKeydown(e, trigger, dropdown) {
    const links = dropdown.querySelectorAll('a');
    const currentIndex = Array.from(links).indexOf(document.activeElement);

    switch (e.key) {
      case ARROW_DOWN_KEY:
        e.preventDefault();
        if (currentIndex < links.length - 1) {
          links[currentIndex + 1].focus();
        } else {
          links[0].focus(); // Wrap to first
        }
        break;

      case ARROW_UP_KEY:
        e.preventDefault();
        if (currentIndex > 0) {
          links[currentIndex - 1].focus();
        } else {
          links[links.length - 1].focus(); // Wrap to last
        }
        break;

      case HOME_KEY:
        // Story 16.7: Jump to first item
        e.preventDefault();
        links[0].focus();
        break;

      case END_KEY:
        // Story 16.7: Jump to last item
        e.preventDefault();
        links[links.length - 1].focus();
        break;

      case ESCAPE_KEY:
        closeDropdown(trigger, dropdown);
        trigger.focus();
        break;
    }
  }

  /**
   * Focus first link in dropdown
   */
  function focusFirstLink(dropdown) {
    const firstLink = dropdown.querySelector('a');
    if (firstLink) {
      firstLink.focus();
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
