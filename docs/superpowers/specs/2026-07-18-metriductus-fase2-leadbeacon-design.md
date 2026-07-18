# Metriductus Fase 2 — Lead-beacon (design)

**Datum:** 2026-07-18
**Status:** goedgekeurd, in uitvoering

## Doel

Koopintentie/conversies echt meten — wat Cloudflare's gratis plan niet kan
(pad-niveau, formulier-verzendingen, mens-vs-bot). Een lichte client-side
beacon op de verkoop-sites stuurt cookieloze, anonieme events naar Metriductus.

## Scope fase 2

**In scope — 3 verkoop-sites (deploybaar uit c:\Projecten):**
`naviductus.nl` · `aquaductus.nl` · `autoductus.nl`

**Event-types:** allebei — `pageview` (elk paginabezoek) én `lead` (formulier
verzonden op een conversiepagina).

**Later:** overige domeinen zodra de waarde bewezen is / toegang geregeld
(o.a. iductus.nl, congressionals.nl).

## Privacy (AVG)

- **Cookieloos, geen persoonsgegevens.** Opgeslagen: domein, pad, event_type,
  timestamp, verwijzer-host. **Geen IP, geen e-mail, geen fingerprint.**
- Vergelijkbaar met Plausible/CF Web Analytics → **geen cookiebanner nodig**.
- Het `/api/beacon`-endpoint ziet wel het IP in de request maar slaat het
  **niet** op.

## Architectuur

```
[naviductus / aquaductus / autoductus]
   beacon.js (klein snippet in de site-layout)
     • paginabezoek        → POST /api/beacon {domain, path, type:"pageview"}
     • formulier verzonden → POST /api/beacon {domain, path, type:"lead"}
          │  cross-origin, geen PII
          ▼
[metriductus] POST /api/beacon  (publiek, domein-whitelist, geen IP opgeslagen)
     → insert in Supabase-tabel lead_events
          ▼
[dashboard] conversie-KPI's + leads-trend uit lead_events
```

### Componenten

1. **Beacon-snippet** (`public/beacon.js` op metriductus, of inline component
   per site) — minimale JS:
   - bij load: `navigator.sendBeacon('/api/beacon', {domain, path, type:'pageview'})`
   - helper `metriductusLead()` die conversie-formulieren bij submit aanroepen
     met `type:'lead'`.
   - Fire-and-forget, geen invloed op de site-performance.

2. **`POST /api/beacon`** (metriductus, publiek, `runtime nodejs`):
   - CORS: sta de 3 origins toe (of `*` met domein-validatie).
   - Valideer `domain` tegen de whitelist (de 3 zones); onbekend → 204 negeren.
   - Valideer `type ∈ {pageview, lead}`, `path` sane (max lengte, begint met `/`).
   - `event_type='lead'` alleen tellen als `path` een conversiepad is (of altijd
     opslaan en in dashboard filteren).
   - Insert in `lead_events`. Retour 204 (No Content), snel.
   - **Geen IP opslaan.** Basale anti-ruis: origin/referer-host moet matchen met
     `domain`.

3. **Schema** (`supabase/migrations/0002_lead_events.sql`):
   ```sql
   create table if not exists lead_events (
     id          bigserial primary key,
     zone_name   text not null,
     ts          timestamptz not null default now(),
     day         date not null default (now() at time zone 'utc')::date,
     path        text not null,
     event_type  text not null check (event_type in ('pageview','lead')),
     referrer_host text
   );
   create index if not exists lead_events_zone_day on lead_events(zone_name, day);
   ```

4. **Dashboard-integratie** (`lib/queries.ts` + pagina's):
   - Overzicht-tegel **Conversiepagina-bezoek** → count pageviews op
     conversiepaden per zone (uit lead_events).
   - Nieuwe tegel/kolom **Leads** → count `event_type='lead'`.
   - Tegel **Mens%** → beacon-pageviews (mensen) ÷ CF-requests (totaal).
   - Detail: top-conversiepagina's + leads-trend uit lead_events.
   - Domeinen zónder beacon tonen `—` (geen valse nul).

## Foutafhandeling & performance

- Beacon faalt stil (sendBeacon, geen await, geen UI-impact).
- Endpoint: ongeldige payload → 204 (nooit 500 naar de client).
- Rate: acceptabele ruis; geen zware rate-limiter in MVP (domein-whitelist +
  origin-check volstaat). Escaleren als er misbruik komt.

## Testen

- Unit: payload-validatie (whitelist, type, path) → rij of drop.
- Integratie: POST /api/beacon met geldige/ongeldige payload; rij in lead_events.
- Dashboard: KPI's kloppen met seed-events; domein zonder events toont `—`.

## Beslist

- Scope: naviductus.nl, aquaductus.nl, autoductus.nl; beide event-types.
- Cookieloos, geen PII, geen consent-banner.
- Beacon meet mensen (JS) → vult mens%-tegel gratis (geen betaald CF-plan).
- Nieuwe `lead_events`-tabel in dezelfde Supabase.

## Open (voor plan/uitvoering)

- Exacte conversiepaden per site (afhankelijk van elke site-structuur).
- Precieze plek van het snippet per site (layout-component).
- Hoe de bestaande contactformulieren de `lead`-helper aanroepen (per site kijken).
