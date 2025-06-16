import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Globe, Search, Brain } from 'lucide-react';
import GoogleSearchTest from './google-search-test';
import InternalSearchTest from './internal-search-test';
import EnhancedSmartSearchTest from './enhanced-smart-search-test';

export default function SearchTestPage() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Search System Tests
          </h1>
          <p className="text-muted-foreground">
            Test different search implementations and compare performance
          </p>
        </div>

        <Tabs defaultValue="enhanced" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="enhanced" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Enhanced Smart
            </TabsTrigger>

            <TabsTrigger value="google" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Google Places
            </TabsTrigger>
            <TabsTrigger value="internal" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Internal Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enhanced" className="space-y-6">
            <EnhancedSmartSearchTest />
          </TabsContent>

          <TabsContent value="google" className="space-y-6">
            <GoogleSearchTest />
          </TabsContent>

          <TabsContent value="internal" className="space-y-6">
            <InternalSearchTest />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
