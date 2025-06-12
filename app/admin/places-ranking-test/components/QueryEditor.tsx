'use client';

import { useState } from 'react';
import type { StructuredSearchQuery } from '../../../../types/search';

interface TestScenario {
  name: string;
  description: string;
  queries: {
    name: string;
    query: StructuredSearchQuery;
    expectedTopResult?: string;
    description: string;
  }[];
}

interface QueryEditorProps {
  query: StructuredSearchQuery;
  onChange: (query: StructuredSearchQuery) => void;
  scenario: TestScenario | null;
  onQuerySelect: (query: StructuredSearchQuery) => void;
}

export default function QueryEditor({
  query,
  onChange,
  scenario,
  onQuerySelect,
}: QueryEditorProps) {
  const [showRawEditor, setShowRawEditor] = useState(false);
  const [rawQuery, setRawQuery] = useState(JSON.stringify(query, null, 2));

  const handleFieldChange = (
    field: keyof StructuredSearchQuery,
    value: any
  ) => {
    onChange({
      ...query,
      [field]: value,
    });
  };

  const handleRawQueryChange = (newRawQuery: string) => {
    setRawQuery(newRawQuery);
    try {
      const parsed = JSON.parse(newRawQuery);
      onChange(parsed);
    } catch (e) {
      // Invalid JSON, don't update
    }
  };

  const handlePresetQuerySelect = (presetQuery: StructuredSearchQuery) => {
    onQuerySelect(presetQuery);
    setRawQuery(JSON.stringify(presetQuery, null, 2));
  };

  return (
    <div className="space-y-4">
      {/* Preset Queries from Scenario */}
      {scenario && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preset Queries
          </label>
          <div className="space-y-1">
            {scenario.queries.map((presetQuery, index) => (
              <button
                key={index}
                onClick={() => handlePresetQuerySelect(presetQuery.query)}
                className="w-full text-left p-2 text-xs bg-blue-50 hover:bg-blue-100 rounded border transition-colors"
              >
                <div className="font-medium text-blue-900">
                  {presetQuery.name}
                </div>
                <div className="text-blue-700">{presetQuery.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toggle Editor Mode */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Query Parameters
        </label>
        <button
          onClick={() => setShowRawEditor(!showRawEditor)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {showRawEditor ? 'Form Editor' : 'Raw JSON'}
        </button>
      </div>

      {showRawEditor ? (
        /* Raw JSON Editor */
        <div>
          <textarea
            value={rawQuery}
            onChange={(e) => handleRawQueryChange(e.target.value)}
            className="w-full h-64 font-mono text-sm border border-gray-300 rounded-md p-3 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter query JSON..."
          />
        </div>
      ) : (
        /* Form Editor */
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Query Text
            </label>
            <input
              type="text"
              value={query.query || ''}
              onChange={(e) => handleFieldChange('query', e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Search query..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={query.location || ''}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Location name..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={query.category || ''}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Category..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Subcategory
              </label>
              <input
                type="text"
                value={query.subcategory || ''}
                onChange={(e) =>
                  handleFieldChange('subcategory', e.target.value)
                }
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Subcategory..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Price Level
              </label>
              <select
                value={query.price_level || ''}
                onChange={(e) =>
                  handleFieldChange('price_level', e.target.value || undefined)
                }
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Any</option>
                <option value="budget">Budget</option>
                <option value="moderate">Moderate</option>
                <option value="expensive">Expensive</option>
                <option value="very_expensive">Very Expensive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Rating
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={query.min_rating || ''}
                onChange={(e) =>
                  handleFieldChange(
                    'min_rating',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="0-5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Radius (m)
              </label>
              <input
                type="number"
                min="0"
                value={query.radius_meters || ''}
                onChange={(e) =>
                  handleFieldChange(
                    'radius_meters',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Distance..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Language
              </label>
              <input
                type="text"
                value={query.language || ''}
                onChange={(e) => handleFieldChange('language', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="en, es, fr..."
              />
            </div>
          </div>

          {/* User Location */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              User Location (lat, lng)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="any"
                value={query.user_location?.lat || ''}
                onChange={(e) => {
                  const lat = e.target.value
                    ? parseFloat(e.target.value)
                    : undefined;
                  handleFieldChange(
                    'user_location',
                    lat !== undefined
                      ? {
                          ...query.user_location,
                          lat,
                          lng: query.user_location?.lng || 0,
                        }
                      : undefined
                  );
                }}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Latitude"
              />
              <input
                type="number"
                step="any"
                value={query.user_location?.lng || ''}
                onChange={(e) => {
                  const lng = e.target.value
                    ? parseFloat(e.target.value)
                    : undefined;
                  handleFieldChange(
                    'user_location',
                    lng !== undefined
                      ? {
                          ...query.user_location,
                          lat: query.user_location?.lat || 0,
                          lng,
                        }
                      : undefined
                  );
                }}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Longitude"
              />
            </div>
          </div>

          {/* Boolean Flags */}
          <div className="space-y-2">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={query.open_now || false}
                onChange={(e) =>
                  handleFieldChange('open_now', e.target.checked || undefined)
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              Open Now
            </label>
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={query.has_website || false}
                onChange={(e) =>
                  handleFieldChange(
                    'has_website',
                    e.target.checked || undefined
                  )
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              Has Website
            </label>
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={query.has_phone || false}
                onChange={(e) =>
                  handleFieldChange('has_phone', e.target.checked || undefined)
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              Has Phone
            </label>
          </div>

          {/* Features */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Features (comma-separated)
            </label>
            <input
              type="text"
              value={query.features?.join(', ') || ''}
              onChange={(e) => {
                const features = e.target.value
                  .split(',')
                  .map((f) => f.trim())
                  .filter((f) => f.length > 0);
                handleFieldChange(
                  'features',
                  features.length > 0 ? features : undefined
                );
              }}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              placeholder="WiFi, Parking, Outdoor Seating..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
