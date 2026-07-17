const OPTIONS = [
  { days: 7, label: '7d' },
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
] as const

export function PeriodSelect({ basePath, active }: { basePath: string; active: number }) {
  return (
    <div className="seg" id="period">
      {OPTIONS.map((o) => (
        <a
          key={o.days}
          href={`${basePath}?days=${o.days}`}
          className={o.days === active ? 'on' : ''}
          data-testid={`period-${o.days}`}
        >
          {o.label}
        </a>
      ))}
    </div>
  )
}
