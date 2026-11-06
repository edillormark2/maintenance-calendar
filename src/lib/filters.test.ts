import { describe, expect, it } from 'vitest'
import { fixture, TODAY } from '../test/fixtures'
import { applyFilters, groupByProperty, NO_FILTERS } from './filters'
import { scheduleItem } from './schedule'

const scheduled = fixture.items.map((item) => scheduleItem(item, TODAY))

describe('applyFilters', () => {
  it('counts statuses after the property and category filters, before the status filter', () => {
    const { counts, visible } = applyFilters(scheduled, {
      propertyId: 'A',
      category: null,
      status: 'overdue',
    })
    expect(counts).toEqual({ overdue: 1, 'due-soon': 1, later: 1 })
    expect(visible.map((item) => item.task)).toEqual(['Fire alarm inspection'])
  })

  it('filters by category', () => {
    const { visible } = applyFilters(scheduled, { ...NO_FILTERS, category: 'HVAC' })
    expect(visible.map((item) => item.task)).toEqual(['HVAC filter change'])
  })
})

describe('groupByProperty', () => {
  const names = (sort: 'most-overdue' | 'name', items = scheduled) =>
    groupByProperty(fixture.properties, items, sort).map((group) => group.property.name)

  it('puts the property with the most overdue task first, or sorts by name', () => {
    expect(names('most-overdue')).toEqual(['Cedar Court', 'Bay Plaza'])
    expect(names('name')).toEqual(['Bay Plaza', 'Cedar Court'])
  })

  it("lists each property's tasks most overdue first", () => {
    const [cedarCourt] = groupByProperty(fixture.properties, scheduled, 'most-overdue')
    expect(cedarCourt.items.map((item) => item.task)).toEqual([
      'Fire alarm inspection',
      'HVAC filter change',
      'Roof inspection',
    ])
  })

  it('leaves out a property with nothing to show', () => {
    const later = applyFilters(scheduled, { ...NO_FILTERS, status: 'later' }).visible
    expect(names('name', later)).toEqual(['Cedar Court'])
  })
})
