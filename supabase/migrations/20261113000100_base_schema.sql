-- PlaciaGh v2 base schema.
-- Sized for the Supabase free tier (500 MB): no raw source payloads, half-precision 512-d embeddings.

create extension if not exists postgis with schema extensions;
create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Gazetteer: where things are
-- ---------------------------------------------------------------------------

create table public.regions (
  id smallint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  capital text,
  boundary extensions.geography(MultiPolygon, 4326),
  centroid extensions.geography(Point, 4326)
);

create table public.districts (
  id smallint generated always as identity primary key,
  region_id smallint not null references public.regions (id),
  name text not null,
  slug text not null unique,
  boundary extensions.geography(MultiPolygon, 4326),
  centroid extensions.geography(Point, 4326)
);
create index districts_region_idx on public.districts (region_id);
create index districts_boundary_idx on public.districts using gist (boundary);

-- Towns, suburbs, neighbourhoods and well-known landmarks people use as directions ("near Accra Mall").
create table public.localities (
  id bigint generated always as identity primary key,
  name text not null,
  alt_names text[] not null default '{}',
  kind text not null check (kind in ('city', 'town', 'suburb', 'neighbourhood', 'village', 'landmark')),
  region_id smallint references public.regions (id),
  district_id smallint references public.districts (id),
  location extensions.geography(Point, 4326) not null,
  population integer,
  source text not null,
  source_id text not null,
  unique (source, source_id)
);
create index localities_location_idx on public.localities using gist (location);
create index localities_name_trgm_idx on public.localities using gin (name extensions.gin_trgm_ops);
create index localities_alt_names_idx on public.localities using gin (alt_names);

-- ---------------------------------------------------------------------------
-- Categories: one two-level taxonomy that every source maps into
-- ---------------------------------------------------------------------------

create table public.categories (
  id smallint generated always as identity primary key,
  parent_id smallint references public.categories (id),
  slug text not null unique,
  name text not null,
  icon text,
  -- Everyday Ghanaian-English words for this category ("chop bar", "chemical shop").
  synonyms text[] not null default '{}',
  sort_order smallint not null default 0
);
create index categories_parent_idx on public.categories (parent_id);

-- ---------------------------------------------------------------------------
-- Places: the canonical, merged record
-- ---------------------------------------------------------------------------

create table public.places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  alt_names text[] not null default '{}',
  category_id smallint references public.categories (id),
  location extensions.geography(Point, 4326) not null,
  address text,
  locality_id bigint references public.localities (id),
  district_id smallint references public.districts (id),
  region_id smallint references public.regions (id),
  phone text,
  website text,
  email text,
  socials jsonb not null default '{}',
  -- { "osm": "Mo-Fr 08:00-18:00", "weekly": [[day, open, close], ...] }
  opening_hours jsonb,
  price_level smallint check (price_level between 1 and 4),
  description text,
  -- Amenities and facts: { "wifi": true, "parking": true, "wheelchair": "limited" }
  attributes jsonb not null default '{}',
  cover_photo_id text,
  photo_count smallint not null default 0,
  -- 0..1: how sure we are this place exists as described (source agreement, recency, community).
  confidence real not null default 0.5 check (confidence between 0 and 1),
  status text not null default 'active' check (status in ('active', 'pending', 'closed', 'hidden')),
  search_tsv tsvector,
  embedding extensions.halfvec(512),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index places_location_idx on public.places using gist (location);
create index places_category_idx on public.places (category_id);
create index places_region_idx on public.places (region_id);
create index places_status_idx on public.places (status);
create index places_name_trgm_idx on public.places using gin (name extensions.gin_trgm_ops);
create index places_search_tsv_idx on public.places using gin (search_tsv);
create trigger places_updated_at before update on public.places
  for each row execute function public.set_updated_at();

-- One row per record per source, linked to the canonical place it was merged into (provenance).
create table public.place_sources (
  id bigint generated always as identity primary key,
  place_id uuid references public.places (id) on delete set null,
  source text not null check (source in ('osm', 'overture', 'foursquare', 'geonames', 'wikidata', 'community')),
  source_id text not null,
  name text not null,
  location extensions.geography(Point, 4326) not null,
  category_raw text,
  -- Normalised fields only (phone, website, hours...). Raw dumps stay in the ingest cache, not the DB.
  fields jsonb not null default '{}',
  source_confidence real,
  match_score real,
  fetched_at timestamptz not null default now(),
  unique (source, source_id)
);
create index place_sources_place_idx on public.place_sources (place_id);
create index place_sources_location_idx on public.place_sources using gist (location);

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  trust_score integer not null default 0,
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users who signed up under v1 get a profile too.
insert into public.profiles (id, display_name)
select id, raw_user_meta_data ->> 'full_name' from auth.users
on conflict (id) do nothing;

