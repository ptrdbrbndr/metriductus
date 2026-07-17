import { describe, it, expect } from 'vitest'
import { toTrafficRow, toCountryRows } from '../lib/transform'

const g = { date: '2026-07-16', requests: 100, pageViews: 40, bytes: 5000,
  threats: 2, uniques: 30, countries: [{ country: 'NL', requests: 80 }, { country: 'DE', requests: 20 }] }

describe('transform', () => {
  it('toTrafficRow', () => {
    expect(toTrafficRow('iductus.nl', g)).toEqual({
      zone_name: 'iductus.nl', day: '2026-07-16', requests: 100,
      page_views: 40, uniques: 30, bytes: 5000, threats: 2 })
  })
  it('toCountryRows', () => {
    expect(toCountryRows('iductus.nl', g)).toEqual([
      { zone_name: 'iductus.nl', day: '2026-07-16', country: 'NL', requests: 80 },
      { zone_name: 'iductus.nl', day: '2026-07-16', country: 'DE', requests: 20 }])
  })
})
