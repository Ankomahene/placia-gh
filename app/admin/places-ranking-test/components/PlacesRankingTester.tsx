'use client';

import { useState, useMemo } from 'react';
import type { StructuredSearchQuery } from '../../../../types/search';
import type { Place } from '../../../../types/place';
import {
  rankAndSortPlaces,
  computePlaceScore,
  createScoringConfig,
  DEFAULT_SCORING_CONFIG,
} from '../../../../utils/places-ranking';
import {
  testScenarios,
  datasets,
  type TestScenario,
} from '../../../../data/test-places-data';
import QueryEditor from './QueryEditor';
import DataSelector from './DataSelector';
import ResultsDisplay from './ResultsDisplay';
import ScoringConfigEditor from './ScoringConfigEditor';

export default function PlacesRankingTester() {
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(
    testScenarios[0]
  );
  const [selectedDataset, setSelectedDataset] =
    useState<keyof typeof datasets>('NYC Restaurants');
  const [currentData, setCurrentData] = useState<Place[]>(
    datasets['NYC Restaurants']
  );
  const [currentQuery, setCurrentQuery] = useState<StructuredSearchQuery>(
    testScenarios[0].queries[0].query
  );
  const [customConfig, setCustomConfig] = useState(DEFAULT_SCORING_CONFIG);
  const [useCustomConfig, setUseCustomConfig] = useState(false);
  const [showDebugBreakdown, setShowDebugBreakdown] = useState(false);

  // Compute ranked results
  const rankedResults = useMemo(() => {
    const config = useCustomConfig ? customConfig : DEFAULT_SCORING_CONFIG;
    const ranked = rankAndSortPlaces(currentQuery, currentData, config);

    // Add score breakdown for debugging
    const withScores = ranked.map((place) => {
      const scoreResult = computePlaceScore(place, currentQuery, config);
      return {
        ...place,
        scoreBreakdown: scoreResult.breakdown,
        totalScore: scoreResult.score,
      };
    });

    return withScores;
  }, [currentQuery, currentData, customConfig, useCustomConfig]);

  const handleScenarioChange = (scenario: TestScenario) => {
    setSelectedScenario(scenario);
    setCurrentData(scenario.data);
    setCurrentQuery(scenario.queries[0].query);
  };

  const handleDatasetChange = (datasetName: keyof typeof datasets) => {
    setSelectedDataset(datasetName);
    setCurrentData(datasets[datasetName]);
    setSelectedScenario(null);
  };

  const handleQuerySelect = (query: StructuredSearchQuery) => {
    setCurrentQuery(query);
  };

  return (
    <div className="space-y-6">
      {/* Controls Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Data Selection
          </h2>
          <DataSelector
            scenarios={testScenarios}
            datasets={datasets}
            selectedScenario={selectedScenario}
            selectedDataset={selectedDataset}
            onScenarioChange={handleScenarioChange}
            onDatasetChange={handleDatasetChange}
          />

          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-600">
              <div>Places: {currentData.length}</div>
              <div>
                Categories:{' '}
                {new Set(currentData.map((p) => p.category_id)).size}
              </div>
              <div>
                With Ratings: {currentData.filter((p) => p.rating).length}
              </div>
            </div>
          </div>
        </div>

        {/* Query Editor */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Search Query
          </h2>
          <QueryEditor
            query={currentQuery}
            onChange={setCurrentQuery}
            scenario={selectedScenario}
            onQuerySelect={handleQuerySelect}
          />
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Configuration
          </h2>

          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useCustomConfig}
                onChange={(e) => setUseCustomConfig(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Use Custom Config
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showDebugBreakdown}
                onChange={(e) => setShowDebugBreakdown(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Show Score Breakdown
              </span>
            </label>

            {useCustomConfig && (
              <ScoringConfigEditor
                config={customConfig}
                onChange={setCustomConfig}
              />
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Ranked Results ({rankedResults.length} places)
          </h2>
          {selectedScenario && (
            <p className="text-sm text-gray-600 mt-1">
              Testing scenario: {selectedScenario.name}
            </p>
          )}
        </div>

        <ResultsDisplay
          results={rankedResults}
          query={currentQuery}
          showDebugBreakdown={showDebugBreakdown}
        />
      </div>

      {/* Performance Stats */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          Performance Stats
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-blue-600">Total Places</div>
            <div className="font-medium">{currentData.length}</div>
          </div>
          <div>
            <div className="text-blue-600">Results Returned</div>
            <div className="font-medium">{rankedResults.length}</div>
          </div>
          <div>
            <div className="text-blue-600">Avg Score</div>
            <div className="font-medium">
              {rankedResults.length > 0
                ? (
                    rankedResults.reduce(
                      (sum, r) => sum + (r.totalScore || 0),
                      0
                    ) / rankedResults.length
                  ).toFixed(3)
                : '0'}
            </div>
          </div>
          <div>
            <div className="text-blue-600">Top Score</div>
            <div className="font-medium">
              {rankedResults[0]?.totalScore?.toFixed(3) || '0'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
