# DIGIY LOC V30 — controlled release / GO–NO-GO gate

Status: **DRAFT / NO PRODUCTION DEPLOYMENT**. Prepared October 8, 2026. The following is a release procedure, **not proof of a completed V30 deployment**.

> **LATEST CHECKPOINT — 2026-10-09 07:24 UTC:** The founder has now completed a **REAL encrypted DIGIY CORE SQL restore** to an isolated no-network Docker PostgreSQL database on the private Mac. The operator's sanitized terminal output includes `ISOLATED_RESTORE_SQL_OK`, `ISOLATED_RESTORE_PROOF_OK` (81/81, 0 MASTER bookings) and `ISOLATED_RESTORE_PRODUCTION_UNTOUCHED`. A new live production **read-only 8/8 preflight** confirms 61 Saly + 20 Sarlat legacy blocked dates untouched, 0 reservations, V30 schema NOT deployed. **The old 02:00–03:29 statements below saying the genuine restore has never happened are HISTORICAL and SUPERSEDED.** [Complete dated evidence, exclusions, current PR heads and STOP gates](LOC_V30_REAL_RESTORE_CHECKPOINT_2026-10-09.md). **Real owner acceptance, deployed direct-write caller inventory and separate express SQL release approval are STILL PENDING; V30 stays NO-GO.**


## Verified checkpoint — 2026-10-09 02:00 UTC (read-only / no release)

