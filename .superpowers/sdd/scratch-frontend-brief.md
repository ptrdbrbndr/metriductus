# Frontend-brief — Task 9 (dashboard-UI) + Task 12 (marketing-landing)

Bouw de volledige frontend van Metriductus in Next.js 15 (App Router, TS) door de
GOEDGEKEURDE mockup 1-op-1 naar React te vertalen.

## Ontwerpbron (leidend, exact overnemen)
`docs/design/dashboard-mockup.html` — palet, typografie, spacing, componenten,
en de thema-toggle Licht/Systeem/Donker (`data-theme`-attribuut). Neem de
CSS-tokens (`:root`, `@media (prefers-color-scheme:dark)`,
`:root[data-theme="dark"]`, `:root[data-theme="light"]`) letterlijk over in
`app/globals.css`. Verwijder de view-switcher (die was alleen voor de mockup).

## Routestructuur (belangrijk i.v.m. CF Access)
- `/`  → **publieke marketing-landing** (hero + CTA "Naar het dashboard" → `/app`). Buiten CF Access.
- `/app` → **dashboard-overzicht** (achter CF Access, path-based; niet in-app afdwingen).
- `/app/d/[zone]` → **domein-detail**.

## Data (server components, uit Supabase)
Gebruik de bestaande queries in `lib/queries.ts`:
- `getOverview(days: number)` → `{ zoneName, label, uniques, requests, topCountry }[]`
- `getDomainDetail(zoneName, days)` → `{ series:{day,uniques}[], countries:{country,requests}[] }`

Er is nu NOG GEEN Supabase-verbinding (env ontbreekt). Daarom:
- Markeer de dashboard-pagina's `export const dynamic = 'force-dynamic'` zodat
  `next build` ze NIET probeert te prerenderen.
- Wikkel de query-calls in try/catch en render een nette **lege staat**
  ("Nog geen data — de eerste snapshot draait vannacht") als de query faalt of
  leeg is. `next build` MOET slagen zonder env.

## Componenten (overnemen uit mockup)
- Root `app/layout.tsx` met `<html lang="nl">`, import globals.css, en een klein
  inline script in `<head>` dat vóór paint `data-theme` uit localStorage zet
  (voorkom flikkering).
- Thema-toggle als client-component (Licht/Systeem/Donker), in de dashboard-topbar
  en op de marketing-nav. Onthoud keuze in localStorage onder `metriductus-theme`.
- Overzicht: KPI-tegels (unieke bezoekers, requests, conversiepagina-bezoek, mens%) —
  voor conversiepagina-bezoek/mens% is nog geen databron; toon die twee tegels met
  een "—"/placeholder en een `title` dat het fase-2 is. Uniques+requests wél echt uit getOverview.
- Sorteerbare domeinen-tabel met inline **sparkline** (SVG, zoals mockup),
  status-stip, top-land. Rij klikt door naar `/app/d/[zone]`.
- Detail: area-chart (Recharts LineChart of inline SVG — mockup gebruikt SVG,
  Recharts mag ook), herkomst-balken, top-paden-lijst (top-paden databron
  ontbreekt nog → lege staat).
- Periodekiezer 7/30/90 dagen via `?days=` query-param (server-side lezen).

## Constraints (bindend)
- TS strict; interactieve elementen `data-testid`.
- Fonts: gebruik system-stack met dezelfde rollen als de mockup (ui-serif voor
  cijfers/koppen, system-sans voor UI). Geen externe font-CDN.
- Theme-tokens via CSS custom properties; style componenten via de tokens, niet
  direct in de media-query.
- `next build` moet groen zijn en `npx tsc --noEmit` schoon.

## Afronden
- Commit met duidelijke messages (splits gerust Task 9 en Task 12).
- Schrijf verslag naar `.superpowers/sdd/frontend-report.md` (bestanden, build-
  resultaat, tsc-resultaat, afwijkingen/zorgen).
