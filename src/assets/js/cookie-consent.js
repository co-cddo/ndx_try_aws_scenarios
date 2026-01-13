/**
 * NDX:Try Cookie Consent Manager
 * GOV.UK Design System compliant
 */
(function() {
  'use strict';

  var COOKIE_NAME = 'ndx_cookies_policy';
  var COOKIE_VERSION = 1;
  var COOKIE_DAYS = 365;
  var GA_MEASUREMENT_ID = 'G-S4542PPYLS';

  var CookieConsent = {
    /**
     * Get current consent preferences
     */
    getPreferences: function() {
      var cookie = this.getCookie(COOKIE_NAME);
      if (!cookie) return null;
      try {
        var prefs = JSON.parse(cookie);
        if (prefs.version !== COOKIE_VERSION) return null;
        return prefs;
      } catch (e) {
        return null;
      }
    },

    /**
     * Save consent preferences
     */
    savePreferences: function(analytics) {
      var prefs = {
        analytics: analytics,
        version: COOKIE_VERSION,
        timestamp: new Date().toISOString()
      };
      this.setCookie(COOKIE_NAME, JSON.stringify(prefs), COOKIE_DAYS);
      this.updateGtagConsent(analytics);

      // F6: Delete GA cookies if rejecting
      if (!analytics) {
        this.deleteGACookies();
      }

      this.hideBanner();
      this.showConfirmation(analytics);
    },

    /**
     * Update gtag consent state (F4: with retry, F8: all params)
     */
    updateGtagConsent: function(granted) {
      var self = this;
      var consentState = granted ? 'granted' : 'denied';

      // F4: Retry mechanism for gtag availability
      var attemptUpdate = function(attempts) {
        if (typeof gtag === 'function') {
          // F8: Update all consent parameters
          gtag('consent', 'update', {
            'analytics_storage': consentState,
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied'
          });

          // F1: Send page_view after consent granted
          if (granted) {
            gtag('event', 'page_view');
          }
        } else if (attempts < 10) {
          // Retry after 100ms, up to 10 attempts (1 second total)
          setTimeout(function() {
            attemptUpdate(attempts + 1);
          }, 100);
        } else {
          console.warn('[NDX Cookie Consent] gtag not available after retries');
        }
      };

      attemptUpdate(0);
    },

    /**
     * F6: Delete Google Analytics cookies when consent rejected
     */
    deleteGACookies: function() {
      var cookies = ['_ga', '_ga_' + GA_MEASUREMENT_ID.replace('G-', '')];
      var domains = [window.location.hostname, '.' + window.location.hostname];

      cookies.forEach(function(name) {
        domains.forEach(function(domain) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + domain;
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        });
      });
    },

    /**
     * Check if banner should show
     */
    shouldShowBanner: function() {
      // Don't show if preference already set
      if (this.getPreferences() !== null) return false;
      // Don't show if on cookies page
      if (window.location.pathname === '/cookies/') return false;
      // Don't show if dismissed this session
      if (sessionStorage.getItem('ndx_cookie_banner_dismissed')) return false;
      return true;
    },

    /**
     * Initialize on page load
     */
    init: function() {
      var self = this;
      var banner = document.querySelector('[data-module="govuk-cookie-banner"]');
      if (!banner) return;

      // Check existing preferences and update gtag
      var prefs = this.getPreferences();
      if (prefs) {
        this.updateGtagConsent(prefs.analytics);
        banner.hidden = true;
        return;
      }

      // F2: No cookie exists - ensure gtag consent is reset to denied
      // This handles cookie deletion scenario where gtag state may be stale
      this.updateGtagConsent(false);

      // Show banner if needed
      if (this.shouldShowBanner()) {
        banner.hidden = false;
        this.showQuestion();
      } else {
        banner.hidden = true;
      }

      // Bind event handlers
      banner.addEventListener('click', function(e) {
        var target = e.target;
        if (target.matches('[data-accept-cookies]')) {
          e.preventDefault();
          self.savePreferences(true);
        } else if (target.matches('[data-reject-cookies]')) {
          e.preventDefault();
          self.savePreferences(false);
        } else if (target.matches('[data-hide-banner]')) {
          e.preventDefault();
          self.hideBanner();
        }
      });
    },

    /**
     * Show the question message
     */
    showQuestion: function() {
      var question = document.querySelector('[data-cookie-banner="question"]');
      var accepted = document.querySelector('[data-cookie-banner="accepted"]');
      var rejected = document.querySelector('[data-cookie-banner="rejected"]');
      if (question) question.hidden = false;
      if (accepted) accepted.hidden = true;
      if (rejected) rejected.hidden = true;
    },

    /**
     * Show confirmation message
     */
    showConfirmation: function(accepted) {
      var question = document.querySelector('[data-cookie-banner="question"]');
      var acceptedMsg = document.querySelector('[data-cookie-banner="accepted"]');
      var rejectedMsg = document.querySelector('[data-cookie-banner="rejected"]');
      if (question) question.hidden = true;
      if (accepted) {
        if (acceptedMsg) acceptedMsg.hidden = false;
        if (rejectedMsg) rejectedMsg.hidden = true;
      } else {
        if (acceptedMsg) acceptedMsg.hidden = true;
        if (rejectedMsg) rejectedMsg.hidden = false;
      }
    },

    /**
     * Hide the entire banner
     */
    hideBanner: function() {
      var banner = document.querySelector('[data-module="govuk-cookie-banner"]');
      if (banner) banner.hidden = true;
      sessionStorage.setItem('ndx_cookie_banner_dismissed', 'true');
    },

    /**
     * Cookie utilities
     */
    getCookie: function(name) {
      var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    },

    /**
     * F3: Set cookie with localhost/HTTP fallback for Secure flag
     */
    setCookie: function(name, value, days) {
      var expires = '';
      if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
      }

      // F3: Only add Secure flag on HTTPS (fails silently on HTTP/localhost)
      var isSecure = window.location.protocol === 'https:';
      var secureFlag = isSecure ? '; Secure' : '';

      document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax' + secureFlag;
    }
  };

  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      CookieConsent.init();
    });
  } else {
    CookieConsent.init();
  }

  // Expose for manual control
  window.NDXCookieConsent = CookieConsent;
})();