**Backup connectivity and archive: PASS.** Existing daily DIGIY CORE backup workflow
[run #73, attempt 2](https://github.com/BEAUVILLE/admin-digiy/actions/runs/37870420013)
completed successfully. A **nonempty 1,390,605-byte encrypted GitHub Actions artifact**
[digiy-supabase-2026-10-09T01-46-26Z](https://github.com/BEAUVILLE/admin-digiy/actions/runs/37870420013/artifacts/11590062979)
was uploaded, artifact ID `11590062979`, expiring 2026-11-08 (30-day retention).
Pre-archive script completed SHA-256 manifest/checksum generation, AES-256-CBC/PBKDF2
encryption and a decrypt + gzip integrity check. GitHub upload and job concluded `success`.
The backup contains database roles, schema, data, and saved migration history.

**Critical scope exclusions:** The archived Storage coverage is **metadata_only**:
the actual bytes of Supabase Storage objects were **not** backed up (optional service
secrets absent). No independent offsite copy exists (S3 is not configured).
An intact compressed archive and checksum do **not** establish that a real restore works.
A private **isolated restoration is NOT YET TESTED**; V30 production migration remains **NO-GO**.

**Live V30 preflight repeated on 2026-10-09 02:00:43 UTC**, using the committed
`LOC_MASTER_V30_PREFLIGHT_READONLY.sql` on DIGIY CORE project
`wesqmwjjtsefyjnluosj`: eight/eight catalog boolean checks `true`,
MASTER reservations **0**, calendar rows **81**, occupied or closed **81**,
unexpected statuses **0**. Both tables have RLS enabled. No V30 schema columns
were present. Historic 81 blocks remain untouched and must default to blocked.
Authenticated role still has direct write grants on both tables, and `anon` SQL
EXECUTE remains on the legacy v1 calendar function; this is the pre-migration
baseline, **not** an authorization fix.

**Independent draft PR checks at current heads, all successful**:
[server SQL isolation](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37861453541),
[owner browser isolation](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37861453555),
[MAÎTRE contract](https://github.com/BEAUVILLE/digiy-master-modeles/actions/runs/37857692004),
[MAÎTRE mobile browser](https://github.com/BEAUVILLE/digiy-master-modeles/actions/runs/37857692007),
[Saly owner UI](https://github.com/BEAUVILLE/part-chez-baptiste/actions/runs/37855318212),
[Sarlat owner UI](https://github.com/BEAUVILLE/pro-espace/actions/runs/37854179764).

**Next controlled actions, not yet completed:** prove a real restore to an authorized
*separate* environment with secrets handled privately; verify live deployed caller
compatibility before table grants are revoked; obtain Saly and Sarlat real-owner
acceptance without touching real guest bookings; and seek separate express approval
for any production V30 SQL release. Do not create a billable Supabase project or
branch without an informed cost agreement, and never restore into DIGIY CORE.

## 2026-10-09 02:20 UTC — Verified synthetic encrypted restore in GitHub

**PASS, but synthetic only:** [GitHub Actions run 37874031403](https://github.com/BEAUVILLE/admin-digiy/actions/runs/37874031403) on [admin-digiy draft PR #13](https://github.com/BEAUVILLE/admin-digiy/pull/13) passed **37/37** isolated tests and executed a full SQL restore using an artificially encrypted archive inside the temporary `supabase/postgres:17.6.1.173` container with Docker `--network none`. SHA-256 encrypted and internal manifests, decryption, roles/schema/COPY, and read-only aggregate proof **81/81 fictional blocked calendar days**, 0 MASTER reservation rows and one synthetic RPC all passed. No real owner, guest, password or production database was accessed.

**Do not conflate this with real backup recovery:** The genuine 2026-10-09 archive [artifact 11590062979](https://github.com/BEAUVILLE/admin-digiy/actions/runs/37870420013/artifacts/11590062979) **has never been restored**. A GitHub connector security restriction prevented creation of a workflow using the real archive and private encryption passphrase; this was respected, not circumvented. The official test remains **NO-GO for V30** until an authorized secure operator proves restoration of the real dump on a different database, confirms full extension/roles/schema/data compatibility, and signs off. Storage objects are still metadata-only and no offsite copy exists. This CI fixture is proof that the *isolated test harness* works, not proof that *DIGIY CORE data* is recoverable.

## 2026-10-09 02:36 UTC — Three-client contract guard and expanded owner-browser tests

**PASS, fully isolated.** [Owner browser + three-client source check](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37875321844) passed all **12/12 Playwright tests** across owner screens Saly and Sarlat (6 each), including:
- real V30-candidate HTML with mocked API: explicit per-booking cancellation, retained history and zero outbound customer/payment events;
- safe v1 history fallback, without ever offering cancellation when V30 is unavailable;
- no fallback on permission errors;
- fail-closed if cancellation RPC refuses with OWNER_FORBIDDEN or returns an unconfirmed result;
- legacy/unknown-provenance dates remain blocked and an owner review warning is shown.

The same CI checks **three pinned candidate heads**, not deployed HTML:
- Saly [owner PR #12](https://github.com/BEAUVILLE/part-chez-baptiste/pull/12), head `d347e34e982be162315e872eb60d05be8e97c56a`;
- Sarlat [owner PR #7](https://github.com/BEAUVILLE/pro-espace/pull/7), head `d3c3475e07db9e919e1413190582a00fdc9bcf83`;
- MAÎTRE [factory PR #10](https://github.com/BEAUVILLE/digiy-master-modeles/pull/10), head `e2d54d1546af4b5432f7a71b92bd5dc96fbd8676`.

A source-level guard verifies required v1/v2/cancellation RPCs and rejects direct `insert/upsert/update/delete` chaining from the MASTER calendar table in these three snapshots. It observed read-only calendar call sites: **Saly 2, Sarlat 3, MAÎTRE 2**. It cannot prove there are no alternate or generated writers in deployed copies.

**[PostgreSQL 16+17 SQL isolation](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37875321879) also PASS on both versions:** migrated schema and RLS/grants postcheck, owner boundaries, safe cancellation, provenance preservation, and serialized concurrent-write rejection (exactly one booking survives; the racing overlapping writer fails as intended).

**GitHub Pages deployment comparison, read-only GitHub evidence:**
- Saly `main` at `ca17270e2daf8a0b27aafebd795fd20878458d30`, [latest successful Pages build](https://github.com/BEAUVILLE/part-chez-baptiste/actions/runs/36714065404) from the same SHA; V30 PR #12 **not deployed**.
- Sarlat `main` at `3395749759e49fac3e0aaa085713b62e794f59fe`, [latest successful Pages build](https://github.com/BEAUVILLE/pro-espace/actions/runs/37018334605) from the same SHA; V30 PR #7 **not deployed**.
- MAÎTRE `main` at `08196f890674502ddfb3af28ed92846eeb4e5174` still contains legacy direct calendar mutation; the candidate PR #10 removes it. Repository has no GitHub Pages build in checked runs. **Do not revoke direct table grants while known deployed/legacy copies may still write directly.**
- The live HTML endpoints could **not be inspected externally** in this check, so deployment SHA evidence must not be mistaken for live HTTP parity.

**UNCHANGED STOP GATES:** genuine encrypted backup artifact 11590062979 must be restored on a separate authorized target (never happened); legacy/deployed clients outside tracked branches remain to be confirmed; then authorized Saly/Sarlat owner-session acceptance, separate sign-off before mutating any production SQL. All four PRs remain DRAFT; no guest, calendar or permission rows were changed by these tests.

## 2026-10-09 02:43 UTC — Independent genuine encrypted-artifact retrieval + live HTML HTTP attestation

**Actual GitHub encrypted artifact retrievability and ciphertext integrity: PASS.** The GitHub connector independently downloaded [artifact 11590062979](https://github.com/BEAUVILLE/admin-digiy/actions/runs/37870420013/artifacts/11590062979) from the successful [backup #73](https://github.com/BEAUVILLE/admin-digiy/actions/runs/37870420013). Read-only ZIP verification confirmed:
- ZIP length **1,390,605 bytes** and SHA-256 `4cdf28d4b1fe16b273e17a7b670b742ff0ac52ca22c53c455b9f1697e0125318`, matching the original GitHub upload log;
- ZIP CRC/integrity check succeeded; precisely **two members**, one encrypted `.tar.gz.enc` (**1,390,032 bytes**) and one `.sha256` manifest;
- encrypted member SHA-256 **matches** the sidecar manifest; OpenSSL salted-format header is present;
- **No decryption and no access to client plaintext was attempted or claimed.** Local materialized ZIP is temporary inspection material and is not published to the repository.

**Live deployed source parity: PASS.** The new strictly read-only [published owner HTML CI run 37875920843](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37875920843) executed exactly two bounded anonymous HTTPS GETs, with no JavaScript execution, no credentials, and no Supabase API / owner actions:
- **Saly** `https://part-chez-baptiste.digiylyfe.com/gestion.html` exactly matched GitHub `main` commit `ca17270e2daf8a0b27aafebd795fd20878458d30` bytes using SHA-256 comparison.
- **Sarlat** `https://pro-espace.digiylyfe.com/loc.html` exactly matched GitHub `main` commit `3395749759e49fac3e0aaa085713b62e794f59fe` bytes using SHA-256 comparison.

This verifies that the currently published owner HTML is the tracked legacy version, **not** the V30 draft. It does **not** verify live authenticated sessions, hidden deployed clients, server-side booking behavior, or a full recovery. The public read-only check must be revised to compare against new authorized commits during the future release. **All four V30 PRs remain DRAFT / NO PRODUCTION DDL/DML.**

**Release STOP gate unchanged:** genuine encrypted archive has never been *decrypted and restored* into an isolated database with the true schemas/data; that still needs a separately authorized secure operator path before a V30 production migration. Storage object bytes and independent offsite copies are not present in the current backup configuration.

## 2026-10-09 02:47 UTC — exact site-level production baseline and safer source guard

**Read-only live preflight repeated** on `digiy-core` at `2026-10-09 02:47:41 UTC`: all **8/8** catalog checks TRUE, **0** current MASTER reservation rows, **81** calendar blocked rows, **0** unexpected statuses, V30 columns not present. No SQL mutation.

**Confirmed territory split**, verified by the committed [`LOC_MASTER_V30_TERRITORY_BASELINE_READONLY.sql`](../supabase/candidates/LOC_MASTER_V30_TERRITORY_BASELINE_READONLY.sql) using read-only Supabase SQL: `saly-chez-baptiste` **61** occupied/0 closed, `sarlat-chez-baptiste` **20** occupied/0 closed, total **81**. All are currently legacy/unknown origin since provenance column has not yet been installed. Avoid asserting that a particular row corresponds to an active reservation; this table is only an occupancy snapshot. **Keep all 61+20 blocked.**

**Regression-detection strengthened:** owner candidates source guard now fails closed on direct INSERT/UPDATE/DELETE/UPSERT, assignment/alias of a calendar table query, dynamically selected table aliases not provably read-only, drift in table callsite count and missing reservation/cancellation RPC contracts. [GitHub browser run 37876351626](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37876351626) completed **14/14 source guard regression tests**, verified exact permitted Saly/Sarlat/MAÎTRE candidate sources, and completed **12/12 browser tests** for the two owner pages. This guard is intentionally conservative and covers **pinned checked-out sources only**, not uninspected deployed scripts.

**Synthetic SQL workflow** [run 37876351667](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37876351667) succeeded on PG16 + PG17. A subsequent CI enhancement exercises the new territory baseline query **both before and after** the synthetic V30 migration, ensuring it survives the addition of the provenance column. This does not change the genuine database.

**Remaining STOP / NO-GO:** still no authorized recovery proof on the genuine encrypted backup artifact, no verified authenticated real-owner rollout, and no separate production SQL sign-off. Production sites keep their existing published versions. Four V30 PRs remain DRAFT, with no production DDL/DML.

## 2026-10-09 03:06 UTC — Historic 61+20 calendar migration rehearsal PASSED

**Real test execution (synthetic data):** [GitHub Actions SQL PG16+PG17 run 37877652934](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37877652934) completed successfully on both PostgreSQL versions. Before the V30 migration, the disposable test databases were seeded with **61 fake occupied days for Saly** and **20 fake occupied days for Sarlat**, deliberately using synthetic 2025 dates that do not reproduce any real customer's itinerary.

The newly isolated `tests/loc-master-v30/historic-calendar-ci.sh` guard checked that ALL **81** days were still occupied with legacy unknown provenance **before AND after** the V30 candidate migration. The check fails on missing blocks, status drift, changed provenance, unexpected third sites, and an incorrect Saly/Sarlat count. Added contract assertions also explicitly attempt to book an already occupied historical day in **each** territory, requiring the `BOOKING_DATES_BLOCKED` refusal from the real candidate RPC. Both PostgreSQL test matrices remained green, including cancellation/owner permissions, post-migration grants/RLS and simultaneous overlapping-booking rejection.

A transient earlier **test-runner script corruption** caused [failure 37877359662](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37877359662) in the **synthetic** pipeline, not on production. The CI runner was repaired from its last good revision, restored source verified byte-for-byte, and successful reruns are [37877555587](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37877555587) and **37877652934**, the latter including BOTH historic-day booking-denial assertions.

**This proves a controlled SQL migration on synthetic historical rows, NOT restoration of the real encrypted DIGIY CORE backup.** Genuine backup restore in a separate authorized environment and true owner-session acceptance remain **NO-GO release gates**. No real calendar dates, bookings, guest information, permissions or production schemas were changed.

## 2026-10-09 03:15 UTC — Genuine CORE restore environment compatibility probe

**New verified live production environment (READ ONLY):** DIGIY CORE PostgreSQL **17.6** has **nine required database extensions**: `pg_cron` (`pg_catalog`), `pg_net` (`extensions`), `pg_stat_statements` (`extensions`), `pg_trgm` (`public`), `pgcrypto` (`extensions`), `supabase_vault` (`vault`), `unaccent` (`public`), `uuid-ossp` (`extensions`) and `vector` (`public`). These are catalog facts, not customer or authentication secrets.

**[GitHub Actions offline PG17 recovery prerequisite probe 37878364856](https://github.com/BEAUVILLE/digiy-loc/actions/runs/37878364856) PASS:** `supabase/postgres:17.6.1.173`, `docker --network none`, no production database URLs, no real backup, no decryption key. All **9/9 extensions were discoverable and individually installed** with their intended schema names. Source [`pg17-recovery-prereqs.sh`](../tests/loc-master-v30/pg17-recovery-prereqs.sh) and [workflow](../.github/workflows/loc-v30-recovery-prereqs.yml) now automate this compatibility check.

**Role bootstrap mismatch discovered before restoration:** Production includes nine platform roles `anon`, `authenticated`, `authenticator`, `pgbouncer`, `service_role`, `supabase_admin`, `supabase_auth_admin`, `supabase_realtime_admin`, `supabase_storage_admin`. On the isolated test image, **8/9 are already present**; **`supabase_realtime_admin` is absent**. During authorized true restore, test the **unaltered actual roles.sql** for both duplicate role declarations (8 pre-existing) and missing role initialization (1 absent) before claiming a successful schema/data recovery. Do not grant broad privileges or rewrite production to work around an untested restore.

**Stop condition unchanged:** This is only a *prerequisite package / role inventory*. No real encrypted `digiy-core` archive was decrypted or restored; no genuine Auth, Storage, Edge Function or migration history was replayed. Supabase Storage **file bytes** are not in current backup. A separately authorized real restore and actual owner-session tests are mandatory before any V30 migration. All V30 PRs remain DRAFT.

## 2026-10-09 03:29 UTC — Real encrypted backup SHA256 portability fix merged (operator path ready)

**Proven defect fixed, not genuine restoration:** Independent read-only examination of [actual encrypted artifact #11590062979](https://github.com/BEAUVILLE/admin-digiy/actions/runs/37870420013/artifacts/11590062979) showed that its external SHA256 manifest contains the ORIGINAL GitHub runner's absolute filesystem path. The digest itself is correct and the basename matches the encrypted archive. The older restore shell's `sha256sum -c` against that absolute path would fail after download onto another computer. **[admin-digiy PR #14](https://github.com/BEAUVILLE/admin-digiy/pull/14) was squash-merged on `main`** at `48dacf6778156f04e0a3a65886719265744ff0ed`. It now verifies locally downloaded ciphertext bytes, checks file basename, never opens the original GitHub path, accepts macOS `shasum`, rejects unsafe ZIP contents, and offers a private interactive operator path.

**[Final CI #37879464012](https://github.com/BEAUVILLE/admin-digiy/actions/runs/37879464012) PASS:** 53/53 tests; full **synthetic** encrypted restoration in networkless PostgreSQL 17 with an ABSOLUTE GitHub-style manifest; wrong passphrase and corrupted ciphertext rejected. [Secured Mac operator instructions](https://github.com/BEAUVILLE/admin-digiy/blob/main/docs/RESTORE_DIGIY_CORE_LOCAL_MAC.md). No password was shared, no real archive was decrypted, and the integration restriction on creating a GitHub secret-bearing workflow remains respected.

**Release status is still NO-GO:** An authorized operator must run a true restoration of the unchanged 9 October encrypted archive on their private encrypted Mac in the isolated Docker container, verify counts/extensions/roles and a sanitized PASS log; actual sessions at Saly/Sarlat and separate production migration authorization still needed. Production remains unchanged and all four V30 PRs DRAFT.

## Founder handoff — engineer-managed release only

**Decision on 2026-10-08:** the founder closed the Mac terminal and is not expected to run shell commands, locate database passwords, or copy connection strings. **Do not request any further technical action from the founder** as a condition of calling the software work done. Installation and tested recovery must be organized by an authorized technical operator with private access, without sharing credentials in GitHub or chat.

**Engineering status:** V30 code and isolated tests are ready on the four draft PRs; the live project has **not** received the V30 schema. Read-only control at 2026-10-08 23:48 UTC found **81 of 81** existing MASTER calendar rows blocked (`occupied`/`closed`), 0 other statuses, 0 reservation rows, both tables with RLS active. These counts are a time-stamped snapshot, not a backup.

**Remaining release responsibility belongs to the engineer/operator, NOT the founder:**
- Secure a private operator-controlled full logical backup and actually restore/verify it on a separate environment; no production SQL if this cannot be proved.
- Check any untracked deployed clients and obtain owner-session acceptance on Saly/Sarlat with authorized synthetic dates.
- Execute the migration only under separate release authority, then compare pre-/post-checks and retain recovery evidence privately.
- No mandatory charge, account upgrade or new Supabase project without informed approval.

**Release gate stays NO-GO, normal existing LOC service stays active.** No need to ask the founder to use a terminal or provide a database password.

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

**Updated factory parity (draft):** [MAÎTRE LOC PR #10](https://github.com/BEAUVILLE/digiy-master-modeles/pull/10) now includes a generic private reservation form, V30 cancellation with legacy-safe fallback, and the protected calendar RPC. [15 isolated Node tests passed](https://github.com/BEAUVILLE/digiy-master-modeles/actions/runs/37857692004) and [4/4 isolated mobile-browser tests passed](https://github.com/BEAUVILLE/digiy-master-modeles/actions/runs/37857692007). This remains a draft. Test with real owner sessions before any release.

## Mandatory pre-release backup / restoration proof — SQL RESTORE PASS (2026-10-09); full-platform DR excluded

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
5. Execute the [V30 **READ-ONLY post-deploy SQL check**](../supabase/candidates/LOC_MASTER_V30_POSTCHECK_READONLY.sql) on the target production project; its `ok` field must be TRUE, and its detailed schema/grants results must be retained privately with the release evidence. Cross-check the recorded **81** legacy blocked dates against the post-migration unknown-provenance count (allow for documented authorized new owner actions). Recheck public read/QR, direct contact and pricing remain unaffected.
6. Closely watch owner error rates, stale bookings, denied permissions and calendar consistency; write a timestamped sign-off only after each territory is verified.

## Emergency STOP / restoration

- Before SQL COMMIT, errors inside V30's transaction must abort the candidate; verify that no partial V30 columns/function replacements exist before retrying.
- After SQL COMMIT, first stop owner writes and preserve logs/data. Revert client code to the last known working **version** if the failure is client-only.
- **Do not blindly drop status, cancellation or provenance columns** after live usage: that would destroy business history. Do not clear 81 legacy blocks to make the UI appear green.
- Restoring previous SQL RPCs, object grants and row policies requires a **privately captured exact baseline** and an impact check. Restoring old direct table write privileges reopens the guard bypass, so it is an emergency-only rollback requiring explicit ownership approval.
- If a database restore is unavoidable, restore the verified private backup/PITR via Supabase's supported process after assessing collateral changes in all modules and possible global downtime/data loss. Never automatically perform a whole-project restore from this PR.
- Communicate openly to property owners if a release is rolled back or calendars require manual reconfirmation.

## Current release decision

**NO-GO for production today (real encrypted SQL restore now proven on the owner's isolated Mac)** until: complete inventory of deployed direct-write callers (especially the old MAÎTRE template and any copies), authentic Saly/Sarlat owner-session acceptance without touching live guests, and a **separate express approval** for each client rollout and any Supabase production SQL migration. All four V30 PRs stay **DRAFT**. The completed restore is a SQL recovery proof, not full Storage-object/Edge/SMTP disaster recovery. See the [2026-10-09 real-restore checkpoint](LOC_V30_REAL_RESTORE_CHECKPOINT_2026-10-09.md).