create table public.saved_places (
  user_id uuid not null references auth.users (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

-- Photos live in Cloudinary; we keep the reference and moderation state.
create table public.place_photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  cloudinary_public_id text not null unique,
  width integer,
  height integer,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
create index place_photos_place_idx on public.place_photos (place_id) where status = 'approved';

create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('new_place', 'edit', 'report', 'photo')),
  place_id uuid references public.places (id) on delete cascade,
  -- new_place: the proposed place; edit: { field: new value }; report: { reason, note }
  payload jsonb not null,
  -- AI pre-check: { verdict, spam_score, duplicate_of, extracted, model, provider }
  ai_review jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_id uuid references auth.users (id),
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index contributions_status_idx on public.contributions (status, created_at desc);
create index contributions_user_idx on public.contributions (user_id);

-- ---------------------------------------------------------------------------
-- Observability and evaluation
-- ---------------------------------------------------------------------------

create table public.search_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id text,
  query text not null,
  parsed jsonb,
  -- Which pipeline ran: 'ai' (LLM parse) or 'rules' (fallback parser).
  parse_path text,
  provider text,
  model text,
  input_tokens integer,
  output_tokens integer,
  ai_latency_ms integer,
  total_latency_ms integer,
  result_count integer,
  top_place_ids uuid[],
  -- Rounded to roughly 1 km so we never store a precise user position.
  coarse_location extensions.geography(Point, 4326),
  error text
);
create index search_events_created_idx on public.search_events (created_at desc);
create index search_events_zero_idx on public.search_events (created_at desc) where result_count = 0;

create table public.eval_runs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  git_sha text,
  suite text not null,
  config jsonb not null default '{}',
  metrics jsonb not null,
  notes text
);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.regions enable row level security;
alter table public.districts enable row level security;
alter table public.localities enable row level security;
alter table public.categories enable row level security;
alter table public.places enable row level security;
alter table public.place_sources enable row level security;
alter table public.profiles enable row level security;
alter table public.saved_places enable row level security;
alter table public.place_photos enable row level security;
alter table public.contributions enable row level security;
alter table public.search_events enable row level security;
alter table public.eval_runs enable row level security;

create policy "public read" on public.regions for select using (true);
create policy "public read" on public.districts for select using (true);
create policy "public read" on public.localities for select using (true);
create policy "public read" on public.categories for select using (true);
create policy "public read active" on public.places for select using (status = 'active');
create policy "public read approved" on public.place_photos for select using (status = 'approved');

create policy "own profile read" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- RLS is row-level only: limit which columns a user may change (role/trust are server-managed).
revoke update on public.profiles from anon, authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

create policy "own saves" on public.saved_places for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own contributions read" on public.contributions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "own contributions insert" on public.contributions for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and ai_review is null);

-- place_sources, search_events, eval_runs: no policies = service role only.

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Cheap call used by the scheduled keep-alive so the free-tier project never idles into a pause.
create function public.ping() returns timestamptz
language sql stable set search_path = '' as $$ select now() $$;
grant execute on function public.ping() to anon, authenticated;

-- Admin overview numbers in one round trip.
create function public.admin_overview() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'places', (select count(*) from public.places),
    'pending_contributions', (select count(*) from public.contributions where status = 'pending'),
    'source_records', (select count(*) from public.place_sources),
    'searches_7d', (select count(*) from public.search_events where created_at > now() - interval '7 days'),
    'extensions', (
      select jsonb_object_agg(name, installed_version is not null)
      from pg_catalog.pg_available_extensions
      where name in ('postgis', 'vector', 'pg_trgm', 'unaccent')
    ),
    'db_size_mb', round(pg_catalog.pg_database_size(current_database()) / 1048576.0)
  )
$$;
revoke execute on function public.admin_overview() from public, anon, authenticated;
grant execute on function public.admin_overview() to service_role;
