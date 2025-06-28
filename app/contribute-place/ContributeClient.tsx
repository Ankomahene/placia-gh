'use client';
import { AddPlaceForm } from '@/components/place-form';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

export const ContributeClient = () => {
  const router = useRouter();

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="absolute top-4 left-4"
        onClick={() => router.push('/')}
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back
      </Button>

      <AddPlaceForm isAnonymous onCancel={() => router.push('/')} />
    </div>
  );
};
