'use client';

import { useState, useCallback, useEffect } from 'react';
import { Place, PlaceResults } from '@/types/place';
import slugify from 'slugify';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { savePlace, savePlaceResults } from '@/lib/services/client/places';

// Default empty place data
const defaultPlaceData: Partial<Place> = {
  name: '',
  slug: '',
  description: '',
  contacts: [],
  location: { lat: 0, lng: 0, name: '', street_address: '' },
  features: [],
  services: [],
  tags: [],
  accessibility: [],
  status: 'pending',
};

export function usePlaceForm() {
  const [formData, setFormData] = useState<Partial<Place>>(defaultPlaceData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonData, setJsonData] = useState('{}');
  const [csvData, setCsvData] = useState('');

  // Initialize form with default data
  useEffect(() => {
    updateJsonAndCsv(defaultPlaceData);
  }, []);

  // Update form data for a specific field
  const updateFormData = useCallback(
    <K extends keyof Place>(field: K, value: Place[K]) => {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };

        // Auto-generate slug from name
        if (field === 'name' && typeof value === 'string') {
          updated.slug = slugify(value, { lower: true, strict: true });
        }

        // Update JSON and CSV when form data changes
        updateJsonAndCsv(updated);

        return updated;
      });

      // Clear error for this field
      if (errors[field as string]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field as string];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Set initial data (used when editing)
  const setInitialData = useCallback((data: Partial<Place>) => {
    setFormData(data);
    updateJsonAndCsv(data);
  }, []);

  // Save PlaceResults directly to database
  const handleSavePlaceResults = useCallback(
    async (placeResult: PlaceResults, userId?: string) => {
      setIsSubmitting(true);
      try {
        const result = await savePlaceResults(placeResult, userId);
        return result;
      } catch (error) {
        console.error('Error saving place from PlaceResults:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  // Update JSON and CSV representations
  const updateJsonAndCsv = useCallback((data: Partial<Place>) => {
    // Update JSON
    setJsonData(JSON.stringify(data, null, 2));

    // Update CSV
    try {
      // Flatten the object for CSV
      const flattenedData = flattenObject(data);

      // Create CSV headers and values
      const headers = Object.keys(flattenedData);
      const values = headers.map((header) => flattenedData[header] ?? '');

      // Generate CSV
      const csv = stringify([headers, values]);
      setCsvData(csv);
    } catch (error) {
      console.error('Error generating CSV:', error);
    }
  }, []);

  // Update form from JSON
  const updateFromJson = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json);
      setFormData(parsed);

      // Update CSV when JSON changes
      try {
        const flattenedData = flattenObject(parsed);
        const headers = Object.keys(flattenedData);
        const values = headers.map((header) => flattenedData[header] ?? '');
        const csv = stringify([headers, values]);
        setCsvData(csv);
      } catch (csvError) {
        console.error('Error updating CSV from JSON:', csvError);
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
      throw error;
    }
  }, []);

  // Update form from CSV
  const updateFromCsv = useCallback((csv: string) => {
    try {
      // Parse CSV
      const [headers, ...rows] = parse(csv);

      if (rows.length === 0) {
        throw new Error('No data rows found in CSV');
      }

      // Convert to object
      const data: Record<string, any> = {};
      headers.forEach((header: string, index: number) => {
        if (rows[0][index] !== undefined && rows[0][index] !== '') {
          setNestedProperty(data, header, rows[0][index]);
        }
      });

      // Update form data
      setFormData(data as Partial<Place>);

      // Update JSON when CSV changes
      setJsonData(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error parsing CSV:', error);
      throw error;
    }
  }, []);

  // Import from JSON file
  const importFromJsonFile = useCallback(
    async (content: string) => {
      try {
        updateFromJson(content);
      } catch (error) {
        console.error('Error importing JSON file:', error);
        throw error;
      }
    },
    [updateFromJson]
  );

  // Import from CSV file
  const importFromCsvFile = useCallback(
    async (content: string) => {
      try {
        updateFromCsv(content);
      } catch (error) {
        console.error('Error importing CSV file:', error);
        throw error;
      }
    },
    [updateFromCsv]
  );

  // Validate form data
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name?.trim()) {
      newErrors.name = 'Place name is required';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.location?.lat || !formData.location?.lng) {
      newErrors.location = 'Location coordinates are required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (!formData.subcategory_id) {
      newErrors.subcategory_id = 'Subcategory is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Save place to database - now using the client-side function
  const handleSavePlace = useCallback(
    async (id?: string) => {
      if (!validateForm()) {
        throw new Error('Please fix the form errors before saving');
      }

      setIsSubmitting(true);

      try {
        const result = await savePlace(formData, id);
        return result;
      } catch (error) {
        console.error('Error saving place:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm]
  );

  return {
    formData,
    updateFormData,
    errors,
    isSubmitting,
    savePlace: handleSavePlace,
    savePlaceResults: handleSavePlaceResults,
    jsonData,
    csvData,
    updateFromJson,
    updateFromCsv,
    setInitialData,
    importFromJsonFile,
    importFromCsvFile,
  };
}

// Helper function to flatten nested objects for CSV
function flattenObject(obj: any, prefix = ''): Record<string, any> {
  return Object.keys(obj || {}).reduce(
    (acc: Record<string, any>, key: string) => {
      const pre = prefix.length ? `${prefix}.` : '';

      if (
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !Array.isArray(obj[key]) &&
        Object.keys(obj[key]).length > 0
      ) {
        Object.assign(acc, flattenObject(obj[key], pre + key));
      } else if (Array.isArray(obj[key])) {
        acc[pre + key] = JSON.stringify(obj[key]);
      } else {
        acc[pre + key] = obj[key];
      }

      return acc;
    },
    {}
  );
}

// Helper function to set nested properties
function setNestedProperty(obj: any, path: string, value: any) {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part]) {
      // Check if next part is a number (array index)
      current[part] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    }
    current = current[part];
  }

  const lastPart = parts[parts.length - 1];

  // Handle special cases
  if (value === 'true') {
    current[lastPart] = true;
  } else if (value === 'false') {
    current[lastPart] = false;
  } else if (value === 'null') {
    current[lastPart] = null;
  } else if (!isNaN(Number(value)) && value !== '') {
    current[lastPart] = Number(value);
  } else if (value.startsWith('[') && value.endsWith(']')) {
    try {
      current[lastPart] = JSON.parse(value);
    } catch {
      current[lastPart] = value;
    }
  } else if (value.startsWith('{') && value.endsWith('}')) {
    try {
      current[lastPart] = JSON.parse(value);
    } catch {
      current[lastPart] = value;
    }
  } else {
    current[lastPart] = value;
  }
}
