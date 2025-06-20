

## 🚀 **Advanced Option with Full-Text Search:**

For better performance with large datasets, consider using PostgreSQL's full-text search:

```typescript
// Add to your query for full-text search
supabaseQuery = supabaseQuery.textSearch('fts_column', searchTerms.join(' | '), {
  type: 'websearch',
  config: 'english'
});
```

This would require setting up a generated column with tsvector for full-text indexing in your database schema.

```typescript
let supabaseQuery = supabase
  .from('places')
  .select(
    `
    *,
    category:category_id(id, name, slug, icon),
    subcategory:subcategory_id(id, name, slug, icon),
    type:type_id(id, name, slug, icon),
    ownership:ownership_id(id, type, slug, icon),
    country:country_id(id, name),
    region:region_id(id, name),
    city:city_id(id, name)
  `
  )
  .in('status', ['approved', 'scraped'])
  .or(
    `category_id.in.(${categoryIds.join(',')}),subcategory_id.in.(${subcategoryIds.join(',')})`
  );

// Add text-based filtering across multiple fields
if (query || subcategory || type) {
  const searchTerms = [query, subcategory, type].filter(Boolean);
  
  // Build search conditions for each term
  const searchConditions = searchTerms.flatMap(term => {
    const escapedTerm = term.replace(/[%_]/g, '\\$&'); // Escape SQL wildcards
    return [
      `name.ilike.%${escapedTerm}%`,
      `description.ilike.%${escapedTerm}%`, 
      `tagline.ilike.%${escapedTerm}%`,
      // For tags array - check if any tag contains the term
      `tags.cs.{${escapedTerm}}`, // contains (exact match)
      // Alternative for partial tag matching:
      // `tags::text.ilike.%${escapedTerm}%`, // convert to text and search
    ];
  });

  // Add conditions for features and services arrays
  searchTerms.forEach(term => {
    const escapedTerm = term.replace(/[%_]/g, '\\$&');
    
    // Search in features array (check label field of each feature object)
    searchConditions.push(`features::text.ilike.%${escapedTerm}%`);
    
    // Search in services array (check label field of each service object)  
    searchConditions.push(`services::text.ilike.%${escapedTerm}%`);
  });

  // Apply the OR condition for all search criteria
  supabaseQuery = supabaseQuery.or(searchConditions.join(','));
}
```

```typescript
// More precise JSON array searching
if (query || subcategory || type) {
  const searchTerms = [query, subcategory, type].filter(Boolean);
  
  const searchConditions = searchTerms.flatMap(term => {
    const escapedTerm = term.replace(/[%_]/g, '\\$&');
    
    return [
      // Basic text fields
      `name.ilike.%${escapedTerm}%`,
      `description.ilike.%${escapedTerm}%`,
      `tagline.ilike.%${escapedTerm}%`,
      
      // Tags array (string array)
      `tags.cs.{${escapedTerm}}`, // exact match
      
      // Features array - use JSON path query
      `features.cs.[{"label":"${escapedTerm}"}]`, // exact label match
      // Or for partial matching:
      `features::text.ilike.%${escapedTerm}%`,
      
      // Services array - use JSON path query  
      `services.cs.[{"label":"${escapedTerm}"}]`, // exact label match
      // Or for partial matching:
      `services::text.ilike.%${escapedTerm}%`,
    ];
  });

  supabaseQuery = supabaseQuery.or(searchConditions.join(','));
}
```

```typescript
// Add to your query for full-text search
supabaseQuery = supabaseQuery.textSearch('fts_column', searchTerms.join(' | '), {
  type: 'websearch',
  config: 'english'
});
```

---

**User**

I like the idea of of the PostgresSQL's full text search.
I have no idea how to do that, can you guide me through how I it is done.
What do I need to do?

---

**Cursor**

Great choice! PostgreSQL's full-text search is much more powerful and performant than using `ILIKE` with wildcards. Here's a step-by-step guide to implement it:

## 🚀 **Step 1: Understanding Full-Text Search**

PostgreSQL converts text into **tsvector** (text search vector) which tokenizes and normalizes words, making searches much faster and smarter (handles stemming, stop words, etc.).

## 📝 **Step 2: Create Migration to Add Full-Text Search**

You'll need to create a migration to add a computed column that combines all searchable fields:

```sql
-- Migration: Add full-text search to places table
-- File: add_fulltext_search_to_places.sql

-- Step 1: Add a tsvector column for full-text search
ALTER TABLE places 
ADD COLUMN search_vector tsvector;

-- Step 2: Create a function to generate the search vector
CREATE OR REPLACE FUNCTION places_search_vector(
  name TEXT,
  description TEXT, 
  tagline TEXT,
  tags TEXT[],
  features JSONB,
  services JSONB
) RETURNS tsvector AS $$
BEGIN
  RETURN (
    -- Combine all searchable text with different weights
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||  -- Highest weight
    setweight(to_tsvector('english', COALESCE(tagline, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(
      (SELECT string_agg(value->>'label', ' ') FROM jsonb_array_elements(features) WHERE value ? 'label'), 
      ''
    )), 'D') ||
    setweight(to_tsvector('english', COALESCE(
      (SELECT string_agg(value->>'label', ' ') FROM jsonb_array_elements(services) WHERE value ? 'label'), 
      ''
    )), 'D')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Populate the search_vector column for existing records
UPDATE places 
SET search_vector = places_search_vector(name, description, tagline, tags, features, services);

-- Step 4: Create a trigger to automatically update search_vector on changes
CREATE OR REPLACE FUNCTION update_places_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := places_search_vector(
    NEW.name, 
    NEW.description, 
    NEW.tagline, 
    NEW.tags, 
    NEW.features, 
    NEW.services
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER places_search_vector_update 
  BEFORE INSERT OR UPDATE OF name, description, tagline, tags, features, services
  ON places 
  FOR EACH ROW 
  EXECUTE FUNCTION update_places_search_vector();

-- Step 5: Create GIN index for fast full-text search
CREATE INDEX places_search_vector_idx ON places USING GIN(search_vector);

-- Optional: Create additional indexes for other search patterns
CREATE INDEX places_name_idx ON places USING GIN(to_tsvector('english', name));
CREATE INDEX places_tags_idx ON places USING GIN(tags);
```

## 🛠️ **Step 3: Alternative Simpler Approach (Generated Column)**

