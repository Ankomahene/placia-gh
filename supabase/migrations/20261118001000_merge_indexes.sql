-- Merging looks places up by merged_into and clears duplicate pairs by either side.
create index if not exists places_merged_into_idx on public.places (merged_into) where merged_into is not null;
create index if not exists place_duplicate_pairs_b_idx on public.place_duplicate_pairs (b);
create index if not exists saved_places_place_idx on public.saved_places (place_id);
create index if not exists contributions_place_idx on public.contributions (place_id);
