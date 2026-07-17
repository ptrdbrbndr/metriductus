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
