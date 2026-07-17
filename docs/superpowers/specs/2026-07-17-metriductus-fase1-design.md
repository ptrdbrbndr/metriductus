# Metriductus — Design fase 1 (traffic-dashboard)

**Datum:** 2026-07-17
**Status:** ontwerp, wacht op review
**Aanpak:** B gefaseerd (CF-first) — zie "Fasering"

## Doel

Eén dashboard dat traffic van de business/prospect-facing domeinen uit de
Ductus-stack verzamelt, met een CRM-invalshoek: niet "hoeveel bezoekers" maar
"welke sites leveren aandacht en koopintentie op". Fase 1 levert het
traffic-overzicht; latere fases voegen echte lead-signalen toe.

## Scope fase 1

### In scope — 12 domeinen (allemaal op Cloudflare)

`iductus.nl` · `naviductus.nl` · `autoductus.nl` · `congressionals.nl` ·
`aquaductus.nl` · `vitaductus.nl` · `liefdevolleblik.nl` · `debrabander.com` ·
`veriductus.nl` · `conductus.nl` · `dataductus.nl` · `datamanagement.nl`

### Expliciet buiten scope (later)

- **businessanalyse.nl** — draait op Vercel (NS `ns1/2.vercel-dns.com`).
- **businessanalist.nl** — DNS bij mijn.host; hosting nog te verifiëren.
- **retroductus.nl** — bestaat niet als zone (wel `retroductor.nl`); nog te registreren.
- Non-CF-sites worden later naar Cloudflare gemigreerd en vallen dan vanzelf
  in het dashboard. Geen Vercel-/mijn.host-adapter bouwen — de fase-2-beacon
  maakt hosting toch irrelevant.

### Niet in fase 1

- Lead-beacon / formulier-events (= fase 2).
- Koppeling met Twenty-CRM (= fase 3).

## Fasering

- **Fase 1 (deze spec):** CF-aggregatiedashboard voor de 12 domeinen. Nul
  instrumentatie op de sites zelf.
- **Fase 2:** lichte lead-beacon op de verkoop-relevante sites (formulier
  verzonden → event in dezelfde Supabase). Werkt ongeacht hosting.
- **Fase 3 (optioneel):** correlatie met Twenty-CRM.

## Architectuur

```
Cloudflare GraphQL Analytics API
        │  dagelijkse snapshot per zone (cron)
        ▼
  Supabase (self-host, Beelink)  ──►  history-tabellen
        │                              (CF-free bewaart ~30 dagen; wij bouwen historie op)
        ▼
  Next.js dashboard (Coolify, achter CF Access)
```

### Componenten

1. **Snapshot-collector** (cron, dagelijks)
   - Doel: per zone de traffic van de vorige dag ophalen bij CF GraphQL en
     wegschrijven naar Supabase.
   - Input: lijst van 12 zone-namen + `CLOUDFLARE_API_TOKEN` (Zone:Read +
     Analytics). Zone-ID's worden bij eerste run opgezocht en gecachet.
   - Output: rijen in `daily_traffic`, `daily_country`, `daily_path`.
   - Idempotent: draait het per (zone, datum) als upsert, zodat herdraaien
     geen dubbele rijen geeft.
   - Faalt per-zone geïsoleerd: één falende zone stopt de rest niet; fouten
     worden gelogd, niet stil geslikt.

2. **Supabase-schema** (zie Dataschema)
   - Bron van waarheid voor historie. Fase 2 (beacon) schrijft later in
     dezelfde database (aparte tabel `lead_events`).

3. **Next.js dashboard** (Coolify)
   - Server-side query op Supabase (geen live CF-call bij pageload).
   - Overzichtspagina: sorteerbare tabel met alle 12 domeinen.
   - Detailpagina per domein: trendgrafiek + top-landen + top-paden +
     conversiepagina-signaal.
   - Achter CF Access (interne tool), net als andere Ductus-tools.

## Dataschema (Supabase / Postgres)

