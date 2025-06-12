# Places Ranking System

An efficient and flexible sorting system for places search results in the AI-powered Places Finder app.

## Overview

This system takes search results from multiple sources (database, Google Places, OpenStreetMap, etc.) and applies a consistent, configurable ranking algorithm to ensure the most relevant results appear at the top.

## Key Features

- 🎯 **Multi-factor scoring**: Proximity, location match, category match, rating, price, features, and more
- 🔧 **Highly configurable**: Easy to customize weights and add new scoring factors
- ⚡ **Performance optimized**: Efficient algorithms for real-time search
- 🧪 **Testable & debuggable**: Comprehensive test coverage and debugging tools
- 📊 **Analytics ready**: Score breakdowns and performance monitoring
- 🔄 **Extensible**: Modular design for easy future enhancements

## Core Functions

### `rankAndSortPlaces(query, places, config?)`

Main function that ranks and sorts places based on search criteria.

```typescript
const rankedPlaces = rankAndSortPlaces(query, places);
```

### `computePlaceScore(place, query, config?)`

Computes detailed score with breakdown for a single place.

```typescript
const scoreResult = computePlaceScore(place, query);
console.log(scoreResult.score); // Overall score
console.log(scoreResult.breakdown); // Detailed breakdown
```

### `createScoringConfig(overrides)`

Creates custom scoring configurations.

```typescript
const restaurantConfig = createScoringConfig({
  weights: {
    proximity: 0.20,
    rating: 0.30,
    categoryMatch: 0.25
  }
});
```

## Scoring Factors

| Factor | Description | Weight (Default) |
|--------|-------------|------------------|
| **Proximity** | Distance from user location | 25% |
| **Location Match** | How well place location matches search | 20% |
| **Category Match** | Exact category match | 15% |
| **Rating** | Place rating with high-rating boost | 15% |
| **Subcategory Match** | Exact subcategory match | 10% |
| **Completeness** | Data completeness (photos, hours, etc.) | 10% |
| **Price Match** | Price level matching | 5% |
| **Open Now** | Whether place is currently open | 3% |
| **Has Website/Phone** | Contact information availability | 2% each |
| **Features/Tags Match** | Matching search features and tags | 1-2% each |

## Configuration Examples

### Restaurant-Focused Search
```typescript
const restaurantConfig = createScoringConfig({
  weights: {
    proximity: 0.20,
    categoryMatch: 0.25,
    rating: 0.20,
    locationMatch: 0.15,
    subcategoryMatch: 0.15,
    priceMatch: 0.05
  },
  ratingBoostThreshold: 4.2
});
```

### Emergency Services
```typescript
const emergencyConfig = createScoringConfig({
  weights: {
    proximity: 0.60, // Proximity is crucial
    locationMatch: 0.15,
    categoryMatch: 0.10,
    openNow: 0.05,
    rating: 0.05,
    subcategoryMatch: 0.05
  },
  maxProximityKm: 25
});
```

### Tourism & Attractions
```typescript
const tourismConfig = createScoringConfig({
  weights: {
    rating: 0.25, // High importance for attractions
    locationMatch: 0.20,
    proximity: 0.15,
    categoryMatch: 0.15,
    completeness: 0.20, // Important for tourist information
    hasWebsite: 0.05
  },
  completenessFactors: {
    hasPhotos: 0.4, // Critical for attractions
    hasDescription: 0.3,
    hasOpenHours: 0.2,
    hasContact: 0.05,
    hasWebsite: 0.05
  }
});
```

## Usage Examples

### Basic Usage
```typescript
import { rankAndSortPlaces } from '../utils/places-ranking';

const query: StructuredSearchQuery = {
  query: 'coffee shop',
  user_location: { lat: 40.7829, lng: -73.9654 },
  radius_meters: 5000,
  min_rating: 4.0
};

const rankedPlaces = rankAndSortPlaces(query, places);
```

### Advanced Usage with Custom Config
```typescript
import { rankAndSortPlaces, createScoringConfig } from '../utils/places-ranking';

const customConfig = createScoringConfig({
  weights: {
    proximity: 0.40, // High proximity weight
    rating: 0.30,
    categoryMatch: 0.20,
    locationMatch: 0.10
  }
});

const rankedPlaces = rankAndSortPlaces(query, places, customConfig);
```

