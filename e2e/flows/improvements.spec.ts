import { test, expect } from '@playwright/test'
import { createResume, createResumeInFullEditor, selectAntOption } from '../utils/flows'

const resumeText = `Jordan Rivera
jordan@example.com
SUMMARY
Engineer building accessible applications and reliable services.
EXPERIENCE
Senior Engineer
Acme
Jan 2022 – Present
• Reduced latency by 30%
Engineer
Beta Labs
2019 – 2021
• Built payment APIs
EDUCATION
Example University
BSc Computer Science
2015 – 2019
Other University
MSc Computing
2020 – 2022
SKILLS
TypeScript, SQL`

test('Full Editor preserves an unfinished draft even after guided validation fails', async ({
  page,
}) => {
  await createResume(page)
  await expect(page.getByRole('textbox', { name: 'Full name' })).toBeInViewport()
  await expect(page.getByRole('radio', { name: /Avatar image/ })).toHaveCount(0)
  await expect(page.getByRole('progressbar', { name: 'Resume readiness score' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Skip for now' })).toHaveCount(0)
  await page.getByRole('textbox', { name: 'Full name' }).fill('Student Example')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('unfinished@')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toHaveAttribute('aria-invalid', 'true')
  await page.getByRole('button', { name: 'Full Editor', exact: true }).click()
  await expect(page).toHaveURL(/\/editor\/[^/]+$/)
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Full name' })).toHaveValue('Student Example')
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toHaveValue('unfinished@')
  await expect(page.getByRole('textbox', { name: 'Full name' })).not.toHaveAttribute('required', '')
})

test('template previews and style filters never create drafts until Use template', async ({
  page,
}) => {
  await page.goto('/templates')
  await selectAntOption(page, 'Style', 'Simple')
  await expect(page.getByRole('status')).toHaveText('20 of 40 templates')
  await page.getByRole('button', { name: 'Preview Meridian template' }).click()
  const preview = page.getByRole('dialog', { name: 'Meridian preview' })
  await expect(preview).toBeVisible()
  await expect(preview).toHaveAccessibleName('Meridian preview')
  const viewport = preview.getByLabel('Template preview, scroll to inspect')
  const paper = viewport.locator(':scope > div')
  const paperWidth = () => paper.evaluate((element) => element.getBoundingClientRect().width)
  // The modal mounts lazily: fitting must measure its real viewport, rather
  // than remaining at the initial thumbnail width after the dialog opens.
  await expect.poll(paperWidth).toBeGreaterThan(500)
  const initialWidth = await paperWidth()
  await preview.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await expect.poll(paperWidth).toBeGreaterThan(initialWidth)
  await preview.getByRole('button', { name: 'Zoom out', exact: true }).click()
  await expect.poll(paperWidth).toBeCloseTo(initialWidth, 0)
  await preview.getByRole('button', { name: 'Zoom out', exact: true }).click()
  await expect.poll(paperWidth).toBeLessThan(initialWidth)
  await preview.getByRole('button', { name: 'Fit width', exact: true }).click()
  await expect.poll(paperWidth).toBeCloseTo(initialWidth, 0)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(paperWidth).toBeLessThan(390)
  await expect(preview.getByRole('button', { name: 'Use Meridian template' })).toBeInViewport()
  await expect.poll(() => viewport.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
  await preview.getByRole('button', { name: 'Keep browsing' }).click()
  await page.goto('/app')
  await expect(page.getByText('No resumes yet')).toBeVisible()
})

test('text file import reviews multiple entries and saves corrected values', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('resume-studio:editor-tour:v1', 'seen'))
  await page.goto('/app')
  await page.getByRole('button', { name: 'Import an existing resume' }).click()
  await page
    .getByLabel('Resume file')
    .setInputFiles({ name: 'resume.txt', mimeType: 'text/plain', buffer: Buffer.from(resumeText) })
  await expect(page.getByRole('textbox', { name: 'Resume text' })).toHaveValue(resumeText)
  await page.getByRole('button', { name: 'Review details' }).click()
  const review = page.getByRole('dialog', { name: 'Review import' })
  await expect(review.getByRole('group', { name: 'Job 2' })).toBeVisible()
  await review
    .getByRole('group', { name: 'Job 2' })
    .getByRole('textbox', { name: 'Company', exact: true })
    .fill('Corrected Labs')
  await review.getByRole('button', { name: 'Create resume', exact: true }).click()
  await expect(page).toHaveURL(/\/editor\/[^/]+$/)
  await page.reload()
  await expect(
    page
      .getByRole('button', { name: 'Edit company', exact: true })
      .filter({ hasText: 'Corrected Labs' })
  ).toBeVisible()
})

test('mobile uses readable content and labeled design and canvas views', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await createResumeInFullEditor(page)
  const views = page.getByRole('navigation', { name: 'Editor views' })
  const name = page.getByRole('textbox', { name: 'Full name', exact: true })
  await expect(name).toBeInViewport()
  await name.fill('Mobile Example')
  await views.getByRole('button', { name: 'Design', exact: true }).click()
  await expect(page.getByRole('button', { name: /Global design/ })).toBeVisible()
  await views.getByRole('button', { name: 'Canvas', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Edit fullName' })).toBeVisible()
  await page.getByRole('button', { name: 'Edit fullName' }).click()
  await expect(name).toHaveValue('Mobile Example')
  await expect(views.getByRole('button', { name: 'Content', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('job targets survive a fresh browser tab and backup export', async ({ page, context }) => {
  await createResumeInFullEditor(page)
  await page.getByRole('textbox', { name: 'Full name', exact: true }).fill('Job Seeker')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('job@example.com')
  await page.getByRole('button', { name: 'Edit Summary section', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Summary', exact: true })
    .fill('Engineer building reliable web applications.')
  await page.getByRole('textbox', { name: 'Summary', exact: true }).blur()
  await page.getByRole('button', { name: 'Review & fix' }).click()
  await page.getByRole('button', { name: 'Job match', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Job description', exact: true })
    .fill('We need TypeScript and SQL experience.')
  await page.getByRole('button', { name: 'Extract keywords' }).click()
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  const other = await context.newPage()
  await other.goto(page.url())
  await other.getByRole('button', { name: 'Review & fix' }).click()
  await other.getByRole('button', { name: 'Job match', exact: true }).click()
  await expect(other.getByRole('textbox', { name: 'Job description', exact: true })).toHaveValue(
    'We need TypeScript and SQL experience.'
  )
  await expect(other.getByRole('textbox', { name: 'Keywords to compare' })).not.toHaveValue('')
  await other.close()
  await page.goto('/settings')
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download backup' }).click()
  const stream = await (await downloadEvent).createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  expect(Buffer.concat(chunks).toString()).toContain('We need TypeScript and SQL experience.')
})

for (const format of ['docx', 'pdf'] as const) {
  test(`imports a real ${format.toUpperCase()} file locally`, async ({ page }) => {
    await page.goto('/app')
    await page.getByRole('button', { name: 'Import an existing resume' }).click()
    if (format === 'docx') {
      await page.getByLabel('Resume file').setInputFiles('e2e/fixtures/resume.docx')
    } else {
      const { PDFDocument, StandardFonts } = await import('pdf-lib')
      const document = await PDFDocument.create()
      const font = await document.embedFont(StandardFonts.Helvetica)
      const sheet = document.addPage()
      for (const [i, line] of resumeText
        .replace(/•/g, '-')
        .replace(/–/g, '-')
        .split('\n')
        .entries()) {
        sheet.drawText(line, { x: 40, y: 780 - i * 24, size: 12, font })
      }
      await page
        .getByLabel('Resume file')
        .setInputFiles({
          name: 'resume.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from(await document.save()),
        })
    }
    await expect(page.getByRole('textbox', { name: 'Resume text' })).toHaveValue(/Jordan Rivera/)
    await page.getByRole('button', { name: 'Review details' }).click()
    const review = page.getByRole('dialog', { name: 'Review import' })
    await expect(review.getByRole('textbox', { name: 'Full name', exact: true })).toHaveValue(
      'Jordan Rivera'
    )
    await expect(
      review
        .getByRole('group', { name: 'Job 1' })
        .getByRole('textbox', { name: 'Company', exact: true })
    ).toHaveValue('Acme')
  })
}
