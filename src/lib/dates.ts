/**
 * Calendar dates with no time of day, written as ISO strings ("2026-11-30").
 *
 * The CSV dates are days on a calendar, not moments in time. Turning them into
 * JavaScript Dates invites time zone bugs: new Date("2025-11-03") is midnight
 * UTC, which is still November 2 in the United States. So the arithmetic here
 * works on year, month and day numbers, and Date.UTC is only used to count
 * the days between two dates.
 */
export type IsoDate = string

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const MS_PER_DAY = 24 * 60 * 60 * 1000

interface DateParts {
  year: number
  /** 1 to 12 */
  month: number
  day: number
}

function toParts(date: IsoDate): DateParts {
  const match = ISO_DATE.exec(date)
  if (!match) throw new Error(`Expected a date like 2026-01-31, got "${date}"`)
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

function fromParts({ year, month, day }: DateParts): IsoDate {
  const pad = (value: number, length: number) => String(value).padStart(length, '0')
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

/** The date, if `value` is a real calendar day written as YYYY-MM-DD; otherwise null. */
export function parseIsoDate(value: string): IsoDate | null {
  const match = ISO_DATE.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null
  return fromParts({ year, month, day })
}

/**
 * Adds whole months. If the day doesn't exist in the month it lands in, the
 * result is that month's last day: January 31 plus one month is February 28,
 * or February 29 in a leap year.
 */
export function addMonths(date: IsoDate, months: number): IsoDate {
  const { year, month, day } = toParts(date)
  const monthsSinceYearZero = year * 12 + (month - 1) + months
  const targetYear = Math.floor(monthsSinceYearZero / 12)
  const targetMonth = monthsSinceYearZero - targetYear * 12 + 1
  return fromParts({
    year: targetYear,
    month: targetMonth,
    day: Math.min(day, daysInMonth(targetYear, targetMonth)),
  })
}

/** Whole days from `from` to `to`: positive when `to` is later, negative when it's earlier. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY)
}

function toUtcMs(date: IsoDate): number {
  const { year, month, day } = toParts(date)
  return Date.UTC(year, month - 1, day)
}

/** A Date for display with Intl, pinned to UTC so formatting can't shift the day. */
export function toUtcDate(date: IsoDate): Date {
  return new Date(toUtcMs(date))
}

/** The calendar date on this device's clock. */
export function toIsoDate(now: Date): IsoDate {
  return fromParts({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() })
}
