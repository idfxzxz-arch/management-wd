-- Run this after database/supabase-schema.sql.
-- This fills public tables for testing. Create matching Auth users separately in
-- Supabase Dashboard > Authentication > Users using the same emails.

create table if not exists app_settings (
  setting_key text primary key,
  setting_value text not null,
  updated_at timestamptz not null default now()
);

alter table app_users drop constraint if exists app_users_role_check;
alter table app_users add constraint app_users_role_check check (role in ('Owner', 'Kepala Divisi', 'Staff', 'Administrator'));

alter table tasks add column if not exists submission_note text;
alter table tasks add column if not exists submission_file_url text;
alter table tasks add column if not exists submission_file_name text;
alter table tasks add column if not exists submitted_at timestamptz;
alter table tasks add column if not exists approved_at timestamptz;
alter table tasks add column if not exists approved_by text;

alter table task_submissions add column if not exists task_description text;
alter table task_submissions add column if not exists deadline date;
alter table task_submissions add column if not exists reviewer_role text;
alter table task_submissions add column if not exists revision_count integer not null default 0;
alter table task_submissions add column if not exists revision_history jsonb not null default '[]'::jsonb;
alter table task_submissions drop constraint if exists task_submissions_status_check;
alter table task_submissions add constraint task_submissions_status_check check (status in ('Belum Dikumpulkan', 'Menunggu Review', 'Diterima', 'Revisi', 'Terlambat', 'Revisi Dikirim Ulang'));

alter table documents add column if not exists file_url text;
alter table documents add column if not exists file_name text;
alter table documents add column if not exists file_path text;

truncate table
  activity_logs,
  announcements,
  documents,
  meetings,
  minutes,
  reports,
  weekly_reports,
  sops,
  app_settings,
  task_submissions,
  tasks,
  employees,
  divisions,
  app_users
restart identity cascade;

insert into app_users (id, name, email, role, division_id, status) values
  ('owner-general', 'Arman Wijaya', 'owner@wdgroup.com', 'Owner', 'all', 'Aktif'),
  ('head-general', 'Kepala Divisi WD Group', 'head@wdgroup.com', 'Kepala Divisi', 'all', 'Aktif'),
  ('staff-general', 'Staff WD Group', 'staff@wdgroup.com', 'Staff', 'all', 'Aktif'),
  ('admin-general', 'Administrator WD Group', 'admin@wdgroup.com', 'Administrator', 'all', 'Aktif');

insert into divisions (id, name, head, members, description, performance) values
  ('it', 'Information Technology', 'Nadia Prameswari', 6, 'Mengelola sistem, infrastruktur, keamanan data, dan otomasi operasional.', 'Sangat Baik'),
  ('marketing', 'Marketing', 'Maya Salsabila', 8, 'Menyusun strategi kampanye, brand awareness, dan pertumbuhan kanal digital.', 'Baik'),
  ('finance', 'Finance', 'Bima Santoso', 5, 'Mengelola anggaran, laporan keuangan, audit internal, dan arus kas.', 'Perlu Perhatian'),
  ('hr', 'Human Resource', 'Clara Anindita', 4, 'Mengurus rekrutmen, administrasi karyawan, performa, dan budaya perusahaan.', 'Baik'),
  ('operations', 'Operations', 'Yoga Pratama', 7, 'Memastikan proses layanan, vendor, dan pemenuhan kebutuhan operasional berjalan rapi.', 'Sangat Baik');

