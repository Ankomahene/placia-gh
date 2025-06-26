'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlaceJsonView } from './place-json-view';
import { PlaceCsvView } from './place-csv-view';
import { PlaceFormView } from './place-form-view';
import { usePlaceForm } from '@/hooks/admin/use-place-form';
import { useDropzone } from 'react-dropzone';
import { FileJson, FileSpreadsheet, Upload, AlertCircle, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function PlacesImport() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('json');
  const [fileError, setFileError] = useState<string | null>(null);
  
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
    importFromJsonFile,
    importFromCsvFile
  } = usePlaceForm();

  const onDropJson = (acceptedFiles: File[]) => {
    setFileError(null);
    const file = acceptedFiles[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await importFromJsonFile(content);
        setActiveTab('json');
        toast.success('JSON file imported successfully');
      } catch (error) {
        console.error('JSON import error:', error);
        setFileError('Invalid JSON file format. Please check your file and try again.');
      }
    };
    reader.readAsText(file);
  };

  const onDropCsv = (acceptedFiles: File[]) => {
    setFileError(null);
    const file = acceptedFiles[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await importFromCsvFile(content);
        setActiveTab('csv');
        toast.success('CSV file imported successfully');
      } catch (error) {
        console.error('CSV import error:', error);
        setFileError('Invalid CSV file format. Please check your file and try again.');
      }
    };
    reader.readAsText(file);
  };

  const jsonDropzone = useDropzone({
    onDrop: onDropJson,
    accept: {
      'application/json': ['.json'],
    },
    maxFiles: 1,
  });

  const csvDropzone = useDropzone({
    onDrop: onDropCsv,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleSave = async () => {
    try {
      await savePlace();
      toast.success('Place imported and saved successfully!');
      router.push('/admin/places');
    } catch (error) {
      toast.error('Failed to save imported place');
      console.error('Save error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={`border-2 ${jsonDropzone.isDragActive ? 'border-primary' : 'border-dashed'}`}>
          <div 
            {...jsonDropzone.getRootProps()} 
            className="h-full flex flex-col cursor-pointer"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-blue-500" />
                Import JSON
              </CardTitle>
              <CardDescription>
                Upload a JSON file with place data
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center py-10">
              <input {...jsonDropzone.getInputProps()} />
              <div className="text-center">
                <div className="mx-auto bg-muted rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">
                  {jsonDropzone.isDragActive
                    ? "Drop the JSON file here"
                    : "Drag & drop a JSON file here, or click to select"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports single place or array of places
                </p>
              </div>
            </CardContent>
          </div>
        </Card>

        <Card className={`border-2 ${csvDropzone.isDragActive ? 'border-primary' : 'border-dashed'}`}>
          <div 
            {...csvDropzone.getRootProps()} 
            className="h-full flex flex-col cursor-pointer"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-500" />
                Import CSV
              </CardTitle>
              <CardDescription>
                Upload a CSV file with place data
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center py-10">
              <input {...csvDropzone.getInputProps()} />
              <div className="text-center">
                <div className="mx-auto bg-muted rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">
                  {csvDropzone.isDragActive
                    ? "Drop the CSV file here"
                    : "Drag & drop a CSV file here, or click to select"}
                </p>
                <p className="text-xs text-muted-foreground">
                  First row should contain column headers
                </p>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {fileError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fileError}</AlertDescription>
        </Alert>
      )}

      {(jsonData || csvData) && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Preview Imported Data</h2>
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
                  Save Imported Place
                </>
              )}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="form">Form View</TabsTrigger>
              <TabsTrigger value="json">JSON View</TabsTrigger>
              <TabsTrigger value="csv">CSV View</TabsTrigger>
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
      )}
    </div>
  );
}