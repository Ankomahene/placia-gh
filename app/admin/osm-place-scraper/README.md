# OpenStreetMap Place Scraper

A comprehensive solution for importing place data from OpenStreetMap into your Placia database using the Nominatim API.

## Features

- 🔍 **Search Places**: Search for places by type and location using natural language queries
- 🗺️ **OSM Integration**: Uses the official Nominatim API from OpenStreetMap
- 🎯 **Smart Mapping**: Automatically maps OSM data to your Place model
- ✅ **Selective Import**: Review and select specific places before importing
- 🏷️ **Category & Location Mapping**: Map places to your existing categories, subcategories, and locations
- 📄 **Load More Results**: Get additional results using smart search variations
- 💾 **Supabase Integration**: Direct saving to your Supabase database
- 📱 **Responsive UI**: Clean, modern interface that works on all devices

### New Enhanced Features

- **📍 Location Database Integration**: Maps OSM locations to your existing countries, regions, and cities
- **🏗️ Category Database Integration**: Maps places to your categories and subcategories 
- **🔄 Smart Load More**: Uses different search strategies to find more results since Nominatim doesn't support traditional pagination
- **🎯 Complete Mapping Modal**: Interactive modal for mapping all fields before saving

## File Structure

```
app/admin/osm-place-scraper/
├── components/
│   ├── PlaceCard.tsx           # Individual place display component
│   ├── PlaceResults.tsx        # Results grid with selection controls
│   └── PlaceSearchForm.tsx     # Search form component
├── hooks/
│   ├── useNominatimSearch.ts   # API integration hook
│   └── useSupabaseSave.ts      # Database saving hook
├── utils/
│   └── placeMapper.ts          # Data mapping utilities
├── types.ts                    # TypeScript interfaces
├── OSMPlaceScraper.tsx         # Main component
└── README.md                   # This file
```

## Usage Examples

### Basic Search
- **Query**: "schools"
- **Location**: "Accra"
- **Result**: Find all schools in Accra from OpenStreetMap

### Advanced Search
- **Query**: "hospitals"
- **Location**: "Kumasi"
- **Result**: Find all hospitals in Kumasi with detailed address information

### Category Mapping
The system automatically maps OSM categories to your database schema:
- `amenity:school` → Education > Schools
- `amenity:hospital` → Healthcare > Hospitals
- `amenity:restaurant` → Food > Restaurants
- `shop:supermarket` → Shopping > Supermarkets

## Setup Requirements

### Dependencies
```bash
npm install uuid @types/uuid @supabase/supabase-js
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup
Ensure your Supabase database has the following tables:
- `places` - Main places table
- `countries` - Countries reference
- `regions` - Regions reference  
- `cities` - Cities reference
- `place_categories` - Category reference
- `place_subcategories` - Subcategory reference

## Customization

### Adding New Category Mappings
Edit `utils/placeMapper.ts` and update the `categoryMappings` object:

```typescript
const categoryMappings = {
  'amenity:pharmacy': { category: 'healthcare', subcategory: 'pharmacies' },
  'leisure:gym': { category: 'fitness', subcategory: 'gyms' },
  // Add more mappings...
};
```

### Location Matching
Implement proper location matching in `hooks/useSupabaseSave.ts`:

```typescript
// Match locations to existing database IDs
const locationMatch = await matchLocations(place.raw_data.address, supabase);
```

## API Rate Limiting

The Nominatim API has usage policies:
- Include a proper User-Agent header (already implemented)
- Limit to 1 request per second for bulk usage
- Consider using your own Nominatim instance for heavy usage

## Data Quality

OSM data quality varies by region:
- Urban areas typically have better coverage
- Some places may have incomplete information
- Always review imported data before making it public

## Troubleshooting

### Common Issues

1. **No results found**: Try broader search terms or check spelling
2. **Location mismatch**: Implement proper location matching logic
3. **Category not mapped**: Add new mappings to the category mapping function
4. **Supabase errors**: Check your database schema and permissions

### Debug Mode
Check browser console for detailed error messages and API responses.

## Contributing

To extend functionality:
1. Add new components in the `components/` folder
2. Create custom hooks in the `hooks/` folder
3. Update type definitions in `types.ts`
4. Add utility functions in `utils/`

## License

This component is part of the Placia platform and follows the same licensing terms. 