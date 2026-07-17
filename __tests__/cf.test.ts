import { describe, it, expect, vi } from 'vitest'
import { fetchDailyGroups } from '../lib/cf'

describe('fetchDailyGroups', () => {
  it('mapt de GraphQL-respons naar CfDailyGroup[]', async () => {
    const resp = { data: { viewer: { zones: [{ httpRequests1dGroups: [{
      dimensions: { date: '2026-07-16' },
      sum: { requests: 100, pageViews: 40, bytes: 5000, threats: 2,
             countryMap: [{ clientCountryName: 'NL', requests: 80 }] },
      uniq: { uniques: 30 },
    }]}]}} }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => resp }))
    const out = await fetchDailyGroups('zid', '2026-07-16')
    expect(out).toEqual([{ date: '2026-07-16', requests: 100, pageViews: 40,
      bytes: 5000, threats: 2, uniques: 30, countries: [{ country: 'NL', requests: 80 }] }])
  })

  it('gooit bij een GraphQL-error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ errors: [{ message: 'nope' }] }) }))
    await expect(fetchDailyGroups('zid', '2026-07-16')).rejects.toThrow('nope')
  })
})
