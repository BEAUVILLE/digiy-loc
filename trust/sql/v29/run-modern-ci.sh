#!/usr/bin/env bash
set -euo pipefail
# Current public LOC + owner SQL source replays against DISPOSABLE database.
# PULSE/NDIMBAL workers are retired: never connect to live Supabase.
[[ "${V29_CI_ONLY:-}" == "1" && "${PGHOST:-}" == "127.0.0.1" ]] || {
  echo 'Requires V29_CI_ONLY=1, PGHOST=127.0.0.1 and a verified disposable PostgreSQL' >&2
  exit 1
}
export PGDATABASE=trust_v29_modern_ci
createdb "$PGDATABASE"
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/modern-contract-fixture.psql
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/trigger-fixture.psql
echo 'V29 modern LOC baseline, legacy triggers present:'
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/modern-contract-tests.psql
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/master-cancellation-gap-test.psql
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/PULSE_TRIGGER_DISABLE_CANDIDATE.sql
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/NDIMBAL_PAYMENT_TRIGGER_DISABLE_CANDIDATE.sql
echo 'V29 modern LOC post-retirement, legacy triggers disabled:'
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/modern-contract-tests.psql
psql -X -v ON_ERROR_STOP=1 -f trust/sql/v29/master-cancellation-gap-test.psql
echo 'V29 MODERN LOC CONTRACTS PASSED; MASTER CANCELLATION GAP CONFIRMED (NOT FIXED)'
