'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Overview } from '@/components/dashboard/overview';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { RecentlyViewedPlaces } from '@/components/dashboard/popular-places';
import { TrendingUp, Users, Heart, Camera } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Here&apos;s an overview of your activity and discoveries.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Total Places Visited
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              24
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center mt-1">
              <span className="text-green-600 dark:text-green-400">+2</span>
              &nbsp;from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-pink-900 dark:text-pink-100">
              Favorite Places
            </CardTitle>
            <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-900 dark:text-pink-100">
              12
            </div>
            <p className="text-xs text-pink-700 dark:text-pink-300 flex items-center mt-1">
              <span className="text-green-600 dark:text-green-400">+3</span>
              &nbsp;new this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
              Reviews Written
            </CardTitle>
            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              8
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 flex items-center mt-1">
              <span className="text-green-600 dark:text-green-400">+1</span>
              &nbsp;this week
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Photos Uploaded
            </CardTitle>
            <Camera className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              16
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300 flex items-center mt-1">
              <span className="text-green-600 dark:text-green-400">+4</span>
              &nbsp;this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Activity Overview
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your activity over the past months
            </p>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Recent Activity
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your latest interactions
            </p>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>

      {/* Recently Viewed Places */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <RecentlyViewedPlaces />
        </CardContent>
      </Card>
    </div>
  );
}
