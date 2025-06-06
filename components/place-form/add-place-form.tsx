'use client';

import {
  PlaceAccessibilityField,
  PlaceCityField,
  PlaceContactsField,
  PlaceCountryField,
  PlaceDescriptionField,
  PlaceEmailField,
  PlaceFeaturesField,
  PlaceGalleryField,
  PlaceIconField,
  PlaceImageField,
  PlaceLocationField,
  PlaceNameField,
  PlaceOpenHoursField,
  PlaceOtherDetailsField,
  PlaceRegionField,
  PlaceServicesField,
  PlaceSocialsField,
  PlaceSourceField,
  PlaceSourceLinkField,
  PlaceTaglineField,
  PlaceTagsField,
  PlaceTownField,
  PlaceWebsiteField,
} from '@/components/place-form-components';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { featureFlags } from '@/feature-flags';
import { useUser } from '@/hooks/use-user';
import { MatchedLocation } from '@/lib/services/location-matching';
import { createClient } from '@/lib/supabase/client';
import { Place } from '@/types/place';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle,
  Home,
  Plus,
  LayoutDashboard,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import slugify from 'slugify';
import { toast } from 'sonner';
import { CategorySelectionStep } from './category-selection-step';
import { StepIndicator } from './step-indicator';

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
  enableSourceFields?: boolean;
  isAnonymous?: boolean;
}

export function AddPlaceForm({
  onSuccess,
  onCancel,
  enableSourceFields = false,
  isAnonymous = false,
}: AddPlaceFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedPlaceId, setSubmittedPlaceId] = useState<string | null>(null);
  const [matchedLocation, setMatchedLocation] =
    useState<MatchedLocation | null>(null);
  const { user } = useUser();

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

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({ ...prev, added_by: user.id }));
    }
  }, [user]);

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
        added_by: user?.id || 'anonymous',
        status: 'pending' as const,
        town_id: formData.town_id || null,
        ownership_id: formData.ownership_id || null,
        type_id: formData.type_id || null,
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

      // Set success state and store place ID
      setIsSuccess(true);
      setSubmittedPlaceId(placeData.name || '');

      if (onSuccess) {
        onSuccess(data.id);
      }
    } catch (error) {
      console.error('Error submitting place:', error);
      toast.error('Failed to submit place. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationMatch = (matched: MatchedLocation) => {
    setMatchedLocation(matched);
    if (matched.country_id && matched.country_id !== formData.country_id) {
      updateField('country_id', matched.country_id);
      updateField('region_id', ''); // Reset dependent fields
      updateField('city_id', '');
      updateField('town_id', '');
    }
    if (matched.region_id && matched.region_id !== formData.region_id) {
      updateField('region_id', matched.region_id);
      updateField('city_id', ''); // Reset dependent fields
      updateField('town_id', '');
    }
    if (matched.city_id && matched.city_id !== formData.city_id) {
      updateField('city_id', matched.city_id);
      updateField('town_id', ''); // Reset dependent field
    }
    if (matched.town_id) {
      updateField('town_id', matched.town_id);
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

                {!isAnonymous && (
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
                )}

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
                <PlaceLocationField
                  value={formData.location}
                  onChange={(value) => updateField('location', value)}
                  onLocationMatch={handleLocationMatch}
                  error={errors.location}
                  required
                />

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

                <div className="space-y-2">
                  <PlaceRegionField
                    value={formData.region_id || ''}
                    onChange={(value) => {
                      updateField('region_id', value);
                      updateField('city_id', '');
                      updateField('town_id', '');
                    }}
                    countryId={formData.country_id || ''}
                    error={errors.region_id}
                    matchedRegion={{
                      id: matchedLocation?.region_id,
                      name: matchedLocation?.components.region,
                    }}
                    onMatchedRegionSelect={(regionId) => {
                      updateField('region_id', regionId);
                    }}
                  />
                </div>

                <PlaceCityField
                  value={formData.city_id || ''}
                  onChange={(value) => {
                    updateField('city_id', value);
                    updateField('town_id', '');
                  }}
                  regionId={formData.region_id || ''}
                  error={errors.city_id}
                  matchedCity={{
                    id: matchedLocation?.city_id,
                    name: matchedLocation?.components.city,
                  }}
                  onMatchedCitySelect={(cityId) => {
                    updateField('city_id', cityId);
                  }}
                />

                {featureFlags.townSelection && (
                  <PlaceTownField
                    value={formData.town_id}
                    onChange={(value) => updateField('town_id', value)}
                    matchedTown={{
                      id: matchedLocation?.town_id,
                      name: matchedLocation?.components.town,
                    }}
                    onMatchedTownSelect={(townId) => {
                      updateField('town_id', townId);
                    }}
                  />
                )}
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
                {featureFlags.iconSelection && (
                  <PlaceIconField
                    value={formData.icon}
                    onChange={(value) => updateField('icon', value)}
                  />
                )}

                {!isAnonymous && (
                  <PlaceImageField
                    value={formData.logo}
                    onChange={(value) => updateField('logo', value)}
                    label="Logo"
                    variant="logo"
                  />
                )}

                <PlaceImageField
                  value={formData.main_image}
                  onChange={(value) => updateField('main_image', value)}
                  label="Main Image"
                />

                <PlaceGalleryField
                  value={formData.gallery}
                  onChange={(value) => updateField('gallery', value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {isAnonymous
                    ? 'Additional Info'
                    : 'Social Media & Additional Info'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isAnonymous && (
                  <PlaceSocialsField
                    value={formData.socials}
                    onChange={(value) => updateField('socials', value)}
                  />
                )}

                <PlaceTagsField
                  value={formData.tags}
                  onChange={(value) => updateField('tags', value)}
                />

                <PlaceOtherDetailsField
                  value={formData.other_details}
                  onChange={(value) => updateField('other_details', value)}
                />

                {enableSourceFields && (
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
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const handleAddNewPlace = () => {
    // Reset form to initial state
    setIsSuccess(false);
    setSubmittedPlaceId(null);
    setCurrentStep(1);
    setFormData({
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
      added_by: user?.id || 'anonymous',
    });
    setErrors({});
    setMatchedLocation(null);
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoDashboard = () => {
    router.push('/dashboard');
  };

  // Show success screen if submission was successful
  if (isSuccess) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="text-center">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>

              <h1 className="text-2xl font-bold text-green-900 mb-2">
                Place Added Successfully!
              </h1>

              <p className="text-green-700 mb-6">
                Your place has been submitted and is now pending review.
                We&apos;ll notify you once it&apos;s approved and live on the
                platform.
              </p>

              {submittedPlaceId && (
                <div className="bg-white rounded-lg p-4 mb-6 border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Place ID:</p>
                  <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {submittedPlaceId}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleAddNewPlace}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Place
                </Button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={handleGoHome}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>

                  {user && (
                    <Button
                      onClick={handleGoDashboard}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      My Dashboard
                    </Button>
                  )}
                </div>

                {onCancel && (
                  <Button
                    onClick={onCancel}
                    variant="ghost"
                    className="w-full text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Place'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
