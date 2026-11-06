import { describe, expect, it } from 'vitest'
import { loadPortfolio } from '../data/portfolio'
import type { MaintenanceItem } from '../types'
import { DUE_SOON_DAYS, scheduleItem, setLastCompleted, statusFor } from './schedule'

const TODAY = '2026-11-07'

describe('the sample data, as of Saturday, November 7, 2026', () => {
  const scheduled = loadPortfolio().items.map((item) => scheduleItem(item, TODAY))

  // Worked out by hand from the CSV: last_completed plus frequency_months.
  it.each([
    ['1', '2026-11-03', -4],
    ['2', '2026-11-30', 23], // Oct 31 + 1 month: November has no 31st
    ['3', '2026-11-30', 23], // Aug 31 + 3 months
    ['4', '2026-11-20', 13],
    ['5', '2026-10-15', -23],
    ['6', '2026-10-28', -10],
    ['7', '2026-12-15', 38],
    ['8', '2026-11-20', 13],
    ['9', '2026-10-15', -23],
    ['10', '2026-11-20', 13],
    ['11', '2026-11-30', 23], // May 31 + 6 months
    ['12', '2027-01-10', 64],
    ['13', '2026-10-25', -13],
    ['14', '2026-11-05', -2],
    ['15', '2027-02-28', 113], // Aug 31 + 6 months: February has no 31st
  ])('item %s is next due %s, %i days from today', (id, nextDue, days) => {
    const item = scheduled.find((candidate) => candidate.id === id)
    expect(item).toMatchObject({ nextDue, daysUntilDue: days })
    expect(item?.status === 'overdue').toBe(days < 0)
  })
})

describe('statusFor', () => {
  it('is overdue only once the due date has passed', () => {
    expect(statusFor(-1)).toBe('overdue')
    expect(statusFor(0)).toBe('due-soon')
  })

  it(`counts up to ${DUE_SOON_DAYS} days ahead as due soon`, () => {
    expect(statusFor(DUE_SOON_DAYS)).toBe('due-soon')
    expect(statusFor(DUE_SOON_DAYS + 1)).toBe('later')
  })
})

describe('marking an item done', () => {
  const fireAlarm: MaintenanceItem = {
    id: '1',
    propertyId: 'P1',
    task: 'Fire alarm inspection',
    category: 'Fire and life safety',
    frequencyMonths: 12,
    lastCompleted: '2025-11-03',
  }

  it('sets last completed to today, which moves the next due date a full cycle on', () => {
    const [updated] = setLastCompleted([fireAlarm], '1', TODAY)
    expect(updated.lastCompleted).toBe(TODAY)
    expect(scheduleItem(updated, TODAY)).toMatchObject({ nextDue: '2027-11-07', daysUntilDue: 365 })
  })

  it('applies the month-end rule when done on the 31st', () => {
    const monthly = { ...fireAlarm, frequencyMonths: 1 }
    const [updated] = setLastCompleted([monthly], '1', '2027-01-31')
    expect(scheduleItem(updated, '2027-01-31').nextDue).toBe('2027-02-28')
  })

  it('leaves every other item alone', () => {
    const other = { ...fireAlarm, id: '2' }
    const updated = setLastCompleted([fireAlarm, other], '1', TODAY)
    expect(updated[1]).toBe(other)
  })
})
