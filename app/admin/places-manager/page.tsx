'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlacesTable } from '@/components/admin/places-manager/places-table';
import { PlacesImport } from '@/components/admin/places-manager/places-import';
import { Button } from '@/components/ui/button';
import { Plus, FileUp, Table } from 'lucide-react';
import Link from 'next/link';

export default function PlacesAdminPage() {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Places Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage, add, edit, and import places in the system
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/places/add">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Place
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Places List
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            Import Places
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <PlacesTable />
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <PlacesImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
