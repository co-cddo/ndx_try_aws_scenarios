# Epic Technical Specification: Walkthrough Index & Navigation

Date: 2025-11-29
Author: Claude Code
Epic ID: 14
Status: Ready for Implementation

---

## Overview

Epic 14 creates the navigation infrastructure that makes screenshot content discoverable. Building on the existing GOV.UK Eleventy Plugin header, this epic adds a central walkthrough index page and enhanced navigation with dropdown menus, enabling users to find and browse all available walkthroughs from anywhere in the portal.

The core user value is: **"I can easily find and access any walkthrough from anywhere in the portal without hunting through multiple pages."** This addresses the current discovery gap where users must navigate to individual scenario pages to find walkthroughs.

**Key Insight from PRD:** Navigation enables exposure - the best screenshot content is useless if users can't find it. A prominent walkthrough index and persistent navigation dropdowns ensure maximum discoverability.

This epic implements **FRs 129-136**, delivering:
- **Walkthrough Index Page**: Central hub listing all 6 scenarios with preview cards
- **Category Filtering**: AI, IoT, Analytics filter buttons with URL persistence
- **Search Functionality**: Real-time text search across scenario names/descriptions
- **Header Dropdowns**: Scenarios and Walkthroughs mega-menus
- **Mobile Navigation**: Hamburger menu with accordion patterns
- **Breadcrumb Navigation**: Contextual location indicators
- **Active State Highlighting**: Current section indication

**Strategic Positioning:** Epic 14 is the "findability" phase - ensuring screenshot content surfaces to users through multiple navigation paths.

## Objectives and Scope

### In Scope

- **Walkthrough Index Page** (`/src/walkthroughs/index.njk`):
  - 6 scenario cards with thumbnails, descriptions, step counts
  - Responsive grid layout (3 columns desktop, 2 tablet, 1 mobile)
  - Category badges (AI, IoT, Analytics)
  - Time estimates per scenario
  - GOV.UK breadcrumb navigation

- **Category Filtering**:
  - Filter buttons: All, AI (4), IoT (1), Analytics (1)
  - URL query parameter persistence (`?category=ai`)
  - Animated show/hide on filter change
  - Combined with search (AND logic)

- **Search Functionality**:
  - Real-time filtering as user types
  - Searches name, description, AWS services
  - Minimum 2 characters to trigger
  - Case-insensitive matching
  - Empty state with suggestions

- **Header Navigation Enhancement**:
  - Extend govuk-eleventy-plugin header via custom CSS/JS
  - "Scenarios" dropdown with all 6 scenarios
  - "Walkthroughs" dropdown grouped by category
  - Quiz and Get Started links
  - 150ms hover delay on desktop

- **Mobile Navigation**:
  - Hamburger menu icon at <768px
  - Slide-in panel from right
  - Accordion expand/collapse for dropdowns
  - 44x44px touch targets
  - Focus trapping when open

- **Breadcrumb Navigation**:
  - GOV.UK breadcrumbs component
  - Format: Home > Walkthroughs > {Scenario} > {Step}
  - Mobile truncation with ellipsis
  - Automatic generation from page path

- **Active State Highlighting**:
  - Underline/background on current section
  - Path-based detection via JavaScript
  - Works in both desktop and mobile nav

### Out of Scope

- Full-text search across page content (only metadata)
- Navigation analytics (Story 16.7)
- Multi-language navigation labels
- Customizable nav ordering

### Phase 2 Commitments

- Saved searches/bookmarks
- Recently viewed walkthroughs
- Personalized navigation ordering
- Voice navigation support

### Scope Prioritization

**P1 - Launch Blockers:**
- Walkthrough index page with cards
- Header dropdowns (Scenarios, Walkthroughs)
- Breadcrumb navigation
- Active state highlighting

**P2 - Launch Enhancers:**
- Category filtering with URL persistence
- Mobile hamburger menu
- Search functionality

**P3 - Fast Follow:**
- Search highlighting in results
- Filter count badges
- Keyboard shortcuts for navigation

## System Architecture Alignment

### Architecture Components Referenced

| Decision | Component | Epic 14 Implementation |
|----------|-----------|----------------------|
| ADR-1: Portal Model | Static Site (Eleventy) | Index page as Nunjucks template; data from scenarios.yaml |
| ADR-4: Client-Side JS | Vanilla JavaScript | Filtering, search, dropdown interactions |
| ADR-6: Design System | GOV.UK Frontend 5.13.0 | Header, breadcrumbs, cards, tag components |
| Plugin: govuk-eleventy | Header/Footer | Extend via config + custom partials, don't replace |

