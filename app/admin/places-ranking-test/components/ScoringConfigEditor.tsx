'use client';

import { useState } from 'react';
import type { ScoringConfig } from '../../../../types/sorting';

interface ScoringConfigEditorProps {
  config: ScoringConfig;
  onChange: (config: ScoringConfig) => void;
}

export default function ScoringConfigEditor({
  config,
  onChange,
}: ScoringConfigEditorProps) {
  const [collapsed, setCollapsed] = useState(true);

  const handleWeightChange = (
    weight: keyof ScoringConfig['weights'],
    value: number
  ) => {
    onChange({
      ...config,
      weights: {
        ...config.weights,
        [weight]: value,
      },
    });
  };

  const handleConfigChange = (field: keyof ScoringConfig, value: any) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const totalWeight = Object.values(config.weights).reduce(
    (sum, weight) => sum + weight,
    0
  );
  const isValidWeights = Math.abs(totalWeight - 1.0) < 0.001;

  const resetToDefault = () => {
    onChange({
      weights: {
        proximity: 0.25,
        locationMatch: 0.2,
        categoryMatch: 0.15,
        subcategoryMatch: 0.1,
        rating: 0.15,
        priceMatch: 0.05,
        openNow: 0.03,
        hasWebsite: 0.02,
        hasPhone: 0.02,
        featuresMatch: 0.02,
        tagsMatch: 0.01,
        completeness: 0.1,
      },
      maxProximityKm: 50,
      ratingBoostThreshold: 4.0,
      completenessFactors: {
        hasDescription: 0.2,
        hasPhotos: 0.3,
        hasOpenHours: 0.2,
        hasContact: 0.15,
        hasWebsite: 0.15,
      },
    });
  };

  const normalizeWeights = () => {
    const factor = 1.0 / totalWeight;
    const normalizedWeights = {} as ScoringConfig['weights'];

    Object.entries(config.weights).forEach(([key, value]) => {
      (normalizedWeights as any)[key] = value * factor;
    });

    onChange({
      ...config,
      weights: normalizedWeights,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Scoring Weights {collapsed ? '▶' : '▼'}
        </button>
        <div className="flex gap-2">
          <button
            onClick={normalizeWeights}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Normalize
          </button>
          <button
            onClick={resetToDefault}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Weight Total Indicator */}
      <div
        className={`text-xs p-2 rounded ${
          isValidWeights
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}
      >
        Total Weight: {totalWeight.toFixed(3)}{' '}
        {!isValidWeights && '⚠️ Should equal 1.0'}
      </div>

      {!collapsed && (
        <div className="space-y-3">
          {/* Main Weights */}
          <div className="space-y-2">
            {Object.entries(config.weights).map(([weightKey, value]) => (
              <div key={weightKey} className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">
                  {weightKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.001"
                  value={value}
                  onChange={(e) =>
                    handleWeightChange(
                      weightKey as keyof ScoringConfig['weights'],
                      parseFloat(e.target.value)
                    )
                  }
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.001"
                  value={value.toFixed(3)}
                  onChange={(e) =>
                    handleWeightChange(
                      weightKey as keyof ScoringConfig['weights'],
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-16 text-xs border border-gray-300 rounded px-2 py-1"
                />
              </div>
            ))}
          </div>

          {/* General Config */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-700 w-32">
                Max Proximity (km)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={config.maxProximityKm}
                onChange={(e) =>
                  handleConfigChange(
                    'maxProximityKm',
                    parseInt(e.target.value) || 50
                  )
                }
                className="w-20 text-xs border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-700 w-32">
                Rating Boost Threshold
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={config.ratingBoostThreshold}
                onChange={(e) =>
                  handleConfigChange(
                    'ratingBoostThreshold',
                    parseFloat(e.target.value) || 4.0
                  )
                }
                className="w-20 text-xs border border-gray-300 rounded px-2 py-1"
              />
            </div>
          </div>

          {/* Completeness Factors */}
          <div className="border-t pt-3">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Completeness Factors
            </label>
            <div className="space-y-2">
              {Object.entries(config.completenessFactors).map(
                ([factor, value]) => (
                  <div key={factor} className="flex items-center gap-3">
                    <label className="text-xs text-gray-600 w-24 flex-shrink-0">
                      {factor.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={value}
                      onChange={(e) => {
                        const newFactors = {
                          ...config.completenessFactors,
                          [factor]: parseFloat(e.target.value),
                        };
                        handleConfigChange('completenessFactors', newFactors);
                      }}
                      className="flex-1"
                    />
                    <span className="text-xs w-12 text-right">
                      {value.toFixed(2)}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
