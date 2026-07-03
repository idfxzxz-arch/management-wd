drop policy if exists "management insert tasks" on tasks;

create policy "management insert tasks" on tasks for insert to authenticated
with check (
  private.is_management()
  or private.current_app_role() = 'Kepala Divisi'
);
