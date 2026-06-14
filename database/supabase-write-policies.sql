-- Run this if insert/update from the app is rejected by RLS.
-- Safe to run multiple times.

drop policy if exists "authenticated insert tasks" on tasks;
drop policy if exists "authenticated update tasks" on tasks;
drop policy if exists "authenticated delete tasks" on tasks;

drop policy if exists "authenticated insert activity_logs" on activity_logs;
drop policy if exists "authenticated update activity_logs" on activity_logs;
drop policy if exists "authenticated delete activity_logs" on activity_logs;

drop policy if exists "authenticated insert announcements" on announcements;
drop policy if exists "authenticated update announcements" on announcements;
drop policy if exists "authenticated delete announcements" on announcements;

drop policy if exists "authenticated insert reports" on reports;
drop policy if exists "authenticated update reports" on reports;
drop policy if exists "authenticated delete reports" on reports;

drop policy if exists "authenticated insert weekly_reports" on weekly_reports;
drop policy if exists "authenticated update weekly_reports" on weekly_reports;
drop policy if exists "authenticated delete weekly_reports" on weekly_reports;

create policy "authenticated insert tasks" on tasks for insert to authenticated with check (true);
create policy "authenticated update tasks" on tasks for update to authenticated using (true) with check (true);
create policy "authenticated delete tasks" on tasks for delete to authenticated using (true);

create policy "authenticated insert activity_logs" on activity_logs for insert to authenticated with check (true);
create policy "authenticated update activity_logs" on activity_logs for update to authenticated using (true) with check (true);
create policy "authenticated delete activity_logs" on activity_logs for delete to authenticated using (true);

create policy "authenticated insert announcements" on announcements for insert to authenticated with check (true);
create policy "authenticated update announcements" on announcements for update to authenticated using (true) with check (true);
create policy "authenticated delete announcements" on announcements for delete to authenticated using (true);

create policy "authenticated insert reports" on reports for insert to authenticated with check (true);
create policy "authenticated update reports" on reports for update to authenticated using (true) with check (true);
create policy "authenticated delete reports" on reports for delete to authenticated using (true);

create policy "authenticated insert weekly_reports" on weekly_reports for insert to authenticated with check (true);
create policy "authenticated update weekly_reports" on weekly_reports for update to authenticated using (true) with check (true);
create policy "authenticated delete weekly_reports" on weekly_reports for delete to authenticated using (true);
