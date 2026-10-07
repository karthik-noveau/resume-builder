import type * as PdfJs from 'pdfjs-dist'
import { expect, test, type Page } from '@playwright/test'
import { createResume, createResumeInFullEditor, goToFullEditor } from '../utils/flows'

async function editName(page: Page, value: string) {
  const name = page.getByRole('textbox', { name: 'Full name', exact: true })
  await name.fill(value)
  await name.blur()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
}
async function uploadPhoto(page: Page, color = '#7c3aed') {
  const image = await page.evaluate((color) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 40
    const context = canvas.getContext('2d')!
    context.fillStyle = color
    context.fillRect(0, 0, 40, 40)
    return canvas.toDataURL('image/png').split(',')[1]
  }, color)
  await page.locator('input[type=file]').setInputFiles({
    name: 'photo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(image, 'base64'),
  })
  await expect(page.getByRole('button', { name: 'Change photo', exact: true })).toBeVisible()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
}
async function storedPhotos(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const request = indexedDB.open('ResumeStudioDB')
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const query = db.transaction('images').objectStore('images').getAllKeys()
          query.onsuccess = () => {
            resolve(query.result as string[])
            db.close()
          }
          query.onerror = () => {
            reject(query.error)
            db.close()
          }
        }
      })
  )
}

test('photo removal and replacement can be undone, shared, and backed up after reload', async ({
  page,
}) => {
  await createResume(page, 'Foundation')
  await goToFullEditor(page)
  await page.getByText('Profile image', { exact: true }).click()
  await uploadPhoto(page)
  const originalIds = await storedPhotos(page)
  await page.getByRole('button', { name: 'Remove', exact: true }).click()
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Change photo', exact: true })).toBeVisible()
  expect(await storedPhotos(page)).toEqual(originalIds)
  await uploadPhoto(page, '#336699')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await page.reload()
  await page.getByText('Profile image', { exact: true }).click()
  await expect(page.getByRole('button', { name: 'Change photo', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Share resume', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Share link' })).toHaveValue(/mode=view#resume=/)
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await page.goto('/settings')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download backup', exact: true }).click()
  expect((await download).suggestedFilename()).toContain('Backup')
})

for (const choice of ['Reload saved version', 'Save my draft as a copy']) {
  test(`a stale tab cannot overwrite a saved edit: ${choice}`, async ({ page, context }) => {
    await createResumeInFullEditor(page)
    await editName(page, 'Original Name')
    const url = page.url()
    const other = await context.newPage()
    await other.goto(url)
    await expect(other.getByRole('textbox', { name: 'Full name', exact: true })).toHaveValue(
      'Original Name'
    )
    await editName(page, 'Saved by tab A')
    const email = other.getByRole('textbox', { name: 'Email', exact: true })
    await email.fill('draft@example.com')
    await email.blur()
    const conflict = other.getByRole('dialog', { name: 'This resume changed in another tab' })
    await expect(conflict).toBeVisible()
    await conflict.getByRole('button', { name: choice, exact: true }).click()
    await expect(conflict).not.toBeVisible()
    if (choice === 'Save my draft as a copy') {
      await expect(other).not.toHaveURL(url)
      await expect(other.getByRole('textbox', { name: 'Full name', exact: true })).toHaveValue(
        'Original Name'
      )
      await expect(email).toHaveValue('draft@example.com')
    } else {
      await expect(other.getByRole('textbox', { name: 'Full name', exact: true })).toHaveValue(
        'Saved by tab A'
      )
      await expect(email).toHaveValue('')
    }
    await page.reload()
    await expect(page.getByRole('textbox', { name: 'Full name', exact: true })).toHaveValue(
      'Saved by tab A'
    )
    await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toHaveValue('')
    await other.close()
  })
}

test('saved version recovery survives reload and preserves the replaced version', async ({
  page,
}) => {
  await createResumeInFullEditor(page)
  await editName(page, 'Earlier Name')
  await editName(page, 'Current Name')
  await page.reload()
  await page.getByRole('button', { name: 'Version history', exact: true }).click()
  const history = page.getByRole('dialog', { name: 'Version history', exact: true })
  await history
    .getByRole('listitem')
    .filter({ hasText: 'Earlier Name' })
    .getByRole('button', { name: 'Restore this version' })
    .click()
  await expect(history).not.toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Full name', exact: true })).toHaveValue(
    'Earlier Name'
  )
  await page.reload()
  await page.getByRole('button', { name: 'Version history', exact: true }).click()
  await expect(history.getByRole('listitem').filter({ hasText: 'Current Name' })).toBeVisible()
})

