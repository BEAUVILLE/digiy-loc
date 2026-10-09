#!/usr/bin/env bash
set -euo pipefail
# Hard CI guard: never permit running this runner against real Supabase/VPS.
bash -n release/tools/loc-v30-private-backup.sh
if [[ "${V30_CI_ONLY:-}" != "1" || "${PGHOST:-}" != "127.0.0.1" ||
      "${PGUSER:-}" != "postgres" || "${PGPORT:-}" != "5432" ]]; then
  echo 'V30 requires disposable local Docker PostgreSQL on 127.0.0.1:5432; refusing' >&2
  exit 1
fi
export PGDATABASE=digiy_loc_v30_disposable
createdb "$PGDATABASE"
psql -X -v ON_ERROR_STOP=1 -f tests/loc-master-v30/fixture.psql
# Exact 81-day synthetic historic legacy baseline. Never use real guest
# records or migrate anything outside the disposable local test database.
territory_sql=supabase/candidates/LOC_MASTER_V30_TERRITORY_BASELINE_READONLY.sql
expected_baseline=
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
saly-test|61|61|0|0|61\nsarlat-test|20|20|0|0|20'
before_baseline="$(psql -X -At -F '|' -v ON_ERROR_STOP=1 -f "$territory_sql")"
if [[ "$before_baseline" != "$expected_baseline" ]]; then
  echo 'V30 FAILED: synthetic 61+20 pre-migration calendar baseline mismatch' >&2
  exit 1
fi
echo 'V30 HISTORIC BASELINE BEFORE PASS: 61 Saly + 20 Sarlat, all blocked and unknown origin'

psql -X -v ON_ERROR_STOP=1 -f supabase/candidates/LOC_MASTER_V30_CANDIDATE.sql

after_baseline="$(psql -X -At -F '|' -v ON_ERROR_STOP=1 -f "$territory_sql")"
if [[ "$after_baseline" != "$expected_baseline" || "$after_baseline" != "$before_baseline" ]]; then
  echo 'V30 FAILED: migration changed synthetic 61+20 historic blocked dates or provenance' >&2
  exit 1
fi
echo 'V30 HISTORIC BASELINE AFTER PASS: all 81 blocked days and UNKNOWN origin preserved'
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
