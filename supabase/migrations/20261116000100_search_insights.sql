-- Search insights (admin): each logged search with its top results resolved, plus a stored AI
-- review so a search is reviewed (and paid for) at most once.

alter table public.search_events add column review jsonb;

create or replace function public.admin_search_events(p_days integer default 30, p_limit integer default 2000)
returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at), '[]'::jsonb)
    from (
      select e.id, e.created_at, e.session_id, e.query, e.parsed, e.parse_path, e.error,
             e.result_count, e.total_latency_ms, e.review,
             extensions.st_y(e.coarse_location::extensions.geometry) as lat,
             extensions.st_x(e.coarse_location::extensions.geometry) as lon,
             (select coalesce(jsonb_agg(jsonb_build_object(
                        'name', p.name, 'category', c.slug, 'locality', l.name) order by t.ord), '[]'::jsonb)
                from unnest(e.top_place_ids[1:5]) with ordinality as t(id, ord)
                join public.places p on p.id = t.id
                left join public.categories c on c.id = p.category_id
                left join public.localities l on l.id = p.locality_id) as top
        from public.search_events e
       where e.created_at > now() - make_interval(days => greatest(p_days, 1))
       order by e.created_at desc
       limit least(greatest(p_limit, 1), 5000)
    ) x;
$$;

revoke execute on function public.admin_search_events(integer, integer) from public, anon, authenticated;
grant execute on function public.admin_search_events(integer, integer) to service_role;
