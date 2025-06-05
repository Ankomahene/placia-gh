-- Create places table with all required references
CREATE TABLE places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  tagline TEXT,
  description TEXT NOT NULL,
  contacts JSONB DEFAULT '[]',
  email VARCHAR(255),
  icon VARCHAR(255),
  logo VARCHAR(255),
  main_image VARCHAR(255),
  gallery JSONB DEFAULT '[]',

  -- Location references
  country_id BIGINT NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
  region_id BIGINT NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
  city_id BIGINT NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  town_id UUID REFERENCES towns(id) ON DELETE SET NULL,
  location JSONB NOT NULL, -- {lng: number, lat: number, name: string, street_address: string}

  website VARCHAR(512),
  socials JSONB DEFAULT '[]', -- [{platform_name?: string, link: string}]

  -- Category references
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE RESTRICT,
  type_id UUID REFERENCES types(id) ON DELETE SET NULL,
  ownership_id UUID REFERENCES ownerships(id) ON DELETE SET NULL,

  -- Rating and operational details
  rating JSONB, -- {rate: number, count: number}
  open_hours JSONB DEFAULT '[]', -- [{day: string, from: string, to: string}]
  features JSONB DEFAULT '[]', -- [{label: string, icon: string}]
  services JSONB DEFAULT '[]', -- [{label: string, icon: string}]
  tags JSONB DEFAULT '[]', -- string[]
  accessibility JSONB DEFAULT '[]', -- [{label: string, icon: string}]

  -- Metadata
  other_details JSONB DEFAULT '{}',
  source VARCHAR(255),
  source_link VARCHAR(512),
  added_by VARCHAR(255) NOT NULL DEFAULT 'anonymous',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived', 'draft')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_places_country_id ON places(country_id);
CREATE INDEX idx_places_region_id ON places(region_id);
CREATE INDEX idx_places_city_id ON places(city_id);
CREATE INDEX idx_places_town_id ON places(town_id);
CREATE INDEX idx_places_category_id ON places(category_id);
CREATE INDEX idx_places_subcategory_id ON places(subcategory_id);
CREATE INDEX idx_places_type_id ON places(type_id);
CREATE INDEX idx_places_ownership_id ON places(ownership_id);
CREATE INDEX idx_places_status ON places(status);
CREATE INDEX idx_places_added_by ON places(added_by);
CREATE INDEX idx_places_slug ON places(slug);
CREATE INDEX idx_places_name ON places(name);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_places_updated_at 
    BEFORE UPDATE ON places 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies (optional, uncomment if using RLS)
-- ALTER TABLE places ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Places are viewable by everyone" ON places
--   FOR SELECT USING (status = 'approved');
-- 
-- CREATE POLICY "Users can insert their own places" ON places
--   FOR INSERT WITH CHECK (auth.uid()::text = added_by OR added_by = 'anonymous');
-- 
-- CREATE POLICY "Users can update their own places" ON places
--   FOR UPDATE USING (auth.uid()::text = added_by); 