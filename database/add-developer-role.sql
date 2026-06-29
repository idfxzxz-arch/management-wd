-- Tambah role Developer setara Owner/Wakil Owner tanpa reset database.
-- Jalankan di Supabase SQL Editor, lalu buat Auth user manual:
-- Authentication > Users > Add user
-- Email: developer@wdgroup.com
-- Password: isi password default yang kamu mau

alter table app_users drop constraint if exists app_users_role_check;
alter table app_users add constraint app_users_role_check
check (role in ('Owner', 'Kepala Divisi', 'Staff', 'Magang', 'Wakil Owner', 'Developer'));

insert into employees (name, email, position, division_id, role, status, joined_at)
select 'Developer WD Group', 'developer@wdgroup.com', 'Developer', 'all', 'Developer', 'Aktif', current_date
where not exists (
  select 1 from employees where lower(email) = 'developer@wdgroup.com' or role = 'Developer'
);

update employees
set name = 'Developer WD Group',
    email = 'developer@wdgroup.com',
    position = 'Developer',
    division_id = 'all',
    role = 'Developer',
    status = 'Aktif'
where lower(email) = 'developer@wdgroup.com' or role = 'Developer';

insert into app_users (id, name, email, role, division_id, status, employee_id)
select 'developer-general', 'Developer WD Group', 'developer@wdgroup.com', 'Developer', 'all', 'Aktif', e.id
from employees e
where lower(e.email) = 'developer@wdgroup.com'
on conflict (email) do update set
  id = excluded.id,
  name = excluded.name,
  role = excluded.role,
  division_id = excluded.division_id,
  status = excluded.status,
  employee_id = excluded.employee_id;

update app_settings
set setting_value = 'Owner, Kepala Divisi, Staff, Magang, Wakil Owner, Developer',
    updated_at = now()
where setting_key = 'roles';
