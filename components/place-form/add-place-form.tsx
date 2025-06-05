'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { StepIndicator } from './step-indicator';
import { CategorySelectionStep } from './category-selection-step';
import {
  PlaceNameField,
  PlaceTaglineField,
  PlaceDescriptionField,
  PlaceContactsField,
  PlaceEmailField,
  PlaceIconField,
  PlaceImageField,
  PlaceGalleryField,
  PlaceLocationField,
  PlaceWebsiteField,
  PlaceSocialsField,
  PlaceOpenHoursField,
  PlaceFeaturesField,
  PlaceServicesField,
  PlaceAccessibilityField,
  PlaceTagsField,
  PlaceOtherDetailsField,
  PlaceSourceField,
  PlaceSourceLinkField,
  PlaceCountryField,
  PlaceRegionField,
  PlaceCityField,
  PlaceTownField,
} from '@/components/place-form-components';
import { Place } from '@/types/place';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import slugify from 'slugify';

const steps = [
  {
    id: 1,
    title: 'Category',
    description: 'Choose category & type',
  },
  {
    id: 2,
    title: 'Basic Info',
    description: 'Name & description',
  },
  {
    id: 3,
    title: 'Location',
    description: 'Address & coordinates',
  },
  {
    id: 4,
    title: 'Details',
    description: 'Hours & features',
  },
  {
    id: 5,
    title: 'Additional',
    description: 'Media & extras',
  },
];

interface AddPlaceFormProps {
  onSuccess?: (placeId: string) => void;
  onCancel?: () => void;
}

