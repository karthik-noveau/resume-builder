import { test, expect } from '@playwright/test';
import { createResumeInFullEditor } from '../utils/flows';

/**
 * COMPREHENSIVE E2E FLOW TEST
 */

test.describe('Complete Resume Journey', () => {

  test('Full Journey: Create, Edit, Switch, Persistence, Delete', async ({ page }) => {
    // --- 1. Dashboard & Creation ---
    await createResumeInFullEditor(page);

    // --- 2. Data Entry: Personal Info ---
    const panel = page.getByLabel('Properties panel');

    await panel.getByRole('textbox', { name: /full name/i }).fill('Alexander Hamilton');
    await panel.getByRole('textbox', { name: /full name/i }).blur();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();

    await panel.getByRole('textbox', { name: /professional headline/i }).fill('Founding Father');
    await panel.getByRole('textbox', { name: /email/i }).fill('alex@treasury.gov');
    await panel.getByRole('textbox', { name: /location/i }).fill('New York, NY');
    await panel.getByRole('textbox', { name: /location/i }).blur();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();


    // --- 3. Data Entry: Summary ---
    await page.getByLabel(/edit summary section/i).click();
    await panel.getByRole('textbox', { name: 'Summary' }).fill('I am not throwing away my shot.');
    await panel.getByRole('textbox', { name: 'Summary' }).blur();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();


    // --- 4. Sidebar Interaction & Section Selection ---
    // Add a skill category to the blank draft.
    await page.getByLabel(/edit skills section/i).click();
    await panel.getByRole('button', { name: /add skill category/i }).click();
    await expect(panel.getByRole('textbox', { name: /category name/i }).last()).toBeVisible();
    await panel.getByRole('textbox', { name: /category name/i }).last().fill('Political Strategy');
    await panel.getByRole('textbox', { name: /category name/i }).last().blur();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();


    // --- 5. Template switching ---
    await page.getByRole('button', { name: 'Change template', exact: true }).click();
    await page.getByRole('dialog', { name: 'Change template' }).getByRole('button', { name: 'Use Foundation template' }).click();

    // Selecting the Skills section earlier collapsed Personal Info in favor of
    // the Skills form; clear the selection to bring the full-name field back.
    await page.getByRole('button', { name: 'Back to personal info' }).click();
    await expect(panel.getByRole('textbox', { name: /full name/i })).toHaveValue('Alexander Hamilton');


    // --- 6. Persistence Check ---
    await page.reload();
    await expect(panel.getByRole('textbox', { name: /full name/i })).toHaveValue('Alexander Hamilton');


    // --- 7. Preview, then export the reviewed document ---
    await page.getByRole('button', { name: 'Preview & export' }).click();
    const preview = page.getByRole('dialog', { name: 'Preview & export' });
    await expect(preview.getByRole('button', { name: 'Export PDF' })).toBeEnabled();
    const downloadPromise = page.waitForEvent('download');
    await preview.getByRole('button', { name: 'Export PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('Alexander_Hamilton');
    expect(download.suggestedFilename()).toContain('.pdf');
    await preview.getByRole('button', { name: 'Back to editor' }).click();


    // --- 8. Deletion Flow ---
    await page.getByRole('link', { name: /back to dashboard/i }).click();
    await expect(page).toHaveURL(/\/app$/);

    const resumeCard = page.getByRole('article', { name: 'Untitled Resume', exact: true });
    await resumeCard.getByRole('button', { name: /^Actions for / }).click();
    await page.getByRole('menuitem', { name: /delete/i }).click();

    const deleteDialog = page.getByRole('dialog');
    await deleteDialog.getByRole('button', { name: /delete/i }).click();

    await expect(resumeCard).not.toBeVisible();
  });

});
