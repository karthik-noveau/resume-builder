import type { TemplateDefinition } from '@/shared/types/template.types'

export const fresherSidebarPhotoDefinition: TemplateDefinition = {
  id: 'fresher-sidebar-photo',
  name: 'Foundation',
  category: 'Fresher',
  version: 1,
  description: 'Dark photo sidebar with contact, skills, languages and hobbies — built for first resumes.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['fresher', 'entry-level', 'sidebar', 'photo'],
  layout: 'two-column',
  exportRules: { includeProfileImage: true, forceBlackText: false },
}
