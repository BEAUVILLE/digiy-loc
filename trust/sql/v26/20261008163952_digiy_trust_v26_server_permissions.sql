-- DIGIY TRUST V26 — CANDIDATE ONLY. No production deployment authorized.
-- Generated with Supabase CLI migration new; deliberately kept OUTSIDE the
-- automatic supabase/migrations path. V17 must already exist. One-shot migration.
-- No login, password, membership, API exposure or SECURITY DEFINER function.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $preflight$
begin
  if exists (select 1 from pg_roles where rolname = 'digiy_trust_server') then
    raise exception 'V26: role already exists; audit instead of reusing it';
  end if;
  if not exists (select 1 from pg_class where oid = 'digiy_trust_private.voluntary_feedback'::regclass and relrowsecurity)
     or not exists (select 1 from pg_class where oid = 'public.digiy_loc_master_units'::regclass and relrowsecurity) then
    raise exception 'V26: RLS prerequisite missing';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'digiy_trust_private' and tablename = 'voluntary_feedback') then
    raise exception 'V26: unexpected private policies; audit drift first';
  end if;
  if exists (select 1 from pg_roles r where r.rolname in ('anon','authenticated','authenticator','service_role') and
     (has_schema_privilege(r.oid,'digiy_trust_private','USAGE')
      or has_any_column_privilege(r.oid,'digiy_trust_private.voluntary_feedback','SELECT,INSERT,UPDATE,REFERENCES')
      or has_table_privilege(r.oid,'digiy_trust_private.voluntary_feedback','DELETE,TRUNCATE,TRIGGER'))) then
    raise exception 'V26: private ACL drift; audit first';
  end if;
  -- NOINHERIT does not remove PUBLIC privileges. Do not silently grant a new
  -- server identity access to existing privileged application functions.
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname not in ('pg_catalog','information_schema') and p.prosecdef
      and exists (select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
                  where a.grantee = 0 and a.privilege_type = 'EXECUTE')
      and exists (select 1 from aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a
                  where a.grantee = 0 and a.privilege_type = 'USAGE')
  ) then
    raise exception 'V26: PUBLIC SECURITY DEFINER access; separate audit required';
  end if;
  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
    where c.relkind in ('r','v','m','p') and n.nspname not in ('pg_catalog','information_schema')
      and a.grantee = 0
      and exists (select 1 from aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) s
                  where s.grantee = 0 and s.privilege_type = 'USAGE')
  ) then
    raise exception 'V26: PUBLIC relation access; separate audit required';
  end if;
end
$preflight$;

create role digiy_trust_server nologin noinherit nosuperuser nocreatedb
  nocreaterole noreplication nobypassrls;

grant usage on schema public, digiy_trust_private to digiy_trust_server;
grant select (id, is_active) on public.digiy_loc_master_units to digiy_trust_server;
grant insert (listing_id, overall_rating, cleanliness, comfort, welcome, comment,
              declared_stay, publication_consent, moderation_status, stay_verified)
  on digiy_trust_private.voluntary_feedback to digiy_trust_server;

-- Only this new role is targeted; existing LOC/owner policies remain unchanged.
create policy trust_v26_active_units on public.digiy_loc_master_units
  for select to digiy_trust_server using (is_active = true);
create policy trust_v26_active_units_guard on public.digiy_loc_master_units
  as restrictive for select to digiy_trust_server using (is_active = true);

create policy trust_v26_insert_feedback on digiy_trust_private.voluntary_feedback
  for insert to digiy_trust_server
  with check (
    declared_stay = true and stay_verified = false and moderation_status = 'received'
    and exists (select 1 from public.digiy_loc_master_units u
                where u.id = listing_id and u.is_active = true)
  );
-- No private SELECT/UPDATE/DELETE policy or privilege; no INSERT RETURNING.
-- Existing V17 CHECK constraints still enforce scores, length and fixed status.
commit;
