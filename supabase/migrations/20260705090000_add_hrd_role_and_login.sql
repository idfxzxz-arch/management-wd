alter table app_users drop constraint if exists app_users_role_check;
alter table app_users add constraint app_users_role_check
check (role in ('Owner', 'Kepala Divisi', 'Staff', 'Magang', 'Wakil Owner', 'Developer', 'HRD'));

insert into employees (name, email, position, division_id, role, status, joined_at)
select 'Ilham Artha', 'ilhamarthaid@gmail.com', 'HRD', 'all', 'HRD', 'Aktif', current_date
where not exists (
  select 1 from employees where lower(email) = 'ilhamarthaid@gmail.com' or role = 'HRD'
);

update employees
set name = 'Ilham Artha',
    email = 'ilhamarthaid@gmail.com',
    position = 'HRD',
    division_id = 'all',
    role = 'HRD',
    status = 'Aktif'
where lower(email) = 'ilhamarthaid@gmail.com' or role = 'HRD';

insert into app_users (id, name, email, role, division_id, status, employee_id)
select 'hrd-general', 'Ilham Artha', 'ilhamarthaid@gmail.com', 'HRD', 'all', 'Aktif', e.id
from employees e
where lower(e.email) = 'ilhamarthaid@gmail.com'
on conflict (email) do update set
  id = excluded.id,
  name = excluded.name,
  role = excluded.role,
  division_id = excluded.division_id,
  status = excluded.status,
  employee_id = excluded.employee_id;

update app_settings
set setting_value = 'Owner, Kepala Divisi, Staff, Magang, Wakil Owner, Developer, HRD'
where setting_key = 'roles';

drop policy if exists "management insert announcements" on announcements;
create policy "management insert announcements" on announcements for insert to authenticated
with check (private.is_management() or private.current_app_role() = 'HRD');

drop policy if exists "scoped insert documents" on documents;
create policy "scoped insert documents" on documents for insert to authenticated
with check (
  private.is_management()
  or private.current_app_role() = 'HRD'
  or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division())
);

drop policy if exists "authenticated insert activity logs" on activity_logs;
create policy "authenticated insert activity logs" on activity_logs for insert to authenticated
with check (private.current_app_role() in ('Owner', 'Wakil Owner', 'Developer', 'Kepala Divisi', 'HRD'));

drop policy if exists "scoped upload company documents" on storage.objects;
create policy "scoped upload company documents" on storage.objects for insert to authenticated
with check (
  bucket_id = 'company-documents'
  and (
    private.is_management()
    or private.current_app_role() = 'HRD'
    or (
      private.current_app_role() = 'Kepala Divisi'
      and split_part(name, '/', 1) = private.current_app_division()
    )
  )
);