If you prefer a simpler approach, you can use a generated column (PostgreSQL 12+):

```sql
-- Simpler approach with generated column
ALTER TABLE places 
ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(tagline, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'D')
) STORED;

-- Create the GIN index
CREATE INDEX places_search_vector_idx ON places USING GIN(search_vector);
```

## 💻 **Step 4: Update Your TypeScript Query**

Now update your places service to use full-text search:

```typescript
// In your lib/services/internal/places.ts

interface SearchParams {
  query?: string;
  subcategory?: string;
  type?: string;
  categoryIds: string[];
  subcategoryIds: string[];
}

async function searchPlaces({
  query,
  subcategory,
  type,
  categoryIds,
  subcategoryIds
}: SearchParams) {
  let supabaseQuery = supabase
    .from('places')
    .select(
      `
      *,
      category:category_id(id, name, slug, icon),
      subcategory:subcategory_id(id, name, slug, icon),
      type:type_id(id, name, slug, icon),
      ownership:ownership_id(id, type, slug, icon),
      country:country_id(id, name),
      region:region_id(id, name),
      city:city_id(id, name)
    `
    )
    .in('status', ['approved', 'scraped'])
    .or(
      `category_id.in.(${categoryIds.join(',')}),subcategory_id.in.(${subcategoryIds.join(',')})`
    );

  // Add full-text search if we have search terms
  if (query || subcategory || type) {
    const searchTerms = [query, subcategory, type].filter(Boolean);
    const searchQuery = searchTerms.join(' | '); // OR search
    
    // Use PostgreSQL full-text search
    supabaseQuery = supabaseQuery.textSearch('search_vector', searchQuery, {
      type: 'websearch', // Supports phrases, AND, OR, NOT
      config: 'english'
    });
  }

  return supabaseQuery;
}
```

## 🔍 **Step 5: Advanced Search Features**

With full-text search, you can now support advanced search syntax:

```typescript
// Different search types
const searchExamples = {
  // Simple search
  basic: 'restaurant',
  
  // Phrase search  
  phrase: '"fine dining"',
  
  // AND search
  and: 'restaurant & parking',
  
  // OR search
  or: 'restaurant | cafe',
  
  // NOT search
  not: 'restaurant & !fastfood',
  
  // Proximity search
  proximity: 'luxury <-> hotel',
  
  // Prefix search
  prefix: 'rest*', // matches restaurant, resto, etc.
};

// Use in your query
supabaseQuery = supabaseQuery.textSearch('search_vector', searchQuery, {
  type: 'websearch',
  config: 'english'
});
```

## 📊 **Step 6: Add Search Ranking (Optional)**

You can also add relevance ranking to sort results by how well they match:

```typescript
// Add ranking to your select
let supabaseQuery = supabase
  .from('places')
  .select(
    `
    *,
    search_rank:ts_rank(search_vector, websearch_to_tsquery('english', '${searchQuery}')),
    category:category_id(id, name, slug, icon),
    subcategory:subcategory_id(id, name, slug, icon),
    // ... other relations
  `
  )
  .textSearch('search_vector', searchQuery, {
    type: 'websearch',
    config: 'english'
  })
  .order('search_rank', { ascending: false }); // Order by relevance
```

## 🚀 **Step 7: Running the Migration**

If you're using Supabase:

1. Go to **SQL Editor** in your Supabase dashboard
2. Paste the migration SQL
3. Run it
4. Test with some queries

If you're using a local PostgreSQL:
```bash
psql -d your_database -f add_fulltext_search_to_places.sql
```

## 📈 **Benefits You'll Get:**

1. **Performance**: 10-100x faster than `ILIKE` queries
2. **Intelligent**: Handles stemming (search "running" finds "run", "ran")
3. **Flexible**: Supports complex search syntax
4. **Relevant**: Built-in ranking system
5. **Language-aware**: Supports multiple languages
6. **Scalable**: Handles millions of records efficiently

## 🧪 **Test Your Implementation:**

```sql
-- Test the full-text search
SELECT name, description, ts_rank(search_vector, websearch_to_tsquery('english', 'restaurant & parking')) as rank
FROM places 
WHERE search_vector @@ websearch_to_tsquery('english', 'restaurant & parking')
ORDER BY rank DESC;
```

This will give you a robust, scalable search solution that's much more powerful than simple text matching! 🎉

```sql
-- Migration: Add full-text search to places table
-- File: add_fulltext_search_to_places.sql

-- Step 1: Add a tsvector column for full-text search
ALTER TABLE places 
ADD COLUMN search_vector tsvector;

-- Step 2: Create a function to generate the search vector
CREATE OR REPLACE FUNCTION places_search_vector(
  name TEXT,
  description TEXT, 
  tagline TEXT,
  tags TEXT[],
  features JSONB,
  services JSONB
) RETURNS tsvector AS $$
BEGIN
  RETURN (
    -- Combine all searchable text with different weights
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||  -- Highest weight
    setweight(to_tsvector('english', COALESCE(tagline, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(
      (SELECT string_agg(value->>'label', ' ') FROM jsonb_array_elements(features) WHERE value ? 'label'), 
      ''
    )), 'D') ||
    setweight(to_tsvector('english', COALESCE(
      (SELECT string_agg(value->>'label', ' ') FROM jsonb_array_elements(services) WHERE value ? 'label'), 
      ''
    )), 'D')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Populate the search_vector column for existing records
UPDATE places 
SET search_vector = places_search_vector(name, description, tagline, tags, features, services);

-- Step 4: Create a trigger to automatically update search_vector on changes
CREATE OR REPLACE FUNCTION update_places_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := places_search_vector(
    NEW.name, 
    NEW.description, 
    NEW.tagline, 
    NEW.tags, 
    NEW.features, 
    NEW.services
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER places_search_vector_update 
  BEFORE INSERT OR UPDATE OF name, description, tagline, tags, features, services
  ON places 
  FOR EACH ROW 
  EXECUTE FUNCTION update_places_search_vector();

-- Step 5: Create GIN index for fast full-text search
CREATE INDEX places_search_vector_idx ON places USING GIN(search_vector);

-- Optional: Create additional indexes for other search patterns
CREATE INDEX places_name_idx ON places USING GIN(to_tsvector('english', name));
CREATE INDEX places_tags_idx ON places USING GIN(tags);
```

