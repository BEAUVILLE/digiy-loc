#!/usr/bin/env bash
# Synthetic 61 + 20 legacy historic blocks preservation test.
# Never use on live DB. Both SQL reads target the disposable local CI instance.
set -euo pipefail
[[ "${V30_CI_ONLY:-}" == "1" && "${PGHOST:-}" == "127.0.0.1" &&
   "${PGPORT:-}" == "5432" && "${PGUSER:-}" == "postgres" &&
   "${PGDATABASE:-}" == "digiy_loc_v30_disposable" ]] || {
  echo 'V30 HISTORIC CHECK REFUSED: requires local disposable PostgreSQL' >&2
  exit 1
}
phase="${1:?phase required}"
case "$phase" in before|after) ;; *) exit 1 ;; esac

status="$(psql -X -At -v ON_ERROR_STOP=1 <<'SQL'
WITH counts AS (
 SELECT COALESCE(s.slug,'orphan') AS site,
        count(*) AS rows_total,
        count(*) FILTER (
          WHERE c.status='occupied'
            AND NULLIF(to_jsonb(c)->>'occupancy_origin','') IS NULL
        ) AS safe_unknown,
        count(*) FILTER (WHERE c.status<>'occupied') AS other
 FROM public.digiy_loc_master_unit_calendar c
 LEFT JOIN public.digiy_loc_master_units u ON u.id=c.unit_id
 LEFT JOIN public.digiy_loc_master_sites s ON s.id=u.site_id
 GROUP BY COALESCE(s.slug,'orphan')
)
SELECT CASE WHEN
  (SELECT count(*) FROM counts)=2
  AND (SELECT count(*) FROM counts WHERE site='saly-test'
       AND rows_total=61 AND safe_unknown=61 AND other=0)=1
  AND (SELECT count(*) FROM counts WHERE site='sarlat-test'
       AND rows_total=20 AND safe_unknown=20 AND other=0)=1
  AND (SELECT sum(rows_total) FROM counts)=81
THEN 'PASS' ELSE 'FAIL' END;
SQL
)"
if [[ "$status" != "PASS" ]]; then
  echo "V30 HISTORIC BLOCKS PRESERVATION FAILED in phase $phase" >&2
  exit 1
fi
echo "V30 81 HISTORIC BLOCKS PRESERVED ($phase): Saly 61, Sarlat 20, all occupied, origin unknown"
