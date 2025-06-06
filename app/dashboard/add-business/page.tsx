'use client';

import { AddPlaceForm } from '@/components/place-form/add-place-form';

export default function AddBusinessPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <AddPlaceForm
        onSuccess={(placeId) => {
          // Handle success if needed
          console.log('Place added successfully:', placeId);
        }}
        onCancel={() => {
          // Handle cancel if needed
          window.history.back();
        }}
      />
    </div>
  );
}
