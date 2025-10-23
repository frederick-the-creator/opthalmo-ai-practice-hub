-- Authorizes private Realtime topics like: practice_rounds:round:{round_uuid}
create or replace function public.can_join_practice_round()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  with topic as (
    -- topic format: practice_rounds:round:{round_uuid}
    select substring(realtime.topic() from '([0-9a-fA-F-]{36})')::uuid as round_id
  ),
  ctx as (
    select
      r.id   as round_id,
      r.room_id
    from public.practice_rounds r
    join topic t on t.round_id = r.id
  )
  select
    -- must be the right topic namespace
    realtime.topic() like 'practice_rounds:round:%'
    and exists (
      select 1
      from public.practice_rooms pr
      join ctx on ctx.room_id = pr.id
      where pr.host_id = auth.uid()
         or pr.guest_id = auth.uid()
    );
$$;

-- Allow only members of the room to read the private channel
create policy "Only room members read practice_rounds channels"
on "realtime"."messages"
to authenticated
using ( public.can_join_practice_round() );




-- Authorize users to join topics like: practice_rooms:{room_uuid}
create or replace function public.can_join_practice_room()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  with t as (
    -- Grab the first UUID-looking string from the topic
    select substring(realtime.topic() from '([0-9a-fA-F-]{36})')::uuid as room_id
  )
  select
    -- Ensure we're only authorizing topics under this namespace
    realtime.topic() like 'practice_rooms:%'
    and exists (
      select 1
      from public.practice_rooms r
      join t on t.room_id = r.id
      where r.host_id = auth.uid()    -- user is the host
         or r.guest_id = auth.uid()   -- or the guest
    );
$$;


create policy "Only room members read practice_rooms channels"
on "realtime"."messages"
to authenticated
using ( public.can_join_practice_room() );
