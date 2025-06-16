# Search Services Organization

This directory contains all search-related services organized by source and functionality. The system supports multiple search sources with a unified query parser.

## Structure

```
lib/services/
├── openai-search.ts          # Unified OpenAI query parser
├── google/
│   └── places.ts            # Google Places API service
├── internal/
│   └── places.ts            # Internal Supabase places search
└── index.ts                 # Unified exports
```

## Services Overview

### 🤖 Unified OpenAI Search Parser (`openai-search.ts`)

Converts natural language queries into structured search parameters that work across all search sources.

**Key Features:**
- Single parser for all search sources
- Supports location, category, price, rating filters
- Handles proximity searches ("near me")
- Extracts features and preferences
- Compatible with both Google and internal search

**Usage:**
```typescript
import { parseNaturalLanguageQuery } from '@/lib/services/openai-search';

const structuredQuery = await parseNaturalLanguageQuery(
  "best Italian restaurants in Accra open now",
  userLocation
);
```

### 🌍 Google Places Service (`google/places.ts`)

Handles all Google Places API interactions.

**Key Functions:**
- `searchGooglePlaces()` - Primary Google search method
- `searchPlaces()` - Legacy text search
- `nearbySearch()` - Location-based search
- `getPlaceDetails()` - Detailed place information
- `geocodeLocation()` - Address to coordinates
- `reverseGeocode()` - Coordinates to address

### 🏠 Internal Places Service (`internal/places.ts`)

Searches the internal Supabase places database.

**Key Functions:**
- `searchInternalPlaces()` - Text and filter-based search
- `getInternalPlaceDetails()` - Get full place details

**Features:**
- Full-text search on name, description, tags
- Category and subcategory filtering
- Features-based filtering
- Distance-based sorting
- Rating filtering

## API Endpoints

### Search Endpoints

| Endpoint | Purpose | Search Source |
|----------|---------|---------------|
| `/api/search/parse` | Parse natural language queries | N/A (parser only) |
| `/api/search/google` | Google Places search | Google Places API |
| `/api/search/internal` | Internal database search | Supabase |
| `/api/search/combined` | Search both sources | Google + Internal |
| `/api/search/internal/category` | Category-based internal search | Supabase |


### Usage Examples

#### 1. Parse Query Only
```javascript
POST /api/search/parse
{
  "query": "cheap hotels near me"
}
```

#### 2. Google Search
```javascript
POST /api/search/google
{
  "query": "best coffee shops in East Legon",
  "userLocation": { "lat": 5.6279, "lng": -0.1558 }
}
```

#### 3. Internal Search
```javascript
POST /api/search/internal
{
  "query": "restaurants with outdoor seating",
  "userLocation": { "lat": 5.6037, "lng": -0.1870 }
}
```

#### 4. Combined Search
```javascript
POST /api/search/combined
{
  "query": "hospitals near airport",
  "userLocation": { "lat": 5.6052, "lng": -0.1679 },
  "sources": ["internal", "google"]
}
```

#### 5. Category Search
```javascript
POST /api/search/internal/category
{
  "categoryId": "healthcare-category-id",
  "userLocation": { "lat": 5.6037, "lng": -0.1870 },
  "radius_meters": 5000
}
```

## Data Flow

1. **Natural Language Input** → User enters search query
2. **OpenAI Parsing** → Query converted to `StructuredSearchQuery`
3. **Source Selection** → Determine which search sources to use
4. **Parallel Search** → Search Google and/or internal database
5. **Result Processing** → Format, deduplicate, and sort results
6. **Response** → Return unified results with source attribution

## Adding New Search Sources

To add a new search source:

1. Create a new service in `lib/services/[source-name]/`
2. Implement functions that accept `StructuredSearchQuery`
3. Add exports to `lib/services/index.ts`
4. Create API endpoint in `app/api/search/[source-name]/`
5. Update combined search to include new source

## Types

All services use the unified `StructuredSearchQuery` type from `@/types/search`:

```typescript
interface StructuredSearchQuery {
  query: string;
  location?: string;
  features?: string[];
  category?: string;
  subcategory?: string;
  radius_meters?: number;
  min_rating?: number;
  price_level?: 'budget' | 'moderate' | 'expensive' | 'very_expensive';
  open_now?: boolean;
  has_website?: boolean;
  has_phone?: boolean;
  region?: string;
  min_price?: number;
  max_price?: number;
  language?: string;
  user_location?: { lat: number; lng: number };
}
```

