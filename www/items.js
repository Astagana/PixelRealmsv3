/* =====================================================================
   PIXEL REALM - ITEM KUSTOM (items.js)
   Cara menambah item baru, TANPA menyentuh game.js:
     1. Taruh sprite sheet PNG (latar transparan) di folder  www/assets/
     2. Tambahkan 1 blok { ... } di PR_ITEMS di bawah ini
     3. Simpan, deploy. Item otomatis: muncul di Shop, masuk backpack saat dibeli,
        bisa dipakai/dilepas (ketuk item di Backpack), tampil animasi di karakter
        dan terlihat oleh pemain lain.
   Uji cepat tanpa beli: buka game dengan  ?give=100  di URL (akun biasa: hanya
   moderator/developer; mode guest: bebas). Pisahkan beberapa id dengan koma.
   ===================================================================== */
window.PR_ITEMS = [
  {
    id: 100,                       // nomor unik, mulai dari 100 (jangan dipakai ulang)
    name: 'Malevolent Hair',       // nama di Shop / Backpack
    slot: 'hair',                  // satu item per slot dipakai sekaligus (hair, hat, back, face, ...)
    price: 5000,                   // harga gems di Shop. Hapus baris ini = tidak dijual
    sheet: 'assets/Malevolent_Hair_Animated.png',
    cols: 4, rows: 3, frames: 12,  // susunan sprite sheet (kolom x baris) dan jumlah frame yang dipakai
    fps: 10,                       // kecepatan animasi (frame per detik). 12 frame / 10 fps = 1,2 detik per putaran
    scale: 0.22,                   // ukuran: 1 px gambar = 0.22 px sprite karakter (naikkan = lebih besar)
    anchor: [                      // titik pada frame (0..1) yang menempel di kepala; 1 pasang untuk semua frame, atau 1 pasang per frame
      [0.62, 0.57], [0.63, 0.575], [0.64, 0.57], [0.66, 0.57],
      [0.68, 0.58], [0.69, 0.55], [0.69, 0.53], [0.67, 0.54],
      [0.68, 0.54], [0.67, 0.53], [0.67, 0.535], [0.70, 0.54]
    ],
    offset: [2.5, -1.5],           // geser manual (px sprite): [maju(+)/mundur(-), turun(+)/naik(-)]
    faceCut: [5.8, 4.8, 1.0, 4.0], // 'jendela wajah' agar wajah tidak tertutup: [lebar, tinggi, geser x, geser y] px sprite dari titik anchor. Hapus baris ini = tidak dilubangi
    layer: 'front',                // 'front' = dipakai di atas kepala/badan, 'back' = di belakang badan
    trail: 'left',                 // arah gambar mengalir: 'left' | 'right' | 'none'. Otomatis dicerminkan agar selalu di belakang karakter
    hideBaseHair: true             // true = sembunyikan rambut bawaan saat dipakai
  }

  /* CONTOH item tidak beranimasi (cukup 1 frame):
  ,{ id: 101, name: 'Topi Merah', slot: 'hat', price: 800,
     sheet: 'assets/topi_merah.png', cols: 1, rows: 1, frames: 1,
     scale: 0.12, anchor: [0.5, 0.85], layer: 'front', trail: 'none' }
  */
];

/* SKIN: ganti tampilan blok/item bawaan dengan gambar sendiri (PNG latar transparan).
   id bawaan: 40 = Gold Lock, 41 = Diamond Lock, 43 = Pickaxe, 44 = Wing, 45 = Speed Boots, 31 = Pepper, dst. */
window.PR_SKINS = [
  { id: 40, src: 'assets/gold_lock.png' },
  { id: 41, src: 'assets/diamond_lock.png' }
];
