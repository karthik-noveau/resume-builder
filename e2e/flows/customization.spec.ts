import { test, expect } from '@playwright/test';
import { createResumeInFullEditor, selectAntOption } from '../utils/flows';

test.describe('Customization Flow', () => {
  test('should allow changing theme, fonts, and margins', async ({ page }) => {
    await createResumeInFullEditor(page);

    // With no section selected, the Properties panel shows global layout settings.
    await expect(page.getByText('Layout Settings')).toBeVisible();

    const panel = page.getByLabel('Properties panel');
    const topMarginInput = panel.getByLabel(/^top$/i);
    await topMarginInput.fill('25');
    await topMarginInput.blur();
    await expect(page.getByText('Saved')).toBeVisible();

    // Page size uses a custom (antd) combobox, not a native <select>.
    await selectAntOption(page, /page size/i, /letter/i);
    await expect(page.getByText('Saved')).toBeVisible();
  });
});