insert into employees (id, name, email, position, division_id, role, status, joined_at) values
  (1, 'Arman Wijaya', 'owner@wdgroup.com', 'Founder & Owner', 'all', 'Owner', 'Aktif', '2020-01-10'),
  (18, 'Administrator WD Group', 'admin@wdgroup.com', 'System Administrator', 'all', 'Administrator', 'Aktif', '2020-02-01'),
  (2, 'Nadia Prameswari', 'headit@wdgroup.com', 'Head of IT', 'it', 'Kepala Divisi', 'Aktif', '2021-03-15'),
  (3, 'Raka Mahendra', 'staffit@wdgroup.com', 'Frontend Developer', 'it', 'Staff', 'Aktif', '2022-07-04'),
  (4, 'Fajar Nugroho', 'fajar@wdgroup.com', 'System Analyst', 'it', 'Staff', 'Aktif', '2022-09-12'),
  (5, 'Maya Salsabila', 'headmarketing@wdgroup.com', 'Head of Marketing', 'marketing', 'Kepala Divisi', 'Aktif', '2021-06-02'),
  (6, 'Laras Putri', 'laras@wdgroup.com', 'Content Strategist', 'marketing', 'Staff', 'Aktif', '2023-01-18'),
  (7, 'Bima Santoso', 'bima@wdgroup.com', 'Head of Finance', 'finance', 'Kepala Divisi', 'Aktif', '2021-08-21'),
  (8, 'Dimas Kurnia', 'stafffinance@wdgroup.com', 'Finance Officer', 'finance', 'Staff', 'Aktif', '2023-04-09'),
  (9, 'Clara Anindita', 'clara@wdgroup.com', 'HR Manager', 'hr', 'Kepala Divisi', 'Aktif', '2021-11-20'),
  (10, 'Yoga Pratama', 'yoga@wdgroup.com', 'Operations Lead', 'operations', 'Kepala Divisi', 'Aktif', '2020-12-01'),
  (11, 'Sinta Amelia', 'sinta@wdgroup.com', 'HR Officer', 'hr', 'Staff', 'Aktif', '2023-08-14'),
  (12, 'Rizky Ramadhan', 'rizky@wdgroup.com', 'Operations Staff', 'operations', 'Staff', 'Aktif', '2022-12-03'),
  (13, 'Kevin Aditya', 'kevin@wdgroup.com', 'IT Support', 'it', 'Staff', 'Aktif', '2024-01-22'),
  (14, 'Aulia Rahma', 'aulia@wdgroup.com', 'Marketing Officer', 'marketing', 'Staff', 'Aktif', '2024-02-17'),
  (15, 'Putri Maharani', 'intern.it@wdgroup.com', 'IT Intern', 'it', 'Magang', 'Aktif', '2026-05-06'),
  (16, 'Bagas Prakoso', 'intern.marketing@wdgroup.com', 'Marketing Intern', 'marketing', 'Magang', 'Aktif', '2026-05-13'),
  (17, 'Naufal Hakim', 'intern.finance@wdgroup.com', 'Finance Intern', 'finance', 'Magang', 'Aktif', '2026-05-20');

