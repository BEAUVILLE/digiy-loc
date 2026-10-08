# DIGIY LOC V30 — controlled release / GO–NO-GO gate

Status: **DRAFT / NO PRODUCTION DEPLOYMENT**. Prepared October 8, 2026. The following is a release procedure, **not proof of a backup or a completed deployment**.

## Scope and immutable business invariants

- DIGIYLYFE never collects a booking payment; owner/guest contact remains direct. No OTP, WhatsApp, SMS or PULSE/NDIMBAL worker may run in the dry-run.
- Never free an active reservation by writing `available` in the calendar; use an authorized cancellation for a specific reservation. Cancelled reservations stay in history.
- Overlapping active bookings rejected atomically using the MASTER unit lock. Manual closures and legacy/unknown-provenance blocked days are preserved until a human owner checks them.
- The existing v1 reservation insert return shape remains unchanged; Saly and Sarlat clients must be regression-tested.

## Dependency map — keep ALL PRs in draft until release approval

1. **Database** [BEAUVILLE/digiy-loc #38](https://github.com/BEAUVILLE/digiy-loc/pull/38) — SQL candidate and isolated PostgreSQL 16+17, browser staging tests. *Merge does not execute production SQL.*
2. **Saly owner** [BEAUVILLE/part-chez-baptiste #12](https://github.com/BEAUVILLE/part-chez-baptiste/pull/12) — draft V30 UI, including local date parser fix.
3. **Sarlat owner** [BEAUVILLE/pro-espace #7](https://github.com/BEAUVILLE/pro-espace/pull/7) — draft V30 UI.
4. **MASTER future-owner template** [BEAUVILLE/digiy-master-modeles #10](https://github.com/BEAUVILLE/digiy-master-modeles/pull/10) — draft fix replacing legacy direct calendar upsert/delete with `digiy_loc_set_unit_calendar_state_v2`. Its previous form would break on revoked table grants.

**Known inspected clients**: Saly `gestion.html`, Sarlat `loc.html`, master `LOC/MASTER-MAITRE-LOC/gestion.html`, public DIGIY LOC filtering JS, main website `gestion.html`. **This is not a proof that no other deployed copy or integration writes the tables.** Finish deployed caller inventory (other repositories, GitHub Pages versions, Edge Functions, backend jobs, previous owners' copied pages) before revoking grants.

## Read-only production preflight — completed on 2026-10-08

Target: `digiy-core` Supabase project `wesqmwjjtsefyjnluosj`. The exact query is committed as [LOC_MASTER_V30_PREFLIGHT_READONLY.sql](../supabase/candidates/LOC_MASTER_V30_PREFLIGHT_READONLY.sql).

- Eight catalog checks TRUE: seven required reservation columns, essential range/pk constraints, both expected RPC signatures, RLS on both tables and V30 columns not already installed.
- Rows in MASTER reservation table: **0** (a snapshot, not a future guarantee).
- Calendar rows: **81**, all `occupied` or `closed`, **0** unexpected status rows.
- Currently the authenticated role has direct `INSERT/UPDATE/DELETE` privilege on both tables; V30 revokes these.
- Existing v1 calendar RPC is executable by `anon` at the SQL permission layer; V30 revokes that right. Access-check behavior is distinct from grants and must still be exercised.
- **No live table, function, grant or guest record was modified during preflight**.

Re-run preflight immediately before any planned release. If counts/signatures/constraints change or V30 has partly landed, **STOP** and investigate; do not replay the migration blindly.

## Mandatory pre-release backup / restoration proof — NOT YET SATISFIED

1. **Verified:** Supabase organization `DIGIY AFRICA` is on the `free` tier (read-only organization lookup 2026-10-08). **Do not assume automatic daily backups.** Check actual project backup/PITR availability in Supabase Dashboard > Database > Backups, but plan a private logical export regardless. Free-tier logical export is recommended in the official reference: https://supabase.com/docs/guides/platform/backups
2. Export an encrypted, access-controlled logical backup of the relevant database and schema using officially documented Supabase CLI or `pg_dump`, with exact command syntax verified by the CLI `--help`. Include table data, function definitions, constraints, indexes, grants, RLS policies and owner information. A full-project backup is preferable; keep credentials and dumps **outside public GitHub, CI logs and the user-facing chat**.
3. Save a separate private baseline of the four existing RPC definitions, their effective privileges and their owners; record verification hashes and the pre-release row counts (including all **81** calendar rows). The checked-in SQL fixture is test evidence, **not** an adequate recoverable database backup.
4. Restore to a separate non-production environment and verify an actual read of both tables, function signatures and the representative blocked date states. Record where the backup lives and who can authorize recovery. **NO-GO if restore is untested.**
5. Agree on a maintenance window, responsible operator, stop conditions, recovery time objective, and acceptable data-loss window. A whole-project backup/PITR restore affects other DIGIY modules too.

## Planned release order — only after separate approval

1. Freeze changes in affected owner calendars for the short controlled window. Capture preflight/backup evidence and a deployed-client/RPC caller list.
2. Deploy compatible owner interfaces and the corrected MASTER template first, one territory at a time. On an old backend, Saly/Sarlat v2 listing should fall back to v1 and **MUST NOT** offer cancellation. Test that behavior in real owner sessions with **no live booking mutation**.
3. Review SQL candidate [LOC_MASTER_V30_CANDIDATE.sql](../supabase/candidates/LOC_MASTER_V30_CANDIDATE.sql) and compare production schema + privileges once more. Apply the single transactional candidate only with explicit release authorization and operator oversight. Confirm success / PostgreSQL COMMIT; do not use a background workflow or automatic CI migration.
4. After SQL is active, independently validate the two actual owner roles and sites: dates in read-only calendar, owner-created synthetic/test-only booking on an authorized test unit, overlap rejection, manual re-opening rejection, cancellation recording, safe retained unknown-origin days, and cross-owner denial. Test browser and server behavior with a controlled test-account fixture; never touch actual guests.
5. Recheck effective grants: authenticated direct table INSERT/UPDATE/DELETE should be false; `anon` EXECUTE on owner RPC should be false; legitimate `authenticated` RPC execution should remain true. Verify public read/QR, direct contact and pricing remain unaffected.
6. Closely watch owner error rates, stale bookings, denied permissions and calendar consistency; write a timestamped sign-off only after each territory is verified.

## Emergency STOP / restoration

- Before SQL COMMIT, errors inside V30's transaction must abort the candidate; verify that no partial V30 columns/function replacements exist before retrying.
- After SQL COMMIT, first stop owner writes and preserve logs/data. Revert client code to the last known working **version** if the failure is client-only.
- **Do not blindly drop status, cancellation or provenance columns** after live usage: that would destroy business history. Do not clear 81 legacy blocks to make the UI appear green.
- Restoring previous SQL RPCs, object grants and row policies requires a **privately captured exact baseline** and an impact check. Restoring old direct table write privileges reopens the guard bypass, so it is an emergency-only rollback requiring explicit ownership approval.
- If a database restore is unavoidable, restore the verified private backup/PITR via Supabase's supported process after assessing collateral changes in all modules and possible global downtime/data loss. Never automatically perform a whole-project restore from this PR.
- Communicate openly to property owners if a release is rolled back or calendars require manual reconfirmation.

## Current release decision

**NO-GO for production today until:** complete deployed caller inventory, evidence of secure **restored** backup, real-user staging acceptance (both sites), and separate explicit sign-off on SQL production mutation. All four PRs stay **DRAFT**. Pure synthetic tests and a read-only catalog preflight **do not substitute** for these controls.
