-- admin_save_place read the area record even when the place did not move (unassigned record).
-- The area now lives in plain variables that are simply null when unused.

create or replace function public.admin_save_place(p_id uuid, p jsonb, p_admin uuid)
returns jsonb
language plpgsql volatile set search_path = '' as $$
declare
  a record;
  loc bigint;
  dist smallint;
  reg smallint;
  moved boolean := p ? 'lat' and p ? 'lon';
  pt extensions.geography;
  out_id uuid;
  out_slug text;
  txt text;
begin
  if moved then
    pt := extensions.st_setsrid(extensions.st_makepoint((p->>'lon')::float8, (p->>'lat')::float8), 4326)::extensions.geography;
    select * into a from public.area_for_point((p->>'lat')::float8, (p->>'lon')::float8);
    loc := a.locality_id; dist := a.district_id; reg := a.region_id;
  end if;

  if p_id is null then
    if not moved or coalesce(p->>'name', '') = '' then
      raise exception 'name and location are required';
    end if;
    insert into public.places (
      slug, name, alt_names, category_id, location, address, locality_id, district_id, region_id,
      phone, website, email, opening_hours, description, confidence, status
    ) values (
      public.free_place_slug(p->>'name', (select l.name from public.localities l where l.id = loc)),
      p->>'name',
      coalesce(array(select jsonb_array_elements_text(p->'alt_names')), '{}'),
      (p->>'category_id')::smallint,
      pt,
      nullif(p->>'address', ''),
      loc, dist, reg,
      nullif(p->>'phone', ''),
      nullif(p->>'website', ''),
      nullif(p->>'email', ''),
      case when coalesce(p->>'hours', '') <> '' then jsonb_build_object('text', p->>'hours') end,
      nullif(p->>'description', ''),
      0.8,
      coalesce(nullif(p->>'status', ''), 'active')
    ) returning id, slug into out_id, out_slug;

    insert into public.place_sources (place_id, source, source_id, name, location, category_raw, fields, source_confidence, match_score)
    values (out_id, 'admin', out_id::text, p->>'name', pt, p->>'category_id',
            jsonb_build_object('by', p_admin), 0.8, 1);
  else
    -- Free text hours replace structured OSM hours only when they actually changed.
    txt := coalesce(p->>'hours', '');
    update public.places x set
      name = coalesce(nullif(p->>'name', ''), x.name),
      alt_names = case when p ? 'alt_names'
        then coalesce(array(select jsonb_array_elements_text(p->'alt_names')), '{}') else x.alt_names end,
      category_id = case when p ? 'category_id' then (p->>'category_id')::smallint else x.category_id end,
      location = coalesce(pt, x.location),
      locality_id = case when moved then loc else x.locality_id end,
      district_id = case when moved then dist else x.district_id end,
      region_id = case when moved then reg else x.region_id end,
      address = case when p ? 'address' then nullif(p->>'address', '') else x.address end,
      phone = case when p ? 'phone' then nullif(p->>'phone', '') else x.phone end,
      website = case when p ? 'website' then nullif(p->>'website', '') else x.website end,
      email = case when p ? 'email' then nullif(p->>'email', '') else x.email end,
      opening_hours = case when p ? 'hours'
        then case when txt = '' then null else jsonb_build_object('text', txt) end
        else x.opening_hours end,
      description = case when p ? 'description' then nullif(p->>'description', '') else x.description end,
      status = coalesce(nullif(p->>'status', ''), x.status),
      -- Checked by a person: at least as sure as a community addition.
      confidence = greatest(x.confidence, 0.8)
    where x.id = p_id
    returning id, slug into out_id, out_slug;
    if out_id is null then raise exception 'place % not found', p_id; end if;
  end if;

  return jsonb_build_object('id', out_id, 'slug', out_slug);
end $$;

