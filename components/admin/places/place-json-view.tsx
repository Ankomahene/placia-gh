'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Copy, Check, FileJson } from 'lucide-react';

interface PlaceJsonViewProps {
  jsonData: string;
  updateFromJson: (json: string) => void;
  isSubmitting: boolean;
}

export function PlaceJsonView({ jsonData, updateFromJson, isSubmitting }: PlaceJsonViewProps) {
  const [localJson, setLocalJson] = useState(jsonData);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLocalJson(jsonData);
  }, [jsonData]);

  const handleJsonChange = (value: string) => {
    setLocalJson(value);
    setError(null);
  };

  const handleApplyChanges = () => {
    try {
      // Validate JSON
      JSON.parse(localJson);
      updateFromJson(localJson);
      setError(null);
    } catch (err) {
      setError('Invalid JSON format. Please check your syntax.');
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(localJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(localJson);
      setLocalJson(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err) {
      setError('Invalid JSON format. Cannot format.');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5 text-blue-500" />
          JSON Editor
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={formatJson}
            disabled={isSubmitting}
          >
            Format JSON
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
        
        <Textarea
          value={localJson}
          onChange={(e) => handleJsonChange(e.target.value)}
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