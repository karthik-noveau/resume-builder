import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './RevealSection.module.css'

export function RevealSection({ children }: { children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!container.current || typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setRevealed(true)
        observer.disconnect()
      },
      { threshold: 0.05 }
    )
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={container}
      className={styles.section}
      data-revealed={revealed}
      onFocusCapture={() => setRevealed(true)}
    >
      {children}
    </div>
  )
}
