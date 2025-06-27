'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Place } from '@/types/place';
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
} from '@/components/place-form-components';
import { useCategories } from '@/hooks/admin/use-categories';
import { useSubcategories } from '@/hooks/admin/use-subcategories';
import { useTypes } from '@/hooks/admin/use-types';
import { useOwnerships } from '@/hooks/admin/use-ownerships';

interface PlaceFormViewProps {
  formData: Partial<Place>;
  updateFormData: <K extends keyof Place>(field: K, value: Place[K]) => void;
  errors: Record<string, string>;
}

export function PlaceFormView({
  formData,
  updateFormData,
  errors,
}: PlaceFormViewProps) {
  const [activeTab, setActiveTab] = useState('basic');

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: subcategories, isLoading: subcategoriesLoading } =
    useSubcategories(formData.category_id);
  const { data: types, isLoading: typesLoading } = useTypes(
    formData.subcategory_id
  );
  const { ownerships, isLoading: ownershipsLoading } = useOwnerships();

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
              <CardTitle>Media & Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <PlaceImageField
                value={formData.logo || ''}
                onChange={(value) => updateFormData('logo', value)}
                label="Logo"
                variant="logo"
                error={errors.logo}
              />

              <PlaceImageField
                value={formData.main_image || ''}
                onChange={(value) => updateFormData('main_image', value)}
                label="Main Image"
                error={errors.main_image}
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
