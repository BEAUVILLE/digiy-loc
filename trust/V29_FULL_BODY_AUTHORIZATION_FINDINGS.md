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
