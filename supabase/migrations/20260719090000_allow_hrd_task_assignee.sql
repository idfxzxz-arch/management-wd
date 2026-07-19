drop policy if exists "hrd update own tasks" on tasks;
create policy "hrd update own tasks" on tasks for update to authenticated
using (
  private.current_app_role() = 'HRD'
  and assignee_id = private.current_employee_id()
)
with check (
  private.current_app_role() = 'HRD'
  and assignee_id = private.current_employee_id()
);

drop policy if exists "hrd insert task submissions" on task_submissions;
create policy "hrd insert task submissions" on task_submissions for insert to authenticated
with check (
  private.current_app_role() = 'HRD'
  and exists (
    select 1
    from tasks t
    where t.id = task_id
      and t.assignee_id = private.current_employee_id()
  )
);

drop policy if exists "hrd update task submissions" on task_submissions;
create policy "hrd update task submissions" on task_submissions for update to authenticated
using (
  private.current_app_role() = 'HRD'
  and exists (
    select 1
    from tasks t
    where t.id = task_id
      and t.assignee_id = private.current_employee_id()
  )
)
with check (
  private.current_app_role() = 'HRD'
  and exists (
    select 1
    from tasks t
    where t.id = task_id
      and t.assignee_id = private.current_employee_id()
  )
);

create or replace function private.enforce_staff_task_update()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if private.current_app_role() in ('Staff', 'Magang', 'HRD') then
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

create or replace function private.enforce_staff_submission_update()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if private.current_app_role() in ('Staff', 'Magang', 'HRD') then
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

drop policy if exists "hrd insert activity logs" on activity_logs;
create policy "hrd insert activity logs" on activity_logs for insert to authenticated
with check (
  private.current_app_role() = 'HRD'
);

drop policy if exists "hrd upload task files" on storage.objects;
create policy "hrd upload task files" on storage.objects for insert to authenticated
with check (
  bucket_id = 'task-submissions'
  and private.current_app_role() = 'HRD'
);
