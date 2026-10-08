-- DIGIY TRUST V23 — manual, privileged transaction test.
-- This script rolls back. Run only in a controlled maintenance context.
begin;
do $$
declare chosen uuid; inserted uuid;
begin
  select id into chosen from public.digiy_loc_master_units
    where is_active=true order by id limit 1;
  if chosen is null then raise exception 'no active LOC Master unit'; end if;
  insert into digiy_trust_private.voluntary_feedback
    (listing_id, overall_rating, comment, declared_stay, publication_consent, moderation_status, stay_verified)
  values (chosen, 5, 'DIGIY TRUST V23 ROLLBACK TEST ONLY', true, false, 'received', false)
  returning id into inserted;
  if inserted is null then raise exception 'insert did not return id'; end if;
end $$;
rollback;
select count(*) as remaining_test_rows
from digiy_trust_private.voluntary_feedback
where comment='DIGIY TRUST V23 ROLLBACK TEST ONLY';
