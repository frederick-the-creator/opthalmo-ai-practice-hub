-- Authorizes private Realtime topics like: practice_rounds:room:{room_uuid}
create or replace function public.can_join_practice_rounds_room()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  with t as (
    -- topic format: practice_rounds:room:{room_uuid}
    select substring(realtime.topic() from '([0-9a-fA-F-]{36})')::uuid as room_id
  )
  select
    -- must be the right topic namespace
    realtime.topic() like 'practice_rounds:room:%'
    and exists (
      select 1
      from public.practice_rooms pr
      join t on t.room_id = pr.id
      where pr.host_id = auth.uid()
         or pr.guest_id = auth.uid()
    );
$$;

-- Allow only members of the room to read the practice_rounds room channel
create policy "Only room members read practice_rounds by room channels"
on "realtime"."messages"
to authenticated
using ( public.can_join_practice_rounds_room() );
