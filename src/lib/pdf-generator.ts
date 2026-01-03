/**
 * Evidence Pack PDF Generator
 * Story 2.9: Basic Evidence Pack Generation
 *
 * Generates GOV.UK-styled PDF evidence packs for council officers
 * to share with stakeholders and committees.
 */

import jsPDF from 'jspdf';

export interface EvidencePackData {
  scenarioName: string;
  scenarioId: string;
  evaluationDate: string;
  evaluatorName: string;
  evaluatorRole: string;
  councilName: string;
  drupalUrl: string;
  awsRegion: string;
  estimatedCost: string;
  deploymentTime: string;
  observations: string;
  screenshots?: {
    homepage?: string; // Base64 encoded image
    adminDashboard?: string; // Base64 encoded image
  };
  // Enhanced Evidence Pack fields (Story 6.7)
  aiFeatures?: {
    contentEditing?: boolean;
    simplification?: boolean;
    altText?: boolean;
    tts?: boolean;
    translation?: boolean;
    pdfConversion?: boolean;
  };
  aiObservations?: string;
  councilIdentity?: {
    name: string;
    region: string;
    theme: string;
    population: string;
  };
  beforeAfterExamples?: Array<{
    original: string;
    simplified: string;
    improvement: string;
  }>;
  altTextSamples?: Array<{
    imageDescription: string;
    generatedAltText: string;
  }>;
}

export interface PDFStyles {
  primaryColor: [number, number, number];
  secondaryColor: [number, number, number];
  textColor: [number, number, number];
  headerFont: string;
  bodyFont: string;
  margin: number;
  lineHeight: number;
}

const GOV_UK_STYLES: PDFStyles = {
  primaryColor: [0, 112, 60], // GOV.UK green #00703c
  secondaryColor: [29, 112, 184], // GOV.UK blue #1d70b8
  textColor: [11, 12, 12], // GOV.UK text #0b0c0c
  headerFont: 'helvetica',
  bodyFont: 'helvetica',
  margin: 20,
  lineHeight: 7,
};

export class EvidencePackGenerator {
  private pdf: jsPDF;
  private styles: PDFStyles;
  private yPosition: number;
  private pageWidth: number;
  private pageHeight: number;
  private contentWidth: number;

  constructor(styles: PDFStyles = GOV_UK_STYLES) {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    this.styles = styles;
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - 2 * this.styles.margin;
    this.yPosition = this.styles.margin;
  }

  private setTextColor(color: [number, number, number]): void {
    this.pdf.setTextColor(color[0], color[1], color[2]);
  }

