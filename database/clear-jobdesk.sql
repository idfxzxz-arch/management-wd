-- Bersihkan semua data jobdesk/tugas tanpa menghapus staf, divisi, laporan, atau data lain.
truncate table task_submissions, tasks restart identity cascade;