insert into tasks (id, division_id, assignee_id, assigned_by, assigned_by_name, title, description, target, priority, deadline, status, approval, progress, note, history) values
  (101, 'it', 3, 'Owner', 'Arman Wijaya', 'Redesign dashboard internal', 'Merapikan tampilan dashboard dan komponen statistik.', 'Dashboard siap demo', 'Tinggi', '2026-06-20', 'Proses', 'Menunggu', 72, 'Pastikan mobile tidak berantakan.', '["Brief diterima dari Owner","Wireframe selesai","Implementasi komponen berjalan"]'),
  (102, 'it', 4, 'Kepala Divisi', 'Nadia Prameswari', 'Audit akses dokumen', 'Mengecek struktur folder dokumen dan hak akses.', 'Matriks akses selesai', 'Sedang', '2026-06-18', 'Selesai', 'Approved', 100, 'Dokumentasi sudah masuk arsip.', '["Mapping dokumen","Review kepala divisi","Approved"]'),
  (103, 'marketing', 6, 'Owner', 'Arman Wijaya', 'Kalender konten Q3', 'Menyusun rencana konten sosial media dan newsletter.', '60 ide konten', 'Sedang', '2026-06-24', 'Belum Mulai', 'Draft', 15, 'Sinkron dengan agenda launching.', '["Brief kampanye diterima dari Owner"]'),
  (104, 'finance', 8, 'Kepala Divisi', 'Bima Santoso', 'Rekap reimbursement Mei', 'Validasi klaim dan lampiran bukti transaksi.', 'Rekap final', 'Tinggi', '2026-06-12', 'Terlambat', 'Revisi', 65, 'Ada 3 bukti transaksi belum valid.', '["Data dikumpulkan","Revisi bukti transaksi"]'),
  (105, 'hr', 11, 'Kepala Divisi', 'Clara Anindita', 'Review onboarding staff baru', 'Evaluasi pengalaman onboarding dan kebutuhan training.', 'Laporan evaluasi', 'Rendah', '2026-06-28', 'Proses', 'Menunggu', 45, 'Tambahkan feedback mentor.', '["Kuesioner disebarkan","Data awal masuk"]'),
  (106, 'operations', 12, 'Owner', 'Arman Wijaya', 'Standarisasi vendor logistik', 'Membuat checklist evaluasi vendor operasional.', 'SOP vendor', 'Sedang', '2026-06-30', 'Revisi', 'Revisi', 55, 'Format checklist perlu disederhanakan.', '["Draft SOP dibuat","Revisi dari owner"]'),
  (107, 'it', 13, 'Kepala Divisi', 'Nadia Prameswari', 'Inventaris perangkat kantor', 'Memperbarui daftar laptop, monitor, dan perangkat jaringan.', 'Inventaris valid', 'Sedang', '2026-06-22', 'Proses', 'Menunggu', 60, 'Pisahkan perangkat aktif dan cadangan.', '["Data awal dikumpulkan","Validasi serial number berjalan"]'),
  (108, 'marketing', 14, 'Kepala Divisi', 'Maya Salsabila', 'Monitoring engagement campaign', 'Membuat rekap performa engagement kampanye berjalan.', 'Report campaign', 'Tinggi', '2026-06-19', 'Belum Mulai', 'Draft', 10, 'Gunakan format laporan terbaru.', '["Brief dari kepala divisi diterima"]'),
  (109, 'it', 15, 'Kepala Divisi', 'Nadia Prameswari', 'Input data inventory dari spreadsheet', 'Memindahkan data inventory sementara dari Google Spreadsheet ke format arsip internal.', 'Data inventory rapi', 'Sedang', '2026-06-23', 'Proses', 'Menunggu', 35, 'Cek ulang nama barang dan serial number.', '["Spreadsheet diterima","Input data berjalan"]'),
  (110, 'marketing', 16, 'Owner', 'Arman Wijaya', 'Rekap leads campaign dari spreadsheet', 'Membersihkan dan mengelompokkan data leads campaign dari Google Spreadsheet.', 'Leads siap follow up', 'Tinggi', '2026-06-21', 'Belum Mulai', 'Draft', 5, 'Pisahkan leads panas dan leads follow up.', '["Brief diberikan oleh Owner"]'),
  (111, 'finance', 17, 'Kepala Divisi', 'Bima Santoso', 'Validasi lampiran petty cash', 'Mengecek kelengkapan lampiran petty cash dari spreadsheet finance.', 'Lampiran tervalidasi', 'Rendah', '2026-06-27', 'Proses', 'Menunggu', 40, 'Tandai transaksi yang belum punya bukti.', '["Data finance dibagikan","Validasi batch pertama"]');

