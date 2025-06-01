'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { OwnershipManager } from '@/components/admin/OwnershipManager';

export default function PlaceManagerPage() {
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Place Manager</h1>
        <p className="text-muted-foreground mt-2">
          Manage categories, subcategories, types, and ownerships for places.
        </p>
      </div>

      <div className="md:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="ownerships">Ownerships</TabsTrigger>
          </TabsList>
          <TabsContent value="categories" className="mt-6">
            <CategoryManager />
          </TabsContent>
          <TabsContent value="ownerships" className="mt-6">
            <OwnershipManager />
          </TabsContent>
        </Tabs>
      </div>
      <div className="hidden md:block">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <CategoryManager />
          </div>
          <div className="md:col-span-1">
            <OwnershipManager />
          </div>
        </div>
      </div>
    </div>
  );
}
