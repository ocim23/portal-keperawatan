# Mengubah Kelompok, Submateri, Slide, dan Kuis

Portal v3 menggunakan dua tingkat:

`Kelompok standar → Submateri mandiri → Pembelajaran`

## 1. Daftar kelompok dan submateri

Buka:

`assets/data/modules.json`

- `groupOrder` menentukan urutan kelompok pada portal.
- `groups` berisi SKP, PP, PAP, PPI, PKPO, PMKP, HPK, KE, dan MFK.
- `groups.<kode>.topics` menentukan urutan submateri dalam kelompok.
- `topics` berisi metadata kartu submateri dan lokasi file konten.

Contoh:

```json
"pap": {
  "code": "PAP",
  "title": "Pelayanan dan Asuhan Pasien",
  "topics": ["pap-terintegrasi", "pap-ews", "pap-bhd"]
}
```

## 2. Isi satu submateri

Setiap submateri memiliki file sendiri, misalnya:

`content/pap-bhd.json`

Di dalamnya terdapat:

- `slides` untuk tab Pelajari;
- `summarySections`, `do`, dan `dont` untuk Inti Materi;
- `quiz` untuk Uji Pemahaman;
- `references` untuk Referensi.

## 3. Mengubah urutan slide

Ubah angka `order`. Aplikasi menampilkan slide dari angka terkecil ke terbesar.

## 4. Mengganti poster

1. Siapkan poster utama dalam WebP.
2. Upload ke `assets/images/main/<kelompok>/`.
3. Siapkan thumbnail WebP dan upload ke `assets/images/thumb/<kelompok>/`.
4. Ubah nilai `image` dan `thumbnail` pada JSON submateri.
5. Naikkan `version` pada slide.
6. Naikkan versi cache pada `index.html` dan `sw.js` bila perubahan masih tertahan cache.

Contoh slide gambar:

```json
{
  "type": "image",
  "title": "Kompresi Dada Berkualitas Tinggi",
  "caption": "Laju 100–120/menit, kedalaman 5–6 cm, recoil penuh, dan interupsi minimal.",
  "order": 2,
  "image": "assets/images/main/pap/pap-bhd-02-kompresi-dada.webp",
  "thumbnail": "assets/images/thumb/pap/pap-bhd-02-kompresi-dada-thumb.webp",
  "version": 1
}
```

## 5. Mengubah kartu HTML

Slide HTML memakai `template.items`. Setiap item memiliki `title` dan `text`; slide tipe `bands` juga dapat memakai `level`.

## 6. Mengubah kuis

- `q` = pertanyaan;
- `options` = pilihan jawaban;
- `answer` = indeks jawaban benar, dimulai dari `0`;
- `why` = pembahasan.

Contoh: `answer: 1` berarti jawaban B.
