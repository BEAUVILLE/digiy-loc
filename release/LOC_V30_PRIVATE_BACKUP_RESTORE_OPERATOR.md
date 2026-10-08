# LOC V30 — private backup & restore operator checklist

**Status: NOT EXECUTED / not proof of backup or restore.** GitHub contains only this procedure; never commit private SQL dumps, credentials, connection URLs, environment files, guest records or tests involving real guest data.

## What is verified

Supabase organization `DIGIY AFRICA` is on `free`; `digiy-core` is active. The read-only V30 preflight passed (snapshot: 0 MASTER reservation rows, 81 occupied/closed calendar rows). Never assume built-in daily backups/PITR exist without verifying the Dashboard.

Official Supabase references:
- [Supabase CLI db dump](https://supabase.com/docs/reference/cli/supabase-db-dump)
- [Backup and test a restoration of a Supabase Platform project](https://supabase.com/docs/guides/self-hosting/restore-from-platform)
- [Database backups](https://supabase.com/docs/guides/platform/backups)

## Operator steps (private computer only)

1. On a trustworthy device with disk encryption and authorized access, install/check `supabase --version`, `supabase db dump --help`, `psql --version`. Verify Docker is working; Supabase CLI uses it to run database export. Do not install packages with unreviewed scripts.
2. In the `digiy-core` dashboard choose **Connect** and obtain the database connection string privately (direct or *session pooler*, not transaction pooler). Do not paste it in chat, GitHub, CI logs or screenshots. Use an isolated shell session and temporary environment variable `DB_URL`; avoid shell history and shared machines. **Never push a dump to the public repository.**
3. Create a new, private, encrypted backup directory. Before invoking CLI, set restrictive permissions (e.g., shell `umask 077`) and ensure storage is encrypted. Example commands below assume the connection variable is already defined privately, without the secret in command history:

   ```sh
   # Run locally on encrypted storage; NEVER run in GitHub Actions.
   umask 077
   mkdir -p "$HOME/DIGIY_PRIVATE_BACKUPS/LOC_V30"
   cd "$HOME/DIGIY_PRIVATE_BACKUPS/LOC_V30"
   supabase db dump --db-url "$DB_URL" -f roles.sql --role-only
   supabase db dump --db-url "$DB_URL" -f schema.sql
   supabase db dump --db-url "$DB_URL" -f data.sql --use-copy --data-only
   test -s roles.sql && test -s schema.sql && test -s data.sql
   shasum -a 256 roles.sql schema.sql data.sql > SHA256SUMS.txt
   ```

4. Record in a **private** operator log: UTC export timestamp, CLI version, hashes, authorized operator, encrypted storage location, relevant schema/table names, function signatures, count of MASTER reservations, and count of blocked days. SQL dumps may hold personal data—restrict to authorized personnel, and delete unencrypted copies after protected storage is confirmed.
5. **Restore test is mandatory and separate.** Create/use a disposable, non-production destination under a different connection string. Follow the linked Supabase restore guide for that destination (roles first, schema, then data). Explicitly verify target name/host are **not** the production `digiy-core` project before *any* restore command. In particular, do **not** run a `psql` restore with `DB_URL` or the production connection string.
6. After restoring, compare: existing MASTER table structure; original v1/v2 RPC signatures; RLS/grants; expected total rows; all 81 historical blocked calendar rows; ability to query sample synthetic fixtures in the disposable database. Consider other non-public schemas/extensions excluded by default from CLI dump and separately preserve anything required for whole-project recovery. Confirm no real credentials were copied into public test environments.
7. Record a signed/dated **PASS** with actual restore output evidence in a *private* operator log. A file-size check, hash, successful dump, or green CI alone is **not** proof of successful restoration. If restore fails, **NO-GO** for production SQL.
8. Only afterward resume the [central V30 release gate](LOC_V30_RELEASE_GATE_2026-10-08.md). Production migration requires separate explicit approval, real-owner acceptance, and a suitable maintenance window.

## Security notes

- A CLI schema/data/roles dump is **not automatically equivalent to a full Supabase project recovery**: Supabase CLI excludes some platform-managed schemas and extensions; Auth, Storage blobs, Edge Functions and credentials need their own plan for a full disaster recovery scenario.
- A connection URI passed to a command may be briefly observable to local OS process inspection. Run only on your secured machine, clear temporary environment variables and avoid multi-user/shared runners.
- Never email the dump in cleartext or upload to public GitHub. Use encrypted storage with limited authorized access.
- Retain the verified pre-migration backup and note that rolling back SQL after new bookings/cancellations could lose or corrupt business history; do not blindly drop V30 columns.
