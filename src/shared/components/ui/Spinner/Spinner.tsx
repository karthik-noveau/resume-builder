import styles from './Spinner.module.css'

interface SpinnerProps {
  size?: number
  className?: string
  label?: string
}

/**
 * A tapered arc sweeping over a faint track.
 *
 * Replaces antd's four-dot `Spin`, which rendered at one of three preset sizes
 * regardless of the `size` prop — the prop was mapped onto 'small' | 'medium' |
 * 'large', and 'medium' is not even a value antd accepts, so a `size={28}`
 * request silently produced whatever antd's default happened to be. Drawing it
 * here means the number is the diameter, in pixels, exactly.
 *
 * The arc is a stroked circle with a dash gap rather than a border trick, so it
 * stays perfectly round at any size and keeps its round cap — a border-based
 * spinner shows flat, square ends and visibly polygonal edges when scaled up.
 */
export function Spinner({ size = 24, className, label = 'Loading…' }: SpinnerProps) {
  // Proportional to the diameter so a 16px and a 48px spinner read as the same
  // object at two scales, rather than one looking spindly and the other heavy.
  const stroke = Math.max(1.5, size / 11)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <span role="status" aria-label={label} className={`${styles.root}${className ? ` ${className}` : ''}`}>
      <svg
        className={styles.svg}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          className={styles.track}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          /* A quarter-turn arc: long enough to read as motion, short enough
             that the gap never looks like a broken ring. */
          strokeDasharray={`${circumference * 0.28} ${circumference}`}
          className={styles.arc}
        />
      </svg>
    </span>
  )
}
