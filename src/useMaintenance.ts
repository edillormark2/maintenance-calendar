import { useState } from 'react'
import type { IsoDate } from './lib/dates'
import { setLastCompleted } from './lib/schedule'
import type { MaintenanceItem } from './types'

/** The most recent "mark done", kept so it can be undone. */
export interface Completion {
  itemId: string
  previousDate: IsoDate
}

/**
 * Holds the maintenance items while the page is open. Marking an item done
 * only changes its last completed date; the next due date and status are
 * worked out from that date on every render, so they can't fall out of step.
 * Nothing is saved, so a refresh goes back to the CSV data (the brief allows this).
 */
export function useMaintenance(initialItems: MaintenanceItem[], today: IsoDate) {
  const [items, setItems] = useState(initialItems)
  const [lastCompletion, setLastCompletion] = useState<Completion | null>(null)

  function markDone(itemId: string) {
    const item = items.find((candidate) => candidate.id === itemId)
    // Already done today (or dated later): marking it again would move its due date backwards.
    if (!item || item.lastCompleted >= today) return
    setItems(setLastCompleted(items, itemId, today))
    setLastCompletion({ itemId, previousDate: item.lastCompleted })
  }

  function undo() {
    if (!lastCompletion) return
    setItems(setLastCompleted(items, lastCompletion.itemId, lastCompletion.previousDate))
    setLastCompletion(null)
  }

  function dismiss() {
    setLastCompletion(null)
  }

  return { items, lastCompletion, markDone, undo, dismiss }
}
