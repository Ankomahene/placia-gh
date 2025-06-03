'use client';

import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Component, Database, Search } from 'lucide-react';
import { useState } from 'react';
import { FieldsManager } from '../components/FieldsManager';
import { SubcategoriesManager } from '../components/SubcategoriesManager';

interface ResourcesPanelProps {
  // No props needed since groupingId is not used
}

export function ResourcesPanel() {
  const [activeTab, setActiveTab] = useState<'fields' | 'subcategories'>(
    'fields'
  );
  const [search, setSearch] = useState('');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Resources</h2>
          <p className="text-sm text-muted-foreground">
            Manage fields and subcategories
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fields" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Fields
            </TabsTrigger>
            <TabsTrigger
              value="subcategories"
              className="flex items-center gap-2"
            >
              <Component className="h-4 w-4" />
              Subcategories
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} className="h-full">
          <TabsContent value="fields" className="h-full mt-0">
            <FieldsManager search={search} />
          </TabsContent>
          <TabsContent value="subcategories" className="h-full mt-0">
            <SubcategoriesManager search={search} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
