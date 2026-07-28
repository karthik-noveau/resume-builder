import { test, expect } from '@playwright/test';
import { createResume } from '../utils/flows';

test.describe('Create Resume Flow', () => {
  test('should allow a user to create a resume', async ({ page }) => {
    await createResume(page);

    // Guided editor loaded with the new resume
    await expect(page.getByText('Untitled Resume')).toBeVisible();
  });
});
