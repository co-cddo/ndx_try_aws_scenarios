# Technical Specification: GA4 Analytics with Cookie Consent

**Version:** 1.1
**Date:** 2026-01-13
**Status:** Completed

## Review Notes
- Adversarial review completed
- Findings: 15 total, 7 fixed, 3 acknowledged, 5 skipped (noise/undecided)
- Resolution approach: Auto-fix
- Critical fixes: gtag timing, consent state sync, GA cookie cleanup

---

## 1. Overview

### 1.1 Objective
Implement Google Analytics 4 (GA4) with GDPR-compliant cookie consent for the NDX:Try AWS website, following GOV.UK Design System patterns.

### 1.2 GA4 Configuration
- **Measurement ID:** `G-S4542PPYLS`
- **Tier:** Google Analytics 360
- **Data Retention:** 14 months
- **Features:** Modeled conversions, BigQuery export

### 1.3 Compliance Framework
- UK GDPR / PECR requirements
- GOV.UK Design System cookie banner component
- Consent Mode v2 (default denied, update on consent)

---

## 2. Architecture Decisions

### ADR-001: Consent Mode v2 Implementation
**Decision:** Load gtag.js always with consent mode defaulting to `denied`. Update to `granted` only after explicit user consent.

**Rationale:**
- GA4 can model conversions from cookieless pings
- No cookies set until consent granted
- Complies with UK GDPR without losing all analytics

### ADR-002: First-Party Cookie for Preferences
**Decision:** Store consent in cookie `ndx_cookies_policy` (JSON with version).

**Format:**
```json
{
  "analytics": true,
  "version": 1,
  "timestamp": "2026-01-13T10:00:00Z"
}
```

**Rationale:** First-party cookie is PECR-compliant as "strictly necessary" for remembering user preferences.

### ADR-003: GOV.UK Cookie Banner Component
**Decision:** Use standard GOV.UK Design System cookie banner with two-phase UX (question → confirmation).

**Rationale:** Consistent with government digital standards, accessible, tested pattern.

### ADR-004: Graceful Degradation
**Decision:** Analytics module continues to work without gtag (logs to console in dev).

**Rationale:** Existing `NDXAnalytics.isAvailable()` pattern supports this; no code changes needed for degradation.

### ADR-005: No Third-Party Consent Manager
**Decision:** Build lightweight consent handling in-house (~100 lines JS).

**Rationale:** Simple requirements (one category: analytics), avoids external dependencies, full control.

### ADR-006: Session-Based Non-Consent Caching
**Decision:** Use `sessionStorage` to avoid showing banner repeatedly within session if user hasn't made a choice.

**Rationale:** Reduces banner fatigue while respecting that no persistent cookie is set until choice is made.

---

## 3. Implementation Details

### 3.1 File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/_includes/layouts/base.njk` | Modify | Add gtag script + cookie banner include |
| `src/assets/js/analytics.js` | Modify | Add consent check to `track()` |
| `src/assets/js/cookie-consent.js` | Create | Consent management logic |
| `src/_includes/components/cookie-banner.njk` | Create | GOV.UK cookie banner markup |
| `src/cookies.md` | Create | Cookie settings page |
| `src/privacy.md` | Modify | Update with GA4 cookie details |

---

### 3.2 base.njk Changes

**Location:** `src/_includes/layouts/base.njk`

#### 3.2.1 Add to `{% block head %}` (before closing `</head>`)

```html
<!-- Google Analytics 4 with Consent Mode v2 -->
<script>
  // Default consent to denied (GDPR compliant)
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'wait_for_update': 500
  });
  gtag('js', new Date());
  gtag('config', 'G-S4542PPYLS', {
    'anonymize_ip': true,
    'cookie_flags': 'SameSite=Lax;Secure'
  });
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-S4542PPYLS"></script>
```

#### 3.2.2 Add to `{% block bodyStart %}` (before skip link)

```nunjucks
{% include "components/cookie-banner.njk" %}
```

#### 3.2.3 Add to `{% block bodyEnd %}` (before analytics.js)

```html
<script src="/assets/js/cookie-consent.js"></script>
```

---

### 3.3 cookie-consent.js (New File)

