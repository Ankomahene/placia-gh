-- Scanning all ~60k places for look-alikes takes several seconds, too slow for a page load.
-- The pairs are stored instead and rescanned in 16 slices (by the first hex digit of the id),
-- each well under the API's statement timeout. The admin Duplicates page reads this table.

create table if not exists public.place_duplicate_pairs (
  a uuid not null references public.places (id) on delete cascade,
  b uuid not null references public.places (id) on delete cascade,
  distance_m real not null,
  similarity real not null,
  found_at timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);
create index if not exists place_duplicate_pairs_rank_idx
  on public.place_duplicate_pairs (similarity desc, distance_m);
alter table public.place_duplicate_pairs enable row level security;

create or replace function public.refresh_duplicate_pairs(p_slice text)
returns integer
language plpgsql volatile set search_path = '' as $$
declare n integer;
begin
  if p_slice !~ '^[0-9a-f]$' then raise exception 'slice is one hex digit'; end if;
  delete from public.place_duplicate_pairs where left(a::text, 1) = p_slice;
  insert into public.place_duplicate_pairs (a, b, distance_m, similarity)
  select x.id, y.id,
         extensions.st_distance(x.location, y.location),
         extensions.similarity(lower(x.name), lower(y.name))
    from public.places x
    join public.places y
      on y.id > x.id
     and extensions.st_dwithin(x.location, y.location, 200)
   where left(x.id::text, 1) = p_slice
     and x.status <> 'hidden' and y.status <> 'hidden'
     and extensions.similarity(lower(x.name), lower(y.name)) >= 0.55
     and not exists (select 1 from public.place_not_duplicates d where d.a = x.id and d.b = y.id);
  get diagnostics n = row_count;
  return n;
end $$;

-- Merging or dismissing clears the pair right away (no rescan needed).
create or replace function public.forget_duplicate_pairs(p_ids uuid[])
returns void
language sql volatile set search_path = '' as $$
  delete from public.place_duplicate_pairs where a = any (p_ids) or b = any (p_ids);
$$;

revoke all on function public.refresh_duplicate_pairs(text) from public, anon, authenticated;
revoke all on function public.forget_duplicate_pairs(uuid[]) from public, anon, authenticated;
grant execute on function public.refresh_duplicate_pairs(text) to service_role;
grant execute on function public.forget_duplicate_pairs(uuid[]) to service_role;

-- First fill.
select public.refresh_duplicate_pairs(s) from unnest(string_to_array('0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f', ',')) s;
