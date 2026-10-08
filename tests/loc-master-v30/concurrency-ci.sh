#!/usr/bin/env bash
set -euo pipefail
[[ "${V30_CI_ONLY:-}" == "1" && "${PGHOST:-}" == "127.0.0.1" &&
   "${PGUSER:-}" == "postgres" && "${PGPORT:-}" == "5432" &&
   "${PGDATABASE:-}" == "digiy_loc_v30_disposable" ]] || {
  echo "Refusing concurrent test outside disposable CI" >&2; exit 1;
}
# Two independent connections both try the SAME unit, SAME dates.
# First transaction keeps the unit row lock for two seconds.
# Second must block, then reject BOOKING_DATES_ALREADY_RESERVED.
file_holder=$(mktemp)
trap 'rm -f "$file_holder"' EXIT
psql -X -v ON_ERROR_STOP=1 -c "
 BEGIN;
 SET LOCAL ROLE authenticated;
 SET LOCAL request.jwt.claim.sub='00000000-0000-4000-8000-000000000a11';
 SELECT count(*) FROM public.digiy_loc_master_save_reservation_v1(
   '00000000-0000-4000-8000-000000000a02'::uuid,
   DATE '2026-12-15',DATE '2026-12-17','Concurrent first','000-A',NULL,NULL);
 SELECT pg_sleep(3);
 COMMIT;" >"$file_holder" 2>&1 &
first_pid=$!

ready=0
for i in $(seq 1 50); do
  locks=$(psql -X -Atc "SELECT count(*) FROM pg_locks
    WHERE relation='public.digiy_loc_master_units'::regclass
      AND mode='RowShareLock' AND granted AND pid<>pg_backend_pid()")
  if [[ "$locks" -ge 1 ]]; then ready=1; break; fi
  if ! kill -0 "$first_pid" 2>/dev/null; then break; fi
  sleep 0.1
done
if [[ "$ready" != 1 ]]; then
  echo 'Could not prove first transaction acquired unit lock' >&2
  cat "$file_holder" >&2
  wait "$first_pid" || true
  exit 1
fi

set +e
second_output=$(psql -X -v ON_ERROR_STOP=1 -c "
 BEGIN;
 SET LOCAL ROLE authenticated;
 SET LOCAL request.jwt.claim.sub='00000000-0000-4000-8000-000000000a11';
 SELECT count(*) FROM public.digiy_loc_master_save_reservation_v1(
   '00000000-0000-4000-8000-000000000a02'::uuid,
   DATE '2026-12-16',DATE '2026-12-18','Concurrent second','000-B',NULL,NULL);
 COMMIT;" 2>&1)
second_exit=$?
set -e
wait "$first_pid" || { cat "$file_holder" >&2; exit 1; }
if [[ "$second_exit" -eq 0 ]] || ! grep -q "BOOKING_DATES_ALREADY_RESERVED" <<< "$second_output"; then
  echo 'RACE: second overlapping transaction did not fail safely' >&2
  echo "$second_output" >&2; exit 1
fi
rows=$(psql -X -Atc "SELECT count(*) FROM public.digiy_loc_master_reservations
  WHERE unit_id='00000000-0000-4000-8000-000000000a02'::uuid")
if [[ "$rows" != 1 ]]; then
  echo "RACE: expected exactly one committed booking; found $rows" >&2;exit 1
fi
echo 'V30 SERIALIZED CONCURRENT MASTER BOOKING PASS: second writer rejected; exactly one booking committed in throwaway DB'