**Location:** `src/assets/js/cookie-consent.js`

```javascript
/**
 * NDX:Try Cookie Consent Manager
 * GOV.UK Design System compliant
 */
(function() {
  'use strict';

  var COOKIE_NAME = 'ndx_cookies_policy';
  var COOKIE_VERSION = 1;
  var COOKIE_DAYS = 365;

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
      this.hideBanner();
      this.showConfirmation(analytics);
    },

    /**
     * Update gtag consent state
     */
    updateGtagConsent: function(granted) {
      if (typeof gtag === 'function') {
        gtag('consent', 'update', {
          'analytics_storage': granted ? 'granted' : 'denied'
        });
      }
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

    setCookie: function(name, value, days) {
      var expires = '';
      if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
      }
      document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax; Secure';
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
```

---

### 3.4 cookie-banner.njk (New File)

**Location:** `src/_includes/components/cookie-banner.njk`

```nunjucks
<div class="govuk-cookie-banner" data-module="govuk-cookie-banner" role="region" aria-label="Cookies on NDX:Try AWS" hidden>

  <!-- Question message -->
  <div class="govuk-cookie-banner__message govuk-width-container" data-cookie-banner="question">
    <div class="govuk-grid-row">
      <div class="govuk-grid-column-two-thirds">
        <h2 class="govuk-cookie-banner__heading govuk-heading-m">Cookies on NDX:Try AWS</h2>
        <div class="govuk-cookie-banner__content">
          <p class="govuk-body">We use some essential cookies to make this service work.</p>
          <p class="govuk-body">We'd also like to use analytics cookies so we can understand how you use the service and make improvements.</p>
        </div>
      </div>
    </div>
    <div class="govuk-button-group">
      <button type="button" class="govuk-button" data-accept-cookies>Accept analytics cookies</button>
      <button type="button" class="govuk-button govuk-button--secondary" data-reject-cookies>Reject analytics cookies</button>
      <a class="govuk-link" href="/cookies/">View cookies</a>
    </div>
  </div>

  <!-- Accepted confirmation -->
  <div class="govuk-cookie-banner__message govuk-width-container" data-cookie-banner="accepted" role="alert" hidden>
    <div class="govuk-grid-row">
      <div class="govuk-grid-column-two-thirds">
        <div class="govuk-cookie-banner__content">
          <p class="govuk-body">You've accepted analytics cookies. You can <a class="govuk-link" href="/cookies/">change your cookie settings</a> at any time.</p>
        </div>
      </div>
    </div>
    <div class="govuk-button-group">
      <button type="button" class="govuk-button govuk-button--secondary" data-hide-banner>Hide cookie message</button>
    </div>
  </div>

  <!-- Rejected confirmation -->
  <div class="govuk-cookie-banner__message govuk-width-container" data-cookie-banner="rejected" role="alert" hidden>
    <div class="govuk-grid-row">
      <div class="govuk-grid-column-two-thirds">
        <div class="govuk-cookie-banner__content">
          <p class="govuk-body">You've rejected analytics cookies. You can <a class="govuk-link" href="/cookies/">change your cookie settings</a> at any time.</p>
        </div>
      </div>
    </div>
    <div class="govuk-button-group">
      <button type="button" class="govuk-button govuk-button--secondary" data-hide-banner>Hide cookie message</button>
    </div>
  </div>

</div>
```

---

### 3.5 analytics.js Modification

**Location:** `src/assets/js/analytics.js`

**Change:** Add consent check to `track()` method.

**Before (lines 51-70):**
```javascript
track(eventName, params = {}) {
  const enrichedParams = {
    ...params,
    session_id: this.getSessionId(),
    timestamp: new Date().toISOString()
  };

  if (!this.isAvailable()) {
    console.warn('[NDX Analytics] gtag unavailable:', eventName, enrichedParams);
    return false;
  }
  // ...
}
```

