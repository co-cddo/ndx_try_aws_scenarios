/**
 * Evidence Pack PDF Generator
 * Story 2.9: Basic Evidence Pack Generation
 *
 * Generates GOV.UK-styled PDF evidence packs for council officers
 * to share with stakeholders and committees.
 *
 * Uses jsPDF loaded from CDN to avoid bundler complexity in 11ty.
 */

const GOV_UK_STYLES = {
  primaryColor: [0, 112, 60], // GOV.UK green #00703c
  secondaryColor: [29, 112, 184], // GOV.UK blue #1d70b8
  textColor: [11, 12, 12], // GOV.UK text #0b0c0c
  headerFont: 'helvetica',
  bodyFont: 'helvetica',
  margin: 20,
  lineHeight: 7,
};

export class EvidencePackGenerator {
  constructor(styles = GOV_UK_STYLES) {
    // jsPDF will be loaded from CDN
    if (typeof window !== 'undefined' && window.jspdf) {
      const { jsPDF } = window.jspdf;
      this.pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
    } else {
      throw new Error('jsPDF not loaded. Ensure jsPDF CDN script is included.');
    }

    this.styles = styles;
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - 2 * this.styles.margin;
    this.yPosition = this.styles.margin;
  }

  setTextColor(color) {
    this.pdf.setTextColor(color[0], color[1], color[2]);
  }

  setFillColor(color) {
    this.pdf.setFillColor(color[0], color[1], color[2]);
  }

  checkPageBreak(requiredSpace) {
    if (this.yPosition + requiredSpace > this.pageHeight - this.styles.margin) {
      this.pdf.addPage();
      this.yPosition = this.styles.margin;
    }
  }

  addHeader(data) {
    // Header bar
    this.setFillColor(this.styles.primaryColor);
    this.pdf.rect(0, 0, this.pageWidth, 35, 'F');

    // Title
    this.pdf.setFontSize(24);
    this.pdf.setFont(this.styles.headerFont, 'bold');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.text('Evidence Pack', this.styles.margin, 18);

    // Subtitle
    this.pdf.setFontSize(12);
    this.pdf.setFont(this.styles.bodyFont, 'normal');
    this.pdf.text(`${data.scenarioName} Evaluation`, this.styles.margin, 28);

    // NDX:Try branding
    this.pdf.setFontSize(10);
    this.pdf.text('NDX:Try AWS Scenarios', this.pageWidth - this.styles.margin - 50, 18);

    this.yPosition = 45;
  }

  addSection(title) {
    this.checkPageBreak(20);

    // Section header bar
    this.setFillColor(this.styles.secondaryColor);
    this.pdf.rect(this.styles.margin, this.yPosition, this.contentWidth, 8, 'F');

    // Section title
    this.pdf.setFontSize(12);
    this.pdf.setFont(this.styles.headerFont, 'bold');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.text(title, this.styles.margin + 3, this.yPosition + 5.5);

    this.yPosition += 14;
  }

  addLabelValue(label, value, indent = 0) {
    this.checkPageBreak(10);

    const x = this.styles.margin + indent;
    const labelWidth = 50;

    // Label
    this.pdf.setFontSize(10);
    this.pdf.setFont(this.styles.bodyFont, 'bold');
    this.setTextColor(this.styles.textColor);
    this.pdf.text(label, x, this.yPosition);

    // Value (with text wrapping for long content)
    this.pdf.setFont(this.styles.bodyFont, 'normal');
    const valueX = x + labelWidth;
    const valueWidth = this.contentWidth - labelWidth - indent;

    const lines = this.pdf.splitTextToSize(value, valueWidth);
    this.pdf.text(lines, valueX, this.yPosition);

    this.yPosition += this.styles.lineHeight * Math.max(1, lines.length);
  }

  addParagraph(text) {
    this.checkPageBreak(15);

    this.pdf.setFontSize(10);
    this.pdf.setFont(this.styles.bodyFont, 'normal');
    this.setTextColor(this.styles.textColor);

    const lines = this.pdf.splitTextToSize(text, this.contentWidth);
    this.pdf.text(lines, this.styles.margin, this.yPosition);

    this.yPosition += this.styles.lineHeight * lines.length + 3;
  }

  addImage(base64Data, caption, maxWidth = 170, maxHeight = 80) {
    this.checkPageBreak(maxHeight + 15);

    try {
      // Determine image format from base64 header
      const format = base64Data.includes('data:image/png') ? 'PNG' : 'JPEG';
      const imageData = base64Data.includes('base64,')
        ? base64Data.split('base64,')[1]
        : base64Data;

      // Add image centered
      const imageX = this.styles.margin + (this.contentWidth - maxWidth) / 2;
      this.pdf.addImage(imageData, format, imageX, this.yPosition, maxWidth, maxHeight);

      this.yPosition += maxHeight + 3;

      // Caption
      this.pdf.setFontSize(9);
      this.pdf.setFont(this.styles.bodyFont, 'italic');
      this.setTextColor([80, 90, 95]); // Grey caption color
      const captionWidth = this.pdf.getTextWidth(caption);
      const captionX = this.styles.margin + (this.contentWidth - captionWidth) / 2;
      this.pdf.text(caption, captionX, this.yPosition);

      this.yPosition += 10;
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      // Add placeholder text if image fails
      this.pdf.setFontSize(10);
      this.pdf.setFont(this.styles.bodyFont, 'italic');
      this.setTextColor([150, 150, 150]);
      this.pdf.text(`[${caption} - Image not available]`, this.styles.margin, this.yPosition);
      this.yPosition += 10;
    }
  }

