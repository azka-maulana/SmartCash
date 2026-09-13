# Smart Cash

Smart Cash adalah aplikasi pengelolaan uang kas bersama yang membantu kelompok mencatat, memantau, dan memahami kondisi keuangan secara lebih rapi dan transparan.

Smart Cash dapat digunakan untuk:
- Kas kelas
- Kas organisasi
- Kas komunitas
- Kas kepanitiaan
- Kegiatan bersama lainnya

## Tujuan

Smart Cash dibuat untuk mempermudah pengelolaan kas yang sebelumnya dapat dilakukan secara manual dan sulit dipantau. Dengan menggabungkan pencatatan transaksi, pengelolaan iuran, informasi anggota, dan bantuan AI, kondisi keuangan kelompok dapat dilihat dalam satu aplikasi.

## Role Pengguna

### Admin
Admin dapat mengelola data kas, transaksi, iuran, dan anggota dalam kelompok.

### User
User dapat melihat informasi kas, transaksi, iuran, dan data kelompok sesuai hak aksesnya.

## Fitur Utama

### Dashboard
Menampilkan ringkasan kondisi keuangan seperti:
- Saldo saat ini
- Pemasukan
- Pengeluaran
- Status iuran
- Aktivitas transaksi terbaru

### Transaksi
Mencatat pemasukan dan pengeluaran kas secara terstruktur, termasuk nominal, kategori, tanggal, dan keterangan transaksi.

### Iuran Anggota
Membantu Admin memantau pembayaran iuran dengan status:
- Sudah membayar
- Membayar sebagian
- Belum membayar

### Anggota
Menampilkan dan mengelola anggota yang terdaftar dalam kelompok.

### Smart Cash AI
AI Assistant membantu pengguna mendapatkan informasi dan penjelasan mengenai Smart Cash melalui pertanyaan menggunakan bahasa sehari-hari.

Contoh:
- "Berapa saldo kas saat ini?"
- "Siapa yang belum membayar iuran?"
- "Berapa pengeluaran bulan ini?"
- "Apa itu contribution?"

## Penggunaan IBM Langflow

IBM Langflow digunakan sebagai bagian dari sistem AI Smart Cash untuk mengatur alur pemrosesan pertanyaan pengguna.

Pada flow yang digunakan, Langflow menerima pertanyaan melalui Chat Input, mencari informasi yang relevan pada knowledge base menggunakan Supabase Vector Store, memproses hasilnya melalui Parser dan Prompt Template, kemudian meneruskannya ke Language Model untuk menghasilkan jawaban yang ditampilkan melalui Chat Output.

Alur utamanya:

`Chat Input → Knowledge Search → Parser → Prompt Template → Language Model → Chat Output`
<img width="1309" height="716" alt="Screenshot 2026-09-13 124720" src="https://github.com/user-attachments/assets/98956769-ac9a-431e-a3bf-6e2fbbdc8486" />

Knowledge yang digunakan berisi informasi dan aturan Smart Cash, sedangkan data operasional seperti transaksi, iuran, anggota, dan kondisi kas berasal dari database aplikasi melalui integrasi yang disediakan sistem.

## Peran IBM Bob

IBM Bob digunakan dalam proses pengembangan Smart Cash untuk membantu membangun, memperbaiki, dan menguji source code serta integrasi antara frontend, backend, database, dan sistem AI.

Bob berperan pada tahap pengembangan, sedangkan Langflow digunakan pada saat sistem AI dijalankan.

## Cara Kerja

`Login → Admin/User → Dashboard → Kelola atau Pantau Data → Data Tersimpan di Database → Pertanyaan ke Smart Cash AI → Langflow Memproses Knowledge dan Data yang Relevan → Jawaban AI`

## Hasil

Smart Cash menghasilkan aplikasi kas bersama dengan dua role pengguna dan AI Assistant yang membantu pengguna mengakses serta memahami informasi keuangan secara lebih mudah dan transparan.

## Status Project

```text
Development / Demo
