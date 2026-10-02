-- DIGIY LOC
-- Ferme les RPC legacy non utilisés par le parcours LOC actuel.
-- Ne touche pas à digiy_loc_public_gallery, digiy_loc_public_room_by_slug
-- ni aux RPC digiy_loc_master_* propriétaires actifs.

revoke execute on function public.digiy_loc_reservations_by_slug(text) from public, anon, authenticated;
revoke execute on function public.digiy_loc_calendar_apply_range(text,text,date,date,text,integer,text) from public, anon, authenticated;
revoke execute on function public.digiy_loc_set_photos(text,uuid,text,text[],text) from public, anon, authenticated;
revoke execute on function public.digiy_loc_claim_pulses(text,integer) from public, anon, authenticated;
revoke execute on function public.digiy_loc_outbox_claim(text,integer) from public, anon, authenticated;
revoke execute on function public.digiy_loc_enqueue_daily(integer) from public, anon, authenticated;
revoke execute on function public.digiy_loc_enqueue_for_reservation(uuid) from public, anon, authenticated;
revoke execute on function public.digiy_loc_mark_pulse_sent(uuid) from public, anon, authenticated;
