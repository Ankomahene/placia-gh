# Google Map View

A comprehensive Google Maps implementation for displaying search results with interactive features.

## Features

- **Google Maps Integration**: Uses Google Maps API for fast, reliable mapping
- **Interactive Markers**: Custom styled markers with hover and click interactions
- **User Location**: Shows user's current location with pulsing indicator
- **Directions**: Request and display directions from user location to places
- **Collapsible Sidebar**: Expandable/collapsible sidebar with place cards
- **Synchronized Interactions**: Hovering over map pins highlights corresponding cards and vice versa
- **Smooth Scrolling**: Auto-scrolls cards into view when hovering over map pins
- **Responsive Design**: Works on different screen sizes
- **Loading States**: Proper loading indicators and error handling

## Components

### GoogleMapView
Main component that orchestrates the map and sidebar.

**Props:**
- `places`: Array of place results to display
- `hoveredPlaceId`: Currently hovered place ID
- `selectedPlaceId`: Currently selected place ID
- `onPlaceHover`: Callback for place hover events
- `onPlaceSelect`: Callback for place selection events
- `isLoading`: Loading state

### GoogleMapClient
Core Google Maps component with markers, directions, and user location.

**Features:**
- Custom marker styling matching the existing design
- Hover info windows
- Directions rendering
- User location with pulse animation
- Fly-to functionality for selected places

### CollapsibleSidebar
Animated sidebar that can be collapsed/expanded.

**Features:**
- Smooth animations using Framer Motion
- Toggle button for expand/collapse
- Scrollable content area
- Place card management

### PlaceCard
Individual place card component for the sidebar.

**Features:**
- Place image, name, and details
- Open/closed status indicator
- Rating display
- Directions button
- Source badges (Google/Local)

### MarkerInfoWindow
Hover popup for map markers.

**Features:**
- Place details on hover
- Directions button
- Status indicators
- Responsive design

## Usage

```tsx
import { GoogleMapView } from '@/components/search/views/google-map-view';

function SearchPage() {
  const [places, setPlaces] = useState([]);
  const [hoveredPlaceId, setHoveredPlaceId] = useState(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <GoogleMapView
      places={places}
      hoveredPlaceId={hoveredPlaceId}
      selectedPlaceId={selectedPlaceId}
      onPlaceHover={setHoveredPlaceId}
      onPlaceSelect={setSelectedPlaceId}
      isLoading={isLoading}
    />
  );
}
```

## Environment Variables

Make sure to set the following environment variable:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Hooks

### useUserLocation
Hook to get user's current location with proper error handling.

### useDirections
Hook to handle directions requests and rendering.

## Performance Optimizations

- Dynamic imports to reduce initial bundle size
- Efficient marker management with cleanup
- Memoized callbacks to prevent unnecessary re-renders
- Stable marker data generation
- Proper Google Maps API loading

## Accessibility

- Proper ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly
- High contrast support

## Browser Support

- Modern browsers with ES6+ support
- Geolocation API support for user location
- Google Maps JavaScript API compatibility 