```sql
-- Simpler approach with generated column
ALTER TABLE places 
ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(tagline, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'D')
) STORED;

-- Create the GIN index
CREATE INDEX places_search_vector_idx ON places USING GIN(search_vector);
```

```typescript
// In your lib/services/internal/places.ts

interface SearchParams {
  query?: string;
  subcategory?: string;
  type?: string;
  categoryIds: string[];
  subcategoryIds: string[];
}

async function searchPlaces({
  query,
  subcategory,
  type,
  categoryIds,
  subcategoryIds
}: SearchParams) {
  let supabaseQuery = supabase
    .from('places')
    .select(
      `
      *,
      category:category_id(id, name, slug, icon),
      subcategory:subcategory_id(id, name, slug, icon),
      type:type_id(id, name, slug, icon),
      ownership:ownership_id(id, type, slug, icon),
      country:country_id(id, name),
      region:region_id(id, name),
      city:city_id(id, name)
    `
    )
    .in('status', ['approved', 'scraped'])
    .or(
      `category_id.in.(${categoryIds.join(',')}),subcategory_id.in.(${subcategoryIds.join(',')})`
    );

  // Add full-text search if we have search terms
  if (query || subcategory || type) {
    const searchTerms = [query, subcategory, type].filter(Boolean);
    const searchQuery = searchTerms.join(' | '); // OR search
    
    // Use PostgreSQL full-text search
    supabaseQuery = supabaseQuery.textSearch('search_vector', searchQuery, {
      type: 'websearch', // Supports phrases, AND, OR, NOT
      config: 'english'
    });
  }

  return supabaseQuery;
}
```

```typescript
// Different search types
const searchExamples = {
  // Simple search
  basic: 'restaurant',
  
  // Phrase search  
  phrase: '"fine dining"',
  
  // AND search
  and: 'restaurant & parking',
  
  // OR search
  or: 'restaurant | cafe',
  
  // NOT search
  not: 'restaurant & !fastfood',
  
  // Proximity search
  proximity: 'luxury <-> hotel',
  
  // Prefix search
  prefix: 'rest*', // matches restaurant, resto, etc.
};

// Use in your query
supabaseQuery = supabaseQuery.textSearch('search_vector', searchQuery, {
  type: 'websearch',
  config: 'english'
});
```

```typescript
// Add ranking to your select
let supabaseQuery = supabase
  .from('places')
  .select(
    `
    *,
    search_rank:ts_rank(search_vector, websearch_to_tsquery('english', '${searchQuery}')),
    category:category_id(id, name, slug, icon),
    subcategory:subcategory_id(id, name, slug, icon),
    // ... other relations
  `
  )
  .textSearch('search_vector', searchQuery, {
    type: 'websearch',
    config: 'english'
  })
  .order('search_rank', { ascending: false }); // Order by relevance
```

```shellscript
psql -d your_database -f add_fulltext_search_to_places.sql
```

```sql
-- Test the full-text search
SELECT name, description, ts_rank(search_vector, websearch_to_tsquery('english', 'restaurant & parking')) as rank
FROM places 
WHERE search_vector @@ websearch_to_tsquery('english', 'restaurant & parking')
ORDER BY rank DESC;
```

---

**User**

This is really great and also, because I am building an AI smart place finder app, It will help with searching for  places accuratly.

How can this work for categories, subcategories, ratings, location (Country, region, City, location.name, location.street_address)

My goal is to create a robust smart place searching that can filter accurately to the results you want and show you at least relevent results first

---

**Cursor**

Excellent! For an AI smart place finder, you'll want a **multi-dimensional search system** that combines full-text search with structured filtering and intelligent ranking. Here's how to build a comprehensive solution:

## 🧠 **Step 1: Enhanced Full-Text Search Vector**

First, let's expand the search vector to include location and category data:

```sql
-- Enhanced migration for AI-powered place search
-- File: enhanced_fulltext_search_places.sql

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS places_search_vector CASCADE;

-- Create enhanced search vector function
CREATE OR REPLACE FUNCTION places_enhanced_search_vector(
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
  -- Location entities
  country_name TEXT,
  region_name TEXT,
  city_name TEXT
) RETURNS tsvector AS $$
BEGIN
  RETURN (
    -- Place content (highest weight)
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(tagline, '')), 'A') ||
    
    -- Categories (high weight for AI understanding)
    setweight(to_tsvector('english', COALESCE(category_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(subcategory_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(type_name, '')), 'B') ||
    
    -- Location (high weight for location-based queries)
    setweight(to_tsvector('english', COALESCE(location_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(street_address, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(city_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(region_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(country_name, '')), 'B') ||
    
    -- Content and features (medium weight)
    setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'C') ||
    
    -- Features and services (lower weight)
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

-- Create enhanced search vector column
ALTER TABLE places DROP COLUMN IF EXISTS enhanced_search_vector;
ALTER TABLE places ADD COLUMN enhanced_search_vector tsvector;

-- Create view to populate search vector with related data
CREATE OR REPLACE VIEW places_with_search_data AS
SELECT 
  p.*,
  c.name as category_name,
  sc.name as subcategory_name,
  pt.name as type_name,
  country.name as country_name,
  region.name as region_name,
  city.name as city_name,
  places_enhanced_search_vector(
    p.name, p.description, p.tagline, p.tags, p.features, p.services,
    p.location->>'name', p.location->>'street_address',
    c.name, sc.name, pt.name,
    country.name, region.name, city.name
  ) as computed_search_vector
FROM places p
LEFT JOIN place_categories c ON p.category_id = c.id
LEFT JOIN place_subcategories sc ON p.subcategory_id = sc.id  
LEFT JOIN place_types pt ON p.type_id = pt.id
LEFT JOIN countries country ON p.country_id = country.id
LEFT JOIN regions region ON p.region_id = region.id
LEFT JOIN cities city ON p.city_id = city.id;

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_places_enhanced_search_vector() 
RETURNS VOID AS $$
BEGIN
  UPDATE places 
  SET enhanced_search_vector = psd.computed_search_vector
  FROM places_with_search_data psd
  WHERE places.id = psd.id;
END;
$$ LANGUAGE plpgsql;

-- Populate initial data
SELECT update_places_enhanced_search_vector();

-- Create trigger for automatic updates
CREATE OR REPLACE FUNCTION trigger_update_places_search_vector() 
RETURNS TRIGGER AS $$
BEGIN
  -- Update the specific place
  UPDATE places 
  SET enhanced_search_vector = (
    SELECT computed_search_vector 
    FROM places_with_search_data 
    WHERE id = NEW.id
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER places_enhanced_search_vector_update 
  AFTER INSERT OR UPDATE ON places
  FOR EACH ROW 
  EXECUTE FUNCTION trigger_update_places_search_vector();

-- Create optimized indexes
CREATE INDEX places_enhanced_search_vector_idx ON places USING GIN(enhanced_search_vector);
CREATE INDEX places_rating_idx ON places((rating->>'rate')::float);
CREATE INDEX places_location_idx ON places USING GIST((location->>'lat')::float, (location->>'lng')::float);
CREATE INDEX places_category_subcategory_idx ON places(category_id, subcategory_id);
```

