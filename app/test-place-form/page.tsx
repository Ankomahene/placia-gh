'use client';

import { AddPlaceForm } from '@/components/place-form';
import { useRouter } from 'next/navigation';

export default function TestPlaceFormPage() {
  const router = useRouter();

  const handleSuccess = (placeId: string) => {
    // Show success message and redirect
    console.log('Place created successfully with ID:', placeId);
    alert(`Place created successfully! ID: ${placeId}`);
    // You can redirect to a place detail page or dashboard
    // router.push(`/places/${placeId}`);
  };

  const handleCancel = () => {
    // Go back to the previous page
    router.back();
  };

  return (
    <div className="min-h-screen bg-background">
      <AddPlaceForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
