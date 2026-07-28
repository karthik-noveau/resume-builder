import { Undo2, Redo2 } from 'lucide-react'
import { Tooltip } from '@/shared/components/ui/Tooltip/Tooltip'
import styles from './UndoRedoButtons.module.css'

interface UndoRedoButtonsProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

export function UndoRedoButtons({ canUndo, canRedo, onUndo, onRedo }: UndoRedoButtonsProps) {
  return (
    <div className={styles.group}>
      <Tooltip content="Undo (⌘Z)">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          className={styles.button}
        >
          <Undo2 size={18} aria-hidden="true" />
        </button>
      </Tooltip>
      <Tooltip content="Redo (⌘⇧Z)">
        <button
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          className={styles.button}
        >
          <Redo2 size={18} aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  )
}
