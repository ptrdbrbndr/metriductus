export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <svg className="spark" width={92} height={26} viewBox="0 0 92 26" />
  const w = 92
  const h = 26
  const mx = Math.max(...values)
  const mn = Math.min(...values)
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - 2 - ((v - mn) / (mx - mn || 1)) * (h - 4),
  ])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${d} L${w} ${h} L0 ${h} Z`
  const last = pts[pts.length - 1]
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={area} fill="var(--accent)" opacity=".1" />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="2.1" fill="var(--accent)" />
    </svg>
  )
}
