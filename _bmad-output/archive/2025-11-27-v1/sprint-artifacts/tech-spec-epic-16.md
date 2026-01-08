# Epic Technical Specification: Visual Consistency & Accessibility

Date: 2025-11-29
Author: Claude Code
Epic ID: 16
Status: Ready for Implementation

---

## Overview

Epic 16 ensures all screenshot content meets accessibility standards and maintains visual consistency across the portal. This quality assurance epic runs in parallel with Epics 13-15, validating that the screenshot integration delivers value to all users, including those with disabilities.

The core user value is: **"I can fully benefit from screenshot content regardless of my abilities, with proper descriptions, annotations, and responsive sizing."** This addresses the accessibility gap that often occurs when visual content is added rapidly.

**Key Insight from PRD:** Accessibility is not optional for government services. The portal must meet WCAG 2.2 AA standards to comply with public sector accessibility regulations and serve all council users effectively.

This epic implements **FRs 141-145, 149-150** and **NFRs 59-66**, delivering:
- **Alt Text Audit**: 100% coverage with quality standards
- **Screenshot Annotations**: Numbered callouts and arrows
- **Responsive Sizing**: Device-appropriate image dimensions
- **Image Optimization**: WebP conversion and compression
- **Gallery Component**: Multi-image browsing with keyboard navigation
- **Accessibility Testing**: Automated and manual validation
- **Navigation Accessibility**: Keyboard-only navigation audit

**Strategic Positioning:** Epic 16 is the "quality assurance" phase - ensuring screenshot content is usable by everyone and performs well on all devices.

## Objectives and Scope

### In Scope

- **Alt Text Audit** (Story 16.1):
  - Review all ~120-150 screenshots
  - Write descriptive alt text (max 125 chars)
  - Write captions for context
  - Ensure text-in-image is also in body text
  - Populate in YAML data files

- **Screenshot Annotations** (Story 16.2):
  - Numbered callout circles (1, 2, 3...)
  - Pointing arrows to UI elements
  - Brief labels
  - YAML configuration for positions
  - CSS-based overlays (not SVG)

- **Responsive Sizing** (Story 16.3):
  - Breakpoint-appropriate dimensions
  - `<picture>` element with srcset
  - Explicit width/height to prevent CLS
  - Loading="lazy" for below-fold images

- **WebP Optimization** (Story 16.4):
  - WebP primary format (85% quality)
  - PNG fallback
  - Target <200KB per image
  - Build-time processing with Sharp
  - 3 sizes: 640w, 1024w, 1920w

- **Gallery Component** (Story 16.5):
  - Thumbnail strip navigation
  - Main preview area
  - Previous/Next arrows
  - Keyboard navigation (arrows, Home, End)
  - ARIA tabs pattern

- **Accessibility Testing** (Story 16.6):
  - Lighthouse score 95+
  - axe-core 0 critical/serious
  - Screen reader testing (VoiceOver, NVDA)
  - Issue documentation and remediation

- **Navigation Keyboard Audit** (Story 16.7):
  - Tab through all navigation
  - Enter/Space to activate
  - Arrow keys in dropdowns
  - Escape to close
  - Focus visibility audit

### Out of Scope

- Automated alt text generation (manual quality required)
- Video accessibility (captions, audio descriptions)
- PDF accessibility
- Internationalization/localization

### Phase 2 Commitments

- User-customizable contrast settings
- Reduced motion preference support
- High contrast mode
- Cognitive accessibility features

### Scope Prioritization

**P1 - Launch Blockers:**
- Alt text on all images
- Keyboard accessibility for navigation
- Lighthouse accessibility 90+
- No axe-core critical issues

**P2 - Launch Enhancers:**
- Screenshot annotations
- Image optimization
- Gallery component
- Full 95+ Lighthouse score

**P3 - Fast Follow:**
- Screen reader testing across platforms
- Annotation editing UI
- Advanced gallery features

## System Architecture Alignment

### Architecture Components Referenced

| Decision | Component | Epic 16 Implementation |
|----------|-----------|----------------------|
| ADR-6: Design System | GOV.UK Frontend 5.13.0 | Accessible components, focus styles |
| Sprint 0: S3 Bucket | Screenshot Storage | Store optimized versions |
| Epic 13: Screenshot Component | Image Display | Add responsive attributes |
| Epic 14: Navigation | Header/Menu | Keyboard accessibility audit |

