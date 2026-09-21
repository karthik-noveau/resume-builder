import type { Resume, TemplateColorOverrides } from '@/shared/types/resume.types'
import { CUSTOM_THEME_ID } from '@/shared/stores/theme.store'

export type TemplateColorKey = keyof TemplateColorOverrides

export interface TemplateColorField {
  key: TemplateColorKey
  label: string
  description: string
}

/** Every template colour resolved to a concrete value — no optionals left. */
export type TemplateColorValues = Required<TemplateColorOverrides>

interface TemplateColorConfiguration {
  defaults: TemplateColorValues
  fields: TemplateColorKey[]
}

const COMMON_FIELDS: TemplateColorKey[] = [
  'sectionTitle', 'sectionDescription',
  'accent', 'primaryText', 'mutedText', 'divider', 'softBackground',
]

const WITH_SECTION_BORDER: TemplateColorKey[] = [...COMMON_FIELDS, 'sectionBorder']

export const TEMPLATE_COLOR_FIELDS: Record<TemplateColorKey, TemplateColorField> = {
  accent: { key: 'accent', label: 'Accent', description: 'Highlights, headings and emphasis' },
  sectionTitle: { key: 'sectionTitle', label: 'Section title', description: 'Text used for section headings' },
  sectionDescription: { key: 'sectionDescription', label: 'Section description', description: 'Summary and supporting section copy' },
  sectionBorder: { key: 'sectionBorder', label: 'Section border', description: 'Rules and borders attached to section headings' },
  sectionIcon: { key: 'sectionIcon', label: 'Section icon', description: 'Icons displayed beside section headings' },
  sectionBackground: { key: 'sectionBackground', label: 'Section background', description: 'Background fill behind section headings' },
  primaryText: { key: 'primaryText', label: 'Primary text', description: 'Names, titles and body copy' },
  secondaryText: { key: 'secondaryText', label: 'Secondary text', description: 'Supporting details and captions' },
  mutedText: { key: 'mutedText', label: 'Muted text', description: 'Dates, captions and low-emphasis details' },
  divider: { key: 'divider', label: 'Lines & borders', description: 'Rules, separators and outlines' },
  softBackground: { key: 'softBackground', label: 'Soft background', description: 'Tinted blocks and section fills' },
  panelBackground: { key: 'panelBackground', label: 'Sidebar / header', description: 'Main colored panel or banner' },
  panelText: { key: 'panelText', label: 'Panel text', description: 'Primary text inside the colored panel' },
  panelSecondaryText: { key: 'panelSecondaryText', label: 'Panel secondary text', description: 'Muted details inside the colored panel' },
}

const base = (
  accent: string,
  primaryText: string,
  secondaryText: string,
  divider: string,
  softBackground: string,
  panelBackground = accent,
  panelText = '#ffffff',
  panelSecondaryText = '#e2e8f0',
  mutedText = secondaryText,
  sectionColors: Partial<Pick<TemplateColorValues,
    'sectionTitle' | 'sectionDescription' | 'sectionBorder' | 'sectionIcon' | 'sectionBackground'
  >> = {},
): TemplateColorValues => ({
  accent, primaryText, secondaryText, mutedText, divider, softBackground,
  sectionTitle: sectionColors.sectionTitle ?? accent,
  sectionDescription: sectionColors.sectionDescription ?? secondaryText,
  sectionBorder: sectionColors.sectionBorder ?? divider,
  sectionIcon: sectionColors.sectionIcon ?? accent,
  sectionBackground: sectionColors.sectionBackground ?? softBackground,
  panelBackground, panelText, panelSecondaryText,
})

