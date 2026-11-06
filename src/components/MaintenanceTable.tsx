import type { IsoDate } from '../lib/dates'
import type { PropertyGroup } from '../lib/filters'
import { formatDate, formatDueIn, formatFrequency } from '../lib/format'
import type { ScheduledItem } from '../lib/schedule'
import { CheckIcon } from './icons'
import { rowActionId } from './rowFocus'

interface MaintenanceTableProps {
  groups: PropertyGroup[]
  today: IsoDate
  /** The item just marked done. It glows for a moment so the eye can find where it moved to. */
  highlightedId: string | null
  onMarkDone: (itemId: string) => void
}

export function MaintenanceTable({ groups, today, highlightedId, onMarkDone }: MaintenanceTableProps) {
  return (
    <div className="table-panel">
      <table className="schedule">
        <caption className="visually-hidden">Recurring maintenance tasks by property</caption>
        <thead>
          <tr>
            <th scope="col">Task</th>
            <th scope="col">Repeats</th>
            <th scope="col">Last done</th>
            <th scope="col">Next due</th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className="visually-hidden">Action</span>
            </th>
          </tr>
        </thead>
        {groups.map(({ property, items }) => {
          const overdue = items.filter((item) => item.status === 'overdue').length
          return (
            <tbody key={property.id}>
              <tr className="group-row">
                <th scope="rowgroup" colSpan={6}>
                  <div className="group-heading">
                    <span className="group-name">{property.name}</span>
                    <span className="group-place">
                      {[property.city, property.state].filter(Boolean).join(', ')}
                    </span>
                    {overdue > 0 && <span className="group-overdue">{overdue} overdue</span>}
                  </div>
                </th>
              </tr>
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  propertyName={property.name}
                  today={today}
                  highlighted={item.id === highlightedId}
                  onMarkDone={onMarkDone}
                />
              ))}
            </tbody>
          )
        })}
      </table>
    </div>
  )
}

interface ItemRowProps {
  item: ScheduledItem
  propertyName: string
  today: IsoDate
  highlighted: boolean
  onMarkDone: (itemId: string) => void
}

function ItemRow({ item, propertyName, today, highlighted, onMarkDone }: ItemRowProps) {
  const frequency = formatFrequency(item.frequencyMonths)
  // ISO dates compare correctly as text. Done today, or dated later, means there's nothing to mark.
  const done = item.lastCompleted >= today

  return (
    <tr className={highlighted ? 'item-row just-done' : 'item-row'}>
      <td className="cell-task">
        <span className="task-name">{item.task}</span>
        <span className="task-meta">
          {item.category}
          {/* On a phone the Repeats column is hidden and the frequency moves up here. */}
          <span className="task-frequency"> · {frequency}</span>
        </span>
      </td>
      <td className="cell-repeats">{frequency}</td>
      <td className="cell-last">
        <span className="cell-label">Last done </span>
        <time dateTime={item.lastCompleted}>{formatDate(item.lastCompleted)}</time>
      </td>
      <td className="cell-next">
        <span className="cell-label">Next due </span>
        <time dateTime={item.nextDue}>{formatDate(item.nextDue)}</time>
      </td>
      <td className="cell-status">
        <span className={`status status-${item.status}`}>{formatDueIn(item.daysUntilDue)}</span>
      </td>
      <td className="cell-action">
        {done ? (
          <span id={rowActionId(item.id)} className="done-today" tabIndex={-1}>
            <CheckIcon />
            {item.lastCompleted === today ? 'Done today' : 'Done'}
          </span>
        ) : (
          <button
            id={rowActionId(item.id)}
            type="button"
            className="button"
            onClick={() => onMarkDone(item.id)}
          >
            <CheckIcon />
            Mark done
            <span className="visually-hidden">
              : {item.task}, {propertyName}
            </span>
          </button>
        )}
      </td>
    </tr>
  )
}
