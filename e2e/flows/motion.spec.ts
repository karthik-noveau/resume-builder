import { expect, test } from '@playwright/test'
import { createResumeInFullEditor } from '../utils/flows'

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`animated surfaces release focus and preserve edits with motion ${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion })
    await page.goto('/app')
    const trashButton = page.getByRole('button', { name: 'Trash', exact: true })

    // Trash has a nested confirmation dialog. Closing the parent must release
    // every presence subscription, including the unopened confirmation.
    for (let attempt = 0; attempt < 2; attempt++) {
      await trashButton.click()
      const dialog = page.getByRole('dialog', { name: 'Trash', exact: true })
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click()
      await expect(dialog).toHaveCount(0)
      await expect(page.locator('.ant-modal-mask')).toHaveCount(0)
      await expect(trashButton).toBeFocused()
    }

    await createResumeInFullEditor(page)
    const name = page.getByRole('textbox', { name: 'Full name', exact: true })
    await name.fill('Motion Test')
    await name.blur()
    await page.getByRole('tab', { name: 'Design', exact: true }).click()
    await page.getByRole('tab', { name: 'Content', exact: true }).click()
    await expect(name).toHaveValue('Motion Test')

    await page.setViewportSize({ width: 390, height: 844 })
    const views = page.getByRole('navigation', { name: 'Editor views' })
    await views.getByRole('button', { name: 'Canvas', exact: true }).click()
    await views.getByRole('button', { name: 'Content', exact: true }).click()
    await expect(name).toHaveValue('Motion Test')
    await page.getByRole('button', { name: 'Sections', exact: true }).click()
    const drawer = page.getByRole('dialog', { name: 'Sections', exact: true })
    await expect(drawer).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(drawer).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Sections', exact: true })).toBeFocused()

    await page.getByRole('button', { name: 'Sections', exact: true }).click()
    await drawer.getByRole('button', { name: 'Edit Summary section', exact: true }).click()
    const summary = page.getByRole('textbox', { name: 'Summary', exact: true })
    await summary.fill('Product designer with experience creating accessible tools and improving customer workflows.')
    await summary.blur()

    // A lazily loaded review must release its Escape handler so the drawer
    // beneath it remains usable after either close action.
    for (let attempt = 0; attempt < 2; attempt++) {
      await page.getByRole('button', { name: 'Sections', exact: true }).click()
      const reviewButton = drawer.getByRole('button', { name: 'Review & fix', exact: true })
      await reviewButton.click()
      const review = page.getByRole('dialog', { name: 'Resume readiness & job match', exact: true })
      await expect(review).toBeVisible()
      if (attempt === 0) {
        await review.getByRole('button', { name: 'Close dialog', exact: true }).click()
      } else {
        await page.keyboard.press('Escape')
      }
      await expect(review).toHaveCount(0)
      await expect(drawer).toBeVisible()
      await expect(reviewButton).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(drawer).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Sections', exact: true })).toBeFocused()
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