const CONFIG: Record<string, TemplateColorConfiguration> = {
  aster: {
    defaults: base('#edc541', '#24241f', '#5f5e52', '#9e9d90', '#faf7ee', '#eee6d5', '#24241f', '#5f5e52', '#5f5e52', { sectionTitle: '#24241f', sectionBorder: '#9e9d90' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  lincoln: {
    defaults: base('#f2c630', '#242626', '#606566', '#cbd0d0', '#fff9e2', '#f0f2f2', '#242626', '#606566', '#606566', { sectionTitle: '#242626', sectionBorder: '#cbd0d0' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  horizon: {
    defaults: base('#c58d6e', '#242628', '#605b56', '#cdb4a4', '#fbf9f7', '#efd4c1', '#242628', '#605b56', '#605b56', { sectionTitle: '#242628', sectionBorder: '#cdb4a4' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  strata: {
    defaults: base('#a77add', '#27222e', '#61566d', '#d1bfdc', '#f7f3fb', '#ebdff7', '#27222e', '#61566d', '#61566d', { sectionTitle: '#27222e', sectionBorder: '#d1bfdc' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  maison: {
    defaults: base('#b37e8a', '#302429', '#67545c', '#bc9da7', '#faefef', '#ecdbde', '#302429', '#67545c', '#67545c', { sectionTitle: '#302429', sectionBorder: '#bc9da7' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  mosaic: {
    defaults: base('#d4de76', '#2b3526', '#526147', '#ccd8bd', '#f7f9ef', '#303b24', '#ffffff', '#e0e7ce', '#526147', { sectionTitle: '#2b3526', sectionBorder: '#ccd8bd' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  vector: {
    defaults: base('#80acff', '#242832', '#536077', '#ccd5e5', '#f3f5f8', '#272d38', '#ffffff', '#d7dfed', '#536077', { sectionTitle: '#242832', sectionBorder: '#ccd5e5' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  archive: {
    defaults: base('#d7bd53', '#2c2b22', '#625f4f', '#dbca84', '#fbfaf4', '#f4efdf', '#2c2b22', '#625f4f', '#625f4f', { sectionTitle: '#2c2b22', sectionBorder: '#dbca84' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  summit: {
    defaults: base('#83c6a4', '#25392f', '#536a5e', '#bdd7c8', '#f3f9f4', '#e4f1e8', '#25392f', '#536a5e', '#536a5e', { sectionTitle: '#25392f', sectionBorder: '#bdd7c8' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  atelier: {
    defaults: base('#c68d72', '#2e2522', '#6b5850', '#c9ab99', '#faeee7', '#eed7c7', '#2e2522', '#6b5850', '#6b5850', { sectionTitle: '#2e2522', sectionBorder: '#c9ab99' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  signal: {
    defaults: base('#f5c519', '#242d38', '#52616e', '#d2dbe2', '#fff8df', '#242d38', '#ffffff', '#d5dde5', '#52616e', { sectionTitle: '#242d38', sectionBorder: '#d2dbe2' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  grove: {
    defaults: base('#9e8b65', '#333126', '#625f4d', '#b2a78c', '#f8f4e8', '#dfd4bd', '#333126', '#625f4d', '#625f4d', { sectionTitle: '#333126', sectionBorder: '#b2a78c' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  orbit: {
    defaults: base('#efb869', '#292c28', '#5b6156', '#d2d4c9', '#f4f1ed', '#30342e', '#ffffff', '#dedfd7', '#5b6156', { sectionTitle: '#292c28', sectionBorder: '#d2d4c9' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  contour: {
    defaults: base('#b4a071', '#302d24', '#645f50', '#c5b99b', '#faf7ee', '#e8dfca', '#302d24', '#645f50', '#645f50', { sectionTitle: '#302d24', sectionBorder: '#c5b99b' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  linear: {
    defaults: base('#a591cd', '#2a2930', '#605b6d', '#cfc6df', '#f6f4f9', '#ece7f4', '#2a2930', '#605b6d', '#605b6d', { sectionTitle: '#2a2930', sectionBorder: '#cfc6df' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  palette: {
    defaults: base('#eea68c', '#292f40', '#566174', '#d8dce8', '#fbf6f3', '#252d42', '#ffffff', '#dbe1f2', '#566174', { sectionTitle: '#292f40', sectionBorder: '#d8dce8' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  byline: {
    defaults: base('#a18e6b', '#292820', '#625c4e', '#bdb4a0', '#fcfbf6', '#eee8da', '#292820', '#625c4e', '#625c4e', { sectionTitle: '#292820', sectionBorder: '#bdb4a0' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  pinnacle: {
    defaults: base('#9bb8de', '#233247', '#55677d', '#c7d5e8', '#f5f8fd', '#dce7f5', '#233247', '#55677d', '#55677d', { sectionTitle: '#233247', sectionBorder: '#c7d5e8' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  cove: {
    defaults: base('#9fcdd2', '#263c43', '#526e75', '#bfd9dc', '#f2fafa', '#d9ecef', '#263c43', '#526e75', '#526e75', { sectionTitle: '#263c43', sectionBorder: '#bfd9dc' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  dossier: {
    defaults: base('#86a48e', '#2e3c30', '#596b59', '#c2d2c1', '#f8faf5', '#e8efe3', '#2e3c30', '#596b59', '#596b59', { sectionTitle: '#2e3c30', sectionBorder: '#c2d2c1' }),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground', 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  'fresher-sidebar-photo': {
    defaults: base('#526b80', '#111827', '#475569', '#dce3e9', '#f3f6f8', '#233446', '#ffffff', '#d4dee8', '#596a7b', {
      sectionTitle: '#344b60', sectionBorder: '#dce3e9',
    }),
    fields: [...WITH_SECTION_BORDER, 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  'experienced-icon-minimal': {
    defaults: base('#526579', '#202b36', '#465462', '#dee4e9', '#f5f7f9', '#283b4e', '#ffffff', '#d6e0e9', '#5d6a78', {
      sectionTitle: '#35495d',
    }),
    fields: WITH_SECTION_BORDER,
  },
  'experienced-sidebar-logo': {
    defaults: base('#46685f', '#202d29', '#4b5c55', '#dde5e1', '#f3f6f4', '#263e36', '#ffffff', '#d7e4dd', '#617068'),
    fields: [...COMMON_FIELDS, 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  meridian: {
    defaults: base('#53695d', '#242d28', '#4d5952', '#d9e0da', '#f4f6f3', '#34483c', '#ffffff', '#dce4dd', '#657067', {
      sectionTitle: '#405849',
    }),
    fields: WITH_SECTION_BORDER,
  },
  atlas: {
    defaults: base('#4f6880', '#222e3a', '#485968', '#dce3e9', '#f2f5f8', '#293d52', '#ffffff', '#d8e2eb', '#63717f', {
      sectionTitle: '#344e66', sectionBorder: '#93a6b7',
    }),
    fields: [...WITH_SECTION_BORDER, 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  ledger: { defaults: base('#76634f', '#302c27', '#5d554d', '#e3ddd5', '#f5f2ed'), fields: [...COMMON_FIELDS, 'sectionBackground'] },
  northstar: {
    defaults: base('#4e7168', '#25352f', '#4f645c', '#d8e3dc', '#f0f5f1', '#f0f5f1', '#25352f', '#4f645c', '#5f7169', {
      sectionTitle: '#3b5e51',
    }),
    fields: [...WITH_SECTION_BORDER, 'panelBackground'],
  },
  cadence: {
    defaults: base('#2f3e46', '#1d292d', '#647176', '#dce3e5', '#eef1f2', '#eef1f2', '#1d292d', '#647176', '#647176', {
      sectionTitle: '#1d292d',
    }),
    fields: [...WITH_SECTION_BORDER, 'panelBackground'],
  },
  cornerstone: { defaults: base('#5d5852', '#2d2925', '#58534d', '#dcd6ce', '#f6f4f0'), fields: WITH_SECTION_BORDER },
  canvas: {
    defaults: base('#90674f', '#342a24', '#65564b', '#e5dcd2', '#f7f3ed', '#f7f3ed', '#342a24', '#65564b', '#74655b', {
      sectionTitle: '#78563f',
    }),
    fields: [...COMMON_FIELDS, 'panelBackground'],
  },
  graphite: {
    defaults: base('#50565e', '#252a30', '#515a64', '#dde1e5', '#f3f5f6'),
    fields: [...WITH_SECTION_BORDER, 'sectionBackground'],
  },
  sterling: {
    defaults: base('#516276', '#222c37', '#4e5966', '#dce2e8', '#f4f6f8'),
    fields: COMMON_FIELDS,
  },
  folio: {
    defaults: base('#7d4c56', '#30262a', '#64535a', '#e3d9dc', '#f7f2f3'),
    fields: WITH_SECTION_BORDER,
  },
  harbor: {
    defaults: base('#365f6e', '#23343c', '#4c616c', '#d5e1e5', '#f1f6f7'),
    fields: WITH_SECTION_BORDER,
  },
  juniper: {
    defaults: base('#526a58', '#2b372d', '#516052', '#d9e2d8', '#eff4ee', '#eff4ee', '#2b372d', '#516052', '#667265'),
    fields: [...WITH_SECTION_BORDER, 'panelBackground'],
  },
  solstice: {
    defaults: base('#85643f', '#352d24', '#65594c', '#e3dbce', '#f5f0e9'),
    fields: [...COMMON_FIELDS, 'sectionBackground'],
  },
  avenue: {
    defaults: base('#343d47', '#242a31', '#535e69', '#d8dfe5', '#f5f6f8'),
    fields: COMMON_FIELDS,
  },
  studio: {
    defaults: base('#695d7b', '#302b39', '#60596c', '#e1dbe8', '#f3f0f6', '#f3f0f6', '#302b39', '#60596c', '#70677b', {
      sectionBorder: '#b2a4c1',
    }),
    fields: [...WITH_SECTION_BORDER, 'panelBackground'],
  },
  crest: {
    defaults: base('#394f6d', '#263244', '#4e5f73', '#d9e1ea', '#f2f5f9', '#26364b', '#ffffff', '#dbe4f0', '#617085'),
    fields: [...WITH_SECTION_BORDER, 'panelBackground', 'panelText', 'panelSecondaryText'],
  },
  vellum: {
    defaults: base('#78664f', '#302c25', '#625a4e', '#ded7ca', '#f4f0e8', '#f4f0e8', '#302c25', '#625a4e', '#72695c', {
      sectionBorder: '#b7a78d',
    }),
    fields: [...WITH_SECTION_BORDER, 'panelBackground'],
  },
  axis: {
    defaults: base('#426775', '#25363e', '#50656e', '#d8e2e6', '#f1f5f7'),
    fields: WITH_SECTION_BORDER,
  },
}

const FALLBACK = { defaults: base('#2563eb', '#111827', '#6b7280', '#e5e7eb', '#f8fafc'), fields: COMMON_FIELDS }

export function getTemplateColorConfiguration(templateId: string): TemplateColorConfiguration {
  return CONFIG[templateId] ?? FALLBACK
}

export function resolveTemplateColors(
  resume: Resume,
  defaults: TemplateColorValues = getTemplateColorConfiguration(resume.templateId).defaults,
): TemplateColorValues {
  const legacyAccent = resume.themeId === CUSTOM_THEME_ID ? resume.customPrimaryColor : undefined
  const overrides = resume.templateColors
  const accent = overrides?.accent ?? legacyAccent ?? defaults.accent
  const sectionTitle = overrides?.sectionTitle ?? overrides?.accent ?? legacyAccent ?? defaults.sectionTitle
  return {
    ...defaults,
    accent,
    ...overrides,
    sectionTitle,
    sectionDescription: overrides?.sectionDescription ?? overrides?.secondaryText ?? defaults.sectionDescription,
    sectionBorder: overrides?.sectionBorder ?? overrides?.divider ?? defaults.sectionBorder,
    // Heading icons and heading text are one visual label. Keeping a single
    // source of truth prevents them from drifting into mismatched colors.
    sectionIcon: sectionTitle,
    sectionBackground: overrides?.sectionBackground ?? overrides?.softBackground ?? defaults.sectionBackground,
  }
}