insert into task_submissions (
  id,
  task_id,
  task_title,
  task_description,
  staff_name,
  staff_role,
  division_id,
  deadline,
  drive_link,
  submission_note,
  submitted_at,
  status,
  head_feedback,
  reviewed_at,
  reviewed_by,
  reviewer_role,
  revision_count,
  revision_history
) values
  (1, 102, 'Audit akses dokumen', 'Mengecek struktur folder dokumen dan hak akses.', 'Fajar Nugroho', 'Staf', 'it', '2026-06-18', 'https://drive.google.com/drive/folders/wd-audit-akses-dokumen', 'Matriks akses dan bukti folder sudah saya susun.', '2026-06-17 15:15+07', 'Diterima', 'Sudah rapi dan bisa masuk arsip.', '2026-06-17 17:00+07', 'Nadia Prameswari', 'Kepala Divisi', 0, '[]'),
  (2, 101, 'Redesign dashboard internal', 'Merapikan tampilan dashboard dan komponen statistik.', 'Raka Mahendra', 'Staf', 'it', '2026-06-20', 'https://drive.google.com/drive/folders/wd-redesign-dashboard', 'Link berisi screenshot desktop dan mobile terbaru.', '2026-06-16 10:40+07', 'Menunggu Review', '', null, null, null, 0, '[]'),
  (3, 104, 'Rekap reimbursement Mei', 'Validasi klaim dan lampiran bukti transaksi.', 'Dimas Kurnia', 'Staf', 'finance', '2026-06-12', 'https://drive.google.com/drive/folders/wd-reimbursement-mei', 'Rekap awal sudah selesai, beberapa bukti saya tandai.', '2026-06-13 18:30+07', 'Revisi', 'Bukti transaksi nomor 14, 18, dan 23 belum valid. Lengkapi bukti scan yang jelas.', '2026-06-14 09:00+07', 'Bima Santoso', 'Kepala Divisi', 1, '[{"link":"https://drive.google.com/drive/folders/wd-reimbursement-mei-v1","note":"Rekap awal sudah selesai.","feedback":"Bukti transaksi nomor 14, 18, dan 23 belum valid.","reviewer":"Bima Santoso","reviewedAt":"2026-06-14T02:00:00.000Z"}]'),
  (4, 106, 'Standarisasi vendor logistik', 'Membuat checklist evaluasi vendor operasional.', 'Rizky Ramadhan', 'Staf', 'operations', '2026-06-30', 'https://drive.google.com/drive/folders/wd-vendor-logistik-v2', 'Saya kirim ulang format checklist yang lebih ringkas.', '2026-06-15 14:20+07', 'Revisi Dikirim Ulang', '', null, null, null, 1, '[{"oldLink":"https://drive.google.com/drive/folders/wd-vendor-logistik-v1","newLink":"https://drive.google.com/drive/folders/wd-vendor-logistik-v2","note":"Saya kirim ulang format checklist yang lebih ringkas.","feedback":"Format checklist perlu disederhanakan.","sentAt":"2026-06-15T07:20:00.000Z"}]'),
  (5, 108, 'Monitoring engagement campaign', 'Membuat rekap performa engagement kampanye berjalan.', 'Aulia Rahma', 'Staf', 'marketing', '2026-06-19', 'https://drive.google.com/drive/folders/wd-engagement-campaign', 'Report performa campaign sudah dikumpulkan.', '2026-06-20 11:10+07', 'Terlambat', '', null, null, null, 0, '[]'),
  (6, 109, 'Input data inventory dari spreadsheet', 'Memindahkan data inventory sementara dari Google Spreadsheet ke format arsip internal.', 'Putri Maharani', 'Anak Magang', 'it', '2026-06-23', 'https://drive.google.com/drive/folders/wd-inventory-intern', 'Batch pertama data inventory sudah saya rapikan.', '2026-06-22 16:35+07', 'Diterima', 'Bagus. Lanjutkan pola penamaan yang sama untuk batch berikutnya.', '2026-06-22 18:00+07', 'Arman Wijaya', 'Owner', 0, '[]');

insert into meetings (id, date, time, division_id, topic, participants, status) values
  (1, '2026-06-17', '09:00', 'it', 'Sprint review platform internal', '["Nadia","Raka","Fajar"]', 'Terjadwal'),
  (2, '2026-06-19', '13:30', 'marketing', 'Rencana kampanye Q3', '["Maya","Laras"]', 'Terjadwal'),
  (3, '2026-06-21', '10:00', 'finance', 'Evaluasi cashflow bulanan', '["Bima","Dimas"]', 'Menunggu Konfirmasi'),
  (4, '2026-06-24', '15:00', 'all', 'Town hall WD Group', '["Semua Divisi"]', 'Terjadwal');

