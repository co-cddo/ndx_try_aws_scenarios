# Story 4-2: "What You Experienced" Reflection Guide Form

**Epic:** 4 - Evidence Generation & Committee-Ready Artifacts
**Status:** Drafted
**Priority:** High (captures evaluation data for Evidence Pack)

## User Story

As a **council evaluator** who has completed a scenario walkthrough,
I want **a structured reflection form to capture my evaluation insights**
So that **my feedback can be used to generate a personalized Evidence Pack for committee presentations**.

## Background

This story implements the reflection guide form that bridges the walkthrough experience to Evidence Pack generation. The form captures 7 fields (4 required, 3 optional) using GOV.UK Frontend components, stores data in localStorage for session persistence, and validates inputs client-side.

The form appears on the Evidence Pack page and is required before generating a PDF. Users must complete the required fields to unlock the "Generate Evidence Pack" functionality.

## Acceptance Criteria

### AC 4.2.1: Form Fields
- [ ] Form displays 7 fields with correct types:
  - `what_surprised` (textarea, required) - "What surprised you?"
  - `would_implement` (radio: Yes/Maybe/No, required) - "Would you implement this?"
  - `production_wants` (textarea, optional) - "What would you want in production?"
  - `concerns` (textarea, optional) - "What concerns do you have?"
  - `likelihood_proceed` (rating 1-5, required) - "How likely to proceed?"
  - `council_name` (text, optional) - "Your council name"
  - `email` (email, optional) - "Email for Evidence Pack delivery"

### AC 4.2.2: Required Field Validation
- [ ] Required fields show asterisk (*) indicator
- [ ] Submit with empty required field shows GOV.UK error summary
- [ ] Individual field errors appear below each invalid field
- [ ] Focus moves to first error on submit

### AC 4.2.3: Email Validation
- [ ] Email field validates email format
- [ ] Invalid email shows "Enter a valid email address" error

### AC 4.2.4: GOV.UK Frontend Components
- [ ] Form uses GOV.UK text input, textarea, radios, and fieldset
- [ ] Styling matches GOV.UK Design System
- [ ] Error messages follow GOV.UK patterns

### AC 4.2.5: Accessibility (WCAG 2.2 AA)
- [ ] All inputs have associated labels
- [ ] Error messages linked via aria-describedby
- [ ] Form is keyboard navigable
- [ ] Focus indicators visible
- [ ] pa11y-ci passes with 0 errors

### AC 4.2.6: localStorage Persistence
- [ ] Form data saves to localStorage on input change
- [ ] Data persists across page refresh
- [ ] Data cleared after successful Evidence Pack generation
- [ ] Session expires after 24 hours

### AC 4.2.7: Analytics Event
- [ ] `reflection_form_completed` event fires on valid submission
- [ ] Event includes scenario_id and form completion time

### AC 4.2.9: Help Text & Placeholders
- [ ] Placeholder examples displayed for open-ended fields
- [ ] "e.g., The response speed, the accuracy..." for what_surprised
- [ ] "e.g., Integration with our CRM..." for production_wants

### AC 4.2.10: Privacy Notice
- [ ] Privacy notice displayed above submit button
- [ ] Links to privacy policy page

### AC 4.2.12: Progress Indicator
- [ ] Shows "Question X of Y" or step indicator
- [ ] Visual progress bar or step counter

### AC 4.2.13: CTA Banner
- [ ] "Get Your Evidence Pack" banner visible at top of form
- [ ] Shows value proposition: "Takes 2 min • Committee-ready PDF"

### AC 4.2.14: Form Unlocks Generation
- [ ] Generate Evidence Pack button disabled until form is valid
- [ ] Button enables when all required fields completed
- [ ] Visual indication that form gates the Evidence Pack

## Technical Implementation