  addNotesBox() {
    this.checkPageBreak(50);

    // Draw box
    this.pdf.setDrawColor(180, 180, 180);
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(this.styles.margin, this.yPosition, this.contentWidth, 40);

    // Box label
    this.pdf.setFontSize(9);
    this.pdf.setFont(this.styles.bodyFont, 'bold');
    this.setTextColor([100, 100, 100]);
    this.pdf.text('Additional Notes:', this.styles.margin + 3, this.yPosition + 6);

    this.yPosition += 45;
  }

  addFooter(data) {
    const footerY = this.pageHeight - 15;
    const pageCount = this.pdf.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);

      // Footer line
      this.pdf.setDrawColor(180, 180, 180);
      this.pdf.setLineWidth(0.3);
      this.pdf.line(
        this.styles.margin,
        footerY - 5,
        this.pageWidth - this.styles.margin,
        footerY - 5
      );

      // Footer text
      this.pdf.setFontSize(8);
      this.pdf.setFont(this.styles.bodyFont, 'normal');
      this.setTextColor([100, 100, 100]);

      const dateStr = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      this.pdf.text(`Generated: ${dateStr}`, this.styles.margin, footerY);
      this.pdf.text(
        'NDX:Try AWS Scenarios - try.ndx.gov.uk',
        this.pageWidth - this.styles.margin - 60,
        footerY
      );

      // Page number
      this.pdf.text(`Page ${i} of ${pageCount}`, this.pageWidth / 2 - 10, footerY);
    }
  }

  generate(data) {
    // Header
    this.addHeader(data);

    // Evaluation Summary Section
    this.addSection('Evaluation Summary');
    this.addLabelValue('Scenario:', data.scenarioName);
    this.addLabelValue('Evaluation Date:', data.evaluationDate);
    this.addLabelValue('Evaluator:', `${data.evaluatorName} - ${data.evaluatorRole}`);
    this.addLabelValue('Council:', data.councilName);
    this.yPosition += 5;

    // Deployment Details Section
    this.addSection('Deployment Details');
    this.addLabelValue('Drupal Site URL:', data.drupalUrl);
    this.addLabelValue('AWS Region:', data.awsRegion);
    this.addLabelValue('Deployment Time:', data.deploymentTime);
    this.addLabelValue('Estimated Cost:', data.estimatedCost);
    this.yPosition += 5;

    // Screenshots Section
    if (data.screenshots?.homepage || data.screenshots?.adminDashboard) {
      this.addSection('Screenshots');

      if (data.screenshots.homepage) {
        this.addImage(data.screenshots.homepage, 'Homepage with sample council content');
      }

      if (data.screenshots.adminDashboard) {
        this.addImage(data.screenshots.adminDashboard, 'Drupal admin dashboard');
      }
    }

    // Observations Section
    this.addSection('Observations & Notes');
    if (data.observations && data.observations.trim()) {
      this.addParagraph(data.observations);
    } else {
      this.addNotesBox();
    }

    // Next Steps Section
    this.addSection('Recommended Next Steps');
    this.addParagraph(
      '1. Share this evidence pack with your IT leadership team and relevant stakeholders.'
    );
    this.addParagraph(
      '2. Schedule a follow-up session to explore AI-powered features (content editing, accessibility enhancements).'
    );
    this.addParagraph(
      '3. Contact your AWS account team or NDX partner for production implementation guidance.'
    );
    this.addParagraph('4. Review the cleanup instructions to delete demo resources and stop costs.');

    // Footer on all pages
    this.addFooter(data);

    return this.pdf;
  }

  download(data, filename) {
    this.generate(data);

    const defaultFilename = `evidence-pack-${data.scenarioId}-${data.evaluationDate.replace(/\//g, '-')}.pdf`;
    this.pdf.save(filename || defaultFilename);
  }

  getBlob(data) {
    this.generate(data);
    return this.pdf.output('blob');
  }
}

// Factory function for easy instantiation
export function createEvidencePackGenerator() {
  return new EvidencePackGenerator();
}

// Helper to collect data from session storage
export function collectSessionData(scenarioId) {
  const deploymentData = sessionStorage.getItem(`ndx-deployment-${scenarioId}`);

  let parsed = {};
  if (deploymentData) {
    try {
      parsed = JSON.parse(deploymentData);
    } catch {
      // Ignore parse errors
    }
  }

  return {
    scenarioId,
    drupalUrl: parsed.drupalUrl || '',
    awsRegion: parsed.region || 'us-east-1',
    deploymentTime: parsed.deploymentTime || 'Unknown',
    evaluationDate: new Date().toLocaleDateString('en-GB'),
  };
}
