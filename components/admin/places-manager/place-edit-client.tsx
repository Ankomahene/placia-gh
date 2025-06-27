'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  Save,
  AlertCircle,
  FormInput,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { usePlaceDetails } from '@/hooks/admin/use-place-details';
import { usePlaceForm } from '@/hooks/admin/use-place-form';
import { PlaceFormView } from './place-form-view';
import { PlaceJsonView } from './place-json-view';
import { PlaceCsvView } from './place-csv-view';

interface PlaceEditClientProps {
  id: string;
}

export default function PlaceEditClient({ id }: PlaceEditClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('form');
  const { data: place, isLoading, error } = usePlaceDetails(id);

  const {
    formData,
    updateFormData,
    errors,
    isSubmitting,
    savePlace,
    jsonData,
    csvData,
    updateFromJson,
    updateFromCsv,
    setInitialData,
  } = usePlaceForm();

  useEffect(() => {
    if (place) {
      setInitialData(place);
    }
  }, [place, setInitialData]);

  const handleSave = async () => {
    try {
      await savePlace(id);
      toast.success('Place updated successfully!');
      router.push('/admin/places-manager');
    } catch (error) {
      toast.error('Failed to update place');
      console.error('Update error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading place details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading place details:{' '}
          {error instanceof Error ? error.message : 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/places-manager')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Place</h1>
            <p className="text-muted-foreground mt-1">
              {formData.name || 'Loading place details...'}
            </p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <FormInput className="h-4 w-4" />
            Form View
          </TabsTrigger>
          <TabsTrigger value="json" className="flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            JSON View
          </TabsTrigger>
          <TabsTrigger value="csv" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            CSV View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="mt-6">
          <PlaceFormView
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        </TabsContent>

        <TabsContent value="json" className="mt-6">
          <PlaceJsonView
            jsonData={jsonData}
            updateFromJson={updateFromJson}
            isSubmitting={isSubmitting}
          />
        </TabsContent>

        <TabsContent value="csv" className="mt-6">
          <PlaceCsvView
            csvData={csvData}
            updateFromCsv={updateFromCsv}
            isSubmitting={isSubmitting}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
