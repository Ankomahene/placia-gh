'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Save,
  FileJson,
  FileSpreadsheet,
  FormInput,
} from 'lucide-react';
import { PlaceFormView } from '@/components/admin/places-manager/place-form-view';
import { PlaceJsonView } from '@/components/admin/places-manager/place-json-view';
import { PlaceCsvView } from '@/components/admin/places-manager/place-csv-view';
import { usePlaceForm } from '@/hooks/admin/use-place-form';
import { toast } from 'sonner';

export default function AddPlacePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('form');
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
  } = usePlaceForm();

  const handleSave = async () => {
    try {
      await savePlace();
      toast.success('Place saved successfully!');
      router.push('/admin/places');
    } catch (error) {
      toast.error('Failed to save place');
      console.error('Save error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/places')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add New Place</h1>
            <p className="text-muted-foreground mt-1">
              Create a new place in the system
            </p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Place
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
