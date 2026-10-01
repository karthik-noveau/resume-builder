export const MAX_IMPORT_BYTES = 10 * 1024 * 1024
export const MAX_IMPORT_TEXT = 50000

export async function readResumeFile(file: File): Promise<string> {
  if (file.size > MAX_IMPORT_BYTES) throw new Error('Choose a file smaller than 10 MB.')
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!['pdf', 'docx', 'txt'].includes(extension ?? ''))
    throw new Error('Choose a PDF, DOCX or TXT file.')
  let text = ''
  if (extension === 'txt') text = await file.text()
  if (extension === 'docx') {
    const mammoth = await import('mammoth')
    try {
      text = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value
    } catch {
      throw new Error('Couldn’t read this Word document. Try saving it as DOCX or paste its text.')
    }
  }
  if (extension === 'pdf') {
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()
    const task = pdfjs.getDocument({ data: await file.arrayBuffer() })
    try {
      const document = await task.promise
      if (document.numPages > 30) throw new Error('Choose a PDF with 30 pages or fewer.')
      const pages: string[] = []
      for (let i = 1; i <= document.numPages; i++) {
        const page = await document.getPage(i)
        const content = await page.getTextContent()
        let previousY: number | undefined
        let pageText = ''
        for (const item of content.items) {
          if (!('str' in item)) continue
          const y = Number(item.transform[5])
          if (previousY !== undefined && Math.abs(y - previousY) > 2 && !pageText.endsWith('\n'))
            pageText += '\n'
          pageText += item.str + (item.hasEOL ? '\n' : ' ')
          previousY = y
        }
        pages.push(pageText)
        if (pages.join('\n').length > MAX_IMPORT_TEXT)
          throw new Error('This file has too much text. Import up to 50,000 characters.')
      }
      text = pages.join('\n\n')
    } catch (error) {
      if (error instanceof Error && /30 pages|too much text/.test(error.message)) throw error
      throw new Error('Couldn’t read this PDF. Use an unlocked PDF or paste the resume text.')
    } finally {
      await task.destroy()
    }
  }
  if (!text.trim())
    throw new Error('No text found. For a scanned resume, copy text using OCR and paste it here.')
  if (text.length > MAX_IMPORT_TEXT)
    throw new Error('This file has too much text. Import up to 50,000 characters.')
  return text.trim()
}
