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

1. Keep retired PULSE VPS stopped and disconnected. Verify only the
   *remaining* current database consumers and legacy SQL dependencies;
   no server restarts, keys, bridges, or reconnects.
2. Review complete live PostgreSQL function definitions, including
   the claim overload containing `current_setting`, and dependencies.
3. Run PostgreSQL 16/17 synthetic fixture tests and verify modern
   booking, direct payment, and owner flows independently on staging.
   Do not test or restore a PULSE VPS worker.
4. Assess remaining `digiy_loc_pulse_mark_sent` overloads,
   `fail_backoff`, `retry`, enqueue and mark-seen endpoints.
5. Separate authorization to merge GitHub changes from authorization
   to deploy DB SQL. Preserve a validated rollback procedure.
6. Do not activate DIGIY TRUST V26 through or because of V29.

**SQL validation executed successfully:** the new
`.github/workflows/trust-v29-isolated-postgres.yml` workflow has
run all four synthetic PostgreSQL suites on versions **16 and 17**
(**8/8 succeeded**). Results:
https://github.com/BEAUVILLE/digiy-loc/actions/runs/37843794858
Detailed evidence: `trust/V29_ISOLATED_TEST_GATE.md`.
Existing V26 green checks alone are not V29 evidence.

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
Leave PULSE VPS permanently disconnected for this program: restarting
it is NOT a remediation goal. Assess existing RPC permissions as
legacy database exposure independently; none of the draft SQL has
been deployed.

## Founder decision — do not reconnect PULSE VPS to Supabase (2026-10-08)

The founder identifies the historical high-volume PULSE/Outbox calls as loops caused by an incorrect connection. **Those counters must not be presented as healthy business activity or evidence that a PULSE worker should be restored.** This is a founder-supplied root-cause diagnosis, distinct from what the read-only database telemetry alone can prove.

**Operational decision: PULSE VPS stays stopped. Do not restart it, introduce it into Supabase, reconnect a worker, create a new PULSE bridge, or deploy any PULSE runtime, RPC integration, scheduled job, or webhook as part of V29.** There is no requirement to preserve a *future* PULSE connection. Historical `service_role` statements merely establish previous technical calls, and may represent loops.

The existing PostgreSQL functions and public EXECUTE grants are already present; this security review may still prepare **isolated, non-deployed least-privilege ACL candidates** to contain existing permissions. Such review is **not** an instruction to reintroduce PULSE or to automatically grant any live server access. Changing or retiring existing functions requires dependency analysis, isolation tests and a separate, explicit approval. Keep payment, reservations, owners, LOC and DIGIY TRUST independent of this abandoned runtime.

## Test-cluster compatibility fix

PostgreSQL roles are **cluster-wide**: the original three independent fixture
scripts each attempted to execute `CREATE ROLE anon`, `authenticated`,
and `service_role`, which would fail after the first fixture in a shared
disposable PostgreSQL server.

All three fixtures now `\\ir ci-roles.psql`, which creates these roles only
if absent and rejects unsafe pre-existing role attributes. Each runner
continues to create its own separate disposable *database*. This is a
fixture-only correction; it does not modify application auth or the
production Supabase project.

**Testing status:** real disposable PostgreSQL 16/17 runs succeeded
for Outbox ACL, PULSE claim ACL, PULSE status ACL and legacy PULSE +
NDIMBAL trigger isolation (8/8 suites). These are **synthetic** tests;
the modern LOC reservation/payment/owner staging non-regression test
and separate production approval are still required.

## Founder correction — legacy PULSE and NDIMBAL both CADUC

The founder explicitly states that **the old PULSE has no involvement in
current reservations**, and **NDIMBAL is also out of service**. Do not call
either a live dependency, do not reconnect PULSE, and do not restore NDIMBAL.

The database metadata still shows legacy triggers enabled on older
reservation-related tables. Such a trigger runs *if its table is written*
but `tgenabled='O'` does **not prove** the modern booking workflow uses it.

Two **separate** review-only trigger-isolation proposals now exist:

- `PULSE_TRIGGER_DISABLE_CANDIDATE.sql`: targets only the eight old PULSE
  triggers on legacy reservation tables; does **not** touch NDIMBAL.
  It guards three non-PULSE triggers (payment-related, owner assignment,
  timestamp) against incidental changes, without asserting they belong to
  today's live workflow.
- `NDIMBAL_PAYMENT_TRIGGER_DISABLE_CANDIDATE.sql`: independently targets
  only `trg_ndimbal_after_paid` on `public.digiy_loc_reservations`.
  On historical `payment_status='paid'` updates it used to insert an
  NDIMBAL contribution row; this is **not the payment processor itself**.
  Other NDIMBAL timestamp-maintenance triggers are documented but are not
  part of this narrow candidate.

**Nothing is applied.** Neither SQL file is a production migration.
Independent validation/approval remains mandatory before disabling
legacy database triggers; no data deletion, no service reintroduction.

## Dedicated V29 PostgreSQL test workflow — executed

The PR contains `.github/workflows/trust-v29-isolated-postgres.yml`,
which runs the four SQL test scripts against isolated temporary
PostgreSQL **16** and **17** services; **all eight suites passed**.
Run: https://github.com/BEAUVILLE/digiy-loc/actions/runs/37843794858

Expected negative-test SQL errors occur when the two legacy trigger
disable candidates are intentionally applied a second time: the
scripts assert that changed-state drift fails closed. These are
successful negative tests, not deployment failures.

This does **not** mean PULSE or NDIMBAL should be restarted. They
remain retired; no production migrations have been performed.
