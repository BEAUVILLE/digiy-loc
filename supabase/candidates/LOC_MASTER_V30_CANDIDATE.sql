-- DIGIY LOC MASTER V30 — DRAFT CANDIDATE / NEVER AUTO-DEPLOY.
-- Scope: preserve owner-held reservation history, prevent overlapping stays,
-- prevent manual reopening of actively reserved dates, and provide a
-- separate atomic cancellation command. Existing public contact stays direct.
-- REQUIRES separately approved migration and owner UI rollout.
-- No PULSE or NDIMBAL worker is reactivated, touched or required.
--
-- SOURCE: read-only digiy-core catalog, 2026-10-08.
-- WARNING: Legacy occupied calendar rows have UNKNOWN provenance.
-- They remain blocked on cancellation until owner manually reviews them.
-- Inclusive date ranges intentionally match existing MASTER v1 clients.
BEGIN;

DO $preflight$
DECLARE got integer;
BEGIN
  SELECT count(*) INTO got FROM information_schema.columns
  WHERE table_schema='public' AND table_name='digiy_loc_master_reservations'
    AND column_name IN ('id','unit_id','guest_name','guest_phone','start_day','end_day','created_by');
  IF got <> 7 THEN RAISE EXCEPTION 'V30 PREFLIGHT: unexpected MASTER reservation schema'; END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='digiy_loc_master_reservations'
      AND column_name='status') THEN
    RAISE EXCEPTION 'V30 PREFLIGHT: reservation status already exists; investigate before reapplying';
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='digiy_loc_master_unit_calendar'
      AND column_name='occupancy_origin') THEN
    RAISE EXCEPTION 'V30 PREFLIGHT: occupancy origin already exists; investigate before reapplying';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint
    WHERE conname='digiy_loc_master_unit_calendar_pkey'
      AND conrelid='public.digiy_loc_master_unit_calendar'::regclass)
    OR NOT EXISTS(SELECT 1 FROM pg_constraint
    WHERE conname='digiy_loc_master_reservations_valid_range'
      AND conrelid='public.digiy_loc_master_reservations'::regclass) THEN
    RAISE EXCEPTION 'V30 PREFLIGHT: essential booking/calendar constraints differ';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname='digiy_loc_master_save_reservation_v1'
       AND pg_get_function_identity_arguments(p.oid)=
           'p_unit_id uuid, p_start_day date, p_end_day date, p_guest_name text, p_guest_phone text, p_source text, p_note text')
  OR NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname='digiy_loc_set_unit_calendar_state_v2'
       AND pg_get_function_identity_arguments(p.oid)=
           'p_unit_id uuid, p_days date[], p_status text') THEN
    RAISE EXCEPTION 'V30 PREFLIGHT: published owner RPC signatures drifted';
  END IF;
END $preflight$;

ALTER TABLE public.digiy_loc_master_reservations
  ADD COLUMN status text NOT NULL DEFAULT 'active',
  ADD COLUMN cancelled_at timestamptz,
  ADD COLUMN cancelled_by uuid,
  ADD COLUMN cancel_reason text;
ALTER TABLE public.digiy_loc_master_reservations
  ADD CONSTRAINT digiy_loc_master_reservations_status_v30
    CHECK (status IN ('active','cancelled')),
  ADD CONSTRAINT digiy_loc_master_reservations_cancel_metadata_v30
    CHECK (status='cancelled' OR
      (cancelled_at IS NULL AND cancelled_by IS NULL AND cancel_reason IS NULL));
CREATE INDEX digiy_loc_master_active_range_idx_v30
  ON public.digiy_loc_master_reservations(unit_id,start_day,end_day)
  WHERE status='active';

ALTER TABLE public.digiy_loc_master_unit_calendar
  ADD COLUMN occupancy_origin text;
ALTER TABLE public.digiy_loc_master_unit_calendar
  ADD CONSTRAINT digiy_loc_calendar_origin_v30
  CHECK (occupancy_origin IS NULL OR
         occupancy_origin IN ('reservation','manual'));
COMMENT ON COLUMN public.digiy_loc_master_unit_calendar.occupancy_origin IS
  'NULL=legacy unknown; manual=owner calendar action; reservation=MASTER booked by guarded RPC. Never auto-free unknown provenance.';

