-- Admins add and correct places directly, and fold duplicates into one place.
--
-- admin_save_place  creates or updates a place in one step (area recomputed when it moves).
-- merge_places      moves everything from a duplicate onto the place being kept, then hides
--                   the duplicate and points it at the keeper (old links redirect).
-- duplicate_candidates  nearby places with very similar names, for the admin to review.

alter table public.place_sources drop constraint if exists place_sources_source_check;
alter table public.place_sources add constraint place_sources_source_check
  check (source in ('osm', 'overture', 'foursquare', 'geonames', 'wikidata', 'community', 'admin'));

alter table public.places add column if not exists merged_into uuid references public.places (id) on delete set null;

-- Pairs an admin said are different places, so they stop showing as candidates.
create table if not exists public.place_not_duplicates (
  a uuid not null references public.places (id) on delete cascade,
  b uuid not null references public.places (id) on delete cascade,
  decided_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);
alter table public.place_not_duplicates enable row level security;

-- ---------------------------------------------------------------------------
-- p: { name, alt_names[], category_id, lat, lon, address, phone, website, email,
--      hours, description, status }. Keys left out keep their value on update.
create or replace function public.admin_save_place(p_id uuid, p jsonb, p_admin uuid)
returns jsonb
language plpgsql volatile set search_path = '' as $$
declare
  a record;
  moved boolean := p ? 'lat' and p ? 'lon';
  pt extensions.geography;
  out_id uuid;
  out_slug text;
  txt text;
begin
  if moved then
    pt := extensions.st_setsrid(extensions.st_makepoint((p->>'lon')::float8, (p->>'lat')::float8), 4326)::extensions.geography;
    select * into a from public.area_for_point((p->>'lat')::float8, (p->>'lon')::float8);
  end if;

  if p_id is null then
    if not moved or coalesce(p->>'name', '') = '' then
      raise exception 'name and location are required';
    end if;
    insert into public.places (
      slug, name, alt_names, category_id, location, address, locality_id, district_id, region_id,
      phone, website, email, opening_hours, description, confidence, status
    ) values (
      public.free_place_slug(p->>'name', a.locality_name),
      p->>'name',
      coalesce(array(select jsonb_array_elements_text(p->'alt_names')), '{}'),
      (p->>'category_id')::smallint,
      pt,
      nullif(p->>'address', ''),
      a.locality_id, a.district_id, a.region_id,
      nullif(p->>'phone', ''),
      nullif(p->>'website', ''),
      nullif(p->>'email', ''),
      case when coalesce(p->>'hours', '') <> '' then jsonb_build_object('text', p->>'hours') end,
      nullif(p->>'description', ''),
      0.8,
      coalesce(nullif(p->>'status', ''), 'active')
    ) returning id, slug into out_id, out_slug;

    insert into public.place_sources (place_id, source, source_id, name, location, category_raw, fields, source_confidence, match_score)
    values (out_id, 'admin', out_id::text, p->>'name', pt, p->>'category_id',
            jsonb_build_object('by', p_admin), 0.8, 1);
  else
    -- Free text hours replace structured OSM hours only when they actually changed.
    txt := coalesce(p->>'hours', '');
    update public.places x set
      name = coalesce(nullif(p->>'name', ''), x.name),
      alt_names = case when p ? 'alt_names'
        then coalesce(array(select jsonb_array_elements_text(p->'alt_names')), '{}') else x.alt_names end,
      category_id = case when p ? 'category_id' then (p->>'category_id')::smallint else x.category_id end,
      location = coalesce(pt, x.location),
      locality_id = case when moved then a.locality_id else x.locality_id end,
      district_id = case when moved then a.district_id else x.district_id end,
      region_id = case when moved then a.region_id else x.region_id end,
      address = case when p ? 'address' then nullif(p->>'address', '') else x.address end,
      phone = case when p ? 'phone' then nullif(p->>'phone', '') else x.phone end,
      website = case when p ? 'website' then nullif(p->>'website', '') else x.website end,
      email = case when p ? 'email' then nullif(p->>'email', '') else x.email end,
      opening_hours = case when p ? 'hours'
        then case when txt = '' then null else jsonb_build_object('text', txt) end
        else x.opening_hours end,
      description = case when p ? 'description' then nullif(p->>'description', '') else x.description end,
      status = coalesce(nullif(p->>'status', ''), x.status),
      -- Checked by a person: at least as sure as a community addition.
      confidence = greatest(x.confidence, 0.8)
    where x.id = p_id
    returning id, slug into out_id, out_slug;
    if out_id is null then raise exception 'place % not found', p_id; end if;
  end if;

  return jsonb_build_object('id', out_id, 'slug', out_slug);
