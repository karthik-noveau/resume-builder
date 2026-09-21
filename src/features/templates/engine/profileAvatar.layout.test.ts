import { describe, expect, it } from 'vitest'
import { ALL_TEMPLATES, getTemplateById, templateRenderer } from '../registry/template.registry'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { useThemeStore } from '@/shared/stores/theme.store'
import { AVATAR_BACKGROUNDS, DEFAULT_AVATAR_BACKGROUND, PROFILE_AVATAR_ID, getProfileAvatar, getBuiltinImageUrl, getProfileInitials, getAvatarTextColor } from '@/shared/utils/profileAvatar'
import { resumeSettingsSchema } from '@/shared/schemas/settings.schema'
import type { LayoutNode } from '@/shared/types/layout.types'
import { loadTemplateFonts } from '@/tests/setup/templateFonts'

loadTemplateFonts()
const theme = useThemeStore.getState().getActiveTheme()
const font = useThemeStore.getState().getActiveFontPreset()
const flatten = (nodes: LayoutNode[]): LayoutNode[] => nodes.flatMap(node => [node, ...flatten(node.children)])

describe('profile avatar choices', () => {
  it.each([...ALL_TEMPLATES, getTemplateById('cadence')!].filter(template => template.exportRules.includeProfileImage))(
    '$name supports a sample avatar, uploaded photo, and colored initials in the same slot', template => {
      const resume = createSampleResume(template.id)
      resume.settings.showProfileImage = true
      const render = () => templateRenderer.render(resume, template, theme, font).pages.flatMap(page => flatten(page.nodes))
      const images = render().filter(node => node.type === 'image')
      expect(images).toHaveLength(1)
      expect(images[0].imageId).toBe(PROFILE_AVATAR_ID)
      expect(resume.personalInfo.profileImage).toBeUndefined()
      expect(render().find(node => node.id.endsWith('-avatar-background'))?.styles.backgroundColor).toBe(DEFAULT_AVATAR_BACKGROUND)

      for (const variant of ['male', 'female'] as const) {
        resume.settings.profileAvatarVariant = variant
        for (const color of AVATAR_BACKGROUNDS) {
          resume.settings.profileImageBackground = color.value
          const nodes = render()
          const avatar = nodes.find(node => node.type === 'image')!
          const backdrop = nodes.find(node => node.id.endsWith('-avatar-background'))!
          expect(avatar.imageId).toBe(getProfileAvatar(variant, color.value).imageId)
          expect(getBuiltinImageUrl(avatar.imageId)).toBe(getProfileAvatar(variant, color.value).url)
          expect(backdrop.styles.backgroundColor).toBe(color.value)
          expect([backdrop.xPt, backdrop.yPt, backdrop.widthPt, backdrop.heightPt, backdrop.clipShape])
            .toEqual([avatar.xPt, avatar.yPt, avatar.widthPt, avatar.heightPt, avatar.clipShape])
          expect(nodes.indexOf(backdrop)).toBeLessThan(nodes.indexOf(avatar))
          expect(avatar.styles.backgroundColor).toBeUndefined()
        }
      }

      delete resume.settings.profileImageBackground
      resume.settings.profileAvatarVariant = 'female'
      const female = render().find(node => node.type === 'image')!
      expect(female.imageId).toBe(getProfileAvatar('female').imageId)
      expect(getBuiltinImageUrl(female.imageId)).toBe('/profile-avatar-female-transparent-v1.png')
      expect([female.xPt, female.yPt, female.widthPt, female.heightPt, female.clipShape])
        .toEqual([images[0].xPt, images[0].yPt, images[0].widthPt, images[0].heightPt, images[0].clipShape])

      resume.personalInfo.profileImage = 'my-upload'
      expect(render().find(node => node.type === 'image')?.imageId).toBe('my-upload')
      resume.settings.profileImageStyle = 'initials'
      resume.settings.profileImageBackground = '#334155'
      const initialsNodes = render()
      expect(initialsNodes.filter(node => node.type === 'image')).toHaveLength(0)
      const initials = initialsNodes.find(node => node.id.endsWith('-avatar-initials'))!
      const background = initialsNodes.find(node => node.id.endsWith('-avatar-background'))!
      expect(initials.content).toBe('AM')
      expect(initials.styles.color).toBe('#ffffff')
      expect(background.styles.backgroundColor).toBe('#334155')
      expect(background.clipShape).toBe(images[0].clipShape)
      expect(background.xPt).toBe(images[0].xPt)
      expect(background.yPt).toBe(images[0].yPt)
      expect(background.widthPt).toBe(images[0].widthPt)
      expect(background.heightPt).toBe(images[0].heightPt)
      expect(initials.panelTarget).toBe('personal-info')
      expect(resume.personalInfo.profileImage).toBe('my-upload')

      resume.settings.profileImageStyle = 'avatar'
      expect(render().find(node => node.type === 'image')?.imageId).toBe('my-upload')
      expect(render().find(node => node.id.endsWith('-avatar-background'))?.styles.backgroundColor).toBe('#334155')
      resume.settings.showProfileImage = false
      for (const style of ['avatar', 'initials'] as const) {
        resume.settings.profileImageStyle = style
        const hidden = render()
        expect(hidden.filter(node => node.type === 'image')).toHaveLength(0)
        expect(hidden.some(node => node.content === 'AM' || node.id.includes('-avatar-'))).toBe(false)
        // No placeholder or frame should be left where the portrait used to be.
        expect(hidden.some(node => node.type === 'rect' &&
          ((node.xPt === images[0].xPt && node.yPt === images[0].yPt &&
            node.widthPt === images[0].widthPt && node.heightPt === images[0].heightPt) ||
           (node.xPt === images[0].xPt - 4 && node.yPt === images[0].yPt - 4 &&
            node.widthPt === images[0].widthPt + 8 && node.heightPt === images[0].heightPt + 8))
        )).toBe(false)
      }
      expect(resume.personalInfo.profileImage).toBe('my-upload')
      expect(resume.settings.profileAvatarVariant).toBe('female')
      resume.settings.showProfileImage = true
      expect(render().find(node => node.id.endsWith('-avatar-initials'))?.content).toBe('AM')
    }
  )

  it('reclaims both portrait width and height in the Cadence header', () => {
    const template = getTemplateById('cadence')!
    const resume = createSampleResume(template.id)
    resume.settings.showProfileImage = true
    const visible = templateRenderer.render(resume, template, theme, font).pages[0]
    resume.settings.showProfileImage = false
    const hidden = templateRenderer.render(resume, template, theme, font).pages[0]
    const name = flatten(hidden.nodes).find(node => node.editRef?.kind === 'personal-info' && node.editRef.field === 'fullName')!
    expect(name.xPt).toBe(hidden.marginsPt.left)
    expect(name.widthPt).toBe(hidden.widthPt - hidden.marginsPt.left - hidden.marginsPt.right)
    const band = (nodes: LayoutNode[]) => nodes.find(node => node.type === 'rect' && node.xPt === 0 && node.yPt === 0)!
    expect(band(hidden.nodes).heightPt).toBeLessThan(band(visible.nodes).heightPt)
  })

  it.each(ALL_TEMPLATES.filter(template => !template.exportRules.includeProfileImage))(
    '$name does not introduce a portrait slot to a photo-free template', template => {
      const resume = createSampleResume(template.id)
      resume.settings.showProfileImage = true
      const tree = templateRenderer.render(resume, template, theme, font)
      expect(tree.pages.flatMap(page => flatten(page.nodes)).filter(node => node.type === 'image')).toHaveLength(0)
    }
  )

  it('derives initials from blank, single, multiple and Unicode names', () => {
    expect(getProfileInitials('')).toBe('YN')
    expect(getProfileInitials('  Ada  ')).toBe('A')
    expect(getProfileInitials('Ada Augusta Lovelace')).toBe('AL')
    expect(getProfileInitials('Élodie Martin')).toBe('ÉM')
  })

  it('keeps new appearance fields through validation and accepts older settings', () => {
    const settings = createSampleResume('aster').settings
    expect(resumeSettingsSchema.parse(settings)).toMatchObject(settings)
    expect(resumeSettingsSchema.parse({ ...settings, profileImageStyle: 'initials', profileImageBackground: '#334155' }))
      .toMatchObject({ profileImageStyle: 'initials', profileImageBackground: '#334155' })
    expect(resumeSettingsSchema.safeParse({ ...settings, profileImageBackground: 'url(bad)' }).success).toBe(false)
    expect(resumeSettingsSchema.parse({ ...settings, profileAvatarVariant: 'female' }).profileAvatarVariant).toBe('female')
    expect(resumeSettingsSchema.safeParse({ ...settings, profileAvatarVariant: 'unknown' }).success).toBe(false)
    expect(getProfileAvatar().value).toBe('male')
    expect(getBuiltinImageUrl('user-upload')).toBeUndefined()
    expect(getAvatarTextColor('#ede9fe')).toBe('#0f172a')
  })
})
