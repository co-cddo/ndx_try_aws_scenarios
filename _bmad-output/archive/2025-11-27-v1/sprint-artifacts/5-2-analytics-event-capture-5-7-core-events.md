# Story 5-2: Analytics Event Capture - 5-7 Core Events

**Epic:** 5 - Pathway Forward & Partner Ecosystem
**Status:** Drafted
**Priority:** High (enables success metrics tracking)

## User Story

As a **NDX:Try platform owner**,
I want **analytics events tracking key user interactions**
So that **I can measure informed decision rate and optimize the user journey**.

## Background

This story implements the analytics framework for Epic 5, capturing 5-7 core events that enable calculation of key success metrics. The implementation uses GA4 custom events with graceful degradation if analytics is blocked.

## Acceptance Criteria (MVP)

### AC 5.2.1: next_steps_viewed Event
- [ ] `next_steps_viewed` event fires on Next Steps page load
- [ ] Event includes scenario_id parameter
- [ ] Event can be verified in GA4 DebugView

### AC 5.2.2: pathway_selected Event
- [ ] `pathway_selected` event fires when pathway displays
- [ ] Event includes pathway_type (proceed/maybe/not_now)
- [ ] Event includes scenario_id

### AC 5.2.3: gcloud_link_clicked Event
- [ ] `gcloud_link_clicked` event fires on G-Cloud link click
- [ ] Event includes search_term parameter
- [ ] Event includes scenario_id

### AC 5.2.4: partner_viewed Event
- [ ] `partner_viewed` event fires on partner card interaction
- [ ] Event includes partner_id
- [ ] Event includes scenario_id

### AC 5.2.5: evidence_pack_downloaded Event
- [ ] `evidence_pack_downloaded` event fires on PDF download
- [ ] Event includes scenario_id and persona

### AC 5.2.6: Graceful Degradation
- [ ] No JavaScript errors if gtag unavailable
- [ ] Analytics failures don't block user actions
- [ ] Console warning logged if analytics unavailable

### AC 5.2.7: Session Context
- [ ] All events include session_id from localStorage
- [ ] Events include timestamp
- [ ] Events include user journey context (scenarios_viewed)

## Technical Implementation

### File Structure
```
src/
└── assets/
    └── js/
        └── analytics.js  # Analytics module with Epic 5 events
```

### Analytics Module
```javascript
// src/assets/js/analytics.js
const NDXAnalytics = {
  // Check if GA is available
  isAvailable() {
    return typeof gtag === 'function';
  },

  // Core event tracking
  track(eventName, params = {}) {
    if (!this.isAvailable()) {
      console.warn('Analytics unavailable:', eventName, params);
      return;
    }

    const enrichedParams = {
      ...params,
      session_id: this.getSessionId(),
      timestamp: new Date().toISOString()
    };

    gtag('event', eventName, enrichedParams);
  },

  // Session management
  getSessionId() {
    let sessionId = sessionStorage.getItem('ndx_session_id');
    if (!sessionId) {
      sessionId = 'ndx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('ndx_session_id', sessionId);
    }
    return sessionId;
  },

  // Epic 5 Events
  trackNextStepsViewed(scenarioId) {
    this.track('next_steps_viewed', { scenario_id: scenarioId });
  },

  trackPathwaySelected(scenarioId, pathwayType) {
    this.track('pathway_selected', { scenario_id: scenarioId, pathway_type: pathwayType });
  },

  trackGCloudClicked(scenarioId, searchTerm) {
    this.track('gcloud_link_clicked', { scenario_id: scenarioId, search_term: searchTerm });
  },

  trackPartnerViewed(scenarioId, partnerId) {
    this.track('partner_viewed', { scenario_id: scenarioId, partner_id: partnerId });
  },

  trackEvidencePackDownloaded(scenarioId, persona) {
    this.track('evidence_pack_downloaded', { scenario_id: scenarioId, persona: persona });
  }
};

// Export for use in other modules
window.NDXAnalytics = NDXAnalytics;
```

### Integration Points

1. **Next Steps Pages** - Add to next-steps.js:
```javascript
NDXAnalytics.trackNextStepsViewed(scenarioId);
NDXAnalytics.trackPathwaySelected(scenarioId, pathwayType);
```

2. **G-Cloud Links** - Add click handler to next-steps-guidance.njk:
```javascript
onclick="NDXAnalytics.trackGCloudClicked('{{ scenario.id }}', '{{ scenario.gcloud_search_term }}')"
```

3. **Evidence Pack** - Already has infrastructure, add:
```javascript
NDXAnalytics.trackEvidencePackDownloaded(scenarioId, persona);
```

## Dependencies

- Story 5.1 (Next Steps pages) - complete
- GA4 configured in site (existing)
- gtag.js loaded in base template

## Definition of Done

- [ ] All 7 MVP acceptance criteria pass
- [ ] Analytics module created and loaded
- [ ] Events fire correctly with parameters
- [ ] Graceful degradation works
- [ ] No JavaScript errors
- [ ] Build succeeds
- [ ] pa11y tests pass

## Notes

- GA4 Measurement ID should be in site config
- Partner events (5.2.4) deferred to Story 5-3 when partners are added
- Journey completion tracking deferred to Phase 2
- All events use gtag() directly for simplicity
