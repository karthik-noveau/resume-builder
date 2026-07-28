import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createResumeInFullEditor } from '../utils/flows';

test.describe('Accessibility', () => {
  test('Dashboard should not have automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/app');

    await expect(page.getByRole('heading', { name: 'My Resumes' })).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Editor should not have automatically detectable accessibility issues', async ({ page }) => {
    await createResumeInFullEditor(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
