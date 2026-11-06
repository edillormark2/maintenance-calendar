import type { IsoDate } from './lib/dates'

/** A row of sample_properties.csv. */
export interface Property {
  id: string
  name: string
  city: string
  state: string
}

/** A row of sample_maintenance_items.csv. */
export interface MaintenanceItem {
  id: string
  propertyId: string
  task: string
  category: string
  /** The task repeats every this many months. */
  frequencyMonths: number
  lastCompleted: IsoDate
}
