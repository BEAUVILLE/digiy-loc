# DIGIY SECURITY V29 — staged SQL proposals

**REVIEW-ONLY. NOT A DATABASE MIGRATION. NOT DEPLOYABLE FROM MAIN.**
These files intentionally live outside production migration directories.
Do not run the candidates against `digiy-core` or any real LOC database.
TRUST V26 must remain fail-closed independently.

## Proposals

- `OUTBOX_ACL_CANDIDATE.sql` restricts only
  `digiy_loc_outbox_claim_due(integer,text)`,
  `digiy_loc_outbox_mark_sent(uuid)` and
  `digiy_loc_outbox_mark_failed(uuid,text)`.
- `PULSE_CLAIM_ACL_CANDIDATE.sql` separately restricts only
  the `digiy_loc_pulse_claim_batch(integer)` and
  `digiy_loc_pulse_claim_batch(integer,timestamptz,text)` overloads.
- Each proposal preserves `service_role`, revokes both `PUBLIC`
  inheritance and explicit `anon/authenticated` grants, checks
  exact function signatures and fails on permission assertion drift.

**Neither proposal by itself secures every LOC notification RPC.**
See `trust/V29_LOC_PULSE_FAMILY_AUDIT.md` for the broader family.

## Isolated PostgreSQL fixture checks

On a **fresh, disposable localhost PostgreSQL 16 or 17**, with
`createdb`, `psql` and a privileged test user, run from the repo root:

```sh
V29_CI_ONLY=1 PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres \
  bash trust/sql/v29/run-ci.sh

V29_CI_ONLY=1 PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres \
  bash trust/sql/v29/run-pulse-ci.sh
```

**Do not use port-forwarding, tunnels, or real DB credentials.**
The scripts create databases named `trust_v29_outbox_ci` and
`trust_v29_pulse_ci` and use synthetic rows. They intentionally refuse
to run unless `V29_CI_ONLY=1` and `PGHOST=127.0.0.1`. These guards
are operational tripwires, **not** cryptographic proof that localhost
is an isolated instance; verify the endpoint manually.

The fixtures verify public grants existed initially, ACL postconditions,
both anon/authenticated denial and service-role access, preservation of
unrelated functions, synthetic data rollback, and SQL reapplication.
They do **not** reproduce live function internals, concurrency, or
booking notification integrations; those need separate staging tests.

## Release blockers

1. Obtain current VPS/worker source, runtime secrets *names only*,
   database role, and live call chain. Never expose key values.
2. Review complete live PostgreSQL function definitions, including
   the claim overload containing `current_setting`, and dependencies.
3. Run and inspect PostgreSQL 16/17 isolated fixture results; then
   test the real LOC worker, booking flow, owner flow, and retries
   against a staging environment without private client data.
4. Assess remaining `digiy_loc_pulse_mark_sent` overloads,
   `fail_backoff`, `retry`, enqueue and mark-seen endpoints.
5. Separate authorization to merge GitHub changes from authorization
   to deploy DB SQL. Preserve a validated rollback procedure.
6. Do not activate DIGIY TRUST V26 through or because of V29.

At creation time the V29 SQL fixtures had **not run**: this session
had no isolated PostgreSQL server and GitHub workflow creation was
blocked. Existing V26 CI successes do not validate these V29 tests.

## Third distinct candidate: server-side status transitions

`PULSE_STATUS_ACL_CANDIDATE.sql` restricts three additional,
full-body-reviewed functions: `digiy_loc_pulse_mark_sent(uuid)`,
`digiy_loc_pulse_mark_sent(uuid,text,text,text)`, and
`digiy_loc_pulse_fail_backoff(uuid,text,text,text)`.
They are postgres-owned SECURITY DEFINER and have explicit PUBLIC,
anon and authenticated EXECUTE. The reviewed function bodies update
notification delivery state without caller authorization. Keep all
booking/owner-facing RPCs out of this blanket containment.

A separate synthetic local fixture and runner are included:

```sh
V29_CI_ONLY=1 PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres \
  bash trust/sql/v29/run-pulse-status-ci.sh
```

**Release caution:** the PULSE VPS was reported stopped by the founder,
not independently inspected. This does not automatically close database
RPC access and does not confirm that other worker clients are absent.
Leave the VPS stopped during read-only verification and testing; before
any restart, validate its active source, role, RPC signatures, and
delivery states. The three PULSE candidates are independent SQL
proposals; none has been deployed.

## Founder decision — do not reconnect PULSE VPS to Supabase (2026-10-08)

The founder identifies the historical high-volume PULSE/Outbox calls as loops caused by an incorrect connection. **Those counters must not be presented as healthy business activity or evidence that a PULSE worker should be restored.** This is a founder-supplied root-cause diagnosis, distinct from what the read-only database telemetry alone can prove.

**Operational decision: PULSE VPS stays stopped. Do not restart it, introduce it into Supabase, reconnect a worker, create a new PULSE bridge, or deploy any PULSE runtime, RPC integration, scheduled job, or webhook as part of V29.** There is no requirement to preserve a *future* PULSE connection. Historical `service_role` statements merely establish previous technical calls, and may represent loops.

The existing PostgreSQL functions and public EXECUTE grants are already present; this security review may still prepare **isolated, non-deployed least-privilege ACL candidates** to contain existing permissions. Such review is **not** an instruction to reintroduce PULSE or to automatically grant any live server access. Changing or retiring existing functions requires dependency analysis, isolation tests and a separate, explicit approval. Keep payment, reservations, owners, LOC and DIGIY TRUST independent of this abandoned runtime.
