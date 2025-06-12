'use client';

import { useState } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlaceSearchFormProps {
  onSearch: (query: string, location?: string) => void;
  loading: boolean;
  onClear: () => void;
}

export function PlaceSearchForm({
  onSearch,
  loading,
  onClear,
}: PlaceSearchFormProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), location.trim() || undefined);
    }
  };

  const handleClear = () => {
    setQuery('');
    setLocation('');
    onClear();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          OpenStreetMap Place Finder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="query" className="text-sm font-medium">
                Place Type
              </label>
              <Input
                id="query"
                placeholder="e.g., school, hospital, restaurant"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                What type of place are you looking for?
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location (Optional)
              </label>
              <Input
                id="location"
                placeholder="e.g., Accra, Tamale, Kumasi"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Narrow down by city or region
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Places
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={loading}
            >
              Clear
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Examples:</strong>
            <span className="block mt-1">
              • &quot;schools&quot; + &quot;Accra&quot; - Find schools in Accra
              <br />
              • &quot;hospitals&quot; + &quot;Kumasi&quot; - Find hospitals in
              Kumasi
              <br />• &quot;restaurants&quot; - Find restaurants everywhere
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
