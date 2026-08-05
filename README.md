# Portal Keperawatan v4.3.0 — Instrument-first

Portal pembelajaran internal keperawatan berbasis **Keputusan Direktur Jenderal Pelayanan Kesehatan Nomor HK.02.02/D/47104/2024**.

Perubahan utama versi ini adalah mode Pelajari dimulai dari **Elemen Penilaian dan Kelengkapan Bukti**, bukan dari teori umum. Alur, praktik, peran perawat, kesalahan umum, dan kuis ditempatkan setelah pokok yang benar-benar dinilai surveior.

## Menjalankan

Unggah seluruh isi folder ke hosting statis/GitHub Pages, atau jalankan melalui server lokal. Jangan membuka `index.html` melalui `file://` karena konten JSON dimuat melalui fetch.

## Berkas penting

- `assets/data/catalog-v4-3-0.json` — katalog.
- `content/*.json` — 62 materi.
- `MAPPING_INSTRUMEN_V4_3_0.md` — kode, jumlah EP, dan halaman sumber.
- `CONTENT_AUDIT.md` — prinsip audit konten.
