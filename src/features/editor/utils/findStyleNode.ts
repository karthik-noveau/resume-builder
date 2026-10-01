import type { LayoutNode, LayoutTree } from '@/shared/types/layout.types'

export function findStyleNode(tree: LayoutTree | null | undefined, key: string | undefined): LayoutNode | undefined {
  if (!key) return undefined
  const visit = (nodes: LayoutNode[]): LayoutNode | undefined => {
    for (const node of nodes) {
      if (node.styleKey === key) return node
      const nested = visit(node.children)
      if (nested) return nested
    }
  }
  for (const page of tree?.pages ?? []) {
    const node = visit(page.nodes)
    if (node) return node
  }
}
