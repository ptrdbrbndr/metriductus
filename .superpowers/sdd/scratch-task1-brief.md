# Task 1 — Repo-scaffold (alleen code-stappen)

Doel: werkende Next.js 15 (App Router, TypeScript) + Vitest scaffold in c:/Projecten/metriductus.

VOER UIT: Steps 1, 2, 3 en 6 uit "Task 1" van
docs/superpowers/plans/2026-07-17-metriductus-fase1.md (lees exact die taak).

SLA OVER: Step 4 en Step 5 (CF-token aanmaken + probe draaien) — die zijn
human-gated (token bestaat nog niet). Maak scripts/probe-token.mjs WEL aan
(step 3), maar draai het NIET.

Global Constraints (bindend): Node 22, npm, Next.js 15 App Router, TS strict.
Env-namen exact: CF_ANALYTICS_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET.

Let op Windows: gebruik de Bash-tool voor npm-commando's. Als `npm i next@15`
een interactieve prompt geeft, gebruik non-interactive flags.

Na afloop: `npx tsc --noEmit` mag nog niet volledig groen zijn (er is nog geen
app/-map) — dat is OK; zorg alleen dat de config-bestanden kloppen en committen.
Rapporteer status + commit-hash naar het report-bestand.
