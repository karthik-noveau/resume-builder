import { ChevronUp, ChevronDown } from 'lucide-react'
import styles from './PageIndicator.module.css'

interface PageIndicatorProps {
  currentPage: number
  totalPages: number
  onPrevPage: () => void
  onNextPage: () => void
}

/** Floating "Page X of Y" indicator with prev/next, shown only for multi-page resumes. */
export function PageIndicator({ currentPage, totalPages, onPrevPage, onNextPage }: PageIndicatorProps) {
  return (
    <div className={styles.root} role="group" aria-label="Page navigation">
      <button
        type="button"
        aria-label="Previous page"
        onClick={onPrevPage}
        disabled={currentPage === 0}
        className={styles.button}
      >
        <ChevronUp size={14} aria-hidden="true" />
      </button>
      <span className={styles.label} aria-live="polite">
        Page {currentPage + 1} of {totalPages}
      </span>
      <button
        type="button"
        aria-label="Next page"
        onClick={onNextPage}
        disabled={currentPage === totalPages - 1}
        className={styles.button}
      >
        <ChevronDown size={14} aria-hidden="true" />
      </button>
    </div>
  )
}
