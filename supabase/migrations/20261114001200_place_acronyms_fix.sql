-- refresh_place_acronyms() as in 20261114001100, but with 'where true' on the delete: the API's
-- safe-update guard refuses a bare DELETE.

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
   where g.explicit or g.places >= 2 or coalesce(r.refs, 0) >= 2;
  get diagnostics n = row_count;
  return n;
end $$;
