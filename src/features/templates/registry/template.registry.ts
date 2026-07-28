// Import definitions (data)
import { fresherSidebarPhotoDefinition } from '../definitions/fresher-sidebar-photo/fresher-sidebar-photo.definition'
import { experiencedIconMinimalDefinition } from '../definitions/experienced-icon-minimal/experienced-icon-minimal.definition'
import { experiencedSidebarLogoDefinition } from '../definitions/experienced-sidebar-logo/experienced-sidebar-logo.definition'
import { meridianDefinition } from '../definitions/meridian/meridian.definition'
import { atlasDefinition } from '../definitions/atlas/atlas.definition'
import { ledgerDefinition } from '../definitions/ledger/ledger.definition'
import { northstarDefinition } from '../definitions/northstar/northstar.definition'
import { cadenceDefinition } from '../definitions/cadence/cadence.definition'
import { cornerstoneDefinition } from '../definitions/cornerstone/cornerstone.definition'
import { canvasDefinition } from '../definitions/canvas/canvas.definition'
import { graphiteDefinition } from '../definitions/graphite/graphite.definition'

// Import renderers (side-effects: calls registerRenderer)
import '../definitions/fresher-sidebar-photo/fresher-sidebar-photo.renderer'
import '../definitions/experienced-icon-minimal/experienced-icon-minimal.renderer'
import '../definitions/experienced-sidebar-logo/experienced-sidebar-logo.renderer'
import '../definitions/meridian/meridian.renderer'
import '../definitions/atlas/atlas.renderer'
import '../definitions/ledger/ledger.renderer'
import '../definitions/northstar/northstar.renderer'
import '../definitions/cadence/cadence.renderer'
import '../definitions/cornerstone/cornerstone.renderer'
import '../definitions/canvas/canvas.renderer'
import '../definitions/graphite/graphite.renderer'

import type { TemplateDefinition } from '@/shared/types/template.types'

/**
 * The four hand-built originals plus ten built on `template.kit`.
 *
 * The kit-built ten are all single column on purpose: a two-column PDF
 * interleaves its text layer, which is the main reason applicant tracking
 * systems misread a resume, and it is what the scorer in `atsScore.ts`
 * rewards. The originals keep the two-column sidebar shapes for people who
 * want them.
 *
 * No two templates share a design — see the uniqueness test in
 * `engine/catalog.layout.test.ts`, which fails if a new one repeats an
 * existing header + section-header treatment.
 */
export const ALL_TEMPLATES: TemplateDefinition[] = [
  fresherSidebarPhotoDefinition,
  experiencedIconMinimalDefinition,
  experiencedSidebarLogoDefinition,
  meridianDefinition,
  atlasDefinition,
  ledgerDefinition,
  northstarDefinition,
  cadenceDefinition,
  cornerstoneDefinition,
  canvasDefinition,
  graphiteDefinition,
]

export { templateRenderer } from '../engine/template.renderer'
