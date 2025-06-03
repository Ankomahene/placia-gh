import dynamic from 'next/dynamic';

const PlaceSchemaClient = dynamic(
  () => import('@/components/admin/place-schema/PlaceSchemaClient')
);

export default function PlaceSchemaPage() {
  return <PlaceSchemaClient />;
}
