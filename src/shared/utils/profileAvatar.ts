import { TEMPLATE_PORTRAIT_ID, TEMPLATE_PORTRAIT_URL } from './templatePortrait'
import type { ResumeSettings } from '@/shared/types/resume.types'

/** A local cartoon avatar; never stored as the user's uploaded photo. */
export const PROFILE_AVATAR_ID = 'builtin-profile-avatar-v1'
export const PROFILE_AVATAR_URL = TEMPLATE_PORTRAIT_URL
export const PROFILE_AVATARS = [
  { value: 'male', label: 'Male', imageId: PROFILE_AVATAR_ID, url: PROFILE_AVATAR_URL },
  { value: 'female', label: 'Female', imageId: 'builtin-profile-avatar-female-v1', url: '/profile-avatar-female-transparent-v1.png' },
] as const

export const DEFAULT_AVATAR_BACKGROUND = '#ede9fe'
export const AVATAR_BACKGROUNDS = [
  { key: 'lavender', name: 'Lavender', value: DEFAULT_AVATAR_BACKGROUND, outfit: '#8060c6' },
  { key: 'sky', name: 'Sky', value: '#dbeafe', outfit: '#3565a8' },
  { key: 'mint', name: 'Mint', value: '#d1fae5', outfit: '#277a66' },
  { key: 'peach', name: 'Peach', value: '#ffedd5', outfit: '#ac583d' },
  { key: 'slate', name: 'Slate', value: '#334155', outfit: '#cbd5e1' },
] as const

/** Each preset pairs a soft backdrop with a coordinated, contrasting outfit. */
export function getProfileAvatar(variant?: ResumeSettings['profileAvatarVariant'], background?: string) {
  const avatar = PROFILE_AVATARS.find(avatar => avatar.value === variant) ?? PROFILE_AVATARS[0]
  const palette = AVATAR_BACKGROUNDS.find(color => color.value === background?.toLowerCase()) ?? AVATAR_BACKGROUNDS[0]
  if (palette.key === 'lavender') return avatar
  return {
    ...avatar,
    imageId: `${avatar.imageId}-${palette.key}`,
    url: `/profile-avatar-${avatar.value}-${palette.key}-v1.png`,
  }
}

export function getBuiltinImageUrl(imageId: string | undefined): string | undefined {
  if (imageId === TEMPLATE_PORTRAIT_ID) return PROFILE_AVATAR_URL
  for (const avatar of PROFILE_AVATARS) {
    for (const color of AVATAR_BACKGROUNDS) {
      const candidate = getProfileAvatar(avatar.value, color.value)
      if (candidate.imageId === imageId) return candidate.url
    }
  }
  return undefined
}

export function getProfileInitials(fullName: string): string {
  const names = fullName.trim().split(/\s+/).filter(Boolean)
  if (!names.length) return 'YN'
  const parts = names.length > 1 ? [names[0], names[names.length - 1]] : [names[0]]
  return parts.map(part => Array.from(part)[0].toLocaleUpperCase()).join('')
}

export function getAvatarBackground(color?: string): string {
  return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_AVATAR_BACKGROUND
}

/** Use relative luminance so initials remain readable on either light or dark fills. */
export function getAvatarTextColor(background: string): string {
  const channels = getAvatarBackground(background).slice(1).match(/.{2}/g)!.map(hex => {
    const channel = parseInt(hex, 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  return luminance > 0.179 ? '#0f172a' : '#ffffff'
}
