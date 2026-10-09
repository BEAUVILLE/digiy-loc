-- DIGIY LOC V30 — TERRITORY-BY-TERRITORY BLOCKED CALENDAR BASELINE
-- SELECT only, no personal guest data or owner identifiers.
-- Compatible with legacy and V30 schemas: provenance read via to_jsonb,
-- which returns NULL before the occupancy_origin column exists.
-- Save dated output privately immediately before/after an authorized migration.
SELECT
  COALESCE(s.slug,'(orphaned-unit)') AS site_slug,
  count(*)::int AS total_calendar_rows,
  count(*) FILTER (WHERE c.status='occupied')::int AS occupied_days,
  count(*) FILTER (WHERE c.status='closed')::int AS closed_days,
  count(*) FILTER (WHERE c.status NOT IN ('occupied','closed'))::int AS unexpected_status_days,
  count(*) FILTER (WHERE NULLIF(to_jsonb(c)->>'occupancy_origin','') IS NULL)::int
    AS unknown_legacy_origin_days
FROM public.digiy_loc_master_unit_calendar AS c
LEFT JOIN public.digiy_loc_master_units AS u ON u.id=c.unit_id
LEFT JOIN public.digiy_loc_master_sites AS s ON s.id=u.site_id
GROUP BY COALESCE(s.slug,'(orphaned-unit)')
ORDER BY site_slug;