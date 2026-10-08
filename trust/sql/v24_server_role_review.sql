-- DIGIY TRUST V24 — REVIEW ONLY. DO NOT EXECUTE WITHOUT SERVER ROLE DESIGN APPROVAL.
-- Dedicated login roles need credential rotation, secure hosting, and explicit privileges.
-- An INSERT policy alone is not sufficient for an INSERT ... RETURNING id statement:
-- RETURNING needs SELECT privileges and a matching SELECT RLS policy.
-- Prefer a dedicated narrow backend identity over broad service_role privileges.
--
-- Example privilege boundary for a future named role (not created here):
-- GRANT USAGE ON SCHEMA digiy_trust_private TO <dedicated_server_role>;
-- GRANT INSERT ON digiy_trust_private.voluntary_feedback TO <dedicated_server_role>;
-- GRANT USAGE ON SCHEMA public TO <dedicated_server_role>;
-- GRANT SELECT (id,is_active) ON public.digiy_loc_master_units TO <dedicated_server_role>;
--
-- IMPORTANT: no SQL above is executable as-is. Define RLS insert policy and
-- modify storage adapter to avoid RETURNING id, or explicitly authorize SELECT.
-- Never grant anon/authenticated, and never store a DB password in GitHub.
select current_database() as database_name,
 has_schema_privilege('anon','digiy_trust_private','USAGE') as anon_usage,
 has_schema_privilege('authenticated','digiy_trust_private','USAGE') as auth_usage,
 has_schema_privilege('service_role','digiy_trust_private','USAGE') as service_usage;
