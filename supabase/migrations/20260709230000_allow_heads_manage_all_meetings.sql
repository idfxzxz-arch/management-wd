drop policy if exists "scoped insert meetings" on meetings;
drop policy if exists "scoped update meetings" on meetings;
drop policy if exists "scoped delete meetings" on meetings;

create policy "scoped insert meetings" on meetings for insert to authenticated
with check (private.is_management() or private.current_app_role() = 'Kepala Divisi');

create policy "scoped update meetings" on meetings for update to authenticated
using (private.is_management() or private.current_app_role() = 'Kepala Divisi')
with check (private.is_management() or private.current_app_role() = 'Kepala Divisi');

create policy "scoped delete meetings" on meetings for delete to authenticated
using (private.is_management() or private.current_app_role() = 'Kepala Divisi');
