import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { DemoVideo } from './components/DemoVideo'
import { CalendarCheckIcon } from './components/icons'
import { MaintenanceTable } from './components/MaintenanceTable'
import { rowActionId } from './components/rowFocus'
import { Toolbar } from './components/Toolbar'
import { UndoToast } from './components/UndoToast'
import type { Portfolio } from './data/portfolio'
import { applyFilters, groupByProperty, NO_FILTERS, type Filters, type PropertySort } from './lib/filters'
import { formatLongDate, plural } from './lib/format'
import { DUE_SOON_DAYS, scheduleItem, type Status } from './lib/schedule'
import type { Today } from './lib/today'
import { useMaintenance } from './useMaintenance'
import { useToday } from './useToday'

interface AppProps {
  portfolio: Portfolio
  /** The date when the page loaded. */
  today: Today
}

export function App({ portfolio, today: todayOnLoad }: AppProps) {
  const today = useToday(todayOnLoad)
  const { items, lastCompletion, markDone, undo, dismiss } = useMaintenance(portfolio.items, today.date)
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [sort, setSort] = useState<PropertySort>('most-overdue')
  const undoButton = useRef<HTMLButtonElement>(null)

  // The stored state is each item's last completed date, the last "mark done"
  // (for Undo), the filters and the sort. Everything below is worked out from
  // them on each render.
  const scheduled = items.map((item) => scheduleItem(item, today.date))
  const { counts, visible } = applyFilters(scheduled, filters)
  const groups = groupByProperty(portfolio.properties, visible, sort)

  const properties = [...portfolio.properties].sort((a, b) => a.name.localeCompare(b.name))
  const categories = [...new Set(items.map((item) => item.category))].sort((a, b) => a.localeCompare(b))
  const propertyName = (id: string) => portfolio.properties.find((property) => property.id === id)?.name ?? id
  const completed = lastCompletion && scheduled.find((item) => item.id === lastCompletion.itemId)

  // Marking an item done replaces its button and usually moves its row, so focus
  // is moved on purpose: to Undo, then back to the task's row once the message closes.
  // flushSync applies the change straight away, so the element to focus exists.
  function handleMarkDone(itemId: string) {
    flushSync(() => markDone(itemId))
    undoButton.current?.focus()
  }

  function handleUndo() {
    const itemId = lastCompletion?.itemId
    flushSync(() => undo())
    if (itemId) document.getElementById(rowActionId(itemId))?.focus()
  }

  function handleDismiss() {
    const itemId = lastCompletion?.itemId
    flushSync(() => dismiss())
    if (itemId) document.getElementById(rowActionId(itemId))?.focus()
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="brand">
          <span className="brand-mark">
            <CalendarCheckIcon />
          </span>
          <div>
            <h1>Preventative maintenance</h1>
            <p className="subtitle">
              {plural(portfolio.properties.length, 'property', 'properties')} ·{' '}
              {plural(items.length, 'recurring task')}
            </p>
            <DemoVideo />
          </div>
        </div>
        <p className="today">
          <span className="today-label">{today.fromAddressBar ? 'Viewing as of' : 'Today'}</span>
          <time dateTime={today.date}>{formatLongDate(today.date)}</time>
          {today.fromAddressBar && <a href="?">Back to today</a>}
        </p>
      </header>

      <main>
        {portfolio.problems.length > 0 && (
          <section className="notice" aria-labelledby="data-problems-title">
            <h2 id="data-problems-title">Some rows in the data files were skipped</h2>
            <ul>
              {portfolio.problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </section>
        )}

        <Toolbar
          filters={filters}
          onFiltersChange={setFilters}
          sort={sort}
          onSortChange={setSort}
          properties={properties}
          categories={categories}
          counts={counts}
          shown={visible.length}
          total={items.length}
        />

        {groups.length > 0 ? (
          <MaintenanceTable
            groups={groups}
            today={today.date}
            highlightedId={lastCompletion?.itemId ?? null}
            onMarkDone={handleMarkDone}
          />
        ) : (
          <EmptyState
            status={filters.status}
            hasItems={items.length > 0}
            hasProblems={portfolio.problems.length > 0}
            onShowAll={() => setFilters(NO_FILTERS)}
          />
        )}

        <p className="footnote">Marking a task done lasts until you refresh the page.</p>
      </main>

      {/* Always in the page, so screen readers announce the message when it appears. */}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {completed && (
          <UndoToast
            task={completed.task}
            propertyName={propertyName(completed.propertyId)}
            nextDue={completed.nextDue}
            undoRef={undoButton}
            onUndo={handleUndo}
            onDismiss={handleDismiss}
          />
        )}
      </div>
    </div>
  )
}

const EMPTY_TITLES: Record<Status, string> = {
  overdue: 'Nothing is overdue',
  'due-soon': `Nothing is due in the next ${DUE_SOON_DAYS} days`,
  later: `Nothing is due more than ${DUE_SOON_DAYS} days out`,
}

interface EmptyStateProps {
  status: Status | null
  hasItems: boolean
  hasProblems: boolean
  onShowAll: () => void
}

function EmptyState({ status, hasItems, hasProblems, onShowAll }: EmptyStateProps) {
  if (!hasItems) {
    return (
      <div className="empty">
        <p className="empty-title">No maintenance tasks to show</p>
        <p>
          {hasProblems
            ? 'The rows listed above need fixing first.'
            : 'The maintenance file has no tasks in it yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="empty">
      <p className="empty-title">{status ? EMPTY_TITLES[status] : 'No tasks match these filters'}</p>
      <p>Try another property or category, or show every task.</p>
      <button type="button" className="button" onClick={onShowAll}>
        Show all tasks
      </button>
    </div>
  )
}
