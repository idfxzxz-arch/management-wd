# management-wd

WD Group Internal Management System prototype built with React, Vite, Tailwind CSS, React Router DOM, Lucide React, and JavaScript dummy data.

## Demo Accounts

- Owner: `dosenwildandeni@gmail.com` / `123456`
- Wakil Owner: `cantikaqiza@gmail.com` / `123456`
- Kepala Divisi: `yahyaalbayaz@gmail.com` / `123456`
- Staff: `dewiiwulandari03@gmail.com` / `123456`

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

Role login dideteksi otomatis dari tabel `app_users` berdasarkan email Supabase Auth. Jadi user tetap masuk lewat email masing-masing, lalu sistem menentukan apakah dia Owner, Wakil Owner, Kepala Divisi, atau Staff.

Testing login yang sesuai seed:

- `dosenwildandeni@gmail.com`
- `cantikaqiza@gmail.com`
- `tegardarmawan59@gmail.com`
- `yahyaalbayaz@gmail.com`
- `naylarizki16@gmail.com`
- `alifadwi230506@gmail.com`
- `dewiiwulandari03@gmail.com`
- `ayu808485@gmail.com`
- `mijaa478@gmail.com`
- `teukujunefri@gmail.com`
- `febriyanbudi921@gmail.com`

Password ditentukan saat membuat user di Supabase Auth.

### Bulk Create Supabase Auth Users

Supabase Auth user bisa dibuat massal dari tabel `app_users`, jadi tidak perlu input satu-satu di Dashboard.

Tambahkan `SUPABASE_SERVICE_ROLE_KEY` ke `.env` lokal, lalu jalankan:

```bash
npm run auth:create-users -- --password=123456
```

Password juga bisa dibuat sama per grup role:

```bash
npm run auth:create-users -- --management-password=123456 --head-password=123456 --staff-password=123456
```

`--management-password` dipakai untuk Owner dan Wakil Owner, `--head-password` untuk semua Kepala Divisi, dan `--staff-password` untuk semua Staff. Untuk mengganti password user Auth yang sudah ada, tambahkan `--reset-existing`.

Untuk cek dulu tanpa membuat user:

```bash
npm run auth:create-users -- --dry-run
```

## Email Jobdesk Notification

Saat jobdesk dibuat, aplikasi menyimpan antrean email ke tabel `task_email_notifications` dan mencoba memanggil Supabase Edge Function `send-task-email`.

Deploy function dan set secret berikut agar email benar-benar terkirim:

```bash
supabase login
supabase link --project-ref PROJECT_REF_SUPABASE_ANDA
supabase functions deploy send-task-email
supabase secrets set MAILERSEND_API_KEY=...
supabase secrets set NOTIFICATION_FROM_EMAIL="WD Group <notifications@domain-anda.com>"
```

Function memakai MailerSend API. Jika function atau secret belum aktif, jobdesk tetap tersimpan dan antrean email bisa dicek di tabel `task_email_notifications`.

Jika muncul pesan `Failed to send a request to the Edge Function`, berarti browser belum bisa menjangkau function di Supabase. Penyebab paling umum: function belum dideploy, project belum di-link, atau `VITE_SUPABASE_URL` mengarah ke project lain.
