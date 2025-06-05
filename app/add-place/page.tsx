'use client';

import { AddPlaceForm } from '@/components/place-form';
import { useRouter } from 'next/navigation';

export default function AddPlacePage() {
  const router = useRouter();

  const handleSuccess = (placeId: string) => {
    // Redirect to the place detail page or dashboard
    router.push(`/places/${placeId}`);
  };

  const handleCancel = () => {
    // Go back to the previous page or home
    router.back();
  };

  return <AddPlaceForm onSuccess={handleSuccess} onCancel={handleCancel} />;
}