insert into minutes (id, title, date, time, division_id, leader, participants, discussion, decision, follow_up, action_deadline) values
  (201, 'Evaluasi Sistem Internal', '2026-06-10', '10:00', 'it', 'Nadia Prameswari', '["Raka","Fajar","Nadia"]', 'Progress modul dashboard, routing, dan otorisasi role.', 'Dashboard role harus diprioritaskan untuk demo.', 'Raka menyelesaikan UI, Fajar menyiapkan dokumen akses.', '2026-06-20'),
  (202, 'Review Kampanye Juni', '2026-06-08', '14:00', 'marketing', 'Maya Salsabila', '["Maya","Laras"]', 'Kinerja konten, iklan, dan insight audiens.', 'Naikkan frekuensi newsletter mingguan.', 'Laras membuat kalender konten Q3.', '2026-06-24'),
  (203, 'Kontrol Budget Operasional', '2026-06-07', '09:30', 'finance', 'Bima Santoso', '["Bima","Dimas"]', 'Pengeluaran vendor dan reimbursement.', 'Semua klaim wajib melampirkan bukti digital.', 'Dimas melengkapi rekap reimbursement.', '2026-06-16');

insert into reports (id, staff, division_id, done, blockers, next, date, status) values
  (1, 'Raka Mahendra', 'it', 'Membuat layout dashboard dan komponen card.', 'Butuh finalisasi data approval.', 'Integrasi halaman detail jobdesk.', '2026-06-13', 'Dikirim'),
  (2, 'Laras Putri', 'marketing', 'Menganalisis performa konten bulan Juni.', 'Menunggu data iklan terbaru.', 'Menyusun kalender Q3.', '2026-06-12', 'Review'),
  (3, 'Dimas Kurnia', 'finance', 'Validasi 70% klaim reimbursement.', 'Beberapa bukti transaksi tidak lengkap.', 'Follow up staff terkait lampiran.', '2026-06-12', 'Revisi');

insert into weekly_reports (week, period, staff, division_id, completed_tasks, target_tasks, average_progress, late_tasks, revision_tasks, summary, blocker, next_plan, head_note, status) values
  ('Minggu 2 Juni 2026', '2026-06-08 s/d 2026-06-14', 'Raka Mahendra', 'it', 4, 5, 78, 0, 1, 'Implementasi UI dashboard, perapian komponen, dan integrasi halaman jobdesk berjalan baik.', 'Menunggu finalisasi data approval dari kepala divisi.', 'Menyelesaikan detail jobdesk dan validasi responsive.', 'Kinerja baik, perlu mempercepat dokumentasi perubahan.', 'Baik'),
  ('Minggu 2 Juni 2026', '2026-06-08 s/d 2026-06-14', 'Fajar Nugroho', 'it', 5, 5, 92, 0, 0, 'Audit akses dokumen selesai, matriks akses sudah rapi, dan arsip teknis siap direview.', 'Tidak ada kendala signifikan.', 'Membantu validasi inventory perangkat.', 'Kinerja sangat baik dan konsisten.', 'Sangat Baik'),
  ('Minggu 2 Juni 2026', '2026-06-08 s/d 2026-06-14', 'Laras Putri', 'marketing', 2, 4, 48, 0, 1, 'Analisis konten berjalan, namun kalender Q3 belum lengkap karena menunggu data iklan.', 'Data iklan dan insight audiens belum final.', 'Melengkapi kalender konten Q3 dan draft newsletter.', 'Perlu follow up data agar target mingguan tidak mundur.', 'Perlu Perhatian'),
  ('Minggu 2 Juni 2026', '2026-06-08 s/d 2026-06-14', 'Dimas Kurnia', 'finance', 2, 5, 52, 1, 2, 'Validasi reimbursement berjalan, tetapi ada keterlambatan karena lampiran transaksi belum lengkap.', 'Beberapa bukti transaksi belum dikirim oleh staff terkait.', 'Follow up lampiran dan menutup rekap reimbursement.', 'Perlu monitoring harian sampai backlog selesai.', 'Butuh Monitoring'),
  ('Minggu 2 Juni 2026', '2026-06-08 s/d 2026-06-14', 'Putri Maharani', 'it', 1, 3, 35, 0, 0, 'Input data inventory dari spreadsheet sudah mulai, masih dalam tahap pembersihan data.', 'Perlu arahan format serial number dan kategori barang.', 'Merapikan batch data inventory pertama.', 'Magang perlu pendampingan, progres masih wajar.', 'Pendampingan');