### Navigation Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    NAVIGATION ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  HEADER (Enhanced govuk-eleventy-plugin)                                 │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │     │
│  │ │Scenarios │ │Walkthroughs│ │  Quiz   │ │Get Started│          │     │
│  │ │    ▼     │ │     ▼     │ │         │ │           │          │     │
│  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │     │
│  │      │              │                                          │     │
│  │      ▼              ▼                                          │     │
│  │ ┌──────────┐ ┌──────────────────┐                             │     │
│  │ │ Dropdown │ │   Dropdown       │                             │     │
│  │ │ 6 items  │ │ Grouped by cat   │                             │     │
│  │ │ + icons  │ │ AI | IoT | Ana   │                             │     │
│  │ └──────────┘ └──────────────────┘                             │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  MOBILE (<768px)                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ ☰ ───► ┌─────────────────────┐                                │     │
│  │        │ Slide-in Panel      │                                │     │
│  │        │ ┌─────────────────┐ │                                │     │
│  │        │ │ Scenarios ▼     │ │  ◄── Accordion                 │     │
│  │        │ │  - Chatbot      │ │                                │     │
│  │        │ │  - Planning     │ │                                │     │
│  │        │ └─────────────────┘ │                                │     │
│  │        │ ┌─────────────────┐ │                                │     │
│  │        │ │ Walkthroughs ▼  │ │                                │     │
│  │        │ └─────────────────┘ │                                │     │
│  │        └─────────────────────┘                                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  BREADCRUMBS                                                              │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ Home > Walkthroughs > Council Chatbot > Step 2                  │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  WALKTHROUGH INDEX (/walkthroughs/)                                       │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ ┌─────────────────────────────────────────────────────────┐   │     │
│  │ │ [All] [AI] [IoT] [Analytics]    [🔍 Search...]          │   │     │
│  │ └─────────────────────────────────────────────────────────┘   │     │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐                          │     │
│  │ │ Card 1  │ │ Card 2  │ │ Card 3  │                          │     │
│  │ │ Chatbot │ │Planning │ │   FOI   │                          │     │
│  │ └─────────┘ └─────────┘ └─────────┘                          │     │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐                          │     │
│  │ │ Card 4  │ │ Card 5  │ │ Card 6  │                          │     │
│  │ │Car Park │ │  TTS    │ │QuickSight│                         │     │
│  │ └─────────┘ └─────────┘ └─────────┘                          │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Integration with govuk-eleventy-plugin

The existing plugin provides header/footer. Epic 14 extends without replacing:

```javascript
// eleventy.config.js - Extended header configuration
eleventyConfig.addPlugin(govukEleventyPlugin, {
  header: {
    // Existing config preserved
    organisationName: 'NDX:Try AWS',
    productName: 'AWS Scenarios for UK Councils',
    search: false,
    // Custom navigation added via separate partial
    navigation: {
      items: [
        { text: 'Scenarios', href: '/scenarios/' },
        { text: 'Walkthroughs', href: '/walkthroughs/' },
        { text: 'Quiz', href: '/quiz/' },
        { text: 'Get Started', href: '/get-started/' }
      ]
    }
  }
});
```

Custom dropdown behavior added via JavaScript enhancement, not plugin modification.

## Story Dependencies and Order

```
14.1 (Index Page) ──► 14.2 (Filtering) ──► 14.3 (Search)

14.4 (Header Dropdowns) ──► 14.5 (Mobile Nav) ──► 14.7 (Active State)

14.6 (Breadcrumbs) ──► No dependencies
```

**Recommended Implementation Order:**
1. Story 14.1 - Index Page (foundation)
2. Story 14.6 - Breadcrumbs (independent, can parallel)
3. Story 14.4 - Header Dropdowns (core navigation)
4. Story 14.2 - Category Filtering
5. Story 14.5 - Mobile Navigation
6. Story 14.3 - Search Functionality
7. Story 14.7 - Active State Highlighting

## Technical Decisions

### TD-14.1: Extend Plugin vs Replace Header

**Decision:** Extend govuk-eleventy-plugin header via config + custom CSS/JS

**Rationale:**
- Plugin updates preserved
- Accessibility baseline maintained
- Responsive behavior inherited
- Less code to maintain

### TD-14.2: Client-Side Filtering

**Decision:** JavaScript-based filtering with URL query parameter persistence

**Rationale:**
- Only 6 items - no performance concern
- Instant feedback
- URL sharing with filters preserved
- No server round-trips

### TD-14.3: Search Implementation

**Decision:** Simple JavaScript filter (no Lunr.js or search library)

**Rationale:**
- Only 6 scenarios to search
- Library overhead unjustified
- Simple string matching sufficient
- Faster page load

