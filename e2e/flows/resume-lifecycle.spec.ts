import { test, expect } from '@playwright/test';
import { createResumeInFullEditor } from '../utils/flows';

test.describe('Resume Lifecycle', () => {
  test('Flow 1: Create Resume', async ({ page }) => {
    // 1. Create
    await createResumeInFullEditor(page);

    // 2. Edit
    const panel = page.getByLabel('Properties panel');

    await panel.getByRole('textbox', { name: /full name/i }).fill('John Doe');
    await panel.getByRole('textbox', { name: /full name/i }).blur();
    await expect(page.getByText('Saved')).toBeVisible();

    await panel.getByRole('textbox', { name: /email/i }).fill('john@example.com');
    await panel.getByRole('textbox', { name: /email/i }).blur();
    await expect(page.getByText('Saved')).toBeVisible();

    // 3. Verify persistence
    await page.reload();
    await expect(panel.getByRole('textbox', { name: /full name/i })).toHaveValue('John Doe');
    await expect(panel.getByRole('textbox', { name: /email/i })).toHaveValue('john@example.com');
  });

  test('Flow 2: Template Switch', async ({ page }) => {
    await createResumeInFullEditor(page);

    const panel = page.getByLabel('Properties panel');
    await panel.getByRole('textbox', { name: /full name/i }).fill('Jane Doe');
    await panel.getByRole('textbox', { name: /full name/i }).blur();
    await expect(page.getByText('Saved')).toBeVisible();

    // Template switching lives in the sidebar's collapsible Appearance panel.
    await page.getByRole('button', { name: 'Appearance' }).click();
    await page.getByRole('option', { name: /spectrum/i }).click();

    // Verify data still there
    await expect(panel.getByRole('textbox', { name: /full name/i })).toHaveValue('Jane Doe');
  });

  test('Flow 3: Export PDF', async ({ page }) => {
    await createResumeInFullEditor(page);

    const panel = page.getByLabel('Properties panel');
    await panel.getByRole('textbox', { name: /full name/i }).fill('Exporter');
    await panel.getByRole('textbox', { name: /full name/i }).blur();
    await panel.getByRole('textbox', { name: /email/i }).fill('exporter@example.com');
    await panel.getByRole('textbox', { name: /email/i }).blur();
    await expect(page.getByText('Saved')).toBeVisible();

    // Trigger export
    const downloadPromise = page.waitForEvent('download');
    // The button's aria-label is "Export resume as PDF" — it overrides the
    // visible "Export PDF" text for accessible-name matching.
    await page.getByRole('button', { name: /export.*pdf/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('Exporter');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('Flow 4: Undo/Redo', async ({ page }) => {
    await createResumeInFullEditor(page);

    const panel = page.getByLabel('Properties panel');
    const nameInput = panel.getByRole('textbox', { name: /full name/i });
    await nameInput.fill('Initial');
    await nameInput.blur();
    await expect(page.getByText('Saved')).toBeVisible();

    await nameInput.fill('Changed');
    await nameInput.blur();
    await expect(page.getByText('Saved')).toBeVisible();

    // Click Undo
    await page.getByRole('button', { name: /undo/i }).click();
    await expect(nameInput).toHaveValue('Initial');

    // Click Redo
    await page.getByRole('button', { name: /redo/i }).click();
    await expect(nameInput).toHaveValue('Changed');
  });

  test('Flow 5: Recovery', async ({ page }) => {
    await createResumeInFullEditor(page);

    const panel = page.getByLabel('Properties panel');
    await panel.getByRole('textbox', { name: /full name/i }).fill('Recover Me');
    await panel.getByRole('textbox', { name: /full name/i }).blur();
    await expect(page.getByText('Saved')).toBeVisible();

    // Simulate "unexpected" refresh by just reloading
    await page.reload();

    await expect(panel.getByRole('textbox', { name: /full name/i })).toHaveValue('Recover Me');
  });
});
