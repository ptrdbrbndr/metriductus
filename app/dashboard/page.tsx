import { Topbar } from '../components/topbar'
import { DomainsTable, type DomainRow } from '../components/domains-table'

export const dynamic = 'force-dynamic'

function parseDays(value: string | undefined): number {
  const n = Number(value)
  return n === 7 || n === 30 || n === 90 ? n : 7
}

async function loadOverview(days: number): Promise<DomainRow[]> {
  try {
    const { getOverview } = await import('@/lib/queries')
    const rows = await getOverview(days)
    return rows
  } catch {
    return []
  }
}

async function loadBeacon(days: number) {
  try {
    const { getBeaconOverview } = await import('@/lib/queries')
    return await getBeaconOverview(days)
  } catch {
    return { leads: 0, convPageviews: 0, beaconPageviews: 0, hasBeacon: false }
  }
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const params = await searchParams
  const days = parseDays(params.days)
  const rows = await loadOverview(days)
  const beacon = await loadBeacon(days)

  const totalUniques = rows.reduce((s, r) => s + r.uniques, 0)
  const totalRequests = rows.reduce((s, r) => s + r.requests, 0)

  return (
    <section>
      <Topbar active="overzicht" days={days} periodBasePath="/dashboard" />
      <div className="wrap">
        <div className="page-head">
          <div>
            <h1>Overzicht</h1>
            <p>
              {rows.length} business-domeinen · laatste {days} dagen
            </p>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi accent">
            <div className="mono-label">Unieke bezoekers</div>
            <div className="val tnum">{totalUniques.toLocaleString('nl-NL')}</div>
          </div>
          <div className="kpi">
            <div className="mono-label">Requests</div>
            <div className="val tnum">{totalRequests.toLocaleString('nl-NL')}</div>
          </div>
          <div className="kpi" title="Bezoeken aan conversiepagina's (bijv. /contact, /offerte) via de lead-beacon">
            <div className="mono-label">Conversiepagina-bezoek</div>
            <div className="val tnum">{beacon.hasBeacon ? beacon.convPageviews.toLocaleString('nl-NL') : '—'}</div>
          </div>
          <div className="kpi accent" title="Formulier-verzendingen (echte leads) via de lead-beacon">
            <div className="mono-label">Leads</div>
            <div className="val tnum">{beacon.hasBeacon ? beacon.leads.toLocaleString('nl-NL') : '—'}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Domeinen</h2>
            <span className="mono-label">klik op een kolom om te sorteren</span>
          </div>
          <DomainsTable rows={rows} />
        </div>
      </div>
    </section>
  )
}
