-- Semantic arm: what each place's embedding is made from, and how it stays current.
--
-- The input is a short description built from facts we already hold:
--   "Accra Marriott Hotel (Marriott Accra Hotel). Hotel, Stay. Airport City, Accra Metropolitan."
-- No HNSW index on purpose: search_places() orders by distance only inside an already-scoped set
-- (radius, district, region), where an approximate index would not be used. A full scan of 57k
-- half-precision vectors stays well under the time budget, and the index would cost ~60 MB of the
-- free tier's 500 MB.

create function public.place_embedding_input(p_id uuid) returns text
language sql stable
set search_path = ''
as $$
  select concat_ws('. ',
           p.name || coalesce(' (' || nullif(array_to_string(p.alt_names[1:2], ', '), '') || ')', ''),
           concat_ws(', ', c.name, g.name,
                     p.attributes ->> 'cuisine', p.attributes ->> 'denomination',
                     p.attributes ->> 'religion', p.attributes ->> 'brand'),
           concat_ws(', ', l.name, d.name, r.name))
    from public.places p
    left join public.categories c on c.id = p.category_id
    left join public.categories g on g.id = c.parent_id
    left join public.localities l on l.id = p.locality_id
    left join public.districts d on d.id = p.district_id
    left join public.regions r on r.id = p.region_id
   where p.id = p_id
$$;

-- Places that need (re-)embedding, with their input text.
create function public.embedding_queue(p_limit integer default 1000)
returns table (id uuid, input text)
language sql stable
set search_path = ''
as $$
  select p.id, public.place_embedding_input(p.id)
    from public.places p
   where p.embedding is null and p.status = 'active'
   order by p.confidence desc, p.id
   limit p_limit
$$;

-- Bulk write. Vectors arrive as pgvector text literals ("[0.1,0.2,...]").
create function public.set_embeddings(p_ids uuid[], p_vectors text[])
returns integer
language sql volatile
set search_path = ''
as $$
  with v as (
    select * from unnest(p_ids, p_vectors) as t(id, vec)
  ), u as (
    update public.places p
       set embedding = v.vec::extensions.halfvec(512)
      from v
     where p.id = v.id
    returning 1
  )
  select count(*)::integer from u
$$;

-- An edit to anything the input is made from invalidates the embedding; the next embed run redoes it.
create function public.places_embedding_stale() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.embedding is not distinct from old.embedding
     and (new.name, new.alt_names, new.category_id, new.locality_id, new.district_id, new.region_id,
          new.attributes ->> 'cuisine', new.attributes ->> 'denomination',
          new.attributes ->> 'religion', new.attributes ->> 'brand')
         is distinct from
         (old.name, old.alt_names, old.category_id, old.locality_id, old.district_id, old.region_id,
          old.attributes ->> 'cuisine', old.attributes ->> 'denomination',
          old.attributes ->> 'religion', old.attributes ->> 'brand')
  then
    new.embedding := null;
  end if;
  return new;
end $$;

create trigger places_embedding_stale before update on public.places
  for each row execute function public.places_embedding_stale();

revoke all on function public.place_embedding_input(uuid) from public, anon, authenticated;
revoke all on function public.embedding_queue(integer) from public, anon, authenticated;
revoke all on function public.set_embeddings(uuid[], text[]) from public, anon, authenticated;
grant execute on function public.place_embedding_input(uuid) to service_role;
grant execute on function public.embedding_queue(integer) to service_role;
grant execute on function public.set_embeddings(uuid[], text[]) to service_role;
