# Smart Cash

Pengelolaan Uang Kas yang Transparan dengan Bantuan AI

Smart Cash adalah aplikasi web untuk membantu kelompok mengelola uang kas, transaksi, iuran, dan anggota secara lebih rapi dan transparan. Aplikasi memiliki dua role utama: Admin dan User, serta Smart Cash AI Assistant untuk membantu pengguna mendapatkan informasi dari knowledge dan data aplikasi yang tersedia.

# Fitur Utama

Login & Hak Akses — akses dibedakan berdasarkan role Admin dan User.

Dashboard — menampilkan saldo, pemasukan, pengeluaran, status iuran, dan aktivitas terbaru.

Transaksi — mencatat dan memantau pemasukan serta pengeluaran.

Iuran Anggota — memantau status pembayaran: paid, partial, dan unpaid.

Anggota — menampilkan dan mengelola anggota dalam grup.

Smart Cash AI — membantu menjawab pertanyaan tentang Smart Cash menggunakan knowledge dan data aplikasi yang tersedia.

# Cara Kerja AI

IBM Langflow digunakan untuk mengatur alur AI. Knowledge Smart Cash disimpan di Supabase Vector Store, kemudian dicari berdasarkan pertanyaan pengguna dan diproses bersama input melalui Parser, Prompt Template, dan Language Model.

Alur knowledge yang digunakan:

Chat Input → Knowledge Search → Parser → Prompt Template → Language Model → Chat Output

Data operasional Smart Cash seperti transaksi, iuran, anggota, dan ringkasan keuangan tetap berasal dari database aplikasi melalui backend.

# Teknologi

React

Vite

Node.js

Express

Supabase

IBM Langflow

Google Generative AI Embeddings

Struktur Project

SmartCash/
├── src/                 # Frontend React
├── backend/             # Backend Node.js/Express
├── Langflow/            # Flow/export Langflow
└── langflow/            # File flow Langflow

# Persyaratan

Pastikan sudah terpasang:

Node.js 18 atau lebih baru

npm

Akun/konfigurasi Supabase untuk database aplikasi dan knowledge

Flow Langflow yang digunakan project

## Menjalankan Project

# 1. Clone / buka project

Masuk ke folder project:

cd SmartCash

2. Install dependency frontend

npm install

# 3. Install dependency backend

Buka terminal baru:

cd backend
npm install

# 4. Konfigurasi environment backend

Buat file:

backend/.env

Isi menggunakan konfigurasi yang sesuai dengan environment Anda:

PORT=3001
FRONTEND_ORIGIN=http://localhost:5173

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

LANGFLOW_BASE_URL=your_langflow_base_url
LANGFLOW_FLOW_ID=your_langflow_flow_id
LANGFLOW_API_KEY=your_langflow_api_key

LANGFLOW_TIMEOUT_MS=30000

DEMO_GROUP_ID=G001
DEMO_USER_ID=U002

Jangan memasukkan file .env atau secret ke GitHub.

# 5. Jalankan backend

Dari folder backend:

npm run dev

Backend berjalan pada:

http://localhost:3001

# 6. jalankan langflow 

Setelah Langflow terbuka:

Import/open flow Smart Cash yang digunakan project.

Pastikan koneksi Knowledge / Supabase Vector Store tersedia.

Pastikan Prompt Template dan Language Model sudah terhubung.

Pastikan konfigurasi credential dan environment yang diperlukan sudah tersedia.

# 7. Jalankan frontend

Buka terminal baru dari folder utama project:

npm run dev

Frontend berjalan pada alamat yang ditampilkan oleh Vite, biasanya:

http://localhost:5173

Frontend menggunakan Vite proxy untuk meneruskan request /api/* ke backend pada port 3001.

Menjalankan dalam Pengembangan

Dua proses perlu berjalan bersamaan:

**Terminal 1**
Smart Cash/backend
→ npm run dev
→ http://localhost:3001

**Terminal 2**
Smart Cash/frontend
→ npm run dev
→ http://localhost:5173

Setelah ketiganya aktif, buka alamat frontend pada browser dan login menggunakan akun demo yang telah dikonfigurasi pada database aplikasi.

Penggunaan Smart Cash AI

**Setelah aplikasi berjalan, pengguna dapat mencoba pertanyaan seperti:**

Berapa saldo kas saat ini?

Siapa yang belum membayar iuran?

Berapa pengeluaran bulan ini?

Apa transaksi terbaru?

Apa itu contribution?

**Pertanyaan tentang data yang berubah mengikuti data aplikasi yang tersedia, sedangkan pertanyaan tentang konsep dan aturan Smart Cash menggunakan knowledge yang tersimpan di vector store.**

# IBM Bob

IBM Bob digunakan selama proses pengembangan untuk membantu membangun, memperbaiki, melakukan debugging, dan menguji frontend, backend, database, serta integrasi AI dengan Langflow.

Bob merupakan bagian dari proses pengembangan, bukan komponen runtime aplikasi.

# Status

Development / Demo

# Catatan Keamanan

Simpan seluruh API key, secret key, dan credential hanya di backend.

Jangan menaruh secret di frontend atau repository publik.

Gunakan konfigurasi environment yang sesuai sebelum menjalankan backend.

# License

Belum ada lisensi publik yang ditetapkan untuk project ini.
