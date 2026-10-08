begin read only;
select n.nspname,n.nspacl from pg_namespace n where nspname in ('public','digiy_trust_private');
select c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relacl,pg_get_userbyid(c.relowner) as owner from pg_class c join pg_namespace n on n.oid=c.relnamespace where (n.nspname='digiy_trust_private' or (n.nspname='public' and c.relname='digiy_loc_master_units'));
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname='digiy_trust_private' or tablename='digiy_loc_master_units';
select r.rolname,r.rolsuper,r.rolinherit,r.rolcreaterole,r.rolcreatedb,r.rolcanlogin,r.rolbypassrls,
has_schema_privilege(r.oid,'digiy_trust_private','USAGE') as private_usage,
has_table_privilege(r.oid,'digiy_trust_private.voluntary_feedback','SELECT') as private_select,
has_table_privilege(r.oid,'digiy_trust_private.voluntary_feedback','INSERT') as private_insert,
has_column_privilege(r.oid,'public.digiy_loc_master_units','id','SELECT') as unit_id_select,
has_column_privilege(r.oid,'public.digiy_loc_master_units','is_active','SELECT') as unit_active_select
from pg_roles r where rolname in ('anon','authenticated','authenticator','service_role','digiy_trust_server');
select coalesce(r.rolname,'ALL') as role_name,s.setconfig from pg_db_role_setting s left join pg_roles r on r.oid=s.setrole where exists (select 1 from unnest(s.setconfig) c where c like 'pgrst.db_schemas=%');
select tgname,pg_get_triggerdef(t.oid) as definition from pg_trigger t where tgrelid='digiy_trust_private.voluntary_feedback'::regclass and not tgisinternal;
select conname,pg_get_constraintdef(oid) as definition from pg_constraint where conrelid='digiy_trust_private.voluntary_feedback'::regclass;
rollback;
