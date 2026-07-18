# Overdrachtsprompt — Metriductus, Batches A/B/C

> Plak dit volledig als openingsprompt in een nieuwe sessie. Het is zelfstandig:
> de collega hoeft niets van de eerdere sessies te weten.

---

## Jouw opdracht

Bouw drie uitbreidingen (Batch A, B, C) op het bestaande, werkende
**Metriductus**-dashboard. Werk **batch voor batch**, en lever elke batch
gedeployed en geverifieerd op voordat je aan de volgende begint.

**Volgorde:** A → B → C (A geeft de meeste waarde voor de minste moeite).

### Batch A — snelle winst (data is er grotendeels al)
1. **Verkeersbronnen per site.** De beacon slaat al `referrer_host` op in
   `lead_events`. Categoriseer en toon: *Zoekmachine* (google/bing/duckduckgo),
   *Social* (linkedin/facebook/x/instagram), *Direct* (geen referrer),
   *Ductus-netwerk* (een van de eigen domeinen), *Overig*. Toon per domein een
   verdeling (aantal + %) en op het overzicht de top-bronnen.
2. **Conversieratio.** Per site: `leads ÷ conversiepagina-bezoek` in %, en
   `leads ÷ menselijke bezoeken` in %. Toon als KPI en als kolom in de
   domeinentabel. Toon `—` (niet 0) bij domeinen zonder beacon.
3. **Populairste pagina's.** Top-pagina's per site uit de beacon-pageviews
   (bestaat al op de detailpagina) — breid uit met een periode-filter en toon
   het aantal + aandeel; markeer conversiepagina's.

### Batch B — beacon uitbreiden (marketing + engagement)
4. **UTM-campagnetracking.** Laat `public/beacon.js` `utm_source`,
   `utm_medium`, `utm_campaign` uit de URL lezen en meesturen; sla ze op in
   `lead_events` (nieuwe kolommen). Toon per site welke campagne hoeveel
   bezoeken **en leads** oplevert. Dit is belangrijk voor de lopende
   WTTA-marketingcampagne.
5. **Device & browser.** Beacon stuurt device-type (desktop/mobiel/tablet, af
   te leiden uit viewport-breedte) en browserfamilie. Aggregeren en tonen.
   **Geen fingerprinting, geen user-agent-string opslaan.**
6. **Engagement.** Tijd op pagina, scroll-diepte en bounce (sessie met één
   pageview). Vergt een licht sessiebegrip in de beacon — gebruik een
   **sessionStorage**-id (vervalt bij sluiten tab), **geen cookie, geen
   persoonsgegevens**.

### Batch C — Cloudflare uitbreiden (techniek/sitegezondheid)
7. Haal extra velden uit de bestaande CF GraphQL-query (`httpRequests1dGroups`):
   **responseStatusMap** (HTTP-statuscodes → 404/5xx per site),
   **cachedRequests/cachedBytes** (cache-hitratio), **bytes** (bandbreedte,
   verzamelen we al maar tonen we niet), **threats** (idem).
8. Schema uitbreiden (`daily_status` of kolommen op `daily_traffic`), collect
   aanpassen, en op het dashboard tonen: foutpercentage, cache-hitratio,
   bandbreedte, geblokkeerde dreigingen — per site.

---

## Wat er al staat en werkt (niet opnieuw bouwen)

**Metriductus** = intern webstatistieken-dashboard voor 11 business-domeinen uit
de Ductus-stack. Twee fases zijn live:

- **Fase 1** — dagelijkse Cloudflare-traffic (unieke bezoekers, requests,
  pageviews, landen) → self-host Supabase → dashboard. 30 dagen historie
  ingeladen; nachtelijke cron vult aan.
- **Fase 2** — eigen **lead-beacon**: cookieloze client-side beacon op
  naviductus.nl, aquaductus.nl en autoductus.nl die paginabezoek én
  formulier-verzendingen (leads) registreert.

### Repo & stack
- **Repo:** `c:\Projecten\metriductus` · GitHub `ptrdbrbndr/metriductus` · branch `main`
- **Stack:** Next.js 15 (App Router) · TypeScript strict · Node 22 · npm ·
  `@supabase/supabase-js` · Vitest · iron-session · bcryptjs
- **Build:** **eigen `Dockerfile`** (Coolify `build_pack=dockerfile`) — bewust
  géén nixpacks (zie Valkuilen).

### Routes
| Route | Wat |
|---|---|
| `/` | publieke marketing-landing |
| `/dashboard` | dashboard-overzicht (achter login) |
| `/dashboard/d/[zone]` | domein-detail |
| `/dashboard/login` | wachtwoord-login |
| `/api/collect` | dagelijkse CF-collect + backfill (`?days=N`), `CRON_SECRET`-bearer |
| `/api/beacon` | publieke beacon-endpoint (whitelist, geen IP) |
| `/api/auth/login` · `/api/auth/logout` | sessie |

