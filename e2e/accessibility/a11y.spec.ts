import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createResumeInFullEditor } from '../utils/flows';

test.describe('Accessibility', () => {
  test('dark template actions retain contrast when hovered, focused, and selected', async ({ page }) => {
    await page.goto('/settings');
    await page.getByText('Dark', { exact: true }).click();
    await page.goto('/templates');
    const action = page.getByRole('button', { name: 'Use Foundation template', exact: true });
    await action.hover();
    const scanAction = () => new AxeBuilder({ page })
      .include('button[aria-label="Use Foundation template"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect((await scanAction()).violations).toEqual([]);
    await page.mouse.move(0, 0);
    await action.focus();
    expect((await scanAction()).violations).toEqual([]);
    await createResumeInFullEditor(page);
    await page.getByRole('button', { name: 'Change template', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Change template' })).toBeVisible();
    const pickerScan = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(pickerScan.violations).toEqual([]);
  });

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
