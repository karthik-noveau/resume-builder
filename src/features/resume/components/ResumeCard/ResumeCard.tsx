import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Dropdown } from 'antd'
import { MoreHorizontal, FolderOpen, Pencil, Copy, Trash2, Share2 } from 'lucide-react'
import { ShareDialog } from '@/features/share/ShareDialog'
import type { Resume } from '@/shared/types/resume.types'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { getTemplateById, templateRenderer } from '@/features/templates/registry/template.registry'
import { useThemeStore, resolveResumeTheme } from '@/shared/stores/theme.store'
import styles from './ResumeCard.module.css'

interface ResumeCardProps {
  resume: Resume
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => Promise<void> | void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ResumeCard({ resume, onDuplicate, onDelete, onRename }: ResumeCardProps) {
  const navigate = useNavigate()
  const [isRenaming, setIsRenaming] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [titleDraft, setTitleDraft] = useState(resume.title)
  const [renaming, setRenaming] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)
  const committing = useRef(false)
  const cancelled = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const getFontPresetById = useThemeStore((s) => s.getFontPresetById)

  const layoutTree = useMemo(() => {
    const template = getTemplateById(resume.templateId)
    if (!template) return null
    return templateRenderer.render(
      resume,
      template,
      resolveResumeTheme(resume.themeId, resume.customPrimaryColor),
      getFontPresetById(resume.fontPresetId)
    )
  }, [resume, getFontPresetById])

  const handleOpen = () => {
    void navigate(`/editor/${resume.id}`)
  }

  const startRename = () => {
    setTitleDraft(resume.title)
    setIsRenaming(true)
    setRenameError(null)
    cancelled.current = false
    requestAnimationFrame(() => inputRef.current?.select())
  }

  const commitRename = async () => {
    if (cancelled.current || committing.current) return
    const trimmed = titleDraft.trim()
    if (!trimmed) {
      setRenameError('Give your resume a name.')
      return
    }
    if (trimmed === resume.title) {
      setIsRenaming(false)
      return
    }
    committing.current = true
    setRenaming(true)
    try {
      await onRename(resume.id, trimmed)
      setIsRenaming(false)
    } catch {
      setRenameError('Couldn’t rename this resume. Try again.')
    } finally {
      setRenaming(false)
      committing.current = false
    }
  }

  const templateName = getTemplateById(resume.templateId)?.name ?? 'Resume'

  return (
    <article className={styles.card} aria-label={resume.title}>
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
            onBlur={() => {
              void commitRename()
            }}
            maxLength={120}
            disabled={renaming}
            aria-invalid={!!renameError}
            aria-describedby={renameError ? `rename-error-${resume.id}` : undefined}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur()
              }
              if (e.key === 'Escape') {
                cancelled.current = true
                setIsRenaming(false)
              }
            }}
            aria-label="Resume title"
            className={styles.titleInput}
          />
        ) : (
          <Link
            className={styles.title}
            to={`/editor/${resume.id}`}
            aria-label={`Open resume: ${resume.title}`}
          >
            {resume.title}
          </Link>
        )}
        {renameError && isRenaming && (
          <p id={`rename-error-${resume.id}`} className={styles.renameError} role="alert">
            {renameError}
          </p>
        )}
        <div className={styles.metadata}>
          <span>{templateName}</span>
          <time dateTime={resume.updatedAt}>{formatDate(resume.updatedAt)}</time>
        </div>
      </div>

      <div className={styles.menuWrap}>
        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          menu={{
            items: [
              {
                key: 'open',
                label: 'Open resume',
                icon: <FolderOpen size={14} />,
                onClick: handleOpen,
              },
              {
                key: 'share',
                label: 'Share',
                icon: <Share2 size={14} />,
                onClick: () => setIsSharing(true),
              },
              { key: 'rename', label: 'Rename', icon: <Pencil size={14} />, onClick: startRename },
              {
                key: 'duplicate',
                label: 'Duplicate',
                icon: <Copy size={14} />,
                onClick: () => onDuplicate(resume.id),
              },
              { type: 'divider' },
              {
                key: 'delete',
                label: 'Delete',
                icon: <Trash2 size={14} />,
                danger: true,
                onClick: () => onDelete(resume.id),
              },
            ],
          }}
        >
          <button
            type="button"
            aria-label={`Actions for ${resume.title}`}
            className={styles.menuButton}
          >
            <MoreHorizontal size={18} aria-hidden="true" />
          </button>
        </Dropdown>
      </div>
      {isSharing && (
        <ShareDialog resumeId={resume.id} resume={resume} onClose={() => setIsSharing(false)} />
      )}
    </article>
  )
}
