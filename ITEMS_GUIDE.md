# Menambah item baru (tanpa menyentuh game.js)

1. Simpan sprite sheet PNG (latar transparan) di `www/assets/`.
   Frame harus sama besar dan tersusun rapi: `lebar gambar / cols` x `tinggi gambar / rows`.
2. Buka `www/items.js`, salin blok contoh, ganti nilainya, tambahkan ke `PR_ITEMS`:

| Kolom | Arti |
|---|---|
| `id` | angka unik, mulai 100 |
| `name`, `price` | nama dan harga gems di Shop (hapus `price` = tidak dijual) |
| `slot` | hair / hat / back / face. Satu item per slot dipakai sekaligus |
| `sheet`, `cols`, `rows`, `frames` | file, susunan grid, jumlah frame |
| `fps` | kecepatan animasi (frame per detik) |
| `scale` | ukuran di karakter (naikkan = lebih besar) |
| `anchor` | titik di frame (0..1) yang menempel di kepala. Satu pasang `[x,y]` atau satu pasang per frame |
| `offset` | geser manual `[maju, turun]` dalam px sprite |
| `layer` | `back` di belakang badan, `front` di depan |
| `trail` | arah gambar mengalir (`left`/`right`/`none`), otomatis dicerminkan agar di belakang karakter |
| `hideBaseHair` | `true` = sembunyikan rambut bawaan |

3. Deploy. Item otomatis masuk Shop, backpack (ketuk untuk pakai/lepas), tampil animasi di karakter, dan terlihat pemain lain.
4. Uji tanpa beli: buka `https://situs-anda/?give=100` (guest bebas; akun biasa hanya moderator/developer).
5. Tidak pas? Ubah `scale`, `anchor`, `offset` di `items.js`, refresh (naikkan versi `V` di `www/sw.js` bila tampilan lama tersangkut).

`PR_SKINS` mengganti gambar item/blok bawaan (id 40 = Gold Lock, 41 = Diamond Lock, dll.).
