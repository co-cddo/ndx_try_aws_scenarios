import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import yaml from 'js-yaml';

/**
 * NAP-558: Phase navigator on each scenario page must link to *its own*
 * scenario, not silently fall back to council-chatbot. Each linked URL must
 * actually resolve (200), not 404.
 *
 * The list of scenarios is loaded from src/_data/scenarios.yaml at test setup
 * so adding a new scenario automatically extends test coverage.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const scenariosYaml = resolve(__dirname, '../src/_data/scenarios.yaml');

interface ScenarioEntry {
  id: string;
}
const data = yaml.load(readFileSync(scenariosYaml, 'utf8')) as { scenarios: ScenarioEntry[] };
const scenarioIds = data.scenarios.map(s => s.id);

test.describe('Phase navigator links match the current scenario (NAP-558)', () => {
  for (const id of scenarioIds) {
    test(`scenario "${id}" — phase nav points to its own scenario and all phase pages exist`, async ({ page, request }) => {
      await page.goto(`/scenarios/${id}/`);

      const nav = page.locator('[data-phase-navigator]');
      await expect(nav, 'phase navigator must be rendered').toBeVisible();

      await expect(nav, 'data-scenario-id reflects the page').toHaveAttribute('data-scenario-id', id);

      const tryLink = nav.locator('[data-phase-link="try"]');
      const wtLink = nav.locator('[data-phase-link="walkthrough"]');
      const exLink = nav.locator('[data-phase-link="explore"]');

      const expectedTry = `/scenarios/${id}/`;
      const expectedWt = `/walkthroughs/${id}/`;
      const expectedEx = `/walkthroughs/${id}/explore/`;

      await expect(tryLink, 'TRY href').toHaveAttribute('href', expectedTry);
      await expect(wtLink, 'WALK THROUGH href').toHaveAttribute('href', expectedWt);
      await expect(exLink, 'EXPLORE href').toHaveAttribute('href', expectedEx);

      // Regression guard for the silent council-chatbot fallback at
      // src/_includes/components/phase-navigator.njk:28.
      if (id !== 'council-chatbot') {
        for (const link of [tryLink, wtLink, exLink]) {
          const href = await link.getAttribute('href');
          expect(href, 'phase link must not silently fall back to council-chatbot').not.toContain('council-chatbot');
        }
      }

      // Each phase URL must actually resolve. A 404 here means the page is missing
      // (walkthrough or explore never authored), which is what NAP-558 surfaced.
      for (const url of [expectedTry, expectedWt, expectedEx]) {
        const response = await request.get(url);
        expect(response.status(), `${url} must return 200`).toBe(200);
      }
    });
  }
});