## 🎯 **Step 2: Smart Search Query Builder**

Create a TypeScript service that handles intelligent query parsing:

```typescript
// lib/services/smart-search.ts

interface SmartSearchParams {
  query: string;
  userLocation?: { lat: number; lng: number };
  filters?: {
    categories?: string[];
    subcategories?: string[];
    minRating?: number;
    maxDistance?: number; // in meters
    priceLevel?: number[];
    openNow?: boolean;
    features?: string[];
  };
  limit?: number;
  offset?: number;
}

interface SearchContext {
  textQuery?: string;
  locationTerms?: string[];
  categoryTerms?: string[];
  ratingTerms?: string[];
  featureTerms?: string[];
}

export class SmartPlaceSearch {
  
  // Parse natural language query into structured search
  private parseQuery(query: string): SearchContext {
    const context: SearchContext = {};
    
    // Extract location indicators
    const locationKeywords = ['in', 'at', 'near', 'around', 'close to', 'nearby'];
    const categoryKeywords = ['restaurant', 'hotel', 'cafe', 'bar', 'gym', 'hospital', 'school'];
    const ratingKeywords = ['best', 'top rated', 'highly rated', 'good', 'excellent'];
    const featureKeywords = ['parking', 'wifi', 'outdoor', 'wheelchair', 'pet friendly'];
    
    // Simple NLP parsing (you can enhance this with actual NLP libraries)
    const words = query.toLowerCase().split(/\s+/);
    
    context.locationTerms = words.filter(word => 
      locationKeywords.some(keyword => query.includes(keyword)) ||
      this.isLocationName(word)
    );
    
    context.categoryTerms = words.filter(word =>
      categoryKeywords.includes(word)
    );
    
    context.ratingTerms = words.filter(word =>
      ratingKeywords.includes(word)
    );
    
    context.featureTerms = words.filter(word =>
      featureKeywords.includes(word)
    );
    
    // Remaining text becomes the main search query
    context.textQuery = query;
    
    return context;
  }
  
  private isLocationName(word: string): boolean {
    // You can enhance this with a location database or API
    const commonLocations = ['accra', 'kumasi', 'tema', 'legon', 'airport'];
    return commonLocations.includes(word.toLowerCase());
  }

  async search({
    query,
    userLocation,
    filters = {},
    limit = 20,
    offset = 0
  }: SmartSearchParams): Promise<{
    results: any[];
    totalCount: number;
    searchMetadata: any;
  }> {
    
    const context = this.parseQuery(query);
    
    // Build the main query
    let supabaseQuery = supabase
      .from('places')
      .select(`
        *,
        category:category_id(id, name, slug, icon),
        subcategory:subcategory_id(id, name, slug, icon),
        type:type_id(id, name, slug, icon),
        country:country_id(id, name),
        region:region_id(id, name),
        city:city_id(id, name),
        search_rank:ts_rank_cd(enhanced_search_vector, websearch_to_tsquery('english', $1)) as relevance_score
      `, [query])
      .in('status', ['approved', 'scraped']);

    // Apply full-text search
    if (query.trim()) {
      supabaseQuery = supabaseQuery.textSearch('enhanced_search_vector', query, {
        type: 'websearch',
        config: 'english'
      });
    }

    // Apply structured filters
    if (filters.categories?.length) {
      supabaseQuery = supabaseQuery.in('category_id', filters.categories);
    }

    if (filters.subcategories?.length) {
      supabaseQuery = supabaseQuery.in('subcategory_id', filters.subcategories);
    }

    if (filters.minRating) {
      supabaseQuery = supabaseQuery.gte('rating->rate', filters.minRating);
    }

    if (filters.openNow) {
      supabaseQuery = supabaseQuery.eq('open_now', true);
    }

    if (filters.priceLevel?.length) {
      supabaseQuery = supabaseQuery.in('price_level', filters.priceLevel);
    }

    // Location-based filtering
    if (userLocation && filters.maxDistance) {
      // Use PostGIS for distance calculation
      supabaseQuery = supabaseQuery.rpc('places_within_distance', {
        lat: userLocation.lat,
        lng: userLocation.lng,
        distance_meters: filters.maxDistance
      });
    }

    // Features filtering (search in JSON arrays)
    if (filters.features?.length) {
      const featureConditions = filters.features.map(feature => 
        `features::text.ilike.%${feature}%`
      );
      supabaseQuery = supabaseQuery.or(featureConditions.join(','));
    }

    // Apply intelligent ranking
    const results = await this.applySmartRanking(supabaseQuery, {
      query,
      userLocation,
      context,
      limit,
      offset
    });

    return results;
  }

  private async applySmartRanking(
    query: any, 
    params: {
      query: string;
      userLocation?: { lat: number; lng: number };
      context: SearchContext;
      limit: number;
      offset: number;
    }
  ) {
    // Apply complex ranking based on multiple factors
    const rankingSQL = `
      (
        -- Text relevance (40% weight)
        COALESCE(ts_rank_cd(enhanced_search_vector, websearch_to_tsquery('english', $1)), 0) * 0.4 +
        
        -- Rating boost (30% weight)
        COALESCE((rating->>'rate')::float / 5.0, 0) * 0.3 +
        
        -- Distance factor (20% weight) - closer is better
        CASE 
          WHEN $2::float IS NOT NULL AND $3::float IS NOT NULL THEN
            GREATEST(0, 1 - (
              ST_Distance(
                ST_Point((location->>'lng')::float, (location->>'lat')::float)::geography,
                ST_Point($3, $2)::geography
              ) / 50000 -- 50km max distance for ranking
            )) * 0.2
          ELSE 0.2 -- Default score if no location
        END +
        
        -- Popularity/review count boost (10% weight)
        LEAST(COALESCE((rating->>'count')::float / 100.0, 0), 1.0) * 0.1
      ) as smart_rank
    `;

    return query
      .select('*, ' + rankingSQL, [
        params.query,
        params.userLocation?.lat,
        params.userLocation?.lng
      ])
      .order('smart_rank', { ascending: false })
      .range(params.offset, params.offset + params.limit - 1);
  }
}
```

