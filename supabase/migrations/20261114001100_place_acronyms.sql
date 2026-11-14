-- Acronyms learned from place names: "kbth" → Korle Bu Teaching Hospital, "umat" → University
-- of Mines and Technology.
--
-- People in Ghana call institutions by their initials, but most places never carry those
-- initials in the data (no place says "KBTH"). Every multi-word name yields its initials, with
-- small words optional ("umt", "umat", "uomat"). An initials → name pair is kept only with
-- evidence that people use it:
--   explicit  an alternative name or a bracket states it ("(KNUST)", alt name "UMaT");
--   places    several places share the name (duplicates across sources, campuses);
--   refs      other places are named with the initials ("GIJ SRC", "TTH Labor ward").
-- The search parser expands initials it finds in a query (docs/SEARCH.md).

create table public.place_acronyms (
  acronym text not null,
  -- Normalised name, matched as a phrase in search_tsv.
  phrase text not null,
  -- The name as most places spell it, for display ("Showing Korle Bu Teaching Hospital").
  expansion text not null,
  places integer not null,
  refs integer not null,
  explicit boolean not null,
  score real not null,
  refreshed_at timestamptz not null default now(),
  primary key (acronym, phrase)
);
alter table public.place_acronyms enable row level security;
create policy "public read" on public.place_acronyms for select using (true);

-- Initials of a normalised name, every combination of its small words in or out. Names with
-- fewer than 3 or more than 8 content words, more than 3 small words, or a number give none.
create function public.acronym_variants(p_words text[]) returns text[]
language plpgsql immutable set search_path = '' as $$
declare
  stops constant text[] := array['of', 'and', 'the', 'for', 'de', 'da', 'in', 'at', 'on', 'a', 'an', 'to'];
  n integer := coalesce(cardinality(p_words), 0);
  stop_at integer[] := '{}';
  content integer := 0;
  out text[] := '{}';
  s text;
begin
  for i in 1 .. n loop
    if p_words[i] ~ '^[0-9]' then return out; end if;
    if p_words[i] = any (stops) then stop_at := stop_at || i; else content := content + 1; end if;
  end loop;
  if content < 3 or content > 8 or cardinality(stop_at) > 3 then return out; end if;
  for m in 0 .. (1 << cardinality(stop_at)) - 1 loop
    s := '';
    for i in 1 .. n loop
      if not (i = any (stop_at)) or (m >> (array_position(stop_at, i) - 1)) & 1 = 1 then
        s := s || left(p_words[i], 1);
      end if;
    end loop;
    out := out || s;
  end loop;
  return out;
end $$;

create function public.refresh_place_acronyms() returns integer
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

  delete from public.place_acronyms;
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

revoke execute on function public.refresh_place_acronyms() from public, anon, authenticated;
grant execute on function public.refresh_place_acronyms() to service_role;
