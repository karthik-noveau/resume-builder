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
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();

    await panel.getByRole('textbox', { name: /email/i }).fill('john@example.com');
    await panel.getByRole('textbox', { name: /email/i }).blur();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();

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
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();

    // Switch designs with the shared template picker.
    await page.getByRole('button', { name: 'Change template', exact: true }).click();
    await page.getByRole('dialog', { name: 'Change template' }).getByRole('button', { name: 'Use Horizon template' }).click();

    // Verify data still there
    await expect(panel.getByRole('textbox', { name: /full name/i })).toHaveValue('Jane Doe');
  });

  for (const width of [1440, 390]) {
    test(`Flow 3: Preview then export PDF (${width}px)`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await createResumeInFullEditor(page);

      const panel = page.getByLabel('Properties panel');
      await panel.getByRole('textbox', { name: /email/i }).fill('exporter@example.com');
      await panel.getByRole('textbox', { name: /email/i }).blur();
      // Opening preview must commit the focused field, even before autosave.
      await panel.getByRole('textbox', { name: /full name/i }).fill('Exporter');

      const downloads: string[] = [];
      page.on('download', download => downloads.push(download.suggestedFilename()));
      const openPreview = page.getByRole('button', { name: 'Preview & export', exact: true });
      await expect(openPreview).toHaveCount(1);
      await expect(page.getByRole('button', { name: 'Export PDF', exact: true })).toHaveCount(0);
      if (width === 390) {
        await page.getByRole('button', { name: 'Undo', exact: true }).hover();
        await expect(page.getByRole('tooltip', { name: 'Undo (⌘Z)' })).toBeVisible();
      }
      await openPreview.click();
      const preview = page.getByRole('dialog', { name: 'Preview & export', exact: true });
      const exportPdf = preview.getByRole('button', { name: 'Export PDF', exact: true });
      await expect(preview.locator('.react-pdf__Page canvas').first()).toBeVisible();
      await expect(exportPdf).toBeEnabled();
      await expect(exportPdf).toBeInViewport();
      expect(downloads).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath('preview-and-export.png') });

      if (width === 390) {
        await page.setViewportSize({ width: 320, height: 740 });
        await expect(exportPdf).toBeInViewport();
        await expect(preview.getByRole('button', { name: 'Back to editor' })).toBeInViewport();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }

      const downloadPromise = page.waitForEvent('download');
      await exportPdf.click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toContain('Exporter');
      expect(download.suggestedFilename()).toContain('.pdf');
      await preview.getByRole('button', { name: 'Back to editor' }).click();
      await expect(preview).not.toBeVisible();
      await panel.getByRole('textbox', { name: /full name/i }).fill('Updated Exporter');
      await openPreview.click();
      await expect(exportPdf).toBeEnabled();
      const updatedDownload = page.waitForEvent('download');
      await exportPdf.click();
      expect((await updatedDownload).suggestedFilename()).toContain('Updated_Exporter');
    });
  }

  test('Flow 4: Undo/Redo', async ({ page }) => {
    await createResumeInFullEditor(page);

    const panel = page.getByLabel('Properties panel');
    const nameInput = panel.getByRole('textbox', { name: /full name/i });
    await nameInput.fill('Initial');
    await nameInput.blur();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();

    await nameInput.fill('Changed');
    await nameInput.blur();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();

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
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();

    // Simulate "unexpected" refresh by just reloading
    await page.reload();

    await expect(panel.getByRole('textbox', { name: /full name/i })).toHaveValue('Recover Me');
  });
});
