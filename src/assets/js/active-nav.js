/**
 * Navigation Active State Controller (Story 14.7)
 *
 * Detects current page and applies active states to navigation:
 * - Desktop dropdown navigation (.ndx-nav)
 * - Mobile navigation (.ndx-mobile-nav)
 * - Breadcrumb highlighting
 *
 * Features:
 * - Path matching for nested routes
 * - Section-level highlighting (e.g., /walkthroughs/* highlights "Walkthroughs")
 * - Works with static site generation
 */

(function() {
  'use strict';

  // Configuration: map URL patterns to navigation sections
  const NAV_PATTERNS = [
    { pattern: /^\/scenarios\//, section: 'scenarios', label: 'Scenarios' },
    { pattern: /^\/walkthroughs\//, section: 'walkthroughs', label: 'Walkthroughs' },
    { pattern: /^\/quiz\/?$/, section: 'quiz', label: 'Find Your Scenario' },
    { pattern: /^\/get-started\/?$/, section: 'get-started', label: 'Get Started' },
    { pattern: /^\/contact\/?$/, section: 'contact', label: 'Contact' },
    { pattern: /^\/about\/?$/, section: 'about', label: 'About NDX:Try' },
    { pattern: /^\/$/, section: 'home', label: 'Home' }
  ];

  // CSS classes
  const ACTIVE_TRIGGER_CLASS = 'ndx-nav__trigger--active';
  const ACTIVE_LINK_CLASS = 'ndx-nav__link--active';
  const MOBILE_ACTIVE_CLASS = 'ndx-mobile-nav__link--active';

  /**
   * Initialize active state highlighting
   */
  function init() {
    const currentPath = window.location.pathname;
    const currentSection = detectSection(currentPath);

    if (!currentSection) return;

    highlightDesktopNav(currentSection, currentPath);
    highlightMobileNav(currentSection, currentPath);
  }

  /**
   * Detect which section the current path belongs to
   */
  function detectSection(path) {
    for (const navPattern of NAV_PATTERNS) {
      if (navPattern.pattern.test(path)) {
        return navPattern;
      }
    }
    return null;
  }

  /**
   * Highlight desktop navigation items
   */
  function highlightDesktopNav(section, currentPath) {
    const navItems = document.querySelectorAll('.ndx-nav__item');

    navItems.forEach(function(item) {
      const trigger = item.querySelector('.ndx-nav__trigger');
      const dropdown = item.querySelector('.ndx-nav__dropdown');

      if (!trigger) return;

      const triggerText = trigger.textContent.trim().toLowerCase();

      // Check if this is a dropdown with the current section
      if (section.section === 'scenarios' && triggerText === 'scenarios') {
        trigger.classList.add(ACTIVE_TRIGGER_CLASS);
        trigger.setAttribute('aria-current', 'true');
      } else if (section.section === 'walkthroughs' && triggerText === 'walkthroughs') {
        trigger.classList.add(ACTIVE_TRIGGER_CLASS);
        trigger.setAttribute('aria-current', 'true');
      }

      // Check for direct link matches (non-dropdown items)
      if (trigger.tagName === 'A') {
        const href = trigger.getAttribute('href');
        if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
          trigger.classList.add(ACTIVE_LINK_CLASS);
          trigger.setAttribute('aria-current', 'page');
        }
      }

      // Highlight specific items within dropdowns
      if (dropdown) {
        const links = dropdown.querySelectorAll('a');
        links.forEach(function(link) {
          const href = link.getAttribute('href');
          if (href === currentPath) {
            link.classList.add(ACTIVE_LINK_CLASS);
            link.setAttribute('aria-current', 'page');
          }
        });
      }
    });
  }

  /**
   * Highlight mobile navigation items
   */
  function highlightMobileNav(section, currentPath) {
    const mobileNav = document.querySelector('.ndx-mobile-nav');
    if (!mobileNav) return;

    // Highlight main links
    const mainLinks = mobileNav.querySelectorAll('.ndx-mobile-nav__link');
    mainLinks.forEach(function(link) {
      const href = link.getAttribute('href');
      if (href === currentPath) {
        link.classList.add(MOBILE_ACTIVE_CLASS);
        link.setAttribute('aria-current', 'page');
      }
    });

    // Highlight accordion triggers for active sections
    const accordionTriggers = mobileNav.querySelectorAll('.ndx-mobile-nav__accordion-trigger');
    accordionTriggers.forEach(function(trigger) {
      const triggerText = trigger.textContent.trim().toLowerCase();
      if ((section.section === 'scenarios' && triggerText.includes('scenarios')) ||
          (section.section === 'walkthroughs' && triggerText.includes('walkthroughs'))) {
        trigger.classList.add('ndx-mobile-nav__accordion-trigger--active');
        trigger.setAttribute('aria-current', 'true');
      }
    });

    // Highlight sublinks within accordions
    const sublinks = mobileNav.querySelectorAll('.ndx-mobile-nav__sublink');
    sublinks.forEach(function(link) {
      const href = link.getAttribute('href');
      if (href === currentPath) {
        link.classList.add('ndx-mobile-nav__sublink--active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
