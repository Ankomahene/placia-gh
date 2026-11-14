-- Search expands initials ("kbth" → Korle Bu Teaching Hospital).
--
-- search_context() ships the best name for each acronym in place_acronyms, so the parser can spot
-- initials without a round trip. search_places() takes those names as p_alias and gets one more
-- arm, "alias": places whose name or alternative name contains the phrase, shortest name first,
-- so the institution itself comes before its departments and hostels.

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
    -- [acronym, phrase, expansion, score, runner-up score]: the best name per acronym.
    'acronyms', (
      select coalesce(jsonb_agg(jsonb_build_array(
               b.acronym, b.phrase, b.expansion, round(b.score::numeric, 2),
               round(coalesce(b.second, 0)::numeric, 2)) order by b.acronym), '[]'::jsonb)
        from (
          select a.acronym, a.phrase, a.expansion, a.score,
                 lead(a.score) over (partition by a.acronym order by a.score desc, a.phrase) as second,
                 row_number() over (partition by a.acronym order by a.score desc, a.phrase) as rn
            from public.place_acronyms a
        ) b
       where b.rn = 1
    )
  )
$$;

drop function public.search_places(
  text, smallint[], double precision, double precision, integer, smallint, smallint,
  extensions.halfvec, integer, integer, jsonb
);

create function public.search_places(
  p_text text default null,
  p_categories smallint[] default null,
  p_lat double precision default null,
  p_lon double precision default null,
  p_radius_m integer default null,
  p_district_id smallint default null,
  p_region_id smallint default null,
  p_embedding extensions.halfvec default null,
  p_limit integer default 20,
  p_offset integer default 0,
  p_weights jsonb default null,
  p_alias text[] default null
) returns table (
  id uuid,
  slug text,
  name text,
  category text,
  locality text,
  district text,
  address text,
  lat double precision,
  lon double precision,
  distance_m integer,
  confidence real,
  opening_hours jsonb,
  score double precision,
  arms jsonb
)
language plpgsql stable
set search_path = ''
as $$
declare
  k constant integer := 60;          -- RRF constant
  pool constant integer := 200;      -- candidates per arm
  v_centre extensions.geography;
  v_text text := trim(regexp_replace(lower(extensions.unaccent(coalesce(p_text, ''))), '[^a-z0-9]+', ' ', 'g'));
  v_tokens text[];
  v_title_tokens text[];
  v_last text;
  v_or tsquery;
  v_and tsquery;
  v_title tsquery;
  v_alias tsquery;
  v_phrase text;
  w jsonb := '{"title":1,"fts":1,"name":1,"category":0.8,"semantic":1,"near":1,"proximity":0.5,"confidence":0.4,"alias":2}'::jsonb
             || coalesce(p_weights, '{}'::jsonb);
  w_title double precision := (w ->> 'title')::double precision;
  w_fts double precision := (w ->> 'fts')::double precision;
  w_name double precision := (w ->> 'name')::double precision;
  w_cat double precision := (w ->> 'category')::double precision;
  w_sem double precision := (w ->> 'semantic')::double precision;
  w_near double precision := (w ->> 'near')::double precision;
  w_prox double precision := (w ->> 'proximity')::double precision;
  w_conf double precision := least(greatest((w ->> 'confidence')::double precision, 0), 1);
  w_alias double precision := (w ->> 'alias')::double precision;
