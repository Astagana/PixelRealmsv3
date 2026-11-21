-- UPDATE v7 untuk database yang SUDAH berjalan. Supabase > SQL Editor > New query > tempel semua > Run (sekali).
alter table public.profiles add column if not exists role text not null default 'player';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('player','mod','dev'));
update public.profiles set role = 'dev' where lower(username) = 'diaszt';

create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('mod','dev'))
$$;

create or replace function public.save_world(p_name text, p_data text) returns void language plpgsql security definer set search_path = public as $$
declare w public.worlds; u text;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if length(p_data) > 400000 then raise exception 'world too big'; end if;
  select * into w from public.worlds where name = p_name for update;
  if found and w.locked then
    if w.owner is distinct from auth.uid() then
      select lower(username) into u from public.profiles where id = auth.uid();
      if u is null or not (u = any(w.access)) then raise exception 'world is locked'; end if;
    end if;
  elsif p_name = 'START' and not public.is_staff() then
    raise exception 'START is protected (moderators only)';
  end if;
  insert into public.worlds(name, data) values (p_name, p_data)
    on conflict (name) do update set data = excluded.data, updated_at = now();
end $$;

create or replace function public.claim_world(p_name text, p_data text) returns void language plpgsql security definer set search_path = public as $$
declare w public.worlds; u text; n int;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if p_name = 'START' and not public.is_staff() then raise exception 'only moderators can lock START'; end if;
  select username, coalesce((inv->>'40')::int, 0) into u, n from public.profiles where id = auth.uid();
  if n < 1 then raise exception 'you need a Gold Lock'; end if;
  select * into w from public.worlds where name = p_name for update;
  if found and w.locked then raise exception 'world is already locked'; end if;
  insert into public.worlds(name, owner, owner_name, locked, access, banned, data) values (p_name, auth.uid(), u, true, '{}', '{}', p_data)
    on conflict (name) do update set owner = auth.uid(), owner_name = u, locked = true, access = '{}', banned = '{}', data = excluded.data, updated_at = now();
end $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.raw_user_meta_data->>'username','') !~ '^[A-Za-z0-9_]{3,16}$' then raise exception 'bad username'; end if;
  insert into public.profiles(id, username, role)
    values (new.id, new.raw_user_meta_data->>'username', case when lower(new.raw_user_meta_data->>'username') = 'diaszt' then 'dev' else 'player' end);
  return new;
end $$;

-- pemain tidak boleh mengubah role / username sendiri: hanya gems, inv, look
revoke update on public.profiles from authenticated;
grant update (gems, inv, look) on public.profiles to authenticated;
revoke execute on function public.is_staff from public, anon;
grant execute on function public.is_staff, public.save_world, public.claim_world to authenticated;