-- Replace existing callable owner RPC *with the same name, defaults and
-- returned columns*, so both Saly and Sarlat remain contract-compatible.
-- Lock the UNIT row first; all V30 owner writers take the same lock.
CREATE OR REPLACE FUNCTION public.digiy_loc_master_save_reservation_v1(
  p_unit_id uuid, p_start_day date, p_end_day date,
  p_guest_name text, p_guest_phone text,
  p_source text DEFAULT NULL, p_note text DEFAULT NULL)
RETURNS TABLE(
  id uuid, start_day date, end_day date, guest_name text,
  guest_phone text, source text, note text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO pg_catalog, public, auth
AS $function$
DECLARE v_owner uuid; v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;

  SELECT s.owner_id INTO v_owner
  FROM public.digiy_loc_master_units u
  JOIN public.digiy_loc_master_sites s ON s.id=u.site_id
  WHERE u.id=p_unit_id FOR UPDATE OF u;
  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'OWNER_FORBIDDEN';
  END IF;
  IF p_start_day IS NULL OR p_end_day IS NULL OR p_end_day<p_start_day
    THEN RAISE EXCEPTION 'INVALID_DATES'; END IF;
  IF nullif(btrim(p_guest_name),'') IS NULL
    THEN RAISE EXCEPTION 'GUEST_NAME_REQUIRED'; END IF;
  IF nullif(btrim(p_guest_phone),'') IS NULL
    THEN RAISE EXCEPTION 'GUEST_PHONE_REQUIRED'; END IF;

  -- Reject any active overlapping booking, even if old manual changes
  -- previously removed that booking's calendar blocks.
  IF EXISTS(
    SELECT 1 FROM public.digiy_loc_master_reservations r
    WHERE r.unit_id=p_unit_id AND r.status='active'
      AND r.start_day<=p_end_day AND r.end_day>=p_start_day
  ) THEN RAISE EXCEPTION 'BOOKING_DATES_ALREADY_RESERVED'; END IF;

  -- A closed or manually occupied day is NOT overridden by a booking.
  IF EXISTS(
    SELECT 1 FROM public.digiy_loc_master_unit_calendar c
    WHERE c.unit_id=p_unit_id AND c.day BETWEEN p_start_day AND p_end_day
      AND c.status IN ('occupied','closed')
  ) THEN RAISE EXCEPTION 'BOOKING_DATES_BLOCKED'; END IF;

  INSERT INTO public.digiy_loc_master_reservations(
    unit_id,guest_name,guest_phone,source,start_day,end_day,
    note,created_by,updated_at,status
  ) VALUES (
    p_unit_id,btrim(p_guest_name),btrim(p_guest_phone),
    nullif(btrim(p_source),''),p_start_day,p_end_day,
    nullif(btrim(p_note),''),auth.uid(),now(),'active'
  ) RETURNING digiy_loc_master_reservations.id INTO v_id;

  INSERT INTO public.digiy_loc_master_unit_calendar(
    unit_id,day,status,occupancy_origin,updated_at)
  SELECT p_unit_id,gs::date,'occupied','reservation',now()
  FROM generate_series(p_start_day,p_end_day,interval '1 day') AS gs;

  RETURN QUERY
  SELECT r.id,r.start_day,r.end_day,r.guest_name,r.guest_phone,
         r.source,r.note
  FROM public.digiy_loc_master_reservations r WHERE r.id=v_id;
END
$function$;

-- Direct owner actions may close/occupy/reopen days only when no
-- ACTIVE reservation covers those dates. "Disponible" is not "Annuler".
CREATE OR REPLACE FUNCTION public.digiy_loc_set_unit_calendar_state_v2(
  p_unit_id uuid,p_days date[],p_status text)
RETURNS TABLE(day date,status text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO pg_catalog, public, auth
AS $function$
DECLARE v_owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_status IS NULL OR p_status NOT IN ('available','occupied','closed')
    THEN RAISE EXCEPTION 'invalid_status'; END IF;
  IF p_days IS NULL OR cardinality(p_days)=0 OR array_position(p_days,NULL) IS NOT NULL
    THEN RAISE EXCEPTION 'NO_VALID_DATES'; END IF;

  SELECT s.owner_id INTO v_owner
  FROM public.digiy_loc_master_units u
  JOIN public.digiy_loc_master_sites s ON s.id=u.site_id
  WHERE u.id=p_unit_id FOR UPDATE OF u;
  IF v_owner IS NULL OR v_owner<>auth.uid() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF EXISTS(
    SELECT 1 FROM public.digiy_loc_master_reservations r
    WHERE r.unit_id=p_unit_id AND r.status='active'
      AND EXISTS(
        SELECT 1 FROM unnest(p_days) AS selected(d)
        WHERE selected.d BETWEEN r.start_day AND r.end_day)
  ) THEN
    RAISE EXCEPTION 'BOOKING_DATES_PROTECTED_USE_CANCELLATION';
  END IF;

  IF p_status='available' THEN
    DELETE FROM public.digiy_loc_master_unit_calendar c
    WHERE c.unit_id=p_unit_id AND c.day=ANY(p_days);
    RETURN QUERY
    SELECT DISTINCT t.d,'available'::text FROM unnest(p_days) AS t(d) ORDER BY t.d;
  ELSE
    INSERT INTO public.digiy_loc_master_unit_calendar(
      unit_id,day,status,occupancy_origin,updated_at)
    SELECT p_unit_id, x.d,p_status,'manual',now()
    FROM (SELECT DISTINCT d FROM unnest(p_days) AS a(d)) x
    ON CONFLICT ON CONSTRAINT digiy_loc_master_unit_calendar_pkey DO UPDATE
      SET status=EXCLUDED.status,
          occupancy_origin='manual',
          updated_at=EXCLUDED.updated_at;
    RETURN QUERY
    SELECT c.day,c.status
    FROM public.digiy_loc_master_unit_calendar c
    WHERE c.unit_id=p_unit_id AND c.day=ANY(p_days)
    ORDER BY c.day;
  END IF;
END
$function$;

-- The earlier non-v2 owner calendar RPC remains live. Preserve its
-- signature/output but forward all writes to the same protected v2 gate.
CREATE OR REPLACE FUNCTION public.digiy_loc_set_unit_calendar_state(
  p_unit_id uuid,p_days date[],p_status text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO pg_catalog, public, auth
AS $function$
DECLARE v_changed integer;
BEGIN
  SELECT count(*) INTO v_changed FROM
    public.digiy_loc_set_unit_calendar_state_v2(p_unit_id,p_days,p_status);
  RETURN v_changed;
END
$function$;

-- Explicit historical cancellation scoped to authenticated owner.
-- No guest contact or payment side effects; client chooses when to
-- contact the guest. Provenance=legacy(NULL) is NOT auto-released.
CREATE OR REPLACE FUNCTION public.digiy_loc_master_cancel_reservation_v1(
  p_reservation_id uuid,p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO pg_catalog, public, auth
AS $function$
DECLARE
  v_unit_id uuid; v_owner uuid; v_status text;
  v_start date; v_end date; v_released integer; v_kept integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_reservation_id IS NULL THEN RAISE EXCEPTION 'RESERVATION_ID_REQUIRED'; END IF;
  IF length(coalesce(p_reason,''))>400 THEN
    RAISE EXCEPTION 'CANCEL_REASON_TOO_LONG';
  END IF;

  SELECT r.unit_id INTO v_unit_id
  FROM public.digiy_loc_master_reservations r
  WHERE r.id=p_reservation_id;
  IF v_unit_id IS NULL THEN RAISE EXCEPTION 'RESERVATION_NOT_FOUND'; END IF;

  SELECT s.owner_id INTO v_owner
  FROM public.digiy_loc_master_units u
  JOIN public.digiy_loc_master_sites s ON s.id=u.site_id
  WHERE u.id=v_unit_id FOR UPDATE OF u;
  IF v_owner IS NULL OR v_owner<>auth.uid() THEN
    RAISE EXCEPTION 'OWNER_FORBIDDEN';
  END IF;
  SELECT r.status,r.start_day,r.end_day
    INTO v_status,v_start,v_end
  FROM public.digiy_loc_master_reservations r
  WHERE r.id=p_reservation_id AND r.unit_id=v_unit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'RESERVATION_NOT_FOUND'; END IF;

  IF v_status='cancelled' THEN
    RETURN jsonb_build_object(
      'ok',true,'reservation_id',p_reservation_id,'status','cancelled',
      'already_cancelled',true,'released_days',0,
      'retained_blocked_days',0);
  END IF;

  UPDATE public.digiy_loc_master_reservations r
  SET status='cancelled',cancelled_at=now(),cancelled_by=auth.uid(),
      cancel_reason=nullif(btrim(p_reason),''),
      updated_at=now()
  WHERE r.id=p_reservation_id;

  -- Preserve closures/manual occupied days, legacy/unknown source,
  -- and all days still needed by OTHER active reservations.
  DELETE FROM public.digiy_loc_master_unit_calendar c
  WHERE c.unit_id=v_unit_id
    AND c.day BETWEEN v_start AND v_end
    AND c.status='occupied'
    AND c.occupancy_origin='reservation'
    AND NOT EXISTS(
      SELECT 1 FROM public.digiy_loc_master_reservations other
      WHERE other.unit_id=v_unit_id
        AND other.id<>p_reservation_id AND other.status='active'
        AND c.day BETWEEN other.start_day AND other.end_day);
  GET DIAGNOSTICS v_released=ROW_COUNT;

  SELECT count(*) INTO v_kept
  FROM public.digiy_loc_master_unit_calendar c
  WHERE c.unit_id=v_unit_id AND c.day BETWEEN v_start AND v_end;

  RETURN jsonb_build_object(
    'ok',true,'reservation_id',p_reservation_id,'status','cancelled',
    'already_cancelled',false,'released_days',v_released,
    'retained_blocked_days',v_kept);
END
$function$;

-- Metadata-rich list used by the future owner UI. Keep existing v1
-- return shape untouched for Saly/Sarlat until their clients migrate.
CREATE OR REPLACE FUNCTION public.digiy_loc_master_list_reservations_v2(
  p_unit_id uuid)
RETURNS TABLE(
  id uuid,unit_id uuid,guest_name text,guest_phone text,
  source text,start_day date,end_day date,note text,
  created_at timestamptz,updated_at timestamptz,
  status text,cancelled_at timestamptz,cancel_reason text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO pg_catalog, public, auth
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF NOT EXISTS(
    SELECT 1 FROM public.digiy_loc_master_units u
    JOIN public.digiy_loc_master_sites s ON s.id=u.site_id
    WHERE u.id=p_unit_id AND s.owner_id=auth.uid()
  ) THEN RAISE EXCEPTION 'OWNER_FORBIDDEN'; END IF;
  RETURN QUERY
  SELECT r.id,r.unit_id,r.guest_name,r.guest_phone,
    r.source,r.start_day,r.end_day,r.note,r.created_at,r.updated_at,
    r.status,r.cancelled_at,r.cancel_reason
  FROM public.digiy_loc_master_reservations r
  WHERE r.unit_id=p_unit_id
  ORDER BY r.start_day DESC,r.created_at DESC;
END
$function$;

-- The public portal NEVER gets owner-only writes. Avoid role-inherited
-- direct table mutations that bypass the new serialized RPC gate.
REVOKE INSERT,UPDATE,DELETE ON public.digiy_loc_master_reservations
  FROM PUBLIC,anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.digiy_loc_master_unit_calendar
  FROM PUBLIC,anon,authenticated;
-- Preserve all existing SELECT grants and RLS policies.
REVOKE EXECUTE ON FUNCTION
  public.digiy_loc_master_save_reservation_v1(uuid,date,date,text,text,text,text),
  public.digiy_loc_master_list_reservations_v2(uuid),
  public.digiy_loc_master_cancel_reservation_v1(uuid,text),
  public.digiy_loc_set_unit_calendar_state_v2(uuid,date[],text),
  public.digiy_loc_set_unit_calendar_state(uuid,date[],text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION
  public.digiy_loc_master_save_reservation_v1(uuid,date,date,text,text,text,text),
  public.digiy_loc_master_list_reservations_v2(uuid),
  public.digiy_loc_master_cancel_reservation_v1(uuid,text),
  public.digiy_loc_set_unit_calendar_state_v2(uuid,date[],text),
  public.digiy_loc_set_unit_calendar_state(uuid,date[],text)
  TO authenticated,service_role;

DO $postcheck$
BEGIN
  IF has_function_privilege('anon','public.digiy_loc_master_cancel_reservation_v1(uuid,text)','EXECUTE')
    OR has_function_privilege('anon','public.digiy_loc_master_save_reservation_v1(uuid,date,date,text,text,text,text)','EXECUTE')
    OR has_table_privilege('authenticated','public.digiy_loc_master_unit_calendar','UPDATE')
    OR has_table_privilege('authenticated','public.digiy_loc_master_reservations','DELETE')
  THEN RAISE EXCEPTION 'V30 POSTCHECK: direct owner/public mutation still exposed'; END IF;
END $postcheck$;
COMMIT;
