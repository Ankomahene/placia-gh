-- Admins manage a place's live photos: remove, make cover, move to the right place.
-- The first approved photo (oldest created_at) is the cover, so "make cover" moves it first.

create or replace function public.refresh_place_photos(p_place uuid)
returns void
language sql volatile set search_path = '' as $$
  update public.places p set
    photo_count = (select count(*) from public.place_photos f where f.place_id = p.id and f.status = 'approved'),
    cover_photo_id = (
      select coalesce(f.cloudinary_public_id, f.storage_path) from public.place_photos f
       where f.place_id = p.id and f.status = 'approved'
       order by f.created_at limit 1)
  where p.id = p_place;
$$;

-- Deletes the row and returns where the file lives, so the caller can delete the file too.
create or replace function public.remove_place_photo(p_photo uuid)
returns jsonb
language plpgsql volatile set search_path = '' as $$
declare f public.place_photos;
begin
  delete from public.place_photos where id = p_photo returning * into f;
  if f.id is null then return null; end if;
  perform public.refresh_place_photos(f.place_id);
  return jsonb_build_object('place_id', f.place_id,
                            'cloudinary_public_id', f.cloudinary_public_id,
                            'storage_path', f.storage_path);
end $$;

create or replace function public.set_place_cover(p_photo uuid)
returns void
language plpgsql volatile set search_path = '' as $$
declare pl uuid;
begin
  update public.place_photos f set created_at = (
      select min(g.created_at) - interval '1 millisecond' from public.place_photos g where g.place_id = f.place_id)
   where f.id = p_photo and f.status = 'approved'
  returning f.place_id into pl;
  if pl is not null then perform public.refresh_place_photos(pl); end if;
end $$;

-- A photo uploaded to the wrong place goes to the right one (at the end of its photos).
create or replace function public.move_place_photo(p_photo uuid, p_to uuid)
returns void
language plpgsql volatile set search_path = '' as $$
declare old uuid;
begin
  select place_id into old from public.place_photos where id = p_photo;
  if old is null then raise exception 'photo not found'; end if;
  if not exists (select 1 from public.places where id = p_to) then raise exception 'place not found'; end if;
  update public.place_photos set place_id = p_to, created_at = now() where id = p_photo;
  perform public.refresh_place_photos(old);
  perform public.refresh_place_photos(p_to);
end $$;

revoke all on function public.refresh_place_photos(uuid) from public, anon, authenticated;
revoke all on function public.remove_place_photo(uuid) from public, anon, authenticated;
revoke all on function public.set_place_cover(uuid) from public, anon, authenticated;
revoke all on function public.move_place_photo(uuid, uuid) from public, anon, authenticated;
grant execute on function public.refresh_place_photos(uuid) to service_role;
grant execute on function public.remove_place_photo(uuid) to service_role;
grant execute on function public.set_place_cover(uuid) to service_role;
grant execute on function public.move_place_photo(uuid, uuid) to service_role;
