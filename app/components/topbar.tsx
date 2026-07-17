import Link from 'next/link'
import { BrandGlyph } from './brand-glyph'
import { ThemeToggle } from './theme-toggle'
import { PeriodSelect } from './period-select'

export function Topbar({
  active,
  days,
  periodBasePath,
}: {
  active: 'overzicht' | 'domeinen'
  days: number
  periodBasePath: string
}) {
  return (
    <div className="topbar">
      <Link className="brand" href="/app">
        <BrandGlyph />
        Metriductus
      </Link>
      <nav>
        <Link className={active === 'overzicht' ? 'on' : ''} href="/app">
          Overzicht
        </Link>
        <Link className={active === 'domeinen' ? 'on' : ''} href="/app">
          Domeinen
        </Link>
      </nav>
      <div className="spacer" />
      <PeriodSelect basePath={periodBasePath} active={days} />
      <ThemeToggle />
      <div className="avatar" title="Pieter de Brabander">
        PB
      </div>
    </div>
  )
}
