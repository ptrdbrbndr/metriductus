export function AreaChart({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <div className="empty-state">Nog geen data — de eerste snapshot draait vannacht.</div>
  }
  const w = 560
  const h = 200
  const pad = 8
  const mx = Math.max(...values)
  const mn = Math.min(...values)
  const pts = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (w - 2 * pad),
    h - pad - ((v - mn) / (mx - mn || 1)) * (h - 2 * pad),
  ])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${d} L${w - pad} ${h - pad} L${pad} ${h - pad} Z`
  const last = pts[pts.length - 1]
  const grid = Array.from({ length: 4 }, (_, g) => {
    const yy = pad + (g * (h - 2 * pad)) / 3
    return <line key={g} x1={pad} y1={yy} x2={w - pad} y2={yy} stroke="var(--border)" strokeWidth="1" />
  })
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: 200 }}>
      {grid}
      <path d={area} fill="var(--accent)" opacity=".12" />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="3.2" fill="var(--accent)" />
    </svg>
  )
}
