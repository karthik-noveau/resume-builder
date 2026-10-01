import { expect, test, type Locator, type Page } from '@playwright/test'
import { createResume } from '../utils/flows'

async function openEditor(page: Page) {
  await createResume(page, 'Clarity')
  for (const name of ['Personal details', 'Summary', 'Work experience', 'Education']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Fill with example', exact: true }).click()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
  }
  await page.getByRole('button', { name: 'Full Editor', exact: true }).click()
}

async function box(node: Locator) {
  return node.evaluate(el => {
    const s = (el as HTMLElement).style
    return { x: parseFloat(s.left), y: parseFloat(s.top), width: parseFloat(s.width), height: parseFloat(s.height) }
  })
}

async function setMargin(panel: Locator, side: string, value: string) {
  const input = panel.getByRole('spinbutton', { name: `${side} margin (pt)`, exact: true })
  await input.fill(value)
  await input.press('Enter')
}

test('element margins change layout, save, reset and undo without changing content', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await openEditor(page)
  const canvas = page.getByLabel('Resume canvas', { exact: true })
  const panel = page.getByLabel('Properties panel')
  const summary = canvas.locator('[data-style-key="summary:text"]')
  const following = canvas.locator('[data-style-key="section:experience"]').first()
  const original = await box(summary)
  const followingBefore = await box(following)
  const content = await summary.textContent()
  await canvas.getByRole('button', { name: 'Edit summary', exact: true }).click()
  await panel.getByRole('tab', { name: 'Design', exact: true }).click()
  await page.screenshot({ path: testInfo.outputPath('design-groups.png') })
  for (const [side, value] of [['Top', '10'], ['Right', '16'], ['Bottom', '8'], ['Left', '12']]) {
    await setMargin(panel, side, value)
  }
  const changed = await box(summary)
  expect(changed.x - original.x).toBeCloseTo(12 * 4 / 3, 1)
  expect(changed.y - original.y).toBeCloseTo(10 * 4 / 3, 1)
  expect(original.width - changed.width).toBeCloseTo(28 * 4 / 3, 1)
  expect((await box(following)).y).toBeGreaterThan(followingBefore.y)
  expect(await summary.textContent()).toBe(content)
  await page.screenshot({ path: testInfo.outputPath('margins-desktop.png') })
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await page.reload()
  await canvas.getByRole('button', { name: 'Edit summary', exact: true }).click()
  await panel.getByRole('tab', { name: 'Design', exact: true }).click()
  await expect(panel.getByRole('spinbutton', { name: 'Top margin (pt)' })).toHaveValue('10')
  expect(await box(summary)).toEqual(changed)
  await panel.getByRole('button', { name: 'Reset margins', exact: true }).click()
  expect(await box(summary)).toEqual(original)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(panel.getByRole('spinbutton', { name: 'Top margin (pt)' })).toHaveValue('10')
  expect(await box(summary)).toEqual(changed)
})

test('sections, divider lines and photos expose working margins', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await openEditor(page)
  const canvas = page.getByLabel('Resume canvas', { exact: true })
  const panel = page.getByLabel('Properties panel')
  const section = canvas.locator('[data-style-key="section:summary"]')
  const before = await box(section)
  await page.getByRole('button', { name: 'Edit Summary section', exact: true }).click()
  await panel.getByRole('tab', { name: 'Design', exact: true }).click()
  await expect(panel.getByText('Summary section', { exact: true })).toBeVisible()
  await setMargin(panel, 'Top', '6')
  await setMargin(panel, 'Left', '12')
  expect((await box(section)).y - before.y).toBeCloseTo(8, 1)
  expect((await box(section)).x - before.x).toBeCloseTo(16, 1)
  await panel.getByRole('button', { name: 'Reset margins', exact: true }).click()
  const line = canvas.locator('[data-canvas-decoration="divider"]').first()
  const originalLine = await box(line)
  await line.getByRole('button', { name: 'Edit divider line' }).click()
  await setMargin(panel, 'Left', '10')
  expect((await box(line)).x - originalLine.x).toBeCloseTo(10 * 4 / 3, 1)
  await expect(panel.getByRole('spinbutton', { name: 'Thickness (pt)' })).toBeVisible()
  await panel.getByRole('button', { name: 'Reset margins', exact: true }).click()
  const photo = canvas.getByRole('button', { name: 'Open profile photo in Personal Info', exact: true })
  const photoNode = photo.locator('..')
  const originalPhoto = await box(photoNode)
  await photo.click()
  await setMargin(panel, 'Right', '6')
  const changedPhoto = await box(photoNode)
  expect(changedPhoto.width).toBeLessThan(originalPhoto.width)
  expect(changedPhoto.width / changedPhoto.height).toBeCloseTo(originalPhoto.width / originalPhoto.height)
})

test('section margins are usable in the mobile Design view', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openEditor(page)
  await page.getByRole('button', { name: 'Sections', exact: true }).click()
  await page.getByRole('button', { name: 'Edit Summary section', exact: true }).click()
  await page.getByRole('navigation', { name: 'Editor views' }).getByRole('button', { name: 'Design', exact: true }).click()
  const panel = page.getByLabel('Properties panel')
  await expect(panel.getByText('Summary section', { exact: true })).toBeVisible()
  await setMargin(panel, 'Bottom', '12')
  await expect(panel.getByRole('spinbutton', { name: 'Bottom margin (pt)' })).toHaveValue('12')
  expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('margins-mobile.png') })
  await panel.getByRole('button', { name: 'Reset margins', exact: true }).click()
  await expect(panel.getByRole('spinbutton', { name: 'Bottom margin (pt)' })).toHaveValue('')
})
