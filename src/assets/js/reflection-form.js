/**
 * Reflection Form - Captures evaluation insights for Evidence Pack
 * Story 4.2 - NDX:Try AWS Scenarios
 *
 * Features:
 * - GOV.UK-compliant validation
 * - localStorage persistence
 * - Progress tracking
 * - Persona selection integration
 */

class ReflectionForm {
  constructor(formElement) {
    this.form = formElement;
    this.storageKey = 'ndx_reflection_form';
    this.requiredFields = ['what_surprised', 'would_implement', 'likelihood_proceed'];
    this.totalFields = 7;

    this.init();
  }

  init() {
    this.loadFromStorage();
    this.setupEventListeners();
    this.updateProgress();
    this.updateSubmitButton();
  }

  setupEventListeners() {
    // Save on change
    this.form.addEventListener('input', () => {
      this.saveToStorage();
      this.updateProgress();
      this.updateSubmitButton();
    });

    // Validate on submit
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.validate()) {
        this.onValidSubmit();
      }
    });
  }

  loadFromStorage() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      Object.entries(data.fields || {}).forEach(([name, value]) => {
        const field = this.form.elements[name];
        if (!field) return;

        if (field.type === 'radio' || field.length) {
          const radio = this.form.querySelector(`[name="${name}"][value="${value}"]`);
          if (radio) radio.checked = true;
        } else {
          field.value = value;
        }
      });
    } catch (e) {
      console.error('Error loading form data:', e);
    }
  }

  saveToStorage() {
    const formData = new FormData(this.form);
    const data = {
      scenario_id: this.form.dataset.scenarioId || 'unknown',
      timestamp: new Date().toISOString(),
      fields: Object.fromEntries(formData.entries())
    };
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  clearStorage() {
    localStorage.removeItem(this.storageKey);
  }

  updateProgress() {
    const formData = new FormData(this.form);
    let completed = 0;

    formData.forEach((value, key) => {
      if (value && value.toString().trim()) completed++;
    });

    const progressEl = this.form.querySelector('.ndx-form-progress-count');
    if (progressEl) {
      progressEl.textContent = Math.min(completed, this.totalFields);
    }

    const progressBar = this.form.querySelector('.ndx-form-progress-bar');
    if (progressBar) {
      const percent = (completed / this.totalFields) * 100;
      progressBar.style.width = `${Math.min(percent, 100)}%`;
    }
  }

  validate() {
    this.clearErrors();
    const errors = [];

    // Check required fields
    this.requiredFields.forEach(fieldName => {
      const field = this.form.elements[fieldName];
      let value = '';

      if (field) {
        if (field.type === 'radio' || field.length) {
          // Radio group
          const checked = this.form.querySelector(`[name="${fieldName}"]:checked`);
          value = checked ? checked.value : '';
        } else {
          value = field.value.trim();
        }
      }

      if (!value) {
        errors.push({
          field: fieldName,
          message: this.getErrorMessage(fieldName, 'required')
        });
      }
    });

    // Validate email format if provided
    const emailField = this.form.elements['email'];
    if (emailField && emailField.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailField.value.trim())) {
        errors.push({
          field: 'email',
          message: 'Enter a valid email address'
        });
      }
    }

    if (errors.length > 0) {
      this.showErrors(errors);
      return false;
    }

    return true;
  }

  getErrorMessage(fieldName, type) {
    const messages = {
      what_surprised: {
        required: 'Enter what surprised you about this scenario'
      },
      would_implement: {
        required: 'Select whether you would implement this'
      },
      likelihood_proceed: {
        required: 'Select how likely you are to proceed'
      }
    };

    return messages[fieldName]?.[type] || 'This field is required';
  }

  showErrors(errors) {
    // Create error summary
    const summaryHtml = `
      <div class="govuk-error-summary" data-module="govuk-error-summary" tabindex="-1" role="alert">
        <h2 class="govuk-error-summary__title">There is a problem</h2>
        <div class="govuk-error-summary__body">
          <ul class="govuk-list govuk-error-summary__list">
            ${errors.map(e => `
              <li><a href="#${e.field.replace(/_/g, '-')}">${e.message}</a></li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;

    // Insert error summary before form
    const existingSummary = this.form.parentNode.querySelector('.govuk-error-summary');
    if (existingSummary) existingSummary.remove();

    this.form.insertAdjacentHTML('beforebegin', summaryHtml);

    // Add error to each field
    errors.forEach(error => {
      const fieldId = error.field.replace(/_/g, '-');
      const group = this.form.querySelector(`#${fieldId}-group`);

      if (group) {
        group.classList.add('govuk-form-group--error');

        const errorSpan = document.createElement('p');
        errorSpan.className = 'govuk-error-message';
        errorSpan.id = `${fieldId}-error`;
        errorSpan.innerHTML = `<span class="govuk-visually-hidden">Error:</span> ${error.message}`;

        const existingError = group.querySelector('.govuk-error-message');
        if (existingError) existingError.remove();

        const input = group.querySelector('input, textarea, fieldset');
        if (input) {
          input.parentNode.insertBefore(errorSpan, input);

          // Add aria-describedby
          const describedBy = input.getAttribute('aria-describedby') || '';
          const newDescribedBy = describedBy ? `${describedBy} ${errorSpan.id}` : errorSpan.id;
          input.setAttribute('aria-describedby', newDescribedBy);
        }
      }
    });

    // Focus first error
    const summary = this.form.parentNode.querySelector('.govuk-error-summary');
    if (summary) summary.focus();
  }

  clearErrors() {
    const summary = this.form.parentNode.querySelector('.govuk-error-summary');
    if (summary) summary.remove();

    this.form.querySelectorAll('.govuk-form-group--error').forEach(group => {
      group.classList.remove('govuk-form-group--error');
    });

    this.form.querySelectorAll('.govuk-error-message').forEach(error => {
      error.remove();
    });

    // Clean up aria-describedby attributes
    this.form.querySelectorAll('[aria-describedby]').forEach(el => {
      const describedBy = el.getAttribute('aria-describedby');
      if (describedBy && describedBy.includes('-error')) {
        const cleaned = describedBy.replace(/\s*\w+-error\s*/g, '').trim();
        if (cleaned) {
          el.setAttribute('aria-describedby', cleaned);
        } else {
          el.removeAttribute('aria-describedby');
        }
      }
    });
  }

  updateSubmitButton() {
    const submitBtn = this.form.querySelector('[type="submit"]');
    if (!submitBtn) return;

    let isValid = true;
    this.requiredFields.forEach(fieldName => {
      const field = this.form.elements[fieldName];
      let value = '';

      if (field) {
        if (field.type === 'radio' || field.length) {
          const checked = this.form.querySelector(`[name="${fieldName}"]:checked`);
          value = checked ? checked.value : '';
        } else {
          value = field.value.trim();
        }
      }

      if (!value) isValid = false;
    });

    submitBtn.disabled = !isValid;

    // Update visual state
    const wrapper = submitBtn.closest('.ndx-form-submit');
    if (wrapper) {
      wrapper.classList.toggle('ndx-form-submit--ready', isValid);
    }
  }

  onValidSubmit() {
    // Track analytics
    if (typeof gtag === 'function') {
      gtag('event', 'reflection_form_completed', {
        scenario_id: this.form.dataset.scenarioId || 'unknown'
      });
    }

    // Show persona selection
    const personaSection = document.querySelector('.ndx-persona-selection');
    if (personaSection) {
      personaSection.hidden = false;
      personaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Update UI
    const submitBtn = this.form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = 'Form complete - Select persona below';
      submitBtn.disabled = true;
    }

    // Show success message
    const successHtml = `
      <div class="govuk-notification-banner govuk-notification-banner--success" role="alert" aria-labelledby="govuk-notification-banner-title" data-module="govuk-notification-banner">
        <div class="govuk-notification-banner__header">
          <h2 class="govuk-notification-banner__title" id="govuk-notification-banner-title">
            Success
          </h2>
        </div>
        <div class="govuk-notification-banner__content">
          <h3 class="govuk-notification-banner__heading">
            Thank you for sharing your evaluation
          </h3>
          <p class="govuk-body">Now select your role below to generate your personalized Evidence Pack.</p>
        </div>
      </div>
    `;

    const existingSuccess = this.form.parentNode.querySelector('.govuk-notification-banner--success');
    if (!existingSuccess) {
      this.form.insertAdjacentHTML('beforebegin', successHtml);
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#reflection-form');
  if (form) {
    window.reflectionForm = new ReflectionForm(form);
  }
});