### Image Optimization Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    IMAGE OPTIMIZATION PIPELINE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Sprint 0 Screenshot Capture                                              │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ Original PNG: 1920×1080, ~2-5MB                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                              │                                            │
│                              ▼                                            │
│  Image Processing (Sharp at build time)                                   │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ For each image:                                                 │     │
│  │   1. Resize to 3 widths: 640w, 1024w, 1920w                    │     │
│  │   2. Generate 2x variants for Retina                            │     │
│  │   3. Convert to WebP (quality: 85)                              │     │
│  │   4. Keep PNG for fallback                                      │     │
│  │   5. Strip metadata                                             │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                              │                                            │
│                              ▼                                            │
│  Output Files (per image)                                                 │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ /current/{scenario}/{image}-640w.webp    (~30KB)               │     │
│  │ /current/{scenario}/{image}-640w@2x.webp (~80KB)               │     │
│  │ /current/{scenario}/{image}-1024w.webp   (~80KB)               │     │
│  │ /current/{scenario}/{image}-1024w@2x.webp(~200KB)              │     │
│  │ /current/{scenario}/{image}-1920w.webp   (~150KB)              │     │
│  │ /current/{scenario}/{image}.png          (fallback, ~500KB)    │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                              │                                            │
│                              ▼                                            │
│  HTML Output                                                              │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ <picture>                                                       │     │
│  │   <source srcset="{img}-640w.webp 640w,                        │     │
│  │                    {img}-1024w.webp 1024w,                      │     │
│  │                    {img}-1920w.webp 1920w"                      │     │
│  │           sizes="(max-width: 768px) 100vw, 640px"              │     │
│  │           type="image/webp">                                    │     │
│  │   <img src="{img}.png" alt="..." width="1920" height="1080"    │     │
│  │        loading="lazy">                                          │     │
│  │ </picture>                                                      │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Annotation Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ANNOTATION ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  YAML Configuration                                                       │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ screenshots:                                                    │     │
│  │   - id: bedrock-overview                                        │     │
│  │     filename: bedrock-overview.png                              │     │
│  │     annotations:                                                │     │
│  │       - number: 1                                               │     │
│  │         x: 15%     # Percentage-based positioning               │     │
│  │         y: 25%                                                  │     │
│  │         label: "Agent name"                                     │     │
│  │         arrow: "down"  # Optional arrow direction               │     │
│  │       - number: 2                                               │     │
│  │         x: 60%                                                  │     │
│  │         y: 40%                                                  │     │
│  │         label: "Knowledge base connection"                      │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                              │                                            │
│                              ▼                                            │
│  CSS Implementation                                                       │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ <figure class="ndx-annotated-screenshot">                       │     │
│  │   <div class="ndx-annotated-screenshot__container">            │     │
│  │     <img src="..." alt="...">                                  │     │
│  │     <div class="ndx-annotation" style="left: 15%; top: 25%">   │     │
│  │       <span class="ndx-annotation__number">1</span>            │     │
│  │       <span class="ndx-annotation__arrow ndx-annotation__arrow--down"></span>│
│  │     </div>                                                      │     │
│  │     <div class="ndx-annotation" style="left: 60%; top: 40%">   │     │
│  │       <span class="ndx-annotation__number">2</span>            │     │
│  │     </div>                                                      │     │
│  │   </div>                                                        │     │
│  │   <figcaption>                                                  │     │
│  │     <ol class="ndx-annotation__legend">                        │     │
│  │       <li>Agent name</li>                                       │     │
│  │       <li>Knowledge base connection</li>                        │     │
│  │     </ol>                                                       │     │
│  │   </figcaption>                                                 │     │
│  │ </figure>                                                       │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Gallery Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GALLERY COMPONENT (ARIA Tabs Pattern)                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ ┌─────────────────────────────────────────────────────────┐     │    │
│  │ │                    MAIN PREVIEW AREA                      │     │    │
│  │ │         (role="tabpanel", aria-labelledby)               │     │    │
│  │ │  ◄────────────────────────────────────────────────────►  │     │    │
│  │ │  [←]                   IMAGE                        [→]  │     │    │
│  │ │                                                           │     │    │
│  │ │                       Caption text                        │     │    │
│  │ └─────────────────────────────────────────────────────────┘     │    │
│  │                                                                  │    │
│  │ ┌─────────────────────────────────────────────────────────┐     │    │
│  │ │              THUMBNAIL STRIP (role="tablist")            │     │    │
│  │ │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │     │    │
│  │ │ │ [1] │ │ [2] │ │ [3] │ │ [4] │ │ [5] │ │ [6] │       │     │    │
│  │ │ │     │ │SELCT│ │     │ │     │ │     │ │     │       │     │    │
│  │ │ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘       │     │    │
│  │ │   ▲                                                      │     │    │
│  │ │   └── role="tab", aria-selected, aria-controls          │     │    │
│  │ └─────────────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  Keyboard Navigation:                                                     │
│  - Tab: Move focus to thumbnail strip                                    │
│  - Left/Right arrows: Navigate between thumbnails                        │
│  - Home: Jump to first thumbnail                                         │
│  - End: Jump to last thumbnail                                           │
│  - Enter/Space: Select thumbnail (auto-selects on arrow key too)        │
│                                                                           │
│  Mobile:                                                                  │
│  - Swipe left/right on main image                                        │
│  - Horizontal scroll on thumbnail strip                                  │
│  - Pinch-to-zoom on main image                                           │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Story Dependencies and Order

