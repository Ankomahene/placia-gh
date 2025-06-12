'use client';

import type { TestScenario } from '../../../../data/test-places-data';
import { datasets } from '../../../../data/test-places-data';

interface DataSelectorProps {
  scenarios: TestScenario[];
  datasets: typeof datasets;
  selectedScenario: TestScenario | null;
  selectedDataset: keyof typeof datasets;
  onScenarioChange: (scenario: TestScenario) => void;
  onDatasetChange: (dataset: keyof typeof datasets) => void;
}

export default function DataSelector({
  scenarios,
  datasets,
  selectedScenario,
  selectedDataset,
  onScenarioChange,
  onDatasetChange,
}: DataSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Test Scenarios */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Scenarios
        </label>
        <select
          value={selectedScenario?.name || ''}
          onChange={(e) => {
            const scenario = scenarios.find((s) => s.name === e.target.value);
            if (scenario) onScenarioChange(scenario);
          }}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        >
          <option value="">Select a scenario...</option>
          {scenarios.map((scenario) => (
            <option key={scenario.name} value={scenario.name}>
              {scenario.name}
            </option>
          ))}
        </select>
        {selectedScenario && (
          <p className="mt-2 text-sm text-gray-600">
            {selectedScenario.description}
          </p>
        )}
      </div>

      {/* Dataset Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or Choose Dataset
        </label>
        <select
          value={selectedDataset}
          onChange={(e) =>
            onDatasetChange(e.target.value as keyof typeof datasets)
          }
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        >
          {Object.keys(datasets).map((datasetName) => (
            <option key={datasetName} value={datasetName}>
              {datasetName} (
              {datasets[datasetName as keyof typeof datasets].length} places)
            </option>
          ))}
        </select>
      </div>

      {/* Scenario Queries */}
      {selectedScenario && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Test Queries ({selectedScenario.queries.length})
          </label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {selectedScenario.queries.map((query, index) => (
              <div
                key={index}
                className="text-xs p-2 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  // This will be handled by the parent component
                }}
              >
                <div className="font-medium">{query.name}</div>
                <div className="text-gray-600">{query.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
