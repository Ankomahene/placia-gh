-- search_context() counts active places per locality on every cold load. This index lets that
-- count read ~1.5 MB of index (index-only once vacuum has marked the pages) instead of the table.
create index places_active_locality_idx on public.places (locality_id) where status = 'active';
