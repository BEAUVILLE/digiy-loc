# DIGIY SECURITY V29 — isolated PostgreSQL validation gate

**State: PARTIALLY VALIDATED / NOT DEPLOYABLE.** Updated 2026-10-08.
This report separates **static/source inspection**, **read-only live
catalog verification**, and **actual executable PostgreSQL tests**.
The founder authorizes proceeding with safe validation only: no
production database change, no PR merge by implication, no PULSE or
NDIMBAL reactivation. PULSE/NDIMBAL are retired.

## Confirmed results

1. Read-only `digiy-core` PostgreSQL catalog confirmed **8/8 legacy
   PULSE trigger/table/function triples** match the expected function
   identities and remain enabled. A previous catalog check also
   matched the separately retired NDIMBAL payment-side trigger and
   three explicitly untouched bookkeeping/owner/timestamp triggers.
   **This does not prove those old tables are part of the modern
   booking path.**
2. Corrected synthetic NDIMBAL trigger fixture to use the exact
   `digiy_loc_ndimbal_after_paid()` function name required by the
   candidate's fail-closed preflight. It traces synthetic events
   only; no payment functions or rows are modified.
3. Updated the eight-trigger PULSE candidate preflight and postcheck
   to validate the **associated function identities and public schema**
   in addition to exact table/trigger names and enabled-state.
   The production read-only triple inventory matches these checks.
4. In all three ACL-denial suites, replaced the role-switched
   `pg_temp` test helper with a transactional
   `public.v29_expect_denied(text)` SECURITY INVOKER helper and
   explicit `anon`/`authenticated` EXECUTE. This avoids making
   temporary-schema permissions an accidental source of test failure.
   Each test helper is discarded by the test transaction's rollback.
5. Shared fixture roles are initialized via `ci-roles.psql`, not
   recreated three times in a single cluster; tests use separate
   named databases containing **synthetic data only**.
6. No SQL permission change, trigger toggle, worker restart,
   historical data deletion, or payment/reservation mutation was
   performed on the live Supabase project.

## Actual executable tests STILL NOT RUN

No `postgres`, `initdb`, or `psql` executable/isolated server was
available in the current execution container, and the runtime cannot
reach GitHub/apt package servers to install PostgreSQL. Supabase
`list_branches` returned no isolated branch. Another existing project
was inactive and **was not used or reactivated**. Creating a billable
branch or project without explicit cost confirmation is prohibited.

The repository's existing GitHub V26/TRUST workflows do not invoke
the V29 SQL suites. **Green existing CI is not a V29 PostgreSQL pass.**
No unexecuted SQL test should be reported as green.

## Reproduce on verified disposable PostgreSQL 17 (then 16)

Set up a local, isolated PostgreSQL 17 instance on the user's machine
or in a controlled CI environment, with no port-forward to Supabase,
no production credentials, and the repo checkout. From repo root:

```bash
V29_CI_ONLY=1 PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres \
  bash trust/sql/v29/run-ci.sh

V29_CI_ONLY=1 PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres \
  bash trust/sql/v29/run-pulse-ci.sh

V29_CI_ONLY=1 PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres \
  bash trust/sql/v29/run-pulse-status-ci.sh

V29_CI_ONLY=1 PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres \
  bash trust/sql/v29/run-trigger-ci.sh
```

These commands create **four named test databases** and fixture SQL
roles on the disposable server. The guard `PGHOST=127.0.0.1` is not
enough by itself to prevent a tunnel, so independently verify the
endpoint's identity before execution. Failures must block any
deployment; do not test against real Supabase production.

## Staging and release gates remain

- Run the four suites on disposable PostgreSQL and capture
  exit status, output, SQL version, and test artifacts.
- Negative test: renamed/reassigned legacy trigger or unapproved
  privilege leaves candidate transaction unapplied.
- Real-system **staging only**, with synthetic data: verify modern
  reservation, direct-payment, owner, cancellation and location flows
  function without the retired PULSE/NDIMBAL wiring.
- Separately review remaining public legacy RPCs, NDIMBAL views,
  functions and ancillary triggers; do not drop historical data.
- Prepare a reversible SQL deployment with exact ACL/trigger
  before-and-after checks, and obtain **separate explicit approval**
  for GitHub merge and production DB changes.

**Current result: preparation strengthened and read-only catalog
preflight confirmed; executable V29 validation not yet available.**
