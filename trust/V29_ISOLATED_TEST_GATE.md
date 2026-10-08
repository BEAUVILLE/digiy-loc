# DIGIY SECURITY V29 — PostgreSQL 16/17 isolated validation

**2026-10-08 | STATUS: 8/8 SYNTHETIC POSTGRESQL SUITES PASS; PRODUCTION NOT APPROVED.**

## Executed evidence

GitHub Actions workflow:
[**DIGIY SECURITY V29 isolated PostgreSQL**](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37843794858)

| Isolated synthetic test suite | PostgreSQL 16 | PostgreSQL 17 |
| --- | --- | --- |
| LOC Outbox ACL — `run-ci.sh` | PASS | PASS |
| Retired PULSE claim ACL — `run-pulse-ci.sh` | PASS | PASS |
| Retired PULSE status ACL — `run-pulse-status-ci.sh` | PASS | PASS |
| Legacy PULSE + NDIMBAL trigger isolation — `run-trigger-ci.sh` | PASS | PASS |

**8/8 actual SQL suites completed successfully**, with `psql -X
-v ON_ERROR_STOP=1` executing against four synthetic databases in
each independent ephemeral PostgreSQL service. Runner jobs:

- [PostgreSQL 16 — job 113539479470](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37843794858/job/113539479470)
- [PostgreSQL 17 — job 113539479709](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37843794858/job/113539479709)

Verified job logs contain explicit `V29 ... TESTS PASSED` markers
for all four scripts on both versions. In the trigger test, the
second application of both exact-name disable candidates **must fail**
due to the changed trigger state; those logged SQL `ERROR` entries
are expected negative tests, captured and asserted by `run-trigger-ci.sh`.
Both jobs nevertheless completed with **conclusion=success**.

## Defects discovered and corrected by the real tests

The initial PostgreSQL 16/17 run
[37843643270](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37843643270)
passed all three ACL suites, but the fourth fixture failed the
stronger eight-trigger identity preflight. The source fixture
previously represented every PULSE trigger with the generic
`v29_trace_trigger` function. The real retirement candidate
correctly requires the actual production function name for each
trigger. The fixture was corrected to use seven named synthetic
trigger-function bodies with **no real queue operations**, preserving
all eight original trigger-to-function relationships (commit
`3cd3d02d4b8a5edad59f44c48e54217c089c117d`).
The second run succeeded on **both PostgreSQL versions**.

Earlier fixes, now exercised by the suite, include:

1. NDIMBAL synthetic function identity matches
   `digiy_loc_ndimbal_after_paid()`.
2. The three ACL suites use a transaction-scoped,
   explicitly `anon`/`authenticated`-callable denial helper to
   validate the *target RPC permission*, not the helper's temp schema.
3. Shared cluster roles are initialized once by `ci-roles.psql`.
4. The 1-argument `digiy_loc_pulse_mark_sent` fixture uses named
   `p_id =>` to distinguish overloaded function defaults.
5. PULSE disable preflight and postcheck confirm table, trigger name,
   trigger function identity, and enabled status.

## Source/catalog validation

- Live Supabase `digiy-core` was queried **read-only**. Its PostgreSQL
  catalog matched **8/8 old PULSE** exact table/trigger/function
  triples, and a separate read-only check confirmed the obsolete
  NDIMBAL payment trigger and three non-target triggers.
- Live production still has the old PULSE/NDIMBAL triggers enabled and
  the public ACLs described by V29. **No SQL remediation has been
  applied on production.**
- These existing database objects do not establish participation in
  the current booking path. The founder states old PULSE and NDIMBAL
  are **caduc**, and the old PULSE VPS must never be restarted or
  reconnected to Supabase.

## Limits — NOT a production release certificate

The suites use harmless **synthetic stub function bodies**, not
copies of live business logic, and do not exercise current real LOC
reservation, direct-payment, owner-management, multi-module, or
concurrent notification behavior. They validate the specific ACL and
legacy trigger-isolation contracts and rollback behavior.

Before authorizing production SQL, separately confirm on staging
with synthetic bookings that the **modern** reservation, payment,
cancellation and owner flows are unaffected; review dependencies of
residual NDIMBAL functions/views and PULSE-related RPCs. No data
deletion or blanket trigger revocation is authorized. Preserve
DIGIY TRUST V26 fail-closed behavior.

PR #36 remains **draft, unmerged**. The testing milestone does NOT
grant permission to merge the PR or execute the candidate SQL
against real Supabase.

## Reproducibility

A dedicated workflow lives at
`.github/workflows/trust-v29-isolated-postgres.yml`, runs on pull
requests, and tests both PostgreSQL 16 and 17. The four individual
runners are under `trust/sql/v29/`. They require
`V29_CI_ONLY=1`, `PGHOST=127.0.0.1` and a verified **disposable**
instance, and create separate synthetic test databases.

**Final result: PostgreSQL synthetic V29 gate PASS (8/8); modern
staging non-regression and production-deployment approval remain
OPEN.**
