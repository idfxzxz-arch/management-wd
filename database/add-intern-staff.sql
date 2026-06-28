-- Add Staf Magang role and login profiles without resetting existing data.

alter table app_users drop constraint if exists app_users_role_check;
alter table app_users add constraint app_users_role_check
check (role in ('Owner', 'Kepala Divisi', 'Staff', 'Magang', 'Wakil Owner'));

update employees as e
set email = updates.email,
    name = updates.name,
    position = 'Staf Magang Media Production',
    division_id = 'media-production',
    role = 'Magang',
    status = 'Aktif'
from (values
  (8, 'Sandi Nabil Ristullah', 'sndeyszrwr@gmail.com'),
  (9, 'Syahdan Alwinanta', 'syahdanalwin@gmail.com'),
  (10, 'Rehan Rizkianto', 'ryypripayer@gmail.com'),
  (11, 'Maulana Al Ayubi', 'maulanaalayubi59@gmail.com'),
  (12, 'Irum Maqbullah', 'irummaqbullah@gmail.com'),
  (13, 'Wahyu Agung Utomo', 'wahyupqxd@gmail.com')
) as updates(id, name, email)
where e.id = updates.id;

delete from app_users
where employee_id in (8, 9, 10, 11, 12, 13)
  or lower(email) in (
    'sandi.nabil@wdgroup.com',
    'syahdan.alwinanta@wdgroup.com',
    'rehan.rizkianto@wdgroup.com',
    'maulana.ayubi@wdgroup.com',
    'khoirum.maqbullah@wdgroup.com',
    'wahyu.agung@wdgroup.com'
  );

insert into app_users (id, name, email, role, division_id, status, employee_id)
select
  'employee-' || e.id,
  e.name,
  e.email,
  e.role,
  e.division_id,
  e.status,
  e.id
from employees e
where e.id in (8, 9, 10, 11, 12, 13)
on conflict (email) do update set
  name = excluded.name,
  role = excluded.role,
  division_id = excluded.division_id,
  status = excluded.status,
  employee_id = excluded.employee_id;

update app_settings
set setting_value = 'Owner, Kepala Divisi, Staff, Magang, Wakil Owner',
    updated_at = now()
where setting_key = 'roles';