## 🗺️ **Step 3: Add Geographic Search Functions**

Create PostgreSQL functions for location-based search:

```sql
-- Geographic search functions
-- File: geographic_search_functions.sql

-- Function to find places within distance
CREATE OR REPLACE FUNCTION places_within_distance(
  lat FLOAT,
  lng FLOAT, 
  distance_meters INT DEFAULT 5000
)
RETURNS TABLE(
  place_id TEXT,
  distance_meters FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id::TEXT,
    ST_Distance(
      ST_Point((p.location->>'lng')::float, (p.location->>'lat')::float)::geography,
      ST_Point(lng, lat)::geography
    ) as distance
  FROM places p
  WHERE ST_DWithin(
    ST_Point((p.location->>'lng')::float, (p.location->>'lat')::float)::geography,
    ST_Point(lng, lat)::geography,
    distance_meters
  )
  ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

-- Function for location-aware search ranking
CREATE OR REPLACE FUNCTION enhanced_place_search(
  search_query TEXT,
  user_lat FLOAT DEFAULT NULL,
  user_lng FLOAT DEFAULT NULL,
  max_distance INT DEFAULT 50000,
  min_rating FLOAT DEFAULT 0,
  category_filter TEXT[] DEFAULT NULL,
  limit_results INT DEFAULT 20
)
RETURNS TABLE(
  place_data JSONB,
  relevance_score FLOAT,
  distance_meters FLOAT,
  final_rank FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(p.*) as place_data,
    ts_rank_cd(p.enhanced_search_vector, websearch_to_tsquery('english', search_query)) as relevance_score,
    CASE 
      WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL THEN
        ST_Distance(
          ST_Point((p.location->>'lng')::float, (p.location->>'lat')::float)::geography,
          ST_Point(user_lng, user_lat)::geography
        )
      ELSE NULL
    END as distance_meters,
    -- Composite ranking algorithm
    (
      ts_rank_cd(p.enhanced_search_vector, websearch_to_tsquery('english', search_query)) * 0.4 +
      COALESCE((p.rating->>'rate')::float / 5.0, 0) * 0.3 +
      CASE 
        WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL THEN
          GREATEST(0, 1 - (ST_Distance(
            ST_Point((p.location->>'lng')::float, (p.location->>'lat')::float)::geography,
            ST_Point(user_lng, user_lat)::geography
          ) / max_distance)) * 0.2
        ELSE 0.2
      END +
      LEAST(COALESCE((p.rating->>'count')::float / 100.0, 0), 1.0) * 0.1
    ) as final_rank
  FROM places p
  WHERE 
    p.enhanced_search_vector @@ websearch_to_tsquery('english', search_query)
    AND p.status IN ('approved', 'scraped')
    AND COALESCE((p.rating->>'rate')::float, 0) >= min_rating
    AND (category_filter IS NULL OR p.category_id = ANY(category_filter))
    AND (
      user_lat IS NULL OR user_lng IS NULL OR
      ST_DWithin(
        ST_Point((p.location->>'lng')::float, (p.location->>'lat')::float)::geography,
        ST_Point(user_lng, user_lat)::geography,
        max_distance
      )
    )
  ORDER BY final_rank DESC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;
```

## 🤖 **Step 4: AI-Enhanced Query Processing**

Create an intelligent query processor:

```typescript
// lib/services/ai-search-processor.ts

export class AISearchProcessor {
  
  // Process natural language queries
  async processNaturalLanguageQuery(query: string): Promise<{
    intent: 'find_place' | 'compare_places' | 'get_directions' | 'general_info';
    entities: {
      placeTypes: string[];
      locations: string[];
      features: string[];
      qualifiers: string[];
    };
    filters: SmartSearchParams['filters'];
    searchQuery: string;
  }> {
    
    const entities = this.extractEntities(query);
    const intent = this.detectIntent(query);
    const filters = this.buildFilters(entities);
    const searchQuery = this.buildSearchQuery(query, entities);
    
    return {
      intent,
      entities,
      filters,
      searchQuery
    };
  }
  
  private extractEntities(query: string) {
    // Entity extraction patterns
    const patterns = {
      placeTypes: /\b(restaurant|hotel|cafe|bar|gym|hospital|school|bank|mall|park)\w*\b/gi,
      locations: /\b(in|at|near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      features: /\b(parking|wifi|outdoor|wheelchair|pet.friendly|24.hour|delivery)\b/gi,
      qualifiers: /\b(best|top|cheap|expensive|good|excellent|nearby|close)\b/gi,
      ratings: /\b(\d+(?:\.\d+)?)\s*star|rated\s*(\d+)/gi
    };
    
    return {
      placeTypes: this.extractMatches(query, patterns.placeTypes),
      locations: this.extractMatches(query, patterns.locations),
      features: this.extractMatches(query, patterns.features),
      qualifiers: this.extractMatches(query, patterns.qualifiers)
    };
  }
  
  private detectIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('find') || lowerQuery.includes('search') || lowerQuery.includes('looking for')) {
      return 'find_place';
    }
    if (lowerQuery.includes('compare') || lowerQuery.includes('vs') || lowerQuery.includes('better')) {
      return 'compare_places';
    }
    if (lowerQuery.includes('direction') || lowerQuery.includes('how to get')) {
      return 'get_directions';
    }
    
    return 'find_place'; // Default
  }
  
  private buildFilters(entities: any): SmartSearchParams['filters'] {
    const filters: SmartSearchParams['filters'] = {};
    
    // Map place types to categories
    if (entities.placeTypes.length > 0) {
      filters.categories = this.mapPlaceTypesToCategories(entities.placeTypes);
    }
    
    // Extract rating requirements
    if (entities.qualifiers.includes('best') || entities.qualifiers.includes('top')) {
      filters.minRating = 4.0;
    }
    
    // Map features
    if (entities.features.length > 0) {
      filters.features = entities.features;
    }
    
    return filters;
  }
  
  private mapPlaceTypesToCategories(placeTypes: string[]): string[] {
    const mapping: { [key: string]: string } = {
      'restaurant': 'restaurants',
      'hotel': 'accommodation',
      'cafe': 'restaurants',
      'bar': 'restaurants',
      'gym': 'fitness',
      'hospital': 'healthcare',
      'school': 'education',
      'bank': 'financial',
      'mall': 'shopping',
      'park': 'entertainment'
    };
    
    return placeTypes.map(type => mapping[type.toLowerCase()]).filter(Boolean);
  }
}
```

