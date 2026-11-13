-- PlaciaGh v2: remove every v1 object from the public schema.
-- v1 data was exported to JSON (placia-v1-backup/) on 2026-11-13 before this ran.
-- auth.* and storage.* are untouched.

drop schema if exists public cascade;
create schema public;
comment on schema public is 'PlaciaGh v2';

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;

alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
