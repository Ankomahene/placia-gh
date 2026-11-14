-- Town names as people write them in addresses.
--
-- Many towns share a name (Atonsu, Anloga, Mampong), and the gazetteer misses some suburbs
-- entirely: the Kumasi Atonsu is not in it, only two villages of that name are. The places data
-- knows better: ~40 places in Kumasi say "Atonsu" in their name or address. This table holds
-- those mentions, clustered, so the query parser can tell which "Atonsu" people mean.
--
-- refresh_area_mentions() rebuilds it after each ingest (`pnpm ingest mentions`).

create table public.area_mentions (
  id integer generated always as identity primary key,
  -- Normalised locality name, as the query parser keys it (see core/search/text.ts normalize).
  name text not null,
  district_id smallint references public.districts (id) on delete set null,
  lat double precision not null,
  lon double precision not null,
  -- Distinct active places in the cluster that mention the name.
  places integer not null,
  refreshed_at timestamptz not null default now()
);

alter table public.area_mentions enable row level security;
create policy "public read" on public.area_mentions for select using (true);

-- Mirrors normalize() in packages/core/src/search/text.ts closely enough for name matching.
create function public.normalize_text(t text) returns text
language sql stable set search_path = '' as $$
  select btrim(regexp_replace(
           replace(regexp_replace(lower(extensions.unaccent(coalesce(t, ''))), '[''’′`]', '', 'g'),
                   '&', ' and '),
           '[^a-z0-9]+', ' ', 'g'))
$$;

create function public.refresh_area_mentions() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  n integer;
begin
  -- Every area name up to three words. District and region names only stop a shorter town name
  -- inside them from counting ("asokore mampong" is not a mention of Mampong).
  create temp table _names on commit drop as
  select name, bool_or(is_locality) as is_locality
    from (
      select public.normalize_text(x) as name, true as is_locality
        from public.localities l, unnest(array_prepend(l.name, coalesce(l.alt_names, '{}'))) x
      union all
      select public.normalize_text(
               regexp_replace(d.name, ' (Metropolitan|Municipal|District|Metropolis)$', '', 'i')),
             false
        from public.districts d
      union all
      select public.normalize_text(r.name), false from public.regions r
    ) s
   where length(name) >= 4 and array_length(string_to_array(name, ' '), 1) <= 3
   group by name;
  -- Words that are kinds of place ("market", "station") are not town names here.
  delete from _names n
   using public.categories c, unnest(array_prepend(c.name, c.synonyms)) s
   where public.normalize_text(s) = n.name;
  create unique index on _names (name);

  -- Name words, then address words, numbered so a phrase never runs from one into the other.
  create temp table _toks on commit drop as
  select p.id, t.i, t.w
    from public.places p,
         unnest(string_to_array(public.normalize_text(p.name), ' ')) with ordinality t (w, i)
   where p.status = 'active'
  union all
  select p.id, t.i + 1000, t.w
    from public.places p,
         unnest(string_to_array(public.normalize_text(p.address), ' ')) with ordinality t (w, i)
   where p.status = 'active' and p.address is not null;
  create index on _toks (id, i);

  create temp table _hits on commit drop as
  with grams as (
    select a.id, a.i, 1 as len, a.w as g from _toks a
    union all
    select a.id, a.i, 2, a.w || ' ' || b.w
      from _toks a join _toks b on b.id = a.id and b.i = a.i + 1
    union all
    select a.id, a.i, 3, a.w || ' ' || b.w || ' ' || c.w
      from _toks a
      join _toks b on b.id = a.id and b.i = a.i + 1
      join _toks c on c.id = a.id and c.i = a.i + 2
  )
  select g.id, g.i, g.len, g.g as name, n.is_locality
    from grams g join _names n on n.name = g.g;

  -- Longest match wins, and a name that is part of a road name is not a place ("mampong road").
  delete from _hits h
   using _hits l
   where l.id = h.id and l.len > h.len and l.i <= h.i and l.i + l.len >= h.i + h.len;
  delete from _hits h
   using _toks t
   where t.id = h.id and t.i = h.i + h.len
     and t.w in ('road', 'rd', 'street', 'st', 'avenue', 'ave', 'highway', 'hwy', 'bypass');

  delete from public.area_mentions where true;

  -- Cluster each name's mentions (~2 km reach). Keep neighbourhood-sized clusters only: a name
  -- mentioned all over a city ("accra") says nothing about which "Accra" is meant.
  with pts as (
    select distinct h.name, p.id, p.district_id, p.location::extensions.geometry as geom
      from _hits h join public.places p on p.id = h.id
     where h.is_locality
  ),
  clustered as (
    select pts.*,
           extensions.st_clusterdbscan(geom, eps := 0.02, minpoints := 3)
             over (partition by name) as cid
      from pts
  ),
  centres as (
    select name, cid,
           percentile_cont(0.5) within group (order by extensions.st_y(geom)) as lat,
           percentile_cont(0.5) within group (order by extensions.st_x(geom)) as lon,
           mode() within group (order by district_id) as district_id,
           count(*)::integer as places
      from clustered
     where cid is not null
     group by name, cid
    having count(*) >= 3
  ),
  spread as (
    select c.name, c.cid,
           percentile_cont(0.8) within group (
             order by extensions.st_distance(
               k.geom::extensions.geography,
               extensions.st_setsrid(extensions.st_makepoint(c.lon, c.lat), 4326)::extensions.geography)
           ) as p80_m
      from centres c join clustered k on k.name = c.name and k.cid = c.cid
     group by c.name, c.cid
  )
  insert into public.area_mentions (name, district_id, lat, lon, places)
  select c.name, c.district_id, round(c.lat::numeric, 5), round(c.lon::numeric, 5), c.places
    from centres c join spread s on s.name = c.name and s.cid = c.cid
   where s.p80_m <= 4000;

  get diagnostics n = row_count;
  return n;