insert into announcements (title, content, author, date, target, priority) values
  ('Town Hall Bulanan', 'Seluruh karyawan wajib mengikuti town hall WD Group minggu depan.', 'Arman Wijaya', '2026-06-13', 'Semua Divisi', 'Tinggi'),
  ('Update SOP Dokumen', 'Setiap dokumen internal wajib diberi kategori dan pemilik dokumen.', 'Nadia Prameswari', '2026-06-11', 'IT, HR', 'Sedang'),
  ('Pengingat Laporan Mingguan', 'Laporan mingguan dikirim maksimal Jumat pukul 16.00.', 'Clara Anindita', '2026-06-09', 'Semua Divisi', 'Sedang');

insert into documents (name, category, division_id, uploaded_at, type, file_url, file_name, file_path) values
  ('Panduan Akses Sistem Internal', 'Teknis', 'it', '2026-06-04', 'PDF', '', '', ''),
  ('Template Laporan Mingguan', 'Administrasi', 'all', '2026-05-29', 'DOCX', '', '', ''),
  ('Rekap Budget Q2', 'Keuangan', 'finance', '2026-06-02', 'XLSX', '', '', ''),
  ('Brand Guideline WD Group', 'Marketing', 'marketing', '2026-05-20', 'PDF', '', '', '');

insert into activity_logs (actor, division_id, action, time, severity) values
  ('Raka Mahendra', 'it', 'menyelesaikan tugas audit komponen dashboard', '2026-06-13 15:20', 'success'),
  ('Maya Salsabila', 'marketing', 'membuat notulen Review Kampanye Juni', '2026-06-12 11:05', 'info'),
  ('Arman Wijaya', 'all', 'membuat pengumuman Town Hall Bulanan', '2026-06-13 09:00', 'owner'),
  ('Sistem', 'finance', 'menandai tugas Finance melewati deadline', '2026-06-12 17:00', 'danger'),
  ('Nadia Prameswari', 'it', 'mengirim catatan revisi untuk jobdesk staff', '2026-06-11 14:40', 'warning');

insert into sops (title, division_id, description, updated_at, status) values
  ('SOP Pengajuan Akses Sistem', 'it', 'Alur permintaan, persetujuan, dan pencabutan akses aplikasi internal.', '2026-06-01', 'Aktif'),
  ('SOP Laporan Mingguan', 'all', 'Format dan jadwal pengiriman laporan kerja setiap divisi.', '2026-05-25', 'Aktif'),
  ('SOP Reimbursement', 'finance', 'Ketentuan klaim, dokumen pendukung, dan proses validasi finance.', '2026-06-06', 'Aktif'),
  ('SOP Publikasi Konten', 'marketing', 'Standar review, approval, dan arsip konten marketing.', '2026-05-18', 'Draft');

insert into app_settings (setting_key, setting_value) values
  ('company_name', 'WD Group Company'),
  ('theme', 'Biru tua, putih, abu-abu muda'),
  ('notifications', 'Email, dashboard alert, dan reminder deadline aktif'),
  ('roles', 'Owner, Kepala Divisi, Staff, Administrator')
on conflict (setting_key) do update set
  setting_value = excluded.setting_value,
  updated_at = now();

select setval(pg_get_serial_sequence('employees', 'id'), coalesce(max(id), 1)) from employees;
select setval(pg_get_serial_sequence('tasks', 'id'), coalesce(max(id), 1)) from tasks;
select setval(pg_get_serial_sequence('task_submissions', 'id'), coalesce(max(id), 1)) from task_submissions;
select setval(pg_get_serial_sequence('meetings', 'id'), coalesce(max(id), 1)) from meetings;
select setval(pg_get_serial_sequence('minutes', 'id'), coalesce(max(id), 1)) from minutes;
select setval(pg_get_serial_sequence('reports', 'id'), coalesce(max(id), 1)) from reports;
