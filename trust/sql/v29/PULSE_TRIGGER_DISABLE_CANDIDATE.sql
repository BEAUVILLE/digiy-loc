-- DIGIY SECURITY V29 — LEGACY PULSE RESERVATION TRIGGER ISOLATION
-- DRAFT ONLY. NOT A PRODUCTION MIGRATION OR DEPLOYMENT AUTHORIZATION.
-- Founder instruction: VPS PULSE stays stopped; do not connect/restart it.
--
-- DISABLES exactly eight existing PULSE-related reservation triggers.
-- PRESERVES payment, ownership and timestamp triggers.
-- NDIMBAL is independently confirmed CADUC by the founder: it is NOT an active-service dependency.
-- NDIMBAL trigger retirement must be scoped and reviewed separately.
-- Does not delete data, drop functions, change RPC grants or restart PULSE.
--
-- PRECONDITIONS BEFORE ANY DEPLOYMENT (none has yet been approved):
-- synthetic PostgreSQL tests, active caller/dependency confirmation,
-- reservation/payment/owner staging tests, queue retention/cancellation
-- review, explicit separately-approved release plan.
BEGIN;

DO $v29_preflight$
DECLARE n integer;
BEGIN
  WITH expected(table_name,trigger_name,function_name) AS (
    VALUES
    ('digiy_loc_reservations','trg_digiy_loc_reservations_pulse_enqueue','trg_digiy_loc_reservations_enqueue_pulse'),
    ('digiy_loc_reservations','trg_loc_pulse_j1_16h','digiy_loc_pulse_enqueue_j1_16h'),
    ('digiy_loc_reservations','trg_loc_pulse_j_15h','digiy_loc_pulse_j_15h'),
    ('digiy_loc_reservations','trg_loc_pulses_ins','digiy_loc_enqueue_standard_pulses'),
    ('digiy_loc_reservations','trg_loc_pulses_upd','digiy_loc_enqueue_standard_pulses'),
    ('digiy_loc_reservations','trg_res_enqueue_pulse_j1','digiy_loc_enqueue_pulse_j1'),
    ('reservations_loc','trg_digiy_loc_pulse_enqueue','trg_digiy_loc_pulse_enqueue_fn'),
    ('reservations_loc','trg_digiy_loc_cancel_pulses','trg_digiy_loc_cancel_pulses_fn')
  )
  SELECT count(*) INTO n
  FROM expected e
  JOIN pg_class c ON c.relname=e.table_name AND c.relkind IN ('r','p')
  JOIN pg_namespace ns ON ns.oid=c.relnamespace AND ns.nspname='public'
  JOIN pg_trigger t ON t.tgrelid=c.oid
       AND t.tgname=e.trigger_name AND NOT t.tgisinternal AND t.tgenabled='O'
  JOIN pg_proc p ON p.oid=t.tgfoid AND p.proname=e.function_name
  JOIN pg_namespace pn ON pn.oid=p.pronamespace AND pn.nspname='public';
  IF n <> 8 THEN
    RAISE EXCEPTION 'V29 PULSE preflight: expected 8 enabled triggers with exact function identities, found %',n;
  END IF;

  WITH must_remain(table_name,trigger_name) AS (
    VALUES
    ('digiy_loc_reservations','trg_digiy_loc_reservation_to_pay'),
    ('digiy_loc_reservations','trg_res_set_owner'),
    ('digiy_loc_reservations','trg_res_updated_at')
  )
  SELECT count(*) INTO n
  FROM must_remain e
  JOIN pg_class c ON c.relname=e.table_name AND c.relkind IN ('r','p')
  JOIN pg_namespace ns ON ns.oid=c.relnamespace AND ns.nspname='public'
  JOIN pg_trigger t ON t.tgrelid=c.oid
       AND t.tgname=e.trigger_name AND NOT t.tgisinternal AND t.tgenabled='O';
  IF n <> 3 THEN
    RAISE EXCEPTION 'V29 PULSE preflight: required booking/payment/owner trigger drift; enabled count %',n;
  END IF;
END $v29_preflight$;

ALTER TABLE public.digiy_loc_reservations DISABLE TRIGGER trg_digiy_loc_reservations_pulse_enqueue;
ALTER TABLE public.digiy_loc_reservations DISABLE TRIGGER trg_loc_pulse_j1_16h;
ALTER TABLE public.digiy_loc_reservations DISABLE TRIGGER trg_loc_pulse_j_15h;
ALTER TABLE public.digiy_loc_reservations DISABLE TRIGGER trg_loc_pulses_ins;
ALTER TABLE public.digiy_loc_reservations DISABLE TRIGGER trg_loc_pulses_upd;
ALTER TABLE public.digiy_loc_reservations DISABLE TRIGGER trg_res_enqueue_pulse_j1;
ALTER TABLE public.reservations_loc DISABLE TRIGGER trg_digiy_loc_pulse_enqueue;
ALTER TABLE public.reservations_loc DISABLE TRIGGER trg_digiy_loc_cancel_pulses;

DO $v29_postcheck$
DECLARE disabled_count integer; retained_count integer;
BEGIN
  WITH expected(table_name,trigger_name,function_name) AS (
    VALUES
    ('digiy_loc_reservations','trg_digiy_loc_reservations_pulse_enqueue','trg_digiy_loc_reservations_enqueue_pulse'),
    ('digiy_loc_reservations','trg_loc_pulse_j1_16h','digiy_loc_pulse_enqueue_j1_16h'),
    ('digiy_loc_reservations','trg_loc_pulse_j_15h','digiy_loc_pulse_j_15h'),
    ('digiy_loc_reservations','trg_loc_pulses_ins','digiy_loc_enqueue_standard_pulses'),
    ('digiy_loc_reservations','trg_loc_pulses_upd','digiy_loc_enqueue_standard_pulses'),
    ('digiy_loc_reservations','trg_res_enqueue_pulse_j1','digiy_loc_enqueue_pulse_j1'),
    ('reservations_loc','trg_digiy_loc_pulse_enqueue','trg_digiy_loc_pulse_enqueue_fn'),
    ('reservations_loc','trg_digiy_loc_cancel_pulses','trg_digiy_loc_cancel_pulses_fn')
  )
  SELECT count(*) INTO disabled_count FROM expected e
  JOIN pg_class c ON c.relname=e.table_name
  JOIN pg_namespace ns ON ns.oid=c.relnamespace AND ns.nspname='public'
  JOIN pg_trigger t ON t.tgrelid=c.oid AND t.tgname=e.trigger_name
       AND NOT t.tgisinternal AND t.tgenabled='D'
  JOIN pg_proc p ON p.oid=t.tgfoid AND p.proname=e.function_name
  JOIN pg_namespace pn ON pn.oid=p.pronamespace AND pn.nspname='public';

  WITH must_remain(trigger_name) AS (
    VALUES ('trg_digiy_loc_reservation_to_pay'),
           ('trg_res_set_owner'),('trg_res_updated_at')
  )
  SELECT count(*) INTO retained_count FROM must_remain e
  JOIN pg_class c ON c.relname='digiy_loc_reservations'
  JOIN pg_namespace ns ON ns.oid=c.relnamespace AND ns.nspname='public'
  JOIN pg_trigger t ON t.tgrelid=c.oid AND t.tgname=e.trigger_name
       AND NOT t.tgisinternal AND t.tgenabled='O';

  IF disabled_count <> 8 OR retained_count <> 3 THEN
    RAISE EXCEPTION 'V29 PULSE postcheck: disabled %, retained % (expected 8,3)',
      disabled_count,retained_count;
  END IF;
END $v29_postcheck$;

COMMIT;
