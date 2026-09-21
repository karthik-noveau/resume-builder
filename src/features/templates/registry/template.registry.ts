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
import { sterlingDefinition } from '../definitions/sterling/sterling.definition'
import { folioDefinition } from '../definitions/folio/folio.definition'
import { harborDefinition } from '../definitions/harbor/harbor.definition'
import { juniperDefinition } from '../definitions/juniper/juniper.definition'
import { solsticeDefinition } from '../definitions/solstice/solstice.definition'
import { avenueDefinition } from '../definitions/avenue/avenue.definition'
import { studioDefinition } from '../definitions/studio/studio.definition'
import { crestDefinition } from '../definitions/crest/crest.definition'
import { vellumDefinition } from '../definitions/vellum/vellum.definition'
import { axisDefinition } from '../definitions/axis/axis.definition'
import { asterDefinition } from '../definitions/aster/aster.definition'
import { lincolnDefinition } from '../definitions/lincoln/lincoln.definition'
import { horizonDefinition } from '../definitions/horizon/horizon.definition'
import { strataDefinition } from '../definitions/strata/strata.definition'
import { maisonDefinition } from '../definitions/maison/maison.definition'
import { mosaicDefinition } from '../definitions/mosaic/mosaic.definition'
import { vectorDefinition } from '../definitions/vector/vector.definition'
import { archiveDefinition } from '../definitions/archive/archive.definition'
import { summitDefinition } from '../definitions/summit/summit.definition'
import { atelierDefinition } from '../definitions/atelier/atelier.definition'
import { signalDefinition } from '../definitions/signal/signal.definition'
import { groveDefinition } from '../definitions/grove/grove.definition'
import { orbitDefinition } from '../definitions/orbit/orbit.definition'
import { contourDefinition } from '../definitions/contour/contour.definition'
import { linearDefinition } from '../definitions/linear/linear.definition'
import { paletteDefinition } from '../definitions/palette/palette.definition'
import { bylineDefinition } from '../definitions/byline/byline.definition'
import { pinnacleDefinition } from '../definitions/pinnacle/pinnacle.definition'
import { coveDefinition } from '../definitions/cove/cove.definition'
import { dossierDefinition } from '../definitions/dossier/dossier.definition'

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
import '../definitions/sterling/sterling.renderer'
import '../definitions/folio/folio.renderer'
import '../definitions/harbor/harbor.renderer'
import '../definitions/juniper/juniper.renderer'
import '../definitions/solstice/solstice.renderer'
import '../definitions/avenue/avenue.renderer'
import '../definitions/studio/studio.renderer'
import '../definitions/crest/crest.renderer'
import '../definitions/vellum/vellum.renderer'
import '../definitions/axis/axis.renderer'
import '../definitions/aster/aster.renderer'
import '../definitions/lincoln/lincoln.renderer'
import '../definitions/horizon/horizon.renderer'
import '../definitions/strata/strata.renderer'
import '../definitions/maison/maison.renderer'
import '../definitions/mosaic/mosaic.renderer'
import '../definitions/vector/vector.renderer'
import '../definitions/archive/archive.renderer'
import '../definitions/summit/summit.renderer'
import '../definitions/atelier/atelier.renderer'
import '../definitions/signal/signal.renderer'
import '../definitions/grove/grove.renderer'
import '../definitions/orbit/orbit.renderer'
import '../definitions/contour/contour.renderer'
import '../definitions/linear/linear.renderer'
import '../definitions/palette/palette.renderer'
import '../definitions/byline/byline.renderer'
import '../definitions/pinnacle/pinnacle.renderer'
import '../definitions/cove/cove.renderer'
import '../definitions/dossier/dossier.renderer'

import type { TemplateDefinition } from '@/shared/types/template.types'

/**
 * Forty templates: twenty Simple designs followed by twenty Ultra Modern
 * designs. Visual collections are independent of experience level and column
 * layout; the catalog also balances fresher and experienced use cases.
 */
export const ALL_TEMPLATES: TemplateDefinition[] = [
  fresherSidebarPhotoDefinition,
  experiencedIconMinimalDefinition,
  experiencedSidebarLogoDefinition,
  meridianDefinition,
  atlasDefinition,
  ledgerDefinition,
  northstarDefinition,
  cornerstoneDefinition,
  canvasDefinition,
  graphiteDefinition,
  sterlingDefinition,
  folioDefinition,
  harborDefinition,
  juniperDefinition,
  solsticeDefinition,
  avenueDefinition,
  studioDefinition,
  crestDefinition,
  vellumDefinition,
  axisDefinition,
  asterDefinition,
  lincolnDefinition,
  horizonDefinition,
  strataDefinition,
  maisonDefinition,
  mosaicDefinition,
  vectorDefinition,
  archiveDefinition,
  summitDefinition,
  atelierDefinition,
  signalDefinition,
  groveDefinition,
  orbitDefinition,
  contourDefinition,
  linearDefinition,
  paletteDefinition,
  bylineDefinition,
  pinnacleDefinition,
  coveDefinition,
  dossierDefinition,
]

// Cadence remains resolvable so existing local resumes never turn blank, but
// its visual territory is already covered by the cleaner sidebar templates.
const LEGACY_TEMPLATES: TemplateDefinition[] = [cadenceDefinition]

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return ALL_TEMPLATES.find((template) => template.id === id)
    ?? LEGACY_TEMPLATES.find((template) => template.id === id)
}

export { templateRenderer } from '../engine/template.renderer'
