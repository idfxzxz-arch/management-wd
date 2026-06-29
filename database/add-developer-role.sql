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

-- Pastikan Developer dianggap management oleh RLS policy yang sudah ada.
create schema if not exists private;

create or replace function private.current_app_email()
returns text language sql stable security definer set search_path = public
as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function private.current_app_role()
returns text language sql stable security definer set search_path = public
as $$
  select role from app_users
  where lower(email) = private.current_app_email() and status = 'Aktif'
  limit 1
$$;

create or replace function private.current_app_division()
returns text language sql stable security definer set search_path = public
as $$
  select division_id from app_users
  where lower(email) = private.current_app_email() and status = 'Aktif'
  limit 1
$$;

create or replace function private.is_management()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(private.current_app_role() in ('Owner', 'Wakil Owner', 'Developer'), false) $$;

drop policy if exists "role read app users" on app_users;
create policy "role read app users" on app_users for select to authenticated
using (private.current_app_role() is not null);

drop policy if exists "management update app users" on app_users;
create policy "management update app users" on app_users for update to authenticated
using (private.is_management()) with check (private.is_management());

drop policy if exists "scoped read employees" on employees;
create policy "scoped read employees" on employees for select to authenticated
using (private.current_app_role() is not null);

drop policy if exists "owner insert settings" on app_settings;
drop policy if exists "owner update settings" on app_settings;
create policy "owner insert settings" on app_settings for insert to authenticated with check (private.current_app_role() in ('Owner', 'Developer'));
create policy "owner update settings" on app_settings for update to authenticated using (private.current_app_role() in ('Owner', 'Developer')) with check (private.current_app_role() in ('Owner', 'Developer'));
