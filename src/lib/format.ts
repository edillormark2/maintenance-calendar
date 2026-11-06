import { toUtcDate, type IsoDate } from './dates'

// Dates are shown in UTC because toUtcDate puts them there; in any other zone
// the formatted day could shift by one.
const shortDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})
const longDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

/** "Nov 30, 2026" */
export function formatDate(date: IsoDate): string {
  return shortDate.format(toUtcDate(date))
}

/** "Saturday, November 7, 2026" */
export function formatLongDate(date: IsoDate): string {
  return longDate.format(toUtcDate(date))
}

/** "Monthly", "Every 3 months", "Yearly", "Every 2 years" */
export function formatFrequency(months: number): string {
  if (months === 1) return 'Monthly'
  if (months === 12) return 'Yearly'
  if (months % 12 === 0) return `Every ${months / 12} years`
  return `Every ${months} months`
}

/** "4 days overdue", "Due today", "Due tomorrow", "Due in 23 days" */
export function formatDueIn(daysUntilDue: number): string {
  if (daysUntilDue < 0) return `${plural(-daysUntilDue, 'day')} overdue`
  if (daysUntilDue === 0) return 'Due today'
  if (daysUntilDue === 1) return 'Due tomorrow'
  return `Due in ${plural(daysUntilDue, 'day')}`
}

/** "1 day", "4 days", "5 properties" */
export function plural(count: number, noun: string, pluralNoun = `${noun}s`): string {
  return `${count} ${count === 1 ? noun : pluralNoun}`
}
