/**
 * Evidence Pack PDF Generator
 * Story 4-3: Client-side PDF generation using html2pdf.js
 *
 * Progressive enhancement approach:
 * - Feature detection
 * - Graceful fallback to print
 * - Client-side only (data stays local)
 */

class EvidencePackGenerator {
  constructor() {
    this.html2pdfLoaded = false;
    this.isGenerating = false;
  }

  /**
   * AC 4.3.7: Dynamically load html2pdf.js from CDN
   * Only loads once, cached for subsequent generations
   */
  async loadHtml2Pdf() {
    if (this.html2pdfLoaded) {
      return true;
    }

    return new Promise((resolve, reject) => {
      // Check if already loaded globally
      if (window.html2pdf) {
        this.html2pdfLoaded = true;
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.integrity = 'sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLF7QnIg==';
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';

      script.onload = () => {
        this.html2pdfLoaded = true;
        resolve(true);
      };

      script.onerror = () => {
        console.error('Failed to load html2pdf.js from CDN');
        reject(new Error('Failed to load PDF library'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * AC 4.3.2: Get form data from localStorage
   */
  getFormData() {
    const saved = localStorage.getItem('ndx_reflection_form');
    return saved ? JSON.parse(saved) : {};
  }

  /**
   * AC 4.3.5: Generate date string for filename
   */
  getDate() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * AC 4.3.16: Show loading state with progress indicator
   */
  showLoading() {
    const button = document.querySelector('[data-pdf-generate]');
    const loadingContainer = document.querySelector('[data-pdf-loading]');

    if (button) {
      button.disabled = true;
      button.textContent = 'Generating PDF...';
    }

    if (loadingContainer) {
      loadingContainer.hidden = false;
    }
  }

  /**
   * AC 4.3.16: Hide loading state
   */
  hideLoading() {
    const button = document.querySelector('[data-pdf-generate]');
    const loadingContainer = document.querySelector('[data-pdf-loading]');

    if (button) {
      button.disabled = false;
      button.textContent = 'Generate PDF';
    }

    if (loadingContainer) {
      loadingContainer.hidden = true;
    }
  }

  /**
   * AC 4.3.9: Show success confirmation
   */
  showSuccess() {
    const successBanner = document.querySelector('[data-pdf-success]');
    if (successBanner) {
      successBanner.hidden = false;

      // Auto-hide after 10 seconds
      setTimeout(() => {
        successBanner.hidden = true;
      }, 10000);

      // Scroll to success banner
      successBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * AC 4.3.10: Track analytics event
   */
  trackAnalytics(scenarioId, persona) {
    // Use NDXAnalytics module if available
    if (window.NDXAnalytics) {
      window.NDXAnalytics.trackEvidencePackDownloaded(scenarioId, persona);
    } else if (window.gtag) {
      // Fallback to direct gtag call
      window.gtag('event', 'evidence_pack_generated', {
        scenario_id: scenarioId,
        persona: persona,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * AC 4.3.11: Fallback to browser print
   */
  fallbackToPrint() {
    const printableView = document.querySelector('.ndx-evidence-pack-preview');
    if (printableView) {
      // Hide non-print elements
      document.querySelectorAll('.ndx-print-hide').forEach(el => {
        el.style.display = 'none';
      });

      // Trigger browser print
      window.print();

      // Restore non-print elements
      setTimeout(() => {
        document.querySelectorAll('.ndx-print-hide').forEach(el => {
          el.style.display = '';
        });
      }, 100);
    }
  }

  /**
   * AC 4.3.1, 4.3.3, 4.3.4, 4.3.5, 4.3.6, 4.3.8: Generate PDF
   *
   * @param {string} scenarioId - Scenario identifier (e.g., "council-chatbot")
   * @param {string} persona - User persona (e.g., "cto", "service-manager")
   * @returns {Promise<void>}
   */
  async generate(scenarioId, persona) {
    // Prevent multiple simultaneous generations
    if (this.isGenerating) {
      return;
    }

    this.isGenerating = true;
    this.showLoading();

    try {
      // AC 4.3.1: Start performance measurement
      const startTime = performance.now();

      // Load html2pdf.js if not already loaded
      await this.loadHtml2Pdf();

      // Get the evidence pack preview element
      const element = document.querySelector('.ndx-evidence-pack-preview');
      if (!element) {
        throw new Error('Evidence pack preview not found');
      }

      // Clone element and prepare for PDF
      const clonedElement = element.cloneNode(true);

      // Remove any interactive elements from clone
      clonedElement.querySelectorAll('.ndx-print-hide').forEach(el => {
        el.remove();
      });

      // AC 4.3.5: Generate filename
      const filename = `evidence-pack-${scenarioId}-${persona}-${this.getDate()}.pdf`;

      // AC 4.3.8: Configure for A4 print compatibility
      const options = {
        margin: [10, 10, 10, 10], // mm: top, right, bottom, left
        filename: filename,
        image: {
          type: 'jpeg',
          quality: 0.95
        },
        html2canvas: {
          scale: 2, // High quality
          useCORS: true,
          letterRendering: true
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true // AC 4.3.6: Keep file size under 2MB
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.ndx-evidence-pack__section'
        }
      };

      // Generate and download PDF
      await window.html2pdf().set(options).from(clonedElement).save();

      // AC 4.3.1: Check performance (target: <5 seconds)
      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000;
      console.log(`PDF generated in ${duration.toFixed(2)} seconds`);

      // AC 4.3.10: Track analytics
      this.trackAnalytics(scenarioId, persona);

      // AC 4.3.9: Show success confirmation
      this.showSuccess();

    } catch (error) {
      console.error('PDF generation failed:', error);

      // Show error message
      alert('PDF generation failed. Please try using your browser\'s Print function (Ctrl+P or Cmd+P) to save as PDF.');

      // AC 4.3.11: Fallback to browser print
      this.fallbackToPrint();
    } finally {
      this.isGenerating = false;
      this.hideLoading();
    }
  }
}

// Initialize generator when DOM is ready
let evidencePackGenerator;

document.addEventListener('DOMContentLoaded', function() {
  evidencePackGenerator = new EvidencePackGenerator();

  // Attach to generate button
  const generateButton = document.querySelector('[data-pdf-generate]');
  if (generateButton) {
    generateButton.addEventListener('click', function() {
      const scenarioId = this.dataset.scenarioId || 'council-chatbot';
      const persona = this.dataset.persona || 'cto';

      evidencePackGenerator.generate(scenarioId, persona);
    });
  }

  // Attach to persona selection to update button data
  const personaRadios = document.querySelectorAll('input[name="persona"]');
  if (personaRadios.length > 0) {
    personaRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        const generateButton = document.querySelector('[data-pdf-generate]');
        if (generateButton) {
          generateButton.dataset.persona = this.value;
        }
      });
    });
  }
});
