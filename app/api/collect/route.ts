import { NextRequest, NextResponse } from 'next/server'
import { DOMAINS } from '@/lib/domains'
import { resolveZoneId, fetchDailyRange } from '@/lib/cf'
import { toTrafficRow, toCountryRows } from '@/lib/transform'
import { upsertTraffic, upsertCountries } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function dayUTC(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86_400_000)
  return d.toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // ?days=N backfillt de laatste N dagen (default 1 = alleen gisteren).
  const days = Math.min(Math.max(Number(new URL(req.url).searchParams.get('days') ?? 1), 1), 31)
  const from = dayUTC(days)
  const to = dayUTC(1)

  const ok: string[] = []
  const failed: { zone: string; error: string }[] = []

  for (const d of DOMAINS) {
    try {
      const zid = await resolveZoneId(d.zoneName)
      // hele range in één call (van N dagen terug t/m gisteren)
      const groups = await fetchDailyRange(zid, from, to)
      for (const g of groups) {
        await upsertTraffic(toTrafficRow(d.zoneName, g))
        await upsertCountries(toCountryRows(d.zoneName, g))
      }
      ok.push(d.zoneName)
    } catch (e) {
      failed.push({ zone: d.zoneName, error: (e as Error).message })
    }
  }
  return NextResponse.json({ range: { from, to }, days, ok, failed })
}
