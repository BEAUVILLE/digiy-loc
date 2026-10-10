-- DIGIY SECURITY V29 — PULSE STATUS RPC ACL CANDIDATE
-- NOT DEPLOYED. REVIEW-ONLY, separate from LOC claim and PULSE claim.
-- This is a permissions-only proposal with no schema, function body, or
-- application data changes. Never run on production without staging
-- evidence, approved consumer map and explicit release authorization.
BEGIN;

DO $v29$
DECLARE signature text;
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.digiy_loc_pulse_mark_sent(uuid)',
    'public.digiy_loc_pulse_mark_sent(uuid,text,text,text)',
    'public.digiy_loc_pulse_fail_backoff(uuid,text,text,text)'
  ] LOOP
    IF to_regprocedure(signature) IS NULL THEN
      RAISE EXCEPTION 'V29 missing PULSE status function: %', signature;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc
      WHERE oid=to_regprocedure(signature) AND prosecdef
    ) THEN
      RAISE EXCEPTION 'V29 unexpected PULSE status contract: %', signature;
    END IF;
  END LOOP;
  IF NOT has_schema_privilege('service_role','public','USAGE') THEN
    RAISE EXCEPTION 'V29 PULSE status: service_role lacks schema usage';
  END IF;
END $v29$;

REVOKE EXECUTE ON FUNCTION public.digiy_loc_pulse_mark_sent(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.digiy_loc_pulse_mark_sent(uuid,text,text,text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.digiy_loc_pulse_fail_backoff(uuid,text,text,text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.digiy_loc_pulse_mark_sent(uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.digiy_loc_pulse_mark_sent(uuid,text,text,text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.digiy_loc_pulse_fail_backoff(uuid,text,text,text)
  TO service_role;

DO $v29$
DECLARE signature text;
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.digiy_loc_pulse_mark_sent(uuid)',
    'public.digiy_loc_pulse_mark_sent(uuid,text,text,text)',
    'public.digiy_loc_pulse_fail_backoff(uuid,text,text,text)'
  ] LOOP
    IF has_function_privilege('anon',signature,'EXECUTE')
      OR has_function_privilege('authenticated',signature,'EXECUTE')
      OR NOT has_function_privilege('service_role',signature,'EXECUTE') THEN
      RAISE EXCEPTION 'V29 PULSE status ACL postcondition failed: %',signature;
    END IF;
  END LOOP;
END $v29$;

COMMIT;
