#!/usr/bin/env bash
set -euo pipefail
# Hard CI guard: never permit running this runner against real Supabase/VPS.
if [[ "${V30_CI_ONLY:-}" != "1" || "${PGHOST:-}" != "127.0.0.1" ||
      "${PGUSER:-}" != "postgres" || "${PGPORT:-}" != "5432" ]]; then
  echo 'V30 requires disposable local Docker PostgreSQL on 127.0.0.1:5432; refusing' >&2
  exit 1
fi
export PGDATABASE=digiy_loc_v30_disposable
createdb "$PGDATABASE"
psql -X -v ON_ERROR_STOP=1 -f tests/loc-master-v30/fixture.psql
psql -X -v ON_ERROR_STOP=1 -f supabase/candidates/LOC_MASTER_V30_CANDIDATE.sql
# Independently check the live-like migrated schema and effective privileges.
postcheck="$(psql -X -At -F '|' -v ON_ERROR_STOP=1 -f supabase/candidates/LOC_MASTER_V30_POSTCHECK_READONLY.sql)"
if [[ "${postcheck%%|*}" != 't' ]]; then
  echo 'V30 post-migration rights or schema gate FAILED in disposable PostgreSQL' >&2
  exit 1
fi
echo 'V30 read-only postcheck PASS: protected RPC grants, schema, provenance and RLS'
psql -X -v ON_ERROR_STOP=1 -f tests/loc-master-v30/contracts.psql
bash tests/loc-master-v30/concurrency-ci.sh
echo 'V30 MASTER synthetic cancel + overlap + owner permissions tests PASSED'
