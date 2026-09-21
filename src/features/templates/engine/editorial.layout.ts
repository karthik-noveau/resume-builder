import type { Resume, SectionType } from '@/shared/types/resume.types'
import type { FontPreset } from '@/shared/types/font.types'
import type { ClipShape, LayoutStyles } from '@/shared/types/layout.types'
import type { LayoutBuilder } from './layout.builder'
import type { ResolvedPalette } from './template.kit'
import { contactItems, buildContactLineNodes, measureContactHeight } from './contact.layout'
import { estimateStyledTextHeight, estimateWrappedTextHeight } from './layout.utils'
import type { FontFamily, FontWeight } from '@/shared/types/font.types'

export interface EditorialSpec {
  family: 'portrait-rail' | 'split-editorial' | 'architect-grid' | 'banner-columns' | 'type-poster'
  photo: ClipShape
  treatment: 'crown' | 'ribbon' | 'frame' | 'rule' | 'cutout'
  side?: 'left' | 'right'
  panelTone?: 'dark' | 'light'
  paper?: boolean
  stackedName?: boolean
  panelWidth?: number
  panelShape?: 'rounded'
  skillStyle?: 'bars' | 'dots'
}

type RenderSection = (
  builder: LayoutBuilder,
  type: SectionType,
  x: number,
  width: number,
  palette: ResolvedPalette
) => void

/** Five full-page compositions. The photograph, typography, body columns and
 * panel geometry are laid out together, not applied as interchangeable headers.
 * Column cursors stay independent on all continuation pages.
 */
