import { describe, expect, it } from 'vitest'
import { formatDate, formatDueIn, formatFrequency, formatLongDate } from './format'

describe('formatting', () => {
  it('shows dates without shifting the day in any time zone', () => {
    expect(formatDate('2026-11-03')).toBe('Nov 3, 2026')
    expect(formatLongDate('2026-11-07')).toBe('Saturday, November 7, 2026')
  })

  it.each([
    [-23, '23 days overdue'],
    [-1, '1 day overdue'],
    [0, 'Due today'],
    [1, 'Due tomorrow'],
    [13, 'Due in 13 days'],
  ])('describes %i days until due as "%s"', (days, text) => {
    expect(formatDueIn(days)).toBe(text)
  })

  it.each([
    [1, 'Monthly'],
    [3, 'Every 3 months'],
    [12, 'Yearly'],
    [24, 'Every 2 years'],
  ])('describes every %i months as "%s"', (months, text) => {
    expect(formatFrequency(months)).toBe(text)
  })
})
