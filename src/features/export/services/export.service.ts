import type { Resume } from '@/shared/types/resume.types'
import { templateRenderer } from '@/features/templates/engine/template.renderer'
import { ALL_TEMPLATES } from '@/features/templates/registry/template.registry'
import { PdfGenerator } from './pdf.generator'
import { logger } from '@/shared/services/logger'
import { useThemeStore, resolveResumeTheme } from '@/shared/stores/theme.store'
import { resumeSchema } from '@/shared/schemas/resume.schema'

export class ExportService {
  private pdfGenerator = new PdfGenerator()

  async exportToPdf(resume: Resume): Promise<void> {
    logger.info('Starting PDF export', { resumeId: resume.id })

    try {
      // 1. Validate resume
      this.validateResume(resume)

      // 2. Get active template, theme, fontPreset
      const { template, theme, fontPreset } = this.getExportContext(resume)

      // 3. Render LayoutTree
      logger.debug('Rendering LayoutTree for export')
      const layoutTree = templateRenderer.render(resume, template, theme, fontPreset)

      // 4. Generate PDF
      logger.debug('Generating PDF bytes')
      const pdfBytes = await this.pdfGenerator.generate(layoutTree)

      // 5. Trigger download
      this.downloadPdf(pdfBytes, this.buildFileName(resume))
      
      logger.info('PDF export completed successfully')
    } catch (error) {
      logger.error('PDF export failed', error)
      throw error
    }
  }

  private validateResume(resume: Resume) {
    const result = resumeSchema.safeParse(resume)
    if (!result.success) {
      const issues = result.error.issues.map(i => i.message).join(', ')
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
    const template = ALL_TEMPLATES.find(t => t.id === resume.templateId)
    if (!template) throw new Error(`Template not found: ${resume.templateId}`)

    const theme = resolveResumeTheme(resume.themeId, resume.customPrimaryColor)

    const fontPreset = useThemeStore.getState().availableFontPresets.find(fp => fp.id === resume.fontPresetId)
      || useThemeStore.getState().availableFontPresets[0]

    return { template, theme, fontPreset }
  }

  private buildFileName(resume: Resume): string {
    const name = resume.personalInfo.fullName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
    return `${name || 'Resume'}_${new Date().toISOString().split('T')[0]}.pdf`
  }

  private downloadPdf(bytes: Uint8Array, fileName: string) {
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export const exportService = new ExportService()
