#!/usr/bin/env bash
set -euo pipefail
# Disposable localhost PostgreSQL ONLY: never point at the production project.
[[ "${V29_CI_ONLY:-}" == 1 && "${PGHOST:-}" == "127.0.0.1" ]] || {
  echo 'V29 tests require V29_CI_ONLY=1 and PGHOST=127.0.0.1' >&2
  exit 1
}
export PGDATABASE=trust_v29_outbox_ci
createdb "$PGDATABASE"
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/fixture.psql
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/OUTBOX_ACL_CANDIDATE.sql
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/permissions.psql
# Exact-ACL candidate must remain idempotent on the disposable fixture.
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/OUTBOX_ACL_CANDIDATE.sql
echo 'V29 OUTBOX ACL CANDIDATE / SYNTHETIC DATABASE PASSED'
