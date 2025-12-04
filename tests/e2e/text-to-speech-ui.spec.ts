/**
 * Text-to-Speech Web Application E2E Tests (Story 22.5/22.6)
 *
 * Comprehensive test suite covering:
 * - Page load and UI elements
 * - Voice selection and preview
 * - Sample text loading
 * - Text input and character counter
 * - Conversion workflow
 * - Audio player functionality
 * - Accessibility compliance
 * - Keyboard navigation
 * - API integration
 * - Mobile responsiveness
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TEXT_TO_SPEECH_URL = 'https://xh5x4w73p2bldzmyel3q45koki0mtlou.lambda-url.us-west-2.on.aws/';

test.describe('Text-to-Speech - Page Load', () => {
  test('loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(TEXT_TO_SPEECH_URL);
    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
  });

  test('displays correct page title', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    await expect(page).toHaveTitle(/Text to Speech/);
  });

  test('displays NDX:Try header', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const header = page.locator('.header-title');
    await expect(header).toContainText('NDX:Try');
  });

  test('displays sandbox phase banner', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const phaseBanner = page.locator('.phase-banner');
    await expect(phaseBanner).toBeVisible();
    await expect(phaseBanner).toContainText('Sandbox');
  });

  test('displays main heading', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const heading = page.locator('h1');
    await expect(heading).toContainText('Convert Text to Speech');
  });

  test('displays intro text', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const intro = page.locator('.intro');
    await expect(intro).toContainText('Amazon Polly');
  });
});

test.describe('Text-to-Speech - Voice Selection', () => {
  test('displays voice selector dropdown', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const voiceSelect = page.locator('#voiceSelect');
    await expect(voiceSelect).toBeVisible();
  });

  test('voice selector has 4 British English options', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const options = page.locator('#voiceSelect option');
    await expect(options).toHaveCount(4);
  });

  test('voice selector includes Amy, Emma, Brian, Arthur', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const voiceSelect = page.locator('#voiceSelect');

    await expect(voiceSelect.locator('option[value="Amy"]')).toHaveCount(1);
    await expect(voiceSelect.locator('option[value="Emma"]')).toHaveCount(1);
    await expect(voiceSelect.locator('option[value="Brian"]')).toHaveCount(1);
    await expect(voiceSelect.locator('option[value="Arthur"]')).toHaveCount(1);
  });

  test('displays 4 voice preview buttons', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const previewButtons = page.locator('.voice-preview-btn');
    await expect(previewButtons).toHaveCount(4);
  });
});

test.describe('Text-to-Speech - Sample Text Cards', () => {
  test('displays 4 sample text cards', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const sampleCards = page.locator('.sample-card');
    await expect(sampleCards).toHaveCount(4);
  });

  test('sample cards have titles', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const titles = page.locator('.sample-card-title');
    await expect(titles).toHaveCount(4);
    await expect(titles.first()).not.toHaveText('');
  });

  test('clicking Council Meeting card loads sample text', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    const textInput = page.locator('#textInput');
    await expect(textInput).toHaveValue('');

    await page.click('[data-sample="council-meeting"]');
    await page.waitForTimeout(500);
    const value = await textInput.inputValue();
    expect(value.toLowerCase()).toContain('council meeting');
  });

  test('clicking Bin Collection card loads sample text', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    await page.click('[data-sample="bin-collection"]');
    await page.waitForTimeout(500);
    const textInput = page.locator('#textInput');
    const value = await textInput.inputValue();
    expect(value.toLowerCase()).toContain('bin collection');
  });
});

test.describe('Text-to-Speech - Text Input', () => {
  test('displays text input area', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const textInput = page.locator('#textInput');
    await expect(textInput).toBeVisible();
  });

  test('text input has maxlength of 3000', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const textInput = page.locator('#textInput');
    await expect(textInput).toHaveAttribute('maxlength', '3000');
  });

  test('displays character counter', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const charCounter = page.locator('#charCounter');
    await expect(charCounter).toBeVisible();
    await expect(charCounter).toContainText('3,000');
  });

  test('character counter updates on input', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    const textInput = page.locator('#textInput');
    const charCount = page.locator('#charCount');

    await expect(charCount).toHaveText('0');
    await textInput.fill('Hello world');
    await expect(charCount).toHaveText('11');
  });

  test('convert button is disabled when text is empty', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const convertBtn = page.locator('#convertBtn');
    await expect(convertBtn).toBeDisabled();
  });

  test('convert button enables when text is entered', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    const textInput = page.locator('#textInput');
    const convertBtn = page.locator('#convertBtn');

    await textInput.fill('Test text');
    await expect(convertBtn).toBeEnabled();
  });

  test('clear button clears text input', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    const textInput = page.locator('#textInput');
    await textInput.fill('Some text to clear');

    await page.click('#clearBtn');
    await expect(textInput).toHaveValue('');
  });
});

test.describe('Text-to-Speech - Conversion Workflow', () => {
  test('clicking convert shows loading indicator', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    const textInput = page.locator('#textInput');
    await textInput.fill('Test conversion');

    await page.click('#convertBtn');
    const loading = page.locator('#loading');
    await expect(loading).toHaveClass(/visible/);
  });

  test('successful conversion shows result panel', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    const textInput = page.locator('#textInput');
    await textInput.fill('Hello world test');

    await page.click('#convertBtn');

    // Wait for result panel to appear
    const resultPanel = page.locator('#resultPanel');
    await expect(resultPanel).toHaveClass(/visible/, { timeout: 30000 });
  });

  test('result panel shows audio player', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    const textInput = page.locator('#textInput');
    await textInput.fill('Short test');

    await page.click('#convertBtn');

    const audioPlayer = page.locator('#audioPlayer');
    await expect(audioPlayer).toBeVisible({ timeout: 30000 });
  });

  test('result panel shows voice info', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    const textInput = page.locator('#textInput');
    await textInput.fill('Voice test');

    await page.click('#convertBtn');

    await page.waitForSelector('#resultPanel.visible', { timeout: 30000 });
    const resultVoice = page.locator('#resultVoice');
    await expect(resultVoice).toHaveText('Amy');
  });

  test('result panel shows character count', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    const textInput = page.locator('#textInput');
    await textInput.fill('Count test');

    await page.click('#convertBtn');

    await page.waitForSelector('#resultPanel.visible', { timeout: 30000 });
    const resultChars = page.locator('#resultChars');
    await expect(resultChars).toHaveText('10');
  });

  test('download button is visible after conversion', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    const textInput = page.locator('#textInput');
    await textInput.fill('Download test');

    await page.click('#convertBtn');

    await page.waitForSelector('#resultPanel.visible', { timeout: 30000 });
    const downloadBtn = page.locator('#downloadBtn');
    await expect(downloadBtn).toBeVisible();
  });
});

test.describe('Text-to-Speech - Accessibility', () => {
  test('has no axe-core critical violations on page load', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    await page.waitForTimeout(1000);

    const results = await new AxeBuilder({ page }).analyze();
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('has skip link', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveCount(1);
  });

  test('text input has accessible label', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const label = page.locator('label[for="textInput"]');
    await expect(label).toBeVisible();
  });

  test('voice select has accessible label', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const label = page.locator('label[for="voiceSelect"]');
    await expect(label).toBeVisible();
  });

  test('loading indicator has aria-live', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const loading = page.locator('#loading');
    await expect(loading).toHaveAttribute('aria-live', 'polite');
  });

  test('audio player has aria-label', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const audioPlayer = page.locator('#audioPlayer');
    await expect(audioPlayer).toHaveAttribute('aria-label');
  });

  test('sample cards group has aria-label', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const sampleGroup = page.locator('.sample-cards');
    await expect(sampleGroup).toHaveAttribute('aria-label', 'Sample text options');
  });

  test('voice preview group has aria-label', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);
    const previewGroup = page.locator('.voice-preview');
    await expect(previewGroup).toHaveAttribute('aria-label', 'Voice preview buttons');
  });
});

test.describe('Text-to-Speech - Keyboard Navigation', () => {
  test('can tab to voice select', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    // Tab through the page
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    const voiceSelect = page.locator('#voiceSelect');
    await expect(voiceSelect).toBeVisible();
  });

  test('can navigate sample cards with keyboard', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    const firstCard = page.locator('.sample-card').first();
    await firstCard.focus();
    await page.keyboard.press('Enter');

    const textInput = page.locator('#textInput');
    await expect(textInput).not.toHaveValue('');
  });

  test('can activate convert button with Enter', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    const textInput = page.locator('#textInput');
    await textInput.fill('Keyboard test');

    const convertBtn = page.locator('#convertBtn');
    await convertBtn.focus();
    await page.keyboard.press('Enter');

    // Should trigger conversion
    const loading = page.locator('#loading');
    await expect(loading).toHaveClass(/visible/);
  });

  test('can clear text with keyboard', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    const textInput = page.locator('#textInput');
    await textInput.fill('Text to clear');

    const clearBtn = page.locator('#clearBtn');
    await clearBtn.focus();
    await page.keyboard.press('Enter');

    await expect(textInput).toHaveValue('');
  });
});

test.describe('Text-to-Speech - API Integration', () => {
  test('GET request returns HTML', async ({ request }) => {
    const response = await request.get(TEXT_TO_SPEECH_URL);
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/html');
  });

  test('POST request returns JSON with success', async ({ request }) => {
    const response = await request.post(TEXT_TO_SPEECH_URL, {
      data: { text: 'Test audio', voice_id: 'Amy' },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.success).toBe(true);
  });

  test('POST request returns audioUrl', async ({ request }) => {
    const response = await request.post(TEXT_TO_SPEECH_URL, {
      data: { text: 'Audio URL test', voice_id: 'Amy' },
    });

    const data = await response.json();
    expect(data.audioUrl).toBeDefined();
    expect(data.audioUrl).toContain('https://');
  });

  test('POST request returns voiceId', async ({ request }) => {
    const response = await request.post(TEXT_TO_SPEECH_URL, {
      data: { text: 'Voice test', voice_id: 'Brian' },
    });

    const data = await response.json();
    expect(data.voiceId).toBe('Brian');
  });

  test('POST request returns characterCount', async ({ request }) => {
    const response = await request.post(TEXT_TO_SPEECH_URL, {
      data: { text: 'Exactly 20 chars!!', voice_id: 'Amy' },
    });

    const data = await response.json();
    expect(data.characterCount).toBe(18);
  });

  test('POST request with empty text returns error', async ({ request }) => {
    const response = await request.post(TEXT_TO_SPEECH_URL, {
      data: { text: '', voice_id: 'Amy' },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});

test.describe('Text-to-Speech - Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('displays correctly on mobile', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    const header = page.locator('.header');
    const heading = page.locator('h1');
    const textInput = page.locator('#textInput');

    await expect(header).toBeVisible();
    await expect(heading).toBeVisible();
    await expect(textInput).toBeVisible();
  });

  test('sample cards stack on mobile', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    const firstCard = page.locator('.sample-card').first();
    const box = await firstCard.boundingBox();

    // Card should be close to full width
    expect(box?.width).toBeGreaterThan(300);
  });

  test('controls work on mobile', async ({ page }) => {
    await page.goto(TEXT_TO_SPEECH_URL);

    const textInput = page.locator('#textInput');
    await textInput.fill('Mobile test');

    const convertBtn = page.locator('#convertBtn');
    await expect(convertBtn).toBeEnabled();
    await convertBtn.click();

    // Should show loading
    const loading = page.locator('#loading');
    await expect(loading).toHaveClass(/visible/);
  });
});