export function renderEditorialLayout(
  b: LayoutBuilder,
  spec: EditorialSpec,
  resume: Resume,
  fp: FontPreset,
  c: ResolvedPalette,
  renderSection: RenderSection
): void {
  const x = b.x
  const w = b.contentW
  const top = b.margins.top
  const gap = 26
  const pageFill = spec.paper ? c.surfaceElevated : '#ffffff'
  const showPortrait = resume.settings.showProfileImage
  const hasPhoto = showPortrait && !!resume.personalInfo.profileImage
  const initials = (resume.personalInfo.fullName || 'Your Name')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  const contacts = contactItems(resume.personalInfo, [
    'email',
    'phone',
    'location',
    resume.personalInfo.website ? 'website' : 'linkedin',
  ])
  const sectionOrder = resume.sectionOrder.filter((type) => type !== 'custom')
  const panelC: ResolvedPalette = {
    ...c,
    textPrimary: c.panelText,
    textSecondary: c.panelSecondaryText,
    textMuted: c.panelSecondaryText,
    sectionTitle: c.panelText,
    sectionDescription: c.panelSecondaryText,
    sectionBorder: c.primary,
    sectionIcon: c.panelText,
    sectionBackground: c.panelBackground,
    divider: spec.panelTone === 'dark' ? c.panelSecondaryText : c.divider,
  }
  const measure = (text: string, width: number, size: number, lineHeight: number, tracking = 0, family: FontFamily = fp.bodyFamily, weight: FontWeight = 400) =>
    Math.max(
      estimateStyledTextHeight(text, width, size, lineHeight, tracking, family, weight),
      estimateWrappedTextHeight(text, width, size, lineHeight, family, weight)
    )
  const rect = (
    builder: LayoutBuilder,
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    fill: string,
    shape?: ClipShape
  ) => builder.node('rect', rx, ry, rw, rh, { backgroundColor: fill }, { clipShape: shape })
  const drawRect = (
    builder: LayoutBuilder,
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    fill: string,
    shape?: ClipShape
  ) => {
    builder.currentPage.nodes.push(rect(builder, rx, ry, rw, rh, fill, shape))
  }
  const portrait = (
    builder: LayoutBuilder,
    px: number,
    py: number,
    pw: number,
    ph: number,
    ring = false
  ) => {
    if (!showPortrait) return
    if (ring) drawRect(builder, px - 4, py - 4, pw + 8, ph + 8, c.primary, spec.photo)
    if (hasPhoto) {
      builder.currentPage.nodes.push(
        builder.node(
          'image',
          px,
          py,
          pw,
          ph,
          {},
          {
            imageId: resume.personalInfo.profileImage,
            clipShape: spec.photo,
            panelTarget: 'personal-info',
            panelField: 'profileImage',
          }
        )
      )
    } else {
      // Fallback for direct layout callers without an image; a hidden portrait
      // never renders initials, a background, or a decorative frame.
      drawRect(builder, px, py, pw, ph, c.primary, spec.photo)
      const size = Math.min(pw * 0.29, 46)
      builder.currentPage.nodes.push(
        builder.node(
          'text',
          px,
          py + (ph - size * 1.2) / 2,
          pw,
          size * 1.2,
          {
            fontFamily: fp.headingFamily,
            fontSize: size,
            fontWeight: fp.headingFamily === 'IBMPlexSans' ? 600 : 700,
            color: contrastInk(c.primary),
            lineHeight: 1.2,
            textAlign: 'center',
          },
          { content: initials, panelTarget: 'personal-info', panelField: 'profileImage' }
        )
      )
    }
  }
  const nameBlock = (
    builder: LayoutBuilder,
    nx: number,
    ny: number,
    nw: number,
    palette: ResolvedPalette,
    align: LayoutStyles['textAlign'] = 'left',
    rail = false
  ) => {
    let name = resume.personalInfo.fullName || 'Your Name'
    if (spec.stackedName) name = name.replace(/\s+/, '\n')
    if (
      spec.family === 'type-poster' ||
      spec.family === 'banner-columns' ||
      spec.treatment === 'cutout'
    )
      name = name.toUpperCase()
    let size = rail ? Math.min(fp.scale.name, 25) : fp.scale.name
    const headingLine = 1.08
    const weight = fp.headingFamily === 'IBMPlexSans' ? 600 : fp.headingFamily === 'Inter' ? 800 : 700
    const measuredWidth = nw
    // Long identities retain a strong hierarchy without taking over the page.
    while (
      size > (rail ? 23 : 31) &&
      measure(name, measuredWidth, size, headingLine, 0, fp.headingFamily, weight) > (rail ? 115 : 150)
    )
      size--
    const nameH = measure(name, measuredWidth, size, headingLine, 0, fp.headingFamily, weight)
    builder.currentPage.nodes.push(
      builder.node(
        'text',
        nx,
        ny,
        nw,
        nameH,
        {
          fontFamily: fp.headingFamily,
          fontSize: size,
          fontWeight: weight,
          color: palette.textPrimary,
          lineHeight: headingLine,
          textAlign: align,
        },
        { content: name, editRef: { kind: 'personal-info', field: 'fullName' } }
      )
    )
    let end = ny + nameH
    const headline = resume.personalInfo.headline
    if (headline) {
      const h = measure(headline, nw, fp.scale.headline, 1.4)
      builder.currentPage.nodes.push(
        builder.node(
          'text',
          nx,
          end + 8,
          nw,
          h,
          {
            fontFamily: fp.bodyFamily,
            fontSize: fp.scale.headline,
            fontWeight: 400,
            color: palette.textSecondary,
            lineHeight: 1.4,
            textAlign: align,
          },
          { content: headline, editRef: { kind: 'personal-info', field: 'headline' } }
        )
      )
      end += h + 8
    }
    return end
  }
  const contactRows = (
    builder: LayoutBuilder,
    cx: number,
    cw: number,
    palette: ResolvedPalette
  ) => {
    const icons = {
      email: 'mail',
      phone: 'phone',
      location: 'map-pin',
      website: 'globe',
      linkedin: 'linkedin',
    } as const
    for (const item of contacts) {
      const h = measure(item.content, cw - 19, fp.scale.small, 1.45)
      builder.ensureSpace(h + 6)
      builder.currentPage.nodes.push(
        builder.node(
          'icon',
          cx,
          builder.y + 1,
          10,
          10,
          { color: palette.primary },
          {
            iconName: icons[item.field as keyof typeof icons] ?? 'globe',
            panelTarget: 'personal-info',
            panelField: item.field,
          }
        )
      )
      builder.currentPage.nodes.push(
        builder.node(
          'text',
          cx + 19,
          builder.y,
          cw - 19,
          h,
          {
            fontFamily: fp.bodyFamily,
            fontSize: fp.scale.small,
            fontWeight: 400,
            color: palette.textSecondary,
            lineHeight: 1.45,
            textAlign: 'left',
          },
          { content: item.content, editRef: { kind: 'personal-info', field: item.field } }
        )
      )
      builder.advanceY(h + 6)
    }
    if (contacts.length) builder.advanceY(12)
  }
  const contactStrip = (builder: LayoutBuilder, cy: number, dark = false) => {
    if (!contacts.length) return cy
    const height = measureContactHeight(contacts, w - 24, fp.scale.small, 1.55) + 20
    const ink = dark ? '#ffffff' : c.textSecondary
    drawRect(builder, x, cy, w, height, dark ? c.textPrimary : c.panelBackground, spec.panelShape)
    const line = buildContactLineNodes(
      builder,
      contacts,
      x + 12,
      cy + 10,
      w - 24,
      {
        fontFamily: fp.bodyFamily,
        fontSize: fp.scale.small,
        fontWeight: 400,
        color: ink,
        lineHeight: 1.55,
        textAlign: 'center',
      },
      '  ·  '
    )
    builder.currentPage.nodes.push(...line.nodes)
    return cy + height
  }
  const columns = (
    startY: number,
    options: {
      leftSections?: SectionType[]
      panelFill?: boolean
      line?: boolean
      portraitInPanel?: boolean
      contactsInPanel?: boolean
    } = {}
  ) => {
    const pw = (w - gap) * (spec.panelWidth ?? 0.34)
    const mw = w - gap - pw
    const right = spec.side === 'right'
    const px = right ? x + mw + gap : x
    const mx = right ? x : x + pw + gap
    const inset = options.panelFill ? 14 : 0
    const panel = b.forkColumn()
    b.seekY(startY + inset)
    panel.seekY(startY + inset)
    if (options.portraitInPanel && showPortrait) {
      const photoW = pw - inset * 2
      const photoH = spec.photo === 'circle' ? photoW : photoW * 1.1
      portrait(panel, px + inset, panel.y, photoW, photoH)
      panel.advanceY(photoH + 20)
    }
    if (options.contactsInPanel)
      contactRows(panel, px + inset, pw - inset * 2, options.panelFill ? panelC : c)
    const leftSections = new Set(options.leftSections ?? ['education', 'skills', 'certifications'])
    for (const type of sectionOrder) {
      if (leftSections.has(type))
        renderSection(panel, type, px + inset, pw - inset * 2, options.panelFill ? panelC : c)
      else renderSection(b, type, mx, mw, c)
    }
    b.mergeColumn(panel)
    b.allPages.forEach((page, index) => {
      const py = index === 0 ? startY : top
      if (options.panelFill)
        page.nodes.unshift(
          rect(
            b,
            px,
            py,
            pw,
            Math.max(0, b.availableBottom - py),
            c.panelBackground,
            spec.panelShape
          )
        )
      if (options.line)
        page.nodes.unshift(
          rect(
            b,
            right ? px - gap / 2 : mx - gap / 2,
            py,
            0.8,
            Math.max(0, b.availableBottom - py),
            c.primary
          )
        )
    })
  }

  if (spec.family === 'portrait-rail') {
    const pw = b.pageW * (spec.panelWidth ?? 0.34)
    const right = spec.side === 'right'
    const px = right ? b.pageW - pw : 0
    const pad = 24
    const cx = px + pad
    const cw = pw - pad * 2
    const mx = right ? x : pw + gap
    const mw = right ? b.pageW - pw - gap - x : b.pageW - mx - b.margins.right
    const main = b.forkColumn()
    const photoW = Math.min(cw, 133)
    const photoH = spec.photo === 'circle' ? photoW : photoW * 1.15
    const photoY = spec.treatment === 'crown' ? top + 3 : top
    if (showPortrait && spec.treatment === 'crown') drawRect(b, px, 0, pw, photoY + photoH * 0.54, c.primary)
    if (showPortrait && spec.treatment === 'ribbon')
      drawRect(b, cx - 8, 0, photoW + 16, photoY + photoH * 0.65, c.primary)
    portrait(
      b,
      cx + (cw - photoW) / 2,
      photoY,
      photoW,
      photoH,
      spec.treatment === 'crown' || spec.treatment === 'frame'
    )
    b.seekY(
      nameBlock(
        b,
        cx,
        showPortrait ? photoY + photoH + 18 : top,
        cw,
        panelC,
        spec.treatment === 'crown' ? 'center' : 'left',
        true
      ) + 20
    )
    drawRect(b, cx, b.y - 10, spec.treatment === 'frame' ? cw : 38, 3, c.primary)
    if (contacts.length) {
      const title = resume.sectionTitles?.contact ?? 'Contact'
      const h = measure(title, cw, fp.scale.sectionTitle, 1.2)
      b.currentPage.nodes.push(
        b.node(
          'text',
          cx,
          b.y,
          cw,
          h,
          {
            fontFamily: fp.headingFamily,
            fontSize: fp.scale.sectionTitle,
            fontWeight: fp.headingFamily === 'IBMPlexSans' ? 600 : 700,
            color: panelC.textPrimary,
            lineHeight: 1.2,
            textAlign: 'left',
          },
          {
            content: title,
            editRef: { kind: 'section-title', sectionType: 'contact', defaultValue: 'Contact' },
          }
        )
      )
      b.advanceY(h + 10)
    }
    contactRows(b, cx, cw, panelC)
    const panelSections = new Set<SectionType>(['education', 'skills', 'certifications'])
    for (const type of sectionOrder) {
      if (panelSections.has(type)) renderSection(b, type, cx, cw, panelC)
      else renderSection(main, type, mx, mw, c)
    }
    b.mergeColumn(main)
    b.allPages.forEach((page) => {
      page.nodes.unshift(rect(b, px, 0, pw, b.pageH, c.panelBackground))
      if (spec.treatment === 'frame')
        page.nodes.unshift(rect(b, right ? px - 3 : pw, 0, 3, b.pageH, c.primary))
    })
  } else if (spec.family === 'split-editorial') {
    const photoW = showPortrait ? Math.min(w * 0.36, 184) : 0
    const photoH = spec.photo === 'circle' ? photoW : photoW * 1.04
    const photoLeft = spec.side === 'left'
    const px = photoLeft ? x : x + w - photoW
    const nx = showPortrait && photoLeft ? x + photoW + gap : x
    const nw = showPortrait ? w - photoW - gap : w
    portrait(b, px, top, photoW, photoH, spec.treatment === 'frame')
    if (spec.treatment === 'cutout')
      drawRect(b, nx, top + 12, Math.min(110, nw), 45, c.primary, 'circle')
    const nameEnd = nameBlock(b, nx, top + 6, nw, c)
    const headerEnd = Math.max(top + photoH, nameEnd) + 18
    b.seekY(headerEnd)
    const contactEnd = contactStrip(b, headerEnd, spec.panelTone === 'dark')
    columns(contactEnd + 24, {
      leftSections: ['summary', 'education', 'skills'],
      panelFill: spec.treatment === 'frame',
      line: spec.treatment === 'rule',
    })
  } else if (spec.family === 'architect-grid') {
    const pw = (w - gap) * (spec.panelWidth ?? 0.31)
    const photoH = showPortrait ? 164 : 0
    portrait(b, x + 8, top, pw - 16, photoH)
    const nx = showPortrait ? x + pw + gap : x
    const nw = showPortrait ? w - pw - gap : w
    const nameEnd = nameBlock(b, nx, top + 6, nw, c)
    b.seekY(nameEnd + 16)
    contactRows(b, nx, nw, c)
    const end = Math.max(top + photoH, b.y) + 18
    drawRect(b, x, end, w, spec.treatment === 'frame' ? 3 : 0.8, c.primary)
    columns(end + 20, { line: true, panelFill: spec.treatment === 'frame' })
  } else if (spec.family === 'banner-columns') {
    const nameEnd = nameBlock(
      b,
      x + 12,
      top,
      w - 24,
      c,
      spec.treatment === 'rule' ? 'left' : 'center'
    )
    const end = contactStrip(b, nameEnd + 20, true)
    columns(end + 22, { panelFill: true, portraitInPanel: true })
  } else {
    // Oversized typographic posters keep the photo as a secondary, offset mark.
    const photoW = showPortrait ? (spec.treatment === 'cutout' ? 130 : 105) : 0
    const right = spec.side !== 'left'
    const px = right ? x + w - photoW : x
    const nx = right || !showPortrait ? x : x + photoW + gap
    const nw = showPortrait ? w - photoW - gap : w
    portrait(b, px, top + 7, photoW, photoW, spec.treatment === 'frame')
    const nameEnd = nameBlock(b, nx, top, nw, c)
    const end = Math.max(nameEnd, showPortrait ? top + photoW + 7 : top) + 18
    drawRect(b, x, end, w, spec.treatment === 'cutout' ? 6 : 1, c.primary)
    const contactEnd = contactStrip(b, end + 12, spec.panelTone === 'dark')
    columns(contactEnd + 22, {
      leftSections:
        spec.panelTone === 'dark'
          ? ['summary', 'skills', 'certifications']
          : ['education', 'skills', 'certifications'],
      panelFill: spec.treatment === 'cutout' || spec.panelTone === 'dark',
      line: spec.treatment === 'rule',
    })
  }

  // All pages inherit the same paper tone, including independent-column overflow.
  if (spec.paper)
    b.allPages.forEach((page) => page.nodes.unshift(rect(b, 0, 0, b.pageW, b.pageH, pageFill)))
}

export function contrastInk(hex: string): string {
  const clean = hex.replace('#', '')
  const rgb =
    clean.length === 3
      ? clean
          .split('')
          .map((char) => char + char)
          .join('')
      : clean
  const r = parseInt(rgb.slice(0, 2), 16)
  const g = parseInt(rgb.slice(2, 4), 16)
  const b = parseInt(rgb.slice(4, 6), 16)
  return r * 0.299 + g * 0.587 + b * 0.114 > 155 ? '#17212b' : '#ffffff'
}
