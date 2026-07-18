# Metriductus fase 1 — progress ledger

Plan: docs/superpowers/plans/2026-07-17-metriductus-fase1.md
Base commit (voor Task 1): 3937b9c

## Externe blockers (human)
- [ ] CF Analytics-token (Task 1 step 4-5)
- [ ] Supabase-doel + DB-URL + service-role key (Task 2/3/6/7)
- [ ] Coolify + CF Access (Task 10)

## Taken
(nog geen taken afgerond)

Task 1: complete (commits 835dd5f..5210e5d, scaffold geverifieerd door controller)
Task 2-8: complete (schema/domains/cf/transform/db/queries; 4/4 tests groen, tsc schoon)
Task 7: complete (collect-route code; integratietest human-gated op secrets)
Task 9+12: complete (frontend af — marketing / + dashboard /app + /app/d/[zone]; build groen, tsc schoon, / en /app renderen 200; db.ts lazy gemaakt voor build zonder env)

## Nog te doen (na secrets)
- Supabase-doel bevestigen -> schema toepassen (Task 2 apply) + seed (Task 3)
- CF Analytics-token -> probe (Task 1 step5) + integratietest /api/collect (Task 7)
- Deploy Coolify + CF Access + cron (Task 10)
- Finale whole-branch review

## Supabase-stack GEPROVISIONEERD (2026-07-17)
- Coolify project 'metriductus' uuid j2b0u52ecol5fv6jakfslipo
- service supabase-metriductus uuid le5ixfl1mdf998o6ta6rgzs0 op server localhost (Beelink 1)
- Valkuil 1 gefixt (_supabase-db ontbrak) + volledige compose up
- Schema toegepast (4 tabellen) + 11 domeinen geseed
- End-to-end geverifieerd: kong->PostgREST->db geeft domains terug (service_role)
- Interne app-URL: http://supabase-kong-le5ixfl1mdf998o6ta6rgzs0:8000
- Keys in /data/coolify/services/le5ixfl1mdf998o6ta6rgzs0/.env (SERVICE_SUPABASESERVICE_KEY / SERVICE_SUPABASEANON_KEY / SERVICE_PASSWORD_POSTGRES)

## App LIVE op Beelink (2026-07-17)
- GitHub ptrdbrbndr/metriductus (public) + Coolify app lh5dsonhwdwahlntegvro4fd (Node22, :3000, domains metriductus.nl+www)
- envs: SUPABASE_URL (interne kong), SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET (~/.metriductus-cron-secret)
- deploy finished, app draait, /app leest de 11 domeinen uit Supabase (connect_to_docker_network=true)
- tunnel-ingress metriductus.nl + www toegevoegd (v154/v155)

## BLOCKED op human:
- CF Analytics-token -> collect + cron
- metriductus.nl toevoegen aan CF (zone-create) -> NS-flip mijn.host + DNS-CNAMEs + CF Access-policy /app

## KLUS 1 KLAAR (2026-07-17) — data live
- CF_ANALYTICS_TOKEN gezet (.env + Coolify-app env), geverifieerd active + analytics werkt
- eerste /api/collect: 11/11 zones ok, 0 failed (dag 2026-07-16); 10 traffic-rijen in DB
- dashboard toont echte cijfers
- dagelijkse cron op Beelink: 04:15 UTC ~/metriductus-collect.sh (hit app intern), log ~/metriductus-collect.log

## KLUS 2 nog open (human): metriductus.nl toevoegen aan CF -> dan NS-flip + DNS + CF Access

## KLUS 2 (2026-07-18)
- CF-zone metriductus.nl id 1f36da4181d0560eee1b56acdc3242f6 (NS bradley/ollie)
- DNS: metriductus.nl + www CNAME -> tunnel (proxied) aangemaakt
- NS-flip mijn.host: raw {"nameservers":[...]} werkte (nameserver_profile=no-op, credentials gecorrigeerd)
- CF Access: WACHT op zone active (create gaf 'domain does not belong to zone' zolang pending)
- Monitor draait op zone-status

## KLUS 2 KLAAR + ROUTING-BUG OPGELOST (2026-07-18)
- metriductus.nl zone active, DNS+tunnel werken; site publiek live
- BUG: app/app/page.tsx mapte op Linux '/' naar dashboard (data-lek op /). Fix: hernoemd naar app/dashboard/ + eigen Dockerfile (build_pack=dockerfile) i.p.v. nixpacks
- / = publieke marketing (200), /dashboard = CF Access-login (302), Access-policy 'Pieter + Chris'
- screenshots gemaakt (marketing rendert correct)
- KLAAR: volledige stack live end-to-end

## WACHTWOORD-LOGIN + BACKFILL (2026-07-18)
- CF Access vervangen door iron-session wachtwoord-login (OTP-mail kwam onbetrouwbaar aan)
- 3 accounts via AUTH_USERS_B64 (base64 ivm Coolify $-interpolatie van bcrypt-hashes), SESSION_SECRET in env
- middleware beschermt /dashboard/*, login /dashboard/login, uitlog-knop in topbar
- CF Access-app verwijderd; https-flow geverifieerd (login->dashboard 200)
- /api/collect?days=N backfill; 30 dagen gedraaid (221 traffic-rijen, 11 domeinen)

## FASE 2 LIVE (2026-07-18) — lead-beacon
- schema lead_events + /api/beacon (whitelist, geen IP, cookieloos) + public/beacon.js
- dashboard: Conversiepagina-bezoek + Leads-tegels + Menselijke bezoeken + top-paden per domein
- snippet gedeployed op naviductus.nl, aquaductus.nl, autoductus.nl (Coolify-redeploys)
- end-to-end geverifieerd met echte browser (Playwright) -> events in DB
- betaald CF-plan NIET nodig: beacon meet mensen (JS) + conversies gratis