```sql
-- Configuratie van de te monitoren domeinen
create table domains (
  id            uuid primary key default gen_random_uuid(),
  zone_name     text not null unique,          -- 'iductus.nl'
  cf_zone_id    text,                           -- gecachet na eerste lookup
  label         text,                           -- 'Inductus'
  is_business   boolean not null default true,
  conversion_paths text[] default '{}',         -- ['/contact','/offerte']
  created_at    timestamptz default now()
);

-- Dagelijkse traffic per domein
create table daily_traffic (
  zone_name     text not null,
  day           date not null,
  requests      bigint not null default 0,
  page_views    bigint not null default 0,
  uniques       bigint not null default 0,      -- unieke bezoekers
  bytes         bigint not null default 0,
  threats       bigint not null default 0,
  bot_requests  bigint not null default 0,      -- t.b.v. bot% vs mens
  primary key (zone_name, day)
);

-- Dagelijkse top-landen per domein
create table daily_country (
  zone_name     text not null,
  day           date not null,
  country       text not null,                  -- ISO-2, 'NL'
  requests      bigint not null default 0,
  uniques       bigint not null default 0,
  primary key (zone_name, day, country)
);

-- Dagelijkse top-paden per domein (incl. markering conversiepagina)
create table daily_path (
  zone_name       text not null,
  day             date not null,
  path            text not null,
  page_views      bigint not null default 0,
  is_conversion   boolean not null default false, -- match op domains.conversion_paths
  primary key (zone_name, day, path)
);
```

Opmerkingen:
- `uniques` en land/pad-detail komen uit `httpRequestsAdaptiveGroups` /
  `httpRequests1dGroups` in de CF GraphQL Analytics API. Exacte veldkeuze
  wordt in het implementatieplan vastgelegd (afhankelijk van planlimiet per zone).
- Top-paden worden bij ophalen begrensd (bv. top 50 per zone per dag) om
  tabelgroei te beheersen; die limiet wordt in het dashboard vermeld zodat
  "top 50" niet als "alles" gelezen wordt.

## CRM-haakjes (nu al inbouwen)

- Per domein een lijst `conversion_paths` (bv. `/contact`, `/offerte`,
  `/aanmelden`). Bezoek aan die paden telt apart als **koopintentie-signaal**
  in `daily_path.is_conversion`.
- Dit is de brug naar fase 2: dezelfde conversiepagina's krijgen straks de
  lead-beacon.
- Definitieve conversion_paths per domein worden in het implementatieplan per
  site bepaald (vergt kort kijken naar elke site-structuur).

## Dashboard — schermen

1. **Overzicht** — tabel van 12 domeinen: label · unieke bezoekers (periode) ·
   trend-pijl · mens% · conversiepagina-bezoek · top-land. Sorteerbaar.
   Periodekiezer (7/30/90 dagen).
2. **Domein-detail** — trendgrafiek bezoekers over tijd · top-landen ·
   top-paden (met conversiepagina's gemarkeerd) · bot-vs-mens.

## Foutafhandeling

- Snapshot-collector: per-zone try/catch, fouten naar log + een
  `snapshot_runs`-audit (optioneel) zodat een stille lege dag zichtbaar is.
- Ontbrekende dagen in het dashboard worden als gap getoond, niet als 0.
- CF rate-limits: zones sequentieel of licht-parallel ophalen met backoff.

## Testen

- Collector: unit-test op de GraphQL→rij-transformatie met een vastgelegde
  voorbeeldrespons; integratietest tegen één echte zone.
- Idempotentie: tweemaal draaien voor dezelfde dag levert identieke rijen.
- Dashboard: rendert correct met (a) volledige data, (b) gaten, (c) een zone
  zonder data.

## Beslist (samenvatting)

- Aanpak **B gefaseerd, CF-first**.
- Scope fase 1 = 12 CF-domeinen hierboven.
- Hosting: **Next.js op Coolify + snapshot-cron → Supabase self-host (Beelink)**.
- Historie opbouwen via dagelijkse snapshot (CF-free bewaart maar ~30 dagen).
- Werknaam project: **metriductus** (wijzigbaar).

## Open (voor implementatieplan, niet blokkerend)

- Exacte CF GraphQL-velden per planlimiet per zone.
- Definitieve `conversion_paths` per domein.
- Welke 2-3 domeinen verkoop-prioriteit krijgen voor de fase-2-beacon.
- Achter welke CF Access-policy het dashboard komt.
