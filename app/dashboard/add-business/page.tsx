'use client';

import { AddPlaceForm } from '@/components/place-form/add-place-form';

export default function AddBusinessPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <AddPlaceForm
        title="Add New Business"
        description="Add your business to our directory. Fill out all required information to submit for review."
        isBusinessPlace={true}
        businessOnly={true}
        onSuccess={(placeId) => {
          // Handle success if needed
        }}
        onCancel={() => {
          // Handle cancel if needed
          window.history.back();
        }}
      />
    </div>
  );
}
