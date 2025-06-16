-- Complete Full-Text Search Migration for Places


-- Step 1: Create the search vector function with proper types
CREATE OR REPLACE FUNCTION places_search_vector(
  -- Place data
  name TEXT,
  description TEXT, 
  tagline TEXT,
  tags TEXT[],
  features JSONB,
  services JSONB,
  -- Location data
  location_name TEXT,
  street_address TEXT,
  -- Category data  
  category_name TEXT,
  subcategory_name TEXT,
  type_name TEXT,
  ownership_name TEXT,
  -- Location entities
  country_name TEXT,
  region_name TEXT,
  city_name TEXT,
  -- Rating and Price Labels
  rate_label TEXT,
  price_level_label TEXT
) RETURNS tsvector AS $$
BEGIN
  RETURN (
    -- A-weighted content
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(tagline, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(category_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(subcategory_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(city_name, '')), 'A') ||

    -- B-weighted data
    setweight(to_tsvector('english', COALESCE(region_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(country_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(street_address, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(type_name, '')), 'B') ||

    -- C-weighted content
    setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(ownership_name, '')), 'C') ||
     
    setweight(to_tsvector('english', COALESCE(rate_label, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(price_level_label, '')), 'C') ||

    -- D-weighted content
    setweight(to_tsvector('english', COALESCE(
      (SELECT string_agg(value->>'label', ' ') 
       FROM jsonb_array_elements(features) 
       WHERE value ? 'label'), ''
    )), 'D') ||
    setweight(to_tsvector('english', COALESCE(
      (SELECT string_agg(value->>'label', ' ') 
       FROM jsonb_array_elements(services) 
       WHERE value ? 'label'), ''
    )), 'D')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 2: Add search vector column
ALTER TABLE places DROP COLUMN IF EXISTS search_vector;
ALTER TABLE places ADD COLUMN search_vector tsvector;

-- Step 3: Create function to update individual place search vector
CREATE OR REPLACE FUNCTION update_place_search_vector(place_id UUID) 
RETURNS VOID AS $$
BEGIN
  UPDATE places 
  SET search_vector = (
    SELECT places_search_vector(
      p.name::TEXT, 
      p.description::TEXT, 
      COALESCE(p.tagline, '')::TEXT, 
      COALESCE(p.tags, ARRAY[]::TEXT[]), 
      COALESCE(p.features, '{}'::JSONB), 
      COALESCE(p.services, '{}'::JSONB),
      COALESCE(p.location->>'name', '')::TEXT, 
      COALESCE(p.location->>'street_address', '')::TEXT,
      COALESCE(c.name, '')::TEXT, 
      COALESCE(sc.name, '')::TEXT, 
      COALESCE(pt.name, '')::TEXT, 
      COALESCE(po.type, '')::TEXT,
      COALESCE(country.name, '')::TEXT, 
      COALESCE(region.name, '')::TEXT, 
      COALESCE(city.name, '')::TEXT,
      COALESCE(p.rate_label, '')::TEXT,
      COALESCE(p.price_level_label, '')::TEXT
    )
    FROM places p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN subcategories sc ON p.subcategory_id = sc.id  
    LEFT JOIN types pt ON p.type_id = pt.id
    LEFT JOIN ownerships po ON p.ownership_id = po.id
    LEFT JOIN countries country ON p.country_id = country.id
    LEFT JOIN regions region ON p.region_id = region.id
    LEFT JOIN cities city ON p.city_id = city.id
    WHERE p.id = place_id
  )
  WHERE id = place_id;
END;
$$ LANGUAGE plpgsql;


-- Step 4: Create function to update all places search vectors
CREATE OR REPLACE FUNCTION update_all_places_search_vectors() 
RETURNS VOID AS $$
DECLARE
  place_record RECORD;
BEGIN
  FOR place_record IN SELECT id FROM places LOOP
    PERFORM update_place_search_vector(place_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Populate search vectors for all existing places
SELECT update_all_places_search_vectors();

-- Step 6: Create trigger function for automatic updates
CREATE OR REPLACE FUNCTION trigger_update_places_search_vector() 
RETURNS TRIGGER AS $$
DECLARE
  category_name TEXT := '';
  subcategory_name TEXT := '';
  type_name TEXT := '';
  ownership_name TEXT := '';
  country_name TEXT := '';
  region_name TEXT := '';
  city_name TEXT := '';
BEGIN
  -- Get related entity names to avoid subqueries in the main function
  SELECT c.name INTO category_name FROM categories c WHERE c.id = NEW.category_id;
  SELECT sc.name INTO subcategory_name FROM subcategories sc WHERE sc.id = NEW.subcategory_id;
  SELECT pt.name INTO type_name FROM types pt WHERE pt.id = NEW.type_id;
  SELECT po.type INTO ownership_name FROM ownerships po WHERE po.id = NEW.ownership_id;
  SELECT country.name INTO country_name FROM countries country WHERE country.id = NEW.country_id;
  SELECT region.name INTO region_name FROM regions region WHERE region.id = NEW.region_id;
  SELECT city.name INTO city_name FROM cities city WHERE city.id = NEW.city_id;

  -- Directly set the search_vector on the NEW record
  NEW.search_vector := places_search_vector(
    NEW.name::TEXT,
    NEW.description::TEXT,
    COALESCE(NEW.tagline, '')::TEXT,
    COALESCE(NEW.tags, ARRAY[]::TEXT[]),
    COALESCE(NEW.features, '{}'::JSONB),
    COALESCE(NEW.services, '{}'::JSONB),
    COALESCE(NEW.location->>'name', '')::TEXT,
    COALESCE(NEW.location->>'street_address', '')::TEXT,
    COALESCE(category_name, '')::TEXT,
    COALESCE(subcategory_name, '')::TEXT,
    COALESCE(type_name, '')::TEXT,
    COALESCE(ownership_name, '')::TEXT,
    COALESCE(country_name, '')::TEXT,
    COALESCE(region_name, '')::TEXT,
    COALESCE(city_name, '')::TEXT,
    COALESCE(NEW.rate_label, '')::TEXT,
    COALESCE(NEW.price_level_label, '')::TEXT
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger for automatic search vector updates  
DROP TRIGGER IF EXISTS places_search_vector_update ON places;
CREATE TRIGGER places_search_vector_update 
  BEFORE INSERT OR UPDATE OF name, description, tagline, tags, features, services, location, category_id, subcategory_id, type_id, ownership_id, country_id, region_id, city_id, rate_label, price_level_label
  ON places 
  FOR EACH ROW 
  EXECUTE FUNCTION trigger_update_places_search_vector();

-- Step 8: Create optimized indexes
-- Full-text search index (most important)
CREATE INDEX IF NOT EXISTS places_search_vector_idx ON places USING GIN(search_vector);

-- Rating index (fixed syntax)
CREATE INDEX IF NOT EXISTS places_rating_idx ON places USING btree (((rating->>'rate')::numeric));

-- Location indexes (separate lat/lng for compatibility)
CREATE INDEX IF NOT EXISTS places_location_lat_idx ON places (((location->>'lat')::numeric));
CREATE INDEX IF NOT EXISTS places_location_lng_idx ON places (((location->>'lng')::numeric));

-- PostGIS geographic index (requires PostGIS extension)

CREATE INDEX IF NOT EXISTS places_location_gist_idx ON places USING GIST (ST_Point((location->>'lng')::numeric, (location->>'lat')::numeric));

-- Category and subcategory composite index
CREATE INDEX IF NOT EXISTS places_category_subcategory_idx ON places(category_id, subcategory_id);

-- Status and basic filtering indexes
CREATE INDEX IF NOT EXISTS places_status_idx ON places(status);
CREATE INDEX IF NOT EXISTS places_name_idx ON places(name);

-- JSON field indexes for features and services
CREATE INDEX IF NOT EXISTS places_features_idx ON places USING GIN(features);
CREATE INDEX IF NOT EXISTS places_services_idx ON places USING GIN(services);
CREATE INDEX IF NOT EXISTS places_tags_idx ON places USING GIN(tags);

-- Comments explaining usage
COMMENT ON COLUMN places.search_vector IS 'Full-text search vector combining place name, description, categories, location, and features with weighted relevance';
COMMENT ON FUNCTION places_search_vector IS 'Generates tsvector for full-text search from place data and related entities';
COMMENT ON FUNCTION update_place_search_vector IS 'Updates search vector for a specific place by UUID';
COMMENT ON FUNCTION update_all_places_search_vectors IS 'Bulk updates search vectors for all places';