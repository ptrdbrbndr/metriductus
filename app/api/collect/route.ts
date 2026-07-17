import { NextRequest, NextResponse } from 'next/server'
import { DOMAINS } from '@/lib/domains'
import { resolveZoneId, fetchDailyGroups } from '@/lib/cf'
import { toTrafficRow, toCountryRows } from '@/lib/transform'
import { upsertTraffic, upsertCountries } from '@/lib/db'

export const dynamic = 'force-dynamic'

function yesterdayUTC(): string {
  const d = new Date(Date.now() - 86_400_000)
  return d.toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const day = yesterdayUTC()
  const ok: string[] = []
  const failed: { zone: string; error: string }[] = []

  for (const d of DOMAINS) {
    try {
      const zid = await resolveZoneId(d.zoneName)
      const groups = await fetchDailyGroups(zid, day)
      for (const g of groups) {
        await upsertTraffic(toTrafficRow(d.zoneName, g))
        await upsertCountries(toCountryRows(d.zoneName, g))
      }
      ok.push(d.zoneName)
    } catch (e) {
      failed.push({ zone: d.zoneName, error: (e as Error).message })
    }
  }
  return NextResponse.json({ day, ok, failed })
}
