import FeaturedPlaces from '@/components/featured-places';
import Footer from '@/components/layout/footer';
import Header from '@/components/layout/header';
import { SearchClientWrapper } from '@/components/search/search-client-wrapper';
import TrendingPlaces from '@/components/trending-places';
import {
  AudioTourManager,
  AudioTourTestButton,
} from '@/components/onboarding-v2';
import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground relative">
      <Header />
      <Suspense fallback={<div className="h-screen w-full" />}>
        <SearchClientWrapper />
      </Suspense>
      <div className="container mx-auto px-4 py-12 space-y-20">
        <FeaturedPlaces />
        <TrendingPlaces />

        {/* Contribute Banner */}
        <section
          className="relative overflow-hidden rounded-3xl"
          data-tour="contribute-banner"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/50 opacity-90" />
          <div className="relative px-8 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Know a Great Place?
              </h2>
              <p className="text-lg md:text-xl opacity-90">
                Help others discover amazing locations by contributing to our
                growing community. Share your favorite places and make them
                easier to find.
              </p>
            </div>
            <Link href="/contribute-place">
              <Button
                size="lg"
                variant="outline"
                className="bg-white text-primary hover:bg-white/80 border-primary/40 rounded-lg dark:bg-zinc-100 dark:border-zinc-200"
              >
                <MapPin className="mr-2 h-5 w-5" />
                Add a Place
              </Button>
            </Link>
          </div>
        </section>
      </div>
      <Footer />

      {/* AI Audio Tour Manager */}
      <AudioTourManager />

      {/* Development Tools */}
      <AudioTourTestButton />
    </main>
  );
}
