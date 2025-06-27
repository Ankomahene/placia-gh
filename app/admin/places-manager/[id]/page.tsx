import { Metadata } from 'next';
import PlaceEditClient from '@/components/admin/places-manager/place-edit-client';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Edit Place | Admin',
  description: 'Edit place details in the admin panel',
};

export default async function EditPlacePage({ params }: PageProps) {
  const { id } = await params;
  return <PlaceEditClient id={id} />;
}
