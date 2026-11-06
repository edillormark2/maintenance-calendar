import { hasFilters, NO_FILTERS, type Filters, type PropertySort, type StatusCounts } from '../lib/filters'
import { plural } from '../lib/format'
import { DUE_SOON_DAYS, type Status } from '../lib/schedule'
import type { Property } from '../types'

const STATUS_OPTIONS: { value: Status | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due-soon', label: `Next ${DUE_SOON_DAYS} days` },
  { value: 'later', label: 'Later' },
]

interface ToolbarProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  sort: PropertySort
  onSortChange: (sort: PropertySort) => void
  properties: Property[]
  categories: string[]
  counts: StatusCounts
  shown: number
  total: number
}

export function Toolbar({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  properties,
  categories,
  counts,
  shown,
  total,
}: ToolbarProps) {
  const inScope = counts.overdue + counts['due-soon'] + counts.later

  return (
    <>
      <div className="toolbar">
        <fieldset className="status-filter">
          <legend className="visually-hidden">Status</legend>
          {STATUS_OPTIONS.map((option) => {
            const count = option.value === null ? inScope : counts[option.value]
            return (
              <label key={option.label} className="status-option" data-status={option.value ?? 'all'}>
                <input
                  type="radio"
                  name="status"
                  checked={filters.status === option.value}
                  onChange={() => onFiltersChange({ ...filters, status: option.value })}
                />
                {option.label}{' '}
                <span className="status-count" data-empty={count === 0 || undefined}>
                  {count}
                </span>
              </label>
            )
          })}
        </fieldset>

        <div className="filters">
          <label>
            <span className="visually-hidden">Property</span>
            <select
              className="select"
              value={filters.propertyId ?? ''}
              onChange={(event) => onFiltersChange({ ...filters, propertyId: event.target.value || null })}
            >
              <option value="">All properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="visually-hidden">Category</span>
            <select
              className="select"
              value={filters.category ?? ''}
              onChange={(event) => onFiltersChange({ ...filters, category: event.target.value || null })}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="results">
        <p aria-live="polite">
          {shown === total
            ? `Showing all ${plural(total, 'task')}`
            : `Showing ${shown} of ${plural(total, 'task')}`}
        </p>
        <div className="results-actions">
          {hasFilters(filters) && (
            <button type="button" className="link-button" onClick={() => onFiltersChange(NO_FILTERS)}>
              Clear filters
            </button>
          )}
          <label className="sort-field">
            Sort by
            <select
              className="select select-compact"
              value={sort}
              onChange={(event) => onSortChange(event.target.value as PropertySort)}
            >
              <option value="most-overdue">Most overdue first</option>
              <option value="name">Property name</option>
            </select>
          </label>
        </div>
      </div>
    </>
  )
}
