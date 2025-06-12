import { Metadata } from 'next';
import PlacesRankingTester from './components/PlacesRankingTester';

export const metadata: Metadata = {
  title: 'Places Ranking System Test | Admin',
  description:
    'Test and debug the places ranking algorithm with various datasets and queries.',
};

export default function PlacesRankingTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Places Ranking System Test
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Test and debug the places ranking algorithm with comprehensive
            datasets and structured queries. Modify data and queries to see how
            the scoring system responds to different scenarios.
          </p>
        </div>

        <PlacesRankingTester />
      </div>
    </div>
  );
}