test('Trash restores photos and requires confirmation before permanent deletion', async ({
  page,
}) => {
  await createResume(page, 'Foundation')
  await goToFullEditor(page)
  await editName(page, 'Recover Me')
  await page.getByText('Profile image', { exact: true }).click()
  await uploadPhoto(page)
  const remove = async () => {
    await page.getByRole('link', { name: 'Back to dashboard' }).click()
    await page.getByRole('button', { name: /^Actions for/ }).click()
    await page.getByRole('menuitem', { name: /delete/i }).click()
    await page
      .getByRole('dialog', { name: 'Delete Resume', exact: true })
      .getByRole('button', { name: 'Delete', exact: true })
      .click()
    await expect(page.getByRole('article')).toHaveCount(0)
    await page.getByRole('button', { name: 'Trash', exact: true }).click()
  }
  await remove()
  const trash = page.getByRole('dialog', { name: 'Trash', exact: true })
  await trash.getByRole('button', { name: 'Restore resume' }).click()
  await expect(page.getByRole('textbox', { name: 'Full name', exact: true })).toHaveValue(
    'Recover Me'
  )
  await page.getByText('Profile image', { exact: true }).click()
  await expect(page.getByRole('button', { name: 'Change photo', exact: true })).toBeVisible()
  await remove()
  await trash.getByRole('button', { name: 'Delete permanently', exact: true }).click()
  const confirmation = page.getByRole('dialog', { name: 'Delete permanently?', exact: true })
  await confirmation.getByRole('button', { name: 'Keep in Trash' }).click()
  await expect(trash.getByRole('button', { name: 'Restore resume' })).toBeVisible()
  await trash.getByRole('button', { name: 'Delete permanently', exact: true }).click()
  await confirmation.getByRole('button', { name: 'Delete permanently', exact: true }).click()
  await expect(trash.getByText('Trash is empty.')).toBeVisible()
  expect(await storedPhotos(page)).toEqual([])
})

test('read-only sharing renders and downloads without importing a resume or photo', async ({
  page,
  browser,
}) => {
  await createResume(page, 'Foundation')
  await goToFullEditor(page)
  await editName(page, 'Read Only Person')
  await page.getByText('Profile image', { exact: true }).click()
  await uploadPhoto(page)
  await page.getByRole('button', { name: 'Share resume', exact: true }).click()
  const linkField = page.getByRole('textbox', { name: 'Share link' })
  await expect(linkField).toHaveValue(/mode=view#resume=/)
  const recipient = await browser.newContext()
  try {
    const view = await recipient.newPage()
    await view.goto(await linkField.inputValue())
    await expect(view.getByRole('heading', { name: 'Read Only Person' })).toBeVisible()
    await expect(view.locator('.react-pdf__Page canvas')).toBeVisible()
    await expect(view.getByRole('textbox', { name: 'Full name' })).toHaveCount(0)
    const download = view.waitForEvent('download')
    await view.getByRole('button', { name: 'Download PDF' }).click()
    expect((await download).suggestedFilename()).toContain('Read_Only_Person')
    await view.goto('/app')
    await expect(view.getByText('No resumes yet', { exact: true })).toBeVisible()
    expect(await storedPhotos(view)).toEqual([])
  } finally {
    await recipient.close()
  }
})

test('a fresher can finish guided setup without adding work experience', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await createResume(page, 'Foundation')
  for (const step of ['Personal details', 'Summary', 'Work experience', 'Education', 'Skills']) {
    await expect(page.getByRole('heading', { name: step, exact: true })).toBeVisible()
    if (step === 'Work experience')
      await page.getByRole('checkbox', { name: 'I don’t have work experience yet' }).check()
    else await page.getByRole('button', { name: 'Fill with example', exact: true }).click()
    await page
      .getByRole('button', { name: step === 'Skills' ? 'Finish' : 'Next', exact: true })
      .click()
  }
  await expect(page).toHaveURL(/\/editor\/[^/]+$/)
  await page.goto(page.url() + '/guided')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(
    page.getByRole('checkbox', { name: 'I don’t have work experience yet' })
  ).toBeChecked()
})

test('international names remain exact selectable text in the exported PDF', async ({ page }) => {
  const { readFile } = await import('node:fs/promises')
  const [apiSource, workerSource] = await Promise.all([
    readFile('node_modules/pdfjs-dist/build/pdf.mjs', 'utf8'),
    readFile('node_modules/pdfjs-dist/build/pdf.worker.min.mjs', 'utf8'),
  ])
  await createResumeInFullEditor(page)
  for (const name of ['Łukasz Żółć கார்த்திக்', 'किरण शर्मा']) {
    await editName(page, name)
    await page.getByRole('button', { name: 'Preview & export', exact: true }).click()
    const preview = page.getByRole('dialog', { name: 'Preview & export', exact: true })
    await expect(preview.getByRole('button', { name: 'Export PDF', exact: true })).toBeEnabled()
    const downloading = page.waitForEvent('download')
    await preview.getByRole('button', { name: 'Export PDF', exact: true }).click()
    const bytes = Array.from(await readFile((await (await downloading).path())!))
    const text = await page.evaluate(
      async ({ bytes, apiSource, workerSource }) => {
        const api = URL.createObjectURL(new Blob([apiSource], { type: 'text/javascript' }))
        const worker = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }))
        try {
          const pdfjs = (await import(api)) as typeof PdfJs
          pdfjs.GlobalWorkerOptions.workerSrc = worker
          const task = pdfjs.getDocument({ data: new Uint8Array(bytes) })
          try {
            const pdf = await task.promise
            const content = await (await pdf.getPage(1)).getTextContent()
            return content.items
              .filter((item) => 'str' in item)
              .map((item) => item.str)
              .join('')
          } finally {
            await task.destroy()
          }
        } finally {
          URL.revokeObjectURL(api)
          URL.revokeObjectURL(worker)
        }
      },
      { bytes, apiSource, workerSource }
    )
    expect(text).toContain(name)
    expect(text).not.toContain('\u0000')
    await preview.getByRole('button', { name: 'Back to editor' }).click()
  }
})
