# Portal Keperawatan v4.2.0 — Revisi Fokus Keperawatan

Paket statis **GitHub Pages + PWA**. Tidak memerlukan Apps Script, Google Sheet, atau database.

## Isi revisi

- 9 kelompok standar: SKP, PP, PAP, PPI, PKPO, PMKP, HPK, KE, dan MFK.
- 62 submateri: 38 **Praktik Wajib** dan 24 **Pengetahuan Wajib**.
- 376 bagian pembelajaran dan 524 soal pada bank kuis.
- Materi tata kelola/teknis yang bukan fokus langsung perawat tidak dibuat menjadi kartu.
- Setiap halaman kelompok memiliki catatan cakupan dan daftar nomor yang sengaja tidak ditampilkan.
- Nomor dan nama standar dipertahankan pada kartu serta halaman materi.
- Tombol **Kembali ke [kelompok]** tersedia pada desktop/PWA dan mobile.
- Back/Forward memulihkan posisi scroll; favorit, riwayat, dan progres poster tersimpan di perangkat.
- Filter: Semua, Praktik Wajib, dan Pengetahuan Wajib.

## Publikasi di GitHub Pages

1. Ekstrak ZIP.
2. Upload **seluruh isi folder** ke root repository GitHub.
3. Settings → Pages → Deploy from a branch → `main` → `/ (root)`.
4. Tunggu publikasi, lalu lakukan hard refresh bila versi lama masih tercache.

## Instal sebagai aplikasi

Buka portal dari Chrome/Edge, lalu pilih **Install app** atau **Tambahkan ke layar utama**.

## Berkas yang sering diedit

- `content/*.json` — isi tiap submateri.
- `assets/data/catalog-v4-2-0.json` — susunan kelompok, catatan cakupan, prioritas, dan metadata pencarian.
- `assets/js/app-v4-2-0.js` — navigasi, filter, kuis, favorit, pencarian, dan PWA.
- `assets/css/styles-v4-2-0.css` — desain desktop/mobile.

## Batas penggunaan

Portal merupakan media pembelajaran internal/pribadi, bukan situs resmi rumah sakit. Penerapan klinis, kode darurat, daftar obat, lokasi alat, alur pelaporan, titik kumpul, dan kewenangan harus mengikuti regulasi serta SPO rumah sakit.
