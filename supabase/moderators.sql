-- Moderator dengan akses penuh (membangun/mengunci world START, simpan ke database).
-- Samakan daftar ini dengan www/moderators.txt, lalu Run di Supabase > SQL Editor. Ulangi setiap daftar berubah.
update public.profiles set role = 'player' where role = 'mod';
update public.profiles set role = 'mod' where lower(username) in ('DoctorD');   -- ganti dengan username moderator (huruf kecil)
update public.profiles set role = 'dev' where lower(username) = 'DoctorD';
