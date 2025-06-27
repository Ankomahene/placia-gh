'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlaceJsonView } from './place-json-view';
import { PlaceCsvView } from './place-csv-view';
import { useDropzone } from 'react-dropzone';
import {
  FileJson,
  FileSpreadsheet,
  Upload,
  AlertCircle,
  Save,
  Loader2,
  Users,
  Star,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { Place } from '@/types/place';
import { savePlace, BatchSaveResult } from '@/lib/services/client/places';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import {
  PlaceNameField,
  PlaceTaglineField,
  PlaceDescriptionField,
  PlaceContactsField,
  PlaceEmailField,
  PlaceWebsiteField,
  PlaceSocialsField,
  PlaceLocationField,
  PlaceCategoryField,
  PlaceSubcategoryField,
  PlaceTypeField,
  PlaceOwnershipField,
  PlaceOpenHoursField,
  PlaceFeaturesField,
  PlaceServicesField,
  PlaceAccessibilityField,
  PlaceTagsField,
  PlaceImageField,
  PlaceGalleryField,
  PlaceSourceField,
  PlaceSourceLinkField,
  PlaceCountryField,
  PlaceRegionField,
  PlaceCityField,
  PlaceTownField,
} from '@/components/place-form-components';
import { useCategories } from '@/hooks/admin/use-categories';
import { useSubcategories } from '@/hooks/admin/use-subcategories';
import { useTypes } from '@/hooks/admin/use-types';
import { useOwnerships } from '@/hooks/admin/use-ownerships';

// Browser storage keys
const STORAGE_KEYS = {
  PLACES: 'placia-import-places',
  CURRENT_INDEX: 'placia-import-current-index',
  SAVED_PLACE_IDS: 'placia-import-saved-ids',
  VALIDATION_SIDEBAR: 'placia-import-validation-sidebar',
} as const;

// Place tracking interface
interface TrackedPlace extends Partial<Place> {
  _importId: string; // Unique ID for tracking during import
  _isSaved: boolean; // Whether this place has been saved to database
  _validationErrors: Record<string, string>; // Current validation errors
}

// Storage utilities
const storage = {
  save: (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },
  load: <T,>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return defaultValue;
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },
  clear: () => {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  },
};

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
  country_id: '',
  region_id: '',
  city_id: '',
  category_id: '',
  subcategory_id: '',
  isBusinessPlace: false,
  isFeatured: false,
};

