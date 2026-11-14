-- The first version compared embeddings to tell "embedding being written" from "content edited",
-- which needs pgvector's = operator outside the empty search_path. Instead, fire only on updates
-- that touch the input columns and actually change them; writing an embedding never does.

drop trigger places_embedding_stale on public.places;

create or replace function public.places_embedding_stale() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.embedding := null;
  return new;
end $$;

create trigger places_embedding_stale
  before update of name, alt_names, category_id, locality_id, district_id, region_id, attributes
  on public.places
  for each row
  when (
    (new.name, new.alt_names, new.category_id, new.locality_id, new.district_id, new.region_id,
     new.attributes ->> 'cuisine', new.attributes ->> 'denomination',
     new.attributes ->> 'religion', new.attributes ->> 'brand')
    is distinct from
    (old.name, old.alt_names, old.category_id, old.locality_id, old.district_id, old.region_id,
     old.attributes ->> 'cuisine', old.attributes ->> 'denomination',
     old.attributes ->> 'religion', old.attributes ->> 'brand')
  )
  execute function public.places_embedding_stale();
