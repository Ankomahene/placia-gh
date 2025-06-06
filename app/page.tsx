import FeaturedPlaces from '@/components/featured-places';
import Footer from '@/components/layout/footer';
import Header from '@/components/layout/header';
import PopularCategories from '@/components/popular-categories';
import { SearchClientWrapper } from '@/components/search/search-client-wrapper';
import TrendingPlaces from '@/components/trending-places';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <SearchClientWrapper />
      <div className="container mx-auto px-4 py-12 space-y-20">
        <FeaturedPlaces />
        <TrendingPlaces />
        <PopularCategories />
      </div>
      <Footer />
    </main>
  );
}
