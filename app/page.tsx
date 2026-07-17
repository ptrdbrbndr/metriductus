import Link from 'next/link'
import { BrandGlyph } from './components/brand-glyph'
import { ThemeToggle } from './components/theme-toggle'

// Marketing landing op '/' — publiek. Dashboard zit onder '/app' (achter CF Access).
// (cache-bust: forceer verse prerender van de root-route)
export default function MarketingPage() {
  return (
    <div className="mk">
      <div className="mk-nav">
        <div className="brand">
          <BrandGlyph />
          Metriductus
        </div>
        <div className="spacer" />
        <ThemeToggle />
        <Link className="btn ghost" href="/app" style={{ marginLeft: 12 }} data-testid="nav-to-dashboard">
          Naar het dashboard
        </Link>
      </div>
      <div className="mk-hero">
        <div>
          <div className="eyebrow">Traffic-inzicht · Ductus-stack XZMARKETINGXZ</div>
          <h1>Zie welke sites aandacht en klanten opleveren.</h1>
          <p>
            Eén dashboard dat de bezoekers, herkomst en koopintentie van al je domeinen samenbrengt —
            dagelijks vers uit Cloudflare, met historie die verder teruggaat dan de bron zelf bewaart.
          </p>
          <Link className="btn" href="/app" data-testid="cta-to-dashboard">
            Naar het dashboard →
          </Link>
        </div>
        <div className="preview" aria-hidden="true">
          <div className="mono-label" style={{ padding: '4px 6px 10px' }}>
            Vandaag · unieke bezoekers
          </div>
          <div className="row">
            <span>iductus.nl</span>
            <span className="tnum" style={{ fontWeight: 600 }}>1.284</span>
          </div>
          <div className="row">
            <span>naviductus.nl</span>
            <span className="tnum" style={{ fontWeight: 600 }}>742</span>
          </div>
          <div className="row">
            <span>autoductus.nl</span>
            <span className="tnum" style={{ fontWeight: 600 }}>531</span>
          </div>
          <div className="row">
            <span>aquaductus.nl</span>
            <span className="tnum" style={{ fontWeight: 600 }}>318</span>
          </div>
        </div>
      </div>
    </div>
  )
}
