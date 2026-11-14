-- Phase 1: full-text search vectors, ingest provenance and data-quality numbers.

-- ---------------------------------------------------------------------------
-- search_tsv: what a place is called (A) › what it is (B) › where it is (C) › its address (D).
-- 'simple' config: Ghanaian names must not be stemmed as English ("Labone" ≠ "labon").
-- ---------------------------------------------------------------------------

create function public.places_search_tsv() returns trigger
language plpgsql set search_path = '' as $$
declare
  what text;
  area text;
begin
  select concat_ws(' ', c.name, array_to_string(c.synonyms, ' '), p.name, array_to_string(p.synonyms, ' '))
    into what
    from public.categories c left join public.categories p on p.id = c.parent_id
   where c.id = new.category_id;

  select concat_ws(' ', l.name, array_to_string(l.alt_names, ' '), d.name, r.name)
    into area
    from (select 1) one
    left join public.localities l on l.id = new.locality_id
    left join public.districts d on d.id = new.district_id
    left join public.regions r on r.id = new.region_id;

  new.search_tsv :=
       setweight(to_tsvector('simple', extensions.unaccent(concat_ws(' ', new.name, array_to_string(new.alt_names, ' ')))), 'A')
    || setweight(to_tsvector('simple', extensions.unaccent(coalesce(what, ''))), 'B')
    || setweight(to_tsvector('simple', extensions.unaccent(coalesce(area, ''))), 'C')
    || setweight(to_tsvector('simple', extensions.unaccent(coalesce(new.address, ''))), 'D');
  return new;
end $$;

create trigger places_search_tsv
  before insert or update of name, alt_names, category_id, locality_id, district_id, region_id, address
  on public.places
  for each row execute function public.places_search_tsv();

-- ---------------------------------------------------------------------------
-- Ingest runs: what was loaded, from which source versions, with what outcome.
-- ---------------------------------------------------------------------------

create table public.ingest_runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null,
  finished_at timestamptz,
  -- { "osm": "2026-11-13", "overture": "2026-10-21.0", "geoboundaries": "9469f09" }
  source_versions jsonb not null default '{}',
  -- Resolver statistics: records, matches per rule, rejected merges, places, dropped.
  stats jsonb not null default '{}',
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed'))
);
alter table public.ingest_runs enable row level security;

-- Remove machine-sourced rows a newer run no longer produced. Community data is never pruned.
create function public.ingest_prune(p_since timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  n_sources integer;
  n_places integer;
begin
  delete from public.place_sources
   where fetched_at < p_since and source <> 'community';
  get diagnostics n_sources = row_count;

  delete from public.places p
   where p.updated_at < p_since
     and not exists (select 1 from public.place_sources s where s.place_id = p.id);
  get diagnostics n_places = row_count;

  return jsonb_build_object('place_sources', n_sources, 'places', n_places);
end $$;
revoke execute on function public.ingest_prune(timestamptz) from public, anon, authenticated;
grant execute on function public.ingest_prune(timestamptz) to service_role;

-- ---------------------------------------------------------------------------
-- Data quality in one round trip for the admin app.
-- ---------------------------------------------------------------------------

create function public.admin_data_quality() returns jsonb
language sql stable security definer set search_path = '' as $$
  with p as (select * from public.places where status = 'active')
  select jsonb_build_object(
    'places', (select count(*) from p),
    'coverage', (
      select jsonb_build_object(
        'phone', count(phone), 'website', count(website), 'hours', count(opening_hours),
        'address', count(address), 'locality', count(locality_id), 'district', count(district_id)
      ) from p
    ),
    'confidence', (
      select jsonb_agg(jsonb_build_object('bucket', b, 'count', n) order by b)
      from (select least(floor(confidence * 10), 9)::int as b, count(*) as n from p group by 1) x
    ),
    'sources', (
      select jsonb_object_agg(source, n)
      from (select source, count(*) as n from public.place_sources group by 1) x
    ),
    'multi_source', (
      select count(*) from (
        select place_id from public.place_sources group by place_id having count(distinct source) > 1
      ) x
    ),
    'groups', (
      select jsonb_agg(jsonb_build_object('slug', g.slug, 'name', g.name, 'icon', g.icon, 'count', coalesce(x.n, 0)) order by x.n desc nulls last)
      from public.categories g
      left join (
        select c.parent_id, count(*) as n from p join public.categories c on c.id = p.category_id group by 1
      ) x on x.parent_id = g.id
      where g.parent_id is null
    ),
    'regions', (
      select jsonb_agg(jsonb_build_object('name', r.name, 'count', coalesce(x.n, 0)) order by x.n desc nulls last)
      from public.regions r
      left join (select region_id, count(*) as n from p group by 1) x on x.region_id = r.id
    ),
    'last_run', (
      select to_jsonb(r) - 'id' from public.ingest_runs r order by started_at desc limit 1
    )
  )
$$;
revoke execute on function public.admin_data_quality() from public, anon, authenticated;
grant execute on function public.admin_data_quality() to service_role;
