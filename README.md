# management-wd

WD Group Internal Management System prototype built with React, Vite, Tailwind CSS, React Router DOM, Lucide React, and JavaScript dummy data.

## Demo Accounts

- Owner: `owner@wdgroup.com` / `123456`
- Kepala Divisi: `head@wdgroup.com` / `123456`
- Staff: `staff@wdgroup.com` / `123456`

## Run Locally

```bash
npm install
npm run dev
```

## Supabase Setup

1. Copy `.env.example` menjadi `.env`.
2. Isi:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Legacy `VITE_SUPABASE_ANON_KEY` tetap didukung. Jangan pernah menaruh `service_role`, `sb_secret_...`, database password, atau connection string pada variable `VITE_*` karena seluruh variable tersebut masuk ke bundle browser.


3. Buka Supabase SQL Editor, lalu jalankan `database/supabase-schema.sql`.
4. Untuk data testing, jalankan `database/supabase-seed.sql`.
5. Jalankan `database/supabase-role-policies.sql` untuk mengaktifkan pembatasan role, divisi, akun aktif, dan storage privat.
6. Buat user login di Supabase Auth dengan email yang sama seperti tabel `app_users`.
7. Setelah migrasi, logout lalu login kembali agar `employee_id` tersimpan pada session aplikasi.

Data aplikasi sekarang dibaca dari Supabase. File `src/data/*.js` hanya fallback kosong.

Testing login yang sesuai seed:

- `owner@wdgroup.com`
- `head@wdgroup.com`
- `staff@wdgroup.com`
- `admin@wdgroup.com`

Password ditentukan saat membuat user di Supabase Auth.
