import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { AVATAR_BACKGROUNDS, PROFILE_AVATARS, getBuiltinImageUrl, getProfileAvatar } from './profileAvatar'
import { TEMPLATE_PORTRAIT_ID, TEMPLATE_PORTRAIT_URL } from './templatePortrait'

describe('coordinated avatar palettes', () => {
  it.each(PROFILE_AVATARS)('resolves all five $label outfits to distinct local assets', avatar => {
    const variants = AVATAR_BACKGROUNDS.map(color => getProfileAvatar(avatar.value, color.value))
    expect(new Set(variants.map(variant => variant.imageId)).size).toBe(5)
    expect(new Set(variants.map(variant => variant.url)).size).toBe(5)
    for (const variant of variants) {
      expect(variant.value).toBe(avatar.value)
      expect(getBuiltinImageUrl(variant.imageId)).toBe(variant.url)
      expect(variant.url).toMatch(/^\/profile-avatar-(male|female)-[a-z-]+-v1\.png$/)
      const asset = readFileSync(resolve('public', variant.url.slice(1)))
      expect(asset.subarray(1, 4).toString()).toBe('PNG')
      expect(asset[25]).toBe(6) // RGBA, retaining the transparent background.
    }
  })

  it('keeps existing avatar IDs and catalog previews compatible', () => {
    for (const avatar of PROFILE_AVATARS) {
      expect(getProfileAvatar(avatar.value)).toEqual(avatar)
      expect(getBuiltinImageUrl(avatar.imageId)).toBe(avatar.url)
    }
    expect(getBuiltinImageUrl(TEMPLATE_PORTRAIT_ID)).toBe(TEMPLATE_PORTRAIT_URL)
    expect(getProfileAvatar().value).toBe('male')
    expect(getProfileAvatar('female', '#DBEAFE')).toEqual(getProfileAvatar('female', '#dbeafe'))
    expect(getProfileAvatar('female', 'invalid')).toEqual(getProfileAvatar('female'))
  })

  it('does not treat uploads or unknown palette IDs as built-in assets', () => {
    expect(getBuiltinImageUrl(undefined)).toBeUndefined()
    expect(getBuiltinImageUrl('my-upload')).toBeUndefined()
    expect(getBuiltinImageUrl('builtin-profile-avatar-v1-unknown')).toBeUndefined()
  })
})
