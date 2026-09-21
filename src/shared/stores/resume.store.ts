import { create } from 'zustand'
import type {
  Resume,
  SectionType,
  BaseSectionContract,
  ExperienceSection,
  EducationSection,
  SkillSection,
  ProjectSection,
  CertificationSection,
  CustomSection,
} from '@/shared/types/resume.types'
import type { IconName } from '@/shared/types/layout.types'
import type { ElementStyle, ResumeStyleOverrides, StyleRole } from '@/shared/types/style.types'
import { isEmptyStyle } from '@/shared/types/style.types'
import type { DeepPartial } from '@/shared/types/utils.types'
import type { ParsedResumeData } from '@/features/resume/utils/resumeParser'
import { resumeService } from '@/shared/services/resume.service'
import { logger } from '@/shared/services/logger'
import { useEditorStore } from './editor.store'
import {
  createEmptyExperience,
  createEmptyEducation,
  createEmptySkillSection,
  createEmptyProject,
  createEmptyCertification,
  createEmptyCustomSection,
} from '@/features/resume/utils/section.factory'
import { defaultAppearance, defaultContent } from '@/features/resume/utils/resume.factory'

// ─── Style-override helpers ───────────────────────────────────────────────────

/**
 * Merges a style patch, treating an explicit `undefined` as "clear this
 * property" rather than "leave it alone". The inspector needs both: a colour
 * picker sets a value, and its reset button unsets one, and a plain spread
 * cannot tell those apart.
 */
function mergeStyle(current: ElementStyle | undefined, patch: ElementStyle): ElementStyle {
  const next: ElementStyle = { ...current }
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete next[key as keyof ElementStyle]
    else (next as Record<string, unknown>)[key] = value
  }
  return next
}

function omitKey<T extends object>(source: T, key: keyof T): T {
  const next = { ...source }
  delete next[key]
  return next
}

/** Drops emptied entries so a resume that has been reset stops carrying the
 * husk of its overrides into storage — and so `hasStyleOverrides` stays true
 * only while something is actually overridden. */
function pruneOverrides(overrides: ResumeStyleOverrides): ResumeStyleOverrides | undefined {
  const roles = Object.fromEntries(
    Object.entries(overrides.roles ?? {}).filter(([, style]) => !isEmptyStyle(style))
  ) as ResumeStyleOverrides['roles']
  const elements = Object.fromEntries(
    Object.entries(overrides.elements ?? {}).filter(([, style]) => !isEmptyStyle(style))
  ) as ResumeStyleOverrides['elements']
  const page = overrides.page?.backgroundColor ? overrides.page : undefined

  const result: ResumeStyleOverrides = {}
  if (roles && Object.keys(roles).length) result.roles = roles
  if (elements && Object.keys(elements).length) result.elements = elements
  if (page) result.page = page
  return Object.keys(result).length ? result : undefined
}

// ─── Array helpers ────────────────────────────────────────────────────────────

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr]
  const [item] = result.splice(from, 1)
  if (item !== undefined) result.splice(to, 0, item)
  return result
}

function updateById<T extends BaseSectionContract>(arr: T[], id: string, patch: Partial<T>): T[] {
  return arr.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s))
}

function removeById<T extends BaseSectionContract>(arr: T[], id: string): T[] {
  return arr.filter((s) => s.id !== id)
}