begin
  if p_lat is not null and p_lon is not null then
    v_centre := extensions.st_setsrid(extensions.st_makepoint(p_lon, p_lat), 4326)::extensions.geography;
  end if;

  -- Tokens are [a-z0-9]+ only, so building tsquery text from them is injection-safe.
  select array_agg(t) into v_tokens
    from unnest(string_to_array(v_text, ' ')) t
   where length(t) >= 2;
  if cardinality(v_tokens) > 0 then
    v_title_tokens := v_tokens;
    -- The last word may still be being typed: let it match as a prefix.
    v_last := v_tokens[cardinality(v_tokens)];
    if length(v_last) >= 3 then
      v_tokens[cardinality(v_tokens)] := v_last || ':*';
      v_title_tokens[cardinality(v_title_tokens)] := v_last || ':*A';
    else
      v_title_tokens[cardinality(v_title_tokens)] := v_last || ':A';
    end if;
    for i in 1 .. cardinality(v_title_tokens) - 1 loop
      v_title_tokens[i] := v_title_tokens[i] || ':A';
    end loop;
    v_or := to_tsquery('simple', array_to_string(v_tokens, ' | '));
    v_and := to_tsquery('simple', array_to_string(v_tokens, ' & '));
    v_title := to_tsquery('simple', array_to_string(v_title_tokens, ' & '));
  end if;

  -- Each alias is a phrase of name words ("korle:A <-> bu:A <-> teaching:A <-> hospital:A").
  if w_alias > 0 and p_alias is not null then
    foreach v_phrase in array p_alias loop
      v_phrase := trim(regexp_replace(lower(extensions.unaccent(coalesce(v_phrase, ''))), '[^a-z0-9]+', ' ', 'g'));
      continue when v_phrase = '';
      select coalesce(v_alias || q, q) into v_alias
        from (select to_tsquery('simple',
                array_to_string(array(select t || ':A' from unnest(string_to_array(v_phrase, ' ')) t), ' <-> ')) as q) x;
    end loop;
  end if;

  return query
  with scope as (
    select p.id, p.name, p.search_tsv, p.confidence, p.category_id, p.location
      from public.places p
     where p.status = 'active'
       and (v_centre is null or p_radius_m is null
            or extensions.st_dwithin(p.location, v_centre, p_radius_m))
       and (p_district_id is null or p.district_id = p_district_id)
       and (p_region_id is null or p.region_id = p_region_id)
  ),
  title as (
    select s.id,
           row_number() over (order by length(s.name), s.confidence desc) as r
      from scope s
     where w_title > 0 and v_title is not null and s.search_tsv @@ v_title
     order by r limit pool
  ),
  fts as (
    select s.id,
           row_number() over (
             order by (s.search_tsv @@ v_and) desc,
                      ts_rank_cd('{0.1,0.2,0.4,1.0}', s.search_tsv, v_or) desc,
                      s.confidence desc) as r
      from scope s
     where w_fts > 0 and v_or is not null and s.search_tsv @@ v_or
     order by r limit pool
  ),
  trgm as (
    select s.id,
           row_number() over (
             order by extensions.word_similarity(v_text, s.name) desc, s.confidence desc) as r
      from scope s
     where w_name > 0 and length(v_text) >= 3 and v_text operator(extensions.<%) s.name
     order by r limit pool
  ),
  cat as (
    select s.id,
           row_number() over (
             order by case when v_centre is not null then s.location operator(extensions.<->) v_centre end,
                      s.confidence desc) as r
      from scope s
     where w_cat > 0 and p_categories is not null and s.category_id = any (p_categories)
     order by r limit pool
  ),
  vec as (
    select s.id,
           row_number() over (order by e.embedding operator(extensions.<=>) p_embedding) as r
      from scope s
      join public.place_embeddings e on e.place_id = s.id
     where w_sem > 0 and p_embedding is not null
     order by r limit pool
  ),
  near as (
    select s.id,
           row_number() over (order by s.location operator(extensions.<->) v_centre) as r
      from scope s
     where w_near > 0 and v_centre is not null and v_or is null and p_categories is null and p_embedding is null
     order by r limit pool
  ),
  alias as (
    select s.id,
           row_number() over (order by length(s.name), s.confidence desc) as r
      from scope s
     where v_alias is not null and s.search_tsv @@ v_alias
     order by r limit pool
  ),
  hits as (
    select h.id, h.r, 'title' as arm, w_title as w from title h
    union all select h.id, h.r, 'fts', w_fts from fts h
    union all select h.id, h.r, 'name', w_name from trgm h
    union all select h.id, h.r, 'category', w_cat from cat h
    union all select h.id, h.r, 'semantic', w_sem from vec h
    union all select h.id, h.r, 'near', w_near from near h
    union all select h.id, h.r, 'alias', w_alias from alias h
  ),
  fused as (
    select h.id, sum(h.w / (k + h.r)) as rrf, jsonb_object_agg(h.arm, h.r) as arms
      from hits h
     group by h.id
  ),
  ranked as (
    select f.id, f.rrf, f.arms, p.confidence,
           case when v_centre is not null
                then extensions.st_distance(p.location, v_centre) end as dist
      from fused f
      join public.places p on p.id = f.id
  ),
  scored as (
    select r.*,
           (r.rrf
             + case when r.dist is not null
                    then w_prox / (k + row_number() over (order by r.dist)) else 0 end
           ) * (1 - w_conf / 2 + w_conf * r.confidence) as score
      from ranked r
  )
  select p.id, p.slug, p.name, c.slug, l.name, d.name, p.address,
         extensions.st_y(p.location::extensions.geometry),
         extensions.st_x(p.location::extensions.geometry),
         round(s.dist)::integer, p.confidence, p.opening_hours,
         s.score, s.arms
    from scored s
    join public.places p on p.id = s.id
    left join public.categories c on c.id = p.category_id
    left join public.localities l on l.id = p.locality_id
    left join public.districts d on d.id = p.district_id
   order by s.score desc, p.id
   limit least(greatest(p_limit, 1), 50) offset greatest(p_offset, 0);
end $$;

grant execute on function public.search_places(
  text, smallint[], double precision, double precision, integer, smallint, smallint,
  extensions.halfvec, integer, integer, jsonb, text[]
) to anon, authenticated, service_role;
