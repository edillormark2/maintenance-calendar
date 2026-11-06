import type { Property } from '../types'
import { byDueDate, type ScheduledItem, type Status } from './schedule'

/** What the toolbar narrows the list down to. null means no filter. */
export interface Filters {
  propertyId: string | null
  category: string | null
  status: Status | null
}

export const NO_FILTERS: Filters = { propertyId: null, category: null, status: null }

/** The order of the properties. Each property's own items are always most overdue first. */
export type PropertySort = 'most-overdue' | 'name'

export type StatusCounts = Record<Status, number>

export function hasFilters(filters: Filters): boolean {
  return filters.propertyId !== null || filters.category !== null || filters.status !== null
}

export function countByStatus(items: ScheduledItem[]): StatusCounts {
  const counts: StatusCounts = { overdue: 0, 'due-soon': 0, later: 0 }
  for (const item of items) counts[item.status] += 1
  return counts
}

/**
 * Applies the filters. The status counts are taken after the property and
 * category filters but before the status one, so each status button shows
 * how many items choosing it would list.
 */
export function applyFilters(items: ScheduledItem[], filters: Filters) {
  const inScope = items.filter(
    (item) =>
      (filters.propertyId === null || item.propertyId === filters.propertyId) &&
      (filters.category === null || item.category === filters.category),
  )
  return {
    counts: countByStatus(inScope),
    visible: inScope.filter((item) => filters.status === null || item.status === filters.status),
  }
}

export interface PropertyGroup {
  property: Property
  items: ScheduledItem[]
}

/**
 * Groups the items by property, each property's items most overdue first. The
 * properties come most overdue first as well, or A to Z by name. A property
 * with nothing to show is left out.
 */
export function groupByProperty(
  properties: Property[],
  items: ScheduledItem[],
  sort: PropertySort,
): PropertyGroup[] {
  const groups = properties
    .map((property) => ({
      property,
      items: items.filter((item) => item.propertyId === property.id).sort(byDueDate),
    }))
    .filter((group) => group.items.length > 0)

  const byName = (a: PropertyGroup, b: PropertyGroup) => a.property.name.localeCompare(b.property.name)
  // Each group's first item is its most overdue, so comparing those orders the properties.
  const byMostOverdue = (a: PropertyGroup, b: PropertyGroup) =>
    a.items[0].daysUntilDue - b.items[0].daysUntilDue || byName(a, b)

  return groups.sort(sort === 'most-overdue' ? byMostOverdue : byName)
}