### Datamodel (Supabase, self-host)
- `domains` — 11 domeinen + `conversion_paths`
- `daily_traffic` — per zone/dag: requests, page_views, uniques, bytes, threats
- `daily_country` — per zone/dag/land: requests
- `daily_path` — **leeg** (CF-free geeft geen pad-data; de beacon vult deze rol)
- `lead_events` — beacon: zone_name, ts, day, path, event_type(`pageview`|`lead`), referrer_host

### Infra
- **Coolify API:** `http://192.168.68.71:8000/api/v1` — token staat in
  `credentials.md` (zoek op "Coolify API token").
- **App-uuid metriductus:** `lh5dsonhwdwahlntegvro4fd`
- **Supabase-service-uuid:** `le5ixfl1mdf998o6ta6rgzs0` (Beelink 1)
- **SSH:** `ssh ptrdbrbndr@192.168.68.71` (passwordless sudo)
- **Migraties draaien:**
  ```bash
  cat migratie.sql | ssh ptrdbrbndr@192.168.68.71 \
    'docker exec -i supabase-db-le5ixfl1mdf998o6ta6rgzs0 psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1'
  ```
  Daarna PostgREST-cache verversen: `notify pgrst, 'reload schema';`
- **Deploy:** `curl -H "Authorization: Bearer $TOK" "$API/deploy?uuid=lh5dsonhwdwahlntegvro4fd&force=true"`
- **Cron:** `~/metriductus-collect.sh` op Beelink 1, dagelijks 04:15 UTC.

### Env-vars (staan al in Coolify)
`CF_ANALYTICS_TOKEN` · `SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` ·
`CRON_SECRET` · `SESSION_SECRET` · `AUTH_USERS_B64`

### Login (voor testen)
`pieter.de.brabander@ductus.nl` / `K@lekop1977!` — overige accounts staan in
`AUTH_USERS_B64`. Test login **over https**, niet over http (secure cookie).

---

## Valkuilen — lees dit, het scheelt uren

1. **Nooit een routesegment `app` binnen de App Router.** De dashboardmap heette
   eerst `app/app/` → op case-sensitive **Linux** mapte de Next-build `/` naar de
   dashboard-component (op Windows-lokaal níet reproduceerbaar), waardoor het
   dashboard publiek op `/` lekte. Nu `app/dashboard/`. Verifieer na elke
   structuurwijziging de route-tabel in de **Linux**-build-log.
2. **Coolify interpoleert `$` in env-waarden**, óók met `is_literal:true`. Dat
   verminkte bcrypt-hashes. Oplossing: waarden met `$` **base64-encoderen**
   (zie `AUTH_USERS_B64`). Doe dit voor elke nieuwe secret met `$`.
3. **Nixpacks serveerde een stale `.next`** (bron nieuw, build oud). Daarom een
   eigen `Dockerfile` met `rm -rf .next && npm run build`. Niet terugzetten.
4. **Cloudflare free geeft géén pad-niveau en géén bot-scores.** Bot Management
   = Enterprise (€1.000-en/mnd) — niet doen. De beacon dekt dit gratis: hij
   draait alleen in echte browsers, dus beacon-pageviews ≈ mensen.
5. **Supabase-service moet `connect_to_docker_network=true`** hebben, anders kan
   de app de kong-container niet bereiken (NO_DNS).
6. **Beacon-events testen** kan niet met curl alleen (JS vereist). Gebruik
   Playwright om een site echt te laden, of POST handmatig naar `/api/beacon`
   met een `Origin`-header die bij het domein past.

---

## Werkwijze & conventies

- **Privacy (AVG) is een harde eis:** de beacon is **cookieloos** en slaat
  **geen persoonsgegevens** op — geen IP, geen e-mail, geen user-agent-string,
  geen fingerprint. Daarom is er geen cookiebanner nodig. Houd dat zo; gebruik
  voor sessies `sessionStorage`, niet een cookie met identificatie.
- **Toon `—`, niet `0`,** voor domeinen zonder beacon — anders lijkt het alsof
  er gemeten is terwijl dat niet zo is.
- **Tests:** `npm test` (Vitest) moet groen blijven; `npx tsc --noEmit` schoon.
- **Verifieer altijd end-to-end na deploy**: `/` = 200 publiek,
  `/dashboard` = 307 → login, login over https → dashboard 200.
- **Beacon-wijzigingen** raken 3 externe repo's (`ptrdbrbndr/naviductus`,
  `ptrdbrbndr/aquaductus`, `ptrdbrbndr/autoductus`) alleen als het **snippet**
  wijzigt. `beacon.js` zelf is centraal gehost op metriductus.nl → wijzigingen
  daarin vereisen **geen** redeploy van die sites.
- **Projectgeheugen:** `project_metriductus.md` in de memory-map bevat de
  actuele stand; werk het bij als je iets structureels wijzigt.

## Definition of done per batch

- Migratie toegepast + PostgREST verversd (indien schema wijzigt)
- Code gecommit + gepusht naar `main`
- Gedeployed via Coolify en **geverifieerd op de live site**
- `npm test` groen, `tsc` schoon
- Nieuwe metriek zichtbaar op het dashboard met échte data (of nette `—`)
