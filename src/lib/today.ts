import { parseIsoDate, toIsoDate, type IsoDate } from './dates'

export interface Today {
  date: IsoDate
  /** True when the date came from ?today= in the address bar instead of the clock. */
  fromAddressBar: boolean
}

/**
 * The date the schedule counts from: this device's date, or one given as
 * ?today=2027-01-31 to check how the schedule looks on another day.
 */
export function getToday(search: string, now: Date): Today {
  const requested = new URLSearchParams(search).get('today')
  const date = requested === null ? null : parseIsoDate(requested)
  return date ? { date, fromAddressBar: true } : { date: toIsoDate(now), fromAddressBar: false }
}
