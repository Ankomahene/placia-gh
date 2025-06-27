'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Copy, Check, FileSpreadsheet, Download } from 'lucide-react';

interface PlaceCsvViewProps {
  csvData: string;
  updateFromCsv: (csv: string) => void;
  isSubmitting: boolean;
}

export function PlaceCsvView({ csvData, updateFromCsv, isSubmitting }: PlaceCsvViewProps) {
  const [localCsv, setLocalCsv] = useState(csvData);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLocalCsv(csvData);
  }, [csvData]);

  const handleCsvChange = (value: string) => {
    setLocalCsv(value);
    setError(null);
  };

  const handleApplyChanges = () => {
    try {
      // Basic validation - check if it has headers and at least one row
      const lines = localCsv.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV must have headers and at least one data row');
      }
      
      // Check if headers contain required fields
      const headers = lines[0].split(',');
      if (!headers.includes('name') || !headers.includes('description')) {
        throw new Error('CSV must include at least "name" and "description" columns');
      }
      
      updateFromCsv(localCsv);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid CSV format');
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(localCsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTemplate = () => {
    const template = 'name,description,tagline,email,website,location.lat,location.lng,location.name,location.street_address,category_id,subcategory_id,source\n' +
      'Example Place,This is a description,A catchy tagline,example@email.com,https://example.com,5.6037,-0.187,Accra,123 Main Street,category-id,subcategory-id,manual';
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'place_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-green-500" />
          CSV Editor
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadTemplate}
          >
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyToClipboard}
            disabled={isSubmitting || copied}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="text-sm text-muted-foreground mb-2">
          <p>CSV format should include headers and data rows. Required columns: name, description.</p>
          <p>For nested properties use dot notation (e.g., location.lat, location.lng).</p>
        </div>
        
        <Textarea
          value={localCsv}
          onChange={(e) => handleCsvChange(e.target.value)}
          className="font-mono text-sm h-[600px]"
          disabled={isSubmitting}
        />
        
        <div className="flex justify-end">
          <Button 
            onClick={handleApplyChanges} 
            disabled={isSubmitting}
          >
            Apply Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}