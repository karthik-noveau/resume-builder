import type { Resume } from '@/shared/types/resume.types'
import type { LayoutNode, LayoutTree } from '@/shared/types/layout.types'
import { getAvatarBackground, getAvatarTextColor, getProfileInitials } from '@/shared/utils/profileAvatar'

/** Reuse each template's portrait slot and shared background for either style. */
export function applyProfileAvatarStyle(tree: LayoutTree, resume: Resume): LayoutTree {
  if (!resume.settings.showProfileImage) return tree
  const backgroundColor = getAvatarBackground(resume.settings.profileImageBackground)
  const replace = (nodes: LayoutNode[]): LayoutNode[] => nodes.flatMap((node): LayoutNode[] => {
    if (node.type === 'image' && node.imageId === resume.personalInfo.profileImage) {
      const base = { ...node, imageId: undefined, children: [], panelTarget: 'personal-info' as const, panelField: 'profileImage' as const }
      const background: LayoutNode = {
        ...base, id: `${node.id}-avatar-background`, type: 'rect', styles: { ...node.styles, backgroundColor },
      }
      if (resume.settings.profileImageStyle !== 'initials') {
        // A separate clipped fill works identically in the canvas and PDF.
        // Transparent avatars reveal it; uploaded photos remain untouched.
        return [background, { ...node, styles: { ...node.styles, backgroundColor: undefined } }]
      }
      const size = Math.min(node.widthPt * 0.29, node.heightPt * 0.4, 46)
      return [
        background,
        {
          ...base, id: `${node.id}-avatar-initials`, type: 'text', clipShape: undefined,
          yPt: node.yPt + (node.heightPt - size * 1.2) / 2,
          heightPt: size * 1.2,
          content: getProfileInitials(resume.personalInfo.fullName),
          styles: {
            fontFamily: 'Inter', fontSize: size, fontWeight: 600,
            color: getAvatarTextColor(backgroundColor), textAlign: 'center', lineHeight: 1.2,
          },
        },
      ]
    }
    return [{ ...node, children: replace(node.children) }]
  })
  return { ...tree, pages: tree.pages.map(page => ({ ...page, nodes: replace(page.nodes) })) }
}
