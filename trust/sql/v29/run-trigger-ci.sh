#!/usr/bin/env bash
set -euo pipefail
# Disposable localhost PostgreSQL ONLY, never production or tunneled PROD.
[[ "${V29_CI_ONLY:-}" == "1" && "${PGHOST:-}" == "127.0.0.1" ]] || {
  echo 'V29 trigger tests require V29_CI_ONLY=1 and a disposable localhost DB' >&2
  exit 1
}
export PGDATABASE=trust_v29_trigger_ci
createdb "$PGDATABASE"
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/trigger-fixture.psql
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/PULSE_TRIGGER_DISABLE_CANDIDATE.sql
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/trigger-isolation-tests.psql

# A second application should fail closed, never hide trigger-state drift.
tmpfile=$(mktemp)
trap 'rm -f "$tmpfile"' EXIT
if psql -X -v ON_ERROR_STOP=1   -f trust/sql/v29/PULSE_TRIGGER_DISABLE_CANDIDATE.sql >"$tmpfile" 2>&1; then
  echo 'Unexpected success reapplying V29 PULSE disable candidate' >&2
  exit 1
fi
grep -F 'V29 PULSE preflight:' "$tmpfile"
echo 'V29 PULSE TRIGGER RETIREMENT SYNTHETIC TESTS PASSED'