## Benefits of This Organization

- **Unified Interface**: All search sources use the same query structure
- **Extensible**: Easy to add new search sources
- **Maintainable**: Clear separation of concerns
- **Efficient**: Parallel search execution
- **Flexible**: Can search individual sources or combine results
- **Future-Proof**: Ready for additional search providers

# Services Layer

This directory contains the core business logic services for the application.

## Smart Place Search (`smart-search.ts`)

Enhanced search system with natural language processing and conversational capabilities.

### Features

- **Natural Language Processing**: Convert user queries into structured search parameters
- **Conversational Context**: Support for follow-up queries and context-aware searches
- **Multiple Search Types**: Proximity, rating, price level, and general searches
- **Full-Text Search**: PostgreSQL full-text search with GIN indexes
- **Geographic Search**: PostGIS distance calculations with spatial indexes
- **Pagination**: Complete pagination support with metadata

### Conversational Search Usage

```typescript
import { smartPlaceSearch } from '@/lib/services/smart-search';

// Initialize conversation
smartPlaceSearch.resetConversation();

// First query - proximity search with location and radius
const result1 = await smartPlaceSearch.conversationalSearch({
  naturalQuery: "restaurants near Kotoka international airport",
  userLocation: { lat: 5.6037, lng: -0.1870 }
});
// → Searches restaurants within 5km of Kotoka airport

// Follow-up query - refines to price search but keeps location context
const result2 = await smartPlaceSearch.conversationalSearch({
  naturalQuery: "Find me budget friendly ones and show them from cheapest to expensive",
  userLocation: { lat: 5.6037, lng: -0.1870 }
});
// → Searches budget restaurants near Kotoka airport, sorted cheapest first

// Another follow-up - adds filter while preserving all context
const result3 = await smartPlaceSearch.conversationalSearch({
  naturalQuery: "Show me only the ones that are open now",
  userLocation: { lat: 5.6037, lng: -0.1870 }
});
// → Same budget restaurants near Kotoka, but only open now

// New search topic - changes place type but keeps location
const result4 = await smartPlaceSearch.conversationalSearch({
  naturalQuery: "What about hotels instead?",
  userLocation: { lat: 5.6037, lng: -0.1870 }
});
// → Searches hotels near Kotoka airport (preserves location context)
```

### Search Types

1. **Proximity Search**: Location-based with distance sorting
   - Keywords: "near", "around", "close", "within X km"
   - Sorting: nearest first, farthest first

2. **Rating Search**: Quality-based filtering
   - Keywords: "best", "top", "highly rated", "excellent"
   - Sorting: highest rated first, lowest rated first

3. **Price Level Search**: Budget-based filtering
   - Keywords: "cheap", "budget", "expensive", "luxury"
   - Sorting: cheapest first, most expensive first

4. **General Search**: Standard full-text search

### Conversation Context

The system automatically detects:
- **Follow-up queries**: "those", "them", "budget friendly ones", "show me"
- **Refinements**: "cheaper", "higher rated", "closer", "with wifi"
- **New searches**: Completely different topics or locations

Context actions:
- **refine**: Modify existing search parameters
- **filter**: Add new filters to existing search
- **new_search**: Start completely fresh search

### Database Functions

Three optimized PostgreSQL functions:
- `search_places_by_proximity`: Geographic search with distance calculation
- `search_places_by_rating`: Rating-based filtering and sorting
- `search_places_by_price_level`: Price level filtering and sorting

All functions support:
- Full-text search with `websearch_to_tsquery`
- Geographic filtering with PostGIS
- Flexible sorting options
- Complete pagination support
- JSONB responses matching TypeScript interfaces

### Performance

- **Indexes**: GIN for full-text, GIST for geographic, B-tree for ratings/prices
- **Pre-computed**: Search vectors for faster text matching
- **Single-query**: All filtering and sorting in database
- **Optimized**: Early filtering and efficient joins

## Other Services

- `google/`: Google Places API integration
- `internal/`: Internal search and data management
- `places-ranking.ts`: Place ranking algorithms
- `openai-search.ts`: Natural language query parsing 