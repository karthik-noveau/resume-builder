import { test, expect } from '@playwright/test';

test.describe('Exhaustive Content Flow', () => {

  test('should allow filling every section type', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Main').getByRole('link', { name: /my resumes/i }).click();
    await page.getByRole('button', { name: /new resume/i }).click();
    await expect(page.getByRole('heading', { name: /choose your template/i })).toBeVisible();
    await page.getByRole('button', { name: /create resume/i }).click();
    await page.getByRole('link', { name: /full editor/i }).click();

    // 1. Personal Info
    const panel = page.getByLabel('Properties panel');
    
    await panel.getByRole('textbox', { name: /full name/i }).fill('Test User');
    await panel.getByRole('textbox', { name: /full name/i }).blur();
    await expect(page.getByText('Saved')).toBeVisible();

    await panel.getByRole('textbox', { name: /professional headline/i }).fill('Full Stack Tester');
    await panel.getByRole('textbox', { name: /email/i }).fill('test@example.com');
    await panel.getByRole('textbox', { name: /location/i }).fill('Remote');
    await panel.getByRole('textbox', { name: /location/i }).blur();
    await expect(page.getByText('Saved')).toBeVisible();

    // 2. Summary
    await page.getByLabel(/edit summary section/i).click();
    await panel.getByRole('textbox', { name: 'Summary' }).fill('A very detailed summary.');
    await panel.getByRole('textbox', { name: 'Summary' }).blur();
    await expect(page.getByText('Saved')).toBeVisible();

    // 3. Experience (template ships with sample entries — new one is appended last)
    await page.getByLabel(/edit experience section/i).click();
    await panel.getByRole('button', { name: /add experience/i }).click();
    await panel.getByRole('textbox', { name: /company/i }).last().fill('Test Corp');
    await panel.getByRole('textbox', { name: /role/i }).last().fill('Lead Engineer');
    await panel.getByRole('textbox', { name: /start date/i }).last().fill('2020-01');
    await panel.getByRole('textbox', { name: /start date/i }).last().blur();
    await expect(page.getByText('Saved')).toBeVisible();

    // 4. Education
    await page.getByLabel(/edit education section/i).click();
    await panel.getByRole('button', { name: /add education/i }).click();
    await panel.getByRole('textbox', { name: /institution/i }).last().fill('Test University');
    await panel.getByRole('textbox', { name: /degree/i }).last().fill('BS in CS');
    await panel.getByRole('textbox', { name: /degree/i }).last().blur();
    await expect(page.getByText('Saved')).toBeVisible();

    // 5. Skills
    await page.getByLabel(/edit skills section/i).click();
    await panel.getByRole('button', { name: /add skill category/i }).click();
    await panel.getByRole('textbox', { name: /category name/i }).last().fill('Automation');
    await panel.getByRole('textbox', { name: /category name/i }).last().blur();
    await expect(page.getByText('Saved')).toBeVisible();

    // 6. Projects
    await page.getByLabel(/edit projects section/i).click();
    await panel.getByRole('button', { name: /add project/i }).click();
    await panel.getByRole('textbox', { name: /project title/i }).last().fill('E2E Framework');
    await panel.getByRole('textbox', { name: /project title/i }).last().blur();
    await expect(page.getByText('Saved')).toBeVisible();

    // 7. Certifications
    await page.getByLabel(/edit certifications section/i).click();
    await panel.getByRole('button', { name: /add certification/i }).click();
    await panel.getByRole('textbox', { name: /certification title/i }).last().fill('Certified Tester');
    await panel.getByRole('textbox', { name: /certification title/i }).last().blur();
    await expect(page.getByText('Saved')).toBeVisible();

    // 8. Custom Section
    await page.getByLabel(/edit custom section/i).click();
    await panel.getByRole('button', { name: /add custom section/i }).click();
    await expect(panel.getByRole('textbox', { name: /section title/i }).last()).toBeVisible();

    // Verify all entered data is in the Canvas
    await expect(page.getByText('Test User')).toBeVisible();
    await expect(page.getByText('Test Corp')).toBeVisible();
    await expect(page.getByText('Test University')).toBeVisible();
  });
});
