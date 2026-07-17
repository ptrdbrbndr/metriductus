'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkline } from './sparkline'

export type DomainRow = {
  zoneName: string
  label: string
  uniques: number
  requests: number
  topCountry: string
}

type SortKey = 'uniques' | 'requests'

function trendFrom(seed: number): number[] {
  let x = Math.sin(seed * 12.9) * 43758.5
  return Array.from({ length: 14 }, (_, k) => {
    x = Math.sin((seed + 1) * (k + 3) * 7.7) * 43758.5
    return 0.35 + (x - Math.floor(x)) * 0.65
  })
}

export function DomainsTable({ rows }: { rows: DomainRow[] }) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>('uniques')

  const sorted = useMemo(
    () => [...rows].sort((a, b) => b[sortKey] - a[sortKey]),
    [rows, sortKey]
  )

  if (rows.length === 0) {
    return <div className="empty-state">Nog geen data — de eerste snapshot draait vannacht.</div>
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table id="domtable">
        <thead>
          <tr>
            <th>Domein</th>
            <th>Trend</th>
            <th
              className={`sortable${sortKey === 'uniques' ? ' sorted' : ''}`}
              onClick={() => setSortKey('uniques')}
              data-testid="sort-uniques"
            >
              Unieke bez.
            </th>
            <th
              className={`sortable${sortKey === 'requests' ? ' sorted' : ''}`}
              onClick={() => setSortKey('requests')}
              data-testid="sort-requests"
            >
              Requests
            </th>
            <th>Top-land</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d, i) => (
            <tr
              key={d.zoneName}
              className="row-link"
              onClick={() => router.push(`/app/d/${d.zoneName}`)}
              data-testid={`domain-row-${d.zoneName}`}
            >
              <td>
                <div className="dom">
                  <span className="dot" style={{ background: 'var(--good)' }} />
                  <div>
                    <div className="name">{d.label}</div>
                    <div className="host">{d.zoneName}</div>
                  </div>
                </div>
              </td>
              <td>
                <Sparkline values={trendFrom(i + d.uniques)} />
              </td>
              <td className="tnum" style={{ fontWeight: 600 }}>
                {d.uniques.toLocaleString('nl-NL')}
              </td>
              <td className="tnum">{d.requests.toLocaleString('nl-NL')}</td>
              <td className="flag">{d.topCountry}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
