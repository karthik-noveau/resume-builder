import { ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { Tooltip } from '@/shared/components/ui/Tooltip/Tooltip'
import styles from './ZoomControls.module.css'

interface ZoomControlsProps {
  zoomLevel: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
}

export function ZoomControls({ zoomLevel, onZoomIn, onZoomOut, onResetZoom }: ZoomControlsProps) {
  const zoomPercent = Math.round(zoomLevel * 100)

  return (
    <div className={styles.group}>
      <Tooltip content="Zoom out">
        <button
          onClick={onZoomOut}
          aria-label="Zoom out"
          className={styles.button}
        >
          <ZoomOut size={18} aria-hidden="true" />
        </button>
      </Tooltip>

      <Tooltip content="Reset zoom">
        <button
          onClick={onResetZoom}
          aria-label={`Zoom level ${zoomPercent}% — click to reset`}
          className={styles.zoomLabel}
        >
          {zoomPercent}%
        </button>
      </Tooltip>

      <Tooltip content="Zoom in">
        <button
          onClick={onZoomIn}
          aria-label="Zoom in"
          className={styles.button}
        >
          <ZoomIn size={18} aria-hidden="true" />
        </button>
      </Tooltip>

      <Tooltip content="Fit to window">
        <button
          onClick={onResetZoom}
          aria-label="Fit to window"
          className={styles.button}
        >
          <Maximize size={18} aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  )
}