## 🎯 **Step 5: Usage Example**

Here's how to use the complete smart search system:

```typescript
// Example usage in your API route
// app/api/search/smart/route.ts

import { SmartPlaceSearch, AISearchProcessor } from '@/lib/services/smart-search';

export async function POST(request: Request) {
  const { query, userLocation, filters } = await request.json();
  
  const aiProcessor = new AISearchProcessor();
  const smartSearch = new SmartPlaceSearch();
  
  // Process natural language query
  const processedQuery = await aiProcessor.processNaturalLanguageQuery(query);
  
  // Combine AI-processed filters with user filters
  const combinedFilters = {
    ...processedQuery.filters,
    ...filters
  };
  
  // Perform smart search
  const results = await smartSearch.search({
    query: processedQuery.searchQuery,
    userLocation,
    filters: combinedFilters,
    limit: 20
  });
  
  return Response.json({
    success: true,
    data: {
      results: results.results,
      totalCount: results.totalCount,
      searchMetadata: {
        originalQuery: query,
        processedQuery,
        intent: processedQuery.intent,
        appliedFilters: combinedFilters
      }
    }
  });
}
```

## 🏆 **Benefits of This Approach:**

1. **Natural Language Understanding**: "Find the best restaurants with parking near Accra Mall"
2. **Multi-factor Ranking**: Combines relevance, rating, distance, and popularity
3. **Location Intelligence**: Understands geographic context and proximity
4. **Category Intelligence**: Maps natural language to structured categories
5. **Feature Detection**: Recognizes amenities and special requirements
6. **Scalable Performance**: Uses PostgreSQL's full-text search for speed
7. **AI-Ready**: Can be enhanced with OpenAI or other AI services for better NLP

This creates a truly intelligent search system that can understand complex queries and return highly relevant results! 🚀

```sql
-- Enhanced migration for AI-powered place search
-- File: enhanced_fulltext_search_places.sql

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS places_search_vector CASCADE;

-- Create enhanced search vector function
CREATE OR REPLACE FUNCTION places_enhanced_search_vector(
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
  -- Location entities
  country_name TEXT,
  region_name TEXT,
  city_name TEXT
) RETURNS tsvector AS $$
BEGIN
  RETURN (
    -- Place content (highest weight)
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(tagline, '')), 'A') ||
    
    -- Categories (high weight for AI understanding)
    setweight(to_tsvector('english', COALESCE(category_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(subcategory_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(type_name, '')), 'B') ||
    
    -- Location (high weight for location-based queries)
    setweight(to_tsvector('english', COALESCE(location_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(street_address, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(city_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(region_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(country_name, '')), 'B') ||
    
    -- Content and features (medium weight)
    setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'C') ||
    
    -- Features and services (lower weight)
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

-- Create enhanced search vector column
ALTER TABLE places DROP COLUMN IF EXISTS enhanced_search_vector;
ALTER TABLE places ADD COLUMN enhanced_search_vector tsvector;

-- Create view to populate search vector with related data
CREATE OR REPLACE VIEW places_with_search_data AS
SELECT 
  p.*,
  c.name as category_name,
  sc.name as subcategory_name,
  pt.name as type_name,
  country.name as country_name,
  region.name as region_name,
  city.name as city_name,
  places_enhanced_search_vector(
    p.name, p.description, p.tagline, p.tags, p.features, p.services,
    p.location->>'name', p.location->>'street_address',
    c.name, sc.name, pt.name,
    country.name, region.name, city.name
  ) as computed_search_vector
FROM places p
LEFT JOIN place_categories c ON p.category_id = c.id
LEFT JOIN place_subcategories sc ON p.subcategory_id = sc.id  
LEFT JOIN place_types pt ON p.type_id = pt.id
LEFT JOIN countries country ON p.country_id = country.id
LEFT JOIN regions region ON p.region_id = region.id
LEFT JOIN cities city ON p.city_id = city.id;

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_places_enhanced_search_vector() 
RETURNS VOID AS $$
BEGIN
  UPDATE places 
  SET enhanced_search_vector = psd.computed_search_vector
  FROM places_with_search_data psd
  WHERE places.id = psd.id;
END;
$$ LANGUAGE plpgsql;

-- Populate initial data
SELECT update_places_enhanced_search_vector();

-- Create trigger for automatic updates
CREATE OR REPLACE FUNCTION trigger_update_places_search_vector() 
RETURNS TRIGGER AS $$
BEGIN
  -- Update the specific place
  UPDATE places 
  SET enhanced_search_vector = (
    SELECT computed_search_vector 
    FROM places_with_search_data 
    WHERE id = NEW.id
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER places_enhanced_search_vector_update 
  AFTER INSERT OR UPDATE ON places
  FOR EACH ROW 
  EXECUTE FUNCTION trigger_update_places_search_vector();

-- Create optimized indexes
CREATE INDEX places_enhanced_search_vector_idx ON places USING GIN(enhanced_search_vector);
CREATE INDEX places_rating_idx ON places((rating->>'rate')::float);
CREATE INDEX places_location_idx ON places USING GIST((location->>'lat')::float, (location->>'lng')::float);
CREATE INDEX places_category_subcategory_idx ON places(category_id, subcategory_id);
```

