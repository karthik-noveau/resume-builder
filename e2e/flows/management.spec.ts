import { test, expect } from '@playwright/test';
import { createResumeInFullEditor } from '../utils/flows';

test.describe('Management Flows', () => {

  test('should allow duplicating and deleting resumes', async ({ page }) => {
    // 1. Create initial resume
    await createResumeInFullEditor(page);

    const panel = page.getByLabel('Properties panel');
    await expect(page.getByText('Untitled Resume', { exact: true })).toBeVisible();

    // Fill in name to make it unique
    await panel.getByRole('textbox', { name: /full name/i }).fill('Management Test');
    await panel.getByRole('textbox', { name: /full name/i }).blur();
    await expect(page.getByText('Saved')).toBeVisible();

    // 2. Go back to dashboard
    await page.getByRole('link', { name: /back to dashboard/i }).click();
    await expect(page).toHaveURL(/\/app$/);

    // 3. Duplicate (via the card's "Resume actions" menu)
    const resumeCard = page.locator('article').filter({ hasText: /management test|untitled resume/i }).first();
    await expect(resumeCard).toBeVisible();

    await resumeCard.getByRole('button', { name: 'Resume actions' }).click();
    await page.getByRole('menuitem', { name: /duplicate/i }).click();

    // Should redirect to the new copy's editor
    await expect(page).toHaveURL(/\/editor\//);
    // Title should contain "(Copy)"
    await expect(page.getByText(/Copy/)).toBeVisible();

    // 4. Delete from Dashboard
    await page.getByRole('link', { name: /back to dashboard/i }).click();
    await expect(page).toHaveURL(/\/app$/);

    // Delete the original (one without "Copy")
    const originalCard = page.locator('article').filter({ hasText: /management test/i }).filter({ hasNotText: /copy/i }).first();
    await originalCard.getByRole('button', { name: 'Resume actions' }).click();
    await page.getByRole('menuitem', { name: /delete/i }).click();

    const confirmDialog = page.getByRole('dialog');
    await confirmDialog.getByRole('button', { name: /delete/i }).click();

    await expect(originalCard).not.toBeVisible();
  });
});