export function PlacesImport() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('form');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showValidationSidebar, setShowValidationSidebar] = useState(
    storage.load(STORAGE_KEYS.VALIDATION_SIDEBAR, false)
  );

  // Support for multiple tracked places with save status
  const [places, setPlaces] = useState<TrackedPlace[]>(() => {
    const savedPlaces = storage.load<TrackedPlace[]>(STORAGE_KEYS.PLACES, []);
    if (savedPlaces.length > 0) {
      return savedPlaces;
    }
    return [
      {
        ...defaultPlaceData,
        _importId: uuidv4(),
        _isSaved: false,
        _validationErrors: {},
      },
    ];
  });

  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(() =>
    storage.load(STORAGE_KEYS.CURRENT_INDEX, 0)
  );
  const [jsonData, setJsonData] = useState('');
  const [csvData, setCsvData] = useState('');

  // Current place being edited
  const currentPlace = places[currentPlaceIndex] || places[0];

  // Data fetching hooks
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: subcategories, isLoading: subcategoriesLoading } =
    useSubcategories(currentPlace.category_id);
  const { data: types, isLoading: typesLoading } = useTypes(
    currentPlace.subcategory_id
  );
  const { ownerships, isLoading: ownershipsLoading } = useOwnerships();

  // Save state to storage whenever it changes
  useEffect(() => {
    storage.save(STORAGE_KEYS.PLACES, places);
    storage.save(STORAGE_KEYS.CURRENT_INDEX, currentPlaceIndex);
    storage.save(STORAGE_KEYS.VALIDATION_SIDEBAR, showValidationSidebar);
  }, [places, currentPlaceIndex, showValidationSidebar]);

  // Initialize JSON and CSV data
  useEffect(() => {
    updateJsonAndCsv();
  }, [places]);

  // Validate current place whenever it changes
  useEffect(() => {
    if (currentPlace && currentPlace.name) {
      validateCurrentPlace();
    }
  }, [
    currentPlaceIndex,
    currentPlace?.name,
    currentPlace?.category_id,
    currentPlace?.subcategory_id,
    currentPlace?.country_id,
    currentPlace?.region_id,
    currentPlace?.city_id,
  ]);

  // Flatten object for CSV conversion
  const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
    const flattened: Record<string, any> = {};

    Object.keys(obj).forEach((key) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (value === null || value === undefined) {
        flattened[newKey] = '';
      } else if (Array.isArray(value)) {
        flattened[newKey] = JSON.stringify(value);
      } else if (typeof value === 'object' && !(value instanceof Date)) {
        Object.assign(flattened, flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    });

    return flattened;
  };

  // Set nested property in object
  const setNestedProperty = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;

    let current = obj;
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    // Parse JSON strings for arrays/objects
    if (
      typeof value === 'string' &&
      (value.startsWith('[') || value.startsWith('{'))
    ) {
      try {
        current[lastKey] = JSON.parse(value);
      } catch {
        current[lastKey] = value;
      }
    } else {
      current[lastKey] = value;
    }
  };

  // Update JSON and CSV representations
  const updateJsonAndCsv = useCallback(() => {
    try {
      // Update JSON
      const dataToExport = places.length === 1 ? places[0] : places;
      setJsonData(JSON.stringify(dataToExport, null, 2));

      // Update CSV (use first place for CSV structure)
      if (places.length > 0) {
        const flattenedData = places.map((place) => flattenObject(place));

        if (flattenedData.length > 0) {
          const allKeys = new Set<string>();
          flattenedData.forEach((item) => {
            Object.keys(item).forEach((key) => allKeys.add(key));
          });

          const headers = Array.from(allKeys);
          const rows = flattenedData.map((item) =>
            headers.map((header) => item[header] ?? '')
          );

          const csv = stringify([headers, ...rows]);
          setCsvData(csv);
        }
      }
    } catch (error) {
      console.error('Error updating JSON/CSV:', error);
    }
  }, [places]);

  // Update form data for current place
  const updateFormData = useCallback(
    <K extends keyof Place>(field: K, value: Place[K]) => {
      setPlaces((prevPlaces) => {
        const newPlaces = [...prevPlaces];
        const currentTrackedPlace = newPlaces[currentPlaceIndex];

        const updatedPlace: TrackedPlace = {
          ...currentTrackedPlace,
          [field]: value,
        };

        // Auto-generate slug from name
        if (field === 'name' && typeof value === 'string') {
          updatedPlace.slug = slugify(value, { lower: true, strict: true });
        }

        newPlaces[currentPlaceIndex] = updatedPlace;
        return newPlaces;
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
    [currentPlaceIndex, errors]
  );

  // Transform imported place data to ensure required fields and add tracking
  const transformPlaceData = useCallback((rawPlace: any): TrackedPlace => {
    const transformed = { ...rawPlace };

    // Generate or preserve place ID
    if (!transformed.id) {
      transformed.id = uuidv4();
    }

    // Add tracking fields
    const _importId = transformed._importId || uuidv4();
    const _isSaved = transformed._isSaved || false;
    const _validationErrors = transformed._validationErrors || {};

    // Convert numeric location IDs from imported data to strings for form consistency
    if (transformed.country_id && typeof transformed.country_id === 'number') {
      transformed.country_id = transformed.country_id.toString();
    } else if (!transformed.country_id) {
      transformed.country_id = '';
    }

    if (transformed.region_id && typeof transformed.region_id === 'number') {
      transformed.region_id = transformed.region_id.toString();
    } else if (!transformed.region_id) {
      transformed.region_id = '';
    }

    if (transformed.city_id && typeof transformed.city_id === 'number') {
      transformed.city_id = transformed.city_id.toString();
    } else if (!transformed.city_id) {
      transformed.city_id = '';
    }

    if (transformed.town_id && typeof transformed.town_id === 'number') {
      transformed.town_id = transformed.town_id.toString();
    } else if (transformed.town_id === '' || transformed.town_id === null) {
      transformed.town_id = undefined;
    }

    // Ensure required string fields have valid values
    if (
      !transformed.category_id ||
      typeof transformed.category_id !== 'string'
    ) {
      transformed.category_id = '';
    }
    if (
      !transformed.subcategory_id ||
      typeof transformed.subcategory_id !== 'string'
    ) {
      transformed.subcategory_id = '';
    }

    // Handle optional UUID fields
    if (transformed.type_id === '' || transformed.type_id === null) {
      transformed.type_id = undefined;
    }
    if (transformed.ownership_id === '' || transformed.ownership_id === null) {
      transformed.ownership_id = undefined;
    }

    // Ensure arrays are properly initialized
    if (!Array.isArray(transformed.contacts)) {
      transformed.contacts = [];
    }
    if (!Array.isArray(transformed.features)) {
      transformed.features = [];
    }
    if (!Array.isArray(transformed.services)) {
      transformed.services = [];
    }
    if (!Array.isArray(transformed.tags)) {
      transformed.tags = [];
    }
    if (!Array.isArray(transformed.accessibility)) {
      transformed.accessibility = [];
    }
    if (!Array.isArray(transformed.gallery)) {
      transformed.gallery = [];
    }

    // Ensure location object is properly structured
    if (!transformed.location || typeof transformed.location !== 'object') {
      transformed.location = { lat: 0, lng: 0, name: '', street_address: '' };
    } else {
      if (typeof transformed.location.lat !== 'number')
        transformed.location.lat = 0;
      if (typeof transformed.location.lng !== 'number')
        transformed.location.lng = 0;
      if (!transformed.location.name) transformed.location.name = '';
      if (!transformed.location.street_address)
        transformed.location.street_address = '';
    }

    // Set defaults for other required fields
    if (!transformed.name) transformed.name = '';
    if (!transformed.description) transformed.description = '';
    if (!transformed.slug) transformed.slug = '';
    if (!transformed.status) transformed.status = 'pending';
    if (!transformed.added_by) transformed.added_by = 'admin';

    // Handle boolean fields
    transformed.isBusinessPlace = Boolean(transformed.isBusinessPlace);
    transformed.isFeatured = Boolean(transformed.isFeatured);

    return {
      ...transformed,
      _importId,
      _isSaved,
      _validationErrors,
    };
  }, []);

  // Update from JSON with data transformation
  const updateFromJson = useCallback(
    (json: string) => {
      try {
        const parsed = JSON.parse(json);

        // Clear existing storage for new import
        storage.clear();

        let transformedPlaces: TrackedPlace[];
        if (Array.isArray(parsed)) {
          transformedPlaces = parsed.map(transformPlaceData);
        } else {
          transformedPlaces = [transformPlaceData(parsed)];
        }

        setPlaces(transformedPlaces);
        setCurrentPlaceIndex(0);
        setJsonData(json);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        throw new Error('Invalid JSON format');
      }
    },
    [transformPlaceData]
  );

  // Update from CSV
  const updateFromCsv = useCallback(
    (csv: string) => {
      try {
        const [headers, ...rows] = parse(csv);

        if (rows.length === 0) {
          throw new Error('No data rows found in CSV');
        }

        // Clear existing storage for new import
        storage.clear();

        const parsedPlaces = rows.map((row: any[]) => {
          const data: Record<string, any> = {};
          headers.forEach((header: string, index: number) => {
            if (row[index] !== undefined && row[index] !== '') {
              setNestedProperty(data, header, row[index]);
            }
          });
          return transformPlaceData(data);
        });

        setPlaces(parsedPlaces);
        setCurrentPlaceIndex(0);
        setCsvData(csv);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        throw new Error('Invalid CSV format');
      }
    },
    [transformPlaceData]
  );

  // Dropzone handlers
  const onDropJson = useCallback(
    (acceptedFiles: File[]) => {
      setFileError(null);
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          updateFromJson(content);
          setActiveTab('json');
          toast.success(
            `JSON file imported successfully! ${places.length > 1 ? `Found ${places.length} places.` : ''}`
          );
        } catch (error) {
          console.error('JSON import error:', error);
          setFileError(
            'Invalid JSON file format. Please check your file and try again.'
          );
        }
      };
      reader.readAsText(file);
    },
    [updateFromJson, places.length]
  );

  const onDropCsv = useCallback(
    (acceptedFiles: File[]) => {
      setFileError(null);
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          updateFromCsv(content);
          setActiveTab('csv');
          toast.success(
            `CSV file imported successfully! ${places.length > 1 ? `Found ${places.length} places.` : ''}`
          );
        } catch (error) {
          console.error('CSV import error:', error);
          setFileError(
            'Invalid CSV file format. Please check your file and try again.'
          );
        }
      };
      reader.readAsText(file);
    },
    [updateFromCsv, places.length]
  );

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

  // Comprehensive validation function
  const validatePlace = useCallback((place: TrackedPlace) => {
    const newErrors: Record<string, string> = {};

    // Basic required fields
    if (!place.name?.trim()) {
      newErrors.name = 'Place name is required';
    }

    if (!place.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    // Location validation
    if (!place.location?.lat || !place.location?.lng) {
      newErrors.location = 'Location coordinates are required';
    }

    // Required location fields (string UUIDs or converted from numbers)
    if (!place.country_id || place.country_id === '') {
      newErrors.country_id = 'Country is required';
    }

    if (!place.region_id || place.region_id === '') {
      newErrors.region_id = 'Region is required';
    }

    if (!place.city_id || place.city_id === '') {
      newErrors.city_id = 'City is required';
    }

    // Required UUID fields
    if (!place.category_id || place.category_id === '') {
      newErrors.category_id =
        'Category is required - missing category_id field';
    }

    if (!place.subcategory_id || place.subcategory_id === '') {
      newErrors.subcategory_id =
        'Subcategory is required - missing subcategory_id field';
    }

    // Validate UUID format for category fields
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (place.category_id && !uuidRegex.test(place.category_id)) {
      newErrors.category_id = 'Invalid category ID format';
    }

    if (place.subcategory_id && !uuidRegex.test(place.subcategory_id)) {
      newErrors.subcategory_id = 'Invalid subcategory ID format';
    }

    // Optional UUID fields validation (if provided)
    if (
      place.type_id &&
      place.type_id !== '' &&
      !uuidRegex.test(place.type_id)
    ) {
      newErrors.type_id = 'Invalid type ID format';
    }

    if (
      place.ownership_id &&
      place.ownership_id !== '' &&
      !uuidRegex.test(place.ownership_id)
    ) {
      newErrors.ownership_id = 'Invalid ownership ID format';
    }

    // Validate email format if provided
    if (place.email && place.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(place.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    // Validate website URL if provided
    if (place.website && place.website.trim()) {
      try {
        new URL(place.website);
      } catch {
        newErrors.website = 'Invalid website URL format';
      }
    }

    // Validate contacts array
    if (place.contacts && Array.isArray(place.contacts)) {
      const invalidContacts = place.contacts.filter(
        (contact) => !contact || !contact.trim()
      );
      if (invalidContacts.length > 0) {
        newErrors.contacts = 'All contact entries must be non-empty';
      }
    }

    return newErrors;
  }, []);

  // Update validation for current place and track in place state
  const validateCurrentPlace = useCallback(() => {
    const newErrors = validatePlace(currentPlace);
    setErrors(newErrors);

    // Update validation errors in place state
    setPlaces((prevPlaces) => {
      const updated = [...prevPlaces];
      updated[currentPlaceIndex] = {
        ...updated[currentPlaceIndex],
        _validationErrors: newErrors,
      };
      return updated;
    });

    return Object.keys(newErrors).length === 0;
  }, [currentPlace, validatePlace, currentPlaceIndex]);

  // Validate all places and update their validation states
  const validateAllPlaces = useCallback(() => {
    const allErrors: Array<{
      index: number;
      errors: Record<string, string>;
      place: TrackedPlace;
    }> = [];

    const updatedPlaces = places.map((place, index) => {
      const errors = validatePlace(place);
      if (Object.keys(errors).length > 0) {
        allErrors.push({ index, errors, place });
      }
      return {
        ...place,
        _validationErrors: errors,
      };
    });

    setPlaces(updatedPlaces);
    return allErrors;
  }, [places, validatePlace]);

  // Trigger validation when component loads or places change
  useEffect(() => {
    if (places.length > 0) {
      // Use setTimeout to avoid setting state during render
      const timer = setTimeout(() => {
        validateAllPlaces();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [places.length, validateAllPlaces]);

  // Initial validation on component mount (for places loaded from storage)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (places.length > 0 && places[0].name) {
        validateAllPlaces();
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [validateAllPlaces]); // Add dependency to avoid stale closure

  // Convert place data for database saving (string UUIDs to numeric foreign keys)
  const prepareForDatabase = useCallback((place: TrackedPlace) => {
    // Remove tracking fields and create clean database object
    const { _importId, _isSaved, _validationErrors, ...dbPlace } = place;

    // Convert string location IDs to numbers for database foreign keys
    // Note: This assumes the string IDs are numeric. For UUID-to-number mapping,
    // you would need a lookup function to get the corresponding int8 values
    if (dbPlace.country_id && typeof dbPlace.country_id === 'string') {
      const numericId = parseInt(dbPlace.country_id, 10);
      if (!isNaN(numericId)) {
        dbPlace.country_id = numericId as any; // Type assertion for database compatibility
      }
    }

    if (dbPlace.region_id && typeof dbPlace.region_id === 'string') {
      const numericId = parseInt(dbPlace.region_id, 10);
      if (!isNaN(numericId)) {
        dbPlace.region_id = numericId as any;
      }
    }

    if (dbPlace.city_id && typeof dbPlace.city_id === 'string') {
      const numericId = parseInt(dbPlace.city_id, 10);
      if (!isNaN(numericId)) {
        dbPlace.city_id = numericId as any;
      }
    }

    return dbPlace;
  }, []);

  // Save current place
  const handleSave = async () => {
    if (!validateCurrentPlace()) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    setIsSubmitting(true);
    try {
      const placeToSave = prepareForDatabase({
        ...currentPlace,
        added_by: 'admin',
      });

      const savedPlace = (await savePlace(
        placeToSave,
        'admin'
      )) as Place | null;

      if (savedPlace) {
        // Mark as saved and update in state
        setPlaces((prevPlaces) => {
          const updated = [...prevPlaces];
          updated[currentPlaceIndex] = {
            ...updated[currentPlaceIndex],
            id: savedPlace.id,
            _isSaved: true,
            _validationErrors: {},
          };
          return updated;
        });

        const actionText = currentPlace._isSaved
          ? 'updated'
          : 'imported and saved';
        toast.success(`Place ${actionText} successfully!`);

        // If multiple places, move to next one or go back to manager
        if (places.length > 1 && currentPlaceIndex < places.length - 1) {
          setCurrentPlaceIndex((prev) => prev + 1);
          toast.info(
            `Moved to place ${currentPlaceIndex + 2} of ${places.length}`
          );
        } else {
          // Clear storage on completion
          storage.clear();
          router.push('/admin/places-manager');
        }
      } else {
        throw new Error('Failed to save place');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(
        `Failed to ${currentPlace._isSaved ? 'update' : 'save'} place`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save all places at once
  const handleSaveAll = async () => {
    // Validate all places first
    const validationErrors = validateAllPlaces();

    if (validationErrors.length > 0) {
      const errorSummary = validationErrors
        .map(
          ({ index, errors, place }) =>
            `Place ${index + 1} (${place.name || 'Unnamed'}): ${Object.keys(errors).join(', ')}`
        )
        .join('\n');

      toast.error(
        `Validation failed for ${validationErrors.length} place(s):\n${errorSummary}`
      );

      // Set errors for the first invalid place and navigate to it
      setCurrentPlaceIndex(validationErrors[0].index);
      setErrors(validationErrors[0].errors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare places for batch save with database conversion
      const placesToSave = places.map((place) =>
        prepareForDatabase({
          ...place,
          added_by: 'admin',
        })
      );

      // Use the new batch save functionality
      const batchResult = (await savePlace(
        placesToSave,
        'admin'
      )) as BatchSaveResult;

      // Handle results and mark places as saved
      if (batchResult.successCount > 0) {
        setPlaces((prevPlaces) =>
          prevPlaces.map((place, index) => {
            // Check if this place was successful by looking at successful array
            const wasSuccessful = batchResult.successful.some(
              (successful) =>
                successful.id === place.id || successful.name === place.name
            );
            if (wasSuccessful) {
              return {
                ...place,
                _isSaved: true,
                _validationErrors: {},
              };
            }
            return place;
          })
        );

        toast.success(
          `Successfully saved ${batchResult.successCount} place(s)!`
        );
      }

      if (batchResult.errorCount > 0) {
        toast.error(`Failed to save ${batchResult.errorCount} place(s)`);

        // Log detailed errors for debugging
        batchResult.failed.forEach((failure, index) => {
          console.error(`Failed to save place ${index + 1}:`, failure.error);
        });
      }

      // Navigate back if at least one place was saved successfully
      if (batchResult.successCount > 0) {
        // Clear storage on completion
        storage.clear();
        router.push('/admin/places-manager');
      }
    } catch (error) {
      console.error('Batch save error:', error);
      toast.error('Failed to save places');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasData = places.length > 0 && places[0].name;

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div
        className={`flex-1 space-y-6 ${showValidationSidebar && hasData ? 'mr-80' : ''}`}
      >
        {/* Import Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className={`border-2 ${jsonDropzone.isDragActive ? 'border-primary' : 'border-dashed'}`}
          >
            <div {...jsonDropzone.getRootProps()} className="cursor-pointer">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileJson className="h-5 w-5 text-blue-500" />
                  Import JSON
                </CardTitle>
                <CardDescription>
                  Upload a JSON file with place data
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <input {...jsonDropzone.getInputProps()} />
                <div className="text-center">
                  <div className="mx-auto bg-muted rounded-full p-3 w-12 h-12 flex items-center justify-center mb-3">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">
                    {jsonDropzone.isDragActive
                      ? 'Drop the JSON file here'
                      : 'Drag & drop a JSON file here, or click to select'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports single place or array of places
                  </p>
                </div>
              </CardContent>
            </div>
          </Card>

          <Card
            className={`border-2 ${csvDropzone.isDragActive ? 'border-primary' : 'border-dashed'}`}
          >
            <div {...csvDropzone.getRootProps()} className="cursor-pointer">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileSpreadsheet className="h-5 w-5 text-green-500" />
                  Import CSV
                </CardTitle>
                <CardDescription>
                  Upload a CSV file with place data
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <input {...csvDropzone.getInputProps()} />
                <div className="text-center">
                  <div className="mx-auto bg-muted rounded-full p-3 w-12 h-12 flex items-center justify-center mb-3">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">
                    {csvDropzone.isDragActive
                      ? 'Drop the CSV file here'
                      : 'Drag & drop a CSV file here, or click to select'}
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

        {hasData && (
          <div className="space-y-6">
            {/* Header with place navigation and save buttons */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">Preview Imported Data</h2>
                {places.length > 1 && (
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Users className="h-3 w-3" />
                      {places.length} places imported
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPlaceIndex(
                            Math.max(0, currentPlaceIndex - 1)
                          )
                        }
                        disabled={currentPlaceIndex === 0}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {currentPlaceIndex + 1} of {places.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPlaceIndex(
                            Math.min(places.length - 1, currentPlaceIndex + 1)
                          )
                        }
                        disabled={currentPlaceIndex === places.length - 1}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {places.length > 1 && (
                  <Button
                    onClick={handleSaveAll}
                    disabled={isSubmitting}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving All...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save All Places
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                  variant={currentPlace._isSaved ? 'secondary' : 'default'}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {currentPlace._isSaved ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      {currentPlace._isSaved ? (
                        <RotateCcw className="h-4 w-4" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {currentPlace._isSaved
                        ? `Update ${places.length > 1 ? 'Current ' : ''}Place`
                        : `Save ${places.length > 1 ? 'Current ' : ''}Place`}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Current place info */}
            {places.length > 1 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {currentPlace.name || 'Unnamed Place'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {currentPlace.description?.substring(0, 100)}
                        {currentPlace.description &&
                        currentPlace.description.length > 100
                          ? '...'
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentPlace._isSaved && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Saved
                        </Badge>
                      )}
                      {currentPlace.isFeatured && (
                        <Badge
                          variant="default"
                          className="flex items-center gap-1"
                        >
                          <Star className="h-3 w-3" />
                          Featured
                        </Badge>
                      )}
                      {currentPlace.isBusinessPlace && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          <Users className="h-3 w-3" />
                          Business
                        </Badge>
                      )}
                      <Badge
                        variant={
                          Object.keys(errors).length === 0
                            ? 'default'
                            : 'destructive'
                        }
                        className="flex items-center gap-1"
                      >
                        {Object.keys(errors).length === 0 ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Valid
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            {Object.keys(errors).length} errors
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Validation errors */}
            {Object.keys(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">
                      Please fix the following validation errors:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(errors).map(([field, message]) => (
                        <li key={field} className="text-sm">
                          <span className="font-medium">{field}:</span>{' '}
                          {message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Tabs for different views */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="form">Form View</TabsTrigger>
                <TabsTrigger value="json">JSON View</TabsTrigger>
                <TabsTrigger value="csv">CSV View</TabsTrigger>
              </TabsList>

              <TabsContent value="form" className="mt-6">
                <PlaceFormView
                  formData={currentPlace}
                  updateFormData={updateFormData}
                  errors={errors}
                  categories={categories}
                  subcategories={subcategories}
                  types={types}
                  ownerships={ownerships}
                  categoriesLoading={categoriesLoading}
                  subcategoriesLoading={subcategoriesLoading}
                  typesLoading={typesLoading}
                  ownershipsLoading={ownershipsLoading}
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

      {/* Validation Sidebar */}
      {hasData && (
        <div
          className={`fixed right-0 top-0 h-full w-80 bg-background border-l border-border z-50 transform transition-transform ${
            showValidationSidebar ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <ValidationSidebar
            places={places}
            currentPlaceIndex={currentPlaceIndex}
            onNavigateToPlace={setCurrentPlaceIndex}
            onClose={() => setShowValidationSidebar(false)}
          />
        </div>
      )}

      {/* Validation Sidebar Toggle */}
      {hasData && (
        <Button
          onClick={() => setShowValidationSidebar(!showValidationSidebar)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2"
          variant={showValidationSidebar ? 'secondary' : 'default'}
        >
          {showValidationSidebar ? (
            <>
              <EyeOff className="h-4 w-4" />
              Hide Errors
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              View Errors (
              {
                places.filter(
                  (p) => Object.keys(p._validationErrors).length > 0
                ).length
              }
              )
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Validation Sidebar Component
function ValidationSidebar({
  places,
  currentPlaceIndex,
  onNavigateToPlace,
  onClose,
}: {
  places: TrackedPlace[];
  currentPlaceIndex: number;
  onNavigateToPlace: (index: number) => void;
  onClose: () => void;
}) {
  const placesWithErrors = places
    .map((place, index) => ({
      index,
      place,
      errorCount: Object.keys(place._validationErrors).length,
      errors: place._validationErrors,
    }))
    .filter((item) => item.errorCount > 0);

  const totalErrors = placesWithErrors.reduce(
    (sum, item) => sum + item.errorCount,
    0
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Validation Errors</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {totalErrors} total errors
          </Badge>
          <Badge variant="secondary">
            {placesWithErrors.length} places affected
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 h-[calc(100vh-100px)]">
        {placesWithErrors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p>All places are valid!</p>
            <p className="text-sm">No validation errors found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {placesWithErrors.map(({ index, place, errorCount, errors }) => (
              <Card
                key={place._importId}
                className={`cursor-pointer transition-colors ${
                  index === currentPlaceIndex
                    ? 'ring-2 ring-primary'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onNavigateToPlace(index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        Place {index + 1}
                        {place._isSaved && (
                          <Badge variant="outline" className="ml-2">
                            Saved
                          </Badge>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {place.name || 'Unnamed Place'}
                      </p>
                    </div>
                    <Badge variant="destructive">{errorCount} errors</Badge>
                  </div>

                  <div className="space-y-1">
                    {Object.entries(errors).map(([field, message]) => (
                      <div key={field} className="text-xs">
                        <span className="font-medium text-destructive">
                          {field}:
                        </span>{' '}
                        <span className="text-muted-foreground">{message}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {placesWithErrors.length > 0 && (
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Click on a place to navigate and fix its errors.
          </p>
        </div>
      )}
    </div>
  );
}

// Enhanced PlaceFormView component with all fields
function PlaceFormView({
  formData,
  updateFormData,
  errors,
  categories,
  subcategories,
  types,
  ownerships,
  categoriesLoading,
  subcategoriesLoading,
  typesLoading,
  ownershipsLoading,
}: {
  formData: Partial<Place>;
  updateFormData: <K extends keyof Place>(field: K, value: Place[K]) => void;
  errors: Record<string, string>;
  categories?: any[];
  subcategories?: any[];
  types?: any[];
  ownerships?: any[];
  categoriesLoading?: boolean;
  subcategoriesLoading?: boolean;
  typesLoading?: boolean;
  ownershipsLoading?: boolean;
}) {
  const [activeTab, setActiveTab] = useState('basic');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="category">Category</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <PlaceNameField
                value={formData.name || ''}
                onChange={(value) => updateFormData('name', value)}
                error={errors.name}
              />

              <PlaceTaglineField
                value={formData.tagline}
                onChange={(value) => updateFormData('tagline', value)}
                error={errors.tagline}
              />

              <PlaceDescriptionField
                value={formData.description || ''}
                onChange={(value) => updateFormData('description', value)}
                error={errors.description}
                required
              />

              <Separator />

              <PlaceContactsField
                value={formData.contacts}
                onChange={(value) => updateFormData('contacts', value)}
                error={errors.contacts}
              />

              <PlaceEmailField
                value={formData.email}
                onChange={(value) => updateFormData('email', value)}
                error={errors.email}
              />

              <PlaceWebsiteField
                value={formData.website}
                onChange={(value) => updateFormData('website', value)}
                error={errors.website}
              />

              <PlaceSocialsField
                value={formData.socials}
                onChange={(value) => updateFormData('socials', value)}
                error={errors.socials}
              />

              <Separator />

              {/* Business and Featured checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isBusinessPlace"
                    checked={formData.isBusinessPlace || false}
                    onCheckedChange={(checked) =>
                      updateFormData('isBusinessPlace', checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="isBusinessPlace"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Business Place
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFeatured"
                    checked={formData.isFeatured || false}
                    onCheckedChange={(checked) =>
                      updateFormData('isFeatured', checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="isFeatured"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Featured Place
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <PlaceCountryField
                value={formData.country_id || ''}
                onChange={(value) => updateFormData('country_id', value || '')}
                error={errors.country_id}
                required
              />

              {formData.country_id && (
                <PlaceRegionField
                  value={formData.region_id || ''}
                  onChange={(value) => updateFormData('region_id', value || '')}
                  error={errors.region_id}
                  countryId={formData.country_id}
                />
              )}

              {formData.region_id && (
                <PlaceCityField
                  value={formData.city_id || ''}
                  onChange={(value) => updateFormData('city_id', value || '')}
                  error={errors.city_id}
                  regionId={formData.region_id}
                />
              )}

              <PlaceLocationField
                value={formData.location}
                onChange={(value) => updateFormData('location', value)}
                error={errors.location}
                required
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Tab */}
        <TabsContent value="category" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <PlaceCategoryField
                value={formData.category_id || ''}
                onChange={(value) => updateFormData('category_id', value)}
                error={errors.category_id}
                categories={categories}
                loading={categoriesLoading}
              />

              <PlaceSubcategoryField
                value={formData.subcategory_id || ''}
                onChange={(value) => updateFormData('subcategory_id', value)}
                error={errors.subcategory_id}
                subcategories={subcategories}
                loading={subcategoriesLoading}
                disabled={!formData.category_id}
              />

              <PlaceTypeField
                value={formData.type_id || ''}
                onChange={(value) => updateFormData('type_id', value)}
                error={errors.type_id}
                types={types}
                loading={typesLoading}
                disabled={!formData.subcategory_id}
              />

              <PlaceOwnershipField
                value={formData.ownership_id || ''}
                onChange={(value) => updateFormData('ownership_id', value)}
                error={errors.ownership_id}
                ownerships={ownerships}
                loading={ownershipsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Operating Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <PlaceOpenHoursField
                value={formData.open_hours}
                onChange={(value) => updateFormData('open_hours', value)}
                error={errors.open_hours}
              />

              <Separator />

              <PlaceFeaturesField
                value={formData.features}
                onChange={(value) => updateFormData('features', value)}
                error={errors.features}
              />

              <PlaceServicesField
                value={formData.services}
                onChange={(value) => updateFormData('services', value)}
                error={errors.services}
              />

              <PlaceAccessibilityField
                value={formData.accessibility}
                onChange={(value) => updateFormData('accessibility', value)}
                error={errors.accessibility}
              />

              <PlaceTagsField
                value={formData.tags}
                onChange={(value) => updateFormData('tags', value)}
                error={errors.tags}
              />

              <Separator />

              <PlaceSourceField
                value={formData.source}
                onChange={(value) => updateFormData('source', value)}
                error={errors.source}
              />

              <PlaceSourceLinkField
                value={formData.source_link}
                onChange={(value) => updateFormData('source_link', value)}
                error={errors.source_link}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Images & Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <PlaceImageField
                value={formData.main_image}
                onChange={(value) => updateFormData('main_image', value)}
                error={errors.main_image}
                label="Main Image"
              />

              <PlaceImageField
                value={formData.logo}
                onChange={(value) => updateFormData('logo', value)}
                error={errors.logo}
                label="Logo"
                variant="logo"
              />

              <PlaceGalleryField
                value={formData.gallery}
                onChange={(value) => updateFormData('gallery', value)}
                error={errors.gallery}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
