-- Initials that several places share ("KTU": Kumasi and Koforidua Technical University) need the
-- town in the query to choose. Each name now carries where its places are, and search_context()
-- ships up to three names per acronym instead of only the best.

alter table public.place_acronyms
  add column lat double precision,
  add column lon double precision;

create or replace function public.refresh_place_acronyms() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  n integer;
begin
  -- Each name as written, and its head before a comma or dash
  -- ("University of Professional Studies, Accra" → also "University of Professional Studies").
  create temp table _forms on commit drop as
  with p as (
    select id, btrim(regexp_replace(name, '\s*\([^)]*\)\s*', ' ', 'g')) as bare
      from public.places
     where status = 'active'
  )
  select distinct id, form, public.normalize_text(form) as phrase
    from (
      select id, bare as form from p
      union all
      select id, btrim(regexp_replace(bare, '\s*(,|\s[-–—:|]\s).*$', '')) from p
    ) f
   where form <> '';

  create temp table _cand on commit drop as
  select distinct f.id, f.form, f.phrase, v as acronym
    from _forms f, unnest(public.acronym_variants(string_to_array(f.phrase, ' '))) v
   where length(v) between 3 and 8;
  create index on _cand (acronym);

  -- Stated outright: an alternative name, or a bracket in the name, is the initials.
  create temp table _explicit on commit drop as
  select distinct c.id, c.acronym
    from _cand c
    join public.places p on p.id = c.id
    cross join lateral unnest(
      p.alt_names || coalesce(regexp_match(p.name, '\(([^)]*)\)'), '{}')
    ) a
   where public.normalize_text(a) = c.acronym;

  -- Other places named with the initials as a word.
  create temp table _refs on commit drop as
  select w as acronym, count(distinct p.id)::integer as refs
    from public.places p,
         unnest(string_to_array(public.normalize_text(p.name), ' ')) w
   where p.status = 'active'
     and w in (select acronym from _cand)
   group by w;

  delete from public.place_acronyms where true;
  insert into public.place_acronyms (acronym, phrase, expansion, places, refs, explicit, score)
  select g.acronym, g.phrase, g.expansion, g.places, coalesce(r.refs, 0), g.explicit,
         (case when g.explicit then 2 else 0 end) + ln(1 + g.places) + ln(1 + coalesce(r.refs, 0))
    from (
      select c.acronym, c.phrase,
             mode() within group (order by c.form) as expansion,
             count(distinct c.id)::integer as places,
             bool_or(e.id is not null) as explicit
        from _cand c
        left join _explicit e on e.id = c.id and e.acronym = c.acronym
       group by c.acronym, c.phrase
    ) g
    left join _refs r on r.acronym = g.acronym
   where g.explicit or g.places >= 2;
  get diagnostics n = row_count;

  -- Where each name's places are, so a town in the query can choose between names that share
  -- initials ("ktu koforidua").
  update public.place_acronyms a
     set lat = c.lat, lon = c.lon
    from (
      select c.acronym, c.phrase,
             avg(extensions.st_y(p.location::extensions.geometry)) as lat,
             avg(extensions.st_x(p.location::extensions.geometry)) as lon
        from _cand c join public.places p on p.id = c.id
       group by c.acronym, c.phrase
    ) c
   where c.acronym = a.acronym and c.phrase = a.phrase;
  return n;
end $$;

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
    ),
    -- [acronym, phrase, expansion, score, runner-up score, lat, lon]: up to three names per
    -- acronym, best first, so a town in the query can pick between them.
    'acronyms', (
      select coalesce(jsonb_agg(jsonb_build_array(
               b.acronym, b.phrase, b.expansion, round(b.score::numeric, 2),
               round(coalesce(b.second, 0)::numeric, 2),
               round(b.lat::numeric, 4), round(b.lon::numeric, 4)) order by b.acronym, b.rn), '[]'::jsonb)
        from (
          select a.acronym, a.phrase, a.expansion, a.score, a.lat, a.lon,
                 lead(a.score) over (partition by a.acronym order by a.score desc, a.phrase) as second,
                 row_number() over (partition by a.acronym order by a.score desc, a.phrase) as rn
            from public.place_acronyms a
        ) b
       where b.rn <= 3
    )
  )
$$;

select public.refresh_place_acronyms();
