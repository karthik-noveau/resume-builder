import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { MoreHorizontal, FolderOpen, Pencil, Copy, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import type { Resume } from '@/shared/types/resume.types'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { ALL_TEMPLATES, templateRenderer } from '@/features/templates/registry/template.registry'
import { useThemeStore, resolveResumeTheme } from '@/shared/stores/theme.store'
import styles from './ResumeCard.module.css'

interface ResumeCardProps {
  resume: Resume
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ResumeCard({ resume, onDuplicate, onDelete, onRename }: ResumeCardProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [titleDraft, setTitleDraft] = useState(resume.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const getFontPresetById = useThemeStore((s) => s.getFontPresetById)

  const layoutTree = useMemo(() => {
    const template = ALL_TEMPLATES.find((t) => t.id === resume.templateId)
    if (!template) return null
    return templateRenderer.render(
      resume,
      template,
      resolveResumeTheme(resume.themeId, resume.customPrimaryColor),
      getFontPresetById(resume.fontPresetId)
    )
  }, [resume, getFontPresetById])

  const handleOpen = () => { void navigate(`/editor/${resume.id}`) }

  const startRename = () => {
    setTitleDraft(resume.title)
    setIsRenaming(true)
    setMenuOpen(false)
    requestAnimationFrame(() => inputRef.current?.select())
  }

  const commitRename = () => {
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== resume.title) onRename(resume.id, trimmed)
    setIsRenaming(false)
  }

  return (
    <article
      className={styles.card}
      onClick={isRenaming ? undefined : handleOpen}
      aria-label={`Open resume: ${resume.title}`}
    >
      {/* Thumbnail */}
      <div className={styles.thumbnail}>
        <ResumePreview layoutTree={layoutTree} widthPx={140} className={styles.previewShadow} />
      </div>

      {/* Info */}
      <div className={styles.info}>
        {isRenaming ? (
          <input
            ref={inputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.currentTarget.blur() }
              if (e.key === 'Escape') { setIsRenaming(false) }
            }}
            aria-label="Resume title"
            className={styles.titleInput}
          />
        ) : (
          <p className={styles.title}>{resume.title}</p>
        )}
        <p className={styles.updatedAt}>Updated {formatDate(resume.updatedAt)}</p>
      </div>

      {/* Actions menu */}
      <div
        className={styles.menuWrap}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Resume actions"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((v) => !v)}
          className={clsx(styles.menuButton, menuOpen && styles.menuButtonOpen)}
        >
          <MoreHorizontal size={16} aria-hidden="true" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <>
              <div className={styles.menuOverlay} onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <motion.ul
                role="menu"
                aria-label="Resume actions"
                className={styles.menu}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <li>
                  <button
                    role="menuitem"
                    onClick={handleOpen}
                    className={styles.menuItem}
                  >
                    <FolderOpen size={14} aria-hidden="true" /> Open
                  </button>
                </li>
                <li>
                  <button
                    role="menuitem"
                    onClick={startRename}
                    className={styles.menuItem}
                  >
                    <Pencil size={14} aria-hidden="true" /> Rename
                  </button>
                </li>
                <li>
                  <button
                    role="menuitem"
                    onClick={() => { onDuplicate(resume.id); setMenuOpen(false) }}
                    className={styles.menuItem}
                  >
                    <Copy size={14} aria-hidden="true" /> Duplicate
                  </button>
                </li>
                <li>
                  <button
                    role="menuitem"
                    onClick={() => { onDelete(resume.id); setMenuOpen(false) }}
                    className={clsx(styles.menuItem, styles.menuItemDanger)}
                  >
                    <Trash2 size={14} aria-hidden="true" /> Delete
                  </button>
                </li>
              </motion.ul>
            </>
          )}
        </AnimatePresence>
      </div>
    </article>
  )
}
