-- Jalankan sekali pada database yang sudah memiliki data.
update app_users
set name = 'Wildan Deni Fahrezi, S.Pd., M.Pd.'
where role = 'Owner';

update employees
set name = 'Wildan Deni Fahrezi, S.Pd., M.Pd.'
where role = 'Owner';

update tasks
set assigned_by_name = 'Wildan Deni Fahrezi, S.Pd., M.Pd.'
where assigned_by = 'Owner';

update task_submissions
set reviewed_by = 'Wildan Deni Fahrezi, S.Pd., M.Pd.'
where reviewer_role = 'Owner';

update announcements
set author = 'Wildan Deni Fahrezi, S.Pd., M.Pd.'
where author = 'Arman Wijaya';

update activity_logs
set actor = 'Wildan Deni Fahrezi, S.Pd., M.Pd.'
where severity = 'owner' and actor = 'Arman Wijaya';
