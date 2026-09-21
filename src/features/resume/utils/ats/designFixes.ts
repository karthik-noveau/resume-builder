import { getTemplateById, templateRenderer } from '@/features/templates/registry/template.registry'
import { resolveResumeTheme, useThemeStore } from '@/shared/stores/theme.store'
import type { Resume } from '@/shared/types/resume.types'
import type { LayoutTree } from '@/shared/types/layout.types'
import type { TemplateDefinition } from '@/shared/types/template.types'
import {
  STYLE_ROLE_LABELS,
  type ElementStyle,
  type ResumeStyleOverrides,
} from '@/shared/types/style.types'
import type { AtsFixPlan } from './fixes'
import { inspectAtsLayout, MIN_READABLE_TEXT_PT } from './layoutChecks'

type Render = (resume: Resume) => LayoutTree
const METRIC_KEYS = [
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'paddingTopPt',
  'paddingRightPt',
  'paddingBottomPt',
  'paddingLeftPt',
] as const satisfies readonly (keyof ElementStyle)[]

function readableText(resume: Resume, tree: LayoutTree, render: Render) {
  const { tiny, leaves } = inspectAtsLayout(tree)
  if (!tiny.length) return null
  const roles = { ...resume.styleOverrides?.roles }
  const elements = { ...resume.styleOverrides?.elements }
  const changes: AtsFixPlan['changes'] = []
  // Shared styles participate in pagination. Only raise uniformly small roles;
  // a small label must never cause larger body text to shrink.
  for (const role of new Set(tiny.map(({ node }) => node.styleRole))) {
    if (
      !role ||
      leaves.some(
        ({ node }) => node.styleRole === role && node.styles.fontSize > MIN_READABLE_TEXT_PT
      )
    )
      continue
    const previous = roles[role]
    if ((previous?.fontSize ?? 0) >= MIN_READABLE_TEXT_PT) continue
    roles[role] = { ...previous, fontSize: MIN_READABLE_TEXT_PT }
    changes.push({
      label: STYLE_ROLE_LABELS[role],
      before: previous?.fontSize
        ? `${previous.fontSize} pt`
        : `${Math.min(...leaves.filter(({ node }) => node.styleRole === role).map(({ node }) => node.styles.fontSize))} pt template text`,
      after: `${MIN_READABLE_TEXT_PT} pt text style`,
    })
  }
  const updated: Resume = {
    ...resume,
    styleOverrides: { ...resume.styleOverrides, roles, elements },
  }
  let after = render(updated)
  const changedElements = new Set<string>()
  // Some templates derive labels from another role, and local overrides outrank
  // shared styles. Address the remaining small elements, then recheck the tree.
  for (let pass = 0; pass < 2; pass++) {
    const remaining = inspectAtsLayout(after).tiny
    if (!remaining.length) break
    for (const { node } of remaining) {
      if (!node.styleKey) return null
      elements[node.styleKey] = { ...elements[node.styleKey], fontSize: MIN_READABLE_TEXT_PT }
      changedElements.add(node.styleKey)
    }
    after = render(updated)
  }
  if (inspectAtsLayout(after).tiny.length || inspectAtsLayout(after).outside.length) return null
  if (changedElements.size)
    changes.push({
      label: 'Individual text sizes',
      before: `${changedElements.size} text elements below ${MIN_READABLE_TEXT_PT} pt`,
      after: `Raised to ${MIN_READABLE_TEXT_PT} pt`,
    })
  return { updated, after, changes }
}

function withoutMetrics(
  overrides: ResumeStyleOverrides | undefined,
  includeRoles: boolean
): ResumeStyleOverrides {
  const clean = (style: ElementStyle) => {
    const result = { ...style }
    for (const key of METRIC_KEYS) delete result[key]
    return result
  }
  return {
    ...overrides,
    roles: includeRoles
      ? Object.fromEntries(
          Object.entries(overrides?.roles ?? {}).map(([key, style]) => [key, clean(style)])
        )
      : overrides?.roles,
    elements: Object.fromEntries(
      Object.entries(overrides?.elements ?? {}).map(([key, style]) => [key, clean(style)])
    ),
  }
}

