-- Add is_unmatched flag to existing location tables

-- Add is_unmatched column to regions table
ALTER TABLE regions 
ADD COLUMN IF NOT EXISTS is_unmatched BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_address TEXT,
ADD COLUMN IF NOT EXISTS original_search_term TEXT;

-- Add is_unmatched column to cities table  
ALTER TABLE cities 
ADD COLUMN IF NOT EXISTS is_unmatched BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_address TEXT,
ADD COLUMN IF NOT EXISTS original_search_term TEXT;

-- Add is_unmatched column to towns table
ALTER TABLE towns 
ADD COLUMN IF NOT EXISTS is_unmatched BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_address TEXT,
ADD COLUMN IF NOT EXISTS original_search_term TEXT;

-- Create indexes for better filtering performance
CREATE INDEX IF NOT EXISTS idx_regions_is_unmatched ON regions(is_unmatched);
CREATE INDEX IF NOT EXISTS idx_cities_is_unmatched ON cities(is_unmatched);
CREATE INDEX IF NOT EXISTS idx_towns_is_unmatched ON towns(is_unmatched);

-- Add comments to document the new columns
COMMENT ON COLUMN regions.is_unmatched IS 'Flag indicating this region was added from unmatched search results';
COMMENT ON COLUMN regions.source_address IS 'Original address string that generated this unmatched region';
COMMENT ON COLUMN regions.original_search_term IS 'Original search term used when this region was added as unmatched';

COMMENT ON COLUMN cities.is_unmatched IS 'Flag indicating this city was added from unmatched search results';
COMMENT ON COLUMN cities.source_address IS 'Original address string that generated this unmatched city';
COMMENT ON COLUMN cities.original_search_term IS 'Original search term used when this city was added as unmatched';

COMMENT ON COLUMN towns.is_unmatched IS 'Flag indicating this town was added from unmatched search results';
COMMENT ON COLUMN towns.source_address IS 'Original address string that generated this unmatched town';
COMMENT ON COLUMN towns.original_search_term IS 'Original search term used when this town was added as unmatched'; 