```
16.1 (Alt Text) ─────────────────────────────┐
                                              │
16.2 (Annotations) ─────────────────────────┬┴──► 16.6 (Accessibility Testing)
                                            │
16.3 (Responsive) ─────────────────────────┤
                                            │
16.4 (WebP) ───────────────────────────────┤
                                            │
16.5 (Gallery) ────────────────────────────┘

16.7 (Nav Keyboard) ──► Depends on Epic 14 complete
```

**Recommended Implementation Order:**
1. Story 16.4 - WebP Optimization (enables performance testing)
2. Story 16.3 - Responsive Sizing (uses optimized images)
3. Story 16.1 - Alt Text Audit (content quality)
4. Story 16.2 - Annotations (UX enhancement)
5. Story 16.5 - Gallery Component (complex accessibility)
6. Story 16.6 - Accessibility Testing (validation)
7. Story 16.7 - Navigation Keyboard Audit (final check)

## Technical Decisions

### TD-16.1: Alt Text in YAML Data Files

**Decision:** Store alt text and captions in screenshot YAML files (Story 13.2)

**Rationale:**
- Keeps content together with metadata
- Version controlled
- Easy to audit
- No separate database needed

### TD-16.2: CSS-Based Annotations

**Decision:** Use CSS positioning for annotations, not SVG overlays

**Rationale:**
- Simpler implementation
- Responsive (percentage positioning)
- Easier to style consistently
- Better screen reader support (legend separate from image)

### TD-16.3: Build-Time Image Optimization

**Decision:** Process images at build time using Sharp

**Rationale:**
- No runtime processing
- Predictable output
- CDN cacheable
- S3 costs reduced (store optimized versions)

### TD-16.4: ARIA Tabs Pattern for Gallery

**Decision:** Use ARIA tabs pattern (tablist/tab/tabpanel)

**Rationale:**
- Well-established accessibility pattern
- Screen readers understand natively
- Keyboard navigation conventions familiar
- GOV.UK uses similar patterns

### TD-16.5: Native `<dialog>` for Lightbox

**Decision:** Continue using native `<dialog>` from Epic 13

**Rationale:**
- Native focus management
- Escape key handling built-in
- Consistent with existing components
- No library dependency

## File Structure

```
/src/
├── _includes/
│   └── components/
│       ├── annotated-screenshot.njk    # New
│       └── screenshot-gallery.njk      # Exists - Update
├── assets/
│   ├── css/
│   │   ├── _annotations.scss           # New
│   │   └── _screenshot-gallery.scss    # Exists - Update
│   └── js/
│       └── screenshot-gallery.js       # Exists - Update
├── scripts/
│   └── optimize-images.js              # New - Build script
└── tests/
    └── accessibility/
        ├── lighthouse.config.js        # New
        └── axe-runner.js               # New
```

## Component Specifications

### Annotated Screenshot Component

