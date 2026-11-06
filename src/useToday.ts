import { useEffect, useState } from 'react'
import { toIsoDate } from './lib/dates'
import type { Today } from './lib/today'

/**
 * The date the schedule counts from. It's checked again whenever the tab comes
 * back into view, so a page left open overnight doesn't keep yesterday's
 * statuses or stamp yesterday's date on a task marked done.
 */
export function useToday(onLoad: Today): Today {
  const [today, setToday] = useState(onLoad)

  useEffect(() => {
    // A date chosen with ?today= stays put.
    if (onLoad.fromAddressBar) return

    function checkDate() {
      if (document.visibilityState !== 'visible') return
      const date = toIsoDate(new Date())
      setToday((current) => (current.date === date ? current : { date, fromAddressBar: false }))
    }
    document.addEventListener('visibilitychange', checkDate)
    return () => document.removeEventListener('visibilitychange', checkDate)
  }, [onLoad.fromAddressBar])

  return today
}
