-- Look-alikes of one place, for its admin edit page. Replaces duplicate_candidates, whose
-- "one place or all" switch kept the planner from using the location index (seconds per call).

drop function if exists public.duplicate_candidates(uuid, double precision, real, int, int);

create or replace function public.place_lookalikes(p_place uuid, p_radius double precision default 300)
returns table (id uuid, distance_m double precision, similarity real)
language sql stable set search_path = '' as $$
  select y.id,
         extensions.st_distance(x.location, y.location),
         extensions.similarity(lower(x.name), lower(y.name)) as sim
    from public.places x
    join public.places y
      on y.id <> x.id
     and extensions.st_dwithin(x.location, y.location, p_radius)
   where x.id = p_place
     and y.status <> 'hidden'
     and extensions.similarity(lower(x.name), lower(y.name)) >= 0.4
     and not exists (
       select 1 from public.place_not_duplicates n
        where n.a = least(x.id, y.id) and n.b = greatest(x.id, y.id))
   order by sim desc
   limit 10
$$;

revoke all on function public.place_lookalikes(uuid, double precision) from public, anon, authenticated;
grant execute on function public.place_lookalikes(uuid, double precision) to service_role;
