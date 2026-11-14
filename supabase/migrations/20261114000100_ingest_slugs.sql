-- Published place URLs must never change: the loader reuses every existing slug.
create function public.ingest_slugs() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(id, slug), '{}'::jsonb) from public.places
$$;
revoke execute on function public.ingest_slugs() from public, anon, authenticated;
grant execute on function public.ingest_slugs() to service_role;
