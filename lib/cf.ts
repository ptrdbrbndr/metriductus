const API = 'https://api.cloudflare.com/client/v4'
const token = () => process.env.CF_ANALYTICS_TOKEN!

export type CfDailyGroup = {
  date: string; requests: number; pageViews: number; bytes: number
  threats: number; uniques: number; countries: { country: string; requests: number }[]
}

export async function resolveZoneId(zoneName: string): Promise<string> {
  const r = await fetch(`${API}/zones?name=${zoneName}`, {
    headers: { Authorization: `Bearer ${token()}` },
  }).then(x => x.json())
  const id = r.result?.[0]?.id
  if (!id) throw new Error(`zone niet gevonden: ${zoneName}`)
  return id
}

export async function fetchDailyGroups(zoneId: string, day: string): Promise<CfDailyGroup[]> {
  return fetchDailyRange(zoneId, day, day)
}

export async function fetchDailyRange(zoneId: string, fromDay: string, toDay: string): Promise<CfDailyGroup[]> {
  const query = `query{viewer{zones(filter:{zoneTag:"${zoneId}"}){httpRequests1dGroups(limit:31,filter:{date_geq:"${fromDay}",date_leq:"${toDay}"},orderBy:[date_ASC]){dimensions{date}sum{requests pageViews bytes threats countryMap{clientCountryName requests}}uniq{uniques}}}}}`
  const r = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  }).then(x => x.json())
  if (r.errors) throw new Error(r.errors[0].message)
  const groups = r.data?.viewer?.zones?.[0]?.httpRequests1dGroups ?? []
  return groups.map((g: any) => ({
    date: g.dimensions.date,
    requests: g.sum.requests, pageViews: g.sum.pageViews,
    bytes: g.sum.bytes, threats: g.sum.threats,
    uniques: g.uniq.uniques,
    countries: (g.sum.countryMap ?? []).map((c: any) => ({ country: c.clientCountryName, requests: c.requests })),
  }))
}
