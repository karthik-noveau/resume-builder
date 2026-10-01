import { Columns2, RectangleVertical, Search, SlidersHorizontal } from 'lucide-react'
import { clsx } from 'clsx'
import { Select } from '@/shared/components/ui/Select/Select'
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
            {
              id: 'single-column',
              label: 'One Column',
              mobileLabel: '1 column',
              Icon: RectangleVertical,
            },
            { id: 'two-column', label: 'Two Column', mobileLabel: '2 columns', Icon: Columns2 },
          ] as const
        ).map(({ id, label, mobileLabel, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange({ ...value, layout: id })}
            aria-label={label}
            aria-pressed={value.layout === id}
            className={clsx(styles.filterButton, value.layout === id && styles.active)}
          >
            <Icon size={13} aria-hidden="true" />
            <span className={styles.fullLabel}>{label}</span>
            <span className={styles.mobileLabel} aria-hidden="true">
              {mobileLabel}
            </span>
          </button>
        ))}
      </div>
      <div className={styles.styleFilter}>
        <Select
          label="Style"
          hideLabel
          icon={<SlidersHorizontal size={14} aria-hidden="true" />}
          className={styles.styleSelect}
          value={value.style ?? 'All'}
          onChange={(event) =>
            onChange({ ...value, style: event.target.value as TemplateFilterValues['style'] })
          }
          options={[
            { value: 'All', label: 'All styles' },
            { value: 'Simple', label: 'Simple' },
            { value: 'Ultra Modern', label: 'Ultra Modern' },
          ]}
        />
      </div>
      <div className={styles.searchWrap}>
        <Search className={styles.searchIcon} size={16} aria-hidden="true" />
        <input
          type="search"
          aria-label="Search templates"
          placeholder="Search…"
          value={value.search}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
          className={styles.searchInput}
        />
      </div>
    </div>
  )
}
