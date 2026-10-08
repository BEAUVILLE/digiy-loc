# V17 — Supabase private storage adapter

## Real implementation, not deployed
Server-only parameterized SQL adapter for V16 receiver: checks active LOC Master unit and inserts feedback into a private schema. Database injection is a privileged **server-side PostgreSQL connection**, not an anon key, browser SDK or publicly exposed RPC. The insert atomically rechecks `is_active` to prevent a check/write race.

## Confirmed read-only Supabase audit
`public.digiy_loc_master_units.id` is UUID and `is_active` boolean. The V14 draft schema was **not applied**; V17 replaces it with UUID + FK. Do not run both SQL drafts.

## Before production
- Verify private schema exposure settings, role privileges, RLS and actual DB connection configuration.
- Deploy migration only after explicit approval and review of data retention and moderation roles.
- Implement persistent anti-bot and atomic rate limits in trusted server adapters; currently absent.
- Bind `receivePrivateFeedback` to a hardened HTTPS endpoint, measure request size on server, protect against replay, add CORS/origin policy, verify secrets never reach browser.
- Integration-test denied public/owner reads, successful private insert, rate limiting, active/inactive listing, rollback and deletion.
- No publication pipeline and no stay verification in V17.
