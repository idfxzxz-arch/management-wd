-- Jadikan Yahya Muhammad sebagai Kepala Divisi Project Manager & Konten.
-- Mirza tetap Staff Media Production untuk sementara.
-- Jalankan pada database yang sudah memiliki seed staf WD Group.

update divisions
set head = 'Yahya Muhammad'
where id = 'project-content';

update divisions
set head = 'Belum ditentukan'
where id = 'media-production';

update divisions
set head = 'Nayla Rizki Rachmania'
where id = 'admin-booking';

update divisions
set head = 'Alifa Dwi Kharisma'
where id = 'public-relation-admin';

update employees
set email = 'yahyaalbayaz@gmail.com',
    position = 'Kepala Divisi Project Manager & Konten',
    role = 'Kepala Divisi'
where id = 3 or lower(email) in ('yahya.muhammad@wdgroup.com', 'yahyaalbayaz@gmail.com');

update employees
set email = 'mijaa478@gmail.com',
    position = 'Tim Staff Media Production',
    role = 'Staff'
where id = 7 or lower(email) in ('mirza.alfarizi@wdgroup.com', 'mijaa478@gmail.com');

update employees
set email = 'naylarizki16@gmail.com',
    position = 'Kepala Divisi Administrasi & Booking',
    role = 'Kepala Divisi'
where id = 5 or lower(email) in ('nayla.rizki@wdgroup.com', 'naylarizki16@gmail.com');

update employees
set email = 'alifadwi230506@gmail.com',
    position = 'Kepala Divisi Public Relation & Admin',
    role = 'Kepala Divisi'
where id = 14 or lower(email) in ('alifa.kharisma@wdgroup.com', 'alifadwi230506@gmail.com');

insert into app_users (id, name, email, role, division_id, status, employee_id) values
  ('head-content', 'Yahya Muhammad', 'yahyaalbayaz@gmail.com', 'Kepala Divisi', 'project-content', 'Aktif', 3),
  ('head-admin-booking', 'Nayla Rizki Rachmania', 'naylarizki16@gmail.com', 'Kepala Divisi', 'admin-booking', 'Aktif', 5),
  ('head-public-relation-admin', 'Alifa Dwi Kharisma', 'alifadwi230506@gmail.com', 'Kepala Divisi', 'public-relation-admin', 'Aktif', 14)
on conflict (email) do update set
  id = excluded.id,
  name = excluded.name,
  role = excluded.role,
  division_id = excluded.division_id,
  status = excluded.status,
  employee_id = excluded.employee_id;

delete from app_users
where id = 'head-media';

update app_users
set name = 'Dewi Wulandari',
    email = 'dewiiwulandari03@gmail.com',
    employee_id = 4,
    role = 'Staff',
    division_id = 'project-content'
where id = 'staff-general';
