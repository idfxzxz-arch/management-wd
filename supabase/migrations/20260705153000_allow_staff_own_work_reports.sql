drop policy if exists "staff insert reports" on reports;
create policy "staff insert reports" on reports for insert to authenticated
with check (
  private.current_app_role() in ('Staff', 'Magang')
  and employee_id = private.current_employee_id()
);

drop policy if exists "staff insert weekly reports" on weekly_reports;
create policy "staff insert weekly reports" on weekly_reports for insert to authenticated
with check (
  private.current_app_role() in ('Staff', 'Magang')
  and employee_id = private.current_employee_id()
);
