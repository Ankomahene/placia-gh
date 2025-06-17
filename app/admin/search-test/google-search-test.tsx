'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Star,
  Clock,
  Navigation,
  Settings,
  Eye,
  Globe,
  PlusCircle,
} from 'lucide-react';
import { convertMetersToKm } from '@/lib/utils';
import { PlaceResultsSummary } from '@/types/place';

interface ParsedQuery {
  query?: string;
  location?: string;
  category?: string;
  subcategory?: string;
  features?: string[];
  min_rating?: number;
  price_level?: string;
  radius_meters?: number;
  open_now?: boolean;
  user_location?: {
    lat: number;
    lng: number;
  };
}

interface GoogleSearchResponse {
  success: boolean;
  data: {
    places: PlaceResultsSummary[];
    total_results: number;
    nextPageToken?: string | null;
    structured_query: ParsedQuery;
    original_query: string;
    source: string;
    user_location_used: boolean;
    search_metadata: {
      has_distance_calculation: boolean;
      has_open_hours_check: boolean;
      features_searched: number;
    };
  };
  error?: string;
  details?: string;
}

interface ParseResponse {
  success: boolean;
  data: {
    original_query: string;
    structured_query: ParsedQuery;
    user_location_used: boolean;
    parsing_metadata: {
      has_location: boolean;
      has_category: boolean;
      has_features: boolean;
      has_rating_filter: boolean;
      has_price_filter: boolean;
      detected_radius: number;
      open_now_filter: boolean;
    };
  };
  error?: string;
  details?: string;
}

