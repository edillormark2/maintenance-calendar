import { describe, expect, it } from 'vitest'
import { getToday } from './today'

describe('getToday', () => {
  const now = new Date(2026, 10, 7, 9, 30)

  it("uses the device's date", () => {
    expect(getToday('', now)).toEqual({ date: '2026-11-07', fromAddressBar: false })
  })

  it('takes another date from the address bar, and ignores one that is not a date', () => {
    expect(getToday('?today=2027-01-31', now)).toEqual({ date: '2027-01-31', fromAddressBar: true })
    expect(getToday('?today=tomorrow', now)).toEqual({ date: '2026-11-07', fromAddressBar: false })
  })
})
