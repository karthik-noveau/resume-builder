import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, RotateCcw, Search } from 'lucide-react'
import type { IconName } from '@/shared/types/layout.types'
import { ICON_LIBRARY, ICON_PATHS, ICON_VIEWBOX_PX, SELECTABLE_ICONS } from '@/features/templates/engine/icons'
import styles from './IconPicker.module.css'

interface IconPickerProps {
  /** Currently applied icon — the override if set, otherwise the template default. */
  value: IconName
  /** True when `value` comes from the template rather than an explicit choice. */
  isDefault: boolean
  onChange: (icon: IconName) => void
  onReset: () => void
}

/** Renders a library glyph with the same path data the resume renderers use. */
export function IconGlyph({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox={`0 0 ${ICON_VIEWBOX_PX} ${ICON_VIEWBOX_PX}`}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}

const readable = (icon: IconName) => icon.replace(/-/g, ' ')

/**
 * Section-header icon chooser. Draws each option from the same ICON_PATHS the
 * canvas and PDF renderers use, so what is picked here is exactly what prints.
 *
 * The library is too large to sit inline in the properties panel — it would
 * push every other section control off-screen — so the grid lives in a popover
 * behind a trigger showing the current glyph, with a filter for finding one by
 * name instead of scanning eight groups.
 */
export function IconPicker({ value, isDefault, onChange, onReset }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const popoverId = useId()

  // Reopening should present a clean library rather than the last search.
  useEffect(() => {
    if (open) {
      setQuery('')
      searchRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
    }
    // Closing on focus loss as well as pointer-down keeps the popover from
    // being left open behind a tab into the rest of the panel.
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onFocusIn = (e: FocusEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [open])

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return ICON_LIBRARY
    return ICON_LIBRARY.map((g) => ({
      ...g,
      icons: g.icons.filter((i) => readable(i).includes(term)),
    })).filter((g) => g.icons.length > 0)
  }, [query])

  const choose = (icon: IconName) => {
    onChange(icon)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.header}>
        <span className={styles.label}>Section icon</span>
        {!isDefault && (
          <button type="button" onClick={onReset} className={styles.reset}>
            <RotateCcw size={11} aria-hidden="true" />
            Reset
          </button>
        )}
      </div>

      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
      >
        <span className={styles.triggerGlyph}>
          <IconGlyph name={value} size={18} />
        </span>
        <span className={styles.triggerName}>{readable(value)}</span>
        {isDefault && <span className={styles.defaultTag}>Default</span>}
        <ChevronDown size={14} aria-hidden="true" className={clsx(styles.chevron, open && styles.chevronOpen)} />
      </button>

      {open && (
        <div className={styles.popover} id={popoverId} role="dialog" aria-label="Choose a section icon">
          <div className={styles.search}>
            <Search size={13} aria-hidden="true" className={styles.searchIcon} />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${SELECTABLE_ICONS.length} icons`}
              aria-label="Search icons"
              className={styles.searchInput}
            />
          </div>

          <div className={styles.scroll}>
            {groups.map((group) => (
              <div key={group.group} className={styles.group}>
                <span className={styles.groupLabel}>{group.group}</span>
                <div className={styles.grid} role="radiogroup" aria-label={`${group.group} icons`}>
                  {group.icons.map((icon) => {
                    const selected = icon === value
                    return (
                      <button
                        key={icon}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={readable(icon)}
                        title={readable(icon)}
                        onClick={() => choose(icon)}
                        className={clsx(styles.option, selected && styles.optionActive)}
                      >
                        <IconGlyph name={icon} />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {groups.length === 0 && <p className={styles.empty}>No icon matches “{query.trim()}”.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
