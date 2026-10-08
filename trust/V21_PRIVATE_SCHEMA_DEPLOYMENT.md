# DIGIY TRUST V21 — Private schema deployment record

Date: 2026-10-08. Project: digiy-core (`wesqmwjjtsefyjnluosj`).

## Applied
Created PostgreSQL schema `digiy_trust_private` and table `voluntary_feedback` using the V17 schema shape (UUID listing FK to `public.digiy_loc_master_units`, 1–5 rating, optional subratings, comment, declared stay, consent, received-only moderation status, `stay_verified=false`). RLS enabled. No policies. Explicit REVOKE of schema and table permissions for PUBLIC, anon, authenticated. No public endpoint, service deployment or client data inserted.

## Verified with live read-only query
- Schema/table exist.
- `relrowsecurity=true`.
- `anon` and `authenticated` schema USAGE=false.
- `anon` and `authenticated` combined table privileges=false.
- Number of RLS policies: 0.

## Pending before enabling
- Check each individual SELECT/INSERT/UPDATE/DELETE privilege, and confirm schema is absent from exposed PostgREST schemas.
- Validate service role/connection write permissions and an actual private insert in staging or transaction rollback.
- Real anti-bot, persistent atomic quotas, HTTPS endpoint and bounded streaming request handling.
- Retention/deletion policy and moderation permissions, privacy notice, abuse monitoring.
- End-to-end negative access tests using anon, authenticated and owner sessions.

**No public intake activated.** This record describes a production schema change, not a working review collection service.
