-- DIGIY TRUST V17 — REVIEW ONLY, NOT DEPLOYED
-- This replaces the V14 draft, which MUST NOT be executed alongside this migration.
-- The schema must remain outside Supabase exposed schemas.
begin;
create schema if not exists digiy_trust_private;
revoke all on schema digiy_trust_private from public, anon, authenticated;
create table if not exists digiy_trust_private.voluntary_feedback (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.digiy_loc_master_units(id),
  overall_rating smallint not null check (overall_rating between 1 and 5),
  cleanliness smallint check (cleanliness between 1 and 5),
  comfort smallint check (comfort between 1 and 5),
  welcome smallint check (welcome between 1 and 5),
  comment text not null default '' check (char_length(comment)<=1500),
  declared_stay boolean not null default true check (declared_stay=true),
  publication_consent boolean not null default false,
  moderation_status text not null default 'received' check (moderation_status='received'),
  stay_verified boolean not null default false check (stay_verified=false),
  created_at timestamptz not null default now()
);
alter table digiy_trust_private.voluntary_feedback enable row level security;
revoke all on digiy_trust_private.voluntary_feedback from public, anon, authenticated;
-- NO anon/authenticated grants, RLS policies, publication views or RPCs.
-- Service-role writes need a server-side connection with private schema privileges.
commit;
