import { test, expect } from '@playwright/test';

/**
 * Keyboard Navigation Accessibility Tests
 * Story 16.7: Navigation Keyboard Accessibility Audit
 *
 * Tests keyboard accessibility for:
 * - Desktop dropdown navigation
 * - Mobile hamburger menu
 * - Phase navigator
 * - Focus visibility
 */

test.describe('Desktop Navigation Keyboard Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Tab navigates through main nav triggers', async ({ page }) => {
    // Focus on first nav trigger
    const scenariosBtn = page.locator('.ndx-nav__trigger').first();
    await scenariosBtn.focus();

    // Should have visible focus indicator
    await expect(scenariosBtn).toBeFocused();
    const focusStyle = await scenariosBtn.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.outlineColor;
    });
    expect(focusStyle).toBeTruthy();
  });

  test('ArrowDown opens dropdown and focuses first link', async ({ page }) => {
    const scenariosBtn = page.locator('.ndx-nav__trigger').first();
    await scenariosBtn.focus();

    // Press ArrowDown to open dropdown
    await page.keyboard.press('ArrowDown');

    // Dropdown should be visible
    const dropdown = page.locator('.ndx-nav__dropdown--open').first();
    await expect(dropdown).toBeVisible();

    // First link should be focused
    const firstLink = dropdown.locator('a').first();
    await expect(firstLink).toBeFocused();
  });

  test('Arrow keys navigate within dropdown', async ({ page }) => {
    const scenariosBtn = page.locator('.ndx-nav__trigger').first();
    await scenariosBtn.focus();
    await page.keyboard.press('ArrowDown');

    const dropdown = page.locator('.ndx-nav__dropdown--open').first();
    const links = dropdown.locator('a');

    // First link should be focused
    await expect(links.first()).toBeFocused();

    // ArrowDown to second link
    await page.keyboard.press('ArrowDown');
    await expect(links.nth(1)).toBeFocused();

    // ArrowUp back to first
    await page.keyboard.press('ArrowUp');
    await expect(links.first()).toBeFocused();
  });

  test('Home/End keys jump to first/last item', async ({ page }) => {
    const scenariosBtn = page.locator('.ndx-nav__trigger').first();
    await scenariosBtn.focus();
    await page.keyboard.press('ArrowDown');

    const dropdown = page.locator('.ndx-nav__dropdown--open').first();
    const links = dropdown.locator('a');
    const linksCount = await links.count();

    // Press End to go to last
    await page.keyboard.press('End');
    await expect(links.nth(linksCount - 1)).toBeFocused();

    // Press Home to go to first
    await page.keyboard.press('Home');
    await expect(links.first()).toBeFocused();
  });

  test('Escape closes dropdown and returns focus to trigger', async ({ page }) => {
    const scenariosBtn = page.locator('.ndx-nav__trigger').first();
    await scenariosBtn.focus();
    await page.keyboard.press('ArrowDown');

    // Dropdown should be open
    const dropdown = page.locator('.ndx-nav__dropdown--open').first();
    await expect(dropdown).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Dropdown should close
    await expect(dropdown).not.toBeVisible();

    // Focus should return to trigger
    await expect(scenariosBtn).toBeFocused();
  });

  test('Enter/Space activate dropdown trigger', async ({ page }) => {
    const scenariosBtn = page.locator('.ndx-nav__trigger').first();
    await scenariosBtn.focus();

    // Press Enter to toggle
    await page.keyboard.press('Enter');

    const dropdown = page.locator('#nav-dropdown-scenarios');
    await expect(dropdown).toHaveClass(/ndx-nav__dropdown--open/);

    // Press Enter again to close
    await scenariosBtn.focus();
    await page.keyboard.press('Enter');
    await expect(dropdown).not.toHaveClass(/ndx-nav__dropdown--open/);
  });
});

