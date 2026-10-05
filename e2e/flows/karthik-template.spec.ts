import { expect, test } from '@playwright/test'
import { PDFDocument } from 'pdf-lib'

for (const width of [1440, 390]) {
  test(`Karthik template previews a complete page, edits and exports at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => localStorage.setItem('resume-studio:editor-tour:v1', 'seen'))
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/templates')
    await page.getByRole('searchbox').fill('Karthik')
    await expect(page.getByRole('status')).toHaveText('1 of 41 templates')
    await page.getByRole('button', { name: 'Preview Karthik template', exact: true }).click()
    const preview = page.getByRole('dialog', { name: 'Karthik preview', exact: true })
    await expect(preview.getByLabel('Template preview, scroll to inspect')).toBeVisible()
    await expect(preview.getByRole('button', { name: 'Next page', exact: true })).toHaveCount(0)
    await preview.getByRole('button', { name: 'Use Karthik template', exact: true }).click()
    for (const step of ['Personal details', 'Summary', 'Work experience', 'Education', 'Skills']) {
      await expect(page.getByRole('heading', { name: step, exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Fill with example', exact: true }).click()
      await page.getByRole('button', { name: step === 'Skills' ? 'Finish' : 'Next', exact: true }).click()
    }
    await expect(page).toHaveURL(/\/editor\/[^/]+$/)
    const name = page.getByRole('textbox', { name: 'Full name', exact: true })
    await name.fill('Template Export Example')
    await page.getByRole('button', { name: 'Preview & export', exact: true }).click()
    const exportDialog = page.getByRole('dialog', { name: 'Preview & export', exact: true })
    const exportButton = exportDialog.getByRole('button', { name: 'Export PDF', exact: true })
    await expect(exportButton).toBeEnabled()
    await expect(exportButton).toBeInViewport()
    const downloadPromise = page.waitForEvent('download')
    await exportButton.click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('Template_Export_Example')
    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
    const pdf = await PDFDocument.load(Buffer.concat(chunks))
    expect(pdf.getPageCount()).toBe(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(errors).toEqual([])
  })
}
