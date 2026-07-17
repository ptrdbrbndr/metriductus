import { db } from './db'

function since(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
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
