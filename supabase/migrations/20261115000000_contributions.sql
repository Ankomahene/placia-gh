-- Phase 5: accounts and contributions.
--
-- Users suggest new places, edits, reports and photos. Each suggestion is a `contributions` row
-- with an AI pre-check; a moderator approves it and apply_contribution() makes the change live
-- in one transaction. Users never write to places directly.

-- Photos are stored in Supabase Storage (not Cloudinary as first planned): one less service.
alter table public.place_photos alter column cloudinary_public_id drop not null;
alter table public.place_photos add column storage_path text unique;
alter table public.place_photos
  add constraint place_photos_has_file check (storage_path is not null or cloudinary_public_id is not null);
alter table public.place_photos add column contribution_id uuid references public.contributions (id) on delete set null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('place-photos', 'place-photos', true, 3145728, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

-- Signed-in users upload into their own folder only. Files are public by URL (public bucket),
-- but nothing links to one until a moderator approves the photo.
create policy "own folder upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'place-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Contributions: users may read their own; inserts go through the API (service role) so the AI
-- pre-check and rate limits always run.
drop policy "own contributions insert" on public.contributions;

create or replace function public.slugify(t text) returns text
language sql immutable set search_path = '' as $$
  select trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(t, ''))), '[^a-z0-9]+', '-', 'g'))
$$;

-- A slug that is free: "name", then "name-area", then "name-area-2", ...
create or replace function public.free_place_slug(p_name text, p_area text) returns text
language plpgsql stable set search_path = '' as $$
declare
  base text := left(public.slugify(p_name), 60);
  s text;
  n int := 2;
begin
  if base = '' then base := 'place'; end if;
  s := base;
  if not exists (select 1 from public.places where slug = s) then return s; end if;
  if coalesce(p_area, '') <> '' then
    base := left(base || '-' || public.slugify(p_area), 90);
    s := base;
    if not exists (select 1 from public.places where slug = s) then return s; end if;
  end if;
  loop
    s := base || '-' || n;
    exit when not exists (select 1 from public.places where slug = s);
    n := n + 1;
  end loop;
  return s;
end $$;

