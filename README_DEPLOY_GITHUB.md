# Portal Keperawatan — GitHub Pages + PWA

Portal ini adalah versi statis. Apps Script, Google Drive, dan Google Sheet tidak lagi diperlukan untuk menjalankan portal.

## Publikasi gratis di GitHub Pages

1. Buat repository GitHub baru, misalnya `portal-keperawatan`.
2. Repository harus **Public** agar GitHub Pages gratis.
3. Ekstrak ZIP ini.
4. Upload **seluruh isi folder ini** ke root repository. Jangan upload folder pembungkusnya saja.
5. Commit ke branch `main`.
6. Buka **Settings → Pages**.
7. Pada **Build and deployment**, pilih:
   - Source: **Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
8. Klik **Save** dan tunggu proses publikasi.
9. URL biasanya berbentuk:
   `https://USERNAME.github.io/portal-keperawatan/`

Routing memakai hash (`#/group/pap` dan `#/topic/pap-bhd`), sehingga refresh dan link langsung aman di GitHub Pages.

## Membuka seperti aplikasi di HP

Buka portal di Chrome, lalu pilih:
- menu tiga titik;
- **Tambahkan ke layar utama** atau **Instal aplikasi**.

Versi terpasang memakai mode `standalone`, sehingga bilah alamat browser tidak memenuhi area belajar.

## Privasi dan akses

- Tidak ada login.
- Tidak menyimpan email atau identitas pengguna.
- Favorit, riwayat, posisi poster dan progres kuis disimpan pada browser perangkat.
- `robots.txt` dan meta `noindex` sudah dipasang untuk mengurangi pengindeksan.
- Situs GitHub Pages tetap dapat dibuka oleh siapa pun yang memperoleh URL.

## Struktur utama

- `content/*.json` — isi tiap materi yang dapat diedit terpisah.
- `assets/images/main/` — poster utama WebP.
- `assets/images/thumb/` — thumbnail.
- `assets/js/app.js` — logika portal.
- `assets/css/styles.css` — desain desktop dan mobile.
- `sw.js` — cache PWA.
- `manifest.webmanifest` — instalasi ke layar utama.
