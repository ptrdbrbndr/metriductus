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
