-- DIGIY SECURITY V29 — OUTBOX ACL CANDIDATE
-- REVIEW ONLY: do not apply to production until the active worker and
-- all consumers are identified, staging regression tests pass, and
-- deployment is expressly approved. No TRUST V26 gate bypass.
--
-- Limits scope to exact signatures. PostgreSQL's PUBLIC grant and the
-- explicit anon/authenticated grants must all be revoked.
--
-- This candidate changes only EXECUTE privileges, NOT functions/data/RLS.
BEGIN;

DO $v29$
DECLARE
  expected text[] := ARRAY[
    'public.digiy_loc_outbox_claim_due(integer,text)',
    'public.digiy_loc_outbox_mark_sent(uuid)',
    'public.digiy_loc_outbox_mark_failed(uuid,text)'
  ];
  signature text;
BEGIN
  FOREACH signature IN ARRAY expected LOOP
    IF to_regprocedure(signature) IS NULL THEN
      RAISE EXCEPTION 'V29 missing required function: %', signature;
    END IF;
    IF NOT EXISTS (
      SELECT 1
      FROM pg_proc
      WHERE oid = to_regprocedure(signature)
        AND prosecdef
    ) THEN
      RAISE EXCEPTION 'V29 unexpected SECURITY DEFINER contract: %', signature;
    END IF;
  END LOOP;
  IF NOT has_schema_privilege('service_role', 'public', 'USAGE') THEN
    RAISE EXCEPTION 'V29 service_role lacks public schema USAGE';
  END IF;
END
$v29$;

REVOKE EXECUTE ON FUNCTION public.digiy_loc_outbox_claim_due(integer,text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.digiy_loc_outbox_mark_sent(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.digiy_loc_outbox_mark_failed(uuid,text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.digiy_loc_outbox_claim_due(integer,text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.digiy_loc_outbox_mark_sent(uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.digiy_loc_outbox_mark_failed(uuid,text)
  TO service_role;

DO $v29$
DECLARE
  signature text;
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.digiy_loc_outbox_claim_due(integer,text)',
    'public.digiy_loc_outbox_mark_sent(uuid)',
    'public.digiy_loc_outbox_mark_failed(uuid,text)'
  ] LOOP
    IF has_function_privilege('anon', signature, 'EXECUTE')
       OR has_function_privilege('authenticated', signature, 'EXECUTE')
       OR NOT has_function_privilege('service_role', signature, 'EXECUTE') THEN
      RAISE EXCEPTION 'V29 ACL assertion failed: %', signature;
    END IF;
  END LOOP;
END
$v29$;

COMMIT;
