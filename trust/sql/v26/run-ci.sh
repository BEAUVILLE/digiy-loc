#!/usr/bin/env bash
set -euo pipefail
# Disposable localhost PostgreSQL ONLY. No production credentials or deployment.
[[ "${V26_CI_ONLY:-}" == 1 && "${PGHOST:-}" == 127.0.0.1 ]] || {
  echo 'Requires V26_CI_ONLY=1 and PGHOST=127.0.0.1 on a disposable PostgreSQL server' >&2
  exit 1
}
export PGDATABASE=trust_v26_ci
createdb "$PGDATABASE"
candidate=trust/sql/v26/20261008163952_digiy_trust_v26_server_permissions.sql
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v26/fixture.psql

expect_preflight_failure() {
  if psql -X -v ON_ERROR_STOP=1 -f "$candidate" >"$tmpdir/preflight.log" 2>&1; then
    echo 'Unsafe migration unexpectedly succeeded' >&2
    exit 1
  fi
  grep -F "$1" "$tmpdir/preflight.log"
  [[ $(psql -X -Atc "select count(*) from pg_roles where rolname='digiy_trust_server'") == 0 ]]
}
# PUBLIC inheritance blocker: fail before creating/granting the role.
psql -X -v ON_ERROR_STOP=1 -c 'create function public.v26_unsafe_fixture() returns integer language sql security definer as $$ select 1 $$;'
expect_preflight_failure 'PUBLIC SECURITY DEFINER access'
psql -X -v ON_ERROR_STOP=1 -c 'drop function public.v26_unsafe_fixture(); grant select on public.digiy_loc_master_units to public;'
expect_preflight_failure 'PUBLIC relation access'
psql -X -v ON_ERROR_STOP=1 -c 'revoke select on public.digiy_loc_master_units from public; alter table digiy_trust_private.voluntary_feedback disable row level security;'
expect_preflight_failure 'RLS prerequisite missing'
psql -X -v ON_ERROR_STOP=1 -c 'alter table digiy_trust_private.voluntary_feedback enable row level security; grant usage on schema digiy_trust_private to anon;'
expect_preflight_failure 'private ACL drift'
psql -X -v ON_ERROR_STOP=1 -c 'revoke usage on schema digiy_trust_private from anon;'

psql -X -v ON_ERROR_STOP=1 -f "$candidate"
node trust/sql/v26/adapter-statements.mjs > "$tmpdir/adapter.sql"
psql -X -v ON_ERROR_STOP=1 -v adapter_sql_file="$tmpdir/adapter.sql" -f trust/sql/v26/permissions.psql
# Reapplying must fail closed, never silently reuse an identity with drift.
if psql -X -v ON_ERROR_STOP=1 -f "$candidate" >"$tmpdir/reapply.log" 2>&1; then
  echo 'Reapplication unexpectedly succeeded' >&2
  exit 1
fi
grep -F 'role already exists' "$tmpdir/reapply.log"
echo 'V26 CANDIDATE + PERMISSIONS + PREFLIGHT GUARDS PASSED'
