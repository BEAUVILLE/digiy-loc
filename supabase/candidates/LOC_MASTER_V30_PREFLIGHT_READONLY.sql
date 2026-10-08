-- DIGIY LOC MASTER V30 — NON-MUTATING RELEASE PREFLIGHT.
-- Read-only catalog + aggregate counts; NO owner or guest personal data.
-- Run against the intended project BEFORE migration; do not treat this as backup evidence.
WITH
tables AS (
 SELECT c.relname,c.relrowsecurity,
   has_table_privilege('authenticated',c.oid,'INSERT') AS auth_insert,
   has_table_privilege('authenticated',c.oid,'UPDATE') AS auth_update,
   has_table_privilege('authenticated',c.oid,'DELETE') AS auth_delete,
   has_table_privilege('anon',c.oid,'SELECT') AS anon_select
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname IN
  ('digiy_loc_master_reservations','digiy_loc_master_unit_calendar')
),
functions AS (
 SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS args,
   p.prosecdef AS definer,
   has_function_privilege('anon',p.oid,'EXECUTE') AS anon_exec,
   has_function_privilege('authenticated',p.oid,'EXECUTE') AS owner_exec
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public'
   AND p.proname IN ('digiy_loc_master_save_reservation_v1',
                    'digiy_loc_set_unit_calendar_state_v2',
                    'digiy_loc_set_unit_calendar_state',
                    'digiy_loc_master_list_reservations_v1')
),
checks AS (
 SELECT
  (SELECT count(*)=7 FROM information_schema.columns
   WHERE table_schema='public' AND table_name='digiy_loc_master_reservations'
    AND column_name IN ('id','unit_id','guest_name','guest_phone','start_day','end_day','created_by')
  ) AS base_columns_ok,
  NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='digiy_loc_master_reservations'
      AND column_name='status') AS v30_status_not_yet_installed,
  NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='digiy_loc_master_unit_calendar'
      AND column_name='occupancy_origin') AS v30_origin_not_yet_installed,
  EXISTS (SELECT 1 FROM pg_constraint WHERE
     conrelid='public.digiy_loc_master_reservations'::regclass
     AND conname='digiy_loc_master_reservations_valid_range') AS reservation_dates_constraint_ok,
  EXISTS (SELECT 1 FROM pg_constraint WHERE
     conrelid='public.digiy_loc_master_unit_calendar'::regclass
     AND conname='digiy_loc_master_unit_calendar_pkey') AS calendar_primary_key_ok,
  EXISTS (SELECT 1 FROM functions
     WHERE proname='digiy_loc_master_save_reservation_v1'
       AND args='p_unit_id uuid, p_start_day date, p_end_day date, p_guest_name text, p_guest_phone text, p_source text, p_note text'
       AND definer AND owner_exec AND NOT anon_exec) AS booking_rpc_signature_ok,
  EXISTS (SELECT 1 FROM functions
     WHERE proname='digiy_loc_set_unit_calendar_state_v2'
       AND args='p_unit_id uuid, p_days date[], p_status text'
       AND definer AND owner_exec AND NOT anon_exec) AS calendar_rpc_signature_ok,
  (SELECT count(*)=2 AND bool_and(relrowsecurity) FROM tables) AS calendar_and_reservation_rls_enabled
)
SELECT
  now() AS checked_at_utc,
  (SELECT to_jsonb(c) FROM checks c) AS catalog_preflight,
  (SELECT count(*) FROM public.digiy_loc_master_reservations) AS reservation_rows,
  (SELECT count(*) FROM public.digiy_loc_master_unit_calendar) AS legacy_calendar_rows_to_preserve,
  (SELECT count(*) FROM public.digiy_loc_master_unit_calendar
   WHERE status IN ('occupied','closed')) AS occupied_or_closed_rows,
  (SELECT count(*) FROM public.digiy_loc_master_unit_calendar
   WHERE status NOT IN ('occupied','closed')) AS unexpected_calendar_status_rows,
  (SELECT jsonb_agg(to_jsonb(t) ORDER BY relname) FROM tables t) AS table_permissions_before_migration,
  (SELECT jsonb_agg(to_jsonb(f) ORDER BY proname) FROM functions f) AS owner_rpc_permissions_before_migration;
