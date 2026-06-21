-- Role-based security migration for an existing WD Management database.
-- Run once in Supabase SQL Editor after supabase-schema.sql / supabase-seed.sql.

alter table app_users add column if not exists employee_id bigint references employees(id) on delete set null;
alter table reports add column if not exists employee_id bigint references employees(id) on delete set null;
alter table weekly_reports add column if not exists employee_id bigint references employees(id) on delete set null;

create schema if not exists private;
revoke all on schema private from public;

update app_users u
set employee_id = e.id
from employees e
where lower(u.email) = lower(e.email) and u.employee_id is null;

update app_users set employee_id = 1, division_id = 'all' where role = 'Owner' and employee_id is null;
update app_users set employee_id = 18, division_id = 'all' where role = 'Administrator' and employee_id is null;
update app_users set employee_id = 2, name = 'Kepala Divisi WD Group', division_id = 'it' where id = 'head-general';
update app_users set employee_id = 3, name = 'Staf WD Group', division_id = 'it' where id = 'staff-general';
update reports r set employee_id = e.id from employees e where lower(r.staff) = lower(e.name) and r.employee_id is null;
update weekly_reports r set employee_id = e.id from employees e where lower(r.staff) = lower(e.name) and r.employee_id is null;

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

create or replace function private.current_employee_id()
returns bigint language sql stable security definer set search_path = public
as $$
  select employee_id from app_users
  where lower(email) = private.current_app_email() and status = 'Aktif'
  limit 1
$$;

create or replace function private.is_management()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(private.current_app_role() in ('Owner', 'Administrator'), false) $$;

create or replace function private.can_access_division(target_division text)
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce(
    private.is_management()
    or target_division = 'all'
    or target_division = private.current_app_division(),
    false
  )
$$;

do $$
declare policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'app_users', 'divisions', 'employees', 'tasks', 'task_submissions',
        'meetings', 'minutes', 'reports', 'weekly_reports', 'announcements',
        'documents', 'activity_logs', 'sops', 'app_settings'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end $$;

create policy "role read app users" on app_users for select to authenticated
using (lower(email) = private.current_app_email() or private.is_management());
create policy "management update app users" on app_users for update to authenticated
using (private.is_management()) with check (private.is_management());

create policy "authenticated read divisions" on divisions for select to authenticated
using (private.current_app_role() is not null);
create policy "scoped read employees" on employees for select to authenticated
using (private.is_management() or id = private.current_employee_id() or division_id = private.current_app_division());

create policy "scoped read tasks" on tasks for select to authenticated
using (
  private.is_management()
  or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division())
  or (private.current_app_role() = 'Staff' and assignee_id = private.current_employee_id())
);
create policy "management insert tasks" on tasks for insert to authenticated
with check (
  private.is_management()
  or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division())
);
create policy "scoped update tasks" on tasks for update to authenticated
using (
  private.is_management()
  or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division())
  or (private.current_app_role() = 'Staff' and assignee_id = private.current_employee_id())
)
with check (
  private.is_management()
  or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division())
  or (private.current_app_role() = 'Staff' and assignee_id = private.current_employee_id())
);
create policy "management delete tasks" on tasks for delete to authenticated
using (private.is_management() or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division()));

create policy "scoped read submissions" on task_submissions for select to authenticated
using (
  private.is_management()
  or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division())
  or exists (select 1 from tasks t where t.id = task_id and t.assignee_id = private.current_employee_id())
);
create policy "staff insert submissions" on task_submissions for insert to authenticated
with check (
  private.current_app_role() = 'Staff'
  and exists (select 1 from tasks t where t.id = task_id and t.assignee_id = private.current_employee_id())
);
create policy "scoped update submissions" on task_submissions for update to authenticated
using (
  private.is_management()
  or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division())
  or (private.current_app_role() = 'Staff' and exists (select 1 from tasks t where t.id = task_id and t.assignee_id = private.current_employee_id()))
)
with check (
  private.is_management()
  or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division())
  or (private.current_app_role() = 'Staff' and exists (select 1 from tasks t where t.id = task_id and t.assignee_id = private.current_employee_id()))
);

create policy "scoped read meetings" on meetings for select to authenticated using (private.can_access_division(division_id));
create policy "scoped insert meetings" on meetings for insert to authenticated
with check (private.is_management() or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division()));
create policy "scoped update meetings" on meetings for update to authenticated
using (private.is_management() or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division()))
with check (private.is_management() or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division()));
create policy "scoped delete meetings" on meetings for delete to authenticated
using (private.is_management() or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division()));

create policy "scoped read minutes" on minutes for select to authenticated using (private.can_access_division(division_id));
create policy "scoped insert minutes" on minutes for insert to authenticated
with check (private.is_management() or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division()));
create policy "scoped update minutes" on minutes for update to authenticated
using (private.is_management() or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division()))
with check (private.is_management() or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division()));
create policy "scoped delete minutes" on minutes for delete to authenticated
using (private.is_management() or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division()));