end
$$;

revoke execute on function public.refresh_area_mentions() from public, anon, authenticated;
grant execute on function public.refresh_area_mentions() to service_role;

-- The parser's context now carries the mention clusters too.
create or replace function public.search_context() returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'categories', (
      select jsonb_agg(jsonb_build_array(c.id, c.slug, c.name, c.parent_id, c.synonyms) order by c.id)
        from public.categories c
    ),
    'regions', (
      select jsonb_agg(jsonb_build_array(
               r.id, r.name,
               round(extensions.st_y(r.centroid::extensions.geometry)::numeric, 5),
               round(extensions.st_x(r.centroid::extensions.geometry)::numeric, 5)) order by r.id)
        from public.regions r
    ),
    'districts', (
      select jsonb_agg(jsonb_build_array(
               d.id, d.name, d.region_id,
               round(extensions.st_y(d.centroid::extensions.geometry)::numeric, 5),
               round(extensions.st_x(d.centroid::extensions.geometry)::numeric, 5)) order by d.id)
        from public.districts d
    ),
    'localities', (
      select jsonb_agg(jsonb_build_array(
               l.id, l.name, l.alt_names, l.kind, l.district_id,
               round(extensions.st_y(l.location::extensions.geometry)::numeric, 5),
               round(extensions.st_x(l.location::extensions.geometry)::numeric, 5),
               coalesce(n.places, 0)) order by l.id)
        from public.localities l
        left join (
          select p.locality_id, count(*)::integer as places
            from public.places p
           where p.status = 'active'
           group by p.locality_id
        ) n on n.locality_id = l.id
    ),
    'mentions', (
      select coalesce(jsonb_agg(jsonb_build_array(m.id, m.name, m.district_id, m.lat, m.lon, m.places)
                                order by m.id), '[]'::jsonb)
        from public.area_mentions m
    )
  )
$$;
