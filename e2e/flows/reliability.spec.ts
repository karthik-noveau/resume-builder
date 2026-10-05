import { expect, test } from '@playwright/test'
import { createResume, createResumeInFullEditor } from '../utils/flows'

test('the Save shortcut commits the still-focused field', async ({ page, context }) => {
  await createResumeInFullEditor(page)
  const name = page.getByRole('textbox', { name: 'Full name', exact: true })
  await name.fill('Previously saved')
  await name.blur()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await name.fill('Saved with keyboard')
  const shortcut = await page.evaluate(() => /mac/i.test(navigator.platform) ? 'Meta+s' : 'Control+s')
  await page.keyboard.press(shortcut)
  await expect(name).toBeFocused()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  const reader = await context.newPage()
  await reader.goto(page.url())
  await expect(reader.getByRole('textbox', { name: 'Full name', exact: true })).toHaveValue('Saved with keyboard')
  await reader.close()
})

test('reloading preserves the still-focused field', async ({ page }) => {
  await createResumeInFullEditor(page)
  const name = page.getByRole('textbox', { name: 'Full name', exact: true })
  await name.fill('Previously saved')
  await name.blur()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await name.fill('Draft before reload')
  page.on('dialog', dialog => dialog.accept())
  await page.reload()
  await expect(name).toHaveValue('Draft before reload')
})

test('a failed storage write remains unsaved and can be retried without losing the draft', async ({ page }) => {
  await createResumeInFullEditor(page)
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof original>) {
      if (this.name === 'resumes') throw new DOMException('Simulated full storage', 'QuotaExceededError')
      return original.apply(this, args)
    }
    Object.assign(window, { restoreResumeWrites: () => { IDBObjectStore.prototype.put = original } })
  })
  const name = page.getByRole('textbox', { name: 'Full name', exact: true })
  await name.fill('Recover this draft')
  await name.blur()
  const retry = page.getByRole('button', { name: 'Save failed. Retry saving', exact: true })
  await expect(retry).toBeVisible()
  await expect(page.getByText('Saved', { exact: true })).toHaveCount(0)
  await expect(name).toHaveValue('Recover this draft')
  await page.evaluate(() => (window as unknown as { restoreResumeWrites: () => void }).restoreResumeWrites())
  await retry.click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await page.reload()
  await expect(name).toHaveValue('Recover this draft')
})

test('unfinished project and certification links survive reload without requiring valid content', async ({ page }) => {
  await createResumeInFullEditor(page)
  page.on('dialog', dialog => dialog.accept())
  for (const [section, add, field] of [
    ['Projects', 'Add Project', 'Live URL'],
    ['Certifications', 'Add Certification', 'Credential URL'],
  ]) {
    const openSection = () => page.getByRole('button', { name: `Edit ${section} section`, exact: true }).click()
    await openSection()
    await page.getByRole('button', { name: add, exact: true }).click()
    await expect(page.getByText('Saved', { exact: true })).toBeVisible()
    await page.getByRole('textbox', { name: field, exact: true }).fill('unfinished-link')
    await page.reload()
    await openSection()
    await expect(page.getByRole('textbox', { name: field, exact: true })).toHaveValue('unfinished-link')
  }
})

test('page margins keep the selected spacing preset and save the focused value on reload', async ({ page }) => {
  await createResumeInFullEditor(page)
  const setup = page.getByRole('button', { name: 'Page setup', exact: true })
  await setup.click()
  const spacious = page.getByRole('button', { name: 'Spacious', exact: true })
  await spacious.click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await page.getByRole('spinbutton', { name: 'Top', exact: true }).fill('25')
  page.on('dialog', dialog => dialog.accept())
  await page.reload()
  await setup.click()
  await expect(spacious).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('spinbutton', { name: 'Top', exact: true })).toHaveValue('25')
})

test('invalid imports can be corrected and cancelled without creating a resume', async ({ page }) => {
  await page.goto('/app')
  await page.getByRole('button', { name: 'Import an existing resume' }).click()
  const file = page.getByLabel('Resume file')
  await file.setInputFiles({ name: 'broken.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not a PDF') })
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Review details' })).toBeDisabled()
  await file.setInputFiles({ name: 'valid.txt', mimeType: 'text/plain', buffer: Buffer.from('Jordan Rivera\njordan@example.com\nSUMMARY\nEngineer building reliable and accessible applications.') })
  await expect(page.getByRole('button', { name: 'Review details' })).toBeEnabled()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.getByRole('button', { name: 'Review details' }).click()
  await expect(page.getByRole('dialog', { name: 'Review import' })).toBeVisible()
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await expect(page.getByText('No resumes yet', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Import an existing resume' }).click()
  await expect(page.getByRole('textbox', { name: 'Resume text' })).toHaveValue('')
})

test('touch guided setup completes and exports after an orientation change', async ({ browser, browserName, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: browserName !== 'firefox',
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  const runtimeErrors: string[] = []
  page.on('pageerror', error => runtimeErrors.push(error.message))
  try {
    await createResume(page, 'Clarity')
    for (const step of ['Personal details', 'Summary', 'Work experience', 'Education', 'Skills']) {
      await expect(page.getByRole('heading', { name: step, exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Fill with example', exact: true }).tap()
      await page.getByRole('button', { name: step === 'Skills' ? 'Finish' : 'Next', exact: true }).tap()
    }
    await expect(page).toHaveURL(/\/editor\/[^/]+$/)
    const views = page.getByRole('navigation', { name: 'Editor views' })
    await views.getByRole('button', { name: 'Canvas', exact: true }).tap()
    await page.getByRole('button', { name: 'Edit fullName', exact: true }).tap()
    await expect(page.getByRole('textbox', { name: 'Full name', exact: true })).toHaveValue('Alex Morgan')
    await page.setViewportSize({ width: 844, height: 390 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByRole('button', { name: 'Preview & export', exact: true }).tap()
    const dialog = page.getByRole('dialog', { name: 'Preview & export', exact: true })
    const exportButton = dialog.getByRole('button', { name: 'Export PDF', exact: true })
    await expect(exportButton).toBeEnabled()
    await expect(exportButton).toBeInViewport()
    const download = page.waitForEvent('download')
    await exportButton.tap()
    expect((await download).suggestedFilename()).toContain('Alex_Morgan')
    expect(runtimeErrors).toEqual([])
  } finally {
    await context.close()
  }
})
