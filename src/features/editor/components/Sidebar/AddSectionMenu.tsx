import { useState } from 'react'
import { Plus, AlignLeft, Briefcase, GraduationCap, Zap, FolderOpen, Award, LayoutList } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { SectionType } from '@/shared/types/resume.types'
import styles from './AddSectionMenu.module.css'

const ADD_OPTIONS: { type: SectionType; label: string; Icon: React.ElementType }[] = [
  { type: 'experience', label: 'Experience', Icon: Briefcase },
  { type: 'education', label: 'Education', Icon: GraduationCap },
  { type: 'skills', label: 'Skills', Icon: Zap },
  { type: 'projects', label: 'Projects', Icon: FolderOpen },
  { type: 'certifications', label: 'Certifications', Icon: Award },
  { type: 'custom', label: 'Custom Section', Icon: LayoutList },
  { type: 'summary', label: 'Summary', Icon: AlignLeft },
]

interface AddSectionMenuProps {
  onAdd: (type: SectionType) => void
}

export function AddSectionMenu({ onAdd }: AddSectionMenuProps) {
  const [open, setOpen] = useState(false)

  const handleAdd = (type: SectionType) => {
    onAdd(type)
    setOpen(false)
  }

  return (
    <div className={styles.root}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={styles.trigger}
      >
        <Plus size={15} aria-hidden="true" />
        Add section
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className={styles.overlay} onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.ul
              role="listbox"
              aria-label="Choose section to add"
              className={styles.menu}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
            >
              {ADD_OPTIONS.map(({ type, label, Icon }) => (
                <li key={type}>
                  <button
                    role="option"
                    aria-selected="false"
                    onClick={() => handleAdd(type)}
                    className={styles.option}
                  >
                    <Icon size={14} aria-hidden="true" />
                    {label}
                  </button>
                </li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
