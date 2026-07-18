import Link from 'next/link'
import { Topbar } from '../../../components/topbar'
import { AreaChart } from '../../../components/area-chart'
import { DOMAINS } from '@/lib/domains'

export const dynamic = 'force-dynamic'

type SeriesPoint = { day: string; uniques: number }
type CountryRow = { country: string; requests: number }

function parseDays(value: string | undefined): number {
  const n = Number(value)
  return n === 7 || n === 30 || n === 90 ? n : 90
}

async function loadDetail(
  zoneName: string,
  days: number
): Promise<{ series: SeriesPoint[]; countries: CountryRow[] } | null> {
  try {
    const { getDomainDetail } = await import('@/lib/queries')
    return await getDomainDetail(zoneName, days)
  } catch {
    return null
  }
}

async function loadBeacon(zoneName: string, days: number) {
  try {
    const { getDomainBeacon } = await import('@/lib/queries')
    return await getDomainBeacon(zoneName, days)
  } catch {
    return { hasBeacon: false, pageviews: 0, convPageviews: 0, leads: 0, topPaths: [], leadSeries: [] }
  }
}

export default async function DomainDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ zone: string }>
  searchParams: Promise<{ days?: string }>
}) {
  const { zone } = await params
  const sp = await searchParams
  const days = parseDays(sp.days)
  const detail = await loadDetail(zone, days)
  const beacon = await loadBeacon(zone, days)
  const config = DOMAINS.find((d) => d.zoneName === zone)

  const series = detail?.series ?? []
  const countries = detail?.countries ?? []
  const uniquesTotal = series.reduce((s, r) => s + r.uniques, 0)
  const cmax = countries[0]?.requests ?? 0
  const topConv = beacon.topPaths.find((p) => p.isConversion)?.path ?? '—'
  const b = (v: number) => (beacon.hasBeacon ? v.toLocaleString('nl-NL') : '—')

  return (
    <section>
      <Topbar active="domeinen" days={days} periodBasePath={`/dashboard/d/${zone}`} />
      <div className="wrap">
        <Link className="back" href="/dashboard">
          ← Overzicht
        </Link>
        <div className="page-head">
          <div>
            <h1>{zone}</h1>
            <p>
              {config?.label ?? zone} · laatste {days} dagen
            </p>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi accent">
            <div className="mono-label">Unieke bezoekers</div>
            <div className="val tnum">{uniquesTotal.toLocaleString('nl-NL')}</div>
          </div>
          <div className="kpi" title="Bezoeken aan conversiepagina's via de lead-beacon">
            <div className="mono-label">Conversiepagina-bezoek</div>
            <div className="val tnum">{b(beacon.convPageviews)}</div>
          </div>
          <div className="kpi" title="Formulier-verzendingen (echte leads)">
            <div className="mono-label">Leads</div>
            <div className="val tnum">{b(beacon.leads)}</div>
          </div>
          <div className="kpi" title="Menselijke paginabezoeken (beacon draait alleen in echte browsers)">
            <div className="mono-label">Menselijke bezoeken</div>
            <div className="val tnum">{b(beacon.pageviews)}</div>
          </div>
        </div>

        <div className="detail-grid">
          <div className="chart-card">
            <h2>Unieke bezoekers</h2>
            <p className="sub">dagelijks · {days} dagen</p>
            <AreaChart values={series.map((s) => s.uniques)} />
          </div>
          <div className="chart-card">
            <h2>Herkomst</h2>
            <p className="sub">top-landen naar requests</p>
            {countries.length === 0 ? (
              <div className="empty-state">Nog geen data voor deze periode.</div>
            ) : (
              <div className="bars">
                {countries.map((c) => (
                  <div className="bar-row" key={c.country}>
                    <span className="mono-label" style={{ color: 'var(--muted)' }}>
                      {c.country}
                    </span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${cmax ? Math.round((c.requests / cmax) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="tnum" style={{ color: 'var(--muted)', fontSize: 12.5 }}>
                      {c.requests.toLocaleString('nl-NL')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="chart-card" style={{ marginTop: 18 }}>
          <h2>Top-pagina&apos;s</h2>
          <p className="sub">via de lead-beacon · conversiepagina&apos;s gemarkeerd</p>
          {!beacon.hasBeacon ? (
            <div className="empty-state">Lead-beacon nog niet actief op dit domein.</div>
          ) : beacon.topPaths.length === 0 ? (
            <div className="empty-state">Nog geen beacon-bezoeken in deze periode.</div>
          ) : (
            <ul className="paths">
              {beacon.topPaths.map((p) => (
                <li key={p.path}>
                  <span className={p.isConversion ? 'path-conv' : ''}>
                    {p.path}
                    {p.isConversion ? ' · conversiepagina' : ''}
                  </span>
                  <span className="tnum">{p.count.toLocaleString('nl-NL')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