export function AddPlaceForm({ onSuccess, onCancel }: AddPlaceFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>('anonymous');

  const [formData, setFormData] = useState<Partial<Place>>({
    name: '',
    tagline: '',
    description: '',
    contacts: [],
    email: '',
    icon: '',
    logo: '',
    main_image: '',
    gallery: [],
    country_id: '',
    region_id: '',
    city_id: '',
    town_id: '',
    location: { lng: 0, lat: 0, name: '', street_address: '' },
    website: '',
    socials: [],
    category_id: '',
    subcategory_id: '',
    type_id: '',
    ownership_id: '',
    open_hours: [],
    features: [],
    services: [],
    tags: [],
    accessibility: [],
    other_details: {},
    source: '',
    source_link: '',
    status: 'pending',
    added_by: 'anonymous',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setFormData((prev) => ({ ...prev, added_by: user.id }));
      }
    };
    getCurrentUser();
  }, []);

  const updateField = <K extends keyof Place>(field: K, value: Place[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate slug from name
    if (field === 'name' && typeof value === 'string') {
      const slug = slugify(value, { lower: true, strict: true });
      setFormData((prev) => ({ ...prev, slug }));
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Category Selection
        if (!formData.category_id) {
          newErrors.category_id = 'Please select a category';
        }
        if (!formData.subcategory_id) {
          newErrors.subcategory_id = 'Please select a subcategory';
        }
        break;

      case 2: // Basic Info
        if (!formData.name?.trim()) {
          newErrors.name = 'Place name is required';
        }
        if (!formData.description?.trim()) {
          newErrors.description = 'Place description is required';
        }
        break;

      case 3: // Location
        if (!formData.country_id) {
          newErrors.country_id = 'Country is required';
        }
        if (!formData.region_id) {
          newErrors.region_id = 'Region is required';
        }
        if (!formData.city_id) {
          newErrors.city_id = 'City is required';
        }
        if (!formData.location?.lat || !formData.location?.lng) {
          newErrors.location = 'Location coordinates are required';
        }
        break;

      case 4: // Details (optional validation can be added)
        break;

      case 5: // Additional (optional validation can be added)
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    // Validate all required fields before submission
    const allErrors: Record<string, string> = {};

    if (!formData.name?.trim()) allErrors.name = 'Place name is required';
    if (!formData.description?.trim())
      allErrors.description = 'Place description is required';
    if (!formData.category_id) allErrors.category_id = 'Category is required';
    if (!formData.subcategory_id)
      allErrors.subcategory_id = 'Subcategory is required';
    if (!formData.country_id) allErrors.country_id = 'Country is required';
    if (!formData.region_id) allErrors.region_id = 'Region is required';
    if (!formData.city_id) allErrors.city_id = 'City is required';
    if (!formData.location?.lat || !formData.location?.lng) {
      allErrors.location = 'Location coordinates are required';
    }

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Prepare data for submission
      const placeData = {
        ...formData,
        slug:
          formData.slug ||
          slugify(formData.name || '', { lower: true, strict: true }),
        added_by: userId,
        status: 'pending' as const,
      };

      const { data, error } = await supabase
        .from('places')
        .insert([placeData])
        .select()
        .single();

      if (error) throw error;

      toast.success(
        'Place submitted successfully! It will be reviewed and approved soon.'
      );

      if (onSuccess) {
        onSuccess(data.id);
      } else {
        router.push('/dashboard/places'); // Adjust route as needed
      }
    } catch (error) {
      console.error('Error submitting place:', error);
      toast.error('Failed to submit place. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <CategorySelectionStep
            selectedCategoryId={formData.category_id || ''}
            selectedSubcategoryId={formData.subcategory_id || ''}
            selectedTypeId={formData.type_id || ''}
            selectedOwnershipId={formData.ownership_id || ''}
            onCategoryChange={(categoryId) => {
              updateField('category_id', categoryId);
              updateField('subcategory_id', '');
              updateField('type_id', '');
            }}
            onSubcategoryChange={(subcategoryId) => {
              updateField('subcategory_id', subcategoryId);
              updateField('type_id', '');
            }}
            onTypeChange={(typeId) => updateField('type_id', typeId)}
            onOwnershipChange={(ownershipId) =>
              updateField('ownership_id', ownershipId)
            }
            errors={{
              category_id: errors.category_id,
              subcategory_id: errors.subcategory_id,
            }}
          />
        );

      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <PlaceNameField
                  value={formData.name || ''}
                  onChange={(value) => updateField('name', value)}
                  error={errors.name}
                />

                <PlaceTaglineField
                  value={formData.tagline}
                  onChange={(value) => updateField('tagline', value)}
                />

                <PlaceDescriptionField
                  value={formData.description}
                  onChange={(value) => updateField('description', value)}
                  error={errors.description}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PlaceEmailField
                    value={formData.email}
                    onChange={(value) => updateField('email', value)}
                  />

                  <PlaceWebsiteField
                    value={formData.website}
                    onChange={(value) => updateField('website', value)}
                  />
                </div>

                <PlaceContactsField
                  value={formData.contacts}
                  onChange={(value) => updateField('contacts', value)}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <PlaceCountryField
                  value={formData.country_id || ''}
                  onChange={(value) => {
                    updateField('country_id', value);
                    updateField('region_id', '');
                    updateField('city_id', '');
                    updateField('town_id', '');
                  }}
                  error={errors.country_id}
                />

                <PlaceRegionField
                  value={formData.region_id || ''}
                  onChange={(value) => {
                    updateField('region_id', value);
                    updateField('city_id', '');
                    updateField('town_id', '');
                  }}
                  countryId={formData.country_id || ''}
                  error={errors.region_id}
                />

                <PlaceCityField
                  value={formData.city_id || ''}
                  onChange={(value) => {
                    updateField('city_id', value);
                    updateField('town_id', '');
                  }}
                  regionId={formData.region_id || ''}
                  error={errors.city_id}
                />

                <PlaceTownField
                  value={formData.town_id}
                  onChange={(value) => updateField('town_id', value)}
                  cityId={formData.city_id || ''}
                />

                <PlaceLocationField
                  value={
                    formData.location || {
                      lng: 0,
                      lat: 0,
                      name: '',
                      street_address: '',
                    }
                  }
                  onChange={(value) => updateField('location', value)}
                  error={errors.location}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Operating Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <PlaceOpenHoursField
                  value={formData.open_hours}
                  onChange={(value) => updateField('open_hours', value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features & Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <PlaceFeaturesField
                  value={formData.features}
                  onChange={(value) => updateField('features', value)}
                />

                <PlaceServicesField
                  value={formData.services}
                  onChange={(value) => updateField('services', value)}
                />

                <PlaceAccessibilityField
                  value={formData.accessibility}
                  onChange={(value) => updateField('accessibility', value)}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visual Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <PlaceIconField
                  value={formData.icon}
                  onChange={(value) => updateField('icon', value)}
                />

                <PlaceImageField
                  value={formData.main_image}
                  onChange={(value) => updateField('main_image', value)}
                  label="Main Image"
                />

                <PlaceImageField
                  value={formData.logo}
                  onChange={(value) => updateField('logo', value)}
                  label="Logo"
                />

                <PlaceGalleryField
                  value={formData.gallery}
                  onChange={(value) => updateField('gallery', value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Media & Additional Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <PlaceSocialsField
                  value={formData.socials}
                  onChange={(value) => updateField('socials', value)}
                />

                <PlaceTagsField
                  value={formData.tags}
                  onChange={(value) => updateField('tags', value)}
                />

                <PlaceOtherDetailsField
                  value={formData.other_details}
                  onChange={(value) => updateField('other_details', value)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PlaceSourceField
                    value={formData.source}
                    onChange={(value) => updateField('source', value)}
                  />

                  <PlaceSourceLinkField
                    value={formData.source_link}
                    onChange={(value) => updateField('source_link', value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Add New Place</h1>
        <p className="text-muted-foreground">
          Add a new place to our directory. Fill out all required information to
          submit for review.
        </p>
      </div>

      <StepIndicator steps={steps} currentStep={currentStep} className="mb-8" />

      <div className="mb-8">{renderStepContent()}</div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handlePrevious}
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>

        <div className="flex gap-2">
          {currentStep < steps.length ? (
            <Button onClick={handleNext} disabled={isSubmitting}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Place'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
