import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button/Button'
import { ShareDialog } from './ShareDialog'
import styles from './Share.module.css'

export function ShareButton({ resumeId }: { resumeId: string }) {
  const [open, setOpen] = useState(false)
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
      {open && <ShareDialog resumeId={resumeId} onClose={() => setOpen(false)} />}
    </>
  )
}
