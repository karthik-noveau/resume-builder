import { expect, test, type Page } from '@playwright/test'
import { createResume } from '../utils/flows'

async function openSummary(page: Page, mobile = false) {
  await createResume(page, 'Clarity')
  await page.getByRole('button', { name: 'Full Editor', exact: true }).click()
  if (mobile) await page.getByRole('button', { name: 'Sections', exact: true }).click()
  await page.getByRole('button', { name: 'Edit Summary section', exact: true }).click()
  return page.getByLabel('Properties panel')
}

test('icon picker has an inset search and roomy grid, and preserves search, selection and reset', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  const panel = await openSummary(page)
  const trigger = panel.getByRole('button', { name: 'Choose section icon: user', exact: true })
  await trigger.click()
  const picker = page.getByRole('dialog', { name: 'Choose a section icon' })
  const search = picker.getByRole('textbox', { name: 'Search icons' })
  await expect(search).toBeFocused()
  await expect(picker.getByText('74 icons', { exact: true })).toBeVisible()
  const option = picker.getByRole('radio', { name: 'user', exact: true })
  await expect(option).toHaveAttribute('aria-checked', 'true')
  const cell = (await option.boundingBox())!
  expect(cell.width).toBeGreaterThanOrEqual(44)
  expect(cell.height).toBeGreaterThanOrEqual(44)
  const popup = (await picker.boundingBox())!
  const input = (await search.boundingBox())!
  expect(input.y - popup.y).toBeGreaterThan(30)
  expect(input.x - popup.x).toBeGreaterThan(12)
  await picker.screenshot({ path: testInfo.outputPath('icon-picker.png') })
  await search.fill('graduation')
  await expect(picker.getByRole('radio')).toHaveCount(1)
  await picker.getByRole('radio', { name: 'graduation cap', exact: true }).click()
  await expect(picker).not.toBeVisible()
  const chosen = panel.getByRole('button', { name: 'Choose section icon: graduation cap', exact: true })
  await expect(chosen).toBeFocused()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Edit Summary section', exact: true }).click()
  await expect(chosen).toBeVisible()
  await chosen.click()
  await search.fill('no-matching-icon')
  await expect(picker.getByText('No icon matches “no-matching-icon”.')).toBeVisible()
  await search.press('Escape')
  await expect(chosen).toBeFocused()
  await chosen.click()
  await expect(search).toHaveValue('')
  await picker.getByRole('button', { name: 'Close icon picker' }).click()
  await expect(chosen).toBeFocused()
  await panel.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(trigger).toBeVisible()
})

for (const height of [844, 640]) {
  test(`icon picker stays inside a 390×${height} viewport`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height })
    const panel = await openSummary(page, true)
    await panel.getByRole('button', { name: 'Choose section icon: user', exact: true }).click()
    const picker = page.getByRole('dialog', { name: 'Choose a section icon' })
    await expect(picker).toBeVisible()
    await expect(picker.getByRole('textbox', { name: 'Search icons' })).toBeFocused()
    const box = (await picker.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(390)
    expect(box.y + box.height).toBeLessThanOrEqual(height)
    expect(await picker.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
    const cell = (await picker.getByRole('radio', { name: 'user', exact: true }).boundingBox())!
    expect(cell.width).toBeGreaterThanOrEqual(44)
    expect(cell.height).toBeGreaterThanOrEqual(44)
    await page.screenshot({ path: testInfo.outputPath(`icon-picker-${height}.png`) })
    await picker.getByRole('button', { name: 'Close icon picker' }).click()
    await expect(picker).not.toBeVisible()
  })
}