### Form Structure
```html
<form id="reflection-form" class="ndx-reflection-form" novalidate>
  <!-- Progress indicator -->
  <div class="ndx-form-progress">
    Step <span id="current-step">1</span> of 7
  </div>

  <!-- what_surprised - required textarea -->
  <div class="govuk-form-group" id="what-surprised-group">
    <label class="govuk-label govuk-label--m" for="what-surprised">
      What surprised you about this scenario?
      <span class="govuk-visually-hidden">(required)</span>
    </label>
    <span class="govuk-hint">
      e.g., The response speed, the accuracy of the AI, how easy it was to deploy...
    </span>
    <textarea class="govuk-textarea" id="what-surprised" name="what_surprised"
              rows="4" aria-required="true" data-required="true"></textarea>
  </div>

  <!-- would_implement - required radios -->
  <div class="govuk-form-group">
    <fieldset class="govuk-fieldset" aria-required="true">
      <legend class="govuk-fieldset__legend govuk-fieldset__legend--m">
        Would you implement this in your council?
        <span class="govuk-visually-hidden">(required)</span>
      </legend>
      <div class="govuk-radios" data-module="govuk-radios">
        <div class="govuk-radios__item">
          <input class="govuk-radios__input" id="would-implement-yes"
                 name="would_implement" type="radio" value="yes">
          <label class="govuk-label govuk-radios__label" for="would-implement-yes">
            Yes - this could work for us
          </label>
        </div>
        <!-- maybe, no options -->
      </div>
    </fieldset>
  </div>

  <!-- ... other fields ... -->

  <!-- Privacy notice -->
  <div class="govuk-inset-text">
    <p class="govuk-body-s">
      Your responses are stored locally in your browser and used only to generate
      your Evidence Pack. See our <a href="/privacy/" class="govuk-link">privacy policy</a>.
    </p>
  </div>

  <!-- Submit -->
  <button type="submit" class="govuk-button" data-module="govuk-button" disabled>
    Continue to Evidence Pack
  </button>
</form>
```

### JavaScript Validation
```javascript
// src/assets/js/reflection-form.js
class ReflectionForm {
  constructor(formElement) {
    this.form = formElement;
    this.storageKey = 'ndx_reflection_form';
    this.requiredFields = ['what_surprised', 'would_implement', 'likelihood_proceed'];

    this.init();
  }

  init() {
    this.loadFromStorage();
    this.setupValidation();
    this.setupPersistence();
    this.updateProgress();
  }

  loadFromStorage() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      const data = JSON.parse(saved);
      Object.entries(data.fields || {}).forEach(([name, value]) => {
        const field = this.form.querySelector(`[name="${name}"]`);
        if (field) {
          if (field.type === 'radio') {
            const radio = this.form.querySelector(`[name="${name}"][value="${value}"]`);
            if (radio) radio.checked = true;
          } else {
            field.value = value;
          }
        }
      });
    }
  }

  saveToStorage() {
    const formData = new FormData(this.form);
    const data = {
      scenario_id: this.form.dataset.scenarioId,
      timestamp: new Date().toISOString(),
      fields: Object.fromEntries(formData.entries())
    };
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  validate() {
    // Return true if all required fields are filled
  }

  showError(fieldName, message) {
    // GOV.UK error pattern
  }
}
```

### File Structure
```
src/
├── assets/
│   └── js/
│       └── reflection-form.js    # Form validation and persistence
└── evidence-pack/
    └── index.njk                 # Updated with form integration
```

## Dependencies

- Story 4.1 (Evidence Pack Template) - must be complete
- GOV.UK Frontend 5.13.0 form components
- localStorage API

## Definition of Done

- [ ] All 12 acceptance criteria pass
- [ ] Form validates correctly (required fields, email format)
- [ ] Data persists in localStorage
- [ ] Analytics event fires on completion
- [ ] pa11y accessibility tests pass
- [ ] Code review approved

## Notes

- Form data feeds into Story 4.3 (PDF Generation)
- Email field optional - will be used in Phase 2 for Evidence Pack email delivery
- Quick form (3 fields only) deferred to post-MVP based on completion rate data