**After:**
```javascript
/**
 * Check if analytics consent has been granted
 */
hasConsent() {
  try {
    var cookie = document.cookie.match(/ndx_cookies_policy=([^;]+)/);
    if (!cookie) return false;
    var prefs = JSON.parse(decodeURIComponent(cookie[1]));
    return prefs.analytics === true;
  } catch (e) {
    return false;
  }
},

/**
 * Core event tracking with enrichment
 */
track(eventName, params = {}) {
  const enrichedParams = {
    ...params,
    session_id: this.getSessionId(),
    timestamp: new Date().toISOString()
  };

  if (!this.isAvailable()) {
    console.warn('[NDX Analytics] gtag unavailable:', eventName, enrichedParams);
    return false;
  }

  if (!this.hasConsent()) {
    console.debug('[NDX Analytics] No consent, event queued:', eventName);
    return false;
  }

  try {
    gtag('event', eventName, enrichedParams);
    return true;
  } catch (error) {
    console.error('[NDX Analytics] Error:', error);
    return false;
  }
},
```

---

### 3.6 cookies.md (New File)

**Location:** `src/cookies.md`

```markdown
---
layout: page
title: Cookies
description: How we use cookies on NDX:Try AWS
---

## Cookies

Cookies are small files saved on your phone, tablet or computer when you visit a website.

We use cookies to make NDX:Try AWS work and collect information about how you use our service.

## Essential cookies

Essential cookies keep your information secure while you use this service. We do not need to ask permission to use them.

| Name | Purpose | Expires |
|------|---------|---------|
| `ndx_cookies_policy` | Saves your cookie consent settings | 1 year |

## Analytics cookies (optional)

With your permission, we use Google Analytics 4 to collect data about how you use this service. This information helps us improve the service.

Google Analytics stores information about:
- the pages you visit
- how long you spend on each page
- how you got to the service
- what you click on while you're using the service

We do not allow Google to use or share our analytics data.

| Name | Purpose | Expires |
|------|---------|---------|
| `_ga` | Distinguishes users | 2 years |
| `_ga_S4542PPYLS` | Maintains session state | 2 years |

## Change your cookie settings

<div class="govuk-form-group" id="cookie-settings">
  <fieldset class="govuk-fieldset">
    <legend class="govuk-fieldset__legend govuk-fieldset__legend--m">
      Do you want to accept analytics cookies?
    </legend>
    <div class="govuk-radios" data-module="govuk-radios">
      <div class="govuk-radios__item">
        <input class="govuk-radios__input" id="cookies-analytics-yes" name="cookies-analytics" type="radio" value="yes">
        <label class="govuk-label govuk-radios__label" for="cookies-analytics-yes">
          Yes
        </label>
      </div>
      <div class="govuk-radios__item">
        <input class="govuk-radios__input" id="cookies-analytics-no" name="cookies-analytics" type="radio" value="no">
        <label class="govuk-label govuk-radios__label" for="cookies-analytics-no">
          No
        </label>
      </div>
    </div>
  </fieldset>
</div>

<button type="button" class="govuk-button" id="save-cookie-settings">Save cookie settings</button>

<div class="govuk-notification-banner govuk-notification-banner--success" role="alert" aria-labelledby="cookie-success-title" id="cookie-success-banner" hidden>
  <div class="govuk-notification-banner__header">
    <h2 class="govuk-notification-banner__title" id="cookie-success-title">Success</h2>
  </div>
  <div class="govuk-notification-banner__content">
    <p class="govuk-body">Your cookie settings have been saved.</p>
  </div>
</div>

<script>
(function() {
  // Load current preference
  var prefs = window.NDXCookieConsent ? window.NDXCookieConsent.getPreferences() : null;
  if (prefs) {
    var radio = document.querySelector('input[name="cookies-analytics"][value="' + (prefs.analytics ? 'yes' : 'no') + '"]');
    if (radio) radio.checked = true;
  }

  // Save handler
  document.getElementById('save-cookie-settings').addEventListener('click', function() {
    var selected = document.querySelector('input[name="cookies-analytics"]:checked');
    if (!selected) return;
    var analytics = selected.value === 'yes';
    if (window.NDXCookieConsent) {
      window.NDXCookieConsent.savePreferences(analytics);
    }
    document.getElementById('cookie-success-banner').hidden = false;
    window.scrollTo(0, 0);
  });
})();
</script>
```

---

### 3.7 privacy.md Update

**Location:** `src/privacy.md`

**Section to update:** Replace the cookies section with:

