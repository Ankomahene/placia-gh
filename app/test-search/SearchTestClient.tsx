'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  FormattedGooglePlaceSearchResult,
  StructuredSearchQuery,
} from '@/types/search';
import { Loader2, Search, Star } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export function SearchTestClient() {
  const [naturalQuery, setNaturalQuery] = useState('');
  const [structuredQuery, setStructuredQuery] =
    useState<StructuredSearchQuery | null>(null);
  const [places, setPlaces] = useState<FormattedGooglePlaceSearchResult[]>([]);
  const [isParsingQuery, setIsParsingQuery] = useState(false);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isCompleteSearch, setIsCompleteSearch] = useState(false);

  const handleParseQuery = async () => {
    if (!naturalQuery.trim()) return;

    setIsParsingQuery(true);
    try {
      const response = await fetch('/api/search/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: naturalQuery }),
      });

      const result = await response.json();
      if (result.success) {
        setStructuredQuery(result.data);
      } else {
        console.error('Error parsing query:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsParsingQuery(false);
    }
  };

  const handleSearchPlaces = async () => {
    if (!naturalQuery.trim()) return;

    setIsSearchingPlaces(true);
    try {
      const response = await fetch('/api/search/google-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: naturalQuery }),
      });

      const result = await response.json();
      if (result.success) {
        console.log('Google textSearch results:', result.data);
        setPlaces(result.data.places || []);
        // Also update structured query from the response
        if (result.data.structured_query) {
          setStructuredQuery(result.data.structured_query);
        }
      } else {
        console.error('Error searching places:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const handleCompleteSearch = async () => {
    if (!naturalQuery.trim()) return;

    setIsCompleteSearch(true);
    try {
      const response = await fetch('/api/search/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: naturalQuery }),
      });

      const result = await response.json();
      if (result.success) {
        setStructuredQuery(result.data.structured_query);
        setPlaces(result.data.places || []);
      } else {
        console.error('Error in complete search:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsCompleteSearch(false);
    }
  };

  const handleReset = () => {
    setNaturalQuery('');
    setStructuredQuery(null);
    setPlaces([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Search System Test</h1>
        <p className="text-muted-foreground">
          Test natural language search with OpenAI and Google Places integration
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Natural Language Search
          </CardTitle>
          <CardDescription>
            Enter a natural language search query like &quot;best coffee shops
            near East Legon with outdoor seating&quot;
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., best coffee shops near East Legon with outdoor seating"
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleReset} variant="outline">
              Reset
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleParseQuery}
              disabled={!naturalQuery.trim() || isParsingQuery}
            >
              {isParsingQuery && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              1. Parse Query
            </Button>

            <Button
              onClick={handleSearchPlaces}
              disabled={!naturalQuery.trim() || isSearchingPlaces}
              variant="secondary"
            >
              {isSearchingPlaces && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              2. Google TextSearch
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              onClick={handleCompleteSearch}
              disabled={!naturalQuery.trim() || isCompleteSearch}
              variant="default"
            >
              {isCompleteSearch && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Complete Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Structured Query Display */}
      {structuredQuery && (
        <Card>
          <CardHeader>
            <CardTitle>Structured Query</CardTitle>
            <CardDescription>
              OpenAI parsed your natural language query into this structured
              format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>Query:</strong> {structuredQuery.query}
              </div>
              {structuredQuery.location && (
                <div>
                  <strong>Location:</strong> {structuredQuery.location}
                </div>
              )}
              {structuredQuery.region && (
                <div>
                  <strong>Region:</strong> {structuredQuery.region}
                </div>
              )}
              {structuredQuery.category && (
                <div>
                  <strong>Category:</strong> {structuredQuery.category}
                </div>
              )}
              {structuredQuery.features &&
                structuredQuery.features.length > 0 && (
                  <div>
                    <strong>Features:</strong>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {structuredQuery.features.map((feature, index) => (
                        <Badge key={index} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              {structuredQuery.radius_meters && (
                <div>
                  <strong>Radius:</strong> {structuredQuery.radius_meters}m
                </div>
              )}
              {structuredQuery.min_rating && (
                <div>
                  <strong>Min Rating:</strong> {structuredQuery.min_rating}
                </div>
              )}
              {(structuredQuery.min_price !== undefined ||
                structuredQuery.max_price !== undefined) && (
                <div>
                  <strong>Price Range:</strong> {structuredQuery.min_price ?? 0}{' '}
                  - {structuredQuery.max_price ?? 4}
                </div>
              )}
              {structuredQuery.open_now && (
                <div>
                  <strong>Open Now:</strong> Yes
                </div>
              )}
              {structuredQuery.language && (
                <div>
                  <strong>Language:</strong> {structuredQuery.language}
                </div>
              )}
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                View Raw JSON
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
                {JSON.stringify(structuredQuery, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      {/* Places Results */}
      {places.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({places.length} places)</CardTitle>
            <CardDescription>
              Places found and transformed to local model format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {places.map((place) => (
              <Card key={place.placeId} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{place.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {place.formattedAddress}
                      </p>
                    </div>
                    {place.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{place.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({place.totalReviews})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* <p className="text-sm">{place.description}</p> */}

                  {/* <div className="flex flex-wrap gap-2">
                    {place.contacts && place.contacts.length > 0 && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        {place.contacts[0]}
                      </Badge>
                    )}
                    {place.website && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        Website
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3" />
                      {place.location.lat.toFixed(4)},{' '}
                      {place.location.lng.toFixed(4)}
                    </Badge>
                  </div> */}

                  {/* {place.tags && place.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {place.tags.slice(0, 5).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  )} */}

                  {place.gallery && place.gallery.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {place.gallery.slice(0, 3).map((image, index) => (
                        <Image
                          key={index}
                          src={image}
                          alt={`${place.name} ${index + 1}`}
                          className="w-48 h-48 object-cover rounded"
                          width={192}
                          height={192}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
