-- UPDATE v5 untuk database yang SUDAH berjalan. Jalankan sekali di Supabase > SQL Editor > Run.
alter table public.worlds add column if not exists access text[] not null default '{}';
alter table public.worlds add column if not exists banned text[] not null default '{}';

create or replace function public.save_world(p_name text, p_data text) returns void language plpgsql security definer set search_path = public as $$
declare w public.worlds; u text;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if p_name = 'START' then raise exception 'START is protected'; end if;
  if length(p_data) > 400000 then raise exception 'world too big'; end if;
  select * into w from public.worlds where name = p_name for update;
  if found and w.locked and w.owner is distinct from auth.uid() then
    select lower(username) into u from public.profiles where id = auth.uid();
    if u is null or not (u = any(w.access)) then raise exception 'world is locked'; end if;
  end if;
  insert into public.worlds(name, data) values (p_name, p_data)
    on conflict (name) do update set data = excluded.data, updated_at = now();
end $$;

create or replace function public.claim_world(p_name text, p_data text) returns void language plpgsql security definer set search_path = public as $$
declare w public.worlds; u text; n int;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if p_name = 'START' then raise exception 'START cannot be locked'; end if;
  select username, coalesce((inv->>'40')::int, 0) into u, n from public.profiles where id = auth.uid();
  if n < 1 then raise exception 'you need a Gold Lock'; end if;
  select * into w from public.worlds where name = p_name for update;
  if found and w.locked then raise exception 'world is already locked'; end if;
  insert into public.worlds(name, owner, owner_name, locked, access, banned, data) values (p_name, auth.uid(), u, true, '{}', '{}', p_data)
    on conflict (name) do update set owner = auth.uid(), owner_name = u, locked = true, access = '{}', banned = '{}', data = excluded.data, updated_at = now();
end $$;

create or replace function public.unlock_world(p_name text) returns void language plpgsql security definer set search_path = public as $$
declare w public.worlds;
begin
  select * into w from public.worlds where name = p_name for update;
  if not found or w.owner is distinct from auth.uid() then raise exception 'not your world'; end if;
  update public.worlds set locked = false, owner = null, owner_name = null, access = '{}', banned = '{}' where name = p_name;
end $$;

create or replace function public.set_world_access(p_name text, p_access text[], p_banned text[]) returns void language plpgsql security definer set search_path = public as $$
declare w public.worlds;
begin
  select * into w from public.worlds where name = p_name for update;
  if not found or not w.locked or w.owner is distinct from auth.uid() then raise exception 'only the world owner can change this'; end if;
  if coalesce(array_length(p_access,1),0) > 60 or coalesce(array_length(p_banned,1),0) > 60 then raise exception 'list too long'; end if;
  update public.worlds set access = (select coalesce(array_agg(distinct lower(x)), '{}') from unnest(p_access) x),
                           banned = (select coalesce(array_agg(distinct lower(x)), '{}') from unnest(p_banned) x) where name = p_name;
end $$;

revoke execute on function public.set_world_access from public, anon;
grant  execute on function public.save_world, public.claim_world, public.unlock_world, public.set_world_access to authenticated;
grant select on public.worlds to authenticated;
