import { type Page, expect } from '@playwright/test';

/**
 * Dashboard "New Resume" -> one template-card action -> guided editor.
 */
export async function createResume(page: Page) {
  await page.goto('/app');
  await page.getByRole('button', { name: 'Create a new resume' }).click();
  const picker = page.getByRole('dialog', { name: 'Choose a template' });
  await expect(picker).toBeVisible();
  await picker.getByRole('button', { name: 'Use Meridian template' }).click();
  await expect(page).toHaveURL(/\/editor\/[^/]+\/guided/);
}

/** Navigates from the guided editor to the full editor and waits for it to be ready. */
export async function goToFullEditor(page: Page) {
  await page.getByRole('link', { name: /full editor/i }).click();
  await expect(page).toHaveURL(/\/editor\/[^/]+$/);
  await expect(page.getByLabel('Properties panel')).toBeVisible();
}

/** Creates a resume and lands directly in the full editor (Properties panel + Canvas). */
export async function createResumeInFullEditor(page: Page) {
  await createResume(page);
  await goToFullEditor(page);
}

/**
 * Opens an antd Select (rendered as a combobox, not a native <select>) and
 * picks an option. antd keeps two option lists in the DOM: a visually-hidden
 * `role="listbox"` shadow copy for screen readers (0x0, unclickable) and the
 * real visible `.ant-select-item-option` list the user actually clicks —
 * `getByRole('option', ...)` matches the former, so target the latter directly.
 */
export async function selectAntOption(page: Page, label: string | RegExp, optionName: string | RegExp) {
  await page.getByLabel(label).click();
  await page.locator('.ant-select-item-option').filter({ hasText: optionName }).click();
}
