-- Admins can delete wrong places for good, and admin decisions survive the next data import.
--
-- The importer upserts every place by its fixed id with status 'active', and prunes rows whose
-- sources it didn't see again. Without guards it would bring back deleted and merged places,
-- undo corrections, and prune admin-added places. So:
--   place_removals     remembers deleted places (the importer skips them),
--   admin_edited_at    marks places an admin saved (the importer leaves them as they are),
--   ingest_overrides() hands the importer all of that in one call,
--   ingest_prune       keeps admin sources, admin-edited places and merged copies.

alter table public.places add column if not exists admin_edited_at timestamptz;
create index if not exists places_admin_edited_idx on public.places (admin_edited_at) where admin_edited_at is not null;

create table if not exists public.place_removals (
  place_id uuid primary key,
  name text not null,
  location extensions.geography(Point, 4326),
  reason text,
  removed_by uuid references auth.users (id) on delete set null,
  removed_at timestamptz not null default now()
);
alter table public.place_removals enable row level security;

-- Deletes a place and everything that only made sense with it. Returns its photos' storage keys
-- so the caller can delete the files too. Contributions are kept (unlinked), pending ones closed.
create or replace function public.delete_place(p_id uuid, p_admin uuid, p_reason text default null)
returns jsonb
language plpgsql volatile set search_path = '' as $$
declare
  pl public.places;
  photos jsonb;
begin
  select * into pl from public.places where id = p_id for update;
  if pl.id is null then raise exception 'place % not found', p_id; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'cloudinary_public_id', f.cloudinary_public_id, 'storage_path', f.storage_path)), '[]')
    into photos
    from public.place_photos f where f.place_id = p_id;

  insert into public.place_removals (place_id, name, location, reason, removed_by)
  values (p_id, pl.name, pl.location, nullif(p_reason, ''), p_admin)
  on conflict (place_id) do update set removed_at = now(), removed_by = excluded.removed_by;

  update public.contributions
     set status = 'rejected', review_note = 'Place removed', reviewer_id = p_admin, reviewed_at = now()
   where place_id = p_id and status = 'pending';
  update public.contributions set place_id = null where place_id = p_id;
  -- Duplicates that were folded into it go with it (they were the same wrong place).
  insert into public.place_removals (place_id, name, location, reason, removed_by)
  select m.id, m.name, m.location, 'merged into a removed place', p_admin
    from public.places m where m.merged_into = p_id
  on conflict (place_id) do nothing;
  delete from public.places where merged_into = p_id;
  delete from public.places where id = p_id;

  return jsonb_build_object('photos', photos, 'name', pl.name);
end $$;

-- What the importer must respect.
create or replace function public.ingest_overrides()
returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'removed', coalesce((select jsonb_agg(place_id) from public.place_removals), '[]'),
    'merged', coalesce((select jsonb_object_agg(id, merged_into) from public.places where merged_into is not null), '{}'),
    'edited', coalesce((select jsonb_agg(id) from public.places where admin_edited_at is not null and merged_into is null), '[]')
  )
$$;

create or replace function public.ingest_prune(p_since timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  n_sources integer;
  n_places integer;
begin
  delete from public.place_sources
   where fetched_at < p_since and source not in ('community', 'admin');
  get diagnostics n_sources = row_count;

  delete from public.places p
   where p.updated_at < p_since
     and p.admin_edited_at is null
     and p.merged_into is null
     and not exists (select 1 from public.place_sources s where s.place_id = p.id);
  get diagnostics n_places = row_count;

  return jsonb_build_object('place_sources', n_sources, 'places', n_places);
end $$;

-- Places admins already corrected or merged today count as edited.
update public.places set admin_edited_at = now()
 where admin_edited_at is null
   and (id in (select place_id from public.place_sources where source = 'admin')
        or id in (select merged_into from public.places where merged_into is not null));

revoke all on function public.delete_place(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.ingest_overrides() from public, anon, authenticated;
grant execute on function public.delete_place(uuid, uuid, text) to service_role;
grant execute on function public.ingest_overrides() to service_role;
