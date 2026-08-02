# Cara Mengubah Urutan, Judul, dan Gambar

Setiap materi memiliki file sendiri, misalnya:

`content/ppi.json`

Di dalam bagian `slides`, setiap slide memiliki data seperti:

```json
{
  "type": "image",
  "asset": "ppi_2",
  "title": "Durasi Kebersihan Tangan",
  "caption": "Handrub 20–30 detik; sabun dan air mengalir 40–60 detik.",
  "order": 2,
  "image": "assets/images/main/ppi/ppi-02-durasi-kebersihan-tangan.webp",
  "thumbnail": "assets/images/thumb/ppi/ppi-02-durasi-kebersihan-tangan-thumb.webp",
  "version": 1
}
```

## Mengubah urutan

Ubah angka `order`. Aplikasi selalu mengurutkan slide berdasarkan nilai tersebut.

Contoh:
- `order: 1` tampil pertama;
- `order: 2` tampil kedua.

Nama file tidak menentukan urutan.

## Mengganti gambar

1. Optimalkan gambar menjadi WebP.
2. Upload gambar utama ke `assets/images/main/MODUL/`.
3. Upload thumbnail ke `assets/images/thumb/MODUL/`.
4. Ubah nilai `image` dan `thumbnail` pada JSON.
5. Naikkan `version`, misalnya dari `1` menjadi `2`.
6. Commit perubahan.

Nilai `version` membuat browser mengambil gambar baru, bukan mempertahankan cache lama.

## Mengubah judul/caption

Edit langsung `title` dan `caption`, lalu commit.

## Menambah slide

Salin satu objek slide, lalu ubah:
- `asset` agar unik;
- `title`;
- `caption`;
- `order`;
- path gambar;
- `version`.

## Menghapus slide

Hapus objek slide tersebut dari array `slides`.

## Mengubah soal

Pada file materi yang sama, buka bagian `quiz`.
- `q` = pertanyaan;
- `options` = pilihan;
- `answer` = indeks jawaban benar, dimulai dari `0`;
- `why` = pembahasan jawaban paling tepat;
- `optionWhy` = telaah setiap pilihan.

Contoh `answer: 1` berarti jawaban B.
