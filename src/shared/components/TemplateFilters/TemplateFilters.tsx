import { Columns2, RectangleVertical, Search } from 'lucide-react'
import { clsx } from 'clsx'
import {
  DEFAULT_TEMPLATE_FILTERS,
  hasTemplateFilters,
  type TemplateFilterValues,
} from '@/shared/utils/templateFilters'
import styles from './TemplateFilters.module.css'

interface TemplateFiltersProps {
  value: TemplateFilterValues
  onChange: (value: TemplateFilterValues) => void
  compact?: boolean
  className?: string
}

export function TemplateFilters({
  value,
  onChange,
  compact = false,
  className,
}: TemplateFiltersProps) {
  return (
    <div className={clsx(styles.filters, compact && styles.compact, className)}>
      <div className={styles.group} role="group" aria-label="Filter by column layout">
        <button
          type="button"
          onClick={() => onChange(DEFAULT_TEMPLATE_FILTERS)}
          aria-label="All Templates"
          aria-pressed={!hasTemplateFilters(value)}
          className={clsx(styles.filterButton, !hasTemplateFilters(value) && styles.active)}
        >
          All<span className={styles.allSuffix}> Templates</span>
        </button>
        {(
          [
            { id: 'single-column', label: 'One Column', Icon: RectangleVertical },
            { id: 'two-column', label: 'Two Column', Icon: Columns2 },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange({ ...value, layout: id })}
            aria-pressed={value.layout === id}
            className={clsx(styles.filterButton, value.layout === id && styles.active)}
          >
            <Icon size={13} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div className={styles.searchWrap}>
        <Search className={styles.searchIcon} size={16} aria-hidden="true" />
        <input
          type="search"
          aria-label="Search templates"
          placeholder="Search templates..."
          value={value.search}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
          className={styles.searchInput}
        />
      </div>
    </div>
  )
}
