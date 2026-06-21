-- WARNING: This deletes WD Management System public tables and related storage buckets.
-- Run this first, then schema, seed, and finally supabase-role-policies.sql.

drop table if exists
  task_submissions,
  activity_logs,
  announcements,
  documents,
  meetings,
  minutes,
  reports,
  weekly_reports,
  sops,
  app_settings,
  tasks,
  employees,
  divisions,
  app_users
cascade;

drop policy if exists "authenticated upload task submissions" on storage.objects;
drop policy if exists "public read task submissions" on storage.objects;
drop policy if exists "authenticated upload company documents" on storage.objects;
drop policy if exists "public read company documents" on storage.objects;
drop policy if exists "scoped read company documents" on storage.objects;
drop policy if exists "scoped upload company documents" on storage.objects;
drop policy if exists "authenticated read task files" on storage.objects;
drop policy if exists "staff upload task files" on storage.objects;
drop policy if exists "management delete company documents" on storage.objects;

-- Supabase blocks direct deletion from storage.objects to prevent orphaned files.
-- Leave buckets and existing files in place; supabase-schema.sql uses
-- insert into storage.buckets ... on conflict do nothing, so rerun is safe.
-- If you need to empty files too, delete them from Supabase Dashboard > Storage
-- or use the Storage API.
