# DIGIY SECURITY V29 — PostgreSQL 16/17 isolated validation

**2026-10-08 | STATUS: 10/10 POSTGRESQL SUITES PASS (SYNTHETIC DATA); PRODUCTION NOT APPROVED.**

## Executed evidence

GitHub Actions workflow:
[**DIGIY SECURITY V29 isolated PostgreSQL**](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37845239099)

| Isolated synthetic test suite | PostgreSQL 16 | PostgreSQL 17 |
| --- | --- | --- |
| LOC Outbox ACL — `run-ci.sh` | PASS | PASS |
| Retired PULSE claim ACL — `run-pulse-ci.sh` | PASS | PASS |
| Retired PULSE status ACL — `run-pulse-status-ci.sh` | PASS | PASS |
| Legacy PULSE + NDIMBAL trigger isolation — `run-trigger-ci.sh` | PASS | PASS |
| Real LOC public/owner RPC SQL before + after retirement — `run-modern-ci.sh` | PASS | PASS |

**10/10 actual SQL suites completed successfully**, with `psql -X
-v ON_ERROR_STOP=1` executing against five synthetic databases in
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

The legacy PULSE/NDIMBAL suites use harmless **synthetic stub function
bodies**. The fifth suite uses the exact **2026-10-08 production SQL
function definitions** of `digiy_loc_public_room_by_slug`,
`digiy_loc_master_save_reservation_v1` and
`digiy_loc_master_list_reservations_v1` and
`digiy_loc_set_unit_calendar_state_v2` on **synthetic schemas/data**.
It proves their public and owner-facing SQL behavior before and after
retiring the nine legacy triggers in isolation, **not** full live
payment processing, actual browser integrations, wider booking modules,
or concurrent notification behavior.

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
requests, and tests both PostgreSQL 16 and 17. The five individual
runners are under `trust/sql/v29/`. They require
`V29_CI_ONLY=1`, `PGHOST=127.0.0.1` and a verified **disposable**
instance, and create separate synthetic test databases.

**Final result: PostgreSQL synthetic V29 gate PASS (10/10); selected
public/owner SQL contracts replayed; end-to-end staging non-regression,
payment and production-deployment approval remain OPEN.**

## Real public + owner SQL replay — fifth suite

[**Successful CI run 37845239099**](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37845239099)
ran **five suites per PostgreSQL version** (16, 17). The modern
suite emitted explicit `V29 MODERN LOC PUBLIC + OWNER CONTRACTS PASSED`
markers **before** and **after** deactivating old PULSE/NDIMBAL triggers.

`trust/sql/v29/modern-contract-fixture.psql` replays exact SQL
function definitions retrieved **read-only from production PostgreSQL**
on 2026-10-08 for `digiy_loc_public_room_by_slug`,
`digiy_loc_master_save_reservation_v1`, and
`digiy_loc_master_list_reservations_v1`.
All fixtures (owner IDs, room slugs, contacts and bookings) are
synthetic; no live customer rows, access tokens or credentials were
copied. These definitions are **dated source snapshots**, which must
be compared again with production at release time.

The verified SQL contracts include:

- Public room visible with owner WhatsApp contact; hidden/missing
  room refused.
- Anonymous invocation of owner RPCs refused.
- Missing authentication refused; foreign owner cannot read/write
  another owner's unit.
- Invalid stay dates / empty guest name refused.
- Authorized owner saves a reservation and sees it on listing, with
  three occupied calendar days.
- Legacy trigger trace stays empty during modern master operations,
  both before and after PULSE/NDIMBAL retirement.
- Transaction rollback leaves no added synthetic reservations.

**Still not tested:** the complete current browser + external direct
payment/WhatsApp paths, all other LOC owner endpoints, and a production
deployment. Do not call this a full staging pass. No production SQL
or data changed, and no retired service was restarted.

## Extra validation: Saly/Sarlat MASTER calendar control — 2026-10-08

The public Saly card links to `part-chez-baptiste.digiylyfe.com`
rather than the generic `loc.digiylyfe.com/fiche.html`. Its public
page reads calendar and price data from MASTER tables. The owner
page `BEAUVILLE/part-chez-baptiste/gestion.html` uses
`digiy_loc_master_save_reservation_v1`,
`digiy_loc_master_list_reservations_v1`, and
`digiy_loc_set_unit_calendar_state_v2`. A connected owner page
in `BEAUVILLE/pro-espace/loc.html` also references these RPCs.

The fifth SQL fixture now snapshots the **fourth real PostgreSQL
RPC**, `digiy_loc_set_unit_calendar_state_v2(uuid,date[],text)`,
read-only from `digiy-core`, and replays its definition with
synthetic owners/units on disposable PostgreSQL 16 and 17. Added:
anonymous EXECUTE denial, foreign-owner denial, invalid-status
denial, owner date closure, reopening, occupied state, and calendar
row effects. Checks run both before and after targeted PULSE +
NDIMBAL trigger-disable candidates.

**Executed successful CI proof**:
[run 37850889031](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37850889031).
Both PostgreSQL 16 and 17 passed all **5 suites each (10/10)**.

First attempt [37850748305](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37850748305)
identified a *test fixture privilege assumption*: directly
checking calendar table rows under `SET ROLE authenticated`
requires a separate table SELECT GRANT/RLS model; our focused
fixture replays functions but intentionally omits live table
RLS policy definitions. The test now checks the function behavior
as `authenticated`, then checks persisted synthetic table effects
as the disposable fixture administrator, and rolls back. The
underlying live table RLS policies and grants were separately
inspected **read-only**, not simulated in this test.

**Limits**: does not show a real browser successfully completing
OTP or owner login, does not exercise a booking or cancellation
against production, does not verify Sarlat web source line-for-line,
and does not resolve how canceling a MASTER reservation reconciles
its row and occupied calendar dates. A live end-to-end test on
authorized isolated staging remains required before merge/deploy.

PR #37 generic fiche fix has since been **merged** on `main`,
commit `9069cba2f51c04c0cca34ac7a88f1d15041f8990`,
with GitHub Pages deployment succeeded. It is independent of
**PR #36 still in draft and NOT merged**.

## MASTER cancellation and overlap: negative probes (NOT resolved)

The fifth PostgreSQL suite now separately executes
`trust/sql/v29/master-cancellation-gap-test.psql` and
`trust/sql/v29/master-overlap-risk-test.psql`, in disposable
transactions both **before and after** legacy trigger isolation.

These are **expected-current-behavior probes**, not fixes or
acceptance tests for cancellation. They verify that:

1. The real MASTER save RPC writes a reservation + occupied calendar
   days, while the real `set_unit_calendar_state_v2('available')`
   frees the days **without removing the reservation row** from
   owner list/ledger. It does not cancel the reservation.
2. Overlapping synthetic reservations can both be saved; releasing
   some days can leave a second reservation in the ledger while
   its calendar dates misleadingly appear available.

No live data was touched, both trials roll back, and neither issue
is asserted to have occurred for any real customer. See
`trust/V29_MASTER_CANCELLATION_DEPENDENCIES.md` for schema sources,
user-experience consequences, shared-agent-queue dependencies and
a separate proposal for explicit, atomic cancellation.

**The green matrix intentionally demonstrates these known limits.**
Actual resolution requires a separate reviewed schema + API + UI
change and isolated staging tests, not the V29 PULSE/NDIMBAL cleanup.
