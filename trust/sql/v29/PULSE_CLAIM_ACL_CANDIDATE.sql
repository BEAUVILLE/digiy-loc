-- DIGIY SECURITY V29 — PULSE CLAIM ACL CANDIDATE (separate optional step)
-- DO NOT APPLY IN PRODUCTION. Requires confirmed active worker, full
-- authorization review (one overload uses current_setting), isolated
-- PostgreSQL tests, rollback plan and explicit deployment approval.
--
-- This only restricts the two exact worker-claim overloads; it does NOT
-- secure the whole pulse lifecycle. See trust/V29_LOC_PULSE_FAMILY_AUDIT.md.
BEGIN;

DO $v29$
DECLARE
  signature text;
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.digiy_loc_pulse_claim_batch(integer)',
    'public.digiy_loc_pulse_claim_batch(integer,timestamptz,text)'
  ] LOOP
    IF to_regprocedure(signature) IS NULL THEN
      RAISE EXCEPTION 'V29 missing pulse claim signature: %', signature;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc
      WHERE oid = to_regprocedure(signature)
      AND prosecdef
    ) THEN
      RAISE EXCEPTION 'V29 pulse SECURITY DEFINER contract drift: %', signature;
    END IF;
  END LOOP;
  IF NOT has_schema_privilege('service_role', 'public', 'USAGE') THEN
    RAISE EXCEPTION 'V29 pulse: service_role lacks public schema USAGE';
  END IF;
END
$v29$;

REVOKE EXECUTE ON FUNCTION public.digiy_loc_pulse_claim_batch(integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.digiy_loc_pulse_claim_batch(integer,timestamptz,text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.digiy_loc_pulse_claim_batch(integer)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.digiy_loc_pulse_claim_batch(integer,timestamptz,text)
  TO service_role;

DO $v29$
DECLARE
  signature text;
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.digiy_loc_pulse_claim_batch(integer)',
    'public.digiy_loc_pulse_claim_batch(integer,timestamptz,text)'
  ] LOOP
    IF has_function_privilege('anon',signature,'EXECUTE')
      OR has_function_privilege('authenticated',signature,'EXECUTE')
      OR NOT has_function_privilege('service_role',signature,'EXECUTE') THEN
      RAISE EXCEPTION 'V29 pulse ACL failed: %',signature;
    END IF;
  END LOOP;
END
$v29$;

COMMIT;