```nunjucks
{#
  Annotated Screenshot (Story 16.2)

  Extends screenshot.njk with overlay annotations
#}

{% set hasAnnotations = screenshot.annotations | length > 0 %}

<figure class="ndx-screenshot{% if hasAnnotations %} ndx-annotated-screenshot{% endif %}">
  <div class="ndx-screenshot__container">
    {# Base image from screenshot.njk #}
    <picture>
      <source srcset="{{ imgUrl | replace('.png', '-640w.webp') }} 640w,
                      {{ imgUrl | replace('.png', '-1024w.webp') }} 1024w,
                      {{ imgUrl | replace('.png', '-1920w.webp') }} 1920w"
              sizes="(max-width: 768px) 100vw, 640px"
              type="image/webp">
      <img src="{{ imgUrl }}"
           alt="{{ screenshot.alt }}"
           width="1920"
           height="1080"
           loading="lazy"
           class="ndx-screenshot__image">
    </picture>

    {# Annotations overlay #}
    {% if hasAnnotations %}
      <div class="ndx-annotations" aria-hidden="true">
        {% for annotation in screenshot.annotations %}
          <div class="ndx-annotation"
               style="left: {{ annotation.x }}; top: {{ annotation.y }}">
            <span class="ndx-annotation__number">{{ annotation.number }}</span>
            {% if annotation.arrow %}
              <span class="ndx-annotation__arrow ndx-annotation__arrow--{{ annotation.arrow }}"></span>
            {% endif %}
          </div>
        {% endfor %}
      </div>
    {% endif %}
  </div>

  {# Caption with annotation legend #}
  <figcaption class="ndx-screenshot__caption">
    {% if screenshot.caption %}
      <p>{{ screenshot.caption }}</p>
    {% endif %}
    {% if hasAnnotations %}
      <ol class="ndx-annotation__legend">
        {% for annotation in screenshot.annotations %}
          <li>{{ annotation.label }}</li>
        {% endfor %}
      </ol>
    {% endif %}
  </figcaption>
</figure>
```

### Screenshot Gallery Component (Updated)

```nunjucks
{#
  Screenshot Gallery (Story 16.5)

  Multiple images with thumbnail navigation
  ARIA tabs pattern for accessibility
#}

<div class="ndx-gallery" data-gallery>
  {# Main preview area #}
  <div class="ndx-gallery__preview"
       id="gallery-preview-{{ galleryId }}"
       role="tabpanel"
       aria-labelledby="gallery-tab-0"
       tabindex="0">
    <button type="button"
            class="ndx-gallery__nav ndx-gallery__nav--prev"
            aria-label="Previous image"
            data-gallery-prev>
      <svg width="24" height="24" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" fill="none" stroke-width="2"/>
      </svg>
    </button>

    <figure class="ndx-gallery__figure">
      <img src="{{ screenshots[0].url }}"
           alt="{{ screenshots[0].alt }}"
           class="ndx-gallery__image"
           data-gallery-image>
      <figcaption class="ndx-gallery__caption" data-gallery-caption>
        {{ screenshots[0].caption }}
      </figcaption>
    </figure>

    <button type="button"
            class="ndx-gallery__nav ndx-gallery__nav--next"
            aria-label="Next image"
            data-gallery-next>
      <svg width="24" height="24" aria-hidden="true">
        <path d="M9 6l6 6-6 6" stroke="currentColor" fill="none" stroke-width="2"/>
      </svg>
    </button>
  </div>

  {# Thumbnail strip #}
  <div class="ndx-gallery__thumbnails"
       role="tablist"
       aria-label="Gallery images">
    {% for screenshot in screenshots %}
      <button type="button"
              class="ndx-gallery__thumbnail{% if loop.first %} ndx-gallery__thumbnail--selected{% endif %}"
              role="tab"
              id="gallery-tab-{{ loop.index0 }}"
              aria-selected="{% if loop.first %}true{% else %}false{% endif %}"
              aria-controls="gallery-preview-{{ galleryId }}"
              data-gallery-thumb
              data-index="{{ loop.index0 }}"
              data-src="{{ screenshot.url }}"
              data-alt="{{ screenshot.alt }}"
              data-caption="{{ screenshot.caption }}">
        <img src="{{ screenshot.thumbnailUrl }}"
             alt=""
             class="ndx-gallery__thumbnail-img">
        <span class="govuk-visually-hidden">
          Image {{ loop.index }} of {{ screenshots | length }}: {{ screenshot.alt }}
        </span>
      </button>
    {% endfor %}
  </div>
</div>
```

### Image Optimization Script

