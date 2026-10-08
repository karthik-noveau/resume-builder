import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button/Button'
import { ShareDialog } from './ShareDialog'
import styles from './Share.module.css'

interface ShareButtonProps {
  resumeId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ShareButton({ resumeId, open, onOpenChange }: ShareButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        aria-label="Share resume"
        className={styles.shareButton}
      >
        <Share2 size={15} aria-hidden="true" />
        <span>Share</span>
      </Button>
      <AnimatePresence>{isOpen && <ShareDialog resumeId={resumeId} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  )
}
