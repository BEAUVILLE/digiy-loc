-- DIGIY LOC MASTER V30 — READ-ONLY AFTER-MIGRATION CHECK
-- This query does not mutate data. Expected: checks.ok = true.
-- Run only AFTER the authorized V30 migration or in synthetic PostgreSQL CI.
-- Never compare row counts to fixed constants; preserve the independently
-- recorded historical calendar count before any real migration.
WITH
roles AS (
  SELECT
    NOT has_table_privilege('authenticated','public.digiy_loc_master_unit_calendar','INSERT') AS no_direct_calendar_insert,
    NOT has_table_privilege('authenticated','public.digiy_loc_master_unit_calendar','UPDATE') AS no_direct_calendar_update,
    NOT has_table_privilege('authenticated','public.digiy_loc_master_unit_calendar','DELETE') AS no_direct_calendar_delete,
    NOT has_table_privilege('authenticated','public.digiy_loc_master_reservations','INSERT') AS no_direct_reservation_insert,
    NOT has_table_privilege('authenticated','public.digiy_loc_master_reservations','UPDATE') AS no_direct_reservation_update,
    NOT has_table_privilege('authenticated','public.digiy_loc_master_reservations','DELETE') AS no_direct_reservation_delete,
    NOT has_function_privilege('anon','public.digiy_loc_master_save_reservation_v1(uuid,date,date,text,text,text,text)','EXECUTE') AS booking_denied_anon,
    NOT has_function_privilege('anon','public.digiy_loc_master_cancel_reservation_v1(uuid,text)','EXECUTE') AS cancellation_denied_anon,
    NOT has_function_privilege('anon','public.digiy_loc_master_list_reservations_v2(uuid)','EXECUTE') AS history_denied_anon,
    NOT has_function_privilege('anon','public.digiy_loc_set_unit_calendar_state(uuid,date[],text)','EXECUTE') AS legacy_calendar_denied_anon,
    NOT has_function_privilege('anon','public.digiy_loc_set_unit_calendar_state_v2(uuid,date[],text)','EXECUTE') AS calendar_denied_anon,
    has_function_privilege('authenticated','public.digiy_loc_master_save_reservation_v1(uuid,date,date,text,text,text,text)','EXECUTE') AS booking_allowed_owner,
    has_function_privilege('authenticated','public.digiy_loc_master_cancel_reservation_v1(uuid,text)','EXECUTE') AS cancellation_allowed_owner,
    has_function_privilege('authenticated','public.digiy_loc_master_list_reservations_v2(uuid)','EXECUTE') AS history_allowed_owner,
    has_function_privilege('authenticated','public.digiy_loc_set_unit_calendar_state_v2(uuid,date[],text)','EXECUTE') AS calendar_allowed_owner
),
shape AS (
 SELECT
   EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='digiy_loc_master_reservations' AND column_name='status') AS status_column,
   EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='digiy_loc_master_reservations' AND column_name='cancelled_at') AS cancellation_time_column,
   EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='digiy_loc_master_reservations' AND column_name='cancelled_by') AS cancellation_owner_column,
   EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='digiy_loc_master_reservations' AND column_name='cancel_reason') AS cancellation_reason_column,
   EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='digiy_loc_master_unit_calendar' AND column_name='occupancy_origin') AS calendar_origin_column,
   EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.digiy_loc_master_reservations'::regclass AND conname='digiy_loc_master_reservations_status_v30') AS status_constraint,
   EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.digiy_loc_master_unit_calendar'::regclass AND conname='digiy_loc_calendar_origin_v30') AS provenance_constraint,
   (SELECT count(*)=2 AND bool_and(c.relrowsecurity)
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname IN ('digiy_loc_master_unit_calendar','digiy_loc_master_reservations')) AS rls_on
), findings AS (
 SELECT jsonb_strip_nulls(to_jsonb(roles)) AS grants, to_jsonb(shape) AS schema
 FROM roles CROSS JOIN shape
)
SELECT
  (SELECT bool_and(value::boolean)
   FROM findings, LATERAL jsonb_each_text(grants)) AND
  (SELECT bool_and(value::boolean)
   FROM findings, LATERAL jsonb_each_text(schema)) AS ok,
  (SELECT jsonb_build_object('grants',grants,'schema',schema) FROM findings) AS detail,
  (SELECT count(*) FROM public.digiy_loc_master_reservations) AS reservation_rows,
  (SELECT count(*) FROM public.digiy_loc_master_unit_calendar) AS calendar_rows,
  (SELECT count(*) FROM public.digiy_loc_master_unit_calendar WHERE status IN ('occupied','closed') AND occupancy_origin IS NULL) AS blocked_rows_with_legacy_unknown_origin,
  now() AS checked_at;
