drop policy if exists "magang update own tasks" on tasks;
create policy "magang update own tasks" on tasks for update to authenticated
using (
  private.current_app_role() = 'Magang'
  and assignee_id = private.current_employee_id()
)
with check (
  private.current_app_role() = 'Magang'
  and assignee_id = private.current_employee_id()
);

drop policy if exists "magang insert task submissions" on task_submissions;
create policy "magang insert task submissions" on task_submissions for insert to authenticated
with check (
  private.current_app_role() = 'Magang'
);

drop policy if exists "magang update task submissions" on task_submissions;
create policy "magang update task submissions" on task_submissions for update to authenticated
using (
  private.current_app_role() = 'Magang'
)
with check (
  private.current_app_role() = 'Magang'
);

drop policy if exists "magang insert activity logs" on activity_logs;
create policy "magang insert activity logs" on activity_logs for insert to authenticated
with check (
  private.current_app_role() = 'Magang'
);
