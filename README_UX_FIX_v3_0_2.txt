PORTAL KEPERAWATAN v3.0.2 — UX FIX

Perbaikan:
1. Tab aktif memakai warna kelompok/submateri:
   - SKP teal/hijau
   - PAP merah
   - PPI biru
   - PKPO ungu
   - dan seterusnya
2. Seluruh area kartu kelompok dan kartu submateri dapat diklik.
3. Tombol favorit tetap tidak membuka kartu.
4. Kartu dapat dibuka menggunakan Enter/Space saat memakai keyboard.
5. Cache PWA dinaikkan ke v3.0.2.

Cara patch:
- Upload seluruh isi ZIP patch ke root repository.
- Timpa index.html, 404.html, dan sw.js.
- Pastikan tiga file baru ikut masuk:
  assets/css/styles-v3-0-2.css
  assets/js/app-v3-0-2.js
  assets/data/catalog-v3-0-2.json
- Tunggu deployment hijau.
- Buka https://ocim23.github.io/portal-keperawatan/?ux=302#/home
- Tekan Ctrl+F5 satu kali.