/** Offers only changes that resolve the measured issue in a freshly rendered layout. */
export function planDesignFix(
  kind: 'readable-text' | 'page-bounds',
  resume: Resume,
  templates: TemplateDefinition[]
): AtsFixPlan | null {
  const render: Render = (draft) => {
    const template =
      templates.find((item) => item.id === draft.templateId) ?? getTemplateById(draft.templateId)
    if (!template) throw new Error('Template unavailable')
    return templateRenderer.render(
      draft,
      template,
      resolveResumeTheme(draft.themeId, draft.customPrimaryColor),
      useThemeStore.getState().getFontPresetById(draft.fontPresetId)
    )
  }
  try {
    const before = render(resume)
    const initial = inspectAtsLayout(before)
    const finish = (
      title: string,
      patch: Partial<Resume>,
      changes: AtsFixPlan['changes'],
      after: LayoutTree
    ): AtsFixPlan => ({
      title,
      patch,
      changes,
      layoutResult: {
        beforePages: before.pages.length,
        afterPages: after.pages.length,
        message:
          kind === 'readable-text'
            ? `All rendered text is at least ${MIN_READABLE_TEXT_PT} pt and stays within the page.`
            : 'All rendered text boxes stay within the page.',
      },
    })
    if (kind === 'readable-text') {
      const result = readableText(resume, before, render)
      return result
        ? finish(
            'Raise small text to 9 pt',
            { styleOverrides: result.updated.styleOverrides },
            result.changes,
            result.after
          )
        : null
    }
    if (!initial.outside.length) return null
    const localReset = withoutMetrics(resume.styleOverrides, false)
    const fullReset = withoutMetrics(resume.styleOverrides, true)
    const settings = {
      ...resume.settings,
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      typographyScale: 'standard' as const,
      lineHeightDensity: 'balanced' as const,
      spacingDensity: 'balanced' as const,
    }
    const localChange = {
      label: 'Individual text sizing & spacing',
      before: 'Custom overrides',
      after: 'Use shared text styles; keep colors and fonts',
    }
    const allChange = {
      label: 'Text sizing & spacing',
      before: 'Custom overrides',
      after: 'Use template sizes and spacing; keep colors and fonts',
    }
    const pageChange = {
      label: 'Page setup',
      before: `${resume.settings.margins.top} / ${resume.settings.margins.right} / ${resume.settings.margins.bottom} / ${resume.settings.margins.left} mm margins · ${resume.settings.typographyScale ?? 'standard'} text · ${resume.settings.lineHeightDensity ?? 'balanced'} leading · ${resume.settings.spacingDensity ?? 'balanced'} spacing`,
      after: '15 mm margins · standard text · balanced leading and spacing',
    }
    const candidates: { title: string; patch: Partial<Resume>; changes: AtsFixPlan['changes'] }[] =
      [
        {
          title: 'Fit content using shared text sizes and spacing',
          patch: { styleOverrides: localReset },
          changes: [localChange],
        },
        {
          title: 'Fit content using template text sizes and spacing',
          patch: { styleOverrides: fullReset },
          changes: [allChange],
        },
        {
          title: 'Restore template sizing and balanced page spacing',
          patch: { styleOverrides: fullReset, settings },
          changes: [allChange, pageChange],
        },
      ]
    const singleColumn =
      templates.find((t) => t.name === 'Clarity' && t.layout === 'single-column') ??
      templates.find((t) => t.layout === 'single-column')
    if (singleColumn && singleColumn.id !== resume.templateId)
      candidates.push({
        title: `Fit content with ${singleColumn.name} and balanced spacing`,
        patch: { styleOverrides: fullReset, settings, templateId: singleColumn.id },
        changes: [
          allChange,
          pageChange,
          {
            label: 'Template',
            before: getTemplateById(resume.templateId)?.name ?? resume.templateId,
            after: `${singleColumn.name} · single column`,
          },
        ],
      })
    for (const candidate of candidates) {
      let after = render({ ...resume, ...candidate.patch })
      if (inspectAtsLayout(after).outside.length) continue
      // Resetting custom sizes must not introduce additional small-text warnings.
      if (inspectAtsLayout(after).tiny.length > initial.tiny.length) {
        const repaired = readableText({ ...resume, ...candidate.patch }, after, render)
        if (!repaired) continue
        candidate.patch.styleOverrides = repaired.updated.styleOverrides
        candidate.changes.push(...repaired.changes)
        after = repaired.after
      }
      return finish(candidate.title, candidate.patch, candidate.changes, after)
    }
  } catch {
    // Leave manual design editing available when this layout cannot be verified.
  }
  return null
}
