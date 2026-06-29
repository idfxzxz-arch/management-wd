-- Jalankan sekali pada database yang sudah memiliki data.
update app_users
set name = 'Wildan Deni Fahrezi'
where role = 'Owner';

update employees
set name = 'Wildan Deni Fahrezi'
where role = 'Owner';

update tasks
set assigned_by_name = 'Wildan Deni Fahrezi'
where assigned_by = 'Owner';

update task_submissions
set reviewed_by = 'Wildan Deni Fahrezi'
where reviewer_role = 'Owner';

update announcements
set author = 'Wildan Deni Fahrezi'
where author = 'Arman Wijaya';

update activity_logs
set actor = 'Wildan Deni Fahrezi'
where severity = 'owner' and actor = 'Arman Wijaya';