### TD-14.4: Mobile Menu Animation

**Decision:** CSS-only animation with JS state management

**Rationale:**
- Smoother animations (GPU-accelerated transforms)
- Reduced JS complexity
- Respects `prefers-reduced-motion`
- Better performance on low-end devices

### TD-14.5: Active State Detection

**Decision:** JavaScript path matching on page load

**Rationale:**
- Works with static site generation
- No build-time per-page complexity
- Handles nested routes correctly
- Easy to maintain

## File Structure

```
/src/
├── _includes/
│   ├── layouts/
│   │   └── base.njk                    # Header enhancement point
│   └── components/
│       ├── nav-dropdown.njk            # New
│       ├── mobile-nav.njk              # New
│       └── walkthrough-card.njk        # New
├── assets/
│   ├── css/
│   │   ├── _nav-dropdown.scss          # New
│   │   ├── _mobile-nav.scss            # New
│   │   └── _walkthrough-index.scss     # New
│   └── js/
│       ├── nav-dropdown.js             # New
│       ├── mobile-nav.js               # New
│       ├── walkthrough-filter.js       # Update existing
│       └── active-nav.js               # New
└── walkthroughs/
    └── index.njk                       # New
```

## Component Specifications

### Walkthrough Index Page (`/walkthroughs/index.njk`)

```nunjucks
---
layout: page
title: Scenario Walkthroughs
description: Step-by-step guides for exploring AWS scenarios
---

{% set categories = [
  { id: 'all', label: 'All', count: 6 },
  { id: 'ai', label: 'AI', count: 4 },
  { id: 'iot', label: 'IoT', count: 1 },
  { id: 'analytics', label: 'Analytics', count: 1 }
] %}

<div class="ndx-walkthrough-index">
  {# Filter Bar #}
  <div class="ndx-walkthrough-index__filters">
    <div class="govuk-button-group" role="group" aria-label="Filter by category">
      {% for cat in categories %}
        <button type="button"
                class="govuk-button govuk-button--secondary{% if cat.id == 'all' %} govuk-button--active{% endif %}"
                data-filter="{{ cat.id }}"
                aria-pressed="{% if cat.id == 'all' %}true{% else %}false{% endif %}">
          {{ cat.label }} ({{ cat.count }})
        </button>
      {% endfor %}
    </div>

    <div class="govuk-form-group ndx-walkthrough-index__search">
      <label class="govuk-label govuk-visually-hidden" for="walkthrough-search">
        Search walkthroughs
      </label>
      <input type="search"
             id="walkthrough-search"
             class="govuk-input"
             placeholder="Search walkthroughs..."
             data-search-input>
    </div>
  </div>

  {# Cards Grid #}
  <div class="ndx-walkthrough-index__grid" aria-live="polite">
    {% for scenario in scenarios.scenarios %}
      {% include "components/walkthrough-card.njk" %}
    {% endfor %}
  </div>

  {# Empty State #}
  <div class="ndx-walkthrough-index__empty" hidden>
    <p class="govuk-body">No walkthroughs match your search</p>
    <button type="button" class="govuk-button govuk-button--secondary" data-clear-search>
      Clear search
    </button>
    <p class="govuk-body-s">Try searching for 'chatbot', 'AI', or 'dashboard'</p>
  </div>
</div>
```

### Walkthrough Card Component

```nunjucks
{#
  Walkthrough Card (Story 14.1)

  Expects: scenario object from scenarios.yaml
#}

<article class="ndx-walkthrough-card"
         data-category="{{ scenario.category }}"
         data-name="{{ scenario.title | lower }}"
         data-description="{{ scenario.description | lower }}"
         data-services="{{ scenario.awsServices | join(' ') | lower }}">
  <a href="/walkthroughs/{{ scenario.id }}/" class="ndx-walkthrough-card__link">
    <div class="ndx-walkthrough-card__thumbnail">
      {# Scenario icon/thumbnail #}
      {% include "components/scenario-icon.njk" %}
    </div>
    <div class="ndx-walkthrough-card__content">
      <h3 class="govuk-heading-s ndx-walkthrough-card__title">
        {{ scenario.title }}
      </h3>
      <p class="govuk-body-s ndx-walkthrough-card__description">
        {{ scenario.headline }}
      </p>
      <div class="ndx-walkthrough-card__meta">
        <span class="govuk-tag govuk-tag--{{ scenario.category | categoryColor }}">
          {{ scenario.category | upper }}
        </span>
        <span class="govuk-body-s">{{ scenario.walkthroughSteps }} steps</span>
        <span class="govuk-body-s">{{ scenario.timeEstimate }}</span>
      </div>
    </div>
  </a>
</article>
```

