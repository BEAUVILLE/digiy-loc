-- DIGIY TRUST V22: READ ONLY. Safe to run on the existing private schema.
select
  r.rolname,
  has_schema_privilege(r.oid, 'digiy_trust_private', 'USAGE') as schema_usage,
  has_table_privilege(r.oid, 'digiy_trust_private.voluntary_feedback', 'SELECT') as can_select,
  has_table_privilege(r.oid, 'digiy_trust_private.voluntary_feedback', 'INSERT') as can_insert,
  has_table_privilege(r.oid, 'digiy_trust_private.voluntary_feedback', 'UPDATE') as can_update,
  has_table_privilege(r.oid, 'digiy_trust_private.voluntary_feedback', 'DELETE') as can_delete
from pg_roles r
where r.rolname in ('anon','authenticated','service_role','postgres')
order by r.rolname;

select c.relrowsecurity as rls_enabled, c.relforcerowsecurity as force_rls,
  (select count(*) from pg_policies p where p.schemaname='digiy_trust_private' and p.tablename='voluntary_feedback') as policy_count
from pg_class c where c.oid='digiy_trust_private.voluntary_feedback'::regclass;
