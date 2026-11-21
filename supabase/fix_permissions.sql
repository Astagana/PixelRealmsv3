-- Perbaikan error: "permission denied for table profiles"
-- Penyebab: project Supabase baru tidak otomatis memberi hak akses tabel ke role "authenticated".
-- Cara: Supabase > SQL Editor > New query > tempel semua ini > Run. Lalu login lagi (tidak perlu register ulang).
grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.worlds  to authenticated;
grant select on public.friends to authenticated;