### Navigation Dropdown Component

```nunjucks
{#
  Navigation Dropdown (Story 14.4)

  Usage: {% include "components/nav-dropdown.njk" with { type: "scenarios" } %}
#}

<div class="ndx-nav-dropdown" data-nav-dropdown="{{ type }}">
  <button type="button"
          class="ndx-nav-dropdown__trigger"
          aria-expanded="false"
          aria-haspopup="true"
          aria-controls="dropdown-{{ type }}">
    {{ label }}
    <svg class="ndx-nav-dropdown__icon" aria-hidden="true" width="12" height="12">
      <path d="M2 4l4 4 4-4" stroke="currentColor" fill="none"/>
    </svg>
  </button>
  <div id="dropdown-{{ type }}"
       class="ndx-nav-dropdown__menu"
       role="menu"
       aria-labelledby="dropdown-trigger-{{ type }}"
       hidden>
    {% if type == "scenarios" %}
      <ul class="ndx-nav-dropdown__list">
        {% for scenario in scenarios.scenarios %}
          <li role="menuitem">
            <a href="/scenarios/{{ scenario.id }}/" class="ndx-nav-dropdown__item">
              <span class="ndx-nav-dropdown__item-icon">{{ scenario.icon }}</span>
              <span class="ndx-nav-dropdown__item-text">
                <strong>{{ scenario.title }}</strong>
                <span class="govuk-body-s">{{ scenario.headline | truncate(50) }}</span>
              </span>
            </a>
          </li>
        {% endfor %}
      </ul>
    {% elif type == "walkthroughs" %}
      {# Grouped by category #}
      {% for category in ['AI', 'IoT', 'Analytics'] %}
        <div class="ndx-nav-dropdown__group">
          <span class="ndx-nav-dropdown__group-label">{{ category }}</span>
          <ul class="ndx-nav-dropdown__list">
            {% for scenario in scenarios.scenarios | selectattr("category", "equalto", category | lower) %}
              <li role="menuitem">
                <a href="/walkthroughs/{{ scenario.id }}/" class="ndx-nav-dropdown__item">
                  {{ scenario.title }}
                  <span class="govuk-tag govuk-tag--grey">{{ scenario.walkthroughSteps }} steps</span>
                </a>
              </li>
            {% endfor %}
          </ul>
        </div>
      {% endfor %}
    {% endif %}
  </div>
</div>
```

## Testing Strategy

### Unit Tests

- Filter buttons toggle correctly
- Search filters by name/description/services
- URL params update on filter change
- Cards show/hide based on filter
- Dropdown opens/closes on interaction

### Integration Tests

- Navigation works across all pages
- Breadcrumbs generate correctly
- Active state highlights correct section
- Mobile menu opens/closes
- Focus management correct

### Accessibility Tests

- ARIA attributes correct on dropdowns
- Keyboard navigation complete
- Focus visible on all elements
- Screen reader announcements proper
- Touch targets 44x44px minimum

### Visual Regression Tests

- Index page grid layout
- Dropdown appearance
- Mobile menu appearance
- Breadcrumb truncation
- Active state styling

## Story Point Estimates

| Story | Description | Points |
|-------|-------------|--------|
| 14.1 | Index Page Layout and Cards | 5 |
| 14.2 | Category Filtering and Badges | 5 |
| 14.3 | Search Functionality | 5 |
| 14.4 | Header Dropdowns | 8 |
| 14.5 | Mobile Navigation | 8 |
| 14.6 | Breadcrumb Navigation | 3 |
| 14.7 | Active State Highlighting | 3 |
| **Total** | | **37** |

## Acceptance Criteria Summary

- [ ] Walkthrough index page displays 6 scenario cards
- [ ] Category filter buttons work (All, AI, IoT, Analytics)
- [ ] URL updates with filter selection (`?category=ai`)
- [ ] Search filters cards by name/description/services
- [ ] Empty state displays when no matches
- [ ] Header shows Scenarios and Walkthroughs dropdowns
- [ ] Dropdowns open on hover (desktop) / click (mobile)
- [ ] Mobile hamburger menu works at <768px
- [ ] Breadcrumbs show on all walkthrough pages
- [ ] Current section highlighted in navigation
- [ ] All navigation keyboard accessible
- [ ] Focus management correct throughout

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Plugin update breaks customizations | Keep customizations minimal, in separate files |
| Dropdown z-index conflicts | Use CSS custom properties, test with all overlays |
| Search performance | Only 6 items - simple filter sufficient |
| Mobile menu conflicts | Test on real devices, not just dev tools |
