-- Short words and categories (2026-11-16, from real searches).
--
-- "buy a cat" with category shop returned Holy Spirit Cathedral and Catholic churches: the last
-- word "cat" matched as a prefix (cat:*) and fuzzily (word_similarity), and the shop category was
-- only one arm against three name arms. Three tunable keys in p_weights, defaults = old behaviour:
--   prefix_min    shortest last word matched as a prefix (was 3)
--   name_min      shortest text for the fuzzy name arm (was 3)
--   off_category  score multiplier for places outside the asked-for categories (was 1)
-- Same signature, so callers and grants are unchanged.

create or replace function public.search_places(
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
  w jsonb := '{"title":1,"fts":1,"name":1,"category":0.8,"semantic":1,"near":1,"proximity":0.5,"confidence":0.4,"alias":2,"prefix_min":3,"name_min":3,"off_category":1}'::jsonb
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
  -- Shortest last word matched as a prefix, and shortest text for the fuzzy name arm.
  w_prefix_min integer := (w ->> 'prefix_min')::integer;
  w_name_min integer := (w ->> 'name_min')::integer;
  -- Score multiplier for places outside the categories asked for (1 = no penalty).
  w_offcat double precision := least(greatest((w ->> 'off_category')::double precision, 0), 1);
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
    if length(v_last) >= w_prefix_min then
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
     where w_name > 0 and length(v_text) >= w_name_min and v_text operator(extensions.<%) s.name
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
    select f.id, f.rrf, f.arms, p.confidence, p.category_id,
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
           ) * (1 - w_conf / 2 + w_conf * r.confidence)
           * case when p_categories is not null and v_or is not null
                       and (r.category_id is null or not r.category_id = any (p_categories))
                  then w_offcat else 1 end as score
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