### Debugging & Analytics
```typescript
import { debugPlaceScoring } from '../examples/places-ranking-usage';

const debug = debugPlaceScoring(place, query);
console.log(`Total Score: ${debug.totalScore}`);
console.log('Breakdown:', debug.breakdown);
console.log('Recommendations:', debug.recommendations);
```

### Performance Monitoring
```typescript
import { performantPlacesSearch } from '../examples/places-ranking-usage';

const result = await performantPlacesSearch(query, places, {
  maxResults: 20,
  minScore: 0.3,
  timeoutMs: 3000
});

console.log(`Processed ${result.performance.placesProcessed} places in ${result.performance.totalTime}ms`);
```

## Scoring Algorithm Details

### Proximity Scoring
- Uses Haversine formula for accurate distance calculation
- Scores inversely proportional to distance
- Filters out places beyond specified radius
- Configurable maximum proximity distance

### Location Matching
- Exact location name match: 1.0 score
- Partial match in name/address: 0.7 score
- Word overlap scoring: up to 0.5 score
- Case-insensitive matching

### Category Matching
- Exact category match: 1.0 score
- Subcategory bonus for precise matching
- Supports hierarchical category structures

### Rating Scoring
- Normalized to 0-1 scale (rating/5)
- High rating boost (configurable threshold)
- Minimum rating filtering
- Review count consideration (future enhancement)

### Price Matching
- Maps price levels: budget(1), moderate(2), expensive(3), very_expensive(4)
- Exact match gets highest score
- Proximity-based scoring for near matches
- Supports min/max price ranges

### Completeness Scoring
- Rewards complete place data
- Configurable weights for different data types
- Encourages high-quality listings

## Performance Characteristics

- **Time Complexity**: O(n) for scoring, O(n log n) for sorting
- **Space Complexity**: O(n) for score storage
- **Optimizations**:
  - Early filtering for radius constraints
  - Efficient distance calculations
  - Minimal object allocations
  - Optional timeout handling

## Testing

The system includes comprehensive tests covering:
- Basic functionality
- Edge cases (missing data, empty inputs)
- Performance with large datasets
- Custom configuration scenarios
- Score breakdown validation

Run tests:
```bash
npm test utils/__tests__/places-ranking.test.ts
```

## Extensibility

### Adding New Scoring Factors

1. **Update `ScoringWeights` interface**:
```typescript
export interface ScoringWeights {
  // ... existing weights
  newFactor: number;
}
```

2. **Add scoring function**:
```typescript
function scoreNewFactor(place: Place, query: StructuredSearchQuery): number {
  // Your scoring logic here
  return score;
}
```

3. **Integrate in `computePlaceScore`**:
```typescript
const newFactorScore = scoreNewFactor(place, query);
breakdown.newFactor = newFactorScore;
const totalScore = /* ... */ + newFactorScore * weights.newFactor;
```

### Custom Search Types

Create specialized configurations for different search scenarios:

```typescript
export function createCustomSearchConfig() {
  return createScoringConfig({
    weights: {
      // Custom weight distribution
    },
    // Custom thresholds and factors
  });
}
```

## Best Practices

1. **Performance**: For large datasets (>10k places), consider:
   - Pre-filtering by distance before scoring
   - Limiting results with `maxResults`
   - Using minimum score thresholds

2. **Accuracy**: 
   - Tune weights based on user feedback
   - A/B test different configurations
   - Monitor score distributions

3. **Debugging**:
   - Use score breakdown for understanding results
   - Implement logging for production analysis
   - Track performance metrics

4. **Extensibility**:
   - Keep scoring functions pure and testable
   - Document weight rationale
   - Version configuration changes

## Future Enhancements

- [ ] Machine learning-based weight optimization
- [ ] User behavior-based scoring adjustments
- [ ] Real-time popularity scoring
- [ ] Seasonal/time-based relevance
- [ ] Social proof integration
- [ ] Accessibility scoring
- [ ] Sustainability factors

## API Reference

See the complete TypeScript interfaces in:
- `types/sorting.ts` - Core interfaces
- `utils/places-ranking.ts` - Main implementation
- `examples/places-ranking-usage.ts` - Usage examples 