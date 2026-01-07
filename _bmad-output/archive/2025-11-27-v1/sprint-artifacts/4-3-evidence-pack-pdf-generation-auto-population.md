# Story 4-3: Evidence Pack PDF Generation & Auto-Population

**Epic:** 4 - Evidence Generation & Committee-Ready Artifacts
**Status:** Drafted
**Priority:** High (integrates templates + form into downloadable PDF)

## User Story

As a **council evaluator** who has completed the reflection form,
I want **to generate a downloadable PDF Evidence Pack tailored to my role**
So that **I can present committee-ready documentation for procurement decisions**.

## Background

This story implements client-side PDF generation using html2pdf.js. The Evidence Pack combines:
- Scenario metadata from scenarios.yaml
- User responses from the reflection form (localStorage)
- Persona-specific sections from templates (Story 4-1)

The PDF generation happens entirely client-side, keeping data local for privacy and avoiding server infrastructure.

## Acceptance Criteria

### AC 4.3.1: PDF Generation Performance
- [ ] PDF generates within 5 seconds of button click
- [ ] Stopwatch measurement from click to download prompt

### AC 4.3.2: Form Response Integration
- [ ] PDF includes form responses quoted in Evaluation Summary section
- [ ] what_surprised, would_implement, concerns visible in PDF

### AC 4.3.3: Scenario Metadata
- [ ] PDF includes scenario metadata (name, AWS services, cost, time)
- [ ] Scenario data visible in PDF header and relevant sections

### AC 4.3.4: Persona-Specific Content
- [ ] CTO PDF includes Architecture & Security sections
- [ ] Service Manager PDF includes Resident Impact sections
- [ ] Finance PDF includes Cost Analysis sections
- [ ] Developer PDF includes Technical Implementation sections

### AC 4.3.5: PDF Filename Convention
- [ ] PDF filename follows pattern: `evidence-pack-{scenario}-{persona}-{date}.pdf`
- [ ] Downloaded file has correct name format

### AC 4.3.6: PDF File Size
- [ ] PDF file size <2MB
- [ ] File size check passes

### AC 4.3.7: Cross-Browser Compatibility
- [ ] PDF renders correctly in Chrome, Firefox, Safari, Edge
- [ ] Cross-browser testing passes

### AC 4.3.8: A4 Print Compatibility
- [ ] PDF prints correctly on A4 paper without overflow
- [ ] Print test passes

### AC 4.3.9: Success Confirmation
- [ ] Success confirmation banner visible after download
- [ ] Clear next actions shown

### AC 4.3.10: Analytics Event
- [ ] `evidence_pack_generated` event fires with scenario_id and persona
- [ ] GA event capture verified

### AC 4.3.11: Fallback HTML Print View
- [ ] "View printable version" link available if PDF generation fails
- [ ] HTML version suitable for browser print

### AC 4.3.16: Loading State
- [ ] Loading state with progress indicator visible during generation
- [ ] Shows time estimate ("Generating... ~5 seconds")

## Technical Implementation

### File Structure
```
src/
├── assets/
│   └── js/
│       └── evidence-pack-generator.js  # Client-side PDF generation
└── evidence-pack/
    └── index.njk                       # Updated with PDF generation
```

### JavaScript Module
```javascript
// src/assets/js/evidence-pack-generator.js
class EvidencePackGenerator {
  constructor() {
    this.html2pdfLoaded = false;
  }

  async loadHtml2Pdf() {
    if (!this.html2pdfLoaded) {
      // Dynamic import of html2pdf.js from CDN
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      await new Promise((resolve) => {
        script.onload = resolve;
        document.head.appendChild(script);
      });
      this.html2pdfLoaded = true;
    }
  }

  async generate(scenarioId, persona) {
    await this.loadHtml2Pdf();

    const formData = this.getFormData();
    const element = document.querySelector('.ndx-evidence-pack-preview');

    const options = {
      margin: 10,
      filename: `evidence-pack-${scenarioId}-${persona}-${this.getDate()}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(options).from(element).save();
  }

  getFormData() {
    const saved = localStorage.getItem('ndx_reflection_form');
    return saved ? JSON.parse(saved) : {};
  }

  getDate() {
    return new Date().toISOString().split('T')[0];
  }
}
```

### Dependencies

- html2pdf.js v0.10.1 (loaded from CDN)
- Story 4-1 templates (complete)
- Story 4-2 form (complete)

## Definition of Done

- [ ] All 12 core acceptance criteria pass
- [ ] PDF generates successfully with form data
- [ ] Analytics event fires on generation
- [ ] pa11y accessibility tests pass
- [ ] Code review approved

## Notes

- Client-side generation keeps data local (privacy)
- No server infrastructure required
- html2pdf.js loaded dynamically to avoid bundle bloat
- Fallback to browser print for locked-down environments
