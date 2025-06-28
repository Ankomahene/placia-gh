'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Overview } from '@/components/dashboard/overview';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { RecentlyViewedPlaces } from '@/components/dashboard/popular-places';
import { useDashboardStats } from '@/hooks/use-user';
import {
  Building2,
  MapPin,
  Heart,
  MessageSquare,
  Camera,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const {
    businessesCount,
    contributedPlacesCount,
    favoritesCount,
    reviewsCount,
    photosCount,
    isLoading,
  } = useDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Here&apos;s an overview of your activity and discoveries.
        </p>
      </div>

      {/* Stats Cards - Updated Layout */}
      <div className="grid gap-8 md:grid-cols-6 lg:grid-cols-12">
        {/* My Businesses - 2 columns (md) / 4 columns (lg) */}
        <Link
          href="/dashboard/businesses"
          className="md:col-span-3 lg:col-span-4"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer h-28">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                My Businesses
              </CardTitle>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <ExternalLink className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {businessesCount}
                </div>
              )}
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Business places you manage
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Contributed Places - 2 columns (md) / 4 columns (lg) */}
        <Link
          href="/dashboard/contributed-places"
          className="md:col-span-3 lg:col-span-4"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer h-28">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
                Contributed Places
              </CardTitle>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                <ExternalLink className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {contributedPlacesCount}
                </div>
              )}
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Places you&apos;ve contributed
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Favorite Places - 1 column (md) / 4 columns (lg) */}
        <Link
          href="/dashboard/favorites"
          className="md:col-span-2 lg:col-span-4"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer h-28">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-900 dark:text-pink-100">
                Favorite Places
              </CardTitle>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                <ExternalLink className="h-3 w-3 text-pink-600 dark:text-pink-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-900 dark:text-pink-100">
                {favoritesCount}
              </div>
              <p className="text-xs text-pink-700 dark:text-pink-300 mt-1">
                Places you love
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Reviews Written - 1 column (md) / 4 columns (lg) */}
        <Card className="md:col-span-2 lg:col-span-4 border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 h-28">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">
              Reviews Written
            </CardTitle>
            <MessageSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                {reviewsCount}
              </div>
            )}
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              Your helpful reviews
            </p>
          </CardContent>
        </Card>

        {/* Photos Uploaded - 1 column (md) / 4 columns (lg) */}
        <Card className="md:col-span-2 lg:col-span-4 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 h-28">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Photos Uploaded
            </CardTitle>
            <Camera className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {photosCount}
              </div>
            )}
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
              Photos you&apos;ve shared
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">
                  Activity Overview
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your activity over the past months
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                Mock Data - Coming Soon
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">
                  Recent Activity
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your latest interactions
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                Mock Data - Coming Soon
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>

      {/* Recently Viewed Places */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Recently Viewed Places</h3>
              <p className="text-sm text-muted-foreground">
                Places you&apos;ve viewed recently
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Mock Data - Coming Soon
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <RecentlyViewedPlaces />
        </CardContent>
      </Card>
    </div>
  );
}
