-- UPDATE v10 (database yang sudah berjalan): Diamond Lock juga bisa mengunci world. Run sekali di SQL Editor.
create or replace function public.claim_world(p_name text, p_data text) returns void language plpgsql security definer set search_path = public as $$
declare w public.worlds; u text; n int;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if p_name = 'START' and not public.is_staff() then raise exception 'only moderators can lock START'; end if;
  select username, coalesce((inv->>'40')::int, 0) + coalesce((inv->>'41')::int, 0) into u, n from public.profiles where id = auth.uid();
  if n < 1 then raise exception 'you need a Gold Lock or Diamond Lock'; end if;
  select * into w from public.worlds where name = p_name for update;
  if found and w.locked then raise exception 'world is already locked'; end if;
  insert into public.worlds(name, owner, owner_name, locked, access, banned, data) values (p_name, auth.uid(), u, true, '{}', '{}', p_data)
    on conflict (name) do update set owner = auth.uid(), owner_name = u, locked = true, access = '{}', banned = '{}', data = excluded.data, updated_at = now();
end $$;
grant execute on function public.claim_world to authenticated;
