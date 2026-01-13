---
layout: page
title: Cookies
description: How we use cookies on NDX:Try AWS
---

# Cookies

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