end $$;

-- ---------------------------------------------------------------------------
create or replace function public.merge_places(p_keep uuid, p_drop uuid)
returns jsonb
language plpgsql volatile set search_path = '' as $$
declare
  k public.places;
  d public.places;
begin
  if p_keep = p_drop then raise exception 'cannot merge a place into itself'; end if;
  select * into k from public.places where id = p_keep for update;
  select * into d from public.places where id = p_drop for update;
  if k.id is null or d.id is null then raise exception 'place not found'; end if;
  if d.merged_into is not null then raise exception 'already merged'; end if;

  update public.place_sources set place_id = p_keep where place_id = p_drop;
  update public.place_photos set place_id = p_keep where place_id = p_drop;
  update public.contributions set place_id = p_keep where place_id = p_drop;
  insert into public.saved_places (user_id, place_id, created_at)
    select user_id, p_keep, created_at from public.saved_places where place_id = p_drop
    on conflict do nothing;
  delete from public.saved_places where place_id = p_drop;
  delete from public.place_embeddings where place_id = p_drop;
  -- Anything pointing at the dropped place now points at the keeper.
  update public.places set merged_into = p_keep where merged_into = p_drop;

  update public.places x set
    alt_names = (
      select coalesce(array_agg(distinct n), '{}') from unnest(
        x.alt_names || d.alt_names || case when lower(d.name) <> lower(x.name) then array[d.name] else '{}' end
      ) n where n is not null and n <> '' and lower(n) <> lower(x.name)
    ),
    category_id = coalesce(x.category_id, d.category_id),
    address = coalesce(x.address, d.address),
    phone = coalesce(x.phone, d.phone),
    website = coalesce(x.website, d.website),
    email = coalesce(x.email, d.email),
    socials = d.socials || x.socials,
    opening_hours = coalesce(x.opening_hours, d.opening_hours),
    price_level = coalesce(x.price_level, d.price_level),
    description = coalesce(x.description, d.description),
    attributes = d.attributes || x.attributes,
    cover_photo_id = coalesce(x.cover_photo_id, d.cover_photo_id),
    photo_count = (select count(*) from public.place_photos f where f.place_id = x.id and f.status = 'approved'),
    confidence = least(1, greatest(x.confidence, d.confidence) + 0.05)
  where x.id = p_keep;

  update public.places set
    status = 'hidden', merged_into = p_keep, photo_count = 0, cover_photo_id = null
  where id = p_drop;

  delete from public.place_not_duplicates where a in (p_keep, p_drop) or b in (p_keep, p_drop);

  return jsonb_build_object('id', p_keep, 'slug', k.slug);
end $$;

-- ---------------------------------------------------------------------------
-- Candidate duplicates. With p_place: places near that one. Without: pairs across the map,
-- most alike first. Same or near-same name within p_radius metres.
create or replace function public.duplicate_candidates(
  p_place uuid default null,
  p_radius double precision default 200,
  p_min_sim real default 0.55,
  p_limit int default 50,
  p_offset int default 0
)
returns table (a uuid, b uuid, distance_m double precision, similarity real)
language sql stable set search_path = '' as $$
  select x.id, y.id,
         extensions.st_distance(x.location, y.location) as distance_m,
         extensions.similarity(lower(x.name), lower(y.name)) as similarity
    from public.places x
    join public.places y
      on y.id <> x.id
     and extensions.st_dwithin(x.location, y.location, p_radius)
   where x.status <> 'hidden' and y.status <> 'hidden'
     and (case when p_place is null then x.id < y.id else x.id = p_place end)
     and extensions.similarity(lower(x.name), lower(y.name)) >= p_min_sim
     and not exists (
       select 1 from public.place_not_duplicates n
        where n.a = least(x.id, y.id) and n.b = greatest(x.id, y.id))
   order by similarity desc, distance_m
   limit p_limit offset p_offset
$$;

revoke all on function public.admin_save_place(uuid, jsonb, uuid) from public, anon, authenticated;
revoke all on function public.merge_places(uuid, uuid) from public, anon, authenticated;
revoke all on function public.duplicate_candidates(uuid, double precision, real, int, int) from public, anon, authenticated;
grant execute on function public.admin_save_place(uuid, jsonb, uuid) to service_role;
grant execute on function public.merge_places(uuid, uuid) to service_role;
grant execute on function public.duplicate_candidates(uuid, double precision, real, int, int) to service_role;
