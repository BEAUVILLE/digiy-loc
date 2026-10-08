-- DIGIY TRUST V1 — migration proposée, NON APPLIQUÉE.
-- Requires a trusted server-side attestation + verified client identity.
-- Never expose service-role key to browser.
begin;
create table if not exists public.digiy_trust_invitations (
 id uuid primary key default gen_random_uuid(),
 source_module text not null check (source_module in ('loc','resto','driver')),
 source_reservation_id text not null,
 professional_id text not null,
 client_subject_hash text not null,
 token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
 issued_at timestamptz not null default now(),
 expires_at timestamptz not null,
 consumed_at timestamptz,
 constraint trust_invitation_expiry check (expires_at > issued_at),
 unique(source_module, source_reservation_id)
);
create table if not exists public.digiy_trust_reviews (
 id uuid primary key default gen_random_uuid(),
 invitation_id uuid not null unique references public.digiy_trust_invitations(id),
 source_module text not null check (source_module in ('loc','resto','driver')),
 source_reservation_id text not null,
 professional_id text not null,
 ratings jsonb not null check (jsonb_typeof(ratings) = 'object'),
 created_at timestamptz not null default now(),
 unique(source_module, source_reservation_id)
);
create index if not exists digiy_trust_reviews_pro_idx on public.digiy_trust_reviews(professional_id,source_module);
alter table public.digiy_trust_invitations enable row level security;
alter table public.digiy_trust_reviews enable row level security;
revoke all on public.digiy_trust_invitations from anon, authenticated;
revoke all on public.digiy_trust_reviews from anon, authenticated;
-- No policies: only trusted server service role may access directly.
-- Server must validate eligibility, token, client binding, ratings,
-- then lock invitation row FOR UPDATE, INSERT review and set consumed_at
-- in one database transaction. Never perform these as separate HTTP calls.
commit;
