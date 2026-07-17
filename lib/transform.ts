import type { CfDailyGroup } from './cf'

export function toTrafficRow(zoneName: string, g: CfDailyGroup) {
  return {
    zone_name: zoneName, day: g.date, requests: g.requests,
    page_views: g.pageViews, uniques: g.uniques, bytes: g.bytes, threats: g.threats,
  }
}

export function toCountryRows(zoneName: string, g: CfDailyGroup) {
  return g.countries.map(c => ({ zone_name: zoneName, day: g.date, country: c.country, requests: c.requests }))
}
