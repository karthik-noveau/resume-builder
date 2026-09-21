import type { Resume } from '@/shared/types/resume.types'
import { templateRenderer } from '@/features/templates/engine/template.renderer'
import { getTemplateById } from '@/features/templates/registry/template.registry'
import type { PdfGenerator } from './pdf.generator'
import { logger } from '@/shared/services/logger'
import { useThemeStore, resolveResumeTheme } from '@/shared/stores/theme.store'
import { resumeSchema } from '@/shared/schemas/resume.schema'

export interface GeneratedPdf {
  bytes: Uint8Array
  fileName: string
}

export class ExportService {
  /**
   * pdf-lib and @pdf-lib/fontkit are ~1 MB of the bundle and are only reachable
   * from this one method, so the generator is imported on first export rather
   * than with the editor route. Statically importing it put 565 kB of fontkit
   * into the EditorPage chunk for a page that may never export anything.
   * The promise is cached, so a second export reuses the loaded module.
   */
  private generatorPromise?: Promise<PdfGenerator>

  private loadGenerator(): Promise<PdfGenerator> {
    this.generatorPromise ??= import('./pdf.generator')
      .then((m) => new m.PdfGenerator())
      .catch((error: unknown) => {
        this.generatorPromise = undefined
        throw error
      })
    return this.generatorPromise
  }

  async exportToPdf(resume: Resume): Promise<void> {
    logger.info('Starting PDF export', { resumeId: resume.id })

    try {
      const pdf = await this.generatePdf(resume)
      this.downloadPdf(pdf)

      logger.info('PDF export completed successfully')
    } catch (error) {
      logger.error('PDF export failed', error)
      throw error
    }
  }

  async generatePdf(resume: Resume): Promise<GeneratedPdf> {
    this.validateResume(resume)

    // Let React paint the opening dialog before layout/font work occupies the
    // main thread. This yields a task rather than adding a fixed loading delay.
    await new Promise<void>(resolve => setTimeout(resolve, 0))

    const { template, theme, fontPreset } = this.getExportContext(resume)

    logger.debug('Rendering LayoutTree for export')
    const layoutTree = templateRenderer.render(resume, template, theme, fontPreset)

    logger.debug('Generating PDF bytes')
    const generator = await this.loadGenerator()
    const bytes = await generator.generate(layoutTree)

    return { bytes, fileName: this.buildFileName(resume) }
  }

  createPreviewUrl(pdf: GeneratedPdf): string {
    return URL.createObjectURL(this.toBlob(pdf.bytes))
  }

  downloadPdf(pdf: GeneratedPdf): void {
    const url = URL.createObjectURL(this.toBlob(pdf.bytes))
    const link = document.createElement('a')
    link.href = url
    link.download = pdf.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  private validateResume(resume: Resume) {
    const result = resumeSchema.safeParse(resume)
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.message).join(', ')
      throw new Error(`Resume validation failed: ${issues}`)
    }

    if (!resume.personalInfo.fullName.trim()) {
      throw new Error('Full Name is required for export')
    }
    if (!resume.personalInfo.email.trim()) {
      throw new Error('Email is required for export')
    }
  }

  private getExportContext(resume: Resume) {
    const template = getTemplateById(resume.templateId)
    if (!template) throw new Error(`Template not found: ${resume.templateId}`)

    const theme = resolveResumeTheme(resume.themeId, resume.customPrimaryColor)

    const fontPreset =
      useThemeStore.getState().availableFontPresets.find((fp) => fp.id === resume.fontPresetId) ||
      useThemeStore.getState().availableFontPresets[0]

    return { template, theme, fontPreset }
  }

  private buildFileName(resume: Resume): string {
    const name = resume.personalInfo.fullName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
    return `${name || 'Resume'}_${new Date().toISOString().split('T')[0]}.pdf`
  }

  private toBlob(bytes: Uint8Array): Blob {
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    return blob
  }
}

export const exportService = new ExportService()
