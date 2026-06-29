-- Ubah Destamara dari Administrator menjadi Wakil Owner.
-- Jalankan pada database yang sudah memiliki data.

alter table app_users drop constraint if exists app_users_role_check;

update app_users
set role = 'Wakil Owner',
    name = 'Destamara Carissa Feodora',
    email = 'cantikaqiza@gmail.com',
    division_id = 'all',
    employee_id = 18
where role = 'Administrator' or lower(email) in ('admin@wdgroup.com', 'destamara.carissa@wdgroup.com', 'cantikaqiza@gmail.com') or id = 'admin-general';

alter table app_users add constraint app_users_role_check
check (role in ('Owner', 'Kepala Divisi', 'Staff', 'Magang', 'Wakil Owner', 'Developer'));

update employees
set role = 'Wakil Owner',
    position = 'Wakil Owner',
    name = 'Destamara Carissa Feodora',
    email = 'cantikaqiza@gmail.com',
    division_id = 'all'
where role = 'Administrator' or lower(email) in ('admin@wdgroup.com', 'destamara.carissa@wdgroup.com', 'cantikaqiza@gmail.com') or id = 18;
