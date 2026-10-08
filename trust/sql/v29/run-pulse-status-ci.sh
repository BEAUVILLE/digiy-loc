#!/usr/bin/env bash
set -euo pipefail
# Test only on a verified disposable localhost PostgreSQL instance.
[[ "${V29_CI_ONLY:-}" == "1" && "${PGHOST:-}" == "127.0.0.1" ]] || {
  echo 'Requires V29_CI_ONLY=1 and PGHOST=127.0.0.1 (disposable PostgreSQL)' >&2
  exit 1
}
export PGDATABASE=trust_v29_pulse_status_ci
createdb "$PGDATABASE"
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/pulse-status-fixture.psql
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/PULSE_STATUS_ACL_CANDIDATE.sql
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/pulse-status-permissions.psql
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/PULSE_STATUS_ACL_CANDIDATE.sql
echo 'V29 PULSE STATUS ACL CANDIDATE / SYNTHETIC DATABASE PASSED'
