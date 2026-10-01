import { test, expect } from '@playwright/test';
import { createResumeInFullEditor, selectAntOption } from '../utils/flows';

test.describe('Customization Flow', () => {
  test('should allow changing page size and margins', async ({ page }) => {
    await createResumeInFullEditor(page);

    // Page-wide controls live in the sidebar.
    await page.getByRole('button', { name: 'Page setup', exact: true }).click();

    const panel = page.getByRole('region', { name: 'Page setup', exact: true });
    const topMarginInput = panel.getByLabel(/^top$/i);
    await topMarginInput.fill('25');
    await topMarginInput.blur();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();

    // Page size uses a custom (antd) combobox, not a native <select>.
    await selectAntOption(page, /page size/i, /letter/i);
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  });
});
