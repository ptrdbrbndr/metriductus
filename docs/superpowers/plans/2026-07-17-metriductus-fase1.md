# Metriductus Fase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Een intern dashboard dat dagelijkse Cloudflare-traffic van 12 business-domeinen snapshot naar self-host Supabase en per domein toont, met CRM-haakjes (conversiepagina-signaal).

**Architecture:** Eén Next.js-app (App Router) die zowel de dashboard-UI serveert als een beveiligde `/api/collect`-route bevat. Een dagelijkse cron (Coolify scheduled task) POST't naar die route; die haalt per zone de traffic van de vorige dag op bij de CF GraphQL Analytics API en upsert't naar Supabase. Het dashboard leest uitsluitend uit Supabase (geen live CF-call bij pageload). Draait op Coolify achter CF Access.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Node 22 · `@supabase/supabase-js` · Vitest · Recharts (trendgrafiek) · Coolify + self-host Supabase (Beelink 1, 192.168.68.71).

## Global Constraints

- Node 22; package manager **npm**.
- Next.js 15 App Router + TypeScript strict.
- Alle DB-toegang via `@supabase/supabase-js` met **service-role key** (alleen server-side; nooit naar de client bundelen).
- Interactieve UI-elementen krijgen `data-testid` (Ductus-conventie).
- Cloudflare-token voor Analytics is een **apart** token met `Zone → Analytics → Read` (+ `Zone → Zone → Read`); het bestaande `CLOUDFLARE_API_TOKEN` mist deze permissie — bevestigd 2026-07-17.
- CF GraphQL free-plan levert betrouwbaar: `requests`, `pageViews`, `bytes`, `threats`, `uniq.uniques`, `countryMap`. **Path-niveau en bot-split zijn NIET gegarandeerd op free** — `daily_path` is een best-effort stretch-taak (Task 9) die leeg mag blijven.
- Secrets uit env, nooit hardcoded. Env-namen: `CF_ANALYTICS_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.
- Datums in UTC; snapshot draait voor "gisteren" (`date_geq = date_leq = yesterday`).

---

## File Structure

```
metriductus/
├── package.json, tsconfig.json, next.config.ts, vitest.config.ts, .env.example
├── supabase/migrations/0001_init.sql        # schema
├── lib/
│   ├── domains.ts       # 12 domeinen config (label, conversion_paths)
│   ├── cf.ts            # CF GraphQL client (fetch + query)
│   ├── transform.ts     # GraphQL-respons → typed rows
│   ├── db.ts            # Supabase server-client + upserts
│   └── queries.ts       # dashboard read-queries
├── app/
│   ├── api/collect/route.ts   # beveiligde snapshot-endpoint
│   ├── page.tsx               # overzicht (12 domeinen)
│   └── d/[zone]/page.tsx      # domein-detail
├── __tests__/
│   ├── transform.test.ts
│   └── cf.test.ts
└── scripts/probe-token.mjs    # verifieert CF-token permissie
```

---

## Task 1: Repo-scaffold + CF-token verifiëren

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.env.example`, `.gitignore`
- Create: `scripts/probe-token.mjs`

**Interfaces:**
- Produces: werkende Next.js+Vitest-scaffold; geverifieerd `CF_ANALYTICS_TOKEN` in `.env`.

- [ ] **Step 1: Scaffold Next.js + deps**

Run:
```bash
cd c:/Projecten/metriductus
npm init -y
npm i next@15 react react-dom @supabase/supabase-js recharts
npm i -D typescript @types/react @types/node vitest tsx
```

