-- Izinkan Kepala Divisi yang menjadi penerima tugas untuk mengumpulkan tugas.
drop policy if exists "staff insert submissions" on task_submissions;

create policy "staff insert submissions" on task_submissions for insert to authenticated
with check (
  private.current_app_role() in ('Staff', 'Kepala Divisi')
  and exists (
    select 1
    from tasks t
    where t.id = task_id
      and t.assignee_id = private.current_employee_id()
  )
);

drop policy if exists "staff upload task files" on storage.objects;

create policy "staff upload task files" on storage.objects for insert to authenticated
with check (
  bucket_id = 'task-submissions'
  and private.current_app_role() in ('Staff', 'Kepala Divisi')
);