create policy "scoped read reports" on reports for select to authenticated
using (private.is_management() or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division()) or employee_id = private.current_employee_id());
create policy "staff insert reports" on reports for insert to authenticated
with check (private.current_app_role() = 'Staff' and employee_id = private.current_employee_id() and division_id = private.current_app_division());
create policy "scoped read weekly reports" on weekly_reports for select to authenticated
using (private.is_management() or (private.current_app_role() = 'Kepala Divisi' and division_id = private.current_app_division()) or employee_id = private.current_employee_id());
create policy "staff insert weekly reports" on weekly_reports for insert to authenticated
with check (private.current_app_role() = 'Staff' and employee_id = private.current_employee_id() and division_id = private.current_app_division());

create policy "authenticated read announcements" on announcements for select to authenticated using (private.current_app_role() is not null);
create policy "management insert announcements" on announcements for insert to authenticated with check (private.is_management());
create policy "management update announcements" on announcements for update to authenticated using (private.is_management()) with check (private.is_management());
create policy "management delete announcements" on announcements for delete to authenticated using (private.is_management());

create policy "scoped read documents" on documents for select to authenticated using (private.can_access_division(division_id));
create policy "scoped insert documents" on documents for insert to authenticated
with check (private.can_access_division(division_id));
create policy "management update documents" on documents for update to authenticated using (private.is_management()) with check (private.is_management());
create policy "management delete documents" on documents for delete to authenticated using (private.is_management());

create policy "management read activity logs" on activity_logs for select to authenticated using (private.is_management());
create policy "authenticated insert activity logs" on activity_logs for insert to authenticated with check (private.current_app_role() is not null);
create policy "management update activity logs" on activity_logs for update to authenticated using (private.is_management()) with check (private.is_management());
create policy "management delete activity logs" on activity_logs for delete to authenticated using (private.is_management());

create policy "scoped read sops" on sops for select to authenticated using (private.can_access_division(division_id));
create policy "authenticated read settings" on app_settings for select to authenticated using (private.current_app_role() is not null);
create policy "owner insert settings" on app_settings for insert to authenticated with check (private.current_app_role() = 'Owner');
create policy "owner update settings" on app_settings for update to authenticated using (private.current_app_role() = 'Owner') with check (private.current_app_role() = 'Owner');

create or replace function private.enforce_staff_task_update()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if private.current_app_role() = 'Staff' then
    if old.assignee_id is distinct from private.current_employee_id()
      or new.assignee_id is distinct from old.assignee_id
      or new.division_id is distinct from old.division_id
      or new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.deadline is distinct from old.deadline
      or new.assigned_by is distinct from old.assigned_by
      or new.assigned_by_name is distinct from old.assigned_by_name
      or new.progress > 95
      or coalesce(new.status, '') not in ('Belum Mulai', 'Proses', 'Terlambat', 'Menunggu Review', 'Revisi Dikirim Ulang')
      or coalesce(new.approval, '') not in ('Draft', 'Menunggu', 'Menunggu Review', 'Revisi')
    then
      raise exception 'Staf hanya dapat memperbarui progres dan pengumpulan tugas miliknya.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_staff_task_update_trigger on tasks;
create trigger enforce_staff_task_update_trigger before update on tasks
for each row execute function private.enforce_staff_task_update();

create or replace function private.enforce_staff_submission_update()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if private.current_app_role() = 'Staff' then
    if coalesce(new.status, '') not in ('Menunggu Review', 'Revisi Dikirim Ulang', 'Terlambat')
      or new.reviewed_by is not null
      or new.reviewer_role is not null
      or new.reviewed_at is not null
    then
      raise exception 'Staf tidak dapat menentukan hasil review.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_staff_submission_update_trigger on task_submissions;
create trigger enforce_staff_submission_update_trigger before insert or update on task_submissions
for each row execute function private.enforce_staff_submission_update();

update storage.buckets set public = false where id in ('task-submissions', 'company-documents');
drop policy if exists "authenticated upload task submissions" on storage.objects;
drop policy if exists "public read task submissions" on storage.objects;
drop policy if exists "authenticated upload company documents" on storage.objects;
drop policy if exists "public read company documents" on storage.objects;
drop policy if exists "authenticated read internal files" on storage.objects;
drop policy if exists "authenticated upload internal files" on storage.objects;
drop policy if exists "scoped read company documents" on storage.objects;
drop policy if exists "scoped upload company documents" on storage.objects;
drop policy if exists "authenticated read task files" on storage.objects;
drop policy if exists "staff upload task files" on storage.objects;
drop policy if exists "management delete company documents" on storage.objects;

create policy "scoped read company documents" on storage.objects for select to authenticated
using (
  bucket_id = 'company-documents'
  and (
    private.is_management()
    or split_part(name, '/', 1) = 'all'
    or split_part(name, '/', 1) = private.current_app_division()
  )
);
create policy "scoped upload company documents" on storage.objects for insert to authenticated
with check (
  bucket_id = 'company-documents'
  and (
    private.is_management()
    or split_part(name, '/', 1) = private.current_app_division()
  )
);
create policy "management delete company documents" on storage.objects for delete to authenticated
using (bucket_id = 'company-documents' and private.is_management());
create policy "authenticated read task files" on storage.objects for select to authenticated
using (bucket_id = 'task-submissions' and private.current_app_role() is not null);
create policy "staff upload task files" on storage.objects for insert to authenticated
with check (bucket_id = 'task-submissions' and private.current_app_role() = 'Staff');

revoke all on all functions in schema private from public;
grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;
