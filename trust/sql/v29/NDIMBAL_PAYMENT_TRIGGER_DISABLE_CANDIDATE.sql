-- DIGIY V29 — RETIRED NDIMBAL PAYMENT-SIDE TRIGGER, ISOLATED CANDIDATE
-- DRAFT ONLY / DO NOT RUN ON PRODUCTION.
-- The founder confirmed NDIMBAL is CADUC and is NOT part of current bookings.
--
-- This proposal disables ONLY the legacy NDIMBAL contribution trigger on
-- public.digiy_loc_reservations when payment_status becomes 'paid'.
-- It does NOT change payment_status, payment processing, reservations,
-- owner mappings, historical NDIMBAL records, or any other triggers.
-- The old PULSE VPS is also retired and must never be reconnected.
--
-- Prerequisite: verify on disposable/staging PostgreSQL that the modern
-- payment, booking, and owner workflows are independent of NDIMBAL.
-- Separate explicit approval is required for deployment.
BEGIN;

DO $v29_ndimbal$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_proc p ON p.oid=t.tgfoid
    WHERE n.nspname='public'
      AND c.relname='digiy_loc_reservations'
      AND t.tgname='trg_ndimbal_after_paid'
      AND p.proname='digiy_loc_ndimbal_after_paid'
      AND t.tgenabled='O'
      AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'V29 NDIMBAL trigger identity or enabled-state drift';
  END IF;
END $v29_ndimbal$;

ALTER TABLE public.digiy_loc_reservations
  DISABLE TRIGGER trg_ndimbal_after_paid;

DO $v29_ndimbal$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public'
      AND c.relname='digiy_loc_reservations'
      AND t.tgname='trg_ndimbal_after_paid'
      AND t.tgenabled='D'
      AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'V29 NDIMBAL trigger-disable verification failed';
  END IF;
END $v29_ndimbal$;

COMMIT;