function setAllVisible<T extends BaseSectionContract>(arr: T[], visible: boolean): T[] {
  return arr.map((s) => ({ ...s, visible, updatedAt: new Date().toISOString() }))
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResumeState {
  activeResume: Resume | null
  resumeList: Resume[]
  isLoading: boolean
  isSaving: boolean
  isDirty: boolean
  error: string | null
}

interface ResumeActions {
  loadResumeList(): Promise<void>
  loadResume(id: string): Promise<void>
  createResume(
    templateId: string,
    themeOverride?: { themeId: string; customPrimaryColor?: string }
  ): Promise<string>
  createResumeFromImport(templateId: string, parsed: ParsedResumeData): Promise<string>
  updateResume(patch: DeepPartial<Resume>): void
  updateSection(
    sectionType: SectionType,
    id: string,
    patch: Partial<BaseSectionContract> & Record<string, unknown>
  ): void
  updatePersonalInfo(patch: Partial<Resume['personalInfo']>): void
  updateSettings(patch: Partial<Resume['settings']>): void
  updateSummary(content: string): void
  addSection(sectionType: SectionType): void
  deleteSection(sectionType: SectionType, id: string): void
  reorderSections(sectionType: SectionType, fromIndex: number, toIndex: number): void
  toggleSectionTypeVisibility(sectionType: SectionType): void
  /** Sets a section-header icon override; pass null to fall back to the template default. */
  setSectionIcon(key: string, icon: IconName | null): void
  /** Merges a patch into one text style. Passing `null` for a property clears it. */
  setRoleStyle(role: StyleRole, patch: ElementStyle): void
  /** Merges a patch into one element's own style, keyed by its stable style key. */
  setElementStyle(styleKey: string, patch: ElementStyle): void
  /** Drops every override on one element, so it falls back to its text style. */
  resetElementStyle(styleKey: string): void
  /** Drops every override on one text style. */
  resetRoleStyle(role: StyleRole): void
  setPageBackground(color: string | null): void
  /** Clears the whole style layer, returning the resume to its template. */
  resetAllStyleOverrides(): void
  /**
   * Clears the chosen halves of the resume in a single undoable step.
   *
   * `appearance` returns colours, fonts, text styles, spacing, page setup and
   * section order to what a new resume starts with. It keeps the chosen
   * template, because the product has no default one to fall back to.
   *
   * `content` restores the blank fields a new resume begins with, discarding
   * anything written over it including renamed headings. The resume keeps its
   * id, title and creation date, so its link and place in the list survive.
   */
  resetResume(options: ResetResumeOptions): void
  reorderSectionBlocks(fromIndex: number, toIndex: number): void
  /** Reorders the achievement bullets inside one experience entry. */
  reorderEntryBullets(entryId: string, fromIndex: number, toIndex: number): void
  duplicateResume(id: string): Promise<string>
  renameResume(id: string, title: string): Promise<void>
  deleteResume(id: string): Promise<void>
  saveActiveResume(): Promise<void>
  markClean(): void
  setError(error: string | null): void
}

/** Which halves of the resume a reset should clear. */
export interface ResetResumeOptions {
  content: boolean
  appearance: boolean
}

type ResumeStore = ResumeState & ResumeActions

// ─── Snapshot helper ─────────────────────────────────────────────────────────

function snapshot(resume: Resume): Resume {
  return structuredClone(resume)
}

function withTimestamp<T extends Partial<Resume>>(patch: T): T {
  return { ...patch, updatedAt: new Date().toISOString() }
}

// ─── Store ───────────────────────────────────────────────────────────────────

let pendingSave: Promise<void> | null = null
let loadVersion = 0

export const useResumeStore = create<ResumeStore>((set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  activeResume: null,
  resumeList: [],
  isLoading: false,
  isSaving: false,
  isDirty: false,
  error: null,

  // ─── Load ───────────────────────────────────────────────────────────────────
  async loadResumeList() {
    set({ isLoading: true, error: null })
    try {
      await get().saveActiveResume()
      if (get().error) {
        set({ isLoading: false })
        return
      }
      const resumeList = await resumeService.getResumeList()
      set({ resumeList, isLoading: false })
    } catch (err) {
      logger.error('Failed to load resume list', err)
      set({ isLoading: false, error: 'Failed to load resumes' })
    }
  },

  async loadResume(id) {
    const version = ++loadVersion
    set({ isLoading: true, error: null })
    try {
      await get().saveActiveResume()
      if (version !== loadVersion) return
      if (get().error) {
        set({ isLoading: false })
        return
      }
      const resume = await resumeService.getResume(id)
      if (version !== loadVersion) return
      if (!resume) {
        set({ isLoading: false, error: `Resume ${id} not found` })
        return
      }
      useEditorStore.getState().clearHistory()
      useEditorStore.getState().clearSelection()
      useEditorStore.getState().clearStyleTarget()
      set({ activeResume: resume, isLoading: false, isDirty: false })
      logger.info('Resume loaded', { id })
    } catch (err) {
      if (version !== loadVersion) return
      logger.error('Failed to load resume', err, { id })
      set({ isLoading: false, error: 'Failed to load resume' })
    }
  },

  // ─── Create / Duplicate / Delete ─────────────────────────────────────────
  async createResume(templateId, themeOverride) {
    const resume = await resumeService.createResume(templateId, themeOverride)
    set((s) => ({ resumeList: [resume, ...s.resumeList] }))
    return resume.id
  },

  async createResumeFromImport(templateId, parsed) {
    const resume = await resumeService.createResumeFromImport(templateId, parsed)
    set((s) => ({ resumeList: [resume, ...s.resumeList] }))
    return resume.id
  },

  async duplicateResume(id) {
    const resume = await resumeService.duplicateResume(id)
    set((s) => ({ resumeList: [resume, ...s.resumeList] }))
    return resume.id
  },

  async renameResume(id, title) {
    const trimmed = title.trim().slice(0, 120)
    if (!trimmed) throw new Error('Give your resume a name')
    if (get().activeResume?.id === id) {
      get().updateResume({ title: trimmed })
      await get().saveActiveResume()
      if (get().error) throw new Error(get().error ?? 'Could not rename resume')
      return
    }
    const resume = await resumeService.updateResume(id, { title: trimmed })
    set((s) => ({
      resumeList: s.resumeList.map((r) => (r.id === id ? resume : r)),
      activeResume: s.activeResume?.id === id ? resume : s.activeResume,
    }))
  },

  async deleteResume(id) {
    await resumeService.deleteResume(id)
    set((s) => ({
      resumeList: s.resumeList.filter((r) => r.id !== id),
      activeResume: s.activeResume?.id === id ? null : s.activeResume,
    }))
  },

  // ─── Update (synchronous, triggers autosave) ─────────────────────────────
  updateResume(patch) {
    const { activeResume } = get()
    if (!activeResume) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))

    set({
      activeResume: { ...activeResume, ...patch, updatedAt: new Date().toISOString() } as Resume,
      isDirty: true,
    })
  },

  updatePersonalInfo(patch) {
    const { activeResume } = get()
    if (!activeResume) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))

    set({
      activeResume: withTimestamp({
        ...activeResume,
        personalInfo: { ...activeResume.personalInfo, ...patch },
      }),
      isDirty: true,
    })
  },

  updateSettings(patch) {
    const { activeResume } = get()
    if (!activeResume) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))

    set({
      activeResume: withTimestamp({
        ...activeResume,
        settings: { ...activeResume.settings, ...patch },
      }),
      isDirty: true,
    })
  },

  setRoleStyle(role, patch) {
    const { activeResume } = get()
    if (!activeResume) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))
    const current = activeResume.styleOverrides ?? {}
    const merged = mergeStyle(current.roles?.[role], patch)

    set({
      activeResume: withTimestamp({
        ...activeResume,
        styleOverrides: pruneOverrides({
          ...current,
          roles: { ...current.roles, [role]: merged },
        }),
      }),
      isDirty: true,
    })
  },

  setElementStyle(styleKey, patch) {
    const { activeResume } = get()
    if (!activeResume) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))
    const current = activeResume.styleOverrides ?? {}
    const merged = mergeStyle(current.elements?.[styleKey], patch)

    set({
      activeResume: withTimestamp({
        ...activeResume,
        styleOverrides: pruneOverrides({
          ...current,
          elements: { ...current.elements, [styleKey]: merged },
        }),
      }),
      isDirty: true,
    })
  },

  resetElementStyle(styleKey) {
    const { activeResume } = get()
    if (!activeResume?.styleOverrides?.elements?.[styleKey]) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))
    const rest = omitKey(activeResume.styleOverrides.elements, styleKey)

    set({
      activeResume: withTimestamp({
        ...activeResume,
        styleOverrides: pruneOverrides({ ...activeResume.styleOverrides, elements: rest }),
      }),
      isDirty: true,
    })
  },

  resetRoleStyle(role) {
    const { activeResume } = get()
    if (!activeResume?.styleOverrides?.roles?.[role]) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))
    const rest = omitKey(activeResume.styleOverrides.roles, role)

    set({
      activeResume: withTimestamp({
        ...activeResume,
        styleOverrides: pruneOverrides({ ...activeResume.styleOverrides, roles: rest }),
      }),
      isDirty: true,
    })
  },

  setPageBackground(color) {
    const { activeResume } = get()
    if (!activeResume) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))

    set({
      activeResume: withTimestamp({
        ...activeResume,
        styleOverrides: pruneOverrides({
          ...activeResume.styleOverrides,
          page: color ? { backgroundColor: color.toLowerCase() } : undefined,
        }),
      }),
      isDirty: true,
    })
  },

  resetAllStyleOverrides() {
    const { activeResume } = get()
    if (!activeResume?.styleOverrides) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))
    set({
      activeResume: withTimestamp({ ...activeResume, styleOverrides: undefined }),
      isDirty: true,
    })
  },

  resetResume({ content, appearance }) {
    const { activeResume } = get()
    if (!activeResume) return
    if (!content && !appearance) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))

    // Built up in one object so ticking both halves costs one undo entry and
    // one save, not two of each.
    let next: Resume = { ...activeResume }

    if (appearance) {
      const defaults = defaultAppearance()
      next = {
        ...next,
        themeId: defaults.themeId,
        fontPresetId: defaults.fontPresetId,
        customPrimaryColor: defaults.customPrimaryColor,
        templateColors: undefined,
        sectionOrder: defaults.sectionOrder,
        settings: defaults.settings,
        sectionIcons: undefined,
        styleOverrides: undefined,
      }
    }

    if (content) {
      next = { ...next, ...defaultContent() }
    }

    set({ activeResume: withTimestamp(next), isDirty: true })
    // The inspector points at an element that may have just lost its overrides
    // or stopped existing, and the canvas re-renders underneath it either way.
    useEditorStore.getState().clearStyleTarget()
    useEditorStore.getState().clearSelection()
  },

  updateSummary(content) {
    const { activeResume } = get()
    if (!activeResume) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))

    set({
      activeResume: withTimestamp({
        ...activeResume,
        summary: { ...activeResume.summary, content, updatedAt: new Date().toISOString() },
      }),
      isDirty: true,
    })
  },

  updateSection(sectionType, id, patch) {
    const { activeResume } = get()
    if (!activeResume) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))

    let updated: Resume

    switch (sectionType) {
      case 'experience':
        updated = {
          ...activeResume,
          experience: updateById(activeResume.experience, id, patch as Partial<ExperienceSection>),
        }
        break
      case 'education':
        updated = {
          ...activeResume,
          education: updateById(activeResume.education, id, patch as Partial<EducationSection>),
        }
        break
      case 'skills':
        updated = {
          ...activeResume,
          skills: updateById(activeResume.skills, id, patch as Partial<SkillSection>),
        }
        break
      case 'projects':
        updated = {
          ...activeResume,
          projects: updateById(activeResume.projects, id, patch as Partial<ProjectSection>),
        }
        break
      case 'certifications':
        updated = {
          ...activeResume,
          certifications: updateById(
            activeResume.certifications,
            id,
            patch as Partial<CertificationSection>
          ),
        }
        break
      case 'custom':
        updated = {
          ...activeResume,
          customSections: updateById(
            activeResume.customSections,
            id,
            patch as Partial<CustomSection>
          ),
        }
        break
      default:
        return
    }

    set({ activeResume: { ...updated, updatedAt: new Date().toISOString() }, isDirty: true })
  },

  // ─── Add / Delete ─────────────────────────────────────────────────────────
  addSection(sectionType) {
    const { activeResume } = get()
    if (!activeResume) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))

    let updated: Resume

    switch (sectionType) {
      case 'experience': {
        const order = activeResume.experience.length
        updated = {
          ...activeResume,
          experience: [...activeResume.experience, createEmptyExperience(order)],
        }
        break
      }
      case 'education': {
        const order = activeResume.education.length
        updated = {
          ...activeResume,
          education: [...activeResume.education, createEmptyEducation(order)],
        }
        break
      }
      case 'skills': {
        const order = activeResume.skills.length
        updated = {
          ...activeResume,
          skills: [...activeResume.skills, createEmptySkillSection(order)],
        }
        break
      }
      case 'projects': {
        const order = activeResume.projects.length
        updated = {
          ...activeResume,
          projects: [...activeResume.projects, createEmptyProject(order)],
        }
        break
      }
      case 'certifications': {
        const order = activeResume.certifications.length
        updated = {
          ...activeResume,
          certifications: [...activeResume.certifications, createEmptyCertification(order)],
        }
        break
      }
      case 'custom': {
        const order = activeResume.customSections.length
        updated = {
          ...activeResume,
          customSections: [...activeResume.customSections, createEmptyCustomSection(order)],
        }
        break
      }
      default:
        return
    }

    set({ activeResume: { ...updated, updatedAt: new Date().toISOString() }, isDirty: true })
  },

  deleteSection(sectionType, id) {
    const { activeResume } = get()
    if (!activeResume) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))

    let updated: Resume

    switch (sectionType) {
      case 'experience':
        updated = { ...activeResume, experience: removeById(activeResume.experience, id) }
        break
      case 'education':
        updated = { ...activeResume, education: removeById(activeResume.education, id) }
        break
      case 'skills':
        updated = { ...activeResume, skills: removeById(activeResume.skills, id) }
        break
      case 'projects':
        updated = { ...activeResume, projects: removeById(activeResume.projects, id) }
        break
      case 'certifications':
        updated = { ...activeResume, certifications: removeById(activeResume.certifications, id) }
        break
      case 'custom':
        updated = { ...activeResume, customSections: removeById(activeResume.customSections, id) }
        break
      default:
        return
    }

    set({ activeResume: { ...updated, updatedAt: new Date().toISOString() }, isDirty: true })
  },

  // ─── Reorder ──────────────────────────────────────────────────────────────
  reorderEntryBullets(entryId, fromIndex, toIndex) {
    const { activeResume } = get()
    if (!activeResume || fromIndex === toIndex) return
    const entry = activeResume.experience.find((e) => e.id === entryId)
    if (!entry) return
    if (fromIndex < 0 || toIndex < 0) return
    if (fromIndex >= entry.description.length || toIndex >= entry.description.length) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))

    set({
      activeResume: withTimestamp({
        ...activeResume,
        experience: updateById(activeResume.experience, entryId, {
          description: arrayMove(entry.description, fromIndex, toIndex),
          updatedAt: new Date().toISOString(),
        }),
      }),
      isDirty: true,
    })
  },

  reorderSections(sectionType, fromIndex, toIndex) {
    const { activeResume } = get()
    if (!activeResume || fromIndex === toIndex) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))

    let updated: Resume

    switch (sectionType) {
      case 'experience':
        updated = {
          ...activeResume,
          experience: arrayMove(activeResume.experience, fromIndex, toIndex),
        }
        break
      case 'education':
        updated = {
          ...activeResume,
          education: arrayMove(activeResume.education, fromIndex, toIndex),
        }
        break
      case 'skills':
        updated = { ...activeResume, skills: arrayMove(activeResume.skills, fromIndex, toIndex) }
        break
      case 'projects':
        updated = {
          ...activeResume,
          projects: arrayMove(activeResume.projects, fromIndex, toIndex),
        }
        break
      case 'certifications':
        updated = {
          ...activeResume,
          certifications: arrayMove(activeResume.certifications, fromIndex, toIndex),
        }
        break
      case 'custom':
        updated = {
          ...activeResume,
          customSections: arrayMove(activeResume.customSections, fromIndex, toIndex),
        }
        break
      default:
        return
    }

    set({ activeResume: { ...updated, updatedAt: new Date().toISOString() }, isDirty: true })
  },

  setSectionIcon(key, icon) {
    const { activeResume } = get()
    if (!activeResume) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))

    const next = { ...(activeResume.sectionIcons ?? {}) }
    if (icon === null) {
      // Back to whatever the active template picks for this section.
      delete next[key]
    } else {
      next[key] = icon
    }

    set({
      activeResume: withTimestamp({ ...activeResume, sectionIcons: next }),
      isDirty: true,
    })
  },

  toggleSectionTypeVisibility(sectionType) {
    const { activeResume } = get()
    if (!activeResume) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))

    let updated: Resume

    switch (sectionType) {
      case 'summary':
        updated = {
          ...activeResume,
          summary: {
            ...activeResume.summary,
            visible: !activeResume.summary.visible,
            updatedAt: new Date().toISOString(),
          },
        }
        break
      case 'experience': {
        const nextVisible = !activeResume.experience.some((e) => e.visible)
        updated = {
          ...activeResume,
          experience: setAllVisible(activeResume.experience, nextVisible),
        }
        break
      }
      case 'education': {
        const nextVisible = !activeResume.education.some((e) => e.visible)
        updated = { ...activeResume, education: setAllVisible(activeResume.education, nextVisible) }
        break
      }
      case 'skills': {
        const nextVisible = !activeResume.skills.some((e) => e.visible)
        updated = { ...activeResume, skills: setAllVisible(activeResume.skills, nextVisible) }
        break
      }
      case 'projects': {
        const nextVisible = !activeResume.projects.some((e) => e.visible)
        updated = { ...activeResume, projects: setAllVisible(activeResume.projects, nextVisible) }
        break
      }
      case 'certifications': {
        const nextVisible = !activeResume.certifications.some((e) => e.visible)
        updated = {
          ...activeResume,
          certifications: setAllVisible(activeResume.certifications, nextVisible),
        }
        break
      }
      case 'custom': {
        const nextVisible = !activeResume.customSections.some((e) => e.visible)
        updated = {
          ...activeResume,
          customSections: setAllVisible(activeResume.customSections, nextVisible),
        }
        break
      }
      default:
        return
    }

    set({ activeResume: { ...updated, updatedAt: new Date().toISOString() }, isDirty: true })
  },

  reorderSectionBlocks(fromIndex, toIndex) {
    const { activeResume } = get()
    if (!activeResume || fromIndex === toIndex) return

    useEditorStore.getState().pushUndoSnapshot(snapshot(activeResume))

    set({
      activeResume: withTimestamp({
        ...activeResume,
        sectionOrder: arrayMove(activeResume.sectionOrder, fromIndex, toIndex),
      }),
      isDirty: true,
    })
  },

  // ─── Save ─────────────────────────────────────────────────────────────────
  async saveActiveResume() {
    // A manual flush (such as Finish) must wait for an in-flight autosave and
    // then write any newer draft, rather than racing it with another write.
    if (pendingSave) {
      await pendingSave
      if (!get().error) await get().saveActiveResume()
      return
    }
    const { activeResume, isDirty } = get()
    if (!activeResume || !isDirty) return

    set({ isSaving: true })
    pendingSave = (async () => {
      try {
        await resumeService.updateResume(activeResume.id, activeResume)
        set((state) => ({
          isSaving: false,
          // Only this snapshot was saved; edits made during the write remain dirty.
          isDirty: state.activeResume === activeResume ? false : state.isDirty,
          resumeList: state.resumeList.map((resume) =>
            resume.id === activeResume.id ? activeResume : resume
          ),
          error: null,
        }))
        logger.debug('Resume autosaved', { id: activeResume.id })
      } catch (err) {
        logger.error('Autosave failed', err)
        set({ isSaving: false, error: 'Failed to save resume' })
      }
    })().finally(() => {
      pendingSave = null
    })
    await pendingSave
  },

  markClean() {
    set({ isDirty: false })
  },

  setError(error) {
    set({ error })
  },
}))