  private setFillColor(color: [number, number, number]): void {
    this.pdf.setFillColor(color[0], color[1], color[2]);
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.yPosition + requiredSpace > this.pageHeight - this.styles.margin) {
      this.pdf.addPage();
      this.yPosition = this.styles.margin;
    }
  }

  private addHeader(data: EvidencePackData): void {
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

  private addSection(title: string): void {
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

  private addLabelValue(label: string, value: string, indent: number = 0): void {
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

  private addParagraph(text: string): void {
    this.checkPageBreak(15);

    this.pdf.setFontSize(10);
    this.pdf.setFont(this.styles.bodyFont, 'normal');
    this.setTextColor(this.styles.textColor);

    const lines = this.pdf.splitTextToSize(text, this.contentWidth);
    this.pdf.text(lines, this.styles.margin, this.yPosition);

    this.yPosition += this.styles.lineHeight * lines.length + 3;
  }

  private addImage(
    base64Data: string,
    caption: string,
    maxWidth: number = 170,
    maxHeight: number = 80
  ): void {
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

  private addNotesBox(): void {
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

  // Enhanced Evidence Pack methods (Story 6.7)

  private addAiFeaturesSection(data: EvidencePackData): void {
    if (!data.aiFeatures) return;

    this.addSection('AI Features Explored');

    const features = [
      { key: 'contentEditing', name: 'AI Content Editing', desc: 'Bedrock-powered writing assistance in CKEditor' },
      { key: 'simplification', name: 'Readability Simplification', desc: 'One-click plain English rewrite' },
      { key: 'altText', name: 'Auto Alt-Text', desc: 'WCAG-compliant image descriptions via AI vision' },
      { key: 'tts', name: 'Text-to-Speech', desc: 'Amazon Polly neural voices in 7 languages' },
      { key: 'translation', name: 'Content Translation', desc: 'Amazon Translate for 75+ languages' },
      { key: 'pdfConversion', name: 'PDF-to-Web Conversion', desc: 'Textract + Bedrock for accessible documents' },
    ];

    for (const feature of features) {
      const used = data.aiFeatures[feature.key as keyof typeof data.aiFeatures];
      this.checkPageBreak(12);

      // Checkmark or empty box
      const checkSymbol = used ? '[X]' : '[ ]';
      this.pdf.setFontSize(10);
      this.pdf.setFont(this.styles.bodyFont, 'normal');
      this.setTextColor(used ? this.styles.primaryColor : [150, 150, 150]);
      this.pdf.text(checkSymbol, this.styles.margin, this.yPosition);

      // Feature name
      this.pdf.setFont(this.styles.bodyFont, used ? 'bold' : 'normal');
      this.setTextColor(this.styles.textColor);
      this.pdf.text(feature.name, this.styles.margin + 12, this.yPosition);

      // Feature description
      this.pdf.setFont(this.styles.bodyFont, 'normal');
      this.setTextColor([80, 90, 95]);
      this.pdf.setFontSize(8);
      this.pdf.text(`- ${feature.desc}`, this.styles.margin + 60, this.yPosition);

      this.yPosition += this.styles.lineHeight;
    }

    // AI observations
    if (data.aiObservations && data.aiObservations.trim()) {
      this.yPosition += 5;
      this.pdf.setFontSize(10);
      this.pdf.setFont(this.styles.bodyFont, 'bold');
      this.setTextColor(this.styles.textColor);
      this.pdf.text('AI Feature Observations:', this.styles.margin, this.yPosition);
      this.yPosition += this.styles.lineHeight;

      this.addParagraph(data.aiObservations);
    }

    this.yPosition += 5;
  }

  private addCouncilIdentitySection(data: EvidencePackData): void {
    if (!data.councilIdentity) return;

    this.addSection('Generated Council Identity');

    this.addLabelValue('Council Name:', data.councilIdentity.name);
    this.addLabelValue('Region:', data.councilIdentity.region);
    this.addLabelValue('Theme:', data.councilIdentity.theme);
    this.addLabelValue('Population:', data.councilIdentity.population);

    this.yPosition += 5;
  }

  private addBeforeAfterSection(data: EvidencePackData): void {
    if (!data.beforeAfterExamples || data.beforeAfterExamples.length === 0) return;

    this.addSection('Content Simplification Examples');

    for (let i = 0; i < Math.min(data.beforeAfterExamples.length, 2); i++) {
      const example = data.beforeAfterExamples[i];
      this.checkPageBreak(40);

      // Before
      this.pdf.setFontSize(9);
      this.pdf.setFont(this.styles.bodyFont, 'bold');
      this.setTextColor([180, 50, 50]); // Red-ish for "before"
      this.pdf.text('BEFORE:', this.styles.margin, this.yPosition);
      this.yPosition += 5;

      this.pdf.setFont(this.styles.bodyFont, 'normal');
      this.setTextColor(this.styles.textColor);
      const beforeLines = this.pdf.splitTextToSize(example.original, this.contentWidth - 10);
      this.pdf.text(beforeLines, this.styles.margin + 5, this.yPosition);
      this.yPosition += beforeLines.length * 4 + 3;

      // After
      this.pdf.setFont(this.styles.bodyFont, 'bold');
      this.setTextColor(this.styles.primaryColor); // Green for "after"
      this.pdf.text('AFTER:', this.styles.margin, this.yPosition);
      this.yPosition += 5;

      this.pdf.setFont(this.styles.bodyFont, 'normal');
      this.setTextColor(this.styles.textColor);
      const afterLines = this.pdf.splitTextToSize(example.simplified, this.contentWidth - 10);
      this.pdf.text(afterLines, this.styles.margin + 5, this.yPosition);
      this.yPosition += afterLines.length * 4 + 3;

      // Improvement
      this.pdf.setFont(this.styles.bodyFont, 'italic');
      this.setTextColor([80, 90, 95]);
      this.pdf.text(`Improvement: ${example.improvement}`, this.styles.margin, this.yPosition);
      this.yPosition += this.styles.lineHeight + 5;
    }
  }

  private addAltTextSection(data: EvidencePackData): void {
    if (!data.altTextSamples || data.altTextSamples.length === 0) return;

    this.addSection('Generated Alt-Text Samples');

    for (let i = 0; i < Math.min(data.altTextSamples.length, 3); i++) {
      const sample = data.altTextSamples[i];
      this.checkPageBreak(20);

      // Image description
      this.pdf.setFontSize(9);
      this.pdf.setFont(this.styles.bodyFont, 'bold');
      this.setTextColor(this.styles.textColor);
      this.pdf.text(`Image ${i + 1}:`, this.styles.margin, this.yPosition);

      this.pdf.setFont(this.styles.bodyFont, 'normal');
      this.pdf.text(sample.imageDescription, this.styles.margin + 20, this.yPosition);
      this.yPosition += 5;

      // Generated alt text
      this.pdf.setFont(this.styles.bodyFont, 'italic');
      this.setTextColor(this.styles.primaryColor);
      const altLines = this.pdf.splitTextToSize(`Alt: "${sample.generatedAltText}"`, this.contentWidth - 10);
      this.pdf.text(altLines, this.styles.margin + 5, this.yPosition);
      this.yPosition += altLines.length * 4 + 5;
    }
  }

  private addRoiSection(): void {
    this.addSection('ROI Talking Points');

    const roiPoints = [
      { feature: 'AI Content Editing', benefit: '50% faster content creation', metric: 'Hours saved per week' },
      { feature: 'Readability Tools', benefit: 'GDS plain English compliance', metric: 'Automatic style guide adherence' },
      { feature: 'Auto Alt-Text', benefit: '100% image accessibility', metric: 'WCAG 2.2 compliance achieved' },
      { feature: 'Text-to-Speech', benefit: 'Inclusive access for all users', metric: '7 neural voice languages' },
      { feature: 'Translation', benefit: 'Serving diverse communities', metric: '75+ languages supported' },
      { feature: 'PDF Conversion', benefit: 'Document accessibility', metric: 'EAA June 2025 compliance' },
    ];

    for (const point of roiPoints) {
      this.checkPageBreak(15);

      this.pdf.setFontSize(10);
      this.pdf.setFont(this.styles.bodyFont, 'bold');
      this.setTextColor(this.styles.textColor);
      this.pdf.text(point.feature, this.styles.margin, this.yPosition);

      this.pdf.setFont(this.styles.bodyFont, 'normal');
      this.setTextColor([80, 90, 95]);
      this.pdf.text(`- ${point.benefit}`, this.styles.margin + 50, this.yPosition);

      this.pdf.setFontSize(8);
      this.pdf.setFont(this.styles.bodyFont, 'italic');
      this.pdf.text(`(${point.metric})`, this.styles.margin + 120, this.yPosition);

      this.yPosition += this.styles.lineHeight;
    }

    this.yPosition += 5;
  }

  private addFooter(data: EvidencePackData): void {
    const footerY = this.pageHeight - 15;

    // Footer line
    this.pdf.setDrawColor(180, 180, 180);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(this.styles.margin, footerY - 5, this.pageWidth - this.styles.margin, footerY - 5);

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
    this.pdf.text('NDX:Try AWS Scenarios - try.ndx.gov.uk', this.pageWidth - this.styles.margin - 60, footerY);

    // Page number
    const pageCount = (this.pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      this.pdf.text(`Page ${i} of ${pageCount}`, this.pageWidth / 2 - 10, footerY);
    }
  }

  public generate(data: EvidencePackData): jsPDF {
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

    // Enhanced Evidence Pack sections (Story 6.7)
    // Council Identity Section (if generated council)
    this.addCouncilIdentitySection(data);

    // AI Features Section
    this.addAiFeaturesSection(data);

    // Before/After Simplification Examples
    this.addBeforeAfterSection(data);

    // Alt-Text Samples
    this.addAltTextSection(data);

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

    // ROI Talking Points (Enhanced Evidence Pack)
    if (data.aiFeatures) {
      this.addRoiSection();
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

  public download(data: EvidencePackData, filename?: string): void {
    this.generate(data);

    const defaultFilename = `evidence-pack-${data.scenarioId}-${data.evaluationDate.replace(/\//g, '-')}.pdf`;
    this.pdf.save(filename || defaultFilename);
  }

  public getBlob(data: EvidencePackData): Blob {
    this.generate(data);
    return this.pdf.output('blob');
  }
}

// Factory function for easy instantiation
export function createEvidencePackGenerator(): EvidencePackGenerator {
  return new EvidencePackGenerator();
}

// Helper to collect data from session storage
export function collectSessionData(scenarioId: string): Partial<EvidencePackData> {
  const deploymentData = sessionStorage.getItem(`ndx-deployment-${scenarioId}`);
  const progressData = sessionStorage.getItem(`ndx-progress-${scenarioId}`);

  let parsed: Record<string, any> = {};
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
