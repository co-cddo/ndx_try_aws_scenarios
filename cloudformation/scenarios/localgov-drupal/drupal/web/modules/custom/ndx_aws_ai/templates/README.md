# AI Component Design System

Story 3.3: AI Component Design System

This directory contains Twig templates for AI-powered UI components that follow GOV.UK Design System patterns and WCAG 2.2 AA accessibility requirements.

## Components

### AI Action Button

A secondary-style button for triggering AI operations.

**Template:** `ai-action-button.html.twig`

**Variables:**
| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `label` | string | Yes | - | Button text label |
| `icon` | string | No | - | Icon type: `sparkle`, `simplify`, `translate`, `accessibility`, `listen`, `image` |
| `action` | string | No | - | Data action attribute for JS handlers |
| `disabled` | boolean | No | `false` | Whether button is disabled |
| `type` | string | No | `button` | Button type: `button`, `submit` |
| `size` | string | No | `normal` | Button size: `normal`, `small` |
| `attributes` | string | No | - | Additional HTML attributes |

**Example:**
```twig
{% include '@ndx_aws_ai/ai-action-button.html.twig' with {
  label: 'Simplify text',
  icon: 'sparkle',
  action: 'simplify',
  disabled: false,
} %}
```

### AI Loading State

Displays a loading indicator while AI operations are in progress.

**Template:** `ai-loading-state.html.twig`

**Variables:**
| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `message` | string | No | `AI is thinking...` | Loading message text |
| `show_spinner` | boolean | No | `true` | Whether to show spinner animation |
| `id` | string | No | Auto-generated | Unique component ID |
| `attributes` | string | No | - | Additional HTML attributes |

**Example:**
```twig
{% include '@ndx_aws_ai/ai-loading-state.html.twig' with {
  message: 'AI is simplifying your text...',
  show_spinner: true,
} %}
```

**Accessibility:**
- Uses `aria-live="polite"` for screen reader announcements
- Uses `role="status"` for assistive technology
- Respects `prefers-reduced-motion` for spinner animation

### AI Error State

Displays an error message with optional retry functionality.

**Template:** `ai-error-state.html.twig`

**Variables:**
| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `message` | string | Yes | - | Error message to display |
| `error_code` | string | No | - | Technical error code |
| `show_retry` | boolean | No | `true` | Whether to show retry button |
| `retry_label` | string | No | `Try again` | Retry button label |
| `retry_action` | string | No | `retry` | Data action for retry handler |
| `id` | string | No | Auto-generated | Unique component ID |
| `attributes` | string | No | - | Additional HTML attributes |

**Example:**
```twig
{% include '@ndx_aws_ai/ai-error-state.html.twig' with {
  message: 'Unable to connect to AI service',
  error_code: 'SERVICE_UNAVAILABLE',
  show_retry: true,
} %}
```

**Accessibility:**
- Uses `role="alert"` for immediate screen reader announcement
- Retry button meets 44x44px touch target requirement

### AI Success State

Displays a success confirmation for completed AI operations.

**Template:** `ai-success-state.html.twig`

**Variables:**
| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `message` | string | Yes | - | Success message to display |
| `show_dismiss` | boolean | No | `false` | Whether to show dismiss button |
| `dismiss_label` | string | No | `Dismiss` | Dismiss button label |
| `auto_dismiss` | integer | No | `0` | Auto-dismiss time in milliseconds (0 = no auto-dismiss) |
| `id` | string | No | Auto-generated | Unique component ID |
| `attributes` | string | No | - | Additional HTML attributes |

**Example:**
```twig
{% include '@ndx_aws_ai/ai-success-state.html.twig' with {
  message: 'Text simplified successfully',
  auto_dismiss: 5000,
  show_dismiss: true,
} %}
```

**Accessibility:**
- Uses `aria-live="polite"` for screen reader announcement
- Auto-dismiss respects user preferences

## Design Tokens

The components use CSS custom properties (design tokens) defined in `css/ai-components.css`:

### Colours (GOV.UK Design System)

```css
--ai-color-blue: #1d70b8;      /* Primary actions, links */
--ai-color-blue-hover: #003078; /* Hover state */
--ai-color-black: #0b0c0c;     /* Text */
--ai-color-white: #ffffff;     /* Backgrounds */
--ai-color-red: #d4351c;       /* Errors */
--ai-color-green: #00703c;     /* Success */
--ai-color-yellow: #ffdd00;    /* Focus ring */
--ai-color-grey: #505a5f;      /* Secondary text */
--ai-color-light-grey: #f3f2f1; /* Backgrounds */
```

### Focus Ring

All interactive elements have a 3px yellow focus ring with 2px offset:

```css
--ai-focus-width: 3px;
--ai-focus-offset: 2px;
```

### Touch Target

Minimum touch target size of 44x44px for WCAG 2.2 AA compliance:

```css
--ai-touch-target: 44px;
```

## JavaScript API

The components include JavaScript behaviours for state management.

### Attaching the Library

Add the library to your render array:

```php
$build['#attached']['library'][] = 'ndx_aws_ai/ai_components';
```

### Custom Events

The components dispatch custom events:

| Event | Target | Detail | Description |
|-------|--------|--------|-------------|
| `ai:action` | Button | `{ action, button }` | AI action triggered |
| `ai:retry` | Error state | `{ action, element }` | Retry button clicked |
| `ai:dismiss` | Document | `{ element }` | Success state dismissed |
| `ai:statechange` | Container | `{ previousState, newState, options }` | State changed |

### State Manager

For complex state management, use the StateManager utility:

```javascript
var container = document.querySelector('.my-ai-container');
var manager = new Drupal.ndxAwsAi.StateManager(container);

// Show loading
manager.showLoading('Processing your request...');

// On success
manager.showSuccess('Operation completed!', 5000);

// On error
manager.showError('Something went wrong', 'ERROR_CODE');

// Reset to idle
manager.reset();
```

## Accessibility Checklist

All components meet WCAG 2.2 AA requirements:

- [x] Minimum touch target: 44x44px
- [x] Colour contrast ratio: 4.5:1 for text, 3:1 for UI components
- [x] Focus ring: 3px yellow with 2px offset
- [x] `aria-live` regions for dynamic content updates
- [x] `role` attributes for assistive technology
- [x] `prefers-reduced-motion` support
- [x] Keyboard navigation (Enter/Space to activate)
- [x] High contrast mode support

## References

- [GOV.UK Design System](https://design-system.service.gov.uk/)
- [WCAG 2.2 AA Guidelines](https://www.w3.org/TR/WCAG22/)
- [Architecture Document](/_bmad-output/project-planning-artifacts/architecture.md)
- [UX Design Specification](/_bmad-output/project-planning-artifacts/ux-design-specification.md)