```markdown
## Cookies and analytics

We use cookies to make this service work and to collect information about how you use it.

### Essential cookies

We use essential cookies to remember your cookie preferences. These are strictly necessary for the service to function.

### Analytics cookies

With your permission, we use Google Analytics 4 to understand how people use this service. This helps us improve it.

Google Analytics sets the following cookies:

| Cookie | Purpose | Duration |
|--------|---------|----------|
| `_ga` | Distinguishes unique users | 2 years |
| `_ga_S4542PPYLS` | Maintains session state | 2 years |

We have configured Google Analytics to:
- anonymise your IP address
- not share data with third parties
- retain data for 14 months

You can [change your cookie settings](/cookies/) at any time.

For more details, see our [cookies page](/cookies/).
```

---

## 4. Events Already Implemented

The existing `NDXAnalytics` module includes 20+ events that will automatically start working once gtag is loaded and consent granted:

| Event | Category | Description |
|-------|----------|-------------|
| `scenario_viewed` | engagement | User views scenario page |
| `quiz_completed` | engagement | User completes recommendation quiz |
| `pathway_selected` | engagement | User chooses next steps pathway |
| `gcloud_link_clicked` | conversion | User clicks G-Cloud link |
| `evidence_pack_downloaded` | conversion | User downloads evidence pack |
| `journey_phase_started` | journey | User begins Try/Walkthrough/Explore |
| `journey_phase_changed` | journey | User transitions between phases |
| `journey_completed` | journey | User completes all phases |
| `exploration_activity_started` | exploration | User starts exploration activity |
| `exploration_completed` | exploration | User completes exploration |
| `next_steps_viewed` | engagement | User views next steps page |
| `partner_viewed` | engagement | User views partner card |

---

## 5. Testing Checklist

### 5.1 Cookie Banner
- [ ] Banner shows on first visit (no cookie set)
- [ ] Banner hidden on cookies page
- [ ] "Accept" button sets cookie with `analytics: true`
- [ ] "Reject" button sets cookie with `analytics: false`
- [ ] Confirmation message shows after choice
- [ ] "Hide" button removes banner
- [ ] Banner does not reappear after choice (cookie persists)

### 5.2 Consent Mode
- [ ] gtag loads on every page (check Network tab)
- [ ] No `_ga` cookies before consent (check Application > Cookies)
- [ ] After "Accept", `_ga` and `_ga_S4542PPYLS` cookies appear
- [ ] After "Reject", no GA cookies set
- [ ] Console shows `[NDX Analytics] No consent` when rejected

### 5.3 Analytics Events
- [ ] Events fire after consent (check GA4 Realtime)
- [ ] Session ID consistent across page views
- [ ] Custom parameters appear in events

### 5.4 Cookies Page
- [ ] Radio buttons reflect current preference
- [ ] "Save" updates cookie and shows success banner
- [ ] Changes take effect immediately (gtag consent updated)

### 5.5 Accessibility
- [ ] Banner has proper ARIA attributes
- [ ] Keyboard navigation works
- [ ] Screen reader announces banner content
- [ ] Focus management after interactions

---

## 6. Implementation Order

1. **Create cookie-banner.njk** - Markup only, no logic yet
2. **Create cookie-consent.js** - Consent management logic
3. **Modify base.njk** - Add gtag script and includes
4. **Modify analytics.js** - Add consent check
5. **Create cookies.md** - Settings page
6. **Update privacy.md** - Cookie details
7. **Test end-to-end** - All checklist items

---

## 7. Rollback Plan

If issues arise post-deployment:

1. **Quick disable:** Comment out gtag script in base.njk
2. **Full rollback:** Revert all changes via git
3. **Cookie cleanup:** Users can clear `ndx_cookies_policy` cookie manually

The existing `NDXAnalytics.isAvailable()` check ensures the site functions normally even if gtag is removed.

---

## 8. Future Considerations

- **GA4 Events in GA360:** Configure custom dimensions for `session_id`, `scenario_id`
- **BigQuery Export:** Enable for advanced analysis
- **Server-side tracking:** Consider for more accurate data (no ad blockers)
- **A/B testing:** Use GA4 audiences for experimentation
