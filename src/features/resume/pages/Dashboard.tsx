import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Plus, FileText, Search, Upload, ArrowUpDown, HardDrive, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PageLayout } from '@/shared/components/layout/PageLayout'
import { Seo } from '@/shared/components/Seo/Seo'
import { Button } from '@/shared/components/ui/Button/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState/EmptyState'
import { Skeleton } from '@/shared/components/ui/Skeleton/Skeleton'
import { Select } from '@/shared/components/ui/Select/Select'
import { TemplatePickerModal } from '@/shared/components/TemplatePickerModal/TemplatePickerModal'
import { ResumeCard } from '../components/ResumeCard/ResumeCard'
import { ImportResumeModal } from '../components/ImportResumeModal/ImportResumeModal'
import { DeleteResumeDialog } from '../components/DeleteResumeDialog/DeleteResumeDialog'
import { useResumeStore } from '@/shared/stores/resume.store'
import { parseResumeText } from '../utils/resumeParser'
import type { Resume } from '@/shared/types/resume.types'
import styles from './Dashboard.module.css'

const IMPORT_DEFAULT_TEMPLATE_ID = 'meridian'

type SortBy = 'updated' | 'created' | 'title'

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'updated', label: 'Last updated' },
  { value: 'created', label: 'Date created' },
  { value: 'title', label: 'Title (A–Z)' },
]

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function sortResumes(list: Resume[], sortBy: SortBy): Resume[] {
  const sorted = [...list]
  switch (sortBy) {
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    case 'created':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'updated':
    default:
      return sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
}

function DashboardSkeleton() {
  return (
    <div className={styles.grid}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <Skeleton variant="rect" className={styles.skeletonThumb} />
          <div className={styles.skeletonInfo}>
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="40%" height={12} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const resumeList = useResumeStore((s) => s.resumeList)
  const isLoading = useResumeStore((s) => s.isLoading)
  const error = useResumeStore((s) => s.error)
  const loadResumeList = useResumeStore((s) => s.loadResumeList)
  const createResume = useResumeStore((s) => s.createResume)
  const createResumeFromImport = useResumeStore((s) => s.createResumeFromImport)
  const duplicateResume = useResumeStore((s) => s.duplicateResume)
  const renameResume = useResumeStore((s) => s.renameResume)
  const deleteResume = useResumeStore((s) => s.deleteResume)

  const [showImport, setShowImport] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('updated')

  useEffect(() => {
    void loadResumeList()
  }, [loadResumeList])

  const displayedList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const filtered = query
      ? resumeList.filter((r) => r.title.toLowerCase().includes(query))
      : resumeList
    return sortResumes(filtered, sortBy)
  }, [resumeList, searchQuery, sortBy])

  // Choosing a template is the only step "New Resume" ever needed, so it
  // happens here in a modal rather than on a separate route the user then has
  // to navigate back out of.
  const goToTemplatePicker = () => {
    setShowTemplatePicker(true)
  }

  const handleCreateWithTemplate = async (templateId: string) => {
    setCreating(true)
    try {
      const id = await createResume(templateId)
      void navigate(`/editor/${id}/guided`)
    } catch {
      toast.error('Failed to create resume')
      setShowTemplatePicker(false)
    } finally {
      setCreating(false)
    }
  }

  const handleImport = async (rawText: string) => {
    setImporting(true)
    try {
      const parsed = parseResumeText(rawText)
      const id = await createResumeFromImport(IMPORT_DEFAULT_TEMPLATE_ID, parsed)
      setShowImport(false)
      toast.success('Imported — we did our best to structure it, please review each section.')
      void navigate(`/editor/${id}`)
    } catch {
      toast.error('Failed to import resume')
    } finally {
      setImporting(false)
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const newId = await duplicateResume(id)
      toast.success('Resume duplicated')
      void navigate(`/editor/${newId}`)
    } catch {
      toast.error('Failed to duplicate resume')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteResume(deleteTarget.id)
      toast.success('Resume deleted')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete resume')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PageLayout>
      {/* Private workspace over local resume data — never indexed. */}
      <Seo title="My Resumes" description="Your saved resumes." noindex />
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.heading}>My Resumes</h1>
            <p className={styles.subheading}>
              {resumeList.length > 0
                ? `${resumeList.length} resume${resumeList.length !== 1 ? 's' : ''} · Last edited ${formatRelativeTime(sortResumes(resumeList, 'updated')[0].updatedAt)}`
                : 'Create your first resume'}
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button
              variant="secondary"
              onClick={() => setShowImport(true)}
              aria-label="Import an existing resume"
            >
              <Upload size={16} aria-hidden="true" />
              Import Resume
            </Button>
            <Button variant="primary" onClick={goToTemplatePicker} aria-label="Create a new resume">
              <Plus size={16} aria-hidden="true" />
              New Resume
            </Button>
          </div>
        </div>

        <div className={styles.storageBar}>
          <span>
            <HardDrive size={16} aria-hidden="true" />
            <strong>Saved on this device</strong>
            <span className={styles.storageDetail}>Keep a backup to take your work anywhere.</span>
          </span>
          <Link to="/settings#backups">
            Manage backups <span aria-hidden="true">↗</span>
          </Link>
        </div>

        {error && (
          <div className={styles.errorState} role="alert">
            <AlertCircle size={20} aria-hidden="true" />
            <div>
              <strong>We couldn’t load your workspace.</strong>
              <p>Check that this browser allows site storage, then try again.</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                void loadResumeList()
              }}
              loading={isLoading}
            >
              Try again
            </Button>
          </div>
        )}

        {/* Search + sort */}
        {!isLoading && resumeList.length > 0 && (
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search className={styles.searchIcon} size={16} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search resumes…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search resumes"
                className={styles.searchInput}
              />
            </div>
            <div className={styles.sortWrap}>
              <Select
                label="Sort by"
                hideLabel
                className={styles.sortSelect}
                icon={<ArrowUpDown size={16} aria-hidden="true" />}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                options={SORT_OPTIONS}
              />
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <DashboardSkeleton />
        ) : error && resumeList.length === 0 ? null : resumeList.length === 0 ? (
          <EmptyState
            icon={<FileText size={48} />}
            title="No resumes yet"
            description="Create your first resume to get started. It only takes a few minutes."
            action={
              <Button variant="primary" onClick={goToTemplatePicker}>
                <Plus size={16} aria-hidden="true" />
                Create Resume
              </Button>
            }
          />
        ) : displayedList.length === 0 ? (
          <EmptyState
            icon={<Search size={40} />}
            title="No matching resumes"
            description={`No resumes match "${searchQuery}". Try a different search.`}
            action={
              <Button variant="ghost" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            }
          />
        ) : (
          <div className={styles.grid}>
            {displayedList.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                onDuplicate={(id) => {
                  void handleDuplicate(id)
                }}
                onDelete={(id) => setDeleteTarget({ id, title: resume.title })}
                onRename={async (id, title) => {
                  await renameResume(id, title)
                  toast.success('Resume renamed')
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* keepOpenOnSelect: creating navigates away, so closing first would
          flash the empty dashboard behind the dismissing modal. */}
      <TemplatePickerModal
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelect={(templateId) => {
          void handleCreateWithTemplate(templateId)
        }}
        title="Choose a template"
        intro="Pick a layout to start from — you can change it any time while editing."
        confirmLabel="Create resume"
        isConfirming={creating}
        keepOpenOnSelect
      />

      <ImportResumeModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onConfirm={(rawText) => {
          void handleImport(rawText)
        }}
        isLoading={importing}
      />

      <DeleteResumeDialog
        isOpen={!!deleteTarget}
        resumeTitle={deleteTarget?.title ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          void handleDelete()
        }}
        isLoading={deleting}
      />
    </PageLayout>
  )
}

export default Dashboard
