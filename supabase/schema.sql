-- Jalankan seluruh file ini di Supabase > SQL Editor > New query > Run

-- ===== profil / akun =====
create table public.profiles(
  id uuid primary key references auth.users on delete cascade,
  username text not null,
  look jsonb not null default '{}',
  role text not null default 'player' check (role in ('player','mod','dev')),
  gems int not null default 50 check (gems >= 0),
  inv jsonb not null default '{"2":10,"30":5}',
  created_at timestamptz default now()
);
create unique index profiles_username_key on public.profiles (lower(username));
alter table public.profiles enable row level security;
create policy "read own" on public.profiles for select using (auth.uid() = id);
create policy "update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- profil dibuat otomatis saat register; username unik (tanpa beda huruf besar/kecil)
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.raw_user_meta_data->>'username','') !~ '^[A-Za-z0-9_]{3,16}$' then raise exception 'bad username'; end if;
  insert into public.profiles(id, username, role)
    values (new.id, new.raw_user_meta_data->>'username', case when lower(new.raw_user_meta_data->>'username') = 'diaszt' then 'dev' else 'player' end);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 1 akun = 1 username, tidak bisa diganti
create function public.prevent_rename() returns trigger language plpgsql as $$
begin
  if new.username <> old.username then raise exception 'username cannot be changed'; end if;
  return new;
end $$;
create trigger no_rename before update on public.profiles for each row execute function public.prevent_rename();

-- ===== world =====
create table public.worlds(
  name text primary key check (name ~ '^[A-Z0-9]{1,16}$'),
  owner uuid references auth.users on delete set null,
  owner_name text,
  locked boolean not null default false,
  access text[] not null default '{}',
  banned text[] not null default '{}',
  data text not null,
  updated_at timestamptz default now()
);
alter table public.worlds enable row level security;
create policy "read worlds" on public.worlds for select to authenticated using (true);
-- tidak ada policy insert/update/delete: semua perubahan lewat fungsi di bawah

create function public.save_world(p_name text, p_data text) returns void language plpgsql security definer set search_path = public as $$
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

-- Gold Lock: pemain harus punya item (id 40) di inventori
create function public.claim_world(p_name text, p_data text) returns void language plpgsql security definer set search_path = public as $$
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

create function public.unlock_world(p_name text) returns void language plpgsql security definer set search_path = public as $$
declare w public.worlds;
begin
  select * into w from public.worlds where name = p_name for update;
  if not found or w.owner is distinct from auth.uid() then raise exception 'not your world'; end if;
  update public.worlds set locked = false, owner = null, owner_name = null, access = '{}', banned = '{}' where name = p_name;
end $$;

