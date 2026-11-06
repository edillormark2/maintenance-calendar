import type { MaintenanceItem } from '../types'
import { addMonths, daysBetween, type IsoDate } from './dates'

/** Anything due within this many days is flagged as coming up, so a vendor can be booked before it's late. */
export const DUE_SOON_DAYS = 30

export type Status = 'overdue' | 'due-soon' | 'later'

export interface ScheduledItem extends MaintenanceItem {
  nextDue: IsoDate
  /** Days from today to the next due date; negative once that date has passed. */
  daysUntilDue: number
  status: Status
}

/** The brief's rule: last completed plus the frequency, kept inside short months. */
export function nextDueDate(item: Pick<MaintenanceItem, 'lastCompleted' | 'frequencyMonths'>): IsoDate {
  return addMonths(item.lastCompleted, item.frequencyMonths)
}

export function statusFor(daysUntilDue: number): Status {
  // Overdue means the due date has already passed, so a task due today isn't late yet.
  if (daysUntilDue < 0) return 'overdue'
  if (daysUntilDue <= DUE_SOON_DAYS) return 'due-soon'
  return 'later'
}

/** Works out when an item is next due, as seen from `today`. */
export function scheduleItem(item: MaintenanceItem, today: IsoDate): ScheduledItem {
  const nextDue = nextDueDate(item)
  const daysUntilDue = daysBetween(today, nextDue)
  return { ...item, nextDue, daysUntilDue, status: statusFor(daysUntilDue) }
}

/** Most overdue first, which is the same as the earliest due date first. */
export function byDueDate(a: ScheduledItem, b: ScheduledItem): number {
  return a.daysUntilDue - b.daysUntilDue || a.task.localeCompare(b.task)
}

/**
 * Sets one item's last completed date. Marking an item done changes nothing
 * else: its next due date and status are worked out from this date.
 */
export function setLastCompleted(items: MaintenanceItem[], itemId: string, date: IsoDate): MaintenanceItem[] {
  return items.map((item) => (item.id === itemId ? { ...item, lastCompleted: date } : item))
}