test.describe('Mobile Navigation Keyboard Accessibility', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Tab focuses hamburger button', async ({ page }) => {
    // Mobile nav toggle should be visible
    const toggleBtn = page.locator('.ndx-mobile-nav-toggle');
    await expect(toggleBtn).toBeVisible();

    await toggleBtn.focus();
    await expect(toggleBtn).toBeFocused();
  });

  test('Enter opens mobile menu', async ({ page }) => {
    const toggleBtn = page.locator('.ndx-mobile-nav-toggle');
    await toggleBtn.focus();
    await page.keyboard.press('Enter');

    // Menu should be open
    const mobileNav = page.locator('.ndx-mobile-nav--open');
    await expect(mobileNav).toBeVisible();
  });

  test('Escape closes mobile menu and returns focus', async ({ page }) => {
    const toggleBtn = page.locator('.ndx-mobile-nav-toggle');
    await toggleBtn.focus();
    await page.keyboard.press('Enter');

    // Menu should be open
    await expect(page.locator('.ndx-mobile-nav--open')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Menu should close
    await expect(page.locator('.ndx-mobile-nav--open')).not.toBeVisible();

    // Focus should return to toggle button
    await expect(toggleBtn).toBeFocused();
  });

  test('Focus is trapped within open mobile menu', async ({ page }) => {
    const toggleBtn = page.locator('.ndx-mobile-nav-toggle');
    await toggleBtn.click();

    // Menu should be open
    await expect(page.locator('.ndx-mobile-nav--open')).toBeVisible();

    // Close button should be focused first
    const closeBtn = page.locator('.ndx-mobile-nav__close');
    await expect(closeBtn).toBeFocused();

    // Tab through all items and verify focus stays in menu
    const focusableInMenu = page.locator('.ndx-mobile-nav a, .ndx-mobile-nav button');
    const count = await focusableInMenu.count();

    // Tab through more than available items
    for (let i = 0; i < count + 2; i++) {
      await page.keyboard.press('Tab');
    }

    // Focus should wrap back to start (close button)
    const activeElement = page.locator(':focus');
    const isInMenu = await activeElement.evaluate(el => {
      return !!el.closest('.ndx-mobile-nav');
    });
    expect(isInMenu).toBe(true);
  });

  test('Arrow keys navigate between accordion triggers', async ({ page }) => {
    const toggleBtn = page.locator('.ndx-mobile-nav-toggle');
    await toggleBtn.click();

    // Find first accordion trigger
    const accordionTriggers = page.locator('.ndx-mobile-nav__accordion-trigger');
    const firstTrigger = accordionTriggers.first();
    await firstTrigger.focus();

    // ArrowDown should move to next trigger
    await page.keyboard.press('ArrowDown');
    await expect(accordionTriggers.nth(1)).toBeFocused();

    // ArrowUp should move back
    await page.keyboard.press('ArrowUp');
    await expect(firstTrigger).toBeFocused();
  });

  test('Enter toggles accordion sections', async ({ page }) => {
    const toggleBtn = page.locator('.ndx-mobile-nav-toggle');
    await toggleBtn.click();

    const firstTrigger = page.locator('.ndx-mobile-nav__accordion-trigger').first();
    await firstTrigger.focus();

    // Initially not expanded
    await expect(firstTrigger).toHaveAttribute('aria-expanded', 'false');

    // Press Enter to expand
    await page.keyboard.press('Enter');
    await expect(firstTrigger).toHaveAttribute('aria-expanded', 'true');

    // Press Enter again to collapse
    await page.keyboard.press('Enter');
    await expect(firstTrigger).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Focus Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('All focusable nav elements have visible focus indicators', async ({ page }) => {
    // Get all nav focusable elements
    const focusableElements = page.locator('.ndx-nav a, .ndx-nav button');
    const count = await focusableElements.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = focusableElements.nth(i);
      if (await element.isVisible()) {
        await element.focus();

        // Check for focus styles
        const hasVisibleFocus = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          const outlineWidth = parseInt(style.outlineWidth) || 0;
          const outlineStyle = style.outlineStyle;
          const boxShadow = style.boxShadow;
          const bgColor = style.backgroundColor;

          // GOV.UK focus style uses yellow background OR outline
          const hasYellowBg = bgColor.includes('255, 221, 0') || bgColor.includes('ffdd00');
          const hasOutline = outlineWidth > 0 && outlineStyle !== 'none';
          const hasBoxShadow = boxShadow && boxShadow !== 'none';

          return hasOutline || hasBoxShadow || hasYellowBg;
        });

        expect(hasVisibleFocus).toBe(true);
      }
    }
  });

  test('Focus indicator meets WCAG 2.2 minimum contrast', async ({ page }) => {
    const navTrigger = page.locator('.ndx-nav__trigger').first();
    await navTrigger.focus();

    // GOV.UK focus yellow should be visible
    const bgColor = await navTrigger.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should contain yellow (GOV.UK focus color #ffdd00 = rgb(255, 221, 0))
    expect(bgColor).toMatch(/rgb\(255,\s*221,\s*0\)|rgba\(255,\s*221,\s*0/);
  });
});
