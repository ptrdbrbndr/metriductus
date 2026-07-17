# Frontend-report — Task 9 (dashboard-UI) + Task 12 (marketing-landing)

## Status
DONE

## Commits
- `7511b28` — fix: maak build/tsc groen zonder Supabase-env
- `9858091` — feat(dashboard): bouw Overzicht- en domein-detailpagina's (Task 9)
- `10a2501` — feat(marketing): publieke landingspagina op / (Task 12)

## Bestanden
- `app/globals.css` — alle CSS-tokens + componentstijlen 1-op-1 uit `docs/design/dashboard-mockup.html`, view-switcher weggelaten.
- `app/layout.tsx` — root-layout, `<html lang="nl">`, inline anti-flicker theme-script (leest `metriductus-theme` uit localStorage vóór paint).
- `app/page.tsx` — publieke marketing-landing op `/` (hero, preview-kaart, CTA → `/app`, thema-toggle).
- `app/app/page.tsx` — dashboard-overzicht op `/app`: KPI-tegels (uniques/requests echt uit `getOverview`, conversie/mens% als fase-2 placeholder met `title`), sorteerbare domeinentabel, periodekiezer via `?days=`.
- `app/app/d/[zone]/page.tsx` — domein-detail op `/app/d/[zone]`: area-chart (inline SVG), herkomstbalken, top-pagina's als lege staat (databron ontbreekt nog).
- `app/components/*` — `theme-toggle.tsx` (client, Licht/Systeem/Donker), `topbar.tsx`, `period-select.tsx`, `domains-table.tsx` (client, sorteerbaar op uniques/requests, rij klikt door), `sparkline.tsx`, `area-chart.tsx`, `brand-glyph.tsx`.
- `lib/db.ts` — Supabase-client nu lazy (Proxy) i.p.v. bij module-load aangemaakt; anders crashte `next build` op `/api/collect` tijdens "Collecting page data" (die route wordt ook zonder aanroep geïmporteerd).
- `next.config.ts` → `next.config.mjs` — TypeScript 7.0.2 (pre-existing devDependency) brak Next's config-loader (`jiti`); config omgezet naar plain JS. Ook `outputFileTracingRoot` (meerdere lockfiles in de Ductus-monorepo-boom) en een webpack `resolve.alias['@']` (de `@/*`-paths uit tsconfig werden door Next's webpack-bundelaar niet zelf opgepikt).
- `tsconfig.json` — `baseUrl` toegevoegd; Next's eigen typecheck-stap herkende TypeScript 7.0.2 niet ("Invalid Version") en heeft die tijdens de build zelf vervangen door `5.8.2` in `package.json`/`package-lock.json` (auto-install door Next, geen handmatige downgrade).

## Build- en tsc-resultaat
`npm run build` → groen (5 routes: `/`, `/app`, `/app/d/[zone]` dynamic, `/api/collect` dynamic, `/_not-found` static). `npx tsc --noEmit` → schoon, geen output. `npm test` (vitest) → 2 files / 4 tests, alle groen.

Smoke-test met `next start` zonder Supabase-env: `/`, `/app`, `/app/d/iductus.nl` geven alle HTTP 200 en tonen de nette lege staat "Nog geen data — de eerste snapshot draait vannacht."

## Afwijkingen / zorgen
- Geen login-scherm gebouwd — de brief noemt alleen `/`, `/app`, `/app/d/[zone]`; CF Access regelt auth op path-niveau buiten de app, dus dat is bewust overgeslagen (de mockup's login-view is niet vertaald).
- De sorteerbare tabel sorteert client-side (uniques/requests); er is geen server-side `?sort=`-param, want de brief specificeert alleen `?days=` als querystate.
- `lib/db.ts` en `next.config.ts`/`tsconfig.json` zijn buiten de strikte scope van de brief aangepast — noodzakelijk omdat "next build MOET slagen zonder env" anders niet haalbaar was (module-load crash resp. TypeScript 7-incompatibiliteit met Next's config-/typecheck-tooling). Zie git-diff voor de precieze wijzigingen.
- `package.json`/`package-lock.json` zijn gewijzigd doordat Next's build zelf `typescript` van `^7.0.2` naar `5.8.2` heeft vervangen (auto-install-stap, niet door mij geïnitieerd maar wel gecommit omdat de build anders niet reproduceerbaar groen is).