```typescript
// lib/services/smart-search.ts

interface SmartSearchParams {
  query: string;
  userLocation?: { lat: number; lng: number };
  filters?: {
    categories?: string[];
    subcategories?: string[];
    minRating?: number;
    maxDistance?: number; // in meters
    priceLevel?: number[];
    openNow?: boolean;
    features?: string[];
  };
  limit?: number;
  offset?: number;
}

interface SearchContext {
  textQuery?: string;
  locationTerms?: string[];
  categoryTerms?: string[];
  ratingTerms?: string[];
  featureTerms?: string[];
}

export class SmartPlaceSearch {
  
  // Parse natural language query into structured search
  private parseQuery(query: string): SearchContext {
    const context: SearchContext = {};
    
    // Extract location indicators
    const locationKeywords = ['in', 'at', 'near', 'around', 'close to', 'nearby'];
    const categoryKeywords = ['restaurant', 'hotel', 'cafe', 'bar', 'gym', 'hospital', 'school'];
    const ratingKeywords = ['best', 'top rated', 'highly rated', 'good', 'excellent'];
    const featureKeywords = ['parking', 'wifi', 'outdoor', 'wheelchair', 'pet friendly'];
    
    // Simple NLP parsing (you can enhance this with actual NLP libraries)
    const words = query.toLowerCase().split(/\s+/);
    
    context.locationTerms = words.filter(word => 
      locationKeywords.some(keyword => query.includes(keyword)) ||
      this.isLocationName(word)
    );
    
    context.categoryTerms = words.filter(word =>
      categoryKeywords.includes(word)
    );
    
    context.ratingTerms = words.filter(word =>
      ratingKeywords.includes(word)
    );
    
    context.featureTerms = words.filter(word =>
      featureKeywords.includes(word)
    );
    
    // Remaining text becomes the main search query
    context.textQuery = query;
    
    return context;
  }
  
  private isLocationName(word: string): boolean {
    // You can enhance this with a location database or API
    const commonLocations = ['accra', 'kumasi', 'tema', 'legon', 'airport'];
    return commonLocations.includes(word.toLowerCase());
  }

  async search({
    query,
    userLocation,
    filters = {},
    limit = 20,
    offset = 0
  }: SmartSearchParams): Promise<{
    results: any[];
    totalCount: number;
    searchMetadata: any;
  }> {
    
    const context = this.parseQuery(query);
    
    // Build the main query
    let supabaseQuery = supabase
      .from('places')
      .select(`
        *,
        category:category_id(id, name, slug, icon),
        subcategory:subcategory_id(id, name, slug, icon),
        type:type_id(id, name, slug, icon),
        country:country_id(id, name),
        region:region_id(id, name),
        city:city_id(id, name),
        search_rank:ts_rank_cd(enhanced_search_vector, websearch_to_tsquery('english', $1)) as relevance_score
      `, [query])
      .in('status', ['approved', 'scraped']);

    // Apply full-text search
    if (query.trim()) {
      supabaseQuery = supabaseQuery.textSearch('enhanced_search_vector', query, {
        type: 'websearch',
        config: 'english'
      });
    }

    // Apply structured filters
    if (filters.categories?.length) {
      supabaseQuery = supabaseQuery.in('category_id', filters.categories);
    }

    if (filters.subcategories?.length) {
      supabaseQuery = supabaseQuery.in('subcategory_id', filters.subcategories);
    }

    if (filters.minRating) {
      supabaseQuery = supabaseQuery.gte('rating->rate', filters.minRating);
    }

    if (filters.openNow) {
      supabaseQuery = supabaseQuery.eq('open_now', true);
    }

    if (filters.priceLevel?.length) {
      supabaseQuery = supabaseQuery.in('price_level', filters.priceLevel);
    }

    // Location-based filtering
    if (userLocation && filters.maxDistance) {
      // Use PostGIS for distance calculation
      supabaseQuery = supabaseQuery.rpc('places_within_distance', {
        lat: userLocation.lat,
        lng: userLocation.lng,
        distance_meters: filters.maxDistance
      });
    }

    // Features filtering (search in JSON arrays)
    if (filters.features?.length) {
      const featureConditions = filters.features.map(feature => 
        `features::text.ilike.%${feature}%`
      );
      supabaseQuery = supabaseQuery.or(featureConditions.join(','));
    }

    // Apply intelligent ranking
    const results = await this.applySmartRanking(supabaseQuery, {
      query,
      userLocation,
      context,
      limit,
      offset
    });

    return results;
  }

  private async applySmartRanking(
    query: any, 
    params: {
      query: string;
      userLocation?: { lat: number; lng: number };
      context: SearchContext;
      limit: number;
      offset: number;
    }
  ) {
    // Apply complex ranking based on multiple factors
    const rankingSQL = `
      (
        -- Text relevance (40% weight)
        COALESCE(ts_rank_cd(enhanced_search_vector, websearch_to_tsquery('english', $1)), 0) * 0.4 +
        
        -- Rating boost (30% weight)
        COALESCE((rating->>'rate')::float / 5.0, 0) * 0.3 +
        
        -- Distance factor (20% weight) - closer is better
        CASE 
          WHEN $2::float IS NOT NULL AND $3::float IS NOT NULL THEN
            GREATEST(0, 1 - (
              ST_Distance(
                ST_Point((location->>'lng')::float, (location->>'lat')::float)::geography,
                ST_Point($3, $2)::geography
              ) / 50000 -- 50km max distance for ranking
            )) * 0.2
          ELSE 0.2 -- Default score if no location
        END +
        
        -- Popularity/review count boost (10% weight)
        LEAST(COALESCE((rating->>'count')::float / 100.0, 0), 1.0) * 0.1
      ) as smart_rank
    `;

    return query
      .select('*, ' + rankingSQL, [
        params.query,
        params.userLocation?.lat,
        params.userLocation?.lng
      ])
      .order('smart_rank', { ascending: false })
      .range(params.offset, params.offset + params.limit - 1);
  }
}
```

