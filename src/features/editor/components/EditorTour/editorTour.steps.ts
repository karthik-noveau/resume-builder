export const EDITOR_TOUR_STEPS = [
  {
    id: 'template',
    title: 'Change template',
    description: 'Choose a new layout. Your content stays the same.',
    location: 'Sections · Template',
    panel: 'sections',
  },
  {
    id: 'page-setup',
    title: 'Page setup',
    description: 'Adjust page size, margins, and content spacing.',
    location: 'Sections · Page setup',
    panel: 'sections',
  },
  {
    id: 'content',
    title: 'Edit content',
    description: 'Update your details, experience, and skills here.',
    location: 'Properties · Content',
    panel: 'properties',
  },
  {
    id: 'global-design',
    title: 'Global design',
    description: 'Set fonts and colors for the whole resume.',
    location: 'Design · Global design',
    panel: 'properties',
  },
  {
    id: 'selected-design',
    title: 'Selected design',
    description: 'Select an item on the page. Style just that item.',
    location: 'Design · Selected design',
    panel: 'properties',
  },
] as const

export type EditorTourStepId = typeof EDITOR_TOUR_STEPS[number]['id']
