# V29 — Full-body authorization findings for LOC queue RPCs

**Read-only catalog review, 2026-10-08. Not a production exploitation test.**
**Operational constraint:** founder reports that the PULSE VPS is stopped/blocked; this has **not been independently verified** and does not automatically revoke Supabase privileges. Do not restart PULSE as part of this remediation.

## Full function definitions inspected in production, without invoking them

1. `public.digiy_loc_pulse_claim_batch(integer)`:
   - PostgreSQL `SECURITY DEFINER`, owned by `postgres`; EXECUTE currently allowed to PUBLIC, anon and authenticated (including explicit grants).
   - Uses `current_setting('app.worker_id', true)` only to populate `locked_by`, defaulting to `pulse-worker`. **This is a worker label, not a caller authorization gate.**
   - Selects records with `status='archived'`, `sent_at IS NULL`, due and unlocked conditions; performs `FOR UPDATE SKIP LOCKED` then changes lock/attempts and `RETURN QUERY` over the complete outbox row.
   - Uses `LIMIT greatest(p_limit,1)` without a maximum bound. Verify the `archived` status business contract; do not change status semantics as part of an ACL-only patch.

2. `public.digiy_loc_pulse_claim_batch(integer,timestamptz,text)`:
   - PostgreSQL `SECURITY DEFINER`, owned by `postgres`; EXECUTE currently allowed to PUBLIC, anon and authenticated.
   - Selects `status='new'` entries due before caller-supplied `p_due_before`, uses `LIMIT p_batch_size FOR UPDATE SKIP LOCKED`, updates status to `sending` and sets `locked_by=p_worker_id`; returns entire outbox rows.
   - The body has no caller identity/role authorization test. Neither `p_worker_id` nor `p_due_before` is a credential or authorization proof. Batch/date bounds are caller-controlled.

3. `public.digiy_loc_outbox_claim_due(integer,text)`:
   - PostgreSQL `SECURITY DEFINER` with PUBLIC/anon/authenticated EXECUTE.
   - Selects pending due jobs with attempt/lock conditions, updates `claimed_by` from caller-supplied `p_worker`, returns `id`, `phone`, `reservation_id`, `room_id`, `pulse_kind`, `due_at`, `payload`.
   - No identity or role authorization guard in the function body; `p_limit` is unbounded.

4. `public.digiy_loc_outbox_mark_sent(uuid)`:
   - PostgreSQL `SECURITY DEFINER`, executable by anon/authenticated.
   - SQL body unconditionally marks matching outbox `id` as `sent`, resets error and updates sent timestamp; no identity or role check visible. Unauthorized state change is possible at the SQL permission boundary if the caller can supply a valid id.

## Security assessment (bounded)

These four definitions confirm a **database-level authorization gap**: PUBLIC-executable `SECURITY DEFINER` functions can read/change private queue state without verifying the invoking principal. Presence on an exposed `public` Data API further increases exposure, but an actual anonymous HTTP exploitation attempt has deliberately **not** been made against production. Live request filtering, external gateways, and worker status remain separately verifiable facts.

Both queue tables have RLS enabled and no direct anon/authenticated SELECT/UPDATE/INSERT grants. This is insufficient to protect postgres-owned SECURITY DEFINER entrypoints.

A request to read the full `digiy_loc_outbox_mark_failed(uuid,text)` body was blocked by platform security checks; do not assert its full semantics from marker tests alone.

## Minimal containment vs complete remediation

- Minimal containment proposals are staged in `trust/sql/v29/OUTBOX_ACL_CANDIDATE.sql` and `PULSE_CLAIM_ACL_CANDIDATE.sql`, removing PUBLIC and explicit anon/auth EXECUTE while preserving service_role, by exact signature.
- They do **not** cover all `digiy_loc_pulse_mark_sent`, fail/retry, enqueue, owner operations or other RPCs. Assess each separately.
- For PULSE VPS **while stopped**, no server process needs to be restarted to implement an independently authorized database containment change. Before any eventual restart, check its current source, authentication role, exact RPC names, notification semantics, and delivery/ACK state handling. Archived worker code is not a current runtime contract.
- **Do not apply SQL to production just because the VPS is stopped.** Staging CI/functional tests, consumer audit and deployment approval remain mandatory. Do not merge V29 SQL as an auto-run migration.
- Preserve DIGIY TRUST V26 fail-closed preflight.

## Tests still needed on isolated PostgreSQL

After fixture tests on PostgreSQL 16/17: verify `anon` and `authenticated` denial for both claim overloads and the LOC claim, legitimate service-role read/claim/ACK, concurrency, queue isolation, limited batch sizes, malformed dates, and rollback. Real pipeline integration tests must use staging data only.

Status: **Reviewed SQL definitions; draft candidates ready; isolated DB runtime tests and production deployment NOT completed.**

## Historical execution telemetry discovered after initial consumer searches

Read-only inspection of `extensions.pg_stat_statements` found:
- `pg_stat_statements_info.stats_reset` = 2025-12-08 07:28:36 UTC. Counts are cumulative, **not live status**.
- A service_role-owned statement template mentioning `digiy_loc_outbox_claim_due` recorded **764,661 calls**.
- Several service_role-owned templates mentioning `digiy_loc_pulse_claim_batch` include **3,999,859** calls for the largest template, plus other high-count templates.

These are real historical statement counts and give strong evidence of past server-side use. They cannot establish that the founder-reported stopped VPS is running now, when the calls occurred, whether other workers still call the functions, or that each recorded statement represents a successful message delivery. Prior zero matches in the last 24 hours of REST gateway logs only cover REST traffic in that window, and are **not** contradictory with older or direct SQL traffic.

**Important preservation rule:** the P0 ACL candidates retain `service_role` EXECUTE; an indiscriminate `REVOKE FROM service_role` would endanger the historical worker contract. Verify actual consumers before staging or deployment.

### SQL overload test correction

The 1-arg `digiy_loc_pulse_mark_sent(p_id uuid)` overload coexists with a 4-arg `digiy_loc_pulse_mark_sent(p_pulse_id uuid, p_provider text DEFAULT NULL, p_message_id text DEFAULT NULL, p_worker_id text DEFAULT NULL)`. Test calls to the 1-arg overload were changed to `p_id => ...::uuid` to resolve precisely by named argument and avoid any overload/default-argument ambiguity. This corrects the synthetic test; it does not change production functions.

No V29 runtime PostgreSQL test execution has been completed in this environment.