-- Locality, district and region for a point: nearest locality within 5 km, district by
-- boundary (falling back to the locality's), region from the district.
create or replace function public.area_for_point(p_lat double precision, p_lon double precision)
returns table (locality_id bigint, locality_name text, district_id smallint, region_id smallint)
language sql stable set search_path = '' as $$
  with pt as (select extensions.st_setsrid(extensions.st_makepoint(p_lon, p_lat), 4326)::extensions.geography g),
  loc as (
    select l.id, l.name, l.district_id
      from public.localities l, pt
     where extensions.st_dwithin(l.location, pt.g, 5000)
     order by l.location operator(extensions.<->) pt.g
     limit 1
  ),
  dis as (
    select d.id, d.region_id
      from public.districts d, pt
     where extensions.st_covers(d.boundary, pt.g)
     limit 1
  )
  select (select id from loc), (select name from loc),
         coalesce((select id from dis), (select district_id from loc)),
         (select d.region_id from public.districts d
           where d.id = coalesce((select id from dis), (select district_id from loc)))
$$;

/*
 * Approve or reject a contribution and apply it. Returns the affected place's slug.
 *   new_place payload: { name, category_id, lat, lon, phone?, website?, address?, hours?, note? }
 *   edit payload:      { changes: { name?, category_id?, phone?, website?, address?, hours?, lat?, lon? }, note? }
 *   report payload:    { reason: closed|not_here|duplicate|wrong_info|other, note? }
 *   photo payload:     { storage_path, width?, height? }
 */
create or replace function public.apply_contribution(
  p_id uuid, p_reviewer uuid, p_approve boolean, p_note text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c public.contributions;
  pay jsonb;
  ch jsonb;
  a record;
  new_id uuid;
  out_slug text;
begin
  select * into c from public.contributions where id = p_id for update;
  if not found then raise exception 'contribution % not found', p_id; end if;
  if c.status <> 'pending' then raise exception 'contribution % is already %', p_id, c.status; end if;

  update public.contributions
     set status = case when p_approve then 'approved' else 'rejected' end,
         reviewer_id = p_reviewer, review_note = p_note, reviewed_at = now()
   where id = p_id;

  if not p_approve then
    if c.kind = 'photo' then
      update public.place_photos set status = 'rejected' where contribution_id = p_id;
    end if;
    return jsonb_build_object('status', 'rejected');
  end if;

  pay := c.payload;

  if c.kind = 'new_place' then
    select * into a from public.area_for_point((pay->>'lat')::float8, (pay->>'lon')::float8);
    insert into public.places (
      slug, name, category_id, location, address, locality_id, district_id, region_id,
      phone, website, opening_hours, confidence, status
    ) values (
      public.free_place_slug(pay->>'name', a.locality_name),
      pay->>'name',
      (pay->>'category_id')::smallint,
      extensions.st_setsrid(extensions.st_makepoint((pay->>'lon')::float8, (pay->>'lat')::float8), 4326)::extensions.geography,
      nullif(pay->>'address', ''),
      a.locality_id, a.district_id, a.region_id,
      nullif(pay->>'phone', ''),
      nullif(pay->>'website', ''),
      case when coalesce(pay->>'hours', '') <> '' then jsonb_build_object('text', pay->>'hours') end,
      0.6,
      'active'
    ) returning id, slug into new_id, out_slug;

    insert into public.place_sources (place_id, source, source_id, name, location, category_raw, fields, source_confidence, match_score)
    values (
      new_id, 'community', c.id::text, pay->>'name',
      extensions.st_setsrid(extensions.st_makepoint((pay->>'lon')::float8, (pay->>'lat')::float8), 4326)::extensions.geography,
      pay->>'category_id', pay - 'name' - 'lat' - 'lon', 0.6, 1
    );
    update public.contributions set place_id = new_id where id = p_id;

  elsif c.kind = 'edit' then
    ch := pay->'changes';
    update public.places p set
      name = coalesce(nullif(ch->>'name', ''), p.name),
      category_id = coalesce((ch->>'category_id')::smallint, p.category_id),
      phone = case when ch ? 'phone' then nullif(ch->>'phone', '') else p.phone end,
      website = case when ch ? 'website' then nullif(ch->>'website', '') else p.website end,
      address = case when ch ? 'address' then nullif(ch->>'address', '') else p.address end,
      opening_hours = case when ch ? 'hours'
        then case when coalesce(ch->>'hours', '') <> '' then jsonb_build_object('text', ch->>'hours') end
        else p.opening_hours end,
      location = case when ch ? 'lat' and ch ? 'lon'
        then extensions.st_setsrid(extensions.st_makepoint((ch->>'lon')::float8, (ch->>'lat')::float8), 4326)::extensions.geography
        else p.location end
    where p.id = c.place_id
    returning p.slug into out_slug;

  elsif c.kind = 'report' then
    update public.places p set
      status = case pay->>'reason' when 'closed' then 'closed' when 'not_here' then 'hidden'
                                   when 'duplicate' then 'hidden' else p.status end,
      confidence = greatest(0, p.confidence - 0.1)
    where p.id = c.place_id
    returning p.slug into out_slug;

  elsif c.kind = 'photo' then
    update public.place_photos set status = 'approved' where contribution_id = p_id;
    update public.places p set
      photo_count = (select count(*) from public.place_photos f where f.place_id = p.id and f.status = 'approved'),
      cover_photo_id = coalesce(p.cover_photo_id, pay->>'storage_path')
    where p.id = c.place_id
    returning p.slug into out_slug;
  end if;

  -- Trust grows with accepted contributions; a later phase can auto-approve trusted users.
  update public.profiles set trust_score = trust_score + 1 where id = c.user_id;

  return jsonb_build_object('status', 'approved', 'slug', out_slug, 'place_id', coalesce(new_id, c.place_id));
end $$;

revoke execute on function public.apply_contribution(uuid, uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.apply_contribution(uuid, uuid, boolean, text) to service_role;
revoke execute on function public.area_for_point(double precision, double precision) from public, anon, authenticated;
grant execute on function public.area_for_point(double precision, double precision) to service_role;