-- ===== roulette (hasil diundi di server) =====
create function public.spin_roulette(p_kind text, p_num int, p_amount int) returns json language plpgsql security definer set search_path = public as $$
declare g int; r int; mult int := 0; delta int;
  reds int[] := array[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if p_amount < 1 or p_amount > 1000 then raise exception 'bet must be 1-1000'; end if;
  select gems into g from public.profiles where id = auth.uid() for update;
  if g < p_amount then raise exception 'not enough gems'; end if;
  r := floor(random() * 37)::int;
  if    p_kind = 'red'   and r > 0 and r = any(reds)         then mult := 1;
  elsif p_kind = 'black' and r > 0 and not r = any(reds)     then mult := 1;
  elsif p_kind = 'odd'   and r > 0 and r % 2 = 1             then mult := 1;
  elsif p_kind = 'even'  and r > 0 and r % 2 = 0             then mult := 1;
  elsif p_kind = 'low'   and r between 1 and 18              then mult := 1;
  elsif p_kind = 'high'  and r between 19 and 36             then mult := 1;
  elsif p_kind = 'd1'    and r between 1 and 12              then mult := 2;
  elsif p_kind = 'd2'    and r between 13 and 24             then mult := 2;
  elsif p_kind = 'd3'    and r between 25 and 36             then mult := 2;
  elsif p_kind = 'num'   and p_num between 0 and 36 and r = p_num then mult := 35;
  elsif p_kind not in ('red','black','odd','even','low','high','d1','d2','d3','num') then raise exception 'bad bet';
  end if;
  delta := case when mult > 0 then p_amount * mult else -p_amount end;
  update public.profiles set gems = gems + delta where id = auth.uid();
  return json_build_object('r', r, 'delta', delta, 'gems', g + delta);
end $$;

-- hanya user login yang boleh memanggil fungsi
revoke execute on function public.save_world, public.claim_world, public.unlock_world, public.spin_roulette from public, anon;
grant  execute on function public.save_world, public.claim_world, public.unlock_world, public.spin_roulette to authenticated;

-- ===== teman =====
create table public.friends(
  user_id uuid references auth.users on delete cascade,
  friend_id uuid references auth.users on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
alter table public.friends enable row level security;
create policy "own friends" on public.friends for select using (auth.uid() in (user_id, friend_id));

create function public.add_friend(p_username text) returns text language plpgsql security definer set search_path = public as $$
declare t uuid; rev public.friends;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select id into t from public.profiles where lower(username) = lower(p_username);
  if t is null then raise exception 'No player named %', p_username; end if;
  if t = auth.uid() then raise exception 'That is you'; end if;
  select * into rev from public.friends where user_id = t and friend_id = auth.uid();
  if found then
    update public.friends set status = 'accepted' where user_id = t and friend_id = auth.uid();
    insert into public.friends(user_id, friend_id, status) values (auth.uid(), t, 'accepted')
      on conflict (user_id, friend_id) do update set status = 'accepted';
    return 'You are now friends';
  end if;
  insert into public.friends(user_id, friend_id) values (auth.uid(), t) on conflict do nothing;
  return 'Friend request sent';
end $$;

create function public.respond_friend(p_username text, p_action text) returns void language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  select id into t from public.profiles where lower(username) = lower(p_username);
  if t is null then raise exception 'unknown player'; end if;
  if p_action = 'accept' then
    update public.friends set status = 'accepted' where user_id = t and friend_id = auth.uid();
    if not found then raise exception 'no request from that player'; end if;
    insert into public.friends(user_id, friend_id, status) values (auth.uid(), t, 'accepted')
      on conflict (user_id, friend_id) do update set status = 'accepted';
  elsif p_action = 'remove' then
    delete from public.friends where (user_id = auth.uid() and friend_id = t) or (user_id = t and friend_id = auth.uid());
  else raise exception 'bad action';
  end if;
end $$;

create function public.list_friends() returns table(username text, status text) language sql security definer set search_path = public as $$
  select p.username, case f.status when 'accepted' then 'friend' else 'outgoing' end
    from public.friends f join public.profiles p on p.id = f.friend_id where f.user_id = auth.uid()
  union all
  select p.username, 'incoming'
    from public.friends f join public.profiles p on p.id = f.user_id where f.friend_id = auth.uid() and f.status = 'pending'
$$;

-- ===== world terkenal (1 kunjungan per pemain per world per 10 menit) =====
create table public.world_stats(name text primary key, visits bigint not null default 0);
create table public.world_visits(user_id uuid, name text, last_at timestamptz not null default now(), primary key (user_id, name));
alter table public.world_stats enable row level security;
alter table public.world_visits enable row level security;

create function public.visit_world(p_name text) returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_name !~ '^[A-Z0-9]{1,16}$' then return; end if;
  with up as (
    insert into public.world_visits(user_id, name) values (auth.uid(), p_name)
    on conflict (user_id, name) do update set last_at = now() where public.world_visits.last_at < now() - interval '10 minutes'
    returning 1)
  insert into public.world_stats(name, visits) select p_name, 1 from up
  on conflict (name) do update set visits = public.world_stats.visits + 1;
end $$;

create function public.top_worlds() returns table(name text, visits bigint, owner_name text) language sql security definer set search_path = public as $$
  select s.name, s.visits, w.owner_name from public.world_stats s left join public.worlds w on w.name = s.name
  where s.name <> 'START' order by s.visits desc, s.name limit 10
$$;

revoke execute on function public.add_friend, public.respond_friend, public.list_friends, public.visit_world, public.top_worlds from public, anon;
grant  execute on function public.add_friend, public.respond_friend, public.list_friends, public.visit_world, public.top_worlds to authenticated;

-- ===== hak akses tabel (wajib di project Supabase baru) =====
grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.worlds  to authenticated;
grant select on public.friends to authenticated;

-- ===== v5: daftar akses/ban per world (Wrench) =====
create function public.set_world_access(p_name text, p_access text[], p_banned text[]) returns void language plpgsql security definer set search_path = public as $$
declare w public.worlds;
begin
  select * into w from public.worlds where name = p_name for update;
  if not found or not w.locked or w.owner is distinct from auth.uid() then raise exception 'only the world owner can change this'; end if;
  if coalesce(array_length(p_access,1),0) > 60 or coalesce(array_length(p_banned,1),0) > 60 then raise exception 'list too long'; end if;
  update public.worlds set access = (select coalesce(array_agg(distinct lower(x)), '{}') from unnest(p_access) x),
                           banned = (select coalesce(array_agg(distinct lower(x)), '{}') from unnest(p_banned) x) where name = p_name;
end $$;
revoke execute on function public.set_world_access from public, anon;
grant  execute on function public.set_world_access to authenticated;

-- ===== v7: staff (moderator/developer) =====
create function public.is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('mod','dev'))
$$;
revoke update on public.profiles from authenticated;
grant update (gems, inv, look) on public.profiles to authenticated;
revoke execute on function public.is_staff from public, anon;
grant execute on function public.is_staff to authenticated;