```sql
-- Geographic search functions
-- File: geographic_search_functions.sql

-- Function to find places within distance
CREATE OR REPLACE FUNCTION places_within_distance(
  lat FLOAT,
  lng FLOAT, 
  distance_meters INT DEFAULT 5000
)
RETURNS TABLE(
  place_id TEXT,
  distance_meters FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id::TEXT,
    ST_Distance(
      ST_Point((p.location->>'lng')::float, (p.location->>'lat')::float)::geography,
      ST_Point(lng, lat)::geography
    ) as distance
  FROM places p
  WHERE ST_DWithin(
    ST_Point((p.location->>'lng')::float, (p.location->>'lat')::float)::geography,
    ST_Point(lng, lat)::geography,
    distance_meters
  )
  ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

-- Function for location-aware search ranking
CREATE OR REPLACE FUNCTION enhanced_place_search(
  search_query TEXT,
  user_lat FLOAT DEFAULT NULL,
  user_lng FLOAT DEFAULT NULL,
  max_distance INT DEFAULT 50000,
  min_rating FLOAT DEFAULT 0,
  category_filter TEXT[] DEFAULT NULL,
  limit_results INT DEFAULT 20
)
RETURNS TABLE(
  place_data JSONB,
  relevance_score FLOAT,
  distance_meters FLOAT,
  final_rank FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(p.*) as place_data,
    ts_rank_cd(p.enhanced_search_vector, websearch_to_tsquery('english', search_query)) as relevance_score,
    CASE 
      WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL THEN
        ST_Distance(
          ST_Point((p.location->>'lng')::float, (p.location->>'lat')::float)::geography,
          ST_Point(user_lng, user_lat)::geography
        )
      ELSE NULL
    END as distance_meters,
    -- Composite ranking algorithm
    (
      ts_rank_cd(p.enhanced_search_vector, websearch_to_tsquery('english', search_query)) * 0.4 +
      COALESCE((p.rating->>'rate')::float / 5.0, 0) * 0.3 +
      CASE 
        WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL THEN
          GREATEST(0, 1 - (ST_Distance(
            ST_Point((p.location->>'lng')::float, (p.location->>'lat')::float)::geography,
            ST_Point(user_lng, user_lat)::geography
          ) / max_distance)) * 0.2
        ELSE 0.2
      END +
      LEAST(COALESCE((p.rating->>'count')::float / 100.0, 0), 1.0) * 0.1
    ) as final_rank
  FROM places p
  WHERE 
    p.enhanced_search_vector @@ websearch_to_tsquery('english', search_query)
    AND p.status IN ('approved', 'scraped')
    AND COALESCE((p.rating->>'rate')::float, 0) >= min_rating
    AND (category_filter IS NULL OR p.category_id = ANY(category_filter))
    AND (
      user_lat IS NULL OR user_lng IS NULL OR
      ST_DWithin(
        ST_Point((p.location->>'lng')::float, (p.location->>'lat')::float)::geography,
        ST_Point(user_lng, user_lat)::geography,
        max_distance
      )
    )
  ORDER BY final_rank DESC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;
```

```typescript
// lib/services/ai-search-processor.ts

export class AISearchProcessor {
  
  // Process natural language queries
  async processNaturalLanguageQuery(query: string): Promise<{
    intent: 'find_place' | 'compare_places' | 'get_directions' | 'general_info';
    entities: {
      placeTypes: string[];
      locations: string[];
      features: string[];
      qualifiers: string[];
    };
    filters: SmartSearchParams['filters'];
    searchQuery: string;
  }> {
    
    const entities = this.extractEntities(query);
    const intent = this.detectIntent(query);
    const filters = this.buildFilters(entities);
    const searchQuery = this.buildSearchQuery(query, entities);
    
    return {
      intent,
      entities,
      filters,
      searchQuery
    };
  }
  
  private extractEntities(query: string) {
    // Entity extraction patterns
    const patterns = {
      placeTypes: /\b(restaurant|hotel|cafe|bar|gym|hospital|school|bank|mall|park)\w*\b/gi,
      locations: /\b(in|at|near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      features: /\b(parking|wifi|outdoor|wheelchair|pet.friendly|24.hour|delivery)\b/gi,
      qualifiers: /\b(best|top|cheap|expensive|good|excellent|nearby|close)\b/gi,
      ratings: /\b(\d+(?:\.\d+)?)\s*star|rated\s*(\d+)/gi
    };
    
    return {
      placeTypes: this.extractMatches(query, patterns.placeTypes),
      locations: this.extractMatches(query, patterns.locations),
      features: this.extractMatches(query, patterns.features),
      qualifiers: this.extractMatches(query, patterns.qualifiers)
    };
  }
  
  private detectIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('find') || lowerQuery.includes('search') || lowerQuery.includes('looking for')) {
      return 'find_place';
    }
    if (lowerQuery.includes('compare') || lowerQuery.includes('vs') || lowerQuery.includes('better')) {
      return 'compare_places';
    }
    if (lowerQuery.includes('direction') || lowerQuery.includes('how to get')) {
      return 'get_directions';
    }
    
    return 'find_place'; // Default
  }
  
  private buildFilters(entities: any): SmartSearchParams['filters'] {
    const filters: SmartSearchParams['filters'] = {};
    
    // Map place types to categories
    if (entities.placeTypes.length > 0) {
      filters.categories = this.mapPlaceTypesToCategories(entities.placeTypes);
    }
    
    // Extract rating requirements
    if (entities.qualifiers.includes('best') || entities.qualifiers.includes('top')) {
      filters.minRating = 4.0;
    }
    
    // Map features
    if (entities.features.length > 0) {
      filters.features = entities.features;
    }
    
    return filters;
  }
  
  private mapPlaceTypesToCategories(placeTypes: string[]): string[] {
    const mapping: { [key: string]: string } = {
      'restaurant': 'restaurants',
      'hotel': 'accommodation',
      'cafe': 'restaurants',
      'bar': 'restaurants',
      'gym': 'fitness',
      'hospital': 'healthcare',
      'school': 'education',
      'bank': 'financial',
      'mall': 'shopping',
      'park': 'entertainment'
    };
    
    return placeTypes.map(type => mapping[type.toLowerCase()]).filter(Boolean);
  }
}
```

```typescript
// Example usage in your API route
// app/api/search/smart/route.ts

import { SmartPlaceSearch, AISearchProcessor } from '@/lib/services/smart-search';

export async function POST(request: Request) {
  const { query, userLocation, filters } = await request.json();
  
  const aiProcessor = new AISearchProcessor();
  const smartSearch = new SmartPlaceSearch();
  
  // Process natural language query
  const processedQuery = await aiProcessor.processNaturalLanguageQuery(query);
  
  // Combine AI-processed filters with user filters
  const combinedFilters = {
    ...processedQuery.filters,
    ...filters
  };
  
  // Perform smart search
  const results = await smartSearch.search({
    query: processedQuery.searchQuery,
    userLocation,
    filters: combinedFilters,
    limit: 20
  });
  
  return Response.json({
    success: true,
    data: {
      results: results.results,
      totalCount: results.totalCount,
      searchMetadata: {
        originalQuery: query,
        processedQuery,
        intent: processedQuery.intent,
        appliedFilters: combinedFilters
      }
    }
  });
}
```

