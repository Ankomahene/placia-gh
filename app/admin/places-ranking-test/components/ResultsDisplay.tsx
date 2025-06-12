'use client';

import type { Place } from '../../../../types/place';
import type { StructuredSearchQuery } from '../../../../types/search';

interface ExtendedPlace extends Place {
  scoreBreakdown?: Record<string, number>;
  totalScore?: number;
}

interface ResultsDisplayProps {
  results: ExtendedPlace[];
  query: StructuredSearchQuery;
  showDebugBreakdown: boolean;
}

export default function ResultsDisplay({
  results,
  query,
  showDebugBreakdown,
}: ResultsDisplayProps) {
  const formatScoreValue = (value: number | undefined): string => {
    if (value === undefined) return '0.000';
    return value.toFixed(3);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (results.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="text-lg font-medium">No results found</div>
        <div className="text-sm mt-1">
          Try adjusting your query parameters or selecting a different dataset.
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {results.map((place, index) => (
        <div key={place.id} className="p-6 hover:bg-gray-50">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {index + 1}
                </span>
                <h3 className="text-lg font-semibold text-gray-900">
                  {place.name}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(place.status)}`}
                >
                  {place.status}
                </span>
              </div>

              {place.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {place.description}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  📍 {place.location?.name || 'Unknown location'}
                </div>
                {place.rating && (
                  <div className="flex items-center gap-1">
                    ⭐ {place.rating.rate} ({place.rating.count} reviews)
                  </div>
                )}
                {place.distance !== undefined && (
                  <div className="flex items-center gap-1">
                    📏 {place.distance.toFixed(2)} km
                  </div>
                )}
                <div className="flex items-center gap-1">
                  🏷️ {place.category_id}/{place.subcategory_id}
                </div>
              </div>
            </div>

            {/* Score Display */}
            <div className="text-right ml-4">
              <div className="text-2xl font-bold text-blue-600">
                {formatScoreValue(place.totalScore)}
              </div>
              <div className="text-xs text-gray-500">Total Score</div>
            </div>
          </div>

          {/* Features and Tags */}
          {(place.features || place.tags) && (
            <div className="mb-3">
              {place.features && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {place.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700"
                    >
                      {feature.label}
                    </span>
                  ))}
                </div>
              )}
              {place.tags && (
                <div className="flex flex-wrap gap-1">
                  {place.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contact Information */}
          <div className="flex flex-wrap gap-4 text-sm mb-3">
            {place.website && (
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                🌐 Website
              </a>
            )}
            {place.contacts && place.contacts.length > 0 && (
              <span className="text-gray-600">📞 {place.contacts[0]}</span>
            )}
            {place.email && (
              <span className="text-gray-600">✉️ {place.email}</span>
            )}
          </div>

          {/* Score Breakdown */}
          {showDebugBreakdown && place.scoreBreakdown && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Score Breakdown
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                {Object.entries(place.scoreBreakdown)
                  .filter(([_, value]) => value !== undefined && value > 0)
                  .sort(([_, a], [__, b]) => (b || 0) - (a || 0))
                  .map(([factor, value]) => (
                    <div
                      key={factor}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-600 capitalize">
                        {factor.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatScoreValue(value)}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Query Matching Indicators */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600 space-y-1">
                  {query.user_location && place.location && (
                    <div>
                      📍 Distance from user:{' '}
                      {place.distance?.toFixed(2) || 'N/A'} km
                    </div>
                  )}
                  {query.min_rating && place.rating && (
                    <div
                      className={
                        place.rating.rate >= query.min_rating
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      ⭐ Rating{' '}
                      {place.rating.rate >= query.min_rating ? '✓' : '✗'} meets
                      min {query.min_rating}
                    </div>
                  )}
                  {query.category && (
                    <div
                      className={
                        place.category_id === query.category
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      🏷️ Category{' '}
                      {place.category_id === query.category ? '✓' : '✗'} matches{' '}
                      {query.category}
                    </div>
                  )}
                  {query.has_website !== undefined && (
                    <div
                      className={
                        !!place.website === query.has_website
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      🌐 Website{' '}
                      {!!place.website === query.has_website ? '✓' : '✗'}{' '}
                      requirement
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Data Completeness Indicator */}
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span>Data completeness:</span>
            <div className="flex gap-1">
              <span
                className={
                  place.description ? 'text-green-600' : 'text-gray-400'
                }
              >
                {place.description ? '✓' : '✗'} Description
              </span>
              <span
                className={
                  place.gallery?.length ? 'text-green-600' : 'text-gray-400'
                }
              >
                {place.gallery?.length ? '✓' : '✗'} Photos
              </span>
              <span
                className={
                  place.open_hours?.length ? 'text-green-600' : 'text-gray-400'
                }
              >
                {place.open_hours?.length ? '✓' : '✗'} Hours
              </span>
              <span
                className={
                  place.contacts?.length ? 'text-green-600' : 'text-gray-400'
                }
              >
                {place.contacts?.length ? '✓' : '✗'} Contact
              </span>
              <span
                className={place.website ? 'text-green-600' : 'text-gray-400'}
              >
                {place.website ? '✓' : '✗'} Website
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
