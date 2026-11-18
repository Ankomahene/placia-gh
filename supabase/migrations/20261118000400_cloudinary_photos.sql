-- Cloudinary is the main photo store, Supabase Storage the fallback. A photo record carries
-- either storage_path ("<user>/<uuid>.webp") or cloudinary_public_id ("placia/<user>/<uuid>");
-- cover_photo_id holds whichever one the cover has. Only files in the uploader's own folder count.

create or replace function public.attach_place_photos(
  p_place uuid, p_user uuid, p_photos jsonb, p_contribution uuid default null
) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  added integer;
begin
  if p_photos is null or jsonb_typeof(p_photos) <> 'array' or jsonb_array_length(p_photos) = 0 then
    return 0;
  end if;
  with ins as (
    insert into public.place_photos (place_id, user_id, storage_path, cloudinary_public_id, width, height, status, contribution_id, created_at)
    -- created_at keeps the sender's order, so their first photo becomes the cover.
    select p_place, p_user, nullif(ph->>'storage_path', ''), nullif(ph->>'cloudinary_public_id', ''), (ph->>'width')::int, (ph->>'height')::int, 'approved', p_contribution,
           now() + o * interval '1 microsecond'
      from jsonb_array_elements(p_photos) with ordinality as t(ph, o)
     where ph->>'storage_path' like p_user::text || '/%'
        or ph->>'cloudinary_public_id' like 'placia/' || p_user::text || '/%'
    on conflict do nothing
    returning id
  )
  select count(*) into added from ins;
  update public.places p set
    photo_count = (select count(*) from public.place_photos f where f.place_id = p.id and f.status = 'approved'),
    cover_photo_id = coalesce(p.cover_photo_id, (
      select coalesce(f.cloudinary_public_id, f.storage_path) from public.place_photos f
       where f.place_id = p.id and f.status = 'approved'
       order by f.created_at, f.id limit 1)),
    updated_at = now()
  where p.id = p_place;
  return added;
end $$;

revoke execute on function public.attach_place_photos(uuid, uuid, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.attach_place_photos(uuid, uuid, jsonb, uuid) to service_role;

create or replace function public.apply_contribution(
  p_id uuid, p_reviewer uuid, p_approve boolean, p_note text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c public.contributions;
  pay jsonb;
  ch jsonb;
  a record;
  new_id uuid;
  out_slug text;
begin
  select * into c from public.contributions where id = p_id for update;
  if not found then raise exception 'contribution % not found', p_id; end if;
  if c.status <> 'pending' then raise exception 'contribution % is already %', p_id, c.status; end if;

  update public.contributions
     set status = case when p_approve then 'approved' else 'rejected' end,
         reviewer_id = p_reviewer, review_note = p_note, reviewed_at = now()
   where id = p_id;

  if not p_approve then
    if c.kind = 'photo' then
      update public.place_photos set status = 'rejected' where contribution_id = p_id;
    end if;
    return jsonb_build_object('status', 'rejected');
  end if;

  pay := c.payload;

  if c.kind = 'new_place' then
    select * into a from public.area_for_point((pay->>'lat')::float8, (pay->>'lon')::float8);
    insert into public.places (
      slug, name, category_id, location, address, locality_id, district_id, region_id,
      phone, website, opening_hours, confidence, status
    ) values (
      public.free_place_slug(pay->>'name', a.locality_name),
      pay->>'name',
      (pay->>'category_id')::smallint,
      extensions.st_setsrid(extensions.st_makepoint((pay->>'lon')::float8, (pay->>'lat')::float8), 4326)::extensions.geography,
      nullif(pay->>'address', ''),
      a.locality_id, a.district_id, a.region_id,
      nullif(pay->>'phone', ''),
      nullif(pay->>'website', ''),
      case when coalesce(pay->>'hours', '') <> '' then jsonb_build_object('text', pay->>'hours') end,
      0.6,
      'active'
    ) returning id, slug into new_id, out_slug;

    insert into public.place_sources (place_id, source, source_id, name, location, category_raw, fields, source_confidence, match_score)
    values (
      new_id, 'community', c.id::text, pay->>'name',
      extensions.st_setsrid(extensions.st_makepoint((pay->>'lon')::float8, (pay->>'lat')::float8), 4326)::extensions.geography,
      pay->>'category_id', pay - 'name' - 'lat' - 'lon' - 'photos', 0.6, 1
    );
    update public.contributions set place_id = new_id where id = p_id;

    perform public.attach_place_photos(new_id, c.user_id, pay->'photos', c.id);

  elsif c.kind = 'edit' then
    ch := pay->'changes';
    update public.places p set
      name = coalesce(nullif(ch->>'name', ''), p.name),
      category_id = coalesce((ch->>'category_id')::smallint, p.category_id),
      phone = case when ch ? 'phone' then nullif(ch->>'phone', '') else p.phone end,
      website = case when ch ? 'website' then nullif(ch->>'website', '') else p.website end,
      address = case when ch ? 'address' then nullif(ch->>'address', '') else p.address end,
      opening_hours = case when ch ? 'hours'
        then case when coalesce(ch->>'hours', '') <> '' then jsonb_build_object('text', ch->>'hours') end
        else p.opening_hours end,
      location = case when ch ? 'lat' and ch ? 'lon'
        then extensions.st_setsrid(extensions.st_makepoint((ch->>'lon')::float8, (ch->>'lat')::float8), 4326)::extensions.geography
        else p.location end
    where p.id = c.place_id
    returning p.slug into out_slug;
    perform public.attach_place_photos(c.place_id, c.user_id, pay->'photos', c.id);

  elsif c.kind = 'report' then
    update public.places p set
      status = case pay->>'reason' when 'closed' then 'closed' when 'not_here' then 'hidden'
                                   when 'duplicate' then 'hidden' else p.status end,
      confidence = greatest(0, p.confidence - 0.1)
    where p.id = c.place_id
    returning p.slug into out_slug;

  elsif c.kind = 'photo' then
    update public.place_photos set status = 'approved' where contribution_id = p_id;
    update public.places p set
      photo_count = (select count(*) from public.place_photos f where f.place_id = p.id and f.status = 'approved'),
      cover_photo_id = coalesce(p.cover_photo_id, pay->>'cloudinary_public_id', pay->>'storage_path')
    where p.id = c.place_id
    returning p.slug into out_slug;
  end if;

  -- Trust grows with accepted contributions; a later phase can auto-approve trusted users.
  update public.profiles set trust_score = trust_score + 1 where id = c.user_id;

  return jsonb_build_object('status', 'approved', 'slug', out_slug, 'place_id', coalesce(new_id, c.place_id));
end $$;
