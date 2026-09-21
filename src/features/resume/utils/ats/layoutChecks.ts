import type { LayoutNode, LayoutTree } from '@/shared/types/layout.types'

export const MIN_READABLE_TEXT_PT = 9

export function inspectAtsLayout(tree: LayoutTree) {
  const leaves: { node: LayoutNode; page: number; width: number; height: number }[] = []
  for (const page of tree.pages) {
    const visit = (nodes: LayoutNode[]) => {
      for (const node of nodes) {
        if (node.content?.trim() && !node.children.length)
          leaves.push({ node, page: page.pageNumber, width: page.widthPt, height: page.heightPt })
        visit(node.children)
      }
    }
    visit(page.nodes)
  }
  return {
    leaves,
    tiny: leaves.filter(({ node }) => node.styles.fontSize < MIN_READABLE_TEXT_PT),
    outside: leaves.filter(
      ({ node, width, height }) =>
        node.xPt < -1 ||
        node.yPt < -1 ||
        node.xPt + node.widthPt > width + 1 ||
        node.yPt + node.heightPt > height + 1
    ),
  }
}
