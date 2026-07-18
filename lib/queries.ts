import { db } from './db'
import { BEACON_ZONES } from './domains'

function since(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
}

// Fase 2: beacon-aggregaten voor het overzicht (conversiepagina-bezoek + leads).
export async function getBeaconOverview(days: number) {
  const from = since(days)
  const { data: doms } = await db.from('domains').select('zone_name,conversion_paths')
  const convPaths = new Map<string, Set<string>>()
  for (const d of doms ?? []) convPaths.set(d.zone_name, new Set(d.conversion_paths ?? []))

  const { data: events } = await db.from('lead_events')
    .select('zone_name,path,event_type').gte('day', from)

  let leads = 0, convPageviews = 0, beaconPageviews = 0
  for (const e of events ?? []) {
    if (e.event_type === 'lead') leads++
    else {
      beaconPageviews++
      if (convPaths.get(e.zone_name)?.has(e.path)) convPageviews++
    }
  }
  return { leads, convPageviews, beaconPageviews, hasBeacon: (events ?? []).length > 0 }
}

// Fase 2: beacon-detail per domein.
export async function getDomainBeacon(zoneName: string, days: number) {
  const from = since(days)
  const { data: dom } = await db.from('domains').select('conversion_paths').eq('zone_name', zoneName).single()
  const conv = new Set<string>(dom?.conversion_paths ?? [])

  const { data: events } = await db.from('lead_events')
    .select('path,event_type,day').eq('zone_name', zoneName).gte('day', from)

  let pageviews = 0, convPageviews = 0, leads = 0
  const byPath = new Map<string, number>()
  const leadByDay = new Map<string, number>()
  for (const e of events ?? []) {
    if (e.event_type === 'lead') {
      leads++
      leadByDay.set(e.day, (leadByDay.get(e.day) ?? 0) + 1)
    } else {
      pageviews++
      byPath.set(e.path, (byPath.get(e.path) ?? 0) + 1)
      if (conv.has(e.path)) convPageviews++
    }
  }
  const topPaths = [...byPath.entries()]
    .map(([path, count]) => ({ path, count, isConversion: conv.has(path) }))
    .sort((a, b) => b.count - a.count).slice(0, 8)
  const leadSeries = [...leadByDay.entries()].map(([day, count]) => ({ day, count })).sort((a, b) => a.day.localeCompare(b.day))

  return { hasBeacon: BEACON_ZONES.includes(zoneName), pageviews, convPageviews, leads, topPaths, leadSeries }
}

export async function getOverview(days: number) {
  const from = since(days)
  const { data: doms } = await db.from('domains').select('zone_name,label').eq('is_business', true)
  const { data: traffic } = await db.from('daily_traffic').select('zone_name,uniques,requests').gte('day', from)
  const { data: countries } = await db.from('daily_country').select('zone_name,country,requests').gte('day', from)

  return (doms ?? []).map(d => {
    const t = (traffic ?? []).filter(r => r.zone_name === d.zone_name)
    const c = (countries ?? []).filter(r => r.zone_name === d.zone_name)
    const byCountry = new Map<string, number>()
    for (const r of c) byCountry.set(r.country, (byCountry.get(r.country) ?? 0) + Number(r.requests))
    const topCountry = [...byCountry.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    return {
      zoneName: d.zone_name, label: d.label,
      uniques: t.reduce((s, r) => s + Number(r.uniques), 0),
      requests: t.reduce((s, r) => s + Number(r.requests), 0),
      topCountry,
    }
  }).sort((a, b) => b.uniques - a.uniques)
}

export async function getDomainDetail(zoneName: string, days: number) {
  const from = since(days)
  const { data: series } = await db.from('daily_traffic')
    .select('day,uniques').eq('zone_name', zoneName).gte('day', from).order('day')
  const { data: rawC } = await db.from('daily_country')
    .select('country,requests').eq('zone_name', zoneName).gte('day', from)
  const byCountry = new Map<string, number>()
  for (const r of rawC ?? []) byCountry.set(r.country, (byCountry.get(r.country) ?? 0) + Number(r.requests))
  return {
    series: (series ?? []).map(r => ({ day: r.day, uniques: Number(r.uniques) })),
    countries: [...byCountry.entries()].map(([country, requests]) => ({ country, requests }))
      .sort((a, b) => b.requests - a.requests).slice(0, 10),
  }
}
