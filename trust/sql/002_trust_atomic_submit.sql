-- DIGIY TRUST: draft only, NOT deployed.
-- Called exclusively by a trusted server using service_role.
-- p_token_hash must be SHA-256 of a validated 32-byte random token,
-- computed server-side; never accept a browser-supplied hash.
-- p_client_subject_hash must come from an independently verified client identity.
create or replace function public.digiy_trust_submit_review_v1(
  p_token_hash text,
  p_client_subject_hash text,
  p_ratings jsonb
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_inv public.digiy_trust_invitations%rowtype;
  v_review_id uuid;
  v_key text;
  v_value jsonb;
  v_allowed text[];
begin
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$'
     or p_client_subject_hash is null or length(p_client_subject_hash) < 32
  then
    raise exception 'invalid_request';
  end if;
  select * into v_inv
    from public.digiy_trust_invitations
    where token_hash = p_token_hash
    for update;
  if not found or v_inv.consumed_at is not null
     or v_inv.expires_at <= now()
     or v_inv.client_subject_hash <> p_client_subject_hash
  then
    raise exception 'invitation_unavailable';
  end if;
  if p_ratings is null or jsonb_typeof(p_ratings) <> 'object'
     or p_ratings = '{}'::jsonb then
    raise exception 'invalid_ratings';
  end if;
  v_allowed := array['reliability','quality','welcome','value_for_money'];
  if v_inv.source_module = 'loc' then
    v_allowed := v_allowed || array['cleanliness','comfort'];
  elsif v_inv.source_module = 'resto' then
    v_allowed := v_allowed || array['food_quality'];
  elsif v_inv.source_module = 'driver' then
    v_allowed := v_allowed || array['driving_safety'];
  end if;
  for v_key, v_value in select key,value from jsonb_each(p_ratings) loop
    if not (v_key = any(v_allowed))
       or jsonb_typeof(v_value) <> 'number'
       or v_value::text !~ '^[1-5]$' then
      raise exception 'invalid_ratings';
    end if;
  end loop;
  insert into public.digiy_trust_reviews
    (invitation_id,source_module,source_reservation_id,professional_id,ratings)
  values
    (v_inv.id,v_inv.source_module,v_inv.source_reservation_id,v_inv.professional_id,p_ratings)
  returning id into v_review_id;
  update public.digiy_trust_invitations
    set consumed_at = now()
    where id = v_inv.id;
  return v_review_id;
end;
$$;
revoke all on function public.digiy_trust_submit_review_v1(text,text,jsonb) from public, anon, authenticated;
grant execute on function public.digiy_trust_submit_review_v1(text,text,jsonb) to service_role;