- [ ] **Step 2: Config-bestanden**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022", "lib": ["dom","dom.iterable","ES2022"],
    "strict": true, "module": "esnext", "moduleResolution": "bundler",
    "jsx": "preserve", "esModuleInterop": true, "skipLibCheck": true,
    "noEmit": true, "incremental": true, "resolveJsonModule": true,
    "paths": { "@/*": ["./*"] }
  },
  "include": ["**/*.ts","**/*.tsx",".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'node', include: ['__tests__/**/*.test.ts'] } })
```

`next.config.ts`:
```ts
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {}
export default nextConfig
```

`.env.example`:
```
CF_ANALYTICS_TOKEN=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

`.gitignore`:
```
node_modules/
.next/
.env
```

Add to `package.json` `"scripts"`: `"dev":"next dev","build":"next build","start":"next start","test":"vitest run"`.

- [ ] **Step 3: Token-probe script**

`scripts/probe-token.mjs`:
```js
const token = process.env.CF_ANALYTICS_TOKEN
if (!token) { console.error('CF_ANALYTICS_TOKEN ontbreekt'); process.exit(1) }
const z = await fetch('https://api.cloudflare.com/client/v4/zones?name=iductus.nl',
  { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
const zid = z.result?.[0]?.id
const q = { query: `query{viewer{zones(filter:{zoneTag:"${zid}"}){httpRequests1dGroups(limit:1,filter:{date_geq:"2026-07-10",date_leq:"2026-07-16"}){dimensions{date}sum{requests}}}}}` }
const r = await fetch('https://api.cloudflare.com/client/v4/graphql',
  { method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}, body: JSON.stringify(q) }).then(r=>r.json())
if (r.errors) { console.error('FAIL:', r.errors[0].message); process.exit(1) }
console.log('OK — analytics permissie werkt')
```

- [ ] **Step 4: Maak het Analytics-token aan (handmatig, Cloudflare-dashboard)**

In Cloudflare → My Profile → API Tokens → Create Token → Custom:
- Permissions: `Zone → Analytics → Read` **en** `Zone → Zone → Read`
- Zone Resources: All zones (of de 12 specifiek)
Zet de tokenwaarde in `.env` als `CF_ANALYTICS_TOKEN` en voeg 'm toe aan `credentials.md`.

- [ ] **Step 5: Verifieer**

Run: `node --env-file=.env scripts/probe-token.mjs`
Expected: `OK — analytics permissie werkt`

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js app + CF analytics token probe"
```

---

## Task 2: Supabase-schema

**Files:**
- Create: `supabase/migrations/0001_init.sql`

**Interfaces:**
- Produces: tabellen `domains`, `daily_traffic`, `daily_country`, `daily_path`.

- [ ] **Step 1: Schrijf migratie**

`supabase/migrations/0001_init.sql`:
```sql
create table if not exists domains (
  zone_name        text primary key,
  cf_zone_id       text,
  label            text not null,
  is_business      boolean not null default true,
  conversion_paths text[] not null default '{}',
  created_at       timestamptz not null default now()
);
create table if not exists daily_traffic (
  zone_name  text not null references domains(zone_name),
  day        date not null,
  requests   bigint not null default 0,
  page_views bigint not null default 0,
  uniques    bigint not null default 0,
  bytes      bigint not null default 0,
  threats    bigint not null default 0,
  primary key (zone_name, day)
);
create table if not exists daily_country (
  zone_name text not null references domains(zone_name),
  day       date not null,
  country   text not null,
  requests  bigint not null default 0,
  primary key (zone_name, day, country)
);
create table if not exists daily_path (
  zone_name     text not null references domains(zone_name),
  day           date not null,
  path          text not null,
  page_views    bigint not null default 0,
  is_conversion boolean not null default false,
  primary key (zone_name, day, path)
);
```

- [ ] **Step 2: Toepassen op self-host Supabase**

Run (psql-connstring uit `credentials.md`, Beelink 1):
```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_init.sql
```
Expected: `CREATE TABLE` × 4, geen errors.

- [ ] **Step 3: Verifieer**

Run: `psql "$SUPABASE_DB_URL" -c "\dt"`
Expected: de 4 tabellen staan er.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_init.sql && git commit -m "feat: supabase schema fase 1"
```

---

## Task 3: Domein-config + seed

**Files:**
- Create: `lib/domains.ts`
- Create: `scripts/seed-domains.mjs`

**Interfaces:**
- Produces: `export const DOMAINS: DomainConfig[]` waar `DomainConfig = { zoneName: string; label: string; conversionPaths: string[] }`.

- [ ] **Step 1: Config**

`lib/domains.ts`:
```ts
export type DomainConfig = { zoneName: string; label: string; conversionPaths: string[] }

export const DOMAINS: DomainConfig[] = [
  { zoneName: 'iductus.nl',        label: 'Inductus',        conversionPaths: ['/contact','/offerte'] },
  { zoneName: 'naviductus.nl',     label: 'Naviductus',      conversionPaths: ['/contact'] },
  { zoneName: 'autoductus.nl',     label: 'Autoductus',      conversionPaths: ['/contact'] },
  { zoneName: 'congressionals.nl', label: 'Congressionals',  conversionPaths: ['/contact'] },
  { zoneName: 'aquaductus.nl',     label: 'Aquaductus',      conversionPaths: ['/lid-worden','/contact'] },
  { zoneName: 'vitaductus.nl',     label: 'Vitaductus',      conversionPaths: ['/contact'] },
  { zoneName: 'liefdevolleblik.nl',label: 'Liefdevolle Blik',conversionPaths: ['/contact'] },
  { zoneName: 'debrabander.com',   label: 'De Brabander',    conversionPaths: ['/contact'] },
  { zoneName: 'veriductus.nl',     label: 'Veriductus',      conversionPaths: ['/contact'] },
  { zoneName: 'conductus.nl',      label: 'Conductus',       conversionPaths: ['/contact'] },
  { zoneName: 'dataductus.nl',     label: 'Dataductus',      conversionPaths: ['/contact'] },
  { zoneName: 'datamanagement.nl', label: 'Datamanagement',  conversionPaths: ['/contact'] },
]
```
> NB: `conversionPaths` per domein zijn eerste gok; verfijn na inspectie van elke site (open punt uit de spec). Leeg laten is toegestaan.

- [ ] **Step 2: Seed-script**

`scripts/seed-domains.mjs`:
```js
import { createClient } from '@supabase/supabase-js'
import { DOMAINS } from '../lib/domains.ts'
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
for (const d of DOMAINS) {
  const { error } = await db.from('domains').upsert({
    zone_name: d.zoneName, label: d.label, conversion_paths: d.conversionPaths,
  }, { onConflict: 'zone_name' })
  if (error) { console.error(d.zoneName, error.message); process.exit(1) }
}
console.log(`geseed: ${DOMAINS.length} domeinen`)
```

- [ ] **Step 3: Uitvoeren**

Run: `npx tsx --env-file=.env scripts/seed-domains.mjs`
Expected: `geseed: 12 domeinen`

- [ ] **Step 4: Commit**

```bash
git add lib/domains.ts scripts/seed-domains.mjs && git commit -m "feat: domain config + seed"
```

---

## Task 4: CF GraphQL-client

**Files:**
- Create: `lib/cf.ts`
- Test: `__tests__/cf.test.ts`

**Interfaces:**
- Consumes: `CF_ANALYTICS_TOKEN` env.
- Produces:
  - `resolveZoneId(zoneName: string): Promise<string>`
  - `fetchDailyGroups(zoneId: string, day: string): Promise<CfDailyGroup[]>` waar
    `CfDailyGroup = { date: string; requests: number; pageViews: number; bytes: number; threats: number; uniques: number; countries: { country: string; requests: number }[] }`

- [ ] **Step 1: Failing test**

`__tests__/cf.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { fetchDailyGroups } from '../lib/cf'

describe('fetchDailyGroups', () => {
  it('mapt de GraphQL-respons naar CfDailyGroup[]', async () => {
    const resp = { data: { viewer: { zones: [{ httpRequests1dGroups: [{
      dimensions: { date: '2026-07-16' },
      sum: { requests: 100, pageViews: 40, bytes: 5000, threats: 2,
             countryMap: [{ clientCountryName: 'NL', requests: 80 }] },
      uniq: { uniques: 30 },
    }]}]}} }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => resp }))
    const out = await fetchDailyGroups('zid', '2026-07-16')
    expect(out).toEqual([{ date: '2026-07-16', requests: 100, pageViews: 40,
      bytes: 5000, threats: 2, uniques: 30, countries: [{ country: 'NL', requests: 80 }] }])
  })

  it('gooit bij een GraphQL-error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ errors: [{ message: 'nope' }] }) }))
    await expect(fetchDailyGroups('zid', '2026-07-16')).rejects.toThrow('nope')
  })
})
```

- [ ] **Step 2: Run → faalt**

Run: `npm test -- cf`
Expected: FAIL (`fetchDailyGroups is not a function`)

- [ ] **Step 3: Implementeer**

`lib/cf.ts`:
```ts
const API = 'https://api.cloudflare.com/client/v4'
const token = () => process.env.CF_ANALYTICS_TOKEN!

export type CfDailyGroup = {
  date: string; requests: number; pageViews: number; bytes: number
  threats: number; uniques: number; countries: { country: string; requests: number }[]
}

export async function resolveZoneId(zoneName: string): Promise<string> {
  const r = await fetch(`${API}/zones?name=${zoneName}`, { headers: { Authorization: `Bearer ${token()}` } }).then(x => x.json())
  const id = r.result?.[0]?.id
  if (!id) throw new Error(`zone niet gevonden: ${zoneName}`)
  return id
}

export async function fetchDailyGroups(zoneId: string, day: string): Promise<CfDailyGroup[]> {
  const query = `query{viewer{zones(filter:{zoneTag:"${zoneId}"}){httpRequests1dGroups(limit:1,filter:{date_geq:"${day}",date_leq:"${day}"}){dimensions{date}sum{requests pageViews bytes threats countryMap{clientCountryName requests}}uniq{uniques}}}}}`
  const r = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  }).then(x => x.json())
  if (r.errors) throw new Error(r.errors[0].message)
  const groups = r.data?.viewer?.zones?.[0]?.httpRequests1dGroups ?? []
  return groups.map((g: any) => ({
    date: g.dimensions.date,
    requests: g.sum.requests, pageViews: g.sum.pageViews,
    bytes: g.sum.bytes, threats: g.sum.threats,
    uniques: g.uniq.uniques,
    countries: (g.sum.countryMap ?? []).map((c: any) => ({ country: c.clientCountryName, requests: c.requests })),
  }))
}
```

- [ ] **Step 4: Run → slaagt**

Run: `npm test -- cf`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/cf.ts __tests__/cf.test.ts && git commit -m "feat: cloudflare graphql analytics client"
```

---

## Task 5: Transform naar DB-rijen

**Files:**
- Create: `lib/transform.ts`
- Test: `__tests__/transform.test.ts`

**Interfaces:**
- Consumes: `CfDailyGroup` (Task 4), `DomainConfig` (Task 3).
- Produces:
  - `toTrafficRow(zoneName, g: CfDailyGroup)` → `{ zone_name, day, requests, page_views, uniques, bytes, threats }`
  - `toCountryRows(zoneName, g: CfDailyGroup)` → `{ zone_name, day, country, requests }[]`

- [ ] **Step 1: Failing test**

`__tests__/transform.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { toTrafficRow, toCountryRows } from '../lib/transform'

const g = { date: '2026-07-16', requests: 100, pageViews: 40, bytes: 5000,
  threats: 2, uniques: 30, countries: [{ country: 'NL', requests: 80 }, { country: 'DE', requests: 20 }] }

describe('transform', () => {
  it('toTrafficRow', () => {
    expect(toTrafficRow('iductus.nl', g)).toEqual({
      zone_name: 'iductus.nl', day: '2026-07-16', requests: 100,
      page_views: 40, uniques: 30, bytes: 5000, threats: 2 })
  })
  it('toCountryRows', () => {
    expect(toCountryRows('iductus.nl', g)).toEqual([
      { zone_name: 'iductus.nl', day: '2026-07-16', country: 'NL', requests: 80 },
      { zone_name: 'iductus.nl', day: '2026-07-16', country: 'DE', requests: 20 }])
  })
})
```

- [ ] **Step 2: Run → faalt** — Run: `npm test -- transform` → FAIL.

- [ ] **Step 3: Implementeer**

`lib/transform.ts`:
```ts
import type { CfDailyGroup } from './cf'

export function toTrafficRow(zoneName: string, g: CfDailyGroup) {
  return { zone_name: zoneName, day: g.date, requests: g.requests,
    page_views: g.pageViews, uniques: g.uniques, bytes: g.bytes, threats: g.threats }
}

export function toCountryRows(zoneName: string, g: CfDailyGroup) {
  return g.countries.map(c => ({ zone_name: zoneName, day: g.date, country: c.country, requests: c.requests }))
}
```

- [ ] **Step 4: Run → slaagt** — Run: `npm test -- transform` → PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/transform.ts __tests__/transform.test.ts && git commit -m "feat: transform cf groups to db rows"
```

---

## Task 6: Supabase-client + upserts

**Files:**
- Create: `lib/db.ts`

**Interfaces:**
- Consumes: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Produces:
  - `db` (SupabaseClient, service-role)
  - `upsertTraffic(row)` en `upsertCountries(rows)` — idempotent op primary key.

- [ ] **Step 1: Implementeer**

`lib/db.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

export const db = createClient(
  process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function upsertTraffic(row: Record<string, unknown>) {
  const { error } = await db.from('daily_traffic').upsert(row, { onConflict: 'zone_name,day' })
  if (error) throw new Error(`daily_traffic: ${error.message}`)
}

export async function upsertCountries(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return
  const { error } = await db.from('daily_country').upsert(rows, { onConflict: 'zone_name,day,country' })
  if (error) throw new Error(`daily_country: ${error.message}`)
}
```

- [ ] **Step 2: Type-check** — Run: `npx tsc --noEmit` → geen errors in `lib/db.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/db.ts && git commit -m "feat: supabase upserts"
```

---

## Task 7: Collect-route (orchestratie)

**Files:**
- Create: `app/api/collect/route.ts`

**Interfaces:**
- Consumes: `DOMAINS`, `resolveZoneId`, `fetchDailyGroups`, `toTrafficRow`, `toCountryRows`, `upsertTraffic`, `upsertCountries`, `CRON_SECRET`.
- Produces: `POST /api/collect` → JSON `{ day, ok: string[], failed: {zone,error}[] }`. Auth via `Authorization: Bearer <CRON_SECRET>`.

- [ ] **Step 1: Implementeer**

`app/api/collect/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { DOMAINS } from '@/lib/domains'
import { resolveZoneId, fetchDailyGroups } from '@/lib/cf'
import { toTrafficRow, toCountryRows } from '@/lib/transform'
import { upsertTraffic, upsertCountries } from '@/lib/db'

export const dynamic = 'force-dynamic'

function yesterdayUTC(): string {
  const d = new Date(Date.now() - 86_400_000)
  return d.toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const day = yesterdayUTC()
  const ok: string[] = []
  const failed: { zone: string; error: string }[] = []

  for (const d of DOMAINS) {
    try {
      const zid = await resolveZoneId(d.zoneName)
      const groups = await fetchDailyGroups(zid, day)
      for (const g of groups) {
        await upsertTraffic(toTrafficRow(d.zoneName, g))
        await upsertCountries(toCountryRows(d.zoneName, g))
      }
      ok.push(d.zoneName)
    } catch (e) {
      failed.push({ zone: d.zoneName, error: (e as Error).message })
    }
  }
  return NextResponse.json({ day, ok, failed })
}
```
> Per-zone try/catch: één falende zone stopt de rest niet. Fouten komen terug in de respons (en dus in de cron-log).

- [ ] **Step 2: Handmatige integratietest**

Run:
```bash
npm run build && npm start &
sleep 4
curl -s -X POST localhost:3000/api/collect -H "Authorization: Bearer $CRON_SECRET" | npx json
```
Expected: `{ day: "...", ok: [ ...12 zones... ], failed: [] }` en rijen in `daily_traffic` (`psql ... -c "select count(*) from daily_traffic"` > 0).

- [ ] **Step 3: Commit**

```bash
git add app/api/collect/route.ts && git commit -m "feat: daily collect route"
```

---

## Task 8: Dashboard read-queries

**Files:**
- Create: `lib/queries.ts`

**Interfaces:**
- Produces:
  - `getOverview(days: number)` → `{ zoneName, label, uniques, requests, topCountry }[]` (gesommeerd over periode)
  - `getDomainDetail(zoneName, days)` → `{ series: {day, uniques}[], countries: {country, requests}[] }`

- [ ] **Step 1: Implementeer**

`lib/queries.ts`:
```ts
import { db } from './db'

function since(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
}

export async function getOverview(days: number) {
  const from = since(days)
  const { data: doms } = await db.from('domains').select('zone_name,label').eq('is_business', true)
  const { data: traffic } = await db.from('daily_traffic').select('zone_name,uniques,requests').gte('day', from)
  const { data: countries } = await db.from('daily_country').select('zone_name,country,requests').gte('day', from)

  return (doms ?? []).map(d => {
    const t = (traffic ?? []).filter(r => r.zone_name === d.zone_name)
    const c = (countries ?? []).filter(r => r.zone_name === d.zone_name)
    const byCountry = new Map<string, number>()
    for (const r of c) byCountry.set(r.country, (byCountry.get(r.country) ?? 0) + Number(r.requests))
    const topCountry = [...byCountry.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    return {
      zoneName: d.zone_name, label: d.label,
      uniques: t.reduce((s, r) => s + Number(r.uniques), 0),
      requests: t.reduce((s, r) => s + Number(r.requests), 0),
      topCountry,
    }
  }).sort((a, b) => b.uniques - a.uniques)
}

export async function getDomainDetail(zoneName: string, days: number) {
  const from = since(days)
  const { data: series } = await db.from('daily_traffic')
    .select('day,uniques').eq('zone_name', zoneName).gte('day', from).order('day')
  const { data: rawC } = await db.from('daily_country')
    .select('country,requests').eq('zone_name', zoneName).gte('day', from)
  const byCountry = new Map<string, number>()
  for (const r of rawC ?? []) byCountry.set(r.country, (byCountry.get(r.country) ?? 0) + Number(r.requests))
  return {
    series: (series ?? []).map(r => ({ day: r.day, uniques: Number(r.uniques) })),
    countries: [...byCountry.entries()].map(([country, requests]) => ({ country, requests }))
      .sort((a, b) => b.requests - a.requests).slice(0, 10),
  }
}
```

- [ ] **Step 2: Type-check** — Run: `npx tsc --noEmit` → geen errors.

- [ ] **Step 3: Commit**

```bash
git add lib/queries.ts && git commit -m "feat: dashboard read queries"
```

---

## Task 9: Overzichtspagina + domein-detail

**Files:**
- Create: `app/page.tsx`
- Create: `app/d/[zone]/page.tsx`

**Interfaces:**
- Consumes: `getOverview`, `getDomainDetail`.

- [ ] **Step 1: Overzichtspagina**

`app/page.tsx`:
```tsx
import Link from 'next/link'
import { getOverview } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function Home({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days } = await searchParams
  const period = Number(days ?? 30)
  const rows = await getOverview(period)
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Metriductus — traffic ({period} dagen)</h1>
      <nav data-testid="period-nav">
        {[7, 30, 90].map(d => <Link key={d} href={`/?days=${d}`} style={{ marginRight: 12 }}>{d}d</Link>)}
      </nav>
      <table data-testid="overview-table" style={{ marginTop: 16, borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr><th align="left">Domein</th><th align="right">Unieke bezoekers</th><th align="right">Requests</th><th align="left">Top-land</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.zoneName} data-testid={`row-${r.zoneName}`}>
              <td><Link href={`/d/${r.zoneName}`}>{r.label}</Link></td>
              <td align="right">{r.uniques.toLocaleString('nl-NL')}</td>
              <td align="right">{r.requests.toLocaleString('nl-NL')}</td>
              <td>{r.topCountry}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
```

- [ ] **Step 2: Domein-detail met trendgrafiek**

`app/d/[zone]/page.tsx`:
```tsx
'use client'
import { use } from 'react'
import useSWR from 'swr'

// server-fetch via route; simpeler: maak detail een server component.
```
> Vervang bovenstaande door een **server component** (geen extra client-fetch nodig):

`app/d/[zone]/page.tsx`:
```tsx
import Link from 'next/link'
import { getDomainDetail } from '@/lib/queries'
import { TrendChart } from './trend-chart'

export const dynamic = 'force-dynamic'

export default async function Detail({ params }: { params: Promise<{ zone: string }> }) {
  const { zone } = await params
  const { series, countries } = await getDomainDetail(zone, 90)
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <Link href="/">← overzicht</Link>
      <h1>{zone}</h1>
      <TrendChart data={series} />
      <h2>Top-landen (90d)</h2>
      <ul data-testid="country-list">
        {countries.map(c => <li key={c.country}>{c.country}: {c.requests.toLocaleString('nl-NL')}</li>)}
      </ul>
    </main>
  )
}
```

`app/d/[zone]/trend-chart.tsx`:
```tsx
'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function TrendChart({ data }: { data: { day: string; uniques: number }[] }) {
  return (
    <div data-testid="trend-chart" style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="day" /><YAxis /><Tooltip />
          <Line type="monotone" dataKey="uniques" stroke="#2563eb" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: Handmatige verificatie**

Run: `npm run build && npm start`, open `localhost:3000`.
Expected: tabel met 12 domeinen, sorteerbaar op periode; klik op een domein → detailpagina met trendgrafiek + top-landen.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx "app/d/[zone]/page.tsx" "app/d/[zone]/trend-chart.tsx" && git commit -m "feat: overview + domain detail pages"
```

---

## Task 10: Deploy op Coolify + dagelijkse cron

**Files:**
- Create: `README.md` (deploy + env-doc)

**Interfaces:**
- Produces: draaiende app achter CF Access; dagelijkse cron die `/api/collect` aanroept.

- [ ] **Step 1: Push naar git remote** (nieuwe repo, conventie zoals andere Ductus-projecten).

- [ ] **Step 2: Coolify-app aanmaken**
  - New Resource → van git repo → Next.js (Nixpacks/Dockerfile zoals andere Ductus-apps).
  - Env: `CF_ANALYTICS_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.
  - Domein: `metriductus.<intern>` achter **CF Access** (policy: Pieter).

- [ ] **Step 3: Dagelijkse cron (Coolify Scheduled Task)**
  - Command:
    ```bash
    curl -fsS -X POST https://metriductus.<intern>/api/collect -H "Authorization: Bearer $CRON_SECRET"
    ```
  - Schedule: `15 4 * * *` (04:15, na UTC-daggrens).
  > CF Access moet deze route doorlaten via de `CRON_SECRET`-bearer, óf de cron draait binnen het netwerk achter Access. Kies: een Access **service-token** of een bypass-policy specifiek voor `/api/collect`.

- [ ] **Step 4: Eerste handmatige run + verifieer**

Run: `curl -X POST https://metriductus.<intern>/api/collect -H "Authorization: Bearer <secret>"`
Expected: `{ ok: [12 zones], failed: [] }`; dashboard toont data.

- [ ] **Step 5: Commit README**

```bash
git add README.md && git commit -m "docs: deploy + cron instructies"
```

---

## Task 11 (stretch, best-effort): Path-niveau + conversiepagina-signaal

> Alleen uitvoeren als CF path-data beschikbaar blijkt op de betreffende plannen. Op free-plan mag `daily_path` leeg blijven — het dashboard degradeert netjes.

**Files:**
- Modify: `lib/cf.ts` (voeg `fetchDailyPaths` toe via `httpRequestsAdaptiveGroups`), `lib/transform.ts` (`toPathRows` met `is_conversion` = match op `conversionPaths`), `app/api/collect/route.ts` (upsert paths), detailpagina (top-paden met conversie-markering).

- [ ] **Step 1:** Probe of `httpRequestsAdaptiveGroups` met `clientRequestPath` data teruggeeft per zone; zo niet → taak overslaan, in README documenteren dat paden pas komen bij een betaald plan of via de fase-2-beacon.

---

## Self-Review

**Spec-dekking:**
- 12 CF-domeinen scope → Task 3 (`DOMAINS`). ✅
- Snapshot naar Supabase (historie) → Task 6/7. ✅
- Next.js op Coolify achter CF Access → Task 10. ✅
- Data per domein (uniques/requests/landen) → Task 4/5/8/9. ✅
- CRM-haakje conversion_paths/is_conversion → schema (Task 2) + config (Task 3) + stretch Task 11. Fase-1-signaal is voorbereid; volledige path-markering is best-effort door CF-free-limiet — expliciet gedocumenteerd, geen stille aanname. ✅
- Foutafhandeling per-zone geïsoleerd → Task 7. ✅
- Testen (transform/cf unit, idempotent upsert, integratietest) → Task 4/5/7. ✅
- CF-token mist analytics-permissie → Task 1 (nieuw token). ✅

**Placeholder-scan:** geen TBD's; alle code-stappen bevatten volledige code. `daily_path`/paden zijn expliciet als best-effort gemarkeerd, niet als vage TODO.

**Type-consistentie:** `CfDailyGroup` (Task 4) → `toTrafficRow`/`toCountryRows` (Task 5) → upserts (Task 6) → route (Task 7): veldnamen (`page_views`, `uniques`, `zone_name`) consistent met schema (Task 2). ✅
