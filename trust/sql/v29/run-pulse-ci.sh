#!/usr/bin/env bash
set -euo pipefail
# No production tests: dedicated local ephemeral PostgreSQL instance ONLY.
[[ "${V29_CI_ONLY:-}" == "1" && "${PGHOST:-}" == "127.0.0.1" ]] || {
  echo 'Requires V29_CI_ONLY=1 and PGHOST=127.0.0.1 on disposable PostgreSQL' >&2
  exit 1
}
export PGDATABASE=trust_v29_pulse_ci
createdb "$PGDATABASE"
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/pulse-fixture.psql
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/PULSE_CLAIM_ACL_CANDIDATE.sql
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/pulse-permissions.psql
# ACL migration should be repeatable in an isolated database.
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/PULSE_CLAIM_ACL_CANDIDATE.sql
echo 'V29 PULSE CLAIM ACL CANDIDATE / SYNTHETIC DATABASE PASSED'
