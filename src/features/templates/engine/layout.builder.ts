import type { LayoutTree, LayoutPage, LayoutNode, LayoutNodeType, LayoutStyles, IconName, EditRef } from '@/shared/types/layout.types'
import type { SectionType } from '@/shared/types/resume.types'
import { PAGE_DIMENSIONS_PT, MM_TO_PT } from '@/shared/types/layout.types'

const FALLBACK_STYLE: LayoutStyles = {
  fontFamily: 'Inter',
  fontSize: 10,
  fontWeight: 400,
  color: '#000000',
  lineHeight: 1.5,
  textAlign: 'left',
}

export class LayoutBuilder {
  private pages: LayoutPage[] = []
  private _y = 0
  private _counter = 0
  private readonly _pageW: number
  private readonly _pageH: number
  readonly margins: { top: number; right: number; bottom: number; left: number }

  constructor(
    private readonly meta: {
      resumeId: string
      templateId: string
      themeId: string
      fontPresetId: string
      pageSize: 'A4' | 'LETTER'
      marginMm: number
    }
  ) {
    const marginPt = meta.marginMm * MM_TO_PT
    this.margins = { top: marginPt, right: marginPt, bottom: marginPt, left: marginPt }
    const dims = PAGE_DIMENSIONS_PT[meta.pageSize]
    this._pageW = dims.width
    this._pageH = dims.height
    this.newPage()
  }

  private newPage(): void {
    this.pages.push({
      pageNumber: this.pages.length + 1,
      widthPt: this._pageW,
      heightPt: this._pageH,
      marginsPt: { ...this.margins },
      nodes: [],
    })
    this._y = this.margins.top
  }

  private id(): string {
    return `n${++this._counter}`
  }

  get currentPage(): LayoutPage {
    return this.pages[this.pages.length - 1]
  }

  /** All pages built so far — used by templates that decorate every page (e.g. a border frame). */
  get allPages(): readonly LayoutPage[] {
    return this.pages
  }

  get y(): number {
    return this._y
  }

  get x(): number {
    return this.margins.left
  }

  get pageW(): number {
    return this._pageW
  }

  get pageH(): number {
    return this._pageH
  }

  get contentW(): number {
    return this._pageW - this.margins.left - this.margins.right
  }

  get availableBottom(): number {
    return this._pageH - this.margins.bottom
  }

  willOverflow(h: number): boolean {
    return this._y + h > this.availableBottom
  }

  ensureSpace(h: number): void {
    if (this.willOverflow(h)) this.newPage()
  }

  advanceY(pt: number): void {
    this._y += pt
  }

  /** Move the Y cursor to an explicit position — used to render parallel columns from the same start Y. */
  seekY(pt: number): void {
    this._y = pt
  }

  /** Place a finished section node on the current page and advance Y. */
  placeSection(node: LayoutNode): void {
    this.currentPage.nodes.push(node)
    this._y += node.heightPt
  }

  node(
    type: LayoutNodeType,
    xPt: number,
    yPt: number,
    widthPt: number,
    heightPt: number,
    styles: Partial<LayoutStyles>,
    opts: {
      content?: string
      href?: string
      imageId?: string
      sectionType?: SectionType
      children?: LayoutNode[]
      clipShape?: 'circle'
      iconName?: IconName
      iconEditable?: boolean
      rotationDeg?: number
      editRef?: EditRef
    } = {}
  ): LayoutNode {
    return {
      id: this.id(),
      type,
      xPt,
      yPt,
      widthPt,
      heightPt,
      styles: { ...FALLBACK_STYLE, ...styles },
      children: opts.children ?? [],
      content: opts.content,
      href: opts.href,
      imageId: opts.imageId,
      sectionType: opts.sectionType,
      clipShape: opts.clipShape,
      iconName: opts.iconName,
      iconEditable: opts.iconEditable,
      rotationDeg: opts.rotationDeg,
      editRef: opts.editRef,
    }
  }

  build(): LayoutTree {
    return {
      resumeId: this.meta.resumeId,
      templateId: this.meta.templateId,
      themeId: this.meta.themeId,
      fontPresetId: this.meta.fontPresetId,
      pageSize: this.meta.pageSize,
      pages: this.pages,
    }
  }
}

/** Helper to build section children relative to (0, 0) and return total height. */
export class SectionBuilder {
  readonly children: LayoutNode[] = []
  private _innerY = 0
  private counter: () => string

  constructor(counter: () => string) {
    this.counter = counter
  }

  get innerY(): number {
    return this._innerY
  }

  addNode(
    type: LayoutNodeType,
    xPt: number,
    widthPt: number,
    heightPt: number,
    styles: Partial<LayoutStyles>,
    opts: { content?: string; href?: string; imageId?: string } = {}
  ): void {
    this.children.push({
      id: this.counter(),
      type,
      xPt,
      yPt: this._innerY,
      widthPt,
      heightPt,
      styles: { ...FALLBACK_STYLE, ...styles },
      children: [],
      content: opts.content,
      href: opts.href,
      imageId: opts.imageId,
    })
    this._innerY += heightPt
  }

  gap(pt: number): void {
    this._innerY += pt
  }
}