```javascript
/**
 * Image Optimization Script (Story 16.4)
 *
 * Run at build time to generate optimized image variants
 * Usage: node scripts/optimize-images.js
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const SIZES = [640, 1024, 1920];
const QUALITY = 85;
const INPUT_DIR = './src/assets/images/screenshots';
const OUTPUT_DIR = './_site/assets/images/screenshots';

async function optimizeImage(inputPath) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  const outputs = [];

  for (const width of SIZES) {
    if (width <= metadata.width) {
      // Standard resolution WebP
      const webpPath = path.join(OUTPUT_DIR, `${filename}-${width}w.webp`);
      await image
        .resize(width)
        .webp({ quality: QUALITY })
        .toFile(webpPath);
      outputs.push(webpPath);

      // 2x Retina WebP
      const width2x = width * 2;
      if (width2x <= metadata.width) {
        const webp2xPath = path.join(OUTPUT_DIR, `${filename}-${width}w@2x.webp`);
        await image
          .resize(width2x)
          .webp({ quality: QUALITY })
          .toFile(webp2xPath);
        outputs.push(webp2xPath);
      }
    }
  }

  // PNG fallback at original size
  const pngPath = path.join(OUTPUT_DIR, `${filename}.png`);
  await image
    .png({ compressionLevel: 9 })
    .toFile(pngPath);
  outputs.push(pngPath);

  return outputs;
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const files = await fs.readdir(INPUT_DIR);
  const pngFiles = files.filter(f => f.endsWith('.png'));

  console.log(`Processing ${pngFiles.length} images...`);

  for (const file of pngFiles) {
    const inputPath = path.join(INPUT_DIR, file);
    console.log(`  ${file}`);
    await optimizeImage(inputPath);
  }

  console.log('Done!');
}

main().catch(console.error);
```

## Testing Strategy

### Accessibility Automation

```javascript
// Lighthouse config
module.exports = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['accessibility'],
    output: 'html',
    formFactor: 'desktop',
  },
  assertions: {
    'categories:accessibility': ['error', { minScore: 0.95 }],
  },
};

// axe-core runner
const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');

async function runAxe(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const results = await new AxePuppeteer(page)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  await browser.close();
  return results;
}
```

### Manual Testing Checklist

**Screen Reader Testing:**
- [ ] VoiceOver (macOS): All content announced correctly
- [ ] NVDA (Windows): Navigation works as expected
- [ ] TalkBack (Android): Touch navigation functional

**Keyboard Testing:**
- [ ] Tab through all interactive elements
- [ ] Enter/Space activate buttons/links
- [ ] Escape closes modals/dropdowns
- [ ] Arrow keys navigate galleries/dropdowns
- [ ] Focus visible on all elements

**Visual Testing:**
- [ ] Color contrast 4.5:1 minimum
- [ ] Text resizable to 200%
- [ ] No horizontal scroll at 320px
- [ ] Animations respect reduced motion

## Story Point Estimates

| Story | Description | Points |
|-------|-------------|--------|
| 16.1 | Alt Text Audit/Population | 8 |
| 16.2 | Screenshot Annotations | 5 |
| 16.3 | Responsive Screenshot Sizing | 3 |
| 16.4 | WebP Conversion/Optimization | 5 |
| 16.5 | Screenshot Gallery Component | 5 |
| 16.6 | Accessibility Testing/Remediation | 5 |
| 16.7 | Navigation Keyboard Audit | 3 |
| **Total** | | **34** |

## Acceptance Criteria Summary

- [ ] 100% of screenshots have descriptive alt text
- [ ] 100% of screenshots have visible captions
- [ ] Annotations display with numbered callouts
- [ ] Annotation legend below image is accessible
- [ ] Images serve WebP with PNG fallback
- [ ] Images responsive across breakpoints
- [ ] No layout shift on image load
- [ ] Gallery keyboard navigable (arrows, Home, End)
- [ ] Gallery focus management correct
- [ ] Lighthouse accessibility 95+
- [ ] axe-core 0 critical/serious issues
- [ ] VoiceOver test passes
- [ ] NVDA test passes
- [ ] Navigation keyboard accessible
- [ ] Focus visible on all interactive elements

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Alt text quality inconsistent | Provide examples, review before merge |
| Annotation positions break at different sizes | Use percentage positioning, test at breakpoints |
| WebP not supported | PNG fallback in `<picture>` |
| Screen reader testing gaps | Test on multiple platforms (Mac/Windows) |
| Lighthouse score fluctuation | Run multiple times, use consistent test environment |
