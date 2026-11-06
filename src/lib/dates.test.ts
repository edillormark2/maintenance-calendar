import { describe, expect, it } from 'vitest'
import { addMonths, daysBetween, daysInMonth, parseIsoDate, toIsoDate } from './dates'

describe('addMonths', () => {
  it.each([
    ['2026-01-15', 1, '2026-02-15'],
    ['2026-12-15', 1, '2027-01-15'],
    ['2025-11-03', 12, '2026-11-03'],
    // The brief's example: the day doesn't exist, so use the last day of the month.
    ['2026-01-31', 1, '2026-02-28'],
    ['2028-01-31', 1, '2028-02-29'],
    ['2026-03-31', 1, '2026-04-30'],
    // Leap years skip centuries, except every 400 years.
    ['2100-01-31', 1, '2100-02-28'],
    ['2000-01-31', 1, '2000-02-29'],
    // Rows from the sample data that land on a short month.
    ['2026-10-31', 1, '2026-11-30'],
    ['2026-08-31', 3, '2026-11-30'],
    ['2026-05-31', 6, '2026-11-30'],
    ['2026-08-31', 6, '2027-02-28'],
  ])('%s plus %i months is %s', (date, months, expected) => {
    expect(addMonths(date, months)).toBe(expected)
  })

  it('counts each step from the original day, not from the clamped one', () => {
    expect(addMonths('2026-01-31', 2)).toBe('2026-03-31')
  })
})

describe('parseIsoDate', () => {
  it('accepts real dates, ignoring spaces around them', () => {
    expect(parseIsoDate('2026-02-28')).toBe('2026-02-28')
    expect(parseIsoDate(' 2028-02-29 ')).toBe('2028-02-29')
  })

  it.each([
    '2026-02-29',
    '2026-02-30',
    '2026-04-31',
    '2026-13-01',
    '2026-00-10',
    '2026-1-5',
    '11/03/2025',
    '',
  ])('rejects "%s"', (value) => {
    expect(parseIsoDate(value)).toBeNull()
  })
})

describe('daysBetween', () => {
  it('is positive for a later date and negative for an earlier one', () => {
    expect(daysBetween('2026-11-07', '2026-11-30')).toBe(23)
    expect(daysBetween('2026-11-07', '2026-11-03')).toBe(-4)
    expect(daysBetween('2026-11-07', '2026-11-07')).toBe(0)
  })

  it('counts whole days across daylight saving changes and year ends', () => {
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2)
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2)
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1)
  })
})

describe('daysInMonth', () => {
  it('knows February in leap and common years', () => {
    expect(daysInMonth(2027, 2)).toBe(28)
    expect(daysInMonth(2028, 2)).toBe(29)
    expect(daysInMonth(2026, 9)).toBe(30)
    expect(daysInMonth(2026, 12)).toBe(31)
  })
})

describe('toIsoDate', () => {
  it("uses the device's calendar date, not the UTC one", () => {
    expect(toIsoDate(new Date(2026, 10, 7, 23, 59))).toBe('2026-11-07')
    expect(toIsoDate(new Date(2027, 0, 1, 0, 0))).toBe('2027-01-01')
  })
})
