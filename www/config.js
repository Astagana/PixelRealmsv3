// Isi dari Supabase: Project Settings > API. Anon key memang publik (aman ditaruh di sini).
// Kosongkan = game tetap jalan offline (guest), fitur online nonaktif.
window.PR_CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  EMAIL_DOMAIN: 'pixelrealm.app' // email palsu internal: username@domain. Ganti jika Supabase menolak domain ini.
};