export default function GoogleSearchTest() {
  const [query, setQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [useUserLocation, setUseUserLocation] = useState(false);

  const [parseLoading, setParseLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParseResponse | null>(null);
  const [places, setPlaces] = useState<PlaceResultsSummary[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null | undefined>(
    null
  );
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setUseUserLocation(true);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Failed to get current location: ' + error.message);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser');
    }
  };

  const handleParseQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setParseLoading(true);
    setError(null);
    setParsedData(null);
    setPlaces([]);
    setNextPageToken(null);
    setTotalResults(0);

    try {
      const response = await fetch('/api/search/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          userLocation: useUserLocation ? userLocation : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Parse failed');
      }

      setParsedData(data);
    } catch (err) {
      console.error('Parse error:', err);
      setError(
        err instanceof Error ? err.message : 'An error occurred during parsing'
      );
    } finally {
      setParseLoading(false);
    }
  };

  const handleSearch = async (token?: string) => {
    setSearchLoading(true);
    setError(null);

    // Reset results for a new search
    if (!token) {
      setPlaces([]);
      setNextPageToken(null);
      setTotalResults(0);
    }

    try {
      const requestBody = {
        query: query.trim(),
        userLocation: useUserLocation ? userLocation : undefined,
        pageToken: token,
      };

      const response = await fetch('/api/search/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data: GoogleSearchResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'Search failed');
      }

      setPlaces((prev) => [...prev, ...data.data.places]);
      setNextPageToken(data.data.nextPageToken);
      setTotalResults((prev) => prev + data.data.total_results);
    } catch (err) {
      console.error('Search error:', err);
      setError(
        err instanceof Error ? err.message : 'An error occurred during search'
      );
    } finally {
      setSearchLoading(false);
    }
  };

  const getPriceLevelDisplay = (priceLevel?: number) => {
    if (!priceLevel) return null;
    return '$'.repeat(priceLevel);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Input */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Google Places Query
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Natural Language Query */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Natural Language Query
                </label>
                <textarea
                  placeholder="e.g., Find the best restaurants in East Legon with parking and outdoor seating, open now"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* User Location */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  User Location (Optional)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={useUserLocation}
                      onChange={(e) => setUseUserLocation(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      Use location for proximity search
                    </span>
                  </div>

                  {useUserLocation && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="any"
                          placeholder="Latitude"
                          value={userLocation?.lat || ''}
                          onChange={(e) =>
                            setUserLocation((prev) => ({
                              ...prev,
                              lat: parseFloat(e.target.value) || 0,
                              lng: prev?.lng || 0,
                            }))
                          }
                          className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Longitude"
                          value={userLocation?.lng || ''}
                          onChange={(e) =>
                            setUserLocation((prev) => ({
                              ...prev,
                              lat: prev?.lat || 0,
                              lng: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={getCurrentLocation}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Navigation className="h-4 w-4" />
                        Get Current Location
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleParseQuery}
                  disabled={parseLoading || !query.trim()}
                  className="w-full"
                >
                  {parseLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Parsing Query...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Parse Query with OpenAI
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => handleSearch()}
                  disabled={!query.trim() || searchLoading}
                  className="w-full"
                  variant="secondary"
                >
                  {searchLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      Search Google Places
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2">
          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {parsedData && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Parsed Query Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Original Query:</h4>
                    <p className="text-sm bg-gray-100 p-2 rounded italic">
                      "{parsedData.data.original_query}"
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Extracted Information:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {parsedData.data.structured_query.location && (
                        <div>
                          <label className="text-xs text-gray-500">
                            Location
                          </label>
                          <p className="font-mono text-sm">
                            {parsedData.data.structured_query.location}
                          </p>
                        </div>
                      )}

                      {parsedData.data.structured_query.category && (
                        <div>
                          <label className="text-xs text-gray-500">
                            Category
                          </label>
                          <p className="font-mono text-sm">
                            {parsedData.data.structured_query.category}
                          </p>
                        </div>
                      )}

                      {parsedData.data.structured_query.subcategory && (
                        <div>
                          <label className="text-xs text-gray-500">
                            Subcategory
                          </label>
                          <p className="font-mono text-sm">
                            {parsedData.data.structured_query.subcategory}
                          </p>
                        </div>
                      )}

                      {parsedData.data.structured_query.min_rating && (
                        <div>
                          <label className="text-xs text-gray-500">
                            Minimum Rating
                          </label>
                          <p className="font-mono text-sm">
                            {parsedData.data.structured_query.min_rating}
                          </p>
                        </div>
                      )}

                      {parsedData.data.structured_query.radius_meters && (
                        <div>
                          <label className="text-xs text-gray-500">
                            Radius (meters)
                          </label>
                          <p className="font-mono text-sm">
                            {parsedData.data.structured_query.radius_meters}
                          </p>
                        </div>
                      )}

                      {parsedData.data.structured_query.open_now !==
                        undefined && (
                        <div>
                          <label className="text-xs text-gray-500">
                            Open Now
                          </label>
                          <p className="font-mono text-sm">
                            {parsedData.data.structured_query.open_now
                              ? 'Yes'
                              : 'No'}
                          </p>
                        </div>
                      )}
                    </div>

                    {parsedData.data.structured_query.features &&
                      parsedData.data.structured_query.features.length > 0 && (
                        <div className="mt-4">
                          <label className="text-xs text-gray-500">
                            Features
                          </label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {parsedData.data.structured_query.features.map(
                              (feature, index) => (
                                <Badge key={index} variant="secondary">
                                  {feature}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Parsing Metadata:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div
                        className={`p-2 rounded ${parsedData.data.parsing_metadata.has_location ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
                      >
                        Location:{' '}
                        {parsedData.data.parsing_metadata.has_location
                          ? '✓'
                          : '✗'}
                      </div>
                      <div
                        className={`p-2 rounded ${parsedData.data.parsing_metadata.has_category ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
                      >
                        Category:{' '}
                        {parsedData.data.parsing_metadata.has_category
                          ? '✓'
                          : '✗'}
                      </div>
                      <div
                        className={`p-2 rounded ${parsedData.data.parsing_metadata.has_features ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
                      >
                        Features:{' '}
                        {parsedData.data.parsing_metadata.has_features
                          ? '✓'
                          : '✗'}
                      </div>
                      <div
                        className={`p-2 rounded ${parsedData.data.parsing_metadata.has_rating_filter ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
                      >
                        Rating:{' '}
                        {parsedData.data.parsing_metadata.has_rating_filter
                          ? '✓'
                          : '✗'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          {places.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-500" />
                  Google Places Results ({totalResults} found)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {places.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No places found matching your criteria.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {places.map((place) => (
                        <div key={place.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg">
                              {place.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              {place.rate_average && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span className="text-sm">
                                    {place.rate_average} ({place.rate_count})
                                  </span>
                                </div>
                              )}
                              {getPriceLevelDisplay(place.price_level) && (
                                <Badge variant="outline">
                                  {getPriceLevelDisplay(place.price_level)}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {place.formatted_address ||
                                place.location.street_address ||
                                `${place.location.lat}, ${place.location.lng}`}
                            </div>
                            {place.distance && (
                              <span>
                                {convertMetersToKm(place.distance)} km away
                              </span>
                            )}
                            {place.open_now !== undefined &&
                              place.open_now !== 'unknown' && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {place.open_now ? 'Open now' : 'Closed'}
                                </div>
                              )}
                          </div>

                          {place.business_status && (
                            <div className="mb-2">
                              <Badge
                                variant={
                                  place.business_status === 'OPERATIONAL'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                                className="text-xs"
                              >
                                {place.business_status}
                              </Badge>
                            </div>
                          )}

                          {place.google_place_types &&
                            place.google_place_types.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {place.google_place_types
                                  .slice(0, 5)
                                  .map((type: string, index: number) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {type.replace(/_/g, ' ')}
                                    </Badge>
                                  ))}
                                {place.google_place_types.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{place.google_place_types.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                  {nextPageToken && (
                    <Button
                      onClick={() => handleSearch(nextPageToken)}
                      disabled={searchLoading}
                      className="w-full mt-4"
                    >
                      {searchLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading more...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Load More Results
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
